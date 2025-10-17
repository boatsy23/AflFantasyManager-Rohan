#!/usr/bin/env tsx
/**
 * Load DFS Player Data into Database
 * 
 * This script loads the comprehensive DFS player data from master_player_stats_dfs.json
 * into the PostgreSQL database using Drizzle ORM.
 */

import * as fs from 'fs';
import * as path from 'path';
import { db } from './public/server/db';
import { dfsPlayers } from '@shared/schema';
import type { InsertDfsPlayer } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface DfsPlayerData {
  player_id: string;
  player_name: string;
  team: string;
  position: string;
  jersey_number?: number;
  age?: number;
  height?: number;
  photo_url?: string;
  avg_2025?: number;
  games_2025?: number;
  total_2025?: number;
  season_high?: number;
  season_low?: number;
  last_3_avg?: number;
  last_5_avg?: number;
  form?: string;
  consistency?: number;
  opponent_next?: string;
  venue_next?: string;
  [key: string]: any; // For the full data
}

async function loadDfsData() {
  console.log('Loading DFS player data from master_player_stats_dfs.json...\n');
  
  // Read the JSON file
  const filePath = path.join(process.cwd(), 'master_player_stats_dfs.json');
  
  if (!fs.existsSync(filePath)) {
    console.error('Error: master_player_stats_dfs.json not found!');
    console.error('Please run the scraper first to generate the data.');
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const playersData: DfsPlayerData[] = JSON.parse(fileContent);
  
  console.log(`Found ${playersData.length} players to load\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Load each player into the database
  for (let i = 0; i < playersData.length; i++) {
    const playerData = playersData[i];
    
    try {
      const insertData: InsertDfsPlayer = {
        dfsPlayerId: playerData.player_id,
        name: playerData.player_name,
        team: playerData.team,
        position: playerData.position,
        jerseyNumber: playerData.jersey_number,
        age: playerData.age,
        height: playerData.height,
        photoUrl: playerData.photo_url,
        
        // 2025 Season Stats
        avg2025: playerData.avg_2025,
        games2025: playerData.games_2025,
        totalPoints2025: playerData.total_2025 ? Math.round(playerData.total_2025) : undefined,
        seasonHigh: playerData.season_high ? Math.round(playerData.season_high) : undefined,
        seasonLow: playerData.season_low ? Math.round(playerData.season_low) : undefined,
        
        // Recent Form
        last3Avg: playerData.last_3_avg,
        last5Avg: playerData.last_5_avg,
        form: playerData.form,
        consistency: playerData.consistency,
        
        // Next Game
        opponentNext: playerData.opponent_next,
        venueNext: playerData.venue_next,
        
        // Store complete data as JSONB
        fullData: playerData as any
      };
      
      // Check if player already exists
      const existing = await db.select().from(dfsPlayers).where(eq(dfsPlayers.dfsPlayerId, insertData.dfsPlayerId));
      
      if (existing.length > 0) {
        // Update existing player
        await db.update(dfsPlayers)
          .set(insertData)
          .where(eq(dfsPlayers.dfsPlayerId, insertData.dfsPlayerId));
      } else {
        // Insert new player
        await db.insert(dfsPlayers).values(insertData);
      }
      
      successCount++;
      
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${playersData.length} players loaded`);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error loading player ${playerData.player_name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Data Load Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successfully loaded: ${successCount} players`);
  console.log(`❌ Errors: ${errorCount} players`);
  console.log('\nTop 10 Players by 2025 Average:');
  
  // Fetch and display top players
  const allPlayers = await db.select().from(dfsPlayers);
  const topPlayers = allPlayers
    .filter(p => p.avg2025 !== null)
    .sort((a, b) => (b.avg2025 || 0) - (a.avg2025 || 0))
    .slice(0, 10);
  
  topPlayers.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name.padEnd(25)} (${p.team}) - ${p.avg2025?.toFixed(1)} avg`);
  });
}

// Run the loader
loadDfsData()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });