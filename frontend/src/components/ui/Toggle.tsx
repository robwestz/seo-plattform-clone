import React, { forwardRef } from 'react';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  labelPosition?: 'left' | 'right';
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      labelPosition = 'right',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
      },
      md: {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'h-7 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-7',
      },
    };

    const labelContent = (label || description) && (
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
    );

    const toggle = (
      <div className="relative">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div
          className={`
            ${sizeStyles[size].track}
            rounded-full transition-all
            peer-checked:bg-blue-600
            peer-focus:ring-2 peer-focus:ring-blue-200
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            ${error ? 'bg-red-200' : 'bg-gray-300'}
            cursor-pointer
          `}
        >
          <div
            className={`
              ${sizeStyles[size].thumb}
              absolute left-0.5 top-0.5 rounded-full bg-white shadow-md transition-transform
              peer-checked:${sizeStyles[size].translate}
            `}
          />
        </div>
      </div>
    );

    return (
      <div>
        <label className={`inline-flex items-start gap-3 cursor-pointer group ${labelPosition === 'left' ? 'flex-row-reverse justify-end' : ''}`}>
          {labelPosition === 'left' && labelContent}
          {toggle}
          {labelPosition === 'right' && labelContent}
        </label>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
