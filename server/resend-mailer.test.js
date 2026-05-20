import test from 'node:test';
import assert from 'node:assert/strict';
import { createResendMailer } from './resend-mailer.js';

test('builds and sends a password reset email', async () => {
  const calls = [];
  const mailer = createResendMailer({
    apiKey: 're_test',
    fromEmail: 'Archive <no-reply@example.com>',
    appOrigin: 'https://base44-project-1.onrender.com',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ id: 'email_123' }) };
    },
  });

  await mailer.sendPasswordResetEmail({
    toEmail: 'user@example.com',
    resetToken: 'token-123',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.to, 'user@example.com');
  assert.match(body.html, /\/reset-password\?token=token-123/);
});
