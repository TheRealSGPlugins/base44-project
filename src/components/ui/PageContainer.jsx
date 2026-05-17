import React from 'react';
import { cn } from '@/lib/utils';

export default function PageContainer({ children, className }) {
  return (
    <div className={cn(
      "min-h-screen bg-background px-4 py-6 pb-24 max-w-lg mx-auto font-body",
      className
    )}>
      {children}
    </div>
  );
}