# Active Categories Revenue OS Checkpoint Activation Matrix — Gate 01

**Task:** `ACTIVE-CATEGORIES-REVENUE-OS-CHECKPOINT-ACTIVATION-MATRIX-01`  
**Scope:** Six active paid/mixed categories only — Servicios, Bienes Raíces, Autos (dealer + privado), Empleos, Rentas.  
**Locked out:** Ofertas Locales, Clases, En Venta/Varios, Comunidad, Busco, Mascotas/Perdidos, Admin redesign, Stripe webhook raw body.

## Executive Summary

This matrix records **source-level truth** for the Leonix Revenue OS checkout/checkpoint/dashboard package across the six active categories. **Servicios is the only category fully green end-to-end on the unified Revenue OS standard.** All other active categories have documented gaps — primarily missing Revenue OS webhook listing activation, incomplete final checkpoint parity, or split legacy/Revenue OS checkout paths.

**Proven package (reference):** entry checkpoint → application → preview → final checkout checkpoint → confirmations → newsletter/promo → hidden pending save → Revenue OS checkout → Stripe → webhook activation → entitlement truth → dashboard edit truth → public render.

## Shared Revenue OS Contract (Gates 2–6)

| Capability | Servicios | Bienes negocio | Autos dealer | Autos privado | Empleos paid | Empleos feria | Rentas privado |
|---|---|---|---|---|---|---|---|
| `publishCheckoutCheckpoint.ts` explicit branch | TRUE | TRUE | FALSE (generic fallback) | FALSE | FALSE | FALSE | FALSE |
| `CHECKPOINT_CONFIRMATIONS` constant | TRUE | TRUE | FALSE | FALSE | FALSE (modal copy) | FALSE (modal copy) | FALSE |
| `PublishCheckoutCheckpoint.tsx` on preview | TRUE | TRUE | FALSE | FALSE (confirm page) | FALSE (app modal) | FALSE (app modal) | FALSE (custom UI) |
| `POST /api/revenue-os/checkout` | TRUE | TRUE | add-on only | TRUE | TRUE | N/A (free) | TRUE |
| Newsletter opt-in | TRUE | partial¹ | TRUE | TRUE | TRUE | N/A | TRUE |
| Promo Apply | TRUE | partial¹ | TRUE | TRUE | TRUE | N/A | TRUE |
| Hidden pending save | TRUE | TRUE² | legacy path | partial³ | draft⁴ | N/A | TRUE² |
| Revenue OS webhook listing activation | TRUE | **FALSE** | legacy only⁵ | **FALSE** | **FALSE** | N/A | **FALSE** |
| Dashboard add-on-only checkout | TRUE | TRUE | TRUE | N/A | N/A | N/A | N/A |

¹ Bienes preview renders `PublishCheckoutCheckpoint` with promo/newsletter config but `onPublishLive` checkout handoff does not pass promo/add-on line items from checkpoint context.  
² Bienes/Rentas use `listings.status = "pending"` + `is_published = false`, not literal `pending_payment`.  
³ Autos privado saves `autos_classifieds_listings.status = draft` then calls Revenue OS without `setAutosListingPendingPayment`.  
⁴ Empleos paid saves `empleos_public_listings.lifecycle_status = draft` before checkout; schema has no `pending_payment`.  
⁵ Autos dealer **base** uses legacy `/api/clasificados/autos/checkout` + `/api/clasificados/autos/stripe/webhook`; inventory add-on uses Revenue OS entitlements.

## Category Activation Matrix

### 1. Servicios

| Field | Value |
|---|---|
| **Category** | Servicios |
| **Internal pipelines** | `professional` \| `trades` (single entry product `servicios_profesionales`; pipeline metadata on checkout) |
| **Paid/free/mixed** | Paid |
| **Base package key** | `servicios_base_monthly` |
| **Base price** | $399.00/mo (39900 cents) |
| **Add-on package key** | `servicios_offers_addon` |
| **Add-on price** | $99.00/mo (9900 cents) |
| **Upgrade allowed** | YES (dashboard add-on only) |
| **Entry checkpoint** | TRUE — `publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx` |
| **Ver más** | TRUE |
| **Final checkout checkpoint** | TRUE — `publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx` + `PublishCheckoutCheckpoint` |
| **Required checkboxes** | TRUE — `SERVICIOS_CHECKPOINT_CONFIRMATIONS` |
| **Newsletter** | TRUE |
| **Promo Apply** | TRUE |
| **Hidden pending save** | TRUE — `POST /api/clasificados/servicios/publish` → `listing_status = pending_payment` |
| **Listing table** | `servicios_public_listings` |
| **Hidden status value** | `pending_payment` |
| **DB constraint proof** | UNKNOWN — column comment lists `draft \| preview_ready \| publish_ready \| published \| paused_unpublished`; no CHECK migration for `pending_payment` |
| **Public query hides pending** | TRUE — `.ilike("listing_status", "published")` in `serviciosPublicListingsServer.ts` |
| **Webhook activation** | TRUE — `revenueServiciosFulfillment.ts` via `revenueFulfillment.ts` |
| **Dashboard edit route** | TRUE — `/publicar/servicios?edit=1` |
| **Dashboard add-on loophole protected** | TRUE — `serviciosDashboardOffersAddonCheckout.ts` (add-on-only, no base recharge) |
| **Media persistence** | TRUE |
| **Public render** | TRUE |
| **READY FOR QA** | **TRUE** |

**Key files:** `revenuePricingMatrix.ts`, `publishCheckoutCheckpoint.ts`, `saveServiciosPendingBeforeCheckout.ts`, `revenueServiciosFulfillment.ts`, `serviciosDashboardOffersAddonCheckout.ts`.

---

### 2. Bienes Raíces (negocio / agent — primary paid+inventory path)

| Field | Value |
|---|---|
| **Category** | Bienes Raíces |
| **Internal pipelines** | `privado` (FSBO `br_fsbo_45d`) \| `negocio` (agente/equipo/brokerage/desarrollador → `br_agent_monthly`) |
| **Paid/free/mixed** | Paid |
| **Base package key** | `br_agent_monthly` |
| **Base price** | $399.00/mo (39900 cents) |
| **Add-on package key** | `br_inventory_pack_monthly` |
| **Add-on price** | $99.00/mo (9900 cents) |
| **Upgrade allowed** | YES (dashboard inventory add-on only) |
| **Entry checkpoint** | TRUE — `publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx` |
| **Ver más** | TRUE |
| **Final checkout checkpoint** | TRUE (UI) — `negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx` |
| **Required checkboxes** | TRUE — `BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS` |
| **Newsletter** | partial — config enables; checkout handoff does not capture from checkpoint |
| **Promo Apply** | **FALSE** — no `onPromoApply`; checkout call omits `promoCode` and inventory `addOns` |
| **Hidden pending save** | TRUE — `leonixPublishRealEstateListingCore.ts` → `status = pending`, `is_published = false` |
| **Listing table** | `listings` (category `bienes-raices`) |
| **Hidden status value** | `pending` (+ `listing_json.payment_status = pending`) |
| **DB constraint proof** | UNKNOWN — `listings.status` comment: `active \| pending \| removed \| flagged`; no `pending_payment` CHECK |
| **Public query hides pending** | TRUE — `.eq("is_published", true)`, `.in("status", ["active", "sold"])` |
| **Webhook activation** | **FALSE** — `revenueFulfillment.ts` has no Bienes listing activation; legacy `leonix/stripe/webhook` only |
| **Dashboard edit route** | TRUE — `bienesDashboardInventoryAddonCheckout.ts` |
| **Dashboard add-on loophole protected** | TRUE — add-on-only `br_inventory_pack_monthly` |
| **Media persistence** | TRUE (child inventory paths exist; separate gates proved media) |
| **Public render** | TRUE for published rows |
| **READY FOR QA** | **FALSE** |

**Blockers:** (1) Revenue OS webhook does not flip pending `listings` → active/published after payment. (2) Initial checkout omits inventory pack `addOns` and promo from checkpoint. (3) Legacy BR Stripe webhook is not wired to Revenue OS checkout sessions used by preview.

---

### 3. Autos Dealers / Autos Negocios

| Field | Value |
|---|---|
| **Category** | Autos (dealer/negocio) |
| **Internal pipelines** | `negocios` dealer business lane |
| **Paid/free/mixed** | Paid |
| **Base package key** | `autos_dealer_monthly` |
| **Base price** | $399.00/mo (39900 cents) |
| **Add-on package key** | `autos_dealer_inventory_pack_monthly` |
| **Add-on price** | $129.00/mo (12900 cents) |
| **Upgrade allowed** | YES (dashboard inventory add-on only) |
| **Entry checkpoint** | TRUE — `publicar/autos/PublicarAutosBranchClient.tsx` |
| **Ver más** | TRUE |
| **Final checkout checkpoint** | partial — `AutosPublishConfirmCore.tsx` (custom confirm, not shared `PublishCheckoutCheckpoint`) |
| **Required checkboxes** | TRUE (confirm page copy) |
| **Newsletter** | TRUE (privado path; dealer uses legacy checkout POST) |
| **Promo Apply** | TRUE on privado confirm; dealer base via legacy checkout |
| **Hidden pending save** | TRUE (legacy) — `setAutosListingPendingPayment` via `/api/clasificados/autos/checkout` |
| **Listing table** | `autos_classifieds_listings` |
| **Hidden status value** | `pending_payment` |
| **DB constraint proof** | TRUE — CHECK includes `pending_payment` (`20260409120000_autos_classifieds_listings.sql`) |
| **Public query hides pending** | TRUE — active-only public surfaces |
| **Webhook activation** | partial — legacy `autos/stripe/webhook` + `tryActivateAutosListingAfterPayment` for **base**; Revenue OS webhook creates entitlements for **add-on only** |
| **Dashboard edit route** | TRUE — `autosDashboardInventoryAddonCheckout.ts` |
| **Dashboard add-on loophole protected** | TRUE — add-on-only; rejects `lane === "privado"` |
| **Media persistence** | TRUE |
| **Public render** | TRUE |
| **READY FOR QA** | **FALSE** (unified Revenue OS standard) / **partial TRUE** (legacy base path functional) |

**Blocker for unified standard:** Dealer base publish still uses legacy Autos checkout/webhook, not Revenue OS end-to-end. Inventory add-on entitlement path is Revenue OS-ready.

---

### 4. Autos Privado

| Field | Value |
|---|---|
| **Category** | Autos (privado) |
| **Internal pipelines** | `privado` private seller |
| **Paid/free/mixed** | Paid |
| **Base package key** | `autos_privado_30d` |
| **Base price** | $24.99 / 30 days (2499 cents) |
| **Add-on package key** | none (`addOnInventory: null`) |
| **Add-on price** | N/A |
| **Upgrade allowed** | **NO** |
| **Entry checkpoint** | TRUE — `categoryPublishCheckpoints.ts` + `publicar/autos/PublicarAutosBranchClient.tsx` |
| **Ver más** | TRUE |
| **Final checkout checkpoint** | partial — `AutosPublishConfirmCore.tsx` (promo/newsletter/checkboxes; not `PublishCheckoutCheckpoint`) |
| **Required checkboxes** | TRUE |
| **Newsletter** | TRUE |
| **Promo Apply** | TRUE |
| **Hidden pending save** | **partial** — listing persisted as `draft`; Revenue OS checkout does not call `setAutosListingPendingPayment` |
| **Listing table** | `autos_classifieds_listings` |
| **Hidden status value** | `draft` (should be `pending_payment` before activation) |
| **DB constraint proof** | TRUE — CHECK allows `draft` and `pending_payment` |
| **Public query hides pending** | TRUE |
| **Webhook activation** | **FALSE** — no Autos privado branch in `revenueFulfillment.ts`; Revenue OS payment does not call `tryActivateAutosListingAfterPayment` |
| **Dashboard edit route** | TRUE |
| **Dashboard add-on loophole protected** | N/A |
| **Media persistence** | TRUE |
| **Public render** | TRUE when active |
| **READY FOR QA** | **FALSE** |

**Blockers:** (1) Missing Revenue OS webhook → listing activation bridge. (2) Checkout skips `pending_payment` transition.

---

### 5. Empleos

| Field | Value |
|---|---|
| **Category** | Empleos |
| **Internal pipelines** | `quick` \| `premium` (paid) \| `feria` (free) |
| **Paid/free/mixed** | **Mixed** |
| **Base package key (paid)** | `empleos_job_post_paid` |
| **Base price (paid)** | $24.99 / 30 days (2499 cents) |
| **Free package key** | `empleos_job_fair_free` ($0, `stripeEligible: false`) |
| **Add-on** | none |
| **Upgrade allowed** | **NO** |
| **Entry checkpoint** | TRUE — `EmpleosPublicarHubClient.tsx` (paid + free cards) |
| **Ver más** | TRUE |
| **Final checkout checkpoint** | **partial** — paid uses `EmpleosPublishConfirmModal` from **application** (not preview); preview is view-only |
| **Required checkboxes** | TRUE (modal copy) |
| **Newsletter** | TRUE (paid modal) |
| **Promo Apply** | TRUE (paid modal) |
| **Hidden pending save (paid)** | partial — `mode: "draft"` via `/api/clasificados/empleos/listings` |
| **Listing table** | `empleos_public_listings` |
| **Hidden status value** | `draft` (no `pending_payment` in schema) |
| **DB constraint proof** | TRUE for allowed values; **no `pending_payment`** — `lifecycle_status IN (draft, pending_review, published, paused, archived, rejected)` |
| **Public query hides pending** | TRUE — RLS + queries filter `lifecycle_status = published` |
| **Webhook activation (paid)** | **FALSE** — no Empleos branch in `revenueFulfillment.ts` |
| **Free feria flow** | TRUE — `mode: "publish"`, no Stripe, `empleos_job_fair_free` blocked from checkout |
| **Dashboard edit route** | TRUE |
| **Dashboard add-on loophole protected** | N/A |
| **Media persistence** | TRUE |
| **Public render** | TRUE when published |
| **READY FOR QA** | **FALSE** (paid) / **TRUE** (feria free path only) |

**Blockers (paid):** (1) No webhook draft → published activation after Revenue OS payment. (2) Final checkpoint not on preview page (flow divergence from standard). (3) No dedicated pre-payment hidden status beyond `draft`.

---

### 6. Rentas

| Field | Value |
|---|---|
| **Category** | Rentas |
| **Internal pipelines** | `privado` \| `negocio` (both same price; no inventory) |
| **Paid/free/mixed** | Paid |
| **Base package key** | `rentas_30d` |
| **Base price** | $24.99 / 30 days (2499 cents) |
| **Add-on** | none |
| **Upgrade allowed** | **NO** (entry copy explicitly excludes inventory pack) |
| **Entry checkpoint** | TRUE — `publicar/rentas/RentasPublicarHubClient.tsx` |
| **Ver más** | TRUE |
| **Final checkout checkpoint** | **partial (privado)** — custom promo/newsletter + publish button; **missing** shared checkboxes/rules modal. **FALSE (negocio)** — immediate publish, no payment |
| **Required checkboxes** | **FALSE** (privado) |
| **Newsletter** | TRUE (privado) |
| **Promo Apply** | TRUE (privado) |
| **Hidden pending save** | TRUE (privado only) — `activationMode: "pending_payment"` → `status = pending` |
| **Listing table** | `listings` (category rentas) |
| **Hidden status value** | `pending` |
| **DB constraint proof** | UNKNOWN (same `listings.status` as Bienes) |
| **Public query hides pending** | TRUE |
| **Webhook activation** | **FALSE** |
| **Dashboard edit route** | TRUE |
| **Dashboard add-on loophole protected** | N/A |
| **Media persistence** | TRUE (privado blob upload path) |
| **Public render** | TRUE when published |
| **READY FOR QA** | **FALSE** |

**Blockers:** (1) No Revenue OS webhook listing activation. (2) Privado lacks shared final checkpoint confirmations/rules modal. (3) **Rentas negocio publishes live without payment** — must not ship as paid category.

---

## Hidden Pending Save + SQL Status Proof (Gate 5)

| Category | Pre-Stripe save | Status written | Constraint proof | Public hide | Webhook can activate |
|---|---|---|---|---|---|
| Servicios | API publish | `pending_payment` | UNKNOWN | TRUE | TRUE |
| Bienes negocio | leonix publish core | `pending` | UNKNOWN | TRUE | **FALSE** (Revenue OS) |
| Autos dealer | legacy checkout | `pending_payment` | TRUE | TRUE | TRUE (legacy webhook) |
| Autos privado | draft row | `draft` | TRUE | TRUE | **FALSE** |
| Empleos paid | listings API draft | `draft` | TRUE (no pending_payment) | TRUE | **FALSE** |
| Empleos feria | direct publish | `published` | TRUE | N/A | N/A |
| Rentas privado | leonix publish core | `pending` | UNKNOWN | TRUE | **FALSE** |
| Rentas negocio | immediate | `active`/published | UNKNOWN | N/A | N/A |

## Dashboard No-Free-Loophole (Gate 7)

| Category | Add-on helper | Add-on-only package | Base recharge blocked | Entitlement source |
|---|---|---|---|---|
| Servicios | `serviciosDashboardOffersAddonCheckout.ts` | `servicios_offers_addon` | TRUE | `listing_package_entitlements` |
| Bienes | `bienesDashboardInventoryAddonCheckout.ts` | `br_inventory_pack_monthly` | TRUE | `listing_package_entitlements` |
| Autos dealer | `autosDashboardInventoryAddonCheckout.ts` | `autos_dealer_inventory_pack_monthly` | TRUE | `listing_package_entitlements` |
| Autos privado | N/A | N/A | N/A | N/A |
| Empleos | N/A | N/A | N/A | N/A |
| Rentas | N/A | N/A | N/A | N/A |

## Promo / Newsletter (Gate 4–6)

Shared component `PublishCheckoutCheckpoint.tsx` supports newsletter + promo when wired. Categories with full wiring: **Servicios**. Partial/custom: Bienes (UI only), Autos privado confirm, Empleos paid modal, Rentas privado custom. Recent promo validation green work (`revenuePromoValidation.ts`, `revenuePromoRedemptions.ts`) applies globally once checkout passes `promoCode`.

## Category-Specific Next Gates (Recommended Order)

1. **Revenue OS webhook listing activation** — Bienes, Autos privado, Empleos paid, Rentas privado (`revenue*BienesFulfillment.ts` pattern mirroring Servicios).
2. **Bienes initial checkout** — pass inventory `addOns` + promo from `PublishCheckoutCheckpoint` context.
3. **Rentas negocio** — wire paid checkpoint + pending save (currently free publish).
4. **Rentas privado** — migrate to `PublishCheckoutCheckpoint` + confirmations.
5. **Empleos paid** — preview final checkpoint + webhook draft→published; consider `pending_review` or lifecycle extension.
6. **Autos unified standard** — migrate dealer base from legacy checkout to Revenue OS OR document intentional dual-stack.
7. **Autos privado** — `setAutosListingPendingPayment` before Revenue OS + webhook activation bridge.
8. **SQL status constraints** — align `listings.status` / `servicios_public_listings.listing_status` / `empleos_public_listings.lifecycle_status` with hidden pre-payment values where needed (migrations locked unless proven safe).

## What Is Ready for QA

| Category | Ready for QA |
|---|---|
| Servicios (professional + trades) | **YES** |
| Bienes Raíces negocio + inventory | **NO** |
| Autos dealer + inventory add-on | **NO** (partial legacy base) |
| Autos privado | **NO** |
| Empleos regular paid | **NO** |
| Empleos feria free | **YES** |
| Rentas | **NO** |

## Files Inspected (representative)

- Shared: `revenuePricingMatrix.ts`, `publishCheckoutCheckpoint.ts`, `revenueCategoryCheckoutPayload.ts`, `revenueCheckout.ts`, `revenueEntitlements.ts`, `revenueFulfillment.ts`, `revenueServiciosFulfillment.ts`, `PublishCheckoutCheckpoint.tsx`, `/api/revenue-os/checkout`, `/api/revenue-os/webhook`
- Servicios: checkpoint, preview, publish API, dashboard add-on helper
- Bienes: hub, agente preview, leonix publish core, dashboard inventory helper
- Autos: entry hub, confirm core, legacy checkout/webhook, dashboard inventory helper
- Empleos: hub, quick/premium application, feria application, listings API, preview clients
- Rentas: hub, privado/negocio preview clients

## TRUE/FALSE Audit (Gate 10)

See verifier output — matrix doc is the source of truth for category readiness.

## READY TO COMMIT Standard

This gate delivers **documentation + verifier/smoke scripts** that record activation truth. Runtime category fixes are deferred to category-specific follow-up gates listed above.
