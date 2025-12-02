# Repository Refactor Plan
**Generated from App.tsx Analysis**  
**Date:** December 2, 2025

---

## 📋 Overview

This document provides a comprehensive, phased plan for verifying and refactoring the AFL Fantasy Manager repository. It is based on **actual imports** from `client/src/App.tsx` and maps out every page, component, hook, utility, and dependency used in the application.

### Purpose
1. Create a verified inventory of **what is actually being used**
2. Provide a to-do workflow for systematically checking imports
3. Identify naming inconsistencies, broken paths, and unused files
4. Enable safe cleanup and restructuring

---

## 📍 Source of Truth: App.tsx

The following imports define the application's entry point and routing structure:

### External Dependencies (from App.tsx)
```typescript
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
```

### Internal Imports (from App.tsx)
```typescript
// Lib
import { queryClient } from "./lib/queryClient";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Error Handling
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

// Layout Components
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";

// Hooks
import { useIsMobile } from "@/hooks/use-mobile";

// Pages (12 total)
import Dashboard from "@/pages/dashboard";
import Lineup from "@/pages/lineup";
import Leagues from "@/pages/leagues";
import Stats from "@/pages/stats";
import PlayerStats from "@/pages/player-stats";
import ToolsAccordion from "@/pages/tools-accordion";
import TeamPage from "@/pages/team-page";
import UserProfile from "@/pages/profile";
import TradeAnalyzer from "@/pages/trade-analyzer";
import PreviewTool from "@/pages/preview-tool";
import HardenedDemo from "@/pages/hardened-demo";
import NotFound from "@/pages/not-found";
```

---

## 📄 PHASE 1: Verify Pages

**Goal:** Confirm all 12 pages imported in App.tsx exist and have correct imports.

### Pages Checklist

| # | Page Component | File Path | Route | Status |
|---|----------------|-----------|-------|--------|
| 1 | Dashboard | `client/src/pages/dashboard.tsx` | `/` | ⬜ To verify |
| 2 | PlayerStats | `client/src/pages/player-stats.tsx` | `/player-stats` | ⬜ To verify |
| 3 | Lineup | `client/src/pages/lineup.tsx` | `/lineup` | ⬜ To verify |
| 4 | Leagues | `client/src/pages/leagues.tsx` | `/leagues` | ⬜ To verify |
| 5 | Stats | `client/src/pages/stats.tsx` | `/stats` | ⬜ To verify |
| 6 | UserProfile | `client/src/pages/profile.tsx` | `/profile` | ⬜ To verify |
| 7 | TradeAnalyzer | `client/src/pages/trade-analyzer.tsx` | `/trade-analyzer` | ⬜ To verify |
| 8 | ToolsAccordion | `client/src/pages/tools-accordion.tsx` | `/tools-accordion` | ⬜ To verify |
| 9 | TeamPage | `client/src/pages/team-page.tsx` | `/team` | ⬜ To verify |
| 10 | PreviewTool | `client/src/pages/preview-tool.tsx` | `/preview-tool` | ⬜ To verify |
| 11 | HardenedDemo | `client/src/pages/hardened-demo.tsx` | `/hardened-demo` | ⬜ To verify |
| 12 | NotFound | `client/src/pages/not-found.tsx` | (catch-all) | ⬜ To verify |

### Unused Pages (found in folder but not in App.tsx)
- `client/src/pages/fantasy-tools.tsx` - ⚠️ Not imported in App.tsx

### Verification Workflow for Each Page:
1. ☐ Open page file
2. ☐ Record all imports with full paths
3. ☐ Verify each imported component/hook/util exists
4. ☐ Note any `@/` alias usages
5. ☐ Check for TypeScript errors
6. ☐ Document any broken/missing imports

---

## 📦 PHASE 2: Verify Components

**Goal:** Map all components used across pages and verify their locations.

### Component Structure Overview

```
client/src/components/
├── dashboard/           # Dashboard page components
├── error/              # Error boundary components
├── layout/             # Header, BottomNav, ComplianceFooter
├── leagues/            # Leagues page components
├── lineup/             # Lineup page components
├── player-stats/       # Player statistics components
├── responsive/         # Responsive UI wrappers
├── tools/              # Fantasy tools (organized by category)
│   ├── captain/
│   ├── cash/
│   ├── fixture/
│   ├── risk/
│   ├── team-manager/
│   └── trade/
└── ui/                 # Shadcn/UI components (50 files)
```

### Layout Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| Header | `client/src/components/layout/header.tsx` | App.tsx | ⬜ To verify |
| BottomNav | `client/src/components/layout/bottom-nav.tsx` | App.tsx | ⬜ To verify |
| ComplianceFooter | `client/src/components/layout/ComplianceFooter.tsx` | hardened-demo.tsx | ⬜ To verify |

### Dashboard Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| ScoreCard | `client/src/components/dashboard/score-card.tsx` | dashboard.tsx | ⬜ To verify |
| PerformanceChart | `client/src/components/dashboard/performance-chart.tsx` | dashboard.tsx | ⬜ To verify |
| TeamStructure | `client/src/components/dashboard/team-structure.tsx` | dashboard.tsx | ⬜ To verify |

### Player Stats Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| SimplePlayerTable | `client/src/components/player-stats/simple-player-table.tsx` | player-stats.tsx | ⬜ To verify |
| PlayerDetailModal | `client/src/components/player-stats/player-detail-modal.tsx` | lineup.tsx, stats.tsx | ⬜ To verify |
| DVPAnalysis | `client/src/components/player-stats/dvp-analysis.tsx` | stats.tsx | ⬜ To verify |
| InjuryReports | `client/src/components/player-stats/injury-reports.tsx` | stats.tsx | ⬜ To verify |
| PlayerValueAnalysis | `client/src/components/player-stats/player-value-analysis.tsx` | stats.tsx | ⬜ To verify |
| PlayerDvpGraph | `client/src/components/player-stats/player-dvp-graph.tsx` | stats.tsx | ⬜ To verify |
| CollapsibleStatsKey | `client/src/components/player-stats/collapsible-stats-key.tsx` | stats.tsx | ⬜ To verify |
| CategoryHeaderMapper | `client/src/components/player-stats/category-header-mapper.ts` | stats.tsx | ⬜ To verify |
| PlayerTable | `client/src/components/player-stats/player-table.tsx` | lineup.tsx | ⬜ To verify |
| PlayerTypes | `client/src/components/player-stats/player-types.ts` | lineup.tsx | ⬜ To verify |
| StatsKey | `client/src/components/player-stats/stats-key.tsx` | - | ⬜ To verify |
| ScoreBreakdownModule | `client/src/components/player-stats/score-breakdown-module.tsx` | - | ⬜ To verify |

### Lineup Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| TeamSummaryNew | `client/src/components/lineup/team-summary-new.tsx` | lineup.tsx | ⬜ To verify |
| TeamSummaryGrid | `client/src/components/lineup/team-summary-grid.tsx` | lineup.tsx | ⬜ To verify |
| TeamLineup | `client/src/components/lineup/team-lineup.tsx` | lineup.tsx | ⬜ To verify |
| TeamTypes | `client/src/components/lineup/team-types.ts` | teamService.ts | ⬜ To verify |

### Leagues Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| LeagueLadder | `client/src/components/leagues/league-ladder.tsx` | leagues.tsx | ⬜ To verify |
| LiveMatchups | `client/src/components/leagues/live-matchups.tsx` | leagues.tsx | ⬜ To verify |
| LeaguesList | `client/src/components/leagues/leagues-list.tsx` | leagues.tsx | ⬜ To verify |

### Error Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| ErrorBoundary | `client/src/components/error/ErrorBoundary.tsx` | App.tsx, hardened-demo.tsx | ⬜ To verify |
| ToolErrorBoundary | `client/src/components/error/ToolErrorBoundary.tsx` | hardened-demo.tsx | ⬜ To verify |

### Responsive Components Checklist

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| ResponsiveContainer | `client/src/components/responsive/ResponsiveContainer.tsx` | hardened-demo.tsx | ⬜ To verify |
| ResponsiveDataTable | `client/src/components/responsive/ResponsiveDataTable.tsx` | hardened-demo.tsx | ⬜ To verify |
| TouchButton | `client/src/components/responsive/TouchButton.tsx` | hardened-demo.tsx | ⬜ To verify |

### Tools Components - Captain

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| CaptainScorePredictor | `client/src/components/tools/captain/captain-score-predictor.tsx` | tools-accordion.tsx | ⬜ To verify |
| LoopHole | `client/src/components/tools/captain/loop-hole.tsx` | tools-accordion.tsx | ⬜ To verify |
| index.ts | `client/src/components/tools/captain/index.ts` | tools-accordion.tsx | ⬜ To verify |

### Tools Components - Cash

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| BuySellTimingTool | `client/src/components/tools/cash/buy-sell-timing-tool.tsx` | tools-accordion.tsx | ⬜ To verify |
| CashCeilingFloorTracker | `client/src/components/tools/cash/cash-ceiling-floor-tracker.tsx` | tools-accordion.tsx | ⬜ To verify |
| PricePredictorCalculator | `client/src/components/tools/cash/price-predictor-calculator.tsx` | tools-accordion.tsx | ⬜ To verify |
| DowngradeTargetFinder | `client/src/components/tools/cash/downgrade-target-finder.tsx` | tools-accordion.tsx | ⬜ To verify |
| PriceScoreScatter | `client/src/components/tools/cash/price-score-scatter.tsx` | tools-accordion.tsx | ⬜ To verify |
| ValueTracker | `client/src/components/tools/cash/value-tracker.tsx` | tools-accordion.tsx | ⬜ To verify |
| index.ts | `client/src/components/tools/cash/index.ts` | tools-accordion.tsx | ⬜ To verify |

### Tools Components - Risk

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| TagWatchTable | `client/src/components/tools/risk/tag-watch-table.tsx` | tools-accordion.tsx | ⬜ To verify |
| VolatilityIndexTable | `client/src/components/tools/risk/volatility-index-table.tsx` | tools-accordion.tsx | ⬜ To verify |
| ConsistencyScoreTable | `client/src/components/tools/risk/consistency-score-table.tsx` | tools-accordion.tsx | ⬜ To verify |
| InjuryRiskTable | `client/src/components/tools/risk/injury-risk-table.tsx` | tools-accordion.tsx | ⬜ To verify |
| SortableTable | `client/src/components/tools/risk/sortable-table.tsx` | - | ⬜ To verify |
| index.ts | `client/src/components/tools/risk/index.ts` | tools-accordion.tsx | ⬜ To verify |

### Tools Components - Team Manager

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| TradeSuggester | `client/src/components/tools/team-manager/trade-suggester.tsx` | tools-accordion.tsx | ⬜ To verify |
| BenchHygiene | `client/src/components/tools/team-manager/bench-hygiene.tsx` | tools-accordion.tsx | ⬜ To verify |
| TradeScore | `client/src/components/tools/team-manager/trade-score.tsx` | tools-accordion.tsx | ⬜ To verify |
| RageTrades | `client/src/components/tools/team-manager/rage-trades.tsx` | tools-accordion.tsx | ⬜ To verify |
| index.ts | `client/src/components/tools/team-manager/index.ts` | tools-accordion.tsx | ⬜ To verify |

### Tools Components - Fixture

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| FixtureSwingRadar | `client/src/components/tools/fixture/fixture-swing-radar.tsx` | tools-accordion.tsx | ⬜ To verify |
| MatchupDVPAnalyzer | `client/src/components/tools/fixture/matchup-dvp-analyzer.tsx` | tools-accordion.tsx | ⬜ To verify |
| index.ts | `client/src/components/tools/fixture/index.ts` | tools-accordion.tsx | ⬜ To verify |

### Tools Components - Trade

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| TradeAnalyzer | `client/src/components/tools/trade/trade-analyzer.tsx` | trade-analyzer.tsx | ⬜ To verify |
| TradeCalculatorModal | `client/src/components/tools/trade/trade-calculator-modal.tsx` | lineup.tsx | ⬜ To verify |
| TeamUploader | `client/src/components/tools/trade/team-uploader.tsx` | team-page.tsx | ⬜ To verify |

### Tools Components - Other

| Component | File Path | Used In | Status |
|-----------|-----------|---------|--------|
| CollapsibleTool | `client/src/components/tools/collapsible-tool.tsx` | tools-accordion.tsx | ⬜ To verify |

### UI Components (Shadcn/UI) - 50 files

Located at: `client/src/components/ui/`

| Component | Status |
|-----------|--------|
| accordion.tsx | ⬜ To verify |
| alert-dialog.tsx | ⬜ To verify |
| alert.tsx | ⬜ To verify |
| aspect-ratio.tsx | ⬜ To verify |
| avatar.tsx | ⬜ To verify |
| badge.tsx | ⬜ To verify |
| breadcrumb.tsx | ⬜ To verify |
| button.tsx | ⬜ To verify |
| calendar.tsx | ⬜ To verify |
| card.tsx | ⬜ To verify |
| carousel.tsx | ⬜ To verify |
| chart.tsx | ⬜ To verify |
| checkbox.tsx | ⬜ To verify |
| collapsible.tsx | ⬜ To verify |
| command.tsx | ⬜ To verify |
| context-menu.tsx | ⬜ To verify |
| dialog.tsx | ⬜ To verify |
| drawer.tsx | ⬜ To verify |
| dropdown-menu.tsx | ⬜ To verify |
| error-boundary.tsx | ⬜ To verify |
| form.tsx | ⬜ To verify |
| hover-card.tsx | ⬜ To verify |
| input-otp.tsx | ⬜ To verify |
| input.tsx | ⬜ To verify |
| label.tsx | ⬜ To verify |
| loading-skeleton.tsx | ⬜ To verify |
| menubar.tsx | ⬜ To verify |
| navigation-menu.tsx | ⬜ To verify |
| pagination.tsx | ⬜ To verify |
| player-link.tsx | ⬜ To verify |
| popover.tsx | ⬜ To verify |
| progress.tsx | ⬜ To verify |
| radio-group.tsx | ⬜ To verify |
| resizable.tsx | ⬜ To verify |
| scroll-area.tsx | ⬜ To verify |
| select.tsx | ⬜ To verify |
| separator.tsx | ⬜ To verify |
| sheet.tsx | ⬜ To verify |
| sidebar.tsx | ⬜ To verify |
| skeleton.tsx | ⬜ To verify |
| slider.tsx | ⬜ To verify |
| switch.tsx | ⬜ To verify |
| table.tsx | ⬜ To verify |
| tabs.tsx | ⬜ To verify |
| textarea.tsx | ⬜ To verify |
| toast.tsx | ⬜ To verify |
| toaster.tsx | ⬜ To verify |
| toggle-group.tsx | ⬜ To verify |
| toggle.tsx | ⬜ To verify |
| tooltip.tsx | ⬜ To verify |

---

## 🪝 PHASE 3: Verify Hooks

**Goal:** Confirm all hooks exist and are properly exported.

### Hooks Structure

```
client/src/hooks/
├── platform/
│   ├── use-platform.ts
│   └── use-touch-optimization.ts
├── responsive/
│   └── use-breakpoint.ts
├── use-mobile.tsx
└── use-toast.ts
```

### Hooks Checklist

| Hook | File Path | Used In | Status |
|------|-----------|---------|--------|
| useIsMobile | `client/src/hooks/use-mobile.tsx` | App.tsx | ⬜ To verify |
| useToast | `client/src/hooks/use-toast.ts` | profile.tsx, lineup.tsx | ⬜ To verify |
| usePlatform | `client/src/hooks/platform/use-platform.ts` | hardened-demo.tsx | ⬜ To verify |
| useTouchOptimization | `client/src/hooks/platform/use-touch-optimization.ts` | - | ⬜ To verify |
| useBreakpoint | `client/src/hooks/responsive/use-breakpoint.ts` | hardened-demo.tsx | ⬜ To verify |

---

## 📚 PHASE 4: Verify Libs/Utils

**Goal:** Map all utility functions and library files.

### Lib Structure

```
client/src/lib/
├── pwa/
│   ├── pwa-utils.ts
│   └── register-service-worker.ts
├── utils/
│   ├── debounce.ts
│   └── ssr.ts
├── queryClient.ts
└── utils.ts
```

### Utils Structure

```
client/src/utils/
├── index.ts          # Re-exports all utils
├── utils.ts          # Core utilities
├── positions.ts      # Position-related utilities
└── team-utils.ts     # Team calculation utilities
```

### Lib/Utils Checklist

| File | Path | Used In | Status |
|------|------|---------|--------|
| queryClient | `client/src/lib/queryClient.ts` | App.tsx, lineup.tsx | ⬜ To verify |
| cn (utils) | `client/src/lib/utils.ts` | UI components | ⬜ To verify |
| pwa-utils | `client/src/lib/pwa/pwa-utils.ts` | hardened-demo.tsx | ⬜ To verify |
| register-service-worker | `client/src/lib/pwa/register-service-worker.ts` | main.tsx | ⬜ To verify |
| debounce | `client/src/lib/utils/debounce.ts` | - | ⬜ To verify |
| ssr | `client/src/lib/utils/ssr.ts` | - | ⬜ To verify |
| utils (index) | `client/src/utils/index.ts` | dashboard.tsx | ⬜ To verify |
| calculatePlayerTypesByPosition | `client/src/utils/utils.ts` | dashboard.tsx | ⬜ To verify |
| categorizePlayersByPrice | `client/src/utils/utils.ts` | dashboard.tsx | ⬜ To verify |
| positions | `client/src/utils/positions.ts` | - | ⬜ To verify |
| team-utils | `client/src/utils/team-utils.ts` | - | ⬜ To verify |

---

## 🚦 PHASE 5: Verify Routes

**Goal:** Document all routes and their associated components.

### Routes Defined in App.tsx

| Route Path | Component | Layout | Status |
|------------|-----------|--------|--------|
| `/` | Dashboard | MainLayout | ⬜ To verify |
| `/player-stats` | PlayerStats | MainLayout | ⬜ To verify |
| `/lineup` | Lineup | MainLayout | ⬜ To verify |
| `/leagues` | Leagues | MainLayout | ⬜ To verify |
| `/stats` | Stats | MainLayout | ⬜ To verify |
| `/profile` | UserProfile | MainLayout | ⬜ To verify |
| `/trade-analyzer` | TradeAnalyzer | MainLayout | ⬜ To verify |
| `/tools-accordion` | ToolsAccordion | MainLayout | ⬜ To verify |
| `/team` | TeamPage | MainLayout | ⬜ To verify |
| `/preview-tool` | PreviewTool | MainLayout | ⬜ To verify |
| `/hardened-demo` | HardenedDemo | **No Layout** | ⬜ To verify |
| `*` (catch-all) | NotFound | None | ⬜ To verify |

---

## 📦 PHASE 6: Verify External Dependencies

**Goal:** Document all npm packages used by the frontend.

### Core Dependencies (from package.json)

| Package | Purpose | Status |
|---------|---------|--------|
| react | UI framework | ⬜ To verify |
| react-dom | DOM rendering | ⬜ To verify |
| wouter | Routing | ⬜ To verify |
| @tanstack/react-query | Data fetching/caching | ⬜ To verify |
| lucide-react | Icons | ⬜ To verify |
| recharts | Charts | ⬜ To verify |
| tailwindcss | Styling | ⬜ To verify |
| class-variance-authority | Component variants | ⬜ To verify |
| clsx | Class merging | ⬜ To verify |
| tailwind-merge | Tailwind class merging | ⬜ To verify |
| @radix-ui/* | UI primitives (Shadcn) | ⬜ To verify |

---

## 🔒 PHASE 7: Verify Environment Variables

**Goal:** Document all environment variables used.

### Environment Variables Checklist

| Variable | Used In | Required | Status |
|----------|---------|----------|--------|
| (None found in frontend code) | - | - | ⬜ To verify |

**Note:** Most environment variables are likely in the backend. Frontend may use API URLs that are relative.

---

## 📝 PHASE 8: Verify Types

**Goal:** Document all TypeScript type definitions.

### Type Definition Files

| File | Path | Status |
|------|------|--------|
| player-types.ts | `client/src/components/player-stats/player-types.ts` | ⬜ To verify |
| team-types.ts | `client/src/components/lineup/team-types.ts` | ⬜ To verify |

### Inline Types (in pages)

| Page | Types Defined | Status |
|------|---------------|--------|
| dashboard.tsx | Player, FantasyRoundData, FantasyTeamData | ⬜ To verify |
| player-stats.tsx | Player | ⬜ To verify |
| lineup.tsx | LineupPlayer, Team, TeamPlayer, Player | ⬜ To verify |
| leagues.tsx | League, LeagueTeam, Matchup | ⬜ To verify |
| stats.tsx | DVPData, DVPMatrix | ⬜ To verify |

---

## 🗂️ Legacy Files

**Goal:** Identify legacy code that may need migration or cleanup.

### Legacy Directory

```
client/src/legacy/
├── App.tsx.bak
├── heat-map-view.tsx.rollback
├── new-player-stats.tsx
├── player-stats-redesign.tsx
├── stats.tsx.fixed
└── services/
    ├── aiService.ts
    ├── captainService.ts
    ├── cashService.ts
    ├── contextService.ts
    ├── fixtureService.ts
    ├── priceService.ts
    ├── riskService.ts
    ├── roleService.ts
    └── teamService.ts
```

### Legacy Files Checklist

| File | Currently Used | Action Needed | Status |
|------|----------------|---------------|--------|
| new-player-stats.tsx | Yes (stats.tsx) | Keep or refactor | ⬜ To verify |
| teamService.ts | Yes (lineup.tsx) | Keep | ⬜ To verify |
| Other services | Unknown | Verify usage | ⬜ To verify |
| .bak/.rollback files | No | Consider removal | ⬜ To verify |

---

## 🎯 Verification Workflow Summary

### Phase Execution Order

```
PHASE 1: Pages         ━━━━━━━━━━━━━━━━━━━━ 12 items
    ↓
PHASE 2: Components    ━━━━━━━━━━━━━━━━━━━━ 100+ items
    ↓
PHASE 3: Hooks         ━━━━━━━━━━━━━━━━━━━━ 5 items
    ↓
PHASE 4: Libs/Utils    ━━━━━━━━━━━━━━━━━━━━ 10+ items
    ↓
PHASE 5: Routes        ━━━━━━━━━━━━━━━━━━━━ 12 items
    ↓
PHASE 6: Dependencies  ━━━━━━━━━━━━━━━━━━━━ 10+ items
    ↓
PHASE 7: Environment   ━━━━━━━━━━━━━━━━━━━━ TBD
    ↓
PHASE 8: Types         ━━━━━━━━━━━━━━━━━━━━ 5+ files
```

### How to Use This Document

1. **Start with Phase 1**: Open each page file, verify it exists
2. **Record imports**: For each page, list all its imports
3. **Cross-reference Phase 2**: Check if imported components exist
4. **Mark checkboxes**: Use ✅ for verified, ⚠️ for issues, ❌ for broken
5. **Document issues**: Note any path mismatches, missing files, or errors

### Verification Criteria

For each item, verify:
- [ ] File exists at the documented path
- [ ] Exports match import statements
- [ ] No TypeScript errors
- [ ] Import paths use correct alias (`@/` or relative)
- [ ] No circular dependencies

---

## 📊 Summary Statistics

| Category | Total Items | Verified | Issues |
|----------|-------------|----------|--------|
| Pages | 12 | 0 | 0 |
| Layout Components | 3 | 0 | 0 |
| Dashboard Components | 3 | 0 | 0 |
| Player Stats Components | 12 | 0 | 0 |
| Lineup Components | 4 | 0 | 0 |
| Leagues Components | 3 | 0 | 0 |
| Error Components | 2 | 0 | 0 |
| Responsive Components | 3 | 0 | 0 |
| Tools Components | 25 | 0 | 0 |
| UI Components | 50 | 0 | 0 |
| Hooks | 5 | 0 | 0 |
| Libs/Utils | 10+ | 0 | 0 |
| Routes | 12 | 0 | 0 |
| Types | 5+ | 0 | 0 |
| **TOTAL** | **~150** | **0** | **0** |

---

## ⚠️ Known Issues from Initial Analysis

1. **Unused page file**: `client/src/pages/fantasy-tools.tsx` exists but is not imported in App.tsx
2. **Legacy folder**: Contains backup files and legacy services that may or may not be in use
3. **Duplicate utilities**: Both `client/src/lib/utils.ts` and `client/src/utils/utils.ts` exist
4. **Inconsistent naming**: Some components use PascalCase files, others use kebab-case

---

## 🚀 Next Steps (After Review)

Once this plan is reviewed and approved:

1. Begin Phase 1 verification of all 12 pages
2. Create a detailed import map for each page
3. Run TypeScript compiler to identify any type errors
4. Test each route in the application
5. Document findings in this plan

---

**Document Status:** READY FOR REVIEW  
**Last Updated:** December 2, 2025  
**Author:** Automated analysis from App.tsx
