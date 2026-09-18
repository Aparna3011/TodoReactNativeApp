package com.todoreactnative.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.todoreactnative.MainActivity
import com.todoreactnative.R

object NotificationHelper {

    private const val TAG = "NotificationHelper"
    const val CHANNEL_ID = "due_tasks"
    private const val CHANNEL_NAME = "Due Tasks"
    private const val CHANNEL_DESCRIPTION = "Notifications for tasks due today"
    const val DEFAULT_NOTIFICATION_ID = 1001

    /**
     * Deterministic notification ID derived from the Todo ID.
     * This allows cancelling the exact notification for a specific Todo when it is completed.
     */
    fun getNotificationId(todoId: Long): Int {
        return (10000 + (todoId % 1000000)).toInt()
    }

    /**
     * Creates the notification channel on Android 8.0+ (API 26+).
     * Safe to call multiple times as Android handles duplicate channel creation idempotently.
     */
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val importance = NotificationManager.IMPORTANCE_DEFAULT
                val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                    description = CHANNEL_DESCRIPTION
                }

                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                notificationManager?.createNotificationChannel(channel)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create notification channel", e)
            }
        }
    }

    /**
     * Shows a notification for a specific due task using a deterministic notification ID.
     */
    fun showDueTaskNotification(context: Context, todoId: Long, taskName: String, dueDate: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permissionStatus = ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.POST_NOTIFICATIONS
            )
            if (permissionStatus != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "POST_NOTIFICATIONS permission not granted. Skipping notification.")
                return
            }
        }

        try {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_MAIN
                addCategory(Intent.CATEGORY_LAUNCHER)
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                getNotificationId(todoId),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val title = "Task Due Today"
            val contentText = "$taskName (Due: $dueDate)"

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(contentText)
                .setStyle(NotificationCompat.BigTextStyle().bigText("Task Due Today\n$taskName\nDue: $dueDate"))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            val notificationId = getNotificationId(todoId)
            NotificationManagerCompat.from(context).notify(notificationId, notification)
            Log.d(TAG, "Posted notification for todoId: $todoId with notificationId: $notificationId")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while attempting to show notification", e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error showing due task notification", e)
        }
    }

    /**
     * Cancels the active Android notification for a specific Todo.
     */
    fun cancelDueTaskNotification(context: Context, todoId: Long) {
        try {
            val notificationId = getNotificationId(todoId)
            NotificationManagerCompat.from(context).cancel(notificationId)
            Log.d(TAG, "Cancelled notification for todoId: $todoId with notificationId: $notificationId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel notification for todoId: $todoId", e)
        }
    }

    /**
     * Shows a single aggregated notification for tasks due today.
     */
    fun showDueTasksNotification(context: Context, taskNames: List<String>) {
        if (taskNames.isEmpty()) {
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permissionStatus = ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.POST_NOTIFICATIONS
            )
            if (permissionStatus != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "POST_NOTIFICATIONS permission not granted. Skipping notification.")
                return
            }
        }

        try {
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_MAIN
                addCategory(Intent.CATEGORY_LAUNCHER)
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val title = "Tasks Due Today"
            val count = taskNames.size
            val contentText = if (count == 1) {
                "1 task is due today"
            } else {
                "$count tasks are due today"
            }

            val bigTextBuilder = StringBuilder(contentText)
            if (count == 1) {
                bigTextBuilder.append("\n").append(taskNames[0])
            } else {
                for (name in taskNames) {
                    bigTextBuilder.append("\n• ").append(name)
                }
            }

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(contentText)
                .setStyle(NotificationCompat.BigTextStyle().bigText(bigTextBuilder.toString()))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            NotificationManagerCompat.from(context).notify(DEFAULT_NOTIFICATION_ID, notification)
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while attempting to show notification", e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error showing due tasks notification", e)
        }
    }
}
