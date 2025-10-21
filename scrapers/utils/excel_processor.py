# src/scripts/utils/excel_processor.py
#!/usr/bin/env python3
"""
Utility functions for processing Excel files with player data
"""
import pandas as pd
import numpy as np
from pathlib import Path

def clean_excel_data(df):
    """Clean Excel dataframe by handling missing values and formatting"""
    # Replace NaN with None for JSON compatibility
    df = df.replace({np.nan: None})
    
    # Clean column names
    df.columns = [str(col).strip().replace(' ', '_').lower() for col in df.columns]
    
    # Remove completely empty rows
    df = df.dropna(how='all')
    
    return df

def extract_numeric_value(value):
    """Extract numeric value from mixed data"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        # Try to extract numbers from strings like "5.5 (60%)"
        numeric_part = value.split()[0] if ' ' in value else value
        try:
            return float(numeric_part)
        except ValueError:
            return None
    return None

def find_player_summary_files(directory):
    """Find all player summary Excel files in directory"""
    directory = Path(directory)
    excel_files = []
    
    for pattern in ["*.xlsx", "*.xls"]:
        excel_files.extend(directory.glob(pattern))
    
    return excel_files

def validate_player_data(player_data):
    """Validate that player data has required fields"""
    required_fields = ['name', 'team', 'position']
    return all(field in player_data for field in required_fields)