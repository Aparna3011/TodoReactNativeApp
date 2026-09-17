package com.todoreactnative.sqlite

import android.database.sqlite.SQLiteDatabase
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap

/**
 * A minimal React Native native module that provides SQLite access through
 * Android's framework SQLite layer (android.database.sqlite.SQLiteDatabase).
 *
 * Because the database is opened through the Android framework SQLite
 * implementation and the connection is kept open for the lifetime of the app,
 * Android Studio's Database Inspector can attach to it and surface live data.
 */
class AndroidSQLiteModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val DATABASE_NAME = "todo.db"
        const val ERROR_CODE = "TODO_DB_ERROR"

        private const val CREATE_TABLE =
            "CREATE TABLE IF NOT EXISTS todos (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "task_name TEXT NOT NULL, " +
                "start_date TEXT NOT NULL, " +
                "end_date TEXT NOT NULL, " +
                "completed INTEGER NOT NULL DEFAULT 0, " +
                "created_at TEXT NOT NULL, " +
                "completed_at TEXT, " +
                "image_path TEXT)"
    }

    private var database: SQLiteDatabase? = null

    override fun getName(): String = "AndroidSQLite"

    /**
     * Makes sure the existing todos table contains start_date, completed_at
     * and image_path.
     *
     * Existing databases do not get recreated or deleted.
     * Existing tasks remain unchanged and receive NULL for image_path and
     * completed_at; start_date is backfilled from the date part of their
     * created_at timestamp.
     */
    private fun ensureColumns(db: SQLiteDatabase) {
        var hasImagePath = false
        var hasCompletedAt = false
        var hasStartDate = false

        db.rawQuery("PRAGMA table_info(todos)", null).use { cursor ->
            val nameIndex = cursor.getColumnIndexOrThrow("name")

            while (cursor.moveToNext()) {
                when (cursor.getString(nameIndex)) {
                    "image_path" -> hasImagePath = true
                    "completed_at" -> hasCompletedAt = true
                    "start_date" -> hasStartDate = true
                }
            }
        }

        if (!hasStartDate) {
            // NOT NULL requires a default when adding the column to a table
            // that already has rows; existing rows are backfilled below.
            db.execSQL(
                "ALTER TABLE todos ADD COLUMN start_date TEXT NOT NULL DEFAULT ''",
            )
            // Backfill existing tasks with the date part of their created_at.
            db.execSQL(
                "UPDATE todos SET start_date = substr(created_at, 1, 10) WHERE start_date = ''",
            )
        }

        if (!hasCompletedAt) {
            db.execSQL("ALTER TABLE todos ADD COLUMN completed_at TEXT")
        }

        if (!hasImagePath) {
            db.execSQL("ALTER TABLE todos ADD COLUMN image_path TEXT")
        }
    }
    /**
     * Opens (or lazily reopens) the Todo database in the app's standard
     * database directory and returns the held connection.
     *
     * The connection is intentionally kept open so Database Inspector
     * can attach to it live.
     */
    @Synchronized
    private fun getDatabase(): SQLiteDatabase {
        database?.let { db ->
            if (db.isOpen) {
                return db
            }
        }

        val context = reactApplicationContext

        // Standard Android location:
        // /data/data/<package>/databases/todo.db
        val path = context.getDatabasePath(DATABASE_NAME).absolutePath

        val db = SQLiteDatabase.openOrCreateDatabase(path, null)

        // Creates the table for a fresh installation.
        // Does nothing if the table already exists.
        db.execSQL(CREATE_TABLE)

        // Migrates an existing database without deleting existing data.
        ensureColumns(db)

        database = db
        return db
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            getDatabase()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    @ReactMethod
    fun getTodos(promise: Promise) {
        try {
            val db = getDatabase()
            val result = Arguments.createArray()

            db.rawQuery(
                "SELECT id, task_name, start_date, end_date, completed, created_at, completed_at, image_path " +
                    "FROM todos ORDER BY id DESC",
                null,
            ).use { cursor ->

                val idIndex = cursor.getColumnIndexOrThrow("id")
                val taskIndex = cursor.getColumnIndexOrThrow("task_name")
                val startDateIndex = cursor.getColumnIndexOrThrow("start_date")
                val dateIndex = cursor.getColumnIndexOrThrow("end_date")
                val completedIndex = cursor.getColumnIndexOrThrow("completed")
                val createdIndex = cursor.getColumnIndexOrThrow("created_at")
                val completedAtIndex = cursor.getColumnIndexOrThrow("completed_at")
                val imagePathIndex = cursor.getColumnIndexOrThrow("image_path")

                while (cursor.moveToNext()) {
                    val row: WritableMap = Arguments.createMap()

                    row.putDouble(
                        "id",
                        cursor.getLong(idIndex).toDouble(),
                    )

                    row.putString(
                        "task_name",
                        cursor.getString(taskIndex),
                    )

                    row.putString(
                        "start_date",
                        cursor.getString(startDateIndex),
                    )

                    row.putString(
                        "end_date",
                        cursor.getString(dateIndex),
                    )

                    row.putDouble(
                        "completed",
                        cursor.getLong(completedIndex).toDouble(),
                    )

                    row.putString(
                        "created_at",
                        cursor.getString(createdIndex),
                    )

                    if (cursor.isNull(completedAtIndex)) {
                        row.putNull("completed_at")
                    } else {
                        row.putString(
                            "completed_at",
                            cursor.getString(completedAtIndex),
                        )
                    }                    

                    if (cursor.isNull(imagePathIndex)) {
                        row.putNull("image_path")
                    } else {
                        row.putString(
                            "image_path",
                            cursor.getString(imagePathIndex),
                        )
                    }

                    result.pushMap(row)
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    @ReactMethod
    fun addTodo(
        taskName: String,
        startDate: String,
        endDate: String,
        createdAt: String,
        imagePath: String?,
        promise: Promise,
    ) {
        try {
            val db = getDatabase()

            // New tasks always start as pending: completed = 0 and
            // completed_at = NULL. Completion is handled separately through
            // setCompleted, which stamps completed_at when it happens.
            db.execSQL(
                "INSERT INTO todos " +
                    "(task_name, start_date, end_date, completed, created_at, completed_at, image_path) " +
                    "VALUES (?, ?, ?, 0, ?, NULL, ?)",
                arrayOf<Any?>(
                    taskName,
                    startDate,
                    endDate,
                    createdAt,
                    imagePath,
                ),
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    @ReactMethod
    fun updateTodo(
        id: Double,
        taskName: String,
        startDate: String,
        endDate: String,
        imagePath: String?,
        promise: Promise,
    ) {
        try {
            val db = getDatabase()

            // completed and completed_at are intentionally untouched: completion
            // is managed by setCompleted, not by editing task details.
            db.execSQL(
                "UPDATE todos SET task_name = ?, start_date = ?, end_date = ?, image_path = ? WHERE id = ?",
                arrayOf<Any?>(
                    taskName,
                    startDate,
                    endDate,
                    imagePath,
                    id.toLong(),
                ),
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    @ReactMethod
    fun setCompleted(
        id: Double,
        completed: Double,
        promise: Promise,
    ) {
        try {
            val db = getDatabase()

            val completedValue = completed.toLong()

            if (completedValue == 1L) {
                // Mark complete: stamp the current time only when the task does
                // not already have a (possibly manually selected) completion
                // date, so a user-chosen completed_at is never overwritten.
                db.execSQL(
                    "UPDATE todos SET completed = 1, " +
                        "completed_at = CASE WHEN completed_at IS NULL " +
                        "THEN ? ELSE completed_at END WHERE id = ?",
                    arrayOf<Any?>(
                        java.time.Instant.now().toString(),
                        id.toLong(),
                    ),
                )
            } else {
                // Mark pending: clear the completion status and date.
                db.execSQL(
                    "UPDATE todos SET completed = 0, completed_at = NULL WHERE id = ?",
                    arrayOf<Any?>(id.toLong()),
                )
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }

    @ReactMethod
    fun deleteTodo(
        id: Double,
        promise: Promise,
    ) {
        try {
            val db = getDatabase()

            db.execSQL(
                "DELETE FROM todos WHERE id = ?",
                arrayOf<Any?>(
                    id.toLong(),
                ),
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(ERROR_CODE, e.message, e)
        }
    }
}