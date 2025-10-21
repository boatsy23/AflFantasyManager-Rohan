# Hardened Features Documentation

This document describes the hardened features that have been added to the AFL Fantasy Manager application to improve error handling, platform detection, responsive design, and PWA support.

## Overview

The hardening implementation includes:

1. **Error Handling** - Robust error boundaries for graceful error handling
2. **Platform Detection** - Smart detection of device type, OS, and capabilities
3. **Responsive Components** - Mobile-first components with touch optimization
4. **PWA Integration** - Progressive Web App support with service workers
5. **Project Structure** - Organized utilities and safety features

## Components

### Error Boundaries

#### ErrorBoundary
Location: `client/src/components/error/ErrorBoundary.tsx`

A general-purpose error boundary that catches errors in child components and displays a fallback UI.

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### ToolErrorBoundary
Location: `client/src/components/error/ToolErrorBoundary.tsx`

Specialized error boundary for tool components with custom styling.

```tsx
import { ToolErrorBoundary } from '@/components/error/ToolErrorBoundary';

<ToolErrorBoundary toolName="Trade Analyzer">
  <TradeAnalyzerTool />
</ToolErrorBoundary>
```

### Responsive Components

#### ResponsiveContainer
Location: `client/src/components/responsive/ResponsiveContainer.tsx`

A container that adapts styling based on platform (mobile/tablet/desktop).

```tsx
import { ResponsiveContainer } from '@/components/responsive/ResponsiveContainer';

<ResponsiveContainer
  mobileClass="p-2"
  tabletClass="p-4"
  desktopClass="p-6"
>
  <Content />
</ResponsiveContainer>
```

#### TouchButton
Location: `client/src/components/responsive/TouchButton.tsx`

Touch-optimized button with accessibility features and proper touch target sizing.

```tsx
import { TouchButton } from '@/components/responsive/TouchButton';

<TouchButton
  label="Save Changes"
  onClick={handleSave}
>
  Save
</TouchButton>
```

#### ResponsiveDataTable
Location: `client/src/components/responsive/ResponsiveDataTable.tsx`

Adaptive data table that switches between table and card views based on screen size.

```tsx
import { ResponsiveDataTable } from '@/components/responsive/ResponsiveDataTable';

<ResponsiveDataTable
  data={players}
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'score', label: 'Score', mobileHidden: true },
  ]}
  keyField="id"
  onRowClick={handlePlayerClick}
/>
```

## Hooks

### Platform Detection

#### usePlatform
Location: `client/src/hooks/platform/use-platform.ts`

Detects device platform, OS, touch capability, and PWA status.

```tsx
import { usePlatform } from '@/hooks/platform/use-platform';

const { platform, os, isTouch, isStandalone, screenSize } = usePlatform();

// platform: 'mobile' | 'tablet' | 'desktop'
// os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
// isTouch: boolean
// isStandalone: boolean (PWA mode)
// screenSize: { width: number; height: number }
```

#### useTouchOptimization
Location: `client/src/hooks/platform/use-touch-optimization.ts`

Provides utilities for touch-optimized UI elements.

```tsx
import { useTouchOptimization } from '@/hooks/platform/use-touch-optimization';

const { getTouchClass, getAriaProps } = useTouchOptimization();

<button className={getTouchClass('base-class')} {...getAriaProps('Button label')}>
  Click me
</button>
```

### Responsive Hooks

#### useBreakpoint
Location: `client/src/hooks/responsive/use-breakpoint.ts`

Returns the current responsive breakpoint.

```tsx
import { useBreakpoint } from '@/hooks/responsive/use-breakpoint';

const breakpoint = useBreakpoint();
// Returns: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

## Utilities

### SSR Safety
Location: `client/src/lib/utils/ssr.ts`

Utilities for safe server-side rendering checks.

```tsx
import { isClient, isServer } from '@/lib/utils/ssr';

if (isClient) {
  // Only runs in browser
  window.localStorage.setItem('key', 'value');
}
```

### Debounce
Location: `client/src/lib/utils/debounce.ts`

Performance utility for debouncing function calls.

```tsx
import { debounce } from '@/lib/utils/debounce';

const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);
```

### PWA Utilities
Location: `client/src/lib/pwa/pwa-utils.ts`

Utilities for PWA status detection.

```tsx
import { isPWAInstalled, getPWAStatus } from '@/lib/pwa/pwa-utils';

const status = getPWAStatus();
// Returns: { isInstalled: boolean, isMobile: boolean, supportsInstall: boolean }
```

### Service Worker Registration
Location: `client/src/lib/pwa/register-service-worker.ts`

Handles service worker registration for PWA functionality.

```tsx
import { registerServiceWorker } from '@/lib/pwa/register-service-worker';

// Automatically called in main.tsx for production builds
registerServiceWorker();
```

## PWA Support

### Service Worker
Location: `public/sw.js`

Basic service worker implementation for PWA functionality.

### Manifest
Location: `public/manifest.json`

PWA manifest with app metadata and icons.

### Icons
Location: `public/icons/`

PWA icons in required sizes (192x192 and 512x512).

## Integration

The hardened features are integrated into the application in the following ways:

1. **App.tsx** - Wrapped with `ErrorBoundary` at the root level
2. **main.tsx** - Service worker registration for PWA support
3. **index.html** - Manifest link and PWA metadata

## Example Usage

See `client/src/examples/HardenedComponentsExample.tsx` for a comprehensive example demonstrating all hardened features.

## Testing

The hardened features have been validated through:

1. TypeScript compilation check
2. Vite production build
3. Component integration testing

## Performance Considerations

- **Debouncing**: All resize and orientation change listeners use debouncing (150ms) to prevent excessive re-renders
- **SSR Safety**: All browser-specific code is protected with SSR checks
- **Touch Detection**: Touch capabilities are detected once on mount and cached
- **Service Worker**: Only registered in production builds

## Accessibility

- Touch buttons have minimum 44px touch targets (WCAG AAA)
- All interactive elements have proper ARIA labels
- Keyboard navigation support included
- Error messages are screen-reader friendly

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)
- Progressive enhancement for older browsers
- Service worker gracefully degrades if not supported
