import { db } from './public/server/db';
import { playerRoundScores, players } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';

interface HistoricalPlayer {
  name: string;
  position: string;
  price: number;
  break_even: number;
  average: number;
  round_score: number;
  team: string;
  value: number;
  round: number;
}

interface HistoricalData {
  [round: string]: {
    [playerKey: string]: HistoricalPlayer;
  };
}

async function loadRoundValueRatings() {
  console.log('📊 Loading round-by-round value ratings from historical data...\n');
  
  // Read the historical data file
  const historicalPath = 'data/historical/break_evens_historical.json';
  const rawData = fs.readFileSync(historicalPath, 'utf-8');
  const historicalData: HistoricalData = JSON.parse(rawData);
  
  console.log(`Loaded historical data with ${Object.keys(historicalData).length} rounds`);
  
  // Step 1: Clear existing value ratings from players table
  console.log('\n🗑️  Clearing season-level value ratings from players table...');
  await db.update(players)
    .set({ 
      valueIndex: null, 
      valueRating: null 
    });
  console.log('✅ Cleared value ratings from players table');
  
  // Step 2: Get all players from database for name matching
  const allPlayers = await db.select({
    id: players.id,
    name: players.name,
    team: players.team
  }).from(players);
  
  // Create a map for quick lookup: lowercase name -> player
  const playerMap = new Map<string, typeof allPlayers[0]>();
  allPlayers.forEach(p => {
    const key = p.name.toLowerCase().trim();
    playerMap.set(key, p);
  });
  
  console.log(`\n📋 Loaded ${allPlayers.length} players from database`);
  
  // Step 3: Process each round and update value ratings
  let updated = 0;
  let notFound = 0;
  let noValue = 0;
  const notFoundPlayers = new Set<string>();
  
  for (const [roundStr, roundData] of Object.entries(historicalData)) {
    const round = parseInt(roundStr);
    
    for (const [playerKey, playerData] of Object.entries(roundData)) {
      // Skip if no value data
      if (!playerData.value || playerData.value === 0) {
        noValue++;
        continue;
      }
      
      // Find matching player in database
      const dbPlayer = playerMap.get(playerKey.toLowerCase());
      
      if (!dbPlayer) {
        notFound++;
        notFoundPlayers.add(playerData.name);
        continue;
      }
      
      // Update the value for this player's round score
      try {
        const result = await db.update(playerRoundScores)
          .set({ value: playerData.value })
          .where(
            and(
              eq(playerRoundScores.playerId, dbPlayer.id),
              eq(playerRoundScores.round, round)
            )
          );
        
        updated++;
        
        if (updated % 500 === 0) {
          console.log(`Progress: ${updated} round values updated...`);
        }
      } catch (error) {
        console.error(`Error updating ${playerData.name} round ${round}:`, error);
      }
    }
  }
  
  console.log('\n=== Load Complete ===');
  console.log(`✅ Updated: ${updated} round value ratings`);
  console.log(`⚠️  No value data: ${noValue} player-rounds`);
  console.log(`❌ Not found: ${notFound} player-rounds`);
  
  if (notFoundPlayers.size > 0) {
    console.log(`\nPlayers not found in database (${notFoundPlayers.size}):`);
    Array.from(notFoundPlayers).slice(0, 20).forEach(name => {
      console.log(`  - ${name}`);
    });
    if (notFoundPlayers.size > 20) {
      console.log(`  ... and ${notFoundPlayers.size - 20} more`);
    }
  }
  
  // Verify sample data
  console.log('\n📊 Sample verification:');
  const samples = await db.select({
    playerId: playerRoundScores.playerId,
    playerName: players.name,
    round: playerRoundScores.round,
    value: playerRoundScores.value
  })
    .from(playerRoundScores)
    .innerJoin(players, eq(players.id, playerRoundScores.playerId))
    .where(eq(playerRoundScores.round, 14))
    .limit(5);
  
  samples.forEach(s => {
    console.log(`  ${s.playerName} (Round ${s.round}): value = ${s.value}`);
  });
  
  process.exit(0);
}

loadRoundValueRatings().catch(console.error);
