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

        try {
            SQLiteDatabase.openDatabase(
                dbFile.absolutePath,
                null,
                SQLiteDatabase.OPEN_READWRITE
            ).use { db ->
                // Single source of truth for the notifications schema
                DueTaskNotifier.ensureTable(db)

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
                                // Same deduplication as the startup check: the
                                // notification is only shown when the row is
                                // actually created (or reactivated). At most
                                // once per (todo_id, due_date).
                                DueTaskNotifier.ensureDueTaskNotified(
                                    context = applicationContext,
                                    db = db,
                                    todoId = id,
                                    taskName = name,
                                    dueDate = endDate,
                                    notifiedAt = currentTimestamp,
                                )
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to query/update database for due tasks", e)
        }
    }
}
