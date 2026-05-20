import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuthStore } from './auth-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const store = createAuthStore({ dataFile: path.join(rootDir, 'data', 'auth-store.json') });

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

app.post('/api/auth/register', wrap((req, res) => {
  res.json(store.register(req.body || {}));
}));

app.post('/api/auth/verify-otp', wrap((req, res) => {
  res.json(store.verifyOtp(req.body || {}));
}));

app.post('/api/auth/resend-otp', wrap((req, res) => {
  res.json(store.resendOtp(req.body?.email));
}));

app.post('/api/auth/login', wrap((req, res) => {
  res.json(store.login(req.body || {}));
}));

app.get('/api/auth/me', wrap((req, res) => {
  res.json(store.me(getBearerToken(req)));
}));

app.post('/api/auth/logout', wrap((req, res) => {
  res.json(store.logout(getBearerToken(req)));
}));

app.post('/api/auth/reset-password-request', wrap((req, res) => {
  res.json(store.requestPasswordReset(req.body?.email));
}));

app.post('/api/auth/reset-password', wrap((req, res) => {
  res.json(store.resetPassword(req.body || {}));
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
