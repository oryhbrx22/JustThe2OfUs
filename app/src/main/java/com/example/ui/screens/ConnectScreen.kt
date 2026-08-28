package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectScreen(
    viewModel: CoupleViewModel,
    onConnected: () -> Unit,
    onBack: (() -> Unit)? = null
) {
    val profile by viewModel.profile.collectAsState()
    var inputCode by remember { mutableStateOf("") }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("❤️", fontSize = 20.sp)
                        Text("Forever Two Hearts", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    }
                },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
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
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth().testTag("card_connect_space")
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(TerracottaLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Favorite, contentDescription = null, tint = TerracottaPrimary, modifier = Modifier.size(32.dp))
                    }

                    Text(
                        text = "Connect with your person",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Create a new private space or join using an invite code.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = InkTextMuted,
                        textAlign = TextAlign.Center
                    )

                    Button(
                        onClick = {
                            val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
                            val newCode = (1..6).map { chars.random() }.joinToString("")
                            viewModel.updateProfile(profile.copy(inviteCode = newCode, isConnected = true))
                            onConnected()
                        },
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                        modifier = Modifier.fillMaxWidth().height(52.dp).testTag("btn_create_new_space")
                    ) {
                        Text("Create Our Private Space", fontSize = 15.sp)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f).height(1.dp).background(WarmBorder))
                        Text("or join space", style = MaterialTheme.typography.labelSmall, color = InkTextSubtle)
                        Box(modifier = Modifier.weight(1f).height(1.dp).background(WarmBorder))
                    }

                    OutlinedTextField(
                        value = inputCode,
                        onValueChange = { inputCode = it.uppercase() },
                        placeholder = { Text("Enter 6-character code", textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) },
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth().testTag("input_join_code"),
                        singleLine = true
                    )

                    Button(
                        onClick = {
                            if (inputCode.trim().length >= 4) {
                                viewModel.updateProfile(profile.copy(inviteCode = inputCode.trim(), isConnected = true))
                                onConnected()
                            }
                        },
                        enabled = inputCode.trim().length >= 4,
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DustyRose),
                        modifier = Modifier.fillMaxWidth().height(50.dp).testTag("btn_join_space")
                    ) {
                        Text("Join Space")
                    }
                }
            }
        }
    }
}
