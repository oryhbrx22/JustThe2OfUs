package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.model.*

@Database(
    entities = [
        Note::class,
        Message::class,
        GalleryItem::class,
        Album::class,
        AudioItem::class,
        TimelineItem::class,
        BucketItem::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao
    abstract fun messageDao(): MessageDao
    abstract fun galleryDao(): GalleryDao
    abstract fun audioDao(): AudioDao
    abstract fun timelineDao(): TimelineDao
    abstract fun bucketDao(): BucketDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "forever_hearts_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
