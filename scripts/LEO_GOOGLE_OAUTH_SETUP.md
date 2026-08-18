# LEO Google OAuth — one-time Preview setup

Local helper (not part of the app runtime):

```bash
node scripts/leo-google-oauth-offline.mjs
```

## Prerequisites

1. Google Cloud project with OAuth consent configured.
2. OAuth client that allows loopback redirect (Desktop app, or Web client with the printed `http://127.0.0.1:<port>/oauth/callback` URI).
3. Local env for the helper only:

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`

## Scopes (read-only)

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`

No send/modify/write scopes.

## After success

Add to **Vercel Preview** (never commit):

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`
- `LEO_GOOGLE_REFRESH_TOKEN`
- `LEO_GOOGLE_ACCOUNT_EMAIL`

If the Preview was created before these env vars existed, redeploy **once**.
