import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { promises as fs } from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

class DFSPuppeteerScraper {
    constructor() {
        this.baseUrl = 'https://dfsaustralia.com';
        this.browser = null;
        this.rawDataDir = path.join(process.cwd(), 'raw_data', 'player_excel_files');
    }

    async initialize() {
        // Create output directory
        await fs.mkdir(this.rawDataDir, { recursive: true });
        
        // Launch browser
        this.browser = await puppeteerExtra.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        console.log('✓ Browser initialized');
    }

    async loadPlayerList() {
        // Load the player list from the existing Excel file
        const xlsxPath = path.join(process.cwd(), 'dfs_player_list.xlsx');
        try {
            const workbook = XLSX.readFile(xlsxPath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);
            console.log(`✓ Loaded ${data.length} players from Excel file`);
            return data;
        } catch (error) {
            console.error('Error loading player list:', error);
            return [];
        }
    }

    async scrapePlayer(playerData) {
        const page = await this.browser.newPage();
        
        try {
            // Set viewport and user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Navigate to player page
            const playerUrl = `${this.baseUrl}/afl-fantasy-player/${playerData.player_url}/`;
            console.log(`  → Navigating to: ${playerUrl}`);
            
            await page.goto(playerUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for page to load
            await page.waitForSelector('.player-profile', { timeout: 10000 }).catch(() => {});
            
            // Extract player info
            const playerInfo = await page.evaluate(() => {
                const getTextContent = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent.trim() : '';
                };
                
                // Get basic player info
                const name = getTextContent('h1.player-name') || document.title.split(' - ')[0];
                const team = getTextContent('.player-team') || '';
                const position = getTextContent('.player-position') || '';
                const price = getTextContent('.player-price') || '';
                
                return {
                    name,
                    team,
                    position, 
                    price: price.replace(/[^0-9]/g, '')
                };
            });
            
            console.log(`  ✓ Found player: ${playerInfo.name} (${playerInfo.team})`);
            
            // Click on Game Logs tab/button if exists
            const gameLogsButton = await page.$('[data-tab="game-logs"], .game-logs-tab, #game-logs-tab, button:has-text("Game Logs")');
            if (gameLogsButton) {
                await gameLogsButton.click();
                await page.waitForTimeout(1000);
            }
            
            // Look for expandable rows or "Show More" buttons
            const expandButtons = await page.$$('.expand-row, .show-more, .toggle-details, [aria-expanded="false"]');
            for (const button of expandButtons) {
                try {
                    await button.click();
                    await page.waitForTimeout(500);
                } catch (e) {
                    // Ignore click errors
                }
            }
            
            // Extract game logs data with all fields
            const gameLogs = await page.evaluate(() => {
                const games = [];
                
                // Try multiple possible table selectors
                const tables = document.querySelectorAll(
                    'table.game-logs, ' +
                    'table.stats-table, ' +
                    '#game-logs-table, ' +
                    '.game-logs-container table, ' +
                    'table:has(th:has-text("Round"))'
                );
                
                for (const table of tables) {
                    const rows = table.querySelectorAll('tbody tr');
                    
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length > 0) {
                            // Extract all available data
                            const game = {};
                            
                            // Map headers to values
                            const headers = table.querySelectorAll('thead th');
                            cells.forEach((cell, index) => {
                                if (headers[index]) {
                                    const key = headers[index].textContent.trim()
                                        .toLowerCase()
                                        .replace(/\s+/g, '_')
                                        .replace(/[^a-z0-9_]/g, '');
                                    game[key] = cell.textContent.trim();
                                }
                            });
                            
                            // Try to extract specific fields by common patterns
                            if (!game.round) {
                                game.round = cells[0]?.textContent.trim() || '';
                            }
                            if (!game.opponent) {
                                // Look for "vs" or "@" pattern
                                const vsCell = Array.from(cells).find(c => 
                                    c.textContent.includes('vs') || 
                                    c.textContent.includes('@')
                                );
                                game.opponent = vsCell?.textContent.trim() || '';
                            }
                            if (!game.venue) {
                                // Look for venue patterns
                                const venueCell = Array.from(cells).find(c => {
                                    const text = c.textContent.trim();
                                    return text.includes('Stadium') || 
                                           text.includes('Oval') || 
                                           text.includes('Park') ||
                                           text.includes('MCG') ||
                                           text.includes('SCG');
                                });
                                game.venue = venueCell?.textContent.trim() || '';
                            }
                            
                            if (Object.keys(game).length > 0) {
                                games.push(game);
                            }
                        }
                    });
                }
                
                // If no tables found, try to extract from any structured data
                if (games.length === 0) {
                    const dataRows = document.querySelectorAll('.game-row, .match-row, [data-game-id]');
                    dataRows.forEach(row => {
                        const game = {
                            round: row.querySelector('.round')?.textContent.trim() || '',
                            date: row.querySelector('.date')?.textContent.trim() || '',
                            opponent: row.querySelector('.opponent')?.textContent.trim() || '',
                            venue: row.querySelector('.venue')?.textContent.trim() || '',
                            score: row.querySelector('.score, .fantasy-points')?.textContent.trim() || '',
                            disposals: row.querySelector('.disposals')?.textContent.trim() || '',
                            marks: row.querySelector('.marks')?.textContent.trim() || '',
                            tackles: row.querySelector('.tackles')?.textContent.trim() || '',
                            goals: row.querySelector('.goals')?.textContent.trim() || '',
                        };
                        
                        if (game.round || game.date) {
                            games.push(game);
                        }
                    });
                }
                
                return games;
            });
            
            console.log(`  ✓ Extracted ${gameLogs.length} game logs`);
            
            // Extract season averages
            const seasonAverages = await page.evaluate(() => {
                const averages = {};
                
                // Look for averages section
                const avgElements = document.querySelectorAll('.season-average, .avg-stat, [class*="average"]');
                avgElements.forEach(el => {
                    const label = el.querySelector('.label, .stat-label')?.textContent.trim() || '';
                    const value = el.querySelector('.value, .stat-value')?.textContent.trim() || el.textContent.trim();
                    
                    if (label && value) {
                        averages[label.toLowerCase().replace(/\s+/g, '_')] = value;
                    }
                });
                
                // Also try to extract from tables with "Average" or "Season" in headers
                const avgTables = document.querySelectorAll('table:has(th:has-text("Average")), table:has(caption:has-text("Season"))');
                avgTables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td, th');
                        if (cells.length === 2) {
                            const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '_');
                            const value = cells[1].textContent.trim();
                            if (key && value) {
                                averages[key] = value;
                            }
                        }
                    });
                });
                
                return averages;
            });
            
            console.log(`  ✓ Extracted season averages`);
            
            // Create Excel file with all data
            const workbook = XLSX.utils.book_new();
            
            // Add player info sheet
            const infoSheet = XLSX.utils.json_to_sheet([{
                'Player Name': playerInfo.name || playerData.player_name,
                'Team': playerInfo.team || '',
                'Position': playerInfo.position || '',
                'Price': playerInfo.price || '',
                'Player ID': playerData.player_id || '',
                'URL': playerUrl
            }]);
            XLSX.utils.book_append_sheet(workbook, infoSheet, 'Player Info');
            
            // Add game logs sheet
            if (gameLogs.length > 0) {
                const gameSheet = XLSX.utils.json_to_sheet(gameLogs);
                XLSX.utils.book_append_sheet(workbook, gameSheet, 'Game Logs');
            }
            
            // Add season averages sheet
            if (Object.keys(seasonAverages).length > 0) {
                const avgSheet = XLSX.utils.json_to_sheet([seasonAverages]);
                XLSX.utils.book_append_sheet(workbook, avgSheet, 'Season Averages');
            }
            
            // Save Excel file
            const fileName = `${playerData.player_name.replace(/\s+/g, '.')}.xlsx`;
            const filePath = path.join(this.rawDataDir, fileName);
            XLSX.writeFile(workbook, filePath);
            
            console.log(`  ✓ Saved: ${fileName}`);
            
            return {
                success: true,
                player: playerData.player_name,
                gameLogsCount: gameLogs.length,
                filePath
            };
            
        } catch (error) {
            console.error(`  ✗ Error scraping ${playerData.player_name}:`, error.message);
            return {
                success: false,
                player: playerData.player_name,
                error: error.message
            };
        } finally {
            await page.close();
        }
    }

    async scrapeAll(testMode = false) {
        console.log('============================================================');
        console.log('DFS Australia Puppeteer Scraper');
        console.log('============================================================');
        
        await this.initialize();
        
        const players = await this.loadPlayerList();
        if (players.length === 0) {
            console.error('No players to scrape');
            return;
        }
        
        // In test mode, only process first 3 players
        const playersToProcess = testMode ? players.slice(0, 3) : players;
        console.log(`\nProcessing ${playersToProcess.length} players${testMode ? ' (TEST MODE)' : ''}...\n`);
        
        const results = {
            successful: [],
            failed: []
        };
        
        // Process players sequentially to avoid overwhelming the server
        for (let i = 0; i < playersToProcess.length; i++) {
            const player = playersToProcess[i];
            console.log(`[${i + 1}/${playersToProcess.length}] ${player.player_name}`);
            
            const result = await this.scrapePlayer(player);
            
            if (result.success) {
                results.successful.push(result);
            } else {
                results.failed.push(result);
            }
            
            // Add delay between requests
            if (i < playersToProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Close browser
        await this.browser.close();
        
        // Print summary
        console.log('\n============================================================');
        console.log('SCRAPING COMPLETE');
        console.log('============================================================');
        console.log(`✓ Successful: ${results.successful.length} players`);
        console.log(`✗ Failed: ${results.failed.length} players`);
        
        if (results.failed.length > 0) {
            console.log('\nFailed players:');
            results.failed.forEach(r => {
                console.log(`  - ${r.player}: ${r.error}`);
            });
        }
        
        console.log(`\nOutput directory: ${this.rawDataDir}`);
        console.log('============================================================');
        
        return results;
    }
}

// Main execution
const testMode = process.argv.includes('--test');
const scraper = new DFSPuppeteerScraper();

scraper.scrapeAll(testMode)
    .then(results => {
        console.log('Scraping completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

export default DFSPuppeteerScraper;