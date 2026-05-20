import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthStore } from './auth-store.js';
import { createCloudflareD1AuthStore, hasCloudflareD1Config } from './cloudflare-d1-auth-store.js';
import { createSmtpMailer, hasSmtpConfig } from './smtp-mailer.js';
import { createResendMailer } from './resend-mailer.js';
import { verifyAdminCode } from './admin-access.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appOrigin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || '';
const adminAccessCode = process.env.ADMIN_ACCESS_CODE?.trim() || '271828';
const smtpMailer = hasSmtpConfig()
  ? createSmtpMailer({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
      appOrigin,
    })
  : null;
const resendMailer = createResendMailer({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL,
  appOrigin,
});
const emailMailer = smtpMailer || resendMailer;

const store = hasCloudflareD1Config()
  ? createCloudflareD1AuthStore({
      appOrigin,
      sendVerificationEmail: emailMailer.sendVerificationEmail,
      sendPasswordResetEmail: emailMailer.sendPasswordResetEmail,
    })
  : createAuthStore({
      dataFile: path.join(rootDir, 'data', 'auth-store.json'),
      appOrigin,
      sendVerificationEmail: emailMailer.sendVerificationEmail,
      sendPasswordResetEmail: emailMailer.sendPasswordResetEmail,
    });

await store.init?.();

console.info(
  `Auth store: ${hasCloudflareD1Config() ? 'cloudflare-d1' : 'local-json'}; email sender: ${smtpMailer ? 'smtp' : resendMailer.isConfigured ? 'resend' : 'not configured'}`
);

if (!smtpMailer && !resendMailer.isConfigured) {
  console.warn('Email is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD/APP_ORIGIN for personal email, or RESEND_API_KEY/RESEND_FROM_EMAIL/APP_ORIGIN for Resend.');
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

app.post('/api/admin/verify', wrap(async (req, res) => {
  if (!verifyAdminCode(req.body?.code, adminAccessCode)) {
    const error = new Error('Invalid admin code');
    error.status = 401;
    error.code = 'INVALID_ADMIN_CODE';
    throw error;
  }

  res.json({ success: true });
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
