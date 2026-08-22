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

## Candidate token validation (LEO-21E.2B — local only)

Do this **before** replacing any Vercel Preview token.

**Never paste a refresh token into Cursor/chat.**

1. Run the OAuth helper **manually on the owner machine** (`node scripts/leo-google-oauth-offline.mjs`).
2. Store the printed refresh token in a secure vault (password manager). Do not paste it into Cursor.
3. In a **local** PowerShell session only, set:
   - `LEO_GOOGLE_CLIENT_ID`
   - `LEO_GOOGLE_CLIENT_SECRET`
   - `LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN` (the vaulted candidate — **not** `LEO_GOOGLE_REFRESH_TOKEN`)
   - `LEO_GOOGLE_ACCOUNT_EMAIL`
4. Run:

```powershell
node scripts/leo-google-candidate-token-validate.mjs
```

5. Require `CANDIDATE_TOKEN_VALID: TRUE`. If FALSE, do not replace Preview.
6. Only then replace Vercel **Preview** `LEO_GOOGLE_REFRESH_TOKEN`.
7. Keep `LEO_GMAIL_REPLY_WRITE_ENABLED` **OFF** until post-replacement read + scope proof.

The validator never prints refresh tokens, access tokens, secrets, prefixes, or lengths. Cursor must not run it with a real candidate token.

## LEO-21E.2 RED activation sequence (future — after candidate validates)

1. Run helper locally (owner machine).
2. Consent as the configured LEO owner account (`LEO_GOOGLE_ACCOUNT_EMAIL`).
3. Store candidate token in a vault. Set it locally as `LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN` only.
4. Run `node scripts/leo-google-candidate-token-validate.mjs` until `CANDIDATE_TOKEN_VALID: TRUE`.
5. Preserve prior Preview token for rollback; replace Preview `LEO_GOOGLE_REFRESH_TOKEN` only.
6. Redeploy/reload Preview with write flag still false; prove Gmail + Calendar reads.
7. Prove `gmail.send` on tokeninfo.
8. Set Preview `LEO_GMAIL_REPLY_WRITE_ENABLED=true`; redeploy/reload; prove two-key capability.
9. One controlled Gmail reply test via Governed Actions Execute + RED confirmation.
10. Immediately set write flag OFF.

Production remains untouched throughout. Never commit tokens.

## After success (Preview env only — never commit)

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`
- `LEO_GOOGLE_REFRESH_TOKEN`
- `LEO_GOOGLE_ACCOUNT_EMAIL`
- `LEO_GMAIL_REPLY_WRITE_ENABLED` (only during controlled test window)

If the Preview was created before these env vars existed, redeploy **once**.
