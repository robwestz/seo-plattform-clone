import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth = false,
  children,
}) => {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(defaultTab || tabs[0]?.id);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : uncontrolledActiveTab;

  const handleTabClick = (tabId: string) => {
    if (tabs.find((t) => t.id === tabId)?.disabled) return;

    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const variantStyles = {
    line: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent hover:border-gray-300 transition-colors',
      active: 'border-blue-500 text-blue-600 font-medium',
      inactive: 'text-gray-600 hover:text-gray-900',
    },
    enclosed: {
      container: 'border-b border-gray-200',
      tab: 'border border-transparent rounded-t-lg',
      active: 'border-gray-200 border-b-white bg-white text-blue-600 font-medium -mb-px',
      inactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
    },
    pills: {
      container: '',
      tab: 'rounded-lg',
      active: 'bg-blue-100 text-blue-700 font-medium',
      inactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    },
  };

  return (
    <div>
      <div className={`flex gap-1 ${fullWidth ? 'w-full' : ''} ${variantStyles[variant].container}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={isDisabled}
              className={`
                inline-flex items-center gap-2 transition-all
                ${sizeStyles[size]}
                ${variantStyles[variant].tab}
                ${isActive ? variantStyles[variant].active : variantStyles[variant].inactive}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${fullWidth ? 'flex-1 justify-center' : ''}
              `}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'}
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export interface TabPanelProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
  keepMounted?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  activeTab,
  children,
  keepMounted = false,
}) => {
  const isActive = value === activeTab;

  if (!isActive && !keepMounted) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      className={isActive ? 'block' : 'hidden'}
    >
      {children}
    </div>
  );
};

export default Tabs;
