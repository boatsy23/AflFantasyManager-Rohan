import { db } from './public/server/db';
import { players } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

interface MasterPlayer {
  name: string;
  team: string;
  kicks?: number;
  handballs?: number;
  disposals?: number;
  marks?: number;
  tackles?: number;
  hitouts?: number;
  free_kicks_for?: number;
  free_kicks_against?: number;
  clearances?: number;
}

interface MasterPlayerStats {
  players: MasterPlayer[];
}

async function loadMatchStats() {
  console.log('📊 Loading match statistics from master player stats...\n');
  
  // Read the master player stats file
  const masterPath = 'public/server/data/master_player_stats.json';
  const rawData = fs.readFileSync(masterPath, 'utf-8');
  const masterData: MasterPlayerStats = JSON.parse(rawData);
  
  console.log(`Loaded ${masterData.players.length} players from master stats`);
  
  // Get all players from database for matching
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
  
  console.log(`Loaded ${allPlayers.length} players from database\n`);
  
  // Update players with match stats
  let updated = 0;
  let notFound = 0;
  let noStats = 0;
  const notFoundPlayers = new Set<string>();
  
  for (const masterPlayer of masterData.players) {
    // Skip if no match stats
    if (!masterPlayer.kicks && !masterPlayer.handballs && !masterPlayer.marks && !masterPlayer.tackles) {
      noStats++;
      continue;
    }
    
    // Find matching player in database
    const dbPlayer = playerMap.get(masterPlayer.name.toLowerCase());
    
    if (!dbPlayer) {
      notFound++;
      notFoundPlayers.add(masterPlayer.name);
      continue;
    }
    
    // Update the player with match stats
    try {
      await db.update(players)
        .set({
          kicks: masterPlayer.kicks ? Math.round(masterPlayer.kicks) : null,
          handballs: masterPlayer.handballs ? Math.round(masterPlayer.handballs) : null,
          disposals: masterPlayer.disposals ? Math.round(masterPlayer.disposals) : null,
          marks: masterPlayer.marks ? Math.round(masterPlayer.marks) : null,
          tackles: masterPlayer.tackles ? Math.round(masterPlayer.tackles) : null,
          hitouts: masterPlayer.hitouts ? Math.round(masterPlayer.hitouts) : null,
          freeKicksFor: masterPlayer.free_kicks_for ? Math.round(masterPlayer.free_kicks_for) : null,
          freeKicksAgainst: masterPlayer.free_kicks_against ? Math.round(masterPlayer.free_kicks_against) : null,
          clearances: masterPlayer.clearances ? Math.round(masterPlayer.clearances) : null,
        })
        .where(eq(players.id, dbPlayer.id));
      
      updated++;
      
      if (updated % 50 === 0) {
        console.log(`Progress: ${updated} players updated...`);
      }
    } catch (error) {
      console.error(`Error updating ${masterPlayer.name}:`, error);
    }
  }
  
  console.log('\n=== Load Complete ===');
  console.log(`✅ Updated: ${updated} players`);
  console.log(`⚠️  No stats: ${noStats} players`);
  console.log(`❌ Not found: ${notFound} players`);
  
  if (notFoundPlayers.size > 0) {
    console.log(`\nPlayers not found in database (${notFoundPlayers.size}):`);
    Array.from(notFoundPlayers).slice(0, 10).forEach(name => {
      console.log(`  - ${name}`);
    });
    if (notFoundPlayers.size > 10) {
      console.log(`  ... and ${notFoundPlayers.size - 10} more`);
    }
  }
  
  // Verify sample data
  console.log('\n📊 Sample verification:');
  const samples = await db.select({
    name: players.name,
    kicks: players.kicks,
    handballs: players.handballs,
    disposals: players.disposals,
    marks: players.marks,
    tackles: players.tackles,
    hitouts: players.hitouts
  })
    .from(players)
    .where(eq(players.name, 'Lachie Whitfield'));
  
  samples.forEach(s => {
    console.log(`  ${s.name}:`);
    console.log(`    Kicks: ${s.kicks}, Handballs: ${s.handballs}, Disposals: ${s.disposals}`);
    console.log(`    Marks: ${s.marks}, Tackles: ${s.tackles}, Hitouts: ${s.hitouts}`);
  });
  
  process.exit(0);
}

loadMatchStats().catch(console.error);
