package com.example

import org.junit.Assert.*
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.*

class CoupleLogicTest {

    @Test
    fun testDaysTogetherCalculation() {
        val format = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val pastDateStr = "2024-01-01"
        val pastDate = format.parse(pastDateStr)!!
        val now = Date()
        val diff = now.time - pastDate.time
        val days = diff / (1000 * 60 * 60 * 24)
        assertTrue(days >= 1)
    }

    @Test
    fun testRpsGameWinningRules() {
        fun rpsResult(choice: String, partner: String): String {
            return when {
                choice == partner -> "tie"
                (choice == "rock" && partner == "scissors") ||
                (choice == "paper" && partner == "rock") ||
                (choice == "scissors" && partner == "paper") -> "win"
                else -> "lose"
            }
        }

        assertEquals("win", rpsResult("rock", "scissors"))
        assertEquals("win", rpsResult("paper", "rock"))
        assertEquals("win", rpsResult("scissors", "paper"))
        assertEquals("tie", rpsResult("rock", "rock"))
        assertEquals("lose", rpsResult("scissors", "rock"))
    }

    @Test
    fun testTicTacToeWinningDetection() {
        fun checkWinner(b: List<String?>): String? {
            val lines = listOf(
                listOf(0, 1, 2), listOf(3, 4, 5), listOf(6, 7, 8),
                listOf(0, 3, 6), listOf(1, 4, 7), listOf(2, 5, 8),
                listOf(0, 4, 8), listOf(2, 4, 6)
            )
            for (line in lines) {
                val (x, y, z) = line
                if (b[x] != null && b[x] == b[y] && b[y] == b[z]) {
                    return if (b[x] == "X") "me" else "partner"
                }
            }
            if (b.all { it != null }) return "draw"
            return null
        }

        val winningBoard = listOf("X", "X", "X", "O", "O", null, null, null, null)
        assertEquals("me", checkWinner(winningBoard))

        val drawBoard = listOf("X", "O", "X", "X", "O", "O", "O", "X", "X")
        assertEquals("draw", checkWinner(drawBoard))
    }
}
