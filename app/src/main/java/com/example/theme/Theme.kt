package com.example.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = TerracottaPrimary,
    onPrimary = WarmCardBg,
    primaryContainer = TerracottaLight,
    onPrimaryContainer = TerracottaDark,
    secondary = BlushAccentDark,
    onSecondary = WarmCardBg,
    secondaryContainer = BlushAccent,
    onSecondaryContainer = InkTextPrimary,
    background = WarmCreamBg,
    onBackground = InkTextPrimary,
    surface = WarmCardBg,
    onSurface = InkTextPrimary,
    surfaceVariant = WarmBeige,
    onSurfaceVariant = InkTextMuted,
    outline = WarmBorder
)

private val DarkColorScheme = darkColorScheme(
    primary = TerracottaPrimary,
    onPrimary = WarmCardBg,
    primaryContainer = TerracottaDark,
    onPrimaryContainer = TerracottaLight,
    secondary = DustyRose,
    onSecondary = SoftDarkBg,
    background = SoftDarkBg,
    onBackground = SoftDarkText,
    surface = SoftDarkCard,
    onSurface = SoftDarkText,
    surfaceVariant = SoftDarkBg,
    onSurfaceVariant = InkTextSubtle,
    outline = SoftDarkCard
)

@Composable
fun ForeverTwoHeartsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
