import { Router } from "express";
import { z } from "zod";
import { db } from "../utils/db";
import { players } from "@shared/schema";
import { ilike, desc, sql } from "drizzle-orm";

// Score Projector Service - uses database instead of JSON files
class ScoreProjector {
  async calculateProjectedScore(playerName: string, round: number = 21) {
    const playerData = await db.select().from(players).where(
      ilike(players.name, playerName)
    ).limit(1);
    
    if (!playerData || playerData.length === 0) {
      return null;
    }
    
    const player = playerData[0];
    
    return {
      playerName: player.name,
      team: player.team,
      position: player.position,
      round: round,
      projectedScore: player.projectedScore || player.averagePoints || 0,
      averagePoints: player.averagePoints || 0,
      lastScore: player.lastScore || 0,
      l3Average: player.l3Average || player.averagePoints || 0,
      l5Average: player.l5Average || player.averagePoints || 0,
      consistency: player.consistency || 0,
      ceiling: player.highScore || 0,
      floor: player.lowScore || 0
    };
  }
  
  async calculateBatchProjections(playerNames: string[], round: number = 21) {
    const projections = [];
    
    for (const name of playerNames) {
      const projection = await this.calculateProjectedScore(name, round);
      if (projection) {
        projections.push(projection);
      }
    }
    
    return projections;
  }
  
  async getTopProjectedScorers(count: number = 20, round: number = 20) {
    const topPlayers = await db.select().from(players)
      .orderBy(desc(players.projectedScore))
      .limit(count);
    
    return topPlayers.map(player => ({
      playerName: player.name,
      team: player.team,
      position: player.position,
      round: round,
      projectedScore: player.projectedScore || player.averagePoints || 0,
      averagePoints: player.averagePoints || 0,
      price: player.price || 0
    }));
  }
  
  async getAllProjections(round: number = 20) {
    const allPlayers = await db.select().from(players)
      .orderBy(desc(players.projectedScore));
    
    return allPlayers.map(player => ({
      playerName: player.name,
      team: player.team,
      position: player.position,
      round: round,
      projectedScore: player.projectedScore || player.averagePoints || 0,
      averagePoints: player.averagePoints || 0,
      price: player.price || 0
    }));
  }

  async getAllPlayerProjections(round: number = 20) {
    return this.getAllProjections(round);
  }
}

const router = Router();

// Initialize the score projector
const scoreProjector = new ScoreProjector();

// Validation schemas
const singleProjectionSchema = z.object({
  playerName: z.string().min(1),
  round: z.number().int().min(1).max(24).optional().default(21)
});

const batchProjectionSchema = z.object({
  playerNames: z.array(z.string().min(1)).min(1).max(50),
  round: z.number().int().min(1).max(24).optional().default(21)
});

const topScorersSchema = z.object({
  count: z.number().int().min(1).max(100).optional().default(20),
  round: z.number().int().min(1).max(24).optional().default(20)
});

const allPlayersSchema = z.object({
  round: z.number().int().min(1).max(24).optional().default(20)
});

/**
 * Get projected score for a single player
 * POST /api/score-projection/player
 */
router.post("/player", async (req, res) => {
  try {
    const { playerName, round } = singleProjectionSchema.parse(req.body);
    
    const projection = await scoreProjector.calculateProjectedScore(playerName, round);
    
    if (!projection) {
      return res.status(404).json({
        success: false,
        error: `Player '${playerName}' not found`
      });
    }
    
    res.json({
      success: true,
      data: projection
    });
  } catch (error) {
    console.error("Single projection error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

/**
 * Get projected scores for multiple players
 * POST /api/score-projection/batch
 */
router.post("/batch", async (req, res) => {
  try {
    const { playerNames, round } = batchProjectionSchema.parse(req.body);
    
    const projections = await scoreProjector.calculateBatchProjections(playerNames, round);
    
    res.json({
      success: true,
      data: projections,
      meta: {
        requested: playerNames.length,
        found: projections.length,
        round
      }
    });
  } catch (error) {
    console.error("Batch projection error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

/**
 * Get projected scores for all players
 * GET /api/score-projection/all-players
 */
router.get("/all-players", async (req, res) => {
  try {
    const round = req.query.round ? parseInt(req.query.round as string) : 20;
    
    if (isNaN(round) || round < 1 || round > 24) {
      return res.status(400).json({
        success: false,
        error: "Invalid round number (1-24)"
      });
    }
    
    const allProjections = await scoreProjector.getAllPlayerProjections(round);
    
    res.json({
      success: true,
      data: allProjections,
      meta: {
        count: allProjections.length,
        round: round,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("All players projection error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get all player projections"
    });
  }
});

/**
 * Get top projected scorers for a round
 * GET /api/score-projection/top-scorers
 */
router.get("/top-scorers", async (req, res) => {
  try {
    const query = topScorersSchema.parse({
      count: req.query.count ? parseInt(req.query.count as string) : undefined,
      round: req.query.round ? parseInt(req.query.round as string) : undefined
    });
    
    const topScorers = await scoreProjector.getTopProjectedScorers(query.count, query.round);
    
    res.json({
      success: true,
      data: topScorers,
      meta: {
        count: topScorers.length,
        round: query.round,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Top scorers error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

/**
 * Get all projections (alias for all-players)
 * GET /api/score-projection/all-projections
 */
router.get("/all-projections", async (req, res) => {
  try {
    const round = req.query.round ? parseInt(req.query.round as string) : 20;
    
    if (isNaN(round) || round < 1 || round > 24) {
      return res.status(400).json({
        success: false,
        error: "Invalid round number (1-24)"
      });
    }
    
    const allProjections = await scoreProjector.getAllProjections(round);
    
    res.json({
      success: true,
      data: allProjections,
      meta: {
        count: allProjections.length,
        round: round,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("All projections error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get projections"
    });
  }
});

export default router;
