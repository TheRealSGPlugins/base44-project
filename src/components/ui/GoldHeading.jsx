import React from 'react';
import { cn } from '@/lib/utils';

export default function GoldHeading({ children, className, size = 'lg' }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-4xl',
    '2xl': 'text-4xl md:text-5xl'
  };

  return (
    <h1 className={cn(
      "font-heading font-semibold text-primary tracking-wide",
      sizeClasses[size],
      className
    )}>
      {children}
    </h1>
  );
}