import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthStore } from './auth-store.js';
import { createCloudflareD1AuthStore, hasCloudflareD1Config } from './cloudflare-d1-auth-store.js';
import { createResendMailer } from './resend-mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appOrigin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || '';
const resendMailer = createResendMailer({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL,
  appOrigin,
});

const store = hasCloudflareD1Config()
  ? createCloudflareD1AuthStore({
      appOrigin,
      sendVerificationEmail: resendMailer.sendVerificationEmail,
      sendPasswordResetEmail: resendMailer.sendPasswordResetEmail,
    })
  : createAuthStore({
      dataFile: path.join(rootDir, 'data', 'auth-store.json'),
      appOrigin,
      sendVerificationEmail: resendMailer.sendVerificationEmail,
      sendPasswordResetEmail: resendMailer.sendPasswordResetEmail,
    });

await store.init?.();

console.info(
  `Auth store: ${hasCloudflareD1Config() ? 'cloudflare-d1' : 'local-json'}; email sender: ${resendMailer.isConfigured ? 'resend' : 'not configured'}`
);

if (!resendMailer.isConfigured) {
  console.warn('Resend mailer is not fully configured. Verification and reset emails will fail until RESEND_API_KEY, RESEND_FROM_EMAIL, and APP_ORIGIN are set.');
}

const app = express();
app.use(express.json());

const getBearerToken = (req) => {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const sendError = (res, error) =>
  res.status(error.status || 500).json({
    message: error.message || 'Server error',
    code: error.code || 'SERVER_ERROR',
  });

const wrap = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    sendError(res, error);
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', wrap(async (req, res) => {
  res.json(await store.register(req.body || {}));
}));

app.post('/api/auth/verify-otp', wrap(async (req, res) => {
  res.json(await store.verifyOtp(req.body || {}));
}));

app.post('/api/auth/resend-otp', wrap(async (req, res) => {
  res.json(await store.resendOtp(req.body?.email));
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  res.json(await store.login(req.body || {}));
}));

app.get('/api/auth/me', wrap(async (req, res) => {
  res.json(await store.me(getBearerToken(req)));
}));

app.post('/api/auth/logout', wrap(async (req, res) => {
  res.json(await store.logout(getBearerToken(req)));
}));

app.post('/api/auth/reset-password-request', wrap(async (req, res) => {
  res.json(await store.requestPasswordReset(req.body?.email));
}));

app.post('/api/auth/reset-password', wrap(async (req, res) => {
  res.json(await store.resetPassword(req.body || {}));
}));

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
