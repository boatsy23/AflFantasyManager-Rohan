import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../db';
import { playerDvpRatings, teamDvpRatings } from '@shared/schema';

async function loadDvpData() {
  console.log('Starting DVP data load...');

  try {
    // Load team DVP ratings
    console.log('Loading team DVP ratings...');
    const teamCsvPath = join(process.cwd(), 'attached_assets', 'team_dvp_ratings_1760666088963.csv');
    const teamCsvContent = readFileSync(teamCsvPath, 'utf-8');
    const teamRecords = parse(teamCsvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Parsed ${teamRecords.length} team DVP records`);

    // Clear existing team DVP data
    await db.delete(teamDvpRatings);

    // Insert team DVP ratings
    for (const record of teamRecords) {
      await db.insert(teamDvpRatings).values({
        team: record.Team,
        forwardRating: parseInt(record.Forward_Rating),
        forwardAvgPointsAllowed: parseFloat(record.Forward_AvgPointsAllowed),
        forwardRank: parseInt(record.Forward_Rank),
        midfielderRating: parseInt(record.Midfielder_Rating),
        midfielderAvgPointsAllowed: parseFloat(record.Midfielder_AvgPointsAllowed),
        midfielderRank: parseInt(record.Midfielder_Rank),
        defenderRating: parseInt(record.Defender_Rating),
        defenderAvgPointsAllowed: parseFloat(record.Defender_AvgPointsAllowed),
        defenderRank: parseInt(record.Defender_Rank),
        ruckRating: parseInt(record.Ruck_Rating),
        ruckAvgPointsAllowed: parseFloat(record.Ruck_AvgPointsAllowed),
        ruckRank: parseInt(record.Ruck_Rank),
      });
    }

    console.log(`✓ Inserted ${teamRecords.length} team DVP ratings`);

    // Load player DVP ratings
    console.log('Loading player DVP ratings...');
    const playerCsvPath = join(process.cwd(), 'attached_assets', 'player_dvp_ratings_1760666088962.csv');
    const playerCsvContent = readFileSync(playerCsvPath, 'utf-8');
    const playerRecords = parse(playerCsvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Parsed ${playerRecords.length} player DVP records`);

    // Clear existing player DVP data
    await db.delete(playerDvpRatings);

    // Insert player DVP ratings in batches
    const batchSize = 500;
    for (let i = 0; i < playerRecords.length; i += batchSize) {
      const batch = playerRecords.slice(i, i + batchSize);
      
      await db.insert(playerDvpRatings).values(
        batch.map((record: any) => ({
          player: record.Player,
          opponent: record.Opponent,
          dvpRating: parseFloat(record.DVP_Rating),
          avgPoints: parseFloat(record.Avg_Points),
          gamesPlayed: parseInt(record.Games_Played),
          consistency: parseFloat(record.Consistency),
          position: record.Position,
        }))
      );

      console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1} (${Math.min(i + batchSize, playerRecords.length)}/${playerRecords.length})`);
    }

    console.log(`✓ Inserted ${playerRecords.length} player DVP ratings`);
    console.log('DVP data load completed successfully!');

  } catch (error) {
    console.error('Error loading DVP data:', error);
    throw error;
  }
}

// Run the loader
loadDvpData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
