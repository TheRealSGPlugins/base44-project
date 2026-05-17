import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

export default function HomeMenuCard({ icon: Icon, title, subtitle, to, delay = 0, accentColor }) {
  return (
    <Link to={to}>
      <GlassCard delay={delay} className="flex items-center gap-4 p-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          accentColor || "bg-accent/15"
        )}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-xs mt-0.5 truncate">{subtitle}</p>
        </div>
      </GlassCard>
    </Link>
  );
}