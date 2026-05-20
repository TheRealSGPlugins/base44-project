import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, BookOpen, Globe, User, Tag, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';
import EmeraldButton from '@/components/ui/EmeraldButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookDetail() {
  const { id } = useParams();

  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const books = await base44.entities.Book.filter({ id });
      return books[0];
    },
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['bookSections', id],
    queryFn: () => base44.entities.BookSection.filter({ book_id: id }, 'order_index', 200),
    enabled: !book?.r2_url,
  });

  // Group sections by chapter
  const chapters = sections.reduce((acc, section) => {
    const chKey = section.chapter_number || 0;
    if (!acc[chKey]) {
      acc[chKey] = {
        number: chKey,
        title: section.chapter_title || `Chapter ${chKey}`,
        sections: []
      };
    }
    acc[chKey].sections.push(section);
    return acc;
  }, {});

  const chapterList = Object.values(chapters).sort((a, b) => a.number - b.number);

  if (bookLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-4 bg-card/40" />
        <Skeleton className="h-4 w-32 mb-8 bg-card/40" />
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl bg-card/40" />)}
        </div>
      </PageContainer>
    );
  }

  if (!book) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-center mt-20">Book not found</p>
        <Link to="/library" className="block text-center mt-4 text-accent text-sm">Back to Library</Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link to="/library" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Library</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GoldHeading size="lg" className="mb-2">{book.title}</GoldHeading>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {book.author && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <User className="w-3 h-3" />
              <span>{book.author}</span>
            </div>
          )}
          {book.original_language && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Globe className="w-3 h-3" />
              <span className="capitalize">{book.original_language}</span>
            </div>
          )}
          {book.category && (
            <Badge variant="outline" className="text-xs bg-muted/30">
              <Tag className="w-3 h-3 mr-1" />
              <span className="capitalize">{book.category}</span>
            </Badge>
          )}
        </div>

        {book.description && (
          <p className="text-foreground/60 text-sm leading-relaxed mb-6">{book.description}</p>
        )}
      </motion.div>

      {/* Chapters */}
      <div className="mb-4">
        <h2 className="font-heading text-lg text-foreground/80 mb-3">Chapters</h2>
      </div>

      {/* PDF link */}
      {book?.r2_url && (
        <div className="mb-6">
          <a
            href={book.r2_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
          >
            <FileText className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">Open PDF</p>
              <p className="text-xs text-muted-foreground">View full book in PDF format</p>
            </div>
          </a>
        </div>
      )}

      {!book?.r2_url && sectionsLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl bg-card/40" />)}
        </div>
      ) : !book?.r2_url && chapterList.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No chapters available yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chapterList.map((chapter, i) => (
            <Link
              key={chapter.number}
              to={`/reader/${id}?chapter=${chapter.number}`}
            >
              <GlassCard delay={i * 0.04} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-heading text-base text-foreground">{chapter.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {chapter.sections.length} {chapter.sections.length === 1 ? 'verse' : 'verses'}
                  </p>
                </div>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}