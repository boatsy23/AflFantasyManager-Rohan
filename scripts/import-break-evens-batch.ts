import { db } from '../backend/src/utils/db';
import { players } from '../shared/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface BreakEvenPlayer {
  name: string;
  position: string;
  price: number;
  break_even: number;
  average: number;
  round_score: number;
  value: number;
  team: string;
  round: number;
}

interface BreakEvenData {
  player_count: number;
  players: Record<string, BreakEvenPlayer>;
}

async function importBreakEvensBatch() {
  console.log('Starting batch break evens import...');
  
  const filePath = path.join(process.cwd(), 'data/historical/break_evens_round_23.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data: BreakEvenData = JSON.parse(rawData);
  
  console.log(`Found ${data.player_count} players in break evens file`);
  
  // Build batch update query using CASE statements
  const playerEntries = Object.values(data.players);
  
  // Create CASE statements for price and break_even
  const priceCase = playerEntries
    .map(p => `WHEN LOWER(name) = '${p.name.toLowerCase().replace(/'/g, "''")}' THEN ${p.price}`)
    .join('\n          ');
  
  const breakEvenCase = playerEntries
    .map(p => `WHEN LOWER(name) = '${p.name.toLowerCase().replace(/'/g, "''")}' THEN ${p.break_even}`)
    .join('\n          ');
  
  const playerNames = playerEntries.map(p => `'${p.name.toLowerCase().replace(/'/g, "''")}'`).join(', ');
  
  const updateQuery = `
    UPDATE players
    SET 
      price = CASE 
        ${priceCase}
        ELSE price
      END,
      break_even = CASE 
        ${breakEvenCase}
        ELSE break_even
      END
    WHERE LOWER(name) IN (${playerNames})
  `;
  
  console.log('Executing batch update...');
  const result = await db.execute(sql.raw(updateQuery));
  
  console.log(`✓ Batch update completed`);
  
  // Verify results
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      AVG(price)::int as avg_price,
      MAX(price) as max_price,
      MIN(price) as min_price
    FROM players 
    WHERE price > 0
  `);
  
  console.log('\n=== Price Statistics ===');
  console.log(`Total players: ${stats.rows[0].total}`);
  console.log(`Average price: $${(stats.rows[0].avg_price / 1000).toFixed(0)}k`);
  console.log(`Max price: $${(stats.rows[0].max_price / 1000).toFixed(0)}k`);
  console.log(`Min price: $${(stats.rows[0].min_price / 1000).toFixed(0)}k`);
  
  // Show top 10
  const topPlayers = await db.execute(sql`
    SELECT name, price, break_even, position
    FROM players
    WHERE price > 0
    ORDER BY price DESC
    LIMIT 10
  `);
  
  console.log('\nTop 10 most expensive players:');
  topPlayers.rows.forEach((p: any) => {
    console.log(`  ${p.name} (${p.position}): $${(p.price / 1000).toFixed(0)}k, BE: ${p.break_even}`);
  });
}

importBreakEvensBatch()
  .then(() => {
    console.log('\n✓ Break evens batch import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
