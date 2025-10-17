import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import * as fs from 'fs/promises';
import * as path from 'path';
import { db } from '../db';
import { players } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

interface ScrapedPlayer {
  name: string;
  team: string;
  position: string;
  price: number;
  projectedScore: number;
  averageScore: number;
  lastScore: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isOnField: boolean;
  isEmergency: boolean;
}

interface TeamLineup {
  defenders: ScrapedPlayer[];
  midfielders: ScrapedPlayer[];
  rucks: ScrapedPlayer[];
  forwards: ScrapedPlayer[];
  bench: {
    defenders: ScrapedPlayer[];
    midfielders: ScrapedPlayer[];
    rucks: ScrapedPlayer[];
    forwards: ScrapedPlayer[];
    utility: ScrapedPlayer[];
  };
  captain: ScrapedPlayer | null;
  viceCaptain: ScrapedPlayer | null;
  totalValue: number;
  projectedScore: number;
  round: number;
  timestamp: Date;
}

export class AFLFantasyScraper {
  private driver: WebDriver | null = null;
  private username: string;
  private password: string;
  
  constructor() {
    // Get credentials from secure environment variables
    this.username = process.env.AFL_USERNAME || '';
    this.password = process.env.AFL_PASSWORD || '';
    
    if (!this.username || !this.password) {
      console.warn('AFL Fantasy credentials not found in environment variables');
    }
  }
  
  private async clearOldTeamData(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Clear all files in the scraped directory
      const dataDir = path.join(process.cwd(), 'data', 'scraped');
      
      // Create directory if it doesn't exist
      await fs.mkdir(dataDir, { recursive: true });
      
      // Get all files in the directory
      const files = await fs.readdir(dataDir);
      
      // Delete each file
      for (const file of files) {
        const filePath = path.join(dataDir, file);
        await fs.unlink(filePath);
      }
      
      console.log('Cleared old team data');
    } catch (error) {
      console.error('Error clearing old team data:', error);
    }
  }
  
  private async initDriver(): Promise<void> {
    const options = new chrome.Options();
    
    // Run headless for production, but allow headed mode for debugging
    if (process.env.NODE_ENV === 'production') {
      options.addArguments('--headless');
    }
    
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }
  
  private async login(): Promise<boolean> {
    if (!this.driver || !this.username || !this.password) {
      console.error('Cannot login: missing driver or credentials');
      return false;
    }
    
    try {
      console.log('Navigating to AFL Fantasy login page...');
      await this.driver.get('https://fantasy.afl.com.au/classic/login');
      
      // Wait for login form
      await this.driver.wait(until.elementLocated(By.css('input[type="email"], input[name="username"]')), 10000);
      
      // Enter credentials
      const usernameField = await this.driver.findElement(By.css('input[type="email"], input[name="username"]'));
      await usernameField.clear();
      await usernameField.sendKeys(this.username);
      
      const passwordField = await this.driver.findElement(By.css('input[type="password"]'));
      await passwordField.clear();
      await passwordField.sendKeys(this.password);
      
      // Submit login
      const loginButton = await this.driver.findElement(By.css('button[type="submit"], .login-button'));
      await loginButton.click();
      
      // Wait for successful login (redirect to team page or dashboard)
      await this.driver.wait(until.urlContains('/team'), 15000);
      
      console.log('Successfully logged in to AFL Fantasy');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  public async scrapeUserTeam(): Promise<TeamLineup | null> {
    try {
      // Clear old team data first
      await this.clearOldTeamData();
      
      await this.initDriver();
      
      if (!await this.login()) {
        throw new Error('Failed to login to AFL Fantasy');
      }
      
      console.log('Navigating to team page...');
      await this.driver!.get('https://fantasy.afl.com.au/classic/team');
      
      // Wait for team to load
      await this.driver!.wait(until.elementLocated(By.css('.list-view-player, .team-list, .field-players')), 10000);
      
      // Extract team data
      const lineup = await this.extractTeamData();
      
      // Save to database
      await this.saveToDatabase(lineup);
      
      // Save to file for backup
      await this.saveToFile(lineup);
      
      return lineup;
      
    } catch (error) {
      console.error('Error scraping team:', error);
      return null;
    } finally {
      if (this.driver) {
        await this.driver.quit();
        this.driver = null;
      }
    }
  }
  
  private async extractTeamData(): Promise<TeamLineup> {
    if (!this.driver) throw new Error('Driver not initialized');
    
    const lineup: TeamLineup = {
      defenders: [],
      midfielders: [],
      rucks: [],
      forwards: [],
      bench: {
        defenders: [],
        midfielders: [],
        rucks: [],
        forwards: [],
        utility: []
      },
      captain: null,
      viceCaptain: null,
      totalValue: 0,
      projectedScore: 0,
      round: await this.getCurrentRound(),
      timestamp: new Date()
    };
    
    // Get all players on field and bench
    const playerElements = await this.driver.findElements(By.css('.list-view-player, .player-card, [data-player-id]'));
    
    for (const element of playerElements) {
      try {
        const player = await this.extractPlayerData(element);
        
        // Categorize player by position and field status
        if (player.isOnField) {
          switch (player.position) {
            case 'DEF':
              lineup.defenders.push(player);
              break;
            case 'MID':
              lineup.midfielders.push(player);
              break;
            case 'RUC':
              lineup.rucks.push(player);
              break;
            case 'FWD':
              lineup.forwards.push(player);
              break;
          }
        } else {
          // Handle bench players
          if (player.isEmergency) {
            switch (player.position) {
              case 'DEF':
                lineup.bench.defenders.push(player);
                break;
              case 'MID':
                lineup.bench.midfielders.push(player);
                break;
              case 'RUC':
                lineup.bench.rucks.push(player);
                break;
              case 'FWD':
                lineup.bench.forwards.push(player);
                break;
            }
          } else {
            lineup.bench.utility.push(player);
          }
        }
        
        // Track captain and vice captain
        if (player.isCaptain) {
          lineup.captain = player;
        }
        if (player.isViceCaptain) {
          lineup.viceCaptain = player;
        }
        
        // Add to totals
        lineup.totalValue += player.price;
        if (player.isOnField) {
          lineup.projectedScore += player.isCaptain ? 
            (player.projectedScore * 2) : player.projectedScore;
        }
        
      } catch (error) {
        console.warn('Error extracting player data:', error);
      }
    }
    
    return lineup;
  }
  
  private async extractPlayerData(element: any): Promise<ScrapedPlayer> {
    // Extract player details from the element
    const name = await this.getElementText(element, '.player-name, .name, [data-player-name]');
    const team = await this.getElementText(element, '.player-team, .team, [data-team]');
    const position = await this.getElementText(element, '.player-position, .position, [data-position]');
    const priceText = await this.getElementText(element, '.player-price, .price, [data-price]');
    const scoreText = await this.getElementText(element, '.player-score, [points], [data-score]');
    const avgText = await this.getElementText(element, '.player-avg, .average, [data-average]');
    
    // Check for captain/vice captain badges
    const captainBadge = await element.findElements(By.css('.captain-badge, .is-captain, [data-captain="true"]'));
    const viceBadge = await element.findElements(By.css('.vice-badge, .is-vice, [data-vice="true"]'));
    const emergencyBadge = await element.findElements(By.css('.emergency, .is-emergency, [data-emergency="true"]'));
    
    // Determine if player is on field (not on bench)
    const benchElement = await element.findElements(By.xpath('ancestor::*[contains(@class, "bench")]'));
    const isOnField = benchElement.length === 0;
    
    return {
      name: name || 'Unknown Player',
      team: team || 'Unknown Team',
      position: position || 'Unknown',
      price: this.parsePrice(priceText),
      projectedScore: parseFloat(scoreText) || 0,
      averageScore: parseFloat(avgText) || 0,
      lastScore: 0, // Will be updated from recent games
      isCaptain: captainBadge.length > 0,
      isViceCaptain: viceBadge.length > 0,
      isOnField: isOnField,
      isEmergency: emergencyBadge.length > 0
    };
  }
  
  private async getElementText(element: any, selector: string): Promise<string> {
    try {
      const el = await element.findElement(By.css(selector));
      return await el.getText();
    } catch {
      return '';
    }
  }
  
  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }
  
  private async getCurrentRound(): Promise<number> {
    try {
      // Try to get current round from the page
      const roundElement = await this.driver!.findElement(By.css('.current-round, .round-selector, [data-round]'));
      const roundText = await roundElement.getText();
      const roundMatch = roundText.match(/\d+/);
      return roundMatch ? parseInt(roundMatch[0]) : 1;
    } catch {
      // Default to round 1 if can't determine
      return 1;
    }
  }
  
  private async saveToDatabase(lineup: TeamLineup): Promise<void> {
    try {
      // Update player information in database
      const allPlayers = [
        ...lineup.defenders,
        ...lineup.midfielders,
        ...lineup.rucks,
        ...lineup.forwards,
        ...lineup.bench.defenders,
        ...lineup.bench.midfielders,
        ...lineup.bench.rucks,
        ...lineup.bench.forwards,
        ...lineup.bench.utility
      ];
      
      for (const player of allPlayers) {
        // Check if player exists and update their info
        await db.update(players)
          .set({
            price: player.price,
            projectedScore: player.projectedScore,
            averagePoints: player.averageScore
          })
          .where(eq(players.name, player.name));
      }
      
      console.log(`Saved ${allPlayers.length} players to database`);
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }
  
  private async saveToFile(lineup: TeamLineup): Promise<void> {
    try {
      const dataDir = path.join(process.cwd(), 'data', 'scraped');
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save with timestamp
      const filename = `team_lineup_${lineup.round}_${Date.now()}.json`;
      const filepath = path.join(dataDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(lineup, null, 2));
      
      // Also save as latest
      const latestPath = path.join(dataDir, 'latest_team.json');
      await fs.writeFile(latestPath, JSON.stringify(lineup, null, 2));
      
      console.log(`Team lineup saved to ${filename}`);
    } catch (error) {
      console.error('Error saving to file:', error);
    }
  }
  
  // Schedule weekly scraping
  public scheduleWeeklyScrape(): void {
    // Run every Tuesday at 6 PM (after teams are usually finalized)
    const dayOfWeek = 2; // Tuesday
    const hour = 18; // 6 PM
    
    const checkAndRun = () => {
      const now = new Date();
      if (now.getDay() === dayOfWeek && now.getHours() === hour) {
        console.log('Running scheduled team scrape...');
        this.scrapeUserTeam();
      }
    };
    
    // Check every hour
    setInterval(checkAndRun, 60 * 60 * 1000);
    
    console.log('Weekly scraping scheduled for Tuesdays at 6 PM');
  }
}

// Export singleton instance
export const aflFantasyScraper = new AFLFantasyScraper();