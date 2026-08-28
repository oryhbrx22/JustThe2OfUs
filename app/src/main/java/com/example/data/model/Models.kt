package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
data class CoupleProfile(
    val myName: String = "Alex",
    val myNickname: String = "Sweetheart",
    val partnerName: String = "Taylor",
    val partnerNickname: String = "My Love",
    val myMood: String = "🥰 in love",
    val partnerMood: String = "✨ dreamy",
    val startedAt: String = "2024-02-14",
    val inviteCode: String = "FOREVR",
    val isConnected: Boolean = true,
    val bgUrl: String? = null,
    val bgBlur: Int = 0,
    val bgDim: Int = 20,
    val bgTextTheme: String = "auto"
)

@Entity(tableName = "notes")
@Serializable
data class Note(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val author: String = "me", // "me" or "partner"
    val title: String? = null,
    val content: String = "",
    val mood: String = "💛",
    val isPrivate: Boolean = false,
    val isHandwritten: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "messages")
@Serializable
data class Message(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val sender: String = "me", // "me" or "partner"
    val content: String? = null,
    val kind: String = "text", // "text", "image", "audio"
    val mediaUrl: String? = null,
    val reaction: String? = null,
    val seenAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "gallery_items")
@Serializable
data class GalleryItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val url: String = "",
    val caption: String? = null,
    val albumId: String? = null,
    val isFavorite: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "gallery_albums")
@Serializable
data class Album(
    @PrimaryKey val id: String = "",
    val name: String = "",
    val albumDate: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "audio_items")
@Serializable
data class AudioItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String = "Voice memory",
    val durationSec: Int = 14,
    val url: String = "",
    val isFavorite: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "timeline_items")
@Serializable
data class TimelineItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val dateStr: String = "",
    val type: String = "first", // "first", "photo", "note", "audio", "message"
    val title: String = "",
    val body: String? = null,
    val mediaUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "bucket_items")
@Serializable
data class BucketItem(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String = "",
    val completed: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
