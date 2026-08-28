package com.example.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.serialization.Serializable

sealed interface Screen {
    @Serializable
    data object Dashboard : Screen

    @Serializable
    data object Messages : Screen

    @Serializable
    data object Notes : Screen

    @Serializable
    data object Gallery : Screen

    @Serializable
    data object Timeline : Screen

    @Serializable
    data object Games : Screen

    @Serializable
    data object Audio : Screen

    @Serializable
    data object Photobooth : Screen

    @Serializable
    data object Settings : Screen

    @Serializable
    data object Connect : Screen
}

data class BottomNavItem(
    val route: Screen,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val testTag: String
)

val BottomNavItems = listOf(
    BottomNavItem(Screen.Dashboard, "Home", Icons.Filled.Home, Icons.Outlined.Home, "nav_home"),
    BottomNavItem(Screen.Messages, "Chat", Icons.Filled.ChatBubble, Icons.Outlined.ChatBubbleOutline, "nav_chat"),
    BottomNavItem(Screen.Notes, "Notes", Icons.Filled.EditNote, Icons.Outlined.EditNote, "nav_notes"),
    BottomNavItem(Screen.Gallery, "Gallery", Icons.Filled.PhotoLibrary, Icons.Outlined.PhotoLibrary, "nav_gallery"),
    BottomNavItem(Screen.Games, "Games", Icons.Filled.Gamepad, Icons.Outlined.Gamepad, "nav_games")
)
