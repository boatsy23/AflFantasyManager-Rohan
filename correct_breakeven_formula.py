#!/usr/bin/env python3
"""
Correct AFL Fantasy Break-Even Based Pricing
============================================

Implements the true AFL pricing system:
1. Calculate break-even using weighted 5-round formula
2. Compare actual Round 23 score to break-even
3. Price change based on difference (with protection/caps)
"""

import json
import statistics
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from improved_pricing_formula import ImprovedAFLPricingProcessor
from validate_price_formula import load_round_data

class BreakEvenPricingProcessor:
    """Correct AFL pricing using break-even methodology"""
    
    def __init__(self):
        self.round_weights = [0.083, 0.067, 0.050, 0.033, 0.017]  # Base weights
        self.magic_numbers = {
            23: 9736,  # Round-specific magic numbers
            22: 9750,
            21: 9800
        }
        
        # Price effect thresholds (from our optimization)
        self.low_price_threshold = 300000
        self.high_price_threshold = 1300000
        
        # Break-even to price change conversion factors
        self.price_per_point = 300  # Roughly $300 per point above/below break-even
        self.protection_threshold = 10  # Points within ±10 might get protection
    
    def calculate_breakeven_score(self, current_price: float, recent_scores: List[float], round_num: int = 23) -> float:
        """
        Calculate the break-even score needed to maintain current price
        This uses the weighted formula to find what score gives $0 change
        """
        if len(recent_scores) < 3:
            return 0
        
        # Pad to 5 scores if needed
        scores = recent_scores.copy()
        while len(scores) < 5:
            avg_score = sum(scores) / len(scores)
            scores.append(avg_score)
        
        # Calculate weighted average of recent scores
        weighted_avg = sum(score * weight for score, weight in zip(scores, self.round_weights))
        
        # Get magic number for this round
        magic_number = self.magic_numbers.get(round_num, 9736)
        
        # Break-even is the score that would result in current price
        # Formula: new_price = old_price + (weighted_avg - breakeven_score) * magic_number / 5000
        # For break-even: new_price = old_price, so: 0 = (weighted_avg - breakeven_score) * magic_number / 5000
        # Therefore: breakeven_score = weighted_avg
        
        # But AFL adjusts this based on current price for the magic number effect
        price_factor = current_price / 600000  # Normalize around $600k
        adjusted_magic = magic_number * price_factor
        
        # The break-even score is what makes the price change zero
        breakeven_score = weighted_avg
        
        return round(breakeven_score, 1)
    
    def calculate_price_change_from_breakeven(self, current_price: float, actual_score: float, 
                                            breakeven_score: float) -> float:
        """
        Calculate price change based on actual score vs break-even
        """
        score_difference = actual_score - breakeven_score
        
        # Base price change
        base_change = score_difference * self.price_per_point
        
        # Apply price-based adjustments (killer/cap effects)
        if current_price < self.low_price_threshold:
            # Rookie protection - bigger rises, smaller drops
            if base_change > 0:
                adjustment_factor = 1.4  # 40% bigger rises
            else:
                adjustment_factor = 0.7  # 30% smaller drops
        elif current_price > self.high_price_threshold:
            # Premium cap - smaller rises, bigger drops  
            if base_change > 0:
                adjustment_factor = 0.6  # 40% smaller rises
            else:
                adjustment_factor = 1.2  # 20% bigger drops
        else:
            # Standard range
            adjustment_factor = 1.0
        
        adjusted_change = base_change * adjustment_factor
        
        # Price protection for small differences
        if abs(score_difference) <= self.protection_threshold:
            # AFL often protects players within ±10 points of break-even
            protection_chance = 0.4  # 40% chance of protection
            if abs(adjusted_change) < 15000:  # Small changes get higher protection
                adjusted_change = 0
        
        # Calculate new price
        new_price = current_price + adjusted_change
        new_price = max(new_price, 200000)  # Minimum price floor
        
        return round(new_price, 0)

def test_breakeven_system():
    """Test the break-even based system against real data"""
    print("🎯 TESTING BREAK-EVEN BASED PRICING SYSTEM")
    print("=" * 70)
    
    # Load data
    round22_data = load_round_data(22)
    round23_data = load_round_data(23)
    
    # Load break-even data for validation
    breakeven_file = Path("data/historical/break_evens_round_23.json")
    with open(breakeven_file, 'r') as f:
        breakeven_data = json.load(f)
    
    processor = BreakEvenPricingProcessor()
    
    # Test on sample players
    common_players = list(set(round22_data.keys()) & set(round23_data.keys()))[:50]
    
    print("🔍 TESTING BREAK-EVEN CALCULATION vs AFL BREAK-EVENS:")
    print("-" * 70)
    print("Player              | Our BE | AFL BE | Diff | Actual Score | Predicted Δ | Actual Δ | Error")
    print("-" * 70)
    
    test_results = []
    
    for player_name in common_players:
        try:
            r22_player = round22_data[player_name]
            r23_player = round23_data[player_name]
            
            r22_price = r22_player.get('price', 0)
            r23_price = r23_player.get('price', 0)
            actual_change = r23_price - r22_price
            
            if r22_price == 0 or r23_price == 0:
                continue
            
            # Get recent scores for break-even calculation
            scores = []
            rounds_needed = [22, 21, 20, 19, 18, 17, 16, 15, 14, 13]
            
            for round_num in rounds_needed:
                if len(scores) >= 5:
                    break
                round_data = load_round_data(round_num)
                if player_name in round_data:
                    score = round_data[player_name].get('round_score', 0)
                    if score > 0:
                        scores.append(score)
            
            if len(scores) < 3:
                continue
            
            # Calculate our break-even
            our_breakeven = processor.calculate_breakeven_score(r22_price, scores, round_num=23)
            
            # Get AFL's break-even
            display_name = r22_player.get('name', player_name)
            afl_breakeven = 0
            actual_r23_score = 0
            
            # Find in break-even data
            for player_key, player_data in breakeven_data.get('players', {}).items():
                if player_data.get('name', '') == display_name:
                    afl_breakeven = player_data.get('break_even', 0)
                    actual_r23_score = player_data.get('round_score', 0)
                    break
            
            if afl_breakeven == 0 or actual_r23_score == 0:
                continue
            
            # Calculate price change using our system
            predicted_new_price = processor.calculate_price_change_from_breakeven(
                r22_price, actual_r23_score, our_breakeven
            )
            predicted_change = predicted_new_price - r22_price
            error = abs(actual_change - predicted_change)
            
            test_results.append({
                'name': display_name,
                'our_breakeven': our_breakeven,
                'afl_breakeven': afl_breakeven,
                'breakeven_diff': our_breakeven - afl_breakeven,
                'actual_score': actual_r23_score,
                'predicted_change': predicted_change,
                'actual_change': actual_change,
                'error': error
            })
            
            # Print results
            print(f"{display_name[:18]:18s} | "
                  f"{our_breakeven:6.1f} | "
                  f"{afl_breakeven:6.1f} | "
                  f"{our_breakeven - afl_breakeven:+4.1f} | "
                  f"{actual_r23_score:11.0f} | "
                  f"${predicted_change:+10,.0f} | "
                  f"${actual_change:+8,.0f} | "
                  f"${error:6,.0f}")
            
        except Exception as e:
            continue
    
    if test_results:
        print(f"\n📊 BREAK-EVEN SYSTEM ANALYSIS:")
        print("-" * 50)
        
        # Break-even accuracy
        be_errors = [abs(r['breakeven_diff']) for r in test_results]
        avg_be_error = statistics.mean(be_errors)
        
        # Price prediction accuracy
        price_errors = [r['error'] for r in test_results]
        avg_price_error = statistics.mean(price_errors)
        max_price_error = max(price_errors)
        
        within_3k = sum(1 for e in price_errors if e <= 3000)
        
        print(f"Tests completed: {len(test_results)}")
        print(f"Average break-even error: {avg_be_error:.1f} points")
        print(f"Average price error: ${avg_price_error:,.0f}")
        print(f"Max price error: ${max_price_error:,.0f}")
        print(f"Within ±$3k target: {within_3k}/{len(test_results)} ({within_3k/len(test_results)*100:.1f}%)")
        
        # Save results
        results_data = {
            'test_date': '2025-09-28',
            'system_type': 'breakeven_based_pricing',
            'tests_completed': len(test_results),
            'avg_breakeven_error_points': avg_be_error,
            'avg_price_error': avg_price_error,
            'max_price_error': max_price_error,
            'within_target_count': within_3k,
            'within_target_pct': within_3k/len(test_results)*100,
            'detailed_results': test_results
        }
        
        results_file = Path("data/historical/breakeven_system_validation.json")
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"\n💾 Results saved to: {results_file}")
        
        if within_3k/len(test_results) > 0.8:  # 80%+ within target
            print(f"\n🎉 EXCELLENT! Break-even system achieves high accuracy!")
        elif avg_price_error < 20000:
            print(f"\n✅ Good results! System shows strong performance.")
        else:
            print(f"\n📈 System needs further calibration of conversion factors.")
    
    return test_results

if __name__ == "__main__":
    test_breakeven_system()