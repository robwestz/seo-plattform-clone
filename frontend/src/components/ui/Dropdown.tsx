import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  selectedId?: string;
  onSelect?: (id: string) => void;
  closeOnSelect?: boolean;
  minWidth?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  placement = 'bottom-left',
  selectedId,
  onSelect,
  closeOnSelect = true,
  minWidth = '12rem',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;

    item.onClick?.();
    onSelect?.(item.id);

    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const placementStyles = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${placementStyles[placement]} z-50`}
            style={{ minWidth }}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-hidden">
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  {item.divider && index > 0 && (
                    <div className="my-1 border-t border-gray-200" />
                  )}

                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors
                      ${
                        item.disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 cursor-pointer'
                      }
                      ${selectedId === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {selectedId === item.id && (
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface DropdownMenuProps {
  children: React.ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  selectedId?: string;
  onSelect?: (id: string) => void;
  closeOnSelect?: boolean;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  items,
  placement = 'bottom-left',
  selectedId,
  onSelect,
  closeOnSelect = true,
}) => {
  return (
    <Dropdown
      trigger={
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          {children}
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      }
      items={items}
      placement={placement}
      selectedId={selectedId}
      onSelect={onSelect}
      closeOnSelect={closeOnSelect}
    />
  );
};

export default Dropdown;
