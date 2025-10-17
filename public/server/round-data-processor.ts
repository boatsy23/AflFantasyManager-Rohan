import fs from 'fs';
import path from 'path';

interface RoundData {
  round: number;
  score: number;
  teamValue: number;
  rank: number;
}

export class RoundDataProcessor {
  private rawDataDir = 'data/raw';
  private archiveDir = 'attached_assets';
  private teamJsonPath = 'afl_fantasy_team.json';

  parseRoundFile(filePath: string): RoundData {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let round = 0;
    let score = 0;
    let teamValue = 0;
    let rank = 0;
    
    // Extract data from first 20 lines
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line === 'ROUND SCORE' && i + 1 < lines.length) {
        score = parseInt(lines[i + 1].trim().replace(/,/g, ''));
      }
      
      if (line === 'TEAM VALUE' && i + 1 < lines.length) {
        const valueStr = lines[i + 1].trim();
        const match = valueStr.match(/\$([\d.]+)M/);
        if (match) {
          teamValue = Math.round(parseFloat(match[1]) * 1000000);
        }
      }
      
      if (line === 'OVERALL RANKING' && i + 1 < lines.length) {
        rank = parseInt(lines[i + 1].trim().replace(/,/g, ''));
      }
    }
    
    // Extract round number from filename (e.g., "round_13_cleaned_123.txt")
    const filename = path.basename(filePath);
    const roundMatch = filename.match(/round_(\d+)_/);
    if (roundMatch) {
      round = parseInt(roundMatch[1]);
    }
    
    return { round, score, teamValue, rank };
  }

  async processNewRound(uploadedFilePath: string): Promise<{
    success: boolean;
    message: string;
    roundData?: RoundData;
  }> {
    try {
      // Parse the uploaded file
      const newRoundData = this.parseRoundFile(uploadedFilePath);
      
      // Validate data
      if (!newRoundData.round || !newRoundData.score) {
        return {
          success: false,
          message: 'Invalid round data: missing round number or score'
        };
      }

      // Read current team JSON
      const teamData = JSON.parse(fs.readFileSync(this.teamJsonPath, 'utf8'));
      
      // Move previous round file from data/raw to attached_assets (if exists)
      const existingFiles = fs.readdirSync(this.rawDataDir);
      if (existingFiles.length > 0) {
        existingFiles.forEach(file => {
          const oldPath = path.join(this.rawDataDir, file);
          const newPath = path.join(this.archiveDir, file);
          fs.renameSync(oldPath, newPath);
          console.log(`Moved ${file} to ${this.archiveDir}`);
        });
      }

      // Move uploaded file to data/raw
      const filename = path.basename(uploadedFilePath);
      const rawPath = path.join(this.rawDataDir, filename);
      fs.copyFileSync(uploadedFilePath, rawPath);

      // Initialize historicalRounds if it doesn't exist
      if (!teamData.historicalRounds) {
        teamData.historicalRounds = [];
      }

      // Move current round to historical
      if (teamData.currentRound) {
        // Find captain score (highest scoring player - already doubled in data)
        const allPlayers = [
          ...(teamData.currentRound.defenders || []),
          ...(teamData.currentRound.midfielders || []),
          ...(teamData.currentRound.rucks || []),
          ...(teamData.currentRound.forwards || [])
        ];
        const captainScore = allPlayers.length > 0
          ? Math.max(...allPlayers.map((p: any) => p.score || 0))
          : 0;
        
        const historicalEntry = {
          round: teamData.currentRound.round,
          roundScore: teamData.currentRound.roundScore,
          teamValue: teamData.currentRound.teamValue,
          overallRank: teamData.currentRound.overallRank,
          captainScore: captainScore,
          projectedScore: teamData.currentRound.roundScore
        };
        
        // Update or add to historical rounds
        const existingIndex = teamData.historicalRounds.findIndex(
          (r: any) => r.round === historicalEntry.round
        );
        
        if (existingIndex >= 0) {
          teamData.historicalRounds[existingIndex] = historicalEntry;
        } else {
          teamData.historicalRounds.push(historicalEntry);
          teamData.historicalRounds.sort((a: any, b: any) => a.round - b.round);
        }
      }

      // Update current round with new data (keep players from previous round for now)
      teamData.currentRound.round = newRoundData.round;
      teamData.currentRound.roundScore = newRoundData.score;
      teamData.currentRound.teamValue = newRoundData.teamValue;
      teamData.currentRound.overallRank = newRoundData.rank;
      teamData.currentRound.timestamp = new Date().toISOString();

      // Save updated team JSON
      fs.writeFileSync(this.teamJsonPath, JSON.stringify(teamData, null, 2));

      return {
        success: true,
        message: `Successfully processed Round ${newRoundData.round}`,
        roundData: newRoundData
      };
    } catch (error) {
      return {
        success: false,
        message: `Error processing round data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const roundDataProcessor = new RoundDataProcessor();
