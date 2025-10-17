import fs from 'fs';
import path from 'path';

// Parse a single round file
function parseRoundFile(filePath, roundNumber) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let score = 0;
  let teamValue = 0;
  let rank = 0;
  
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();
    
    // Extract ROUND SCORE
    if (line === 'ROUND SCORE' && i + 1 < lines.length) {
      score = parseInt(lines[i + 1].trim().replace(/,/g, ''));
    }
    
    // Extract TEAM VALUE
    if (line === 'TEAM VALUE' && i + 1 < lines.length) {
      const valueStr = lines[i + 1].trim();
      // Parse "$17.748M" format
      const match = valueStr.match(/\$([\d.]+)M/);
      if (match) {
        teamValue = Math.round(parseFloat(match[1]) * 1000000);
      }
    }
    
    // Extract OVERALL RANKING
    if (line === 'OVERALL RANKING' && i + 1 < lines.length) {
      rank = parseInt(lines[i + 1].trim().replace(/,/g, ''));
    }
  }
  
  return {
    round: roundNumber,
    score: score,
    value: teamValue,
    rank: rank,
    projectedScore: score // Use actual score as projected for historical data
  };
}

// Find file for a specific round
function findRoundFile(round) {
  const dirPath = 'attached_assets';
  const files = fs.readdirSync(dirPath);
  const pattern = new RegExp(`^round_${round}_cleaned_\\d+\\.txt$`);
  
  for (const file of files) {
    if (pattern.test(file)) {
      return path.join(dirPath, file);
    }
  }
  return null;
}

// Main execution
const roundsData = [];

// Parse all round files (1-24)
for (let round = 1; round <= 24; round++) {
  const filePath = findRoundFile(round);
  
  if (filePath) {
    const roundData = parseRoundFile(filePath, round);
    roundsData.push(roundData);
    console.log(`Round ${round}: Score=${roundData.score}, Value=$${(roundData.value/1000000).toFixed(3)}M, Rank=${roundData.rank}`);
  } else {
    console.log(`File not found for round ${round}`);
  }
}

// Save parsed data to JSON file
const outputPath = 'historical_performances.json';
fs.writeFileSync(outputPath, JSON.stringify(roundsData, null, 2));
console.log(`\n✅ Parsed ${roundsData.length} rounds successfully!`);
console.log(`📁 Saved to: ${outputPath}`);
