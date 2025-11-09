import React, { forwardRef, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
  variant?: 'outline' | 'filled' | 'flushed';
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      success = false,
      showCharCount = false,
      maxLength,
      autoResize = false,
      variant = 'outline',
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        const adjustHeight = () => {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        };

        adjustHeight();
        textarea.addEventListener('input', adjustHeight);

        return () => {
          textarea.removeEventListener('input', adjustHeight);
        };
      }
    }, [autoResize, textareaRef]);

    // Base styles
    const baseStyles = 'w-full transition-all focus:outline-none resize-y';

    // Variant styles
    const variantStyles = {
      outline: 'border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      filled: 'border-0 rounded-lg bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500',
      flushed: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-blue-500 px-0',
    };

    // Error/Success styles
    const statusStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
      : '';

    const widthStyle = fullWidth ? 'w-full' : '';
    const resizeStyle = autoResize ? 'resize-none overflow-hidden' : '';

    const charCount = props.value?.toString().length || 0;
    const isNearLimit = maxLength && charCount > maxLength * 0.9;

    return (
      <div className={widthStyle}>
        <div className="flex items-center justify-between mb-1">
          {label && (
            <label className="block text-sm font-medium text-gray-700">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {showCharCount && maxLength && (
            <span
              className={`text-xs ${
                charCount > maxLength
                  ? 'text-red-600'
                  : isNearLimit
                  ? 'text-yellow-600'
                  : 'text-gray-500'
              }`}
            >
              {charCount} / {maxLength}
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            maxLength={maxLength}
            className={`${baseStyles} ${variantStyles[variant]} ${statusStyles} ${resizeStyle} px-4 py-2 text-base ${className}`}
            {...props}
          />

          {error && (
            <div className="absolute right-3 top-3 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}

          {success && !error && (
            <div className="absolute right-3 top-3 text-green-500">
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

Textarea.displayName = 'Textarea';

export default Textarea;
