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
