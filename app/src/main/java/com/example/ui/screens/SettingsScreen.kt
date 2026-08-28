package com.example.ui.screens

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: CoupleViewModel,
    onBack: () -> Unit,
    onNavigateToConnect: () -> Unit
) {
    val profile by viewModel.profile.collectAsState()
    val bucketItems by viewModel.bucketItems.collectAsState()

    var name by remember(profile) { mutableStateOf(profile.myName) }
    var nickname by remember(profile) { mutableStateOf(profile.myNickname) }
    var partnerName by remember(profile) { mutableStateOf(profile.partnerName) }
    var partnerNickname by remember(profile) { mutableStateOf(profile.partnerNickname) }
    var selectedMood by remember(profile) { mutableStateOf(profile.myMood) }
    var startedAt by remember(profile) { mutableStateOf(profile.startedAt) }
    var newGoalText by remember { mutableStateOf("") }

    val moods = listOf("💛 happy", "🥰 in love", "🌧️ tender", "✨ dreamy", "🌙 sleepy", "☀️ bright")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("just for you two", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text("Settings & Spaces", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("btn_back_settings")) {
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
            contentPadding = PaddingValues(bottom = 40.dp)
        ) {
            // Profile & Mood Card
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth().testTag("card_settings_profile")
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Your Profile", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Display Name") },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_my_name")
                        )

                        OutlinedTextField(
                            value = nickname,
                            onValueChange = { nickname = it },
                            label = { Text("Nickname (what they call you)") },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_my_nickname")
                        )

                        Text("Today's Mood", style = MaterialTheme.typography.labelMedium, color = InkTextMuted)
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            moods.forEach { m ->
                                val isSelected = selectedMood == m
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(if (isSelected) TerracottaPrimary else WarmBeige)
                                        .clickable { selectedMood = m }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = m,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (isSelected) Color.White else InkTextPrimary
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = startedAt,
                            onValueChange = { startedAt = it },
                            label = { Text("Anniversary / Start Date (YYYY-MM-DD)") },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_started_at")
                        )

                        Button(
                            onClick = {
                                viewModel.updateProfile(
                                    profile.copy(
                                        myName = name.trim(),
                                        myNickname = nickname.trim(),
                                        myMood = selectedMood,
                                        startedAt = startedAt.trim()
                                    )
                                )
                            },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                            modifier = Modifier.fillMaxWidth().testTag("btn_save_profile")
                        ) {
                            Text("Save Profile")
                        }
                    }
                }
            }

            // Partner Profile Card
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Partner Info", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                        OutlinedTextField(
                            value = partnerName,
                            onValueChange = { partnerName = it },
                            label = { Text("Partner Name") },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_partner_name")
                        )

                        OutlinedTextField(
                            value = partnerNickname,
                            onValueChange = { partnerNickname = it },
                            label = { Text("Partner Nickname") },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().testTag("input_partner_nickname")
                        )

                        Button(
                            onClick = {
                                viewModel.updateProfile(
                                    profile.copy(
                                        partnerName = partnerName.trim(),
                                        partnerNickname = partnerNickname.trim()
                                    )
                                )
                            },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                            modifier = Modifier.fillMaxWidth().testTag("btn_save_partner")
                        ) {
                            Text("Update Partner Info")
                        }
                    }
                }
            }

            // Invite Code Card
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth().testTag("card_invite_code")
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("Your Private Space Code", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(WarmBeige)
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = profile.inviteCode,
                                style = MaterialTheme.typography.headlineLarge,
                                letterSpacing = 6.sp,
                                fontWeight = FontWeight.Bold,
                                color = TerracottaPrimary
                            )
                        }
                        Text("Share this 6-letter code with your person to link together.", style = MaterialTheme.typography.bodyMedium, color = InkTextMuted, fontSize = 12.sp)
                    }
                }
            }

            // Couple Bucket List
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth().testTag("card_bucket_list")
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Our Couple Bucket List", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = newGoalText,
                                onValueChange = { newGoalText = it },
                                placeholder = { Text("A trip, a recipe, a concert…", fontSize = 13.sp) },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).testTag("input_new_bucket_item")
                            )
                            Button(
                                onClick = {
                                    if (newGoalText.isNotBlank()) {
                                        viewModel.addBucketItem(newGoalText)
                                        newGoalText = ""
                                    }
                                },
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                                modifier = Modifier.testTag("btn_add_bucket_item")
                            ) {
                                Text("Add")
                            }
                        }

                        bucketItems.forEach { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { viewModel.toggleBucketItem(item.id, item.completed) }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Checkbox(
                                    checked = item.completed,
                                    onCheckedChange = { viewModel.toggleBucketItem(item.id, item.completed) },
                                    colors = CheckboxDefaults.colors(checkedColor = TerracottaPrimary)
                                )
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.bodyMedium,
                                    textDecoration = if (item.completed) TextDecoration.LineThrough else TextDecoration.None,
                                    color = if (item.completed) InkTextSubtle else InkTextPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(
                                    onClick = { viewModel.deleteBucketItem(item.id) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Filled.Close, contentDescription = "Delete", tint = InkTextSubtle, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }

            // Space Switcher
            item {
                OutlinedButton(
                    onClick = onNavigateToConnect,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth().testTag("btn_switch_space")
                ) {
                    Icon(Icons.Filled.SwapHoriz, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Connect to Another Space or Code")
                }
            }
        }
    }
}
