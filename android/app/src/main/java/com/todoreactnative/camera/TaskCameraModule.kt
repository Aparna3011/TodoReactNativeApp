package com.todoreactnative.camera

import android.app.Activity
import android.content.Intent
import android.net.Uri
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
    }

    private var cameraPromise: Promise? = null
    private var currentImageFile: File? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "AndroidCamera"

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
            val imageDirectory = File(
                reactApplicationContext.filesDir,
                "task_images"
            )

            if (!imageDirectory.exists()) {
                imageDirectory.mkdirs()
            }

            val timestamp = SimpleDateFormat(
                "yyyyMMdd_HHmmss_SSS",
                Locale.US
            ).format(Date())

            val imageFile = File(
                imageDirectory,
                "task_$timestamp.jpg"
            )

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

        if (resultCode == Activity.RESULT_CANCELED) {
            imageFile.delete()

            promise.reject(
                ERROR_CODE,
                "Camera capture was cancelled."
            )
            return
        }

        if (resultCode != Activity.RESULT_OK) {
            imageFile.delete()

            promise.reject(
                ERROR_CODE,
                "Camera capture failed."
            )
            return
        }

        if (!imageFile.exists() || imageFile.length() <= 0L) {
            imageFile.delete()

            promise.reject(
                ERROR_CODE,
                "Camera did not create a valid image file."
            )
            return
        }

        promise.resolve(imageFile.absolutePath)
    }

    override fun onNewIntent(intent: Intent) {
        // Not used.
    }
}