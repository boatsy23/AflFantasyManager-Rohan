import express from "express";
import MasterDataService from "./services/MasterDataService";
import { predictPlayerPrice, estimatePriceCeilingFloor, analyzePriceTrends, predictNextPriceChange } from "./fantasy-tools/price-tools";

const priceApi = express.Router();

// Price projection for specific player
priceApi.get("/projection", async (req, res) => {
  try {
    const playerName = req.query.player as string;
    if (!playerName) {
      return res.status(400).json({ 
        status: "error", 
        message: "Player name required" 
      });
    }

    const playerData = await MasterDataService.getDataForTool('price', playerName);
    if (!playerData) {
      return res.status(404).json({ 
        status: "error", 
        message: "Player not found" 
      });
    }

    // Generate projected scores for next 5 rounds
    const projectedScores = Array(5).fill(playerData.projectedScore).map(score => 
      score + (Math.random() - 0.5) * 10 // Add realistic variance
    );

    const result = predictPlayerPrice(playerData, projectedScores);
    res.json({ 
      status: "ok", 
      data: result 
    });
  } catch (error) {
    console.error("Error in price projection:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to calculate price projection" 
    });
  }
});

// Breakeven trend analysis
priceApi.get("/be-trend", async (req, res) => {
  try {
    const playerName = req.query.player as string;
    if (!playerName) {
      return res.status(400).json({ 
        status: "error", 
        message: "Player name required" 
      });
    }

    const playerData = await MasterDataService.getDataForTool('price', playerName);
    if (!playerData) {
      return res.status(404).json({ 
        status: "error", 
        message: "Player not found" 
      });
    }

    const result = predictNextPriceChange(playerData);
    res.json({ 
      status: "ok", 
      data: {
        player: playerData.name,
        current_breakeven: playerData.breakeven,
        projected_score: playerData.projectedScore,
        will_hit_breakeven: playerData.projectedScore >= playerData.breakeven,
        price_change_expected: result.projectedChange,
        recommendation: result.recommendation
      }
    });
  } catch (error) {
    console.error("Error in breakeven trend:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to analyze breakeven trend" 
    });
  }
});

// Price recovery predictor
priceApi.get("/recovery", async (req, res) => {
  try {
    const playerName = req.query.player as string;
    if (!playerName) {
      return res.status(400).json({ 
        status: "error", 
        message: "Player name required" 
      });
    }

    const playerData = await MasterDataService.getDataForTool('price', playerName);
    if (!playerData) {
      return res.status(404).json({ 
        status: "error", 
        message: "Player not found" 
      });
    }

    const result = estimatePriceCeilingFloor(playerData);
    res.json({ 
      status: "ok", 
      data: {
        player: playerData.name,
        current_price: playerData.price,
        potential_ceiling: result.ceilingPrice,
        potential_floor: result.floorPrice,
        upside_potential: result.potentialGain,
        downside_risk: result.potentialLoss,
        recovery_outlook: result.recommendation
      }
    });
  } catch (error) {
    console.error("Error in price recovery:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to predict price recovery" 
    });
  }
});

// Price vs score scatter data
priceApi.get("/scatter", async (req, res) => {
  try {
    const position = req.query.position as string;
    let players = await MasterDataService.getAllPlayers();
    
    if (position) {
      players = players.filter(p => p.position === position);
    }

    const scatterData = players.map(player => ({
      name: player.name,
      price: player.price,
      average_score: player.average_points,
      projected_score: player.projected_score,
      value_ratio: player.average_points / (player.price / 100000),
      efficiency: player.points_per_minute
    }));

    res.json({ 
      status: "ok", 
      data: scatterData 
    });
  } catch (error) {
    console.error("Error in price scatter:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to generate scatter data" 
    });
  }
});

// Value ranker by position
priceApi.get("/value-rank", async (req, res) => {
  try {
    const position = req.query.position as string || "MID";
    const players = await MasterDataService.searchPlayers({ position });
    
    const rankedPlayers = players
      .map(player => ({
        name: player.name,
        team: player.team,
        price: player.price,
        average_points: player.average_points,
        projected_score: player.projected_score,
        value_ratio: player.average_points / (player.price / 100000),
        ownership: player.ownership_percentage,
        value_rating: player.value_rating
      }))
      .sort((a, b) => b.value_ratio - a.value_ratio)
      .slice(0, 20);

    res.json({ 
      status: "ok", 
      data: rankedPlayers 
    });
  } catch (error) {
    console.error("Error in value ranking:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to rank players by value" 
    });
  }
});

export default priceApi;