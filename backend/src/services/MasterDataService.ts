/**
 * Master Data Service
 * 
 * Centralized service for accessing and transforming player data from the database
 * Handles field mapping, data enhancement, and tool-specific data formatting
 */

import { db } from '../utils/db';
import { players, dfsPlayers, playerRoundStats } from '@shared/schema';
import { eq, ilike, sql, and, gte, lte } from 'drizzle-orm';

interface ToolPlayerData {
  id?: number;
  name: string;
  team: string;
  position: string;
  price: number;
  breakeven?: number;
  average?: number;
  averagePoints?: number;
  projectedScore?: number;
  lastScore?: number;
  l3Average?: number;
  l5Average?: number;
  selectedBy?: number;
  ceiling?: number;
  floor?: number;
  consistency?: number;
  consistency_rating?: number;
  standard_deviation?: number;
  high_score?: number;
  low_score?: number;
  ownership_percentage?: number;
  games_played?: number;
  total_points?: number;
  value_rating?: string;
  value_index?: number;
  recentGameLogs?: any[];
  nextOpponent?: string;
  nextVenue?: string;
  opponentDifficulty?: number;
  scores?: number[];
  redDotFlag?: boolean;
  dvpRating?: number;
  proj_scores?: number[];
  is_red_dot?: boolean;
  lastRoundScore?: number;
  venueFactor?: number;
  lastScoreAtVenue?: number | null;
  avgScoreAtVenue?: number | null;
  break_even?: number;
  last_3_average?: number;
}

export class MasterDataService {
  private static dvpData: any = null;

  /**
   * Load DVP data if available
   */
  private static async loadDVPData(): Promise<void> {
    // DVP data would be loaded from database tables if needed
    // For now, returning default values
    this.dvpData = {};
  }

  /**
   * Get DVP difficulty rating for team and position
   */
  static getDVPDifficulty(team: string, position: string, round?: number): number {
    return 5.0; // Default medium difficulty - can be enhanced with DVP table lookups
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
  static async getPlayerById(id: number): Promise<any | null> {
    const playerData = await db.select().from(players).where(eq(players.id, id)).limit(1);
    return playerData[0] || null;
  }

  /**
   * Get player data by name (case-insensitive)
   */
  static async getPlayerByName(name: string): Promise<any | null> {
    const playerData = await db.select().from(players).where(
      ilike(players.name, name)
    ).limit(1);
    
    return playerData[0] || null;
  }

  /**
   * Get all players
   */
  static async getAllPlayers(): Promise<any[]> {
    return await db.select().from(players);
  }

  /**
   * Get recent game logs for a player
   */
  static async getRecentGameLogs(playerId: number, limit: number = 10): Promise<any[]> {
    const gameLogs = await db.select().from(playerRoundStats)
      .where(eq(playerRoundStats.playerId, playerId))
      .orderBy(sql`${playerRoundStats.round} DESC`)
      .limit(limit);
    
    return gameLogs.map(log => ({
      RD: String(log.round),
      TM: '', // Would need to join with fixtures table
      OPP: log.opponent || '',
      VEN: log.venue || '',
      SC: log.fantasyPoints || 0,
      FP: log.fantasyPoints || 0,
      K: log.kicks || 0,
      H: log.handballs || 0,
      M: log.marks || 0,
      T: log.tackles || 0,
      TOG: log.timeOnGround || 0
    }));
  }

  /**
   * Get tool-specific data with proper field mapping
   */
  static async getDataForTool(toolName: string, playerName: string): Promise<ToolPlayerData | null> {
    const player = await this.getPlayerByName(playerName);
    if (!player) return null;

    const recentGameLogs = await this.getRecentGameLogs(player.id);
    
    switch (toolName) {
      case 'price':
        return {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          price: player.price,
          breakeven: player.breakEven,
          average: player.averagePoints,
          projectedScore: player.projectedScore || player.averagePoints,
          lastScore: player.lastScore,
          l3Average: player.l3Average,
          l5Average: player.l5Average,
          selectedBy: player.selectionPercentage,
          ceiling: player.highScore,
          floor: player.lowScore,
          consistency: player.consistency,
          scores: this.extractScoresFromGameLogs(recentGameLogs),
          redDotFlag: this.calculateInjuryStatus(player),
          dvpRating: this.getDVPDifficulty(player.team, player.position)
        };

      case 'risk':
        return {
          name: player.name,
          position: player.position,
          team: player.team,
          consistency_rating: player.consistency,
          standard_deviation: player.standardDeviation,
          high_score: player.highScore,
          low_score: player.lowScore,
          ownership_percentage: player.selectionPercentage,
          games_played: player.roundsPlayed,
          average: player.averagePoints,
          averagePoints: player.averagePoints,
          total_points: player.totalPoints,
          price: player.price
        };

      case 'trade':
        return {
          price: player.price,
          breakeven: player.breakEven,
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
          averagePoints: player.averagePoints,
          breakeven: player.breakEven,
          lastRoundScore: player.lastScore,
          projectedScore: player.projectedScore || player.averagePoints,
          recentGameLogs: recentGameLogs,
          opponentDifficulty: this.getDVPDifficulty(player.team, player.position),
          nextOpponent: player.nextOpponent,
          nextVenue: player.nextVenue,
          consistency: player.consistency,
          ceiling: player.highScore,
          floor: player.lowScore,
          dvpRating: this.getDVPDifficulty(player.team, player.position),
          lastScoreAtVenue: null,
          avgScoreAtVenue: null,
          venueFactor: 1.0
        };

      case 'ai':
        return {
          name: player.name,
          price: player.price,
          averagePoints: player.averagePoints,
          average: player.averagePoints,
          ownership_percentage: player.selectionPercentage,
          consistency_rating: player.consistency,
          value_rating: player.valueRating || 'neutral',
          value_index: player.valueIndex,
          projectedScore: player.projectedScore || player.averagePoints,
          position: player.position,
          team: player.team,
          dvpRating: this.getDVPDifficulty(player.team, player.position),
          opponentDifficulty: this.getDVPDifficulty(player.team, player.position)
        };

      case 'cash':
        return {
          name: player.name,
          price: player.price,
          break_even: player.breakEven,
          averagePoints: player.averagePoints,
          average: player.averagePoints,
          games_played: player.roundsPlayed,
          value_rating: player.valueRating || 'neutral',
          projectedScore: player.projectedScore || player.averagePoints,
          total_points: player.totalPoints,
          last_3_average: player.l3Average,
          dvpRating: this.getDVPDifficulty(player.team, player.position),
          team: player.team,
          position: player.position
        };

      default:
        return player;
    }
  }

  /**
   * Calculate venue-specific performance statistics from game logs
   */
  static calculateVenueStats(recentGameLogs: any[], venue: string): {
    lastScoreAtVenue: number | null,
    avgScoreAtVenue: number | null,
    venueFactor: number
  } {
    if (!recentGameLogs || recentGameLogs.length === 0) {
      return {
        lastScoreAtVenue: null,
        avgScoreAtVenue: null,
        venueFactor: 1.0
      };
    }

    const venueGames = recentGameLogs.filter(log => 
      log.VEN && log.VEN.toLowerCase().includes(venue.toLowerCase())
    );

    if (venueGames.length === 0) {
      return {
        lastScoreAtVenue: null,
        avgScoreAtVenue: null,
        venueFactor: 1.0
      };
    }

    const lastScoreAtVenue = venueGames[venueGames.length - 1].FP || null;
    const recentVenueGames = venueGames.slice(-3);
    const venueScores = recentVenueGames.map(log => log.FP).filter(score => score > 0);
    const avgScoreAtVenue = venueScores.length > 0 
      ? venueScores.reduce((sum, score) => sum + score, 0) / venueScores.length
      : null;

    let venueFactor = 1.0;
    if (avgScoreAtVenue && venueScores.length > 0) {
      const avgAllGames = recentGameLogs.map(g => g.FP).reduce((sum, s) => sum + s, 0) / recentGameLogs.length;
      if (avgAllGames > 0) {
        const ratio = avgScoreAtVenue / avgAllGames;
        venueFactor = Math.max(0.8, Math.min(1.2, ratio));
      }
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
  static calculateVsOpponentStats(recentGameLogs: any[], opponent: string): {
    lastScore: number | null;
    last3Average: number | null;
    gamesPlayed: number;
  } {
    const vsOpponentGames = recentGameLogs
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
  static calculateAtVenueStats(recentGameLogs: any[], venue: string): {
    lastScore: number | null;
    last3Average: number | null;
    gamesPlayed: number;
  } {
    if (!recentGameLogs || recentGameLogs.length === 0) {
      return { lastScore: null, last3Average: null, gamesPlayed: 0 };
    }
    
    const atVenueGames = recentGameLogs
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
  private static extractScoresFromGameLogs(recentGameLogs: any[]): number[] {
    if (!recentGameLogs || recentGameLogs.length === 0) {
      return [];
    }
    return recentGameLogs
      .sort((a, b) => parseInt(b.RD) - parseInt(a.RD))
      .map(game => game.SC);
  }

  /**
   * Calculate injury status from game data
   */
  private static calculateInjuryStatus(player: any): boolean {
    return player.isInjured || player.lastScore === 0 || player.roundsPlayed === 0;
  }

  /**
   * Generate projected scores array for trade calculations
   */
  private static async generateProjectedScoresArray(player: any, rounds: number): Promise<number[]> {
    const baseProjection = player.projectedScore || player.averagePoints;
    const scores: number[] = [];
    
    const variance = player.standardDeviation || 15;

    for (let i = 0; i < rounds; i++) {
      const randomVariance = (Math.random() - 0.5) * variance * 0.4;
      const projectedScore = Math.round(Math.max(20, baseProjection + randomVariance));
      scores.push(projectedScore);
    }

    return scores;
  }

  /**
   * Enhanced projection using recentGameLogs and opponent/venue data
   */
  static async enhanceWithProjections(player: any): Promise<any> {
    let enhancedScore = player.projectedScore || player.averagePoints;
    
    const recentGameLogs = await this.getRecentGameLogs(player.id);
    
    if (player.nextOpponent) {
      const vsOpponentStats = this.calculateVsOpponentStats(recentGameLogs, player.nextOpponent);
      if (vsOpponentStats.lastScore) {
        enhancedScore = (enhancedScore * 0.85) + (vsOpponentStats.lastScore * 0.15);
      }
    }
    
    if (player.nextVenue) {
      const atVenueStats = this.calculateAtVenueStats(recentGameLogs, player.nextVenue);
      if (atVenueStats.lastScore) {
        enhancedScore = (enhancedScore * 0.90) + (atVenueStats.lastScore * 0.10);
      }
    }
    
    if (player.opponentDifficulty > 0) {
      const difficultyMultiplier = 1 + ((5 - player.opponentDifficulty) * 0.02);
      enhancedScore *= difficultyMultiplier;
    }
    
    return {
      ...player,
      enhancedProjectedScore: Math.round(Math.max(20, enhancedScore))
    };
  }

  /**
   * Get metadata about the database
   */
  static async getMetadata(): Promise<any> {
    const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM players`);
    return {
      total_players: countResult.rows[0]?.total || 0,
      data_sources: ['database'],
      generated_at: new Date().toISOString(),
      version: '2.0.0'
    };
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
  }): Promise<any[]> {
    let query = db.select().from(players);
    
    const conditions: any[] = [];
    
    if (criteria.team) {
      conditions.push(eq(players.team, criteria.team));
    }
    if (criteria.position) {
      conditions.push(eq(players.position, criteria.position));
    }
    if (criteria.minPrice) {
      conditions.push(gte(players.price, criteria.minPrice));
    }
    if (criteria.maxPrice) {
      conditions.push(lte(players.price, criteria.maxPrice));
    }
    if (criteria.minAverage) {
      conditions.push(gte(players.averagePoints, criteria.minAverage));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }
}

export default MasterDataService;
