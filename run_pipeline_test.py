#!/usr/bin/env python3
"""
Non-interactive test run of AFL Fantasy Data Pipeline
"""

from data_pipeline import AFLFantasyDataPipeline

if __name__ == "__main__":
    pipeline = AFLFantasyDataPipeline()
    # Run in test mode with 3 players
    pipeline.run_full_pipeline(test_mode=True)
