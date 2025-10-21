# AFL Fantasy Manager - System Architecture

## ACTIVE COMPONENTS
- **Frontend**: React + TypeScript in `client/src/`
- **Backend**: Express + TypeScript in `public/server/`
- **Database**: PostgreSQL with Drizzle ORM  
- **Scrapers**: Python scripts (`dfs_parser.py`, `afl_fantasy_data_service.py`)

## WORKING FEATURES
- Player stats table with search/sort
- Team lineup management
- DVP analysis graphs
- Tools accordion page
- Basic navigation

## BROKEN FEATURES (NEED FIXING)
- Search bar in header
- User profile page integration
- Some tool APIs return empty data

## DATA FLOW
1. Python scrapers → Excel files in `raw_data/player_excel_files/`
2. Data processing → `public/server/data/master_player_stats.json`
3. Frontend calls → Backend APIs in `public/server/routes/`
4. Backend serves → React components

## FILE STRUCTURE
- `public/server/` = ACTIVE BACKEND
- `client/src/` = ACTIVE FRONTEND  
- `data/` = DATA FILES
- `shared/` = DATABASE SCHEMA
