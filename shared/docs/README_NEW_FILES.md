# 📁 PROJECT STRUCTURE RULEBOOK

## Where to Put New Files (The Law of the Land)

### 1. NEW SERVER CODE (TypeScript)

· Location: /src/server/
· Routes: /src/server/routes/ (e.g., new-feature-api.ts)
· Services: /src/server/services/ (e.g., NewDataService.ts)
· Utils: /src/server/utils/ (e.g., new-data-processor.ts)
· Rule: All server code must be in /src/server/. No exceptions.

### 2. NEW CLIENT CODE (React)

· Location: /src/client/
· Pages: /src/client/pages/ (e.g., NewToolPage.tsx)
· Components: /src/client/components/ (e.g., new-feature/NewComponent.tsx)
· Services: /src/client/services/ (e.g., newFeatureService.ts)
· Rule: All frontend code must be in /src/client/. No exceptions.

### 3. NEW SCRIPTS & DATA PROCESSORS (Python/Node)

· Location: /src/scripts/
· Scrapers: /src/scripts/scrapers/ (e.g., new-site-scraper.py)
· Data Tools: /src/scripts/data-processing/ (e.g., new-algorithm.py)
· Rule: No loose scripts in the root. All tools go in /src/scripts/.

### 4. NEW DATA FILES

· Active Data: /data/processed/ (e.g., new_player_stats.json)
· Raw Uploads: /data/raw/ (e.g., New_Data_Source.xlsx)
· Rule: No data files in the root or /src/. All data lives in /data/.

### 5. NEW ASSETS (Images, Docs, etc.)

· Images: /assets/images/ (e.g., new-ui-screenshot.png)
· Docs: /docs/ (e.g., NEW_FEATURE_SPEC.md)
· Rule: No cluttering the root. Assets have a home.

---

## 🚨 PROHIBITED (Don't Do This)

· NO new files in the root directory (except config files).
· NO new .py scripts outside of /src/scripts/.
· NO new .json or .xlsx files outside of /data/.
· NO new components or pages outside of /src/client/.

## ✅ HOW TO CHECK:

Before creating any file, ask: "Does this belong in /src/, /data/, or /assets/?" Then put it in the correct subfolder.

This will keep your project clean, professional, and scalable forever.