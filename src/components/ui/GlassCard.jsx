import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, onClick, animate = true, delay = 0 }) {
  const Comp = animate ? motion.div : 'div';
  const props = animate ? {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay }
  } : {};

  return (
    <Comp
      {...props}
      onClick={onClick}
      className={cn(
        "bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-5",
        "shadow-lg shadow-black/20",
        onClick && "cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all duration-300",
        className
      )}
    >
      {children}
    </Comp>
  );
}