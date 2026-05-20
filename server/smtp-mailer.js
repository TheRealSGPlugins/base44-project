import nodemailer from 'nodemailer';
import { buildPasswordResetEmail, buildVerificationEmail } from './resend-mailer.js';

const createError = (message, status = 500, code = 'MAILER_ERROR') => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
};

const normalizePort = (value, fallback = 587) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveConfig = (overrides = {}) => {
  const host = overrides.host ?? process.env.SMTP_HOST ?? '';
  const user = overrides.user ?? process.env.SMTP_USER ?? '';
  const pass = overrides.pass ?? process.env.SMTP_PASSWORD ?? '';
  const fromEmail = overrides.fromEmail ?? process.env.SMTP_FROM ?? user;
  const appOrigin = overrides.appOrigin ?? process.env.APP_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? '';
  const port = normalizePort(overrides.port ?? process.env.SMTP_PORT);
  const secure =
    overrides.secure ?? (process.env.SMTP_SECURE != null ? normalizeBoolean(process.env.SMTP_SECURE) : port === 465);

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    appOrigin,
    createTransportImpl: overrides.createTransportImpl ?? nodemailer.createTransport,
  };
};

export const hasSmtpConfig = (overrides = {}) => {
  const { host, user, pass, fromEmail, appOrigin } = resolveConfig(overrides);
  return Boolean(host && user && pass && fromEmail && appOrigin);
};

export function createSmtpMailer(overrides = {}) {
  const { host, port, secure, user, pass, fromEmail, appOrigin, createTransportImpl } = resolveConfig(overrides);
  const isConfigured = Boolean(host && user && pass && fromEmail && appOrigin);
  const transport = isConfigured
    ? createTransportImpl({
        host,
        port,
        secure,
        auth: { user, pass },
      })
    : null;

  const send = async (messageBuilder, payload, errorLabel) => {
    if (!isConfigured || !transport) {
      throw createError('SMTP is not configured', 500, 'MAILER_NOT_CONFIGURED');
    }

    const message = messageBuilder({
      fromEmail,
      appOrigin,
      ...payload,
    });

    try {
      return await transport.sendMail(message);
    } catch (error) {
      const messageText = error?.message || `Failed to send ${errorLabel}`;
      throw createError(messageText, 502, 'MAILER_SEND_FAILED');
    }
  };

  return {
    isConfigured,
    async sendVerificationEmail(payload) {
      return send(buildVerificationEmail, payload, 'verification email');
    },
    async sendPasswordResetEmail(payload) {
      return send(buildPasswordResetEmail, payload, 'password reset email');
    },
  };
}
