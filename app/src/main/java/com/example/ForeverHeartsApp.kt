package com.example

import android.app.Application
import com.example.data.local.AppDatabase
import com.example.data.repository.CoupleRepository

class ForeverHeartsApp : Application() {
    val database: AppDatabase by lazy { AppDatabase.getDatabase(this) }
    val repository: CoupleRepository by lazy { CoupleRepository(database, this) }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: ForeverHeartsApp
            private set
    }
}
