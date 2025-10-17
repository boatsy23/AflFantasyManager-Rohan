import { db } from './public/server/db';
import { sql } from 'drizzle-orm';

async function fixPriceChangesWithGaps() {
  console.log('💰 Calculating price changes handling gaps in round data...');
  
  // Use LAG window function to get the previous round's price for each player
  // This handles gaps where players miss rounds
  const result = await db.execute(sql`
    UPDATE player_round_scores AS current
    SET price_change = current.price - prev.price
    FROM (
      SELECT 
        id,
        price,
        LAG(price) OVER (PARTITION BY player_id ORDER BY round) as prev_price
      FROM player_round_scores
    ) AS prev
    WHERE current.id = prev.id
      AND prev.prev_price IS NOT NULL;
  `);
  
  console.log(`✅ Updated price changes for all rounds (${result.rowCount} records)`);
  
  // Verify by checking some sample data
  const sample = await db.execute(sql`
    SELECT p.name, prs.round, prs.price, prs.price_change
    FROM player_round_scores prs
    JOIN players p ON p.id = prs.player_id
    WHERE prs.price_change != 0
    ORDER BY prs.round, prs.price_change DESC
    LIMIT 10;
  `);
  
  console.log('\nSample of updated records:');
  console.log(sample.rows);
  
  // Check for records still missing price changes (first round per player)
  const nullCount = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM player_round_scores
    WHERE price_change IS NULL OR price_change = 0;
  `);
  
  console.log(`\nRecords with no price change (expected for first round): ${nullCount.rows[0].count}`);
  
  process.exit(0);
}

fixPriceChangesWithGaps().catch(console.error);
