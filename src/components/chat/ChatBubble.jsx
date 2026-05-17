import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { BookOpen, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const confidenceColors = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-orange-400',
  insufficient: 'text-red-400'
};

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 mb-4", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-1">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-card/80 border border-border/50"
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm">
              <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed">
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations */}
        {message.citations?.length > 0 && (
          <div className="mt-2 space-y-1.5 w-full">
            {message.citations.map((cite, i) => (
              <div key={i} className="bg-card/40 border border-border/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Quote className="w-3 h-3 text-primary/60" />
                  <span className="text-primary/80 text-xs font-heading font-medium">
                    {cite.book_title}
                  </span>
                  {cite.chapter && (
                    <span className="text-muted-foreground text-xs">
                      · {cite.verse || cite.chapter}
                    </span>
                  )}
                </div>
                {cite.quote && (
                  <p className="text-foreground/50 text-xs italic leading-relaxed">
                    "{cite.quote}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confidence */}
        {message.confidence && !isUser && (
          <div className="mt-1.5">
            <span className={cn("text-xs", confidenceColors[message.confidence])}>
              Confidence: {message.confidence}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}