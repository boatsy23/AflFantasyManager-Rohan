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
