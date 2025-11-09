import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  actions,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const iconStyles = {
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };

  const defaultIcons = {
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      className={`rounded-lg border p-4 ${variantStyles[variant]} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3">
        {showIcon && <div className={`flex-shrink-0 ${iconStyles[variant]}`}>{displayIcon}</div>}

        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
          {children && <div className="text-sm opacity-90">{children}</div>}
          {actions && <div className="mt-3 flex gap-2">{actions}</div>}
        </div>

        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
