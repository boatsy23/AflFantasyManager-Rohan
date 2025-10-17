# AFL Fantasy Intelligence Platform - Complete File Inventory

## Purpose
This document catalogs every file in the project to identify obsolete files and understand the system architecture.

## Root Directory Files

### Configuration Files
- **package.json** - Node.js dependencies and scripts
- **package-lock.json** - Locked dependency versions
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build tool configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration
- **drizzle.config.ts** - Database ORM configuration
- **theme.json** - UI theme configuration
- **index.html** - Main HTML entry point

### Documentation Files
- **README.md** - Project documentation
- **replit.md** - User preferences and project summary
- **AFL_Fantasy_Platform_Documentation.txt** - Platform documentation
- **PROJECT_STRUCTURE.md** - Project architecture documentation
- **FILE_TREE_DOCUMENTATION.md** - File structure documentation
- **ENTERPRISE_MVP_TECHNICAL_DOCS.md** - Technical specifications
- **AFL_SCRAPER_README.md** - Scraper documentation
- **data-import-instructions.md** - Data import guide
- **DATA_INTEGRATION_README.md** - Data integration guide
- **COMPLETED_DATA_MAPPING_SUMMARY.md** - Data mapping documentation
- **SCORE_PREDICTOR_INTEGRATION.md** - Score prediction documentation
- **EXACT_JSON_STRUCTURE_REQUIRED.txt** - Data structure requirements
- **NEED_TO_FIX.md** - Known issues list
- **NEED_TO_FIX.mdNEED_TO_FIX.md** - **OBSOLETE DUPLICATE**

### Data Files
- **dvp_matrix.json** - Defense vs Position matchup data (ACTIVE)
- **player_data.json** - Legacy player data (POTENTIALLY OBSOLETE - replaced by master_player_stats.json)
- **user_team.json** - User team data
- **test_team.txt** - Test team configuration
- **dfs_dvp_stats.csv** - Fresh DVP statistics

### Excel Data Files
- **DVP_Matchup_Data.xlsx** - DVP matchup analysis data (ACTIVE)
- **AFL_Fantasy_Player_URLs.xlsx** - Player URL mappings

### Python Data Processing Scripts

#### Core Data Integration (ACTIVE)
- **complete_data_overhaul.py** - Complete data processing overhaul
- **player_data_integrator.py** - Player data integration system
- **extract_and_convert.py** - Data extraction and conversion
- **dfs_australia_parser.py** - DFS Australia data parser
- **update_player_data.py** - Player data updater

#### Web Scrapers (ACTIVE)
- **dfs_player_scraper.py** - DFS player data scraper
- **dfs_fantasy_bigboard_scraper.py** - DFS Fantasy bigboard scraper
- **simple_dfs_scraper.py** - Simplified DFS scraper
- **footywire_scraper.py** - FootyWire data scraper
- **quick_player_team_scraper.py** - Quick player/team scraper
- **fixture_scraper.py** - Fixture data scraper
- **dvp_matrix_scraper.py** - DVP data scraper (ACTIVE)

#### Fantasy Tool APIs (LEGACY - mostly replaced by TypeScript)
- **captain_api.py** - Captain selection API (POTENTIALLY OBSOLETE)
- **captain_tools.py** - Captain analysis tools (POTENTIALLY OBSOLETE)
- **cash_api.py** - Cash generation API (POTENTIALLY OBSOLETE)
- **cash_tools.py** - Cash analysis tools (POTENTIALLY OBSOLETE)
- **cash_tools_runner.py** - Cash tools runner (POTENTIALLY OBSOLETE)
- **price_tools.py** - Price analysis tools (POTENTIALLY OBSOLETE)
- **risk_api.py** - Risk analysis API (POTENTIALLY OBSOLETE)
- **risk_tools.py** - Risk analysis tools (POTENTIALLY OBSOLETE)
- **role_tools.py** - Role analysis tools (POTENTIALLY OBSOLETE)
- **trade_api.py** - Trade analysis API (POTENTIALLY OBSOLETE)
- **context_tools.py** - Context analysis tools (POTENTIALLY OBSOLETE)
- **fixture_tools.py** - Fixture analysis tools (POTENTIALLY OBSOLETE)
- **ai_tools.py** - AI analysis tools (POTENTIALLY OBSOLETE)

#### Utility Scripts
- **team_uploader.py** - Team data uploader
- **scheduler.py** - Task scheduler
- **check_scheduler.py** - Scheduler health check

### JavaScript/TypeScript Integration
- **footywire_js_scraper.js** - FootyWire JavaScript scraper
- **captain-api.ts** - TypeScript captain API (ACTIVE - replaces Python version)

## Server Directory (/server)

### Core Services (ACTIVE)
- **index.ts** - Main server entry point
- **routes.ts** - Main API routes
- **storage.ts** - Data storage interface
- **vite.ts** - Vite development server integration

### Data Services (ACTIVE)
- **services/MasterDataService.ts** - Centralized data service with DVP integration
- **services/scoreProjector.ts** - v3.4.4 score projection algorithm
- **services/pricePredictor.ts** - Price prediction service
- **services/projectedScore.ts** - Score projection utilities
- **services/fixtureProcessor.ts** - Fixture data processing

### API Routes (ACTIVE)
- **routes/master-stats-routes.ts** - Master statistics API
- **routes/score-projection-routes.ts** - Score projection API
- **routes/stats-routes.ts** - Statistics API
- **routes/stats-tools-routes.ts** - Statistics tools API
- **routes/afl-data-routes.ts** - AFL data API
- **routes/algorithm-routes.ts** - Algorithm API
- **routes/champion-data-routes.ts** - Champion Data API
- **routes/data-integration-routes.ts** - Data integration API

### Fantasy Tools (ACTIVE - TypeScript implementations)
- **fantasy-tools/index.ts** - Fantasy tools entry point
- **fantasy-tools/price-tools.ts** - Price analysis tools
- **fantasy-tools/trade-tools.ts** - Trade analysis tools
- **fantasy-tools/trade-score-calculator.ts** - Trade score calculator
- **fantasy-tools/risk-direct.ts** - Risk analysis tools
- **fantasy-tools/utils.ts** - Fantasy tools utilities
- **fantasy-tools/trade/one-up-one-down-suggester.ts** - Trade suggester
- **fantasy-tools/trade/price-difference-delta.ts** - Price difference calculator

### Legacy API Files (POTENTIALLY OBSOLETE)
- **captain-api.ts** - Captain API (replaced by fantasy-tools)
- **price-api.ts** - Price API (replaced by fantasy-tools)
- **team-api.ts** - Team API
- **role-api.ts** - Role API
- **fixture-api.ts** - Fixture API
- **fantasy-tools.ts** - Legacy fantasy tools

### Data Processing (ACTIVE)
- **data/master_player_stats.json** - Master player statistics database
- **data/user_team.json** - User team data
- **create_master_stats.py** - Master statistics creator
- **afl_fantasy_api.py** - AFL Fantasy API integration
- **afl_fantasy_data_service.py** - AFL Fantasy data service
- **integrate_venue_opponent_stats.py** - Venue/opponent integration
- **simple_venue_opponent_integration.py** - Simplified venue integration

### Utilities (ACTIVE)
- **utils/dataImporter.ts** - Data import utilities
- **utils/data-scrapers.ts** - Data scraping utilities
- **utils/excelConverter.ts** - Excel conversion utilities
- **matchup-data-processor.ts** - DVP matchup processing
- **footywire-integration.ts** - FootyWire integration
- **types/fantasy-tools.ts** - Fantasy tools type definitions

## Client Directory (/client)

### Core Application (ACTIVE)
- **src/App.tsx** - Main React application
- **src/main.tsx** - Application entry point
- **src/index.css** - Global styles
- **index.html** - Client HTML template

### Pages (ACTIVE)
- **src/pages/dashboard.tsx** - Dashboard page
- **src/pages/stats.tsx** - Statistics page
- **src/pages/player-stats.tsx** - Player statistics page
- **src/pages/fantasy-tools.tsx** - Fantasy tools page
- **src/pages/tools-accordion.tsx** - Tools accordion page
- **src/pages/tools-simple.tsx** - Simple tools page
- **src/pages/trade-analyzer.tsx** - Trade analyzer page
- **src/pages/team-page.tsx** - Team management page
- **src/pages/lineup.tsx** - Team lineup page
- **src/pages/leagues.tsx** - Leagues page
- **src/pages/profile.tsx** - User profile page
- **src/pages/preview-tool.tsx** - Tool preview page
- **src/pages/not-found.tsx** - 404 error page

### Components - UI Library (ACTIVE)
**src/components/ui/** - Complete shadcn/ui component library (47 components)
- All standard UI components (buttons, forms, tables, etc.)

### Components - Player Statistics (ACTIVE)
- **src/components/player-stats/player-stats-table.tsx** - Player statistics table
- **src/components/player-stats/enhanced-stats-table.tsx** - Enhanced statistics table
- **src/components/player-stats/heat-map-view.tsx** - Heat map visualization
- **src/components/player-stats/player-detail-modal.tsx** - Player detail modal
- **src/components/player-stats/filter-bar.tsx** - Statistics filter bar
- **src/components/player-stats/category-selector.tsx** - Category selection
- **src/components/player-stats/score-breakdown-module.tsx** - Score breakdown
- **src/components/player-stats/simple-player-table.tsx** - Simple player table
- **src/components/player-stats/player-table.tsx** - Player table component
- **src/components/player-stats/stats-key.tsx** - Statistics key
- **src/components/player-stats/collapsible-stats-key.tsx** - Collapsible stats key

### Components - Fantasy Tools (ACTIVE)
Organized by tool category with comprehensive coverage:

#### Price Tools
- **src/components/tools/price/** - 7 price analysis components

#### Trade Tools  
- **src/components/tools/trade/** - 10 trade analysis components

#### Captain Tools
- **src/components/tools/captain/** - 4 captain selection components

#### Cash Generation Tools
- **src/components/tools/cash/** - 9 cash flow components

#### Risk Analysis Tools
- **src/components/tools/risk/** - 6 risk assessment components

#### Fixture Analysis Tools
- **src/components/tools/fixture/** - 6 fixture analysis components (with DVP integration)

#### Context Tools
- **src/components/tools/context/** - 6 contextual analysis components

#### AI Tools
- **src/components/tools/ai/** - 4 AI-powered analysis components

#### Role Tools
- **src/components/tools/role/** - 2 role analysis components

#### Alert Tools
- **src/components/tools/alerts/** - 3 alert management components

### Components - Layout & Navigation (ACTIVE)
- **src/components/layout/** - Layout components
- **src/components/dashboard/** - Dashboard components
- **src/components/lineup/** - Team lineup components (4 components)
- **src/components/trade/** - Trade analyzer components
- **src/components/leagues/** - Leagues management

### Services (ACTIVE)
- **src/services/** - 9 service modules for API communication

### Utilities & Constants (ACTIVE)
- **src/utils/** - Utility functions and team utilities
- **src/constants/** - Application constants (teams, positions)
- **src/hooks/** - React hooks (toast, mobile)
- **src/lib/** - Library utilities (query client, utils)

### Legacy Files (POTENTIALLY OBSOLETE)
- **src/legacy/App.tsx.bak** - Backup of old App component
- **src/legacy/heat-map-view.tsx.rollback** - Rollback version
- **src/legacy/new-player-stats.tsx** - Legacy player stats
- **src/legacy/player-stats-redesign.tsx** - Legacy redesign
- **src/legacy/stats.tsx.fixed** - Fixed stats component

## Data Directories

### Master Data (ACTIVE)
- **server/data/master_player_stats.json** - Primary player database (535 players)
- **attached_assets/fantasy_metrics_2025_1755916866519.json** - Fantasy metrics data
- **attached_assets/fantasy_value_index_2025_1755916866520.json** - Value index data
- **attached_assets/afl_fixture_2025_1753111987231.json** - 2025 AFL fixture

### Backup Data (ARCHIVAL)
- **data/backups/** - 20+ backup files and team configurations
- **data/core/** - Legacy core data files (potentially obsolete)

### Extracted Player Data (POTENTIALLY OBSOLETE)
- **extracted_player_data/dfs_player_summary_json/** - Individual JSON files for 400+ players
- **extracted_player_data/combined_player_data.json** - Combined player data

### Attached Assets (MIXED)
- **attached_assets/** - 200+ files including screenshots, CSVs, scrapers, and data files
  - Many appear to be temporary uploads and screenshots (POTENTIALLY OBSOLETE)
  - Core data files are still active

## System Directories (SYSTEM)
- **.cache/** - Cache files and dependencies
- **.pythonlibs/** - Python library dependencies
- **.local/** - Local state and configuration
- **.config/** - Configuration files
- **.upm/** - Package manager store

## Obsolete File Analysis

### Definitely Obsolete
1. **NEED_TO_FIX.mdNEED_TO_FIX.md** - Duplicate file
2. **Legacy Python APIs** - Replaced by TypeScript implementations
3. **Individual player JSON files** - Consolidated into master database
4. **Temporary screenshots** - 100+ screenshot files in attached_assets
5. **Old backup files** - Multiple backup versions

### Potentially Obsolete
1. **player_data.json** (root) - May be replaced by master_player_stats.json
2. **Legacy components** in src/legacy/
3. **Old Python scraper variants** - Multiple similar scrapers
4. **Duplicate team/player data files**

### Files to Keep
1. **Master data files** - master_player_stats.json, DVP data
2. **Active TypeScript/React components**
3. **Configuration files**
4. **Documentation files**
5. **Current scraper and processing scripts**

## Recommendations for Cleanup
1. Remove duplicate files and legacy Python APIs
2. Consolidate similar scraper scripts
3. Archive old screenshots and temporary files
4. Clean up backup directories
5. Update documentation to reflect current architecture