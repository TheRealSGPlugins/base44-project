const R2_PUBLIC_URL = 'https://pub-ccb8f8828bb74d5c900406b84e2dea36.r2.dev';
const MANIFEST_URLS = ['/books/manifest.json', `${R2_PUBLIC_URL}/books/manifest.json`];

const mapManifestBook = (book) => ({
  id: book.id,
  title: book.title,
  author: book.author || 'Unknown',
  tradition: book.category?.toLowerCase() || 'other',
  category: book.category,
  description: `${book.category} - ${book.folder}`,
  original_language: 'English',
  chapters: 1,
  total_chapters: 1,
  r2_url: book.url,
});

const sortByField = (items, sortBy) => {
  if (!sortBy) return items;

  const descending = sortBy.startsWith('-');
  const field = descending ? sortBy.slice(1) : sortBy;

  return [...items].sort((left, right) => {
    const leftValue = left?.[field] ?? '';
    const rightValue = right?.[field] ?? '';
    const comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return descending ? -comparison : comparison;
  });
};

const apiRequest = async (path, { method = 'GET', body, token, headers = {} } = {}) => {
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || response.statusText || 'Request failed');
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }

  return payload;
};

// Fetch and cache the manifest
let manifestCache = null;
const getManifest = async () => {
  if (manifestCache) return manifestCache;
  for (const manifestUrl of MANIFEST_URLS) {
    try {
      const res = await fetch(manifestUrl);
      if (!res.ok) {
        continue;
      }
      manifestCache = await res.json();
      return manifestCache;
    } catch (e) {
      console.warn(`Could not fetch manifest from ${manifestUrl}:`, e);
    }
  }

  console.warn('Could not fetch manifest, using fallback:');
  return { books: [] };
};

export const base44 = {
  entities: {
    Book: {
      list: async (sortBy, limit) => {
        const manifest = await getManifest();
        let books = manifest.books.map(mapManifestBook);
        books = sortByField(books, sortBy);
        if (limit !== undefined && limit !== null) {
          books = books.slice(0, Number(limit));
        }
        return books;
      },
      filter: async (filters) => {
        const manifest = await getManifest();
        let books = manifest.books.map(mapManifestBook);
        Object.entries(filters).forEach(([key, value]) => {
          books = books.filter((book) => String(book[key]) === String(value));
        });
        return books;
      },
      create: async (fields) => fields,
      update: async (_id, fields) => fields,
      delete: async () => ({ success: true }),
    },
    BookSection: {
      filter: async () => [
        {
          id: 'pdf_section',
          book_id: '',
          chapter_number: 1,
          section_number: 1,
          content: 'View this book as a PDF.',
          verse_reference: 'PDF Format',
          chapter_title: 'Full Book',
        },
      ],
      list: async () => [],
      create: async (fields) => fields,
      bulkCreate: async (items) => items,
    },
    Bookmark: {
      list: async () => [],
      create: async (fields) => ({ ...fields, id: `local_${Date.now()}` }),
      delete: async () => ({ success: true }),
    },
    ChatThread: {
      list: async () => [],
      create: async (fields) => ({ ...fields, id: `local_${Date.now()}` }),
      update: async () => ({}),
    },
    ChatMessage: {
      create: async (fields) => ({ ...fields, id: `local_${Date.now()}` }),
      list: async () => [],
    },
  },
  integrations: {
    Core: {
      InvokeLLM: async () => ({
        answer: 'This text is available as a PDF in the archive. Use the reader to view it.',
      }),
    },
  },
};
