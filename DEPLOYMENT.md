# Deployment Guide

## CURRENT SETUP
- **Platform**: Replit
- **Command**: `npm run dev`
- **Port**: 5000
- **Frontend**: Vite + Express on same port

## STARTUP PROCESS
1. `npm run dev` starts both frontend and backend
2. Express serves API routes and static assets
3. Vite handles React development server
4. Python scripts run separately

## DEPENDENCIES
- Backend: Express, TypeScript, Drizzle ORM
- Frontend: React, Vite, Tailwind CSS
- Python: Data scraping scripts
