package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.CoupleRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

sealed class GameKind(val label: String, val emoji: String, val tagline: String) {
    data object RPS : GameKind("Rock Paper Scissors", "✊", "Best of forever")
    data object TTT : GameKind("Tic Tac Toe", "❌", "Classic 3x3")
    data object WYR : GameKind("Would You Rather", "🤔", "Do you both agree?")
    data object TOD : GameKind("Truth or Dare", "🔥", "Dare to share")
}

data class RpsGameState(
    val round: Int = 1,
    val myScore: Int = 0,
    val partnerScore: Int = 0,
    val myPick: String? = null,
    val partnerPick: String? = null,
    val result: String? = null // "win", "lose", "tie", null
)

data class TttGameState(
    val board: List<String?> = List(9) { null },
    val isMyTurn: Boolean = true,
    val myMark: String = "X",
    val partnerMark: String = "O",
    val myScore: Int = 0,
    val partnerScore: Int = 0,
    val winner: String? = null // "me", "partner", "draw", null
)

data class WyrGameState(
    val optionA: String = "Massage forever",
    val optionB: String = "Cuddle forever",
    val myPick: String? = null, // "A" or "B"
    val partnerPick: String? = null,
    val bothAnswered: Boolean = false,
    val isMatch: Boolean = false
)

data class TodGameState(
    val promptKind: String = "truth", // "truth" or "dare"
    val promptTarget: String = "partner", // "me" or "partner"
    val promptText: String? = null
)

class CoupleViewModel(private val repository: CoupleRepository) : ViewModel() {

    val profile: StateFlow<CoupleProfile> = repository.profile
    val notes: StateFlow<List<Note>> = repository.notes.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val messages: StateFlow<List<Message>> = repository.messages.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val galleryItems: StateFlow<List<GalleryItem>> = repository.galleryItems.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val albums: StateFlow<List<Album>> = repository.albums.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val audioItems: StateFlow<List<AudioItem>> = repository.audioItems.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val timelineItems: StateFlow<List<TimelineItem>> = repository.timelineItems.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val bucketItems: StateFlow<List<BucketItem>> = repository.bucketItems.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Partner typing state
    private val _isPartnerTyping = MutableStateFlow(false)
    val isPartnerTyping: StateFlow<Boolean> = _isPartnerTyping.asStateFlow()

    // Games State
    private val _rpsState = MutableStateFlow(RpsGameState())
    val rpsState: StateFlow<RpsGameState> = _rpsState.asStateFlow()

    private val _tttState = MutableStateFlow(TttGameState())
    val tttState: StateFlow<TttGameState> = _tttState.asStateFlow()

    private val _wyrState = MutableStateFlow(WyrGameState())
    val wyrState: StateFlow<WyrGameState> = _wyrState.asStateFlow()

    private val _todState = MutableStateFlow(TodGameState())
    val todState: StateFlow<TodGameState> = _todState.asStateFlow()

    // Daily Prompts Pool
    val prompts = listOf(
        "What made you smile today?",
        "Describe a memory of us in 3 words.",
        "If today were a song, which one?",
        "What do you want to do together this weekend?",
        "A small thing I love about you…",
        "What made you feel safe today?",
        "What is your favorite place we've ever visited together?",
        "What is one dream you want us to accomplish next year?"
    )

    fun getDailyPrompt(): String {
        val calendar = Calendar.getInstance()
        val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
        return prompts[dayOfYear % prompts.size]
    }

    fun getGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when {
            hour < 5 -> "Sweet dreams"
            hour < 12 -> "Good morning"
            hour < 18 -> "Hello there"
            else -> "Good evening"
        }
    }

    fun getDaysTogether(startedAt: String): Long {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val startDate = format.parse(startedAt) ?: return 1L
            val now = Date()
            val diff = now.time - startDate.time
            maxOf(1L, diff / (1000 * 60 * 60 * 24))
        } catch (e: Exception) {
            1L
        }
    }

    // Chat Actions
    fun sendMessage(content: String) {
        if (content.isBlank()) return
        viewModelScope.launch {
            repository.sendMessage(content, sender = "me")
            // Simulated sweet partner reply
            delay(1500)
            _isPartnerTyping.value = true
            delay(2000)
            _isPartnerTyping.value = false
            val partnerReplies = listOf(
                "I love you so much! ❤️",
                "You just made my whole day brighter ✨",
                "Can't wait to hold your hand 🥰",
                "Always right here in your space 💕",
                "You're the sweetest part of my life 🌸"
            )
            repository.sendMessage(partnerReplies.random(), sender = "partner")
        }
    }

    fun reactToMessage(id: Int, reaction: String) {
        viewModelScope.launch { repository.reactToMessage(id, reaction) }
    }

    fun markMessagesSeen() {
        viewModelScope.launch { repository.markMessagesSeen() }
    }

    // Notes Actions
    fun saveNote(title: String?, content: String, mood: String, isPrivate: Boolean, isHandwritten: Boolean) {
        viewModelScope.launch {
            repository.saveNote(title, content, mood, isPrivate, isHandwritten)
        }
    }

    fun deleteNote(id: Int) {
        viewModelScope.launch { repository.deleteNote(id) }
    }

    // Gallery Actions
    fun addPhoto(url: String, caption: String?, albumId: String?) {
        viewModelScope.launch { repository.addGalleryPhoto(url, caption, albumId) }
    }

    fun toggleFavoritePhoto(id: Int, currentFav: Boolean) {
        viewModelScope.launch { repository.toggleFavoritePhoto(id, currentFav) }
    }

    fun updatePhotoCaption(id: Int, caption: String) {
        viewModelScope.launch { repository.updatePhotoCaption(id, caption) }
    }

    fun movePhotoToAlbum(id: Int, albumId: String?) {
        viewModelScope.launch { repository.movePhotoToAlbum(id, albumId) }
    }

    fun deletePhoto(id: Int) {
        viewModelScope.launch { repository.deletePhoto(id) }
    }

    fun createAlbum(name: String, date: String?) {
        viewModelScope.launch { repository.createAlbum(name, date) }
    }

    fun deleteAlbum(id: String) {
        viewModelScope.launch { repository.deleteAlbum(id) }
    }

    // Audio Actions
    fun recordVoiceMemory(title: String, durationSec: Int) {
        viewModelScope.launch {
            repository.addAudioItem(title, durationSec)
        }
    }

    fun toggleFavoriteAudio(id: Int, currentFav: Boolean) {
        viewModelScope.launch { repository.toggleFavoriteAudio(id, currentFav) }
    }

    fun renameAudio(id: Int, title: String) {
        viewModelScope.launch { repository.renameAudio(id, title) }
    }

    fun deleteAudio(id: Int) {
        viewModelScope.launch { repository.deleteAudio(id) }
    }

    // Bucket List Actions
    fun addBucketItem(title: String) {
        if (title.isBlank()) return
        viewModelScope.launch { repository.addBucketItem(title.trim()) }
    }

    fun toggleBucketItem(id: Int, current: Boolean) {
        viewModelScope.launch { repository.toggleBucketItem(id, current) }
    }

    fun deleteBucketItem(id: Int) {
        viewModelScope.launch { repository.deleteBucketItem(id) }
    }

    // Profile & Settings
    fun updateProfile(profile: CoupleProfile) {
        repository.updateProfile(profile)
    }

    // --- GAME LOGIC ---
    // 1. Rock Paper Scissors
    fun pickRps(choice: String) {
        val current = _rpsState.value
        if (current.myPick != null) return
        val partnerChoice = listOf("rock", "paper", "scissors").random()
        val result = when {
            choice == partnerChoice -> "tie"
            (choice == "rock" && partnerChoice == "scissors") ||
            (choice == "paper" && partnerChoice == "rock") ||
            (choice == "scissors" && partnerChoice == "paper") -> "win"
            else -> "lose"
        }
        val newMyScore = if (result == "win") current.myScore + 1 else current.myScore
        val newPartnerScore = if (result == "lose") current.partnerScore + 1 else current.partnerScore

        _rpsState.value = current.copy(
            myPick = choice,
            partnerPick = partnerChoice,
            result = result,
            myScore = newMyScore,
            partnerScore = newPartnerScore
        )
    }

    fun nextRpsRound() {
        val current = _rpsState.value
        _rpsState.value = current.copy(
            round = current.round + 1,
            myPick = null,
            partnerPick = null,
            result = null
        )
    }

    fun resetRps() {
        _rpsState.value = RpsGameState()
    }

    // 2. Tic Tac Toe
    fun makeTttMove(index: Int) {
        val current = _tttState.value
        if (current.board[index] != null || current.winner != null || !current.isMyTurn) return

        val newBoard = current.board.toMutableList()
        newBoard[index] = current.myMark
        val winCheck = checkTttWinner(newBoard, current.myMark, current.partnerMark)

        if (winCheck != null) {
            val myScore = if (winCheck == "me") current.myScore + 1 else current.myScore
            _tttState.value = current.copy(board = newBoard, winner = winCheck, myScore = myScore)
            return
        }

        // Partner response turn
        _tttState.value = current.copy(board = newBoard, isMyTurn = false)
        viewModelScope.launch {
            delay(500)
            val available = newBoard.indices.filter { newBoard[it] == null }
            if (available.isNotEmpty()) {
                val partnerIdx = available.random()
                newBoard[partnerIdx] = current.partnerMark
                val partnerWinCheck = checkTttWinner(newBoard, current.myMark, current.partnerMark)
                val partnerScore = if (partnerWinCheck == "partner") current.partnerScore + 1 else current.partnerScore
                _tttState.value = _tttState.value.copy(
                    board = newBoard,
                    isMyTurn = true,
                    winner = partnerWinCheck,
                    partnerScore = partnerScore
                )
            }
        }
    }

    private fun checkTttWinner(b: List<String?>, myMark: String, partnerMark: String): String? {
        val lines = listOf(
            listOf(0, 1, 2), listOf(3, 4, 5), listOf(6, 7, 8),
            listOf(0, 3, 6), listOf(1, 4, 7), listOf(2, 5, 8),
            listOf(0, 4, 8), listOf(2, 4, 6)
        )
        for (line in lines) {
            val (x, y, z) = line
            if (b[x] != null && b[x] == b[y] && b[y] == b[z]) {
                return if (b[x] == myMark) "me" else "partner"
            }
        }
        if (b.all { it != null }) return "draw"
        return null
    }

    fun nextTttRound() {
        val current = _tttState.value
        _tttState.value = current.copy(
            board = List(9) { null },
            isMyTurn = true,
            winner = null
        )
    }

    fun resetTtt() {
        _tttState.value = TttGameState()
    }

    // 3. Would You Rather
    private val wyrPool = listOf(
        Pair("Massage forever", "Cuddle forever"),
        Pair("Beach trip", "Mountain trip"),
        Pair("Early to bed, early to rise", "Late to bed, late to rise"),
        Pair("Cook together at home", "Order delicious takeout in"),
        Pair("Cozy movie night inside", "Romantic dress-up date out"),
        Pair("I always drive the road trips", "You always drive the road trips"),
        Pair("Learn a new language together", "Learn an acoustic instrument"),
        Pair("Adopt a puppy dog", "Adopt a cute cat"),
        Pair("Forever warm sunny summer", "Forever cozy winter with blankets"),
        Pair("Sweet little texts all day", "One long deep midnight phone call")
    )

    fun pickWyr(choice: String) {
        val current = _wyrState.value
        if (current.myPick != null) return
        val partnerChoice = listOf("A", "B").random()
        val isMatch = choice == partnerChoice
        _wyrState.value = current.copy(
            myPick = choice,
            partnerPick = partnerChoice,
            bothAnswered = true,
            isMatch = isMatch
        )
    }

    fun nextWyrQuestion() {
        val randomPair = wyrPool.random()
        _wyrState.value = WyrGameState(
            optionA = randomPair.first,
            optionB = randomPair.second
        )
    }

    fun resetWyr() {
        nextWyrQuestion()
    }

    // 4. Truth or Dare
    private val truthPool = listOf(
        "What was your first thought when you first saw me?",
        "What's the cutest thing I do without realizing it?",
        "What's a sweet memory of us that always makes your heart warm?",
        "If you could relive one day in our relationship, which day would it be?",
        "What's one song that immediately reminds you of me?",
        "When was a moment you felt most in love with me?"
    )

    private val darePool = listOf(
        "Send me a voice message singing a 10-second romantic chorus.",
        "Take a silly selfie right now and send it to our chat!",
        "Whisper 3 things you love about me in my ear (or voice memo).",
        "Give me the longest, warmest bear hug.",
        "Make up a sweet two-line rhyme about our relationship on the spot."
    )

    fun drawTod(kind: String, target: String) {
        val prompt = if (kind == "truth") truthPool.random() else darePool.random()
        _todState.value = TodGameState(promptKind = kind, promptTarget = target, promptText = prompt)
    }

    fun clearTod() {
        _todState.value = TodGameState()
    }
}

class CoupleViewModelFactory(private val repository: CoupleRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CoupleViewModel::class.java)) {
            return CoupleViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
