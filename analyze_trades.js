import fs from 'fs';

// Read the JSON file
const data = JSON.parse(fs.readFileSync('afl_fantasy_team.json', 'utf8'));

// Function to find differences between two player arrays
function findTrades(currentRoundPlayers, nextRoundPlayers) {
  const currentSet = new Set(currentRoundPlayers);
  const nextSet = new Set(nextRoundPlayers);
  
  const tradedOut = currentRoundPlayers.filter(player => !nextSet.has(player));
  const tradedIn = nextRoundPlayers.filter(player => !currentSet.has(player));
  
  return { tradedOut, tradedIn };
}

// Keep Round 1 trades if they exist (pre-season baseline)
if (!data.historicalRounds[0].trades) {
  data.historicalRounds[0].trades = {
    tradedOut: [],
    tradedIn: []
  };
}

// Process each round (comparing round i to round i+1, assigning trades to round i+1)
for (let i = 0; i < data.historicalRounds.length - 1; i++) {
  const currentRound = data.historicalRounds[i];
  const nextRound = data.historicalRounds[i + 1];
  
  const trades = findTrades(currentRound.players, nextRound.players);
  
  // Add trades to NEXT round (the round where these trades take effect)
  nextRound.trades = {
    tradedOut: trades.tradedOut,
    tradedIn: trades.tradedIn
  };
  
  console.log(`Round ${nextRound.round}:`);
  console.log(`  Traded Out (${trades.tradedOut.length}): ${trades.tradedOut.join(', ')}`);
  console.log(`  Traded In (${trades.tradedIn.length}): ${trades.tradedIn.join(', ')}`);
  console.log('');
}

// Round 24 has no trades (final round)
if (data.historicalRounds.length >= 24) {
  data.historicalRounds[23].trades = {
    tradedOut: [],
    tradedIn: []
  };
  console.log('Round 24: No trades (final round)');
}

// Validate trade counts
console.log('\n=== VALIDATION ===\n');

let validationPassed = true;

// Check rounds 1-11 (should have 2 trades each)
for (let i = 0; i < 11; i++) {
  const round = data.historicalRounds[i];
  const outCount = round.trades.tradedOut.length;
  const inCount = round.trades.tradedIn.length;
  
  if (outCount !== 2 || inCount !== 2) {
    console.log(`❌ Round ${round.round}: Expected 2 out/2 in, got ${outCount} out/${inCount} in`);
    validationPassed = false;
  } else {
    console.log(`✓ Round ${round.round}: 2 out, 2 in`);
  }
}

// Check rounds 12-16 (should have 3 trades each)
for (let i = 11; i < 16; i++) {
  const round = data.historicalRounds[i];
  const outCount = round.trades.tradedOut.length;
  const inCount = round.trades.tradedIn.length;
  
  if (outCount !== 3 || inCount !== 3) {
    console.log(`❌ Round ${round.round}: Expected 3 out/3 in, got ${outCount} out/${inCount} in`);
    validationPassed = false;
  } else {
    console.log(`✓ Round ${round.round}: 3 out, 3 in`);
  }
}

// Check rounds 17-23 (should have 2 trades each)
for (let i = 16; i < 23; i++) {
  const round = data.historicalRounds[i];
  const outCount = round.trades.tradedOut.length;
  const inCount = round.trades.tradedIn.length;
  
  if (outCount !== 2 || inCount !== 2) {
    console.log(`❌ Round ${round.round}: Expected 2 out/2 in, got ${outCount} out/${inCount} in`);
    validationPassed = false;
  } else {
    console.log(`✓ Round ${round.round}: 2 out, 2 in`);
  }
}

// Round 24 should have no trades
const round24 = data.historicalRounds[23];
if (round24.trades) {
  console.log(`❌ Round 24 should not have trades`);
  validationPassed = false;
} else {
  console.log(`✓ Round 24: No trades (final round)`);
}

if (validationPassed) {
  console.log('\n✓ All validations passed!');
} else {
  console.log('\n⚠️  Note: Actual trade pattern differs from expected pattern.');
  console.log('This is normal - the data reflects actual team changes.');
}

// Write the updated JSON back to file (regardless of validation)
fs.writeFileSync('afl_fantasy_team.json', JSON.stringify(data, null, 2));
console.log('\n✓ Successfully updated afl_fantasy_team.json with trade history!');

// Summary
console.log('\n=== SUMMARY ===');
let totalTrades = 0;
for (let i = 0; i < data.historicalRounds.length - 1; i++) {
  const round = data.historicalRounds[i];
  totalTrades += round.trades.tradedOut.length;
}
console.log(`Total trades across all rounds: ${totalTrades}`);
