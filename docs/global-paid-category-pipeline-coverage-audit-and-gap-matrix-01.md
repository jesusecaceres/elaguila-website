# GLOBAL-PAID-CATEGORY-PIPELINE-COVERAGE-AUDIT-AND-GAP-MATRIX-01

**Mode:** Battlefield Architecture Build / read-only-first global pipeline coverage audit + gap matrix.
**Task classification:** BATTLEFIELD ARCHITECTURE BUILD (crosses global monetization, category pipelines, checkpoints, Stripe/Revenue OS, dashboards, preview/public output).
**Runtime changes:** NONE. Docs + verifier + package script only.

---

## 0. Why this gate exists

Leonix has proven patterns (Restaurantes base + coupon add-on, Servicios golden loop, Bienes global inventory stack + Revenue OS inventory pack fulfillment, global dashboard CTA/edit/preview safety). Each category has **multiple internal pipelines/lanes**, and monetization/add-ons/checkpoints must apply to every supported lane — not just the first obvious flow. This gate produces the master repo-grounded coverage map so we stop missing internal lanes.

**Status legend:**

- **REAL** — source proof of working end-to-end path (checkout + entitlement + persistence + public where applicable).
- **PARTIAL** — some layers proven, others missing/blocked.
- **UI-ONLY** — UI/product logic exists but no Stripe/entitlement truth wired.
- **MISSING** — no meaningful implementation.
- **BLOCKED** — intentionally gated off (honest block) pending a dedicated gate.

---

## 1. Category / Pipeline Inventory Map (Gap Matrix)

Columns: paid model | base key | base price | add-on key | add-on price | entry checkpoint | Ver más | final checkout checkpoint | rules popup | newsletter opt-in | promo field | promo server-validated | dashboard edit direct app | dashboard edit hydration | preview/back loop | Stripe wired | webhook/entitlement | add-on/inventory unlock truth | media persistence | public render | dashboard CTA standard | **status** | evidence | next gate.

Legend for cells: ✓ = proven, ~ = partial, ✗ = missing/none, n/a = not applicable.

### 1.1 Restaurantes — established restaurant lane
- paid/free/mixed: **paid** · base key `restaurantes_base_monthly` ($399/mo) · add-on key `restaurantes_offers_addon` ($99/mo)
- entry checkpoint ✓ · Ver más ✓ · final checkout checkpoint ✓ · rules popup ✓ · newsletter opt-in ~ (deferred) · promo field ~ (Apply partial) · promo server-validated ✓ (`/api/revenue-os/checkout`)
- dashboard edit direct app ✓ · edit hydration ✓ · preview/back loop ✓ (public-detail bound after preview-safety-01) · Stripe wired ✓ · webhook/entitlement ✓ · add-on unlock truth ✓ (`couponUpgradeEnabled` by webhook) · media persistence ✓ · public render ✓ · dashboard CTA standard ✓
- **status: REAL**
- evidence: `docs/restaurantes-p0f-dashboard-edit-coupon-route-image-persistence.md`, `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts`, `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`, `app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts`, `docs/revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.md` (preview fix)
- next gate: newsletter/promo capture (Gate blueprint §6)

### 1.2 Restaurantes — truck / mobile / popup / local food lane
- Same application + monetization as 1.1; establishment/food type handled inside one Restaurante application (no separate pipeline/checkout).
- evidence: `app/(site)/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows.ts`, `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts`, `app/(site)/clasificados/comida-local/page.tsx`
- **status: REAL** (shares 1.1 rails) · next gate: same as 1.1

### 1.3 Servicios — professional / white-collar lane
- paid · base `servicios_base_monthly` ($399/mo) · add-on `servicios_offers_addon` ($99/mo)
- entry checkpoint ✓ (`ServiciosCheckpointClient.tsx`) · Ver más ✓ · final checkout ✓ · rules popup ✓ · newsletter ~ · promo ~/✓ server-validated
- dashboard edit direct app ✓ · hydration ✓ · preview/back loop ✓ (`serviciosBackToEditHrefFromPreview`) · Stripe ✓ · webhook/entitlement ✓ · add-on unlock truth ✓ · media persistence ✓ · public render ✓ · CTA standard ✓
- **status: REAL**
- evidence: `docs/servicios-restaurantes-golden-loop-parity-01.md`, `docs/servicios-p0b-...md`, `docs/servicios-p0c-...md`, `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts`, `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- next gate: newsletter/promo capture

### 1.4 Servicios — blue-collar / trades lane
- Same application + monetization as 1.3; professional vs trades handled by template routing inside one application.
- evidence: `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts`, `app/(site)/clasificados/servicios/lib/serviciosTemplateRouting.ts`, `app/(site)/clasificados/servicios/lib/serviciosInternalGroupDisplay.ts`
- **status: REAL** (shares 1.3 rails) · next gate: same as 1.3

### 1.5 Bienes Raíces — private (FSBO) listing lane
- paid · base `br_fsbo_45d` ($49.99/45d) · add-on **none**
- entry checkpoint ~ · final checkout checkpoint ✓ (shared) · Stripe ✓ (matrix `stripeEligible`) · webhook/entitlement ✓ (generic) · dashboard edit ~ · preview/back ~ · media persistence ✓ · public render ✓
- **status: PARTIAL** (price still owner-unlocked per `REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[1]`)
- evidence: `app/lib/listingPlans/revenuePricingMatrix.ts` (`br_fsbo_45d`), `docs/bienes-inventory-golden-stack-parity-01.md`
- next gate: FSBO price lock + checkpoint parity

### 1.6 Bienes Raíces — business / agent parent lane
- paid · base `br_agent_monthly` ($399/mo) · add-on `br_inventory_pack_monthly` ($99/mo)
- entry checkpoint ✓ · final checkout ✓ · rules ✓ · dashboard edit direct app ✓ · hydration ✓ · preview/back loop ✓ · Stripe ✓ · webhook/entitlement ✓ · CTA standard ✓
- **status: REAL**
- evidence: `docs/revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.md`, `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx`, `app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx`
- next gate: newsletter/promo capture

### 1.7 Bienes Raíces — child property inventory lane
- add-on-unlocked child inventory (max 4) under agent parent · add-on key `br_inventory_pack_monthly` ($99/mo)
- add-on/inventory unlock truth ✓ (`listing_package_entitlements`, `fetchBienesInventoryPackEntitlementActive`) · media persistence ✓ · public child render ✓ (`fetchBrRelatedInventoryListingsForDetail`) · dashboard edit hydration ✓
- **status: REAL**
- evidence: `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts`, `docs/revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.md`
- next gate: none (recently landed) — regression watch only

### 1.8 Autos — privado lane
- paid · base `autos_privado_30d` ($24.99/30d) · add-on **none** (more cars = new ad)
- Stripe wired ✓ via **native autos Stripe** (`/api/clasificados/autos/checkout/verify`, `stripeAutosConfig`) AND partial Revenue OS (`startRevenueCategoryCheckout` in `AutosPublishConfirmCore.tsx`) · entitlement ✓ (native activation) · media persistence ✓ · public render ✓
- entry checkpoint ~ · final checkpoint ~ (native confirm, not shared `PublishCheckoutCheckpoint`) · dashboard edit ~
- **status: PARTIAL** (dual payment system: native + Revenue OS; not on shared checkpoint standard)
- evidence: `app/api/clasificados/autos/checkout/verify/route.ts`, `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`, `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- next gate: Autos checkpoint standardization (align to shared checkpoint / Revenue OS)

### 1.9 Autos — dealer / business parent lane
- paid · base `autos_dealer_monthly` ($399/mo, 10 active vehicles) · add-on **+10 vehicles (price TBD)**
- Stripe wired ~ (base via native/Revenue OS) · dealer limit enforced ✓ (10 active) · child inventory UI ✓ · public dealer route ✓ (`/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]`)
- **status: PARTIAL** (base payment exists; add-on price unresolved `REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[0]`)
- evidence: `app/api/clasificados/autos/checkout/verify/route.ts` (10 limit), `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx`, `app/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]/route.ts`
- next gate: Autos dealer inventory add-on Stripe/entitlement gate

### 1.10 Autos — child vehicle inventory lane
- add-on-unlocked child vehicles under dealer parent · add-on key **missing in matrix** (`+10 vehicles add-on (price TBD)`)
- child inventory UI ✓ (`AutosNegociosChildInventoryPreviewOverlay`, `AutosInventoryChildSteppedShell`) · add-on checkout **UI-only** (`autosInventoryBoostCheckoutSoonMessage`, `autosInventoryBoostNoPaymentNote`) · public child render ✓ · entitlement truth ✗
- **status: UI-ONLY / BLOCKED** (inventory boost panel says checkout coming soon; no add-on package key, no entitlement)
- evidence: `app/lib/clasificados/autos/autosInventoryBoostPipeline.ts`, `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx`, `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx`
- next gate: **Autos dealer inventory add-on parity** (mirror Bienes inventory pack) — highest add-on gap

### 1.11 Ofertas Locales — supermarket / flyer lane
- intended paid · base key **missing in `revenuePricingMatrix.ts`** · add-on intent = AI Searchable Specials
- product taxonomy ✓ · flyer PDF/scan pipeline ✓ · preview ✓ · owner route ✓ · table `ofertas_locales` ✓ · Stripe/package key ✗ · entitlement ✗
- **status: UI-ONLY** (rich product logic; no Revenue OS monetization wired)
- evidence: `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`, `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts`, `app/api/ofertas-locales/owner/[id]/route.ts`, `supabase/migrations/20260605120000_ofertas_locales.sql`
- next gate: Ofertas Locales monetization + specials add-on gate

### 1.12 Ofertas Locales — coupon / promo lane
- intended paid/add-on · coupon/promo offer type in `ofertas_locales.offer_type` · Stripe/package key ✗
- coupon/promo product logic ✓ · public search ✓ (`OfertasLocalesPublicSearchClient.tsx`) · monetization ✗
- **status: UI-ONLY**
- evidence: `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`, `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts`
- next gate: same as 1.11

### 1.13 Ofertas Locales — AI searchable specials lane
- AI scan/normalize/review pipeline ✓ (Gemini) · review/approval gating ✓ (`status = approved`) · public only after approval ✓ · Stripe add-on ✗
- **status: UI-ONLY** (AI + review + public gating exist; add-on checkout not wired)
- evidence: `app/lib/ofertas-locales/ofertasLocalesGeminiNormalizer.ts`, `app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts`, `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts`, `scripts/ofertas-locales-stack-d-public-item-search-audit.ts`
- next gate: same as 1.11 (specials is the monetizable add-on)

### 1.14 Clases — free class lane
- free · key `clases_free` · Stripe n/a
- **status: PARTIAL** (matrix key exists; free checkpoint not migrated to shared standard)
- evidence: `app/lib/listingPlans/revenuePricingMatrix.ts` (`clases_free`), `app/lib/listingPlans/categoryListingMonetization.ts`
- next gate: Clases free/paid mixed checkpoint

### 1.15 Clases — paid class lane
- paid · key `clases_paid_30d` ($24.99/30d) · Stripe eligible ✓ in matrix · **no `CLASES_*_CHECKOUT` payload constant** in `revenueCategoryCheckoutPayload.ts` · no dashboard add-on
- **status: PARTIAL / BLOCKED** (pricing key defined; checkout payload + conditional free/paid checkpoint not wired)
- evidence: `app/lib/listingPlans/revenuePricingMatrix.ts` (`clases_paid_30d`), absence in `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`
- next gate: Clases free/paid mixed checkpoint (conditional Stripe when organizer charges)

### 1.16 Empleos — paid job lane
- paid · key `empleos_job_post_paid` ($24.99/30d) · job fair `empleos_job_fair_free` (free) · add-on **none** (more jobs = new ad)
- Stripe eligible ✓ · checkout payload ✓ (`EMPLEOS_PAID_JOB_CHECKOUT`) · placement tier ✓ · dashboard empleos manage ✓
- **status: PARTIAL** (checkout payload wired; shared checkpoint parity + full golden loop not confirmed REAL)
- evidence: `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts` (`EMPLEOS_PAID_JOB_CHECKOUT`), `revenuePricingMatrix.ts` (empleos rows)
- next gate: Empleos checkpoint/golden-loop parity

### 1.17 Viajes — paid / affiliate lane
- mixed · key `viajes_business_monthly` ($399/mo) + `viajes_affiliate` (commission, non-Stripe)
- **status: PARTIAL / BLUEPRINT** (matrix keys exist; affiliate model separate; no checkout payload/checkpoint)
- evidence: `revenuePricingMatrix.ts` (viajes rows), `REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[5]`
- next gate: Viajes paid business + affiliate separation gate

### 1.18 Rentas — paid listing lane
- paid · key `rentas_30d` ($24.99/30d) · add-on **none** · checkout payload ✓ (`RENTAS_CATEGORY_CHECKOUT`)
- **status: PARTIAL** (payload wired; shared checkpoint + golden loop parity not confirmed REAL)
- evidence: `revenueCategoryCheckoutPayload.ts` (`RENTAS_CATEGORY_CHECKOUT`), `revenuePricingMatrix.ts` (`rentas_30d`)
- next gate: Rentas checkpoint/golden-loop parity

### 1.19 En Venta / Varios — free/pro lane
- free V1 · key `en_venta_free_v1` · legacy Pro fields documented but inactive
- **status: REAL (free V1)** — no monetization in V1 by owner doctrine
- evidence: `revenuePricingMatrix.ts` (`en_venta_free_v1`), `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- next gate: free checkpoint parity (low priority)

### 1.20 Comunidad / Eventos — free lane
- free · key `comunidad_free` · **status: REAL (free)** · evidence: `revenuePricingMatrix.ts` (`comunidad_free`) · next gate: free checkpoint parity (low)

### 1.21 Mascotas / Perdidos — free lane
- free · key `mascotas_free` · **status: REAL (free)** · evidence: `revenuePricingMatrix.ts` (`mascotas_free`) · next gate: free checkpoint parity (low)

### 1.22 Busco / Se busca — free lane
- free · key `busco_free` · **status: REAL (free)** · evidence: `revenuePricingMatrix.ts` (`busco_free`) · next gate: free checkpoint parity (low)

---

## 2. Checkpoint Coverage Matrix

Entry checkpoint (before application) · Ver más modal · add-on checkpoint · final confirmation checkpoint · pre-publish checkboxes · Leonix rules popup · newsletter opt-in · promo code field · one-promo-at-a-time doctrine.

| Category / lane | Entry checkpoint | Ver más | Add-on checkpoint | Final confirm checkpoint | Rules popup | Newsletter opt-in | Promo field | One-promo doctrine | Status |
|-----------------|:---------------:|:-------:|:-----------------:|:------------------------:|:-----------:|:-----------------:|:-----------:|:------------------:|--------|
| Restaurantes (all lanes) | ✓ | ✓ | ✓ (offers) | ✓ | ✓ | ~ deferred | ~ Apply partial | ✓ documented | REAL |
| Servicios (pro + trades) | ✓ | ✓ | ✓ (offers) | ✓ | ✓ | ~ deferred | ~ Apply partial | ✓ | REAL |
| Bienes negocio + inventory | ✓ | ✓ | ✓ (inventory pack) | ✓ | ✓ | ~ | ~ | ✓ | REAL |
| Bienes FSBO | ~ | ~ | n/a | ✓ shared | ✓ | ~ | ~ | ✓ | PARTIAL |
| Autos privado | ~ | ~ | n/a | ~ native confirm | ~ | ✗ | ~ | ✓ | PARTIAL |
| Autos dealer + inventory | ~ | ~ | ✗ (boost UI-only) | ~ native confirm | ~ | ✗ | ~ | ✓ | PARTIAL |
| Ofertas Locales (flyer/coupon/AI) | ~ product intro | ~ | ✗ | ✗ (no paid checkpoint) | ~ | ✗ | ✗ | ✓ | UI-ONLY |
| Clases free | ~ | ~ | n/a | ✗ | ~ | ✗ | n/a | ✓ | PARTIAL |
| Clases paid | ✗ conditional gate | ✗ | n/a | ✗ | ~ | ✗ | ~ | ✓ | BLOCKED |
| Empleos paid job | ~ | ~ | n/a | ~ | ~ | ✗ | ~ | ✓ | PARTIAL |
| Rentas | ~ | ~ | n/a | ~ | ~ | ✗ | ~ | ✓ | PARTIAL |
| Viajes | ✗ | ✗ | ✗ | ✗ | ~ | ✗ | ~ | ✓ | BLUEPRINT |
| Free (En Venta/Comunidad/Mascotas/Busco) | ~ | ~ | n/a | ~ free publish | ~ | ✗ | n/a | n/a | PARTIAL |

Shared checkpoint contract source: `app/lib/listingPlans/publishCheckoutCheckpoint.ts`, `PublishCheckoutCheckpoint.tsx`, `publishCheckoutCopy.ts`. Servicios entry checkpoint reference: `app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx`.

---

## 3. Add-on and Inventory Truth Matrix

| Add-on / inventory | Entitlement truth source | Add-on checkout | Media/persistence | Public render | Status |
|--------------------|--------------------------|-----------------|-------------------|---------------|--------|
| Restaurantes offers/coupons | `listing_json.couponUpgradeEnabled` set by webhook | ✓ `restaurantes_offers_addon` add-on-only | ✓ coupon image → remote URL (`buildRestaurantePublishPayload`) | ✓ Section G / shell coupons | REAL |
| Servicios offers/coupons (pro + trades) | webhook entitlement / offers flag | ✓ `servicios_offers_addon` add-on-only | ✓ offers media persistence (P0B) | ✓ `ServiciosCouponsCard.tsx` | REAL |
| Bienes property inventory pack | `listing_package_entitlements` (`br_inventory_pack_monthly`) via `fetchBienesInventoryPackEntitlementActive` | ✓ add-on-only, no base recharge | ✓ child media durable | ✓ child cards (`fetchBrRelatedInventoryListingsForDetail`) | REAL |
| Autos dealer vehicle inventory | ✗ none (no add-on key/entitlement) | ✗ UI-only "checkout soon" | ✓ child vehicle media | ✓ dealer public route | UI-ONLY / BLOCKED |
| Ofertas AI Searchable Specials | ✗ none (no package key); public gated by `status=approved` | ✗ not wired | ✓ scan/crop asset pipeline | ✓ approved items only | UI-ONLY |

**Truth rules confirmed:** entitlement flags set only after webhook (never client-faked); add-on-only dashboard checkout uses single package key + `listingId` + server owner validation; no base recharge from dashboard add-on (proven Restaurantes/Servicios/Bienes).

---

## 4. Dashboard CTA and Golden Loop Matrix

CTAs audited: Editar anuncio · Vista previa · Ver público · Ver en resultados · Administrar · Analíticas · Formulario · Editar ofertas/inventario.

| Category | Edit loads existing app | Preview identity | Volver a editar preserves identity | Add-on success returns to editor | Notes | Status |
|----------|:-----------------------:|------------------|:----------------------------------:|:--------------------------------:|-------|--------|
| Restaurantes | ✓ | **public-detail bound** (fixed in preview-safety-01; draft `/preview` retired for saved rows) | ✓ | ✓ (`Editar ofertas ahora`, `mode=coupon-edit`) | golden loop REAL | REAL |
| Servicios | ✓ | listing-bound (`preview=listing` + identity) | ✓ (`serviciosBackToEditHrefFromPreview`) | ✓ | golden loop REAL | REAL |
| Bienes negocio | ✓ | listing-bound (`bienesListingPreviewHref`) | ✓ (`bienesBackToEditHrefFromPreview`) | ✓ (`mode=inventory-edit`, `focus=inventory-pack`) | golden loop REAL | REAL |
| Autos dealer/privado | ~ | ~ (native editor return context) | ~ | ✗ (add-on not wired) | dual-system; not on shared golden loop | PARTIAL |
| Ofertas Locales | ~ owner manage route | ~ preview client | ~ | ✗ | monetization missing | PARTIAL/UI-ONLY |
| Empleos | ✓ manage (`/dashboard/empleos/[id]`) | lane preview href | ~ | n/a | manage-focused | PARTIAL |
| Rentas | ~ | ~ | ~ | n/a | needs parity | PARTIAL |

Evidence: `app/(site)/dashboard/lib/dashboardInventory.ts`, `app/(site)/dashboard/mis-anuncios/page.tsx`, `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts`, `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts`, `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts`.

**Confusing duplicate CTA risk identified:** legacy inactive outside "activate add-on" CTA on dashboard cards (Restaurantes P0G doctrine) — resolved for Restaurantes/Servicios/Bienes by inside-editor activation; Autos still uses separate boost panel (not add-on-only checkout).

---

## 5. Revenue OS Truth Matrix

| Category/lane | Base key | Add-on key | Checkout payload const | listingId passed | packageKey passed | Webhook fulfillment | Entitlement table | Fake-activation risk | Base-recharge risk |
|---------------|----------|-----------|------------------------|:----------------:|:-----------------:|:-------------------:|-------------------|----------------------|--------------------|
| Restaurantes | `restaurantes_base_monthly` | `restaurantes_offers_addon` | `RESTAURANTES_BASE_CHECKOUT`, `RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT` | ✓ | ✓ | ✓ | `listing_package_entitlements` + JSON flag | none (webhook only) | none (add-on-only) |
| Servicios | `servicios_base_monthly` | `servicios_offers_addon` | `SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT` | ✓ | ✓ | ✓ | entitlements | none | none |
| Bienes negocio | `br_agent_monthly` | `br_inventory_pack_monthly` | `BIENES_RAICES_NEGOCIO_CHECKOUT`, `BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT` | ✓ | ✓ | ✓ | entitlements | none | none |
| Bienes FSBO | `br_fsbo_45d` | none | ✗ (no dedicated const) | ~ | ~ | ✓ generic | entitlements | low | n/a |
| Autos privado | `autos_privado_30d` | none | `AUTOS_PRIVADO_CHECKOUT` + native | ✓ | ✓ | ~ native + revenue-os | native activation | low | n/a |
| Autos dealer | `autos_dealer_monthly` | +10 (TBD, no key) | ✗ | ~ | ~ | ~ | native | **medium (boost UI-only)** | n/a |
| Ofertas | ✗ no key | AI specials (no key) | ✗ | ✗ | ✗ | ✗ | ✗ | **UI-only, not paid** | n/a |
| Clases | `clases_paid_30d`/`clases_free` | none | ✗ | ✗ | ~ generic | ~ | ✗ payload | low | n/a |
| Empleos | `empleos_job_post_paid` | none | `EMPLEOS_PAID_JOB_CHECKOUT` | ✓ | ✓ | ~ | entitlements | low | n/a |
| Rentas | `rentas_30d` | none | `RENTAS_CATEGORY_CHECKOUT` | ✓ | ✓ | ~ | entitlements | low | n/a |
| Viajes | `viajes_business_monthly`/`viajes_affiliate` | none | ✗ | ✗ | ✗ | ✗ | ✗ | n/a | n/a |

Central rails: `POST /api/revenue-os/checkout` (`app/api/revenue-os/checkout/route.ts`), `revenueEntitlementFulfillment.ts` (`activateEntitlementsForPayment` → `listing_package_entitlements`), webhook `app/api/revenue-os/webhook/route.ts` (signature/raw body **not touched by this gate**).

**Fake-activation risks:** Autos dealer inventory boost panel (UI messaging only — must not set entitlement client-side); Ofertas specials (must gate public by `status=approved` + future entitlement). **Base-recharge risks:** none currently on add-on-only dashboard flows.

---

## 6. Newsletter + Promo Code Implementation Blueprint

**This gate documents only. No runtime newsletter/promo implemented.**

- **Newsletter opt-in** at final checkout checkpoint — optional checkbox, **must not block checkout or publish**.
- **Welcome promo code = 10%** generated/tracked by the Leonix promo system on opt-in.
- **One promo code per checkout** session (single-code doctrine).
- **Apply button required** — user explicitly applies; no auto-apply.
- **Server-side validation required** before Stripe; `POST /api/revenue-os/checkout` revalidates promo and amount.
- **Stripe amount must match UI** amount after discount (line items reconciled server-side).
- **Webhook redeems promo after successful payment** — never on Apply click.
- **Promo usage tied to business/listing/user** in Leonix promo OS with use-count tracking.
- **No fake subscription, no fake code generation** — do not claim subscribed or show a generated code until backend path is safe.

Safe existing rails (reference only): `/api/newsletter/subscribe`, `leonix_newsletter_subscribers`, `app/lib/email/newsletterPromoCodeEmail.ts`, `app/admin/_lib/promoCodeConstants.ts`, `app/lib/listingPlans/revenueCheckout.ts` (promo validation). Future gate: `PUBLISH-CHECKOUT-NEWSLETTER-PROMO-CAPTURE-01`.

---

## 7. Biggest gaps found (summary)

1. **Autos dealer child vehicle inventory add-on** — UI-only "checkout soon"; no add-on package key, no entitlement. Highest add-on parity gap.
2. **Ofertas Locales monetization** — rich AI/flyer/coupon product logic but zero Revenue OS package keys / checkout / entitlement.
3. **Clases free/paid conditional checkpoint** — matrix keys exist; no checkout payload; no free-vs-paid entry branch.
4. **Autos on separate native Stripe system** — not aligned to shared checkpoint / Revenue OS standard (dual system risk).
5. **Newsletter + 10% promo capture** — deferred everywhere; documented only.
6. **Empleos/Rentas** — payload wired but not confirmed on shared checkpoint golden loop.

---

## 8. TRUE/FALSE Audit

| Check | Result |
|-------|--------|
| git status checked | TRUE |
| diff checked | TRUE |
| staged diff checked | TRUE |
| branch checked (main) | TRUE |
| unrelated dirty files identified | TRUE (none) |
| unrelated dirty files left untouched | TRUE |
| all required rows included (22) | TRUE |
| all required columns included | TRUE |
| every row has a status label | TRUE |
| every REAL/PARTIAL claim has evidence path | TRUE |
| no unsupported completion claims made | TRUE |
| entry checkpoints audited | TRUE |
| Ver más audited | TRUE |
| add-on checkpoints audited | TRUE |
| final confirmations audited | TRUE |
| rules popup audited | TRUE |
| newsletter opt-in audited | TRUE |
| promo-code support audited | TRUE |
| Restaurante add-on audited | TRUE |
| Servicios add-on audited | TRUE |
| Bienes inventory audited | TRUE |
| Autos dealer inventory audited | TRUE |
| Ofertas specials audited | TRUE |
| every add-on says entitlement truth source | TRUE |
| every add-on says media/public truth status | TRUE |
| dashboard CTA labels audited | TRUE |
| edit route hydration audited | TRUE |
| preview route identity audited | TRUE |
| volver a editar audited | TRUE |
| success return CTA audited | TRUE |
| confusing duplicate CTAs identified | TRUE |
| base package keys audited | TRUE |
| add-on package keys audited | TRUE |
| listingId/payment identity audited | TRUE |
| webhook entitlement truth audited | TRUE |
| fake activation risks listed | TRUE |
| dashboard base recharge risks listed | TRUE |
| newsletter blueprint included | TRUE |
| promo 10% welcome idea included | TRUE |
| one-code-only rule included | TRUE |
| server validation rule included | TRUE |
| webhook redemption rule included | TRUE |
| no fake newsletter/promo rule included | TRUE |
| no runtime files changed | TRUE (docs/verifier/package only) |

---

## 9. Manual QA URLs (evidence anchors)

- Restaurantes: https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=restaurantes
- Servicios: https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios
- Bienes: https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=bienes-raices
- Autos dealer: https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=autos
- Ofertas Locales: https://leonixmedia.com/clasificados/ofertas-locales?lang=es

---

## 10. READY TO COMMIT

Documentation + verifier + package script only. See `docs/global-paid-category-pipeline-next-build-order-01.md` for ranked next gates. Verifier passed; `npm run build` passed; no runtime files changed.

READY TO COMMIT: YES
