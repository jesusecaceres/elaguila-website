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

## Scopes (read-only — CURRENT GRANT)

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`

No send/modify/write scopes are enabled in the current grant.

## Future write scope (NOT ENABLED)

Declared for a later RED PM gate only:

- `https://www.googleapis.com/auth/gmail.send` — required for GMAIL_REPLY live send

**Do not regenerate the refresh token in LEO-21D.** Provider code is live-capable but authority is OFF (`LEO_GMAIL_REPLY_WRITE_ENABLED` unset/false + no `gmail.send` on current grant).

Later sequence (separate gates):

1. Code ready (LEO-21D) — live-capable, flag default false, two-key enforced
2. Explicit PM authorization (LEO-21E RED)
3. New owner consent requesting **union**: existing read scopes **plus** `gmail.send` (so Gmail/Calendar reads do not regress)
4. Replace `LEO_GOOGLE_REFRESH_TOKEN` in Preview env
5. Set `LEO_GMAIL_REPLY_WRITE_ENABLED=true` in Preview only after scope proof
6. Staging connection verification
7. Single controlled live reply test
8. Production = separate later decision

No secrets in docs. Never commit tokens.

## After success

Add to **Vercel Preview** (never commit):

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`
- `LEO_GOOGLE_REFRESH_TOKEN`
- `LEO_GOOGLE_ACCOUNT_EMAIL`

If the Preview was created before these env vars existed, redeploy **once**.
