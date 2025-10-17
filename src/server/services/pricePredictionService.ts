/**
 * Price Prediction Service 
 * 
 * Integrates with MasterDataService to provide price predictions using the authentic magic number algorithm
 * Follows the same pattern as ScoreProjector for consistency
 */

import MasterDataService from '../../../public/server/services/MasterDataService';

interface PricePredictionResult {
  source: string;
  current_price: number;
  predicted_price: number;
  price_change: number;
  confidence: number;
}

export class PricePredictionService {
  private readonly ALGORITHM_VERSION = "2.1.0";
  
  /**
   * Calculate price prediction for a single player using MasterDataService data
   */
  public async calculatePricePrediction(playerName: string, rounds: number = 3): Promise<PricePredictionResult | null> {
    try {
      // Get player data from MasterDataService (same pattern as score projector)
      const masterData = await MasterDataService.getDataForTool('price', playerName);
      if (!masterData) {
        return null;
      }

      // Use projected scores from the score projector for the next 3 rounds
      const projectedScores = await this.getProjectedScores(playerName, rounds);
      
      // Apply the authentic magic number algorithm
      const prediction = await this.simulatePriceChanges(
        masterData.price,
        masterData.breakeven,
        projectedScores,
        masterData.scores || []
      );

      return {
        source: `Custom Price Algorithm v${this.ALGORITHM_VERSION}`,
        current_price: masterData.price,
        predicted_price: prediction.finalPrice,
        price_change: prediction.totalChange,
        confidence: this.calculateConfidence(masterData)
      };
      
    } catch (error) {
      console.error(`Error calculating price prediction for ${playerName}:`, error);
      return null;
    }
  }

  /**
   * Get projected scores using the score projector service
   */
  private async getProjectedScores(playerName: string, rounds: number): Promise<number[]> {
    const scores = [];
    
    // Get projected scores for each round
    for (let round = 21; round < 21 + rounds; round++) {
      try {
        // Import ScoreProjector dynamically to avoid circular dependency
        const { ScoreProjector } = await import('../../../server/services/scoreProjector');
        const projector = new ScoreProjector();
        const projection = await projector.calculateProjectedScore(playerName, round);
        
        if (projection) {
          scores.push(projection.projectedScore);
        } else {
          // Use player's season average as fallback
          const masterData = await MasterDataService.getDataForTool('price', playerName);
          scores.push(masterData?.averagePoints || 70);
        }
      } catch (error) {
        // Fallback to season average
        const masterData = await MasterDataService.getDataForTool('price', playerName);
        scores.push(masterData?.averagePoints || 70);
      }
    }
    
    return scores;
  }

  /**
   * Simulate price changes using the authentic AFL Fantasy magic number algorithm
   */
  private async simulatePriceChanges(
    startPrice: number,
    startBreakeven: number,
    projectedScores: number[],
    recentScores: number[]
  ): Promise<{ finalPrice: number, totalChange: number, changes: any[] }> {
    
    // AFL Fantasy algorithm parameters
    const magicNumber = 3500; // Authentic magic number
    const betaWeight = 0.15;   // Price stability factor
    const priceSensitivityFactor = 150;

    let currentPrice = startPrice;
    let currentBreakeven = startBreakeven;
    const changes = [];
    
    // Score weights (most recent has highest weight)
    const scoreWeights = [5, 4, 3, 2, 1];

    for (let round = 0; round < projectedScores.length; round++) {
      const projectedScore = projectedScores[round];
      
      // Combine projected score with recent history
      const allScores = [projectedScore, ...recentScores].slice(0, 5);
      
      // Calculate weighted score sum
      let weightedSum = 0;
      for (let i = 0; i < allScores.length; i++) {
        weightedSum += scoreWeights[i] * allScores[i];
      }

      // Apply AFL Fantasy price formula: P_n = (1 - β) * P_{n-1} + M_n - Σ(α_k * S_k)
      const newPrice = Math.round(
        (1 - betaWeight) * currentPrice + magicNumber - weightedSum
      );

      const priceChange = newPrice - currentPrice;
      
      // Calculate new breakeven
      const currentWeightedAvg = weightedSum / scoreWeights.slice(0, allScores.length).reduce((a, b) => a + b, 0);
      const newBreakeven = Math.round(currentWeightedAvg + (priceChange / priceSensitivityFactor));

      changes.push({
        round: round + 1,
        projectedScore,
        priceChange,
        newPrice: Math.max(newPrice, 100000), // Price floor
        newBreakeven: Math.max(newBreakeven, 0) // Breakeven floor
      });

      // Update for next iteration
      currentPrice = Math.max(newPrice, 100000);
      currentBreakeven = Math.max(newBreakeven, 0);
      
      // Add this round's score to recent scores for next iteration
      recentScores.unshift(projectedScore);
      recentScores = recentScores.slice(0, 4); // Keep only last 4 for next calculation
    }

    const totalChange = changes.reduce((sum, change) => sum + change.priceChange, 0);

    return {
      finalPrice: currentPrice,
      totalChange,
      changes
    };
  }

  /**
   * Calculate confidence based on player consistency and data quality
   */
  private calculateConfidence(playerData: any): number {
    let confidence = 0.75; // Base confidence
    
    // Adjust based on games played (more games = higher confidence)
    if (playerData.gamesPlayed >= 15) {
      confidence += 0.1;
    } else if (playerData.gamesPlayed <= 5) {
      confidence -= 0.15;
    }
    
    // Adjust based on consistency rating
    if (playerData.consistency >= 80) {
      confidence += 0.1;
    } else if (playerData.consistency <= 50) {
      confidence -= 0.1;
    }
    
    // Adjust based on recent form availability
    if (playerData.scores && playerData.scores.length >= 5) {
      confidence += 0.05;
    }
    
    return Math.max(0.4, Math.min(0.95, confidence));
  }
}