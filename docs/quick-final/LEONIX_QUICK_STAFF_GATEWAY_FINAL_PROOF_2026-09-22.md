# LEONIX QUICK — STAFF GATEWAY FINAL PROOF LEDGER
**Date:** 2026-09-22  
**Controller:** `LEONIX_QUICK_FINAL_STAFF_GATEWAY_FORENSIC_AUDIT_AND_REPAIR_2026-09-22`  
**Origin:** `jesusecaceres/elaguila-website`  
**Branch:** `repair/quick-sales-eight-category-staff-gateway-2026-09-22`  
**Starting SHA:** `3171ae7d88aaedbb88f34b7c7deaf4d73e61456d`  
**Live SHA:** `f3963b786a2de7d7e813107e78e8443c7f7dfdd9` (Gate 2 checkpoint; Gate 3 in this descendant)  
**Deployment:** none  
**External mutation:** none  

Status vocabulary: `TRUE — PROVEN` | `PROVEN_NA` | `FALSE` | `UNKNOWN` | `PARTIAL` | `DEFERRED_BY_OWNER`.  
Final PASS requires zero FALSE / UNKNOWN / PARTIAL.

---

## Live gate checklist

| Gate | Title | Status | Next |
| --- | --- | --- | --- |
| Start | origin / branch / HEAD / clean / no heavyweight process | TRUE — PROVEN | Gate 0 |
| 0 | Forensic matrices from current source | TRUE — PROVEN (ledger) | Gate 1 |
| 1 | Package/payment authority | TRUE — PROVEN | Gate 2 |
| 2 | Exact eight-category doorway | TRUE — PROVEN | Gate 3 |
| 3 | Application content / save-reopen | TRUE — PROVEN | Gate 4 |
| 4 | Translation | UNKNOWN | reuse TranslateAdControl only |
| 5 | Media / preview / address / Trust | UNKNOWN | |
| 6 | Custody / preview / lifecycle / release | FALSE | owner-null + release incomplete |
| 7 | Rewards bridge | FALSE | not in publish decision |
| 8 | Security / failure matrix | UNKNOWN | |
| 9 | Local UX 390/768/1440 ES/EN | UNKNOWN | |
| 10 | Regression + full tsc + next build | UNKNOWN | once only at end |

---

## Start-gate receipts

- origin: `https://github.com/jesusecaceres/elaguila-website.git`
- branch: `repair/quick-sales-eight-category-staff-gateway-2026-09-22`
- HEAD: `3171ae7d88aaedbb88f34b7c7deaf4d73e61456d`
- worktree: clean
- heavyweight tsc/next/eslint/tsx: none
- message queue: empty

---

## Gate 0 — source matrices (starting SHA)

### 5.1 Eight-category gateway (starting state)

| Family | Staff UI key | Canonical application | Customer adapter/checkpoint | Listing table | Owner-null | Staff doorway | Payment/package | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Servicios | `servicios` | `/publicar/servicios` → `ClasificadosServiciosApplication` | checkpoint `/clasificados/publicar/servicios`; adapter `/publicar/negocio-rapido/servicios` | `servicios_public_listings` | yes (`requiresClientUserId: false`) | wired | pair $249/$399; listing-only payment | FALSE (payment hole) |
| Restaurantes | `restaurantes` | `/clasificados/publicar/restaurantes` | Quick adapter exists separately | `restaurantes_public_listings` | yes | registry only, no primary cockpit action | pair recorded | FALSE |
| Autos Dealer | `autos` | `/clasificados/publicar/autos` | private seller is a different family | `autos_classifieds_listings` | FALSE (`requiresClientUserId: true`) | registry only | pair recorded | FALSE |
| Bienes Negocio | `bienes-raices` | `/clasificados/publicar/bienes-raices` | FSBO is a different product | `listings` | FALSE (`requiresClientUserId: true`) | registry only | pair recorded | FALSE |
| Rentas | (not in `QUICK_SALES_CATEGORIES`) | `/clasificados/publicar/rentas` | Quick classifieds adapter `/publicar/rapido` | (inspect) | UNKNOWN | FUTURE placeholder | `rentas_30d` $24.99 / 30d | FALSE |
| Empleos | (not in registry) | `/publicar/empleos` | | `empleos_public_listings` | UNKNOWN | FUTURE placeholder | `empleos_job_post_paid` $24.99 | FALSE |
| Autos privados | (not in registry) | `/publicar/autos` | not dealer | `autos_classifieds_listings` | UNKNOWN | FUTURE placeholder | `autos_privado_30d` $24.99 / 30d | FALSE |
| Comida Local | (not in registry) | canonical food app (not `/publicar/comida-local/rapido`) | Quick adapter `/publicar/comida-local/rapido` | `comida_local_public_listings` | UNKNOWN | FUTURE placeholder | `comida_local_base_monthly` $129 | FALSE |
| Viajes / Iglesias / Recursos | excluded | n/a | n/a | n/a | n/a | must stay excluded | n/a | PROVEN_NA (recorded excluded) |

Evidence:

- `app/lib/sales/quickSalesCategories.ts` registers only four keys.
- `app/lib/sales/staffServiciosGateway.ts` `FUTURE_STAFF_GATEWAY_FAMILIES` + `resolveStaffNavigationFromCustodyPost` hard-requires `category === "servicios"`.
- `QuickSalesWorkspaceClient.tsx` primary fill action is `openServiciosWithCustody`.
- `staffBusinessProduct.ts` pair categories recorded; intake href helper only special-cases Servicios.

### 5.2 Per-field extraction

Starting SHA: not independently proven for the eight families. Servicios has mature hydrator `serviciosPublishedToApplicationDraft` and readiness `evaluateServiciosPublishReadiness`. Other families: UNKNOWN until Gate 3 inspects each canonical application. Do not invent schemas.

### 5.3 Business package matrix (source)

| Category | Quick key | Quick ¢ | Full key | Full ¢ | Access | Same application | Payment match | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Servicios | `servicios_quick_monthly` | 24900 | `servicios_base_monthly` | 39900 | simple/full | `/publicar/servicios` | listing-only clearance | FALSE |
| Restaurantes | `restaurantes_quick_monthly` | 24900 | `restaurantes_base_monthly` | 39900 | simple/full | same intake for both (registry) | listing-only | FALSE |
| Autos Dealer | `autos_dealer_quick_monthly` | 24900 | `autos_dealer_monthly` | 39900 | simple/full | same dealer app | listing-only | FALSE |
| Bienes Negocio | `br_agent_quick_monthly` | 24900 | `br_agent_monthly` | 39900 | simple/full | same negocio app | listing-only | FALSE |

Verified intro: 15% of $249 = **$211.65 / 21165¢** first Quick invoice (`verify-ix-rewards-route-behavior-01.ts`). Server-authoritative; not client-controlled.

### 5.4 Payment / Rewards matrix (starting SHA)

| Rail | Authoritative record | Bound to package? | Publish decision | Status |
| --- | --- | --- | --- | --- |
| Manual | `leonix_payment_records` `source=admin_manual` `manual_state=cleared` | `package_key` stored on insert, **not read** by `hasClearedManualPaymentForListing` | listing_source + listing_id only | FALSE |
| Stripe online | `source=stripe_checkout` then `stripe_webhook` `payment_status=paid` | package_key stored | **not** consulted by assisted publish | FALSE |
| Terminal | CHECK currently `admin_manual \| stripe_checkout \| stripe_webhook \| owner_override \| unknown` | cannot store `stripe_terminal` | FALSE | FALSE |
| Rewards | immutable ledger + redemption reserve/commit | credits on payment `metadata.leonix_credits_applied_cents` | **not** in publish helper | FALSE |
| Split | committed credits + residual rail | 50% cap, $0.50 residual floor | **not** in publish helper | FALSE |
| Refund/dispute | `refunded_at`, `payment_status=refunded\|disputed`, manual `reversed` | existing compensating policy | ignored by listing-only helper | FALSE |

Hole: a cleared Quick `$249` row on listing L authorizes Full publication of L.

Payment Tracker query params (`listingId`, `packageKey`, `category`) prefill `ManualPaymentClient` only. `POST /api/admin/revenue-os/manual-payments` reads the JSON body. Amount is still any positive cents — not canonical-package-validated.

---

## Repairs

### Gate 1 — package/payment authority (checkpoint)

Replaced listing-only `hasClearedManualPaymentForListing` with:

- `app/lib/listingPlans/listingPackagePaymentAuthority.ts` (pure)
- `app/lib/listingPlans/listingPackagePaymentAuthorityServer.ts` (ledger + entitlements + committed redemptions)

Publication now requires exact listing + exact package + canonical amount + currency + source-specific settled state, and fails closed on pending/rejected/reversed/refunded/disputed/wrong-package/underpay.

Mandatory proofs:

- Quick-paid → Full `wrong_package_payment` 402
- Full-selected → Quick payment `wrong_package`
- Full payment cannot be reinterpreted as Quick

Manual record path validates package exists, category matches package, and amount is list or verified-intro ($211.65). Payment Tracker query params remain UI prefill; `POST /api/admin/revenue-os/manual-payments` reads JSON body only.

### Gate 2 — exact eight-category doorway (checkpoint)

Registry, cockpit, custody navigation, and owner-null adapters now cover exactly the eight required families. `FUTURE_STAFF_GATEWAY_*` is gone. `$249/$399` picker renders only for Servicios, Restaurantes, Autos Dealer, Bienes Negocio.

| Family | Staff UI key | Canonical fill path | Listing table | Owner-null | Package | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Rentas | `rentas` | `/clasificados/publicar/rentas/privado` | `listings` | `requiresClientUserId: false` | `rentas_30d` | TRUE — PROVEN |
| Empleos | `empleos` | `/publicar/empleos/quick` | `empleos_public_listings` | already nullable | `empleos_job_post_paid` | TRUE — PROVEN |
| Autos privados | `autos-privado` | `/publicar/autos/privado` | `autos_classifieds_listings` | same table; owner-null adapter | `autos_privado_30d` | TRUE — PROVEN |
| Servicios | `servicios` | `/publicar/servicios` | `servicios_public_listings` | yes | pair `servicios_quick_monthly` / `servicios_base_monthly` | TRUE — PROVEN |
| Restaurantes | `restaurantes` | `/publicar/restaurantes` | `restaurantes_public_listings` | yes | pair | TRUE — PROVEN |
| Comida Local | `comida-local` | `/publicar/comida-local` | `comida_local_public_listings` | already nullable | `comida_local_base_monthly` | TRUE — PROVEN |
| Autos Dealer | `autos` | `/publicar/autos/negocios` | `autos_classifieds_listings` | save writes `owner_user_id` null | pair `autos_dealer_quick_monthly` / `autos_dealer_monthly` | TRUE — PROVEN |
| Bienes Negocio | `bienes-raices` | `/clasificados/publicar/bienes-raices/negocio` | `listings` | insert omits `owner_id` | pair `br_agent_quick_monthly` / `br_agent_monthly` | TRUE — PROVEN |
| Viajes / Iglesias / Recursos | excluded | n/a | n/a | n/a | n/a | PROVEN_NA |

Classified launchpad key `autos` maps to staff family `autos-privado`. Staff key `autos` remains dealer so assisted-publish `expectedCategory: "autos"` stays intact.

Cockpit primary action is `openIntakeWithCustody` for all eight: same-tab navigation only after custody POST. No fail-open `descriptor.intakePath` href. Pair picker only when `staffBusinessOffers(category).length`. Client user optional.

Owner-null:

- Autos Dealer assisted save without `clientUserId` writes `owner_user_id` null. Additive unapplied migration `supabase/migrations/20260922120000_autos_classifieds_owner_null_organizational_custody.sql` drops `NOT NULL` (not applied; schema currently `uuid not null`).
- Bienes assisted save without `clientUserId` omits `owner_id`.
- Supplied non-member `clientUserId` still 403 `client_not_authorized_for_business`.

Publish-readiness now imports each family's real gate (Gate 3). `assessStoredRowExists` is gone.

---

## Commands / counts

### Gate 1

- `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-listing-package-payment-authority-01.ts` — PASS (22)
- `verify-quick-sales-canonical-publish-readiness-01.ts` — PASS (35)
- `verify-quick-assisted-operations-01.ts` — PASS (24)
- `verify-quick-sales-entry-consolidation-01.ts` — PASS (19)
- `verify-quick-product-boundary-01.ts` — PASS (52)
- `verify-quick-sales-preview-01.ts` — PASS (82)
- `verify-p0-final-assisted-publishing-bridge-01.ts` — PASS (8)
- `verify-p0-assisted-servicios-navigation-01.ts` — PASS (7)

---

### Gate 2

- `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-gateway-01.ts` — PASS (19)
- `verify-servicios-staff-gateway-01.ts` — PASS (31)
- `verify-quick-sales-entry-consolidation-01.ts` — PASS (19)
- `verify-quick-sales-preview-01.ts` — PASS (138)
- `verify-quick-assisted-operations-01.ts` — PASS (24)
- `verify-quick-sales-canonical-publish-readiness-01.ts` — PASS (35)
- `verify-listing-package-payment-authority-01.ts` — PASS (22)
- `verify-p0-assisted-servicios-navigation-01.ts` — PASS (7)

---

### Gate 3 — application content / save-reopen (checkpoint)

Canonical hydrators/gates are mapped. Staff save uses each family's existing publisher via `resolveStaffAssistedCategorySave`. No generic form.

| Family | Hydrator / gate | Staff first-save | Repeat save | Status |
| --- | --- | --- | --- | --- |
| Rentas | `mapOwnedRentasListingToPrivadoFormState` + `gateRentasPrivadoPreview` | `POST /api/clasificados/rentas/listing-edit` owner-null insert | same `listingId` update | TRUE — PROVEN |
| Empleos | `hydrateQuickDraftFromEnvelope` + `gateEmpleosQuickPreview` | assisted draft upsert, owner-null | envelope listingId + snapshot stamped | TRUE — PROVEN |
| Autos privados | `getAutosPreviewCompletenessIssues("privado")` | `POST /api/clasificados/autos/listings` lane privado | same table id | TRUE — PROVEN |
| Servicios | `serviciosPublishedToApplicationDraft` / `selectedQuickFactIds` | existing assisted publish save | existing | TRUE — PROVEN |
| Restaurantes | `mergeRestauranteDraft` + explicit `smsNumber` | existing | SMS is a separate opt-in, never fabricated from office phone | TRUE — PROVEN |
| Comida Local | `mergeComidaLocalDraftFromStorage` + `validateComidaLocalDraftForFuturePublish` | pending_payment owner-null insert | lookup by draft id then table id | TRUE — PROVEN |
| Autos Dealer | semantic media then dealer completeness | existing assisted-publish | existing | TRUE — PROVEN |
| Bienes Negocio | semantic media then `gateBienesRaicesNegocioPreview` | existing | existing | TRUE — PROVEN |

Proofs: accents/`ñ`/apostrophes round-trip; cleared Rentas description stays cleared; incomplete paid Rentas 422 `not_ready`; cockpit no longer uses exist-only `assessStoredRowExists`; spacebar not swallowed on text controls.

---

### Gate 3 commands / counts

- `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-content-01.ts` — PASS (14)
- `verify-quick-sales-canonical-publish-readiness-01.ts` — PASS (35)
- `verify-staff-eight-category-gateway-01.ts` — PASS (19)

---

## Remaining next gate

**Gate 4** — translation matrix. Reuse only `TranslateAdControl`, `requestAdTranslation`, `/api/translate-ad`. Public detail + private preview must show Traducir anuncio / Translate Ad. No second provider.
