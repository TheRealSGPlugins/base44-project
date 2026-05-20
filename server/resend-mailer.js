const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const createError = (message, status = 500, code = 'MAILER_ERROR') => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

export function buildPasswordResetEmail({ fromEmail, appOrigin, toEmail, resetToken }) {
  const origin = trimTrailingSlash(appOrigin);
  if (!origin) {
    throw createError('APP_ORIGIN is required', 500, 'MAILER_NOT_CONFIGURED');
  }
  if (!fromEmail) {
    throw createError('RESEND_FROM_EMAIL is required', 500, 'MAILER_NOT_CONFIGURED');
  }
  if (!toEmail) {
    throw createError('Recipient email is required', 400, 'MAILER_INVALID_RECIPIENT');
  }
  if (!resetToken) {
    throw createError('Reset token is required', 400, 'MAILER_INVALID_TOKEN');
  }

  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`;

  return {
    from: fromEmail,
    to: toEmail,
    subject: 'Reset your Divine Bratan Archive password',
    html: [
      '<p>You requested a password reset for Divine Bratan Archive.</p>',
      `<p><a href="${resetUrl}">Reset your password</a></p>`,
      '<p>If you did not request this, you can ignore this email.</p>',
    ].join(''),
    text: `Reset your password here: ${resetUrl}`,
  };
}

export function buildVerificationEmail({ fromEmail, appOrigin, toEmail, otpCode }) {
  const origin = trimTrailingSlash(appOrigin);
  if (!origin) {
    throw createError('APP_ORIGIN is required', 500, 'MAILER_NOT_CONFIGURED');
  }
  if (!fromEmail) {
    throw createError('RESEND_FROM_EMAIL is required', 500, 'MAILER_NOT_CONFIGURED');
  }
  if (!toEmail) {
    throw createError('Recipient email is required', 400, 'MAILER_INVALID_RECIPIENT');
  }
  if (!otpCode) {
    throw createError('Verification code is required', 400, 'MAILER_INVALID_TOKEN');
  }

  return {
    from: fromEmail,
    to: toEmail,
    subject: 'Verify your Divine Bratan Archive email',
    html: [
      '<p>Welcome to Divine Bratan Archive.</p>',
      `<p>Your verification code is <strong>${otpCode}</strong>.</p>`,
      '<p>Enter this code in the app to finish creating your account.</p>',
    ].join(''),
    text: `Your verification code is ${otpCode}. Enter it in the app to finish creating your account.`,
  };
}

export function createResendMailer({ apiKey, fromEmail, appOrigin, fetchImpl = fetch } = {}) {
  const resolvedFromEmail = fromEmail || 'onboarding@resend.dev';
  const isConfigured = Boolean(apiKey && appOrigin);

  return {
    isConfigured,
    async sendVerificationEmail({ toEmail, otpCode }) {
      const email = buildVerificationEmail({
        fromEmail: resolvedFromEmail,
        appOrigin,
        toEmail,
        otpCode,
      });

      if (!apiKey) {
        throw createError('RESEND_API_KEY is required', 500, 'MAILER_NOT_CONFIGURED');
      }

      const response = await fetchImpl(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw createError(
          payload?.error?.message || payload?.message || 'Failed to send verification email',
          response.status || 502,
          'MAILER_SEND_FAILED'
        );
      }

      return payload;
    },
    async sendPasswordResetEmail({ toEmail, resetToken }) {
      const email = buildPasswordResetEmail({
        fromEmail: resolvedFromEmail,
        appOrigin,
        toEmail,
        resetToken,
      });

      if (!apiKey) {
        throw createError('RESEND_API_KEY is required', 500, 'MAILER_NOT_CONFIGURED');
      }

      const response = await fetchImpl(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw createError(
          payload?.error?.message || payload?.message || 'Failed to send password reset email',
          response.status || 502,
          'MAILER_SEND_FAILED'
        );
      }

      return payload;
    },
  };
}
