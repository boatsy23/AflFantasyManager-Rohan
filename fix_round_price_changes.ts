import { db } from './public/server/db';
import { playerRoundScores } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function fixRoundPriceChanges() {
  console.log('💰 Calculating price changes for each round...');
  
  // Get all unique player IDs
  const players = await db
    .selectDistinct({ playerId: playerRoundScores.playerId })
    .from(playerRoundScores);
  
  console.log(`Found ${players.length} unique players`);
  
  let updated = 0;
  
  for (const { playerId } of players) {
    try {
      // Get all rounds for this player, sorted by round
      const rounds = await db
        .select({
          id: playerRoundScores.id,
          round: playerRoundScores.round,
          price: playerRoundScores.price
        })
        .from(playerRoundScores)
        .where(eq(playerRoundScores.playerId, playerId))
        .orderBy(playerRoundScores.round);
      
      // Calculate price change for each round (compared to previous round)
      for (let i = 1; i < rounds.length; i++) {
        const currentRound = rounds[i];
        const previousRound = rounds[i - 1];
        const priceChange = currentRound.price - previousRound.price;
        
        // Update the price_change for this round
        await db
          .update(playerRoundScores)
          .set({ priceChange })
          .where(eq(playerRoundScores.id, currentRound.id));
        
        updated++;
      }
      
      if (updated % 1000 === 0) {
        console.log(`Updated ${updated} round records...`);
      }
    } catch (error) {
      console.error(`Error processing player ${playerId}:`, error);
    }
  }
  
  console.log(`\n✅ Updated ${updated} round records with price changes`);
  
  process.exit(0);
}

fixRoundPriceChanges().catch(console.error);
