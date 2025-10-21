import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToolErrorBoundary } from '@/components/error/ToolErrorBoundary';
import { ResponsiveContainer } from '@/components/responsive/ResponsiveContainer';
import { TouchButton } from '@/components/responsive/TouchButton';
import { ResponsiveDataTable } from '@/components/responsive/ResponsiveDataTable';
import { usePlatform } from '@/hooks/platform/use-platform';
import { useBreakpoint } from '@/hooks/responsive/use-breakpoint';
import { getPWAStatus } from '@/lib/pwa/pwa-utils';

/**
 * Example demonstrating the hardened components and hooks
 */

const sampleData = [
  { id: 1, name: 'Player 1', team: 'Team A', score: 85, price: 500000 },
  { id: 2, name: 'Player 2', team: 'Team B', score: 92, price: 650000 },
  { id: 3, name: 'Player 3', team: 'Team C', score: 78, price: 450000 },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'team', label: 'Team' },
  { key: 'score', label: 'Score', mobileHidden: true },
  { key: 'price', label: 'Price' },
];

export const HardenedComponentsExample: React.FC = () => {
  const { platform, os, isTouch, isStandalone } = usePlatform();
  const breakpoint = useBreakpoint();
  const pwaStatus = getPWAStatus();

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Hardened Components Demo</h1>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Platform Detection</h2>
          <ul className="space-y-1">
            <li>Platform: {platform}</li>
            <li>OS: {os}</li>
            <li>Touch: {isTouch ? 'Yes' : 'No'}</li>
            <li>Standalone: {isStandalone ? 'Yes' : 'No'}</li>
            <li>Breakpoint: {breakpoint}</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">PWA Status</h2>
          <ul className="space-y-1">
            <li>Installed: {pwaStatus.isInstalled ? 'Yes' : 'No'}</li>
            <li>Mobile: {pwaStatus.isMobile ? 'Yes' : 'No'}</li>
            <li>Supports Install: {pwaStatus.supportsInstall ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <ResponsiveContainer
          className="border p-4 rounded-lg"
          mobileClass="bg-yellow-50"
          tabletClass="bg-blue-50"
          desktopClass="bg-green-50"
        >
          <h2 className="text-xl font-semibold mb-2">Responsive Container</h2>
          <p>This container changes color based on screen size</p>
        </ResponsiveContainer>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Touch-Optimized Buttons</h2>
          <div className="flex gap-3 flex-wrap">
            <TouchButton
              label="Primary Action"
              onClick={() => alert('Button clicked!')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Primary Action
            </TouchButton>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Responsive Data Table</h2>
          <ResponsiveDataTable
            data={sampleData}
            columns={columns}
            keyField="id"
            onRowClick={(row) => alert(`Clicked on ${row.name}`)}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Tool Error Boundary</h2>
          <ToolErrorBoundary toolName="Sample Tool">
            <div className="border p-4 rounded-lg bg-gray-50">
              <p>This content is protected by an error boundary.</p>
            </div>
          </ToolErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HardenedComponentsExample;
