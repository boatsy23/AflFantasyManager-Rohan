#!/usr/bin/env python3
"""
Scrape all 535 AFL players from DFS Australia using the player IDs from Excel
"""
import json
import time
import requests
from datetime import datetime
import pandas as pd

class DFSCompleteScraper:
    def __init__(self):
        self.base_url = "https://dfsaustralia.com"
        self.ajax_endpoint = "/wp-admin/admin-ajax.php"
        self.headers = {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
    def fetch_player_data(self, player_id, player_name="Unknown"):
        """Fetch comprehensive data for a single player"""
        data = {
            'action': 'afl_fantasy_player_summary_call_mysql',
            'playerId': player_id
        }
        
        try:
            response = self.session.post(
                self.base_url + self.ajax_endpoint,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                json_data = response.json()
                
                # Check if we got actual data
                if json_data.get('combinedGames') and len(json_data['combinedGames']) > 0:
                    return self.process_player_data(json_data, player_id, player_name)
                    
        except Exception as e:
            print(f"    Error: {e}")
            
        return None
    
    def process_player_data(self, raw_data, player_id, player_name_fallback):
        """Process raw data into structured format"""
        player_data = {
            'player_id': player_id,
            'player_name': player_name_fallback,
            'team': None,
            'position': None,
            'price': None,
            'avg_2025': 0,
            'total_2025': 0,
            'games_2025': 0,
            'last_3_avg': 0,
            'last_5_avg': 0,
            'season_high': 0,
            'season_low': 999,
            'consistency': 0,
            'opponent_next': None,
            'venue_next': None,
            'form': 'stable',
            'injury_status': 'available',
            'breakeven': 0,
            'ownership': 0,
            'recent_scores': [],
            'scraped_at': datetime.now().isoformat()
        }
        
        # Extract player info
        if raw_data.get('name') and len(raw_data['name']) > 0:
            info = raw_data['name'][0]
            player_data['player_name'] = info.get('playerName', player_name_fallback)
            player_data['team'] = info.get('teamAbbr', 'UNK')
            player_data['position'] = self.determine_position(info, raw_data)
        
        # Process 2025 games
        if raw_data.get('combinedGames'):
            games = raw_data['combinedGames']
            season_2025 = [g for g in games if g.get('year') == '2025']
            
            if season_2025:
                # Sort by date (most recent first)
                season_2025.sort(key=lambda x: x.get('date', '0'), reverse=True)
                
                # Get fantasy scores
                scores = []
                for g in season_2025:
                    if g.get('FP'):
                        try:
                            score = float(g.get('FP', 0))
                            scores.append(score)
                        except:
                            pass
                
                if scores:
                    player_data['games_2025'] = len(scores)
                    player_data['total_2025'] = sum(scores)
                    player_data['avg_2025'] = round(sum(scores) / len(scores), 1)
                    player_data['season_high'] = max(scores)
                    player_data['season_low'] = min(scores)
                    player_data['recent_scores'] = scores[:5]
                    
                    # Calculate averages
                    if len(scores) >= 3:
                        player_data['last_3_avg'] = round(sum(scores[:3]) / 3, 1)
                    if len(scores) >= 5:
                        player_data['last_5_avg'] = round(sum(scores[:5]) / 5, 1)
                    
                    # Calculate consistency (lower is better)
                    if len(scores) >= 5:
                        avg = player_data['avg_2025']
                        variance = sum((x - avg) ** 2 for x in scores[:5]) / 5
                        player_data['consistency'] = round(variance ** 0.5, 1)
                    
                    # Determine form
                    if len(scores) >= 3:
                        recent_avg = sum(scores[:3]) / 3
                        if recent_avg > player_data['avg_2025'] * 1.1:
                            player_data['form'] = 'hot'
                        elif recent_avg < player_data['avg_2025'] * 0.9:
                            player_data['form'] = 'cold'
                
                # Get next game details
                if season_2025:
                    # The most recent game might have opponent info for next round
                    last_game = season_2025[0]
                    player_data['opponent_next'] = last_game.get('opponentAbbr')
                    player_data['venue_next'] = last_game.get('venueAbbr')
        
        # Process opponent stats
        if raw_data.get('opponents'):
            player_data['opponent_stats'] = raw_data['opponents']
        
        return player_data
    
    def determine_position(self, info, raw_data):
        """Determine player position from various data sources"""
        # Check direct position field
        if info.get('position'):
            return info.get('position')
        
        # Check starting position from games
        if raw_data.get('combinedGames'):
            for game in raw_data['combinedGames'][:5]:
                if game.get('startingPosition'):
                    pos = game.get('startingPosition')
                    if 'MID' in pos or 'CEN' in pos:
                        return 'MID'
                    elif 'FWD' in pos or 'FF' in pos:
                        return 'FWD'
                    elif 'DEF' in pos or 'BP' in pos or 'FB' in pos:
                        return 'DEF'
                    elif 'RUC' in pos:
                        return 'RUC'
        
        return 'MID'  # Default
    
    def scrape_all_players(self):
        """Scrape all 535 players from the Excel file"""
        # Load player IDs from JSON
        with open('dfs_player_ids_from_excel.json', 'r') as f:
            player_list = json.load(f)
        
        all_player_data = []
        failed_players = []
        
        print(f"Starting scrape of {len(player_list)} players...")
        print("This will take approximately 5-10 minutes...")
        print("="*60)
        
        for i, player in enumerate(player_list, 1):
            player_id = player['id']
            player_name = player['name']
            
            print(f"[{i}/{len(player_list)}] {player_name} ({player_id})...", end="")
            
            player_data = self.fetch_player_data(player_id, player_name)
            
            if player_data:
                all_player_data.append(player_data)
                print(f" ✓ {player_data['avg_2025']} avg")
            else:
                failed_players.append(player)
                print(" ✗ Failed")
            
            # Rate limiting - be respectful to the server
            if i % 10 == 0:
                time.sleep(1)  # Longer pause every 10 players
            else:
                time.sleep(0.3)  # Short pause between players
        
        print("="*60)
        print(f"Scraping complete!")
        print(f"  Successful: {len(all_player_data)} players")
        print(f"  Failed: {len(failed_players)} players")
        
        # Save comprehensive JSON
        output_file = 'master_player_stats_dfs.json'
        with open(output_file, 'w') as f:
            json.dump(all_player_data, f, indent=2)
        print(f"  Data saved to: {output_file}")
        
        # Create Excel summary
        self.create_excel_summary(all_player_data)
        
        # Save to attached_assets for frontend
        self.save_to_attached_assets(all_player_data)
        
        return all_player_data
    
    def create_excel_summary(self, player_data):
        """Create Excel file with player statistics"""
        df = pd.DataFrame(player_data)
        
        # Reorder columns
        columns = ['player_name', 'team', 'position', 'avg_2025', 'games_2025', 
                   'last_3_avg', 'last_5_avg', 'season_high', 'season_low',
                   'consistency', 'form', 'opponent_next', 'venue_next']
        
        df = df[columns]
        df = df.sort_values(by='avg_2025', ascending=False)
        
        output_file = 'dfs_player_stats_summary.xlsx'
        df.to_excel(output_file, index=False)
        print(f"  Excel summary saved to: {output_file}")
    
    def save_to_attached_assets(self, player_data):
        """Save to attached_assets for frontend access"""
        import os
        
        # Create directory if it doesn't exist
        os.makedirs('attached_assets', exist_ok=True)
        
        # Save player stats
        with open('attached_assets/dfs_player_stats.json', 'w') as f:
            json.dump(player_data, f, indent=2)
        print(f"  Frontend data saved to: attached_assets/dfs_player_stats.json")


def main():
    scraper = DFSCompleteScraper()
    player_data = scraper.scrape_all_players()
    
    # Show top 10 players by average
    print("\nTop 10 Players by 2025 Average:")
    sorted_players = sorted(player_data, key=lambda x: x.get('avg_2025', 0), reverse=True)
    for i, p in enumerate(sorted_players[:10], 1):
        print(f"{i:2}. {p['player_name']:20} ({p['team']}) - {p['avg_2025']:.1f} avg from {p['games_2025']} games")


if __name__ == "__main__":
    main()