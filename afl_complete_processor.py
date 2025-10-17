#!/usr/bin/env python3
"""
AFL Fantasy Complete Data Processor
Consolidates ALL formulas in one script:
- Break-even scraping from available rounds
- Price change formula (weighted 5-round algorithm)
- All statistical calculations
- Data mapping between AFL data and server format
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import statistics
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AFLCompleteProcessor:
    def __init__(self, data_dir: str = "data/historical"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Create data directory
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Magic numbers for price calculations (round-specific from fantasysports.win)
        self.magic_numbers = {
            0: 10250, 1: 9840, 2: 9783, 3: 9801, 4: 9719, 5: 9747, 6: 9869, 7: 9881,
            8: 9928, 9: 9839, 10: 9888, 11: 9821, 12: 9822, 13: 9765, 14: 9749, 15: 9788,
            16: 9875, 17: 9756, 18: 9748, 19: 9817, 20: 9755, 21: 9734, 22: 9740, 23: 9736
        }
        
        # Available rounds (based on website inspection)
        self.available_rounds = [0, 1, 2, 3, 4, 12, 21, 22, 23]  # Add more as discovered
        
        # Historical data storage
        self.historical_break_evens = {}
        self._load_historical_data()
    
    def _load_historical_data(self):
        """Load existing historical data if available"""
        historical_file = self.data_dir / "break_evens_historical.json"
        if historical_file.exists():
            try:
                with open(historical_file, 'r') as f:
                    self.historical_break_evens = json.load(f)
                logger.info(f"Loaded existing historical data: {len(self.historical_break_evens)} rounds")
            except Exception as e:
                logger.warning(f"Could not load historical data: {e}")
                self.historical_break_evens = {}
    
    def _save_historical_data(self):
        """Save historical data to file"""
        historical_file = self.data_dir / "break_evens_historical.json"
        try:
            with open(historical_file, 'w') as f:
                json.dump(self.historical_break_evens, f, indent=2, sort_keys=True)
            logger.info(f"Saved historical data to {historical_file}")
        except Exception as e:
            logger.error(f"Could not save historical data: {e}")
    
    def scrape_break_evens_single_round(self, round_num: int) -> Dict[str, Dict]:
        """
        Scrape break-even scores from fantasysports.win for a single round
        Returns: {player_name_lower: {name, position, average, break_even, price, value, score}}
        """
        url = f"https://fantasysports.win/break-evens.html?display=15&round={round_num}&submit=View&exclude_zero=on"
        
        logger.info(f"Scraping round {round_num} break-evens from: {url}")
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the main data table (ID: "sortable")
            table = soup.find('table', id='sortable')
            
            if not table:
                logger.error(f"Could not find sortable table on page for round {round_num}")
                return {}
            
            break_evens = {}
            
            # Process table rows (skip header) - ensure table is a valid element
            rows = []
            if table and hasattr(table, 'find_all'):
                rows = table.find_all('tr')[1:]
            
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 9:  # Ensure we have all columns
                    try:
                        # Extract data from columns
                        # ['Team', 'Name', 'Position', 'Av', 'BE', 'Price', 'Value', '$Change', 'Score(R23)']
                        team = cells[0].get_text(strip=True)
                        name = cells[1].get_text(strip=True)
                        position = cells[2].get_text(strip=True)
                        average = self._extract_number(cells[3].get_text(strip=True))
                        break_even = self._extract_number(cells[4].get_text(strip=True))
                        price = self._extract_number(cells[5].get_text(strip=True))
                        value = self._extract_number(cells[6].get_text(strip=True))
                        # Skip $Change column (index 7) - just visual dots: 🟢=increase, 🔴=decrease, 🟠=little change
                        score = self._extract_number(cells[8].get_text(strip=True))
                        
                        if name and break_even is not None:
                            # Clean player name
                            clean_name = self._clean_player_name(name)
                            if clean_name:
                                break_evens[clean_name.lower()] = {
                                    'name': clean_name,
                                    'team': team,
                                    'position': position,
                                    'average': average or 0,
                                    'break_even': break_even,
                                    'price': price or 0,
                                    'value': value or 0,
                                    'round_score': score or 0,
                                    'round': round_num
                                }
                                
                    except (ValueError, IndexError) as e:
                        logger.warning(f"Could not parse row in round {round_num}: {e}")
                        continue
            
            logger.info(f"Round {round_num}: Found {len(break_evens)} break-even scores")
            return break_evens
            
        except requests.RequestException as e:
            logger.error(f"Failed to scrape round {round_num} break-evens: {e}")
            return {}
    
    def _clean_player_name(self, name: str) -> str:
        """Clean and normalize player names"""
        if not name:
            return ""
        
        # Remove common suffixes
        name = re.sub(r'\s*\([^)]*\)$', '', name)  # Remove (C), (VC), etc.
        name = re.sub(r'\s+', ' ', name)  # Normalize whitespace
        
        return name.strip()
    
    def _extract_number(self, text: str) -> Optional[float]:
        """Extract numeric value from text string"""
        if not text:
            return None
        
        # Remove any non-numeric characters except decimal point and minus
        cleaned = re.sub(r'[^\d.-]', '', text)
        
        try:
            return float(cleaned)
        except ValueError:
            return None
    
    def discover_available_rounds(self) -> List[int]:
        """
        Discover which rounds have data available by testing a few
        """
        logger.info("Discovering available rounds...")
        available = []
        
        # Test rounds 0-25
        for round_num in range(0, 26):
            try:
                data = self.scrape_break_evens_single_round(round_num)
                if data:  # If we got data
                    available.append(round_num)
                    logger.info(f"Round {round_num}: ✅ Data available ({len(data)} players)")
                else:
                    logger.info(f"Round {round_num}: ❌ No data")
                
                # Be respectful with delays
                time.sleep(1)
                
            except Exception as e:
                logger.warning(f"Round {round_num}: Error - {e}")
                continue
        
        self.available_rounds = available
        logger.info(f"Discovery complete. Available rounds: {available}")
        return available
    
    def scrape_all_available_rounds(self) -> Dict[int, Dict[str, Dict]]:
        """
        Scrape break-evens from all available rounds and store historical data
        Returns: {round_num: {player_name: player_data}}
        """
        logger.info(f"Starting scrape of available rounds: {self.available_rounds}")
        
        new_data = {}
        
        for round_num in self.available_rounds:
            # Check if we already have this round's data
            round_key = str(round_num)
            if round_key in self.historical_break_evens:
                logger.info(f"Round {round_num}: Using existing data ({len(self.historical_break_evens[round_key])} players)")
                new_data[round_num] = self.historical_break_evens[round_key]
                continue
            
            # Scrape new data
            round_data = self.scrape_break_evens_single_round(round_num)
            
            if round_data:
                # Store in historical data
                self.historical_break_evens[round_key] = round_data
                new_data[round_num] = round_data
                
                # Save after each round
                self._save_historical_data()
                
                # Save individual round file
                round_file = self.data_dir / f"break_evens_round_{round_num:02d}.json"
                try:
                    with open(round_file, 'w') as f:
                        json.dump({
                            "round": round_num,
                            "scraped_at": datetime.now().isoformat(),
                            "player_count": len(round_data),
                            "players": round_data
                        }, f, indent=2, sort_keys=True)
                    logger.info(f"Saved round {round_num} data to {round_file}")
                except Exception as e:
                    logger.error(f"Could not save round {round_num} data: {e}")
            else:
                logger.warning(f"Round {round_num}: No data found")
            
            # Be respectful with delays
            time.sleep(3)
        
        logger.info(f"Completed scraping. Total rounds with data: {len(new_data)}")
        return new_data
    
    # ==========================================
    # CALCULATION FORMULAS (ALL IN ONE PLACE)
    # ==========================================
    
    def calculate_price_change(self, old_price: float, scores: List[float], round_num: int = 23) -> float:
        """
        Price change formula (weighted 5-round algorithm)
        
        Args:
            old_price: Player's price at start of round
            scores: List of last 5 scores [prev_round, 2_ago, 3_ago, 4_ago, 5_ago]
                   NOTE: Scores should exclude 0s (rounds player didn't play)
        
        Returns:
            new_price: Calculated new price
        """
        # Filter out any zero scores (player didn't play)
        valid_scores = [s for s in scores if s > 0]
        
        if len(valid_scores) < 3:
            logger.warning(f"Not enough valid scores ({len(valid_scores)}) for price calculation. Need at least 3.")
            return old_price  # Return unchanged price
        
        # Ensure we have exactly 5 scores for the formula
        if len(valid_scores) < 5:
            # Pad with average of existing scores
            avg_score = sum(valid_scores) / len(valid_scores)
            while len(valid_scores) < 5:
                valid_scores.append(avg_score)
        elif len(valid_scores) > 5:
            # Take most recent 5 scores
            valid_scores = valid_scores[:5]
        
        # Price change formula weights
        w1, w2, w3, w4, w5 = 0.083, 0.067, 0.050, 0.033, 0.017
        
        # Calculate weighted sum using valid scores
        weighted_sum = (w1 * valid_scores[0]) + (w2 * valid_scores[1]) + (w3 * valid_scores[2]) + (w4 * valid_scores[3]) + (w5 * valid_scores[4])
        
        # Get round-specific magic number
        magic_number = self.magic_numbers.get(round_num, 9736)  # Default to Round 23
        
        # Calculate new price
        new_price = (0.75 * old_price) + (magic_number * weighted_sum)
        
        return round(new_price, 0)  # Round to nearest dollar
    
    def calculate_price_per_point(self, price: float, average_points: float) -> float:
        """Calculate price per point ratio"""
        if average_points == 0:
            return 0.0
        return round(price / average_points, 2)
    
    def calculate_disposals(self, kicks: float, handballs: float) -> float:
        """Disposals = Kicks + Handballs (same as possessions)"""
        return kicks + handballs
    
    def calculate_last_n_average(self, game_logs: List[Dict], n: int = 3) -> float:
        """Calculate average of last N games from game logs"""
        if not game_logs:
            return 0.0
        
        # Sort by round descending to get most recent games first
        sorted_games = sorted(game_logs, key=lambda x: x.get('RD', 0), reverse=True)
        
        # Get last N games
        recent_games = sorted_games[:n]
        
        # Extract fantasy points
        scores = []
        for game in recent_games:
            fp = game.get('FP', 0)
            if fp is not None:
                scores.append(fp)
        
        return round(statistics.mean(scores), 1) if scores else 0.0
    
    def calculate_total_points(self, game_logs: List[Dict]) -> float:
        """Calculate total fantasy points from all games in the year"""
        total = 0.0
        for game in game_logs:
            fp = game.get('FP', 0)
            if fp is not None:
                total += fp
        return total
    
    def calculate_standard_deviation(self, game_logs: List[Dict]) -> float:
        """Calculate standard deviation of fantasy scores"""
        scores = []
        for game in game_logs:
            fp = game.get('FP', 0)
            if fp is not None:
                scores.append(fp)
        
        return round(statistics.stdev(scores), 2) if len(scores) > 1 else 0.0
    
    def calculate_games_vs_opponent(self, game_logs: List[Dict], opponent: str) -> int:
        """Calculate games played against specific opponent (GM vs OPP)"""
        count = 0
        for game in game_logs:
            if game.get('OPP', '').upper() == opponent.upper():
                count += 1
        return count
    
    def get_projected_score_from_algorithm(self, player_name: str, career_avg: Dict, recent_form: Dict) -> float:
        """
        Projected score algorithm (placeholder - replace with your actual algorithm)
        """
        # This is a simplified example - replace with your actual algorithm
        base_score = career_avg.get('REG', 0)  # Regular season average
        recent_form_factor = recent_form.get('l3_average', base_score)
        
        # Simple projection: weighted average of season avg and recent form
        projected = (0.7 * base_score) + (0.3 * recent_form_factor)
        
        return round(projected, 1)
    
    # ==========================================
    # DATA MAPPING FUNCTIONS
    # ==========================================
    
    def map_afl_to_server_format(self, afl_data: Dict, 
                                 fantasy_metrics: List[Dict], 
                                 value_index: List[Dict]) -> Dict:
        """
        Map AFL data structure to server format using all formulas
        
        Args:
            afl_data: Player data from AFL sources with Career Averages, Game Logs, etc.
            fantasy_metrics: Ownership and consistency data (list)
            value_index: Value rating data (list)
        
        Returns:
            Dictionary in server format
        """
        player_name = afl_data.get('name', '')
        name_lower = player_name.lower()
        
        # Extract data from different sheets
        career_avg = afl_data.get('Career Averages', [{}])[0] if afl_data.get('Career Averages') else {}
        game_logs = afl_data.get('Game Logs', [])
        
        # Get external data
        player_metrics = next((p for p in fantasy_metrics if p.get('name_lower') == name_lower), {})
        player_value = next((p for p in value_index if p.get('name_lower') == name_lower), {})
        
        # Calculate derived statistics using our formulas
        last_3_avg = self.calculate_last_n_average(game_logs, 3)
        last_5_avg = self.calculate_last_n_average(game_logs, 5)
        total_points = self.calculate_total_points(game_logs)
        std_dev = self.calculate_standard_deviation(game_logs)
        
        # Get price and calculate price change
        current_price = player_metrics.get('sal', 0)
        
        # Get last 5 scores for price change calculation
        recent_scores = []
        sorted_games = sorted(game_logs, key=lambda x: x.get('RD', 0), reverse=True)[:5]
        for game in sorted_games:
            recent_scores.append(float(game.get('FP', 0) or 0))
        
        # Pad if less than 5 games
        while len(recent_scores) < 5:
            recent_scores.append(0.0)
        
        new_price = self.calculate_price_change(current_price, recent_scores)
        price_change = new_price - current_price
        
        # Get break-even from historical data (latest available round)
        break_even = 0
        if self.historical_break_evens:
            latest_round = max([int(r) for r in self.historical_break_evens.keys()])
            round_data = self.historical_break_evens.get(str(latest_round), {})
            player_be_data = round_data.get(name_lower, {})
            break_even = player_be_data.get('break_even', 0)
        
        # Calculate basic stats
        kicks = career_avg.get('K', 0)
        handballs = career_avg.get('H', 0)
        disposals = self.calculate_disposals(kicks, handballs)
        
        # Map to server format
        server_data = {
            # Basic info
            "id": afl_data.get('id', ''),
            "name": player_name,
            "team": career_avg.get('TM', ''),
            "position": career_avg.get('position', ''),
            
            # Financial data (using our formulas)
            "price": current_price,
            "price_change": price_change,
            "break_even": break_even,
            "price_per_point": self.calculate_price_per_point(current_price, career_avg.get('REG', 0)),
            
            # Performance data
            "average_points": career_avg.get('REG', 0),  # Use REG instead of FP as per user instruction
            "last_score": game_logs[0].get('FP', 0) if game_logs else 0,
            "last_3_average": last_3_avg,
            "last_5_average": last_5_avg,
            "total_points": total_points,
            "projected_score": self.get_projected_score_from_algorithm(player_name, career_avg, {"l3_average": last_3_avg}),
            
            # Advanced stats
            "standard_deviation": std_dev,
            "consistency": player_metrics.get('con'),  # From fantasy_metrics
            "ownership_percentage": (player_metrics.get('own', 0) * 100) if player_metrics.get('own') else 0,  # Convert to percentage
            "value_rating": player_value.get('value_index', 0),
            
            # Basic AFL stats
            "kicks": kicks,
            "handballs": handballs,
            "disposals": disposals,  # K + H (same as possessions)
            "marks": career_avg.get('M', 0),
            "tackles": career_avg.get('T', 0),
            "hitouts": career_avg.get('HO', 0),
            "goals": career_avg.get('G', 0),
            "behinds": career_avg.get('B', 0),
            
            # Advanced AFL stats  
            "free_kicks_for": career_avg.get('FF', 0),
            "free_kicks_against": career_avg.get('FA', 0),
            "kick_ins": career_avg.get('KI', 0),
            "contested_marks": career_avg.get('CM', 0),
            "contested_disposals": career_avg.get('CP', 0),
            "uncontested_disposals": career_avg.get('UP', 0),
            "disposal_efficiency": career_avg.get('DE%', 0),
            "cba_percentage": career_avg.get('CB%', 0),
            "points_per_minute": career_avg.get('PPM', 0),
            "rebound_50s": career_avg.get('R50', 0),
            "inside_50s": career_avg.get('I50', 0),
            "intercepts": career_avg.get('INT', 0),
            "metres_gained": career_avg.get('MG', 0),
            
            # Games data
            "games_played": career_avg.get('GM', 0),
            "rounds_played": career_avg.get('GM', 0),  # Same as games_played for AFL
            
            # Status flags
            "is_injured": False,  # Would need injury data source
            "is_suspended": False,  # Would need suspension data source
        }
        
        return server_data

def main():
    """Main execution function"""
    processor = AFLCompleteProcessor()
    
    print("AFL Fantasy Complete Data Processor")
    print("=" * 70)
    print("🔧 ALL FORMULAS CONSOLIDATED IN ONE SCRIPT")
    print("=" * 70)
    
    # 1. Discover available rounds first
    print("1. Discovering available rounds...")
    available_rounds = processor.discover_available_rounds()
    print(f"   Available rounds: {available_rounds}")
    
    # 2. Scrape all available rounds
    print(f"\n2. Scraping break-even data for {len(available_rounds)} available rounds...")
    all_round_data = processor.scrape_all_available_rounds()
    
    # 3. Demonstrate all formulas
    print("\n3. Formula demonstrations:")
    print("   📊 Price Change Formula:")
    old_price = 800000
    scores = [85.0, 92.0, 78.0, 88.0, 95.0]
    new_price = processor.calculate_price_change(old_price, scores)
    print(f"      Old price: ${old_price:,}")
    print(f"      Last 5 scores: {scores}")
    print(f"      New price: ${new_price:,}")
    print(f"      Price change: ${new_price - old_price:+,}")
    
    print(f"\n   💰 Price Per Point: ${processor.calculate_price_per_point(800000, 95.5)}/point")
    print(f"   🏃 Disposals: {processor.calculate_disposals(12.5, 8.3)} (kicks + handballs)")
    
    # 4. Summary
    print(f"\n4. Summary:")
    print(f"   ✅ Scraped {len(all_round_data)} rounds")
    print(f"   ✅ All formulas consolidated:")
    print(f"      • Price change (weighted 5-round)")
    print(f"      • Price per point")
    print(f"      • Statistical calculations")
    print(f"      • Data mapping AFL → Server format")
    
    print(f"\n📁 Historical data saved to: {processor.data_dir}")
    return processor, all_round_data

if __name__ == "__main__":
    main()