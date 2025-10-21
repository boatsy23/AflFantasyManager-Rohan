# Hardened Features Documentation

This document describes the hardened improvements implemented in the AFL Fantasy Manager application.

## Overview

Five key areas have been hardened to improve reliability, performance, and user experience:

1. Error Handling
2. Platform Hooks
3. Project Structure & Safety
4. PWA & App Integration
5. Responsive Components

## 1. Error Handling

### ErrorBoundary Component
Location: `client/src/components/error/ErrorBoundary.tsx`

A React error boundary that catches JavaScript errors anywhere in the child component tree and displays a fallback UI instead of crashing the entire app.

**Features:**
- Catches and logs errors with React ErrorInfo
- Provides a user-friendly fallback UI
- Allows custom fallback components
- Includes a "Try Again" button to reset the error state

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### ToolErrorBoundary Component
Location: `client/src/components/error/ToolErrorBoundary.tsx`

A specialized error boundary for tool components with a more compact error display.

**Usage:**
```tsx
import { ToolErrorBoundary } from '@/components/error/ToolErrorBoundary';

<ToolErrorBoundary toolName="Trade Analyzer">
  <TradeAnalyzerTool />
</ToolErrorBoundary>
```

## 2. Platform Hooks

### usePlatform Hook
Location: `client/src/hooks/platform/use-platform.ts`

Detects and provides information about the user's platform with debounced resize handling.

**Returns:**
```typescript
interface PlatformInfo {
  platform: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  isTouch: boolean;
  isStandalone: boolean;
  screenSize: { width: number; height: number };
}
```

**Features:**
- Automatic platform detection based on screen width
- OS detection from user agent
- Touch capability detection
- PWA standalone mode detection
- Debounced resize and orientation change events (150ms)
- SSR-safe with proper defaults

**Usage:**
```tsx
import { usePlatform } from '@/hooks/platform/use-platform';

const MyComponent = () => {
  const { platform, os, isTouch } = usePlatform();
  
  return (
    <div>
      Platform: {platform}, OS: {os}, Touch: {isTouch ? 'Yes' : 'No'}
    </div>
  );
};
```

### useBreakpoint Hook
Location: `client/src/hooks/responsive/use-breakpoint.ts`

Provides the current breakpoint based on screen width.

**Returns:** `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'`

**Breakpoints:**
- xs: < 480px
- sm: 480-768px
- md: 768-1024px
- lg: 1024-1280px
- xl: 1280-1536px
- 2xl: > 1536px

**Usage:**
```tsx
import { useBreakpoint } from '@/hooks/responsive/use-breakpoint';

const MyComponent = () => {
  const breakpoint = useBreakpoint();
  return <div>Current breakpoint: {breakpoint}</div>;
};
```

### useTouchOptimization Hook
Location: `client/src/hooks/platform/use-touch-optimization.ts`

Provides utilities for touch-optimized UI elements.

**Features:**
- Touch-friendly minimum sizes (44x44px)
- Active state scaling
- Accessibility props generation

**Usage:**
```tsx
import { useTouchOptimization } from '@/hooks/platform/use-touch-optimization';

const MyComponent = () => {
  const { getTouchClass, getAriaProps } = useTouchOptimization();
  
  return (
    <button 
      className={getTouchClass('px-4 py-2')}
      {...getAriaProps('Submit form')}
    >
      Submit
    </button>
  );
};
```

## 3. Project Structure & Safety

### SSR Safety Utilities
Location: `client/src/lib/utils/ssr.ts`

Provides utilities to check if code is running on client or server.

```typescript
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;
```

### Debounce Utility
Location: `client/src/lib/utils/debounce.ts`

Generic debounce function for performance optimization.

**Usage:**
```typescript
import { debounce } from '@/lib/utils/debounce';

const handleResize = debounce(() => {
  console.log('Resized!');
}, 300);

window.addEventListener('resize', handleResize);
```

## 4. PWA & App Integration

### PWA Utilities
Location: `client/src/lib/pwa/pwa-utils.ts`

Utilities for checking PWA status and capabilities.

**Functions:**
- `isPWAInstalled()`: Check if app is running in standalone mode
- `getPWAStatus()`: Get comprehensive PWA status

**Usage:**
```typescript
import { getPWAStatus } from '@/lib/pwa/pwa-utils';

const status = getPWAStatus();
console.log(status.isInstalled, status.isMobile, status.supportsInstall);
```

### Service Worker Registration
Location: `client/src/lib/pwa/register-service-worker.ts`

Handles service worker registration with update detection.

**Features:**
- Automatic registration in production
- Update detection
- Custom 'swUpdate' event dispatch

### PWA Configuration Files

**Manifest** (`client/public/manifest.json`):
- App name, description, and icons
- Standalone display mode
- Portrait orientation
- Theme colors

**Service Worker** (`client/public/sw.js`):
- Basic service worker for PWA support
- Automatic installation and activation
- Network-first fetch strategy

### App Integration
The app has been updated to:
- Wrap all components with ErrorBoundary
- Register service worker in production
- Include PWA meta tags in index.html

## 5. Responsive Components

### ResponsiveContainer Component
Location: `client/src/components/responsive/ResponsiveContainer.tsx`

A container that applies different classes based on the current platform.

**Usage:**
```tsx
import { ResponsiveContainer } from '@/components/responsive/ResponsiveContainer';

<ResponsiveContainer
  mobileClass="text-sm p-2"
  tabletClass="text-base p-4"
  desktopClass="text-lg p-6"
  className="border rounded"
>
  Content here
</ResponsiveContainer>
```

### TouchButton Component
Location: `client/src/components/responsive/TouchButton.tsx`

A button component optimized for touch devices with proper accessibility.

**Features:**
- Minimum 44x44px touch target
- Active scale feedback
- ARIA labels and roles
- Uses shadcn/ui Button component

**Usage:**
```tsx
import { TouchButton } from '@/components/responsive/TouchButton';

<TouchButton 
  label="Submit form"
  onClick={handleSubmit}
>
  Submit
</TouchButton>
```

### ResponsiveDataTable Component
Location: `client/src/components/responsive/ResponsiveDataTable.tsx`

A data table that adapts to screen size, showing as cards on mobile.

**Features:**
- Desktop: Traditional table layout
- Mobile: Card-based layout
- Touch-friendly row selection
- Keyboard navigation support
- Optional column hiding on mobile

**Usage:**
```tsx
import { ResponsiveDataTable } from '@/components/responsive/ResponsiveDataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'team', label: 'Team', mobileHidden: true },
  { key: 'score', label: 'Score' },
];

const data = [
  { id: 1, name: 'Player 1', team: 'Team A', score: 85 },
  { id: 2, name: 'Player 2', team: 'Team B', score: 92 },
];

<ResponsiveDataTable
  data={data}
  columns={columns}
  keyField="id"
  onRowClick={(row) => console.log(row)}
/>
```

### ComplianceFooter Component
Location: `client/src/components/layout/ComplianceFooter.tsx`

A footer component with copyright and legal links.

**Features:**
- Responsive layout
- Auto-updating year
- Privacy and terms links

## Demo Page

Visit `/hardened-demo` to see all the hardened features in action. The demo page includes:
- Platform detection information
- PWA status display
- Error boundary demonstrations
- Responsive component examples
- Touch button examples
- Data table examples

## TypeScript Support

All components and hooks are fully typed with TypeScript for better development experience and type safety.

## Performance Considerations

- All resize listeners are debounced (150ms default)
- Platform detection updates only on resize/orientation change
- SSR-safe with proper server-side defaults
- Service worker caching for offline support

## Browser Support

These features support all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## Best Practices

1. **Always wrap tools in ToolErrorBoundary** to prevent single tool failures from breaking the app
2. **Use platform hooks** instead of CSS media queries when conditional logic is needed
3. **Use TouchButton** for all primary actions on touch-capable devices
4. **Test on multiple screen sizes** using the demo page
5. **Check PWA status** to provide install prompts when appropriate

## Future Enhancements

Potential improvements for future iterations:
- Offline data caching strategies
- Background sync for data updates
- Push notifications for price changes
- Installation prompt component
- Advanced error reporting/tracking integration
