package com.todoreactnative.notifications

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.todoreactnative.sqlite.AndroidSQLiteModule
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DueTaskWorker(
    context: Context,
    workerParams: WorkerParameters,
) : Worker(context, workerParams) {

    companion object {
        private const val TAG = "DueTaskWorker"
        private const val PREFS_NAME = "todo_notifications"
        private const val KEY_LAST_NOTIFIED_DATE = "last_notified_date"
    }

    override fun doWork(): Result {
        return try {
            checkAndNotifyDueTasks()
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error executing DueTaskWorker", e)
            Result.success()
        }
    }

    private fun checkAndNotifyDueTasks() {
        // Calculate today's date in local device calendar/timezone
        val localToday = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val currentTimestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        Log.d(TAG, "Checking due tasks for local date: $localToday")

        val dbFile = applicationContext.getDatabasePath(AndroidSQLiteModule.DATABASE_NAME)
        if (!dbFile.exists()) {
            Log.d(TAG, "Database file does not exist yet. Skipping check.")
            return
        }

        val dueTasks = mutableListOf<Triple<Long, String, String>>()

        try {
            SQLiteDatabase.openDatabase(
                dbFile.absolutePath,
                null,
                SQLiteDatabase.OPEN_READWRITE
            ).use { db ->
                // Ensure notifications table exists
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS notifications (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                        "todo_id INTEGER NOT NULL, " +
                        "task_name TEXT NOT NULL, " +
                        "due_date TEXT NOT NULL, " +
                        "notified_at TEXT NOT NULL, " +
                        "is_read INTEGER NOT NULL DEFAULT 0, " +
                        "is_resolved INTEGER NOT NULL DEFAULT 0, " +
                        "UNIQUE(todo_id, due_date))"
                )

                val query = "SELECT id, task_name, end_date FROM todos WHERE end_date = ? AND completed = 0"
                db.rawQuery(query, arrayOf(localToday)).use { cursor ->
                    val idIndex = cursor.getColumnIndex("id")
                    val taskNameIndex = cursor.getColumnIndex("task_name")
                    val dateIndex = cursor.getColumnIndex("end_date")
                    if (idIndex != -1 && taskNameIndex != -1 && dateIndex != -1) {
                        while (cursor.moveToNext()) {
                            val id = cursor.getLong(idIndex)
                            val name = cursor.getString(taskNameIndex)
                            val endDate = cursor.getString(dateIndex)
                            if (!name.isNullOrBlank()) {
                                dueTasks.add(Triple(id, name, endDate))
                            }
                        }
                    }
                }

                if (dueTasks.isNotEmpty()) {
                    for ((todoId, taskName, dueDate) in dueTasks) {
                        db.execSQL(
                            "INSERT OR IGNORE INTO notifications (todo_id, task_name, due_date, notified_at, is_read, is_resolved) VALUES (?, ?, ?, ?, 0, 0)",
                            arrayOf<Any?>(todoId, taskName, dueDate, currentTimestamp)
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to query/update database for due tasks", e)
            return
        }

        if (dueTasks.isEmpty()) {
            Log.d(TAG, "No pending tasks due today ($localToday).")
            return
        }

        // Duplicate prevention using SharedPreferences
        val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastNotifiedDate = prefs.getString(KEY_LAST_NOTIFIED_DATE, null)

        if (lastNotifiedDate == localToday) {
            Log.d(TAG, "Already notified for today ($localToday). Skipping duplicate notification.")
            return
        }

        // Show deterministic notification for each due task
        for ((todoId, taskName, dueDate) in dueTasks) {
            NotificationHelper.showDueTaskNotification(applicationContext, todoId, taskName, dueDate)
        }

        // Record last notified date
        prefs.edit().putString(KEY_LAST_NOTIFIED_DATE, localToday).apply()
        Log.d(TAG, "Successfully notified for ${dueTasks.size} tasks due on $localToday.")
    }
}
