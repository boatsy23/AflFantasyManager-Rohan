#!/usr/bin/env python3
"""
Generate DFS player list from player_team_mapping.json
"""

import json
import pandas as pd

def generate_player_list():
    """Generate player list from the team mapping file"""
    
    print("="*60)
    print("Generating DFS Player List from Team Mapping")
    print("="*60)
    
    # Load player team mapping
    with open('player_team_mapping.json', 'r') as f:
        team_mapping = json.load(f)
    
    print(f"\n✓ Loaded {len(team_mapping)} players from team mapping")
    
    # Convert to player list format
    player_list = []
    for i, (player_name, team) in enumerate(team_mapping.items()):
        # Create URL-friendly slug
        player_url = player_name.lower().replace(' ', '-').replace("'", "").replace(".", "")
        
        player_list.append({
            'player_id': str(5000 + i),  # Generate unique IDs
            'player_name': player_name,
            'player_url': player_url,
            'team': team,
            'full_url': f"https://dfsaustralia.com/afl-fantasy-player/{player_url}/"
        })
    
    # Save to Excel
    df = pd.DataFrame(player_list)
    excel_path = 'dfs_player_list.xlsx'
    df.to_excel(excel_path, index=False)
    print(f"\n✓ Saved {len(player_list)} players to {excel_path}")
    
    # Also save as JSON
    json_path = 'dfs_player_list.json'
    with open(json_path, 'w') as f:
        json.dump(player_list, f, indent=2)
    print(f"✓ Saved to {json_path}")
    
    # Show sample
    print("\nSample players:")
    for player in player_list[:10]:
        print(f"  - {player['player_name']} ({player['team']}): ID={player['player_id']}")
    
    return player_list

if __name__ == "__main__":
    players = generate_player_list()
    print(f"\n✓ Successfully generated list of {len(players)} players")
    print("You can now use dfs_player_list.xlsx with the comprehensive scraper")