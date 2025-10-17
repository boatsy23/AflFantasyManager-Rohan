import pandas as pd
import os

files = [f for f in os.listdir('player_stats_output/') if f.endswith('.xlsx')]
sample = files[:10]

for f in sample:
    try:
        xl = pd.ExcelFile(f'player_stats_output/{f}')
        print(f'{f}: {xl.sheet_names}')
    except Exception as e:
        print(f'{f}: ERROR - {e}')
