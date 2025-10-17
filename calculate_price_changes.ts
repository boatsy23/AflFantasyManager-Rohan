import { db } from './public/server/db';
import { players, playerRoundScores } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function calculatePriceChanges() {
  console.log('💰 Calculating price changes from historical data...');
  
  // Get the latest round number
  const latestRoundResult = await db
    .select({ maxRound: sql<number>`MAX(round)` })
    .from(playerRoundScores);
  
  const latestRound = latestRoundResult[0]?.maxRound || 23;
  console.log(`Latest round: ${latestRound}`);
  
  // For each player, calculate price change from previous round to latest round
  const allPlayers = await db.select({ id: players.id, name: players.name }).from(players);
  
  let updated = 0;
  let noData = 0;
  
  for (const player of allPlayers) {
    try {
      // Get latest round price
      const latestPrice = await db
        .select({ price: playerRoundScores.price })
        .from(playerRoundScores)
        .where(eq(playerRoundScores.playerId, player.id))
        .where(eq(playerRoundScores.round, latestRound))
        .limit(1);
      
      // Get previous round price
      const previousPrice = await db
        .select({ price: playerRoundScores.price })
        .from(playerRoundScores)
        .where(eq(playerRoundScores.playerId, player.id))
        .where(eq(playerRoundScores.round, latestRound - 1))
        .limit(1);
      
      if (latestPrice.length > 0 && previousPrice.length > 0) {
        const priceChange = latestPrice[0].price - previousPrice[0].price;
        
        // Update player with price change
        await db
          .update(players)
          .set({ priceChange })
          .where(eq(players.id, player.id));
        
        updated++;
        if (updated % 50 === 0) {
          console.log(`Updated ${updated} players...`);
        }
      } else {
        noData++;
      }
    } catch (error) {
      console.error(`Error calculating price change for ${player.name}:`, error);
    }
  }
  
  console.log(`\n✅ Updated ${updated} players with price changes`);
  console.log(`⚠️  ${noData} players missing round data`);
  
  process.exit(0);
}

calculatePriceChanges().catch(console.error);
