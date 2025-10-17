[# AFL Fantasy Intelligence Platform - Master File Tree Documentation
](https://replit.com/@rohanbrownis/AflFantasyManager#src/components/tools/cash/buy-sell-timing-tool.tsx)

**Generated:** September 6, 2025  
**Purpose:** Complete inventory of all project files with purpose, data sources, and integration status  

## Legend

**Status:**  
- ✅ **Integrated** - Uses MasterDataService, fully integrated with current architecture  
- 🟡 **Partial/Mock** - Uses mock/hardcoded data, needs integration  
- ❌ **Not Integrated** - Reads directly from files, legacy approach  
- 🗑️ **Obsolete** - Legacy/unused files, candidate for cleanup  
- 📋 **Config** - Configuration and build files  
- 📁 **Asset** - Data files, images, documentation  

---

## ROOT LEVEL

### ./package.json
**Purpose:** Node.js package configuration and dependencies  
**Data Source:** N/A (configuration)  
**Status:** 📋 Config  

### ./tsconfig.json
**Purpose:** TypeScript compiler configuration  
**Data Source:** N/A (configuration)  
**Status:** 📋 Config  

### ./vite.config.ts
**Purpose:** Vite build system configuration  
**Data Source:** N/A (configuration)  
**Status:** 📋 Config  
buy-sell
### ./tailwind.config.ts
**Purpose:** Tailwind CSS configuration  
**Data Source:** N/A (configuration)  
**Status:** 📋 Config  

### ./theme.json
**Purpose:** Shadcn/UI theme configuration  
**Data Source:** N/A (configuration)  
**Status:** 📋 Config  

### ./user_team.json
**Purpose:** User team data storage  
**Data Source:** Direct JSON file access  
**Status:** ❌ Not Integrated  

### ./.upm/store.json
**Purpose:** Package manager metadata  
**Data Source:** N/A (system)  
**Status:** 📋 Config  

---

## SHARED LAYER

### ./shared/schema.ts
**Purpose:** Database schemas and types for the entire application  
**Data Source:** PostgreSQL via Drizzle ORM  
**Status:** ✅ Integrated  

---

## SERVER ARCHITECTURE

### ./server/index.ts
**Purpose:** Main server entry point and application initialization  
**Data Source:** Various APIs and services  
**Status:** ✅ Integrated  

### ./server/storage.ts
**Purpose:** Storage abstraction layer  
**Data Source:** PostgreSQL via Drizzle  
**Status:** ✅ Integrated  

### ./server/routes.ts
**Purpose:** Main API route definitions  
**Data Source:** Various services  
**Status:** ✅ Integrated  

### ./server/team-api.ts
**Purpose:** Team management API endpoints  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/vite.ts
**Purpose:** Vite development server integration  
**Data Source:** N/A (build system)  
**Status:** 📋 Config  

---

## SERVER SERVICES

### ./server/services/MasterDataService.ts
**Purpose:** **CORE SERVICE** - Centralized data access for all player stats from master_player_stats.json  
**Data Source:** master_player_stats.json, DVP data  
**Status:** ✅ Integrated  

### ./server/services/fixtureProcessor.ts
**Purpose:** AFL fixture data processing  
**Data Source:** Fixture JSON files  
**Status:** ✅ Integrated  

### ./server/services/pricePredictor.ts
**Purpose:** Price prediction algorithms  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/services/projectedScore.ts
**Purpose:** Score projection calculations  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/services/scoreProjector.ts
**Purpose:** Advanced score projection service  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

---

## SERVER ROUTES

### ./server/routes/master-stats-routes.ts
**Purpose:** Master statistics API endpoints  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/stats-routes.ts
**Purpose:** General statistics API  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/stats-tools-routes.ts
**Purpose:** Advanced statistics tools API  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/score-projection-routes.ts
**Purpose:** Score projection API endpoints  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/afl-data-routes.ts
**Purpose:** AFL data integration API  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/ai-routes.ts
**Purpose:** AI-powered analysis tools  
**Data Source:** MasterDataService + OpenAI  
**Status:** ✅ Integrated  

### ./server/routes/algorithm-routes.ts
**Purpose:** Algorithm-based analysis endpoints  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/champion-data-routes.ts
**Purpose:** Champion Data integration  
**Data Source:** External Champion Data API  
**Status:** ✅ Integrated  

### ./server/routes/context-routes.ts
**Purpose:** Context analysis tools  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

### ./server/routes/data-integration-routes.ts
**Purpose:** Data integration management  
**Data Source:** Multiple external sources  
**Status:** ✅ Integrated  

### ./server/routes/risk-routes.ts
**Purpose:** Risk analysis tools  
**Data Source:** MasterDataService  
**Status:** ✅ Integrated  

---

## SERVER DATA

### ./server/data/master_player_stats.json
**Purpose:** **MASTER DATA FILE** - Primary source of all player statistics and projections  
**Data Source:** Generated from scripts in /src/scripts/  
**Status:** ✅ Integrated  

### ./server/data/user_team.json
**Purpose:** User team storage (legacy)  
**Data Source:** Direct file access  
**Status:** ❌ Not Integrated  

---

## SERVER UTILITIES

### ./server/utils/dataImporter.ts
**Purpose:** Data import utilities  
**Data Source:** Various file formats  
**Status:** ✅ Integrated  

### ./server/utils/data-scrapers.ts
**Purpose:** Web scraping utilities  
**Data Source:** External websites  
**Status:** ✅ Integrated  

### ./server/utils/excelConverter.ts
**Purpose:** Excel file processing  
**Data Source:** Excel/CSV files  
**Status:** ✅ Integrated  

### ./server/types/fantasy-tools.ts
**Purpose:** TypeScript types for fantasy tools  
**Data Source:** N/A (type definitions)  
**Status:** ✅ Integrated  

---

## CLIENT ARCHITECTURE

### ./client/src/App.tsx
**Purpose:** Main React application component and routing  
**Data Source:** API endpoints  
**Status:** ✅ Integrated  

### ./client/src/main.tsx
**Purpose:** React application entry point  
**Data Source:** N/A (bootstrap)  
**Status:** ✅ Integrated  

### ./client/src/index.css
**Purpose:** Global CSS styles  
**Data Source:** N/A (styling)  
**Status:** ✅ Integrated  

---

## CLIENT PAGES

### ./client/src/pages/dashboard.tsx
**Purpose:** Main dashboard page  
**Data Source:** API endpoints via React Query  
**Status:** 🟡 Partial/Mock (has samplePerformanceData error)  

### ./client/src/pages/player-stats.tsx
**Purpose:** Player statistics display  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/fantasy-tools.tsx
**Purpose:** Fantasy analysis tools  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/leagues.tsx
**Purpose:** League management interface  
**Data Source:** Database via API  
**Status:** ✅ Integrated  

### ./client/src/pages/lineup.tsx
**Purpose:** Team lineup management  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/stats.tsx
**Purpose:** Advanced statistics page  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/team-page.tsx
**Purpose:** Team management page  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/trade-analyzer.tsx
**Purpose:** Trade analysis interface  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/tools-accordion.tsx
**Purpose:** Tools accordion interface  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/tools-simple.tsx
**Purpose:** Simplified tools interface  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/preview-tool.tsx
**Purpose:** Tool preview interface  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/pages/profile.tsx
**Purpose:** User profile management  
**Data Source:** Database via API  
**Status:** ✅ Integrated  

### ./client/src/pages/not-found.tsx
**Purpose:** 404 error page  
**Data Source:** N/A (static)  
**Status:** ✅ Integrated  

---

## CLIENT COMPONENTS - TOOLS

### Captain Analysis Tools
**Path:** ./client/src/components/tools/captain/  
**Status:** ✅ Integrated  

- **captain-score-predictor.tsx** - Captain selection predictions using MasterDataService
- **loop-hole.tsx** - Loop hole strategy calculator  
- **index.ts** - Export definitions

### Cash Generation Tools
**Path:** ./client/src/components/tools/cash/  
**Status:** ✅ Integrated  

- **cash-generation-tracker.tsx** - Cash flow tracking from MasterDataService
- **price-predictor-calculator.tsx** - Price prediction algorithms
- **value-tracker.tsx** - Player value analysis
- **buy-sell-timing-tool.tsx** - Optimal trading timing
- **cash-ceiling-floor-tracker.tsx** - Price ceiling/floor analysis  
- **downgrade-target-finder.tsx** - Downgrade target identification
- **price-score-scatter.tsx** - Price vs score visualization
- **index.ts** - Export definitions

### Fixture Analysis Tools  
**Path:** ./client/src/components/tools/fixture/  
**Status:** ✅ Integrated  

- **fixture-swing-radar.tsx** - Fixture swing analysis from MasterDataService
- **matchup-dvp-analyzer.tsx** - Defense vs Position analysis
- **index.ts** - Export definitions

### Risk Analysis Tools
**Path:** ./client/src/components/tools/risk/  
**Status:** ✅ Integrated  

- **consistency-score-table.tsx** - Player consistency ratings from MasterDataService
- **injury-risk-table.tsx** - Injury risk assessment
- **tag-watch-table.tsx** - Player tagging analysis
- **volatility-index-table.tsx** - Score volatility tracking
- **index.ts** - Export definitions

### Team Management Tools
**Path:** ./client/src/components/tools/team-manager/  
**Status:** ✅ Integrated  

- **bench-hygiene.tsx** - Bench optimization from MasterDataService
- **rage-trades.tsx** - Emotional trading prevention
- **trade-score.tsx** - Trade impact scoring
- **trade-suggester.tsx** - AI-powered trade suggestions
- **index.ts** - Export definitions

### Tool Infrastructure
**Path:** ./client/src/components/tools/  
**Status:** ✅ Integrated  

- **collapsible-tool.tsx** - UI wrapper for collapsible tools
- **sortable-table.tsx** - Sortable table component
- **team-uploader.tsx** - Team data upload utility

---

## CLIENT COMPONENTS - DASHBOARD

### ./client/src/components/dashboard/AFLFantasyDashboard.tsx
**Purpose:** Main dashboard component  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/dashboard/AFLFantasyDashboard_simple.tsx
**Purpose:** Simplified dashboard version  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/dashboard/performance-chart.tsx
**Purpose:** Performance visualization component  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/dashboard/score-card.tsx
**Purpose:** Score display cards  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/dashboard/team-performance.tsx
**Purpose:** Team performance tracking  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/dashboard/team-structure.tsx
**Purpose:** Team structure visualization  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

---

## CLIENT COMPONENTS - PLAYER STATS

### ./client/src/components/player-stats/enhanced-stats-table.tsx
**Purpose:** Advanced player statistics table  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/player-stats-table.tsx
**Purpose:** Standard player stats display  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/player-table.tsx
**Purpose:** Generic player table component  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/simple-player-table.tsx
**Purpose:** Simplified player table  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/heat-map-view.tsx
**Purpose:** Player performance heat map  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/player-detail-modal.tsx
**Purpose:** Detailed player information modal  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/filter-bar.tsx
**Purpose:** Player filtering interface  
**Data Source:** N/A (UI component)  
**Status:** ✅ Integrated  

### ./client/src/components/player-stats/category-selector.tsx
**Purpose:** Player category selection  
**Data Source:** N/A (UI component)  
**Status:** ✅ Integrated  

### Supporting Files:
- **category-header-mapper.ts** - Category mapping utilities ✅
- **collapsible-stats-key.tsx** - Collapsible stats legend ✅  
- **score-breakdown-module.tsx** - Score breakdown analysis ✅
- **stats-key.tsx** - Statistics legend ✅
- **player-types.ts** - Player type definitions ✅

---

## CLIENT COMPONENTS - LEAGUES

### ./client/src/components/leagues/leagues-list.tsx
**Purpose:** League listing component  
**Data Source:** Database via API  
**Status:** ✅ Integrated  

### ./client/src/components/leagues/league-ladder.tsx
**Purpose:** League ladder display  
**Data Source:** Database via API  
**Status:** ✅ Integrated  

### ./client/src/components/leagues/live-matchups.tsx
**Purpose:** Live matchup tracking  
**Data Source:** Database via API  
**Status:** ✅ Integrated  

### Lineup Components:
**Path:** ./client/src/components/leagues/lineup/  
**Status:** ✅ Integrated  

- **team-lineup.tsx** - Team lineup display
- **team-summary-grid.tsx** - Team summary in grid format
- **team-summary-new.tsx** - New team summary design  
- **team-summary.tsx** - Standard team summary
- **team-types.ts** - Team type definitions

---

## CLIENT COMPONENTS - TRADE

### ./client/src/components/trade/trade-analyzer.tsx
**Purpose:** Trade impact analysis  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/components/trade/trade-calculator-modal.tsx
**Purpose:** Trade calculation modal  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

---

## CLIENT COMPONENTS - UI

### Core UI Components
**Path:** ./client/src/components/ui/  
**Status:** ✅ Integrated (Shadcn/UI Library)  

**Complete UI Component Library:**
- accordion.tsx, alert-dialog.tsx, alert.tsx, aspect-ratio.tsx
- avatar.tsx, badge.tsx, breadcrumb.tsx, button.tsx
- calendar.tsx, card.tsx, carousel.tsx, chart.tsx
- checkbox.tsx, collapsible.tsx, command.tsx, context-menu.tsx
- dialog.tsx, drawer.tsx, dropdown-menu.tsx, form.tsx
- hover-card.tsx, input-otp.tsx, input.tsx, label.tsx
- menubar.tsx, navigation-menu.tsx, pagination.tsx, popover.tsx
- progress.tsx, radio-group.tsx, resizable.tsx, scroll-area.tsx
- select.tsx, separator.tsx, sheet.tsx, sidebar.tsx
- skeleton.tsx, slider.tsx, switch.tsx, table.tsx
- tabs.tsx, textarea.tsx, toast.tsx, toaster.tsx
- toggle-group.tsx, toggle.tsx, tooltip.tsx

### Custom UI Components:
- **error-boundary.tsx** - Error boundary component ✅
- **loading-skeleton.tsx** - Loading state skeleton ✅  
- **player-link.tsx** - Player link component ✅

---

## CLIENT COMPONENTS - LAYOUT

### ./client/src/components/layout/header.tsx
**Purpose:** Application header component  
**Data Source:** User session data  
**Status:** ✅ Integrated  

### ./client/src/components/layout/sidebar.tsx
**Purpose:** Navigation sidebar  
**Data Source:** N/A (navigation)  
**Status:** ✅ Integrated  

### ./client/src/components/layout/bottom-nav.tsx
**Purpose:** Mobile bottom navigation  
**Data Source:** N/A (navigation)  
**Status:** ✅ Integrated  

---

## CLIENT SERVICES

### ./client/src/services/aiService.ts
**Purpose:** AI integration service  
**Data Source:** OpenAI API via backend  
**Status:** ✅ Integrated  

### ./client/src/services/captainService.ts
**Purpose:** Captain analysis service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/cashService.ts
**Purpose:** Cash generation service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/contextService.ts
**Purpose:** Context analysis service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/fixtureService.ts
**Purpose:** Fixture analysis service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/priceService.ts
**Purpose:** Price prediction service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/riskService.ts
**Purpose:** Risk analysis service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/roleService.ts
**Purpose:** Player role analysis service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

### ./client/src/services/teamService.ts
**Purpose:** Team management service  
**Data Source:** MasterDataService via API  
**Status:** ✅ Integrated  

---

## CLIENT INFRASTRUCTURE

### ./client/src/lib/queryClient.ts
**Purpose:** React Query configuration  
**Data Source:** N/A (client setup)  
**Status:** ✅ Integrated  

### ./client/src/lib/utils.ts
**Purpose:** Utility functions  
**Data Source:** N/A (utilities)  
**Status:** ✅ Integrated  

### ./client/src/hooks/use-toast.ts
**Purpose:** Toast notification hook  
**Data Source:** N/A (UI utility)  
**Status:** ✅ Integrated  

### ./client/src/hooks/use-mobile.tsx
**Purpose:** Mobile device detection hook  
**Data Source:** N/A (UI utility)  
**Status:** ✅ Integrated  

### Constants:
**Path:** ./client/src/constants/  
**Status:** ✅ Integrated  

- **index.ts** - General constants
- **positions.ts** - AFL position definitions  
- **teams.ts** - AFL team information

### Utilities:
**Path:** ./client/src/utils/  
**Status:** ✅ Integrated  

- **index.ts** - General utilities
- **positions.ts** - Position utilities
- **team-utils.ts** - Team management utilities  
- **utils.ts** - Shared utilities

---

## LEGACY FILES

### ./client/src/legacy/
**Purpose:** Backup and legacy components  
**Data Source:** Various (deprecated)  
**Status:** 🗑️ Obsolete  

- **App.tsx.bak** - Backup of old App component
- **heat-map-view.tsx.rollback** - Rollback version of heat map
- **new-player-stats.tsx** - Legacy player stats component
- **player-stats-redesign.tsx** - Legacy redesign attempt
- **stats.tsx.fixed** - Fixed version of stats component

---

## DATA SCRIPTS (PYTHON)

### ./src/scripts/
**Purpose:** Data processing and scraping scripts  
**Status:** Mix of ✅ Integrated and ❌ Not Integrated  

**Data Generation Scripts (✅ Integrated):**
- **create_master_stats.py** - Generates master_player_stats.json ✅
- **afl_fantasy_data_service.py** - Main data service ✅
- **player_data_integrator.py** - Integrates multiple data sources ✅

**Web Scrapers (❌ Not Integrated - Direct to files):**
- **footywire_scraper.py** - FootyWire data scraping ❌
- **dfs_player_scraper.py** - DFS Australia player data ❌
- **dfs_australia_parser.py** - DFS Australia parsing ❌
- **dfs_fantasy_bigboard_scraper.py** - BigBoard scraping ❌
- **dvp_matrix_scraper.py** - DVP matrix scraping ❌
- **fixture_scraper.py** - Fixture data scraping ❌
- **quick_player_team_scraper.py** - Quick team updates ❌
- **simple_dfs_scraper.py** - Simple DFS scraper ❌

**Processing Scripts (🟡 Partial):**
- **complete_data_overhaul.py** - Complete data refresh 🟡
- **extract_and_convert.py** - Data format conversion 🟡  
- **integrate_venue_opponent_stats.py** - Venue/opponent integration 🟡
- **simple_venue_opponent_integration.py** - Simple venue integration 🟡
- **update_player_data.py** - Player data updates 🟡

**Utility Scripts:**
- **afl_fantasy_api.py** - API utilities ✅
- **check_scheduler.py** - Scheduler monitoring ✅
- **scheduler.py** - Task scheduling ✅
- **team_uploader.py** - Team upload utility ✅

---

## DATA STORAGE

### Core Data Files

### ./assets/json/
**Status:** ✅ Integrated (via MasterDataService)

- **afl_fixture_2025_1753111987231.json** - AFL fixture data ✅
- **fantasy_metrics_2025_1755916866519.json** - Fantasy metrics ✅  
- **fantasy_value_index_2025_1755916866520.json** - Value index data ✅

### ./assets/production/
**Status:** ✅ Integrated

- **DFS_DVP_Matchup_Tables_FIXED_1753016059835.xlsx** - DVP matchup tables ✅

### ./data/processed/
**Status:** ✅ Integrated  

- **dvp_matrix.json** - Defense vs Position matrix ✅
- **master_player_stats.json** - Master player statistics ✅

### ./data/raw/
**Status:** ❌ Not Integrated (Raw input files)

- **AFL_Fantasy_Player_URLs.xlsx** - Player URL mapping ❌
- **dfs_dvp_stats.csv** - Raw DVP statistics ❌  
- **DVP_Matchup_Data.xlsx** - Raw DVP matchup data ❌

### ./data/backups/
**Status:** 📁 Asset (Backup files)

- Multiple backup files of user_team.json and processing summaries 📁

---

## ATTACHED ASSETS

### ./attached_assets/
**Purpose:** User-uploaded files and project assets  
**Status:** 📁 Asset  

**Excel Data Files:**
- Aaron Naughton_1752999846164.xlsx 📁
- afl-fantasy-2023 (1).xlsx 📁
- afl-fantasy-2024 (1).xlsx 📁
- afl-fantasy-2025 (5).xlsx 📁
- AFLFantasy_Trade_Tools_Documentation (1).xlsx 📁
- complete_tool_imputs.xlsx 📁
- dtlive_1752999476691.xlsx 📁
- DFS_DVP_Matchup_Tables_FIXED_1753016059835.xlsx 📁

**CSV Data Files:**
- AFL_Fantasy_R7_Stats.csv 📁
- afl_fantasy_round7_prices.csv 📁
- afl_fantasy_tools_complete.csv 📁
- All_Player_Breakevens_-_Round_7.csv 📁
- Multiple breakout/crashout CSV files by position 📁
- Multiple CBA and kick-in analysis files 📁
- PLAYER TEAM AND NAME_1753070441702.csv 📁
- Projected_top_scorers_1755908916246.csv 📁

**Python Scripts:**
- afl_fantasy_scraper.py 📁
- dfs_dvp_scraper_1755916956968.py 📁
- dfs_player_scraper_1755916866518.py 📁
- scrape_afl_fantasy_*.py (multiple versions) 📁
- scrape_dvp_roles_1755916956969.py 📁
- scrapy_afl_fantasy_*.py (spider scripts) 📁

**JSON Data:**
- afl_fixture_2025_1753111987231.json 📁
- fantasy_metrics_2025_1755916866519.json 📁
- fantasy_value_index_2025_1755916866520.json 📁

**Documentation:**
- README.md 📁
- content-1746128613816.md 📁
- Price predictor forumala_1752999200014.txt 📁
- Multiple prompt/specification text files 📁

**Screenshots:**
- 100+ screenshot files documenting development progress 📁

---

## SUMMARY

**Total Files Analyzed:** 200+

**Integration Status Breakdown:**
- ✅ **Integrated (MasterDataService):** 85+ files
- 🟡 **Partial/Mock:** 5 files  
- ❌ **Not Integrated:** 20+ files (mostly scrapers)
- 🗑️ **Obsolete:** 10+ legacy files
- 📋 **Config:** 10+ configuration files
- 📁 **Assets:** 100+ data/media files

**Key Integration Priorities:**
1. **Fix dashboard.tsx** - Resolve samplePerformanceData error 🟡
2. **Integrate direct file readers** - Move remaining direct JSON/CSV readers to MasterDataService ❌
3. **Clean up legacy files** - Remove obsolete components 🗑️
4. **Consolidate scrapers** - Standardize data ingestion through MasterDataService ❌

**Architecture Health:** ✅ **GOOD** - Core application is well integrated with MasterDataService as the central data hub. Most user-facing features use the proper data architecture.