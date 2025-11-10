export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;
/**
 * Check if code is running on the client side (browser)
 * Useful for preventing SSR errors with browser-specific APIs
 */
export const isClient = typeof window !== 'undefined';

/**
 * Check if code is running on the server side
 */
export const isServer = !isClient;

/**
 * Safely access window object only if on client side
 * @returns Window object or undefined
 */
export function getWindow(): Window | undefined {
  return isClient ? window : undefined;
}

/**
 * Safely access document object only if on client side
 * @returns Document object or undefined
 */
export function getDocument(): Document | undefined {
  return isClient ? document : undefined;
}
