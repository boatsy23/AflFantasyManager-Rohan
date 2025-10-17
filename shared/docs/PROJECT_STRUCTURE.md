# AFL Fantasy Intelligence Platform - Project Structure

## Top-Level Directories

```
afl-fantasy-platform/
├── backend/           # Legacy backend scripts (Python)
├── client/           # React frontend application
├── server/           # Express.js API server
├── shared/           # Shared TypeScript schemas & types
├── data/            # Raw data files and databases
├── docs/            # Documentation and guides
├── scripts/         # Build and deployment scripts
├── uploads/         # File upload handling
└── utils/           # Utility scripts and helpers
```

## Client Structure (React Frontend)

```
client/src/
├── components/
│   ├── dashboard/      # Dashboard-related components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── leagues/        # League management components
│   ├── lineup/         # Team lineup and formation
│   ├── player-stats/   # Player statistics and analysis
│   ├── tools/          # Fantasy tools organized by category
│   │   ├── ai/         # AI-powered tools
│   │   ├── captain/    # Captain selection tools
│   │   ├── cash/       # Cash generation tools
│   │   ├── fixture/    # Fixture analysis
│   │   ├── price/      # Price prediction tools
│   │   ├── risk/       # Risk analysis tools
│   │   └── trade/      # Trade analysis and calculators
│   ├── trade/          # Trade-related components (merged)
│   └── ui/             # Shadcn UI components
├── constants/          # Application constants
│   ├── teams.ts        # Team mappings and colors
│   ├── positions.ts    # Position constants
│   └── index.ts        # Central export
├── hooks/              # Custom React hooks
├── lib/                # Core libraries and configurations
├── pages/              # Page components (routing)
├── services/           # API service layers
├── utils/              # Utility functions
│   ├── utils.ts        # General utilities
│   ├── team-utils.ts   # Team-specific utilities
│   └── index.ts        # Central export
└── legacy/             # Legacy/backup files
    ├── App.tsx.bak
    ├── heat-map-view.tsx.rollback
    ├── new-player-stats.tsx
    ├── player-stats-redesign.tsx
    └── stats.tsx.fixed
```

## Data Directory

```
data/
├── players/           # Large Excel files and player data
├── fixtures/          # Fixture and match data  
├── teams/             # Team-specific datasets
└── historical/        # Historical performance data
```

## Key Organizational Principles

1. **Feature-Based Grouping**: Components organized by functionality rather than type
2. **Clean Separation**: Constants, utils, and components properly separated
3. **Legacy Management**: Old/backup files moved to dedicated legacy folder
4. **Central Exports**: Index files for clean import statements
5. **Data Isolation**: Large data files moved out of source code

## Import Patterns

- Constants: `import { TEAMS, POSITIONS } from '@/constants'`
- Utils: `import { getTeamGuernsey } from '@/utils'`
- Components: `import { TradeAnalyzer } from '@/components/trade'`
- UI: `import { Button } from '@/components/ui/button'`

This structure maintains all existing functionality while providing clear organization and easier maintenance.