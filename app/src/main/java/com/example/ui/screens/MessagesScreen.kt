package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Message
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(
    viewModel: CoupleViewModel,
    onBack: () -> Unit
) {
    val messages by viewModel.messages.collectAsState()
    val profile by viewModel.profile.collectAsState()
    val isTyping by viewModel.isPartnerTyping.collectAsState()

    var inputText by remember { mutableStateOf("") }
    var selectedMessageForReaction by remember { mutableStateOf<Message?>(null) }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    val quickChips = listOf(
        "Good morning, my love ☀️",
        "Thinking of you right now 💕",
        "Sending you the biggest hug 🤗",
        "Can't wait to see you 🥰",
        "Good night, sweet dreams 🌙"
    )

    LaunchedEffect(messages.size, isTyping) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
        viewModel.markMessagesSeen()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(TerracottaLight),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("❤️", fontSize = 18.sp)
                        }
                        Column {
                            Text(
                                text = profile.partnerName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isTyping) "typing a sweet reply…" else "Partner mood: ${profile.partnerMood}",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isTyping) TerracottaPrimary else InkTextMuted
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("btn_back_chat")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Chat Messages List
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                items(messages, key = { it.id }) { msg ->
                    val isMe = msg.sender == "me"
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
                    ) {
                        Box(
                            modifier = Modifier
                                .widthIn(max = 280.dp)
                                .clip(
                                    RoundedCornerShape(
                                        topStart = 20.dp,
                                        topEnd = 20.dp,
                                        bottomStart = if (isMe) 20.dp else 4.dp,
                                        bottomEnd = if (isMe) 4.dp else 20.dp
                                    )
                                )
                                .background(
                                    if (isMe) TerracottaPrimary else MaterialTheme.colorScheme.surface
                                )
                                .clickable { selectedMessageForReaction = msg }
                                .padding(horizontal = 14.dp, vertical = 10.dp)
                                .testTag("msg_bubble_${msg.id}")
                        ) {
                            Column {
                                msg.content?.let {
                                    Text(
                                        text = it,
                                        color = if (isMe) Color.White else InkTextPrimary,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontSize = 15.sp
                                    )
                                }

                                Row(
                                    modifier = Modifier.padding(top = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val timeStr = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(msg.createdAt))
                                    Text(
                                        text = timeStr,
                                        color = if (isMe) Color.White.copy(alpha = 0.75f) else InkTextSubtle,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }

                        // Reaction badge if present
                        if (msg.reaction != null) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 2.dp)
                                    .clip(CircleShape)
                                    .background(WarmCardBg)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(text = msg.reaction, fontSize = 13.sp)
                            }
                        }
                    }
                }

                if (isTyping) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(start = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text("✨ typing…", style = MaterialTheme.typography.bodyMedium, color = TerracottaPrimary)
                            }
                        }
                    }
                }
            }

            // Quick Prompt Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(quickChips) { chip ->
                    SuggestionChip(
                        onClick = {
                            viewModel.sendMessage(chip)
                        },
                        label = { Text(chip, fontSize = 12.sp) },
                        colors = SuggestionChipDefaults.suggestionChipColors(
                            containerColor = MaterialTheme.colorScheme.surface,
                            labelColor = InkTextPrimary
                        ),
                        shape = RoundedCornerShape(14.dp)
                    )
                }
            }

            // Input Bar
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Write a tender message…", fontSize = 14.sp) },
                        shape = RoundedCornerShape(24.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("input_chat_message"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TerracottaPrimary,
                            unfocusedBorderColor = WarmBorder
                        ),
                        maxLines = 3
                    )

                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank()) {
                                viewModel.sendMessage(inputText.trim())
                                inputText = ""
                            }
                        },
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(TerracottaPrimary)
                            .testTag("btn_send_chat"),
                        enabled = inputText.isNotBlank()
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }

    // Reaction Picker Dialog
    if (selectedMessageForReaction != null) {
        val targetMsg = selectedMessageForReaction!!
        AlertDialog(
            onDismissRequest = { selectedMessageForReaction = null },
            title = { Text("React to Message", style = MaterialTheme.typography.titleMedium) },
            text = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    val reactions = listOf("❤️", "🥰", "✨", "😂", "🥺", "🔥")
                    reactions.forEach { emoji ->
                        Text(
                            text = emoji,
                            fontSize = 28.sp,
                            modifier = Modifier
                                .clip(CircleShape)
                                .clickable {
                                    viewModel.reactToMessage(targetMsg.id, emoji)
                                    selectedMessageForReaction = null
                                }
                                .padding(6.dp)
                        )
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { selectedMessageForReaction = null }) {
                    Text("Close", color = InkTextMuted)
                }
            }
        )
    }
}
