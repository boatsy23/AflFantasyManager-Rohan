#!/bin/bash
set -euo pipefail
echo "🎯 SCRIPT 2: HARDENED PLATFORM HOOK WITH DEBOUNCE"

# Create platform detection hook with SSR safety and debouncing
cat > client/src/hooks/platform/use-platform.ts << 'EOF'
import { useState, useEffect } from 'react';
import { debounce } from '@/lib/utils/debounce';
import { isClient } from '@/lib/utils/ssr';

export type Platform = 'mobile' | 'tablet' | 'desktop';
export type OS = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

export interface PlatformInfo {
  platform: Platform;
  os: OS;
  isTouch: boolean;
  isStandalone: boolean;
  screenSize: { width: number; height: number };
}

const defaultPlatformInfo: PlatformInfo = {
  platform: 'desktop',
  os: 'unknown', 
  isTouch: false,
  isStandalone: false,
  screenSize: { width: 1024, height: 768 }
};

export const usePlatform = (): PlatformInfo => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(defaultPlatformInfo);

  useEffect(() => {
    if (!isClient) return;

    const detectPlatform = (): PlatformInfo => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let platform: Platform = 'desktop';
      if (width < 768) platform = 'mobile';
      else if (width < 1024) platform = 'tablet';

      const userAgent = navigator.userAgent.toLowerCase();
      let os: OS = 'unknown';
      if (/iphone|ipad|ipod/.test(userAgent)) os = 'ios';
      else if (/android/.test(userAgent)) os = 'android';
      else if (/win/.test(userAgent)) os = 'windows';
      else if (/mac/.test(userAgent)) os = 'macos';
      else if (/linux/.test(userAgent)) os = 'linux';

      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      return { platform, os, isTouch, isStandalone, screenSize: { width, height } };
    };

    const updatePlatform = () => setPlatformInfo(detectPlatform());
    const debouncedResize = debounce(updatePlatform, 150);

    updatePlatform();
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
    };
  }, []);

  return platformInfo;
};
EOF

# Create responsive breakpoint hook
cat > client/src/hooks/responsive/use-breakpoint.ts << 'EOF'
import { useState, useEffect } from 'react';
import { debounce } from '@/lib/utils/debounce';
import { isClient } from '@/lib/utils/ssr';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1536, '2xl': 1920 };

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    if (!isClient) return;

    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < breakpoints.xs) setBreakpoint('xs');
      else if (width < breakpoints.sm) setBreakpoint('sm');
      else if (width < breakpoints.md) setBreakpoint('md');
      else if (width < breakpoints.lg) setBreakpoint('lg');
      else if (width < breakpoints.xl) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    const debouncedResize = debounce(checkBreakpoint, 150);
    checkBreakpoint();
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  return breakpoint;
};
EOF

# Create touch optimization hook
cat > client/src/hooks/platform/use-touch-optimization.ts << 'EOF'
import { usePlatform } from './use-platform';

export const useTouchOptimization = () => {
  const { isTouch, platform } = usePlatform();
  
  const getTouchClass = (baseClass: string = '') => {
    return isTouch ? `${baseClass} min-h-[44px] min-w-[44px] active:scale-95` : baseClass;
  };

  const getAriaProps = (label: string) => ({
    'aria-label': label,
    role: 'button' as const,
  });

  return { isTouch, platform, getTouchClass, getAriaProps };
};
EOF

echo "✅ Hardened platform hooks created"
