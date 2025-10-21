#!/usr/bin/env tsx
/**
 * Comprehensive DFS Data Loader
 * Loads data from raw_data/player_excel_files/ into multiple database tables:
 * - dfsPlayers (main player data)
 * - opponentHistory (opponent splits)
 * - venueHistory (venue splits)
 * - player_round_stats (game-by-game stats)
 */

import { db } from '../../backend/src/utils/db';
import { dfsPlayers, opponentHistory, venueHistory, playerRoundStats, players } from '@shared/schema';
import type { InsertDfsPlayer, InsertOpponentHistory, InsertVenueHistory, InsertPlayerRoundStats } from '@shared/schema';
import { eq } from 'drizzle-orm';
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface LoaderProgress {
  completed: string[];
  failed: Record<string, string>;
  lastUpdated: string;
  totalCompleted: number;
}

interface PlayerInfoRow {
  'Player ID'?: string;
  'Player Name'?: string;
  'Team'?: string;
  'Team Abbr'?: string;
  'Position'?: string;
  'Height'?: number;
  'Weight'?: number;
  'DOB'?: string;
}

interface GameLogRow {
  date?: number;
  year?: number | string;
  round?: string | number;
  league?: string;
  FP?: number;
  SC?: number;
  K?: number;
  H?: number;
  D?: number;
  M?: number;
  T?: number;
  HO?: number;
  G?: number;
  B?: number;
  TOG?: number;
  marks?: number;
  tackles?: number;
  goals?: number;
  behinds?: number;
  kicks?: number;
  handballs?: number;
  disposals?: number;
  hitouts?: number;
  timeOnGroundPercentage?: number;
  contestedPossessions?: number;
  uncontestedPossessions?: number;
  opponentName?: string;
  venueName?: string;
  OPP?: string;
  VEN?: string;
}

interface OpponentSplitRow {
  opponentAbbr?: string;
  gms?: number;
  FP?: number;
  kicks?: number;
  handballs?: number;
  marks?: number;
  tackles?: number;
  goals?: number;
  behinds?: number;
}

interface VenueSplitRow {
  venueId?: string;
  gms?: number;
  FP?: number;
  kicks?: number;
  handballs?: number;
  marks?: number;
  tackles?: number;
  goals?: number;
  behinds?: number;
}

// Progress tracking
const progressFile = 'loader_progress.json';
const errorLogFile = 'loader_errors.log';
let completedFiles = new Set<string>();
let failedFiles: Record<string, string> = {};

function loadProgress(): void {
  if (fs.existsSync(progressFile)) {
    try {
      const data: LoaderProgress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      completedFiles = new Set(data.completed);
      failedFiles = data.failed || {};
      console.log(`📥 Loaded progress: ${data.totalCompleted} completed, ${Object.keys(failedFiles).length} failed`);
    } catch (err) {
      console.warn('Warning: Could not load progress file');
    }
  }
}

function saveProgress(): void {
  const progress: LoaderProgress = {
    completed: Array.from(completedFiles),
    failed: failedFiles,
    lastUpdated: new Date().toISOString(),
    totalCompleted: completedFiles.size
  };
  
  try {
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.warn('Warning: Could not save progress');
  }
}

function markCompleted(filename: string): void {
  completedFiles.add(filename);
  delete failedFiles[filename];
  saveProgress();
}

function markFailed(filename: string, error: string): void {
  failedFiles[filename] = error;
  saveProgress();
}

function logError(filename: string, error: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${filename}: ${error}\n`;
  fs.appendFileSync(errorLogFile, logEntry);
}

async function loadComprehensiveData() {
  const rawDataDir = path.join(process.cwd(), 'raw_data', 'player_excel_files');
  
  if (!fs.existsSync(rawDataDir)) {
    console.error(`❌ Directory not found: ${rawDataDir}`);
    console.error('Please run the scraper first to generate Excel files.');
    process.exit(1);
  }
  
  const allFiles = fs.readdirSync(rawDataDir).filter(f => f.endsWith('.xlsx'));
  
  if (allFiles.length === 0) {
    console.error('❌ No Excel files found in raw_data/player_excel_files/');
    process.exit(1);
  }
  
  // Load progress
  loadProgress();
  
  // Filter to remaining files
  const files = allFiles.filter(f => !completedFiles.has(f));
  
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE DFS DATA LOADER');
  console.log('='.repeat(70));
  console.log(`Total files: ${allFiles.length}`);
  console.log(`Already processed: ${completedFiles.size}`);
  console.log(`Remaining to process: ${files.length}`);
  console.log(`Source: ${rawDataDir}`);
  console.log('='.repeat(70));
  
  if (files.length === 0) {
    console.log('\n✅ All files already processed!');
    return;
  }
  
  let stats = {
    filesProcessed: 0,
    playersInserted: 0,
    opponentRecords: 0,
    venueRecords: 0,
    gameLogRecords: 0,
    errors: 0
  };
  
  // Get all players from main players table for ID mapping
  const allPlayers = await db.select().from(players);
  const playerMap = new Map<string, number>(allPlayers.map(p => [p.name.toLowerCase().trim(), p.id]));
  console.log(`Loaded ${allPlayers.length} players from database\n`);
  
  const startTime = Date.now();
  
  for (const file of files) {
    let fileHasData = false;
    
    try {
      const filePath = path.join(rawDataDir, file);
      const workbook = XLSX.readFile(filePath);
      
      console.log(`\n📊 Processing: ${file}`);
      
      // 1. READ PLAYER INFO SHEET
      let playerInfo: PlayerInfoRow = {};
      let playerName = '';
      let playerTeam = '';
      let playerPosition = '';
      let dfsPlayerId = '';
      
      if (workbook.SheetNames.includes('Player Info')) {
        const sheet = workbook.Sheets['Player Info'];
        const data = XLSX.utils.sheet_to_json<PlayerInfoRow>(sheet);
        if (data.length > 0) {
          playerInfo = data[0];
          playerName = playerInfo['Player Name'] || '';
          playerTeam = playerInfo['Team Abbr'] || playerInfo['Team'] || '';
          playerPosition = playerInfo['Position'] || '';
          dfsPlayerId = playerInfo['Player ID'] || '';
        }
      }
      
      if (!playerName) {
        playerName = file.replace('.xlsx', '').replace(/_/g, ' ');
      }
      
      console.log(`  Player: ${playerName} (${playerTeam}) - ${playerPosition}`);
      
      // Get player ID from main players table
      const playerId = playerMap.get(playerName.toLowerCase().trim());
      
      if (!playerId) {
        const errMsg = `Player "${playerName}" not found in players table`;
        console.log(`  ⚠️  ${errMsg} - marking as failed`);
        logError(file, errMsg);
        markFailed(file, errMsg);
        stats.errors++;
        continue; // Skip to next file
      }
      
      // 2. LOAD INTO dfsPlayers TABLE
      if (dfsPlayerId) {
        try {
          // Calculate 2025 stats from game logs
          let avg2025: number | undefined;
          let games2025 = 0;
          let totalPoints2025 = 0;
          let seasonHigh: number | undefined;
          let seasonLow: number | undefined;
          let last3Avg: number | undefined;
          let last5Avg: number | undefined;
          
          if (workbook.SheetNames.includes('Game Logs')) {
            const gameLogsSheet = workbook.Sheets['Game Logs'];
            const gameLogs = XLSX.utils.sheet_to_json<GameLogRow>(gameLogsSheet);
            
            const games2025Data = gameLogs
              .filter(g => String(g.year) === '2025' && g.FP)
              .map(g => g.FP as number);
            
            if (games2025Data.length > 0) {
              games2025 = games2025Data.length;
              totalPoints2025 = games2025Data.reduce((a, b) => a + b, 0);
              avg2025 = totalPoints2025 / games2025;
              seasonHigh = Math.max(...games2025Data);
              seasonLow = Math.min(...games2025Data);
              
              if (games2025Data.length >= 3) {
                last3Avg = games2025Data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
              }
              if (games2025Data.length >= 5) {
                last5Avg = games2025Data.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
              }
            }
          }
          
          const dfsPlayerData: InsertDfsPlayer = {
            dfsPlayerId: dfsPlayerId,
            name: playerName,
            team: playerTeam,
            position: playerPosition,
            jerseyNumber: undefined,
            age: undefined,
            height: playerInfo['Height'],
            photoUrl: undefined,
            avg2025: avg2025,
            games2025: games2025,
            totalPoints2025: totalPoints2025,
            seasonHigh: seasonHigh,
            seasonLow: seasonLow,
            last3Avg: last3Avg,
            last5Avg: last5Avg,
            form: undefined,
            consistency: undefined,
            opponentNext: undefined,
            venueNext: undefined,
            fullData: playerInfo as any
          };
          
          // Upsert player
          const existing = await db.select().from(dfsPlayers).where(eq(dfsPlayers.dfsPlayerId, dfsPlayerId));
          
          if (existing.length > 0) {
            await db.update(dfsPlayers).set(dfsPlayerData).where(eq(dfsPlayers.dfsPlayerId, dfsPlayerId));
          } else {
            await db.insert(dfsPlayers).values(dfsPlayerData);
            stats.playersInserted++;
          }
          
          console.log(`  ✓ dfsPlayers: ${avg2025?.toFixed(1)} avg, ${games2025} games`);
        } catch (err: any) {
          console.error(`  ✗ Error loading dfsPlayers:`, err.message);
        }
      }
      
      // 3. LOAD OPPONENT SPLITS INTO opponentHistory TABLE
      if (playerId && workbook.SheetNames.includes('Opponent Splits')) {
        const oppSheet = workbook.Sheets['Opponent Splits'];
        const oppData = XLSX.utils.sheet_to_json<OpponentSplitRow>(oppSheet);
        
        // Delete old opponent records for this player first
        await db.delete(opponentHistory).where(eq(opponentHistory.playerId, playerId));
        
        let oppCount = 0;
        for (const row of oppData) {
          if (row.opponentAbbr && row.FP && row.gms) {
            try {
              const oppRecord: InsertOpponentHistory = {
                playerId: playerId,
                opponent: row.opponentAbbr,
                averageScore: row.FP,
                gamesPlayed: Math.round(row.gms),
                lastScore: undefined,
                last3Average: undefined,
                lastRound: undefined
              };
              
              await db.insert(opponentHistory).values(oppRecord);
              oppCount++;
              stats.opponentRecords++;
              fileHasData = true;
            } catch (err: any) {
              if (!err.message?.includes('duplicate key')) {
                console.error(`  ✗ Error inserting opponent ${row.opponentAbbr}:`, err.message);
              }
            }
          }
        }
        console.log(`  ✓ opponentHistory: ${oppCount} opponent records`);
      }
      
      // 4. LOAD VENUE SPLITS INTO venueHistory TABLE
      if (playerId && workbook.SheetNames.includes('Venue Splits')) {
        const venueSheet = workbook.Sheets['Venue Splits'];
        const venueData = XLSX.utils.sheet_to_json<VenueSplitRow>(venueSheet);
        
        // Delete old venue records for this player first
        await db.delete(venueHistory).where(eq(venueHistory.playerId, playerId));
        
        let venueCount = 0;
        for (const row of venueData) {
          if (row.venueId && row.FP && row.gms) {
            try {
              const venueRecord: InsertVenueHistory = {
                playerId: playerId,
                venue: row.venueId,
                averageScore: row.FP,
                gamesPlayed: Math.round(row.gms),
                lastScore: undefined,
                last3Average: undefined,
                lastRound: undefined
              };
              
              await db.insert(venueHistory).values(venueRecord);
              venueCount++;
              stats.venueRecords++;
              fileHasData = true;
            } catch (err: any) {
              if (!err.message?.includes('duplicate key')) {
                console.error(`  ✗ Error inserting venue ${row.venueId}:`, err.message);
              }
            }
          }
        }
        console.log(`  ✓ venueHistory: ${venueCount} venue records`);
      }
      
      // 5. LOAD GAME LOGS INTO player_round_stats TABLE
      if (playerId && workbook.SheetNames.includes('Game Logs')) {
        const gameLogsSheet = workbook.Sheets['Game Logs'];
        const gameLogs = XLSX.utils.sheet_to_json<GameLogRow>(gameLogsSheet);
        
        const afl2025Games = gameLogs.filter(g => {
          const year = String(g.year);
          const roundNum = parseInt(String(g.round));
          return year === '2025' && !isNaN(roundNum) && roundNum >= 1 && roundNum <= 24;
        });
        
        let gameCount = 0;
        for (const game of afl2025Games) {
          const roundNum = parseInt(String(game.round));
          
          try {
            const gameRecord: InsertPlayerRoundStats = {
              playerId: playerId,
              playerName: playerName,
              round: roundNum,
              team: playerTeam,
              position: playerPosition,
              fantasyPoints: Math.round(game.FP || 0),
              adjustedFantasyPoints: undefined,
              kicks: game.K || game.kicks || 0,
              handballs: game.H || game.handballs || 0,
              disposals: game.D || game.disposals || (game.K || game.kicks || 0) + (game.H || game.handballs || 0),
              marks: game.M || game.marks || 0,
              tackles: game.T || game.tackles || 0,
              hitouts: game.HO || game.hitouts || 0,
              clearances: undefined,
              freeKicksFor: undefined,
              freeKicksAgainst: undefined,
              contestedPossessions: Math.round(game.contestedPossessions || 0) || undefined,
              uncontestedPossessions: Math.round(game.uncontestedPossessions || 0) || undefined,
              contestedMarks: undefined,
              uncontestedMarks: undefined,
              groundBallGets: undefined,
              intercepts: undefined,
              inside50s: undefined,
              rebound50s: undefined,
              timeOnGround: Math.round(game.TOG || game.timeOnGroundPercentage || 0) || undefined,
              goals: game.G || game.goals || 0,
              behinds: game.B || game.behinds || 0,
              opponent: game.OPP || game.opponentName || '',
              venue: game.VEN || game.venueName || '',
              cba: undefined,
              kickIns: undefined,
              price: undefined,
              priceChange: undefined
            };
            
            await db.insert(playerRoundStats).values(gameRecord).onConflictDoNothing();
            gameCount++;
            stats.gameLogRecords++;
            fileHasData = true;
          } catch (err: any) {
            if (!err.message?.includes('duplicate key')) {
              console.error(`  ✗ Error inserting game R${roundNum}:`, err.message);
            }
          }
        }
        console.log(`  ✓ player_round_stats: ${gameCount} game records`);
      }
      
      // Only mark as completed if we successfully loaded data
      if (fileHasData) {
        stats.filesProcessed++;
        markCompleted(file);
      } else {
        const errMsg = 'No data loaded (missing sheets or empty data)';
        console.log(`  ⚠️  ${errMsg}`);
        markFailed(file, errMsg);
        stats.errors++;
      }
      
    } catch (err: any) {
      stats.errors++;
      const errMsg = `Fatal error: ${err.message}`;
      console.error(`❌ Error processing ${file}:`, err.message);
      logError(file, errMsg);
      markFailed(file, errMsg);
    }
  }
  
  const elapsedTime = (Date.now() - startTime) / 1000;
  const failedCount = Object.keys(failedFiles).length;
  
  console.log('\n' + '='.repeat(70));
  console.log('LOADING COMPLETE');
  console.log('='.repeat(70));
  console.log(`✅ Files processed (this session): ${stats.filesProcessed}`);
  console.log(`✅ Total completed: ${completedFiles.size} / ${allFiles.length}`);
  console.log(`❌ Total failed: ${failedCount}`);
  console.log(`✅ Opponent records: ${stats.opponentRecords}`);
  console.log(`✅ Venue records: ${stats.venueRecords}`);
  console.log(`✅ Game log records: ${stats.gameLogRecords}`);
  console.log(`❌ Errors (this session): ${stats.errors}`);
  console.log(`⏱️  Time elapsed: ${(elapsedTime / 60).toFixed(1)} minutes`);
  console.log('='.repeat(70));
  
  if (failedCount > 0) {
    console.log(`\n⚠️  Failed files (will retry on next run):`);
    Object.entries(failedFiles).slice(0, 10).forEach(([file, reason]) => {
      console.log(`   - ${file}: ${reason}`);
    });
    if (failedCount > 10) {
      console.log(`   ... and ${failedCount - 10} more. Check ${errorLogFile} for full list.`);
    }
  }
  
  const remaining = allFiles.length - completedFiles.size;
  if (remaining > 0) {
    console.log(`\n📋 Resume: Run this script again to process remaining ${remaining} files (including ${failedCount} retries).`);
  } else {
    console.log('\n🎉 All files processed successfully!');
  }
}

loadComprehensiveData()
  .then(() => {
    console.log('\n✨ Database loading complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
