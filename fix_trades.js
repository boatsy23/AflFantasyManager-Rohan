import fs from 'fs';

const data = JSON.parse(fs.readFileSync('afl_fantasy_team.json', 'utf8'));

// Manually fix Round 3: split the 4 Round 4 trades
data.historicalRounds[2].trades = {
  tradedOut: ['Will Day', 'Lucas Camporeale'],
  tradedIn: ['Levi Ashcroft', 'Christian Moraes']
};

// Fix Round 4: keep the other 2
data.historicalRounds[3].trades = {
  tradedOut: ['Hugo Garcia', 'Jack Hutchinson'],
  tradedIn: ['Izak Rankine', 'Ted Clohesy']
};

// Manually fix Round 6: split the 4 Round 7 trades  
data.historicalRounds[5].trades = {
  tradedOut: ['Sam De Koning', 'Finn Callaghan'],
  tradedIn: ['Zach Merrett', 'Nick Daicos']
};

// Fix Round 7: keep the other 2
data.historicalRounds[6].trades = {
  tradedOut: ['Nathan O\'Driscoll', 'Ted Clohesy'],
  tradedIn: ['Caiden Cleary', 'Campbell Gray']
};

fs.writeFileSync('afl_fantasy_team.json', JSON.stringify(data, null, 2));
console.log('✓ Fixed trade assignments for Rounds 3, 4, 6, and 7');
