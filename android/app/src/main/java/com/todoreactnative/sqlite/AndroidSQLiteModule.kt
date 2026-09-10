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
                "end_date TEXT NOT NULL, " +
                "completed INTEGER NOT NULL DEFAULT 0, " +
                "created_at TEXT NOT NULL, " +
                "image_path TEXT)"
    }

    private var database: SQLiteDatabase? = null

    override fun getName(): String = "AndroidSQLite"

    /**
     * Makes sure the existing todos table contains image_path.
     *
     * Existing databases do not get recreated or deleted.
     * Existing tasks remain unchanged and receive NULL for image_path.
     */
    private fun ensureImagePathColumn(db: SQLiteDatabase) {
        var hasImagePath = false

        db.rawQuery("PRAGMA table_info(todos)", null).use { cursor ->
            val nameIndex = cursor.getColumnIndexOrThrow("name")

            while (cursor.moveToNext()) {
                if (cursor.getString(nameIndex) == "image_path") {
                    hasImagePath = true
                    break
                }
            }
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
        ensureImagePathColumn(db)

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
                "SELECT id, task_name, end_date, completed, created_at, image_path " +
                    "FROM todos ORDER BY id DESC",
                null,
            ).use { cursor ->

                val idIndex = cursor.getColumnIndexOrThrow("id")
                val taskIndex = cursor.getColumnIndexOrThrow("task_name")
                val dateIndex = cursor.getColumnIndexOrThrow("end_date")
                val completedIndex = cursor.getColumnIndexOrThrow("completed")
                val createdIndex = cursor.getColumnIndexOrThrow("created_at")
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
        endDate: String,
        createdAt: String,
        imagePath: String?,
        promise: Promise,
    ) {
        try {
            val db = getDatabase()

            db.execSQL(
                "INSERT INTO todos " +
                    "(task_name, end_date, completed, created_at, image_path) " +
                    "VALUES (?, ?, 0, ?, ?)",
                arrayOf<Any?>(
                    taskName,
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
        endDate: String,
        imagePath: String?,
        promise: Promise,
    ) {
        try {
            val db = getDatabase()

            db.execSQL(
                "UPDATE todos SET task_name = ?, end_date = ?, image_path = ? WHERE id = ?",
                arrayOf<Any?>(
                    taskName,
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

            db.execSQL(
                "UPDATE todos SET completed = ? WHERE id = ?",
                arrayOf<Any?>(
                    completed.toLong(),
                    id.toLong(),
                ),
            )

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