import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Bookmark as BookmarkIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function History() {
  const [tab, setTab] = useState('threads');

  const { data: threads = [] } = useQuery({
    queryKey: ['chatThreads'],
    queryFn: () => base44.entities.ChatThread.list('-created_date', 50),
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => base44.entities.Bookmark.list('-created_date', 50),
  });

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <GoldHeading size="md">My History</GoldHeading>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-card/60 border border-border/30 w-full">
          <TabsTrigger value="threads" className="flex-1 data-[state=active]:bg-accent/20 data-[state=active]:text-foreground">
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex-1 data-[state=active]:bg-accent/20 data-[state=active]:text-foreground">
            <BookmarkIcon className="w-4 h-4 mr-1.5" />
            Bookmarks
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'threads' && (
        <div className="space-y-2">
          {threads.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No conversations yet</p>
              <Link to="/chat" className="text-accent text-xs mt-2 block">Start a conversation</Link>
            </div>
          ) : threads.map((thread, i) => (
            <GlassCard key={thread.id} delay={i * 0.04} className="p-4">
              <h3 className="font-heading text-sm text-foreground line-clamp-1">{thread.title}</h3>
              {thread.last_message_preview && (
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{thread.last_message_preview}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/60">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(thread.created_date), 'MMM d, yyyy')}</span>
                {thread.message_count > 0 && <span>· {thread.message_count} messages</span>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === 'bookmarks' && (
        <div className="space-y-2">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <BookmarkIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No bookmarks yet</p>
              <Link to="/library" className="text-accent text-xs mt-2 block">Browse the library</Link>
            </div>
          ) : bookmarks.map((bm, i) => (
            <Link key={bm.id} to={`/book/${bm.book_id}`}>
              <GlassCard delay={i * 0.04} className="p-4">
                <div className="flex items-start gap-2">
                  <BookmarkIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm text-foreground">{bm.book_title}</h3>
                    <p className="text-primary/60 text-xs mt-0.5">{bm.verse_reference}</p>
                    {bm.quote_preview && (
                      <p className="text-foreground/40 text-xs mt-1 italic line-clamp-2">"{bm.quote_preview}"</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}