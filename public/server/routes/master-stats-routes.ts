import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Cache for master stats data
let masterStatsCache: any = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load master stats from file with caching
const loadMasterStats = () => {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (masterStatsCache && (now - lastLoadTime) < CACHE_DURATION) {
    return masterStatsCache;
  }
  
  try {
    const masterStatsPath = path.join(process.cwd(), 'public/server/data/master_player_stats.json');
    
    if (!fs.existsSync(masterStatsPath)) {
      console.error('Master stats file not found:', masterStatsPath);
      return { metadata: { total_players: 0 }, players: [] };
    }
    
    const data = fs.readFileSync(masterStatsPath, 'utf8');
    const masterStats = JSON.parse(data);
    
    // Update cache
    masterStatsCache = masterStats;
    lastLoadTime = now;
    
    console.log(`Loaded ${masterStats.players?.length || 0} players from master stats file`);
    return masterStats;
    
  } catch (error) {
    console.error('Error loading master stats:', error);
    return { metadata: { total_players: 0 }, players: [] };
  }
};

// Normalize player data for frontend consumption
let playerIdCounter = 1;
const playerIdMap = new Map<string, number>();

const normalizePlayerData = (player: any) => {
  // Generate consistent numeric ID for each player
  if (!playerIdMap.has(player.name)) {
    playerIdMap.set(player.name, playerIdCounter++);
  }
  
  return {
    // Basic info
    id: playerIdMap.get(player.name),
    name: player.name || 'Unknown Player',
    team: player.team || '',
    position: player.position || '',
    
    // Core fantasy stats
    price: Math.round(player.price || 0),
    averagePoints: Math.round(player.average_points || 0),
    averageScore: Math.round(player.average_points || 0), // Alias for compatibility
    breakEven: Math.round(player.break_even || 0),
    breakeven: Math.round(player.break_even || 0), // Alias for compatibility
    projectedScore: Math.round(player.projected_score || 0),
    priceChange: Math.round(player.price_change || 0),
    games: Math.round(player.games_played || 0),
    gamesPlayed: Math.round(player.games_played || 0),
    roundsPlayed: Math.round(player.games_played || 0),
    
    // Match statistics
    kicks: Math.round(player.kicks || 0),
    handballs: Math.round(player.handballs || 0),
    disposals: Math.round(player.disposals || 0),
    marks: Math.round(player.marks || 0),
    tackles: Math.round(player.tackles || 0),
    hitouts: Math.round(player.hitouts || 0),
    freeKicksFor: Math.round(player.free_kicks_for || 0),
    freeKicksAgainst: Math.round(player.free_kicks_against || 0),
    clearances: Math.round(player.clearances || 0),
    
    // Role statistics
    cba: Math.round(player.cba_percentage || 0),
    cbaPercentage: Math.round(player.cba_percentage || 0),
    kickIns: Math.round(player.kick_ins || 0),
    timeOnGround: Math.round(player.time_on_ground || 0),
    tog: Math.round(player.time_on_ground || 0), // Alias
    
    // Volatility statistics
    lastScore: Math.round(player.last_score || 0),
    l3Average: Math.round(player.last_3_average || 0),
    last3Avg: Math.round(player.last_3_average || 0), // Alias
    l5Average: Math.round(player.last_5_average || 0),
    last5Avg: Math.round(player.last_5_average || 0), // Alias
    totalPoints: Math.round(player.total_points || 0),
    standardDeviation: Math.round(player.standard_deviation || 0),
    highScore: Math.round(player.high_score || 0),
    lowScore: Math.round(player.low_score || 0),
    
    // Advanced statistics
    pointsPerMinute: Math.round((player.points_per_minute || 0) * 100) / 100, // Keep 2 decimals for PPM
    ppm: Math.round((player.points_per_minute || 0) * 100) / 100, // Keep 2 decimals for PPM
    ownershipPercentage: Math.round(player.ownership_percentage || 0),
    ownership: Math.round(player.ownership_percentage || 0), // Alias
    selectionPercentage: Math.round(player.ownership_percentage || 0), // Alias for compatibility
    valueRating: player.value_rating || '',
    valueIndex: Math.round(player.value_index || 0),
    consistency: Math.round(player.consistency_rating || 0),
    consistencyRating: Math.round(player.consistency_rating || 0),
    
    // Venue and opponent specific stats
    lastVsOpponent: Math.round(player.lastVsOpponent || 0),
    lastAtVenue: Math.round(player.lastAtVenue || 0),
    averageVsOpp: Math.round(player.lastVsOpponent || 0), // Map to VS stats expected by component
    averageAtVenue: Math.round(player.lastAtVenue || 0),
    averageVs3RoundOpp: 0, // Not available in current data
    averageAt3RoundVenue: 0, // Not available in current data
    opponentDifficulty: Math.round(player.opponent_difficulty || 0),
    opponent3RoundDifficulty: Math.round(player.three_round_opponent_difficulty || 0),
    nextOpponent: player.nextOpponent || '',
    nextVenue: player.nextVenue || '',
    
    // Additional advanced stats expected by component
    contestedMarks: Math.round(player.contested_marks || 0),
    uncontestedMarks: Math.round(player.uncontested_marks || 0),
    contestedDisposals: Math.round(player.contested_disposals || 0),
    uncontestedDisposals: Math.round(player.uncontested_disposals || 0),
    
    // Derived stats
    pricePerPoint: player.price_per_point || (player.price && player.average_points ? Math.round(player.price / player.average_points) : 0),
    
    // Status flags (would need separate data source)
    isInjured: false,
    isSuspended: false,
    
    // Data tracking
    dataSources: player.data_sources,
    lastUpdated: player.last_updated
  };
};

// Get all players
router.get('/players', async (req, res) => {
  try {
    // Disable HTTP caching to ensure fresh role stats data reaches the client
    res.set('Cache-Control', 'no-store');
    
    const masterStats = loadMasterStats();
    
    if (!masterStats.players) {
      return res.status(404).json({ error: 'No player data found' });
    }
    
    // Apply filters
    const query = req.query.q as string;
    const position = req.query.position as string;
    const team = req.query.team as string;
    
    let filteredPlayers = masterStats.players;
    
    // Search filter
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.name?.toLowerCase().includes(searchTerm) ||
        player.team?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Position filter
    if (position && position !== 'all') {
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.position?.toLowerCase() === position.toLowerCase()
      );
    }
    
    // Team filter
    if (team && team !== 'all') {
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.team?.toLowerCase().includes(team.toLowerCase())
      );
    }
    
    // Get accurate season totals from database (for Season Total view)
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    
    // Execute raw SQL to get season totals and averages - more reliable than complex Drizzle query
    const seasonTotalsQuery = await db.execute(sql`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.total_points,
        p.rounds_played,
        p.cba,
        p.kick_ins,
        p.consistency,
        p.low_score,
        p.high_score,
        COALESCE(SUM(prs.kicks), 0)::int as total_kicks,
        COALESCE(SUM(prs.handballs), 0)::int as total_handballs,
        COALESCE(SUM(prs.disposals), 0)::int as total_disposals,
        COALESCE(SUM(prs.marks), 0)::int as total_marks,
        COALESCE(SUM(prs.tackles), 0)::int as total_tackles,
        COALESCE(AVG(prs.time_on_ground), 0)::int as avg_tog
      FROM players p
      LEFT JOIN player_round_stats prs ON prs.player_id = p.id
      GROUP BY p.id, p.name, p.total_points, p.rounds_played, p.cba, p.kick_ins, p.consistency, p.low_score, p.high_score
    `);
    
    // Create a map for quick lookup
    const seasonTotalsMap = new Map(
      seasonTotalsQuery.rows.map((row: any) => [row.player_name, {
        playerId: row.player_id,
        playerName: row.player_name,
        totalPoints: row.total_points,
        roundsPlayed: row.rounds_played,
        cba: row.cba,
        kickIns: row.kick_ins,
        tog: row.avg_tog,
        // Volatility stats from database (season-level)
        consistency: row.consistency,
        lowScore: row.low_score,
        highScore: row.high_score,
        totalKicks: row.total_kicks,
        totalHandballs: row.total_handballs,
        totalDisposals: row.total_disposals,
        totalMarks: row.total_marks,
        totalTackles: row.total_tackles
      }])
    );
    
    // Normalize data for frontend with database overrides
    const normalizedPlayers = filteredPlayers.map((player: any) => {
      const seasonData = seasonTotalsMap.get(player.name);
      const normalized: any = normalizePlayerData(player);
      
      // Override with accurate database values from database
      if (seasonData) {
        normalized.totalPoints = seasonData.totalPoints || normalized.totalPoints;
        normalized.roundsPlayed = seasonData.roundsPlayed || normalized.roundsPlayed;
        
        // Role stats from database - only override if database has data
        if (seasonData.cba != null) {
          normalized.cba = seasonData.cba;
          normalized.cbaPercentage = seasonData.cba;
        }
        if (seasonData.kickIns != null) {
          normalized.kickIns = seasonData.kickIns;
        }
        if (seasonData.tog != null) {
          normalized.tog = seasonData.tog;
        }
        
        // Volatility stats from database - override JSON values
        if (seasonData.consistency != null) {
          normalized.consistency = seasonData.consistency;
          normalized.consistencyRating = seasonData.consistency;
        }
        if (seasonData.lowScore != null) {
          normalized.lowScore = seasonData.lowScore;
        }
        if (seasonData.highScore != null) {
          normalized.highScore = seasonData.highScore;
        }
        
        // Add season totals for match stats (for Season Total view)
        normalized.totalKicks = seasonData.totalKicks || 0;
        normalized.totalHandballs = seasonData.totalHandballs || 0;
        normalized.totalDisposals = seasonData.totalDisposals || 0;
        normalized.totalMarks = seasonData.totalMarks || 0;
        normalized.totalTackles = seasonData.totalTackles || 0;
      }
      
      return normalized;
    });
    
    res.json(normalizedPlayers);
  } catch (error) {
    console.error('Error in /master-stats/players:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Get player by name
router.get('/players/:name', (req, res) => {
  try {
    const masterStats = loadMasterStats();
    const playerName = req.params.name;
    
    const player = masterStats.players?.find((p: any) => 
      p.name?.toLowerCase() === playerName.toLowerCase()
    );
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(normalizePlayerData(player));
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Get stats metadata
router.get('/metadata', (req, res) => {
  try {
    const masterStats = loadMasterStats();
    res.json(masterStats.metadata || {});
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Get data completeness info
router.get('/completeness', (req, res) => {
  try {
    const masterStats = loadMasterStats();
    res.json(masterStats.data_completeness || {});
  } catch (error) {
    console.error('Error fetching completeness data:', error);
    res.status(500).json({ error: 'Failed to fetch completeness data' });
  }
});

// Refresh cache endpoint
router.post('/refresh', (req, res) => {
  try {
    masterStatsCache = null;
    lastLoadTime = 0;
    const masterStats = loadMasterStats();
    
    res.json({
      success: true,
      playersLoaded: masterStats.players?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

// Get accurate player value stats from database
router.get('/value-stats', async (req, res) => {
  try {
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    
    // Calculate accurate stats from player_round_stats table
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
    
    const players = playerStatsQuery.rows.map((row: any) => ({
      playerId: String(row.id),  // Changed from 'id' to 'playerId' for DVP component compatibility
      name: row.name,
      team: row.team,
      position: row.position,
      price: Number(row.price),
      breakEven: Number(row.break_even || 0),
      roundsPlayed: Number(row.games_played),  // Changed from 'gamesPlayed' to 'roundsPlayed'
      averagePoints: Number(row.avg_points || 0),
      totalPoints: Number(row.total_points || 0),
      highScore: Number(row.high_score || 0),
      lowScore: Number(row.low_score || 0),
      standardDeviation: Number(row.std_dev || 0),
      l3Average: Number(row.l3_average || 0),
      ppd: Number(row.ppd || 0),
      projectedScore: Number(row.avg_points || 0), // Use average as projected
      valueRating: row.ppd > 10 ? 'undervalued' : row.ppd < 8 ? 'overpriced' : 'neutral'
    }));
    
    res.json(players);
  } catch (error) {
    console.error('Error fetching value stats:', error);
    res.status(500).json({ error: 'Failed to fetch value stats' });
  }
});

export default router;