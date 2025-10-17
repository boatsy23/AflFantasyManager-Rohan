import { db } from './public/server/db';
import { playerRoundScores, players } from './shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

interface RoundPlayer {
  name: string;
  round_score: number;
  average: number;
  break_even: number;
  price: number;
  position: string;
  team: string;
  value: number;
}

interface BreakEvensData {
  [round: string]: {
    [playerName: string]: RoundPlayer;
  };
}

async function loadRoundScores() {
  console.log('📊 Loading round-by-round scores into database...');
  
  // Read the historical break evens file
  const filePath = './data/historical/break_evens_historical.json';
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const breakEvensData: BreakEvensData = JSON.parse(rawData);
  
  // Get all players from database for name matching
  const allPlayers = await db.select().from(players);
  const playerMap = new Map(allPlayers.map(p => [p.name.toLowerCase(), p.id]));
  
  console.log(`Found ${allPlayers.length} players in database`);
  console.log(`Found ${Object.keys(breakEvensData).length} rounds in historical data`);
  
  let inserted = 0;
  let skipped = 0;
  
  // Process each round
  for (const [roundStr, roundData] of Object.entries(breakEvensData)) {
    const roundNum = parseInt(roundStr);
    console.log(`\nProcessing Round ${roundNum}...`);
    
    const roundRecords = [];
    
    for (const [playerNameKey, playerData] of Object.entries(roundData)) {
      const playerName = playerData.name;
      const playerId = playerMap.get(playerName.toLowerCase());
      
      if (!playerId) {
        skipped++;
        continue;
      }
      
      roundRecords.push({
        playerId: playerId,
        round: roundNum,
        score: Math.round(playerData.round_score) || 0,
        price: Math.round(playerData.price) || 0,
        breakEven: Math.round(playerData.break_even) || 0,
        priceChange: 0, // Will be calculated later if needed
        opponent: '',
        venue: '',
        isHome: false,
        minutes: 0
      });
    }
    
    if (roundRecords.length > 0) {
      try {
        await db.insert(playerRoundScores).values(roundRecords);
        inserted += roundRecords.length;
        console.log(`✅ Round ${roundNum}: Inserted ${roundRecords.length} records`);
      } catch (error) {
        console.error(`❌ Error inserting Round ${roundNum}:`, error);
      }
    }
  }
  
  console.log(`\n✅ Complete! Inserted ${inserted} round scores, skipped ${skipped} (no player match)`);
}

// Run the loader
loadRoundScores().catch(console.error);
