# LEO Google OAuth — one-time Preview setup

Local helper (not part of the app runtime):

```bash
node scripts/leo-google-oauth-offline.mjs
```

**DO NOT paste the refresh token into Cursor/chat.**

## Prerequisites

1. Google Cloud project with OAuth consent configured.
2. OAuth client that allows loopback redirect (Desktop app, or Web client with the printed `http://127.0.0.1:<port>/oauth/callback` URI).
3. Local env for the helper only:

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`

## Current live grant (Preview today) — WRITE NOT ENABLED

Until LEO-21E.2 RED activation, the live Preview token is expected to remain:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`

`LEO_GMAIL_REPLY_WRITE_ENABLED` must remain absent/false. Production remains untouched.

**Do not regenerate** the live Preview refresh token in LEO-21D or LEO-21E.1. Helper scope union is prepared for code; consent runs only in 21E.2.

## Helper scope union (prepared in LEO-21E.1 — do not run until 21E.2)

Exact union the helper requests:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/gmail.send`

Not included: `gmail.modify`, `gmail.compose`, `mail.google.com`.

Helper preserves: `access_type=offline`, `prompt=consent`, `include_granted_scopes=false`, loopback, no disk token persistence.

## LEO-21E.2 RED activation sequence (future — not this gate)

1. Run helper locally (owner machine).
2. Consent as the configured LEO owner account (`LEO_GOOGLE_ACCOUNT_EMAIL`).
3. Validate candidate refresh token offline (refresh + tokeninfo + Gmail/Calendar reads; **no** `messages.send`).
4. Preserve prior Preview token for rollback; replace Preview `LEO_GOOGLE_REFRESH_TOKEN` only.
5. Redeploy/reload Preview with write flag still false; prove Gmail + Calendar reads.
6. Prove `gmail.send` on tokeninfo.
7. Set Preview `LEO_GMAIL_REPLY_WRITE_ENABLED=true`; redeploy/reload; prove two-key capability.
8. One controlled Gmail reply test via Governed Actions Execute + RED confirmation.
9. Immediately set write flag OFF.

Production remains untouched throughout. Never commit tokens.

## After success (Preview env only — never commit)

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`
- `LEO_GOOGLE_REFRESH_TOKEN`
- `LEO_GOOGLE_ACCOUNT_EMAIL`
- `LEO_GMAIL_REPLY_WRITE_ENABLED` (only during controlled test window)

If the Preview was created before these env vars existed, redeploy **once**.
