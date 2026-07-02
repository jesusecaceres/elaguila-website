# ADMIN-DASHBOARD-PROMO-CODE-GENERATOR-TOP-CTA-01

## 1. Executive Summary

Adds a prominent **Promo Code Generator** call-to-action near the top of the Leonix Admin Command Center (`/admin`) so operators can reach the existing promo code manager quickly during Stripe/checkout QA. The Revenue Pulse monetization card link is unchanged.

## 2. Reason for change

The promo code manager at `/admin/workspace/promo-codes` is one of the most-used tools during checkout QA, but it was only linked from the lower Revenue Pulse / AdminMonetizationLinksCard section. Operators had to scroll to find it.

## 3. Files inspected

- `app/admin/_components/AdminCommandCenterDashboard.tsx`
- `app/admin/_components/AdminDashboardCta.tsx`
- `app/admin/_lib/adminDashboardRoutes.ts`
- `app/admin/(dashboard)/workspace/promo-codes/page.tsx`
- `app/admin/_components/AdminMonetizationLinksCard.tsx` (read-only; existing lower link preserved)
- `package.json`

## 4. Files changed

- `app/admin/_components/AdminCommandCenterDashboard.tsx` — top promo CTA strip after hero
- `app/admin/_lib/adminDashboardRoutes.ts` — canonical `promoCodes` route
- `docs/admin-dashboard-promo-code-generator-top-cta-01.md` — this document
- `scripts/verify-admin-dashboard-promo-code-generator-top-cta-01.mjs` — gate verifier
- `package.json` — verifier npm script

## 5. Route confirmed

- `/admin/workspace/promo-codes` exists
- Page includes **Create promo code** form (`createPromoCodeAction`, `#promo-code-create-form`)
- Canonical route: `ADMIN_DASHBOARD_ROUTES.promoCodes` → `/admin/workspace/promo-codes`

## 6. Placement decision

A dedicated card strip (`data-testid="admin-promo-code-generator-top-cta"`) is rendered **immediately after the hero** and **before** the purpose card and priority strip. This keeps the CTA in the first visible area on desktop without reordering other dashboard sections. Layout uses `flex-col` on mobile and `sm:flex-row` on wider screens with `min-w-0` / `w-full sm:w-auto` for overflow safety.

CTA uses existing `AdminDashboardCta` with `variant="premium"`.

## 7. What this gate does not touch

- Stripe checkout
- Stripe webhook
- Revenue OS fulfillment
- Restaurante / Servicios / Bienes Raíces category checkout flows
- Supabase migrations or schema
- `.env` files
- Promo code business logic or server actions
- AdminMonetizationLinksCard (lower Revenue Pulse promo link preserved)
- Dashboard data fetching

## 8. Manual QA checklist

- [ ] Open `/admin`
- [ ] Confirm **Promo Code Generator** is visible near the top (below hero, above purpose card)
- [ ] Click **Promo Code Generator**
- [ ] Confirm `/admin/workspace/promo-codes` opens
- [ ] Confirm **Create promo code** form is visible
- [ ] Scroll to Revenue Pulse — confirm existing promo-code link still exists in monetization card
- [ ] Resize to mobile (~390px) — confirm CTA strip does not overflow horizontally
