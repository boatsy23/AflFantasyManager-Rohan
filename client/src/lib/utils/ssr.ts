// Environment detection utility for build-time checks, not SSR.
export const isBrowser = typeof window !== 'undefined';
export const isNode = !isBrowser;
