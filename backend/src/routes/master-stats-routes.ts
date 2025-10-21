import express from 'express';
import { db } from '../utils/db';
import { players, dfsPlayers, playerRoundStats } from '@shared/schema';
import { sql, eq, desc, and, ilike } from 'drizzle-orm';

const router = express.Router();

// Normalize player data for frontend consumption
const normalizePlayerData = (player: any, seasonTotals: any = null, dfsData: any = null) => {
  // Merge season totals if provided
  const mergedPlayer = seasonTotals ? { ...player, ...seasonTotals } : player;
  
  return {
    // Basic info
    id: mergedPlayer.id,
    name: mergedPlayer.name || 'Unknown Player',
    team: mergedPlayer.team || '',
    position: mergedPlayer.position || '',
    
    // Core fantasy stats
    price: Math.round(mergedPlayer.price || 0),
    averagePoints: Math.round(mergedPlayer.averagePoints || 0),
    averageScore: Math.round(mergedPlayer.averagePoints || 0), // Alias for compatibility
    breakEven: Math.round(mergedPlayer.breakEven || 0),
    breakeven: Math.round(mergedPlayer.breakEven || 0), // Alias for compatibility
    projectedScore: Math.round(mergedPlayer.projectedScore || mergedPlayer.averagePoints || 0),
    priceChange: Math.round(mergedPlayer.priceChange || 0),
    games: Math.round(mergedPlayer.roundsPlayed || 0),
    gamesPlayed: Math.round(mergedPlayer.roundsPlayed || 0),
    roundsPlayed: Math.round(mergedPlayer.roundsPlayed || 0),
    
    // Match statistics
    kicks: Math.round(mergedPlayer.kicks || 0),
    handballs: Math.round(mergedPlayer.handballs || 0),
    disposals: Math.round(mergedPlayer.disposals || 0),
    marks: Math.round(mergedPlayer.marks || 0),
    tackles: Math.round(mergedPlayer.tackles || 0),
    hitouts: Math.round(mergedPlayer.hitouts || 0),
    freeKicksFor: Math.round(mergedPlayer.freeKicksFor || 0),
    freeKicksAgainst: Math.round(mergedPlayer.freeKicksAgainst || 0),
    clearances: Math.round(mergedPlayer.clearances || 0),
    
    // Role statistics
    cba: Math.round(mergedPlayer.cba || 0),
    cbaPercentage: Math.round(mergedPlayer.cba || 0),
    kickIns: Math.round(mergedPlayer.kickIns || 0),
    timeOnGround: Math.round(mergedPlayer.avgTog || dfsData?.avg_tog || 0),
    tog: Math.round(mergedPlayer.avgTog || dfsData?.avg_tog || 0), // Alias
    
    // Volatility statistics
    lastScore: Math.round(mergedPlayer.lastScore || 0),
    l3Average: Math.round(mergedPlayer.l3Average || mergedPlayer.averagePoints || 0),
    last3Avg: Math.round(mergedPlayer.l3Average || mergedPlayer.averagePoints || 0), // Alias
    l5Average: Math.round(mergedPlayer.l5Average || mergedPlayer.averagePoints || 0),
    last5Avg: Math.round(mergedPlayer.l5Average || mergedPlayer.averagePoints || 0), // Alias
    totalPoints: Math.round(mergedPlayer.totalPoints || 0),
    standardDeviation: Math.round(mergedPlayer.standardDeviation || 0),
    highScore: Math.round(mergedPlayer.highScore || 0),
    lowScore: Math.round(mergedPlayer.lowScore || 0),
    
    // Advanced statistics
    pointsPerMinute: dfsData?.ppm ? Math.round(dfsData.ppm * 100) / 100 : 0,
    ppm: dfsData?.ppm ? Math.round(dfsData.ppm * 100) / 100 : 0,
    ownershipPercentage: Math.round(mergedPlayer.selectionPercentage || 0),
    ownership: Math.round(mergedPlayer.selectionPercentage || 0), // Alias
    selectionPercentage: Math.round(mergedPlayer.selectionPercentage || 0), // Alias for compatibility
    valueRating: mergedPlayer.valueRating || '',
    valueIndex: Math.round(mergedPlayer.valueIndex || 0),
    consistency: Math.round(mergedPlayer.consistency || 0),
    consistencyRating: Math.round(mergedPlayer.consistency || 0),
    
    // Venue and opponent specific stats
    lastVsOpponent: Math.round(mergedPlayer.averageVsOpp || 0),
    lastAtVenue: Math.round(mergedPlayer.averageAtVenue || 0),
    averageVsOpp: Math.round(mergedPlayer.averageVsOpp || 0),
    averageAtVenue: Math.round(mergedPlayer.averageAtVenue || 0),
    averageVs3RoundOpp: Math.round(mergedPlayer.averageVs3RoundOpp || 0),
    averageAt3RoundVenue: Math.round(mergedPlayer.averageAt3RoundVenue || 0),
    opponentDifficulty: Math.round(mergedPlayer.opponentDifficulty || 0),
    opponent3RoundDifficulty: Math.round(mergedPlayer.opponent3RoundDifficulty || 0),
    nextOpponent: mergedPlayer.nextOpponent || '',
    nextVenue: mergedPlayer.nextVenue || '',
    
    // Additional advanced stats expected by component
    contestedMarks: Math.round(mergedPlayer.contestedMarks || 0),
    uncontestedMarks: Math.round(mergedPlayer.uncontestedMarks || 0),
    contestedDisposals: Math.round(mergedPlayer.contestedDisposals || 0),
    uncontestedDisposals: Math.round(mergedPlayer.uncontestedDisposals || 0),
    
    // Derived stats
    pricePerPoint: mergedPlayer.pricePerPoint || (mergedPlayer.price && mergedPlayer.averagePoints ? Math.round((mergedPlayer.price / mergedPlayer.averagePoints) * 100) / 100 : 0),
    
    // Status flags
    isInjured: mergedPlayer.isInjured || false,
    isSuspended: mergedPlayer.isSuspended || false,
    
    // Season totals (populated from aggregated stats)
    totalKicks: Math.round(mergedPlayer.totalKicks || 0),
    totalHandballs: Math.round(mergedPlayer.totalHandballs || 0),
    totalDisposals: Math.round(mergedPlayer.totalDisposals || 0),
    totalMarks: Math.round(mergedPlayer.totalMarks || 0),
    totalTackles: Math.round(mergedPlayer.totalTackles || 0),
  };
};

// Get all players
router.get('/players', async (req, res) => {
  try {
    // Disable HTTP caching to ensure fresh role stats data reaches the client
    res.set('Cache-Control', 'no-store');
    
    // Build query filters
    const query = req.query.q as string;
    const position = req.query.position as string;
    const team = req.query.team as string;
    
    // Query all players from database using Drizzle (returns camelCase)
    const allPlayers = await db.select().from(players).orderBy(desc(players.price));
    
    // Get season totals using raw SQL with proper camelCase aliases
    const seasonTotalsQuery = await db.execute(sql`
      SELECT 
        p.id as "playerId",
        p.name as "playerName",
        COALESCE(SUM(prs.kicks), 0)::int as "totalKicks",
        COALESCE(SUM(prs.handballs), 0)::int as "totalHandballs",
        COALESCE(SUM(prs.disposals), 0)::int as "totalDisposals",
        COALESCE(SUM(prs.marks), 0)::int as "totalMarks",
        COALESCE(SUM(prs.tackles), 0)::int as "totalTackles",
        COALESCE(AVG(prs.time_on_ground), 0)::int as "avgTog"
      FROM players p
      LEFT JOIN player_round_stats prs ON prs.player_id = p.id
      GROUP BY p.id, p.name
    `);
    
    // Create a map for quick lookup
    const seasonTotalsMap = new Map(
      seasonTotalsQuery.rows.map((row: any) => [row.playerId, row])
    );
    
    // Apply filters
    let filteredPlayers = allPlayers;
    
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.name?.toLowerCase().includes(searchTerm) ||
        player.team?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (position && position !== 'all') {
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.position?.toLowerCase() === position.toLowerCase()
      );
    }
    
    if (team && team !== 'all') {
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.team?.toLowerCase().includes(team.toLowerCase())
      );
    }
    
    // Get DFS data for enrichment
    const dfsData = await db.select().from(dfsPlayers);
    const dfsMap = new Map(dfsData.map(d => [d.name.toLowerCase(), d]));
    
    // Normalize data for frontend
    const normalizedPlayers = filteredPlayers.map((player: any) => {
      const seasonData = seasonTotalsMap.get(player.id);
      const dfs = dfsMap.get(player.name?.toLowerCase());
      return normalizePlayerData(player, seasonData, dfs);
    });
    
    res.json(normalizedPlayers);
  } catch (error) {
    console.error('Error in /master-stats/players:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Get player by name
router.get('/players/:name', async (req, res) => {
  try {
    const playerName = req.params.name;
    
    const playerData = await db.select().from(players).where(
      ilike(players.name, playerName)
    ).limit(1);
    
    if (!playerData || playerData.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Get DFS data
    const dfsData = await db.select().from(dfsPlayers).where(
      ilike(dfsPlayers.name, playerName)
    ).limit(1);
    
    res.json(normalizePlayerData(playerData[0], null, dfsData[0]));
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Get stats metadata
router.get('/metadata', async (req, res) => {
  try {
    const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM players`);
    const total = countResult.rows[0]?.total || 0;
    
    res.json({
      total_players: total,
      data_sources: ['database'],
      generated_at: new Date().toISOString(),
      version: '2.0.0'
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Get data completeness info
router.get('/completeness', async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN average_points > 0 THEN 1 END) as avg_populated,
        COUNT(CASE WHEN price > 0 THEN 1 END) as price_populated,
        COUNT(CASE WHEN break_even IS NOT NULL THEN 1 END) as be_populated,
        COUNT(*) as total
      FROM players
    `);
    
    const row = stats.rows[0];
    const total = Number(row.total) || 1;
    
    res.json({
      average_points: {
        populated: row.avg_populated,
        percentage: Math.round((Number(row.avg_populated) / total) * 100)
      },
      price: {
        populated: row.price_populated,
        percentage: Math.round((Number(row.price_populated) / total) * 100)
      },
      break_even: {
        populated: row.be_populated,
        percentage: Math.round((Number(row.be_populated) / total) * 100)
      }
    });
  } catch (error) {
    console.error('Error fetching completeness data:', error);
    res.status(500).json({ error: 'Failed to fetch completeness data' });
  }
});

// Get accurate player value stats from database
router.get('/value-stats', async (req, res) => {
  try {
    const playerStatsQuery = await db.execute(sql`
      WITH player_stats AS (
        SELECT 
          p.id,
          p.name,
          p.team,
          p.position,
          p.price,
          p.break_even,
          COUNT(prs.fantasy_points) as games_played,
          AVG(prs.fantasy_points)::numeric(10,2) as avg_points,
          SUM(prs.fantasy_points) as total_points,
          MAX(prs.fantasy_points) as high_score,
          MIN(prs.fantasy_points) as low_score,
          STDDEV(prs.fantasy_points)::numeric(10,2) as std_dev
        FROM players p
        LEFT JOIN player_round_stats prs ON prs.player_id = p.id
        WHERE p.price > 0
        GROUP BY p.id, p.name, p.team, p.position, p.price, p.break_even
      ),
      last_3_stats AS (
        SELECT 
          p.id,
          AVG(prs.fantasy_points)::numeric(10,2) as l3_average
        FROM players p
        LEFT JOIN LATERAL (
          SELECT fantasy_points
          FROM player_round_stats 
          WHERE player_id = p.id
          ORDER BY round DESC
          LIMIT 3
        ) prs ON true
        GROUP BY p.id
      )
      SELECT 
        ps.id,
        ps.name,
        ps.team,
        ps.position,
        ps.price,
        ps.break_even,
        ps.games_played,
        ps.avg_points,
        ps.total_points,
        ps.high_score,
        ps.low_score,
        ps.std_dev,
        COALESCE(l3.l3_average, 0) as l3_average,
        CASE 
          WHEN ps.avg_points > 0 THEN (ps.avg_points / ps.price * 100000)::numeric(10,2)
          ELSE 0
        END as ppd
      FROM player_stats ps
      LEFT JOIN last_3_stats l3 ON l3.id = ps.id
      WHERE ps.games_played > 0
      ORDER BY ppd DESC
    `);
    
    const playersData = playerStatsQuery.rows.map((row: any) => ({
      playerId: String(row.id),
      name: row.name,
      team: row.team,
      position: row.position,
      price: Number(row.price),
      breakEven: Number(row.break_even || 0),
      roundsPlayed: Number(row.games_played),
      averagePoints: Number(row.avg_points || 0),
      totalPoints: Number(row.total_points || 0),
      highScore: Number(row.high_score || 0),
      lowScore: Number(row.low_score || 0),
      standardDeviation: Number(row.std_dev || 0),
      l3Average: Number(row.l3_average || 0),
      ppd: Number(row.ppd || 0),
      projectedScore: Number(row.avg_points || 0),
      valueRating: row.ppd > 10 ? 'undervalued' : row.ppd < 8 ? 'overpriced' : 'neutral'
    }));
    
    res.json(playersData);
  } catch (error) {
    console.error('Error fetching value stats:', error);
    res.status(500).json({ error: 'Failed to fetch value stats' });
  }
});

export default router;
