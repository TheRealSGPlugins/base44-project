# Divine Bratan Archive

## Local dev

Run the API and frontend in separate terminals:

```bash
npm start
npm run dev
```

## Render env

Set these on the Render web service for Cloudflare D1 auth storage:

```bash
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_D1_DATABASE_ID=
CLOUDFLARE_API_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_ORIGIN=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
ADMIN_ACCESS_CODE=
```

For a personal email account, set the `SMTP_*` values instead of the Resend ones. `SMTP_FROM` can usually just be your email address.
If `ADMIN_ACCESS_CODE` is unset, the app falls back to `271828` for `/archive-admin`.

## Build

```bash
npm run build
```
