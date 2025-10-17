# Data Scraper Issues Log

This document tracks issues discovered during the latest execution of AFL Fantasy data scrapers and outlines required fixes to ensure reliable fresh data collection.

---

## `footywire_scraper.py`

### What happened:
- Script executed but failed to retrieve fresh data from FootyWire website
- Error message: "No data tables found on the page"
- Automatically fell back to processing local AFL stats files instead
- Successfully processed 535 players from backup data source
- FootyWire website appears to have server issues or structural changes

### Expected behavior:
- Should scrape live AFL Fantasy player rankings directly from FootyWire
- Should retrieve current breakeven data from FootyWire
- Should only use backup data as last resort, not primary method
- Should provide fresh, up-to-date player statistics and rankings

### Action needed:
1. **Investigate FootyWire website changes:** Check if URL structure or HTML layout has changed
2. **Update scraping selectors:** Verify CSS selectors and table identifiers are still valid
3. **Implement better error handling:** Add specific checks for different failure scenarios
4. **Add retry mechanism:** Implement delays and retries for transient network issues
5. **Monitor website structure:** Set up alerts for when FootyWire data becomes unavailable

---

## `dfs_player_scraper.py`

### What happened:
- Script completed execution but encountered multiple table access issues
- Failed to find required tables ('Career Averages', 'Opponent Splits', 'Game Logs') for all target players
- Error: "At least one sheet must be visible" for Excel exports
- Players affected: max-gawn, marcus-bontempelli, lachie-neale, christian-petracca, touk-miller, josh-dunkley, harry-sheezel, zak-butters, daicos-nick, errol-gulden
- Likely relying on CSV fallback mechanisms

### Expected behavior:
- Should successfully access and extract detailed player statistics from DFS data sources
- Should retrieve complete career averages, opponent splits, and game logs for all players
- Should export clean, structured data without Excel-related errors
- Should process all target premium players without fallback

### Action needed:
1. **Fix Excel export functionality:** Resolve "at least one sheet must be visible" error
2. **Update table selectors:** Verify table names and identifiers match current website structure
3. **Implement alternative data extraction:** Add fallback methods that don't rely on Excel exports
4. **Add player name validation:** Ensure player URL mapping is current and accurate
5. **Enhance error recovery:** Implement graceful handling when specific tables are unavailable

---

## `dfs_australia_parser.py`

### What happened:
- Successfully processed 293 players with official AFL Fantasy data corrections
- Applied specific corrections for Nick Daicos stats
- Completed without major errors
- However, player count (293) suggests incomplete coverage of all AFL players

### Expected behavior:
- Should process complete roster of all AFL Fantasy-eligible players (~600+ players)
- Should handle all team rosters comprehensively
- Should apply corrections for all players requiring stat adjustments, not just specific cases
- Should provide comprehensive coverage of all positions and teams

### Action needed:
1. **Expand player coverage:** Investigate why only 293 players were processed instead of full roster
2. **Add missing players:** Identify and include players from all 18 AFL teams
3. **Automate correction detection:** Implement system to identify players needing stat corrections
4. **Validate team rosters:** Ensure all team squads are completely represented
5. **Add data completeness checks:** Implement validation to ensure no players are missed

---

## `process_afl_data.py`

### What happened:
- Successfully processed 535 players from AFL stats
- Completed data merging and processing without errors
- Generated comprehensive player dataset
- No apparent failures or fallbacks triggered

### Expected behavior:
- Should merge data from multiple sources without conflicts
- Should validate data integrity during merge process
- Should handle duplicate players across data sources appropriately
- Should maintain data quality and consistency throughout processing

### Action needed:
1. **Add merge validation:** Implement checks to detect and resolve data conflicts between sources
2. **Enhance duplicate detection:** Improve logic for identifying same players across different datasets
3. **Add data quality checks:** Validate statistical consistency and reasonable value ranges
4. **Implement audit logging:** Track which data sources contribute to each player's final stats
5. **Add performance monitoring:** Monitor processing times and optimize for larger datasets

---

## `scraper.py`

### What happened:
- Successfully loaded and processed 535 players
- Completed execution without critical errors
- Generated sample output showing proper data structure (Lachie Whitfield example)
- Main coordinating script functioned as expected

### Expected behavior:
- Should orchestrate all scraping activities seamlessly
- Should coordinate data from multiple sources without conflicts
- Should provide real-time status updates during processing
- Should handle failures in individual scrapers gracefully

### Action needed:
1. **Monitor external dependencies:** Set up monitoring for changes in external data sources
2. **Improve error aggregation:** Collect and report errors from all child scrapers comprehensively
3. **Add data freshness validation:** Verify that scraped data is current and not stale
4. **Implement health checks:** Add pre-scraping validation of all external data sources
5. **Enhance coordination logic:** Improve handling when some scrapers fail but others succeed

---

## Priority Fixes

### High Priority:
1. **FootyWire connection issues** - Primary data source is currently unavailable
2. **DFS player scraper Excel errors** - Preventing detailed player analysis
3. **Player coverage gaps** - Only 293/535 players getting enhanced DFS processing

### Medium Priority:
1. **Data merge validation** - Ensure quality when combining multiple sources
2. **Error monitoring** - Better visibility into scraping failures

### Low Priority:
1. **Performance optimization** - Scripts work but could be faster
2. **Logging improvements** - Better audit trails for debugging

---

## Monitoring Recommendations

1. **Daily health checks:** Verify all external data sources are accessible
2. **Data freshness alerts:** Monitor when last successful fresh data pull occurred
3. **Player count validation:** Alert when expected player counts drop significantly
4. **Error rate monitoring:** Track failure rates across all scrapers

---

## Price Projection Algorithm Refinements

### What needs to be fixed:
- Price projection algorithm needs correct magic number from DFS weights
- Remove beta weight and confidence metrics from calculations  
- Add breakeven scale factor to score/projected score logic
- Integrate existing BE predictor into price projection system

### Action needed:
1. **Get correct magic number from DFS weights:** Replace current magic number (3500) with DFS-sourced authentic value
2. **Remove beta weight:** Eliminate betaWeight (0.15) from price calculation formula
3. **Remove confidence metrics:** Strip confidence calculations and fields from API responses
4. **Refine score/projected score:** Add breakeven scale factor to calculations
5. **Upload BE predictor:** Implement existing BE predictor algorithm into price projection service

### Technical targets:
- Algorithm location: `src/server/services/pricePredictionService.ts`
- API endpoint: `/api/price-prediction/player/{playerName}`
- Integration point: Connect with MasterDataService for authentic data
- Testing players: Patrick Cripps, Josh Dunkley, Bailey Smith

---

*Last updated: After script execution on [timestamp]*
*Status: Multiple scrapers experiencing external source issues + Price algorithm needs refinement*
*Next review: Required before next data update cycle*