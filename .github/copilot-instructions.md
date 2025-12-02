# Copilot Instructions for AFL Fantasy Manager

## Project Overview
This is an AFL Fantasy Manager application that helps users manage their AFL Fantasy teams, analyze player statistics, track player values, and make informed decisions about trades and team selection.

## Technology Stack
- **Frontend**: React 18 + TypeScript with Vite
- **UI Components**: shadcn/ui (Radix UI) with Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Schema Validation**: Zod with drizzle-zod
- **Data Scrapers**: Python scripts for AFL data collection

## Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # React components (shadcn/ui)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── pages/           # Page components
│   └── utils/           # Utility functions
├── backend/             # Backend implementation
│   └── src/
│       ├── routes/      # API route handlers
│       ├── services/    # Business logic services
│       └── utils/       # Backend utilities
├── public/server/       # Entry point (proxy to backend)
│   └── data/            # Server data files
├── shared/              # Shared code (database schema)
│   └── schema.ts        # Drizzle ORM schema definitions
├── scrapers/            # Python data scrapers
└── data/                # Data files
```

## Coding Conventions

### TypeScript
- Use strict TypeScript mode with proper type annotations
- Prefer `type` over `interface` for object types
- Use Zod schemas for runtime validation

### React
- Use functional components with hooks
- Prefer TanStack Query for server state management
- Use the shadcn/ui component library for UI elements
- Follow the existing component structure in `client/src/components/`

### Backend
- Express routes should use async/await patterns
- Use Drizzle ORM for all database operations
- Validate request bodies using Zod schemas

### Styling
- Use Tailwind CSS for styling
- Follow the existing theme configuration in `tailwind.config.ts`
- Use the `cn()` utility from `@/lib/utils` for conditional class names

## Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

## Build and Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## Database
- Database schema is defined in `shared/schema.ts`
- Use Drizzle ORM for all database operations
- Player data includes stats, prices, projections, and historical data

## Best Practices
1. Keep components small and focused
2. Use the existing UI components from shadcn/ui
3. Follow the established file naming conventions
4. Add proper TypeScript types for all new code
5. Use the existing hooks pattern for data fetching
6. Validate all API inputs using Zod schemas

## Key Data Types
The main data types are defined in `shared/schema.ts`:
- `Player` - Player information and statistics
- `Team` - User fantasy teams
- `TeamPlayer` - Players assigned to teams
- `PlayerRoundScore` - Individual round-by-round performance data
- `PlayerRoundStats` - Comprehensive round-by-round statistics
- `DfsPlayer` - DFS Australia player data
- `PlayerDvpRating` - Player-specific Defense vs Position ratings
- `TeamDvpRating` - Team-level Defense vs Position ratings
