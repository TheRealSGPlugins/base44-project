import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function EmeraldButton({ children, className, loading, variant = 'default', ...props }) {
  const variants = {
    default: "bg-accent text-accent-foreground hover:bg-accent/80 shadow-md shadow-accent/20",
    outline: "border border-accent/50 text-accent-foreground hover:bg-accent/10",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
  };

  return (
    <button
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-body text-sm font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}