# AFL Fantasy Manager

An advanced AFL fantasy football data intelligence platform that provides comprehensive player analytics, trade optimization, and predictive insights for fantasy sports enthusiasts.

## Features

- Comprehensive player analytics
- Real-time player data tracking
- Trade analysis and optimization
- Multi-source data integration
- Team lineup management
- Mobile-responsive design

## Setup Instructions

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/afl-fantasy-manager.git
   cd afl-fantasy-manager
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Add player data**
   - Place your player data CSV in the `attached_assets` folder
   - If needed, run the import script to update player data:
     ```
     node import_r7_stats.js
     ```

4. **Start the development server**
   ```
   npm run dev
   ```

5. **Access the application**
   - The application should now be running at http://localhost:5000

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express API
- `/shared` - Shared data models
- `*.js` - Various data processing and utility scripts

## Data Sources

The application uses data from:
- AFL Fantasy official stats
- Round-by-round player performance data
- Breakeven calculations
- Multiple player metrics (averages, projections, etc.)

## Technology Stack

- React.js for interactive UI
- TypeScript for type safety
- Express.js backend
- Tailwind CSS for styling
- Tanstack Query for data fetching
- JSON-based data storage