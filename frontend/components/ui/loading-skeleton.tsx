// frontend/components/ui/loading-skeleton.tsx
import React from 'react';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export const TableSkeleton = ({ rows = 10, cols = 7 }) => {
  return (
    <div className="w-full space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-8 ${j === 0 ? 'col-span-3' : (j === cols - 1 ? 'col-span-3' : 'col-span-1')}`} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
    );
}

export const LoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      <CardSkeleton />
      <Skeleton className="h-16" />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <TableSkeleton />
      </div>
    </div>
  );
};
