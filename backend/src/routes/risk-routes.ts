import express from "express";
import { MasterDataService } from "../services/MasterDataService";

const router = express.Router();

/**
 * Consistency Score - Get player consistency ratings
 */
router.get("/consistency", async (req, res) => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    const consistencyData = players
      .filter(p => p.consistency_rating && p.standard_deviation)
      .map(player => ({
        name: player.name,
        team: player.team,
        position: player.position,
        consistencyRating: player.consistency_rating,
        standardDeviation: player.standard_deviation,
        highScore: player.high_score,
        lowScore: player.low_score,
        averagePoints: player.average_points
      }))
      .sort((a, b) => b.consistencyRating - a.consistencyRating);

    res.json({
      success: true,
      data: consistencyData
    });
  } catch (error) {
    console.error("Error fetching consistency data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get consistency data"
    });
  }
});

/**
 * Injury Risk - Get players with injury risk factors
 */
router.get("/injury", async (req, res) => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    // Calculate injury risk based on games played vs expected
    const injuryRiskData = players
      .filter(p => p.games_played < 15) // Players who have missed games
      .map(player => ({
        name: player.name,
        team: player.team,
        position: player.position,
        gamesPlayed: player.games_played,
        gamesMissed: 22 - player.games_played, // Assuming 22 round season
        averagePoints: player.average_points,
        riskLevel: player.games_played < 10 ? 'high' : 'medium'
      }))
      .sort((a, b) => a.gamesPlayed - b.gamesPlayed);

    res.json({
      success: true,
      data: injuryRiskData
    });
  } catch (error) {
    console.error("Error fetching injury risk data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get injury risk data"
    });
  }
});

export default router;