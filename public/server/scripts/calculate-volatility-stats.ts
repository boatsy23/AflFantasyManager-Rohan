/**
 * Calculate and populate volatility stats for all players
 * 
 * Volatility Stats Calculation:
 * - Floor (lowScore): Minimum non-zero score from all rounds
 * - Ceiling (highScore): Maximum non-zero score from all rounds
 * - Consistency: 0-10 rating based on coefficient of variation
 *   - Formula: 10 - (CV / 10), where CV = (stdDev / avg) * 100
 *   - Higher rating = more consistent scoring
 *   - Only calculated from non-zero scores (games actually played)
 * - Standard Deviation: Calculated from non-zero scores
 * 
 * Zero scores are filtered out as they represent games not played
 */

import { db } from '../db';
import { players, playerRoundScores } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function calculateVolatilityStats() {
  console.log('Starting volatility stats calculation...');
  
  try {
    // Get all round scores
    const allRoundScores = await db
      .select({
        playerId: playerRoundScores.playerId,
        score: playerRoundScores.score,
      })
      .from(playerRoundScores);
    
    console.log(`Found ${allRoundScores.length} round scores`);
    
    // Group scores by player
    const playerScores = new Map<number, number[]>();
    for (const score of allRoundScores) {
      if (!playerScores.has(score.playerId)) {
        playerScores.set(score.playerId, []);
      }
      playerScores.get(score.playerId)!.push(score.score);
    }
    
    console.log(`Calculating stats for ${playerScores.size} players...`);
    
    let updatedCount = 0;
    
    // Calculate and update volatility stats for each player
    for (const [playerId, scores] of playerScores) {
      if (scores.length === 0) continue;
      
      // Filter out zeros (games not played) for all calculations
      const playedScores = scores.filter((s: number) => s > 0);
      
      // Calculate floor and ceiling from played games only
      const lowScore = playedScores.length > 0 ? Math.min(...playedScores) : null;
      const highScore = playedScores.length > 0 ? Math.max(...playedScores) : null;
      
      // Calculate consistency rating and standard deviation
      let consistency = null;
      let standardDeviation = null;
      
      if (playedScores.length >= 2) {  // Need at least 2 games for meaningful stats
        const avg = playedScores.reduce((a: number, b: number) => a + b, 0) / playedScores.length;
        
        // Calculate standard deviation
        const variance = playedScores.reduce((sum: number, score: number) => 
          sum + Math.pow(score - avg, 2), 0) / playedScores.length;
        standardDeviation = Math.sqrt(variance);
        
        // Convert to 0-10 consistency rating (inverse of coefficient of variation)
        // Lower variation = higher consistency
        // CV = (stdDev / avg) * 100
        // Consistency = 10 - (CV / 10), capped at 0-10
        const cv = avg > 0 ? (standardDeviation / avg) * 100 : 0;
        consistency = Math.max(0, Math.min(10, 10 - (cv / 10)));
      }
      
      // Update player in database
      await db
        .update(players)
        .set({
          lowScore,
          highScore,
          consistency,
          standardDeviation,
        })
        .where(eq(players.id, playerId));
      
      updatedCount++;
      
      if (updatedCount % 50 === 0) {
        console.log(`Updated ${updatedCount} players...`);
      }
    }
    
    console.log(`✅ Successfully updated volatility stats for ${updatedCount} players`);
    console.log('\nVolatility Stats Calculation Method:');
    console.log('- Floor: Lowest non-zero score');
    console.log('- Ceiling: Highest non-zero score');
    console.log('- Consistency: 0-10 rating (10 - CV/10, where CV = stdDev/avg * 100)');
    console.log('- Standard Deviation: From non-zero scores only');
    console.log('- Zero scores excluded (games not played)');
    
  } catch (error) {
    console.error('Error calculating volatility stats:', error);
    throw error;
  }
}

// Run the script
calculateVolatilityStats()
  .then(() => {
    console.log('Volatility stats calculation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to calculate volatility stats:', error);
    process.exit(1);
  });
