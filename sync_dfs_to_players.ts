/**
 * Sync DFS Australia player data to the main players table
 * This script maps DFS stats to the correct fields in the players table
 */

import { db } from "./public/server/db";
import { dfsPlayers, players } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface DFSToPlayerMapping {
  dfsPlayerId: string;
  name: string;
  position: string;
  team: string;
  averagePoints: number;
  roundsPlayed: number;
  totalPoints: number;
  l3Average: number | null;
  l5Average: number | null;
  highScore: number | null;
  lowScore: number | null;
  standardDeviation: number | null;
  price: number;
  breakEven: number;
  category: string;
}

/**
 * Map DFS position codes to AFL Fantasy positions
 */
function mapPosition(dfsPosition: string): string {
  const positionMap: Record<string, string> = {
    'DEF': 'DEF',
    'MID': 'MID',
    'RUC': 'RUCK',
    'FWD': 'FWD'
  };
  return positionMap[dfsPosition] || dfsPosition;
}

/**
 * Determine player category based on average points
 */
function determineCategory(avg: number | null): string {
  if (!avg) return 'Rookie';
  if (avg >= 95) return 'Premium';
  if (avg >= 75) return 'Mid-Pricer';
  return 'Rookie';
}

/**
 * Estimate price based on average (simple formula)
 * Real prices would come from AFL Fantasy API
 */
function estimatePrice(avg: number | null, games: number | null): number {
  if (!avg || !games) return 300000; // Default rookie price
  
  // Simple estimation: $5000 per average point, minimum $300k
  const basePrice = avg * 5000;
  return Math.max(300000, Math.min(700000, Math.round(basePrice / 1000) * 1000));
}

/**
 * Estimate break-even based on price and average
 */
function estimateBreakEven(price: number, avg: number | null): number {
  if (!avg) return 0;
  
  // Simple formula: slightly above average for most players
  return Math.round(avg + 5);
}

/**
 * Calculate standard deviation from consistency percentage
 */
function calculateStdDev(avg: number | null, consistency: number | null): number | null {
  if (!avg || !consistency) return null;
  
  // If consistency is high (closer to 100), std dev should be low
  // Rough estimate: stdDev = avg * (1 - consistency/100) / 2
  const inconsistency = 1 - (consistency / 100);
  return Math.round(avg * inconsistency / 2 * 10) / 10;
}

async function syncDFSToPlayers() {
  console.log("Starting DFS to Players sync...\n");
  
  try {
    // Fetch all DFS players
    const dfsPlayersList = await db.select().from(dfsPlayers);
    console.log(`Found ${dfsPlayersList.length} DFS players`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const dfsPlayer of dfsPlayersList) {
      try {
        // Skip players without essential data
        if (!dfsPlayer.avg2025 || !dfsPlayer.games2025) {
          skipped++;
          continue;
        }
        
        const price = estimatePrice(dfsPlayer.avg2025, dfsPlayer.games2025);
        const breakEven = estimateBreakEven(price, dfsPlayer.avg2025);
        const category = determineCategory(dfsPlayer.avg2025);
        const stdDev = calculateStdDev(dfsPlayer.avg2025, dfsPlayer.consistency);
        
        // Full data for INSERT (when player doesn't exist)
        const insertData = {
          name: dfsPlayer.name,
          position: mapPosition(dfsPlayer.position),
          team: dfsPlayer.team,
          price: price,
          breakEven: breakEven,
          category: category,
          averagePoints: dfsPlayer.avg2025,
          lastScore: null,
          projectedScore: Math.round(dfsPlayer.avg2025),
          roundsPlayed: dfsPlayer.games2025,
          l3Average: dfsPlayer.last3Avg,
          l5Average: dfsPlayer.last5Avg,
          totalPoints: dfsPlayer.totalPoints2025,
          priceChange: 0,
          pricePerPoint: price / dfsPlayer.avg2025,
          selectionPercentage: null,
          highScore: dfsPlayer.seasonHigh,
          lowScore: dfsPlayer.seasonLow,
          standardDeviation: stdDev,
          isSelected: true,
          isInjured: false,
          isSuspended: false,
          isFavorite: false
        };
        
        // Limited update data (only stable identity fields, preserve rolling stats)
        const updateData = {
          position: mapPosition(dfsPlayer.position),
          team: dfsPlayer.team,
          category: category,
          averagePoints: dfsPlayer.avg2025,
          roundsPlayed: dfsPlayer.games2025,
          l3Average: dfsPlayer.last3Avg,
          l5Average: dfsPlayer.last5Avg,
          totalPoints: dfsPlayer.totalPoints2025,
          pricePerPoint: price / dfsPlayer.avg2025,
          highScore: dfsPlayer.seasonHigh,
          lowScore: dfsPlayer.seasonLow,
          standardDeviation: stdDev
        };
        
        // Upsert: insert with full data, but only update stable fields
        const result = await db.insert(players)
          .values(insertData)
          .onConflictDoUpdate({
            target: [players.name, players.team],
            set: updateData
          })
          .returning({ id: players.id, existed: sql<boolean>`(xmax = 0)` });
        
        if (result[0].existed) {
          created++;
        } else {
          updated++;
        }
        
        if ((created + updated) % 50 === 0) {
          console.log(`Progress: ${created} created, ${updated} updated, ${skipped} skipped`);
        }
      } catch (error) {
        console.error(`Error syncing player ${dfsPlayer.name}:`, error);
      }
    }
    
    console.log("\n=== Sync Complete ===");
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total processed: ${created + updated + skipped}`);
    
  } catch (error) {
    console.error("Sync failed:", error);
    throw error;
  }
}

// Run the sync
syncDFSToPlayers()
  .then(() => {
    console.log("\nSync completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSync failed:", error);
    process.exit(1);
  });
