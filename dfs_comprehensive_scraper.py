#!/usr/bin/env python3
"""
Comprehensive DFS Australia Player Stats Scraper
Scrapes all player statistics from DFS Australia and saves to individual Excel files
"""

import pandas as pd
import requests
import json
import time
import os
from datetime import datetime
from pathlib import Path
import xlsxwriter
from tqdm import tqdm
import re

class DFSPlayerScraper:
    def __init__(self, excel_file_path):
        """Initialize the scraper with player data from Excel"""
        self.excel_file = excel_file_path
        self.base_url = "https://dfsaustralia.com/wp-admin/admin-ajax.php"
        self.output_dir = Path("player_stats_output")
        self.output_dir.mkdir(exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://dfsaustralia.com',
            'Referer': 'https://dfsaustralia.com/afl-fantasy-player-summary/'
        })
        
    def load_players(self):
        """Load player data from Excel file"""
        try:
            df = pd.read_excel(self.excel_file, engine='openpyxl')
            print(f"Loaded {len(df)} players from Excel file")
            return df
        except Exception as e:
            print(f"Error loading Excel file: {e}")
            return None
    
    def extract_player_id(self, row):
        """Extract player ID from row data"""
        # First check if player_id column exists
        if 'player_id' in row and row['player_id']:
            return str(row['player_id'])
        # Otherwise try to extract from URL
        if 'full_url' in row and row['full_url']:
            match = re.search(r'playerId=([^&]+)', row['full_url'])
            if match:
                return match.group(1)
        # Generate a fallback ID
        return f"unknown_{row.get('player_name', 'player').replace(' ', '_')}"
    
    def fetch_player_data(self, player_id, player_name):
        """Fetch all data for a single player"""
        try:
            # Main player summary data
            params = {
                'action': 'afl_fantasy_player_summary_call_mysql'
            }
            data = {
                'playerId': player_id
            }
            
            response = self.session.post(self.base_url, params=params, data=data)
            response.raise_for_status()
            
            player_data = response.json()
            
            # Structure the data
            structured_data = {
                'player_info': None,
                'game_logs': [],
                'career_averages': [],
                'opponent_splits': [],
                'venue_splits': [],
                'season_averages': [],
                'quarterly_stats': []
            }
            
            # Player basic info
            if 'name' in player_data and player_data['name']:
                structured_data['player_info'] = player_data['name'][0] if isinstance(player_data['name'], list) else player_data['name']
            
            # Game logs
            if 'combinedGames' in player_data:
                structured_data['game_logs'] = player_data['combinedGames']
            
            # Career averages
            if 'career' in player_data:
                structured_data['career_averages'] = player_data['career']
            
            # Opponent splits
            if 'opponents' in player_data:
                structured_data['opponent_splits'] = player_data['opponents']
            
            # Venue splits
            if 'venues' in player_data:
                structured_data['venue_splits'] = player_data['venues']
            
            # Process season averages from career data
            if structured_data['career_averages']:
                structured_data['season_averages'] = self.process_season_averages(structured_data['career_averages'])
            
            # Process quarterly stats from game logs
            if structured_data['game_logs']:
                structured_data['quarterly_stats'] = self.process_quarterly_stats(structured_data['game_logs'])
            
            return structured_data
            
        except Exception as e:
            print(f"Error fetching data for {player_name}: {e}")
            return None
    
    def process_season_averages(self, career_data):
        """Process career data to extract season averages"""
        season_avgs = []
        for item in career_data:
            if isinstance(item, dict):
                season_avgs.append({
                    'Year': item.get('year', ''),
                    'League': item.get('league', ''),
                    'Team': item.get('teamName', ''),
                    'Games': item.get('gms', 0),
                    'FP Avg': item.get('FP', 0),
                    'FP Adj': item.get('FPadj', 0),
                    'FP Reg': item.get('FPreg', 0),
                    'FP Final': item.get('FPfin', 0),
                    'SC Avg': item.get('SC', 0),
                    'SC Adj': item.get('SCadj', 0),
                    'SC Reg': item.get('SCreg', 0),
                    'SC Final': item.get('SCfin', 0),
                    'Disposals': item.get('disposals', 0),
                    'Marks': item.get('marks', 0),
                    'Tackles': item.get('tackles', 0),
                    'Goals': item.get('goals', 0),
                    'Behinds': item.get('behinds', 0),
                    'TOG%': item.get('timeOnGroundPercentage', 0)
                })
        return season_avgs
    
    def process_quarterly_stats(self, game_logs):
        """Extract quarterly statistics from game logs"""
        quarterly_data = []
        for game in game_logs:
            if isinstance(game, dict):
                # Only process games with quarterly data (from 2020 onwards)
                try:
                    year = int(game.get('year', 0))
                except (ValueError, TypeError):
                    year = 0
                if year >= 2020 and game.get('league', '') == 'AFL':
                    quarterly_data.append({
                        'Date': game.get('date', ''),
                        'Round': game.get('round', ''),
                        'Year': game.get('year', ''),
                        'Opponent': game.get('opponentName', ''),
                        'Venue': game.get('venueName', ''),
                        'Q1': game.get('dt_1', 0),
                        'Q2': game.get('dt_2', 0),
                        'Q3': game.get('dt_3', 0),
                        'Q4': game.get('dt_4', 0),
                        'Total FP': game.get('FP', 0),
                        'Total SC': game.get('SC', 0),
                        'PPM': game.get('pointsPerMinute', 0)
                    })
        return quarterly_data
    
    def save_to_excel(self, player_data, player_name):
        """Save player data to an Excel file with multiple sheets"""
        # Clean player name for filename
        clean_name = re.sub(r'[^\w\s-]', '', player_name).strip()
        clean_name = re.sub(r'[-\s]+', '.', clean_name)
        
        filepath = self.output_dir / f"{clean_name}.xlsx"
        
        try:
            with pd.ExcelWriter(filepath, engine='xlsxwriter') as writer:
                workbook = writer.book
                
                # Define formats
                header_format = workbook.add_format({
                    'bold': True,
                    'bg_color': '#D7393E',
                    'font_color': 'white',
                    'align': 'center',
                    'valign': 'vcenter',
                    'border': 1
                })
                
                # 1. Player Info Sheet
                if player_data['player_info']:
                    info_dict = player_data['player_info']
                    info_df = pd.DataFrame([{
                        'Player Name': info_dict.get('playerName', player_name),
                        'Team': info_dict.get('teamName', ''),
                        'Position': info_dict.get('position', ''),
                        'Date of Birth': info_dict.get('dob', ''),
                        'Height': info_dict.get('height', ''),
                        'Weight': info_dict.get('weight', ''),
                        'Player ID': info_dict.get('playerId', '')
                    }])
                    info_df.to_excel(writer, sheet_name='Player Info', index=False)
                    self.format_sheet(writer, 'Player Info', header_format)
                
                # 2. Game Logs Sheet (save ALL columns, don't filter)
                if player_data['game_logs']:
                    games_df = pd.DataFrame(player_data['game_logs'])
                    
                    # Add teamName from career data or player info if available
                    if 'teamName' not in games_df.columns:
                        team = None
                        if player_data['career_averages'] and len(player_data['career_averages']) > 0:
                            # Get most recent team from career data
                            for career_entry in player_data['career_averages']:
                                if career_entry.get('league') == 'AFL':
                                    team = career_entry.get('teamName')
                                    break
                        if team:
                            games_df.insert(4, 'teamName', team)
                    
                    # Save ALL available columns
                    games_df.to_excel(writer, sheet_name='Game Logs', index=False)
                    self.format_sheet(writer, 'Game Logs', header_format)
                
                # 3. Season Averages Sheet
                if player_data['season_averages']:
                    season_df = pd.DataFrame(player_data['season_averages'])
                    season_df.to_excel(writer, sheet_name='Season Averages', index=False)
                    self.format_sheet(writer, 'Season Averages', header_format)
                
                # 4. Career Averages Sheet
                if player_data['career_averages']:
                    career_df = pd.DataFrame(player_data['career_averages'])
                    career_cols = ['year', 'league', 'teamName', 'gms', 'FP', 'FPadj', 'FPreg', 'FPfin',
                                  'SC', 'SCadj', 'SCreg', 'SCfin', 'disposals', 'marks', 'tackles',
                                  'goals', 'behinds', 'timeOnGroundPercentage']
                    available_cols = [col for col in career_cols if col in career_df.columns]
                    career_df = career_df[available_cols] if available_cols else career_df
                    career_df.to_excel(writer, sheet_name='Career Averages', index=False)
                    self.format_sheet(writer, 'Career Averages', header_format)
                
                # 5. Opponent Splits Sheet
                if player_data['opponent_splits']:
                    opp_df = pd.DataFrame(player_data['opponent_splits'])
                    opp_cols = ['opponentName', 'opponentAbbr', 'gms', 'FP', 'SC', 'maxFP', 'maxSC',
                               'pointsPerMinute', 'gm100', 'gm120', 'gm50', 'gm60']
                    available_cols = [col for col in opp_cols if col in opp_df.columns]
                    opp_df = opp_df[available_cols] if available_cols else opp_df
                    opp_df.to_excel(writer, sheet_name='Opponent Splits', index=False)
                    self.format_sheet(writer, 'Opponent Splits', header_format)
                
                # 6. Venue Splits Sheet
                if player_data['venue_splits']:
                    venue_df = pd.DataFrame(player_data['venue_splits'])
                    venue_cols = ['venueName', 'venueId', 'gms', 'FP', 'SC', 'maxFP', 'maxSC',
                                 'pointsPerMinute', 'gm100', 'gm120', 'gm50', 'gm60']
                    available_cols = [col for col in venue_cols if col in venue_df.columns]
                    venue_df = venue_df[available_cols] if available_cols else venue_df
                    venue_df.to_excel(writer, sheet_name='Venue Splits', index=False)
                    self.format_sheet(writer, 'Venue Splits', header_format)
                
                # 7. Quarterly Stats Sheet (if available)
                if player_data['quarterly_stats']:
                    quarterly_df = pd.DataFrame(player_data['quarterly_stats'])
                    quarterly_df.to_excel(writer, sheet_name='Quarterly Stats', index=False)
                    self.format_sheet(writer, 'Quarterly Stats', header_format)
            
            print(f"✓ Saved: {filepath}")
            return True
            
        except Exception as e:
            print(f"✗ Error saving Excel for {player_name}: {e}")
            return False
    
    def format_sheet(self, writer, sheet_name, header_format):
        """Apply formatting to Excel sheet"""
        try:
            worksheet = writer.sheets[sheet_name]
            # Auto-fit columns (approximate)
            for i, col in enumerate(pd.read_excel(writer, sheet_name).columns):
                column_len = max(len(str(col)), 10)
                worksheet.set_column(i, i, column_len + 2)
        except:
            pass
    
    def run(self, test_mode=False):
        """Main execution function"""
        print("=" * 60)
        print("DFS Australia Player Stats Scraper")
        print("=" * 60)
        
        # Load players
        players_df = self.load_players()
        if players_df is None:
            return
        
        # Test mode - process only first 3 players
        if test_mode:
            print("\n[TEST MODE] Processing first 3 players only")
            players_df = players_df.head(3)
        
        # Process statistics
        successful = 0
        failed = 0
        failed_players = []
        
        print(f"\nProcessing {len(players_df)} players...")
        print("-" * 60)
        
        for idx, row in tqdm(players_df.iterrows(), total=len(players_df), desc="Progress"):
            # Handle different possible column names
            player_name = row.get('player_name') or row.get('Player', 'Unknown')
            player_url = row.get('player_url') or row.get('PlayerURL', '')
            player_id_from_excel = row.get('player_id') or row.get('playerId', None)
            
            # Extract player ID from URL or use from Excel
            player_id = self.extract_player_id(row)
            if not player_id and player_id_from_excel:
                player_id = player_id_from_excel
            
            if not player_id:
                print(f"✗ Skipping {player_name}: No valid player ID")
                failed += 1
                failed_players.append(player_name)
                continue
            
            # Fetch player data
            player_data = self.fetch_player_data(player_id, player_name)
            
            if player_data:
                # Save to Excel
                if self.save_to_excel(player_data, player_name):
                    successful += 1
                else:
                    failed += 1
                    failed_players.append(player_name)
            else:
                failed += 1
                failed_players.append(player_name)
            
            # Rate limiting to be respectful to the server
            time.sleep(1)
        
        # Summary
        print("\n" + "=" * 60)
        print("SCRAPING COMPLETE")
        print("=" * 60)
        print(f"✓ Successful: {successful} players")
        print(f"✗ Failed: {failed} players")
        
        if failed_players:
            print("\nFailed players:")
            for player in failed_players:
                print(f"  - {player}")
        
        print(f"\nOutput directory: {self.output_dir.absolute()}")
        print("=" * 60)

def main():
    """Main entry point"""
    excel_file = 'dfs_player_list.xlsx'  # Use our generated player list
    
    # Check if file exists
    if not os.path.exists(excel_file):
        print(f"Error: Excel file not found at {excel_file}")
        print("Please run: python3 generate_player_list_from_mapping.py")
        return
    
    # Create scraper instance
    scraper = DFSPlayerScraper(excel_file)
    
    # Run in test mode first for testing
    import sys
    test_mode = '--test' in sys.argv or '--test-mode' in sys.argv
    if not test_mode and len(sys.argv) == 1:
        print("\nWould you like to run in test mode (first 3 players only)? (yes/no)")
        print("Enter 'yes' for test mode or 'no' for full scraping:")
        test_mode = input().strip().lower() == 'yes'
    
    # Execute scraper
    scraper.run(test_mode=test_mode)

if __name__ == "__main__":
    main()