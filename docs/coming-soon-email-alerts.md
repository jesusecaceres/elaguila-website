# Coming Soon V2 Lead Email Alerts

Production email notifications for Leonix launch leads saved from public Coming Soon V2 forms and related pipelines.

## What sends email

After a **successful Supabase insert**, the server sends one internal notification email via **Resend**:

| Pipeline | API route | Subject |
|----------|-----------|---------|
| Coming Soon newsletter / launch signup | `POST /api/newsletter/subscribe` | New Leonix newsletter signup |
| General / advertising / contact leads | `POST /api/leads` | New Leonix lead from Coming Soon *(when source page is Coming Soon)* |
| Promo / print quote leads | `POST /api/leads` | New Leonix promotional quote lead |
| Media kit requests | `POST /api/media-kit/request` | New Leonix media kit request |

Newsletter notifications are sent **only on new subscriber inserts**, not when an existing email is updated (dedupe safety).

## Recipient

Default: **info@leonixmedia.com**

Override in Vercel:

```
LEONIX_NOTIFICATION_EMAIL=info@leonixmedia.com
```

`chuy@leonixmedia.com` is used on privacy/policy pages only — lead alerts go to the business inbox above unless you explicitly override the env var.

## Email provider

**Resend** (`https://api.resend.com/emails`) via server-only utilities:

- `app/lib/email/sendLeonixResendEmail.ts`
- `app/lib/email/leonixResendConfig.ts`
- `app/lib/email/leonixNotificationRecipient.ts`

## Required Vercel env vars (Production)

| Variable | Required | Example |
|----------|----------|---------|
| `RESEND_API_KEY` | **Yes** | `re_…` from Resend dashboard |
| `LEONIX_EMAIL_FROM` | Recommended | `Leonix Media <notifications@leonixmedia.com>` |
| `LEONIX_NOTIFICATION_EMAIL` | Optional | `info@leonixmedia.com` (default if unset) |

Fallback From aliases already supported: `LEONIX_RESEND_FROM`, `TIENDA_ORDER_EMAIL_FROM`.

If `RESEND_API_KEY` is missing, leads **still save to Supabase** and the public form returns success. Server logs a safe warning — no secrets exposed to the client.

**Redeploy required** after adding or changing env vars.

## What happens if email fails

1. Supabase insert succeeds → admin inbox shows the lead.
2. Resend send fails or is not configured → server logs `[leads]`, `[newsletter]`, or `[media-kit]` warning.
3. Public API still returns `{ ok: true, saved: true, emailSent: false }` when the database save succeeded.

Email is never sent on admin page reads, page loads, or failed inserts.

## Notification body contents

Each email includes available lead fields plus admin review links:

- General leads: `https://leonixmedia.com/admin/leads/inbox`
- Promo / print quote: `https://leonixmedia.com/admin/leads/inbox?view=promo`
- Newsletter: `https://leonixmedia.com/admin/leads/newsletter`
- Media kit: `https://leonixmedia.com/admin/leads/media-kit`

## Test plan

### 1. Vercel setup

1. Add `RESEND_API_KEY` and verified `LEONIX_EMAIL_FROM` in Production.
2. Optionally set `LEONIX_NOTIFICATION_EMAIL=info@leonixmedia.com`.
3. Redeploy.

### 2. QA URLs (production, after deploy)

| Test | URL / action | Admin verify |
|------|--------------|--------------|
| Newsletter | Submit on `/coming-soon-v2` launch form | `/admin/leads/newsletter` |
| General lead | Submit via `/contacto?sourcePage=coming-soon-v2` | `/admin/leads/inbox` |
| Promo quote | Submit via `/tienda/contacto?sourceCta=promo_quote` | `/admin/leads/inbox?view=promo` |
| Media kit | Submit on `/media-kit` interest form | `/admin/leads/media-kit` |

### 3. Confirm email

Check **info@leonixmedia.com** (or `LEONIX_NOTIFICATION_EMAIL`) for the subject lines above within a few minutes.

### 4. Local verify

```bash
npm run verify:coming-soon-email-alerts
npm run build
```

## Verification script

```bash
npm run verify:coming-soon-email-alerts
```

Checks save paths, server-only Resend usage, post-insert send order, failure handling, admin links, and guardrails (no public redesign, no schema changes).
