import React, { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      indeterminate = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <div>
        <label className="inline-flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                ${sizeStyles[size]}
                border-2 rounded-md transition-all
                peer-checked:bg-blue-600 peer-checked:border-blue-600
                peer-focus:ring-2 peer-focus:ring-blue-200
                peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-gray-300'}
                ${indeterminate ? 'bg-blue-600 border-blue-600' : 'bg-white'}
                group-hover:border-blue-400
              `}
            >
              {(props.checked || indeterminate) && (
                <div className="flex items-center justify-center h-full text-white">
                  {indeterminate ? (
                    <Minus className={iconSizes[size]} />
                  ) : (
                    <Check className={iconSizes[size]} />
                  )}
                </div>
              )}
            </div>
          </div>

          {(label || description) && (
            <div className="flex-1">
              {label && (
                <div className={`font-medium text-gray-900 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
                  {label}
                </div>
              )}
              {description && (
                <div className="text-sm text-gray-600 mt-0.5">{description}</div>
              )}
            </div>
          )}
        </label>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
