import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useUIStore, BreadcrumbItem } from '../../stores/uiStore';

export const Breadcrumbs: React.FC = () => {
  const breadcrumbs = useUIStore((state) => state.breadcrumbs);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      {/* Home */}
      <a
        href="/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
      </a>

      {/* Breadcrumb Items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />

            {item.href && !isLast ? (
              <a
                href={item.href}
                className="text-gray-500 hover:text-gray-900 transition-colors truncate"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={`
                  truncate
                  ${isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}
                `}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
