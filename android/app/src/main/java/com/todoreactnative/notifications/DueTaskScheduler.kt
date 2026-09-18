package com.todoreactnative.notifications

import android.content.Context
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.Calendar
import java.util.concurrent.TimeUnit

object DueTaskScheduler {

    private const val TAG = "DueTaskScheduler"
    const val WORK_NAME = "due-today-notify"
    private const val TARGET_HOUR = 9
    private const val TARGET_MINUTE = 0

    /**
     * Schedules daily periodic work to run at approximately 9:00 AM local device time.
     * Uses ExistingPeriodicWorkPolicy.KEEP to prevent re-scheduling if already scheduled.
     */
    fun scheduleDailyDueTaskWorker(context: Context) {
        try {
            val initialDelayMillis = calculateInitialDelayToNextNineAM()
            Log.d(TAG, "Scheduling periodic due task worker with initial delay: ${initialDelayMillis / 1000 / 60} minutes")

            val periodicWorkRequest = PeriodicWorkRequestBuilder<DueTaskWorker>(1, TimeUnit.DAYS)
                .setInitialDelay(initialDelayMillis, TimeUnit.MILLISECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWorkRequest
            )
            Log.d(TAG, "Daily due task worker scheduled successfully with policy KEEP.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule daily due task worker", e)
        }
    }

    /**
     * Calculates the time difference in milliseconds between the current time
     * and the upcoming 9:00 AM in the device's local timezone.
     */
    fun calculateInitialDelayToNextNineAM(): Long {
        val now = Calendar.getInstance()
        val target = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, TARGET_HOUR)
            set(Calendar.MINUTE, TARGET_MINUTE)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        if (now.after(target)) {
            // Target 9:00 AM for today has passed, schedule for 9:00 AM tomorrow
            target.add(Calendar.DAY_OF_YEAR, 1)
        }

        return target.timeInMillis - now.timeInMillis
    }
}
