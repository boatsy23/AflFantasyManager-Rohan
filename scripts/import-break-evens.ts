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

async function importBreakEvens() {
  console.log('Starting break evens import...');
  
  const filePath = path.join(process.cwd(), 'data/historical/break_evens_round_23.json');
  
  if (!fs.existsSync(filePath)) {
    console.error('Break evens file not found:', filePath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const data: BreakEvenData = JSON.parse(rawData);
  
  console.log(`Found ${data.player_count} players in break evens file`);
  
  let updated = 0;
  let notFound = 0;
  const notFoundPlayers: string[] = [];
  
  for (const [key, player] of Object.entries(data.players)) {
    try {
      // Normalize position - convert multi-position to primary position
      let position = player.position.trim();
      if (position.includes('DEF FWD')) position = 'DEF';
      else if (position.includes('FWD')) position = 'FWD';
      else if (position.includes('MID')) position = 'MID';
      else if (position.includes('RUC')) position = 'RUC';
      else if (position.includes('DEF')) position = 'DEF';
      
      // Try to find player by name (case insensitive)
      const result = await db
        .update(players)
        .set({
          price: player.price,
          break_even: player.break_even
        })
        .where(sql`LOWER(${players.name}) = ${player.name.toLowerCase()}`)
        .returning({ id: players.id, name: players.name });
      
      if (result.length > 0) {
        updated++;
        if (updated % 50 === 0) {
          console.log(`Updated ${updated} players...`);
        }
      } else {
        notFound++;
        notFoundPlayers.push(player.name);
      }
    } catch (error) {
      console.error(`Error updating ${player.name}:`, error);
    }
  }
  
  console.log('\n=== Import Complete ===');
  console.log(`✓ Updated: ${updated} players`);
  console.log(`✗ Not found: ${notFound} players`);
  
  if (notFoundPlayers.length > 0 && notFoundPlayers.length <= 20) {
    console.log('\nPlayers not found in database:');
    notFoundPlayers.forEach(name => console.log(`  - ${name}`));
  }
  
  // Show sample of updated prices
  const samplePlayers = await db
    .select({
      name: players.name,
      price: players.price,
      break_even: players.break_even,
      position: players.position
    })
    .from(players)
    .where(sql`${players.price} > 800000`)
    .orderBy(sql`${players.price} DESC`)
    .limit(10);
  
  console.log('\nTop 10 most expensive players after update:');
  samplePlayers.forEach(p => {
    console.log(`  ${p.name} (${p.position}): $${(p.price / 1000).toFixed(0)}k, BE: ${p.break_even}`);
  });
}

importBreakEvens()
  .then(() => {
    console.log('\nBreak evens import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
