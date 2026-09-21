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

## Scopes — read (existing, already granted to any current refresh token)

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`

## Scopes — connected-action write (LEO FINAL-02 code, not yet consented)

- `https://www.googleapis.com/auth/gmail.compose` — draft creation and sending.
- `https://www.googleapis.com/auth/calendar.events` — event create/update.
- `https://www.googleapis.com/auth/contacts.readonly` — saved-contact lookup.

No broader scopes (`https://mail.google.com/`, `gmail.modify`, bare `calendar`,
`contacts`, `directory.readonly`) are used unless a concrete, proven technical
blocker requires one — narrower is preferred and this list should not grow
without a documented reason.

## FINAL-03 reconsent is required before any real write works

**A refresh token minted under the read-only scopes above does NOT gain the
write scopes just because the app's code now requests them.** Google does not
retroactively expand an existing grant. Before any Gmail/Calendar/Contacts
write can actually succeed in Production:

1. The owner must re-run this offline helper (or an equivalent consent flow)
   with the full read + write scope list, and explicitly grant consent again —
   Google will show the new gmail.compose / calendar.events / contacts.readonly
   permissions on the consent screen.
2. This mints a **new** `LEO_GOOGLE_REFRESH_TOKEN`, which replaces the old one.
3. Only after that new token is in place — **and** `LEO_GOOGLE_WRITE_ENABLED=true`
   is set server-side — does LEO FINAL-02's write code path become reachable.
   Until then, LEO truthfully reports connected-action writes as unavailable /
   requiring owner setup; it never fakes success.

This repo does not perform this consent flow, mint a token, or read/print any
credential value — that is a FINAL-03 owner action, deliberately kept out of
FINAL-02's automated scope.

## After success

Add to **Vercel Preview** (never commit):

- `LEO_GOOGLE_CLIENT_ID`
- `LEO_GOOGLE_CLIENT_SECRET`
- `LEO_GOOGLE_REFRESH_TOKEN`
- `LEO_GOOGLE_ACCOUNT_EMAIL`

To enable connected-action writes once the new-scope refresh token above is in
place, also set:

- `LEO_GOOGLE_WRITE_ENABLED=true` — server-only, default is FALSE/absent. This
  flag alone is never sufficient authorization; every write still requires
  owner_admin, explicit in-app confirmation, and a successful provider call.

If the Preview was created before these env vars existed, redeploy **once**.
