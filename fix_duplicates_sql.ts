import { db } from './public/server/db';
import { sql } from 'drizzle-orm';

async function fixDuplicates() {
  console.log('🔧 Fixing all duplicates with a single SQL statement...');
  
  // Use a CTE to identify and delete duplicates, keeping only the lowest ID
  const result = await db.execute(sql`
    DELETE FROM players 
    WHERE id IN (
      SELECT id 
      FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY name, team ORDER BY id) as row_num
        FROM players
      ) t
      WHERE row_num > 1
    );
  `);
  
  console.log(`✅ Deleted ${result.rowCount} duplicate records`);
  
  // Verify
  const check = await db.execute(sql`
    SELECT COUNT(*) as total, COUNT(DISTINCT (name, team)) as unique_players
    FROM players;
  `);
  
  console.log(`\n📊 Verification:`);
  console.log(`   - Total: ${check.rows[0].total}`);
  console.log(`   - Unique: ${check.rows[0].unique_players}`);
  
  // Check if any duplicates remain
  const remaining = await db.execute(sql`
    SELECT name, team, COUNT(*) as count
    FROM players
    GROUP BY name, team
    HAVING COUNT(*) > 1;
  `);
  
  if (remaining.rows.length === 0) {
    console.log('\n✅ No duplicates found!');
  } else {
    console.log(`\n⚠️ Still have ${remaining.rows.length} duplicates:`);
    remaining.rows.forEach((row: any) => {
      console.log(`   - ${row.name} (${row.team}): ${row.count} copies`);
    });
  }
  
  process.exit(0);
}

fixDuplicates().catch(console.error);
