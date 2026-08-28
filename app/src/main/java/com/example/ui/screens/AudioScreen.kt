package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AudioItem
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AudioScreen(
    viewModel: CoupleViewModel,
    onBack: () -> Unit
) {
    val items by viewModel.audioItems.collectAsState()

    var isRecording by remember { mutableStateOf(false) }
    var recordingSeconds by remember { mutableIntStateOf(0) }
    var playingId by remember { mutableStateOf<Int?>(null) }
    var renameTarget by remember { mutableStateOf<AudioItem?>(null) }

    LaunchedEffect(isRecording) {
        if (isRecording) {
            recordingSeconds = 0
            while (isRecording) {
                delay(1000)
                recordingSeconds++
            }
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isRecording) 1.15f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("echoes & whispers", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text("Audio Vault", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("btn_back_audio")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Recording Studio Card
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth().testTag("card_record_audio")
            ) {
                Column(
                    modifier = Modifier.padding(24.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .scale(pulseScale)
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(if (isRecording) SweetHeartRed else TerracottaPrimary)
                            .clickable {
                                if (isRecording) {
                                    isRecording = false
                                    viewModel.recordVoiceMemory(
                                        title = "Voice memory · ${SimpleDateFormat("MMM d, h:mm a", Locale.getDefault()).format(Date())}",
                                        durationSec = maxOf(1, recordingSeconds)
                                    )
                                } else {
                                    isRecording = true
                                }
                            }
                            .testTag("btn_record_toggle"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            if (isRecording) Icons.Filled.Stop else Icons.Filled.Mic,
                            contentDescription = "Record",
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                    }

                    Text(
                        text = if (isRecording) "Recording… ${recordingSeconds}s · Tap to finish" else "Tap to record a voice memory",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (isRecording) FontWeight.Bold else FontWeight.Normal,
                        color = if (isRecording) SweetHeartRed else InkTextMuted
                    )
                }
            }

            Text("Voice Memories", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            if (items.isEmpty()) {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No recordings yet. Leave them a voice note.", color = InkTextMuted)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 20.dp)
                ) {
                    items(items, key = { it.id }) { audio ->
                        val isPlaying = playingId == audio.id

                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth().testTag("audio_item_${audio.id}")
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(if (isPlaying) DustyRose else TerracottaPrimary)
                                        .clickable {
                                            playingId = if (isPlaying) null else audio.id
                                        }
                                        .testTag("btn_play_audio_${audio.id}"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                                        contentDescription = "Play",
                                        tint = Color.White
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text(
                                            text = audio.title,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.SemiBold,
                                            maxLines = 1
                                        )
                                        IconButton(
                                            onClick = { renameTarget = audio },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(Icons.Filled.Edit, contentDescription = "Rename", tint = InkTextSubtle, modifier = Modifier.size(14.dp))
                                        }
                                    }
                                    val dateStr = SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date(audio.createdAt))
                                    Text(
                                        text = "$dateStr · ${audio.durationSec}s",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = InkTextMuted
                                    )
                                }

                                IconButton(onClick = { viewModel.toggleFavoriteAudio(audio.id, audio.isFavorite) }) {
                                    Icon(
                                        if (audio.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                        contentDescription = "Favorite",
                                        tint = if (audio.isFavorite) SweetHeartRed else InkTextSubtle
                                    )
                                }

                                IconButton(onClick = { viewModel.deleteAudio(audio.id) }) {
                                    Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = InkTextSubtle)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (renameTarget != null) {
        var newTitle by remember { mutableStateOf(renameTarget!!.title) }
        AlertDialog(
            onDismissRequest = { renameTarget = null },
            title = { Text("Rename Voice Memory") },
            text = {
                OutlinedTextField(
                    value = newTitle,
                    onValueChange = { newTitle = it },
                    modifier = Modifier.fillMaxWidth().testTag("input_rename_audio")
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTitle.isNotBlank()) {
                            viewModel.renameAudio(renameTarget!!.id, newTitle.trim())
                            renameTarget = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary)
                ) {
                    Text("Rename")
                }
            },
            dismissButton = {
                TextButton(onClick = { renameTarget = null }) {
                    Text("Cancel", color = InkTextMuted)
                }
            }
        )
    }
}
