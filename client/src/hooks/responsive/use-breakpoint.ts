import { useState, useEffect } from 'react';
import { debounce } from '@/lib/utils/debounce';
import { isClient } from '@/lib/utils/ssr';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = { xs: 480, sm: 768, md: 1024, lg: 1280, xl: 1536, '2xl': 1920 };

// Helper to get breakpoint from width
function getBreakpointFromWidth(width: number): Breakpoint {
  if (width < breakpoints.xs) return 'xs';
  else if (width < breakpoints.sm) return 'sm';
  else if (width < breakpoints.md) return 'md';
  else if (width < breakpoints.lg) return 'lg';
  else if (width < breakpoints.xl) return 'xl';
  else return '2xl';
}

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (isClient && typeof window !== 'undefined' && typeof window.innerWidth === 'number') {
      return getBreakpointFromWidth(window.innerWidth);
    }
    return 'xs'; // mobile-first default
  });

  useEffect(() => {
    if (!isClient) return;

    const checkBreakpoint = () => {
      const width = window.innerWidth;
      setBreakpoint(getBreakpointFromWidth(width));
    };

    const debouncedResize = debounce(checkBreakpoint, 150);
    checkBreakpoint();
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  return breakpoint;
};
