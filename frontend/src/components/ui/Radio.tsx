import React, { forwardRef } from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
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

    return (
      <div>
        <label className="inline-flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="radio"
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                ${sizeStyles[size]}
                border-2 rounded-full transition-all
                peer-checked:border-blue-600 peer-checked:border-[6px]
                peer-focus:ring-2 peer-focus:ring-blue-200
                peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-gray-300'}
                bg-white
                group-hover:border-blue-400
              `}
            />
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

Radio.displayName = 'Radio';

export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  children,
  orientation = 'vertical',
  gap = 'md',
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue);
  };

  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const orientationStyles = {
    horizontal: 'flex-row flex-wrap',
    vertical: 'flex-col',
  };

  return (
    <div className={`flex ${orientationStyles[orientation]} ${gapStyles[gap]}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            name,
            checked: child.props.value === value,
            onChange: handleChange,
          });
        }
        return child;
      })}
    </div>
  );
};

export default Radio;
