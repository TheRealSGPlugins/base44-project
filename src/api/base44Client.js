const R2_PUBLIC_URL = 'https://pub-ccb8f8828bb74d5c900406b84e2dea36.r2.dev';
const MANIFEST_URL = `${R2_PUBLIC_URL}/books/manifest.json`;

// Fetch and cache the manifest
let manifestCache = null;
const getManifest = async () => {
  if (manifestCache) return manifestCache;
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error('Manifest not found');
    manifestCache = await res.json();
    return manifestCache;
  } catch (e) {
    console.warn('Could not fetch manifest, using fallback:', e);
    return { books: [] };
  }
};

export const base44 = {
  auth: {
    loginViaEmailPassword: async (email, password) => {
      if (password === 'password' || password === 'demo') {
        localStorage.setItem('base44_access_token', 'demo_token');
        return {
          access_token: 'demo_token',
          user: { id: 'demo_user', email, name: 'Demo User' }
        };
      }
      throw new Error('Invalid email or password');
    },
    me: async () => {
      const token = localStorage.getItem('base44_access_token');
      if (token) return { id: 'demo_user', email: 'demo@example.com', name: 'Demo User' };
      throw { status: 401, message: 'Not authenticated' };
    },
    loginWithProvider: async (...args) => { localStorage.setItem('base44_access_token', 'demo_token'); },
    register: async () => ({ success: true }),
    verifyOtp: async () => ({ access_token: 'demo_token' }),
    resendOtp: async () => ({ success: true }),
    resetPasswordRequest: async () => ({ success: true }),
    resetPassword: async () => ({ success: true }),
    logout: (redirectUrl) => {
      localStorage.removeItem('base44_access_token');
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin: (redirectUrl) => { window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`; },
    setToken: (token) => { localStorage.setItem('base44_access_token', token); },
  },
  entities: {
    Book: {
      list: async () => {
        const manifest = await getManifest();
        return manifest.books.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author || 'Unknown',
          tradition: b.category?.toLowerCase() || 'other',
          category: b.category,
          description: `${b.category} • ${b.folder}`,
          original_language: 'English',
          chapters: 1,
          total_chapters: 1,
          r2_url: b.url,
        }));
      },
      filter: async (filters) => {
        const manifest = await getManifest();
        let books = manifest.books.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author || 'Unknown',
          tradition: b.category?.toLowerCase() || 'other',
          category: b.category,
          description: `${b.category} • ${b.folder}`,
          original_language: 'English',
          chapters: 1,
          total_chapters: 1,
          r2_url: b.url,
        }));
        Object.entries(filters).forEach(([key, value]) => {
          books = books.filter(b => String(b[key]) === String(value));
        });
        return books;
      },
      create: async (fields) => fields,
      update: async (id, fields) => fields,
      delete: async () => ({ success: true }),
    },
    BookSection: {
      filter: async () => [{
        id: 'pdf_section',
        book_id: '',
        chapter_number: 1,
        section_number: 1,
        content: 'View this book as a PDF.',
        verse_reference: 'PDF Format',
        chapter_title: 'Full Book',
      }],
      list: async () => [],
      create: async (f) => f,
      bulkCreate: async (items) => items,
    },
    Bookmark: {
      list: async () => [],
      create: async (f) => ({ ...f, id: 'local_' + Date.now() }),
      delete: async () => ({ success: true }),
    },
    ChatThread: {
      list: async () => [],
      create: async (f) => ({ ...f, id: 'local_' + Date.now() }),
      update: async () => ({}),
    },
    ChatMessage: {
      create: async (f) => ({ ...f, id: 'local_' + Date.now() }),
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