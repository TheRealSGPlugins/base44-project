import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';

const traditionLabels = {
  hinduism: 'Hinduism',
  christianity: 'Christianity',
  islam: 'Islam',
  buddhism: 'Buddhism',
  taoism: 'Taoism',
  judaism: 'Judaism',
  sikhism: 'Sikhism',
  philosophy: 'Philosophy',
  mysticism: 'Mysticism',
  other: 'Other'
};

const traditionColors = {
  hinduism: 'bg-orange-900/30 text-orange-300 border-orange-700/30',
  christianity: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  islam: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/30',
  buddhism: 'bg-amber-900/30 text-amber-300 border-amber-700/30',
  taoism: 'bg-cyan-900/30 text-cyan-300 border-cyan-700/30',
  judaism: 'bg-indigo-900/30 text-indigo-300 border-indigo-700/30',
  philosophy: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
  mysticism: 'bg-rose-900/30 text-rose-300 border-rose-700/30'
};

export default function BookCard({ book, delay = 0 }) {
  return (
    <Link to={`/book/${book.id}`}>
      <GlassCard delay={delay} className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-muted-foreground text-xs mt-1">{book.author}</p>
            )}
            {book.description && (
              <p className="text-foreground/50 text-xs mt-2 line-clamp-2">{book.description}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-xs flex-shrink-0 ${traditionColors[book.tradition] || 'bg-muted text-muted-foreground border-border'}`}
          >
            {traditionLabels[book.tradition] || book.tradition}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {book.original_language && (
            <span className="capitalize">{book.original_language}</span>
          )}
          {book.total_chapters > 0 && (
            <>
              <span>·</span>
              <span>{book.total_chapters} chapters</span>
            </>
          )}
          {book.category && (
            <>
              <span>·</span>
              <span className="capitalize">{book.category}</span>
            </>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}