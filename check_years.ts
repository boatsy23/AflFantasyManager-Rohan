import XLSX from 'xlsx';

const testFile = 'player_stats_output/Massimo.DAmbrosio.xlsx';
const workbook = XLSX.readFile(testFile);
const sheet = workbook.Sheets['Game Logs'];
const gameLogs = XLSX.utils.sheet_to_json(sheet);

const aflGames = gameLogs.filter((g: any) => g.league === 'AFL');
console.log(`Total AFL games: ${aflGames.length}`);

// Get unique years
const years = new Set(aflGames.map((g: any) => g.year));
console.log(`Years: ${Array.from(years).sort()}`);

// Get 2024 games
const afl2024 = aflGames.filter((g: any) => g.year === 2024);
console.log(`\n2024 AFL games: ${afl2024.length}`);
if (afl2024.length > 0) {
  const rounds = afl2024.map((g: any) => g.round).filter((r: any) => r);
  console.log(`2024 Rounds: ${Array.from(new Set(rounds)).sort((a, b) => {
    const aNum = parseInt(a.toString().match(/\d+/)?.[0] || '999');
    const bNum = parseInt(b.toString().match(/\d+/)?.[0] || '999');
    return aNum - bNum;
  })}`);
  console.log('Sample 2024 game:', afl2024[0]);
}
