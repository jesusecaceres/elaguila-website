# Sales Rep Dashboard Model

**Gate G1.6H-STACK — owner/admin tracker foundation; no Stripe, payout, or public routes**

This document defines the **Sales Tracker** for owner/admin use and the future **limited sales rep dashboard**.

**Code:** `app/admin/_lib/salesTrackerData.ts`, `app/admin/(dashboard)/workspace/sales-tracker/page.tsx`

**Admin UI:** `/admin/workspace/sales-tracker`

**Related:** [`promo-code-lifecycle-model.md`](./promo-code-lifecycle-model.md), [`package-entitlement-model.md`](./package-entitlement-model.md), [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md), [`entitlement-redemption-attachment-model.md`](./entitlement-redemption-attachment-model.md)

---

## 1. Owner/admin sales tracker

`/admin/workspace/sales-tracker` provides a read-only dashboard that aggregates:

- All promo codes grouped by `sales_rep_id` / `sales_rep_name`
- All package entitlements grouped by `metadata.sales_rep_id` / `metadata.sales_rep_name`
- Active / expired / revoked / redeemed counts per sales rep
- Estimated contract total from `metadata.pricing.estimated_contract_total_cents`
- Commission preview from `metadata.commission_preview`
- Recent activity sorted by end date

Filters: search text, sales rep ID, status, category, package tier, code type.

---

## 2. Future limited sales rep dashboard

A dedicated sales rep dashboard will allow individual reps to see only their own codes/clients. This requires:

- Sales rep authentication/role system (not in this gate)
- Row-level filtering by `sales_rep_id` (helper already supports this via `?sales_rep_id=REP001`)
- RLS policies or API-level filter for sales rep identity

**This gate provides the data helper and admin-side UI. Sales rep self-service access is next.**

---

## 3. Sales rep attribution fields

Promo codes (`leonix_promo_codes`):
- `sales_rep_id` — direct column
- `sales_rep_name` — direct column

Package entitlements (`listing_package_entitlements`):
- `metadata.sales_rep_id` — stored in metadata JSONB
- `metadata.sales_rep_name` — stored in metadata JSONB

The tracker reads from both sources and groups by `sales_rep_id`.

---

## 4. Commission preview only

Commission estimates come from `metadata.commission_preview`:
- `commission_eligible: boolean`
- `estimated_commission_cents: number`

These are **informational previews only**. No payout is triggered.

---

## 5. Commission only after payment clears

Commission is **not payable** until:
1. Stripe Checkout integration is complete (later gate)
2. Customer payment is confirmed and cleared
3. Payout ledger exists (later gate)

The tracker shows preview amounts to help owner/admin plan, but no money changes hands through this system.

---

## 6. Explicitly later gates

| Capability | Gate |
|------------|------|
| Stripe Checkout / Payment Links | G1.6I+ |
| Commission payout ledger | After payment integration |
| Payroll processing | Not in Leonix scope |
| Public redemption | G1.6H+/G1.6I+ |
| Public ranking / Servicios sorting | Category visibility gates |
| Sales rep self-service login | After role system |

---

## 7. No public routes

The sales tracker is admin-only at `/admin/workspace/sales-tracker`. There are no public-facing sales rep pages, no customer-facing sales rep information, and no public API endpoints for sales data.

---

## 8. Verification

```bash
npm run verify:sales-rep-dashboard-foundation
```

Manual QA:
- https://www.leonixmedia.com/admin/workspace/sales-tracker
- https://www.leonixmedia.com/admin/workspace/promo-codes
- https://www.leonixmedia.com/admin/workspace/package-entitlements
