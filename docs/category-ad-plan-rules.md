# Category ad / listing plan rules

This document describes **how we label a single listing’s plan** (paid/free/private/business/affiliate) for Leonix / El Águila. It is **not** the user’s **account membership** (`profiles.membership_tier`). A seller can be on a free account while each ad follows its own category rules.

**Source of truth (code):** `app/lib/listingPlans/categoryAdPlans.ts` — `resolveCategoryAdPlan()`, `resolveCategoryAdPlanFromDashboardInventoryItem()`, `resolveCategoryAdPlanFromAdminAd()`.

**UI labels:** `listingPlanFieldLabel(lang)` → English **Listing plan**, Spanish **Plan del anuncio**. Footnote: `listingPlanFootnote(lang)`.

**Gate D boundary:** Dashboard shell / Navbar account badges must describe the user’s account or profile only. They must not display **Free**, **Gratis**, **Pro**, `business_lite`, or `business_premium` as global ad capability. Category/listing monetization belongs to listing rows and this resolver. En Venta **Free/Pro** is category-specific unless another category explicitly adds its own resolver rule.

Dashboard pages and Admin user rollups may keep `profiles.membership_tier` / `profiles.account_type` as editable profile metadata, but they must not convert those fields into a global “paid”, “Pro”, or ad-capability badge. Republish/refrescado, featured/destacado, verification, Stripe, and future promo-code behavior must stay listing/category-scoped.

---

## Product rules (by category)

| Category | Rules |
|----------|--------|
| **En venta** | `free` → Free / Gratis; `pro` → Pro (from `detail_pairs` / listing contract, not account tier). |
| **Restaurantes** | Always paid. If `package_tier` is missing or “free-like”, **do not** show “free” — default **Paid restaurant** / **Restaurante pagado**. If `package_tier` is a meaningful paid label, show it normalized after the paid-restaurant prefix. |
| **Bienes raíces** | Private/personal → **Paid private** / **Privado pagado**. Business/negocio → **Paid business** / **Negocio pagado** (Leonix branch in `detail_pairs` when present; else `seller_type`). |
| **Rentas** | Same private/business split as bienes; aligns with `parseLeonixListingContract` rentas branches. |
| **Clases** | Price > 0 (or tuition) → **Paid class** / **Clase pagada**; else **Free class** / **Clase gratis**. |
| **Comunidad** | Always **Free** / **Gratis**. |
| **Empleos** | Always **Paid job** / **Empleo pagado**. |
| **Autos** | Private lane / seller → **Paid private**; business lane / seller → **Paid business**. |
| **Servicios** | Always **Paid business** / **Negocio pagado**. |
| **Viajes** | Affiliate signals in row / `listing_json` / lane → **Affiliate** / **Afiliado**; else **Paid travel** / **Viaje pagado**. |
| **Unknown** | Do **not** substitute account plan. Fall back to row `plan` / `tier` only and set resolver `warning`. |

---

## Examples

- Restaurant row with `package_tier: null` or `free` → **Restaurante pagado** (never “Gratis” from that column alone).
- En venta row with pro visibility in `detail_pairs` → **Pro**.
- `listings.category = rentas`, Leonix contract branch `rentas_privado` → **Privado pagado**.
- Autos `lane = negocios` → **Negocio pagado**.
- Viajes row with partner `isAffiliate: true` in `listing_json` → **Afiliado**.

---

## Files that use the resolver (non-exhaustive)

- `app/lib/listingPlans/categoryAdPlans.ts` — definitions and resolvers.
- `app/(site)/dashboard/mis-anuncios/page.tsx` — inventory cards, En Venta card, Autos table card, generic listing fallback.
- `app/(site)/dashboard/restaurantes/page.tsx` — restaurant cards.
- `app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx` — BR / rentas Leonix listings.
- `app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx` — listing plan line for En Venta.
- `app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx` — optional listing plan for autos rows in the listings table.
- `app/(site)/dashboard/lib/dashboardInventory.ts` — passes `packageTier`, `sellerType`, `autosLane`, `viajesLane`, `planRaw`, etc. into inventory items.
- `app/admin/(dashboard)/usuarios/[id]/page.tsx` — per-ad **listing plan** in the ads command center (separate from **Membresía** in the account summary).
- `app/admin/_lib/adminUserAds.ts` / `app/admin/_lib/adminAdIdentity.ts` — metadata passed into `resolveCategoryAdPlanFromAdminAd`.

---

## Warning: account plan ≠ listing plan

**Never** use `profiles.membership_tier` (or dashboard shell “account plan”) as the label for a specific listing. Always run category context + row fields through `resolveCategoryAdPlan` (or the dashboard/admin helpers above).

`profiles.account_type` and `profiles.membership_tier` may remain editable account/profile metadata for Admin and profile-completeness flows. They are not the source of truth for category tools, republish eligibility, featured placement, verification, payment state, or future promo-code/Stripe activation.

---

## Manual smoke checklist

- [ ] Restaurant owned by a free-tier account still shows **Paid restaurant** / **Restaurante pagado** (not “Plan: free”).
- [ ] En venta free → Free / Gratis; pro → Pro.
- [ ] Rentas personal → Paid private; business → Paid business.
- [ ] Servicios → Paid business (never free from account).
- [ ] Empleo → Paid job.
- [ ] Comunidad → Free.
- [ ] Clases: free vs paid follows price/tuition.
- [ ] Viajes: paid vs affiliate from row / JSON hints.
- [ ] Admin user detail listing plan matches dashboard labels for the same row shape.
