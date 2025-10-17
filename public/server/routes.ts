import type { Express } from "express";
import { createServer, type Server } from "http";
import MasterDataService from "./services/MasterDataService";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { z } from "zod";
import { aflFantasyAPI } from "./afl-fantasy-api";

// Import fantasy routes
import { registerFantasyRoutes } from "./fantasy-routes";
import roleApi from "./role-api";
import captainApi from "./captain-api";
import priceApi from "./price-api";
import fixtureApi from "./fixture-api";
import contextApi from "./context-api";
import teamApi from "./team-api";
import statsRoutes from "./routes/stats-routes";
import aflDataRoutes from "./routes/afl-data-routes";
import dataIntegrationRoutes from "./routes/data-integration-routes";
import championDataRoutes from "./routes/champion-data-routes";
import statsToolsRoutes from "./routes/stats-tools-routes";
import algorithmRoutes from "./routes/algorithm-routes";
import scoreProjectionRoutes from "./routes/score-projection-routes";
import pricePredictionRoutes from "../../src/server/routes/price-prediction-routes";
import masterStatsRoutes from './routes/master-stats-routes';
import aiRoutes from './routes/ai-routes';
// Alert routes removed
import contextRoutes from './routes/context-routes';
import riskRoutes from './routes/risk-routes';
import dfsRoutes from './routes/dfs-routes';
import dvpRoutes from './routes/dvp-routes';
import { roundDataProcessor } from './round-data-processor';
import multer from 'multer';

// Trade score API proxy endpoint
import axios from 'axios';

export async function registerRoutes(app: Express): Promise<Server> {
  // Register fantasy tools routes
  registerFantasyRoutes(app);
  
  // Register DFS player data routes
  app.use('/api/dfs', dfsRoutes);
  console.log("DFS player data API registered");
  
  // GET /api/players/round/:round - Get player stats for a specific round
  app.get("/api/players/round/:round", async (req, res) => {
    try {
      const round = parseInt(req.params.round);
      if (isNaN(round) || round < 0 || round > 23) {
        return res.status(400).json({ error: 'Invalid round number' });
      }
      
      const { db } = await import('./db');
      const { players, playerRoundScores, playerRoundStats } = await import('@shared/schema');
      const { eq, desc, and } = await import('drizzle-orm');
      
      // Load master stats for season-level role stats fallback
      const fs = await import('fs');
      const path = await import('path');
      const masterStatsPath = path.join(process.cwd(), 'public/server/data/master_player_stats.json');
      const masterStatsData = JSON.parse(fs.readFileSync(masterStatsPath, 'utf-8'));
      const masterStatsMap = new Map(masterStatsData.players.map((p: any) => [p.name, p]));
      
      // Volatility stats are now stored in the database
      // Use public/server/scripts/calculate-volatility-stats.ts to recalculate if needed
      
      // Get round scores joined with player info and round-specific match stats
      const roundData = await db
        .select({
          id: players.id,
          name: players.name,
          position: players.position,
          team: players.team,
          price: playerRoundScores.price,
          averagePoints: players.averagePoints,
          lastScore: playerRoundScores.score,
          projectedScore: players.projectedScore,
          breakEven: playerRoundScores.breakEven,
          l3Average: players.l3Average,
          l5Average: players.l5Average,
          priceChange: playerRoundScores.priceChange,
          pricePerPoint: players.pricePerPoint,
          totalPoints: players.totalPoints,
          selectionPercentage: players.selectionPercentage,
          roundsPlayed: players.roundsPlayed,
          value: playerRoundScores.value,
          // Round-specific match stats from player_round_stats
          roundKicks: playerRoundStats.kicks,
          roundHandballs: playerRoundStats.handballs,
          roundDisposals: playerRoundStats.disposals,
          roundMarks: playerRoundStats.marks,
          roundTackles: playerRoundStats.tackles,
          roundCba: playerRoundStats.cba,
          roundKickIns: playerRoundStats.kickIns,
          roundTog: playerRoundStats.timeOnGround,
          // Season averages from players table (used as fallback or for hitouts)
          seasonKicks: players.kicks,
          seasonHandballs: players.handballs,
          seasonDisposals: players.disposals,
          seasonMarks: players.marks,
          seasonTackles: players.tackles,
          seasonHitouts: players.hitouts,
          seasonCba: players.cba,
          seasonKickIns: players.kickIns,
          // Volatility stats from database (season-level)
          consistency: players.consistency,
          lowScore: players.lowScore,
          highScore: players.highScore,
        })
        .from(playerRoundScores)
        .innerJoin(players, eq(players.id, playerRoundScores.playerId))
        .leftJoin(playerRoundStats, and(
          eq(playerRoundStats.playerId, players.id),
          eq(playerRoundStats.round, round)
        ))
        .where(eq(playerRoundScores.round, round))
        .orderBy(desc(playerRoundScores.score));
      
      // Calculate value rating from numeric value
      // Value metric = average points / (price / 100k)
      // Higher value = better value for money (more points per $100k)
      // Thresholds based on data distribution (P15 = 9.1, P85 = 11.1):
      // - Top 15% (≥11.1): Undervalued
      // - Bottom 15% (≤9.1): Overpriced
      // - Middle 70%: Neutral (no badge)
      const enrichedData = roundData.map(player => {
        let valueRating = undefined;
        let valueIndex = player.value;
        
        if (player.value !== null && player.value !== undefined) {
          if (player.value >= 11.1) {
            valueRating = 'Undervalued';
          } else if (player.value <= 9.1) {
            valueRating = 'Overpriced';
          }
        }
        
        // Get season-level role stats from master stats JSON (fallback when DB is null)
        const masterStats = masterStatsMap.get(player.name);
        const seasonCba = player.seasonCba ?? (masterStats?.cba_percentage != null ? Math.round(masterStats.cba_percentage) : null);
        const seasonKickIns = player.seasonKickIns ?? (masterStats?.kick_ins != null ? Math.round(masterStats.kick_ins) : null);
        const seasonTog = masterStats?.time_on_ground != null ? Math.round(masterStats.time_on_ground) : null;
        
        const finalCba = player.roundCba ?? seasonCba;
        const finalKickIns = player.roundKickIns ?? seasonKickIns;
        const finalTog = player.roundTog ?? seasonTog;
        
        // Use round-specific stats if available, otherwise fall back to season averages
        return {
          ...player,
          valueIndex,
          valueRating,
          kicks: player.roundKicks ?? player.seasonKicks,
          handballs: player.roundHandballs ?? player.seasonHandballs,
          disposals: player.roundDisposals ?? player.seasonDisposals,
          marks: player.roundMarks ?? player.seasonMarks,
          tackles: player.roundTackles ?? player.seasonTackles,
          hitouts: player.seasonHitouts, // Always use season average for hitouts (not in DFS round data)
          cba: finalCba,
          kickIns: finalKickIns,
          tog: finalTog,
          // Volatility stats from database (season-level, not affected by round selection)
          lowScore: player.lowScore,
          highScore: player.highScore,
          consistency: player.consistency,
        };
      });
      
      res.json(enrichedData);
    } catch (error) {
      console.error('Error fetching round data:', error);
      res.status(500).json({ error: 'Failed to fetch round data' });
    }
  });
  
  // Register role analysis API routes
  app.use('/api/role-tools', roleApi);
  console.log("Role analysis tools API registered");
  
  // Register captain selection tools API routes
  app.use('/api/captains', captainApi);
  console.log("Captain selection tools API registered");
  
  // Register price analysis tools API routes
  app.use('/api/price-tools', priceApi);
  console.log("Price analysis tools API registered");
  
  // Register fixture analysis tools API routes
  app.use('/api/fixture', fixtureApi);
  console.log("Fixture analysis tools API registered");
  
  // Register context analysis tools API routes
  app.use('/api/context', contextApi);
  console.log("Context analysis tools API registered");
  
  // GET /api/team/fantasy-data - Returns the complete JSON from afl_fantasy_team.json file
  app.get("/api/team/fantasy-data", async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'afl_fantasy_team.json');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Fantasy team data not found',
          message: 'The afl_fantasy_team.json file does not exist'
        });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fantasyTeamData = JSON.parse(fileContent);
      
      res.json(fantasyTeamData);
    } catch (error) {
      console.error('Error reading afl_fantasy_team.json:', error);
      res.status(500).json({
        error: 'Failed to read fantasy team data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // GET /api/team/trade-history - Returns trade history from historical rounds
  app.get("/api/team/trade-history", async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'afl_fantasy_team.json');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Fantasy team data not found',
          message: 'The afl_fantasy_team.json file does not exist'
        });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fantasyTeamData = JSON.parse(fileContent);
      
      // Extract trade history from historical rounds
      const tradeHistory = (fantasyTeamData.historicalRounds || [])
        .filter((round: any) => round.trades) // Only include rounds with trades
        .map((round: any) => ({
          round: round.round,
          tradedOut: round.trades.tradedOut || [],
          tradedIn: round.trades.tradedIn || []
        }));
      
      res.json(tradeHistory);
    } catch (error) {
      console.error('Error reading trade history:', error);
      res.status(500).json({
        error: 'Failed to read trade history',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // POST /api/team/fantasy-data/roles - Update captain/vice-captain roles
  app.post("/api/team/fantasy-data/roles", async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'afl_fantasy_team.json');
      
      // Validate request body
      const roleSchema = z.object({
        playerId: z.string(),
        role: z.enum(['captain', 'viceCaptain', 'none'])
      });
      
      const validationResult = roleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid request body',
          message: validationResult.error.errors
        });
      }
      
      const { playerId, role } = validationResult.data;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Fantasy team data not found',
          message: 'The afl_fantasy_team.json file does not exist'
        });
      }
      
      // Read the current data
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fantasyTeamData = JSON.parse(fileContent);
      
      // Access currentRound data
      if (!fantasyTeamData.currentRound) {
        return res.status(400).json({
          error: 'Invalid data structure',
          message: 'Current round data not found in team JSON'
        });
      }
      
      // Get all position arrays from currentRound
      const positionArrays = ['defenders', 'midfielders', 'forwards', 'rucks'];
      const benchArrays = ['defenders', 'midfielders', 'forwards', 'rucks', 'utility'];
      
      // Helper to process players in arrays
      const processPlayers = (players: any[], action: 'remove' | 'update', targetPlayerId?: string) => {
        players.forEach((player: any) => {
          if (action === 'remove') {
            if (role === 'captain') {
              delete player.isCaptain;
            } else {
              delete player.isViceCaptain;
            }
          } else if (action === 'update' && player.playerName === targetPlayerId) {
            if (role === 'captain') {
              player.isCaptain = true;
              delete player.isViceCaptain;
            } else if (role === 'viceCaptain') {
              player.isViceCaptain = true;
              delete player.isCaptain;
            } else {
              delete player.isCaptain;
              delete player.isViceCaptain;
            }
          }
        });
      };
      
      // First, remove the role from all players to ensure only one captain/vice-captain
      if (role === 'captain' || role === 'viceCaptain') {
        // Remove from field players
        for (const positionKey of positionArrays) {
          if (Array.isArray(fantasyTeamData.currentRound[positionKey])) {
            processPlayers(fantasyTeamData.currentRound[positionKey], 'remove');
          }
        }
        // Remove from bench players
        if (fantasyTeamData.currentRound.bench) {
          for (const benchKey of benchArrays) {
            if (Array.isArray(fantasyTeamData.currentRound.bench[benchKey])) {
              processPlayers(fantasyTeamData.currentRound.bench[benchKey], 'remove');
            }
          }
        }
      }
      
      // Find and update the target player
      let playerFound = false;
      
      // Search in field players
      for (const positionKey of positionArrays) {
        if (Array.isArray(fantasyTeamData.currentRound[positionKey])) {
          const player = fantasyTeamData.currentRound[positionKey].find((p: any) => p.playerName === playerId);
          if (player) {
            playerFound = true;
            if (role === 'captain') {
              player.isCaptain = true;
              delete player.isViceCaptain;
            } else if (role === 'viceCaptain') {
              player.isViceCaptain = true;
              delete player.isCaptain;
            } else {
              delete player.isCaptain;
              delete player.isViceCaptain;
            }
            break;
          }
        }
      }
      
      // Search in bench players if not found
      if (!playerFound && fantasyTeamData.currentRound.bench) {
        for (const benchKey of benchArrays) {
          if (Array.isArray(fantasyTeamData.currentRound.bench[benchKey])) {
            const player = fantasyTeamData.currentRound.bench[benchKey].find((p: any) => p.playerName === playerId);
            if (player) {
              playerFound = true;
              if (role === 'captain') {
                player.isCaptain = true;
                delete player.isViceCaptain;
              } else if (role === 'viceCaptain') {
                player.isViceCaptain = true;
                delete player.isCaptain;
              } else {
                delete player.isCaptain;
                delete player.isViceCaptain;
              }
              break;
            }
          }
        }
      }
      
      if (!playerFound) {
        return res.status(404).json({
          error: 'Player not found',
          message: `Player with ID ${playerId} not found in team data`
        });
      }
      
      // Update currentRound captain/viceCaptain strings (used by /api/team/lineup)
      if (role === 'captain') {
        fantasyTeamData.currentRound.captain = playerId;
        // If this player was vice-captain, remove that
        if (fantasyTeamData.currentRound.viceCaptain === playerId) {
          delete fantasyTeamData.currentRound.viceCaptain;
        }
      } else if (role === 'viceCaptain') {
        fantasyTeamData.currentRound.viceCaptain = playerId;
        // If this player was captain, remove that
        if (fantasyTeamData.currentRound.captain === playerId) {
          delete fantasyTeamData.currentRound.captain;
        }
      } else if (role === 'none') {
        // Remove the player from captain/viceCaptain if they were assigned
        if (fantasyTeamData.currentRound.captain === playerId) {
          delete fantasyTeamData.currentRound.captain;
        }
        if (fantasyTeamData.currentRound.viceCaptain === playerId) {
          delete fantasyTeamData.currentRound.viceCaptain;
        }
      }
      
      // Write the updated data back to the file
      fs.writeFileSync(filePath, JSON.stringify(fantasyTeamData, null, 2), 'utf8');
      
      console.log(`Updated role for ${playerId} to ${role}`);
      
      res.json({
        success: true,
        message: `Successfully updated ${playerId} role to ${role}`,
        data: fantasyTeamData
      });
    } catch (error) {
      console.error('Error updating player role:', error);
      res.status(500).json({
        error: 'Failed to update player role',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // GET /api/team/lineup - Returns lineup data with calculated stats
  app.get("/api/team/lineup", async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'afl_fantasy_team.json');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: 'error',
          message: 'Fantasy team data not found'
        });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fantasyData = JSON.parse(fileContent);
      const currentRound = fantasyData.currentRound;
      
      // Constants
      const SALARY_CAP = 13000000; // $13M salary cap
      
      // Helper function to get base trades for a round
      const getBaseTrades = (round: number): number => {
        // Bye rounds (12-16) have 3 trades, others have 2
        return (round >= 12 && round <= 16) ? 3 : 2;
      };
      
      // Collect all players from all positions (field + bench)
      const allPlayers = [
        ...(currentRound.defenders || []),
        ...(currentRound.midfielders || []),
        ...(currentRound.forwards || []),
        ...(currentRound.rucks || []),
        // Include bench players
        ...(currentRound.bench?.defenders || []),
        ...(currentRound.bench?.midfielders || []),
        ...(currentRound.bench?.forwards || []),
        ...(currentRound.bench?.rucks || []),
        ...(currentRound.bench?.utility || [])
      ];
      
      // Calculate Team Value (sum of all players' prices)
      const teamValue = allPlayers.reduce((sum, player) => {
        return sum + (player.priceRaw || 0);
      }, 0);
      
      // Get Remaining Salary from JSON (user's actual remaining salary)
      const remainingSalary = currentRound.remainingSalary || 0;
      
      // Calculate Projected Score
      // Sum of on-field players' projected scores + captain's projected score (doubled, so add once more)
      let projectedScore = 0;
      const onFieldPlayers = allPlayers.filter(p => p.fieldStatus === "On Field");
      
      // Add all on-field player projections
      projectedScore = onFieldPlayers.reduce((sum, player) => {
        return sum + (player.projectedScore || 0);
      }, 0);
      
      // Add captain's projection again (to double it)
      const captain = allPlayers.find(p => p.playerName === currentRound.captain);
      if (captain && captain.fieldStatus === "On Field") {
        projectedScore += (captain.projectedScore || 0);
      }
      
      // Calculate Trades Left (base trades for the round minus trades used)
      const baseTrades = getBaseTrades(currentRound.round);
      const tradesUsed = currentRound.tradesUsed || 0;
      const tradesLeft = Math.max(0, baseTrades - tradesUsed);
      
      // Transform player data for lineup components
      const transformPlayer = (player: any, position: string) => ({
        id: player.playerId || Math.random(),
        name: player.playerName,
        team: player.team,
        position: position,
        price: player.priceRaw,
        breakEven: player.breakEven,
        lastScore: player.lastRoundScore,
        averagePoints: player.seasonAverage,
        liveScore: player.score,
        projScore: player.projectedScore,
        l3Average: player.last3Average,
        nextOpponent: player.nextOpponent,
        isOnBench: player.fieldStatus !== "On Field",
        isCaptain: player.playerName === currentRound.captain,
        isViceCaptain: player.playerName === currentRound.viceCaptain
      });
      
      // Separate players by position and field status
      const lineupData = {
        defenders: (currentRound.defenders || []).map((p: any) => transformPlayer(p, 'DEF')),
        midfielders: (currentRound.midfielders || []).map((p: any) => transformPlayer(p, 'MID')),
        forwards: (currentRound.forwards || []).map((p: any) => transformPlayer(p, 'FWD')),
        rucks: (currentRound.rucks || []).map((p: any) => transformPlayer(p, 'RUC')),
        // Include bench players
        bench: {
          defenders: (currentRound.bench?.defenders || []).map((p: any) => transformPlayer(p, 'DEF')),
          midfielders: (currentRound.bench?.midfielders || []).map((p: any) => transformPlayer(p, 'MID')),
          forwards: (currentRound.bench?.forwards || []).map((p: any) => transformPlayer(p, 'FWD')),
          rucks: (currentRound.bench?.rucks || []).map((p: any) => transformPlayer(p, 'RUC')),
          utility: (currentRound.bench?.utility || []).map((p: any) => transformPlayer(p, 'UTIL'))
        }
      };
      
      res.json({
        status: 'success',
        data: {
          // Player lineup data
          ...lineupData,
          // Summary stats
          stats: {
            projectedScore: Math.round(projectedScore),
            liveScore: currentRound.roundScore || 0,
            teamValue: teamValue,
            remainingSalary: remainingSalary,
            tradesLeft: tradesLeft,
            overallRank: currentRound.overallRank || 0
          }
        }
      });
    } catch (error) {
      console.error('Error reading lineup data:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
  
  // Register team upload and management API routes
  app.use('/api/team', teamApi);
  console.log("Team management API registered");
  
  // Register Master Stats API routes (unified data source)
  app.use('/api/master-stats', masterStatsRoutes);
  console.log("Master Stats API registered");

  // Register stats API routes for FootyWire and DFS Australia data
  app.use('/api/stats', statsRoutes);
  console.log("Stats data API registered");
  
  // Register AFL Fantasy data routes for real player data
  app.use('/api/afl-data', aflDataRoutes);
  console.log("AFL Fantasy data API registered");
  
  // Register data integration routes for authenticated AFL Fantasy access
  app.use('/api/integration', dataIntegrationRoutes);
  console.log("Data integration API registered");
  
  // Register Champion Data AFL Sports API routes
  app.use('/api/champion-data', championDataRoutes);
  console.log("Champion Data API registered");
  
  // Register Stats and Tools API routes
  app.use('/api/stats-tools', statsToolsRoutes);
  console.log("Stats and Tools API registered");
  
  // Register Algorithm API routes for Price Predictor and Projected Score
  app.use('/api/algorithms', algorithmRoutes);
  console.log("Algorithm API routes registered");
  
  // Register Score Projection API routes (v3.4.4 algorithm with authentic data)
  app.use('/api/score-projection', scoreProjectionRoutes);
  console.log("Score projection API registered");
  
  // Register Price Prediction API routes (v2.1.0 algorithm with MasterDataService integration)
  app.use('/api/price-prediction', pricePredictionRoutes);
  console.log("Price prediction API registered");
  
  // Register new AI tools API routes
  app.use('/api/ai', aiRoutes);
  console.log("AI tools API registered");
  
  // Alert tools API routes removed
  
  // Register new Context tools API routes (separate from existing context API)
  app.use('/api/context-tools', contextRoutes);
  console.log("Context tools API registered");
  
  // Register new Risk tools API routes
  app.use('/api/risk', riskRoutes);
  console.log("Risk tools API registered");
  
  // Register DVP (Defense vs Position) API routes
  app.use('/api/dvp', dvpRoutes);
  console.log("DVP API registered");
  
  // AFL Fantasy Dashboard Data Endpoints
  app.get("/api/afl-fantasy/dashboard-data", async (req, res) => {
    try {
      console.log("Fetching AFL Fantasy dashboard data...");
      
      // Import and run the Python scraper
      const { spawn } = await import('child_process');
      
      const pythonProcess = spawn('python3', ['afl_fantasy_authenticated_scraper.py'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`AFL Fantasy scraper: ${data.toString().trim()}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`AFL Fantasy scraper error: ${data.toString().trim()}`);
      });
      
      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            // Read the generated data file
            const dataPath = path.join(process.cwd(), 'afl_fantasy_team_data.json');
            
            if (fs.existsSync(dataPath)) {
              const rawData = fs.readFileSync(dataPath, 'utf8');
              const data = JSON.parse(rawData);
              
              // Format for dashboard consumption
              const dashboardData = {
                team_value: {
                  total: data.team_value || 0,
                  player_count: data.player_count || 0,
                  remaining_salary: Math.max(0, 13000000 - (data.team_value || 0)),
                  formatted: `$${((data.team_value || 0) / 1000000).toFixed(1)}M`
                },
                team_score: {
                  total: data.team_score || 0,
                  captain_score: data.captain_score || 0,
                  change_from_last_round: data.score_change || 0
                },
                overall_rank: {
                  current: data.overall_rank || 0,
                  formatted: `${(data.overall_rank || 0).toLocaleString()}`,
                  change_from_last_round: data.rank_change || 0
                },
                captain: {
                  score: data.captain_score || 0,
                  ownership_percentage: data.captain_ownership || 0,
                  player_name: data.captain_name || 'Unknown'
                },
                last_updated: new Date().toISOString()
              };
              
              console.log("Successfully extracted AFL Fantasy data:", dashboardData);
              res.json(dashboardData);
            } else {
              throw new Error('AFL Fantasy data file not found');
            }
          } catch (parseError) {
            console.error('Error parsing AFL Fantasy data:', parseError);
            res.status(500).json({
              error: 'Failed to parse AFL Fantasy data',
              message: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
            });
          }
        } else {
          console.error(`AFL Fantasy scraper failed with code ${code}`);
          console.error('Error output:', error);
          res.status(500).json({
            error: 'AFL Fantasy scraper failed',
            message: error || 'Unknown error occurred'
          });
        }
      });
      
      // Set timeout for the scraper
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({
          error: 'AFL Fantasy scraper timeout',
          message: 'The scraper took too long to complete'
        });
      }, 60000); // 60 second timeout
      
    } catch (error) {
      console.error('Error in AFL Fantasy dashboard endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
  // Download endpoint for the zip file
  app.get("/download/afl-fantasy-platform.zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "afl-fantasy-platform.zip");
    
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ error: "Zip file not found" });
    }
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="afl-fantasy-platform.zip"');
    
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
  });

  // Add a proxy endpoint for trade score API
  app.post("/api/trade_score", async (req, res) => {
    try {
      const pythonApiUrl = "http://localhost:5001/api/trade_score";
      
      // Log the incoming request
      console.log("[express] Received trade score request:", req.body);
      
      try {
        // Try to proxy to the Python API
        const response = await axios.post(pythonApiUrl, req.body);
        res.status(response.status).json(response.data);
      } catch (proxyError) {
        // If Python API is not available, calculate a simple score
        console.warn("[express] Python API not available, using fallback trade score calculator");
        
        const { player_in, player_out } = req.body;
        
        // 1. Calculate scoring score - total projected score difference
        const totalProjIn = player_in.proj_scores.reduce((a: number, b: number) => a + b, 0);
        const totalProjOut = player_out.proj_scores.reduce((a: number, b: number) => a + b, 0);
        const scoringScore = totalProjIn - totalProjOut;
        
        // Calculate average projected scores for display
        const avgProjIn = totalProjIn / player_in.proj_scores.length;
        const avgProjOut = totalProjOut / player_out.proj_scores.length;
        const scoreDiff = avgProjIn - avgProjOut;

        // 2. Calculate price trends for both players
        // Magic number for price changes
        const magicNumber = 9750;
        
        // Simulate 5-round price trends
        const priceChangesIn: number[] = [];
        const priceChangesOut: number[] = [];
        
        for (let i = 0; i < 5; i++) {
          // For player_in: (score - breakeven) * (magic_number / 100)
          // Use projected score for the round or the average if index out of range
          const roundScoreIn = i < player_in.proj_scores.length 
            ? player_in.proj_scores[i] 
            : player_in.proj_scores.reduce((a: number, b: number) => a + b, 0) / player_in.proj_scores.length;
          
          const priceChangeIn = (roundScoreIn - player_in.breakeven) * (magicNumber / 100);
          priceChangesIn.push(priceChangeIn);
          
          // For player_out
          const roundScoreOut = i < player_out.proj_scores.length 
            ? player_out.proj_scores[i] 
            : player_out.proj_scores.reduce((a: number, b: number) => a + b, 0) / player_out.proj_scores.length;
            
          const priceChangeOut = (roundScoreOut - player_out.breakeven) * (magicNumber / 100);
          priceChangesOut.push(priceChangeOut);
        }
        
        // Calculate cash_score
        const cashScore = priceChangesIn.reduce((a, b) => a + b, 0) - priceChangesOut.reduce((a, b) => a + b, 0);
        
        // 3. Determine round weighting based on current round
        let scoringWeight = 0.5;
        let cashWeight = 0.5;
        
        const roundNumber = req.body.round_number || 8; // Default to round 8 if not provided
        
        // Set weights based on round number
        if (roundNumber <= 2) {  // Round 1-2
          scoringWeight = 0.5;
          cashWeight = 0.5;
        } else if (roundNumber <= 7) {  // Round 3-7
          scoringWeight = 0.3;
          cashWeight = 0.7;
        } else if (roundNumber <= 11) {  // Round 8-11
          scoringWeight = 0.5;
          cashWeight = 0.5;
        } else if (roundNumber <= 14) {  // Round 12-14
          scoringWeight = 0.7;
          cashWeight = 0.3;
        } else if (roundNumber <= 17) {  // Round 15-17
          scoringWeight = 0.6;
          cashWeight = 0.4;
        } else {  // Round 18+
          scoringWeight = 1.0;
          cashWeight = 0.0;
        }
        
        // 4. Adjust weights based on team value vs league average
        const teamValue = req.body.team_value || 15000000;
        const leagueAvgValue = req.body.league_avg_value || 15000000;
        const valueRatio = leagueAvgValue > 0 ? teamValue / leagueAvgValue : 1;
        
        // If team_value < league_avg_value, reduce scoring weight (focus more on cash)
        // If team_value > league_avg_value, increase scoring weight (focus more on points)
        if (valueRatio < 0.95) {  // Below average team value
          // Reduce scoring weight by up to 0.2, but not below 0.1
          const adjustment = Math.min(0.2, scoringWeight * 0.3);
          scoringWeight = Math.max(0.1, scoringWeight - adjustment);
          cashWeight = 1.0 - scoringWeight;
        } else if (valueRatio > 1.05) {  // Above average team value
          // Increase scoring weight by up to 0.2, but not above 0.9 (unless already 1.0)
          if (scoringWeight < 1.0) {
            const adjustment = Math.min(0.2, cashWeight * 0.3);
            scoringWeight = Math.min(0.9, scoringWeight + adjustment);
            cashWeight = 1.0 - scoringWeight;
          }
        }
        
        // 5. Calculate overall score
        // Normalize cash_score by dividing by 10000 for comparison with points
        const cashScoreNormalized = cashScore / 10000;
        const overallScore = (scoringScore * scoringWeight) + (cashScoreNormalized * cashWeight);
        
        // Scale overall_score to 0-100 range
        const scalingFactor = 5.0;  // Assuming most overall_scores are in range -10 to +10
        const normalizedScore = 50 + (overallScore * scalingFactor);
        const tradeScore = Math.max(0, Math.min(100, normalizedScore));
        
        // Generate explanations
        const explanations = [
          `Player coming in projected to score ${scoreDiff > 0 ? scoreDiff.toFixed(1) + ' points more' : (-scoreDiff).toFixed(1) + ' points less'} per game`,
        ];
        
        const totalCashImpact = priceChangesIn.reduce((a, b) => a + b, 0) - priceChangesOut.reduce((a, b) => a + b, 0);
        if (totalCashImpact > 0) {
          explanations.push(`Projected to gain $${(totalCashImpact/1000).toFixed(1)}k in value over 5 rounds`);
        } else {
          explanations.push(`Projected to lose $${(-totalCashImpact/1000).toFixed(1)}k in value over 5 rounds`);
        }
        
        const priceDiff = player_in.price - player_out.price;
        if (priceDiff > 0) {
          explanations.push(`This trade costs $${(priceDiff/1000).toFixed(1)}k immediately`);
        } else {
          explanations.push(`This trade frees up $${(-priceDiff/1000).toFixed(1)}k immediately`);
        }
        
        // Round-specific context
        if (roundNumber <= 7) {
          explanations.push(`Round ${roundNumber}: Cash gain is weighted more heavily than scoring`);
        } else if (roundNumber >= 18) {
          explanations.push(`Round ${roundNumber}: Only scoring matters at this stage of the season`);
        }
        
        if (valueRatio < 0.95) {
          explanations.push(`Your team value is below league average: Cash gain is prioritized`);
        } else if (valueRatio > 1.05) {
          explanations.push(`Your team value is above league average: Scoring is prioritized`);
        }
        
        // Recommendation
        let recommendation = "Neutral trade, consider other options";
        if (tradeScore >= 80) recommendation = "Highly recommend this trade";
        else if (tradeScore >= 60) recommendation = "Good trade opportunity";
        else if (tradeScore < 40) recommendation = "Not recommended, look for better trades";
        
        // Classify players by price
        const classifyPlayerByPrice = (price: number): string => {
          if (price < 450000) return "rookie";
          else if (price < 800000) return "midpricer";
          else if (price < 1000000) return "underpriced_premium";
          else return "premium";
        };
        
        // Check if players have peaked
        const isPlayerPeaked = (projScores: number[], breakeven: number): boolean => {
          return (projScores.reduce((a, b) => a + b, 0) / projScores.length) < breakeven;
        };
        
        // Classify both players
        const playerInClass = classifyPlayerByPrice(player_in.price);
        const playerOutClass = classifyPlayerByPrice(player_out.price);
        
        // Check if they've peaked
        const playerInPeaked = isPlayerPeaked(player_in.proj_scores, player_in.breakeven);
        const playerOutPeaked = isPlayerPeaked(player_out.proj_scores, player_out.breakeven);
        
        // Add flags
        const flags = {
          peaked_rookie: (playerInClass === "rookie" && playerInPeaked) || 
                        (playerOutClass === "rookie" && playerOutPeaked),
          trading_peaked_player: playerOutPeaked,
          getting_peaked_player: playerInPeaked,
          player_in_class: playerInClass,
          player_out_class: playerOutClass
        };
        
        // Add additional explanations based on flags
        if (flags.peaked_rookie) {
          if (playerInClass === "rookie" && playerInPeaked) {
            explanations.push("Warning: You are trading for a rookie who may have peaked in value");
          }
          if (playerOutClass === "rookie" && playerOutPeaked) {
            explanations.push("Good: You are trading away a rookie who may have peaked in value");
          }
        }
        
        if (flags.getting_peaked_player) {
          explanations.push(`Warning: ${playerInClass.charAt(0).toUpperCase() + playerInClass.slice(1)} player coming in may have peaked (avg proj < breakeven)`);
        }
        
        if (flags.trading_peaked_player) {
          explanations.push(`Good: ${playerOutClass.charAt(0).toUpperCase() + playerOutClass.slice(1)} player going out may have peaked (avg proj < breakeven)`);
        }
        
        // Determine verdict based on raw overall_score
        let verdict = "Poor Choice";
        if (overallScore > 15) {
          verdict = "Perfect Timing";
        } else if (overallScore > 5) {
          verdict = "Solid Structure Trade";
        } else if (overallScore > 0) {
          verdict = "Risky Move";
        }
        
        // Calculate projected prices for both players
        const projectedPricesIn: number[] = [];
        const projectedPricesOut: number[] = [];
        
        // Start with current prices
        let currentPriceIn = player_in.price;
        let currentPriceOut = player_out.price;
        
        // Calculate projected prices over 5 rounds
        for (let i = 0; i < 5; i++) {
          currentPriceIn += Math.round(priceChangesIn[i]);
          currentPriceOut += Math.round(priceChangesOut[i]);
          projectedPricesIn.push(Math.round(currentPriceIn));
          projectedPricesOut.push(Math.round(currentPriceOut));
        }
        
        // Determine upgrade path flag
        let upgradePath = "neutral";
        if (player_in.price > player_out.price && avgProjIn > avgProjOut) {
          upgradePath = "upgrade";
        } else if (player_in.price < player_out.price && avgProjIn < avgProjOut) {
          upgradePath = "downgrade";
        }
        
        // Determine if this is good timing based on the season
        const seasonMatch = (roundNumber <= 7 && cashScore > 0) || (roundNumber >= 18 && scoringScore > 0);
        
        // Return fallback result with detailed analysis
        res.json({
          status: "ok",
          trade_score: parseFloat(tradeScore.toFixed(1)),
          scoring_score: parseFloat(scoringScore.toFixed(1)),
          cash_score: Math.round(cashScore),
          overall_score: parseFloat(overallScore.toFixed(1)),
          score_breakdown: {
            projected_score: parseFloat((scoreDiff * 7.5).toFixed(1)), // Scale score diff to match Python API
            value: 15.0, // Default value factor
            breakeven: 10.0, // Default breakeven factor
            risk: player_out.is_red_dot && !player_in.is_red_dot ? 10.0 : 
                 player_in.is_red_dot && !player_out.is_red_dot ? 0.0 : 5.0,
            scoring_weight: parseFloat((scoringWeight * 100).toFixed(1)),
            cash_weight: parseFloat((cashWeight * 100).toFixed(1))
          },
          price_projections: {
            player_in: priceChangesIn.map(change => Math.round(change)),
            player_out: priceChangesOut.map(change => Math.round(change)),
            net_gain: Math.round(cashScore)
          },
          projected_prices: {
            player_in: projectedPricesIn,
            player_out: projectedPricesOut
          },
          projected_scores: {
            player_in: player_in.proj_scores,
            player_out: player_out.proj_scores
          },
          flags: {
            ...flags,
            upgrade_path: upgradePath,
            season_match: seasonMatch
          },
          verdict,
          explanations,
          recommendation,
          _fallback: true
        });
      }
    } catch (error: any) {
      console.error("[express] Trade score API error:", error.message);
      res.status(500).json({ 
        status: "error", 
        message: `Failed to process trade score request: ${error.message}` 
      });
    }
  });
  // API endpoint to serve AFL Fantasy player data from scraped JSON
  app.get("/api/scraped-players", async (req, res) => {
    try {
      // Try to get the most complete player data from backup file first
      const backupPath = path.join(process.cwd(), 'player_data_backup_20250501_201717.json');
      const jsonPath = path.join(process.cwd(), 'player_data.json');
      
      let playerData: string;
      if (fs.existsSync(backupPath)) {
        // Use the backup file with all players
        playerData = fs.readFileSync(backupPath, 'utf8');
      } else if (fs.existsSync(jsonPath)) {
        // Fallback to regular player_data.json
        playerData = fs.readFileSync(jsonPath, 'utf8');
      } else {
        return res.status(404).json({ 
          message: "Player data file not found. Make sure the Python scraper has been run.",
          path: jsonPath
        });
      }
      
      const players = JSON.parse(playerData);
      
      // Apply filters if query parameters are present
      const query = req.query.q as string | undefined;
      const position = req.query.position as string | undefined;
      
      let filteredPlayers = players;
      
      if (query) {
        const queryLower = query.toLowerCase();
        filteredPlayers = players.filter((player: any) => 
          player.name?.toLowerCase().includes(queryLower) || 
          player.team?.toLowerCase().includes(queryLower)
        );
      }
      
      if (position) {
        filteredPlayers = filteredPlayers.filter((player: any) => 
          player.position?.toLowerCase() === position.toLowerCase()
        );
      }
      
      res.json(filteredPlayers);
    } catch (error) {
      console.error("Error reading player data:", error);
      res.status(500).json({ 
        message: "Failed to read player data from file",
        error: (error as Error).message 
      });
    }
  });
  
  // Original players route from database
  app.get("/api/players", async (req, res) => {
    // First try to get data from player_data.json if it exists
    try {
      const jsonPath = path.join(process.cwd(), 'player_data.json');
      
      if (fs.existsSync(jsonPath)) {
        const playerData = fs.readFileSync(jsonPath, 'utf8');
        const players = JSON.parse(playerData);
        
        // Apply filters if query parameters are present
        const query = req.query.q as string | undefined;
        const position = req.query.position as string | undefined;
        
        let filteredPlayers = players;
        
        if (query) {
          const queryLower = query.toLowerCase();
          filteredPlayers = players.filter((player: any) => 
            player.name?.toLowerCase().includes(queryLower) || 
            player.team?.toLowerCase().includes(queryLower)
          );
        }
        
        if (position) {
          filteredPlayers = filteredPlayers.filter((player: any) => 
            player.position?.toLowerCase() === position.toLowerCase()
          );
        }
        
        return res.json(filteredPlayers);
      }
    } catch (error) {
      console.error("Error reading player data from file, falling back to database:", error);
    }
    
    // If file doesn't exist or there's an error, fall back to database
    const query = req.query.q as string | undefined;
    const position = req.query.position as string | undefined;
    
    let players;
    if (query) {
      players = await storage.searchPlayers(query);
    } else if (position) {
      players = await storage.getPlayersByPosition(position);
    } else {
      players = await storage.getAllPlayers();
    }
    
    res.json(players);
  });

  app.get("/api/players/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }
    
    const player = await storage.getPlayer(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    
    res.json(player);
  });

  // Team routes
  app.get("/api/teams/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }
    
    const team = await storage.getTeam(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    res.json(team);
  });

  app.get("/api/teams/user/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const team = await storage.getTeamByUserId(userId);
    if (!team) {
      return res.status(404).json({ message: "Team not found for this user" });
    }
    
    res.json(team);
  });

  app.put("/api/teams/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const updatedTeam = await storage.updateTeam(id, req.body);
    if (!updatedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    res.json(updatedTeam);
  });

  // Team Players routes
  app.get("/api/teams/:teamId/players", async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }
    
    const players = await storage.getTeamPlayerDetails(teamId);
    res.json(players);
  });

  app.get("/api/teams/:teamId/players/:position", async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }
    
    const position = req.params.position;
    if (!["MID", "FWD", "DEF", "RUCK"].includes(position)) {
      return res.status(400).json({ message: "Invalid position" });
    }
    
    const players = await storage.getTeamPlayersByPosition(teamId, position);
    res.json(players);
  });

  app.post("/api/teams/:teamId/players", async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }
    
    const schema = z.object({
      playerId: z.number(),
      position: z.string(),
      isOnField: z.boolean().default(false)
    });
    
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: "Invalid request data", errors: validationResult.error.errors });
    }
    
    try {
      const teamPlayer = await storage.addPlayerToTeam({
        teamId,
        playerId: validationResult.data.playerId,
        position: validationResult.data.position,
        isOnField: validationResult.data.isOnField
      });
      
      res.status(201).json(teamPlayer);
    } catch (error) {
      res.status(500).json({ message: "Failed to add player to team" });
    }
  });

  app.delete("/api/teams/:teamId/players/:playerId", async (req, res) => {
    const teamId = Number(req.params.teamId);
    const playerId = Number(req.params.playerId);
    
    if (isNaN(teamId) || isNaN(playerId)) {
      return res.status(400).json({ message: "Invalid ID parameters" });
    }
    
    const success = await storage.removePlayerFromTeam(teamId, playerId);
    if (!success) {
      return res.status(404).json({ message: "Player not found in team" });
    }
    
    res.status(204).send();
  });

  // League routes
  app.get("/api/leagues/user/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const leagues = await storage.getLeaguesByUserId(userId);
    res.json(leagues);
  });

  app.get("/api/leagues/:leagueId/teams", async (req, res) => {
    const leagueId = Number(req.params.leagueId);
    if (isNaN(leagueId)) {
      return res.status(400).json({ message: "Invalid league ID" });
    }
    
    const teams = await storage.getLeagueTeamDetails(leagueId);
    res.json(teams);
  });

  app.get("/api/leagues/:leagueId/matchups/:round", async (req, res) => {
    const leagueId = Number(req.params.leagueId);
    const round = Number(req.params.round);
    
    if (isNaN(leagueId) || isNaN(round)) {
      return res.status(400).json({ message: "Invalid parameters" });
    }
    
    const matchups = await storage.getMatchupDetails(leagueId, round);
    res.json(matchups);
  });

  // Round Performance routes
  app.get("/api/teams/:teamId/performances", async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }
    
    const performances = await storage.getRoundPerformances(teamId);
    res.json(performances);
  });

  // Load historical performance data
  app.post("/api/teams/:teamId/performances/load-historical", async (req, res) => {
    try {
      const teamId = Number(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      // Read historical data from JSON file
      const historicalDataPath = path.join(process.cwd(), 'historical_performances.json');
      
      if (!fs.existsSync(historicalDataPath)) {
        return res.status(404).json({ 
          message: "Historical data file not found. Please run parse_historical_data.mjs first." 
        });
      }

      const historicalData = JSON.parse(fs.readFileSync(historicalDataPath, 'utf8'));
      
      // Clear existing performance data for this team to avoid duplicates
      await storage.clearRoundPerformances(teamId);
      
      // Load each round's performance data
      const loaded = [];
      for (const roundData of historicalData) {
        const perf = await storage.createRoundPerformance({
          teamId: teamId,
          round: roundData.round,
          score: roundData.score,
          value: roundData.value,
          rank: roundData.rank,
          projectedScore: roundData.projectedScore
        });
        loaded.push(perf);
      }

      res.json({
        message: `Successfully loaded ${loaded.length} historical performance records`,
        data: loaded
      });
    } catch (error) {
      console.error("Error loading historical data:", error);
      res.status(500).json({ 
        message: "Failed to load historical data",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Configure multer for round data uploads
  const upload = multer({ dest: 'uploads/temp' });
  
  // Upload new round data file
  app.post("/api/round/upload", upload.single('roundFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await roundDataProcessor.processNewRound(req.file.path);
      
      // Clean up temp file
      fs.unlinkSync(req.file.path);

      if (result.success) {
        res.json({
          message: result.message,
          roundData: result.roundData
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error uploading round data",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get current user (for demo purposes, return user ID 1)
  app.get("/api/me", async (_req, res) => {
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // AFL Fantasy API integration routes
  app.get("/api/afl-fantasy/test", async (req, res) => {
    try {
      const isAuthenticated = await aflFantasyAPI.authenticate();
      if (isAuthenticated) {
        res.json({ 
          status: "success", 
          message: "Successfully connected to AFL Fantasy",
          authenticated: true 
        });
      } else {
        res.status(401).json({ 
          status: "error", 
          message: "Failed to authenticate with AFL Fantasy",
          authenticated: false 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: "Error connecting to AFL Fantasy",
        authenticated: false 
      });
    }
  });

  app.get("/api/afl-fantasy/team", async (req, res) => {
    try {
      const teamData = await aflFantasyAPI.getTeamData();
      if (teamData) {
        res.json({ status: "success", data: teamData });
      } else {
        res.status(404).json({ status: "error", message: "Could not fetch team data" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error fetching team data" });
    }
  });

  app.get("/api/afl-fantasy/ranking", async (req, res) => {
    try {
      const ranking = await aflFantasyAPI.getUserRanking();
      if (ranking) {
        res.json({ status: "success", data: ranking });
      } else {
        res.status(404).json({ status: "error", message: "Could not fetch ranking data" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error fetching ranking data" });
    }
  });

  // Central Data Hub API endpoint
  app.get('/api/data/player/:id', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const forTool = req.query.forTool as string;
      
      if (isNaN(playerId)) {
        return res.status(400).json({ 
          status: "error", 
          message: "Invalid player ID" 
        });
      }

      const player = await MasterDataService.getPlayerById(playerId);
      if (!player) {
        return res.status(404).json({ 
          status: "error", 
          message: "Player not found" 
        });
      }

      // Return tool-specific data if requested
      if (forTool) {
        const toolData = await MasterDataService.getDataForTool(forTool, player.name);
        return res.json({ 
          status: "ok", 
          data: toolData 
        });
      }

      // Return enhanced full player data
      const enhancedPlayer = await MasterDataService.enhanceWithProjections(player);
      res.json({ 
        status: "ok", 
        data: enhancedPlayer 
      });
    } catch (error) {
      console.error("Error in central data endpoint:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch player data" 
      });
    }
  });

  // Central Data Hub API endpoint by name
  app.get('/api/data/player/name/:name', async (req, res) => {
    try {
      const playerName = req.params.name;
      const forTool = req.query.forTool as string;
      
      const player = await MasterDataService.getPlayerByName(playerName);
      if (!player) {
        return res.status(404).json({ 
          status: "error", 
          message: "Player not found" 
        });
      }

      // Return tool-specific data if requested
      if (forTool) {
        const toolData = await MasterDataService.getDataForTool(forTool, player.name);
        return res.json({ 
          status: "ok", 
          data: toolData 
        });
      }

      // Return enhanced full player data
      const enhancedPlayer = await MasterDataService.enhanceWithProjections(player);
      res.json({ 
        status: "ok", 
        data: enhancedPlayer 
      });
    } catch (error) {
      console.error("Error in central data endpoint:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch player data" 
      });
    }
  });
  
  // AFL Fantasy scraping endpoint
  app.post('/api/scrape-team', async (req, res) => {
    try {
      const { aflFantasyScraper } = await import('./services/aflFantasyScraper');
      const lineup = await aflFantasyScraper.scrapeUserTeam();
      
      if (lineup) {
        res.json({
          status: 'success',
          data: lineup
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to scrape team data'
        });
      }
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
  
  // Alternative: Manual team input endpoint
  app.post('/api/team/manual-import', async (req, res) => {
    try {
      const { teamData } = req.body;
      
      // Save manually entered team data
      const fs = require('fs').promises;
      const path = require('path');
      
      const dataDir = path.join(process.cwd(), 'data', 'scraped');
      await fs.mkdir(dataDir, { recursive: true });
      
      const filename = `manual_team_${Date.now()}.json`;
      await fs.writeFile(
        path.join(dataDir, filename),
        JSON.stringify(teamData, null, 2)
      );
      
      // Also save as latest
      await fs.writeFile(
        path.join(dataDir, 'latest_team.json'),
        JSON.stringify(teamData, null, 2)
      );
      
      res.json({
        status: 'success',
        message: 'Team data imported successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
  
  // Get latest scraped team data
  app.get('/api/team/scraped', async (req, res) => {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const latestPath = path.join(process.cwd(), 'data', 'scraped', 'latest_team.json');
      const data = await fs.readFile(latestPath, 'utf-8');
      
      res.json({
        status: 'success',
        data: JSON.parse(data)
      });
    } catch (error: any) {
      res.status(404).json({
        status: 'error',
        message: 'No team data found. Please scrape or import your team first.'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}