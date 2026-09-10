package com.todoreactnative.camera

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Environment
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
        private const val FILE_PROVIDER_AUTHORITY =
            "com.todoreactnative.fileprovider"
        // Folder name visible to the user in phone storage
        private const val APP_FOLDER_NAME = "TodoReactNative"
    }

    private var cameraPromise: Promise? = null
    private var currentImageFile: File? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "AndroidCamera"

    /**
     * Resolves the directory where task images are stored.
     * Primary:  external public storage → Pictures/TodoReactNative/
     *           (visible to the user in their phone's Files / Gallery app)
     * Fallback: app-private internal storage → files/task_images/
     *           (used when external storage is not available)
     */
    private fun resolveImageDirectory(): File {
        val externalPictures = Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_PICTURES
        )

        if (externalPictures != null &&
            (Environment.getExternalStorageState() == Environment.MEDIA_MOUNTED ||
             Environment.getExternalStorageState() == Environment.MEDIA_MOUNTED_READ_ONLY)
        ) {
            val appDir = File(externalPictures, APP_FOLDER_NAME)
            if (!appDir.exists()) {
                appDir.mkdirs()
            }
            if (appDir.exists()) {
                return appDir
            }
        }

        // Fallback: private internal storage
        val internalDir = File(reactApplicationContext.filesDir, "task_images")
        if (!internalDir.exists()) {
            internalDir.mkdirs()
        }
        return internalDir
    }

    @ReactMethod
    fun captureImage(promise: Promise) {
        val activity = reactApplicationContext.currentActivity

        if (activity == null) {
            promise.reject(
                ERROR_CODE,
                "Unable to access the current Android activity."
            )
            return
        }

        if (cameraPromise != null) {
            promise.reject(
                ERROR_CODE,
                "A camera capture is already in progress."
            )
            return
        }

        try {
            val imageDirectory = resolveImageDirectory()

            val timestamp = SimpleDateFormat(
                "yyyyMMdd_HHmmss_SSS",
                Locale.US
            ).format(Date())

            val imageFile = File(
                imageDirectory,
                "task_$timestamp.jpg"
            )

            // Physically create the output file before passing to the camera.
            // Some camera apps require the file to already exist with EXTRA_OUTPUT.
            if (!imageFile.exists()) {
                imageFile.createNewFile()
            }

            val imageUri: Uri = FileProvider.getUriForFile(
                reactApplicationContext,
                FILE_PROVIDER_AUTHORITY,
                imageFile
            )

            val intent = Intent(
                android.provider.MediaStore.ACTION_IMAGE_CAPTURE
            )

            intent.putExtra(
                android.provider.MediaStore.EXTRA_OUTPUT,
                imageUri
            )

            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

            // Explicitly grant URI permission to every camera app that could handle the intent
            val resInfoList = activity.packageManager.queryIntentActivities(
                intent,
                android.content.pm.PackageManager.MATCH_DEFAULT_ONLY
            )
            for (resolveInfo in resInfoList) {
                val packageName = resolveInfo.activityInfo.packageName
                activity.grantUriPermission(
                    packageName,
                    imageUri,
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }

            cameraPromise = promise
            currentImageFile = imageFile

            activity.startActivityForResult(
                intent,
                CAMERA_REQUEST_CODE
            )
        } catch (e: Exception) {
            cameraPromise = null
            currentImageFile = null

            promise.reject(
                ERROR_CODE,
                e.message,
                e
            )
        }
    }

    @ReactMethod
    fun deleteImageFile(path: String?, promise: Promise) {
        if (path.isNullOrEmpty()) {
            promise.resolve(false)
            return
        }

        try {
            val file = File(path)
            if (file.exists()) {
                val deleted = file.delete()
                promise.resolve(deleted)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode != CAMERA_REQUEST_CODE) {
            return
        }

        val promise = cameraPromise
        val imageFile = currentImageFile

        cameraPromise = null
        currentImageFile = null

        if (promise == null || imageFile == null) {
            return
        }

        if (resultCode != Activity.RESULT_OK || !imageFile.exists() || imageFile.length() <= 0L) {
            // Delete the empty placeholder file created before camera launch
            if (imageFile.exists()) {
                imageFile.delete()
            }

            promise.reject(
                ERROR_CODE,
                if (resultCode == Activity.RESULT_CANCELED)
                    "Camera capture was cancelled."
                else
                    "Camera capture failed or produced no image."
            )
            return
        }

        // Return the absolute path — stored as-is in SQLite (no file:// prefix)
        promise.resolve(imageFile.absolutePath)
    }

    override fun onNewIntent(intent: Intent) {
        // Not used.
    }
}
