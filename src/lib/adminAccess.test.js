import test from 'node:test';
import assert from 'node:assert/strict';
import { clearAdminAccess, grantAdminAccess, hasAdminAccess, verifyAdminCode } from './adminAccess.js';

const createStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
};

test('stores and clears admin access in localStorage', () => {
  const originalWindow = global.window;
  global.window = { localStorage: createStorage() };

  grantAdminAccess();
  assert.equal(hasAdminAccess(), true);

  clearAdminAccess();
  assert.equal(hasAdminAccess(), false);

  global.window = originalWindow;
});

test('posts the admin code to the verify endpoint', async () => {
  const calls = [];

  const result = await verifyAdminCode('246810', async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    };
  });

  assert.deepEqual(result, { success: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/admin/verify');
  assert.deepEqual(JSON.parse(calls[0].options.body), { code: '246810' });
});

test('throws the backend error message when the code is rejected', async () => {
  await assert.rejects(
    verifyAdminCode('bad-code', async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid admin code', code: 'INVALID_ADMIN_CODE' }),
    })),
    /Invalid admin code/
  );
});
