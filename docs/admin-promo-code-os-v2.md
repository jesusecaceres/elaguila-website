# Promo Admin OS V2 — Filtered Code Management + Generator Guidance

Gate: **PROMO-ADMIN-OS-V2**

## Purpose

Upgrade the admin promo-code workspace into a cleaner operational dashboard for creating, filtering, auditing, and following up on promo codes — without changing promo business logic.

## Target URL

- https://www.leonixmedia.com/admin/workspace/promo-codes?code_type=newsletter
- https://www.leonixmedia.com/admin/workspace/promo-codes

## Brand system (local to promo workspace)

| Token | Use |
|-------|-----|
| Cream / ivory (`#FFFCF7`, `#FBF7EF`) | Page cards, form panels, filter chips (neutral) |
| Gold / bronze (`#C9B46A`, `#FBF3DC`) | Required badges, active filter chips, next-action highlights |
| Deep burgundy (`#7A1E2C`) | Needs-attention filters, risk/check-first fields, strong warnings |
| Charcoal (`#1E1810`) | Headings and labels |
| Deep green (emerald) | Active/safe status only |

Serif titles used sparingly for section headings (`Promo Admin OS`, `Recent codes`, preset directory).

## Generator guidance badges

| Badge | Meaning |
|-------|---------|
| **Required** | Must be set for a valid/safe create |
| **Optional** | Helpful but not always required |
| **Tracking only** | Audit/attribution — does not hard-block checkout |
| **Coming later** | Preset not launch-ready |
| **Check first** | Risk field — verify before filling (e.g. entitlement ID) |

## Preset directory

The quick-create preset selector includes a live **Preset directory** box showing for the selected preset:

- Purpose, best use, required fields, optional tracking fields
- Applies to / excludes
- Readiness status (active, draft, coming later)

Presets documented: Custom, Restaurante launch 25%, Restaurante QA 25%, Servicios launch 25% (coming later), Bienes Raíces negocio launch 25% (coming later), General launch 25%, Newsletter launch 25% (draft).

## Recent code filters (client-side on loaded data)

Near **Recent codes**:

- Search: code, email, customer, business, source
- Chips: All, Newsletter, Restaurantes, Servicios, Autos, Rentas, Active, Redeemed, Needs attention, Expired / revoked
- Counts reflect loaded rows only (no fake server counts)

## Code card sections

Each recent code card is organized into:

1. **Header** — code, purpose, status, delivery
2. **Assignment** — customer, email, phone, sales rep, source
3. **Scope** — category, package scope, discount, one-time/non-stackable
4. **Usage / payment** — redemption summary, payment links when available
5. **Next action** — operational recommendation
6. **Actions** — Copy code, Copy email, Copy follow-up, Revoke, View payment, View published ad

## Next-action guidance

Examples:

- Active + sent + unused → ready for eligible checkout
- Failed / not configured → manual follow-up recommended
- Redeemed → no resend needed
- Expired / revoked → do not promise code works
- Needs attention → review scope before advising customer

## Notes editing

Notes are **set at creation** in this gate. No safe post-create update API exists. Editable follow-up notes are documented as a **future admin gate**.

## What was intentionally not built

- No promo math / generation rule changes
- No promo validation or redemption changes
- No Stripe checkout or webhook changes
- No Servicios or category checkout changes
- No Supabase migration
- No bulk newsletter sender
- No fake placement / print / dealer eligibility claims

## Future gates

- Editable follow-up notes (needs scoped update API)
- Server-side advanced filters / pagination
- Bulk audit export
- Promo-code detail drawer
- Reseller / sales rep dashboards

## Related docs

- [Admin Promo Code Clarity](./admin-promo-code-clarity-01.md)
- [Newsletter Promo Code Readiness](./newsletter-promo-code-readiness.md)
- [Newsletter Sales Contact Ops](./newsletter-sales-contact-ops.md)

## Verification

```bash
npm run verify:admin-promo-code-os-v2
```

## Money-path QA

**PENDING** — this gate is admin UX only. No checkout/payment testing required here.

## Production QA recommendation

Lightweight admin visual QA on Vercel after deploy:

- Generator guidance visible (required/optional/tracking/coming later)
- Preset directory updates with selected preset
- Recent codes filter bar and search work on loaded data
- Copy code / email / follow-up buttons present
- Revoke and View payment / View published ad still work
- No bulk sender claim; no placement/print/dealer promises
