import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudflareD1AuthStore } from './cloudflare-d1-auth-store.js';

function createFakeD1Fetch() {
  const state = {
    users: [],
    otpCodes: [],
    passwordResets: [],
    sessions: [],
  };

  const response = (results = []) => ({
    ok: true,
    json: async () => ({ success: true, result: [{ results }] }),
  });

  const normalize = (sql) => sql.replace(/\s+/g, ' ').trim().toLowerCase();

  return async (_url, options) => {
    const { sql, params = [] } = JSON.parse(options.body);
    const statement = normalize(sql);

    if (statement.startsWith('pragma foreign_keys = on; create table if not exists users')) {
      return response();
    }

    if (statement.includes('select id, email, role, verified, created_at, updated_at, salt, password_hash from users where email = ? limit 1')) {
      const email = params[0];
      const user = state.users.find((row) => row.email === email);
      return response(user ? [user] : []);
    }

    if (statement.startsWith('insert into users')) {
      const [id, email, role, createdAt, updatedAt, salt, passwordHash] = params;
      state.users.push({
        id,
        email,
        role,
        verified: 0,
        created_at: createdAt,
        updated_at: updatedAt,
        salt,
        password_hash: passwordHash,
      });
      return response();
    }

    if (statement.startsWith('update users set salt = ?, password_hash = ?, verified = 0, updated_at = ? where id = ?')) {
      const [salt, passwordHash, updatedAt, id] = params;
      const user = state.users.find((row) => row.id === id);
      if (user) {
        user.salt = salt;
        user.password_hash = passwordHash;
        user.verified = 0;
        user.updated_at = updatedAt;
      }
      return response();
    }

    if (statement.startsWith('delete from otp_codes where email = ?')) {
      const [email] = params;
      state.otpCodes = state.otpCodes.filter((row) => row.email !== email);
      return response();
    }

    if (statement.startsWith('insert into otp_codes')) {
      const [email, otpCode, expiresAt, createdAt] = params;
      state.otpCodes.push({ email, otp_code: otpCode, expires_at: expiresAt, created_at: createdAt });
      return response();
    }

    if (statement.startsWith('select email, otp_code, expires_at, created_at from otp_codes where email = ? and otp_code = ? limit 1')) {
      const [email, otpCode] = params;
      const otp = state.otpCodes.find((row) => row.email === email && row.otp_code === otpCode);
      return response(otp ? [otp] : []);
    }

    if (statement.startsWith('update users set verified = 1, updated_at = ? where id = ?')) {
      const [updatedAt, id] = params;
      const user = state.users.find((row) => row.id === id);
      if (user) {
        user.verified = 1;
        user.updated_at = updatedAt;
      }
      return response();
    }

    if (statement.startsWith('insert into sessions')) {
      const [token, userId, createdAt] = params;
      state.sessions.push({ token, user_id: userId, created_at: createdAt });
      return response();
    }

    if (statement.startsWith('select id, email, role, verified, created_at, updated_at, salt, password_hash from users where id = ? limit 1')) {
      const [id] = params;
      const user = state.users.find((row) => row.id === id);
      return response(user ? [user] : []);
    }

    if (statement.startsWith('delete from password_resets where user_id = ?')) {
      const [userId] = params;
      state.passwordResets = state.passwordResets.filter((row) => row.user_id !== userId);
      return response();
    }

    if (statement.startsWith('insert into password_resets')) {
      const [resetToken, userId, expiresAt, createdAt] = params;
      state.passwordResets.push({ reset_token: resetToken, user_id: userId, expires_at: expiresAt, created_at: createdAt });
      return response();
    }

    if (statement.startsWith('select reset_token, user_id, expires_at, created_at from password_resets where reset_token = ? limit 1')) {
      const [resetToken] = params;
      const reset = state.passwordResets.find((row) => row.reset_token === resetToken);
      return response(reset ? [reset] : []);
    }

    if (statement.startsWith('delete from password_resets where reset_token = ?')) {
      const [resetToken] = params;
      state.passwordResets = state.passwordResets.filter((row) => row.reset_token !== resetToken);
      return response();
    }

    if (statement.startsWith('delete from sessions where user_id = ?')) {
      const [userId] = params;
      state.sessions = state.sessions.filter((row) => row.user_id !== userId);
      return response();
    }

    if (statement.startsWith('delete from sessions where token = ?')) {
      const [token] = params;
      state.sessions = state.sessions.filter((row) => row.token !== token);
      return response();
    }

    throw new Error(`Unhandled SQL in fake D1: ${sql}`);
  };
}

test('password reset request sends a reset email', async () => {
  const sent = [];
  const store = createCloudflareD1AuthStore({
    accountId: 'acct',
    databaseId: 'db',
    apiToken: 'token',
    appOrigin: 'https://base44-project-1.onrender.com',
    sendPasswordResetEmail: async (payload) => sent.push(payload),
    fetchImpl: createFakeD1Fetch(),
  });

  await store.init();
  await store.register({ email: 'user@example.com', password: 'secret123' });

  const result = await store.requestPasswordReset('user@example.com');

  assert.deepEqual(result, { success: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].toEmail, 'user@example.com');
  assert.match(sent[0].resetToken, /^[a-f0-9]{64}$/);
});
