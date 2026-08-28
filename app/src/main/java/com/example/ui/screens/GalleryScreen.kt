package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.example.R
import com.example.data.model.Album
import com.example.data.model.GalleryItem
import com.example.theme.*
import com.example.ui.viewmodel.CoupleViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GalleryScreen(
    viewModel: CoupleViewModel
) {
    val items by viewModel.galleryItems.collectAsState()
    val albums by viewModel.albums.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: All, 1: Albums, 2: Favorites
    var activeAlbumId by remember { mutableStateOf<String?>(null) }
    var selectedPhoto by remember { mutableStateOf<GalleryItem?>(null) }
    var showCreateAlbumDialog by remember { mutableStateOf(false) }
    var showAddPhotoDialog by remember { mutableStateOf(false) }

    val displayedPhotos = remember(items, selectedTab, activeAlbumId) {
        when {
            activeAlbumId != null -> items.filter { it.albumId == activeAlbumId }
            selectedTab == 2 -> items.filter { it.isFavorite }
            else -> items
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("treasured frames", style = ScriptSubtitleStyle, fontSize = 18.sp)
                        Text(
                            if (activeAlbumId != null) {
                                albums.find { it.id == activeAlbumId }?.name ?: "Album"
                            } else "Shared Gallery",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                navigationIcon = {
                    if (activeAlbumId != null) {
                        IconButton(onClick = { activeAlbumId = null }) {
                            Icon(Icons.Filled.ArrowBack, contentDescription = "Back to Albums")
                        }
                    }
                },
                actions = {
                    if (selectedTab == 1 && activeAlbumId == null) {
                        IconButton(
                            onClick = { showCreateAlbumDialog = true },
                            modifier = Modifier.testTag("btn_create_album")
                        ) {
                            Icon(Icons.Filled.CreateNewFolder, contentDescription = "New Album", tint = TerracottaPrimary)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddPhotoDialog = true },
                containerColor = TerracottaPrimary,
                contentColor = Color.White,
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.testTag("fab_add_photo")
            ) {
                Icon(Icons.Filled.AddAPhoto, contentDescription = "Add photo")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            if (activeAlbumId == null) {
                SingleChoiceSegmentedButtonRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp)
                ) {
                    SegmentedButton(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 3),
                        label = { Text("All", fontSize = 13.sp) }
                    )
                    SegmentedButton(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        shape = SegmentedButtonDefaults.itemShape(index = 1, count = 3),
                        label = { Text("Albums (${albums.size})", fontSize = 13.sp) }
                    )
                    SegmentedButton(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        shape = SegmentedButtonDefaults.itemShape(index = 2, count = 3),
                        label = { Text("Favorites", fontSize = 13.sp) }
                    )
                }
            }

            if (selectedTab == 1 && activeAlbumId == null) {
                // Albums Grid
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 80.dp, top = 8.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(albums, key = { it.id }) { album ->
                        val albumPhotos = items.filter { it.albumId == album.id }
                        Card(
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { activeAlbumId = album.id }
                                .testTag("album_card_${album.id}")
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(100.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(TerracottaLight),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (albumPhotos.isNotEmpty()) {
                                        AsyncImage(
                                            model = albumPhotos.first().url,
                                            contentDescription = null,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Icon(Icons.Filled.FolderSpecial, contentDescription = null, tint = TerracottaPrimary, modifier = Modifier.size(36.dp))
                                    }
                                }
                                Text(album.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text("${albumPhotos.size} photos", style = MaterialTheme.typography.bodyMedium, color = InkTextMuted, fontSize = 12.sp)
                            }
                        }
                    }
                }
            } else {
                // Photos Grid
                if (displayedPhotos.isEmpty()) {
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
                            Text("📸", fontSize = 48.sp)
                            Text("No photos here yet", style = MaterialTheme.typography.titleMedium)
                            Text("Add your favorite moments together.", style = MaterialTheme.typography.bodyMedium, color = InkTextMuted)
                        }
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(bottom = 80.dp, top = 8.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(displayedPhotos, key = { it.id }) { photo ->
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedPhoto = photo }
                                    .testTag("gallery_photo_${photo.id}")
                            ) {
                                Column {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(140.dp)
                                    ) {
                                        if (photo.url.startsWith("res://") || photo.url.isEmpty()) {
                                            Image(
                                                painter = painterResource(id = R.drawable.hero_couple_cozy),
                                                contentDescription = photo.caption,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        } else {
                                            AsyncImage(
                                                model = photo.url,
                                                contentDescription = photo.caption,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        }

                                        if (photo.isFavorite) {
                                            Box(
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .padding(8.dp)
                                                    .clip(CircleShape)
                                                    .background(Color.Black.copy(alpha = 0.5f))
                                                    .padding(6.dp)
                                            ) {
                                                Icon(
                                                    Icons.Filled.Favorite,
                                                    contentDescription = "Favorite",
                                                    tint = SweetHeartRed,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }

                                    if (!photo.caption.isNullOrBlank()) {
                                        Text(
                                            text = photo.caption,
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            maxLines = 1,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Full Screen Photo Detail Dialog
    if (selectedPhoto != null) {
        val photo = selectedPhoto!!
        Dialog(
            onDismissRequest = { selectedPhoto = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Color.Black.copy(alpha = 0.95f)
            ) {
                Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { selectedPhoto = null }) {
                            Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color.White)
                        }
                        Row {
                            IconButton(onClick = {
                                viewModel.toggleFavoritePhoto(photo.id, photo.isFavorite)
                                selectedPhoto = photo.copy(isFavorite = !photo.isFavorite)
                            }) {
                                Icon(
                                    if (photo.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                    contentDescription = "Favorite",
                                    tint = if (photo.isFavorite) SweetHeartRed else Color.White
                                )
                            }
                            IconButton(onClick = {
                                viewModel.deletePhoto(photo.id)
                                selectedPhoto = null
                            }) {
                                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = Color.White)
                            }
                        }
                    }

                    Box(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.hero_couple_cozy),
                            contentDescription = photo.caption,
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = photo.caption ?: "A sweet moment",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium
                        )
                        val dateStr = SimpleDateFormat("MMMM d, yyyy", Locale.getDefault()).format(Date(photo.createdAt))
                        Text(
                            text = dateStr,
                            color = Color.White.copy(alpha = 0.7f),
                            style = MaterialTheme.typography.bodyMedium,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }

    // Add Photo Dialog
    if (showAddPhotoDialog) {
        var caption by remember { mutableStateOf("") }
        var selectedAlbumId by remember { mutableStateOf<String?>(activeAlbumId) }

        AlertDialog(
            onDismissRequest = { showAddPhotoDialog = false },
            title = { Text("Add Memory Photo", style = MaterialTheme.typography.headlineSmall) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(130.dp)
                            .clip(RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.hero_couple_cozy),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    OutlinedTextField(
                        value = caption,
                        onValueChange = { caption = it },
                        label = { Text("Caption or memory title") },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth().testTag("input_photo_caption")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.addPhoto("res://hero_couple_cozy", caption.ifBlank { "A sweet memory" }, selectedAlbumId)
                        showAddPhotoDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_save_photo")
                ) {
                    Text("Save to Gallery")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddPhotoDialog = false }) {
                    Text("Cancel", color = InkTextMuted)
                }
            }
        )
    }

    // Create Album Dialog
    if (showCreateAlbumDialog) {
        var albumName by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showCreateAlbumDialog = false },
            title = { Text("Create Photo Album", style = MaterialTheme.typography.headlineSmall) },
            text = {
                OutlinedTextField(
                    value = albumName,
                    onValueChange = { albumName = it },
                    label = { Text("Album Name (e.g. Vacation, Roadtrip)") },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().testTag("input_album_name")
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (albumName.isNotBlank()) {
                            val curDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                            viewModel.createAlbum(albumName.trim(), curDate)
                            showCreateAlbumDialog = false
                        }
                    },
                    enabled = albumName.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = TerracottaPrimary),
                    modifier = Modifier.testTag("btn_save_album")
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateAlbumDialog = false }) {
                    Text("Cancel", color = InkTextMuted)
                }
            }
        )
    }
}
