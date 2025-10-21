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
