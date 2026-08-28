package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.example.data.model.TimelineItem
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimelineScreen(
    viewModel: CoupleViewModel,
    onBack: () -> Unit
) {
    val timelineItems by viewModel.timelineItems.collectAsState()
    val profile by viewModel.profile.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("our story in time", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text("Milestones & Moments", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("btn_back_timeline")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = WarmBeige),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(CircleShape)
                                .background(TerracottaPrimary),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Favorite, contentDescription = null, tint = Color.White)
                        }
                        Column {
                            Text(
                                text = "${profile.myName} & ${profile.partnerName}'s Journey",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Every chapter, photo, and voice memo in our story.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = InkTextMuted,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            items(timelineItems, key = { it.id }) { item ->
                TimelineCard(item = item)
            }
        }
    }
}

@Composable
fun TimelineCard(item: TimelineItem) {
    val icon = when (item.type) {
        "photo" -> Icons.Filled.PhotoCamera
        "audio" -> Icons.Filled.Mic
        "note" -> Icons.Filled.EditNote
        "message" -> Icons.Filled.ChatBubble
        else -> Icons.Filled.Favorite
    }

    val iconBg = when (item.type) {
        "photo" -> TerracottaLight
        "audio" -> BlushAccent.copy(alpha = 0.4f)
        "note" -> GoldenYellow.copy(alpha = 0.2f)
        else -> TerracottaLight
    }

    val iconTint = when (item.type) {
        "photo" -> TerracottaPrimary
        "audio" -> DustyRose
        "note" -> TerracottaPrimary
        else -> SweetHeartRed
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("timeline_item_${item.id}"),
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
            }
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .height(60.dp)
                    .background(WarmBorder)
            )
        }

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.weight(1f)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = item.dateStr,
                    style = MaterialTheme.typography.labelSmall,
                    color = TerracottaPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = InkTextPrimary
                )
                if (!item.body.isNullOrBlank()) {
                    Text(
                        text = item.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = InkTextMuted,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}
