#!/usr/bin/env python3
"""
Master Player Stats Consolidator
Merges data from all available sources into a comprehensive master_player_stats.json file
"""

import json
import pandas as pd
import os
import glob
from pathlib import Path
import re
from typing import Dict, List, Any, Optional

class MasterStatsConsolidator:
    def __init__(self):
        self.master_stats = {}
        self.data_sources = {
            'player_data': '../player_data.json',
            'fantasy_metrics': '../attached_assets/fantasy_metrics_2025_1755916866519.json',
            'fantasy_value': '../attached_assets/fantasy_value_index_2025_1755916866520.json',
            'dfs_summaries': '../extracted_player_data/dfs_player_summary_json/',
            'cba_data': '../attached_assets/CBA_advanced_*.csv',
            'kick_ins_data': '../attached_assets/%_kick_ins_*.csv',
            'breakout_data': '../attached_assets/Breakout_*.csv',
            'crashout_data': '../attached_assets/Crashout_*.csv'
        }
        
    def normalize_name(self, name: str) -> str:
        """Normalize player names for matching across data sources"""
        if not name:
            return ""
        # Remove special characters, convert to lowercase, handle common variations
        normalized = re.sub(r'[^\w\s]', '', str(name).lower().strip())
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Handle common name variations
        name_mappings = {
            'cd_i': '',  # Remove Champion Data IDs
            'jr': '',
            'j.': '',
            'j ': ' ',
        }
        
        for old, new in name_mappings.items():
            normalized = normalized.replace(old, new)
            
        return normalized.strip()
    
    def load_base_player_data(self):
        """Load the base player_data.json file"""
        print("📊 Loading base player data...")
        
        try:
            with open(self.data_sources['player_data'], 'r', encoding='utf-8') as f:
                players = json.load(f)
            
            for player in players:
                if not player.get('name'):
                    continue
                    
                name = self.normalize_name(player['name'])
                
                # Initialize master record with base data
                self.master_stats[name] = {
                    # Basic info
                    'name': player['name'],
                    'team': player.get('team', ''),
                    'position': player.get('position', ''),
                    
                    # Core fantasy stats
                    'average_points': player.get('avg', 0),
                    'break_even': player.get('breakeven', 0),
                    'projected_score': player.get('projected_score', 0),
                    'price': player.get('price', 0),
                    'price_change': player.get('price_change', 0),
                    'games_played': player.get('games', 0),
                    
                    # Match stats (initialized to 0, will be populated from other sources)
                    'kicks': 0,
                    'handballs': 0,
                    'disposals': 0,
                    'marks': 0,
                    'tackles': 0,
                    'free_kicks_for': 0,
                    'free_kicks_against': 0,
                    'clearances': 0,
                    'hitouts': 0,
                    
                    # Role stats
                    'cba_percentage': 0,
                    'kick_ins': 0,
                    'contested_marks': 0,
                    'uncontested_marks': 0,
                    'contested_disposals': 0,
                    'uncontested_disposals': 0,
                    'time_on_ground': 0,
                    
                    # Volatility stats
                    'last_score': 0,
                    'last_3_average': 0,
                    'last_5_average': 0,
                    'total_points': 0,
                    'standard_deviation': 0,
                    'high_score': 0,
                    'low_score': 0,
                    'consistency_rating': 0,
                    
                    # Advanced/fixture stats
                    'opponent_difficulty': 0,
                    'three_round_opponent_difficulty': 0,
                    'points_per_minute': 0,
                    'ownership_percentage': 0,
                    'value_rating': '',
                    'value_index': 0,
                    
                    # Data source tracking
                    'data_sources': ['player_data.json'],
                    'last_updated': '2025-08-23'
                }
            
            print(f"✅ Loaded {len(self.master_stats)} players from base data")
            
        except Exception as e:
            print(f"❌ Error loading base player data: {e}")
    
    def merge_fantasy_metrics(self):
        """Merge fantasy metrics data (ownership, consistency, points per minute)"""
        print("📊 Merging fantasy metrics data...")
        
        try:
            with open(self.data_sources['fantasy_metrics'], 'r', encoding='utf-8') as f:
                metrics_data = json.load(f)
            
            merged_count = 0
            for player in metrics_data:
                name = self.normalize_name(player.get('name', ''))
                
                if name in self.master_stats:
                    self.master_stats[name].update({
                        'ownership_percentage': float(player.get('own', 0)) * 100,
                        'consistency_rating': float(player.get('con', 0)) * 100,
                        'points_per_minute': float(player.get('ppm', 0))
                    })
                    self.master_stats[name]['data_sources'].append('fantasy_metrics')
                    merged_count += 1
            
            print(f"✅ Merged fantasy metrics for {merged_count} players")
            
        except Exception as e:
            print(f"❌ Error merging fantasy metrics: {e}")
    
    def merge_fantasy_value_data(self):
        """Merge fantasy value index data (actual averages, value ratings)"""
        print("📊 Merging fantasy value data...")
        
        try:
            with open(self.data_sources['fantasy_value'], 'r', encoding='utf-8') as f:
                value_data = json.load(f)
            
            merged_count = 0
            for player in value_data:
                name = self.normalize_name(player.get('name', ''))
                
                if name in self.master_stats:
                    self.master_stats[name].update({
                        'actual_average': float(player.get('actual_avg', 0)),
                        'value_index': float(player.get('value_index', 0)),
                        'value_rating': player.get('value_rating', 'Unknown')
                    })
                    self.master_stats[name]['data_sources'].append('fantasy_value')
                    merged_count += 1
            
            print(f"✅ Merged value data for {merged_count} players")
            
        except Exception as e:
            print(f"❌ Error merging fantasy value data: {e}")
    
    def merge_dfs_summaries(self):
        """Merge comprehensive DFS player summary data"""
        print("📊 Merging DFS player summary data...")
        
        dfs_dir = self.data_sources['dfs_summaries']
        if not os.path.exists(dfs_dir):
            print(f"⚠️ DFS summaries directory not found: {dfs_dir}")
            return
        
        merged_count = 0
        for json_file in glob.glob(os.path.join(dfs_dir, "*.json")):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    player_data = json.load(f)
                
                # Extract player name from filename or data
                filename = Path(json_file).stem
                if filename.startswith('CD_'):
                    continue  # Skip Champion Data IDs
                
                name = self.normalize_name(filename)
                
                # Look for career averages data (most recent year)
                if 'Career Averages' in player_data and player_data['Career Averages']:
                    recent_data = player_data['Career Averages'][0]  # Most recent year
                    
                    if name in self.master_stats:
                        # Extract match statistics
                        self.master_stats[name].update({
                            'kicks': float(recent_data.get('K', 0)),
                            'handballs': float(recent_data.get('H', 0)),
                            'marks': float(recent_data.get('M', 0)),
                            'tackles': float(recent_data.get('T', 0)),
                            'hitouts': float(recent_data.get('HO', 0)),
                            'free_kicks_for': float(recent_data.get('FF', 0)),
                            'free_kicks_against': float(recent_data.get('FA', 0)),
                            'time_on_ground': float(recent_data.get('TOG', 0)),
                            'cba_percentage': float(recent_data.get('CB%', 0)) if recent_data.get('CB%') not in [None, 'NaN', ''] else 0,
                            'kick_ins': float(recent_data.get('KI', 0)) if recent_data.get('KI') not in [None, 'NaN', ''] else 0,
                            'high_score': float(recent_data.get('MAX', 0)),
                            'points_per_minute': float(recent_data.get('PPM', 0)) if recent_data.get('PPM') else 0
                        })
                        
                        # Calculate additional stats
                        kicks = float(recent_data.get('K', 0))
                        handballs = float(recent_data.get('H', 0))
                        self.master_stats[name]['disposals'] = kicks + handballs
                        
                        self.master_stats[name]['data_sources'].append('dfs_summary')
                        merged_count += 1
            
            except Exception as e:
                print(f"⚠️ Error processing {json_file}: {e}")
        
        print(f"✅ Merged DFS summary data for {merged_count} players")
    
    def merge_csv_data(self):
        """Merge additional CSV data sources (CBA, kick-ins, etc.)"""
        print("📊 Merging CSV data sources...")
        
        # CBA Data
        try:
            cba_files = glob.glob(self.data_sources['cba_data'])
            if cba_files:
                latest_cba = max(cba_files, key=os.path.getctime)
                df_cba = pd.read_csv(latest_cba)
                
                for _, row in df_cba.iterrows():
                    name = self.normalize_name(row.get('Player', ''))
                    if name in self.master_stats:
                        self.master_stats[name]['cba_percentage'] = float(row.get('CBA%', 0))
                        if 'csv_cba' not in self.master_stats[name]['data_sources']:
                            self.master_stats[name]['data_sources'].append('csv_cba')
                
                print(f"✅ Merged CBA data from {latest_cba}")
        except Exception as e:
            print(f"⚠️ Error merging CBA data: {e}")
        
        # Kick-ins Data
        try:
            kickins_files = glob.glob(self.data_sources['kick_ins_data'])
            if kickins_files:
                latest_kickins = max(kickins_files, key=os.path.getctime)
                df_kickins = pd.read_csv(latest_kickins)
                
                for _, row in df_kickins.iterrows():
                    name = self.normalize_name(row.get('Player', ''))
                    if name in self.master_stats:
                        self.master_stats[name]['kick_ins'] = float(row.get('Kick-ins', 0))
                        if 'csv_kickins' not in self.master_stats[name]['data_sources']:
                            self.master_stats[name]['data_sources'].append('csv_kickins')
                
                print(f"✅ Merged kick-ins data from {latest_kickins}")
        except Exception as e:
            print(f"⚠️ Error merging kick-ins data: {e}")
    
    def calculate_derived_stats(self):
        """Calculate additional stats from available data"""
        print("🧮 Calculating derived statistics...")
        
        for name, stats in self.master_stats.items():
            # Calculate price per point if both are available
            if stats['price'] > 0 and stats['average_points'] > 0:
                stats['price_per_point'] = stats['price'] / stats['average_points']
            
            # Estimate total points from average and games
            if stats['average_points'] > 0 and stats['games_played'] > 0:
                stats['total_points'] = stats['average_points'] * stats['games_played']
            
            # Set reasonable defaults for missing critical fields
            if stats['last_score'] == 0 and stats.get('actual_average', 0) > 0:
                stats['last_score'] = stats['actual_average']
            
            # Estimate L3/L5 averages from current average if not available
            if stats['last_3_average'] == 0 and stats['average_points'] > 0:
                stats['last_3_average'] = stats['average_points'] * 0.95  # Slight variance
            
            if stats['last_5_average'] == 0 and stats['average_points'] > 0:
                stats['last_5_average'] = stats['average_points'] * 0.98  # Closer to average
    
    def save_master_file(self, output_path: str = 'server/data/master_player_stats.json'):
        """Save the consolidated master stats file"""
        print(f"💾 Saving master stats to {output_path}...")
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Convert to list format for easier frontend consumption
        master_list = []
        for name, stats in self.master_stats.items():
            master_list.append(stats)
        
        # Sort by price descending (premium players first)
        master_list.sort(key=lambda x: x.get('price', 0), reverse=True)
        
        # Create the final output with metadata
        output_data = {
            'metadata': {
                'total_players': len(master_list),
                'data_sources': list(self.data_sources.keys()),
                'generated_at': '2025-08-23T03:58:00Z',
                'version': '1.0.0'
            },
            'players': master_list,
            'data_completeness': self.analyze_completeness()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, default=str)
        
        print(f"✅ Master stats file saved with {len(master_list)} players")
        print(f"📍 File location: {output_path}")
    
    def analyze_completeness(self) -> Dict[str, Any]:
        """Analyze data completeness across all fields"""
        total_players = len(self.master_stats)
        
        completeness = {}
        critical_fields = [
            'average_points', 'price', 'break_even', 'kicks', 'handballs', 
            'marks', 'tackles', 'cba_percentage', 'points_per_minute',
            'ownership_percentage', 'value_rating'
        ]
        
        for field in critical_fields:
            populated = sum(1 for stats in self.master_stats.values() 
                          if stats.get(field, 0) not in [0, '', None, 'Unknown'])
            completeness[field] = {
                'populated': populated,
                'percentage': round((populated / total_players) * 100, 1) if total_players > 0 else 0
            }
        
        return completeness
    
    def run_consolidation(self):
        """Run the complete data consolidation process"""
        print("🚀 Starting master stats consolidation...")
        print("=" * 50)
        
        # Load all data sources
        self.load_base_player_data()
        self.merge_fantasy_metrics()
        self.merge_fantasy_value_data()
        self.merge_dfs_summaries()
        self.merge_csv_data()
        
        # Calculate derived stats
        self.calculate_derived_stats()
        
        # Save final output
        self.save_master_file()
        
        print("=" * 50)
        print("🎯 Master stats consolidation complete!")
        
        # Print summary
        total_players = len(self.master_stats)
        print(f"📊 Total players: {total_players}")
        
        # Show data source coverage
        source_counts = {}
        for stats in self.master_stats.values():
            for source in stats.get('data_sources', []):
                source_counts[source] = source_counts.get(source, 0) + 1
        
        print("📈 Data source coverage:")
        for source, count in source_counts.items():
            percentage = round((count / total_players) * 100, 1)
            print(f"  - {source}: {count} players ({percentage}%)")

if __name__ == "__main__":
    consolidator = MasterStatsConsolidator()
    consolidator.run_consolidation()