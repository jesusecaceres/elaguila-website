# LEONIX QUICK — STAFF GATEWAY FINAL PROOF LEDGER
**Date:** 2026-09-22  
**Controller:** `LEONIX_QUICK_FINAL_STAFF_GATEWAY_FORENSIC_AUDIT_AND_REPAIR_2026-09-22`  
**Origin:** `jesusecaceres/elaguila-website`  
**Branch:** `repair/quick-sales-eight-category-staff-gateway-2026-09-22`  
**Rejected PASS SHA:** `4751382f13d3f7ff6aef8faa2a959dd5518d7601`  
**Repair start SHA:** `4751382f13d3f7ff6aef8faa2a959dd5518d7601`  
**Live SHA:** recorded at closeout  
**Deployment:** none  
**External mutation:** none  

Status vocabulary: `TRUE — PROVEN` | `PROVEN_NA` | `FALSE` | `UNKNOWN` | `PARTIAL` | `DEFERRED_BY_OWNER`.  
Final PASS requires zero FALSE / UNKNOWN / PARTIAL. Independent source review REJECTED the reported PASS at `4751382f1`. This ledger corrects every contradicted claim.

---

## Live gate checklist

| Gate | Title | Status | Next |
| --- | --- | --- | --- |
| Start | origin / branch / HEAD / clean / no deploy | TRUE — PROVEN | A |
| A | Eight canonical applications send assisted saves from the visible staff control | TRUE — PROVEN (component/jsdom + source mount; not a live Next.js page fill) | B |
| B | Payment authority fail-closed | TRUE — PROVEN (Terminal insert DEFERRED_BY_OWNER) | C |
| C | Claim/release never reports false success | TRUE — PROVEN (atomic RPC runtime DEFERRED_BY_OWNER) | D |
| D | Honest tests and ledger | TRUE — PROVEN | closeout |
| 0–10 | Prior source gates (see historical sections) | retained, with A–C defects at `4751382f1` now repaired | — |

---

## Independent review rejection (`4751382f1`)

The following claims at that SHA were **FALSE** and are not restated as TRUE:

| Rejected claim | Actual source at `4751382f1` |
| --- | --- |
| All eight families save from the canonical application | Rentas, Empleos, Autos privados, Comida Local did not mount `AssistedSaveForClientBar` |
| Adapter covers the eight families | `assistedSaveForClientClient.ts` had four contracts |
| Autos Dealer / Bienes owner-null first save | `buildPayload` returned null without `ctx.clientUserId` |
| Direct API save tests prove browser-to-save continuity | They invoked routes; they did not click the staff control |
| Active entitlement with matching listing+package is payment | `live_entitlement` qualified without grant provenance |
| Query errors fail closed | payment / entitlement / Rewards `.error` was not a hard refusal |
| Rewards metadata counts credits | `leonix_credits_applied_cents` could cover without committed redemptions |
| Runtime detects `replayed: true` | server hardcoded `replayed: false`; no `replayed` column |
| `stripe_terminal` is a live insertable source | fails `leonix_payment_records_source_chk` |
| Claim transfer treats read failure as owner-null | `readCurrentOwner` error looked like missing/null owner |
| HTTP accept returns success after transfer failure | `ok: true` even when `recorded` was false |
| `READY_FOR_SINGLE_PREVIEW_QA: true` | four families had no staff Save control |

---

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

### Gate 4 — translation (checkpoint)

Reuse only `TranslateAdControl` + `requestAdTranslation` + `POST /api/translate-ad`. Click-only. Contacts masked. Failure leaves original copy. Legal/display names are not sent as Translate Ad title.

Public detail wiring: Rentas, Empleos, Autos (privado + dealer), Servicios, Restaurantes, Comida Local, Bienes Negocio. Private prospect preview mounts `ProspectPreviewTranslateAd`. Servicios result cards reuse the shared control.

- `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-translation-01.ts` — PASS (17)

---

### Gate 5 — media / Leonix preview / address / Community Trust (checkpoint)

Private prospect preview (`/vista-previa/[category]`) now renders `ProspectCategoryPreviewShell`: ivory Leonix canvas, 1/2/3 image layout, contacts, facts, Translate Ad. JSON key-dump is gone.

Address: `shouldFetchAddressSuggestions` refuses keystroke/debounce/reopen. `BusinessAddressVerifiedInput` calls Google Geocoding only on explicit Confirm.

Community Trust:

| Family | Disposition | Evidence |
| --- | --- | --- |
| Servicios | TRUE — PROVEN | card strip + interactive hub |
| Restaurantes | TRUE — PROVEN | card strip + RestaurantContactHub |
| Comida Local | TRUE — PROVEN | card strip + public detail widget |
| Bienes Negocio | TRUE — PROVEN | card strip (negocio lane) + BrRentasCommunityTrustSection |
| Rentas (staff privado) | PROVEN_NA | not in endorsement registry |
| Empleos | PROVEN_NA | not in endorsement registry |
| Autos privados | PROVEN_NA | not in endorsement registry |
| Autos Dealer | PROVEN_NA | not in endorsement registry |

- `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-media-preview-trust-01.ts` — PASS (11)

### Gate 6 — custody / preview / same-row claim (checkpoint)

`planLinkedListingOwnerTransfer` + `transferLinkedListingsOnAcceptedClaim` after `accept_business_ownership_claim`. Owner-null linked rows become the claimer. Already-claimer is idempotent. Foreign owner is not stolen. Listings are never copied.

Independent review of `4751382f1` found listing-read failure treated like owner-null and HTTP `ok: true` when transfer was not recorded. Those defects are repaired in Gate C. The atomic RPC SQL remains unapplied.

- `scripts/verify-staff-eight-category-custody-release-01.ts` — PASS (9)

### Gate 7 — Rewards office-sale bridge (checkpoint)

Payment authority already evaluates committed Rewards + residual. Office-sale proofs:

1. no Rewards + full payment → ok
2. reserved then committed residual → ok; reserved-only → `rewards_not_committed`
3. canceled → `canceled_payment`
4. `rewards_replay` is a pure-evaluator input (`replayed: true`). Runtime does **not** detect replay; DB idempotency is `leonix_rewards_redemptions_idempotency_idx`
5. underpay / over-redemption exact codes; 50% cap = 12450¢ of 24900
6. Quick + Rewards cannot publish Full → `wrong_package`
7. refunded/disputed fail closed; helper never DELETE
8. 9% of $249 = 2241¢; credits do not earn; floor 50¢; intro earn from $211.65 = 1904¢

- `scripts/verify-staff-eight-category-rewards-office-01.ts` — PASS (9)
- `scripts/verify-listing-package-payment-authority-01.ts` — PASS (26 after Gate B; 22 at Gate 7 checkpoint)

Honest replay contract (corrects a prior fixture-only claim): the payment reader does **not** detect `replayed: true`. Database idempotency is unique index `leonix_rewards_redemptions_idempotency_idx` on `idempotency_key`. There is no `replayed` column. Pure evaluator still refuses `rewards_replay` if a caller supplies `replayed: true`.

---

### Gate 8 — security / failure matrix (checkpoint)

Exact outcomes: 401 `no_admin_cookie`, 403 `role_not_permitted`, 401 claim `unauthorized`, 409 `assisted_listing_mismatch`, Quick 0/4 images refused, payment pending/wrong_package/refunded/wrong_currency/wrong_listing, Rewards replay, foreign-owner claim skip, keystroke address refused.

- `scripts/verify-staff-eight-category-security-failure-01.ts` — PASS (14)
- translation regression — PASS (17)
- doorway regression — PASS (19)

---

### Gate 9 — local UX 390 / 768 / 1440 ES / EN (checkpoint)

LOCAL visual proof only. Not a deployed Preview. Staff cockpit without admin cookies honestly redirects to `/admin/login` (no fail-open public intake). Prospect preview without a signed token renders SafeRefusal (no JSON dump). Compile-only public Supabase placeholders; no live listing payload.

Repairs:

- cockpit category / plan / search / custody / preview / publish controls: `min-h-[44px]`, `aria-pressed`, bilingual `aria-label`, `overflow-x-hidden`
- vista-previa shell `paddingTop: calc(5.25rem + env(safe-area-inset-top, 0px))` so the bilingual heading clears the fixed site navbar

Executed:

- `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-local-ux-01.ts` — PASS (7/7)
- `NODE_PATH=/workspace/node_modules node scripts/capture-staff-eight-category-local-ux-01.cjs` — PASS (18/18, overflow=0, headingClearsNav=true at 390/768/1440)

Measured heading clearance (LOCAL):

| Viewport | navBottom | headingTop | overflow |
| --- | --- | --- | --- |
| 390 | 49 | 129 | 0 |
| 768 | 55 | 129 | 0 |
| 1440 | 57 | 129 | 0 |

Artifacts (LOCAL): `/opt/cursor/artifacts/gate9_local_v3_*.png` + `gate9_local_ux_receipts_v3.json`

DEFERRED_BY_OWNER: staff-authenticated cockpit Quick/Full click-through (would require mutating auth / roster cookies). Source contract for eight bilingual family buttons + Quick/Full picker on the four business pairs is proven by U1/U2.

---

### Gate 10 — regression + full tsc + next build (historical closeout before independent review)

Recorded at `7746b363` / `4751382f1`. Independent review REJECTED that PASS for Gates A–C. Typecheck/build receipts below are historical; Gate D re-runs them after the A–C repairs.

No heavyweight tsc/build was running before this gate.

Changed-file ESLint: zero warnings / zero errors on the branch-changed `.ts/.tsx/.js/.mjs/.cjs` set.

Focused verifiers (exact counts):

| Harness | Result |
| --- | --- |
| `verify-listing-package-payment-authority-01.ts` | PASS (22) |
| `verify-staff-eight-category-gateway-01.ts` | PASS (19/19) |
| `verify-staff-eight-category-content-01.ts` | PASS (14/14) |
| `verify-staff-eight-category-translation-01.ts` | PASS (17/17) |
| `verify-staff-eight-category-media-preview-trust-01.ts` | PASS (11/11) |
| `verify-staff-eight-category-custody-release-01.ts` | PASS (9/9) |
| `verify-staff-eight-category-rewards-office-01.ts` | PASS (9/9) |
| `verify-staff-eight-category-security-failure-01.ts` | PASS (14/14) |
| `verify-staff-eight-category-local-ux-01.ts` | PASS (7/7) |
| `verify-servicios-staff-gateway-01.ts` | PASS (31/31) |
| `verify-quick-sales-preview-01.ts` | PASS (138) |
| `verify-quick-sales-entry-consolidation-01.ts` | PASS (19/19) |
| `verify-quick-sales-canonical-publish-readiness-01.ts` | PASS (35/35) |
| `verify-quick-assisted-operations-01.ts` | PASS (24) |
| `verify-quick-product-boundary-01.ts` | PASS (52) |
| `verify-p0-assisted-servicios-navigation-01.ts` | PASS (7 contracts) |
| `verify-p0-final-assisted-publishing-bridge-01.ts` | PASS (8 contracts) |

Full TypeScript:

- command: `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck` (`tsc --noEmit --incremental false`)
- result: exit 0, 0 errors
- log: `/opt/cursor/artifacts/gate10_typecheck.log`

One `next build`:

- command: `NODE_OPTIONS=--max-old-space-size=12288 npm run build` (`scripts/next-build.js`)
- compile-only public placeholders (not runtime proof): `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`, dummy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`
- result: exit 0; `✓ Compiled successfully in 88s`; `✓ Generating static pages (391/391)`
- cockpit route present: `/admin/workspace/quick-sales`
- prospect preview route present: `/vista-previa/[category]`
- log: `/opt/cursor/artifacts/gate10_next_build.log`
- no Vercel mutation; no deploy

DEFERRED_BY_OWNER (not tested, not falsely marked tested): Vercel Preview, Production, Supabase migration apply, Stripe live/test charges, staff-authenticated cockpit click-through, live listing payload preview.

---

## Remaining next gate

None for source Gates A–D. Unapplied database work is listed as `DEFERRED_BY_OWNER`, not hidden as TRUE.

`READY_FOR_PRODUCTION: false`

`READY_FOR_SINGLE_PREVIEW_QA: false` — Autos owner-null first save cannot persist on the current live schema until `20260922120000_autos_classifieds_owner_null_organizational_custody.sql` is applied. Source and component proofs for the eight Save controls are TRUE; that is not live Preview fill.

---

## Gate A — eight canonical applications send assisted saves

Repairs after `4751382f1`:

- `assistedSaveForClientClient.ts` now has eight `AssistedSavePayload` contracts. Every body includes `assistedAction: "save_for_client"`. `clientUserId` is optional (`string | null`). Autos privado later saves PATCH `/api/clasificados/autos/listings/{id}`. Autos Dealer listing id is read from `mainListingId`.
- `handleAssistedSaveClick` is the exact visible Save pipeline. It never opens customer login and never sends a customer bearer.
- `AssistedSaveForClientBar` is mounted in all eight canonical applications. Servicios is no longer gated on `assistedUi`; the bar hides itself when custody GET is empty.
- Autos Dealer `buildPayload` sends `clientUserId: ctx.clientUserId ?? null`. Bienes `buildPayload` no longer returns null without a client; `ownerId = ctx.clientUserId ?? null` and `buildListingsInsertRowForLeonixPublish` omits `owner_id` when null.
- All eight fill paths sit under `PublishAuthGateLayout`. A verified assisted cookie sets the gate to authed and skips `window.location.replace(loginHref)`. Unassisted public/customer behavior is unchanged.

Required clients (no generic replacement forms):

| Family | Canonical application | Staff Save |
| --- | --- | --- |
| Rentas | `RentasPrivadoForm.tsx` | mounted |
| Empleos | `EmpleoQuickApplicationClient.tsx` | mounted |
| Autos privados | `AutosPublishConfirmCore.tsx` lane privado | mounted |
| Servicios | `ClasificadosServiciosApplication.tsx` | mounted |
| Restaurantes | `RestauranteApplicationClient.tsx` | mounted |
| Comida Local | `ComidaLocalApplicationClient.tsx` | mounted |
| Autos Dealer | `AutosPublishConfirmCore.tsx` lane negocios | mounted, owner-null |
| Bienes Negocio | `AgenteIndividualResidencialPreviewClient.tsx` | mounted, owner-null |

Executed proof (`scripts/verify-staff-eight-category-assisted-save-ui-01.ts`): **39/39 PASS**.

- U1: source-mount of the shared bar on all eight
- U4: `handleAssistedSaveClick` first save + same-row second save; Autos privado second save is PATCH
- U5: jsdom click `[data-staff-save-for-client]` on the shared bar; no customer login HTML/redirect
- U8: each intake path is under `PublishAuthGateLayout`
- U9: assisted cookie short-circuits customer login
- U10: Rentas/Empleos payloads use the real builders; Autos/Bienes owner-null payloads omit `owner_id`

Honest limit: U5 renders the shared bar that each canonical application mounts; it does not boot the full Next.js page tree in a live browser. Direct API invocation is not the proof.

---

## Gate B — payment authority must not fail open

Repairs:

- Active `listing_package_entitlements` is not payment because listing id + package match.
- Only `grant_source = print_included` plus exact `listing_source` / category / package may satisfy publication without a payment record (`PREPAID_INCLUDED_ENTITLEMENT_GRANT_SOURCES`).
- Manual entitlement with `metadata.payment_status = null` and `grant_source = admin_manual` → `unproven_entitlement`.
- Payment, entitlement, or Rewards query `.error` → `ledger_read_failed`.
- `leonix_credits_applied_cents > 0` requires matching committed `leonix_rewards_redemptions`. Metadata alone is `rewards_not_committed`.
- Runtime does not emit `replayed: false` or detect `replayed: true`. Idempotency is `leonix_rewards_redemptions_idempotency_idx`.
- Additive unapplied migration `supabase/migrations/20260922190000_leonix_payment_records_source_stripe_terminal.sql` widens the CHECK. Evaluator accepts `stripe_terminal`; live inserts currently fail the existing CHECK. **Terminal storage: DEFERRED_BY_OWNER.**

Executed proofs:

- `verify-listing-package-payment-authority-01.ts` — PASS (26)
- `verify-staff-eight-category-payment-claim-runtime-01.ts` — PASS (21) including:
  - P1 unpaid/manual entitlement cannot publish
  - P2 same UUID wrong `listing_source` cannot publish
  - P3 Rewards metadata without committed redemption cannot publish
  - P4 Rewards read error cannot publish
  - P5/P6 payment/entitlement query error cannot publish
  - P7 Quick cannot publish Full; Full cannot be Quick
  - P8 refunded / disputed / reversed / canceled / pending / wrong-currency / wrong-package cannot publish
  - P8 wrong-listing: runtime query is listing-scoped → `no_matching_record`; evaluator with the mismatched record → `wrong_listing`
  - P10 print_included + wrong `listing_source` → `unproven_entitlement`
  - P11 Terminal CHECK unapplied, documented

R6b: Full media exemption requires a Full **payment record**. A live Full entitlement is product identity, not payment.

---

## Gate C — claim/release must not report false success

Repairs:

- Listing read error is `listing_read_failed`, never owner-null.
- Missing listing is `readStatus: "missing_listing"` and is skipped, not transferred.
- Updates `.select("id")`. Zero affected rows → `zero_affected_rows` or `partial_transfer`. `recorded: true` only if every planned update affects ≥1 row.
- `POST /api/business/ownership-claim/accept` returns `{ ok: false }` status 409 when `!transfer.ok || transfer.recorded !== true`.
- Foreign-owned rows are skipped, never stolen. Same listing IDs are preserved. No listing INSERT.
- Additive SQL `20260922180000_accept_claim_transfer_linked_listing_owners.sql` remains **unapplied**. Source proves one PL/pgSQL transaction, `FOR UPDATE`, owner-null UPDATEs, no listing INSERT. Runtime atomic QA: **DEFERRED_BY_OWNER**.

Executed proofs (same runtime harness, C1–C10):

- C1 read failure hard refusal
- C2 foreign owner not stolen
- C3 owner-null transfers same id
- C4 HTTP 409 on listing_read_failed
- C5 unapplied RPC is one transaction
- C8 zero matching update rows → `recorded: false`, `zero_affected_rows`
- C9 partial transfer after first success → `partial_transfer`, not complete
- C10 HTTP 409 when transfer is not recorded

`scripts/verify-staff-eight-category-custody-release-01.ts` — PASS (9)

---

## Gate D — honest tests and ledger

Executed focused regressions (this closeout):

| Harness | Result |
| --- | --- |
| `verify-staff-eight-category-assisted-save-ui-01.ts` | PASS (39/39) |
| `verify-staff-eight-category-payment-claim-runtime-01.ts` | PASS (21/21) |
| `verify-listing-package-payment-authority-01.ts` | PASS (26) |
| `verify-staff-eight-category-gateway-01.ts` | PASS (19/19) |
| `verify-staff-eight-category-content-01.ts` | PASS (14/14) |
| `verify-staff-eight-category-translation-01.ts` | PASS (17/17) |
| `verify-staff-eight-category-media-preview-trust-01.ts` | PASS (11/11) |
| `verify-staff-eight-category-custody-release-01.ts` | PASS (9/9) |
| `verify-staff-eight-category-rewards-office-01.ts` | PASS (9/9) |
| `verify-staff-eight-category-security-failure-01.ts` | PASS (14/14) |
| `verify-staff-eight-category-local-ux-01.ts` | PASS (7/7) |
| `verify-servicios-staff-gateway-01.ts` | PASS (31/31) |
| `verify-quick-sales-preview-01.ts` | PASS (138) |
| `verify-quick-sales-entry-consolidation-01.ts` | PASS (19/19) |
| `verify-quick-sales-canonical-publish-readiness-01.ts` | PASS (35/35) |
| `verify-quick-assisted-operations-01.ts` | PASS (24) |
| `verify-quick-product-boundary-01.ts` | PASS (52) |
| `verify-p0-assisted-servicios-navigation-01.ts` | PASS (7 contracts) |
| `verify-p0-final-assisted-publishing-bridge-01.ts` | PASS (8 contracts) |
| `verify-p0-staff-assisted-category-access-01.ts` | PASS (7 contracts) |
| `verify-quick-business-core-01.ts` | PASS |

Changed-file ESLint: zero errors / zero warnings on the Gate A–D `.ts/.tsx` set. Log: `/opt/cursor/artifacts/gate_d_eslint.log`

Full TypeScript and one `next build` are recorded in the closeout receipts below.

---

## DEFERRED_BY_OWNER (blockers, not hidden as TRUE)

1. Vercel Preview deploy / Production / Stripe live or test charges.
2. Apply `supabase/migrations/20260922120000_autos_classifieds_owner_null_organizational_custody.sql` — current CHECK/column is `owner_user_id uuid not null`. Source writes null; live Autos owner-null insert is blocked until applied. This is why `READY_FOR_SINGLE_PREVIEW_QA` is false.
3. Apply `supabase/migrations/20260922180000_accept_claim_transfer_linked_listing_owners.sql` — atomic claim+transfer RPC. Current Node path is sequential per table and fail-closed, but not one database transaction. Release runtime QA is DEFERRED_BY_OWNER.
4. Apply `supabase/migrations/20260922190000_leonix_payment_records_source_stripe_terminal.sql` — Terminal inserts fail the existing source CHECK until applied.
5. Staff-authenticated cockpit click-through on a deployed Preview (would require mutating auth/roster cookies).
6. Live listing payload prospect preview.

No migrations were applied. No Supabase/Stripe/Vercel mutation.

---

## Final repaired eight-family matrix (live source)

| Family | Staff key | Canonical application | Listing table | Owner-null source | Live DB owner-null | Payment | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rentas | `rentas` | `/clasificados/publicar/rentas/privado` | `listings` | omit `owner_id` | already nullable | `rentas_30d` | TRUE — PROVEN (component) |
| Empleos | `empleos` | `/publicar/empleos/quick` | `empleos_public_listings` | already nullable | already nullable | `empleos_job_post_paid` | TRUE — PROVEN (component) |
| Autos privados | `autos-privado` | `/publicar/autos/privado` | `autos_classifieds_listings` | writes null | DEFERRED_BY_OWNER (SQL unapplied) | `autos_privado_30d` | TRUE source / DEFERRED live insert |
| Servicios | `servicios` | `/publicar/servicios` | `servicios_public_listings` | yes | yes | pair $249/$399 | TRUE — PROVEN (component) |
| Restaurantes | `restaurantes` | `/publicar/restaurantes` | `restaurantes_public_listings` | yes | yes | pair $249/$399 | TRUE — PROVEN (component) |
| Comida Local | `comida-local` | `/publicar/comida-local` | `comida_local_public_listings` | already nullable | already nullable | `comida_local_base_monthly` | TRUE — PROVEN (component) |
| Autos Dealer | `autos` | `/publicar/autos/negocios` | `autos_classifieds_listings` | writes null | DEFERRED_BY_OWNER (SQL unapplied) | pair $249/$399 | TRUE source / DEFERRED live insert |
| Bienes Negocio | `bienes-raices` | `/clasificados/publicar/bienes-raices/negocio` | `listings` | omit `owner_id` | already nullable | pair $249/$399 | TRUE — PROVEN (component) |

Viajes / Iglesias / Recursos: excluded. PROVEN_NA.

