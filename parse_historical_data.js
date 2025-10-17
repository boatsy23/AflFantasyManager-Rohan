const fs = require('fs');
const path = require('path');

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

// Main execution
const roundsData = [];

// Parse all round files
for (let round = 1; round <= 12; round++) {
  const fileName = `round_${round}_cleaned_1760552752925.txt`;
  const filePath = path.join('attached_assets', fileName);
  
  if (fs.existsSync(filePath)) {
    const roundData = parseRoundFile(filePath, round);
    roundsData.push(roundData);
    console.log(`Round ${round}: Score=${roundData.score}, Value=$${(roundData.value/1000000).toFixed(3)}M, Rank=${roundData.rank}`);
  } else {
    console.log(`File not found: ${fileName}`);
  }
}

// Save parsed data to JSON file
const outputPath = 'historical_performances.json';
fs.writeFileSync(outputPath, JSON.stringify(roundsData, null, 2));
console.log(`\n✅ Parsed ${roundsData.length} rounds successfully!`);
console.log(`📁 Saved to: ${outputPath}`);
