import { appParams } from '@/lib/app-params';

const STORAGE_KEY = 'base44_mock_data';

const getStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const setStorage = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getNextId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Initialize default data if empty
const initData = () => {
  if (!getStorage()) {
    setStorage({
      books: [
        {
          id: 'book_1',
          title: 'The Kybalion',
          author: 'The Three Initiates',
          description: 'A study of the Hermetic philosophy of ancient Egypt and Greece.',
          chapters: 12,
          created_date: new Date().toISOString(),
        },
        {
          id: 'book_2',
          title: 'The Bhagavad Gita',
          author: 'Vyasa',
          description: 'A 700-verse Hindu scripture that is part of the epic Mahabharata.',
          chapters: 18,
          created_date: new Date().toISOString(),
        },
        {
          id: 'book_3',
          title: 'The Emerald Tablet',
          author: 'Hermes Trismegistus',
          description: 'A compact and cryptic piece of the Hermetica reputed to contain the secret of the prima materia.',
          chapters: 1,
          created_date: new Date().toISOString(),
        },
        {
          id: 'book_4',
          title: 'Tao Te Ching',
          author: 'Lao Tzu',
          description: 'A classic Chinese text on philosophy and spiritual practice.',
          chapters: 81,
          created_date: new Date().toISOString(),
        },
      ],
      bookSections: [],
      bookmarks: [],
      chatThreads: [],
      chatMessages: [],
      users: [],
    });
  }
};

initData();

const entityHandler = (entityName) => ({
  list: async (sortBy, limit) => {
    const data = getStorage();
    const items = data[entityName] || [];
    const sorted = [...items].sort((a, b) => {
      const field = sortBy || 'created_date';
      if (a[field] < b[field]) return 1;
      if (a[field] > b[field]) return -1;
      return 0;
    });
    return limit ? sorted.slice(0, limit) : sorted;
  },
  filter: async (filters, sortBy, limit) => {
    const data = getStorage();
    let items = data[entityName] || [];
    Object.entries(filters).forEach(([key, value]) => {
      items = items.filter((item) => String(item[key]) === String(value));
    });
    const sorted = [...items].sort((a, b) => {
      const field = sortBy || 'created_date';
      if (a[field] < b[field]) return 1;
      if (a[field] > b[field]) return -1;
      return 0;
    });
    return limit ? sorted.slice(0, limit) : sorted;
  },
  get: async (id) => {
    const data = getStorage();
    const items = data[entityName] || [];
    return items.find((item) => item.id === id) || null;
  },
  create: async (fields) => {
    const data = getStorage();
    const record = { id: getNextId(), ...fields, created_date: new Date().toISOString() };
    data[entityName] = [...(data[entityName] || []), record];
    setStorage(data);
    return record;
  },
  update: async (id, fields) => {
    const data = getStorage();
    data[entityName] = (data[entityName] || []).map((item) =>
      item.id === id ? { ...item, ...fields } : item
    );
    setStorage(data);
    return data[entityName].find((item) => item.id === id);
  },
  delete: async (id) => {
    const data = getStorage();
    data[entityName] = (data[entityName] || []).filter((item) => item.id !== id);
    setStorage(data);
    return { success: true };
  },
  bulkCreate: async (items) => {
    const data = getStorage();
    const records = items.map((fields) => ({
      id: getNextId(),
      ...fields,
      created_date: new Date().toISOString(),
    }));
    data[entityName] = [...(data[entityName] || []), ...records];
    setStorage(data);
    return records;
  },
});

const mockUser = {
  id: 'local_user_1',
  email: 'demo@example.com',
  name: 'Demo User',
};

export const base44 = {
  auth: {
    loginViaEmailPassword: async (email, password) => {
      if (password === 'password' || password === 'demo') {
        localStorage.setItem('base44_access_token', 'mock_token_123');
        return { access_token: 'mock_token_123', user: { ...mockUser, email } };
      }
      throw new Error('Invalid email or password');
    },
    loginWithProvider: async (provider) => {
      localStorage.setItem('base44_access_token', 'mock_token_123');
    },
    register: async ({ email, password }) => {
      const data = getStorage();
      data.users.push({ id: getNextId(), email });
      setStorage(data);
      return { success: true };
    },
    verifyOtp: async ({ email, otpCode }) => {
      localStorage.setItem('base44_access_token', 'mock_token_123');
      return { access_token: 'mock_token_123' };
    },
    resendOtp: async (email) => {
      return { success: true };
    },
    resetPasswordRequest: async (email) => {
      return { success: true };
    },
    resetPassword: async ({ resetToken, newPassword }) => {
      return { success: true };
    },
    me: async () => {
      const token = localStorage.getItem('base44_access_token');
      if (token) {
        return { ...mockUser };
      }
      throw { status: 401, message: 'Not authenticated' };
    },
    logout: (redirectUrl) => {
      localStorage.removeItem('base44_access_token');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin: (redirectUrl) => {
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
    },
    setToken: (token) => {
      localStorage.setItem('base44_access_token', token);
    },
  },
  entities: {
    Book: entityHandler('books'),
    BookSection: entityHandler('bookSections'),
    Bookmark: entityHandler('bookmarks'),
    ChatThread: entityHandler('chatThreads'),
    ChatMessage: entityHandler('chatMessages'),
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        const mockResponses = [
          'This is a profound text that explores the nature of reality and consciousness. The teachings contained within have guided seekers for millennia.',
          'The ancient wisdom speaks of universal laws that govern all of existence. Understanding these principles leads to greater harmony and insight.',
          'Through careful study and contemplation, one may begin to grasp the deeper meanings hidden within these sacred verses.',
          'The text emphasizes the importance of inner transformation and the cultivation of wisdom through direct experience.',
        ];
        return {
          answer: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        };
      },
    },
  },
};