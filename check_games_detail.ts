import XLSX from 'xlsx';

const testFile = 'player_stats_output/Massimo.DAmbrosio.xlsx';
const workbook = XLSX.readFile(testFile);
const sheet = workbook.Sheets['Game Logs'];
const gameLogs: any[] = XLSX.utils.sheet_to_json(sheet);

const aflGames = gameLogs.filter(g => g.league === 'AFL');

console.log('First 5 AFL games:');
aflGames.slice(0, 5).forEach((g, i) => {
  console.log(`\nGame ${i + 1}:`);
  console.log(`  Year: ${g.year} (type: ${typeof g.year})`);
  console.log(`  Round: ${g.round} (type: ${typeof g.round})`);
  console.log(`  League: ${g.league}`);
  console.log(`  FP: ${g.FP}`);
});

// Check if years are numbers or strings
const yearTypes = new Set(aflGames.map(g => typeof g.year));
console.log(`\nYear types in data: ${Array.from(yearTypes)}`);

// Sample actual year values
const sampleYears = aflGames.slice(0, 10).map(g => ({year: g.year, type: typeof g.year}));
console.log('\nSample years:', sampleYears);
