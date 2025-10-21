import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToolErrorBoundary } from '@/components/error/ToolErrorBoundary';
import { ResponsiveContainer } from '@/components/responsive/ResponsiveContainer';
import { TouchButton } from '@/components/responsive/TouchButton';
import { ResponsiveDataTable } from '@/components/responsive/ResponsiveDataTable';
import { usePlatform } from '@/hooks/platform/use-platform';
import { useBreakpoint } from '@/hooks/responsive/use-breakpoint';
import { ComplianceFooter } from '@/components/layout/ComplianceFooter';
import { getPWAStatus } from '@/lib/pwa/pwa-utils';

// Component that can throw an error for testing
const ErrorThrower: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error thrown</div>;
};

const HardenedDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const platformInfo = usePlatform();
  const breakpoint = useBreakpoint();
  const pwaStatus = getPWAStatus();

  // Sample data for the responsive table
  const sampleData = [
    { id: 1, name: 'Player 1', team: 'Team A', score: 85 },
    { id: 2, name: 'Player 2', team: 'Team B', score: 92 },
    { id: 3, name: 'Player 3', team: 'Team C', score: 78 },
  ];

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'team', label: 'Team', mobileHidden: true },
    { key: 'score', label: 'Score' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Hardened Features Demo</h1>

        {/* Platform Detection */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Platform Detection</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Platform:</strong> {platformInfo.platform}
            </div>
            <div>
              <strong>OS:</strong> {platformInfo.os}
            </div>
            <div>
              <strong>Touch:</strong> {platformInfo.isTouch ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Breakpoint:</strong> {breakpoint}
            </div>
            <div>
              <strong>Standalone:</strong> {platformInfo.isStandalone ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Screen:</strong> {platformInfo.screenSize.width} x {platformInfo.screenSize.height}
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">PWA Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Installed:</strong> {pwaStatus.isInstalled ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Mobile:</strong> {pwaStatus.isMobile ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Supports Install:</strong> {pwaStatus.supportsInstall ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Error Boundary Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Error Boundary Demo</h2>
          <TouchButton
            label="Toggle Error"
            onClick={() => setShouldThrow(!shouldThrow)}
            className="mb-4"
          >
            {shouldThrow ? 'Reset Error' : 'Throw Error'}
          </TouchButton>
          <ErrorBoundary>
            <ErrorThrower shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>

        {/* Tool Error Boundary Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tool Error Boundary Demo</h2>
          <ToolErrorBoundary toolName="Demo Tool">
            <div className="p-4 border rounded">
              This content is wrapped in a ToolErrorBoundary
            </div>
          </ToolErrorBoundary>
        </div>

        {/* Responsive Container Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Responsive Container Demo</h2>
          <ResponsiveContainer
            mobileClass="text-sm"
            tabletClass="text-base"
            desktopClass="text-lg"
            className="p-4 bg-blue-50 rounded"
          >
            This text size changes based on the platform: {platformInfo.platform}
          </ResponsiveContainer>
        </div>

        {/* Touch Button Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Touch Button Demo</h2>
          <div className="flex gap-4">
            <TouchButton label="Primary Action" onClick={() => alert('Clicked!')}>
              Touch Button
            </TouchButton>
            <TouchButton label="Secondary Action" variant="outline" onClick={() => alert('Clicked!')}>
              Outline
            </TouchButton>
          </div>
        </div>

        {/* Responsive Data Table Demo */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Responsive Data Table Demo</h2>
          <ResponsiveDataTable
            data={sampleData}
            columns={columns}
            keyField="id"
            onRowClick={(row) => alert(`Clicked: ${row.name}`)}
          />
        </div>
      </div>

      <ComplianceFooter />
    </div>
  );
};

export default HardenedDemo;
