import test from 'node:test';
import assert from 'node:assert/strict';
import { base44 } from './base44Client.js';

test('book list loads the local books manifest', async () => {
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
            title: 'Test Book',
            author: 'Test Author',
            category: 'Books',
            folder: 'Test',
            url: 'https://example.com/test.pdf',
          },
        ],
      }),
    };
  };

  try {
    const books = await base44.entities.Book.list();
    assert.equal(calls[0], '/books/manifest.json');
    assert.equal(books[0].title, 'Test Book');
  } finally {
    global.fetch = originalFetch;
  }
});
