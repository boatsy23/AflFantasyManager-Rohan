import { db } from './public/server/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

interface HistoricalPlayer {
  name: string;
  value: number;
  round: number;
}

interface HistoricalData {
  [round: string]: {
    [playerKey: string]: HistoricalPlayer;
  };
}

async function loadRoundValueRatingsFast() {
  console.log('📊 Loading round-by-round value ratings (FAST method)...\n');
  
  // Read the historical data file
  const historicalPath = 'data/historical/break_evens_historical.json';
  const rawData = fs.readFileSync(historicalPath, 'utf-8');
  const historicalData: HistoricalData = JSON.parse(rawData);
  
  console.log(`Loaded historical data with ${Object.keys(historicalData).length} rounds`);
  
  // Step 1: Clear existing value ratings from players table
  console.log('\n🗑️  Clearing season-level value ratings from players table...');
  await db.execute(sql`UPDATE players SET value_index = NULL, value_rating = NULL`);
  console.log('✅ Cleared value ratings from players table');
  
  // Step 2: Build values array for temporary table
  console.log('\n📊 Processing historical data...');
  const values: Array<{ name: string; round: number; value: number }> = [];
  
  for (const [roundStr, roundData] of Object.entries(historicalData)) {
    const round = parseInt(roundStr);
    
    for (const [playerKey, playerData] of Object.entries(roundData)) {
      if (playerData.value && playerData.value > 0) {
        values.push({
          name: playerData.name,
          round: round,
          value: playerData.value
        });
      }
    }
  }
  
  console.log(`Found ${values.length} player-round value ratings to load`);
  
  // Step 3: Create temporary table and load data
  console.log('\n💾 Creating temporary table and loading data...');
  await db.execute(sql`
    CREATE TEMP TABLE temp_values (
      player_name TEXT,
      round INT,
      value REAL
    )
  `);
  
  // Insert data in batches
  const batchSize = 1000;
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const valueStrings = batch.map(v => 
      `('${v.name.replace(/'/g, "''")}', ${v.round}, ${v.value})`
    ).join(',');
    
    await db.execute(sql.raw(`
      INSERT INTO temp_values (player_name, round, value)
      VALUES ${valueStrings}
    `));
    
    if ((i + batchSize) % 5000 === 0) {
      console.log(`  Loaded ${Math.min(i + batchSize, values.length)} / ${values.length} records...`);
    }
  }
  
  console.log(`✅ Loaded ${values.length} records into temporary table`);
  
  // Step 4: Update player_round_scores using JOIN
  console.log('\n🔄 Updating player_round_scores with value ratings...');
  const result = await db.execute(sql`
    UPDATE player_round_scores AS prs
    SET value = tv.value
    FROM temp_values AS tv
    INNER JOIN players AS p ON LOWER(p.name) = LOWER(tv.player_name)
    WHERE prs.player_id = p.id
      AND prs.round = tv.round
  `);
  
  console.log(`✅ Updated ${result.rowCount} player_round_scores records`);
  
  // Step 5: Verify results
  console.log('\n📊 Verification:');
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total_records,
      COUNT(value) as with_value,
      ROUND(AVG(value), 2) as avg_value,
      MIN(value) as min_value,
      MAX(value) as max_value
    FROM player_round_scores
  `);
  
  console.log('Statistics:', stats.rows[0]);
  
  // Sample data
  console.log('\n📋 Sample data (Round 14):');
  const samples = await db.execute(sql`
    SELECT p.name, prs.round, prs.value
    FROM player_round_scores prs
    JOIN players p ON p.id = prs.player_id
    WHERE prs.round = 14 AND prs.value IS NOT NULL
    ORDER BY prs.value DESC
    LIMIT 10
  `);
  
  samples.rows.forEach((row: any) => {
    console.log(`  ${row.name} (Round ${row.round}): ${row.value}`);
  });
  
  // Clean up
  await db.execute(sql`DROP TABLE temp_values`);
  
  console.log('\n✅ Complete!');
  process.exit(0);
}

loadRoundValueRatingsFast().catch(console.error);
