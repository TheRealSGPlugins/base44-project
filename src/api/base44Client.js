const R2_PUBLIC_URL = 'https://pub-ccb8f8828bb74d5c900406b84e2dea36.r2.dev';
const MANIFEST_URL = `${R2_PUBLIC_URL}/books/manifest.json`;
const TOKEN_KEY = 'base44_access_token';

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);
const getStoredToken = () => getStorage()?.getItem(TOKEN_KEY) ?? null;
const setStoredToken = (token) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  if (token) {
    storage.setItem(TOKEN_KEY, token);
  } else {
    storage.removeItem(TOKEN_KEY);
  }
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

const auth = {
  async me() {
    return apiRequest('/auth/me', { token: getStoredToken() });
  },
  async loginViaEmailPassword(email, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (result.access_token) {
      setStoredToken(result.access_token);
    }
    return result;
  },
  async register({ email, password }) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  },
  async verifyOtp({ email, otpCode }) {
    const result = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: { email, otpCode },
    });
    if (result.access_token) {
      setStoredToken(result.access_token);
    }
    return result;
  },
  async resendOtp(email) {
    return apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: { email },
    });
  },
  async resetPasswordRequest(email) {
    return apiRequest('/auth/reset-password-request', {
      method: 'POST',
      body: { email },
    });
  },
  async resetPassword({ resetToken, newPassword }) {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: { resetToken, newPassword },
    });
  },
  async logout(redirectUrl = '/') {
    const token = getStoredToken();
    if (token) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token,
        });
      } catch {
        // Ignore logout cleanup failures.
      }
    }
    setStoredToken(null);
    if (typeof window !== 'undefined' && redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  setToken(token, saveToStorage = true) {
    if (saveToStorage) {
      setStoredToken(token);
    }
    return token;
  },
  loginWithProvider() {
    if (typeof window !== 'undefined') {
      console.warn('Provider login is not configured.');
    }
    return Promise.resolve();
  },
};

export const base44 = {
  auth,
  entities: {
    Book: {
      list: async () => {
        const manifest = await getManifest();
        return manifest.books.map((book) => ({
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
        }));
      },
      filter: async (filters) => {
        const manifest = await getManifest();
        let books = manifest.books.map((book) => ({
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
        }));
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
