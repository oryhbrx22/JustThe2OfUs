package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotoboothScreen(
    viewModel: CoupleViewModel,
    onBack: () -> Unit
) {
    val profile by viewModel.profile.collectAsState()
    var isCountingDown by remember { mutableStateOf(false) }
    var countdownNumber by remember { mutableIntStateOf(3) }
    var hasCapturedStrip by remember { mutableStateOf(false) }
    var selectedFilterIndex by remember { mutableIntStateOf(0) }
    val filters = listOf("Vintage Warm", "Classic B&W", "Soft Rose", "Honey Golden")

    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("together in frame", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text("Couple Photobooth", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("btn_back_photobooth")) {
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
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (!hasCapturedStrip) {
                // Live Couple Mirror Frame
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth().testTag("card_live_booth")
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Couple Mirror Mode", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(SoftGreen))
                                Text("Both Connected", style = MaterialTheme.typography.labelSmall, color = SoftGreen)
                            }
                        }

                        // Split Dual Views
                        Row(
                            modifier = Modifier.fillMaxWidth().height(220.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Me View
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(WarmBeige),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.hero_couple_cozy),
                                    contentDescription = "Me camera preview",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Text(
                                    text = profile.myName,
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .padding(8.dp)
                                        .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }

                            // Partner View
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(WarmBeige),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.hero_couple_cozy),
                                    contentDescription = "Partner camera preview",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Text(
                                    text = profile.partnerName,
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .padding(8.dp)
                                        .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        if (isCountingDown) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$countdownNumber",
                                    fontSize = 54.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TerracottaPrimary
                                )
                            }
                        } else {
                            Button(
                                onClick = {
                                    isCountingDown = true
                                    coroutineScope.launch {
                                        countdownNumber = 3
                                        delay(1000)
                                        countdownNumber = 2
                                        delay(1000)
                                        countdownNumber = 1
                                        delay(1000)
                                        isCountingDown = false
                                        hasCapturedStrip = true
                                    }
                                },
                                shape = RoundedCornerShape(18.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                                modifier = Modifier.fillMaxWidth().testTag("btn_capture_strip")
                            ) {
                                Icon(Icons.Filled.Camera, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Snap Couple Photo Strip", fontSize = 15.sp)
                            }
                        }
                    }
                }
            } else {
                // Generated Classic Couple Photo Strip
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = WarmCardBg),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                    modifier = Modifier.widthIn(max = 300.dp).testTag("card_photo_strip")
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "❤️ ${profile.myName} & ${profile.partnerName} ❤️",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TerracottaPrimary
                        )

                        // 3 Strip Frames
                        for (i in 1..3) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(110.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(1.dp, WarmBorder, RoundedCornerShape(12.dp))
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.hero_couple_cozy),
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                        }

                        val dateStr = SimpleDateFormat("MMMM d, yyyy", Locale.getDefault()).format(Date())
                        Text(
                            text = "Forever Two Hearts · $dateStr",
                            style = MaterialTheme.typography.labelSmall,
                            color = InkTextSubtle,
                            letterSpacing = 1.sp
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { hasCapturedStrip = false },
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.weight(1f).testTag("btn_retake_booth")
                    ) {
                        Text("Retake")
                    }

                    Button(
                        onClick = {
                            val curDate = SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(Date())
                            viewModel.addPhoto(
                                url = "res://hero_couple_cozy",
                                caption = "Photobooth strip · $curDate",
                                albumId = null
                            )
                            hasCapturedStrip = false
                            onBack()
                        },
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                        modifier = Modifier.weight(1f).testTag("btn_save_strip_gallery")
                    ) {
                        Text("Save to Gallery")
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
