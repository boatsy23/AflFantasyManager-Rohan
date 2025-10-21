#!/usr/bin/env python3
"""
DFS Player Data Parser and Database Loader
1. Loads Excel files from raw_data/player_excel_files/ into database (via load_dfs_comprehensive.ts)
2. Moves processed files to attached_assets/ after successful database insertion
"""
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
import pandas as pd


class DFSPlayerParser:
    def __init__(self):
        self.raw_data_dir = Path("raw_data") / "player_excel_files"
        self.processed_dir = Path("attached_assets")
        self.output_file = Path("attached_assets") / "dfs_player_stats.json"
        self.db_loader_script = "scripts/data-loading/load_dfs_comprehensive.ts"
        
        # Create directories if they don't exist
        self.processed_dir.mkdir(parents=True, exist_ok=True)
    
    def parse_all_players(self):
        """Load Excel files into database and move to attached_assets"""
        if not self.raw_data_dir.exists():
            print(f"❌ Raw data directory not found: {self.raw_data_dir}")
            return False
        
        # Find all Excel files
        excel_files = list(self.raw_data_dir.glob("*.xlsx"))
        
        if not excel_files:
            print(f"⚠️  No Excel files found in {self.raw_data_dir}")
            return False
        
        print("=" * 70)
        print("DFS PLAYER DATA PARSER & DATABASE LOADER")
        print("=" * 70)
        print(f"Found {len(excel_files)} Excel files to process")
        print(f"Source: {self.raw_data_dir}")
        print(f"Destination: {self.processed_dir}")
        print("=" * 70)
        
        # STEP 1: Load into database using TypeScript loader
        print("\n📊 STEP 1: Loading data into database...")
        print("=" * 70)
        
        try:
            result = subprocess.run(
                ["tsx", self.db_loader_script],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            # Print the output from the database loader
            print(result.stdout)
            
            if result.returncode != 0:
                print(f"❌ Database loading failed!")
                print(result.stderr)
                return False
            
            print("✅ Database loading successful!")
            
        except Exception as e:
            print(f"❌ Error running database loader: {e}")
            return False
        
        # STEP 2: Move files to attached_assets (only successfully completed ones)
        print("\n📁 STEP 2: Moving files to attached_assets...")
        print("=" * 70)
        
        # Load progress file to check which files were successfully completed
        progress_file = Path("loader_progress.json")
        completed_files = set()
        failed_files = {}
        
        if progress_file.exists():
            try:
                with open(progress_file, 'r') as f:
                    progress_data = json.load(f)
                    completed_files = set(progress_data.get('completed', []))
                    failed_files = progress_data.get('failed', {})
                print(f"📊 Loader progress: {len(completed_files)} completed, {len(failed_files)} failed")
            except Exception as e:
                print(f"⚠️  Could not load progress file: {e}")
                print("⚠️  Will not move any files to prevent data loss")
                return False
        else:
            print("⚠️  No progress file found - cannot verify successful loads")
            print("⚠️  Will not move any files to prevent data loss")
            return False
        
        moved = 0
        skipped = 0
        
        for i, excel_file in enumerate(excel_files, 1):
            # Only move files that were successfully completed
            if excel_file.name in completed_files:
                print(f"[{i}/{len(excel_files)}] Moving {excel_file.name}...", end=" ")
                try:
                    destination = self.processed_dir / excel_file.name
                    shutil.move(str(excel_file), str(destination))
                    moved += 1
                    print(f"✓")
                except Exception as e:
                    print(f"✗ Error: {e}")
            else:
                # Keep failed or unprocessed files in raw_data for retry
                status = "FAILED" if excel_file.name in failed_files else "NOT PROCESSED"
                print(f"[{i}/{len(excel_files)}] Skipping {excel_file.name} ({status})")
                skipped += 1
        
        # Print summary
        print("\n" + "=" * 70)
        print("COMPLETE WORKFLOW SUMMARY")
        print("=" * 70)
        print(f"✅ Files successfully loaded: {len(completed_files)}")
        print(f"✅ Files moved to attached_assets: {moved}")
        if skipped > 0:
            print(f"⚠️  Files skipped (kept in raw_data): {skipped}")
        if failed_files:
            print(f"❌ Files failed: {len(failed_files)}")
        print(f"📂 Excel files archived in: {self.processed_dir}")
        print("=" * 70)
        print("\n✅ All data loaded into database tables:")
        print("   - dfsPlayers (main player data)")
        print("   - opponentHistory (opponent splits)")
        print("   - venueHistory (venue splits)")
        print("   - player_round_stats (game-by-game stats)")
        print("=" * 70)
        
        return moved > 0
    
    def parse_player_excel(self, excel_file):
        """Parse individual player Excel file"""
        try:
            xl = pd.ExcelFile(excel_file)
            
            player_data = {
                'player_name': None,
                'player_id': None,
                'team': None,
                'position': None,
                'parsed_at': datetime.now().isoformat(),
                'source_file': excel_file.name
            }
            
            # Parse Player Info sheet
            if 'Player Info' in xl.sheet_names:
                info_df = pd.read_excel(excel_file, sheet_name='Player Info')
                if len(info_df) > 0:
                    player_data['player_id'] = info_df.iloc[0].get('Player ID')
                    player_data['player_name'] = info_df.iloc[0].get('Player Name')
                    player_data['team'] = info_df.iloc[0].get('Team')
                    player_data['team_abbr'] = info_df.iloc[0].get('Team Abbr')
                    player_data['position'] = info_df.iloc[0].get('Position')
                    player_data['height'] = info_df.iloc[0].get('Height')
                    player_data['weight'] = info_df.iloc[0].get('Weight')
                    player_data['dob'] = info_df.iloc[0].get('DOB')
            
            # Parse Game Logs sheet
            if 'Game Logs' in xl.sheet_names:
                games_df = pd.read_excel(excel_file, sheet_name='Game Logs')
                
                # Calculate 2025 stats
                if 'year' in games_df.columns:
                    games_2025 = games_df[games_df['year'] == '2025']
                    
                    if len(games_2025) > 0 and 'FP' in games_2025.columns:
                        scores = games_2025['FP'].dropna().tolist()
                        
                        if scores:
                            player_data['games_2025'] = len(scores)
                            player_data['avg_2025'] = round(sum(scores) / len(scores), 1)
                            player_data['total_2025'] = sum(scores)
                            player_data['season_high'] = max(scores)
                            player_data['season_low'] = min(scores)
                            player_data['recent_scores'] = scores[:5] if len(scores) >= 5 else scores
                            
                            # Calculate last 3 and last 5 averages
                            if len(scores) >= 3:
                                player_data['last_3_avg'] = round(sum(scores[:3]) / 3, 1)
                            if len(scores) >= 5:
                                player_data['last_5_avg'] = round(sum(scores[:5]) / 5, 1)
                
                # Store all game logs
                player_data['game_logs_count'] = len(games_df)
                player_data['game_logs'] = games_df.to_dict('records')[:50]  # Store last 50 games
            
            # Parse Career Averages sheet
            if 'Career Averages' in xl.sheet_names:
                career_df = pd.read_excel(excel_file, sheet_name='Career Averages')
                player_data['career_seasons'] = len(career_df)
                player_data['career_averages'] = career_df.to_dict('records')
            
            # Parse Opponent Splits sheet
            if 'Opponent Splits' in xl.sheet_names:
                opp_df = pd.read_excel(excel_file, sheet_name='Opponent Splits')
                player_data['opponent_splits_count'] = len(opp_df)
                player_data['opponent_splits'] = opp_df.to_dict('records')
            
            # Parse Venue Splits sheet
            if 'Venue Splits' in xl.sheet_names:
                venue_df = pd.read_excel(excel_file, sheet_name='Venue Splits')
                player_data['venue_splits_count'] = len(venue_df)
                player_data['venue_splits'] = venue_df.to_dict('records')
            
            # Only return if we have essential data
            if player_data.get('player_name'):
                return player_data
            
            return None
            
        except Exception as e:
            print(f"  Error parsing {excel_file.name}: {e}")
            return None
    
    def save_parsed_data(self, player_data):
        """Save parsed player data to JSON"""
        try:
            # Sort by average score (descending)
            sorted_data = sorted(
                player_data, 
                key=lambda x: x.get('avg_2025', 0), 
                reverse=True
            )
            
            # Save full data
            with open(self.output_file, 'w') as f:
                json.dump(sorted_data, f, indent=2)
            
            print(f"\n✓ Saved parsed data: {len(sorted_data)} players")
            
            # Create a summary file
            summary_file = self.processed_dir / "dfs_player_summary.json"
            summary = {
                'total_players': len(sorted_data),
                'parsed_at': datetime.now().isoformat(),
                'top_10_players': [
                    {
                        'name': p['player_name'],
                        'team': p.get('team_abbr', p.get('team')),
                        'avg_2025': p.get('avg_2025', 0),
                        'games_2025': p.get('games_2025', 0)
                    }
                    for p in sorted_data[:10]
                ]
            }
            
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2)
            
            print(f"✓ Saved summary: {summary_file}")
            
        except Exception as e:
            print(f"Error saving data: {e}")


def main():
    parser = DFSPlayerParser()
    success = parser.parse_all_players()
    
    if success:
        print("\n✅ All files processed and moved to attached_assets!")
        print("📋 Ready for next round of stats uploads")
    else:
        print("\n⚠️  No files were processed")


if __name__ == "__main__":
    main()
