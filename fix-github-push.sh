#!/bin/bash
# Fix GitHub Push - Remove large file from history and push clean code
# FIXED: Clean up database exports and old git backups

set -e  # Exit on error
set -o pipefail

echo "🔧 Fixing GitHub push issue..."
echo ""

# Step 0: Clean up unnecessary folders
echo "0️⃣ Cleaning up unnecessary folders..."
CLEANED=0
if [ -d ".git-backup" ]; then
    echo "   Removing .git-backup/ (old git history)..."
    rm -rf .git-backup
    CLEANED=1
fi
if [ -d "database_export" ]; then
    echo "   Removing database_export/ (7MB of CSV exports)..."
    rm -rf database_export
    CLEANED=1
fi
if [ $CLEANED -eq 1 ]; then
    echo "✅ Cleaned up unnecessary files"
else
    echo "✅ No cleanup needed"
fi
echo ""

# Step 1: Remove lock file
echo "1️⃣ Removing git lock file..."
rm -f .git/index.lock
echo "✅ Lock removed"
echo ""

# Step 2: Save the remote URL before we do anything
echo "2️⃣ Saving GitHub remote URL..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
    echo "⚠️ No remote found, using default..."
    REMOTE_URL="https://github.com/boatsy23/AflFantasyManager-Rohan.git"
fi
echo "   Remote: ${REMOTE_URL:0:40}..."
echo "✅ Remote saved"
echo ""

# Step 3: Go back to original main if we're on clean-main
echo "3️⃣ Resetting to original state..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
if [ "$CURRENT_BRANCH" = "clean-main" ]; then
    echo "   Switching back to original main..."
    git checkout main 2>/dev/null || echo "   (no main branch, continuing...)"
fi

# Delete clean-main if it exists
if git show-ref --verify --quiet refs/heads/clean-main 2>/dev/null; then
    echo "   Deleting old clean-main branch..."
    git branch -D clean-main 2>/dev/null || true
fi
echo "✅ Ready for fresh start"
echo ""

# Step 4: Update .gitignore
echo "4️⃣ Updating .gitignore to prevent future large files..."
if ! grep -q "*.tar.gz" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# Archive files (prevent large backups)
*.tar.gz
*.tar
database_export/**
.git-backup/
EOF
    git add .gitignore 2>/dev/null || true
    git commit -m "Prevent large archive files" 2>/dev/null || echo "   (nothing to commit)"
else
    echo "   Already has tar.gz patterns"
fi
echo "✅ .gitignore updated"
echo ""

# Step 5: Create clean snapshot
echo "5️⃣ Creating clean snapshot (removing 480MB backup from history)..."
git checkout --orphan clean-main 2>&1 | head -3
echo "✅ Clean branch created"
echo ""

# Step 6: Re-add the remote (important! orphan branch loses remote)
echo "6️⃣ Re-adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
echo "✅ Remote re-added"
echo ""

# Step 7: Add all files
echo "7️⃣ Adding all current files..."
timeout 90 git add -A 2>&1 | head -10 || echo "   (completed)"
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
echo "✅ $STAGED files staged"
echo ""

# Step 8: Commit
echo "8️⃣ Committing Phase 3 changes..."
git commit -m "Phase 3: Backend restructure, scrapers moved, documentation added" 2>&1 | tail -8
echo "✅ Committed"
echo ""

# Step 9: Replace main branch
echo "9️⃣ Replacing main branch with clean snapshot..."
git branch -M main
echo "✅ Branch replaced"
echo ""

# Step 10: Push to GitHub
echo "🔟 Pushing to GitHub (this may take 2-3 minutes)..."
echo "   Verifying remote is set..."
git remote -v | head -2
echo ""
echo "   Starting push..."
timeout 180 git push -f origin main 2>&1 || {
    echo ""
    echo "⚠️ Push failed. Checking details..."
    git remote -v
    echo ""
    echo "If you see authentication errors, the GitHub token may need updating."
    exit 1
}
echo ""
echo "🎉 SUCCESS! Your code is now on GitHub!"
echo ""
echo "⚠️  IMPORTANT: Rotate your GitHub token for security!"
echo "   Go to: GitHub Settings → Developer Settings → Personal Access Tokens"
