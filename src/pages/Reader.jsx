import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bookmark, BookmarkCheck, Minus, Plus, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Reader() {
  const { bookId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const chapterNum = parseInt(urlParams.get('chapter') || '1');
  const [fontSize, setFontSize] = useState(16);
  const [copiedId, setCopiedId] = useState(null);

  const queryClient = useQueryClient();

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const books = await base44.entities.Book.filter({ id: bookId });
      return books[0];
    },
  });

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['bookSections', bookId, chapterNum],
    queryFn: () => base44.entities.BookSection.filter(
      { book_id: bookId, chapter_number: chapterNum },
      'order_index',
      200
    ),
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => base44.entities.Bookmark.list('-created_date', 500),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (section) => base44.entities.Bookmark.create({
      section_id: section.id,
      book_id: bookId,
      book_title: book?.title || '',
      verse_reference: section.verse_reference || `Ch ${section.chapter_number}, V ${section.section_number}`,
      quote_preview: section.content?.substring(0, 120)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmarked');
    }
  });

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map(b => b.section_id)), [bookmarks]);

  const handleCopy = (section) => {
    const citation = `"${section.content}"\n— ${book?.title || 'Unknown'}, ${section.verse_reference || ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(section.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageContainer className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <Link to={`/book/${bookId}`} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(28, s + 2))} className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {book && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center"
        >
          <GoldHeading size="md">{book.title}</GoldHeading>
          <p className="text-muted-foreground text-xs mt-1">
            Chapter {chapterNum}
            {sections[0]?.chapter_title && ` — ${sections[0].chapter_title}`}
          </p>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-card/40" />)}
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No content available for this chapter</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <GlassCard animate={false} className="p-4">
                  {section.verse_reference && (
                    <p className="text-primary/60 text-xs font-heading mb-2">{section.verse_reference}</p>
                  )}
                  <p
                    className="text-foreground/90 leading-relaxed font-body"
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                  >
                    {section.content}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-3">
                    <button
                      onClick={() => handleCopy(section)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy with citation"
                    >
                      {copiedId === section.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => !bookmarkedIds.has(section.id) && bookmarkMutation.mutate(section)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      title="Bookmark"
                    >
                      {bookmarkedIds.has(section.id) ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageContainer>
  );
}