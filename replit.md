# AFL Fantasy Intelligence Platform

## Overview

The AFL Fantasy Intelligence Platform is a comprehensive sports analytics tool designed to assist AFL Fantasy coaches. It provides advanced features for player performance analysis, strategic trades, captaincy optimization, and cash generation. The platform offers a unified dashboard with data-driven insights through specialized modules such as player projections, fixture analysis, risk assessment, and team optimization. Its core purpose is to empower users with real-time fantasy football intelligence for informed decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript.
- **Styling**: Tailwind CSS with custom theme.
- **UI Components**: Radix UI.
- **Build System**: Vite.
- **State Management**: TanStack React Query for server state management and caching.

### Backend Architecture
- **Node.js Server**: Express.js with TypeScript for the main API.
- **Python Services**: Flask APIs for specialized analysis tools (captain, cash, risk, etc.).
- **Hybrid Approach**: Node.js for routing/orchestration, Python for complex fantasy calculations.
- **API Structure**: RESTful endpoints with JSON responses, categorized by tool.

### Data Management
- **Database**: PostgreSQL with Drizzle ORM.
- **Player Data**: JSON-based local storage with automated refresh.
- **Caching**: File-based caching with timestamp validation.

### Analysis Engine Architecture
- **Modular Tools**: Separate Python modules for different analysis types.
- **Algorithms**: Custom projection and statistical models.
- **Processing**: Background scheduler for automated data updates.
- **Integration**: Aggregation from multiple fantasy sports websites.

### Key Design Patterns
- **Microservices Approach**: Each analysis tool as an independent service.
- **API Gateway Pattern**: Express.js as the central gateway.
- **Data Pipeline**: Automated scraping, processing, storage, and API delivery.
- **Fallback Strategy**: Multiple data sources with graceful degradation.

### UI/UX Decisions
- **Player Stats Table**: Implements round-by-round filtering, a toggle for "Season Average" vs. "Season Total" views, and conditional column display. Includes visual indicators like loading spinners and badges.
- **Value Ratings**: Displays round-specific value ratings with percentile-based categorization (✓ for undervalued, ✗ for overpriced).
- **Trade History**: Visualizes player trades across rounds in a side-by-side view.
- **Price Formatting**: Enhances price display for values over $1 million (e.g., $1.2m).

### Feature Specifications
- **DFS Australia Data Integration**: Comprehensive integration of 535 AFL players with detailed statistics, stored in PostgreSQL. Includes API endpoints for search, filtering, and bulk operations.
- **DFS Round-by-Round Game Logs (October 16, 2025)**: Complete round-by-round match statistics loaded into `player_round_stats` table from 529 Excel files. Contains 8,585 game records across rounds 1-24 with detailed stats (kicks, handballs, disposals, marks, tackles, contested/uncontested possessions, time on ground, goals, behinds). Uses optimized batch loader with proper data type handling.
- **Trade History**: Tracks and visualizes all player trades across 24 rounds, with automated detection and historical data correction.
- **Season View Toggle**: Allows users to switch between season average and season total views for player statistics, adjusting displayed columns and sort fields accordingly.
- **Round-by-Round Filtering**: Provides the ability to view player statistics for specific rounds or season aggregates, leveraging historical round score data.
- **Match Stats Integration**: Displays detailed per-game average statistics (kicks, handballs, disposals, marks, tackles, hitouts) for players.
- **Round-Specific Value Ratings**: Stores and displays value ratings (points per $100k) specific to each round, categorized as undervalued, overpriced, or neutral based on percentile thresholds.
- **Accurate Value Stats API (October 17, 2025)**: Created `/api/master-stats/value-stats` endpoint to replace outdated JSON data with real-time database calculations. Uses SQL CTEs to aggregate player_round_stats table for accurate averages, totals, L3 averages, and PPD (points per $100k). Fixes inflated statistics issue and ensures realistic player data in Player Value Analysis feature.
- **DVP (Defense vs Position) Analysis (October 17, 2025)**: Comprehensive DVP data integration with 16,505 player-opponent matchup records and 18 team defensive ratings. Database stores position-specific defensive ratings (Forward, Midfielder, Defender, Ruck) with 1-10 scale (1=best defense). API endpoints include team ratings, player matchups, and structured matrix for frontend consumption. Data loaded from DFS Australia analysis via CSV import script.

## External Dependencies

### Third-party Services
- **FootyWire**: Primary source for AFL player statistics and breakeven data.
- **DFS Australia**: Secondary source for Defense vs Position (DVP) and player projections.
- **AFL Official API**: Used for fixture data and official player information.

### Database and Infrastructure
- **PostgreSQL**: Primary database.
- **Neon Database**: Cloud hosting for PostgreSQL.
- **File System Storage**: Local JSON files for cached data.

### Development and Build Tools
- **Drizzle Kit**: Database schema management.
- **Node.js Ecosystem**: Express, TypeScript, etc.
- **Python Libraries**: Flask, BeautifulSoup, Pandas.
- **Browser Automation**: Selenium WebDriver.

### External APIs and Data Sources
- **Requests library**: For HTTP operations (web scraping).
- **APScheduler**: For automated data refresh.
- **Chart.js**: For data visualization.