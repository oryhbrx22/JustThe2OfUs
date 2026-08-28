package com.example.data.local

import androidx.room.*
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY createdAt DESC")
    fun getAllNotes(): Flow<List<Note>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: Note): Long

    @Query("DELETE FROM notes WHERE id = :id")
    suspend fun deleteNote(id: Int)
}

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages ORDER BY createdAt ASC")
    fun getAllMessages(): Flow<List<Message>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: Message): Long

    @Query("UPDATE messages SET reaction = :reaction WHERE id = :id")
    suspend fun updateReaction(id: Int, reaction: String?)

    @Query("UPDATE messages SET seenAt = :seenAt WHERE seenAt IS NULL")
    suspend fun markAllSeen(seenAt: Long)
}

@Dao
interface GalleryDao {
    @Query("SELECT * FROM gallery_items ORDER BY createdAt DESC")
    fun getAllItems(): Flow<List<GalleryItem>>

    @Query("SELECT * FROM gallery_albums ORDER BY createdAt DESC")
    fun getAllAlbums(): Flow<List<Album>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: GalleryItem): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlbum(album: Album)

    @Query("UPDATE gallery_items SET isFavorite = :isFav WHERE id = :id")
    suspend fun toggleFavorite(id: Int, isFav: Boolean)

    @Query("UPDATE gallery_items SET caption = :caption WHERE id = :id")
    suspend fun updateCaption(id: Int, caption: String)

    @Query("UPDATE gallery_items SET albumId = :albumId WHERE id = :id")
    suspend fun moveItemToAlbum(id: Int, albumId: String?)

    @Query("DELETE FROM gallery_items WHERE id = :id")
    suspend fun deleteItem(id: Int)

    @Query("DELETE FROM gallery_albums WHERE id = :id")
    suspend fun deleteAlbum(id: String)
}

@Dao
interface AudioDao {
    @Query("SELECT * FROM audio_items ORDER BY createdAt DESC")
    fun getAllAudios(): Flow<List<AudioItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAudio(audio: AudioItem): Long

    @Query("UPDATE audio_items SET isFavorite = :isFav WHERE id = :id")
    suspend fun toggleFavorite(id: Int, isFav: Boolean)

    @Query("UPDATE audio_items SET title = :title WHERE id = :id")
    suspend fun renameAudio(id: Int, title: String)

    @Query("DELETE FROM audio_items WHERE id = :id")
    suspend fun deleteAudio(id: Int)
}

@Dao
interface TimelineDao {
    @Query("SELECT * FROM timeline_items ORDER BY createdAt DESC")
    fun getAllTimelineItems(): Flow<List<TimelineItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTimelineItem(item: TimelineItem): Long

    @Query("DELETE FROM timeline_items WHERE id = :id")
    suspend fun deleteTimelineItem(id: Int)
}

@Dao
interface BucketDao {
    @Query("SELECT * FROM bucket_items ORDER BY createdAt ASC")
    fun getAllBucketItems(): Flow<List<BucketItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBucketItem(item: BucketItem): Long

    @Query("UPDATE bucket_items SET completed = :completed WHERE id = :id")
    suspend fun updateCompleted(id: Int, completed: Boolean)

    @Query("DELETE FROM bucket_items WHERE id = :id")
    suspend fun deleteBucketItem(id: Int)
}
