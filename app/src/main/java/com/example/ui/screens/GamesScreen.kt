package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel
import com.example.ui.viewmodel.GameKind

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GamesScreen(
    viewModel: CoupleViewModel
) {
    var selectedGameIndex by remember { mutableIntStateOf(0) }
    val games = listOf(GameKind.RPS, GameKind.TTT, GameKind.WYR, GameKind.TOD)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("play together", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text("Couple Games Lobby", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
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
                .padding(horizontal = 20.dp)
        ) {
            // Game Selector Tabs
            ScrollableTabRow(
                selectedTabIndex = selectedGameIndex,
                edgePadding = 0.dp,
                containerColor = Color.Transparent,
                divider = {},
                modifier = Modifier.padding(vertical = 8.dp)
            ) {
                games.forEachIndexed { index, game ->
                    Tab(
                        selected = selectedGameIndex == index,
                        onClick = { selectedGameIndex = index },
                        text = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(game.emoji)
                                Text(game.label, fontWeight = if (selectedGameIndex == index) FontWeight.Bold else FontWeight.Normal)
                            }
                        },
                        selectedContentColor = TerracottaPrimary,
                        unselectedContentColor = InkTextMuted
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            when (selectedGameIndex) {
                0 -> RpsGameView(viewModel)
                1 -> TttGameView(viewModel)
                2 -> WyrGameView(viewModel)
                3 -> TodGameView(viewModel)
            }
        }
    }
}

@Composable
fun RpsGameView(viewModel: CoupleViewModel) {
    val state by viewModel.rpsState.collectAsState()
    val profile by viewModel.profile.collectAsState()

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth().testTag("card_rps_game")
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Round ${state.round}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("${profile.myName}: ${state.myScore}", color = TerracottaPrimary, fontWeight = FontWeight.Bold)
                    Text("${profile.partnerName}: ${state.partnerScore}", color = DustyRose, fontWeight = FontWeight.Bold)
                }
            }

            if (state.result != null) {
                val bannerText = when (state.result) {
                    "win" -> "🎉 You won this round!"
                    "lose" -> "❤️ ${profile.partnerName} won this round!"
                    else -> "🤝 It's a sweet tie!"
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (state.result == "win") TerracottaLight else WarmBeige)
                        .padding(14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(bannerText, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(
                            "You picked ${state.myPick} · ${profile.partnerName} picked ${state.partnerPick}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontSize = 12.sp,
                            color = InkTextMuted
                        )
                    }
                }
                Button(
                    onClick = { viewModel.nextRpsRound() },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_next_rps_round")
                ) {
                    Text("Next Round")
                }
            } else {
                Text("Pick your move:", style = MaterialTheme.typography.bodyMedium, color = InkTextMuted)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    RpsChoiceButton("✊", "rock", "btn_pick_rock") { viewModel.pickRps("rock") }
                    RpsChoiceButton("✋", "paper", "btn_pick_paper") { viewModel.pickRps("paper") }
                    RpsChoiceButton("✌️", "scissors", "btn_pick_scissors") { viewModel.pickRps("scissors") }
                }
            }
        }
    }
}

@Composable
fun RpsChoiceButton(emoji: String, label: String, tag: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(TerracottaLight)
                .clickable { onClick() }
                .testTag(tag),
            contentAlignment = Alignment.Center
        ) {
            Text(emoji, fontSize = 32.sp)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(label.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
fun TttGameView(viewModel: CoupleViewModel) {
    val state by viewModel.tttState.collectAsState()
    val profile by viewModel.profile.collectAsState()

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth().testTag("card_ttt_game")
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Tic Tac Toe (X / O)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("${profile.myName}: ${state.myScore}", color = TerracottaPrimary, fontWeight = FontWeight.Bold)
                    Text("${profile.partnerName}: ${state.partnerScore}", color = DustyRose, fontWeight = FontWeight.Bold)
                }
            }

            // 3x3 Board
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                for (row in 0..2) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        for (col in 0..2) {
                            val index = row * 3 + col
                            val mark = state.board[index]
                            Box(
                                modifier = Modifier
                                    .size(76.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(WarmBeige)
                                    .clickable(enabled = mark == null && state.winner == null && state.isMyTurn) {
                                        viewModel.makeTttMove(index)
                                    }
                                    .testTag("ttt_cell_$index"),
                                contentAlignment = Alignment.Center
                            ) {
                                if (mark != null) {
                                    Text(
                                        text = mark,
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (mark == "X") TerracottaPrimary else DustyRose
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (state.winner != null) {
                val banner = when (state.winner) {
                    "me" -> "🎉 You won! Pure brilliance!"
                    "partner" -> "🥰 ${profile.partnerName} won!"
                    else -> "🤝 Cat's game! It's a draw."
                }
                Text(banner, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = TerracottaPrimary)
                Button(
                    onClick = { viewModel.nextTttRound() },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_reset_ttt")
                ) {
                    Text("Play Again")
                }
            } else {
                Text(
                    text = if (state.isMyTurn) "Your turn (X)" else "${profile.partnerName}'s turn (O)…",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (state.isMyTurn) TerracottaPrimary else InkTextMuted
                )
            }
        }
    }
}

@Composable
fun WyrGameView(viewModel: CoupleViewModel) {
    val state by viewModel.wyrState.collectAsState()
    val profile by viewModel.profile.collectAsState()

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth().testTag("card_wyr_game")
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Would You Rather…",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = InkTextPrimary
            )

            // Option A
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.myPick == "A") TerracottaLight else WarmBeige
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = state.myPick == null) { viewModel.pickWyr("A") }
                    .testTag("wyr_option_a")
            ) {
                Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                    Text(
                        text = state.optionA,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Text("— OR —", style = MaterialTheme.typography.labelSmall, color = InkTextSubtle, letterSpacing = 2.sp)

            // Option B
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.myPick == "B") TerracottaLight else WarmBeige
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = state.myPick == null) { viewModel.pickWyr("B") }
                    .testTag("wyr_option_b")
            ) {
                Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                    Text(
                        text = state.optionB,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            if (state.bothAnswered) {
                val banner = if (state.isMatch) {
                    "💕 You both matched! You're completely in sync!"
                } else {
                    "🥰 Opposites attract! You picked ${if (state.myPick == "A") state.optionA else state.optionB} while ${profile.partnerName} picked ${if (state.partnerPick == "A") state.optionA else state.optionB}."
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (state.isMatch) TerracottaLight else WarmBeige)
                        .padding(14.dp)
                ) {
                    Text(banner, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
                }

                Button(
                    onClick = { viewModel.nextWyrQuestion() },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_next_wyr")
                ) {
                    Text("Next Question")
                }
            }
        }
    }
}

@Composable
fun TodGameView(viewModel: CoupleViewModel) {
    val state by viewModel.todState.collectAsState()
    val profile by viewModel.profile.collectAsState()

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth().testTag("card_tod_game")
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Truth or Dare for Couples",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = InkTextPrimary
            )
            Text(
                text = "Intimate questions and sweet dares to bring you closer.",
                style = MaterialTheme.typography.bodyMedium,
                color = InkTextMuted,
                textAlign = TextAlign.Center
            )

            if (state.promptText != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(WarmBeige)
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "${state.promptKind.uppercase()} · For ${if (state.promptTarget == "me") profile.myName else profile.partnerName}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TerracottaPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = state.promptText!!,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Button(
                    onClick = { viewModel.clearTod() },
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_draw_another_tod")
                ) {
                    Text("Draw Another")
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { viewModel.drawTod("truth", "partner") },
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                        modifier = Modifier.weight(1f).height(60.dp).testTag("btn_tod_truth")
                    ) {
                        Text("✨ Truth", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { viewModel.drawTod("dare", "partner") },
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DustyRose),
                        modifier = Modifier.weight(1f).height(60.dp).testTag("btn_tod_dare")
                    ) {
                        Text("🔥 Dare", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
