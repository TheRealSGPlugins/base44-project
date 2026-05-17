import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageContainer from '@/components/ui/PageContainer';
import GoldHeading from '@/components/ui/GoldHeading';
import GlassCard from '@/components/ui/GlassCard';

// Full catalog of 60+ real public domain sacred/philosophical texts
const BOOK_CATALOG = [
  // HINDUISM
  { title: 'Bhagavad Gita', author: 'Vyasa (attr.)', tradition: 'hinduism', category: 'scripture', original_language: 'Sanskrit', translator: 'Edwin Arnold', gutenberg_id: 2388, chapters: 18 },
  { title: 'Upanishads (Principal)', author: 'Various Rishis', tradition: 'hinduism', category: 'scripture', original_language: 'Sanskrit', translator: 'Max Müller', gutenberg_id: 3283, chapters: 12 },
  { title: 'Rig Veda (Selections)', author: 'Various', tradition: 'hinduism', category: 'scripture', original_language: 'Sanskrit', translator: 'Ralph T.H. Griffith', gutenberg_id: 46751, chapters: 10 },
  { title: 'Mahabharata (Abridged)', author: 'Vyasa (attr.)', tradition: 'hinduism', category: 'scripture', original_language: 'Sanskrit', translator: 'Kisari Mohan Ganguli', gutenberg_id: 15474, chapters: 20 },
  { title: 'Ramayana (Selections)', author: 'Valmiki', tradition: 'hinduism', category: 'scripture', original_language: 'Sanskrit', translator: 'Ralph T.H. Griffith', gutenberg_id: 24869, chapters: 12 },
  { title: 'Yoga Sutras of Patanjali', author: 'Patanjali', tradition: 'hinduism', category: 'philosophy', original_language: 'Sanskrit', translator: 'Charles Johnston', gutenberg_id: 5400, chapters: 4 },
  { title: 'Vivekachudamani', author: 'Adi Shankaracharya', tradition: 'hinduism', category: 'mysticism', original_language: 'Sanskrit', translator: 'Swami Madhavananda', gutenberg_id: null, chapters: 8 },
  // BUDDHISM
  { title: 'Dhammapada', author: 'Attributed to the Buddha', tradition: 'buddhism', category: 'scripture', original_language: 'Pali', translator: 'F. Max Müller', gutenberg_id: 2017, chapters: 26 },
  { title: 'Majjhima Nikaya (Selections)', author: 'Attributed to the Buddha', tradition: 'buddhism', category: 'scripture', original_language: 'Pali', translator: 'Bhikkhu Sujato', gutenberg_id: null, chapters: 10 },
  { title: 'Sutta Nipata', author: 'Attributed to the Buddha', tradition: 'buddhism', category: 'scripture', original_language: 'Pali', translator: 'V. Fausboll', gutenberg_id: 8988, chapters: 5 },
  { title: 'The Lotus Sutra', author: 'Attributed to the Buddha', tradition: 'buddhism', category: 'scripture', original_language: 'Sanskrit', translator: 'H. Kern', gutenberg_id: 7011, chapters: 28 },
  { title: 'Zen Mind, Beginner\'s Mind', author: 'Shunryu Suzuki', tradition: 'buddhism', category: 'meditation', original_language: 'English', translator: null, gutenberg_id: null, chapters: 6 },
  { title: 'The Tibetan Book of the Dead', author: 'Padmasambhava (attr.)', tradition: 'buddhism', category: 'mysticism', original_language: 'Tibetan', translator: 'W.Y. Evans-Wentz', gutenberg_id: null, chapters: 8 },
  { title: 'Diamond Sutra', author: 'Attributed to the Buddha', tradition: 'buddhism', category: 'scripture', original_language: 'Sanskrit', translator: 'William Gemmell', gutenberg_id: 9980, chapters: 32 },
  { title: 'Heart Sutra', author: 'Attributed to the Buddha', tradition: 'buddhism', category: 'scripture', original_language: 'Sanskrit', translator: 'Thich Nhat Hanh', gutenberg_id: null, chapters: 1 },
  // CHRISTIANITY
  { title: 'King James Bible - Old Testament', author: 'Various', tradition: 'christianity', category: 'scripture', original_language: 'Hebrew/Aramaic', translator: 'KJV Translators (1611)', gutenberg_id: 10, chapters: 39 },
  { title: 'King James Bible - New Testament', author: 'Various', tradition: 'christianity', category: 'scripture', original_language: 'Greek', translator: 'KJV Translators (1611)', gutenberg_id: 10, chapters: 27 },
  { title: 'The Confessions of St. Augustine', author: 'Augustine of Hippo', tradition: 'christianity', category: 'mysticism', original_language: 'Latin', translator: 'E.B. Pusey', gutenberg_id: 3296, chapters: 13 },
  { title: 'The Imitation of Christ', author: 'Thomas à Kempis', tradition: 'christianity', category: 'mysticism', original_language: 'Latin', translator: 'William Benham', gutenberg_id: 1653, chapters: 4 },
  { title: 'The Dark Night of the Soul', author: 'St. John of the Cross', tradition: 'christianity', category: 'mysticism', original_language: 'Spanish', translator: 'David Lewis', gutenberg_id: 6894, chapters: 8 },
  { title: 'The Interior Castle', author: 'St. Teresa of Ávila', tradition: 'christianity', category: 'mysticism', original_language: 'Spanish', translator: 'Benedict Zimmerman', gutenberg_id: 11622, chapters: 7 },
  { title: 'Cloud of Unknowing', author: 'Anonymous (14th c.)', tradition: 'christianity', category: 'mysticism', original_language: 'Middle English', translator: 'Evelyn Underhill', gutenberg_id: 637, chapters: 75 },
  { title: 'Philokalia (Selections)', author: 'Various Fathers', tradition: 'christianity', category: 'mysticism', original_language: 'Greek', translator: 'G.E.H. Palmer', gutenberg_id: null, chapters: 10 },
  { title: 'Revelations of Divine Love', author: 'Julian of Norwich', tradition: 'christianity', category: 'mysticism', original_language: 'Middle English', translator: 'Grace Warrack', gutenberg_id: 52958, chapters: 86 },
  { title: 'The Book of Job', author: 'Anonymous', tradition: 'christianity', category: 'scripture', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 42 },
  // ISLAM
  { title: 'Quran (Pickthall Translation)', author: 'Revelation to Muhammad (PBUH)', tradition: 'islam', category: 'scripture', original_language: 'Arabic', translator: 'Marmaduke Pickthall', gutenberg_id: 2800, chapters: 114 },
  { title: 'Masnavi (Rumi)', author: 'Jalal ad-Din Rumi', tradition: 'islam', category: 'poetry', original_language: 'Persian', translator: 'E.H. Whinfield', gutenberg_id: 1861, chapters: 6 },
  { title: 'Diwan-i-Hafiz', author: 'Hafez', tradition: 'islam', category: 'poetry', original_language: 'Persian', translator: 'Various', gutenberg_id: null, chapters: 10 },
  { title: 'The Alchemy of Happiness', author: 'Al-Ghazali', tradition: 'islam', category: 'philosophy', original_language: 'Arabic', translator: 'Claud Field', gutenberg_id: 21162, chapters: 8 },
  { title: 'Sufi Wisdom (Attar)', author: 'Farid ud-Din Attar', tradition: 'islam', category: 'mysticism', original_language: 'Persian', translator: 'Various', gutenberg_id: null, chapters: 7 },
  { title: 'Hadith Selections (Bukhari)', author: 'Muhammad al-Bukhari', tradition: 'islam', category: 'scripture', original_language: 'Arabic', translator: 'Various', gutenberg_id: null, chapters: 8 },
  // TAOISM
  { title: 'Tao Te Ching', author: 'Laozi', tradition: 'taoism', category: 'philosophy', original_language: 'Chinese', translator: 'James Legge', gutenberg_id: 216, chapters: 81 },
  { title: 'Zhuangzi (Selections)', author: 'Zhuangzi', tradition: 'taoism', category: 'philosophy', original_language: 'Chinese', translator: 'Herbert Giles', gutenberg_id: 819, chapters: 10 },
  { title: 'Liezi (Book of Lieh-Tzu)', author: 'Liezi', tradition: 'taoism', category: 'philosophy', original_language: 'Chinese', translator: 'Lionel Giles', gutenberg_id: null, chapters: 8 },
  // JUDAISM
  { title: 'Torah (Five Books of Moses)', author: 'Moses (attr.)', tradition: 'judaism', category: 'scripture', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 5 },
  { title: 'Psalms', author: 'David and others', tradition: 'judaism', category: 'poetry', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 150 },
  { title: 'Book of Proverbs', author: 'Solomon (attr.)', tradition: 'judaism', category: 'philosophy', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 31 },
  { title: 'Zohar (Selections)', author: 'Moses de Leon (attr.)', tradition: 'judaism', category: 'mysticism', original_language: 'Aramaic', translator: 'Harry Sperling', gutenberg_id: null, chapters: 8 },
  { title: 'Pirkei Avot (Ethics of the Fathers)', author: 'Rabbinic Sages', tradition: 'judaism', category: 'philosophy', original_language: 'Hebrew', translator: 'Various', gutenberg_id: null, chapters: 6 },
  // SIKHISM
  { title: 'Guru Granth Sahib (Selections)', author: 'Guru Nanak and successors', tradition: 'sikhism', category: 'scripture', original_language: 'Punjabi/Sanskrit', translator: 'Various', gutenberg_id: null, chapters: 10 },
  { title: 'Japji Sahib', author: 'Guru Nanak Dev Ji', tradition: 'sikhism', category: 'prayer', original_language: 'Punjabi', translator: 'Various', gutenberg_id: null, chapters: 8 },
  // JAINISM
  { title: 'Acaranga Sutra', author: 'Sudharmasvami (attr.)', tradition: 'jainism', category: 'scripture', original_language: 'Ardhamagadhi', translator: 'Hermann Jacobi', gutenberg_id: 4103, chapters: 16 },
  { title: 'Uttaradhyayana Sutra', author: 'Mahavira (attr.)', tradition: 'jainism', category: 'scripture', original_language: 'Ardhamagadhi', translator: 'Hermann Jacobi', gutenberg_id: 7865, chapters: 36 },
  // ZOROASTRIANISM
  { title: 'Avesta - Gathas of Zarathustra', author: 'Zarathustra', tradition: 'zoroastrianism', category: 'scripture', original_language: 'Avestan', translator: 'L.H. Mills', gutenberg_id: 6781, chapters: 17 },
  // PHILOSOPHY / MYSTICISM
  { title: 'Meditations of Marcus Aurelius', author: 'Marcus Aurelius', tradition: 'philosophy', category: 'philosophy', original_language: 'Greek', translator: 'George Long', gutenberg_id: 2680, chapters: 12 },
  { title: 'The Enchiridion (Epictetus)', author: 'Epictetus', tradition: 'philosophy', category: 'philosophy', original_language: 'Greek', translator: 'Elizabeth Carter', gutenberg_id: 45109, chapters: 53 },
  { title: 'Discourses of Epictetus', author: 'Epictetus', tradition: 'philosophy', category: 'philosophy', original_language: 'Greek', translator: 'George Long', gutenberg_id: 4143, chapters: 4 },
  { title: 'Plato\'s Republic', author: 'Plato', tradition: 'philosophy', category: 'philosophy', original_language: 'Greek', translator: 'Benjamin Jowett', gutenberg_id: 1497, chapters: 10 },
  { title: 'Plato\'s Symposium', author: 'Plato', tradition: 'philosophy', category: 'philosophy', original_language: 'Greek', translator: 'Benjamin Jowett', gutenberg_id: 1600, chapters: 8 },
  { title: 'Nicomachean Ethics (Aristotle)', author: 'Aristotle', tradition: 'philosophy', category: 'philosophy', original_language: 'Greek', translator: 'W.D. Ross', gutenberg_id: 8438, chapters: 10 },
  { title: 'The Consolation of Philosophy', author: 'Boethius', tradition: 'philosophy', category: 'philosophy', original_language: 'Latin', translator: 'H.R. James', gutenberg_id: 14328, chapters: 5 },
  { title: 'Enneads of Plotinus', author: 'Plotinus', tradition: 'mysticism', category: 'mysticism', original_language: 'Greek', translator: 'Stephen MacKenna', gutenberg_id: null, chapters: 9 },
  { title: 'Theologia Germanica', author: 'Anonymous (14th c.)', tradition: 'mysticism', category: 'mysticism', original_language: 'German', translator: 'Susanna Winkworth', gutenberg_id: 1971, chapters: 56 },
  { title: 'The Perennial Philosophy', author: 'Aldous Huxley (selections)', tradition: 'mysticism', category: 'mysticism', original_language: 'English', translator: null, gutenberg_id: null, chapters: 8 },
  { title: 'Thus Spoke Zarathustra', author: 'Friedrich Nietzsche', tradition: 'philosophy', category: 'philosophy', original_language: 'German', translator: 'Thomas Common', gutenberg_id: 1998, chapters: 10 },
  { title: 'The Analects of Confucius', author: 'Confucius', tradition: 'philosophy', category: 'philosophy', original_language: 'Chinese', translator: 'James Legge', gutenberg_id: 4094, chapters: 20 },
  { title: 'The I Ching', author: 'Various (trad. Fu Xi)', tradition: 'philosophy', category: 'philosophy', original_language: 'Chinese', translator: 'James Legge', gutenberg_id: null, chapters: 64 },
  { title: 'The Kybalion', author: 'Three Initiates', tradition: 'mysticism', category: 'mysticism', original_language: 'English', translator: null, gutenberg_id: 14209, chapters: 15 },
  { title: 'Corpus Hermeticum', author: 'Hermes Trismegistus (attr.)', tradition: 'mysticism', category: 'mysticism', original_language: 'Greek', translator: 'G.R.S. Mead', gutenberg_id: null, chapters: 16 },
  { title: 'Tao of Pooh', author: 'Benjamin Hoff', tradition: 'taoism', category: 'philosophy', original_language: 'English', translator: null, gutenberg_id: null, chapters: 8 },
  { title: 'The Sermon on the Mount', author: 'Jesus of Nazareth (recorded in Matthew)', tradition: 'christianity', category: 'scripture', original_language: 'Greek', translator: 'KJV', gutenberg_id: 10, chapters: 3 },
  { title: 'Book of Psalms', author: 'David and Others', tradition: 'judaism', category: 'poetry', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 50 },
  { title: 'Ecclesiastes', author: 'Qohelet (Solomon attr.)', tradition: 'judaism', category: 'philosophy', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 12 },
  { title: 'Song of Songs', author: 'Solomon (attr.)', tradition: 'judaism', category: 'poetry', original_language: 'Hebrew', translator: 'KJV Translators', gutenberg_id: 10, chapters: 8 },
  { title: 'Acts of the Apostles', author: 'Luke', tradition: 'christianity', category: 'scripture', original_language: 'Greek', translator: 'KJV Translators', gutenberg_id: 10, chapters: 28 },
  { title: 'Gospel of John', author: 'John the Apostle', tradition: 'christianity', category: 'scripture', original_language: 'Greek', translator: 'KJV Translators', gutenberg_id: 10, chapters: 21 },
  { title: 'The Gnostic Gospels (Nag Hammadi)', author: 'Various Gnostic Authors', tradition: 'mysticism', category: 'scripture', original_language: 'Coptic', translator: 'Various', gutenberg_id: null, chapters: 8 },
  { title: 'Book of Enoch', author: 'Enoch (attr.)', tradition: 'judaism', category: 'mysticism', original_language: 'Ethiopic', translator: 'R.H. Charles', gutenberg_id: null, chapters: 20 },
  { title: 'Mishnah (Selections)', author: 'Rabbi Judah HaNasi (comp.)', tradition: 'judaism', category: 'scripture', original_language: 'Hebrew', translator: 'Herbert Danby', gutenberg_id: null, chapters: 10 },
];

const TRADITION_COLORS = {
  hinduism: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  buddhism: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  christianity: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  islam: 'text-green-400 bg-green-400/10 border-green-400/20',
  taoism: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  judaism: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  sikhism: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  jainism: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  zoroastrianism: 'text-red-400 bg-red-400/10 border-red-400/20',
  philosophy: 'text-slate-300 bg-slate-400/10 border-slate-400/20',
  mysticism: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
};

export default function ArchiveAdmin() {
  const [status, setStatus] = useState({});
  const [importing, setImporting] = useState(null);
  const [existingBooks, setExistingBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [importAll, setImportAll] = useState(false);
  const [importAllProgress, setImportAllProgress] = useState(0);

  const loadExisting = async () => {
    const books = await base44.entities.Book.list();
    setExistingBooks(books.map(b => b.title));
    setLoaded(true);
  };

  useEffect(() => { loadExisting(); }, []);

  const importBook = async (book) => {
    setImporting(book.title);
    setStatus(s => ({ ...s, [book.title]: 'importing' }));

    try {
      // 1. Create or find the Book record
      let bookRecord;
      const existing = await base44.entities.Book.filter({ title: book.title });
      if (existing.length > 0) {
        bookRecord = existing[0];
      } else {
        bookRecord = await base44.entities.Book.create({
          title: book.title,
          author: book.author,
          tradition: book.tradition,
          category: book.category,
          original_language: book.original_language,
          translator: book.translator || null,
          is_public_domain: true,
          source_url: book.gutenberg_id ? `https://www.gutenberg.org/ebooks/${book.gutenberg_id}` : null,
          total_chapters: book.chapters,
          description: `Public domain text: ${book.title} by ${book.author}. Tradition: ${book.tradition}.`,
        });
      }

      // 2. Use LLM to generate rich, authentic chapter-by-chapter content
      const numChapters = Math.min(book.chapters, 20);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sacred text scholar. Generate authentic, accurate, and detailed content for "${book.title}" by ${book.author} (translated by ${book.translator || 'various scholars'}).

This is a PUBLIC DOMAIN text. Generate ${numChapters} chapters/sections with REAL, ACCURATE content from this text. Each section should contain the actual teachings, verses, or passages from the authentic text — not summaries. Use the real language and style of the translation.

For each chapter/section provide:
- chapter_number (1 to ${numChapters})
- chapter_title (authentic title or "Chapter X" / "Verse X")  
- verse_reference (e.g. "Chapter 1", "Book 1:1-10", "Sura 1", "Psalm 23")
- content (at least 200 words of the ACTUAL text content — real verses, teachings, or passages)
- key_theme (one short phrase describing the theme)

Return ${numChapters} sections covering the breadth of this text.`,
        response_json_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  chapter_number: { type: "number" },
                  chapter_title: { type: "string" },
                  verse_reference: { type: "string" },
                  content: { type: "string" },
                  key_theme: { type: "string" }
                }
              }
            }
          }
        },
        model: "claude_sonnet_4_6"
      });

      // 3. Bulk insert BookSection records
      if (result?.sections?.length > 0) {
        const sections = result.sections.map((s, i) => ({
          book_id: bookRecord.id,
          book_title: book.title,
          chapter_number: s.chapter_number || (i + 1),
          chapter_title: s.chapter_title || `Chapter ${i + 1}`,
          section_number: i + 1,
          content: s.content,
          tradition: book.tradition,
          language: 'english',
          verse_reference: s.verse_reference || `Chapter ${i + 1}`,
          order_index: i + 1,
        }));
        await base44.entities.BookSection.bulkCreate(sections);
      }

      setStatus(s => ({ ...s, [book.title]: 'done' }));
      setExistingBooks(prev => [...prev, book.title]);
    } catch (err) {
      console.error(err);
      setStatus(s => ({ ...s, [book.title]: 'error' }));
    }
    setImporting(null);
  };

  const importAllBooks = async () => {
    setImportAll(true);
    const toImport = BOOK_CATALOG.filter(b => !existingBooks.includes(b.title));
    for (let i = 0; i < toImport.length; i++) {
      setImportAllProgress(Math.round((i / toImport.length) * 100));
      await importBook(toImport[i]);
    }
    setImportAllProgress(100);
    setImportAll(false);
  };

  const groupedByTradition = BOOK_CATALOG.reduce((acc, book) => {
    if (!acc[book.tradition]) acc[book.tradition] = [];
    acc[book.tradition].push(book);
    return acc;
  }, {});

  return (
    <PageContainer className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <GoldHeading size="md">Archive Admin</GoldHeading>
      </div>

      <GlassCard className="mb-4 p-4" animate={false}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-foreground font-heading text-base">{BOOK_CATALOG.length} Sacred Texts Catalogued</p>
            <p className="text-muted-foreground text-xs mt-0.5">{existingBooks.length} imported · {BOOK_CATALOG.length - existingBooks.length} remaining</p>
          </div>
          <button
            onClick={importAllBooks}
            disabled={!!importing || importAll}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {importAll ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Importing… {importAllProgress}%</>
            ) : (
              <><Download className="w-4 h-4" /> Import All</>
            )}
          </button>
        </div>
        {importAll && (
          <div className="mt-3 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${importAllProgress}%` }} />
          </div>
        )}
      </GlassCard>

      <div className="space-y-6">
        {Object.entries(groupedByTradition).map(([tradition, books]) => (
          <div key={tradition}>
            <h2 className="font-heading text-primary text-lg capitalize mb-2">{tradition}</h2>
            <div className="space-y-2">
              {books.map(book => {
                const isImported = existingBooks.includes(book.title);
                const bookStatus = status[book.title];
                const isThisImporting = importing === book.title;
                return (
                  <div key={book.title} className="flex items-center justify-between bg-card/40 border border-border/30 rounded-xl px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{book.title}</p>
                      <p className="text-muted-foreground text-xs truncate">{book.author} · {book.chapters} ch.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isImported || bookStatus === 'done' ? (
                        <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-4 h-4" /> Done</span>
                      ) : bookStatus === 'error' ? (
                        <button onClick={() => importBook(book)} className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="w-4 h-4" /> Retry
                        </button>
                      ) : isThisImporting || bookStatus === 'importing' ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Importing</span>
                      ) : (
                        <button
                          onClick={() => importBook(book)}
                          disabled={!!importing || importAll}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-40"
                        >
                          <Download className="w-4 h-4" /> Import
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}