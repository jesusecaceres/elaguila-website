# Admin Workspace Smoke Test Documentation

This document provides a route-by-route analysis of website editing capabilities based on the truth matrix in `app/admin/_lib/websiteEditingTruthMatrix.ts`.

## Status Definitions

- **TRUE**: Fully editable from admin today with real forms, save actions, and working workflows
- **PARTIAL**: Some content is editable but template/layout still lives in code. Admin can edit specific fields but not the full page structure
- **MISSING**: No admin route exists yet. Requires development work to become editable
- **HONESTLY_DISABLED**: Intentionally disabled, requires code changes. Not editable from admin by design

## Gate A — Category operational queues vs live listings

- The **ad queue** (default; no `scope` query) lists the full operational surface for a category — moderation, drafts, suspended rows, and published rows when applicable.
- **Live / public listings** use the same admin routes with **`?scope=live`**, filtering to rows that are **publicly visible on the marketplace right now** (per-category rules in `classifiedsRepublishCapability` helpers — e.g. `listings`: `is_published` + `active`).
- `/admin/workspace/clasificados` (sidebar **Categories**), `/admin/categories` (**advanced registry** — dense table + `site_category_config` saves), and the dashboard category cards expose **both** “View queue” and “Live listings” so staff never confuse the public marketplace URL with the **admin operational** list.

### Gate B — Admin Categories UX (sidebar → clean hub)

- **Sidebar “Categories”** opens **`/admin/workspace/clasificados`** (same card grid as the Clasificados control center). The nav item stays highlighted on `/admin/categories` (advanced registry) via `activePathPrefixes`.
- **`/admin/categories`** remains for **Supabase-backed** posture: live/staged counts, pending/flagged, per-slug **save** (operational status, visibility, order, highlight, notes). The page now leads with **`ClasificadosCategoryHub`** (cards + CTAs); the former primary table is under **`#advanced-category-registry`** with a clear section title.
- **Deep link:** `ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF` in `app/admin/_lib/adminGlobalNav.ts` (`/admin/categories#advanced-category-registry`) from the hub chip, workspace footer chip, and category workspace pages when staff need the dense registry.
- **Queue and Live listings** unchanged on cards and advanced table.
- **Queue pages and live pages** both render **staff row actions** (`ClassifiedAdminRowActions` / vertical equivalents) where supported. **Restore** (unsuspend) is *not* **Republish** / Move to top; **Promote** and **Verify Leonix** are separate. Hard delete is not offered as a standard row action.

### Gate A2 — Visible row actions on `public.listings` queues (Rentas proof case)

- **Requirement:** Rows in **Rentas**, **Bienes Raíces**, **En Venta**, **Clases**, **Comunidad**, and shared **clasificados** listings tables (`AdminListingsTable`) must expose an **Actions** column that staff can **see without hunting horizontal scroll**. Do not assume actions exist only because `ClassifiedAdminRowActions` is mounted off-screen at the end of a wide table.
- **Implementation:** In `AdminListingsTable`, the **Actions** header and cells are placed **before** the wide **Leonix** and **En venta · vis.** columns; optional column header tooltip: `listings.actionsColumnEarlyHint`.
- **Standard:** **Autos**-style discoverability (visible operations on the row) is the bar for staff UX; vertical-specific tables should keep their existing actions column placement unless a similar overflow issue appears.
- **Automated guard:** `node scripts/verify-admin-listings-actions-column.mjs` (also `npm run verify:admin:listings-actions-column`) asserts thead order in source.
- **Manual browser smoke:** With staff session, open each route with rows present; confirm **Actions** header and controls like **Ver público / View public**, **Editar**, **Suspender**, **Archivar**, **Subir al inicio / Move to top**, **Republicar**, **Destacar**, **Verificar Leonix** appear **without** scrolling past the Leonix detail block:
  - `/admin/workspace/clasificados/rentas?scope=live`
  - `/admin/workspace/clasificados/rentas` (queue)
  - `/admin/workspace/clasificados/bienes-raices?scope=live`
  - `/admin/workspace/clasificados/en-venta?scope=live`
  - `/admin/workspace/clasificados/autos?scope=live`
  - `/admin/workspace/clasificados/servicios?scope=live`
  - `/admin/workspace/clasificados/restaurantes?scope=live`
  - `/admin/workspace/clasificados/empleos?scope=live`
  - `/admin/workspace/clasificados/travel?scope=live`
- **Clases / Comunidad:** Do not treat as client-ready; still verify staff actions are visible if pages are enabled for internal QA.

### Gate F — Admin read-only monetization metadata visibility

- Admin now shows compact read-only listing/category monetization metadata via `AdminListingMonetizationSummary`.
- The summary uses `resolveCategoryListingMonetization` and is visible on the shared `public.listings` Admin table plus safe dedicated vertical tables for Servicios, Restaurantes, Autos, Empleos, and Viajes.
- This is **not** pricing, Stripe, promo codes, checkout, public paid placement, or notification implementation. It does not add actions and does not activate monetization.
- Missing metadata is a gap, not an assumed Supabase table/column. If a row lacks fields such as `expires_at`, republish timestamps, promoted flags, or an explicit category plan, the Admin surface should show read-model warnings instead of crashing.
- Dashboard client display is a later gate.
- Manual Gate F browser smoke:
  - `/admin/workspace/clasificados`
  - `/admin/workspace/clasificados/rentas?scope=live`
  - `/admin/workspace/clasificados/bienes-raices?scope=live`
  - `/admin/workspace/clasificados/en-venta?scope=live`
  - `/admin/workspace/clasificados/servicios?scope=live`
  - `/admin/workspace/clasificados/restaurantes?scope=live`
  - `/admin/workspace/clasificados/autos?scope=live`
  - `/admin/workspace/clasificados/empleos?scope=live`
  - `/admin/workspace/clasificados/travel?scope=live`
  - Clases / Comunidad remain not client-ready; the summary should show unsupported/future states where rows exist.

## Route-by-Route Analysis

### ✅ TRUE - Fully Editable Areas

| Area | Admin Route | Real Editor | What Can Be Edited | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|--------------|----------------|
| Home (`/home`) | `/admin/workspace/home/content` | ✅ Form with save action | Hero text, CTAs, manual chips, all visible modules | `/home` | Use existing fields. New block types require schema field or block editor |
| Tienda — storefront | `/admin/workspace/tienda/storefront` | ✅ Form with save action | Storefront copy, hero images, featured items | `/tienda` | Use existing fields. New sections require development |
| Tienda — catalog/items | `/admin/tienda/catalog` | ✅ Full CRUD interface | All catalog items, pricing, images, descriptions | `/tienda/catalog` | Use catalog CRUD. New item types require schema changes |
| Global site settings | `/admin/site-settings` | ✅ Persisting form (`global_site`) | Banner texts, global toggles, strip content | Multiple pages | Use existing fields. New strip types require development |

### ⚠️ PARTIAL - Partially Editable Areas

| Area | Admin Route | What Exists | What Can Be Edited | What Still Requires Code | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|------------------|--------------|----------------|
| Clasificados — categories and operations | `/admin/workspace/clasificados` | Category editor, moderation queue, form field editors | Landing page templates, new category structures | `/clasificados` | Use category editor for form fields. New landing layouts need code |
| Restaurantes — public pages | `/admin/workspace/clasificados/category/restaurantes` | Category-specific copy, form field labels | Hub page layout, listing detail templates | `/clasificados/restaurantes` | Use category editor for form fields. New block types require development |
| Servicios — public pages | `/admin/workspace/clasificados/category/servicios` | Category copy, form field labels | Landing page layouts, listing templates | `/clasificados/servicios` | Use category editor for form fields. New layouts need development |
| Autos — public pages | `/admin/workspace/clasificados/category/autos` | Form field labels, moderation queue | Listing detail templates, search layouts | `/clasificados/autos` | Use category editor for form fields. New templates require development |
| Empleos — public pages | `/admin/workspace/clasificados/category/empleos` | Form field labels, moderation queue | Job listing templates, search layouts | `/clasificados/empleos` | Use category editor for form fields. New layouts need development |
| Header/main navigation | `/admin/site-settings` | Banner texts, toggle switches for strips | Navigation structure, new menu items | All pages (header) | Use global settings for banners. New nav items need code changes |
| SEO/metadata | `/admin/workspace/revista` | Individual page metadata, magazine issue data | Unified SEO panel, automated metadata generation | All pages (varied) | Edit metadata per section. Unified SEO needs development |

### ❌ MISSING - No Editor Yet

| Area | Admin Route | What's Missing | What Needs To Be Built | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|--------------|----------------|
| Legal/legal pages | None | Legal page editor, content management system | Various (legal pages) | Not editable from admin yet. Requires legal page editor development |

### 🚫 HONESTLY_DISABLED - Intentionally Disabled

| Area | Admin Route | Why Disabled | What Requires Code | Public Route | Add New Content |
|-------|-------------|-------------|-------------------|--------------|----------------|
| Footer (pie de página) | None | Footer content, layout, links | All pages (footer) | Not editable from admin. Requires code changes |

## Summary Statistics

- **TRUE areas**: 4 (Home, Tienda storefront, Tienda catalog, Global settings)
- **PARTIAL areas**: 6 (Clasificados categories, Restaurantes, Servicios, Autos, Empleos, Header, SEO)
- **MISSING areas**: 1 (Legal pages)
- **HONESTLY_DISABLED areas**: 1 (Footer)
- **Areas needing development**: 8 (all non-TRUE areas)

## Recommendations to Reach TRUE Status

### High Priority
1. **Unified page block editor** - This would address most PARTIAL areas by allowing reusable content blocks
2. **Legal page editor** - Simple CMS for static legal content
3. **Footer editor** - Make footer content manageable from admin

### Medium Priority
4. **Header/navigation editor** - Allow menu structure changes without code deployment
5. **Unified SEO panel** - Centralized metadata management with automated generation

### Low Priority
6. **Landing page templates** - Make category landing layouts editable
7. **Listing detail templates** - Standardize presentation across verticals

## How to Add Content - Current Patterns

### Structured Fields Only
- **Home, Tienda storefront**: Use existing form fields
- **Global settings**: Edit existing toggle switches and text fields
- **Category editors**: Modify form field labels and validation

### Repeatable Items/Cards
- **Tienda catalog**: Full CRUD for catalog items
- **Clasificados moderation**: Queue management for ads
- **Magazine issues**: Issue-based content management

### Code-Controlled Areas
- **Navigation structure**: Requires code changes for new menu items
- **Page layouts**: Templates live in code, need development for changes
- **Footer content**: Intentionally hardcoded, requires code changes
- **Legal pages**: No admin interface exists yet

## Validation Rules

The smoke test validates:
1. **Route existence**: All TRUE/PARTIAL rows must have working `ctaHref`
2. **Editor reality**: TRUE status must correspond to actual working edit/save workflows
3. **Guidance completeness**: Non-TRUE rows need `requiresCode` and `editableToday` fields
4. **Public route mapping**: Where applicable, public routes should be correctly identified

## Testing Checklist

For each area, verify:
- [ ] Admin route loads without errors
- [ ] Form saves data correctly (for TRUE areas)
- [ ] Public page reflects admin changes
- [ ] Validation works as expected
- [ ] Error handling is user-friendly
- [ ] Loading states are appropriate
- [ ] Mobile responsiveness works
- [ ] Accessibility features are functional

## Gate G1.6I-STACK — Global Stripe Payment Tracker Foundation

**Route:** `/admin/workspace/payment-tracker`

### Automated

- `npm run verify:stripe-payment-tracker-foundation`

### Manual smoke

1. Page shows **Payment Tracker / Seguimiento de Pagos** title and global payment tracker helper copy.
2. Page shows **does not collect payments yet / Stripe Checkout will create records later** warning.
3. Summary cards: pending, paid/succeeded, failed/canceled/refunded, commission eligible, est. paid total.
4. Payment records table: customer, package, promo, sales rep, status, amount, commission, source, Stripe IDs, paid date.
5. Filters: search text, status, sales rep, category, promo code.
6. Cross-links to Promo Codes, Package Entitlements, Sales Tracker.
7. Nav link added under workspace nav: "Payment tracker" / "Seguimiento pagos".
8. Dashboard cards: pending, paid, commission eligible with links to payment tracker.
9. Graceful handling when migration not applied (table unavailable state).
10. No Stripe Checkout session creation, no payment collection, no public route, no Servicios ranking.

**Migration:** `supabase/migrations/20260526120000_leonix_payment_records.sql`

**Docs:** `docs/stripe-payment-tracker-model.md`

---

## Gate G1.6H-STACK — Sales Rep Dashboard Foundation

**Route:** `/admin/workspace/sales-tracker`

### Automated

- `npm run verify:sales-rep-dashboard-foundation`

### Manual smoke

1. Page shows **Sales Tracker / Seguimiento de Ventas** title and commission preview-only helper copy.
2. Page shows **no payments are collected here / Stripe Checkout comes later** warning.
3. Summary cards: active codes, active entitlements, expiring soon, revoked/expired.
4. Estimated contract total card if metadata exists.
5. Commission eligible count / estimated commission (preview) if metadata exists.
6. Sales rep table grouped by `sales_rep_id` — click rep name to filter by that rep.
7. Filters: search text, sales rep ID, status, category, package tier, code type.
8. Recent activity table: code, source (promo/entitlement), customer, sales rep, package/category, status, end date, est. total.
9. Cross-links to Promo Codes and Package Entitlements.
10. Nav link added under workspace nav: "Sales tracker" / "Seguimiento ventas".
11. No Stripe Checkout, no payment processing, no public route, no Servicios ranking.

**Docs:** `docs/sales-rep-dashboard-model.md`

---

## Gate G1.6G-STACK — Entitlement Redemption / Attachment Model

**Helper:** `app/lib/listingPlans/entitlementRedemption.ts`

### Automated

- `npm run verify:entitlement-redemption-attachment`
- `npm run verify:admin-package-entitlement-generator`

### Manual smoke

1. Helper exports `normalizeRedemptionCode`, `resolvePromoCodeRedemptionState`, `resolveListingEntitlementAttachment`, `buildUserDashboardEntitlementSummary`, `canAttachCodeToListing`.
2. Admin attach listing on `/admin/workspace/package-entitlements` syncs `leonix_promo_codes.listing_id` when linked promo row exists.
3. User dashboard badges still load via `/api/dashboard/listing-package-entitlements`.
4. Full dashboard summary helper available for next gate wiring.
5. No public sorting, Stripe Checkout, or commission payout added.

**Docs:** `docs/entitlement-redemption-attachment-model.md`

---

## Gate G1.6F-STACK — Promo Code Lifecycle Manager

**Route:** `/admin/workspace/promo-codes`

### Automated

- `npm run verify:admin-promo-code-lifecycle`
- `npm run verify:admin-package-entitlement-generator` (linkage on entitlement create)

### Manual smoke

1. Page shows **not the public Cupones CMS** helper copy.
2. Create code with blank field → generated `LX-PROMO-…` row appears in list.
3. Search by code / business / sales rep; filter by category, type, status.
4. Preview shows non-stackable, one-time, owner approval, discount/entitlement capabilities.
5. **Revocar** sets revoked status (row remains).
6. Create package entitlement → matching promo row linked (or `promo_code_link_gap` in metadata if table missing).
7. Cupones CMS `/admin/workspace/cupones` unchanged.
8. No public redemption URL, no Stripe checkout UI.

**Docs:** `docs/promo-code-lifecycle-model.md`

---

## Gate G1.6E — Admin Pricing / Promo Generator Preview

**Route:** `/admin/workspace/package-entitlements`

### Automated

- `npm run verify:admin-pricing-promo-generator-ui`
- `npm run verify:pricing-promo-code-sales-model`

### Manual smoke

1. Select **Premium** + **12 month** + **sales_rep** promo → pricing preview shows ~20% discount and estimated contract total; promo shows sales rep required; commission preview says pending until payment clears.
2. Select **founding_partner** term → owner approval warning in preview.
3. Create with blank Listing ID → code created; tracker row shows pricing line (`12 month · $…/mo · ≈ $… total · promo: sales_rep`) and badges if applicable.
4. Confirm extend/revoke/attach still work on an existing row.
5. Dashboard `/admin` recent entitlements show pricing line when metadata exists (not crowded).
6. No Stripe UI, no public checkout, no Servicios sort change.

---

## Gate G1.6D — Pricing / Promo / Sales / Commission Model (foundation)

**No Admin route in this gate** — model and docs only.

### Automated

- `npm run verify:pricing-promo-code-sales-model`
- `npm run verify:package-entitlement-model`
- `npm run verify:print-to-digital-visibility-policy`

**Code:** `app/lib/listingPlans/packagePricingRules.ts` · **Docs:** `docs/pricing-promo-code-sales-model.md`

Confirm V1 base prices (premium $1999, full $1199, half $799, quarter $499, classified/digital $399), contract discounts (3/6/12 mo, founding partner 25%), non-stackable promos, commission only after payment clears. **Not in G1.6D:** Stripe, public redemption, pricing calculator UI (G1.6E).

---

## Gate G1.6C — Package Entitlement Tracker

**Route:** `/admin/workspace/package-entitlements`

### Manual smoke

1. Create pre-ad code (blank Listing ID) + sales rep ID/name → row shows **Pending listing**, sales rep, creator **Admin**.
2. **Buscar** by generated code (`q=LX-ENT-…`) → row appears.
3. Filter by category, tier, status **Pending listing**.
4. **Extender** fin → status/end updates; row remains.
5. **Adjuntar** listing ID on pending row → shows attached ID (no public sort change).
6. **Revocar** another row → soft revoke, still visible when filtering Revoked.
7. Dashboard `/admin` recent block still loads with unassigned rows.

---

## Gate G1.6B — Package Entitlement Generator (Print-to-Digital)

**Route:** `/admin/workspace/package-entitlements` (Workspace nav: Package entitlements / Paquetes). **Not** `/admin/workspace/cupones` (marketing coupon CMS).

### Automated

- `npm run verify:admin-package-entitlement-generator`

### Manual smoke (staff session)

1. Admin dashboard (`/admin`) — Tienda stat cards and “Recent Tienda orders” block are **not** the primary homepage focus; Package Entitlement cards and recent entitlements appear with links to the generator.
2. Open `/admin/workspace/package-entitlements` — desktop and mobile width; helper copy states this is **not** the public coupon CMS and does **not** charge customers.
3. Create **pre-ad** test: `servicios`, `servicios_public_listings`, **leave Listing ID blank**, start today, end +3 months → confirm `LX-ENT-…`, row shows **Pending listing** / unassigned copy.
4. Create **Premium** test (with listing): optional `listing_id`, same dates → Destacados benefit labels; no results priority by default.
5. Create **Full-page** — confirm results priority + republish + boost in benefits snapshot.
6. Create **Half-page** — classified + republish + boost; no results priority by default.
7. **Revoke** one row — status `revoked`, row remains in list.
8. Confirm `/admin/workspace/cupones` unchanged.
9. Confirm no Stripe/checkout UI and no change to public Servicios results order.

**Supabase:** apply `20260521130000_listing_package_entitlements_optional_listing_id.sql` if Listing ID blank submit fails (column still NOT NULL).

**Future payment:** Stripe Checkout (not Payment Links) with webhook-created entitlements; placeholders live in `metadata` json.

---

## Gate G2-SERVICIOS — Print-to-Digital Ranking Behind Existing Filters

### Automated

- `npm run verify:servicios-print-digital-ranking`

### Manual smoke

1. Open `/clasificados/servicios/resultados` — listings should render without errors.
2. Apply city, group, keyword, seller, and trust-signal filters — only matching listings appear (ranking does not inject unrelated rows).
3. If a listing has an active full-page package entitlement, it should sort above print-pool/digital/republish/organic within the same filter set.
4. Premium entitlement listings appear in the Destacados band — not forced into normal results.
5. Organic listings remain in fallback order (newest, verified bias, slug tie-break).
6. No Stripe/checkout/payment CTAs appear on the public results page.
7. No commission/payout/sales-rep metadata is exposed to the public page.
8. Other categories (Restaurantes, Autos, Bienes Raíces, Rentas, En Venta) remain unchanged.

---

## Gate G2A-SERVICIOS — Active Entitlement Overlay for Ranking

### Automated

- `npm run verify:servicios-entitlement-overlay`

### Manual smoke

1. Create a package entitlement in `/admin/workspace/package-entitlements` for category `servicios`, listing source `servicios_public_listings`, tier `full_page`, with a valid listing ID matching a published Servicios listing. Set dates to cover today.
2. Open `/clasificados/servicios/resultados` — the listing with the active full-page entitlement should sort above organic listings.
3. Create a `premium` entitlement for another listing — it should appear in the Destacados band, not forced into normal results.
4. Listings without active entitlements remain organic.
5. No sales rep, commission, payment, or admin metadata is visible in the public page source.
6. Apply filters (city, keyword, group) — ranking still runs after filtering and does not inject unrelated rows.
7. If the `listing_package_entitlements` table is unavailable, results still render (organic fallback).

---

## Next Steps

1. **Immediate**: Use existing TRUE editors for content updates
2. **Short-term**: Address HIGH priority recommendations
3. **Medium-term**: Implement unified page block editor
4. **Long-term**: Full page builder with drag/drop capabilities

---

*This document is maintained alongside the truth matrix and should be updated when editing capabilities change.*
