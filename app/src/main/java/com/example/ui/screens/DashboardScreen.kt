package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: CoupleViewModel,
    onNavigateToMessages: () -> Unit,
    onNavigateToNotes: () -> Unit,
    onNavigateToGallery: () -> Unit,
    onNavigateToTimeline: () -> Unit,
    onNavigateToAudio: () -> Unit,
    onNavigateToPhotobooth: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToGames: () -> Unit
) {
    val profile by viewModel.profile.collectAsState()
    val notes by viewModel.notes.collectAsState()
    val galleryItems by viewModel.galleryItems.collectAsState()
    val audioItems by viewModel.audioItems.collectAsState()
    val bucketItems by viewModel.bucketItems.collectAsState()

    val daysTogether = viewModel.getDaysTogether(profile.startedAt)
    val greeting = viewModel.getGreeting()
    val dailyPrompt = viewModel.getDailyPrompt()

    var showPromptAnswerDialog by remember { mutableStateOf(false) }
    var promptAnswerText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "forever two hearts",
                            style = ScriptSubtitleStyle,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "$greeting, ${profile.myName}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = onNavigateToTimeline,
                        modifier = Modifier.testTag("btn_timeline_top")
                    ) {
                        Icon(
                            Icons.Outlined.AutoAwesome,
                            contentDescription = "Milestones Timeline",
                            tint = TerracottaPrimary
                        )
                    }
                    IconButton(
                        onClick = onNavigateToSettings,
                        modifier = Modifier.testTag("btn_settings_top")
                    ) {
                        Icon(
                            Icons.Outlined.Settings,
                            contentDescription = "Settings",
                            tint = InkTextMuted
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            item {
                // Hero Banner Card
                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("card_hero_anniversary")
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.hero_couple_cozy),
                                contentDescription = "Couple banner",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(
                                                Color.Transparent,
                                                Color.Black.copy(alpha = 0.65f)
                                            )
                                        )
                                    )
                            )
                            Column(
                                modifier = Modifier
                                    .align(Alignment.BottomStart)
                                    .padding(16.dp)
                            ) {
                                Text(
                                    text = "TOGETHER FOR",
                                    color = Color.White.copy(alpha = 0.85f),
                                    style = MaterialTheme.typography.labelSmall,
                                    letterSpacing = 2.sp
                                )
                                Row(
                                    verticalAlignment = Alignment.Bottom,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "$daysTogether",
                                        color = Color.White,
                                        style = MaterialTheme.typography.headlineLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "beautiful days",
                                        color = Color.White.copy(alpha = 0.9f),
                                        style = MaterialTheme.typography.titleMedium,
                                        modifier = Modifier.padding(bottom = 4.dp)
                                    )
                                }
                            }
                        }

                        // Partner status row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(TerracottaLight),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("❤️", fontSize = 20.sp)
                                }
                                Column {
                                    Text(
                                        text = "${profile.myName} & ${profile.partnerName}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Partner mood: ${profile.partnerMood}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TerracottaPrimary
                                    )
                                }
                            }

                            FilledTonalButton(
                                onClick = onNavigateToMessages,
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.filledTonalButtonColors(
                                    containerColor = TerracottaLight,
                                    contentColor = TerracottaPrimary
                                ),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                modifier = Modifier.testTag("btn_send_hello")
                            ) {
                                Icon(Icons.Filled.Favorite, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Chat", style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    }
                }
            }

            // Daily Question / Prompt Card
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = WarmBeige),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("card_daily_prompt")
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("💌", fontSize = 18.sp)
                            Text(
                                text = "TODAY'S QUESTION",
                                style = MaterialTheme.typography.labelSmall,
                                color = TerracottaPrimary,
                                letterSpacing = 1.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = dailyPrompt,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Medium,
                            color = InkTextPrimary
                        )

                        Button(
                            onClick = { showPromptAnswerDialog = true },
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = TerracottaPrimary,
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("btn_answer_prompt")
                        ) {
                            Icon(Icons.Filled.EditNote, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Write Love Note Answer")
                        }
                    }
                }
            }

            // Quick Interactive Features Grid
            item {
                Text(
                    text = "Our Cozy Spaces",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = InkTextPrimary
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Photobooth Card
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToPhotobooth() }
                            .testTag("card_shortcut_photobooth")
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(TerracottaLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.CameraAlt, contentDescription = null, tint = TerracottaPrimary)
                            }
                            Text(
                                text = "Photobooth",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Snap mirror couple strips",
                                style = MaterialTheme.typography.bodyMedium,
                                fontSize = 12.sp,
                                color = InkTextMuted
                            )
                        }
                    }

                    // Audio Vault Card
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToAudio() }
                            .testTag("card_shortcut_audio")
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(BlushAccent.copy(alpha = 0.4f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Mic, contentDescription = null, tint = DustyRose)
                            }
                            Text(
                                text = "Audio Vault",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Whispers & voice notes",
                                style = MaterialTheme.typography.bodyMedium,
                                fontSize = 12.sp,
                                color = InkTextMuted
                            )
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Games Lobby Card
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToGames() }
                            .testTag("card_shortcut_games")
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(GoldenYellow.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Casino, contentDescription = null, tint = TerracottaPrimary)
                            }
                            Text(
                                text = "Couple Games",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "RPS, TicTacToe & WYR",
                                style = MaterialTheme.typography.bodyMedium,
                                fontSize = 12.sp,
                                color = InkTextMuted
                            )
                        }
                    }

                    // Milestones Timeline Card
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateToTimeline() }
                            .testTag("card_shortcut_timeline")
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(SoftGreen.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Timeline, contentDescription = null, tint = SoftGreen)
                            }
                            Text(
                                text = "Timeline",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Our journey & story",
                                style = MaterialTheme.typography.bodyMedium,
                                fontSize = 12.sp,
                                color = InkTextMuted
                            )
                        }
                    }
                }
            }

            // Stats summary row
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        StatItem(count = notes.size.toString(), label = "Love Notes")
                        Box(modifier = Modifier.width(1.dp).height(30.dp).background(WarmBorder))
                        StatItem(count = galleryItems.size.toString(), label = "Photos")
                        Box(modifier = Modifier.width(1.dp).height(30.dp).background(WarmBorder))
                        StatItem(count = audioItems.size.toString(), label = "Voice Memos")
                        Box(modifier = Modifier.width(1.dp).height(30.dp).background(WarmBorder))
                        StatItem(count = "${bucketItems.count { it.completed }}/${bucketItems.size}", label = "Bucket Dreams")
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }

    // Daily Prompt Answer Dialog
    if (showPromptAnswerDialog) {
        AlertDialog(
            onDismissRequest = { showPromptAnswerDialog = false },
            title = {
                Text(
                    text = "Answer Today's Prompt",
                    style = MaterialTheme.typography.headlineSmall
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = dailyPrompt,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TerracottaPrimary
                    )
                    OutlinedTextField(
                        value = promptAnswerText,
                        onValueChange = { promptAnswerText = it },
                        placeholder = { Text("Write your heart's answer…") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .testTag("input_prompt_answer"),
                        shape = RoundedCornerShape(16.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (promptAnswerText.isNotBlank()) {
                            viewModel.saveNote(
                                title = "Prompt: $dailyPrompt",
                                content = promptAnswerText.trim(),
                                mood = "🥰",
                                isPrivate = false,
                                isHandwritten = true
                            )
                            promptAnswerText = ""
                            showPromptAnswerDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_confirm_prompt_answer")
                ) {
                    Text("Save to Notes")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPromptAnswerDialog = false }) {
                    Text("Cancel", color = InkTextMuted)
                }
            }
        )
    }
}

@Composable
fun StatItem(count: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = count,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = TerracottaPrimary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = InkTextMuted,
            fontSize = 10.sp
        )
    }
}
