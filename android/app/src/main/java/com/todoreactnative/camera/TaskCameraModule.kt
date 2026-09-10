package com.todoreactnative.camera

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TaskCameraModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    companion object {
        private const val CAMERA_REQUEST_CODE = 1001
        private const val ERROR_CODE = "ANDROID_CAMERA_ERROR"
        private const val FILE_PROVIDER_AUTHORITY = "com.todoreactnative.fileprovider"
        private const val APP_FOLDER_NAME = "TodoReactNative"
    }

    // ── State between captureImage() and onActivityResult() ───────────────────

    private var cameraPromise: Promise? = null

    /**
     * The temporary file the camera writes to via FileProvider.
     * Always set before launching the camera, regardless of API level.
     */
    private var currentTempFile: File? = null

    // ─────────────────────────────────────────────────────────────────────────

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "AndroidCamera"

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Returns the directory used for the temporary file the camera writes to.
     *
     * We always use the app-private internal files directory (filesDir/task_images/)
     * because:
     *  • It requires no storage permission on any Android version.
     *  • It is already declared in file_paths.xml as
     *      <files-path name="task_images" path="task_images/" />
     *    so FileProvider can serve it as a content:// URI to the camera app.
     *  • Camera apps reliably write to FileProvider content:// URIs.
     */
    private fun tempImageDirectory(): File {
        val dir = File(reactApplicationContext.filesDir, "task_images")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    /**
     * API 29+: copies the captured file into the user-visible
     *   Pictures/TodoReactNative/
     * using MediaStore (no WRITE_EXTERNAL_STORAGE permission required).
     *
     * Returns the public content:// URI on success, null on failure.
     */
    private fun copyToMediaStore(source: File): Uri? {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, source.name)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(
                MediaStore.Images.Media.RELATIVE_PATH,
                "${Environment.DIRECTORY_PICTURES}/$APP_FOLDER_NAME"
            )
        }

        val publicUri = reactApplicationContext.contentResolver.insert(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            values
        ) ?: return null

        return try {
            reactApplicationContext.contentResolver
                .openOutputStream(publicUri)
                ?.use { out -> source.inputStream().use { it.copyTo(out) } }
            publicUri
        } catch (e: Exception) {
            // Clean up the empty MediaStore entry on failure
            try {
                reactApplicationContext.contentResolver.delete(publicUri, null, null)
            } catch (ignored: Exception) { /* best-effort */ }
            null
        }
    }

    /**
     * API < 29: moves (or copies) the captured temp file into the user-visible
     *   Pictures/TodoReactNative/
     * using direct file access, which is permitted on Android 7–9.
     *
     * Returns the destination File, or null on failure.
     */
    private fun moveToPublicPictures(source: File): File? {
        val externalPictures = Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_PICTURES
        ) ?: return null

        if (Environment.getExternalStorageState() != Environment.MEDIA_MOUNTED) return null

        val destDir = File(externalPictures, APP_FOLDER_NAME)
        if (!destDir.exists()) destDir.mkdirs()
        if (!destDir.exists()) return null

        val dest = File(destDir, source.name)

        // Try rename first (instant, same partition unlikely but try)
        if (source.renameTo(dest)) return dest

        // Fall back to copy + delete
        return try {
            source.copyTo(dest, overwrite = true)
            source.delete()
            dest
        } catch (e: Exception) {
            null
        }
    }

    // ── @ReactMethod: captureImage ────────────────────────────────────────────

    @ReactMethod
    fun captureImage(promise: Promise) {
        val activity = reactApplicationContext.currentActivity

        if (activity == null) {
            promise.reject(ERROR_CODE, "Unable to access the current Android activity.")
            return
        }

        if (cameraPromise != null) {
            promise.reject(ERROR_CODE, "A camera capture is already in progress.")
            return
        }

        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss_SSS", Locale.US).format(Date())
            val fileName = "task_$timestamp.jpg"

            // Create the temp file in app-private storage that FileProvider covers
            val tempFile = File(tempImageDirectory(), fileName)
            if (!tempFile.exists()) tempFile.createNewFile()

            // Get a FileProvider content:// URI — this is what camera apps
            // reliably accept as EXTRA_OUTPUT on all Android versions.
            val imageUri: Uri = FileProvider.getUriForFile(
                reactApplicationContext,
                FILE_PROVIDER_AUTHORITY,
                tempFile
            )

            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            intent.putExtra(MediaStore.EXTRA_OUTPUT, imageUri)
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

            // Explicitly grant URI write permission to every app that could
            // handle the camera intent (required for FileProvider URIs).
            val resInfoList = activity.packageManager.queryIntentActivities(
                intent,
                android.content.pm.PackageManager.MATCH_DEFAULT_ONLY
            )
            for (resolveInfo in resInfoList) {
                activity.grantUriPermission(
                    resolveInfo.activityInfo.packageName,
                    imageUri,
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
                            Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }

            cameraPromise = promise
            currentTempFile = tempFile

            activity.startActivityForResult(intent, CAMERA_REQUEST_CODE)

        } catch (e: Exception) {
            currentTempFile?.let { if (it.exists()) it.delete() }
            currentTempFile = null
            cameraPromise = null
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    // ── @ReactMethod: deleteImageFile ─────────────────────────────────────────

    @ReactMethod
    fun deleteImageFile(path: String?, promise: Promise) {
        if (path.isNullOrEmpty()) {
            promise.resolve(false)
            return
        }

        try {
            // API 29+: path is stored as a content:// URI string
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
                path.startsWith("content://")
            ) {
                val uri = Uri.parse(path)
                val rows = reactApplicationContext.contentResolver.delete(uri, null, null)
                promise.resolve(rows > 0)
                return
            }

            // All other cases: delete as a File (absolute path)
            val file = File(path)
            if (file.exists()) promise.resolve(file.delete())
            else promise.resolve(false)

        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    // ── ActivityEventListener ─────────────────────────────────────────────────

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode != CAMERA_REQUEST_CODE) return

        val promise  = cameraPromise  ?: return
        val tempFile = currentTempFile

        // Clear state immediately
        cameraPromise   = null
        currentTempFile = null

        if (tempFile == null) {
            promise.reject(ERROR_CODE, "Camera capture failed: no temp file reference.")
            return
        }

        // Cancel or capture failed
        if (resultCode != Activity.RESULT_OK || !tempFile.exists() || tempFile.length() <= 0L) {
            if (tempFile.exists()) tempFile.delete()
            promise.reject(
                ERROR_CODE,
                if (resultCode == Activity.RESULT_CANCELED)
                    "Camera capture was cancelled."
                else
                    "Camera capture failed or produced no image."
            )
            return
        }

        // ── Android 10+ ───────────────────────────────────────────────────────
        // The camera has written the image to tempFile (filesDir/task_images/).
        // Now copy it into the user-visible Pictures/TodoReactNative/ via
        // MediaStore, then delete the temp file.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val publicUri = copyToMediaStore(tempFile)
            if (publicUri != null) {
                tempFile.delete() // safe to delete only after successful copy
                // Return content:// URI — React Native Image handles this directly
                promise.resolve(publicUri.toString())
            } else {
                // MediaStore copy failed (rare). Keep the temp file and return
                // its absolute path so the image still displays in the app.
                promise.resolve(tempFile.absolutePath)
            }
            return
        }

        // ── Android 7 – 9 ─────────────────────────────────────────────────────
        // Move the temp file to the public Pictures/TodoReactNative/ directory.
        val publicFile = moveToPublicPictures(tempFile)
        if (publicFile != null) {
            // Return absolute path — stored as-is in SQLite (no file:// prefix)
            promise.resolve(publicFile.absolutePath)
        } else {
            // Move failed (external storage unavailable). Keep temp file.
            promise.resolve(tempFile.absolutePath)
        }
    }

    override fun onNewIntent(intent: Intent) {
        // Not used.
    }
}