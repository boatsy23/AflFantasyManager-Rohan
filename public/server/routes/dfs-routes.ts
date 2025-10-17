import { Router } from "express";
import { storage } from "../storage";
import { insertDfsPlayerSchema } from "@shared/schema";

const router = Router();

// GET /api/dfs/players - Get all DFS players
router.get("/players", async (req, res) => {
  try {
    const {team, position, search} = req.query;
    
    let players;
    
    if (search && typeof search === 'string') {
      players = await storage.searchDfsPlayers(search);
    } else if (team && typeof team === 'string') {
      players = await storage.getDfsPlayersByTeam(team);
    } else if (position && typeof position === 'string') {
      players = await storage.getDfsPlayersByPosition(position);
    } else {
      players = await storage.getAllDfsPlayers();
    }
    
    res.json(players);
  } catch (error) {
    console.error("Error fetching DFS players:", error);
    res.status(500).json({
      error: "Failed to fetch DFS players",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/dfs/players/:id - Get a single DFS player by internal ID
router.get("/players/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }
    
    const player = await storage.getDfsPlayer(id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    
    res.json(player);
  } catch (error) {
    console.error("Error fetching DFS player:", error);
    res.status(500).json({
      error: "Failed to fetch DFS player",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/dfs/players/dfs-id/:dfsPlayerId - Get player by DFS ID (CD_I format)
router.get("/players/dfs-id/:dfsPlayerId", async (req, res) => {
  try {
    const dfsPlayerId = req.params.dfsPlayerId;
    
    const player = await storage.getDfsPlayerByDfsId(dfsPlayerId);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    
    res.json(player);
  } catch (error) {
    console.error("Error fetching DFS player by DFS ID:", error);
    res.status(500).json({
      error: "Failed to fetch DFS player",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/dfs/players - Create or update a DFS player
router.post("/players", async (req, res) => {
  try {
    const validationResult = insertDfsPlayerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid player data",
        details: validationResult.error.errors
      });
    }
    
    const player = await storage.upsertDfsPlayer(validationResult.data);
    res.json(player);
  } catch (error) {
    console.error("Error creating/updating DFS player:", error);
    res.status(500).json({
      error: "Failed to create/update DFS player",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/dfs/players/bulk - Bulk create/update DFS players
router.post("/players/bulk", async (req, res) => {
  try {
    const players = req.body;
    
    if (!Array.isArray(players)) {
      return res.status(400).json({ error: "Request body must be an array of players" });
    }
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < players.length; i++) {
      try {
        const validationResult = insertDfsPlayerSchema.safeParse(players[i]);
        
        if (!validationResult.success) {
          errors.push({
            index: i,
            player: players[i],
            error: validationResult.error.errors
          });
          continue;
        }
        
        const player = await storage.upsertDfsPlayer(validationResult.data);
        results.push(player);
      } catch (error) {
        errors.push({
          index: i,
          player: players[i],
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    res.json({
      success: results.length,
      errors: errors.length,
      results,
      errorDetails: errors
    });
  } catch (error) {
    console.error("Error bulk creating/updating DFS players:", error);
    res.status(500).json({
      error: "Failed to bulk create/update DFS players",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/dfs/stats - Get aggregated stats
router.get("/stats", async (req, res) => {
  try {
    const players = await storage.getAllDfsPlayers();
    
    const stats = {
      totalPlayers: players.length,
      byTeam: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      topAverages: players
        .filter(p => p.avg2025 !== null)
        .sort((a, b) => (b.avg2025 || 0) - (a.avg2025 || 0))
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          dfsPlayerId: p.dfsPlayerId,
          name: p.name,
          team: p.team,
          position: p.position,
          avg2025: p.avg2025
        }))
    };
    
    // Count by team
    players.forEach(p => {
      stats.byTeam[p.team] = (stats.byTeam[p.team] || 0) + 1;
    });
    
    // Count by position
    players.forEach(p => {
      stats.byPosition[p.position] = (stats.byPosition[p.position] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching DFS stats:", error);
    res.status(500).json({
      error: "Failed to fetch DFS stats",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;