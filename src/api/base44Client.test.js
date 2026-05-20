import test from 'node:test';
import assert from 'node:assert/strict';
import { base44 } from './base44Client.js';

test('book list respects sort and limit without changing the full manifest fetch', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () => ({
        books: [
          {
            id: 'book_1',
            title: 'Gamma Book',
            author: 'Test Author',
            category: 'Books',
            folder: 'Test',
            url: 'https://example.com/gamma.pdf',
          },
          {
            id: 'book_2',
            title: 'Alpha Book',
            author: 'Test Author',
            category: 'Books',
            folder: 'Test',
            url: 'https://example.com/alpha.pdf',
          },
          {
            id: 'book_3',
            title: 'Beta Book',
            author: 'Test Author',
            category: 'Books',
            folder: 'Test',
            url: 'https://example.com/beta.pdf',
          },
        ],
      }),
    };
  };

  try {
    const limitedBooks = await base44.entities.Book.list('title', 2);
    const allBooks = await base44.entities.Book.list();

    assert.equal(calls[0], '/books/manifest.json');
    assert.equal(limitedBooks.length, 2);
    assert.deepEqual(limitedBooks.map((book) => book.title), ['Alpha Book', 'Beta Book']);
    assert.equal(allBooks.length, 3);
  } finally {
    global.fetch = originalFetch;
  }
});
