#!/usr/bin/env tsx
/**
 * Fast DFS Game Logs Loader - Uses batch inserts
 */

import { db } from './public/server/db';
import { players, playerRoundStats } from './shared/schema';
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

async function loadGameLogsFast() {
  const statsDir = 'player_stats_output';
  const files = fs.readdirSync(statsDir).filter(f => f.endsWith('.xlsx'));
  
  console.log(`Found ${files.length} Excel files`);
  
  // Get all players
  const allPlayers = await db.select().from(players);
  const playerMap = new Map(allPlayers.map(p => [p.name.toLowerCase().trim(), p]));
  
  console.log(`Loaded ${allPlayers.length} players from database`);
  
  const batchRecords: any[] = [];
  let processedFiles = 0;
  let skippedFiles = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(statsDir, file);
      const workbook = XLSX.readFile(filePath);
      
      if (!workbook.SheetNames.includes('Game Logs')) {
        skippedFiles++;
        continue;
      }
      
      // Get player info
      let playerName = '';
      let playerTeam = '';
      
      if (workbook.SheetNames.includes('Player Info')) {
        const sheet = workbook.Sheets['Player Info'];
        const data = XLSX.utils.sheet_to_json<any>(sheet);
        if (data.length > 0) {
          playerName = data[0]['Player Name'] || '';
          playerTeam = data[0]['Team'] || '';
        }
      }
      
      if (!playerName) {
        playerName = file.replace('.xlsx', '').replace(/\./g, ' ');
      }
      
      const player = playerMap.get(playerName.toLowerCase().trim());
      if (!player) continue;
      
      // Read game logs
      const gameLogsSheet = workbook.Sheets['Game Logs'];
      const gameLogs = XLSX.utils.sheet_to_json<any>(gameLogsSheet);
      
      // Filter and add to batch
      const afl2025Games = gameLogs.filter((g: any) => {
        const year = String(g.year);
        const roundNum = parseInt(String(g.round));
        return g.league === 'AFL' && 
               year === '2025' &&
               !isNaN(roundNum) &&
               roundNum >= 1 &&
               roundNum <= 24;
      });
      
      for (const game of afl2025Games) {
        const roundNum = parseInt(String(game.round));
        batchRecords.push({
          playerId: player.id,
          playerName: player.name,
          round: roundNum,
          team: playerTeam || player.team || '',
          position: player.position || '',
          fantasyPoints: Math.round(game.FP || 0),
          kicks: Number(game.kicks) || 0,
          handballs: Number(game.handballs) || 0,
          disposals: (Number(game.kicks) || 0) + (Number(game.handballs) || 0),
          marks: game.marks || 0,
          tackles: game.tackles || 0,
          contestedPossessions: Math.round(game.contestedPossessions || 0),
          uncontestedPossessions: Math.round(game.uncontestedPossessions || 0),
          timeOnGround: Math.round(game.timeOnGroundPercentage || 0),
          goals: game.goals || 0,
          behinds: game.behinds || 0,
          opponent: game.opponentName || '',
          venue: game.venueName || ''
        });
      }
      
      processedFiles++;
      
      // Insert in batches of 1000
      if (batchRecords.length >= 1000) {
        await db.insert(playerRoundStats).values(batchRecords).onConflictDoNothing();
        console.log(`Inserted batch: ${batchRecords.length} records (${processedFiles}/${files.length} files)`);
        batchRecords.length = 0;
      }
      
    } catch (err: any) {
      console.error(`Error: ${file}:`, err.message);
    }
  }
  
  // Insert remaining records
  if (batchRecords.length > 0) {
    await db.insert(playerRoundStats).values(batchRecords).onConflictDoNothing();
    console.log(`Inserted final batch: ${batchRecords.length} records`);
  }
  
  console.log('\n=== Summary ===');
  console.log(`✓ Processed: ${processedFiles} files`);
  console.log(`⊘ Skipped: ${skippedFiles} files`);
}

loadGameLogsFast()
  .then(() => {
    console.log('\n✓ Complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
