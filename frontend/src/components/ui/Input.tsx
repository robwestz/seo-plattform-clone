import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      success = false,
      leftIcon,
      rightIcon,
      size = 'md',
      variant = 'outline',
      fullWidth = false,
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    // Base styles
    const baseStyles = 'w-full transition-all focus:outline-none';

    // Variant styles
    const variantStyles = {
      outline: 'border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      filled: 'border-0 rounded-lg bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500',
      flushed: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-blue-500',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    // Error/Success styles
    const statusStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
      : '';

    const widthStyle = fullWidth ? 'w-full' : '';
    const leftPadding = leftIcon ? 'pl-10' : '';
    const rightPadding = rightIcon || type === 'password' ? 'pr-10' : '';

    return (
      <div className={widthStyle}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type === 'password' && showPassword ? 'text' : type}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${statusStyles} ${leftPadding} ${rightPadding} ${className}`}
            {...props}
          />

          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}

          {rightIcon && type !== 'password' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}

          {success && !error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
