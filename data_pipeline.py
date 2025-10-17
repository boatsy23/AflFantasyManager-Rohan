#!/usr/bin/env python3
"""
AFL Fantasy Data Pipeline
Orchestrates the complete data flow:
1. Scrape raw data from DFS Australia
2. Process into master_player_stats.json (current round)
3. Insert historical round data into PostgreSQL
4. Move processed files to attached_assets
"""

import os
import json
import shutil
import psycopg2
from pathlib import Path
from datetime import datetime
from dfs_comprehensive_scraper import DFSPlayerScraper
import pandas as pd

class AFLFantasyDataPipeline:
    def __init__(self):
        self.raw_data_dir = Path("raw_data")
        self.processed_dir = Path("processed_data")
        self.assets_dir = Path("attached_assets")
        
        # Create directories
        self.raw_data_dir.mkdir(exist_ok=True)
        self.processed_dir.mkdir(exist_ok=True)
        self.assets_dir.mkdir(exist_ok=True)
        
        # Database connection from environment
        self.db_url = os.getenv('DATABASE_URL')
        
        # Load player team mapping
        self.team_mapping = {}
        try:
            with open('player_team_mapping.json', 'r') as f:
                self.team_mapping = json.load(f)
            print(f"Loaded team mapping for {len(self.team_mapping)} players")
        except Exception as e:
            print(f"Warning: Could not load team mapping: {e}")
        
    def step1_scrape_raw_data(self, test_mode=False):
        """Step 1: Scrape raw player data from DFS Australia"""
        print("\n" + "="*60)
        print("STEP 1: SCRAPING RAW DATA FROM DFS AUSTRALIA")
        print("="*60)
        
        excel_file = 'assets/production/AFL_Fantasy_Player_URLs_1759209285946.xlsx'
        
        if not os.path.exists(excel_file):
            print(f"Error: Excel file not found at {excel_file}")
            return False
        
        # Create scraper with output to raw_data directory
        scraper = DFSPlayerScraper(excel_file)
        scraper.output_dir = self.raw_data_dir / "player_excel_files"
        scraper.output_dir.mkdir(exist_ok=True)
        
        # Run scraper
        scraper.run(test_mode=test_mode)
        
        print(f"✓ Raw data saved to: {scraper.output_dir}")
        return True
    
    def step2_process_to_master_json(self):
        """Step 2: Process raw data into master_player_stats.json"""
        print("\n" + "="*60)
        print("STEP 2: PROCESSING TO MASTER_PLAYER_STATS.JSON")
        print("="*60)
        
        # Load all Excel files from raw data
        excel_dir = self.raw_data_dir / "player_excel_files"
        
        if not excel_dir.exists() or not list(excel_dir.glob("*.xlsx")):
            print("No raw Excel files found. Run step 1 first.")
            return False
        
        master_stats = []
        player_id_counter = 1
        
        for excel_file in excel_dir.glob("*.xlsx"):
            try:
                # Read player info and game logs
                player_info = pd.read_excel(excel_file, sheet_name='Player Info')
                game_logs = pd.read_excel(excel_file, sheet_name='Game Logs')
                
                # Get latest AFL game (Round 24 2025)
                afl_games = game_logs[game_logs['league'] == 'AFL']
                if len(afl_games) == 0:
                    continue
                
                latest_game = afl_games.iloc[0]  # Most recent game
                
                # Calculate averages
                recent_scores = afl_games['FP'].head(5).tolist()
                avg_points = afl_games['FP'].mean()
                l3_avg = afl_games['FP'].head(3).mean() if len(afl_games) >= 3 else avg_points
                l5_avg = afl_games['FP'].head(5).mean() if len(afl_games) >= 5 else avg_points
                
                # Extract team and position from latest game (more reliable than Player Info)
                team = latest_game.get('teamName', '') if pd.notna(latest_game.get('teamName')) else ''
                
                # If team is still empty, use player_team_mapping.json
                player_name = player_info['Player Name'].iloc[0] if pd.notna(player_info['Player Name'].iloc[0]) else ''
                if not team and player_name in self.team_mapping:
                    team = self.team_mapping[player_name]
                
                # Determine position from stats (simple heuristic)
                position = 'MID'  # Default
                if latest_game.get('hitouts', 0) > 10:
                    position = 'RUC'
                
                # Build player stats object
                player_stat = {
                    "id": player_id_counter,
                    "name": player_info['Player Name'].iloc[0] if pd.notna(player_info['Player Name'].iloc[0]) else '',
                    "position": position,
                    "team": team,
                    "price": 500000,  # Default, should be updated from FootyWire
                    "averagePoints": round(avg_points, 1),
                    "lastScore": int(latest_game['FP']) if pd.notna(latest_game['FP']) else 0,
                    "projectedScore": int(avg_points),
                    "breakEven": 0,  # Should be updated from FootyWire
                    "l3Average": round(l3_avg, 1),
                    "priceChange": 0,
                    "selectionPercentage": 0,
                    "roundsPlayed": len(afl_games),
                    "kicks": int(latest_game.get('kicks', 0)) if pd.notna(latest_game.get('kicks', 0)) else 0,
                    "handballs": int(latest_game.get('handballs', 0)) if pd.notna(latest_game.get('handballs', 0)) else 0,
                    "disposals": int(latest_game.get('disposals', 0)) if pd.notna(latest_game.get('disposals', 0)) else 0,
                    "marks": int(latest_game.get('marks', 0)) if pd.notna(latest_game.get('marks', 0)) else 0,
                    "tackles": int(latest_game.get('tackles', 0)) if pd.notna(latest_game.get('tackles', 0)) else 0,
                }
                
                master_stats.append(player_stat)
                player_id_counter += 1
                
            except Exception as e:
                print(f"Error processing {excel_file.name}: {e}")
                continue
        
        # Save to master_player_stats.json
        output_file = self.processed_dir / "master_player_stats.json"
        with open(output_file, 'w') as f:
            json.dump(master_stats, f, indent=2)
        
        print(f"✓ Processed {len(master_stats)} players")
        print(f"✓ Saved to: {output_file}")
        return True
    
    def step3_insert_to_postgresql(self):
        """Step 3: Insert historical round data into PostgreSQL"""
        print("\n" + "="*60)
        print("STEP 3: INSERTING HISTORICAL DATA TO POSTGRESQL")
        print("="*60)
        
        if not self.db_url:
            print("Error: DATABASE_URL not set")
            return False
        
        # Load all Excel files
        excel_dir = self.raw_data_dir / "player_excel_files"
        
        if not excel_dir.exists():
            print("No raw Excel files found.")
            return False
        
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            inserted_count = 0
            
            for excel_file in excel_dir.glob("*.xlsx"):
                try:
                    player_info = pd.read_excel(excel_file, sheet_name='Player Info')
                    game_logs = pd.read_excel(excel_file, sheet_name='Game Logs')
                    
                    player_name = player_info['Player Name'].iloc[0]
                    team = player_info['Team'].iloc[0]
                    position = player_info['Position'].iloc[0]
                    
                    # Filter for 2025 AFL games only
                    afl_2025 = game_logs[
                        (game_logs['league'] == 'AFL') & 
                        (game_logs['year'] == 2025)
                    ]
                    
                    for _, game in afl_2025.iterrows():
                        # Extract round number
                        round_num = self.extract_round_number(game.get('round', ''))
                        if not round_num:
                            continue
                        
                        # Insert into player_round_stats
                        cursor.execute("""
                            INSERT INTO player_round_stats (
                                player_id, player_name, round, team, position,
                                fantasy_points, kicks, handballs, disposals,
                                marks, tackles, hitouts, clearances,
                                contested_possessions, uncontested_possessions,
                                goals, behinds, time_on_ground,
                                opponent, venue
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                            )
                            ON CONFLICT DO NOTHING
                        """, (
                            0,  # player_id (will be updated later with proper mapping)
                            player_name,
                            round_num,
                            team,
                            position,
                            int(game.get('FP', 0)) if pd.notna(game.get('FP')) else None,
                            int(game.get('kicks', 0)) if pd.notna(game.get('kicks')) else None,
                            int(game.get('handballs', 0)) if pd.notna(game.get('handballs')) else None,
                            int(game.get('disposals', 0)) if pd.notna(game.get('disposals')) else None,
                            int(game.get('marks', 0)) if pd.notna(game.get('marks')) else None,
                            int(game.get('tackles', 0)) if pd.notna(game.get('tackles')) else None,
                            int(game.get('hitouts', 0)) if pd.notna(game.get('hitouts', 0)) else None,
                            int(game.get('clearances', 0)) if pd.notna(game.get('clearances', 0)) else None,
                            int(game.get('contestedPossessions', 0)) if pd.notna(game.get('contestedPossessions')) else None,
                            int(game.get('uncontestedPossessions', 0)) if pd.notna(game.get('uncontestedPossessions')) else None,
                            int(game.get('goals', 0)) if pd.notna(game.get('goals')) else None,
                            int(game.get('behinds', 0)) if pd.notna(game.get('behinds')) else None,
                            int(game.get('timeOnGroundPercentage', 0)) if pd.notna(game.get('timeOnGroundPercentage')) else None,
                            game.get('opponentName', ''),
                            game.get('venueName', '')
                        ))
                        
                        inserted_count += 1
                
                except Exception as e:
                    print(f"Error processing {excel_file.name} for DB: {e}")
                    continue
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"✓ Inserted {inserted_count} round records to PostgreSQL")
            return True
            
        except Exception as e:
            print(f"Database error: {e}")
            return False
    
    def step4_move_to_assets(self):
        """Step 4: Move processed files to attached_assets"""
        print("\n" + "="*60)
        print("STEP 4: MOVING PROCESSED FILES TO ATTACHED_ASSETS")
        print("="*60)
        
        # Copy master_player_stats.json to root and attached_assets
        source = self.processed_dir / "master_player_stats.json"
        
        if source.exists():
            # Copy to root (for API to use)
            root_dest = Path("master_player_stats.json")
            shutil.copy2(source, root_dest)
            print(f"✓ Copied to: {root_dest}")
            
            # Copy to attached_assets (for backup/reference)
            assets_dest = self.assets_dir / "master_player_stats.json"
            shutil.copy2(source, assets_dest)
            print(f"✓ Copied to: {assets_dest}")
            
            # Create timestamped backup
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dest = self.assets_dir / f"master_player_stats_{timestamp}.json"
            shutil.copy2(source, backup_dest)
            print(f"✓ Backup created: {backup_dest}")
        
        return True
    
    def extract_round_number(self, round_str):
        """Extract numeric round number from string like 'R1', 'R24', etc."""
        if not round_str:
            return None
        
        round_str = str(round_str).strip().upper()
        if round_str.startswith('R'):
            try:
                return int(round_str[1:])
            except:
                pass
        return None
    
    def run_full_pipeline(self, test_mode=False):
        """Run complete data pipeline"""
        print("\n" + "="*70)
        print(" AFL FANTASY DATA PIPELINE ")
        print("="*70)
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70)
        
        # Step 1: Scrape raw data
        if not self.step1_scrape_raw_data(test_mode=test_mode):
            print("\n✗ Pipeline failed at Step 1")
            return False
        
        # Step 2: Process to master JSON
        if not self.step2_process_to_master_json():
            print("\n✗ Pipeline failed at Step 2")
            return False
        
        # Step 3: Insert to PostgreSQL
        if not self.step3_insert_to_postgresql():
            print("\n✗ Pipeline failed at Step 3")
            return False
        
        # Step 4: Move to assets
        if not self.step4_move_to_assets():
            print("\n✗ Pipeline failed at Step 4")
            return False
        
        print("\n" + "="*70)
        print(" PIPELINE COMPLETE ")
        print("="*70)
        print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("\nData Flow Summary:")
        print("  1. ✓ Raw data → raw_data/player_excel_files/")
        print("  2. ✓ Processed → processed_data/master_player_stats.json")
        print("  3. ✓ Historical rounds → PostgreSQL (player_round_stats table)")
        print("  4. ✓ Final files → attached_assets/ and root directory")
        print("="*70)
        
        return True

def main():
    """Main entry point"""
    pipeline = AFLFantasyDataPipeline()
    
    print("\nAFL Fantasy Data Pipeline")
    print("-------------------------")
    print("This will:")
    print("  1. Scrape DFS Australia for player data")
    print("  2. Process into master_player_stats.json")
    print("  3. Insert historical round data to PostgreSQL")
    print("  4. Move files to attached_assets/")
    print()
    print("Run in test mode (3 players) or full mode?")
    print("Enter 'test' for test mode, 'full' for full scraping:")
    
    mode = input().strip().lower()
    test_mode = (mode == 'test')
    
    # Run pipeline
    pipeline.run_full_pipeline(test_mode=test_mode)

if __name__ == "__main__":
    main()
