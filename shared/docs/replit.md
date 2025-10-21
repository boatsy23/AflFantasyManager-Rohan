# AFL Fantasy Intelligence Platform

## Overview
The AFL Fantasy Intelligence Platform is a comprehensive, data-driven application designed to assist AFL Fantasy coaches. Its primary purpose is to provide advanced analytics, optimize trades, and deliver strategic insights. The platform aggregates data from multiple sources to offer real-time player statistics, predictive modeling, and automated data updates, aiming to give users a significant competitive edge in fantasy football.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, located in the `/client` directory.
- **Project Structure**: Reorganized (Aug 2025) with feature-based component grouping, centralized constants/utils, and legacy file management.
- **UI Components**: Modular, component-based architecture organized by functionality:
  - `components/dashboard/` - Dashboard components
  - `components/player-stats/` - Player analysis and statistics
  - `components/tools/` - Fantasy tools (captain, cash, fixture, price, risk, trade)
  - `components/trade/` - Trade analysis (merged trade-analyzer)
  - `components/layout/` - Layout components (Header, Sidebar)
  - `constants/` - Team mappings, positions, and application constants
  - `utils/` - Utility functions (team-utils, general utilities)
  - `legacy/` - Backup and rollback files
- **Styling**: Component-scoped styling with responsive design using Tailwind CSS and Shadcn UI.
- **State Management**: React hooks and context with TanStack Query for server state.

### Backend Architecture
- **Framework**: Express.js with TypeScript, located in the `/server` directory.
- **API Structure**: RESTful endpoints organized by functionality (e.g., `/api/teams`, `/api/stats`, `/api/fantasy/tools`, `/api/cash`, `/api/captain`).
- **Python Integration**: Python scripts for data processing and AI tools are integrated via child processes.

### Data Processing Layer
- **Primary Language**: Python for data scraping and analysis.
- **Data Sources**: Multi-source aggregation including DFS Australia API (primary), FootyWire scraping (secondary), and CSV import capabilities.
- **Automated Updates**: Background scheduler for regular data refreshing (e.g., every 12 hours).

### Key Components & Features
- **Data Management**: Centralized `player_data.json` and `user_team.json` with comprehensive statistics and automated timestamped backups. Multi-source integration for robust data.
- **Analytics Engine**:
    - **Score Prediction**: v3.4.4 algorithm for player score projections (average margin of error 12.5 points).
    - **Price Modeling**: AFL Fantasy price change calculations using authentic magic number formula.
    - **Risk Assessment**: Trade and injury risk evaluation.
    - **Performance Tracking**: Historical performance analysis and trend identification.
    - **Statistical Algorithms**: Price Predictor and Projected Score calculation engines.
- **Strategic Tools**:
    - **Captain Analysis**: Multiple captain selection methodologies.
    - **Trade Optimization**: Score-based trade recommendation engine.
    - **Cash Generation**: Rookie price curve modeling and cash cow identification.
    - **Team Structure**: Position balance and salary cap optimization.
- **Data Flow**: Automated ingestion from scheduled updates and primary/fallback sources, followed by normalization, player matching, calculation, and team integration. API responses provide structured JSON data.

### System Design Choices
- **UI/UX**: Focus on clear, intuitive presentation of complex data. Display of fixture difficulty with color coding and trend visualization.
- **Technical Implementations**: Enhanced score projection algorithm incorporating season average, recent form, opponent difficulty, and position adjustments with tier-based multipliers. Robust data validation and integrity checks.
- **Feature Specifications**: Integration of real Defense vs Position (DVP) data for matchup difficulty, displayed prominently in player details and team analyses. Comprehensive player database with authentic Round 13 live data, correct team assignments, and filtering.

## External Dependencies

### Data Sources
- **DFS Australia**: Primary API for player statistics and pricing.
- **FootyWire**: Secondary source for comprehensive player data and fixtures.
- **AFL Fantasy**: Target platform for authentic user data.
- **Champion Data**: Advanced statistics API (credentials available, not yet implemented).

### Python Libraries
- **Web Scraping**: `requests`, `BeautifulSoup4`, `selenium`.
- **Data Processing**: `pandas`, `json`, `csv`.
- **Scheduling**: For background process management.
- **Analysis**: For mathematical and statistical calculations.

### Node.js Dependencies
- **Backend**: Express.js, TypeScript.
- **Frontend**: React, TypeScript.
- **Database**: Drizzle ORM (configured for PostgreSQL).
- **Development**: Various development and build tools.