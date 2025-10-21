import express from "express";
import { MasterDataService } from "../services/MasterDataService";

const router = express.Router();

/**
 * AI Captain Advisor - Get captain recommendations
 */
router.get("/captain-advisor", async (req, res) => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    // Filter for high-scoring midfielders and forwards suitable for captaincy
    const captainCandidates = players
      .filter(p => p.average_points > 80 && (p.position === 'MID' || p.position === 'FWD'))
      .sort((a, b) => b.projected_score - a.projected_score)
      .slice(0, 10);

    res.json({
      success: true,
      data: captainCandidates
    });
  } catch (error) {
    console.error("Error fetching AI captain advisor data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get captain recommendations"
    });
  }
});

/**
 * AI Trade Suggestions - Get trade recommendations
 */
router.get("/trade-suggestions", async (req, res) => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    // Get players with good value and low breakevens for trade suggestions
    const tradeSuggestions = players
      .filter(p => p.break_even < 80 && p.value_index > 0.5)
      .sort((a, b) => b.value_index - a.value_index)
      .slice(0, 15);

    res.json({
      success: true,
      data: tradeSuggestions
    });
  } catch (error) {
    console.error("Error fetching AI trade suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get trade suggestions"
    });
  }
});

/**
 * Team Structure Analyzer - Analyze team composition by price brackets
 */
router.get("/team_structure_analyzer", async (req, res) => {
  try {
    // Mock team structure data for now
    const teamStructure = {
      rookies: 8,      // Players under $300k
      mid_pricers: 12, // Players $300k-$600k
      premiums: 10,    // Players over $600k
      team_value: 12500000, // Total team value
      analysis: {
        balance_score: 75,
        recommendations: [
          "Good balance between rookies and premiums",
          "Consider upgrading 1-2 mid-pricers to premiums",
          "Maintain current rookie count for cash generation"
        ]
      }
    };

    res.json({
      success: true,
      data: teamStructure
    });
  } catch (error) {
    console.error("Error analyzing team structure:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze team structure"
    });
  }
});

export default router;