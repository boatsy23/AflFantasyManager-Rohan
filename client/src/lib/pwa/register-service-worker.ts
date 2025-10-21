import { isClient } from '@/lib/utils/ssr';

export const registerServiceWorker = async (): Promise<void> => {
  if (!isClient || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('swUpdate'));
          }
        });
      }
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};
