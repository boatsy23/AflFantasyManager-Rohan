#!/bin/bash
set -euo pipefail
echo "🎯 SCRIPT 1: HARDENED PROJECT STRUCTURE & SAFETY"

# Safety: Create backup commit
echo "📦 Creating safety backup..."
git add -A > /dev/null 2>&1 || true
git commit -m "pre-refactor-backup-$(date +%Y%m%d-%H%M%S)" --no-verify > /dev/null 2>&1 || echo "Backup commit skipped (no changes)"

# Validate and fix project structure
echo "🔍 Validating project structure..."
[ -d "client/src" ] || { echo "❌ client/src not found"; exit 1; }

# Configure TypeScript paths FIRST to prevent import errors
echo "⚙️  Configuring TypeScript paths..."
TS_CONFIG="client/tsconfig.json"
if [ -f "$TS_CONFIG" ]; then
    node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$TS_CONFIG', 'utf8'));
    config.compilerOptions = config.compilerOptions || {};
    config.compilerOptions.baseUrl = '.';
    config.compilerOptions.paths = {
      '@/*': ['src/*'],
      '@/components/*': ['src/components/*'],
      '@/hooks/*': ['src/hooks/*'], 
      '@/lib/*': ['src/lib/*'],
      '@/types/*': ['src/types/*']
    };
    fs.writeFileSync('$TS_CONFIG', JSON.stringify(config, null, 2));
    console.log('✅ TypeScript paths configured');
    "
else
    echo "❌ tsconfig.json not found"
    exit 1
fi

# Create essential directory structure
echo "🏗️  Creating project structure..."
mkdir -p client/src/{components/responsive,components/error,components/layout,hooks/platform,hooks/responsive,types,lib/{pwa,utils,performance}}

# Create critical utilities FIRST (needed by other scripts)
echo "🔧 Creating core utilities..."

# SSR safety utility
cat > client/src/lib/utils/ssr.ts << 'EOF'
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;
EOF

# Debounce utility for performance
cat > client/src/lib/utils/debounce.ts << 'EOF'
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}
EOF

# Create minimal service worker (no placeholders)
mkdir -p public
cat > public/sw.js << 'EOF'
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
EOF

# Create clean manifest (no screenshots until real assets)
cat > public/manifest.json << 'EOF'
{
  "name": "AFL Fantasy Manager",
  "short_name": "AFL Fantasy", 
  "description": "Professional AFL Fantasy team management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
EOF

# Create placeholder icons directory (only what's referenced)
mkdir -p public/icons
touch public/icons/icon-192x192.png public/icons/icon-512x512.png

echo "✅ Hardened project structure complete"
