import { db } from './public/server/db';
import { sql } from 'drizzle-orm';

async function fixRoundPriceChanges() {
  console.log('💰 Calculating price changes for all rounds using SQL...');
  
  // Use a SQL query to calculate price changes efficiently
  // This calculates the price difference from the previous round for each player
  const result = await db.execute(sql`
    UPDATE player_round_scores AS current
    SET price_change = current.price - previous.price
    FROM player_round_scores AS previous
    WHERE current.player_id = previous.player_id
      AND current.round = previous.round + 1;
  `);
  
  console.log(`✅ Updated price changes for all rounds`);
  console.log(`Affected rows:`, result.rowCount);
  
  // Verify by checking a few records
  const sample = await db.execute(sql`
    SELECT p.name, prs.round, prs.price, prs.price_change
    FROM player_round_scores prs
    JOIN players p ON p.id = prs.player_id
    WHERE prs.round IN (14, 15, 22)
      AND prs.price_change != 0
    LIMIT 10;
  `);
  
  console.log('\nSample of updated records:');
  console.log(sample.rows);
  
  process.exit(0);
}

fixRoundPriceChanges().catch(console.error);
