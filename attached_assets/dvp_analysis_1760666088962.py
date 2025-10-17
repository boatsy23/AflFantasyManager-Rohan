import json
import csv
import pandas as pd
import numpy as np
from collections import defaultdict, Counter
import os
import glob

class DVPAnalyzer:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.player_data = {}
        self.position_mapping = {}
        self.team_defensive_stats = {}
        self.dvp_ratings = {}
        
    def load_all_data(self):
        """Load all matchup files and position data"""
        print("Loading all data files...")
        
        # Load main DVP data file
        with open(os.path.join(self.data_dir, 'dfs_dvp_data.json'), 'r') as f:
            main_data = json.load(f)
            self.position_mapping = main_data.get('player_positions', {})
        
        # Load all team matchup files
        matchup_files = glob.glob(os.path.join(self.data_dir, 'player_matchups', '*_matchups.json'))
        
        for file_path in matchup_files:
            with open(file_path, 'r') as f:
                data = json.load(f)
                team = data['team']
                self.player_data[team] = data['matchups']
        
        print(f"Loaded data for {len(self.player_data)} teams")
    
    def create_position_groups(self):
        """Map players to simplified position groups"""
        self.position_groups = {
            'Forward': ['Key Forward', 'Small/Medium Forward'],
            'Midfielder': ['Inside Midfielder', 'Wing/Attacking Defender'],  
            'Defender': ['Designated Kicker', 'General Defender'],
            'Ruck': ['Ruck']
        }
        
        # Create reverse mapping - player to position group
        self.player_to_position = {}
        for team, positions in self.position_mapping.items():
            for position_type, players_str in positions.items():
                # Extract position group
                position_group = None
                for group, types in self.position_groups.items():
                    if position_type in types:
                        position_group = group
                        break
                
                if position_group:
                    # Parse player names (they're in a string separated by <br>)
                    player_names = players_str.replace('injured', '').replace('<br>', ',').split(',')
                    for player in player_names:
                        player = player.strip()
                        if player:
                            self.player_to_position[player] = position_group
    
    def calculate_team_defense_ratings(self):
        """Calculate how many points each team concedes to each position"""
        print("Calculating team defensive ratings...")
        
        team_position_stats = defaultdict(lambda: defaultdict(list))
        
        # Aggregate all player performances by position vs each team
        for team, matchups in self.player_data.items():
            for opponent, opponent_data in matchups.items():
                if 'players' not in opponent_data:
                    continue
                    
                for player in opponent_data['players']:
                    player_name = player.get('PLAYER', '')
                    avg_points = player.get('AVG', 0)
                    games_played = player.get('GM', 0)
                    
                    if not avg_points or not games_played or games_played < 2:
                        continue
                    
                    # Get player's position
                    position = self.player_to_position.get(player_name)
                    if position:
                        # This represents points scored AGAINST the team (opponent)
                        team_position_stats[opponent][position].append(avg_points)
        
        # Calculate averages for each team vs each position
        self.team_defensive_stats = {}
        for team in team_position_stats:
            self.team_defensive_stats[team] = {}
            for position in ['Forward', 'Midfielder', 'Defender', 'Ruck']:
                points_list = team_position_stats[team][position]
                if points_list:
                    avg_points = sum(points_list) / len(points_list)
                    self.team_defensive_stats[team][position] = {
                        'avg_points_allowed': avg_points,
                        'sample_size': len(points_list)
                    }
                else:
                    self.team_defensive_stats[team][position] = {
                        'avg_points_allowed': 0,
                        'sample_size': 0
                    }
    
    def create_dvp_team_ratings(self):
        """Create 1-10 DVP ratings for teams (1=best defense, 10=worst defense)"""
        print("Creating DVP team ratings...")
        
        self.team_dvp_ratings = {}
        
        for position in ['Forward', 'Midfielder', 'Defender', 'Ruck']:
            # Get all team averages for this position
            team_avgs = []
            for team, stats in self.team_defensive_stats.items():
                if stats[position]['sample_size'] >= 3:  # Minimum sample size
                    team_avgs.append((team, stats[position]['avg_points_allowed']))
            
            if not team_avgs:
                continue
                
            # Sort by points allowed (ascending = better defense)
            team_avgs.sort(key=lambda x: x[1])
            
            # Create ratings 1-10
            for i, (team, avg_points) in enumerate(team_avgs):
                if team not in self.team_dvp_ratings:
                    self.team_dvp_ratings[team] = {}
                
                # Convert rank to 1-10 scale
                rating = max(1, min(10, int((i / (len(team_avgs) - 1)) * 9) + 1))
                self.team_dvp_ratings[team][position] = {
                    'rating': rating,
                    'avg_points_allowed': avg_points,
                    'rank': i + 1
                }
    
    def calculate_player_dvp_ratings(self):
        """Calculate individual player DVP ratings vs each team"""
        print("Calculating individual player DVP ratings...")
        
        self.player_dvp_ratings = {}
        
        for team, matchups in self.player_data.items():
            for opponent, opponent_data in matchups.items():
                if 'players' not in opponent_data:
                    continue
                    
                for player in opponent_data['players']:
                    player_name = player.get('PLAYER', '')
                    avg_points = player.get('AVG', 0)
                    games_played = player.get('GM', 0)
                    consistency_score = 0
                    
                    if not avg_points or not player_name:
                        continue
                    
                    # Calculate consistency (look at individual game scores)
                    game_scores = []
                    for key, value in player.items():
                        if key.startswith(('2025R', '2024R', '2023R', '2022R')) and value != '':
                            try:
                                score = float(value)
                                game_scores.append(score)
                            except:
                                pass
                    
                    if game_scores and len(game_scores) >= 2:
                        # Calculate coefficient of variation (lower is more consistent)
                        mean_score = np.mean(game_scores)
                        std_score = np.std(game_scores)
                        cv = std_score / mean_score if mean_score > 0 else 0
                        consistency_score = max(0, 1 - (cv / 0.5))  # Normalize
                    
                    # Create DVP rating based on average, games played, and consistency
                    base_rating = min(10, max(1, avg_points / 10))  # Base 1-10 scale
                    
                    # Adjust for sample size
                    sample_adjustment = min(1.2, games_played / 5) if games_played > 0 else 0.5
                    
                    # Adjust for consistency
                    consistency_adjustment = 0.8 + (consistency_score * 0.4)
                    
                    final_rating = base_rating * sample_adjustment * consistency_adjustment
                    final_rating = max(1, min(10, final_rating))
                    
                    if player_name not in self.player_dvp_ratings:
                        self.player_dvp_ratings[player_name] = {}
                    
                    self.player_dvp_ratings[player_name][opponent] = {
                        'rating': round(final_rating, 1),
                        'avg_points': avg_points,
                        'games_played': games_played,
                        'consistency': round(consistency_score, 2),
                        'position': self.player_to_position.get(player_name, 'Unknown')
                    }
    
    def find_best_worst_matchups(self):
        """Find the best and worst matchups for analysis"""
        print("Finding best and worst matchups...")
        
        # Team defense rankings
        self.best_worst_team_defense = {}
        for position in ['Forward', 'Midfielder', 'Defender', 'Ruck']:
            teams_with_ratings = []
            for team, ratings in self.team_dvp_ratings.items():
                if position in ratings:
                    teams_with_ratings.append((team, ratings[position]))
            
            if teams_with_ratings:
                # Sort by rating (1 = best defense, 10 = worst)
                teams_with_ratings.sort(key=lambda x: x[1]['rating'])
                
                self.best_worst_team_defense[position] = {
                    'best_defense': teams_with_ratings[:3],  # Top 3
                    'worst_defense': teams_with_ratings[-3:]  # Bottom 3
                }
        
        # Player matchups
        self.best_worst_player_matchups = {'best': [], 'worst': []}
        
        for player, matchups in self.player_dvp_ratings.items():
            for opponent, data in matchups.items():
                if data['games_played'] >= 3:  # Minimum sample
                    self.best_worst_player_matchups['best'].append((player, opponent, data))
                    self.best_worst_player_matchups['worst'].append((player, opponent, data))
        
        # Sort best matchups by rating (highest = best for player)
        self.best_worst_player_matchups['best'].sort(key=lambda x: x[2]['rating'], reverse=True)
        self.best_worst_player_matchups['best'] = self.best_worst_player_matchups['best'][:20]
        
        # Sort worst matchups by rating (lowest = worst for player)
        self.best_worst_player_matchups['worst'].sort(key=lambda x: x[2]['rating'])
        self.best_worst_player_matchups['worst'] = self.best_worst_player_matchups['worst'][:20]
    
    def generate_report(self):
        """Generate comprehensive DVP analysis report"""
        print("Generating comprehensive DVP analysis report...")
        
        report = []
        report.append("="*80)
        report.append("COMPREHENSIVE DVP (DEFENSE vs POSITION) ANALYSIS REPORT")
        report.append("="*80)
        report.append("")
        
        # Team Defensive Ratings
        report.append("TEAM DEFENSIVE RATINGS BY POSITION")
        report.append("-" * 40)
        report.append("Rating Scale: 1 = Best Defense (Fewest Points Allowed), 10 = Worst Defense")
        report.append("")
        
        for position in ['Forward', 'Midfielder', 'Defender', 'Ruck']:
            report.append(f"{position.upper()}S:")
            teams_data = []
            for team, ratings in self.team_dvp_ratings.items():
                if position in ratings:
                    teams_data.append((team, ratings[position]))
            
            teams_data.sort(key=lambda x: x[1]['rating'])
            
            for team, data in teams_data:
                report.append(f"  {team}: Rating {data['rating']}/10 "
                            f"(Avg {data['avg_points_allowed']:.1f} pts allowed, "
                            f"Rank {data['rank']})")
            report.append("")
        
        # Best and Worst Team Defenses
        report.append("BEST & WORST TEAM DEFENSES BY POSITION")
        report.append("-" * 40)
        
        for position in ['Forward', 'Midfielder', 'Defender', 'Ruck']:
            if position in self.best_worst_team_defense:
                data = self.best_worst_team_defense[position]
                
                report.append(f"{position.upper()} - BEST DEFENSES:")
                for team, rating_data in data['best_defense']:
                    report.append(f"  {team}: {rating_data['avg_points_allowed']:.1f} pts (Rating: {rating_data['rating']}/10)")
                
                report.append(f"{position.upper()} - WORST DEFENSES:")
                for team, rating_data in data['worst_defense']:
                    report.append(f"  {team}: {rating_data['avg_points_allowed']:.1f} pts (Rating: {rating_data['rating']}/10)")
                report.append("")
        
        # Top Player Matchups
        report.append("TOP 20 PLAYER vs TEAM MATCHUPS (Best for Player)")
        report.append("-" * 50)
        for i, (player, opponent, data) in enumerate(self.best_worst_player_matchups['best'], 1):
            report.append(f"{i:2d}. {player} vs {opponent}: "
                        f"{data['rating']}/10 ({data['avg_points']:.1f} avg pts, "
                        f"{data['games_played']} games, {data['position']})")
        report.append("")
        
        # Worst Player Matchups
        report.append("WORST 20 PLAYER vs TEAM MATCHUPS (Worst for Player)")
        report.append("-" * 50)
        for i, (player, opponent, data) in enumerate(self.best_worst_player_matchups['worst'], 1):
            report.append(f"{i:2d}. {player} vs {opponent}: "
                        f"{data['rating']}/10 ({data['avg_points']:.1f} avg pts, "
                        f"{data['games_played']} games, {data['position']})")
        report.append("")
        
        # Summary Statistics
        report.append("SUMMARY STATISTICS")
        report.append("-" * 20)
        total_players = len(self.player_dvp_ratings)
        total_matchups = sum(len(matchups) for matchups in self.player_dvp_ratings.values())
        
        report.append(f"Total Players Analyzed: {total_players}")
        report.append(f"Total Player-Team Matchups: {total_matchups}")
        report.append(f"Teams with Complete Data: {len(self.team_dvp_ratings)}")
        report.append("")
        
        # Position Distribution
        position_counts = Counter(self.player_to_position.values())
        report.append("Players by Position:")
        for position, count in position_counts.items():
            report.append(f"  {position}: {count} players")
        
        report.append("")
        report.append("="*80)
        
        return "\n".join(report)
    
    def export_detailed_csv(self):
        """Export detailed data to CSV files"""
        print("Exporting detailed data to CSV...")
        
        # Team DVP Ratings CSV
        team_data = []
        for team, positions in self.team_dvp_ratings.items():
            row = {'Team': team}
            for position in ['Forward', 'Midfielder', 'Defender', 'Ruck']:
                if position in positions:
                    row[f'{position}_Rating'] = positions[position]['rating']
                    row[f'{position}_AvgPointsAllowed'] = round(positions[position]['avg_points_allowed'], 1)
                    row[f'{position}_Rank'] = positions[position]['rank']
                else:
                    row[f'{position}_Rating'] = 'N/A'
                    row[f'{position}_AvgPointsAllowed'] = 'N/A'
                    row[f'{position}_Rank'] = 'N/A'
            team_data.append(row)
        
        team_df = pd.DataFrame(team_data)
        team_df.to_csv(os.path.join(self.data_dir, 'team_dvp_ratings.csv'), index=False)
        
        # Player DVP Ratings CSV
        player_data = []
        for player, opponents in self.player_dvp_ratings.items():
            for opponent, data in opponents.items():
                player_data.append({
                    'Player': player,
                    'Opponent': opponent,
                    'DVP_Rating': data['rating'],
                    'Avg_Points': data['avg_points'],
                    'Games_Played': data['games_played'],
                    'Consistency': data['consistency'],
                    'Position': data['position']
                })
        
        player_df = pd.DataFrame(player_data)
        player_df.to_csv(os.path.join(self.data_dir, 'player_dvp_ratings.csv'), index=False)
        
        print("CSV files exported successfully!")
    
    def run_full_analysis(self):
        """Run the complete DVP analysis"""
        self.load_all_data()
        self.create_position_groups()
        self.calculate_team_defense_ratings()
        self.create_dvp_team_ratings()
        self.calculate_player_dvp_ratings()
        self.find_best_worst_matchups()
        
        # Generate and save report
        report = self.generate_report()
        
        # Save report to file
        with open(os.path.join(self.data_dir, 'DVP_Analysis_Report.txt'), 'w') as f:
            f.write(report)
        
        # Export CSV files
        self.export_detailed_csv()
        
        print("\nAnalysis complete! Files generated:")
        print("- DVP_Analysis_Report.txt")
        print("- team_dvp_ratings.csv") 
        print("- player_dvp_ratings.csv")
        
        return report

if __name__ == "__main__":
    # Run the analysis
    data_directory = "C:\\Users\\tia_r\\OneDrive\\Desktop\\DVPUSETHIS"
    analyzer = DVPAnalyzer(data_directory)
    
    try:
        report = analyzer.run_full_analysis()
        print("\n" + "="*50)
        print("ANALYSIS SUMMARY")
        print("="*50)
        print(f"Successfully analyzed DVP data!")
        print(f"Check the generated files for detailed results.")
        
    except Exception as e:
        print(f"Error running analysis: {str(e)}")
        import traceback
        traceback.print_exc()