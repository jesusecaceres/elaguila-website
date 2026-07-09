# Admin Promo Code Clarity — Launch 25 / Newsletter Lookup

Gate: **ADMIN-PROMO-CODE-CLARITY-01**

## Purpose

Help Chuy, sales, and admin quickly find and understand newsletter / Launch 25 promo codes during launch operations while Chuy is away.

This gate is **admin clarity only**. It improves labels, filters, follow-up guidance, and cross-links. It does not change promo generation, validation, redemption, Stripe, or checkout behavior.

## Target URL

- https://www.leonixmedia.com/admin/workspace/promo-codes?code_type=newsletter

## What admin can verify

| Field | Where |
|-------|--------|
| Code | Row header (`code`) |
| Customer email | `Email` line |
| Customer name / business | `Customer` line |
| Source | `Source` line (`signup_source`, `capture_channel`, `source`, `source_page`, `source_cta`) |
| Delivery status | Badge + filter (`metadata.email_send_status`) |
| Code status | Badge (`active`, `redeemed`, `expired`, `revoked`, `draft`) |
| Usage / payment | `Usage` badge + usage panel (payment record, Stripe session when available) |
| Created / expires | `Created` and `Expires` lines |
| Follow-up guidance | `Follow-up` panel per code |

## Delivery status language

| Stored value | Admin label | Meaning |
|--------------|-------------|---------|
| `sent` | Sent | Promo email was sent. |
| `failed` | Failed | Email failed; use manual follow-up. |
| `pending` | Pending | Delivery pending or not finished. |
| `not_configured` | Email not configured | Email service not configured; manual follow-up. |
| `not_sent` | Not sent yet | Code exists; email not sent yet. |
| unknown/null | Unknown / not sent | Verify manually before promising the code. |

## Code status language

| Status | Meaning |
|--------|---------|
| Active | Code can be used if checkout is eligible. |
| Redeemed | Code has already been used. |
| Expired | Code is past expiration. |
| Revoked | Code was manually disabled. |
| Draft | Not ready for customer use. |

## Manual follow-up rules

1. Search by **code** or **email** on the promo-code page.
2. Check **delivery status** before promising the customer received the code.
3. If delivery is **failed**, **not configured**, or **unknown**, use manual outreach (mailto / Gmail BCC from newsletter inbox).
4. If code is **redeemed**, do not resend — verify payment/usage instead.
5. If code is **expired** or **revoked**, do not promise it works.
6. **Manual outreach only.** This page does not send bulk newsletters.

## Newsletter / sales workflow links

- Newsletter subscriber inbox: `/admin/leads/newsletter`
- Newsletter promo codes filter: `/admin/workspace/promo-codes?code_type=newsletter`
- Sales contact ops runbook: `docs/newsletter-sales-contact-ops.md`

## What is NOT built

- No bulk newsletter sender
- No auto campaign resend from this page
- No Stripe / payment logic changes
- No promo validation or discount math changes
- No promo redemption logic changes
- No Supabase schema changes

## Related gates

- `docs/newsletter-sales-contact-ops.md` — exports, BCC chunks, manual Gmail workflow
- `docs/newsletter-promo-code-readiness.md` — Launch 25 promo generation + delivery metadata
- `docs/checkout-newsletter-checkbox-capture-01.md` — paid checkout newsletter opt-in capture
- `docs/launch-25-opportunity-audit-01.md` — account-surface Launch 25 visibility

## Money-path QA status

**PENDING (intentional).** Launch 25 payment/redemption QA remains deferred while Chuy creates real ads.

## Related docs

- [Promo Admin OS V2](./admin-promo-code-os-v2.md) — generator guidance, preset directory, recent-code filters, upgraded cards

## Verifier

```bash
npm run verify:admin-promo-code-clarity
```
