import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAuthStore } from './auth-store.js';

test('register verify and login create a usable session', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'base44-auth-'));
  const dataFile = path.join(dir, 'auth.json');
  const store = createAuthStore({ dataFile });

  const registration = store.register({ email: 'user@example.com', password: 'secret123' });
  assert.match(registration.otpCode, /^\d{6}$/);

  assert.throws(() => {
    store.login({ email: 'user@example.com', password: 'secret123' });
  }, /verify/i);

  const verified = store.verifyOtp({ email: 'user@example.com', otpCode: registration.otpCode });
  assert.ok(verified.access_token);

  const currentUser = store.me(verified.access_token);
  assert.equal(currentUser.email, 'user@example.com');

  const login = store.login({ email: 'user@example.com', password: 'secret123' });
  assert.ok(login.access_token);

  rmSync(dir, { recursive: true, force: true });
});

test('password reset request sends a reset email when configured', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'base44-auth-'));
  const dataFile = path.join(dir, 'auth.json');
  const sent = [];
  const store = createAuthStore({
    dataFile,
    appOrigin: 'https://base44-project-1.onrender.com',
    sendPasswordResetEmail: async (payload) => sent.push(payload),
  });

  store.register({ email: 'user@example.com', password: 'secret123' });
  const result = await store.requestPasswordReset('user@example.com');

  assert.deepEqual(result, { success: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].toEmail, 'user@example.com');

  rmSync(dir, { recursive: true, force: true });
});
