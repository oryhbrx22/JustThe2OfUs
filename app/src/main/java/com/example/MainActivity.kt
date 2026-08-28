package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.example.theme.ForeverTwoHeartsTheme
import com.example.theme.TerracottaPrimary
import com.example.theme.WarmCardBg
import com.example.ui.navigation.BottomNavItems
import com.example.ui.navigation.Screen
import com.example.ui.screens.*
import com.example.ui.viewmodel.CoupleViewModel
import com.example.ui.viewmodel.CoupleViewModelFactory

class MainActivity : ComponentActivity() {

    private val viewModel: CoupleViewModel by viewModels {
        CoupleViewModelFactory((application as ForeverHeartsApp).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            ForeverTwoHeartsTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                val isBottomBarVisible = currentRoute in listOf(
                    Screen.Dashboard::class.qualifiedName,
                    Screen.Messages::class.qualifiedName,
                    Screen.Notes::class.qualifiedName,
                    Screen.Gallery::class.qualifiedName,
                    Screen.Games::class.qualifiedName
                )

                Scaffold(
                    bottomBar = {
                        if (isBottomBarVisible) {
                            NavigationBar(
                                containerColor = WarmCardBg,
                                tonalElevation = 3.dp,
                                modifier = Modifier.testTag("bottom_nav_bar")
                            ) {
                                BottomNavItems.forEach { item ->
                                    val isSelected = currentRoute == item.route::class.qualifiedName
                                    NavigationBarItem(
                                        icon = {
                                            Icon(
                                                if (isSelected) item.selectedIcon else item.unselectedIcon,
                                                contentDescription = item.title
                                            )
                                        },
                                        label = { Text(item.title) },
                                        selected = isSelected,
                                        onClick = {
                                            navController.navigate(item.route) {
                                                popUpTo(navController.graph.findStartDestination().id) {
                                                    saveState = true
                                                }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        colors = NavigationBarItemDefaults.colors(
                                            selectedIconColor = TerracottaPrimary,
                                            selectedTextColor = TerracottaPrimary,
                                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                                        ),
                                        modifier = Modifier.testTag(item.testTag)
                                    )
                                }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                ) { paddingValues ->
                    NavHost(
                        navController = navController,
                        startDestination = Screen.Dashboard,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                    ) {
                        composable<Screen.Dashboard> {
                            DashboardScreen(
                                viewModel = viewModel,
                                onNavigateToMessages = { navController.navigate(Screen.Messages) },
                                onNavigateToNotes = { navController.navigate(Screen.Notes) },
                                onNavigateToGallery = { navController.navigate(Screen.Gallery) },
                                onNavigateToTimeline = { navController.navigate(Screen.Timeline) },
                                onNavigateToAudio = { navController.navigate(Screen.Audio) },
                                onNavigateToPhotobooth = { navController.navigate(Screen.Photobooth) },
                                onNavigateToSettings = { navController.navigate(Screen.Settings) },
                                onNavigateToGames = { navController.navigate(Screen.Games) }
                            )
                        }

                        composable<Screen.Messages> {
                            MessagesScreen(
                                viewModel = viewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable<Screen.Notes> {
                            NotesScreen(
                                viewModel = viewModel
                            )
                        }

                        composable<Screen.Gallery> {
                            GalleryScreen(
                                viewModel = viewModel
                            )
                        }

                        composable<Screen.Games> {
                            GamesScreen(
                                viewModel = viewModel
                            )
                        }

                        composable<Screen.Timeline> {
                            TimelineScreen(
                                viewModel = viewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable<Screen.Audio> {
                            AudioScreen(
                                viewModel = viewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable<Screen.Photobooth> {
                            PhotoboothScreen(
                                viewModel = viewModel,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable<Screen.Settings> {
                            SettingsScreen(
                                viewModel = viewModel,
                                onBack = { navController.popBackStack() },
                                onNavigateToConnect = { navController.navigate(Screen.Connect) }
                            )
                        }

                        composable<Screen.Connect> {
                            ConnectScreen(
                                viewModel = viewModel,
                                onConnected = { navController.navigate(Screen.Dashboard) },
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
