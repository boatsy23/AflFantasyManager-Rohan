#!/usr/bin/env python3
"""
Script to integrate last-game vs-opponent and last-game at-venue stats into master_player_stats.json
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import re

def load_fixture_data():
    """Load AFL fixture data and determine current round based on date"""
    fixture_path = os.path.join('..', 'attached_assets', 'afl_fixture_2025_1753111987231.json')
    
    with open(fixture_path, 'r') as f:
        fixtures = json.load(f)
    
    # For this task, we'll assume we're currently around Round 13-14 (August 2025)
    # In a real implementation, we'd determine this from the current date
    current_round = 14
    
    print(f"Loading fixture data, current round: {current_round}")
    
    # Get next fixtures for each team
    next_fixtures = {}
    
    for fixture in fixtures:
        if fixture['round'] == current_round:
            teams_str = fixture['teams']
            # Parse "TM1 vs TM2" format
            if ' vs ' in teams_str:
                home_team, away_team = teams_str.split(' vs ')
                # Assume home venue for home team, away venue for away team
                # For simplicity, we'll extract venue from team abbreviations
                next_fixtures[home_team] = {
                    'opponent': away_team,
                    'venue': home_team,  # Home team plays at their venue
                    'round': current_round,
                    'is_home': True
                }
                next_fixtures[away_team] = {
                    'opponent': home_team,
                    'venue': home_team,  # Away team plays at home team's venue
                    'round': current_round,
                    'is_home': False
                }
    
    print(f"Found next fixtures for {len(next_fixtures)} teams")
    return next_fixtures

def load_team_mappings():
    """Create mappings between different team name formats"""
    # Map from full team names (in master stats) to abbreviations (in fixtures/DFS)
    team_mappings = {
        'Adelaide': 'ADE',
        'Brisbane': 'BRI', 
        'Carlton': 'CAR',
        'Collingwood': 'COL',
        'Essendon': 'ESS',
        'Fremantle': 'FRE',
        'Geelong': 'GEE',
        'Gold Coast': 'GCS',
        'Greater Western Sydney': 'GWS',
        'Hawthorn': 'HAW',
        'Melbourne': 'MEL',
        'North Melbourne': 'NTH',
        'Port Adelaide': 'PTA',
        'Richmond': 'RIC',
        'St Kilda': 'STK',
        'Sydney': 'SYD',
        'West Coast Eagles': 'WCE',
        'Western Bulldogs': 'WBD'
    }
    
    # Reverse mapping
    abbrev_to_full = {v: k for k, v in team_mappings.items()}
    
    return team_mappings, abbrev_to_full

def load_player_game_logs(player_name):
    """Load game logs for a specific player from DFS data"""
    # Try different filename variations
    possible_files = [
        f"{player_name}.json",
        f"{player_name.replace(' ', '')}.json",
        f"{player_name.replace(' ', '_')}.json"
    ]
    
    base_path = os.path.join('..', 'extracted_player_data', 'dfs_player_summary_json')
    
    for filename in possible_files:
        file_path = os.path.join(base_path, filename)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    return data.get('Game Logs', [])
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
                continue
    
    print(f"No DFS data found for player: {player_name}")
    return []

def find_last_vs_opponent_and_venue(game_logs, next_opponent, next_venue):
    """Find the most recent game against opponent and at venue"""
    last_vs_opponent = None
    last_at_venue = None
    
    # Sort games by year and round (most recent first)
    sorted_games = sorted(game_logs, key=lambda x: (x.get('YR', 0), int(x.get('RD', 0))), reverse=True)
    
    for game in sorted_games:
        opponent = game.get('OPP', '')
        venue = game.get('VEN', '')
        fantasy_points = game.get('FP', 0)
        
        # Check for last vs opponent match
        if opponent == next_opponent and last_vs_opponent is None:
            last_vs_opponent = fantasy_points
        
        # Check for last at venue match
        # Note: venue matching might need refinement based on actual venue codes
        if venue and last_at_venue is None:
            # For now, we'll use team abbreviations as venue indicators
            if venue == next_venue:
                last_at_venue = fantasy_points
    
    return last_vs_opponent, last_at_venue

def process_master_stats():
    """Main function to process and update master stats with venue/opponent data"""
    print("Starting venue/opponent stats integration...")
    
    # Load required data
    team_mappings, abbrev_to_full = load_team_mappings()
    next_fixtures = load_fixture_data()
    
    # Load master player stats
    master_stats_path = os.path.join('data', 'master_player_stats.json')
    with open(master_stats_path, 'r') as f:
        master_stats = json.load(f)
    
    updated_players = 0
    players_with_opponent_data = 0
    players_with_venue_data = 0
    players_without_dfs_data = 0
    
    print(f"Processing {len(master_stats['players'])} players...")
    
    for player in master_stats['players']:
        player_name = player['name']
        player_team = player['team']
        
        # Map team name to abbreviation
        team_abbrev = team_mappings.get(player_team)
        if not team_abbrev:
            print(f"Unknown team mapping for {player_team} (player: {player_name})")
            continue
        
        # Get next fixture for this team
        next_fixture = next_fixtures.get(team_abbrev)
        if not next_fixture:
            print(f"No next fixture found for team {team_abbrev} (player: {player_name})")
            continue
        
        next_opponent = next_fixture['opponent']
        next_venue = next_fixture['venue']
        
        # Load player's game logs
        game_logs = load_player_game_logs(player_name)
        if not game_logs:
            players_without_dfs_data += 1
            # Set null values if no data
            player['lastVsOpponent'] = None
            player['lastAtVenue'] = None
            player['nextOpponent'] = next_opponent
            player['nextVenue'] = next_venue
            continue
        
        # Find last scores vs opponent and at venue
        last_vs_opponent, last_at_venue = find_last_vs_opponent_and_venue(
            game_logs, next_opponent, next_venue
        )
        
        # Update player data
        player['lastVsOpponent'] = last_vs_opponent
        player['lastAtVenue'] = last_at_venue
        player['nextOpponent'] = next_opponent
        player['nextVenue'] = next_venue
        
        # Add full game logs for future use (optional)
        player['gameLogs'] = game_logs[-10:]  # Keep last 10 games
        
        updated_players += 1
        if last_vs_opponent is not None:
            players_with_opponent_data += 1
        if last_at_venue is not None:
            players_with_venue_data += 1
        
        if updated_players % 50 == 0:
            print(f"Processed {updated_players} players...")
    
    # Update metadata
    master_stats['metadata']['last_updated'] = datetime.now().isoformat()
    master_stats['metadata']['venue_opponent_integration'] = {
        'players_processed': updated_players,
        'players_with_opponent_data': players_with_opponent_data,
        'players_with_venue_data': players_with_venue_data,
        'players_without_dfs_data': players_without_dfs_data,
        'integration_date': datetime.now().isoformat()
    }
    
    # Save updated master stats
    with open(master_stats_path, 'w') as f:
        json.dump(master_stats, f, indent=2)
    
    print(f"\nIntegration complete!")
    print(f"Players processed: {updated_players}")
    print(f"Players with opponent data: {players_with_opponent_data}")
    print(f"Players with venue data: {players_with_venue_data}")
    print(f"Players without DFS data: {players_without_dfs_data}")
    print(f"Updated master stats saved to: {master_stats_path}")

if __name__ == "__main__":
    process_master_stats()