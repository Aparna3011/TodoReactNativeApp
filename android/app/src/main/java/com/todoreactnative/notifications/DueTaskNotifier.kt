package com.todoreactnative.notifications

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase

/**
 * Shared persistence and deduplication for due-task notifications.
 *
 * Both notification entry points use this class so the schema and the
 * deduplication rule have exactly one source of truth:
 *   - AndroidSQLiteModule.checkAndTriggerStartupDueNotifications (app start)
 *   - DueTaskWorker.doWork (daily 9 AM scheduled job)
 *
 * Deduplication is row-based, not global: a notifications row is created at
 * most once per (todo_id, due_date) thanks to the UNIQUE constraint, and the
 * Android notification is only shown for rows that were ACTUALLY created.
 * Tasks added later in the day still receive their own notification.
 */
object DueTaskNotifier {

    const val NOTIFICATIONS_TABLE = "notifications"

    const val CREATE_NOTIFICATIONS_TABLE =
        "CREATE TABLE IF NOT EXISTS notifications (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "todo_id INTEGER NOT NULL, " +
            "task_name TEXT NOT NULL, " +
            "due_date TEXT NOT NULL, " +
            "notified_at TEXT NOT NULL, " +
            "is_read INTEGER NOT NULL DEFAULT 0, " +
            "is_resolved INTEGER NOT NULL DEFAULT 0, " +
            "UNIQUE(todo_id, due_date))"

    /** What ensureDueTaskNotified did. */
    enum class Outcome {
        /** A brand-new notifications row was inserted and a notification shown. */
        INSERTED,

        /**
         * An existing row was marked pending again (is_resolved reset to 0)
         * and the notification shown.
         */
        REACTIVATED,

        /** Nothing: the row already exists and is not resolved. */
        SKIPPED,
    }

    /** Creates the notifications table when it does not exist yet. */
    fun ensureTable(db: SQLiteDatabase) {
        db.execSQL(CREATE_NOTIFICATIONS_TABLE)
    }

    /**
     * Ensures a due task has an active notification for its due date.
     *
     * Rows are looked up by (todo_id, due_date) and inserted with
     * CONFLICT_IGNORE, so concurrent checks cannot create duplicates. The
     * Android notification is shown and INSERTED reported only when the row
     * was really created.
     */
    fun ensureDueTaskNotified(
        context: Context,
        db: SQLiteDatabase,
        todoId: Long,
        taskName: String,
        dueDate: String,
        notifiedAt: String,
    ): Outcome {
        var existingRowId: Long? = null
        var isResolved = 0

        db.rawQuery(
            "SELECT id, is_resolved FROM $NOTIFICATIONS_TABLE " +
                "WHERE todo_id = ? AND due_date = ?",
            arrayOf(todoId.toString(), dueDate),
        ).use { cursor ->
            if (cursor.moveToFirst()) {
                existingRowId = cursor.getLong(0)
                isResolved = cursor.getInt(1)
            }
        }

        if (existingRowId == null) {
            val values = ContentValues().apply {
                put("todo_id", todoId)
                put("task_name", taskName)
                put("due_date", dueDate)
                put("notified_at", notifiedAt)
                put("is_read", 0)
                put("is_resolved", 0)
            }

            val insertedRowId = db.insertWithOnConflict(
                NOTIFICATIONS_TABLE,
                null,
                values,
                SQLiteDatabase.CONFLICT_IGNORE,
            )

            if (insertedRowId != -1L) {
                NotificationHelper.showDueTaskNotification(context, todoId, taskName, dueDate)
                return Outcome.INSERTED
            }
            // A concurrent insert took the slot between the check and the insert.
            return Outcome.SKIPPED
        }

        if (isResolved == 1) {
            db.execSQL(
                "UPDATE $NOTIFICATIONS_TABLE SET is_resolved = 0 WHERE id = ?",
                arrayOf<Any?>(existingRowId),
            )
            NotificationHelper.showDueTaskNotification(context, todoId, taskName, dueDate)
            return Outcome.REACTIVATED
        }

        return Outcome.SKIPPED
    }
}