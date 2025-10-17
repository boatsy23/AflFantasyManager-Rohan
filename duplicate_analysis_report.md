# AFL Fantasy Platform - Duplicate File Analysis

## Executive Summary
- Total files analyzed: ~400+ files across client, server, and scripts
- Duplicate groups identified: 15 major groups
- Files recommended for removal: 87 files
- Estimated reduction: ~35% of codebase

## Duplicate File Groups

### 1. Player Statistics Tables
**Primary File**: `client/src/components/player-stats/enhanced-stats-table.tsx`
**Duplicates**:
- `player-stats-table.tsx` (Reason: Similar functionality, less features)
- `simple-player-table.tsx` (Reason: Subset of enhanced table features)
- `player-table.tsx` (Reason: Basic table, functionality covered by enhanced)
- `client/src/legacy/new-player-stats.tsx` (Reason: Old implementation in legacy folder)
- `client/src/legacy/player-stats-redesign.tsx` (Reason: Legacy redesign attempt)
- `client/src/legacy/stats.tsx.fixed` (Reason: Legacy fixed version)

**Recommendation**: Keep `enhanced-stats-table.tsx` as it has the most complete feature set

### 2. Dashboard Components
**Primary File**: `client/src/components/dashboard/AFLFantasyDashboard.tsx`
**Duplicates**:
- `AFLFantasyDashboard_simple.tsx` (Reason: Simplified version, same core functionality)
- `team-performance.tsx` (Reason: Subset of dashboard functionality)
- `team-structure.tsx` (Reason: Can be integrated into main dashboard)

**Recommendation**: Keep main `AFLFantasyDashboard.tsx`, integrate features from simple version

### 3. Python DFS Scrapers
**Primary File**: `src/scripts/dfs_fantasy_bigboard_scraper.py`
**Duplicates**:
- `dfs_player_scraper.py` (Reason: Same DFS Australia data source)
- `simple_dfs_scraper.py` (Reason: Simplified version of same scraper)
- `dfs_australia_parser.py` (Reason: Parsing logic duplicated)
- `attached_assets/dfs_player_scraper_*.py` (Multiple timestamp versions)

**Recommendation**: Keep `dfs_fantasy_bigboard_scraper.py` as most comprehensive

### 4. FootyWire Scrapers
**Primary File**: `src/scripts/footywire_scraper.py`
**Duplicates**:
- `quick_player_team_scraper.py` (Reason: Partial FootyWire scraping)
- `fixture_scraper.py` (Reason: FootyWire fixtures, can be integrated)

**Recommendation**: Merge all FootyWire scraping into single comprehensive scraper

### 5. Venue/Opponent Integration Scripts
**Primary File**: `src/scripts/integrate_venue_opponent_stats.py`
**Duplicates**:
- `simple_venue_opponent_integration.py` (Reason: Simplified version of same logic)
- `server/integrate_venue_opponent_stats.py` (Reason: Duplicate in server folder)
- `server/simple_venue_opponent_integration.py` (Reason: Another duplicate)

**Recommendation**: Keep main version, remove simplified versions

### 6. Utility Files
**Primary File**: `client/src/utils/utils.ts`
**Duplicates**:
- `client/src/lib/utils.ts` (Reason: EXACT COPY - 100% duplicate)

**Recommendation**: Remove `lib/utils.ts`, use only `utils/utils.ts`

### 7. Team Summary Components
**Primary File**: `client/src/components/leagues/lineup/team-summary-grid.tsx`
**Duplicates**:
- `team-summary.tsx` (Reason: Older version of same component)
- `team-summary-new.tsx` (Reason: Development version)

**Recommendation**: Keep `team-summary-grid.tsx`, remove others

### 8. Legacy/Backup Files
**All files in these categories should be removed**:
- `client/src/legacy/*` (6 files) - Old implementations
- `data/backups/*` (20+ files) - Old backup files with timestamps
- Files with `.bak` extensions
- Files with timestamp suffixes (_1753044022165, etc.)

### 9. Attached Assets Duplicates
**Files to remove from attached_assets/**:
- Multiple versions of same data files (dfs_player_summary_*.zip)
- Multiple keeper scraper versions (Keeper_Scraper_*.zip)
- Duplicate scrapers (multiple scraper.py files)
- Multiple Excel versions of same data

### 10. Service Layer Duplicates
**Primary Files to Keep**:
- `server/services/MasterDataService.ts` - Core service
- `server/fantasy-tools/index.ts` - Tool orchestration

**Duplicates to Remove**:
- `server/server/data/services/*` - Duplicate nested services folder
- `src/server/services/*` - Another duplicate services folder

### 11. Data Processing Scripts
**Primary File**: `src/scripts/create_master_stats.py`
**Duplicates**:
- `complete_data_overhaul.py` (Reason: Similar processing logic)
- `player_data_integrator.py` (Reason: Corrupted/incomplete file)
- `update_player_data.py` (Reason: Wrapper around main processor)

### 12. Price/Score Services
**Primary Files**: Server services in `server/services/`
**Duplicates**:
- `src/server/services/*` - Duplicate implementations
- `server/server/data/services/*` - Triple nested duplicates

### 13. Mock Data Components
**All tools with hardcoded mock data** (Keep structure but flag for data connection):
- All captain tools (mock predictions)
- All cash tools (mock projections)
- All fixture tools (mock fixtures)
- All risk tools (mock histories)
- All team manager tools (mock suggestions)

### 14. Test/Preview Pages
**Files to Remove**:
- `client/src/pages/preview-tool.tsx` - Test page only
- `client/src/pages/tools-simple.tsx` - Alternative view, not used

### 15. Standard UI Components (shadcn)
**94% of `client/src/components/ui/*` can be regenerated**:
- 47 standard shadcn components
- Only 3 custom components need migration:
  - `error-boundary.tsx`
  - `loading-skeleton.tsx`
  - `player-link.tsx`

## Files to REMOVE (Duplicates/Unused)

### Critical Duplicates (Remove Immediately)
- `client/src/lib/utils.ts` - Exact duplicate of utils/utils.ts
- `client/src/legacy/*` (all 6 files) - Old implementations
- `data/backups/*` (all ~20 files) - Old backups
- `src/scripts/player_data_integrator.py` - Corrupted file (3 lines only)
- `server/server/*` - Duplicate nested folder structure
- `src/server/*` - Another duplicate server folder

### Python Script Duplicates
- `simple_dfs_scraper.py` - Duplicate of main DFS scraper
- `dfs_player_scraper.py` - Duplicate functionality
- `simple_venue_opponent_integration.py` - Simplified duplicate
- `quick_player_team_scraper.py` - Partial duplicate
- `update_player_data.py` - Unnecessary wrapper

### Component Duplicates
- `player-stats-table.tsx` - Superseded by enhanced version
- `simple-player-table.tsx` - Subset of enhanced
- `player-table.tsx` - Basic version not needed
- `AFLFantasyDashboard_simple.tsx` - Keep main version only
- `team-summary.tsx` - Old version
- `team-summary-new.tsx` - Development version

### Attached Assets Cleanup
- All duplicate ZIP files with timestamps
- Multiple Excel versions of same data
- Duplicate Python scrapers in attached_assets
- Screenshot files (*.png)
- Temporary text files (Pasted-*.txt)

### Unused/Test Files
- `preview-tool.tsx` - Test page only
- `tools-simple.tsx` - Unused alternative
- `check_scheduler.py` - Utility only, not core

## Files to KEEP (Essential)

### Core Infrastructure
- `server/index.ts` - Main Express server
- `server/routes.ts` - Central route registration
- `server/storage.ts` - Database abstraction
- `server/vite.ts` - Vite configuration
- `shared/schema.ts` - Database models

### Active Components
- `client/src/App.tsx` - Main app component
- `client/src/components/player-stats/enhanced-stats-table.tsx` - Primary table
- `client/src/components/dashboard/AFLFantasyDashboard.tsx` - Main dashboard
- All active page components in `client/src/pages/`

### Data Pipeline
- `src/scripts/create_master_stats.py` - Core data processor
- `src/scripts/dfs_fantasy_bigboard_scraper.py` - Main DFS scraper
- `src/scripts/footywire_scraper.py` - FootyWire data
- `src/scripts/scheduler.py` - Automation scheduler
- `data/processed/master_player_stats.json` - Core data file

### Services
- `server/services/MasterDataService.ts` - Primary data service
- `server/fantasy-tools/*` - All fantasy tool implementations
- `client/src/services/*` - Frontend service layer (except duplicates)

### Essential Utilities
- `client/src/utils/utils.ts` - Core utilities (remove lib/ duplicate)
- `client/src/lib/queryClient.ts` - API layer
- `client/src/hooks/use-toast.ts` - Notification system
- `client/src/constants/*` - Game rules and team data

## Migration Priority

### HIGH Priority (Core functionality)
- `server/services/MasterDataService.ts`
- `server/routes.ts` and all route files
- `server/storage.ts`
- `client/src/App.tsx`
- `client/src/pages/dashboard.tsx`
- `client/src/lib/queryClient.ts`
- `shared/schema.ts`

### MEDIUM Priority (Important features)
- All fantasy tools (need data connection)
- Active page components
- Service layer files
- Core Python scrapers
- `data/processed/master_player_stats.json`

### LOW Priority (Can regenerate)
- `client/src/components/ui/*` (94% standard shadcn)
- CSS files (can be rebuilt)
- Public assets (can be re-downloaded)
- Documentation files

## Consolidation Opportunities

1. **Merge all DFS scrapers** into single `dfs_comprehensive_scraper.py`
2. **Combine FootyWire scrapers** into unified `footywire_comprehensive_scraper.py`
3. **Consolidate player table components** into single configurable component
4. **Merge dashboard variations** into one with feature flags
5. **Unify venue/opponent integration** scripts into single processor
6. **Combine all team summary components** into one flexible component
7. **Create single data integration pipeline** from multiple scripts
8. **Consolidate duplicate service implementations** in server folders

## Space Savings Estimate
- Current: ~400+ files
- After cleanup: ~260 files
- Reduction: 35% fewer files
- Code reduction: ~40% less duplicate code
- Maintenance burden: 50% reduction

## Key Recommendations

1. **Immediate Actions**:
   - Delete all files in `client/src/legacy/`
   - Remove `client/src/lib/utils.ts` duplicate
   - Clean up `data/backups/` folder
   - Delete corrupted `player_data_integrator.py`

2. **Consolidation Phase**:
   - Merge all Python scrapers by data source
   - Combine player table components
   - Unify dashboard implementations

3. **Data Connection Priority**:
   - Connect all mock data tools to real APIs
   - Remove hardcoded test data
   - Implement proper data fetching

4. **UI Cleanup**:
   - Reinstall shadcn components fresh
   - Migrate only 3 custom UI components
   - Remove unused test pages

5. **Folder Structure**:
   - Remove duplicate server folders (`server/server/`, `src/server/`)
   - Clean up attached_assets folder
   - Organize Python scripts into clear categories