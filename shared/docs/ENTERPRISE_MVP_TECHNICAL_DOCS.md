# AFL Fantasy Intelligence Platform - Enterprise MVP Technical Documentation

## Overview
Enterprise-grade AFL Fantasy analytics platform delivering comprehensive player insights, strategic tools, and league management capabilities with real-time data integration.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend (Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **APIs**: RESTful endpoints with comprehensive error handling
- **Data Processing**: Python integration for advanced analytics
- **Real-time**: WebSocket support for live updates

### Database Schema
```typescript
// Core tables
- users: User authentication and profiles
- teams: Fantasy team compositions
- players: Player statistics and metadata
- fixtures: Match schedules and results
- leagues: League management
- performances: Team performance tracking
```

## Application Routes

### Core Pages
- `/` - Dashboard with team overview and key metrics
- `/player-stats` - Comprehensive player statistics and analysis
- `/lineup` - Team lineup management and optimization
- `/leagues` - League standings and matchups
- `/stats` - Advanced statistics and trends
- `/tools-simple` - Fantasy strategy tools
- `/trade-analyzer` - Trade analysis and recommendations
- `/profile` - User profile and settings

### Page Components

#### Dashboard (`/`)
**Purpose**: Central hub showing team performance, key metrics, and quick actions
**Components**:
- Team Summary Card (current lineup value and structure)
- Performance Chart (weekly score trends)
- Captain Score Tracker
- Team Rank Display
- Quick Action Buttons

**APIs Used**:
- `GET /api/team/data` - Current team composition
- `GET /api/teams/user/{id}` - Team metadata
- `GET /api/teams/{id}/performances` - Performance history

#### Player Stats (`/player-stats`)
**Purpose**: Comprehensive player analysis across multiple categories
**Components**:
- Enhanced Stats Table with 6 categories (Fantasy, Basic, VS, Value, Consistency, DVP)
- Advanced filtering (position, team, price range, search)
- Player Detail Modal with projections and fixture analysis
- Heat Map View for performance visualization

**APIs Used**:
- `GET /api/stats/combined-stats` - All player statistics
- `GET /api/score-projection/all-players` - Projected scores
- `GET /api/stats-tools/stats/team-fixtures/{team}/{position}` - Fixture difficulty

#### Lineup (`/lineup`)
**Purpose**: Team composition management and optimization
**Components**:
- Interactive team lineup display
- Position-based player cards
- Captain/Vice-Captain selection
- Bench management
- Team value tracking

**APIs Used**:
- `GET /api/team/data` - Current lineup
- `POST /api/teams/{id}/players` - Update lineup

#### Tools (`/tools-simple`)
**Purpose**: Strategic analysis tools for fantasy optimization
**Tool Categories**:
1. **Captain Selection** (5 tools)
   - Score Predictor
   - Vice Optimizer
   - Loophole Detector
   - Form Analyzer
   - Matchup Advisor

2. **Cash Generation** (5 tools)
   - Cash Tracker
   - Rookie Price Curve
   - Downgrade Targets
   - Ceiling/Floor Analysis
   - Price Predictor

3. **Trade Analysis** (3 tools)
   - Trade Score Calculator
   - One Up/One Down Suggester
   - Price Difference Delta

4. **Risk Analysis** (5 tools)
   - Tag Watch Monitor
   - Volatility Calculator
   - Consistency Generator
   - Scoring Range Predictor
   - Late Out Risk Estimator

5. **AI Strategy** (4 tools)
   - AI Trade Suggester
   - Team Structure Analyzer
   - AI Captain Advisor
   - Ownership Risk Monitor

6. **Role Analysis** (4 tools)
   - Role Change Detector
   - CBA Trend Analyzer
   - Positional Impact Scoring
   - Possession Type Profiler

7. **Fixture Analysis** (3 tools)
   - Fixture Difficulty Scanner
   - Bye Round Optimizer
   - Venue Performance Analyzer

## API Endpoints

### Core Data APIs
```typescript
// Player Data
GET /api/stats/combined-stats - All player statistics
GET /api/stats/dfs-australia - DFS Australia data
GET /api/stats/footywire - FootyWire data
GET /api/score-projection/player/{name} - Individual projections
GET /api/score-projection/all-players - Batch projections

// Team Management
GET /api/team/data - Current team composition
GET /api/teams/user/{id} - Team metadata
GET /api/teams/{id}/performances - Performance history
POST /api/teams/{id}/players - Update lineup

// League Management
GET /api/leagues/user/{id} - User leagues
GET /api/leagues/{id}/teams - League teams
GET /api/leagues/{id}/matchups/{round} - Round matchups

// DVP and Fixtures
GET /api/stats-tools/stats/dvp-enhanced - DVP analysis
GET /api/stats-tools/stats/team-fixtures/{team}/{position} - Fixture difficulty

// Fantasy Tools
GET /api/captains/* - Captain selection tools (5 endpoints)
GET /api/cash/* - Cash generation tools (5 endpoints)
POST /api/trade_score - Trade analysis
GET /api/risk/* - Risk analysis tools (5 endpoints)
GET /api/ai/* - AI strategy tools (4 endpoints)
```

### Data Processing APIs
```typescript
// Algorithms
GET /api/algorithms/price-predictor - Price predictions
GET /api/algorithms/projected-score - Score projections

// Data Integration
GET /api/data-integration/status - Integration status
POST /api/data-integration/refresh - Manual refresh
```

## Data Models

### Player Data Structure
```typescript
interface Player {
  // Core Information
  id: number;
  name: string;
  position: "MID" | "FWD" | "DEF" | "RUC" | string;
  team: string; // 3-letter code
  price: number;
  category: "Premium" | "Mid-price" | "Rookie";
  
  // Performance Metrics
  averagePoints: number;
  lastScore: number;
  projectedScore: number;
  breakEven: number;
  
  // Fantasy Stats
  roundsPlayed: number;
  l3Average: number; // Last 3 games
  l5Average: number; // Last 5 games
  totalPoints: number;
  priceChange: number;
  selectionPercentage: number;
  
  // Basic Stats
  kicks: number;
  handballs: number;
  disposals: number;
  marks: number;
  tackles: number;
  clearances: number;
  hitouts: number;
  cba: number; // Center bounce attendance %
  
  // Advanced Stats
  standardDeviation: number;
  consistency: number;
  projectedPriceChange: number;
  opponentDifficulty: number;
  venuePerformance: number;
  
  // Status
  isInjured: boolean;
  isSuspended: boolean;
}
```

### Team Data Structure
```typescript
interface Team {
  id: number;
  userId: number;
  name: string;
  value: number;
  players: TeamPlayer[];
  captainId?: number;
  viceCaptainId?: number;
}

interface TeamPlayer {
  playerId: number;
  position: string;
  isOnBench: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
}
```

## Error Handling

### Frontend Error Boundaries
```typescript
// Global error boundary for unhandled errors
// Component-level error states for API failures
// Form validation with user-friendly messages
// Loading states for all async operations
```

### Backend Error Responses
```typescript
// Standardized error response format
interface ApiError {
  error: string;
  message: string;
  code: number;
  details?: any;
}

// HTTP Status Codes
200 - Success
400 - Bad Request (validation errors)
401 - Unauthorized
404 - Not Found
500 - Internal Server Error
```

## Performance Optimization

### Frontend
- React.memo for expensive component renders
- TanStack Query for intelligent caching
- Lazy loading for route components
- Virtualized tables for large datasets
- Image optimization and lazy loading

### Backend
- Response caching for static data
- Database query optimization
- Connection pooling
- Rate limiting
- GZIP compression

## Security

### Authentication
- JWT-based authentication
- Secure session management
- Password hashing with bcrypt
- CORS configuration

### Data Validation
- Zod schemas for type-safe validation
- SQL injection prevention
- XSS protection
- Input sanitization

## Testing Strategy

### Frontend Testing
```typescript
// Unit tests for utility functions
// Component testing with React Testing Library
// Integration tests for user workflows
// E2E tests for critical paths
```

### Backend Testing
```typescript
// Unit tests for business logic
// Integration tests for API endpoints
// Database integration tests
// Performance testing for data processing
```

## Deployment

### Environment Configuration
```bash
# Development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/afl_fantasy_dev
PORT=5000

# Production
NODE_ENV=production
DATABASE_URL=postgresql://prod_db_url
PORT=5000
```

### Build Process
```bash
# Frontend build
npm run build:client

# Backend compilation
npm run build:server

# Database migrations
npm run db:push
```

## Monitoring and Analytics

### Application Metrics
- Response times for all API endpoints
- Error rates and types
- User engagement metrics
- Database performance

### Business Metrics
- User activity patterns
- Feature usage statistics
- Trade success rates
- Prediction accuracy

## Maintenance

### Regular Tasks
- Database backup and cleanup
- Log rotation and analysis
- Security updates
- Performance monitoring
- Data validation checks

### Scaling Considerations
- Horizontal scaling for API servers
- Database read replicas
- CDN for static assets
- Caching layer optimization

## Support and Documentation

### User Documentation
- Feature guides and tutorials
- FAQ and troubleshooting
- API documentation for developers
- Video walkthroughs

### Developer Documentation
- Code standards and conventions
- Contribution guidelines
- Architecture decision records
- Deployment procedures

## Future Enhancements

### Planned Features
- Real-time score updates
- Advanced AI predictions
- Social features and leagues
- Mobile application
- API rate limiting and quotas

### Technical Improvements
- Microservices architecture
- Event-driven updates
- Advanced caching strategies
- Machine learning integration
- Progressive Web App features