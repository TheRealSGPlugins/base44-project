import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import BookCard from '@/components/cards/BookCard';
import { Skeleton } from '@/components/ui/skeleton';

const traditions = [
  { value: 'all', label: 'All' },
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'christianity', label: 'Christianity' },
  { value: 'buddhism', label: 'Buddhism' },
  { value: 'taoism', label: 'Taoism' },
  { value: 'islam', label: 'Islam' },
  { value: 'judaism', label: 'Judaism' },
  { value: 'philosophy', label: 'Philosophy' }
];

export default function Library() {
  const [search, setSearch] = useState('');
  const [selectedTradition, setSelectedTradition] = useState('all');

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => base44.entities.Book.list('title', 100),
  });

  const filteredBooks = books.filter(book => {
    const matchesSearch = !search || 
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase());
    const matchesTradition = selectedTradition === 'all' || book.tradition === selectedTradition;
    return matchesSearch && matchesTradition;
  });

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <GoldHeading size="md">Sacred Library</GoldHeading>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search books, authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card/60 border-border/50 rounded-xl h-11"
        />
      </div>

      {/* Tradition filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {traditions.map(t => (
          <button
            key={t.value}
            onClick={() => setSelectedTradition(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedTradition === t.value
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Book list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-card/40" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No books found</p>
          <p className="text-muted-foreground/50 text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book, i) => (
            <BookCard key={book.id} book={book} delay={i * 0.05} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}