import { db } from './public/server/db';
import { players } from './shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface ValueData {
  name: string;
  sal: number;
  price_point_pa: number;
  actual_avg: number;
  value_index: number;
  value_rating: string;
}

async function loadValueData() {
  console.log('📊 Loading value ratings from JSON...');
  
  const filePath = path.join(process.cwd(), 'assets/json/fantasy_value_index_2025_1755916866520.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const valueData: ValueData[] = JSON.parse(fileContent);
  
  console.log(`Found ${valueData.length} players with value ratings`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const player of valueData) {
    try {
      // Try to find the player by name
      const result = await db
        .update(players)
        .set({
          valueIndex: player.value_index,
          valueRating: player.value_rating
        })
        .where(eq(players.name, player.name))
        .returning({ name: players.name });
      
      if (result.length > 0) {
        updated++;
        if (updated % 50 === 0) {
          console.log(`Updated ${updated} players...`);
        }
      } else {
        notFound++;
        console.log(`⚠️  Player not found: ${player.name}`);
      }
    } catch (error) {
      console.error(`Error updating ${player.name}:`, error);
    }
  }
  
  console.log(`\n✅ Updated ${updated} players with value ratings`);
  console.log(`⚠️  ${notFound} players not found in database`);
  
  process.exit(0);
}

loadValueData().catch(console.error);
