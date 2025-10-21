# File Tree Restructuring Plan

## CURRENT PROBLEMS
1. Backend code in `public/server/` (wrong location)
2. Python scripts scattered (root + public/server/ + src/scripts/)
3. No proper separation of concerns
4. Mixed frontend/backend in same project

## NEW STRUCTURE
```
afl-fantasy-app/
├── backend/           # Node.js/Express API
├── frontend/          # React application
├── scrapers/          # Python data collection
├── shared/            # Shared types/config
└── data/              # Data management
```

## MIGRATION STEPS

### STEP 1: BACKEND MIGRATION
Move from `public/server/` to `backend/src/`:
- routes/* → backend/src/routes/
- services/* → backend/src/services/
- *.ts utilities → backend/src/utils/

### STEP 2: PYTHON SCRIPTS MIGRATION  
Move all Python scripts to `scrapers/`:
- dfs_parser.py → scrapers/
- afl_fantasy_data_service.py → scrapers/
- run_dfs_pipeline.py → scrapers/

### STEP 3: FRONTEND CLEANUP
Keep `client/src/` but remove:
- Unused components (verify first)
- Broken service files (already done)

## VERIFICATION CHECKLIST
- [ ] All imports updated to new paths
- [ ] Server starts with new structure
- [ ] All APIs still work
- [ ] Frontend can connect to backend
- [ ] Python scripts still executable
