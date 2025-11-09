import React from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  thickness?: 'thin' | 'medium' | 'thick';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
  color?: 'light' | 'default' | 'dark';
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  spacing = 'md',
  thickness = 'thin',
  label,
  labelPosition = 'center',
  color = 'default',
}) => {
  const spacingStyles = {
    horizontal: {
      none: 'my-0',
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-6',
      xl: 'my-8',
    },
    vertical: {
      none: 'mx-0',
      sm: 'mx-2',
      md: 'mx-4',
      lg: 'mx-6',
      xl: 'mx-8',
    },
  };

  const thicknessStyles = {
    horizontal: {
      thin: 'border-t',
      medium: 'border-t-2',
      thick: 'border-t-4',
    },
    vertical: {
      thin: 'border-l',
      medium: 'border-l-2',
      thick: 'border-l-4',
    },
  };

  const variantStyles = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const colorStyles = {
    light: 'border-gray-200',
    default: 'border-gray-300',
    dark: 'border-gray-400',
  };

  const alignmentStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  if (label && orientation === 'horizontal') {
    return (
      <div className={`flex items-center ${spacingStyles[orientation][spacing]} ${alignmentStyles[labelPosition]}`}>
        {(labelPosition === 'center' || labelPosition === 'right') && (
          <div
            className={`flex-1 ${thicknessStyles[orientation][thickness]} ${variantStyles[variant]} ${colorStyles[color]}`}
          />
        )}

        <span className="px-4 text-sm text-gray-500 whitespace-nowrap">{label}</span>

        {(labelPosition === 'center' || labelPosition === 'left') && (
          <div
            className={`flex-1 ${thicknessStyles[orientation][thickness]} ${variantStyles[variant]} ${colorStyles[color]}`}
          />
        )}
      </div>
    );
  }

  if (orientation === 'vertical') {
    return (
      <div
        className={`
          ${spacingStyles[orientation][spacing]}
          ${thicknessStyles[orientation][thickness]}
          ${variantStyles[variant]}
          ${colorStyles[color]}
          h-full inline-block
        `}
        aria-orientation="vertical"
        role="separator"
      />
    );
  }

  return (
    <hr
      className={`
        ${spacingStyles[orientation][spacing]}
        ${thicknessStyles[orientation][thickness]}
        ${variantStyles[variant]}
        ${colorStyles[color]}
        border-0
      `}
      aria-orientation="horizontal"
    />
  );
};

export default Divider;
