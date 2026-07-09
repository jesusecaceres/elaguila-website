# Revenue OS Category Pipeline Matrix & Checkpoint Standard — 02

Gate: `REVENUE-OS-CATEGORY-PIPELINE-MATRIX-AND-CHECKPOINT-STANDARD-02`  
Date: 2026-07-07  
Scope: **Foundation documentation + verifier only.** No live category UX, Stripe pricing, checkout route, webhook, or migration changes in this gate.

---

## 1. Executive Summary

Standard **02** locks the repo-level **category/pipeline monetization matrix**, **two-checkpoint doctrine**, **promo/newsletter rules**, **dashboard existing-listing upgrade doctrine**, and **add-on persistence/media truth** so future category gates do not drift.

**Global rule:** Any paid or add-on category must prove **both**:

1. **Payment/Stripe truth** — new application flow, dashboard existing-listing flow, add-on-only checkout, webhook-backed entitlement, no base recharge from dashboard edit, no fake paid status.
2. **Persistence/output truth** — application data, add-on data, images/media, volver a editar hydration, dashboard edit hydration, save/update persistence, public page render; no localStorage-only fake success.

Standard 01 proved the shared **final preview checkout checkpoint** for Restaurantes and Bienes Raíces negocio. Standard 02 extends that foundation with the full category matrix and owner doctrine from current chats.

---

## 2. What Standard 01 Already Proved

| Item | Status | Evidence |
|------|--------|----------|
| Shared final checkpoint component | **Proven** | `PublishCheckoutCheckpoint.tsx`, `publishCheckoutCheckpoint.ts`, `publishCheckoutCopy.ts` |
| Preview vs final action split | **Proven** | Confirmations gate final publish/payment only; preview never blocked |
| Restaurantes proof migration | **Proven** | `RestaurantePreviewClient.tsx` → `restaurantes_base_monthly` via `startRevenueCategoryCheckout` |
| Bienes Raíces negocio proof migration | **Proven** | `AgenteIndividualResidencialPreviewClient.tsx` → `br_agent_monthly` |
| Central Revenue OS checkout | **Proven** | `POST /api/revenue-os/checkout`, `revenueCategoryCheckoutClient.ts` |
| Webhook-only activation | **Proven** | Success page lookup-only; webhook is activator |
| Account plan vs listing/ad plan separation | **Documented** | Standard 01 §12 |

**Post–Standard 01 follow-on gates (already landed in repo, not part of Standard 01 doc):**

- Restaurantes coupon add-on checkout (`restaurantes_offers_addon`) — bundled in new application + add-on-only dashboard
- Restaurantes P0F/P0G dashboard edit + post-payment return pattern
- Promo validation UI gate (`PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01`) — partial Apply wiring exists

---

## 3. What Standard 01 Deferred

| Deferred item | Standard 01 status | Standard 02 disposition |
|---------------|-------------------|-------------------------|
| Promo Apply UI | Deferred (“coming soon” honest message) | Document doctrine; Apply required in future gates |
| Newsletter opt-in persistence | Deferred (no fake subscribe) | Document + future gate `PUBLISH-CHECKOUT-NEWSLETTER-PROMO-CAPTURE-01` |
| Free category checkpoint migration | Future | Document per-category free flow |
| Bienes inventory pack Stripe line item | Blocked honestly (`REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED`) | Document as add-on category; unlock in dedicated gate |
| Remaining category migrations | Future map only | Full matrix locked in Standard 02 |
| Restaurantes offers add-on in new application | Was blocked in Standard 01 | Now supported (`REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = true`) |

---

## 4. Owner Doctrine From Current Chats

Chuy clarified category upgrade doctrine (2026-07):

| Category | Upgrade / add-on |
|----------|------------------|
| Restaurantes | Coupons/offers add-on (+$99/mo), all restaurant pipelines |
| Servicios | Coupons/offers add-on (+$99/mo), professional **and** blue-collar/trade pipelines |
| Bienes Raíces | Added property inventory pack (four additional properties — **confirm count before coding**) |
| Dealers de Autos | Added vehicle inventory pack |
| Ofertas Locales | AI Searchable Specials add-on (weekly flyer + coupon/promo lanes) |
| Viajes | Future-ready paid/affiliate structure |
| Clases | Free if class is free; paid class triggers Stripe (~$24.99/30d) |
| **No upgrades** | Varios/En Venta, Rentas, Empleos (more jobs = new ad), Autos privado, Comunidad/Eventos, Busco, Mascotas/Perdidos |

**Dashboard UX doctrine (Restaurantes P0G):** Inactive outside paid CTA on dashboard cards is confusing. Prefer **Editar [category] → module section → add-on activation → Stripe → return to editor → save → public render**.

---

## 5. Category/Pipeline Monetization Matrix

| # | Category | Internal pipeline(s) | Base monetization | Add-on / upgrade | Dashboard add-on upgrade | Status |
|---|----------|---------------------|-------------------|------------------|--------------------------|--------|
| 1 | **Restaurantes** | Established restaurant; mobile food vendor / taco truck / pop-up / local food | `restaurantes_base_monthly` $399/mo | `restaurantes_offers_addon` $99/mo — up to 4 offers/coupons, image/media required | Yes — add-on-only $99; inside Section G | **Proven** (P0F/P0G) |
| 2 | **Servicios** | Professional/white-collar; blue-collar/trades | `servicios_base_monthly` $399/mo | `servicios_offers_addon` $99/mo — offers/coupons/promos both pipelines | Yes — add-on-only | **Next migration candidate** |
| 3 | **Bienes Raíces** | Agent/business parent listing; child/additional property inventory | `br_agent_monthly` $399/mo | Inventory pack — **4 additional properties** (confirm package key/count before coding) | Yes — add-on-only inventory unlock | Partial — checkpoint migrated; inventory checkout blocked until add-on gate |
| 4 | **Autos privado** | Private car listing | `autos_privado_30d` ~$24.99 | **None** — more cars = new ad | Edit existing ad only | Future paid migration |
| 5 | **Dealers de Autos** | Dealer parent; child vehicle inventory | `autos_dealer_monthly` $399/mo | Added vehicle inventory pack | Yes — add-on-only inventory unlock | Partial Stripe foundation |
| 6 | **Rentas** | Rental listing (privado/negocio lanes) | `rentas_30d` ~$24.99 | **None** — more rentals = new ad | Edit existing ad only | Future paid migration |
| 7 | **Empleos** | Regular job post (`empleos_job_post_paid`); job fair (`empleos_job_fair_free`) | Job post paid ~$24.99; job fair **free** | **None** — more jobs = new ad | N/A | Partial wiring |
| 8 | **Ofertas Locales** | Weekly flyer / supermarket style; coupon/promo lane | Base product per lane | **AI Searchable Specials** add-on (+$199/mo intent in product docs) | Yes — AI add-on-only upgrade | Product logic exists; checkout not fully wired |
| 9 | **Viajes** | Paid travel business; affiliate/commission path | `viajes_business_monthly`; `viajes_affiliate` free/commission | Future offers — architecture must not block | Future-ready | Blueprint only |
| 10 | **Clases** | Free class; paid class | `clases_free`; `clases_paid_30d` ~$24.99/30d | **Not an add-on** — conditional paid gate when owner charges for class | N/A | Future mixed checkpoint |
| 11 | **Comunidad y Eventos** | Community/event post | `comunidad_free` | **None** | N/A | Future free checkpoint |
| 12 | **En Venta / Varios** | General classified listing | `en_venta_free_v1` (V1 free) | **None** per latest owner doctrine | N/A | Free V1 |
| 13 | **Busco / Se busca** | Wanted/request post | `busco_free` | **None** | N/A | Future free checkpoint |
| 14 | **Mascotas / Perdidos** | Lost & found / pets | `mascotas_free` | **None** | N/A | Future free checkpoint |

**Package keys reference:** `app/lib/listingPlans/revenuePricingMatrix.ts`

---

## 6. Upgrade/Add-On Categories

Categories that **require** both payment truth **and** persistence/output truth for add-ons:

1. **Restaurantes** — offers/coupons module (`restaurantes_offers_addon`)
2. **Servicios** — offers/coupons module (`servicios_offers_addon`)
3. **Bienes Raíces** — property inventory pack (child listings)
4. **Dealers de Autos** — vehicle inventory pack
5. **Ofertas Locales** — AI Searchable Specials

**Add-on persistence requirements (all upgrade categories):**

- Text fields (titles, codes, descriptions, links) persist in listing JSON / child rows
- Images/media upload → durable remote URLs before publish (not data URLs in public JSON)
- Dashboard edit hydrates add-on fields and media back into form
- Public detail/open-card renders from same stored fields
- Entitlement flag (e.g. `couponUpgradeEnabled`) set **only** after webhook fulfillment — never client-faked before payment

---

## 7. No-Upgrade Categories

Per owner doctrine — **no inventory or module add-ons**; additional listings require **new ads**:

| Category | Rule |
|----------|------|
| Autos privado | Paid per listing; more cars = new ad |
| Rentas | Paid per listing; more properties = new ad |
| Empleos | Paid job post; more jobs = new ad (job fair remains free) |
| En Venta / Varios | No upgrades in V1 |
| Comunidad y Eventos | Free |
| Busco / Se busca | Free |
| Mascotas / Perdidos | Free |

Dashboard for these categories: **Edit existing listing only** — no add-on-only checkout, no confusing outside activation CTA.

---

## 8. Two Checkpoint Types

Every applicable paid category needs **two checkpoint layers**:

### A. Category Entry Checkpoint (before application)

Shown before or at application start — package selection card:

- Package title, price, short description
- What they get / what is included / what is not included
- Available add-ons/upgrades (honest; may say “activate after publish”)
- CTA to start application
- **Ver más** drawer with full package details
- Same visual language as Servicios/Restaurantes card style (cream/burgundy/gold, mobile-first)

### B. Final Preview Checkout Checkpoint (before payment/publish)

Shared component: `PublishCheckoutCheckpoint`

- Plan summary with exact line items
- Selected add-ons and total
- Promo code field where supported (Apply required when enabled)
- Newsletter/update opt-in (optional, non-blocking)
- Category-specific required confirmation checkboxes
- Final paid CTA (**Continue to secure payment**) or free publish CTA (**Publish listing**)
- **Stripe amount must match UI amount**
- **Preview viewing is never blocked by checkboxes** — checkboxes only gate final publish/payment

---

## 9. Entry Checkpoint UX Contract

| Requirement | Rule |
|-------------|------|
| Mobile-first | Stack cleanly; 44px min touch targets |
| Ver más drawer | Full package details without leaving flow |
| Add-on honesty | Do not imply add-on is active before payment |
| Pipeline clarity | When category has multiple pipelines (Servicios pro/trade, Ofertas flyer/coupon), entry card must identify lane |
| Free vs paid | Clases: entry must branch free vs paid before application |

---

## 10. Final Preview Checkout Contract

| Requirement | Rule |
|-------------|------|
| Resolver | Pure `resolvePublishCheckoutCheckpoint()` — no mutations, no secrets |
| Line items | From `revenuePricingMatrix.ts` + honest add-on lines |
| Blocked state | Honest message when add-on checkout not yet supported (legacy Bienes inventory pattern) |
| Confirmations | Category-specific IDs in `publishCheckoutCheckpoint.ts` |
| Final button | Disabled until all required confirmations checked |
| Free publish | `mode: "free_publish"` — no Stripe session |

---

## 11. Promo Code Doctrine

**Promo codes are advertiser checkout discounts — separate from public coupons/offers.**

| Rule | Detail |
|------|--------|
| Separation | Public coupon/offer modules (Restaurantes Section G, Servicios offers) ≠ checkout promo |
| One per checkout | Single promo code per checkout session |
| Apply required | User must click Apply; server validates before Stripe |
| Server revalidation | `POST /api/revenue-os/checkout` revalidates promo |
| Stripe total match | UI total must match Stripe Checkout line items after discount |
| Webhook redemption | Redeem/track use **after** successful payment webhook — not on Apply |
| Admin tracking | Business, listing, package, use count tracked in Leonix promo OS |

**Future gate reference:** `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01` (partially landed)

---

## 12. Newsletter Opt-In + 10% Welcome Promo Future Gate

| Rule | Detail |
|------|--------|
| Placement | Optional checkbox in final preview checkpoint |
| Non-blocking | Must not block checkout or publish |
| Desired welcome promo | **10% promo code** generated/tracked by Leonix promo system on opt-in |
| No fake implementation | Do not claim subscribed or show generated code until backend is safe |
| Safe persistence path | `/api/newsletter/subscribe`, `leonix_newsletter_subscribers` exist but checkpoint capture deferred |

**Future gate:** `PUBLISH-CHECKOUT-NEWSLETTER-PROMO-CAPTURE-01`

This gate documents only — **does not implement** newsletter promo generation.

---

## 13. Dashboard Existing-Listing Upgrade Doctrine

**Model: Restaurantes P0G proven pattern**

| Step | Behavior |
|------|----------|
| Edit full listing | **Editar [category]** → `source=dashboard`, `mode=listing-edit`, `listingId`, `leonixAdId`, `returnPanel` |
| No duplicate listing | Hydrate from `listing_json`; preserve `draft_listing_id` |
| No base recharge | Dashboard edit never shows $399 base checkout again |
| Inactive add-on | Explain module inside edit form (Section G / equivalent); **Destacar ofertas +$99/mes** → add-on-only Stripe |
| No fake activation | Do not set entitlement flags before webhook |
| Avoid confusing outside CTA | Inactive dashboard card should not duplicate inside-form activation (P0G) |
| Active shortcut | **Editar ofertas** (or category equivalent) opens module editor directly |
| Post-payment return | Success CTA **Editar ofertas ahora** → `mode=coupon-edit`, `focus=coupon-upgrade` |
| Save | Publish/update API after media remote URL resolution |
| Public render | Add-on content + images visible on public listing |

**Category examples:**

- **Restaurantes:** Editar restaurante → Section G → Destacar ofertas → Stripe $99 → Editar ofertas → save → public images
- **Bienes Raíces:** Editar listing → inventory section → activate inventory pack → Stripe → manage child properties → public child cards
- **Dealers de Autos:** Editar dealer → inventory section → activate vehicle pack → Stripe → manage vehicles → public child cards
- **Ofertas Locales:** Manage offer → activate AI Searchable Specials → Stripe → scan/review → approved items public only

---

## 14. Add-On Persistence and Media Truth

**Required chain (proven Restaurantes):**

1. Form upload → draft field (e.g. `coupons[index].imageUrl`)
2. IndexedDB offload for large drafts (`restauranteDraftMedia.ts` pattern)
3. Before publish/save: `resolveRestauranteDraftMediaToRemoteUrls` → Blob upload
4. Publish payload includes remote URLs (`buildRestaurantePublishPayload`)
5. API stores in `listing_json` / child rows
6. Public mapper + shell component render same field
7. Dashboard hydrate restores URLs into form

**Forbidden:**

- localStorage-only success
- data URLs in public `listing_json` when production policy expects remote URLs
- Client-set paid/entitlement flags before payment

---

## 15. SQL/Status Lifecycle Rule

| State | Source of truth |
|-------|-----------------|
| `pending_payment` / checkout pending | Payment record + listing status from publish-with-`activation_mode: pending_payment` |
| `published` | Webhook fulfillment or free publish |
| Entitlement active | `listing_package_entitlements` / listing JSON flags set by webhook fulfillment |
| Add-on module unlocked | Webhook for add-on package key only — not client toggle |
| Ofertas AI items public | **Not public until reviewed/approved** — scan jobs → review → approved active items |

Republish/renew must not flip paid placement or entitlements from client alone.

---

## 16. Revenue OS / Stripe Rule

- All paid flows route through `POST /api/revenue-os/checkout` via `startRevenueCategoryCheckout`
- Package keys from `revenuePricingMatrix.ts` — **do not change pricing in doc gates**
- Add-on-only dashboard checkout: single package key (e.g. `restaurantes_offers_addon`), `listingId` required, owner validation server-side
- Success/cancel: `/revenue-os/pago/exito`, `/revenue-os/pago/cancelado` — lookup-only, sanitized `return_to`
- No Stripe secrets in client or docs

---

## 17. Webhook/Entitlement Rule

- `POST /api/revenue-os/webhook` — verified Stripe signature, raw body handling **unchanged by category doc gates**
- Webhook is **only** activator for paid status and entitlements
- Add-on fulfillment sets module flags in listing JSON (e.g. `couponUpgradeEnabled: true`) after payment
- Promo redemption recorded after successful payment — not on Apply click
- Idempotent replay safe

---

## 18. Public Rendering Rule

- Public pages read from persisted listing JSON / child tables — not draft localStorage
- Add-on sections hidden when entitlement false
- Images from stored remote URLs (or approved asset records for Ofertas AI)
- No “Sin foto aún” when image was saved but not uploaded to durable storage
- Sorting/ranking respects entitlement-backed placement — no client fake boost

---

## 19. Category-by-Category Next Gate Order

Recommended migration order (payment + persistence proof each):

1. **Servicios offers add-on** — mirror Restaurantes P0F/P0G (`servicios_offers_addon`)
2. **Bienes Raíces inventory pack add-on** — `STRIPE-REVENUE-OS-BIENES-INVENTORY-PACK-ADDON-01`
3. **Dealers de Autos inventory add-on** — dealer child vehicle pack checkout + persistence
4. **Ofertas Locales AI Searchable Specials** — add-on checkout + scan/review/public gating
5. **Clases free/paid mixed checkpoint** — conditional Stripe on paid class
6. **Rentas / Autos privado / Empleos** — paid checkpoint migration (no add-ons)
7. **Free categories** — Comunidad, Busco, Mascotas, En Venta free checkpoint
8. **Viajes** — paid business + affiliate separation
9. **Newsletter + 10% welcome promo** — `PUBLISH-CHECKOUT-NEWSLETTER-PROMO-CAPTURE-01`

---

## 20. Manual QA Master Checklist

### Payment truth (per upgrade category)

- [ ] New application shows correct base + optional add-on line items
- [ ] Stripe charges match UI total (with/without promo)
- [ ] Dashboard edit does not recharge base package
- [ ] Add-on-only dashboard checkout charges add-on price only
- [ ] Webhook activates entitlement; client does not fake paid state
- [ ] Post-payment success CTA opens module editor when `listingId` present

### Persistence/output truth (per upgrade category)

- [ ] Application form data survives refresh (draft storage)
- [ ] Add-on text fields save and reload on edit
- [ ] Add-on images upload → remote URL → public render
- [ ] Dashboard **Editar [category]** hydrates full listing
- [ ] Active **Editar ofertas** (or equivalent) hydrates module fields
- [ ] Public listing shows add-on content when entitled
- [ ] Public listing hides add-on when not entitled

### Checkpoint UX (per migrated category)

- [ ] Entry checkpoint shows package + Ver más drawer
- [ ] Preview viewable without checking boxes
- [ ] Final checkpoint blocks payment until confirmations checked
- [ ] Promo Apply validates server-side (when enabled)
- [ ] Newsletter opt-in does not block checkout

---

## 21. TRUE/FALSE Audit

| Check | Result |
|-------|--------|
| Standard 01 audited and referenced | TRUE |
| All 14 category rows in matrix | TRUE |
| Internal pipelines documented | TRUE |
| Upgrade vs no-upgrade separated | TRUE |
| Autos privado vs Dealers separated | TRUE |
| Empleos job post vs job fair separated | TRUE |
| Clases free/paid conditional documented | TRUE |
| Ofertas Locales flyer/coupon lanes documented | TRUE |
| Two checkpoint types documented | TRUE |
| Promo doctrine documented | TRUE |
| Newsletter 10% future gate documented | TRUE |
| Restaurante P0G dashboard doctrine documented | TRUE |
| Add-on persistence/media truth documented | TRUE |
| SQL/status lifecycle documented | TRUE |
| No runtime category files changed in this gate | TRUE (doc/verifier only) |

---

## 22. READY TO COMMIT Standard

This gate is **documentation + verifier only**. Safe to commit when:

- `docs/revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.md` exists with all headings
- `scripts/verify-revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.mjs` passes
- `npm run verify:publish-checkout-checkpoint-standard-01` still passes
- `npm run build` passes
- Git diff contains **only** allowed files (this doc, verifier, package.json script, optional Standard 01 append)

**READY TO COMMIT:** pending Gate 9 final checks.

---

## Appendix — Key Repo Files (Reference)

| Area | Files |
|------|-------|
| Checkpoint standard 01 | `docs/publish-checkout-checkpoint-standard-01.md` |
| Shared checkpoint | `publishCheckoutCheckpoint.ts`, `PublishCheckoutCheckpoint.tsx`, `publishCheckoutCopy.ts` |
| Pricing matrix | `revenuePricingMatrix.ts`, `categoryAdPlans.ts` |
| Checkout | `app/api/revenue-os/checkout/route.ts`, `revenueCategoryCheckoutClient.ts` |
| Webhook | `app/api/revenue-os/webhook/route.ts` |
| Success UI | `RevenueOsPagoResultView.tsx` |
| Restaurantes proof | `restaurantesDashboardCouponAddonCheckout.ts`, P0F/P0G docs |
| Promo blueprint | `docs/stripe-revenue-os-placement-pricing-promo-blueprint-01.md` |
