/**
 * Price Prediction API Routes
 * 
 * Provides RESTful endpoints for player price predictions using MasterDataService integration
 * Follows the same pattern as score-projection-routes.ts for consistency
 */

import { Router } from 'express';
import { PricePredictionService } from '../services/pricePredictionService';

const router = Router();
const pricePredictionService = new PricePredictionService();

/**
 * GET /api/price-prediction/:playerName
 * Get price prediction for a specific player
 */
router.get('/player/:playerName', async (req, res) => {
  try {
    const { playerName } = req.params;
    const rounds = parseInt(req.query.rounds as string) || 3;
    
    if (!playerName) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    const prediction = await pricePredictionService.calculatePricePrediction(
      decodeURIComponent(playerName),
      rounds
    );

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Player not found or unable to calculate prediction'
      });
    }

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Error in price prediction API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error calculating price prediction'
    });
  }
});

/**
 * GET /api/price-prediction/bulk
 * Get price predictions for multiple players (for dashboard views)
 */
router.post('/bulk', async (req, res) => {
  try {
    const { playerNames, rounds = 3 } = req.body;
    
    if (!Array.isArray(playerNames)) {
      return res.status(400).json({
        success: false,
        error: 'playerNames must be an array'
      });
    }

    const predictions = [];
    
    for (const playerName of playerNames) {
      try {
        const prediction = await pricePredictionService.calculatePricePrediction(playerName, rounds);
        if (prediction) {
          predictions.push(prediction);
        }
      } catch (error) {
        console.error(`Error predicting price for ${playerName}:`, error);
        // Continue with other players even if one fails
      }
    }

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });

  } catch (error) {
    console.error('Error in bulk price prediction API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error calculating bulk predictions'
    });
  }
});

export default router;