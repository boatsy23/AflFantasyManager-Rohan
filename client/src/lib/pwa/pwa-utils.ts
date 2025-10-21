import { isClient } from '@/lib/utils/ssr';

export const isPWAInstalled = (): boolean => {
  if (!isClient) return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

export const getPWAStatus = () => {
  if (!isClient) return { isInstalled: false, isMobile: false, supportsInstall: false };
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const supportsInstall = 'BeforeInstallPromptEvent' in window;
  
  return {
    isInstalled: isPWAInstalled(),
    isMobile,
    supportsInstall,
  };
};
