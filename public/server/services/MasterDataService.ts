/**
 * Master Data Service
 * 
 * Centralized service for accessing and transforming player data from master_player_stats.json
 * Handles field mapping, data enhancement, and tool-specific data formatting
 */

import * as fs from 'fs';
import * as path from 'path';

interface MasterPlayerData {
  name: string;
  team: string;
  position: string;
  average_points: number;
  break_even: number;
  projected_score: number;
  price: number;
  price_change: number;
  games_played: number;
  last_3_average: number;
  last_5_average: number;
  last_score: number;
  total_points: number;
  consistency_rating: number;
  standard_deviation: number;
  high_score: number;
  low_score: number;
  ownership_percentage: number;
  value_rating: string;
  value_index: number;
  opponent_difficulty: number;
  three_round_opponent_difficulty: number;
  nextOpponent: string;
  nextVenue: string;
  lastVsOpponent: number | null;
  lastAtVenue: number | null;
  // Venue Analysis Stats
  last_score_at_venue: number | null;
  avg_score_at_venue: number | null;
  venue_factor: number;
  recentGameLogs: Array<{
    RD: string;
    TM: string;
    OPP: string;
    VEN: string;
    SC: number;
    FP: number;
    K: number;
    H: number;
    M: number;
    T: number;
    TOG: number;
    [key: string]: any;
  }>;
  kicks: number;
  handballs: number;
  disposals: number;
  marks: number;
  tackles: number;
  time_on_ground: number;
  points_per_minute: number;
  price_per_point: number;
  data_sources: string[];
  last_updated: string;
}

interface MasterStatsFile {
  metadata: {
    total_players: number;
    data_sources: string[];
    generated_at: string;
    version: string;
  };
  players: MasterPlayerData[];
}

export class MasterDataService {
  private static masterStats: MasterStatsFile | null = null;
  private static playerNameMap: Map<string, MasterPlayerData> = new Map();
  private static playerIdMap: Map<number, MasterPlayerData> = new Map();
  private static dvpData: any = null;

  /**
   * Load and cache master player stats data
   */
  private static async loadMasterStats(): Promise<void> {
    if (this.masterStats) return;

    try {
      const dataPath = path.join(process.cwd(), 'server/data/master_player_stats.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      this.masterStats = JSON.parse(rawData);
      
      // Build lookup maps for performance
      this.masterStats!.players.forEach((player, index) => {
        this.playerNameMap.set(player.name.toLowerCase(), player);
        this.playerIdMap.set(index + 1, player); // Simple ID assignment
      });

      console.log(`MasterDataService loaded ${this.masterStats!.players.length} players`);
      
      // Load DVP data
      await this.loadDVPData();
    } catch (error) {
      console.error('Error loading master player stats:', error);
      throw new Error('Failed to load master player stats');
    }
  }

  /**
   * Load DVP matchup data
   */
  private static async loadDVPData(): Promise<void> {
    try {
      const dvpPath = path.join(process.cwd(), 'dvp_matrix.json');
      if (fs.existsSync(dvpPath)) {
        const rawData = fs.readFileSync(dvpPath, 'utf8');
        this.dvpData = JSON.parse(rawData);
        console.log('DVP data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading DVP data:', error);
      this.dvpData = {};
    }
  }

  /**
   * Get DVP difficulty rating for team and position
   */
  static getDVPDifficulty(team: string, position: string, round?: number): number {
    if (!this.dvpData) return 5.0;
    
    const normalizedTeam = this.normalizeTeamName(team);
    const normalizedPosition = this.normalizePosition(position);
    
    // Try specific round matchup first
    if (round && this.dvpData.position_matchups?.[normalizedPosition]?.[normalizedTeam]?.[round.toString()]) {
      return this.dvpData.position_matchups[normalizedPosition][normalizedTeam][round.toString()];
    }
    
    // Fallback to general difficulty rating
    if (this.dvpData.difficulty_ratings?.[normalizedTeam]?.[normalizedPosition]) {
      return this.dvpData.difficulty_ratings[normalizedTeam][normalizedPosition];
    }
    
    return 5.0; // Default medium difficulty
  }

  private static normalizeTeamName(team: string): string {
    const teamMapping: { [key: string]: string } = {
      'Adelaide': 'ADE', 'Adelaide Crows': 'ADE',
      'Brisbane': 'BRL', 'Brisbane Lions': 'BRL',
      'Carlton': 'CAR', 'Carlton Blues': 'CAR',
      'Collingwood': 'COL', 'Collingwood Magpies': 'COL',
      'Essendon': 'ESS', 'Essendon Bombers': 'ESS',
      'Fremantle': 'FRE', 'Fremantle Dockers': 'FRE',
      'Geelong': 'GEE', 'Geelong Cats': 'GEE',
      'Gold Coast': 'GCS', 'Gold Coast Suns': 'GCS',
      'GWS': 'GWS', 'GWS Giants': 'GWS', 'Greater Western Sydney': 'GWS',
      'Hawthorn': 'HAW', 'Hawthorn Hawks': 'HAW',
      'Melbourne': 'MEL', 'Melbourne Demons': 'MEL',
      'North Melbourne': 'NTH', 'North Melbourne Kangaroos': 'NTH',
      'Port Adelaide': 'PTA', 'Port Adelaide Power': 'PTA',
      'Richmond': 'RIC', 'Richmond Tigers': 'RIC',
      'St Kilda': 'STK', 'St Kilda Saints': 'STK',
      'Sydney': 'SYD', 'Sydney Swans': 'SYD',
      'Western Bulldogs': 'WBD',
      'West Coast': 'WCE', 'West Coast Eagles': 'WCE'
    };
    
    return teamMapping[team] || team.toUpperCase().substring(0, 3);
  }

  private static normalizePosition(position: string): string {
    const pos = position.toUpperCase();
    if (pos.includes('RUC') || pos.includes('RUCK')) return 'RUCK';
    if (pos.includes('MID')) return 'MID';
    if (pos.includes('DEF')) return 'DEF';
    if (pos.includes('FWD')) return 'FWD';
    return 'MID'; // Default
  }

  /**
   * Get player data by ID
   */
  static async getPlayerById(id: number): Promise<MasterPlayerData | null> {
    await this.loadMasterStats();
    return this.playerIdMap.get(id) || null;
  }

  /**
   * Get player data by name (case-insensitive)
   */
  static async getPlayerByName(name: string): Promise<MasterPlayerData | null> {
    await this.loadMasterStats();
    return this.playerNameMap.get(name.toLowerCase()) || null;
  }

  /**
   * Get all players
   */
  static async getAllPlayers(): Promise<MasterPlayerData[]> {
    await this.loadMasterStats();
    return this.masterStats?.players || [];
  }

  /**
   * Get tool-specific data with proper field mapping
   */
  static async getDataForTool(toolName: string, playerName: string): Promise<any> {
    const player = await this.getPlayerByName(playerName);
    if (!player) return null;

    switch (toolName) {
      case 'price':
        return {
          id: Array.from(this.playerNameMap.keys()).indexOf(playerName.toLowerCase()) + 1,
          name: player.name,
          position: player.position,
          team: player.team,
          price: player.price,
          breakeven: player.break_even, // Field mapping
          average: player.average_points, // Field mapping
          projectedScore: player.projected_score,
          lastScore: player.last_score,
          l3Average: player.last_3_average,
          l5Average: player.last_5_average,
          selectedBy: player.ownership_percentage,
          ceiling: player.high_score,
          floor: player.low_score,
          consistency: player.consistency_rating,
          scores: this.extractScoresFromGameLogs(player),
          redDotFlag: this.calculateInjuryStatus(player),
          dvpRating: this.getDVPDifficulty(player.team, player.position)
        };

      case 'risk':
        return {
          name: player.name,
          position: player.position,
          team: player.team,
          consistency_rating: player.consistency_rating,
          standard_deviation: player.standard_deviation,
          high_score: player.high_score,
          low_score: player.low_score,
          ownership_percentage: player.ownership_percentage,
          games_played: player.games_played,
          average_points: player.average_points,
          total_points: player.total_points
        };

      case 'trade':
        return {
          price: player.price,
          breakeven: player.break_even,
          proj_scores: await this.generateProjectedScoresArray(player, 5),
          is_red_dot: this.calculateInjuryStatus(player),
          name: player.name,
          position: player.position,
          team: player.team,
          dvpRating: this.getDVPDifficulty(player.team, player.position),
          opponentDifficulty: this.getDVPDifficulty(player.team, player.position)
        };

      case 'score':
        return {
          name: player.name,
          team: player.team,
          position: player.position,
          price: player.price,
          averagePoints: player.average_points, // Field mapping fix
          breakeven: player.break_even,
          lastRoundScore: player.last_score,
          projectedScore: player.projected_score,
          recentGameLogs: player.recentGameLogs || [],
          opponentDifficulty: this.getDVPDifficulty(player.team, player.position),
          nextOpponent: player.nextOpponent,
          nextVenue: player.nextVenue,
          consistency: player.consistency_rating,
          ceiling: player.high_score,
          floor: player.low_score,
          dvpRating: this.getDVPDifficulty(player.team, player.position),
          // Venue Analysis Stats
          lastScoreAtVenue: player.last_score_at_venue || null,
          avgScoreAtVenue: player.avg_score_at_venue || null,
          venueFactor: player.venue_factor || 1.0
        };

      case 'ai':
        return {
          name: player.name,
          price: player.price,
          average_points: player.average_points,
          ownership_percentage: player.ownership_percentage,
          consistency_rating: player.consistency_rating,
          value_rating: player.value_rating,
          value_index: player.value_index,
          projected_score: player.projected_score,
          position: player.position,
          team: player.team,
          dvpRating: this.getDVPDifficulty(player.team, player.position),
          opponentDifficulty: this.getDVPDifficulty(player.team, player.position)
        };

      case 'cash':
        return {
          name: player.name,
          price: player.price,
          break_even: player.break_even,
          average_points: player.average_points,
          games_played: player.games_played,
          value_rating: player.value_rating,
          projected_score: player.projected_score,
          total_points: player.total_points,
          last_3_average: player.last_3_average,
          dvpRating: this.getDVPDifficulty(player.team, player.position)
        };

      default:
        return player;
    }
  }

  /**
   * Calculate venue-specific performance statistics from game logs
   */
  static calculateVenueStats(player: MasterPlayerData, venue: string): {
    lastScoreAtVenue: number | null,
    avgScoreAtVenue: number | null,
    venueFactor: number
  } {
    if (!player.recentGameLogs) {
      return {
        lastScoreAtVenue: null,
        avgScoreAtVenue: null,
        venueFactor: 1.0
      };
    }

    // Find games at this venue
    const venueGames = player.recentGameLogs.filter(log => 
      log.VEN && log.VEN.toLowerCase().includes(venue.toLowerCase())
    );

    if (venueGames.length === 0) {
      return {
        lastScoreAtVenue: null,
        avgScoreAtVenue: null,
        venueFactor: 1.0
      };
    }

    // Get last score at venue
    const lastScoreAtVenue = venueGames[venueGames.length - 1].FP || null;

    // Calculate average of last 3 games at venue
    const recentVenueGames = venueGames.slice(-3);
    const venueScores = recentVenueGames.map(log => log.FP).filter(score => score > 0);
    const avgScoreAtVenue = venueScores.length > 0 
      ? venueScores.reduce((sum, score) => sum + score, 0) / venueScores.length
      : null;

    // Calculate venue factor (compare venue average to overall average)
    let venueFactor = 1.0;
    if (avgScoreAtVenue && player.average_points > 0) {
      const ratio = avgScoreAtVenue / player.average_points;
      // Cap venue factor between 0.8 and 1.2
      venueFactor = Math.max(0.8, Math.min(1.2, ratio));
    }

    return {
      lastScoreAtVenue,
      avgScoreAtVenue,
      venueFactor
    };
  }

  /**
   * Calculate opponent-specific performance from game logs
   */
  static calculateVsOpponentStats(player: MasterPlayerData, opponent: string): {
    lastScore: number | null;
    last3Average: number | null;
    gamesPlayed: number;
  } {
    const vsOpponentGames = player.recentGameLogs
      .filter(game => game.OPP === opponent)
      .sort((a, b) => parseInt(b.RD) - parseInt(a.RD));

    if (vsOpponentGames.length === 0) {
      return { lastScore: null, last3Average: null, gamesPlayed: 0 };
    }

    const scores = vsOpponentGames.map(game => game.SC);
    const lastScore = scores[0];
    const last3Average = scores.slice(0, 3).reduce((sum, score) => sum + score, 0) / Math.min(3, scores.length);

    return {
      lastScore,
      last3Average: scores.length >= 3 ? Math.round(last3Average * 10) / 10 : null,
      gamesPlayed: scores.length
    };
  }

  /**
   * Calculate venue-specific performance from game logs
   */
  static calculateAtVenueStats(player: MasterPlayerData, venue: string): {
    lastScore: number | null;
    last3Average: number | null;
    gamesPlayed: number;
  } {
    if (!player.recentGameLogs || player.recentGameLogs.length === 0) {
      return { lastScore: null, last3Average: null, gamesPlayed: 0 };
    }
    
    const atVenueGames = player.recentGameLogs
      .filter(game => game.VEN === venue)
      .sort((a, b) => parseInt(b.RD) - parseInt(a.RD));

    if (atVenueGames.length === 0) {
      return { lastScore: null, last3Average: null, gamesPlayed: 0 };
    }

    const scores = atVenueGames.map(game => game.SC);
    const lastScore = scores[0];
    const last3Average = scores.slice(0, 3).reduce((sum, score) => sum + score, 0) / Math.min(3, scores.length);

    return {
      lastScore,
      last3Average: scores.length >= 3 ? Math.round(last3Average * 10) / 10 : null,
      gamesPlayed: scores.length
    };
  }

  /**
   * Extract scores array from recent game logs
   */
  private static extractScoresFromGameLogs(player: MasterPlayerData): number[] {
    if (!player.recentGameLogs || player.recentGameLogs.length === 0) {
      return [];
    }
    return player.recentGameLogs
      .sort((a, b) => parseInt(b.RD) - parseInt(a.RD))
      .map(game => game.SC);
  }

  /**
   * Calculate injury status from game data
   */
  private static calculateInjuryStatus(player: MasterPlayerData): boolean {
    // Simple injury detection: if last score is 0 or no recent games
    return player.last_score === 0 || player.games_played === 0;
  }

  /**
   * Generate projected scores array for trade calculations
   */
  private static async generateProjectedScoresArray(player: MasterPlayerData, rounds: number): Promise<number[]> {
    const baseProjection = player.projected_score;
    const scores: number[] = [];
    
    // Use recent form to add realistic variance
    const recentScores = this.extractScoresFromGameLogs(player);
    const variance = recentScores.length > 0 ? 
      Math.sqrt(recentScores.reduce((sum, score) => sum + Math.pow(score - player.average_points, 2), 0) / recentScores.length) :
      15; // Default variance

    for (let i = 0; i < rounds; i++) {
      // Add realistic variance based on player's historical volatility
      const randomVariance = (Math.random() - 0.5) * variance * 0.4; // 40% of historical variance
      const projectedScore = Math.round(Math.max(20, baseProjection + randomVariance));
      scores.push(projectedScore);
    }

    return scores;
  }

  /**
   * Enhanced projection using recentGameLogs and opponent/venue data
   */
  static async enhanceWithProjections(player: MasterPlayerData): Promise<MasterPlayerData & { enhancedProjectedScore: number }> {
    // Base projected score
    let enhancedScore = player.projected_score;
    
    // Enhance with opponent-specific performance
    if (player.nextOpponent) {
      const vsOpponentStats = this.calculateVsOpponentStats(player, player.nextOpponent);
      if (vsOpponentStats.lastScore) {
        // Weight recent vs opponent performance (15%)
        enhancedScore = (enhancedScore * 0.85) + (vsOpponentStats.lastScore * 0.15);
      }
    }
    
    // Enhance with venue-specific performance
    if (player.nextVenue) {
      const atVenueStats = this.calculateAtVenueStats(player, player.nextVenue);
      if (atVenueStats.lastScore) {
        // Weight recent at venue performance (10%)
        enhancedScore = (enhancedScore * 0.90) + (atVenueStats.lastScore * 0.10);
      }
    }
    
    // Factor in opponent difficulty
    if (player.opponent_difficulty > 0) {
      const difficultyMultiplier = 1 + ((5 - player.opponent_difficulty) * 0.02); // ±10% based on difficulty
      enhancedScore *= difficultyMultiplier;
    }
    
    return {
      ...player,
      enhancedProjectedScore: Math.round(Math.max(20, enhancedScore))
    };
  }

  /**
   * Get metadata about the master stats file
   */
  static async getMetadata(): Promise<any> {
    await this.loadMasterStats();
    return this.masterStats?.metadata || {};
  }

  /**
   * Search players by criteria
   */
  static async searchPlayers(criteria: {
    team?: string;
    position?: string;
    minPrice?: number;
    maxPrice?: number;
    minAverage?: number;
  }): Promise<MasterPlayerData[]> {
    const allPlayers = await this.getAllPlayers();
    
    return allPlayers.filter(player => {
      if (criteria.team && player.team !== criteria.team) return false;
      if (criteria.position && player.position !== criteria.position) return false;
      if (criteria.minPrice && player.price < criteria.minPrice) return false;
      if (criteria.maxPrice && player.price > criteria.maxPrice) return false;
      if (criteria.minAverage && player.average_points < criteria.minAverage) return false;
      return true;
    });
  }
}

export default MasterDataService;