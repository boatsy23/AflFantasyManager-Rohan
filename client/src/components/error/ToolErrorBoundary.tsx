import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ToolErrorBoundaryProps {
  children: React.ReactNode;
  toolName: string;
}

const ToolErrorFallback: React.FC<{ error: Error; resetError: () => void; toolName: string }> = ({ 
  error, 
  resetError,
  toolName 
}) => {
  return (
    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-orange-800">{toolName} unavailable</h4>
          <p className="text-sm text-orange-700 mt-1">Please try again later.</p>
          <button
            onClick={resetError}
            className="mt-3 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-md border border-orange-200 hover:bg-orange-200"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToolErrorBoundary: React.FC<ToolErrorBoundaryProps> = ({ 
  children, 
  toolName 
}) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <ToolErrorFallback error={error} resetError={resetError} toolName={toolName} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
