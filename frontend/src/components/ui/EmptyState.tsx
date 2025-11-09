import React from 'react';
import { Inbox, FileQuestion, Search, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  variant?: 'default' | 'no-data' | 'search' | 'error';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  variant = 'default',
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
}) => {
  const defaultIcons = {
    default: <Inbox className="text-gray-400" />,
    'no-data': <FileQuestion className="text-gray-400" />,
    search: <Search className="text-gray-400" />,
    error: <AlertCircle className="text-red-400" />,
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const descriptionSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const paddingSizes = {
    sm: 'p-8',
    md: 'p-12',
    lg: 'p-16',
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${paddingSizes[size]}`}>
      <div className={`${iconSizes[size]} mb-4`}>{displayIcon}</div>

      <h3 className={`${titleSizes[size]} font-semibold text-gray-900 mb-2`}>{title}</h3>

      {description && (
        <p className={`${descriptionSizes[size]} text-gray-600 max-w-md mb-6`}>{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export interface EmptyTableProps {
  columns: number;
  message?: string;
}

export const EmptyTable: React.FC<EmptyTableProps> = ({ columns, message = 'No data available' }) => {
  return (
    <tr>
      <td colSpan={columns} className="py-12">
        <EmptyState
          variant="no-data"
          title={message}
          size="sm"
        />
      </td>
    </tr>
  );
};

export interface EmptySearchProps {
  searchTerm: string;
  onClear: () => void;
}

export const EmptySearch: React.FC<EmptySearchProps> = ({ searchTerm, onClear }) => {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`We couldn't find any results matching "${searchTerm}". Try adjusting your search.`}
      action={{
        label: 'Clear search',
        onClick: onClear,
        variant: 'outline',
      }}
      size="md"
    />
  );
};

export default EmptyState;
