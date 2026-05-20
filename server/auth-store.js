import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_DATA = {
  users: [],
  sessions: [],
  otpCodes: [],
  passwordResets: [],
};

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
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
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

const loadData = (filePath) => {
  if (!existsSync(filePath)) {
    return structuredClone(DEFAULT_DATA);
  }

  try {
    const raw = readFileSync(filePath, 'utf8');
    return { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
};

export function createAuthStore({ dataFile } = {}) {
  const filePath = dataFile || path.resolve(process.cwd(), 'data', 'auth-store.json');
  mkdirSync(path.dirname(filePath), { recursive: true });
  let data = loadData(filePath);

  const save = () => {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  const findUserByEmail = (email) => data.users.find((user) => user.email === email);
  const findSession = (token) => data.sessions.find((session) => session.token === token);
  const removeSessionsForUser = (userId) => {
    data.sessions = data.sessions.filter((session) => session.userId !== userId);
  };
  const removeOtpForEmail = (email) => {
    data.otpCodes = data.otpCodes.filter((entry) => entry.email !== email);
  };
  const removeResetToken = (resetToken) => {
    data.passwordResets = data.passwordResets.filter((entry) => entry.resetToken !== resetToken);
  };

  return {
    register({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        throw createError('Email is required');
      }
      if (!password) {
        throw createError('Password is required');
      }

      const now = new Date().toISOString();
      let user = findUserByEmail(normalizedEmail);

      if (user?.verified) {
        throw createError('Email already registered', 409, 'EMAIL_IN_USE');
      }

      const { salt, passwordHash } = hashPassword(password);
      if (!user) {
        user = {
          id: randomBytes(8).toString('hex'),
          email: normalizedEmail,
          role: 'user',
          verified: false,
          createdAt: now,
          updatedAt: now,
          salt,
          passwordHash,
        };
        data.users.push(user);
      } else {
        user.salt = salt;
        user.passwordHash = passwordHash;
        user.updatedAt = now;
      }

      const otpCode = createCode();
      removeOtpForEmail(normalizedEmail);
      data.otpCodes.push({
        email: normalizedEmail,
        otpCode,
        expiresAt: Date.now() + OTP_TTL_MS,
        createdAt: now,
      });
      save();

      return {
        user: safeUser(user),
        otpCode,
      };
    },

    verifyOtp({ email, otpCode }) {
      const normalizedEmail = normalizeEmail(email);
      const user = findUserByEmail(normalizedEmail);
      if (!user) {
        throw createError('Account not found', 404, 'USER_NOT_FOUND');
      }

      const entry = data.otpCodes.find(
        (item) => item.email === normalizedEmail && item.otpCode === String(otpCode)
      );
      if (!entry || entry.expiresAt < Date.now()) {
        throw createError('Invalid verification code', 400, 'INVALID_OTP');
      }

      const now = new Date().toISOString();
      user.verified = true;
      user.updatedAt = now;
      removeOtpForEmail(normalizedEmail);

      const accessToken = createToken();
      data.sessions.push({
        token: accessToken,
        userId: user.id,
        createdAt: now,
      });
      save();

      return {
        access_token: accessToken,
        user: safeUser(user),
      };
    },

    resendOtp(email) {
      const normalizedEmail = normalizeEmail(email);
      const user = findUserByEmail(normalizedEmail);
      if (!user || user.verified) {
        return { success: true };
      }

      const otpCode = createCode();
      removeOtpForEmail(normalizedEmail);
      data.otpCodes.push({
        email: normalizedEmail,
        otpCode,
        expiresAt: Date.now() + OTP_TTL_MS,
        createdAt: new Date().toISOString(),
      });
      save();

      return { success: true, otpCode };
    },

    login({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const user = findUserByEmail(normalizedEmail);
      if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
        throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }
      if (!user.verified) {
        throw createError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
      }

      const accessToken = createToken();
      data.sessions.push({
        token: accessToken,
        userId: user.id,
        createdAt: new Date().toISOString(),
      });
      save();

      return {
        access_token: accessToken,
        user: safeUser(user),
      };
    },

    me(token) {
      const session = findSession(token);
      if (!session) {
        throw createError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const user = data.users.find((entry) => entry.id === session.userId);
      if (!user) {
        throw createError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      return safeUser(user);
    },

    logout(token) {
      if (token) {
        data.sessions = data.sessions.filter((session) => session.token !== token);
        save();
      }
      return { success: true };
    },

    requestPasswordReset(email) {
      const normalizedEmail = normalizeEmail(email);
      const user = findUserByEmail(normalizedEmail);
      if (!user) {
        return { success: true };
      }

      const resetToken = createToken();
      removeResetToken(resetToken);
      data.passwordResets.push({
        resetToken,
        userId: user.id,
        expiresAt: Date.now() + RESET_TTL_MS,
        createdAt: new Date().toISOString(),
      });
      save();

      return {
        success: true,
        resetToken,
      };
    },

    resetPassword({ resetToken, newPassword }) {
      const entry = data.passwordResets.find((item) => item.resetToken === resetToken);
      if (!entry || entry.expiresAt < Date.now()) {
        throw createError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
      }
      if (!newPassword) {
        throw createError('Password is required');
      }

      const user = data.users.find((record) => record.id === entry.userId);
      if (!user) {
        throw createError('Account not found', 404, 'USER_NOT_FOUND');
      }

      const { salt, passwordHash } = hashPassword(newPassword);
      user.salt = salt;
      user.passwordHash = passwordHash;
      user.verified = true;
      user.updatedAt = new Date().toISOString();
      removeResetToken(resetToken);
      removeSessionsForUser(user.id);
      save();

      return { success: true };
    },
  };
}
