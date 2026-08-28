package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Note
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotesScreen(
    viewModel: CoupleViewModel
) {
    val notes by viewModel.notes.collectAsState()
    val profile by viewModel.profile.collectAsState()

    var showCreateDialog by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: All, 1: Partner, 2: Mine

    val filteredNotes = remember(notes, selectedTab) {
        when (selectedTab) {
            1 -> notes.filter { it.author == "partner" }
            2 -> notes.filter { it.author == "me" }
            else -> notes
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("whispers & letters", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text("Love Notes", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = TerracottaPrimary,
                contentColor = Color.White,
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.testTag("fab_create_note")
            ) {
                Icon(Icons.Filled.Edit, contentDescription = "Write note")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp)
        ) {
            // Tab row
            SingleChoiceSegmentedButtonRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp)
            ) {
                SegmentedButton(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 3),
                    label = { Text("All (${notes.size})", fontSize = 13.sp) }
                )
                SegmentedButton(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 3),
                    label = { Text(profile.partnerName, fontSize = 13.sp) }
                )
                SegmentedButton(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    shape = SegmentedButtonDefaults.itemShape(index = 2, count = 3),
                    label = { Text("Mine", fontSize = 13.sp) }
                )
            }

            if (filteredNotes.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("💌", fontSize = 48.sp)
                        Text(
                            "No notes here yet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            "Leave a tender thought for your person.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = InkTextMuted
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    contentPadding = PaddingValues(bottom = 80.dp, top = 8.dp)
                ) {
                    items(filteredNotes, key = { it.id }) { note ->
                        NoteCard(
                            note = note,
                            partnerName = profile.partnerName,
                            myName = profile.myName,
                            onDelete = { viewModel.deleteNote(note.id) }
                        )
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateNoteDialog(
            onDismiss = { showCreateDialog = false },
            onSave = { title, content, mood, isPrivate, isHandwritten ->
                viewModel.saveNote(title, content, mood, isPrivate, isHandwritten)
                showCreateDialog = false
            }
        )
    }
}

@Composable
fun NoteCard(
    note: Note,
    partnerName: String,
    myName: String,
    onDelete: () -> Unit
) {
    val authorLabel = if (note.author == "me") "You ($myName)" else partnerName
    val dateFormatted = SimpleDateFormat("MMMM d, yyyy · h:mm a", Locale.getDefault()).format(Date(note.createdAt))

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("note_card_${note.id}")
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(note.mood, fontSize = 20.sp)
                    Column {
                        Text(
                            text = authorLabel,
                            style = MaterialTheme.typography.labelLarge,
                            color = TerracottaPrimary
                        )
                        Text(
                            text = dateFormatted,
                            style = MaterialTheme.typography.labelSmall,
                            color = InkTextSubtle,
                            fontSize = 11.sp
                        )
                    }
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(32.dp).testTag("btn_delete_note_${note.id}")
                ) {
                    Icon(
                        Icons.Outlined.Delete,
                        contentDescription = "Delete note",
                        tint = InkTextSubtle,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            if (!note.title.isNullOrBlank()) {
                Text(
                    text = note.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = InkTextPrimary
                )
            }

            Text(
                text = note.content,
                style = if (note.isHandwritten) HandwrittenNoteStyle else MaterialTheme.typography.bodyLarge,
                color = InkTextPrimary,
                lineHeight = if (note.isHandwritten) 26.sp else 22.sp
            )

            if (note.isPrivate) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Filled.Lock, contentDescription = null, tint = InkTextSubtle, modifier = Modifier.size(12.dp))
                    Text("Private draft", style = MaterialTheme.typography.labelSmall, color = InkTextSubtle)
                }
            }
        }
    }
}

@Composable
fun CreateNoteDialog(
    onDismiss: () -> Unit,
    onSave: (title: String?, content: String, mood: String, isPrivate: Boolean, isHandwritten: Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var selectedMood by remember { mutableStateOf("🥰") }
    var isHandwritten by remember { mutableStateOf(true) }
    var isPrivate by remember { mutableStateOf(false) }

    val moods = listOf("💛", "🥰", "✨", "🌧️", "🌙", "☀️")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Write a Love Note", style = MaterialTheme.typography.headlineSmall)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Mood selector
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    moods.forEach { mood ->
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(if (selectedMood == mood) TerracottaLight else Color.Transparent)
                                .clickable { selectedMood = mood },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(mood, fontSize = 20.sp)
                        }
                    }
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title (optional)") },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    placeholder = { Text("Write your heart out…") },
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .testTag("input_note_content")
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Handwritten font", style = MaterialTheme.typography.bodyMedium)
                    Switch(
                        checked = isHandwritten,
                        onCheckedChange = { isHandwritten = it }
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (content.isNotBlank()) {
                        onSave(title, content.trim(), selectedMood, isPrivate, isHandwritten)
                    }
                },
                enabled = content.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                modifier = Modifier.testTag("btn_save_note")
            ) {
                Text("Save Note")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = InkTextMuted)
            }
        }
    )
}
