import express from 'express';
import { db } from '../db';
import { playerDvpRatings, teamDvpRatings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Get all team DVP ratings
router.get('/team-ratings', async (req, res) => {
  try {
    const ratings = await db.select().from(teamDvpRatings);
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching team DVP ratings:', error);
    res.status(500).json({ error: 'Failed to fetch team DVP ratings' });
  }
});

// Get DVP rating for a specific team
router.get('/team-ratings/:team', async (req, res) => {
  try {
    const { team } = req.params;
    const rating = await db
      .select()
      .from(teamDvpRatings)
      .where(eq(teamDvpRatings.team, team))
      .limit(1);
    
    if (rating.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(rating[0]);
  } catch (error) {
    console.error('Error fetching team DVP rating:', error);
    res.status(500).json({ error: 'Failed to fetch team DVP rating' });
  }
});

// Get all player DVP ratings
router.get('/player-ratings', async (req, res) => {
  try {
    const { player, opponent, position } = req.query;
    
    let query = db.select().from(playerDvpRatings);
    const conditions = [];
    
    if (player) {
      conditions.push(eq(playerDvpRatings.player, player as string));
    }
    
    if (opponent) {
      conditions.push(eq(playerDvpRatings.opponent, opponent as string));
    }
    
    if (position) {
      conditions.push(eq(playerDvpRatings.position, position as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const ratings = await query;
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching player DVP ratings:', error);
    res.status(500).json({ error: 'Failed to fetch player DVP ratings' });
  }
});

// Get DVP ratings for a specific player vs all opponents
router.get('/player-ratings/:player', async (req, res) => {
  try {
    const { player } = req.params;
    const ratings = await db
      .select()
      .from(playerDvpRatings)
      .where(eq(playerDvpRatings.player, player));
    
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching player DVP ratings:', error);
    res.status(500).json({ error: 'Failed to fetch player DVP ratings' });
  }
});

// Get DVP ratings for a specific player vs specific opponent
router.get('/player-ratings/:player/:opponent', async (req, res) => {
  try {
    const { player, opponent } = req.params;
    const rating = await db
      .select()
      .from(playerDvpRatings)
      .where(
        and(
          eq(playerDvpRatings.player, player),
          eq(playerDvpRatings.opponent, opponent)
        )
      )
      .limit(1);
    
    if (rating.length === 0) {
      return res.status(404).json({ error: 'Player DVP rating not found' });
    }
    
    res.json(rating[0]);
  } catch (error) {
    console.error('Error fetching player DVP rating:', error);
    res.status(500).json({ error: 'Failed to fetch player DVP rating' });
  }
});

// Get DVP matrix - combined view for easier frontend consumption
router.get('/matrix', async (req, res) => {
  try {
    const teamRatings = await db.select().from(teamDvpRatings);
    
    // Transform to position-based matrix
    const matrix: any = {
      Forward: {},
      Midfielder: {},
      Defender: {},
      Ruck: {}
    };
    
    teamRatings.forEach(team => {
      matrix.Forward[team.team] = {
        rating: team.forwardRating,
        avgPointsAllowed: team.forwardAvgPointsAllowed,
        rank: team.forwardRank
      };
      
      matrix.Midfielder[team.team] = {
        rating: team.midfielderRating,
        avgPointsAllowed: team.midfielderAvgPointsAllowed,
        rank: team.midfielderRank
      };
      
      matrix.Defender[team.team] = {
        rating: team.defenderRating,
        avgPointsAllowed: team.defenderAvgPointsAllowed,
        rank: team.defenderRank
      };
      
      matrix.Ruck[team.team] = {
        rating: team.ruckRating,
        avgPointsAllowed: team.ruckAvgPointsAllowed,
        rank: team.ruckRank
      };
    });
    
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching DVP matrix:', error);
    res.status(500).json({ error: 'Failed to fetch DVP matrix' });
  }
});

export default router;
