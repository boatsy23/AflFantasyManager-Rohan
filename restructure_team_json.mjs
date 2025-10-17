import fs from 'fs';

// Read current team data
const currentData = JSON.parse(fs.readFileSync('afl_fantasy_team.json', 'utf8'));

// Read historical performance data
const historicalPerf = JSON.parse(fs.readFileSync('historical_performances.json', 'utf8'));

// Calculate team value from current data
function calculateTeamValue(teamData) {
  const positions = ['defenders', 'midfielders', 'forwards', 'rucks', 'bench', 'emergencies'];
  let totalValue = 0;
  
  positions.forEach(pos => {
    if (teamData[pos] && Array.isArray(teamData[pos])) {
      teamData[pos].forEach(player => {
        if (player.priceRaw) {
          totalValue += player.priceRaw;
        }
      });
    }
  });
  
  return totalValue;
}

const teamValue = calculateTeamValue(currentData);

// Create new structured format
const restructuredData = {
  teamName: currentData.teamName,
  totalPlayers: currentData.totalPlayers,
  
  currentRound: {
    round: currentData.round,
    timestamp: currentData.timestamp,
    roundScore: currentData.roundScore,
    overallRank: currentData.overallRank,
    teamValue: teamValue,
    
    // Team composition
    defenders: currentData.defenders || [],
    midfielders: currentData.midfielders || [],
    forwards: currentData.forwards || [],
    rucks: currentData.rucks || [],
    bench: currentData.bench || [],
    emergencies: currentData.emergencies || [],
    
    // Captain selection
    captain: currentData.captain || null,
    viceCaptain: currentData.viceCaptain || null
  },
  
  historicalRounds: historicalPerf.map(round => ({
    round: round.round,
    roundScore: round.score,
    teamValue: round.value,
    overallRank: round.rank,
    projectedScore: round.projectedScore
  }))
};

// Save restructured data
fs.writeFileSync('afl_fantasy_team.json', JSON.stringify(restructuredData, null, 2));
console.log('✅ Successfully restructured afl_fantasy_team.json');
console.log(`📊 Current Round: ${restructuredData.currentRound.round}`);
console.log(`📈 Historical Rounds: ${restructuredData.historicalRounds.length}`);
console.log(`💰 Team Value: $${(teamValue/1000000).toFixed(3)}M`);
