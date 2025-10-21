#!/bin/bash
set -euo pipefail
echo "🎯 SCRIPT 3: HARDENED RESPONSIVE COMPONENTS"

# Create fallback button component if shadcn not available
if [ ! -f "client/src/components/ui/button.tsx" ]; then
    echo "🔧 Creating fallback button component..."
    mkdir -p client/src/components/ui
    cat > client/src/components/ui/button.tsx << 'EOF'
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  variant = 'default',
  size = 'default',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none';
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 hover:bg-gray-50'
  };
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};
EOF
fi

# Create responsive container
cat > client/src/components/responsive/ResponsiveContainer.tsx << 'EOF'
import React from 'react';
import { usePlatform } from '@/hooks/platform/use-platform';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  mobileClass?: string;
  tabletClass?: string;
  desktopClass?: string;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  mobileClass = '',
  tabletClass = '',
  desktopClass = '',
  className = '',
}) => {
  const { platform } = usePlatform();

  const platformClass = {
    mobile: mobileClass,
    tablet: tabletClass,
    desktop: desktopClass,
  }[platform];

  return <div className={`${className} ${platformClass}`}>{children}</div>;
};
EOF

# Create touch-optimized button with accessibility
cat > client/src/components/responsive/TouchButton.tsx << 'EOF'
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTouchOptimization } from '@/hooks/platform/use-touch-optimization';

interface TouchButtonProps extends ButtonProps {
  touchSize?: 'sm' | 'md' | 'lg';
  label: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  touchSize = 'md',
  className = '',
  label,
  children,
  ...props
}) => {
  const { getTouchClass, getAriaProps } = useTouchOptimization();

  return (
    <Button
      className={getTouchClass(className)}
      {...getAriaProps(label)}
      {...props}
    >
      {children}
    </Button>
  );
};
EOF

# Create responsive data table with accessibility
cat > client/src/components/responsive/ResponsiveDataTable.tsx << 'EOF'
import React from 'react';
import { usePlatform } from '@/hooks/platform/use-platform';

interface Column {
  key: string;
  label: string;
  mobileHidden?: boolean;
}

interface ResponsiveDataTableProps {
  data: any[];
  columns: Column[];
  keyField: string;
  onRowClick?: (row: any) => void;
  className?: string;
}

export const ResponsiveDataTable: React.FC<ResponsiveDataTableProps> = ({
  data,
  columns,
  keyField,
  onRowClick,
  className = '',
}) => {
  const { platform } = usePlatform();

  if (platform === 'mobile') {
    return <MobileDataView data={data} columns={columns} keyField={keyField} onRowClick={onRowClick} />;
  }

  const visibleColumns = columns.filter(col => !col.mobileHidden);

  return (
    <div className={`border rounded-lg ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {visibleColumns.map((column) => (
              <th key={column.key} className="text-left p-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={row[keyField]} 
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick?.(row)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${row.name || 'item'}`}
              onKeyPress={(e) => e.key === 'Enter' && onRowClick?.(row)}
            >
              {visibleColumns.map((column) => (
                <td key={column.key} className="p-3">
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MobileDataView: React.FC<ResponsiveDataTableProps> = ({ data, columns, keyField, onRowClick }) => {
  const visibleColumns = columns.filter(col => !col.mobileHidden);

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div 
          key={row[keyField]} 
          className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer"
          onClick={() => onRowClick?.(row)}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${row.name || 'item'}`}
          onKeyPress={(e) => e.key === 'Enter' && onRowClick?.(row)}
        >
          <div className="space-y-2">
            {visibleColumns.map((column) => (
              <div key={column.key} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {column.label}:
                </span>
                <span className="text-sm">
                  {row[column.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
EOF

echo "✅ Hardened responsive components created"
