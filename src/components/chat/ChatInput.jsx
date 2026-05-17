import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, loading }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border/50 p-3">
      <div className="max-w-lg mx-auto flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about any tradition..."
            className="w-full bg-card/60 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-accent/50 transition-colors"
            rows={1}
            style={{ minHeight: 44, maxHeight: 120 }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || loading}
          className="p-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}