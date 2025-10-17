#!/usr/bin/env python3
"""
Analyze AFL Fantasy Value Index
==============================

Analyzes the price-to-point ratio data to understand:
1. Break-even goal of aligning price with average
2. Time on ground discounts for <50% TOG
3. How value index explains our break-even discrepancies
"""

import json
import statistics
from pathlib import Path
from validate_price_formula import load_round_data

def analyze_value_index():
    """Analyze the value index data for break-even insights"""
    print("💎 AFL FANTASY VALUE INDEX ANALYSIS")
    print("=" * 60)
    
    # Load the value index data
    value_index_file = Path("attached_assets/fantasy_value_index_2025_1759028354983.json")
    
    if not value_index_file.exists():
        print("❌ Value index file not found")
        return
    
    with open(value_index_file, 'r') as f:
        value_data = json.load(f)
    
    print(f"📊 Loaded value index data")
    
    # Show structure of the data
    if isinstance(value_data, dict):
        print(f"Data keys: {list(value_data.keys())}")
        
        # Look for player data
        if 'players' in value_data:
            players = value_data['players']
            print(f"Number of players: {len(players)}")
            
            # Show sample player data
            sample_player = next(iter(players.values())) if players else {}
            print(f"Sample player data structure: {list(sample_player.keys()) if sample_player else 'No players'}")
        
        # Look for any other relevant data
        for key, value in value_data.items():
            if key != 'players':
                print(f"{key}: {type(value)}")
    
    # Load break-even data for comparison
    breakeven_file = Path("data/historical/break_evens_round_23.json")
    if breakeven_file.exists():
        with open(breakeven_file, 'r') as f:
            breakeven_data = json.load(f)
        
        print(f"\n🔍 ANALYZING PRICE-TO-POINT RELATIONSHIPS:")
        print("-" * 70)
        
        # Extract relevant data for analysis
        analysis_data = []
        
        if 'players' in value_data and 'players' in breakeven_data:
            value_players = value_data['players']
            be_players = breakeven_data['players']
            
            print("Player              | Price | Avg | Price/Pt | Break-Even | TOG% | Value")
            print("-" * 70)
            
            # Find matching players
            for player_key, be_data in be_players.items():
                player_name = be_data.get('name', '')
                
                # Find matching player in value index
                value_player_data = None
                for val_key, val_data in value_players.items():
                    if val_data.get('name', '') == player_name:
                        value_player_data = val_data
                        break
                
                if value_player_data:
                    price = be_data.get('price', 0)
                    average = be_data.get('average', 0)
                    breakeven = be_data.get('break_even', 0)
                    value = be_data.get('value', 0)
                    
                    # Get additional data from value index
                    tog_pct = value_player_data.get('time_on_ground_pct', 0)
                    if tog_pct == 0:
                        tog_pct = value_player_data.get('tog', 0)
                    
                    price_per_point = price / average if average > 0 else 0
                    
                    analysis_data.append({
                        'name': player_name,
                        'price': price,
                        'average': average,
                        'price_per_point': price_per_point,
                        'breakeven': breakeven,
                        'tog_pct': tog_pct,
                        'value': value
                    })
                    
                    # Show sample data
                    if len(analysis_data) <= 20:  # Show first 20
                        print(f"{player_name[:18]:18s} | "
                              f"${price//1000:3.0f}k | "
                              f"{average:3.0f} | "
                              f"${price_per_point:7.0f} | "
                              f"{breakeven:9.1f} | "
                              f"{tog_pct:4.0f}% | "
                              f"{value:5.1f}")
        
        if analysis_data:
            print(f"\n📈 VALUE INDEX INSIGHTS:")
            print("-" * 50)
            
            # Analyze price-per-point distribution
            price_per_points = [d['price_per_point'] for d in analysis_data if d['price_per_point'] > 0]
            if price_per_points:
                avg_ppp = statistics.mean(price_per_points)
                median_ppp = statistics.median(price_per_points)
                print(f"Average price per point: ${avg_ppp:,.0f}")
                print(f"Median price per point: ${median_ppp:,.0f}")
            
            # Check TOG discount hypothesis
            low_tog_players = [d for d in analysis_data if d['tog_pct'] > 0 and d['tog_pct'] < 50]
            high_tog_players = [d for d in analysis_data if d['tog_pct'] >= 50]
            
            if low_tog_players and high_tog_players:
                low_tog_be = [p['breakeven'] for p in low_tog_players if p['breakeven'] > 0]
                high_tog_be = [p['breakeven'] for p in high_tog_players if p['breakeven'] > 0]
                
                if low_tog_be and high_tog_be:
                    avg_low_be = statistics.mean(low_tog_be)
                    avg_high_be = statistics.mean(high_tog_be)
                    
                    print(f"\n⚽ TIME ON GROUND ANALYSIS:")
                    print(f"Low TOG (<50%) players: {len(low_tog_players)}")
                    print(f"High TOG (≥50%) players: {len(high_tog_players)}")
                    print(f"Average break-even (low TOG): {avg_low_be:.1f}")
                    print(f"Average break-even (high TOG): {avg_high_be:.1f}")
                    
                    if avg_low_be < avg_high_be:
                        discount = avg_high_be - avg_low_be
                        print(f"✅ TOG DISCOUNT CONFIRMED: {discount:.1f} point advantage for low TOG!")
                    else:
                        print("❌ No clear TOG discount detected")
            
            # Check break-even vs average alignment
            alignment_analysis = []
            for player in analysis_data:
                if player['average'] > 0 and player['breakeven'] > 0:
                    difference = abs(player['breakeven'] - player['average'])
                    alignment_analysis.append({
                        'name': player['name'],
                        'average': player['average'],
                        'breakeven': player['breakeven'],
                        'difference': difference,
                        'alignment_pct': 100 - (difference / player['average'] * 100)
                    })
            
            if alignment_analysis:
                print(f"\n🎯 BREAK-EVEN vs AVERAGE ALIGNMENT:")
                print("-" * 60)
                
                differences = [a['difference'] for a in alignment_analysis]
                alignment_pcts = [a['alignment_pct'] for a in alignment_analysis]
                
                avg_diff = statistics.mean(differences)
                avg_alignment = statistics.mean(alignment_pcts)
                
                print(f"Average difference between break-even and average: {avg_diff:.1f} points")
                print(f"Average alignment percentage: {avg_alignment:.1f}%")
                
                # Show best and worst alignments
                alignment_analysis.sort(key=lambda x: x['alignment_pct'], reverse=True)
                
                print(f"\nBest aligned (break-even ≈ average):")
                for player in alignment_analysis[:5]:
                    print(f"  {player['name'][:20]:20s}: BE {player['breakeven']:5.1f}, Avg {player['average']:5.1f} ({player['alignment_pct']:5.1f}%)")
                
                print(f"\nWorst aligned (break-even ≠ average):")
                for player in alignment_analysis[-5:]:
                    print(f"  {player['name'][:20]:20s}: BE {player['breakeven']:5.1f}, Avg {player['average']:5.1f} ({player['alignment_pct']:5.1f}%)")
                
                # Check if break-evens are generally trying to align with averages
                well_aligned = sum(1 for a in alignment_analysis if a['alignment_pct'] > 80)
                total = len(alignment_analysis)
                
                print(f"\nPlayers with break-even within 20% of average: {well_aligned}/{total} ({well_aligned/total*100:.1f}%)")
                
                if well_aligned/total > 0.6:
                    print("✅ HYPOTHESIS CONFIRMED: Break-evens are aligning with averages!")
                else:
                    print("❌ Break-evens not strongly aligned with averages")
            
            # Save comprehensive analysis
            analysis_results = {
                'analysis_date': '2025-09-28',
                'total_players_analyzed': len(analysis_data),
                'avg_price_per_point': avg_ppp if price_per_points else 0,
                'tog_discount_detected': avg_low_be < avg_high_be if low_tog_be and high_tog_be else False,
                'avg_breakeven_average_difference': avg_diff if alignment_analysis else 0,
                'average_alignment_percentage': avg_alignment if alignment_analysis else 0,
                'players_well_aligned_pct': well_aligned/total*100 if alignment_analysis else 0,
                'detailed_analysis': analysis_data
            }
            
            results_file = Path("data/historical/value_index_analysis.json")
            with open(results_file, 'w') as f:
                json.dump(analysis_results, f, indent=2)
            
            print(f"\n💾 Analysis saved to: {results_file}")
            
            return analysis_results
    
    return None

if __name__ == "__main__":
    analyze_value_index()