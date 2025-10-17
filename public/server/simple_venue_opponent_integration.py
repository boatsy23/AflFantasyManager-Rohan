#!/usr/bin/env python3
"""
Simplified script to integrate last-game vs-opponent and last-game at-venue stats
"""

import json
import os
from datetime import datetime

def integrate_venue_opponent_stats():
    """Main integration function"""
    print("Starting venue/opponent stats integration...")
    
    # Load master player stats
    master_stats_path = 'data/master_player_stats.json'
    with open(master_stats_path, 'r') as f:
        master_stats = json.load(f)
    
    print(f"Loaded {len(master_stats['players'])} players")
    
    # Load fixture data to get next opponents
    fixture_path = '../attached_assets/afl_fixture_2025_1753111987231.json'
    with open(fixture_path, 'r') as f:
        fixtures = json.load(f)
    
    # Team mappings
    team_mappings = {
        'Adelaide': 'ADE', 'Brisbane': 'BRI', 'Carlton': 'CAR', 'Collingwood': 'COL',
        'Essendon': 'ESS', 'Fremantle': 'FRE', 'Geelong': 'GEE', 'Gold Coast': 'GCS',
        'Greater Western Sydney': 'GWS', 'Hawthorn': 'HAW', 'Melbourne': 'MEL',
        'North Melbourne': 'NTH', 'Port Adelaide': 'PTA', 'Richmond': 'RIC',
        'St Kilda': 'STK', 'Sydney': 'SYD', 'West Coast Eagles': 'WCE',
        'Western Bulldogs': 'WBD'
    }
    
    # Assume current round is 14 based on date context
    current_round = 14
    
    # Get next fixtures for each team
    next_fixtures = {}
    for fixture in fixtures:
        if fixture['round'] == current_round:
            teams_str = fixture['teams']
            if ' vs ' in teams_str:
                home_team, away_team = teams_str.split(' vs ')
                next_fixtures[home_team] = {'opponent': away_team, 'venue': home_team, 'is_home': True}
                next_fixtures[away_team] = {'opponent': home_team, 'venue': home_team, 'is_home': False}
    
    print(f"Found next fixtures for {len(next_fixtures)} teams")
    
    # Process each player
    updated_players = 0
    players_with_dfs_data = 0
    players_with_opponent_data = 0
    players_with_venue_data = 0
    
    for player in master_stats['players']:
        player_name = player['name']
        player_team = player['team']
        
        # Map team name to abbreviation
        team_abbrev = team_mappings.get(player_team)
        if not team_abbrev or team_abbrev not in next_fixtures:
            player['lastVsOpponent'] = None
            player['lastAtVenue'] = None
            player['nextOpponent'] = None
            player['nextVenue'] = None
            continue
        
        next_fixture = next_fixtures[team_abbrev]
        next_opponent = next_fixture['opponent']
        next_venue = next_fixture['venue']
        
        # Try to load DFS game logs for this player
        dfs_base_path = '../extracted_player_data/dfs_player_summary_json'
        possible_files = [
            f"{player_name}.json",
            f"{player_name.replace(' ', '')}.json",
            f"{player_name.replace(' ', '_')}.json"
        ]
        
        game_logs = []
        for filename in possible_files:
            file_path = os.path.join(dfs_base_path, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        game_logs = data.get('Game Logs', [])
                        break
                except Exception as e:
                    continue
        
        # Set next opponent and venue
        player['nextOpponent'] = next_opponent
        player['nextVenue'] = next_venue
        
        if game_logs:
            players_with_dfs_data += 1
            
            # Find last scores vs opponent and at venue
            last_vs_opponent = None
            last_at_venue = None
            
            # Sort games by year and round (most recent first)
            def safe_round_sort(game):
                year = game.get('YR', 0)
                round_val = str(game.get('RD', '0'))
                
                # Handle special cases
                if 'F' in round_val:  # Finals
                    return (year, 100 + int(round_val.replace('F', '')))
                elif 'P' in round_val:  # Preseason
                    return (year, -1)
                else:
                    try:
                        return (year, int(round_val))
                    except ValueError:
                        return (year, 0)
            
            sorted_games = sorted(game_logs, key=safe_round_sort, reverse=True)
            
            for game in sorted_games:
                opponent = game.get('OPP', '')
                venue = game.get('VEN', '')
                fantasy_points = game.get('FP', 0)
                
                # Check for last vs opponent match
                if opponent == next_opponent and last_vs_opponent is None:
                    last_vs_opponent = fantasy_points
                    players_with_opponent_data += 1
                
                # Check for last at venue match (using team abbrev as venue indicator)
                if venue == next_venue and last_at_venue is None:
                    last_at_venue = fantasy_points
                    players_with_venue_data += 1
                
                # Break if we found both
                if last_vs_opponent is not None and last_at_venue is not None:
                    break
            
            player['lastVsOpponent'] = last_vs_opponent
            player['lastAtVenue'] = last_at_venue
            
            # Add recent game logs for future use (last 5 games)
            player['recentGameLogs'] = sorted_games[:5]
        else:
            player['lastVsOpponent'] = None
            player['lastAtVenue'] = None
            player['recentGameLogs'] = []
        
        updated_players += 1
        
        if updated_players % 100 == 0:
            print(f"Processed {updated_players} players...")
    
    # Update metadata
    master_stats['metadata']['venue_opponent_integration'] = {
        'players_processed': updated_players,
        'players_with_dfs_data': players_with_dfs_data,
        'players_with_opponent_data': players_with_opponent_data,
        'players_with_venue_data': players_with_venue_data,
        'current_round': current_round,
        'integration_date': datetime.now().isoformat()
    }
    
    # Save updated master stats
    with open(master_stats_path, 'w') as f:
        json.dump(master_stats, f, indent=2)
    
    print(f"\nIntegration complete!")
    print(f"Players processed: {updated_players}")
    print(f"Players with DFS data: {players_with_dfs_data}")
    print(f"Players with opponent history: {players_with_opponent_data}")
    print(f"Players with venue history: {players_with_venue_data}")
    print(f"Updated master stats saved to: {master_stats_path}")
    
    return {
        'success': True,
        'stats': {
            'players_processed': updated_players,
            'players_with_dfs_data': players_with_dfs_data,
            'players_with_opponent_data': players_with_opponent_data,
            'players_with_venue_data': players_with_venue_data
        }
    }

if __name__ == "__main__":
    result = integrate_venue_opponent_stats()
    print(f"Integration result: {result}")