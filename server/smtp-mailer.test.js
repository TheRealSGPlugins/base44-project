import test from 'node:test';
import assert from 'node:assert/strict';
import { createSmtpMailer } from './smtp-mailer.js';

test('sends verification email through smtp transport', async () => {
  const calls = [];
  const mailer = createSmtpMailer({
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    user: 'me@example.com',
    pass: 'secret',
    fromEmail: 'Me <me@example.com>',
    appOrigin: 'https://base44-project-1.onrender.com',
    createTransportImpl: (config) => {
      assert.deepEqual(config, {
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: {
          user: 'me@example.com',
          pass: 'secret',
        },
      });

      return {
        sendMail: async (message) => {
          calls.push(message);
          return { messageId: 'smtp-123' };
        },
      };
    },
  });

  await mailer.sendVerificationEmail({
    toEmail: 'user@example.com',
    otpCode: '123456',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].from, 'Me <me@example.com>');
  assert.equal(calls[0].to, 'user@example.com');
  assert.match(calls[0].text, /123456/);
});
