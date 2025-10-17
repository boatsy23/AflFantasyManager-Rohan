/**
 * FootyWire Integration
 * 
 * This module integrates with the FootyWire scraper to provide accurate player data
 * with real prices and breakevens.
 */

import { exec } from 'child_process';
import { MasterDataService } from './services/MasterDataService';
import fs from 'fs';
import path from 'path';

// Player data interface
export interface FootyWirePlayer {
  name: string;
  team: string;
  position: string;
  price: number;
  breakEven: number;
  last3_avg: number;
  last5_avg: number;
}

// Cache for player data to avoid repeated file reading
let playerDataCache: Record<string, FootyWirePlayer> = {};
let lastRefreshTime = 0;
const CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

/**
 * Helper function to normalize a name for better matching
 * 
 * This function handles various player name formats:
 * - Full names: "Marcus Bontempelli"
 * - Initial format: "M. Bontempelli"
 * - Shortened names: "Bont"
 */
export const normalizeName = (name: string): string => {
  if (!name) return '';
  
  // Convert to lowercase
  let normalized = name.toLowerCase().trim();
  
  // Handle initial format (e.g., "M. Bontempelli")
  const initialFormat = normalized.match(/^([a-z])\.\s+([a-z]+)$/i);
  if (initialFormat) {
    // Return just the last name for better matching
    return initialFormat[2].toLowerCase().replace(/[.']/g, '');
  }
  
  // For normal names, remove special characters and normalize spaces
  return normalized
    .replace(/[.']/g, '') // Remove periods and apostrophes
    .replace(/\s+/g, ' '); // Normalize spaces
};

/**
 * Run the FootyWire scraper JavaScript script
 */
export const runFootyWireScraper = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('Running FootyWire JavaScript scraper...');
    
    // Execute the Node.js scraper
    exec('node footywire_js_scraper.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running FootyWire scraper: ${error.message}`);
        console.log(stderr);
        resolve(false);
      } else {
        console.log(stdout);
        resolve(true);
      }
    });
  });
};

/**
 * Load player data from the scraper-generated JSON file
 */
export const loadPlayerDataFromFile = async (): Promise<Record<string, FootyWirePlayer>> => {
  try {
    const players = await MasterDataService.getAllPlayers();
    
    // Convert to lookup object by normalized player name
    const playerMap: Record<string, FootyWirePlayer> = {};
    
    players.forEach((player: any) => {
      if (!player.name) return; // Skip players without names
      
      const normalizedName = normalizeName(player.name);
      
      // Map MasterDataService fields to FootyWire format
      const price = player.price || 0;
      const breakEven = player.break_even || 0;
      const avgScore = player.average_points || 0;
      const last3Avg = player.last_3_average || avgScore;
      const last5Avg = player.last_5_average || avgScore;
      
      playerMap[normalizedName] = {
        name: player.name,
        team: player.team || '',
        position: player.position || 'MID',
        price: price,
        breakEven: breakEven,
        last3_avg: last3Avg,
        last5_avg: last5Avg
      };
    });
    
    return playerMap;
  } catch (error) {
    console.error(`Error loading player data file: ${error}`);
    return {};
  }
};

/**
 * Get player data from the cache or file system, refreshing if needed
 */
export const getFootyWirePlayerData = async (): Promise<Record<string, FootyWirePlayer>> => {
  const now = Date.now();
  
  // If cache is empty or expired, refresh
  if (Object.keys(playerDataCache).length === 0 || now - lastRefreshTime > CACHE_TTL) {
    console.log('Player data cache empty or expired, refreshing...');
    
    // Check if player_data.json exists and is recent enough
    let needScrape = true;
    try {
      const filePath = path.join(process.cwd(), 'player_data.json');
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      // If file exists and is less than 24 hours old, we don't need to scrape
      if (stats.isFile() && fileAge < 24 * 60 * 60 * 1000) {
        needScrape = false;
      }
    } catch (error) {
      // File doesn't exist or can't be read
      needScrape = true;
    }
    
    // Run scraper if needed
    if (needScrape) {
      await runFootyWireScraper();
    }
    
    // Load data from file
    playerDataCache = await loadPlayerDataFromFile();
    lastRefreshTime = now;
  }
  
  return playerDataCache;
};

/**
 * Get data for a specific player by name, using fuzzy matching if needed
 */
export const getPlayerByName = async (name: string): Promise<FootyWirePlayer | null> => {
  if (!name) return null;
  
  const playerData = await getFootyWirePlayerData();
  const normalizedInput = normalizeName(name);
  
  // First try exact match
  if (playerData[normalizedInput]) {
    return playerData[normalizedInput];
  }
  
  // Look through all keys with normalized versions for a match
  for (const key in playerData) {
    if (normalizeName(key) === normalizedInput) {
      return playerData[key];
    }
  }
  
  // Check if the normalized input is a substring of any normalized key
  // This helps with incomplete names like "Sheezel" matching "Harry Sheezel"
  for (const key in playerData) {
    const normalizedKey = normalizeName(key);
    
    // Check if the player name is contained in the data key
    // Or if the data key is contained in the player name
    if (normalizedKey.includes(normalizedInput) || normalizedInput.includes(normalizedKey)) {
      return playerData[key];
    }
  }
  
  // No match found
  return null;
};

// Initialize the player data when the module is loaded
// Commented out to prevent automatic data refresh on startup
// getFootyWirePlayerData().catch(error => {
//   console.error('Error initializing player data:', error);
// });