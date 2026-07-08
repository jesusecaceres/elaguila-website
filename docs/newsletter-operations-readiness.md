# Newsletter Operations Readiness

Gate: **NEWSLETTER-OPERATIONS-READINESS-AUDIT-01**

This document describes what is **built today** for Leonix newsletter operations (Launch 25 capture + admin subscriber management) and what remains **future work**.

---

## Current built system

### Public signup + Launch 25 promo delivery

| Step | Status | Notes |
|------|--------|-------|
| Public newsletter signup (`POST /api/newsletter/subscribe`) | **ACTIVE** | Saves subscriber first, then promo code |
| Subscriber save/update (`leonix_newsletter_subscribers`) | **ACTIVE** | Upsert by email; consent + source tracked |
| Launch 25 code create/reuse | **ACTIVE** | One active `code_type=newsletter` code per email |
| Promo metadata doctrine | **ACTIVE** | `website_launch_25`, `stripe_website_checkout`, `website_checkout_only`, `print_combo_excluded` |
| Subscriber-facing promo email (Resend) | **ACTIVE** | `buildNewsletterPromoCodeEmail` — website checkout only; excludes print/combo/free |
| Promo delivery status metadata | **ACTIVE** | `email_send_status`: `sent` / `failed` / `not_configured` / `pending` on promo row |
| Internal team notification | **ACTIVE** | Separate from subscriber promo email; `buildLaunchSignupEmail` → `LEONIX_NOTIFICATION_EMAIL` |
| Honest API response | **ACTIVE** | Returns `promoCodeEmailSent`, `promoCodeEmailStatus`, `warning` when applicable |

### Admin subscriber operations

| Capability | Route / component | Status |
|------------|-------------------|--------|
| Newsletter inbox | `/admin/leads/newsletter` | **ACTIVE** |
| Search (email, name, city, interests) | `AdminNewsletterSubscribersInboxClient` | **ACTIVE** |
| Filter (status, language, source) | same | **ACTIVE** |
| Active / archived folders | same | **ACTIVE** |
| Export full CSV | `/api/admin/leads/newsletter/export` | **ACTIVE** (capped at 10k rows) |
| Export emails CSV | `/api/admin/leads/newsletter/emails-export` | **ACTIVE** (subscribed only) |
| Copy visible subscribed emails | inbox UI | **ACTIVE** |
| View detail drawer | `AdminNewsletterSubscriberDetailDrawer` | **ACTIVE** |
| Reply via mailto | `buildNewsletterMailtoUrl` + row actions | **ACTIVE** (manual email client) |
| Copy reply / copy email | row actions + drawer | **ACTIVE** |
| Archive / restore / soft-delete | `PATCH /api/admin/leads/newsletter/[id]` | **ACTIVE** |
| Internal notes | drawer + PATCH | **ACTIVE** |
| Link to newsletter promo codes | inbox banner → `/admin/workspace/promo-codes?code_type=newsletter` | **ACTIVE** |

### Promo code admin connection

| Capability | Status |
|------------|--------|
| Filter by `code_type=newsletter` | **ACTIVE** |
| Search by email/code/customer | **ACTIVE** |
| Delivery status badge from `metadata.email_send_status` | **ACTIVE** (`sent`, `failed`, `not_configured`, `pending`, `not_sent`) |
| Promo family / source visible in metadata | **ACTIVE** |

---

## Current limitations (honest)

| Item | Status |
|------|--------|
| True bulk weekly newsletter campaign sender inside Leonix admin | **NOT BUILT** |
| Admin compose-and-send newsletter campaign | **NOT BUILT** |
| Server-side bulk send to subscriber list | **NOT BUILT** |
| Email event log (delivery/open/click/bounce) | **NOT BUILT** |
| Dedicated `email_events` table | **NOT BUILT** |
| Unsubscribe link in promo email | **NOT BUILT** |
| Double opt-in confirmation | **NOT BUILT** |
| Promo delivery status location | On promo-code `metadata` only (not a separate event log) |

**Manual workaround today:** Export emails CSV or copy visible emails → use external email platform or admin mail client for **manual newsletter operations** (weekly sends). Reply/Email in the inbox use **mailto** (opens the admin's local email client).

---

## Manual weekly newsletter workflow

1. Open **Admin → Leads → Newsletter** (`/admin/leads/newsletter`).
2. Filter by status (`subscribed`), preferred language, or source if needed.
3. **Export emails CSV** or **Copy visible emails** for the filtered list.
4. Use your external email platform (or mail client) to send the weekly newsletter.
5. Archive subscribers when appropriate; restore from Archived tab if needed.
6. Open **Admin → Workspace → Promo codes** (`?code_type=newsletter`) to inspect Launch 25 code delivery status (`email_send_status`).

---

## Future gates (not in scope)

- Newsletter campaign composer (subject/body/preview inside Leonix)
- Campaign audience selector (language, source, interests filters → send list)
- Resend batch / server-side bulk send with send logs
- Unsubscribe link + preference center
- Email event log table (sent/delivered/opened/clicked/bounced)
- Bounce/open/click tracking
- Double opt-in flow
- Subscriber preference center (topics, frequency)

---

## Related docs

- `docs/newsletter-promo-code-readiness.md` — Launch 25 promo code generation + checkout redemption
- `docs/promo-code-lifecycle-model.md` — promo code lifecycle doctrine
- `docs/pricing-promo-code-sales-model.md` — sales/pricing promo model
- `docs/leonix-admin-command-center-master-audit.md` — admin command center overview

---

## Verifier

```bash
npm run verify:newsletter-operations-readiness
```
