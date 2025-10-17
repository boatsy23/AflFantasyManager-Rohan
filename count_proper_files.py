import pandas as pd
import os

files = [f for f in os.listdir('player_stats_output/') if f.endswith('.xlsx')]
proper_sheets = []
incomplete = []

for f in files:
    try:
        xl = pd.ExcelFile(f'player_stats_output/{f}')
        if 'Game Logs' in xl.sheet_names:
            proper_sheets.append(f)
        else:
            incomplete.append(f)
    except Exception as e:
        incomplete.append(f)

print(f"Files with Game Logs: {len(proper_sheets)}")
print(f"Incomplete/Error files: {len(incomplete)}")
print(f"\nTotal: {len(files)}")

if incomplete[:10]:
    print(f"\nFirst 10 incomplete files: {incomplete[:10]}")
