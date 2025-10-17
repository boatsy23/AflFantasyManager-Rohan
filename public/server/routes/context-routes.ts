import express from "express";
import { MasterDataService } from "../services/MasterDataService";

const router = express.Router();

/**
 * Bye Round Optimizer - Get players for bye round planning
 */
router.get("/bye-optimizer", async (req, res) => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    // Group players by team for bye round planning
    const teamGroups = players.reduce((acc, player) => {
      if (!acc[player.team]) {
        acc[player.team] = [];
      }
      acc[player.team].push(player);
      return acc;
    }, {} as Record<string, any[]>);

    const byeData = Object.entries(teamGroups).map(([team, teamPlayers]) => ({
      team,
      playerCount: teamPlayers.length,
      topPlayers: teamPlayers
        .sort((a, b) => b.average_points - a.average_points)
        .slice(0, 3),
      byeRound: 0 // TODO: Load actual bye rounds from AFL fixture data
    }));

    res.json({
      success: true,
      data: byeData
    });
  } catch (error) {
    console.error("Error fetching bye optimizer data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bye optimizer data"
    });
  }
});

/**
 * Venue Bias Detector - Get venue performance data
 */
router.get("/venue-bias", async (req, res) => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    // Get players with venue-specific data
    const venueBiasData = players
      .filter(p => p.venue_factor && p.venue_factor !== 1.0)
      .map(player => ({
        name: player.name,
        team: player.team,
        position: player.position,
        nextVenue: player.nextVenue,
        venueFactor: player.venue_factor,
        lastAtVenue: player.lastAtVenue,
        avgAtVenue: player.avg_score_at_venue
      }))
      .slice(0, 20);

    res.json({
      success: true,
      data: venueBiasData
    });
  } catch (error) {
    console.error("Error fetching venue bias data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get venue bias data"
    });
  }
});

export default router;