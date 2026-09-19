# Paid circuit static matrix (Gate 7) — 2026-09

Base: branch `integration/category-circuit-closeout-2026-09` @ `9cb5a52f`. Method: SOURCE READING ONLY (no build, no DB, no Stripe, no payment).
Not reopened: the signed webhook is proven. Runtime proof of each lane remains interactive QA.
Guard script: `scripts/verify-final-circuit-matrix.ts` (asserts every anchor named below still exists; run with `npx tsx scripts/verify-final-circuit-matrix.ts`).

Legend: `DEFECT` = a field that cannot be filled from source, or is filled but wrong/unsafe (scenario in **Defects found**). Every file path is repo-relative.

## 0. Products that exist (verified in `app/lib/listingPlans/revenuePricingMatrix.ts:REVENUE_V1_PACKAGE_MATRIX`)

| package_key | category | mode | price | Stripe eligible | Note |
|---|---|---|---|---|---|
| `servicios_base_monthly` | servicios | subscription | $399/mo | yes | includes coupons (`capabilities: coupons_offers`) |
| `restaurantes_base_monthly` | restaurantes | subscription | $399/mo | yes | includes coupons |
| `comida_local_base_monthly` | comida-local | subscription | $129/mo | yes | no coupons capability |
| `autos_dealer_monthly` | autos | subscription | $399/mo | yes | +10 vehicles via `autos_dealer_inventory_pack_monthly` ($129/mo add-on) |
| `autos_privado_30d` | autos | one-time | $24.99/30d | yes | |
| `br_agent_monthly` | bienes-raices | subscription | $399/mo | yes | Agente Individual residencial / Bienes Negocio; +3 via `br_inventory_pack_monthly` ($99/mo add-on) |
| `br_fsbo_45d` | bienes-raices | one-time | $49.99/45d | yes | |
| `rentas_30d` | rentas | one-time | $24.99/30d | yes | |
| `empleos_job_post_paid` | empleos | one-time | $24.99/30d | yes | the ONLY paid Empleos product (Quick AND Premium) |
| `clases_paid_30d` | clases | one-time | $24.99/30d | yes | |
| `ofertas_locales_flyer_30d` | ofertas-locales | one-time | $399/30d | yes | catalog `OFERTAS_LOCALES_FLYER_PRICE_CENTS = 39900` agrees |
| `ofertas_locales_coupons_30d` | ofertas-locales | one-time | matrix $199 / catalog $0 | matrix yes | **DEFECT D5** (catalog says free) |
| `viajes_business_monthly` | viajes | subscription | $399/mo | matrix yes | **no fulfilment**; server refuses (`checkout/route.ts` `viajes_checkout_not_available`) — no payment product |
| retired: `restaurantes_offers_addon`, `servicios_offers_addon` | | | | **no** (`stripeEligible:false`, `newSalesRetired`) | checkout returns 410 `addon_retired_included_in_base` |
| add-ons (dashboard, active parent only): `br_inventory_pack_monthly`, `autos_dealer_inventory_pack_monthly` | | subscription | | yes | own `*AddonOwnership` validators |

Empleos Premium: **no distinct package**. `EmpleoPremiumPreviewClient.tsx` and `EmpleoQuickPreviewClient.tsx` both call `saveEmpleosDraftAndStartPaidJobCheckout` (`app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts`) with `EMPLEOS_PAID_JOB_CHECKOUT` (`empleos_job_post_paid`); the lane is only the `empleos_public_listings.lane` column (`quick|premium|feria`). Same price, same activator.

## 1. Common spine (identical for every paid lane; lane blocks reference S1..S6)

* **S1 CHECKOUT PIPELINE** — `app/api/revenue-os/checkout/route.ts:POST`: `validateRevenueCheckoutRequest` (`revenueCheckout.ts`; price is ALWAYS read from the matrix, never from the client; `listingId`/`listingDraftId` required) → per-lane pre-flights (see lanes) → shared `requiresBaseCheckout` guard (`revenueActiveEntitlementGuard.ts`, keys `autos_dealer_monthly|br_agent_monthly|restaurantes_base_monthly|servicios_base_monthly|comida_local_base_monthly`, HTTP 409 `active_entitlement_no_recharge`) → recurring consent (subscription only) → `computeCheckoutAttemptKey` / `findOpenCheckoutAttempt` (reuse open session; `payment_in_progress` 409 / `checkout_state_unverifiable` 503 when the prior session is `complete`/unknown) → `createPendingPaymentRecord` → `createRevenueStripeCheckoutSession` (`revenueStripe.ts`) → `attachStripeSessionToPaymentRecord`.
* **S2 PAYMENT RECORD** — table `leonix_payment_records` (`revenuePaymentRecords.ts:createPendingPaymentRecord`, `payment_status='pending'`, `source='stripe_checkout'`, unique partial index on `checkout_attempt_key` for unresolved statuses); marked `paid` by `markPaymentRecordPaid` inside `fulfillCheckoutSessionCompleted`.
* **S3 WEBHOOK EVENT** — Stripe `checkout.session.completed` → `app/api/revenue-os/webhook/route.ts:POST` (signature `revenueWebhook.ts:verifyStripeWebhookEvent`; event ledger `stripeEventLedger.ts:claimStripeEvent` → table `leonix_stripe_webhook_events`) → `revenueFulfillment.ts:fulfillCheckoutSessionCompleted` (amount/currency/metadata guards, then `activateEntitlementsForPayment`, then the lane `tryActivate*AfterEntitlement`). `checkout.session.expired` → `markCheckoutSessionExpired`. Subscription lifecycle: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated|deleted`, `charge.refunded`, disputes → `revenueSubscriptionEvents.ts`.
* **S4 ENTITLEMENT** — table `listing_package_entitlements` via `revenueEntitlementFulfillment.ts:activateEntitlementsForPayment → activatePackageEntitlement` (`listing_source = packageDef.category`, live-uniqueness index → 23505 treated as idempotent). Written BEFORE the lane activator. Placement (`placementEligible`) via `activatePlacementForRealPayment`.
* **S5 SUBSCRIPTION** — subscription mode only: `revenueSubscriptionEvents.ts:ensureSubscriptionRecordFromCheckoutSession` → table `leonix_subscription_records`; period end + 7-day grace backstop extend the entitlement (`extendEntitlementForInvoicePaid`).
* **S6 CONSENT** — `recurringConsent.ts:packageRequiresRecurringConsent` = `billingMode === 'monthly_subscription'`; `createRecurringConsentRecord` → table `leonix_billing_consents` BEFORE the Stripe session; 422 `consent_required` / `consent_version_stale`. One-time and free products never require or create it. Client collects it in `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx` (`recurringConsentRequired`).
* **S7 BASE RECHARGE GUARD FAMILY** — server: (a) `requiresBaseCheckout` for the 5 subscription keys; (b) status pre-flights in the checkout route (`autos_listing_not_payable`, `already_published_no_recharge`); (c) Ofertas `entitlement_already_active`; client: `startRevenueCategoryCheckout` (`revenueCategoryCheckoutClient.ts`) turns `active_entitlement_no_recharge` / `already_published_no_recharge` into "your changes are saved", and every listing-bound preview suppresses the base checkout widget (`listingBoundPreview` / `suppressListingBoundCheckout`).

---

## 2. Lane blocks

### 2.1 Servicios — `servicios_base_monthly`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts:saveServiciosPendingBeforeCheckout` → `POST /api/clasificados/servicios/publish` (`app/api/clasificados/servicios/publish/route.ts:POST`, body `activationMode:"pending_payment"`) |
| TABLE | `servicios_public_listings` |
| CANONICAL UUID | row `id` returned by the publish route (`insert … .select("id, leonix_ad_id")`); edits address the declared `existingListingId` / `canonicalListingId` (fail closed `listing_not_found`, never INSERT a replacement) |
| LEONIX AD ID | DB trigger `servicios_public_listings_leonix_ad_id_bi` → `SERV-YYYY-NNNNNN` (`supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql`); returned as `leonixAdId` |
| PREPAY STATUS | `listing_status = pending_payment`, `published_at = null` (`SERVICIOS_LISTING_STATUS_PENDING_PAYMENT`, `revenueServiciosFulfillment.ts:SERVICIOS_PENDING_CHECKOUT_STATUS`) |
| PACKAGE KEY | `servicios_base_monthly` (`SERVICIOS_BASE_CHECKOUT`, `revenueCategoryCheckoutPayload.ts`) |
| CHECKOUT ENTRY | `ClasificadosServiciosPreviewClient.tsx:onCheckout` → `startRevenueCategoryCheckout({...SERVICIOS_BASE_CHECKOUT, listingId})`; dashboard resume re-enters the same checkpoint page (subscription lanes are never started directly from the dashboard: `dashboardPendingPayment.ts` header) |
| OWNER PREFLIGHT | at SAVE: `serviciosOwnerIdFromBearer` + `isServiciosListingOwner` (`serviciosOwnerMutationPolicy.ts`, NULL owner never qualifies). At CHECKOUT: **none** (only `requiresBaseCheckout`, which ignores owner) — **DEFECT D4** |
| STATUS PREFLIGHT | at SAVE: `decideServiciosOwnerSaveStatus` (published never downgraded; Leonix-locked `suspended`/`rejected` refused via `serviciosListingLockedResponse`). At CHECKOUT: **none**. At FULFILMENT: `activatePaidServiciosListingFromRevenueOs` only from `{paused_unpublished, pending_payment}`; `suspended/rejected` ⇒ `unsafe_status` (ok=true, **paid but not published**) — **DEFECT D4** |
| BILLING MODE | `monthly_subscription` |
| CONSENT REQUIREMENT | REQUIRED (S6); client forwards `recurringConsent: ctx.recurringConsent` (`ClasificadosServiciosPreviewClient.tsx`) |
| PAYMENT RECORD | S2 |
| WEBHOOK EVENT | S3 (`checkout.session.completed`) |
| FULFILLMENT FUNCTION | `revenueFulfillment.ts:tryActivateServiciosListingAfterEntitlement` |
| ENTITLEMENT | S4, `package_key=servicios_base_monthly`, category `servicios` |
| SUBSCRIPTION IF REQUIRED | S5 (`leonix_subscription_records`) |
| ACTIVATOR | `revenueServiciosFulfillment.ts:activatePaidServiciosListingFromRevenueOs` (CAS `.in("listing_status", pre-publish set)`); also `grantServiciosOffersAddonEntitlementFromBasePayment` (no-op unless the add-on rode along) |
| POSTPAY STATUS | `listing_status = published`, `published_at` set once |
| PUBLIC PREDICATE | `app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts:listServiciosPublicListingsFromDb` (`ilike listing_status published`); detail `getServiciosPublicListingBySlugFromDb` |
| DASHBOARD PREDICATE | `app/api/clasificados/servicios/my-listings/route.ts` (owner-scoped) → `dashboardInventory.ts:fetchOwnerServiciosListings` + `buildServiciosInventoryItems`; live/pending via `dashboardPendingPayment.ts:dashboardInventoryRowIsPubliclyLive` |
| ADMIN LIVE PREDICATE | `app/admin/_lib/adminLivePredicates.ts:isServiciosRowPubliclyLive` (`listing_status = published`) — agrees with public; SQL `listServiciosPublicListingsAdminQueueFromDb` (`scope=live` ⇒ `.eq("listing_status","published")`) |
| SAME-ROW EDIT PATH | `POST /api/clasificados/servicios/publish` with the declared canonical id (update by `.eq("id", canonicalListingId)`); lifecycle via `app/api/clasificados/servicios/manage/route.ts` |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | (1) `servicios/publish/route.ts` `decideServiciosOwnerSaveStatus` keeps `published` and echoes `pendingPayment:true` only when `actualListingStatus === pending_payment`; (2) server `checkout/route.ts` `requiresBaseCheckout` ⇒ 409 `active_entitlement_no_recharge`; (3) client message mapping in `revenueCategoryCheckoutClient.ts`. Provable: two independent server layers. |

### 2.2 Restaurantes — `restaurantes_base_monthly`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `app/(site)/clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout.ts:saveRestaurantePendingBeforeCheckout` → `POST /api/clasificados/restaurantes/publish` (`activation_mode:"pending_payment"` from `buildRestaurantePublishPayload.ts`); owner edits from the dashboard use `RestauranteApplicationClient.tsx:saveExistingDashboardListing` (same route, no activation_mode, existing row) |
| TABLE | `restaurantes_public_listings` |
| CANONICAL UUID | row `id`; lookup key is `draft_listing_id` (**no unique index** — `PROPOSED_DB_HARDENING §3`); route takes the OLDEST row deterministically and updates by PK (`existingListingId`); first-save race reconciled by `reconcileRestauranteFirstSave` (loser archived) |
| LEONIX AD ID | `app/(site)/clasificados/restaurantes/lib/restaurantesLeonixAdId.ts:allocateNextRestauranteLeonixAdId` → RPC `leonix_allocate_formatted` → `REST-YYYY-NNNNNN` (retry loop on unique violation in the route; BEFORE INSERT trigger `restaurantes_leonix_ad_id_bi` is the backstop) |
| PREPAY STATUS | `pending_payment` (`RESTAURANTE_PENDING_CHECKOUT_STATUS`) |
| PACKAGE KEY | `restaurantes_base_monthly` (`RESTAURANTES_BASE_CHECKOUT`) |
| CHECKOUT ENTRY | `RestaurantePreviewClient.tsx:onCheckout` → `startRevenueCategoryCheckout({...RESTAURANTES_BASE_CHECKOUT, listingId: pending.listingId})` (row id, never the draft id); dashboard resume into the checkpoint: `dashboardPendingPayment.ts:restauranteResumePaymentPreviewHref` |
| OWNER PREFLIGHT | at SAVE: `ownership_mismatch` 403 (`publish/route.ts`, verified bearer id). At CHECKOUT: **none** — **DEFECT D4** |
| STATUS PREFLIGHT | at SAVE: `restauranteOwnerEditStatusAuthority.ts:resolveRestauranteOwnerEditTargetStatus` (an edit may only target the row's OWN status; unknown ⇒ 409) + CAS `.eq("status", targetStatus)`. At CHECKOUT: **none**. At FULFILMENT: activatable set `{archived, pending_payment}` (`RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES`) — `archived` is included (**D9**) |
| BILLING MODE | `monthly_subscription` |
| CONSENT REQUIREMENT | REQUIRED (S6); forwarded `recurringConsent: ctx.recurringConsent` (`RestaurantePreviewClient.tsx`) |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `revenueFulfillment.ts:tryActivateRestauranteListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / S5 (`package_key=restaurantes_base_monthly`) |
| ACTIVATOR | `revenueRestaurantFulfillment.ts:activatePaidRestauranteListingFromRevenueOs` (CAS on status; writes `status=published`, `published_at`) |
| POSTPAY STATUS | `status = published` |
| PUBLIC PREDICATE | `restaurantesPublicListingsServer.ts:tryListRestaurantesPublicListingsFromDb` / `getRestaurantePublicListingBySlugFromDb` (`.eq("status","published")`) |
| DASHBOARD PREDICATE | `dashboardInventory.ts:fetchOwnerRestaurantListings` + `buildRestaurantInventoryItems`; awaiting-payment = `dashboardPendingPayment.ts:isRestauranteAwaitingPayment`; resume goes through the checkpoint (consent) |
| ADMIN LIVE PREDICATE | `adminLivePredicates.ts:isRestauranteRowPubliclyLive` (`status = published`) agrees; SQL `listRestaurantesPublicListingsAdminFromDb` |
| SAME-ROW EDIT PATH | `POST /api/clasificados/restaurantes/publish` existing-row branch (update `.eq("id", existingListingId).eq("status", targetStatus)`) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | (1) `resolveRestauranteOwnerEditTargetStatus` never escalates or downgrades; (2) `requiresBaseCheckout` 409; note route returns `pendingPayment:true` even for a published row (**D10**, UX only — the 409 is what protects). **Base-entitlement guard covers this lane** (`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS`). |
| NEW-ROW FREE PATH | **DEFECT D1** — see below (the route can INSERT `status:"published"` without payment) |

### 2.3 Autos Dealer — `autos_dealer_monthly`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `POST /api/clasificados/autos/listings` (`route.ts:POST` → `autosClassifiedsListingService.ts:createAutosClassifiedsListing`, `status:"draft"`); edits `PATCH /api/clasificados/autos/listings/[id]` (`updateAutosClassifiedsListingDraft`); preview `AutosNegociosPreviewClient.tsx:ensurePendingDealerListing` (PATCH-only when the canonical id is known; fail closed instead of POSTing a duplicate) |
| TABLE | `autos_classifieds_listings` (`lane='negocios'`, `inventory_role='main'|'inventory_vehicle'`) |
| CANONICAL UUID | row `id`; children carry `dealer_inventory_parent_listing_id` |
| LEONIX AD ID | DB trigger `autos_classifieds_listings_leonix_ad_id_bi` → `AUTO-YYYY-NNNNNN` |
| PREPAY STATUS | `draft` at save; the checkout route flips to `pending_payment` AFTER the Stripe session exists: `checkout/route.ts` → `autosClassifiedsListingService.ts:setAutosListingPendingPayment` (status-conditional UPDATE `.in("status", AUTOS_PAYABLE_LISTING_STATUSES)`) |
| PACKAGE KEY | `autos_dealer_monthly` (`AUTOS_DEALER_CHECKOUT`), optional add-on `autos_dealer_inventory_pack_monthly` (`autosDealerSelectedAddOns`) |
| CHECKOUT ENTRY | `AutosNegociosPreviewClient.tsx` (`startRevenueCategoryCheckout`) and `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx` (after `POST /api/clasificados/autos/checkout` with `bypassOnly:true` answers `no_bypass_available`) |
| OWNER PREFLIGHT | `checkout/route.ts` `autos_listing_owner_mismatch` 403 — **only when a bearer is present** (**D3**); listing must exist (`autos_listing_not_found`) |
| STATUS PREFLIGHT | `isAutosListingPayableStatus` (draft / pending_payment / payment_failed) else 409 `autos_listing_not_payable`; lane/role bound: `autos_listing_package_mismatch` (a child vehicle never starts its own base charge) |
| BILLING MODE | `monthly_subscription` |
| CONSENT REQUIREMENT | REQUIRED; `AutosPublishConfirmCore.tsx` `buildRecurringConsentAcknowledgment(lang)` + `recurringConsentChecked` gate, `AutosNegociosPreviewClient.tsx` `ctx.recurringConsent` |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `revenueFulfillment.ts:tryActivateAutosDealerListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / S5 (+ inventory pack entitlement `grantAutosDealerInventoryPackAddOn` when the add-on is in the payment record) |
| ACTIVATOR | `revenueAutosDealerFulfillment.ts:activatePaidAutosDealerListingFromRevenueOs` → `autosClassifiedsListingService.ts:tryActivateAutosListingAfterPayment` → atomic RPC `capacityActivationRpc.ts:activateAutosDealerListingAtomic` (capacity/lifecycle, advisory lock); then staged children `publishNegociosBundleAdditionalVehicles` (resume from N existing children) |
| POSTPAY STATUS | `status='active'`, `published_at`, `stripe_checkout_session_id=null` |
| PUBLIC PREDICATE | `listActiveAutosClassifiedsRows` (`status='active'`) + `filterAutosRowsByActiveParent`/`isAutosChildParentGateSatisfied`; detail bundle `getActiveLiveAutosBundle` |
| DASHBOARD PREDICATE | `dashboardInventory.ts:fetchOwnerAutosClassifiedsListings` + `buildAutosClassifiedsInventoryItems`; `autosClassifiedsRowToDashboardRow`; capacity `getAutosDealerInventorySummaryForOwner` |
| ADMIN LIVE PREDICATE | `app/admin/_lib/adminAutosLivePredicate.ts:isAutosRowPubliclyLive` (active + child-parent gate) agrees |
| SAME-ROW EDIT PATH | `PATCH /api/clasificados/autos/listings/[id]` → `updateAutosClassifiedsListingDraft` (`.eq("id").eq("owner_user_id")`, writes only `listing_payload/lang/updated_at`; allowed for draft/payment_failed/pending_payment and active dealer/privado) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | (1) status pre-flight `autos_listing_not_payable` (an `active` row can never start base checkout); (2) `requiresBaseCheckout(autos_dealer_monthly)` for the pending-with-live-entitlement (grace) case; (3) preview is PATCH-only for a known canonical id. The legacy `/api/clasificados/autos/checkout` has the same `requiresBaseCheckout` guard. **Autos dealer is covered by BOTH the pre-flight and the guard.** |

### 2.4 Autos Privado — `autos_privado_30d`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | same routes as 2.3 (`lane='privado'`); `AutosPrivadoPreviewClient.tsx` / `AutosPublishConfirmCore.tsx` |
| TABLE / UUID / LEONIX AD ID | `autos_classifieds_listings` / row `id` / trigger `AUTO-YYYY-NNNNNN` |
| PREPAY STATUS | `draft` → `pending_payment` (`setAutosListingPendingPayment`) |
| PACKAGE KEY | `autos_privado_30d` (`AUTOS_PRIVADO_CHECKOUT`) |
| CHECKOUT ENTRY | `AutosPrivadoPreviewClient.tsx`; `AutosPublishConfirmCore.tsx` (privado branch calls `startRevenueCategoryCheckout({...AUTOS_PRIVADO_CHECKOUT})` directly); dashboard "Complete payment" `dashboardResumePaymentClient.ts:startDashboardResumePayment` |
| OWNER PREFLIGHT | `autos_listing_owner_mismatch` (bearer present only — **D3**); renewals: `listingRenewalFulfillment.ts:validateAutosPrivadoRenewalCheckoutOwnership` |
| STATUS PREFLIGHT | `autos_listing_not_payable` unless draft/pending_payment/payment_failed; `autos_listing_package_mismatch` if lane ≠ privado |
| BILLING MODE | `one_time` (30 days) |
| CONSENT REQUIREMENT | none (one-time) |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateAutosPrivadoListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 (30-day one-time entitlement) / not applicable |
| ACTIVATOR | `revenueAutosPrivadoFulfillment.ts:activatePaidAutosPrivadoListingFromRevenueOs` → `tryActivateAutosListingAfterPayment` (privado branch, CAS `.in("status", payable)`, `expires_at = computeFixedDayRenewalExpiresAt(+30d)`); renewal: `tryRenewAutosPrivadoListingAfterPayment` |
| POSTPAY STATUS | `active`, `published_at`, `expires_at = +30d` (status never becomes "expired"; expiry is `expires_at` vs now) |
| PUBLIC PREDICATE | `listActiveAutosClassifiedsRows` (active AND privado `expires_at` not elapsed) |
| DASHBOARD PREDICATE | `fetchOwnerAutosClassifiedsListings`; awaiting = `dashboardPendingPayment.ts:isAutosPrivadoAwaitingPayment` |
| ADMIN LIVE PREDICATE | `isAutosRowPubliclyLive` → `isAutosRowLiveRowLevel` (active + privado expiry) agrees |
| SAME-ROW EDIT PATH | `PATCH /api/clasificados/autos/listings/[id]` (active privado is editable in place: `negociosActiveEditable` covers both lanes) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | `autos_listing_not_payable` (409) for an `active` row. Note the checkout client only recognises `active_entitlement_no_recharge` / `already_published_no_recharge`; `autos_listing_not_payable` surfaces as a generic error (**D10**, UX only). Privado is NOT in `REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` (one-time), so the status pre-flight is the only guard. |

### 2.5 Empleos Quick — `empleos_job_post_paid`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `empleosRevenueCheckout.ts:saveEmpleosDraftAndStartPaidJobCheckout` → `POST /api/clasificados/empleos/listings` (`mode:"draft"`) → `empleosPublicListingsDbServer.ts:upsertEmpleosListingFromEnvelope` |
| TABLE | `empleos_public_listings` (`lane` ∈ quick/premium/feria) |
| CANONICAL UUID | envelope `listingId` (fail closed `QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE` for a non-UUID / non-existent id) else `crypto.randomUUID()`; client remembers it in `empleosPendingCheckoutIdentity` (session) and reuses it |
| LEONIX AD ID | DB trigger `empleos_public_listings_leonix_ad_id_bi` → `JOB-YYYY-NNNNNN`; read back client-side if the save response lacks it |
| PREPAY STATUS | `lifecycle_status = draft` (`EMPLEOS_PENDING_CHECKOUT_STATUS`) |
| PACKAGE KEY | `empleos_job_post_paid` (`EMPLEOS_PAID_JOB_CHECKOUT`) |
| CHECKOUT ENTRY | `EmpleoQuickPreviewClient.tsx` (line ~153) → `saveEmpleosDraftAndStartPaidJobCheckout`; dashboard resume `startDashboardResumePayment(lane:"empleos")` |
| OWNER PREFLIGHT | `checkout/route.ts` Empleos block: `empleos_listing_owner_mismatch` 403 (**bearer present only — D3**), `empleos_listing_not_found` 404 |
| STATUS PREFLIGHT | `lifecycle_status` must be `draft`, else 409 `already_published_no_recharge` |
| BILLING MODE | `one_time` |
| CONSENT REQUIREMENT | none |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateEmpleosListingAfterEntitlement` |
| ENTITLEMENT | S4 (30-day one-time) — **not read by any public reader** (D2) |
| SUBSCRIPTION IF REQUIRED | not applicable |
| ACTIVATOR | `revenueEmpleosFulfillment.ts:activatePaidEmpleosListingFromRevenueOs` (CAS `.eq("lifecycle_status","draft")`; `published`, or `pending_review` when `EMPLEOS_REQUIRE_LISTING_REVIEW=1`; syncs `listing_snapshot`) |
| POSTPAY STATUS | `published` (`published_at` set). **No `expires_at`** — **DEFECT D2** |
| PUBLIC PREDICATE | `fetchEmpleosPublishedJobRecords` / `fetchEmpleosPublishedListingRowBySlug` (`lifecycle_status = published` only) |
| DASHBOARD PREDICATE | `fetchOwnerEmpleosListings` + `buildEmpleosInventoryItems`; `isEmpleosDraftAwaitingPayment` |
| ADMIN LIVE PREDICATE | `isEmpleosRowPubliclyLive` (`lifecycle_status = published`) agrees (incl. the D2 gap) |
| SAME-ROW EDIT PATH | envelope POST with the row's id (`upsertEmpleosListingFromEnvelope`; draft mode never demotes: `empleosPublishLifecyclePolicy.ts:resolveEmpleosUpsertLifecycle`); lifecycle `PATCH /api/clasificados/empleos/listings/[listingId]` (`resolveEmpleosOwnerTransition`) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | server: only `draft` may pay (`already_published_no_recharge`) + policy never publishes a paid lane (`payment_required`); client: `EmpleoQuickPreviewClient` `suppressListingBoundCheckout`, and the edit hands the row id to checkout. Empleos is NOT in the shared entitlement guard (one-time) so the status pre-flight is the guard. |

### 2.6 Empleos Premium — `empleos_job_post_paid` (same package)

Every field is identical to 2.5 with these differences only: entry `EmpleoPremiumPreviewClient.tsx` (line ~148) with `buildEmpleosPublishEnvelopeFromPremium`; `lane = 'premium'`; **no distinct package, price or activator** (same `activatePaidEmpleosListingFromRevenueOs`; `listing_tier`/`premium_employer` are content columns). If a Premium price is intended, that is an OWNER DECISION — nothing in source sells one. Same D2 (no term).

### 2.7 Rentas — `rentas_30d`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts:publishLeonixRealEstateListingCore` (client-direct `insertListingsRowResilient` into `listings`, `activationMode:"pending_payment"`), from `RentasPrivadoPreviewClient.tsx` / `RentasNegocioPreviewClient.tsx` |
| TABLE | `listings` (`category='rentas'`) |
| CANONICAL UUID | `listings.id`; pending-row reuse is draft-key first, then declared id, title last (`realEstatePendingLookupOrder`, `pickAdoptableRealEstatePendingRow`); a failed lookup is a hard stop (no INSERT) |
| LEONIX AD ID | DB trigger `listings_leonix_ad_id_bi` via `leonix_listings_prefix('rentas')` → `RENT-YYYY-NNNNNN` |
| PREPAY STATUS | `status='pending'`, `is_published=false` (`buildListingsInsertRowForLeonixPublish`) |
| PACKAGE KEY | `rentas_30d` (`RENTAS_CATEGORY_CHECKOUT`) |
| CHECKOUT ENTRY | `RentasPrivadoPreviewClient.tsx` / `RentasNegocioPreviewClient.tsx`; dashboard `dashboardResumePaymentClient.ts:startDashboardResumePayment(lane:"rentas")`; renewal `listingRenewalCheckout.ts` (`operation:"renew_listing"`) |
| OWNER PREFLIGHT | `checkout/route.ts` shared-listings block: `listing_owner_mismatch` 403 (**bearer present only — D3**); renewal: `validateRentasRenewalCheckoutOwnership` (always) |
| STATUS PREFLIGHT | category must be `rentas` (`listing_not_found` 404); `status='pending'` and `is_published !== true` else 409 `already_published_no_recharge` |
| BILLING MODE / CONSENT | `one_time` / none |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateRentasListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / not applicable |
| ACTIVATOR | `revenueRentasFulfillment.ts:activatePaidRentasListingFromRevenueOs` (CAS `status=pending AND is_published=false`; renewal path CAS `status IN (active, expired)`) |
| POSTPAY STATUS | `status='active'`, `is_published=true`, `published_at`, `expires_at=+30d` (`computeFixedDayRenewalExpiresAt`) |
| PUBLIC PREDICATE | `app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts` + `rentasPublicRowVisibility.ts` + `mapListingRowToRentasPublicListing.ts` → `resolveListingLifecycle` (`expires_at` REQUIRED) and machine availability not `rentado/bajo_contrato`; detail `fetchRentasListingForPublicDetail.ts` |
| DASHBOARD PREDICATE | `app/(site)/dashboard/mis-anuncios/page.tsx` owner query on `listings` + `dashboardPendingPayment.ts:isSharedListingsRowNotLive` / `resolveSharedListingPaymentLane` |
| ADMIN LIVE PREDICATE | `adminLivePredicates.ts:isRentasRowPubliclyLive` (same lifecycle + availability) agrees |
| SAME-ROW EDIT PATH | `POST /api/clasificados/rentas/listing-edit` (owner + category + lane + Leonix-ID match; patch never contains `status/is_published/expires_at`) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | `checkout/route.ts` `already_published_no_recharge` (only an owned `pending`, unpublished row of category rentas may start a NEW base payment); `listing-edit` never writes status; client Republish is limited to live rows (`renewListingsTableRepublish` → `listingsRowIsPublicLive`). Residual: DB owner UPDATE policy open (**D7**). |

### 2.8 Bienes Raíces Negocio — `br_agent_monthly` (Agente Individual residencial)

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `AgenteIndividualResidencialPreviewClient.tsx:onPublishLive` → `publishLeonixListingFromAgenteResidencialDraft` → `publishLeonixRealEstateListingCore` (`activationMode:"pending_payment"`, `seller_type='business'`, `inventory_role='main'`); child rows `publishBrAgenteInventoryBundlePendingRows` |
| TABLE | `listings` (`category='bienes-raices'`, `seller_type='business'`) |
| CANONICAL UUID | `listings.id`; parent group id = parent id; reuse via draft key (`REAL_ESTATE_DRAFT_KEY_FILTER_COLUMN`) |
| LEONIX AD ID | DB trigger via `leonix_listings_prefix('bienes-raices')` → `BR-YYYY-NNNNNN` |
| PREPAY STATUS | `status='pending'`, `is_published=false` |
| PACKAGE KEY | `br_agent_monthly` (`BIENES_RAICES_NEGOCIO_CHECKOUT`) (+ add-on `br_inventory_pack_monthly` when children were staged) |
| CHECKOUT ENTRY | `AgenteIndividualResidencialPreviewClient.tsx` (`startRevenueCategoryCheckout`, `recurringConsent: ctx?.recurringConsent`); dashboard add-on `bienesDashboardInventoryAddonCheckout.ts` |
| OWNER PREFLIGHT | **none at checkout** (no BR block in `checkout/route.ts` besides `requiresBaseCheckout`, which ignores owner) — **DEFECT D4**. Fulfilment `activatePaidBienesNegocioListingFromRevenueOs` also does not compare payment owner to row owner. |
| STATUS PREFLIGHT | **none at checkout** — **DEFECT D4** (see "br_agent_monthly pre-flight coverage" below). Fulfilment: only `pending & !published`; `removed/flagged` ⇒ `unsafe_status` ok=true (paid, not published); any other non-pending status ⇒ `unsafe_status` **ok=false** ⇒ webhook 422 `failed_retryable` after the charge |
| BILLING MODE | `monthly_subscription` |
| CONSENT REQUIREMENT | REQUIRED (S6), forwarded from the checkpoint |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateBienesNegocioListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / S5 (`package_key=br_agent_monthly`); pack add-on read via `readBienesInventoryPackPaidFromPaymentRecord` |
| ACTIVATOR | `revenueBienesNegocioFulfillment.ts:activatePaidBienesNegocioListingFromRevenueOs` → `brListingPaymentService.ts:tryActivateBrListingAfterPayment` → atomic RPC `capacityActivationRpc.ts:activateBrNegocioListingAtomic` (`activateInventorySiblings` only when the pack was paid) |
| POSTPAY STATUS | `status='active'`, `is_published=true` |
| PUBLIC PREDICATE | `bienes-raices/lib/fetchBrPublishedListingsBrowser.ts` / `brPublishedListingsServer.ts` (`is_published=true AND status=active`, `isListingRowActiveAndPublishedForBrowse`) + child gate `brPublicChildParentVisibility.ts:isBrChildParentGateSatisfied` |
| DASHBOARD PREDICATE | `mis-anuncios/page.tsx` owner query + `isBrNegocioListing`, server lifecycle `callBrLifecycleMutation` (`app/api/clasificados/bienes-raices/listing-lifecycle/route.ts`) |
| ADMIN LIVE PREDICATE | `adminLivePredicates.ts:isBrRowPubliclyLive` (parent gate when `parentsById` supplied) agrees |
| SAME-ROW EDIT PATH | `POST /api/clasificados/bienes-raices/listing-edit` (owner/category/lane/Leonix-ID match; parent + children) from the application form (`bienesDashboardListingEditWorkspace.ts`) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | (1) `requiresBaseCheckout(br_agent_monthly)` 409 `active_entitlement_no_recharge` — **the guard covers `br_agent_monthly`** (`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS`); (2) listing-bound preview suppresses the checkout widget (`checkpointConfig` returns null when `listingBoundPreview`; `onPublishLive` refuses with "edit and save from the application form"); (3) `listing-edit` never writes status. |

**br_agent_monthly pre-flight coverage (answer):** the shared entitlement guard covers only "an ACTIVE `br_agent_monthly` entitlement already exists for this listing id". It does NOT verify owner, category, `seller_type='business'`, `inventory_role`, or `status='pending'` (Autos and the one-time lanes have such blocks; BR Negocio does not). Consequences (all need a crafted or stale request; the UI path is correct): (a) pay for someone else's pending listing (attaches the entitlement/subscription to it); (b) pay for a Rentas/FSBO row id ⇒ `wrong_category`/`wrong_lane` (ok=true, no activation, subscription charged for nothing); (c) an owner's `paused/expired` negocio parent with a lapsed entitlement pays again ⇒ fulfilment `unsafe_status` ok=false ⇒ the webhook answers 422 `failed_retryable` and Stripe retries forever while the customer is charged. See D4.

### 2.9 Bienes Raíces Privado / FSBO — `br_fsbo_45d`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `BienesRaicesPrivadoPreviewClient.tsx:savePendingFsboListing` → `publishLeonixRealEstateListingCore` (`pending_payment`, `seller_type='personal'`); FSBO reuse id is session-scoped (`BR_FSBO_PENDING_CHECKOUT_KEY`) + draft key |
| TABLE / UUID | `listings` (`category='bienes-raices'`, FSBO discriminator `bienesFsboLifecycle.ts:isBrFsboRow`) / `listings.id` |
| LEONIX AD ID | trigger `BR-YYYY-NNNNNN` |
| PREPAY STATUS | `pending`, `is_published=false` |
| PACKAGE KEY | `br_fsbo_45d` (`BIENES_RAICES_FSBO_CHECKOUT`) |
| CHECKOUT ENTRY | `BienesRaicesPrivadoPreviewClient.tsx:onStartFsboCheckout`; dashboard resume (lane `bienes-raices-fsbo`); renewal `startBienesFsboRenewal` |
| OWNER PREFLIGHT | `listing_owner_mismatch` (bearer only — D3); renewal `validateBienesFsboRenewalCheckoutOwnership` |
| STATUS PREFLIGHT | category `bienes-raices` AND `isBrFsboRow` (else 404) AND `status='pending'`, `!is_published` else `already_published_no_recharge` |
| BILLING MODE / CONSENT | `one_time` / none |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateBienesFsboListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / not applicable |
| ACTIVATOR | `revenueBienesFsboFulfillment.ts:activatePaidBienesFsboListingFromRevenueOs` (CAS; renewal branch extends `expires_at` only) |
| POSTPAY STATUS | `active`, `is_published=true`, `expires_at = +45d` |
| PUBLIC PREDICATE | browse/detail `isBrFsboRowWithinTerm` (`bienesFsboLifecycle.ts`) in `fetchBrPublishedListingsBrowser.ts`, `mapBrListingRowToCard.ts`, `anuncio/[id]/page.tsx` |
| DASHBOARD PREDICATE | `mis-anuncios/page.tsx` + `isSharedListingsRowNotLive`; FSBO status server route `app/api/clasificados/bienes-raices/privado-status/route.ts` (`brFsboOwnerStatusAuthority`) |
| ADMIN LIVE PREDICATE | `isBrRowPubliclyLive` (FSBO term) agrees |
| SAME-ROW EDIT PATH | `/dashboard/mis-anuncios/[id]/editar` (`applyOwnerListingPatch`, UPDATE `listings … WHERE id`; status changes go through `privado-status` for FSBO) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | `already_published_no_recharge` (only owned pending FSBO row); edit page never calls checkout; listing-bound preview suppresses checkout (`previewModeSuppressesBasePlanCheckout`). Residual D7 (DB policy). |

### 2.10 Clases paid — `clases_paid_30d`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts:publishCommunityQuickToListings` (`activationMode:"pending_payment"`, client-direct into `listings`) from `CommunityQuickPreviewPublishBar.tsx:handlePublish` when `classCostType === "pagada"` |
| TABLE / UUID | `listings` (`category='clases'`) / `listings.id` (reuse: `verifyQuickListingReusable`; session id `COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS`; `publish_attempt_key` idempotency — **column missing in prod**, `PROPOSED_DB_HARDENING §2`) |
| LEONIX AD ID | trigger `CLASS-YYYY-NNNNNN` |
| PREPAY STATUS | `pending`, `is_published=false` |
| PACKAGE KEY | `clases_paid_30d` (`CLASES_CATEGORY_CHECKOUT`) |
| CHECKOUT ENTRY | `CommunityQuickPreviewPublishBar.tsx:handlePublish` (only `isPaidClases`); dashboard resume (lane `clases`) |
| OWNER PREFLIGHT | `listing_owner_mismatch` (bearer only — D3) |
| STATUS PREFLIGHT | category `clases` (else 404); `pending` & unpublished else `already_published_no_recharge`; client refuses a live row ("Esta clase ya está publicada y pagada") |
| BILLING MODE / CONSENT | `one_time` / none |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateClasesListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / not applicable |
| ACTIVATOR | `revenueClasesFulfillment.ts:activatePaidClasesListingFromRevenueOs` (CAS `pending & !is_published`) |
| POSTPAY STATUS | `active`, `is_published=true`, `expires_at=+30d` |
| PUBLIC PREDICATE | `communityListingsBrowseClient.ts` + `anuncio/[id]/page.tsx` via `enforcedTermReadPredicate.ts:isListingRowWithinEnforcedTerm` (`is_published=true`, status active\|sold, paid term not elapsed) |
| DASHBOARD PREDICATE | `mis-anuncios/page.tsx` + `resolveSharedListingPaymentLane` (lane `clases`) |
| ADMIN LIVE PREDICATE | `isGenericListingPubliclyLive('clases')` agrees (active\|sold + term) |
| SAME-ROW EDIT PATH | `/dashboard/mis-anuncios/[id]/editar` (`applyOwnerListingPatch`, UPDATE by id) |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | server `already_published_no_recharge`; client publisher refuses active+published; edit page never calls checkout. **Renewal: no path in source (D6).** |

### 2.11 Comida Local — `comida_local_base_monthly`

| Field | Value / evidence |
|---|---|
| APPLICATION SAVE | `app/(site)/clasificados/comida-local/lib/saveComidaLocalPendingBeforeCheckout.ts` → `POST /api/clasificados/comida-local/publish` (`app/api/clasificados/comida-local/publish/route.ts:POST`, `activationMode:"pending_payment"`) |
| TABLE | `comida_local_public_listings` |
| CANONICAL UUID | row `id`; key `draft_listing_id` **with a unique index** (`comida_local_public_listings_…`, migration `20260604120000_comida_local_public_listings.sql`); edit branch updates `.eq("draft_listing_id").eq("status", targetStatus)` (CAS) |
| LEONIX AD ID | `app/lib/clasificados/comida-local/comidaLocalLeonixAdId.ts:allocateNextComidaLocalLeonixAdId` → RPC `leonix_allocate_formatted` → `COMIDA-YYYY-NNNNNN` (+ trigger `comida_local_leonix_ad_id_bi`, unique index `comida_local_public_listings_leonix_ad_id_uidx`); retained on edit |
| PREPAY STATUS | `pending_payment` (`COMIDA_LOCAL_PENDING_CHECKOUT_STATUS`) |
| PACKAGE KEY | `comida_local_base_monthly` (`COMIDA_LOCAL_BASE_CHECKOUT`) |
| CHECKOUT ENTRY | `ComidaLocalPreviewClient.tsx` (`startRevenueCategoryCheckout`, line ~265 forwards `recurringConsent: ctx.recurringConsent ?? null`); dashboard resume re-enters the preview/checkpoint |
| OWNER PREFLIGHT | at SAVE: `ownership_mismatch` 403 when the row has an owner (legacy ownerless rows remain claimable — D11). At CHECKOUT: **none** — D4 |
| STATUS PREFLIGHT | at SAVE: `comidaLocalOwnerEditStatusAuthority.ts:resolveComidaLocalOwnerEditTargetStatus` (fails closed; edit targets only the row's own status). At CHECKOUT: **none**. At FULFILMENT: activatable `{draft, pending_payment}`; `suspended/paused` ⇒ `unsafe_status` ok=true (paid, not published) — D4 |
| BILLING MODE | `monthly_subscription` |
| CONSENT REQUIREMENT | REQUIRED (S6). **Verified filled:** `ComidaLocalPreviewClient.tsx` forwards it (closeout defect #5 fixed; before, subscription checkout got 422 `consent_required`) |
| PAYMENT RECORD / WEBHOOK EVENT | S2 / S3 |
| FULFILLMENT FUNCTION | `tryActivateComidaLocalListingAfterEntitlement` |
| ENTITLEMENT / SUBSCRIPTION | S4 / S5 (`package_key=comida_local_base_monthly`, no coupons capability) |
| ACTIVATOR | `revenueComidaLocalFulfillment.ts:activatePaidComidaLocalListingFromRevenueOs` (CAS; sets `status=published`, `payment_status=paid`, `published_at`) |
| POSTPAY STATUS | `status='published'`, `payment_status='paid'` |
| PUBLIC PREDICATE | `comidaLocalPublicQueries.ts:listPublishedComidaLocalListings` / `getPublishedComidaLocalListingBySlug` (`status = published`) |
| DASHBOARD PREDICATE | `comidaLocalDashboardQueries.ts:listUserComidaLocalListings` (`owner_user_id`); pending resume on the same row |
| ADMIN LIVE PREDICATE | `isComidaLocalRowPubliclyLive` (`status = published`) agrees |
| SAME-ROW EDIT PATH | `POST /api/clasificados/comida-local/publish` existing-row branch; lifecycle `app/api/clasificados/comida-local/lifecycle/route.ts` |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | (1) `requiresBaseCheckout(comida_local_base_monthly)` 409; (2) `resolveComidaLocalOwnerEditTargetStatus` (an edit never regresses a published row to pending_payment); (3) a brand-new row without `pending_payment` is refused `payment_required` 402 (`publish/route.ts` ~line 289). |

### 2.12 Ofertas Locales — flyer (`ofertas_locales_flyer_30d`, $399) and coupons (`ofertas_locales_coupons_30d`)

Payment for Ofertas is recorded in the SAME `leonix_payment_records` ledger (category `ofertas-locales`, S2), plus a commercial summary on the parent row (`ofertas_locales.payment_status / payment_record_id / stripe_checkout_session_id / package_entitlement_id / entitlement_status / entitlement_ends_at / commercial_*`), written by `ofertasLocalesCommercialServer.ts:markOfertaLocalCheckoutStarted` (pending) and `markOfertaLocalEntitlementFulfilled` (paid). Entitlement (S4): `listing_source = "ofertas-locales"`.

| Field | Flyer | Coupons |
|---|---|---|
| APPLICATION SAVE | `app/api/ofertas-locales/scan-prep/route.ts` (declared id) / `publish/route.ts` / `items` routes; preview `OfertasLocalesPreviewCard.tsx` | same (manual entry, no AI) |
| TABLE | `ofertas_locales` (+ `oferta_local_ai_scan_items`) | same |
| CANONICAL UUID | `ofertas_locales.id` (declared id) | same |
| LEONIX AD ID | `ofertasLocalesLeonixAdId.ts:ensureOfertaLocalLeonixAdId` → `LNX-XXXXXXXX` (app-generated, collision retry; `OFERTA_LOCAL_LEONIX_AD_ID_PATTERN`) | same |
| PREPAY STATUS | `draft/submitted/pending_review/rejected` (`CHECKOUT_ELIGIBLE_STATUSES`) with `payment_status='pending'`, `entitlement_status='pending'` after `markOfertaLocalCheckoutStarted` | same |
| PACKAGE KEY | `ofertas_locales_flyer_30d` | `ofertas_locales_coupons_30d` |
| CHECKOUT ENTRY | `app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx:handleContinue` (`offer.commercialProductKey`, gated by `offer.checkoutEligible`) | **no UI reaches it** (constant `OFERTAS_LOCALES_COUPONS_CHECKOUT` unused); server still accepts it — **D5** |
| OWNER PREFLIGHT | `validateOfertasLocalesCheckoutOwnership` (401 without bearer, `listing_owner_mismatch` 403) — **enforced, no bearer bypass** | same |
| STATUS PREFLIGHT | `listing_not_checkout_eligible` unless status ∈ CHECKOUT_ELIGIBLE (includes `rejected`, see D5); `package_listing_mismatch` (`ofertaLocalCommercialProductMatchesOfferType`); `entitlement_already_active` | same |
| BILLING MODE / CONSENT | `one_time` / none | `one_time` (matrix) / none |
| WEBHOOK EVENT | S3 + Ofertas metadata contract check (`ofertas_metadata_contract_mismatch`) | same |
| FULFILLMENT FUNCTION | `revenueFulfillment.ts:tryFulfillOfertasLocalesParentAfterEntitlement` | same (no auto-activation) |
| ENTITLEMENT / SUBSCRIPTION | S4 / not applicable | same |
| ACTIVATOR | `ofertasLocalesAdminReviewMutations.ts:tryAutoActivateOfertaLocalAfterPayment` → `mutateOfertaLocalAdminReview(…,"approve")` (same preconditions as staff approval: items reviewed, source version ready) | none — free lane submits for staff review (`validateOfertaLocalSubmissionEntitlement` returns `source:"free"` when catalog `amountCents === 0`) |
| POSTPAY STATUS | `approved`, `published_at`, `expires_at` (30-day public term), `payment_status='paid'` | `approved` after STAFF approval |
| PUBLIC PREDICATE | `ofertasLocalesPublicOfferHelpers.ts:isOfertaLocalPublicOfferRowEligible` (approved, term active, coupon valid dates, `public_source_asset_id`, asset lifecycle `current`) via `app/api/ofertas-locales/public-offers/route.ts` | same |
| DASHBOARD PREDICATE | `app/(site)/dashboard/ofertas-locales/page.tsx` (`offerChipStatus`, owner `ofertas_locales` query) | same |
| ADMIN LIVE PREDICATE | `adminOfertasLivePredicate.ts:isOfertaPubliclyLive` (= the public helper, incl. expiry) agrees | same |
| SAME-ROW EDIT PATH | `app/api/ofertas-locales/owner/[id]/route.ts` (+ `source-assets`, `items/[itemId]`) | same |
| BASE RECHARGE ON ORDINARY EDIT = FALSE | `entitlement_already_active` 409 (active equivalent entitlement or paid+active parent); renewal only through `operation:"renew_listing"` gated by `resolveOfertaLocalRenewalEligibility` | n/a |

Viajes: no payment product. `viajes_business_monthly` is in the matrix and copy but `checkout/route.ts` returns 422 `viajes_checkout_not_available`; publication is staff approval of `viajes_staged_listings`. Not a paid lane.

---

## 3. Defects found

Severity scale: HIGH = revenue bypass or money-for-nothing reachable by a logged-in user; MED = needs a crafted/stale request or systemic leakage; LOW = UX / hygiene.

| ID | Sev | Where (file:function) | Scenario | Minimal fix |
|---|---|---|---|---|
| **D1** | **HIGH** | `app/api/clasificados/restaurantes/publish/route.ts:POST`, new-row branch (~lines 553-561: `status: pendingPayment ? RESTAURANTE_PENDING_CHECKOUT_STATUS : "published"`) | Any authenticated user POSTs a fresh `draftListingId` WITHOUT `activation_mode` and gets a `restaurantes_public_listings` row inserted `status:"published"` — a public Restaurantes listing with no $399 payment, entitlement or subscription. Restaurantes is "always paid" (`docs/category-ad-plan-rules.md:20`; matrix has no free product). The UI never does this (only `saveExistingDashboardListing` posts without the flag, always for an existing row), so it is a server-side authority gap. Closeout §6 "Verified NOT defects" records the opposite; that conclusion is about the UI, not the route. | In the `else` (no existing row) branch, before insert: `if (!pendingPayment) return NextResponse.json({ ok:false, error:"payment_required" }, { status: 402 });` — exactly the Comida Local guard (`comida-local/publish/route.ts` ~line 289). Existing-row edits are unaffected. |
| **D2** | **MED-HIGH** | `app/lib/listingPlans/revenueEmpleosFulfillment.ts:activatePaidEmpleosListingFromRevenueOs`; readers `empleosPublicListingsDbServer.ts:fetchEmpleosPublishedJobRecords`, `fetchEmpleosPublishedListingRowBySlug`; `adminLivePredicates.ts:isEmpleosRowPubliclyLive` | "$24.99 por 30 días" (copy in `EmpleosPublicarHubClient.tsx`, `publicar/empleos/page.tsx`) but `empleos_public_listings` has no `expires_at` (`20260410210000_empleos_public_listings.sql`), activation stamps only `published_at`, and no reader/sweeper expires a published post; the one-time entitlement is not consulted. A paid post stays live forever. There is also no renewal path (checkout accepts only `draft`; `renew_listing` is Rentas/Autos Privado/FSBO/Ofertas only). | Add `expires_at timestamptz` (owner-applied migration) set at activation (`patch.expires_at = now+30d`, non-feria lanes) and filter both readers + `isEmpleosRowPubliclyLive` with `(expires_at is null or expires_at > now)`; add `empleos` to the renewal checkout (`listingRenewalCheckout`/`Fulfillment`). Interim source-only: treat `published_at < now-30d` as expired for lanes quick/premium in the same three places. |
| **D3** | MED | `app/api/revenue-os/checkout/route.ts:POST` (`ownerUserId = bearerUserId || body.ownerUserId?.trim() || null`; every owner pre-flight is `if (bearerUserId && row.owner !== bearerUserId)`) | The route accepts unauthenticated requests. With no bearer, ALL owner pre-flights (Autos, Empleos, Rentas/FSBO/Clases) are skipped and a caller-chosen `body.ownerUserId` becomes the payment/consent owner (a forged `leonix_billing_consents` row attributed to a victim id is possible for subscription packages; the payer is whoever holds the card). `buildRevenueCategoryCheckoutBody` never sends `ownerUserId`, and `startRevenueCategoryCheckout` refuses without a session, so no legitimate caller needs this. | At the top of `POST` (after JSON parse): `if (!bearerUserId) return 401 auth_required`, and drop `body.ownerUserId` (`const ownerUserId = bearerUserId`). |
| **D4** | MED | `checkout/route.ts:POST` (no dedicated pre-flight for `servicios_base_monthly`, `restaurantes_base_monthly`, `comida_local_base_monthly`, `br_agent_monthly`) ; fulfilment `activatePaidBienesNegocioListingFromRevenueOs` | Only the `requiresBaseCheckout` entitlement guard runs. No owner, category, seller_type/role or status check. (a) Charge for a listing the fulfilment will not publish (`suspended/rejected/removed/flagged/paused`, wrong category/lane): entitlement + subscription are created, listing stays hidden, money taken. (b) BR Negocio in a non-pending/non-active status returns `unsafe_status` ok=false ⇒ webhook 422 `failed_retryable`, Stripe redelivers indefinitely. (c) Another user's pending listing can be paid for and the subscription/entitlement lands on it. | Add one pre-flight block per lane mirroring the Empleos/`listings` blocks: read the row (`servicios_public_listings.listing_status`, `restaurantes_public_listings.status`, `comida_local_public_listings.status`, `listings` for BR with `seller_type='business'`, `inventory_role in (main,null)`), require owner match and status ∈ the activator's activatable set (or `published` handled by the guard); else 404/403/409. |
| **D5** | LOW-MED | `revenuePricingMatrix.ts` (`ofertas_locales_coupons_30d`: `stripeEligible:true`, $199) vs `ofertasLocalesConstants.ts:OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 0` / `validateOfertaLocalSubmissionEntitlement` (`source:"free"`); `ofertasLocalesCommercialServer.ts:CHECKOUT_ELIGIBLE_STATUSES` vs `ofertasLocalesAdminReviewMutations.ts:APPROVE_FROM` | (a) A coupons owner can be sent through Stripe for $199 by a direct API call — for a product the catalog says is free (`isOfertasLocalesCheckoutEarly` accepts both keys). (b) `rejected` is checkout-eligible but auto-activation only approves from `pending_review/submitted/draft`, so a staff-rejected flyer that pays $399 gets an entitlement and `unsafe_status` (logged as ignored) and never publishes. | (a) Set `stripeEligible:false` on the coupons matrix entry or refuse in the Ofertas early block when the catalog `amountCents === 0`; (b) remove `rejected` from `CHECKOUT_ELIGIBLE_STATUSES` (payment before resubmission) or block payment while a staff rejection stands. |
| **D6** | LOW-MED | `listingRenewalCheckout.ts` / `listingRenewalFulfillment.ts` (no `clases`); `checkout/route.ts` shared-listings pre-flight (`status='pending'` only) | Clases paid is a 30-day product with term enforcement (`isListingRowWithinEnforcedTerm`) but no renewal path: after expiry the same row can never be paid again (only `pending` rows may start payment), so the owner must create a new listing (new UUID + Leonix ID). Separately, paid-vs-free Clases is the client draft field `classCostType === "pagada"` (`publishCommunityQuickToListings.ts:184` is client code): a poster can label a paid class "gratis" and publish free (DB trigger in `PROPOSED_DB_HARDENING §1` cannot distinguish). | Add `clases` renewal (`operation:"renew_listing"`, same-row `expires_at` extension) mirroring Rentas; the free/paid labelling is an OWNER DECISION (only reviewable by moderation). |
| **D7** | MED (known, DB) | `public.listings` RLS: owner UPDATE policy without column limit; INSERT unrestricted on status (`PROPOSED_DB_HARDENING_2026-09.md §1`, NOT applied) | Any signed-in owner can create/flip their own Rentas / Bienes Raíces / Clases row to `active`/`is_published=true` directly through the anon API, bypassing Revenue OS for all four `listings`-based paid lanes. Source-side client bypasses are already closed. | Owner applies the proposed `listings_guard_paid_lane_owner_activation` trigger (§1) and the §2 `publish_attempt_key` migration; also extend the trigger to free-lane moderation states (see F3 in `FREE_CIRCUIT_MATRIX_2026-09.md`). Not source-fixable here. |
| **D8** | LOW | `app/api/clasificados/autos/checkout/route.ts:POST` (legacy env-price branch, `getStripePriceIdForAutosLane`); `autosNegociosQaPublishAllowlist.ts` | If `STRIPE_PRICE_AUTOS_NEGOCIOS/PRIVADO` are set, an owner can call this route directly (without `bypassOnly`) and open a legacy one-time Stripe session outside the Revenue OS ledger (no payment record, entitlement, consent or subscription; the legacy webhook `app/api/clasificados/autos/stripe/webhook/route.ts` activates it). Also `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST` lets an allowlisted owner publish Autos Negocios without Stripe in production (by design; `VERCEL_ENV==='production'` blocks only the two `*_BYPASS` flags). | Verify both env price vars and the QA allowlist are UNSET in production; otherwise return 410 for the non-bypass branch. |
| **D9** | LOW | `revenueRestaurantFulfillment.ts:RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES` (includes `archived`) | A staff-archived Restaurantes listing whose entitlement has lapsed is re-published by a new payment (fulfilment does not distinguish owner-archive from moderation archive). While the entitlement is active, `requiresBaseCheckout` blocks it. | Activate only from `pending_payment`, or from `archived` only when no staff marker exists (mirror Empleos/Autos `suspended_reason`). |
| **D10** | LOW (UX) | `revenueCategoryCheckoutClient.ts:startRevenueCategoryCheckout` (recognises only `active_entitlement_no_recharge`/`already_published_no_recharge`); `restaurantes/publish/route.ts` (returns `pendingPayment:true` for a published row) | `autos_listing_not_payable`, `entitlement_already_active`, `listing_not_checkout_eligible` show the generic "could not start secure payment" instead of "your changes are saved". The server still blocks the charge in every case. | Add the three codes to the "changes saved" branch; return the real status from the Restaurantes route like Servicios does. |
| **D11** | LOW | `comida-local/publish/route.ts:POST` (~lines 169-178: "legacy ownerless rows keep their prior claimable behaviour") | Anyone who knows an ownerless legacy Comida Local row's `draft_listing_id` can edit/claim it — the existing-row branch neither requires a bearer nor an owner when the row has none (a new row is refused: `payment_required` 402 / `auth_required` 401). | Count ownerless rows; if zero (or after backfill) require a bearer and an owner match unconditionally. |
| **D12** | INFO | `app/api/clasificados/servicios/lib/serviciosPublishServerAuth.ts:isServiciosStrictPublishEnvironment` (`VERCEL_ENV==='production'` or `SERVICIOS_STRICT_PUBLISH=1`); same pattern `restaurantes/publish/route.ts:isRestaurantesStrictPublishEnvironment` | Non-production deployments (Vercel preview/dev) publish Servicios and Restaurantes immediately for free (Servicios `initialListingStatus()`, Restaurantes D1 path, bearer optional); safe only if previews never share the production database. | Confirm preview envs use a separate Supabase project or set `SERVICIOS_STRICT_PUBLISH=1` / `RESTAURANTES_STRICT_PUBLISH=1` there. |
| **D13** | **HIGH** | Empleos lane forgery (see **F1** in `FREE_CIRCUIT_MATRIX_2026-09.md`): `empleosPublicListingsDbServer.ts:upsertEmpleosListingFromEnvelope` reads `envelope.lane`; content comes from `envelope.payload.lane` | A logged-in user submits `lane:"feria"` (free) with a quick/premium payload and publishes a normal $24.99 job post with no payment (new rows only). | Derive the lane from `payload.lane`, reject mismatches, validate the feria payload server-side. |

### Verified guarded (no defect)

* Empleos Quick/Premium cannot be published free THROUGH THE PAID LANE: `resolveEmpleosUpsertLifecycle` refuses publish for any lane except `feria` (`payment_required`), and only the webhook flips `draft → published`. **Exception: the lane the policy reads can be forged — D13 / F1.**
* Autos dealer restore cannot bypass capacity: `app/api/clasificados/autos/listings/[id]/restore/route.ts` uses `activateAutosDealerListingAtomic`.
* `activateEntitlementsForPayment` runs before every lane activator and is idempotent (`23505` → existing row); duplicate webhook delivery is absorbed by the event ledger AND row-state CAS (two layers).
* Amount tampering: price is server-owned (`revenuePricingMatrix.ts`), and `fulfillCheckoutSessionCompleted` rejects amount/currency/metadata mismatch (`amount_mismatch`, `currency_mismatch`, `ofertas_metadata_contract_mismatch`).
* Second Stripe session while the first is `complete`/unknown: `payment_in_progress` / `checkout_state_unverifiable` in `checkout/route.ts`.
* Viajes cannot be charged: `checkout/route.ts` `viajes_checkout_not_available`.
