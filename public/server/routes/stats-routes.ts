import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load enhanced data sources
let fantasyMetricsData: any[] = [];
let fantasyValueData: any[] = [];

// Load fantasy metrics and value data on startup
const loadEnhancedData = () => {
  try {
    // Load fantasy metrics (ownership, consistency, ppm)
    const metricsPath = path.join(process.cwd(), 'attached_assets', 'fantasy_metrics_2025_1755916866519.json');
    if (fs.existsSync(metricsPath)) {
      fantasyMetricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      console.log(`Loaded ${fantasyMetricsData.length} players from fantasy metrics`);
    }
    
    // Load fantasy value data (actual averages, value ratings)
    const valuePath = path.join(process.cwd(), 'attached_assets', 'fantasy_value_index_2025_1755916866520.json');
    if (fs.existsSync(valuePath)) {
      fantasyValueData = JSON.parse(fs.readFileSync(valuePath, 'utf8'));
      console.log(`Loaded ${fantasyValueData.length} players from value index`);
    }
  } catch (error) {
    console.error('Error loading enhanced data sources:', error);
  }
};

// Initialize enhanced data
loadEnhancedData();

// Helper function to normalize player names for matching
const normalizeName = (name: string): string => {
  return name.toLowerCase().trim().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
};

// Helper function to find player in enhanced datasets
const findEnhancedData = (playerName: string) => {
  const normalizedName = normalizeName(playerName);
  
  const metricsMatch = fantasyMetricsData.find(p => 
    normalizeName(p.name) === normalizedName || p.name_lower === normalizedName
  );
  
  const valueMatch = fantasyValueData.find(p => 
    normalizeName(p.name) === normalizedName
  );
  
  return { metrics: metricsMatch, value: valueMatch };
};

const router = express.Router();

// Load player data from master stats file 
const getPlayerData = () => {
  try {
    // Use master stats file as primary source
    const masterStatsPath = path.join(process.cwd(), 'server/data/master_player_stats.json');
    
    if (fs.existsSync(masterStatsPath)) {
      console.log('Loading player data from master stats file...');
      const masterData = fs.readFileSync(masterStatsPath, 'utf8');
      const masterStats = JSON.parse(masterData);
      
      if (masterStats.players && masterStats.players.length > 0) {
        const players = masterStats.players.map((player: any) => ({
          name: player.name,
          team: player.team,
          position: player.position,
          price: player.price,
          averageScore: player.average_points,
          averagePoints: player.average_points,
          breakEven: player.break_even,
          projectedScore: player.projected_score,
          lastScore: player.last_score,
          l3Average: player.last_3_average,
          l5Average: player.last_5_average,
          priceChange: player.price_change,
          games: player.games_played,
          gamesPlayed: player.games_played,
          // Match statistics
          kicks: player.kicks,
          handballs: player.handballs,
          disposals: player.disposals,
          marks: player.marks,
          tackles: player.tackles,
          hitouts: player.hitouts,
          cba: player.cba_percentage,
          kickIns: player.kick_ins,
          totalPoints: player.total_points,
          pricePerPoint: player.price_per_point,
          ownership: player.ownership_percentage,
          selectionPercentage: player.ownership_percentage,
          pointsPerMinute: player.points_per_minute,
          valueRating: player.value_rating,
          valueIndex: player.value_index,
          timeOnGround: player.time_on_ground,
          // Enhanced data
          actualAverage: player.average_points,
          consistency: player.consistency_rating,
          standardDeviation: player.standard_deviation,
          highScore: player.high_score,
          lowScore: player.low_score
        }));
        
        console.log(`Loaded ${players.length} players from master stats file`);
        console.log(`Total unique players loaded: ${players.length}`);
        return players;
      }
    }
    
    // Fallback to original player_data.json if master stats not available
    const dataFile = 'player_data.json';
    console.log(`Falling back to ${dataFile}...`);
    
    const filePath = path.join(process.cwd(), dataFile);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${dataFile}`);
      return [];
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const players = JSON.parse(data);
    
    if (!Array.isArray(players)) {
      console.error(`Invalid data format in ${dataFile}`);
      return [];
    }

    // Normalize player data structure and enrich with enhanced data
    const normalizedPlayers = players.map((player: any) => {
      const enhanced = findEnhancedData(player.name);
      const metrics = enhanced.metrics;
      const value = enhanced.value;
      
      return {
        name: player.name,
        team: player.team || 'Unknown',
        position: player.position === 'RUCK' ? 'RUC' : (player.position || 'UNK'),
        price: player.price || (metrics?.sal ? Math.round(metrics.sal / 1000) : 0),
        averageScore: player.avg || player.averageScore || player.averagePoints || (metrics?.pa) || 0,
        breakEven: player.breakeven || player.breakEven || 0,
        l3Average: player.l3_avg || player.last3_avg || player.l3Average || 0,
        l5Average: player.l5_avg || player.last5_avg || player.l5Average || 0,
        lastScore: player.lastScore || (value?.actual_avg) || 0,
        projectedScore: player.projected_score || player.projectedScore || player.projScore || (metrics?.pa) || 0,
        games: player.games || 0,
        status: player.status || 'fit',
        source: player.source || dataFile,
        score_history: player.score_history || [],
        // Enhanced data from fantasy metrics
        ownership: metrics?.own ? (metrics.own * 100) : player.ownership || 0,
        consistency: metrics?.con ? (metrics.con * 100) : player.consistency || 0,
        pointsPerMinute: metrics?.ppm || player.pointsPerMinute || 0,
        // Enhanced data from value index
        actualAverage: value?.actual_avg || player.actualAverage || 0,
        valueIndex: value?.value_index || player.valueIndex || 0,
        valueRating: value?.value_rating || player.valueRating || 'Unknown',
        // Include comprehensive match statistics
        kicks: player.kicks || 0,
        handballs: player.handballs || 0,
        disposals: player.disposals || 0,
        marks: player.marks || 0,
        tackles: player.tackles || 0,
        hitouts: player.hitouts || 0,
        cba: player.cba || 0,
        kickIns: player.kickIns || 0,
        totalPoints: player.totalPoints || 0,
        priceChange: player.priceChange || 0,
        pricePerPoint: player.pricePerPoint || (player.averageScore && player.price ? (player.averageScore / (player.price / 1000)).toFixed(2) : 0),
        selectionPercentage: metrics?.own ? (metrics.own * 100) : player.selectionPercentage || 0
      };
    }).filter(player => player.name); // Only include players with names
    
    console.log(`Loaded ${normalizedPlayers.length} players from ${dataFile}`);
    console.log(`Total unique players loaded: ${normalizedPlayers.length}`);
    
    return normalizedPlayers;
  } catch (error) {
    console.error("Error reading player data:", error);
    return [];
  }
};

// FootyWire data endpoint
router.get('/footywire', async (req, res) => {
  try {
    console.log("Scraping FootyWire data...");
    
    // For now, return data from player_data.json with some filtering
    const playerData = getPlayerData();
    
    // Extract relevant fields and format for FootyWire tab
    const formattedData = playerData.map((player: any) => ({
      name: player.name,
      position: player.position,
      team: player.team,
      price: player.price || 0,
      averageScore: player.averageScore || player.averagePoints,
      lastScore: player.lastScore,
      externalId: player.externalId || player.id
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching FootyWire data:", error);
    res.status(500).json({ error: "Failed to fetch FootyWire data" });
  }
});

// DFS Australia data endpoint
router.get('/dfs-australia', async (req, res) => {
  try {
    console.log("Fetching DFS Australia data...");
    
    // DFS Australia API call disabled to prevent startup delays
    // Uncomment when you want to enable live data fetching
    // try {
    //   const response = await axios.get('https://dfsaustralia.com/wp-json/fantasyapi/v1/big-board');
    //   if (response.status === 200 && response.data) {
    //     const formattedData = response.data.map((player: any) => ({
    //       name: player.player_name,
    //       position: player.position,
    //       team: player.team,
    //       price: parseInt(player.price.replace(/[^0-9]/g, '')),
    //       consistency: parseFloat(player.consistency || 0),
    //       ceiling: parseFloat(player.ceiling || 0),
    //       floor: parseFloat(player.floor || 0),
    //       valueScore: parseFloat(player.value || 0),
    //       ownership: parseFloat(player.ownership?.replace('%', '') || 0)
    //     }));
    //     return res.json(formattedData);
    //   }
    // } catch (apiError) {
    //   console.warn("DFS Australia API not available, using fallback data");
    // }
    
    // Fallback to player_data.json with additional fields
    const playerData = getPlayerData();
    
    // Extract relevant fields and format for DFS Australia tab with enhanced data
    const formattedData = playerData.map((player: any) => {
      return {
        name: player.name,
        position: player.position,
        team: player.team,
        price: player.price || 0,
        consistency: player.consistency || 60,
        ceiling: player.ceiling || (player.actualAverage ? player.actualAverage * 1.3 : (player.averageScore ? player.averageScore * 1.3 : 0)),
        floor: player.floor || (player.actualAverage ? player.actualAverage * 0.7 : (player.averageScore ? player.averageScore * 0.7 : 0)),
        valueScore: player.valueIndex || (player.averageScore && player.price ? (player.averageScore / (player.price / 100)) : 0),
        ownership: player.ownership || 0,
        pointsPerMinute: player.pointsPerMinute || 0,
        valueRating: player.valueRating || 'Unknown'
      };
    });
    
    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching DFS Australia data:", error);
    res.status(500).json({ error: "Failed to fetch DFS Australia data" });
  }
});

// Combined stats endpoint
router.get('/combined-stats', async (req, res) => {
  try {
    console.log("Generating combined stats...");
    
    // Get player data
    const playerData = getPlayerData();
    
    // Format data with all available fields including enhanced statistics
    const formattedData = playerData.map((player: any) => ({
      name: player.name,
      position: player.position,
      team: player.team,
      price: player.price || 0,
      averageScore: player.averageScore || player.averagePoints,
      breakEven: player.breakEven || 0,
      l3Average: player.l3Average || 0,
      l5Average: player.l5Average || 0,
      lastScore: player.lastScore || player.actualAverage || 0,
      projectedScore: player.projectedScore || player.projScore,
      // Enhanced fantasy data
      ownership: player.ownership || 0,
      consistency: player.consistency || 0,
      pointsPerMinute: player.pointsPerMinute || 0,
      actualAverage: player.actualAverage || 0,
      valueIndex: player.valueIndex || 0,
      valueRating: player.valueRating || 'Unknown',
      // Match statistics from comprehensive dataset
      kicks: player.kicks || 0,
      handballs: player.handballs || 0,
      disposals: player.disposals || 0,
      marks: player.marks || 0,
      tackles: player.tackles || 0,
      hitouts: player.hitouts || 0,
      // Role statistics
      cba: player.cba || 0,
      kickIns: player.kickIns || 0,
      // Additional stats
      totalPoints: player.totalPoints || 0,
      priceChange: player.priceChange || 0,
      pricePerPoint: player.pricePerPoint || 0,
      selectionPercentage: player.selectionPercentage || player.ownership || 0
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error("Error generating combined stats:", error);
    res.status(500).json({ error: "Failed to generate combined stats" });
  }
});

// DVP Matrix endpoint
router.get('/dvp-matrix', async (req, res) => {
  try {
    console.log("Loading DVP matrix...");
    
    // Try to load from JSON file first
    const dvpFilePath = path.join(process.cwd(), 'dvp_matrix.json');
    if (fs.existsSync(dvpFilePath)) {
      const dvpData = JSON.parse(fs.readFileSync(dvpFilePath, 'utf8'));
      return res.json(dvpData);
    }
    
    // Fallback - return empty matrix structure
    res.json({
      DEF: {},
      MID: {},
      RUC: {},
      FWD: {}
    });
  } catch (error) {
    console.error("Error fetching DVP matrix:", error);
    res.status(500).json({ error: "Failed to fetch DVP matrix" });
  }
});

// Helper function to calculate consistency
function calculateConsistency(scores: number[]): number {
  if (!scores || scores.length < 2) return 60; // Default value
  
  // Calculate standard deviation
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to a consistency score (inverse of standard deviation)
  // Higher stdDev = lower consistency
  const maxStdDev = 40; // Assuming this is a reasonable max std dev for AFL Fantasy
  return Math.max(0, 100 - (stdDev / maxStdDev * 100));
}

export default router;