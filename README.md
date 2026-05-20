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
RESEND_FROM_EMAIL=   # optional, defaults to onboarding@resend.dev
APP_ORIGIN=
```

## Build

```bash
npm run build
```
