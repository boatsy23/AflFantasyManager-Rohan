#!/usr/bin/env tsx
/**
 * Load DFS Game Logs into player_round_stats table
 * Reads from player_stats_output/*.xlsx Game Logs sheets
 */

import { db } from './public/server/db';
import { players, playerRoundStats } from './shared/schema';
import type { Player } from './shared/schema';
import { eq } from 'drizzle-orm';
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface GameLogRow {
  date: number;
  year: number;
  round: string | number;
  league: string;
  FP: number;
  SC?: number;
  marks: number;
  tackles: number;
  goals: number;
  behinds: number;
  timeOnGroundPercentage: number;
  pointsPerMinute: number;
  kicks: number;
  handballs: number;
  contestedPossessions?: number;
  uncontestedPossessions?: number;
  opponentName?: string;
  venueName?: string;
  teamName?: string;
}

async function loadGameLogs() {
  const statsDir = 'player_stats_output';
  const files = fs.readdirSync(statsDir).filter(f => f.endsWith('.xlsx'));
  
  console.log(`Found ${files.length} Excel files`);
  
  let processedFiles = 0;
  let processedGames = 0;
  let skippedFiles = 0;
  let errors = 0;
  
  // Get all players from database for name matching
  const allPlayers = await db.select().from(players);
  const playerMap = new Map<string, Player>(allPlayers.map(p => [p.name.toLowerCase().trim(), p]));
  
  console.log(`Loaded ${allPlayers.length} players from database`);
  
  for (const file of files) {
    try {
      const filePath = path.join(statsDir, file);
      const workbook = XLSX.readFile(filePath);
      
      // Check if Game Logs sheet exists
      if (!workbook.SheetNames.includes('Game Logs')) {
        skippedFiles++;
        continue;
      }
      
      // Read Player Info to get player name and team
      let playerName = '';
      let playerTeam = '';
      
      if (workbook.SheetNames.includes('Player Info')) {
        const playerInfoSheet = workbook.Sheets['Player Info'];
        const playerInfoData = XLSX.utils.sheet_to_json<any>(playerInfoSheet);
        if (playerInfoData.length > 0) {
          playerName = playerInfoData[0]['Player Name'] || '';
          playerTeam = playerInfoData[0]['Team'] || '';
        }
      }
      
      // Fallback: extract name from filename
      if (!playerName) {
        playerName = file.replace('.xlsx', '').replace(/\./g, ' ');
      }
      
      // Find matching player in database
      const player = playerMap.get(playerName.toLowerCase().trim());
      if (!player) {
        console.log(`⚠️  Player not found in DB: ${playerName}`);
        continue;
      }
      
      // Read Game Logs sheet
      const gameLogsSheet = workbook.Sheets['Game Logs'];
      const gameLogs = XLSX.utils.sheet_to_json<GameLogRow>(gameLogsSheet);
      
      // Filter for 2025 AFL games only (rounds 1-24, excluding finals)
      const afl2025Games = gameLogs.filter(g => {
        const year = String(g.year);
        const roundNum = parseInt(String(g.round));
        return g.league === 'AFL' && 
               year === '2025' &&
               !isNaN(roundNum) &&
               roundNum >= 1 &&
               roundNum <= 24;
      });
      
      if (afl2025Games.length === 0) {
        continue;
      }
      
      // Insert each game into player_round_stats
      for (const game of afl2025Games) {
        const roundNum = parseInt(game.round as string);
        
        try {
          await db.insert(playerRoundStats).values({
            playerId: player.id,
            playerName: player.name,
            round: roundNum,
            team: playerTeam || player.team || '',
            position: player.position || '',
            fantasyPoints: Math.round(game.FP || 0),
            kicks: game.kicks || 0,
            handballs: game.handballs || 0,
            disposals: (game.kicks || 0) + (game.handballs || 0),
            marks: game.marks || 0,
            tackles: game.tackles || 0,
            contestedPossessions: Math.round(game.contestedPossessions || 0),
            uncontestedPossessions: Math.round(game.uncontestedPossessions || 0),
            timeOnGround: Math.round(game.timeOnGroundPercentage || 0),
            goals: game.goals || 0,
            behinds: game.behinds || 0,
            opponent: game.opponentName || '',
            venue: game.venueName || ''
          }).onConflictDoNothing();
          
          processedGames++;
        } catch (err: any) {
          // Silently skip conflicts
          if (!err.message?.includes('duplicate key')) {
            console.error(`Error inserting game for ${playerName} R${roundNum}:`, err.message);
          }
        }
      }
      
      processedFiles++;
      
      if (processedFiles % 50 === 0) {
        console.log(`Progress: ${processedFiles}/${files.length} files processed, ${processedGames} games loaded`);
      }
      
    } catch (err: any) {
      errors++;
      console.error(`Error processing ${file}:`, err.message);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`✓ Processed: ${processedFiles} files`);
  console.log(`✓ Loaded: ${processedGames} game records`);
  console.log(`⊘ Skipped: ${skippedFiles} files (no Game Logs)`);
  console.log(`✗ Errors: ${errors}`);
}

loadGameLogs()
  .then(() => {
    console.log('\n✓ Game logs loading complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
