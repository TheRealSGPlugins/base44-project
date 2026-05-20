import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createError = (message, status = 400, code = 'BAD_REQUEST') => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const safeUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role || 'user',
  verified: Boolean(user.verified),
  createdAt: user.created_at ?? user.createdAt,
  updatedAt: user.updated_at ?? user.updatedAt,
});

const hashPassword = (password, salt = randomBytes(16).toString('hex')) => ({
  salt,
  passwordHash: scryptSync(String(password), salt, 64).toString('hex'),
});

const verifyPassword = (password, salt, passwordHash) => {
  const candidate = scryptSync(String(password), salt, 64);
  const stored = Buffer.from(passwordHash, 'hex');
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
};

const createCode = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
const createToken = () => randomBytes(32).toString('hex');

const getConfig = (overrides = {}) => ({
  accountId:
    overrides.accountId ??
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    process.env.CF_ACCOUNT_ID ??
    process.env.ACCOUNT_ID ??
    '',
  databaseId:
    overrides.databaseId ??
    process.env.CLOUDFLARE_D1_DATABASE_ID ??
    process.env.CF_D1_DATABASE_ID ??
    process.env.D1_DATABASE_ID ??
    process.env.DATABASE_ID ??
    '',
  apiToken:
    overrides.apiToken ??
    process.env.CLOUDFLARE_API_TOKEN ??
    process.env.CF_API_TOKEN ??
    process.env.API_TOKEN ??
    '',
  appOrigin:
    overrides.appOrigin ??
    process.env.APP_ORIGIN ??
    process.env.RENDER_EXTERNAL_URL ??
    '',
  sendPasswordResetEmail:
    overrides.sendPasswordResetEmail ??
    null,
  sendVerificationEmail:
    overrides.sendVerificationEmail ??
    null,
  fetchImpl: overrides.fetchImpl ?? fetch,
});

const queryResultRows = (payload) => payload?.result?.[0]?.results ?? [];

export const hasCloudflareD1Config = (overrides = {}) => {
  const { accountId, databaseId, apiToken } = getConfig(overrides);
  return Boolean(accountId && databaseId && apiToken);
};

export function createCloudflareD1AuthStore(overrides = {}) {
  const {
    accountId,
    databaseId,
    apiToken,
    appOrigin,
    sendPasswordResetEmail,
    sendVerificationEmail,
    fetchImpl,
  } = getConfig(overrides);
  if (!accountId || !databaseId || !apiToken) {
    throw new Error('Missing Cloudflare D1 credentials');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const query = async (sql, params = []) => {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      const message = payload?.errors?.[0]?.message || payload?.messages?.[0]?.message || response.statusText || 'D1 query failed';
      throw createError(message, response.status || 500, 'D1_QUERY_FAILED');
    }

    return payload;
  };

  const ensureSchema = async () => {
    await query(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS otp_codes (
        email TEXT PRIMARY KEY,
        otp_code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS password_resets (
        reset_token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
    `);
  };

  const getUserByEmail = async (email) => {
    const rows = queryResultRows(
      await query(
        'SELECT id, email, role, verified, created_at, updated_at, salt, password_hash FROM users WHERE email = ? LIMIT 1',
        [email]
      )
    );
    return rows[0] || null;
  };

  const getUserBySession = async (token) => {
    const rows = queryResultRows(
      await query(
        `SELECT u.id, u.email, u.role, u.verified, u.created_at, u.updated_at, u.salt, u.password_hash
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = ?
         LIMIT 1`,
        [token]
      )
    );
    return rows[0] || null;
  };

  return {
    async init() {
      await ensureSchema();
    },

    async register({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        throw createError('Email is required');
      }
      if (!password) {
        throw createError('Password is required');
      }

      const existing = await getUserByEmail(normalizedEmail);
      if (existing?.verified) {
        throw createError('Email already registered', 409, 'EMAIL_IN_USE');
      }

      const now = new Date().toISOString();
      const { salt, passwordHash } = hashPassword(password);
      const userId = existing?.id ?? randomBytes(8).toString('hex');

      if (existing) {
        await query(
          'UPDATE users SET salt = ?, password_hash = ?, verified = 0, updated_at = ? WHERE id = ?',
          [salt, passwordHash, now, userId]
        );
      } else {
        await query(
          'INSERT INTO users (id, email, role, verified, created_at, updated_at, salt, password_hash) VALUES (?, ?, ?, 0, ?, ?, ?, ?)',
          [userId, normalizedEmail, 'user', now, now, salt, passwordHash]
        );
      }

      const otpCode = createCode();
      await query('DELETE FROM otp_codes WHERE email = ?', [normalizedEmail]);
      await query(
        'INSERT INTO otp_codes (email, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?)',
        [normalizedEmail, otpCode, Date.now() + OTP_TTL_MS, now]
      );

      if (typeof sendVerificationEmail === 'function') {
        await sendVerificationEmail({
          toEmail: normalizedEmail,
          otpCode,
          appOrigin,
        });
      }

      return {
        user: safeUser({
          id: userId,
          email: normalizedEmail,
          role: 'user',
          verified: 0,
          created_at: now,
          updated_at: now,
        }),
        otpCode,
      };
    },

    async verifyOtp({ email, otpCode }) {
      const normalizedEmail = normalizeEmail(email);
      const otpRows = queryResultRows(
        await query(
          'SELECT email, otp_code, expires_at, created_at FROM otp_codes WHERE email = ? AND otp_code = ? LIMIT 1',
          [normalizedEmail, String(otpCode)]
        )
      );
      const otp = otpRows[0];
      if (!otp || Number(otp.expires_at) < Date.now()) {
        throw createError('Invalid verification code', 400, 'INVALID_OTP');
      }

      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        throw createError('Account not found', 404, 'USER_NOT_FOUND');
      }

      const now = new Date().toISOString();
      await query('UPDATE users SET verified = 1, updated_at = ? WHERE id = ?', [now, user.id]);
      await query('DELETE FROM otp_codes WHERE email = ?', [normalizedEmail]);

      const accessToken = createToken();
      await query(
        'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)',
        [accessToken, user.id, now]
      );

      return {
        access_token: accessToken,
        user: safeUser({ ...user, verified: 1, updated_at: now }),
      };
    },

    async resendOtp(email) {
      const normalizedEmail = normalizeEmail(email);
      const user = await getUserByEmail(normalizedEmail);
      if (!user || Number(user.verified) === 1) {
        return { success: true };
      }

      const otpCode = createCode();
      const now = new Date().toISOString();
      await query('DELETE FROM otp_codes WHERE email = ?', [normalizedEmail]);
      await query(
        'INSERT INTO otp_codes (email, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?)',
        [normalizedEmail, otpCode, Date.now() + OTP_TTL_MS, now]
      );

      if (typeof sendVerificationEmail === 'function') {
        await sendVerificationEmail({
          toEmail: normalizedEmail,
          otpCode,
          appOrigin,
        });
      }

      return { success: true, otpCode };
    },

    async login({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const user = await getUserByEmail(normalizedEmail);
      if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
        throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }
      if (Number(user.verified) !== 1) {
        throw createError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
      }

      const accessToken = createToken();
      await query(
        'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)',
        [accessToken, user.id, new Date().toISOString()]
      );

      return {
        access_token: accessToken,
        user: safeUser(user),
      };
    },

    async me(token) {
      const user = await getUserBySession(token);
      if (!user) {
        throw createError('Authentication required', 401, 'AUTH_REQUIRED');
      }
      return safeUser(user);
    },

    async logout(token) {
      if (token) {
        await query('DELETE FROM sessions WHERE token = ?', [token]);
      }
      return { success: true };
    },

    async requestPasswordReset(email) {
      const normalizedEmail = normalizeEmail(email);
      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        return { success: true };
      }

      const resetToken = createToken();
      const now = new Date().toISOString();
      await query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
      await query(
        'INSERT INTO password_resets (reset_token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
        [resetToken, user.id, Date.now() + RESET_TTL_MS, now]
      );

      try {
        if (typeof sendPasswordResetEmail === 'function') {
          await sendPasswordResetEmail({
            toEmail: normalizedEmail,
            resetToken,
            appOrigin,
          });
        } else {
          throw createError('Password reset email is not configured', 503, 'MAILER_NOT_CONFIGURED');
        }
      } catch (error) {
        await query('DELETE FROM password_resets WHERE reset_token = ?', [resetToken]);
        throw error;
      }

      return { success: true };
    },

    async resetPassword({ resetToken, newPassword }) {
      const resetRows = queryResultRows(
        await query(
          'SELECT reset_token, user_id, expires_at, created_at FROM password_resets WHERE reset_token = ? LIMIT 1',
          [resetToken]
        )
      );
      const reset = resetRows[0];
      if (!reset || Number(reset.expires_at) < Date.now()) {
        throw createError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
      }
      if (!newPassword) {
        throw createError('Password is required');
      }

      const userRows = queryResultRows(
        await query(
          'SELECT id, email, role, verified, created_at, updated_at, salt, password_hash FROM users WHERE id = ? LIMIT 1',
          [reset.user_id]
        )
      );
      const user = userRows[0];
      if (!user) {
        throw createError('Account not found', 404, 'USER_NOT_FOUND');
      }

      const { salt, passwordHash } = hashPassword(newPassword);
      const now = new Date().toISOString();
      await query(
        'UPDATE users SET salt = ?, password_hash = ?, verified = 1, updated_at = ? WHERE id = ?',
        [salt, passwordHash, now, user.id]
      );
      await query('DELETE FROM password_resets WHERE reset_token = ?', [resetToken]);
      await query('DELETE FROM sessions WHERE user_id = ?', [user.id]);

      return { success: true };
    },
  };
}
