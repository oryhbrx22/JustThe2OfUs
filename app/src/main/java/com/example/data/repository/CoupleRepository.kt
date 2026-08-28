package com.example.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.data.local.AppDatabase
import com.example.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class CoupleRepository(
    private val db: AppDatabase,
    context: Context
) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("couple_prefs", Context.MODE_PRIVATE)

    private val _profile = MutableStateFlow(loadProfile())
    val profile: StateFlow<CoupleProfile> = _profile.asStateFlow()

    val notes: Flow<List<Note>> = db.noteDao().getAllNotes()
    val messages: Flow<List<Message>> = db.messageDao().getAllMessages()
    val galleryItems: Flow<List<GalleryItem>> = db.galleryDao().getAllItems()
    val albums: Flow<List<Album>> = db.galleryDao().getAllAlbums()
    val audioItems: Flow<List<AudioItem>> = db.audioDao().getAllAudios()
    val timelineItems: Flow<List<TimelineItem>> = db.timelineDao().getAllTimelineItems()
    val bucketItems: Flow<List<BucketItem>> = db.bucketDao().getAllBucketItems()

    init {
        CoroutineScope(Dispatchers.IO).launch {
            seedInitialDataIfEmpty()
        }
    }

    private fun loadProfile(): CoupleProfile {
        return CoupleProfile(
            myName = prefs.getString("myName", "Alex") ?: "Alex",
            myNickname = prefs.getString("myNickname", "Sweetheart") ?: "Sweetheart",
            partnerName = prefs.getString("partnerName", "Taylor") ?: "Taylor",
            partnerNickname = prefs.getString("partnerNickname", "My Love") ?: "My Love",
            myMood = prefs.getString("myMood", "🥰 in love") ?: "🥰 in love",
            partnerMood = prefs.getString("partnerMood", "✨ dreamy") ?: "✨ dreamy",
            startedAt = prefs.getString("startedAt", "2024-02-14") ?: "2024-02-14",
            inviteCode = prefs.getString("inviteCode", "FOREVR") ?: "FOREVR",
            isConnected = prefs.getBoolean("isConnected", true),
            bgUrl = prefs.getString("bgUrl", null),
            bgBlur = prefs.getInt("bgBlur", 0),
            bgDim = prefs.getInt("bgDim", 20),
            bgTextTheme = prefs.getString("bgTextTheme", "auto") ?: "auto"
        )
    }

    fun updateProfile(profile: CoupleProfile) {
        prefs.edit().apply {
            putString("myName", profile.myName)
            putString("myNickname", profile.myNickname)
            putString("partnerName", profile.partnerName)
            putString("partnerNickname", profile.partnerNickname)
            putString("myMood", profile.myMood)
            putString("partnerMood", profile.partnerMood)
            putString("startedAt", profile.startedAt)
            putString("inviteCode", profile.inviteCode)
            putBoolean("isConnected", profile.isConnected)
            putString("bgUrl", profile.bgUrl)
            putInt("bgBlur", profile.bgBlur)
            putInt("bgDim", profile.bgDim)
            putString("bgTextTheme", profile.bgTextTheme)
            apply()
        }
        _profile.value = profile
    }

    suspend fun saveNote(title: String?, content: String, mood: String, isPrivate: Boolean, isHandwritten: Boolean) {
        val note = Note(
            author = "me",
            title = title?.ifBlank { null },
            content = content,
            mood = mood,
            isPrivate = isPrivate,
            isHandwritten = isHandwritten,
            createdAt = System.currentTimeMillis()
        )
        db.noteDao().insertNote(note)
        
        // Add to timeline
        val dateStr = SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date())
        db.timelineDao().insertTimelineItem(
            TimelineItem(
                dateStr = dateStr,
                type = "note",
                title = title ?: "A tender note",
                body = content.take(100)
            )
        )
    }

    suspend fun deleteNote(id: Int) = db.noteDao().deleteNote(id)

    suspend fun sendMessage(content: String, sender: String = "me", kind: String = "text", mediaUrl: String? = null) {
        val msg = Message(
            sender = sender,
            content = content.ifBlank { null },
            kind = kind,
            mediaUrl = mediaUrl,
            createdAt = System.currentTimeMillis()
        )
        db.messageDao().insertMessage(msg)
    }

    suspend fun reactToMessage(id: Int, reaction: String) {
        db.messageDao().updateReaction(id, reaction)
    }

    suspend fun markMessagesSeen() {
        db.messageDao().markAllSeen(System.currentTimeMillis())
    }

    suspend fun addGalleryPhoto(url: String, caption: String? = null, albumId: String? = null) {
        val item = GalleryItem(
            url = url,
            caption = caption,
            albumId = albumId,
            createdAt = System.currentTimeMillis()
        )
        db.galleryDao().insertItem(item)

        // Add to timeline
        val dateStr = SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date())
        db.timelineDao().insertTimelineItem(
            TimelineItem(
                dateStr = dateStr,
                type = "photo",
                title = caption ?: "A new memory together",
                mediaUrl = url
            )
        )
    }

    suspend fun toggleFavoritePhoto(id: Int, currentFav: Boolean) {
        db.galleryDao().toggleFavorite(id, !currentFav)
    }

    suspend fun updatePhotoCaption(id: Int, caption: String) {
        db.galleryDao().updateCaption(id, caption)
    }

    suspend fun movePhotoToAlbum(id: Int, albumId: String?) {
        db.galleryDao().moveItemToAlbum(id, albumId)
    }

    suspend fun deletePhoto(id: Int) = db.galleryDao().deleteItem(id)

    suspend fun createAlbum(name: String, albumDate: String? = null) {
        val album = Album(
            id = "album_" + System.currentTimeMillis(),
            name = name,
            albumDate = albumDate,
            createdAt = System.currentTimeMillis()
        )
        db.galleryDao().insertAlbum(album)
    }

    suspend fun deleteAlbum(id: String) = db.galleryDao().deleteAlbum(id)

    suspend fun addAudioItem(title: String, durationSec: Int = 12, url: String = "") {
        val item = AudioItem(
            title = title,
            durationSec = durationSec,
            url = url,
            createdAt = System.currentTimeMillis()
        )
        db.audioDao().insertAudio(item)

        val dateStr = SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date())
        db.timelineDao().insertTimelineItem(
            TimelineItem(
                dateStr = dateStr,
                type = "audio",
                title = title
            )
        )
    }

    suspend fun toggleFavoriteAudio(id: Int, currentFav: Boolean) {
        db.audioDao().toggleFavorite(id, !currentFav)
    }

    suspend fun renameAudio(id: Int, title: String) {
        db.audioDao().renameAudio(id, title)
    }

    suspend fun deleteAudio(id: Int) = db.audioDao().deleteAudio(id)

    suspend fun addBucketItem(title: String) {
        db.bucketDao().insertBucketItem(BucketItem(title = title, createdAt = System.currentTimeMillis()))
    }

    suspend fun toggleBucketItem(id: Int, current: Boolean) {
        db.bucketDao().updateCompleted(id, !current)
    }

    suspend fun deleteBucketItem(id: Int) = db.bucketDao().deleteBucketItem(id)

    private suspend fun seedInitialDataIfEmpty() {
        // Seed initial gallery photo
        db.galleryDao().insertAlbum(
            Album(id = "favorites", name = "Special Moments", albumDate = "2024-02-14")
        )
        db.galleryDao().insertAlbum(
            Album(id = "travel", name = "Weekend Getaway", albumDate = "2024-06-20")
        )

        // Seed initial love notes
        db.noteDao().insertNote(
            Note(
                author = "partner",
                title = "Just thinking of you",
                content = "I woke up with a big smile this morning because of you. Thank you for making everyday feel so magical and peaceful. Can't wait for dinner tonight! ❤️",
                mood = "🥰",
                isHandwritten = true,
                createdAt = System.currentTimeMillis() - 86400000L * 2
            )
        )
        db.noteDao().insertNote(
            Note(
                author = "me",
                title = "3 Things I Love About You",
                content = "1. The way your eyes light up when you laugh.\n2. How safe I feel holding your hand.\n3. Your infinite kindness to everyone around you.",
                mood = "✨",
                isHandwritten = false,
                createdAt = System.currentTimeMillis() - 86400000L * 5
            )
        )

        // Seed initial chat messages
        db.messageDao().insertMessage(
            Message(
                sender = "partner",
                content = "Good morning, my love ☀️ Hope you slept peacefully!",
                createdAt = System.currentTimeMillis() - 3600000L * 4,
                reaction = "❤️"
            )
        )
        db.messageDao().insertMessage(
            Message(
                sender = "me",
                content = "Good morning sweetheart! Looking forward to seeing you later 🥰",
                createdAt = System.currentTimeMillis() - 3600000L * 3
            )
        )
        db.messageDao().insertMessage(
            Message(
                sender = "partner",
                content = "Counting down the hours! Sending you the warmest hug 💕",
                createdAt = System.currentTimeMillis() - 3600000L * 2,
                reaction = "🥰"
            )
        )

        // Seed timeline moments
        db.timelineDao().insertTimelineItem(
            TimelineItem(
                dateStr = "Feb 14, 2024",
                type = "first",
                title = "Our Story Began",
                body = "The day we started our forever space and made each other a promise."
            )
        )
        db.timelineDao().insertTimelineItem(
            TimelineItem(
                dateStr = "May 20, 2024",
                type = "photo",
                title = "First Seaside Sunset",
                body = "Watching the warm orange horizon by the coast together."
            )
        )
        db.timelineDao().insertTimelineItem(
            TimelineItem(
                dateStr = "Aug 15, 2024",
                type = "audio",
                title = "Late Night Stargazing Whispers",
                body = "Under the quiet summer sky."
            )
        )

        // Seed bucket list
        db.bucketDao().insertBucketItem(BucketItem(title = "Watch the sunrise on a beach", completed = true))
        db.bucketDao().insertBucketItem(BucketItem(title = "Cook a 3-course homemade Italian dinner", completed = true))
        db.bucketDao().insertBucketItem(BucketItem(title = "Stargaze in a cozy cabin in the mountains", completed = false))
        db.bucketDao().insertBucketItem(BucketItem(title = "Take a spontaneous weekend road trip", completed = false))
        db.bucketDao().insertBucketItem(BucketItem(title = "Learn a ballroom or salsa dance routine together", completed = false))

        // Seed audio items
        db.audioDao().insertAudio(
            AudioItem(
                title = "Sweet dreams bedtime whisper 🌙",
                durationSec = 28,
                isFavorite = true,
                createdAt = System.currentTimeMillis() - 86400000L
            )
        )
        db.audioDao().insertAudio(
            AudioItem(
                title = "Morning coffee laughter ☕",
                durationSec = 16,
                isFavorite = false,
                createdAt = System.currentTimeMillis() - 86400000L * 3
            )
        )
    }
}
