# Package C — Gate C1: Revenue OS Reference Freeze, Commercial State Model, and Full Paid-Lane Delta Audit

**Program:** Leonix Globalization · **Package:** C (Payments and Commercial Access) · **Gate:** C1 (audit/reference-freeze only)
**Worktree:** `C:/projects/elaguila-website` · **Branch:** `integration/lifecycle-foundation-2026-07`
**Starting HEAD:** `9fbd301b0f52d43f9c3c7c15677c24751073949c` (Package B closure, pushed; parent `708c2546`)
**`origin/main`:** `3fae3e8d6db22353dccdbe36b94bb941a2a76227` (unchanged)
**Authority:** LEONIX_GLOBAL_EXECUTION_BIBLE_V2 (read in full — 15 pages), subject to current repository runtime truth.
**Model:** Fable 5. Evidence gathered by direct inspection plus four parallel read-only repository investigations.

---

## 1. Executive Verdict

The canonical Revenue OS is real, live, and structurally sound for **one-shot checkout**: server-priced sessions from a single pricing matrix, official Stripe signature verification, metadata-namespaced fulfillment, row-state idempotency, per-category activation adapters for **eight paid lanes**, lookup-only success pages, and entitlement-enforced add-on edit protection proven end-to-end on Restaurantes (the reference) and Servicios.

It is **not yet a subscription business**. Exactly two Stripe event types have handlers (`checkout.session.completed`, `checkout.session.expired`). Every monthly entitlement hard-expires +30 days after first payment while Stripe keeps billing. There is no event ledger, no grace period, no cron, no refund/dispute/cancellation handling, no subscription state anywhere in DB, dashboard, or admin.

Two **legacy Stripe lanes** (Autos, Bienes) remain live-reachable, price from env price IDs, and write **no** payment records or entitlements. The 15% verified-discount infrastructure is **entirely absent** (no OTP table, no provider, no eligibility resolver, no 15% constant), while the retired 25% campaign is extensively live. Capacity enforcement is server-real for Autos at publish-time only and **client-only for Bienes**. Placement entitlements are write-only. Comp/partner/print grants have DB enum support but zero code paths.

**Verdict: the reference is freezable today; the deltas are large but precisely mapped; no unknown blockers. READY FOR C2 IMPLEMENTATION: YES.**

---

## 2. Repo / Preflight Proof

| Check | Result |
|---|---|
| `pwd` / toplevel | `C:/projects/elaguila-website` ✔ |
| Branch | `integration/lifecycle-foundation-2026-07` ✔ |
| HEAD | `9fbd301b` = Package B closure commit ✔ (parent `708c2546` ✔) |
| `git status --short` | only untracked `.claude/` (local tooling) + `public/title_banner_leonix.png` (unrelated owner file) — neither touched |
| Staged / unstaged tracked diff | none |
| Worktrees | 6 listed; concierge / digital-contact / hotfix-es-en / ofertas / viajes all isolated, none touched |
| `origin/main` | `3fae3e8d` unchanged ✔ |
| Remote lifecycle branch | `9fbd301b` = local ✔ |
| Active Git operation | none (no MERGE_HEAD / rebase / cherry-pick / bisect state) |
| `.env` files | never read; env variables cited by NAME only |

---

## 3. Package A/B Protected Baseline

- Package A: complete, pushed, protected (lifecycle, checkpoints, draft contract + publish idempotency key, preview modes, edit/save truth, Comida Local editor, stale-draft precedence).
- Package B: complete, pushed (`9fbd301b`); all 17 applicable lanes execute `listingMediaContract.ts` at real save boundaries; 71/71 gates; TS at the 7-error e2e baseline.
- Neither package is reopened by C1. No Package A/B file is modified by this gate.

---

## 4. Restaurante Canonical Reference Freeze

The proven paid loop, with every element classified. (CANONICAL SHARED = reuse for all lanes; CATEGORY ADAPTER = per-lane analog required; RESTAURANTE-SPECIFIC = stays; LEGACY / INCOMPLETE / UNKNOWN as marked.)

### 4.1 Runtime path (exact)

1. **Application** persists draft (Restaurantes application family) — CATEGORY ADAPTER.
2. **Preview + final checkout checkpoint** — `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`: checkpoint config :106-125 (base 39900¢, coupon add-on toggle :122), promo-aware subtotal :137-142, `PublishCheckoutCheckpoint` rendered :391. Shared component `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx:76` + resolver `app/lib/listingPlans/publishCheckoutCheckpoint.ts:232` — CANONICAL SHARED (11 lane checkpoint UIs confirmed consuming it).
3. **Hidden pending row before payment** — `onCheckout` :168 → `saveRestaurantePendingBeforeCheckout.ts:18` → POST `/api/clasificados/restaurantes/publish` with `activationMode:"pending_payment"`; server writes `status:"pending_payment"` (`publish/route.ts:499`, insert :512-517). `RESTAURANTE_PENDING_CHECKOUT_STATUS = "pending_payment"` (`revenueRestaurantFulfillment.ts:10`) — CATEGORY ADAPTER (each lane's own pending state).
4. **Checkout** — `startRevenueCategoryCheckout({...RESTAURANTES_BASE_CHECKOUT, addOns:[{key:"restaurantes_offers_addon"}]})` (`RestaurantePreviewClient.tsx:214-224`) → `POST /api/revenue-os/checkout` (`app/api/revenue-os/checkout/route.ts`, 415 lines) — CANONICAL SHARED. Server-owned pricing: `validateRevenueCheckoutRequest` → `getRevenuePackageDefinition` → `computeRevenueCheckoutSubtotalCents` (`revenueCheckout.ts:144-149`); client amounts never trusted. Add-on allowlist server-owned (`revenueCheckout.ts:41-65`). Pre-checkout DB writes: pending `leonix_payment_records` row (:272-296), pending promo redemption (:308), Stripe session (:358), session attach (:383).
5. **Stripe Checkout** — inline `price_data` (no Stripe Price IDs), `mode` = subscription for monthly SKUs (`revenueCheckout.ts:370-371`), `allow_promotion_codes:false`, metadata namespace `leonix_*` (`revenueEntitlements.ts:163-184`) — CANONICAL SHARED. **No `idempotencyKey`** on session create (`revenueStripe.ts:126`) — INCOMPLETE (C2).
6. **Webhook (sole paid truth)** — `app/api/revenue-os/webhook/route.ts`; official `stripe.webhooks.constructEvent` (`revenueWebhook.ts:157`). Validation chain `revenueFulfillment.ts:892-993` incl. `amount_mismatch` check :979-993 — CANONICAL SHARED. Only `checkout.session.completed` + `checkout.session.expired` handled — INCOMPLETE (C3 events).
7. **Payment record** — `markPaymentRecordPaid` (`revenuePaymentRecords.ts:287-330`, idempotent, status-guarded UPDATE) — CANONICAL SHARED.
8. **Entitlement** — `activateEntitlementsForPayment` (`revenueEntitlementFulfillment.ts`): `listing_package_entitlements` insert :201-228 (`package_tier:"digital_only"` hard-coded; `computeEndsAt` :67-77 **hard-codes +30d for subscriptions** — INCOMPLETE), placement insert :156-180 (`placement_source:"stripe_paid"` only), payment back-link :240-247 — CANONICAL SHARED core with INCOMPLETE subscription semantics.
9. **Listing activation** — `activatePaidRestauranteListingFromRevenueOs` (`revenueRestaurantFulfillment.ts:39`): activatable set `["archived","pending_payment"]` :16-19; guarded UPDATE `.in("status",...)` :136 + zero-row recheck :144-159; base activation syncs `couponUpgradeEnabled` from payment metadata :120-130 — CATEGORY ADAPTER (each lane's own activator; 8 exist, see §6).
10. **Add-on standalone purchase** — `activateRestauranteCouponAddonFromRevenueOs` :164 (published-only, owner cross-check, idempotent) — CATEGORY ADAPTER.
11. **Success page lookup-only** — `app/(site)/revenue-os/pago/exito/page.tsx` (:27 `lookupRevenuePaymentProof`; `revenuePaymentLookup.ts` header: "never mutates"; zero write calls confirmed) — CANONICAL SHARED. Cancel page likewise read-only.
12. **Later-edit entitlement enforcement** — `app/api/clasificados/restaurantes/publish/route.ts`: `fetchAddonEntitlementsForListings` :355-363, `enforceRestauranteCouponEntitlementServerTruth` :88-104 applied :393-397 (server forces the flag from entitlement truth; unentitled saves preserve trusted existing content, never client content); status escalation impossible via edit (`resolveRestauranteOwnerEditTargetStatus` :427-431) — CANONICAL SHARED pattern + CATEGORY ADAPTER application.
13. **Audit** — `writeRevenueAuditLog` → `admin_audit_log` (`revenueAuditLog.ts:25-57`; 14-action vocabulary) — CANONICAL SHARED (no uniqueness on replay — INCOMPLETE).
14. **Promo** — Apply → server validate (`revenuePromoValidation.ts:94`) → discount line → checkout revalidation (`resolvePromoForCheckout`, `revenuePromoRedemptions.ts:286`) → webhook redemption finalization (`revenueFulfillment.ts:1258-1280`) — CANONICAL SHARED (defects in §10).

### 4.2 Reference tests (freeze evidence)

30+ source-pinned verifiers/smokes exercise this loop, incl. `verify-restaurantes-pending-publish-and-coupon-offers-truth-01.mjs`, `verify-restaurantes-p0-coupon-addon-published-parity.mjs`, `verify-stripe-revenue-os-webhook-fulfillment-01.mjs`, `smoke-stripe-revenue-os-sandbox-e2e-01.mjs`, `gate-i4-3-revenue-os-entitlement-batching-selftest.ts` (full list in the C1 investigation record). These are the freeze pins; C2+ must keep them green or consciously update them with the new truth.

### 4.3 Classification summary

| Element | Class |
|---|---|
| checkout route, pricing matrix, revenueCheckout/Stripe/Webhook/Fulfillment core, payment records, entitlement writer, promo engine, audit log, success/cancel pages, checkpoint resolver, addonEntitlementReader | CANONICAL SHARED |
| pending-state save, per-category activator, add-on activator, checkpoint UI config, edit-enforcement application | CATEGORY ADAPTER |
| `couponUpgradeEnabled`/coupon content model, `restaurantes_public_listings` statuses | RESTAURANTE-SPECIFIC |
| `app/api/clasificados/{autos,leonix}/stripe|checkout/**` | LEGACY |
| subscription events, event ledger, idempotencyKey, grace, comp fulfillment, placement readers, 15% infra | INCOMPLETE / MISSING |
| Live Stripe dashboard webhook-endpoint registration set | UNKNOWN (runtime config, not in repo) |

---

## 5. Commercial Ledger Map

All tables service-role-only (RLS enabled, zero policies) unless noted.

| Table | Migration | Purpose / key identifiers | Stripe / entitlement / promo links | Unique constraints | Writers | Readers | Gaps |
|---|---|---|---|---|---|---|---|
| `leonix_payment_records` | `20260526120000` + `20260630120000:9-42` | one row per checkout attempt; `listing_id`, `owner_user_id`, `package_key`, `billing_mode`, amounts, `payment_status` (10-value CHECK incl. unreachable `refunded`/`disputed`) | `stripe_checkout_session_id` **UNIQUE** (:30), `stripe_subscription_id` plain column; FKs to entitlement + promo | session id only | `revenuePaymentRecords.ts` (create :77, attach :191/:207, paid :312, cancel :368), `revenueEntitlementFulfillment.ts:241`, rentas renewal :209 | lookup :260/:280, admin `paymentTrackerData.ts:194`, `promoCodeData.ts:457` | each retry inserts a new pending row (intentional); no event-id key |
| `listing_package_entitlements` | `20260521120000` (+`130000`, `20260630120000:258-331`) | durable capability record; `status ∈ active/scheduled/expired/revoked`; `package_tier` CHECK (print tiers + digital_only); `package_key`, `billing_mode`, `payment_record_id` | FK promo + payment + placement | **`entitlement_code` UNIQUE only — NO listing+package uniqueness** | webhook writer :202, servicios addon :74, autos dealer pack :86, admin grant `package-entitlements/actions.ts:238` (+revoke/extend/attach) | 16 reader sites (addonEntitlementReader, listingPackageEntitlementsServer, revenuePaymentLookup, autos pack readers, admin rollups) | duplicate-active possible (webhook dedupes by payment_record_id only; admin check is TOCTOU and ignores package_key); **no `source` column** — grant provenance only in metadata |
| `leonix_promo_codes` | `20260522120000` + `20260630120000:48-72` | code catalog; `code_type` CHECK incl. **`sms`**; `percent_off`/`amount_off_cents`; scopes; `per_customer_limit` | linked entitlement/listing | `code` UNIQUE | admin generator, newsletter route :155, redemption_count :923 | promo loaders, admin | `promo_type` un-CHECKed; count increment racy |
| `leonix_promo_code_redemptions` | `20260630120000:78-127` | attribution/usage; `status` 6-value CHECK | FK promo (RESTRICT) + payment (SET NULL); session id | **(promo_code_id, stripe_checkout_session_id) partial UNIQUE** :120-122 | `revenuePromoRedemptions.ts` (:440 pending, :479 attach, :848/:884 redeemed, :966 expired) | :811, paymentTracker :135, promoCodeData :436, revenuePaymentLookup :126 | finalization correct (webhook-only); count race upstream |
| `leonix_placement_entitlements` | `20260630120000:148-252` | placement truth; tier CHECK (8 tiers), **source CHECK** `stripe_paid/included_with_print/promo_code/admin_comp/affiliate/free/manual_contract`; `manual_priority`, `rotation_weight`, `print_contract_id` | payment + promo FKs | **NONE** | **exactly one**: `revenueEntitlementFulfillment.ts:156-180`, always `stripe_paid` | **NONE** (write-only; self-check only) | Package D reader; non-Stripe sources are dead enum values; no admin UI |
| `admin_audit_log` | `20260410120000:4-17` | action/target/meta | — | none | `revenueAuditLog.ts:37`, `adminAuditLogServer.ts:22` | admin log page | replay duplicates rows |
| Stripe event ledger | — | — | — | — | — | — | **ABSENT — confirmed no table** |
| Subscription records | — | only `stripe_subscription_id` column on payment records; `metadata.subscription_active` set once | — | — | — | — | **ABSENT** (no period end, no status) |
| Phone/OTP verification | — | — | — | — | — | — | **ABSENT — confirmed** |
| `leonix_partner_contracts` | — | — | — | — | — | — | **DOES NOT EXIST** (one doc line marks it MISSING); nearest field `print_contract_id` never written |
| `listing_lifecycle_reminder_events` | `20260714231500` | reminder queue w/ `dedupe_key` UNIQUE | — | dedupe_key | **no runner exists** | — | table without scheduler |

### Repository guarantees — proven vs missing

| Guarantee | Status | Evidence |
|---|---|---|
| Unique Stripe event handling | **MISSING** | no event table; event.id only inside metadata jsonb |
| Unique payment fulfillment | PARTIAL | session-id UNIQUE + status-guarded UPDATEs; concurrent-replay safe only via conditional UPDATE, no DB event key |
| Unique promo redemption | PROVEN per session | partial unique index :120-122; but `redemption_count` increment is read-modify-write racy (`revenuePromoRedemptions.ts:915-925`) |
| Checkout idempotency (Stripe `idempotencyKey`) | **MISSING** | `revenueStripe.ts:126` single-arg create; zero `idempotenc*` hits under listingPlans/revenue-os |
| Entitlement uniqueness (listing+package active) | **MISSING** | only `entitlement_code` UNIQUE |
| Grant-source auditability | PARTIAL/UNPROVEN | placement has source CHECK (unused); package entitlements: metadata-only provenance, no column |
| Server price truth (canonical lanes) | **PROVEN** | matrix-only amounts + webhook `amount_mismatch` re-check |
| Server price truth (legacy lanes) | **MISSING** | env price IDs; no amount validation, no ledger |
| Parent capacity enforcement | Autos publish-time PROVEN; Bienes **MISSING server-side** | §11 |

---

## 6. Full Paid-Lane Delta Matrix

Locked prices from the Bible §8. `AR`=adopted canonical Revenue OS. Compact columns; shared facts (all canonical lanes): checkout entry = category preview checkpoint → `POST /api/revenue-os/checkout`; payment writer = `revenuePaymentRecords`; webhook adapter = named fulfillment module; entitlement writer = `revenueEntitlementFulfillment`; entitlement reader = `addonEntitlementReader`/`revenuePaymentLookup`; success read-only = TRUE; renewal/cancel/grace/refund = ABSENT unless noted; dashboard reader = mis-anuncios plan chips + revenue-proof badges (§12); admin reader = payment-tracker/package-entitlements.

| Lane | Model | Locked price | Repo price | AR | Pre-pay state | Public | Package key | Edit guard | Terminal status |
|---|---|---|---|---|---|---|---|---|---|
| Restaurantes base | subscription | $399/mo | 39900 ✔ | **TRUE** | `pending_payment` | `published` | `restaurantes_base_monthly` | server entitlement truth ✔ | **PROVEN COMPLETE** (one-shot); subscription events → C3 |
| Restaurantes coupon add-on | subscription | **$79/mo** | **9900 = $99 ✗** | TRUE | published-only gate | — | `restaurantes_offers_addon` | ✔ (`enforceRestauranteCouponEntitlementServerTruth`) | **IMPLEMENTATION REQUIRED** (price 9900→7900, C2) |
| Servicios base | subscription | $399/mo | 39900 ✔ | **TRUE** | `pending_payment` (prod guard `publish/route.ts:389-390`) | `published` (`listing_status`) | `servicios_base_monthly` | ✔ (`enforceServiciosOffersEntitlementServerTruth`) | **PROVEN COMPLETE** (one-shot) |
| Servicios offers add-on | subscription | **$79/mo** | **9900 ✗** | TRUE | — | — | `servicios_offers_addon` | ✔ | **IMPLEMENTATION REQUIRED** (price → 7900; also `listing_source` normalize workaround stays until C2 root-fixes writer) |
| Autos Privado | one-time 30d | $24.99 | 2499 ✔ | **PARTIAL** | `pending_payment` | `active` | `autos_privado_30d` | n/a (no paid add-on) | **IMPLEMENTATION REQUIRED**: confirm-surface non-stripe mode falls to LEGACY route (`AutosPublishConfirmCore.tsx:587`) |
| Autos Dealer base | subscription | $399/mo incl 10 | 39900 ✔ | **PARTIAL** | `pending_payment` | `active` | `autos_dealer_monthly` | — | **IMPLEMENTATION REQUIRED**: confirm surface **always legacy** for negocios (guard :546); converge in C2 |
| Autos Inventory Boost | subscription | +$129/mo +10 | 12900 ✔ | TRUE (libs) | — | — | `autos_dealer_inventory_pack_monthly` | role check MISSING on side-door route (§11) | **IMPLEMENTATION REQUIRED** (C2 route dedupe + C7 role guard) |
| Autos child | via parent | — | — | n/a | — | parent-gated ✔ (I.13B) | — | child base-checkout reachable (no role check, legacy + base routes) | **IMPLEMENTATION REQUIRED** (C7 guards) |
| BR Privado (FSBO) | one-time 45d | $49.99 | 4999 ✔ | **TRUE** | `pending` | `active` | `br_fsbo_45d` | n/a | **PROVEN COMPLETE** (one-shot) |
| BR Negocio parent | subscription | $399/mo incl 1 | 39900 ✔ | **TRUE** | `pending` | `active`+`is_published` | `br_agent_monthly` | — | **PROVEN COMPLETE** (one-shot); capacity → C7 |
| BR Inventory Pack | subscription | **+$99/mo adds 3** | 9900 ✔ price; **capacity +4 ✗** (`BR_INVENTORY_PACK_MAX_CHILDREN = 4`, total 5) | TRUE | — | — | `br_inventory_pack_monthly` | child-checkout blocked ✔ (`revenueCheckout.ts:759-783`) | **IMPLEMENTATION REQUIRED** + **OWNER DECISION OD-1** (capacity 3 vs 4) |
| BR child | via parent | — | — | n/a | — | parent-gated (server on detail; **browser-side on results** `fetchBrPublishedListingsBrowser.ts:99`) | — | server capacity MISSING | **IMPLEMENTATION REQUIRED** (C7) |
| Rentas Privado | one-time 30d | $24.99 | 2499 ✔ | **TRUE** | `pending` | `active` | `rentas_30d` | — | **PROVEN COMPLETE** incl. **renewal** (only lane; `operation:"renew_listing"`) |
| Rentas Negocio | one-time 30d | $24.99 | 2499 ✔ | **TRUE** | same | same | `rentas_30d` | — | **PROVEN COMPLETE** (one-shot) |
| Empleos paid (quick+premium) | one-time 30d | $24.99 | 2499 ✔ | **TRUE** | `lifecycle_status` draft→hidden | `published` | `empleos_job_post_paid` (both lanes, same key) | — | **PROVEN COMPLETE** (one-shot) |
| Empleos feria | free | free | 0 ✔ | n/a | — | — | `empleos_job_fair_free` (stripe-ineligible, hard-rejected) | — | **INTENTIONAL FREE** |
| Clases paid | one-time 30d | $24.99 if charging | 2499 ✔ SKU exists; **checkout unreachable — no UI wiring** | FALSE | — | — | `clases_paid_30d` | — | **IMPLEMENTATION REQUIRED** (C6/C9: wire lane per free-if-free rule) |
| Clases free / Comunidad / Busco / Mascotas | free | free | 0 ✔ | n/a | — | — | `*_free` | — | **INTENTIONAL FREE** |
| En Venta | free V1 | free | 0 ✔ (no Stripe wiring anywhere; free republish only) | n/a | — | — | `en_venta_free_v1` | — | **INTENTIONAL FREE** (no fake Pro checkout exists ✔) |
| Comida Local | free today | free lane | no matrix entry; **paid checkpoint card exists** (`categoryPublishCheckpoints.ts:109`) with no package — honesty gap; proposed Stripe env names are string literals only | n/a | — | — | — | — | **IMPLEMENTATION REQUIRED** (card honesty fix in C6 or card removal; no payment build) |
| Viajes negocio | subscription | ~$399 VERIFY | 39900 SKU exists; **no live checkout call** (lead/inquiry flow ends at `enviado`) | FALSE | — | — | `viajes_business_monthly` | — | **OWNER QA REQUIRED** (price confirm OD-4) + EXTERNAL WORKSTREAM boundary (contract only here) |
| Viajes affiliate | affiliate | free/commission | 0 affiliate ✔ | n/a | — | — | `viajes_affiliate` | — | **INTENTIONAL N/A** (boundary) |
| Ofertas | one-time 30d | $399, AI included | **no matrix entry; zero Stripe code in this worktree** (`ofertasLocalesConstants.ts:120` "Non-Stripe publish product contract") | FALSE | — | — | — | — | **IMPLEMENTATION REQUIRED** (C6: SKU + integration boundary contract; product UI stays in Ofertas worktree) |
| Cupones standalone | one-time 30d | $129, AI included | **no SKU anywhere** | FALSE | — | — | — | — | **IMPLEMENTATION REQUIRED** (same boundary treatment) |
| Business Profiles | package-aware | — | no checkout; package-entitlement readers exist | n/a | — | — | — | — | **IMPLEMENTATION REQUIRED** (C6 resolvers) |
| Premium print | admin contract | $1,999 | 199900 ✔ (`packagePricingRules.ts:107`) — **admin-manual only, no Stripe path (by design)** | n/a | — | — | admin entitlement generator | — | **PROVEN COMPLETE as admin-manual**; C5 adds grant-source rigor; 15% must NOT auto-apply ✔ (no discount path exists) |
| Partner/courtesy grants | grant | — | placement source enum exists, **zero writers**; no `leonix_partner_contracts` | FALSE | — | — | — | — | **MIGRATION REQUIRED** + C5 implementation |

---

## 7. Legacy Payment Convergence Map

### 7.1 Autos legacy lane — LIVE, highest priority

| Aspect | Evidence |
|---|---|
| Files | `app/api/clasificados/autos/checkout/route.ts` (+`verify`, `verify-internal`, `cancel`), `app/api/clasificados/autos/stripe/webhook/route.ts`, config `stripeAutosConfig.ts` |
| Price | env price IDs `STRIPE_PRICE_AUTOS_NEGOCIOS` / `STRIPE_PRICE_AUTOS_PRIVADO` (`stripeAutosConfig.ts:12,14`) — **no server amount, no promo, no add-ons** |
| Callers | `AutosPublishConfirmCore.tsx:587` — **dealer lane always**, privado when `publishConfirmMode !== "stripe"` (revenue-os branch :570 gated :546); dealer add-inventory flow also lands here |
| Writes | listing `status:"active"` only (`autosClassifiedsListingService.ts:610-663`); **no payment record, no entitlement** — revenue invisible to all ledgers |
| Webhook | own endpoint, official constructEvent, **same `STRIPE_WEBHOOK_SECRET` as canonical**; `checkout.session.completed` only; **no category guard** — reads `metadata.listing_id ?? client_reference_id` (:32) |
| Double-processing | **Precisely graded:** canonical sessions carry `leonix_*` metadata keys and `client_reference_id = paymentRecordId`, so the legacy handler fires on every canonical payment but its listing lookup (by payment-record UUID) fails → no double activation **today**; separation rests on an implicit, unpinned metadata-namespace accident. Legacy sessions likewise no-op in the canonical webhook (`isRevenueOsCheckoutSession` requires `leonix_*`). Fragile, not currently exploding. |
| Bypasses | 3 zero-payment activation paths: internal publish bypass, test-publish bypass, negocios QA email allowlist (`checkout/route.ts:214,228,242`) |
| `verify` route | **GET that mutates** (activates on `payment_status==="paid"` re-retrieval) — cacheable/prefetchable shape |
| Bridge strategy | C2: (a) repoint `AutosPublishConfirmCore` to `startRevenueCategoryCheckout` for both lanes; (b) add explicit source guard to the legacy webhook (mirror BR's :34) as belt-and-braces while parallel-running; (c) keep legacy webhook alive only during parallel-proof window |
| Retirement | after sandbox parallel proof: remove confirm-surface caller → route returns 410 → unregister endpoint (owner Stripe-dashboard action) → delete in Package F |

### 7.2 Bienes/Leonix legacy lane — stranded but reachable

| Aspect | Evidence |
|---|---|
| Files | `app/api/clasificados/leonix/stripe/{checkout,checkout/verify,webhook}/route.ts`, `stripeBrConfig.ts`, `brPublishPaymentPolicy.ts` |
| Price | env `STRIPE_PRICE_BIENES_NEGOCIO` / `STRIPE_PRICE_BIENES_PRIVADO` |
| Callers | **only** `BrPagoExitoClient.tsx:72-100` (success page `internal=1` POST — client-initiated activation trigger; ownership re-checked server-side, activation only under bypass env) and :113 verify GET. `brPublishCheckoutClient.ts` is DEAD (0 importers) |
| Webhook | category-guarded `metadata.category === "bienes-raices"` (:34) — canonical sessions use `leonix_category`, so guard rejects them → no cross-fire |
| Writes | `listings` row activation + child fan-out only; payment intent id accepted but **discarded**; no ledgers |
| Policy hazard | `brPublishPaymentPolicy.ts:12-17` — non-production deploys publish BR free when Stripe unconfigured |
| Bridge/retirement | C2: retire the `internal=1` success-page POST (sole live caller), keep webhook guard, parallel-proof, then 410 + unregister + Package F deletion |

### 7.3 Other non-canonical paths

- `/api/clasificados/autos/inventory-pack/checkout` — **canonical-backed side-door** (uses revenue libs + pending payment records) duplicating the add-on-only branch of `/api/revenue-os/checkout`; misses the `inventory_role === "main"` check its canonical twin has. C2: fold into canonical route or add the role guard (C7 also pins it).
- Env-var namespace: single `STRIPE_SECRET_KEY` + single `STRIPE_WEBHOOK_SECRET` across all endpoints; 4 legacy price-ID vars; Comida Local Stripe names are unwired string literals.
- No client-trusted `paid=true` flags found; `activation_mode` is restrictive-only (hides rows) on both Restaurantes and Servicios.

---

## 8. Subscription Lifecycle Map

| Event | Handler | Signature | Dedupe | Payment rec | Entitlement | Listing | Children | Dash/Admin | Gate |
|---|---|---|---|---|---|---|---|---|---|
| `checkout.session.completed` | **TRUE** (`revenueFulfillment.ts:1315-1497`; legacy autos/BR listing-only) | constructEvent ✔ | row-state only; no event ledger | paid ✔ | insert ✔ (+30d hard-coded) | activate ✔ | BR fan-out only | payment tracker ✔ | frozen |
| `checkout.session.expired` | **TRUE** (`markCheckoutSessionExpired`) | ✔ | status-guard | canceled ✔ | — | — | — | — | frozen |
| `invoice.paid` | **FALSE** — doc-only (2 markdown hits, zero code) | — | — | — | — needed: extend `ends_at` | — | — | — | **C3** |
| `invoice.payment_failed` | **FALSE** — doc-only | — | — | — | — needed: grace start | — | — | — | **C3** |
| `customer.subscription.updated` | **FALSE** — doc-only | — | — | — | cancel-at-period-end capture | — | — | — | **C3** |
| `customer.subscription.deleted` | **FALSE** — doc-only | — | — | — | end entitlement | suspend paid visibility | child cascade | — | **C3** |
| `charge.refunded` / `charge.dispute.*` | **FALSE** — zero code hits; `refunded`/`disputed` enum values unreachable | — | — | — | — | — | — | — | **C3** (+ OD-2 policy) |

Supporting facts: `computeEndsAt` +30d hard-code (`revenueEntitlementFulfillment.ts:67-77`); `current_period_end` never read anywhere; **grace-period logic ABSENT** (single grep hit is an unbuilt Viajes admin label); **no cron/vercel.json/pg_cron**; expiry derived at read-time only (`addonLifecycle.ts:69`, `revenuePaymentLookup.ts:109-115`); reminder table exists with **no runner**; renewal = Rentas-only and **renewal does not extend entitlement rows** (patches payment metadata + `listings.expires_at` only); nothing anywhere stores/displays `past_due`/subscription status (zero hits).

Locked 7-day grace (Bible): C3 must build state (grace start/end), warn surface, suspension transition preserving content, restoration on payment — all currently 0%.

---

## 9. 15% Verified Discount Map

| Capability | Status | Evidence |
|---|---|---|
| Email verification truth | **EXISTS BUT INCOMPLETE** | Supabase `email_confirmed_at` exists; exactly ONE reader (`dashboardPasswordMode.ts:41`), UI-only — no commercial consumer |
| Phone verification truth | **MISSING** | no table, no column, no provider (no twilio/vonage/etc. dependency) |
| OTP tables/helpers | **MISSING** | migrations grep: zero; `app/lib/auth/` = 4 files, none phone; only email magic-link `signInWithOtp` |
| E.164 normalization | EXISTS BUT INCOMPLETE | `normalizePhoneForSubmit` (`app/lib/leonix/phoneFormat.ts:28`) + ~5 local duplicates; lead-capture only |
| OTP hashing / expiration / attempt caps / resend cooldown / rate limits | **MISSING** | nothing exists |
| Eligibility resolver | **MISSING** | `VERIFIED_LAUNCH_DISCOUNT`/any 15% constant: zero hits (only unrelated 6-month print-term 15%) |
| Discount calculator + checkout revalidation | EXISTS (generic promo engine) — reusable | percent math + proportional line-item distribution + webhook amount re-check |
| Redemption/audit record | EXISTS (promo redemptions ledger) — extend with `verification_method` | `leonix_promo_code_redemptions` + payment record metadata |
| SMS credential | **EXTERNAL CREDENTIAL BLOCKER** (OD-3: provider + credentials) — build proceeds regardless per Bible |

`code_type='sms'` already exists in the promo CHECK + admin dropdown with zero infrastructure behind it — a naming slot C4 can inhabit or ignore (the verified campaign need not be a typed code; Bible allows automatic application after server-proven eligibility).

**25% retirement sweep (exact, verified):** runtime — `newsletter/subscribe/route.ts:19,100,161,189` + `promo_family:"website_launch_25"` :123; engine — `revenuePromoRedemptions.ts:102-151, 382-390`, `revenuePromoValidation.ts:124-126`; presets — `promoCodeConstants.ts:72-126` (4 active/draft 25% presets), `promoCodePresetGuide.ts:28-44`; UI — `LeonixLaunchCouponCard.tsx` (4 locales + hard-coded `25%` glyph :115; **do not touch** `:174` Tailwind `/25` opacity), `login/page.tsx:514,546,638`, coming-soon en/es :283-287, `NewsletterPageClient.tsx:83,106-107`, `RevenuePromoField.tsx:119-120`, `publishCheckpointCopy.ts`, `categoryPublishCheckpoints.ts:770-771`, landing-hub source consts, 6 `sourceCta=launch_25` hrefs, 6 newsletter interest-tag literals; email — `newsletterPromoCodeEmail.ts` (7 hits); admin reply templates `leonixLeadReplyTemplates.ts:287-305`; tests pinning 25 — `smoke-revenue-os-newsletter-promo-checkout-validation-01/02.mjs`, `verify-bienes-autos-dealer-paid-readiness.mjs`, `verify-admin-promo-code-clarity.mjs:30`. **Do not touch:** `packagePricingRules.ts:121-123` print-term ladder (6-mo 15% / founding-partner 25%) + `packageEntitlementConstants.ts:52` — separate print-contract economics, not the campaign. No distributed codes exist → no grandfather process (Bible-confirmed).

---

## 10. Promo / Comp / Partner / Print Map

| Mechanism | Table/record | Validator | Finalization | Entitlement | Stripe | Gaps |
|---|---|---|---|---|---|---|
| Percent promo | `leonix_promo_codes` (`percent_off`) | server ✔ (Apply preview + checkout revalidation) | webhook-only ✔ | never (correct) | unit_amount lowering; `allow_promotion_codes:false` | `redemption_count` race; **`per_customer_limit` NEVER enforced** (`customerRedemptionCount` never supplied); **`one_time_use` never read by any validator** |
| Fixed promo | `amount_off_cents` | same engine | same | — | same | same |
| Newsletter 25% auto-issue | `newsletter/subscribe/route.ts` | — | — | — | — | **P0 defect:** null category_scope+package_scope bypasses the Launch-25 allowlist (`resolveWebsiteLaunch25Rejection:142-144`) AND `code_type='newsletter'` short-circuits identity requirement (:195-198) AND `one_time_use:true` with NULL `max_redemptions` is unenforced → **global, unlimited, identity-free 25% off**. Retire in C4. |
| 100% comp | promo engine computes full discount | ✔ | — | **NONE** | — | hard 422 dead-end `COMP_REQUIRES_NEXT_GATE` (`revenuePromoRedemptions.ts:392-407`); all comp promo_types unusable → **C5 builds the zero-dollar fulfillment path creating real entitlements without fake payments** |
| Partner courtesy | placement `source` enum values exist | — | — | zero writers | — | **C5 + migration** (`leonix_partner_contracts` + grant-source column on package entitlements) |
| Print inclusion | `package_tier` print values + admin generator | admin form | — | ✔ admin-manual insert (+ linked promo code auto-upsert) | none (by design) | admin grants write **no placement row**; provenance metadata-only |
| Admin grant | `package-entitlements/actions.ts` | soft-cap + TOCTOU duplicate check | — | ✔ | none | needs DB uniqueness + source column (C5) |
| Sales-rep attribution | promo + payment `sales_rep_*` columns + `markPromoRedemptionRedeemedWithBusinessAttribution` | ✔ | webhook ✔ | — | — | working; keep |

No promo string is treated as durable entitlement anywhere ✔ (doctrine holds).

---

## 11. Parent/Child Capacity Map

| Dimension | Autos Dealer | Bienes Negocio |
|---|---|---|
| Included / add-on | 10 + 10 (boost) = 20 ✔ matches lock | **1 + 4 = 5 in repo** (`BR_INVENTORY_PACK_MAX_CHILDREN=4`) vs **locked +3 → 4 total** → **OD-1** |
| Entitlement read | real (`autosDealerInventoryPackEntitlement.ts:6-25`, fails closed) | dashboard helper reads entitlements; policy fallback has non-prod localStorage/env escape (`leonixBrPropertyInventoryPolicy.ts:69-80`, prod-fenced) |
| Server enforcement | **publish/checkout only** (`autos/checkout/route.ts:177-209` + application guard hard-ceiling 20) | **ABSENT — all counting is client-side**; zero `app/api/**` imports of the counting policy; `skippedNewChildren` refuses new-child creation but never counts |
| Create/edit/restore/republish re-check | ABSENT (admin restore can exceed capacity silently) | ABSENT |
| Child → base checkout | reachable: legacy base route (no role check) + side-door boost route (`autosDealerInventoryBoostOwnership.ts` never reads `inventory_role`); canonical route strict ✔ (:668-671) | **blocked ✔** (`revenueCheckout.ts:759-783`) |
| Parent status → child visibility | server-side ✔ all 3 surfaces (I.13B) | detail server-side ✔; **results gate runs in browser** (`fetchBrPublishedListingsBrowser.ts:99`) |
| Parent entitlement expiry → children | **ABSENT both** — no sweep/cron; expired packs leave over-capacity children live indefinitely | same |
| Orphan/substitution/sibling | orphans possible but publicly invisible; **create route trusts client `parentListingId`/`dealerInventoryGroupId` unverified** | sibling-overwrite protection sound ✔; orphans invisible ✔ |
| Admin guard | parent-only: archive/remove_public/restore_active ✔ | parent-only: **archive only** — `remove_public`/`restore_active` reachable on children (gap) |
| Doc drift | — | policy file :66 says "+5 → 8 total"; :19 prices $99.99 vs charged $99.00 |

C7 scope follows directly: server-side BR capacity enforcement; capacity re-check on restore/republish/admin actions; role guards on the two exposed Autos routes; parent-id/group-id ownership verification at child create; entitlement-expiry→visibility linkage (with C3's subscription state); BR admin parent-only set parity; capacity constants realigned to OD-1.

---

## 12. Dashboard / Admin Commercial Truth Map

**Sound (keep/extend):** account-tier doctrine genuinely enforced (`LeonixDashboardShell.tsx:137-139` voids the prop; 14 pages hard-return "free"; `accountTierIgnored:true` surfaced in admin); `fetchRevenueOsAdPlanProofsForListings` live-wired — real entitlement proof **overrides** inferred plan labels (`mis-anuncios/page.tsx:545-547` + 7 call sites); RE card carries correct placement-truth copy; `resolveCategoryAdPlan` header forbids account-tier conflation; monetization summary ignores membership.

**Gaps (exact):**

| # | Finding | Files |
|---|---|---|
| 1 | `resolveCategoryAdPlan` infers plan from row shape (seller_type/price/detail_pairs) with **no payment proof input**; en-venta returns "Pro" from detail_pairs (V1 is free — label drift) | `categoryAdPlans.ts:180-289` |
| 2 | Business Tools page hard-codes plan "free" (deliberate stub) — C6 replaces with `resolveBusinessToolsAccess()` | `business-tools/page.tsx:22-25,77,103` |
| 3 | **No subscription/grace/delinquent state anywhere** (zero `past_due`/`subscription_status` hits) | dashboard + admin |
| 4 | Empleos and Servicios dashboards show **no commercial state at all** | `dashboard/empleos/page.tsx`, `dashboard/servicios/page.tsx` |
| 5 | Renewal affordance: Rentas (paid) + En Venta (free republish) only; ABSENT for all subscriptions | `mis-anuncios/page.tsx:2023-2025, 1871-1894` |
| 6 | Restaurantes `promoted` has **two competing writers**: staff boolean (admin route :119-122, physically partitioned band in results) vs entitlement derivation (`packageEntitlementGrantsDestacado` in two inventory servers) | `restaurantesPublicListingsServer.ts:124-140`, `restaurantesResultsInventoryServer.ts:36` |
| 7 | Admin has payment-tracker + package-entitlements + promo pages (real ledger readers ✔) but **no placement page, no subscription view, no grace view** | `app/admin/(dashboard)/workspace/*` |
| 8 | `leonix_verified` clean staff boolean ✔ (6 admin write routes; display everywhere) — never payment-derived ✔ | — |
| 9 | Servicios offers dashboard badge eligibility is content-presence, not entitlement (documented caveat) | `serviciosDashboardOffersAddonCheckout.ts:204-211` |

C8 required shared readers: `resolveCategoryListingPlan()` (plan label + payment proof join — matrix already has the proof fetcher), `resolveBusinessToolsAccess()`, subscription/grace chip source, add-on truth chips (entitlement-driven), unified renewal surfacing.

---

## 13. Required Migrations (owner approval each; none created in C1)

| # | Migration | Gate | Purpose |
|---|---|---|---|
| M1 | `stripe_webhook_events` ledger (event_id UNIQUE, type, payload digest, status, processed_at) | C2 | true event idempotency; audit-log dedupe |
| M2 | Partial unique index on `listing_package_entitlements` (listing_id, package_key) WHERE status IN ('active','scheduled') | C2 | close duplicate-active entitlement hole |
| M3 | Subscription lifecycle columns/records: `stripe_subscription_id` indexed + `current_period_end`, `subscription_status`, `grace_ends_at` (extend `listing_package_entitlements` or a `leonix_subscription_records` table — prefer **extending existing entitlements ledger** per no-competing-tables rule) | C3 | invoice.paid extension, 7-day grace, cancel-at-period-end |
| M4 | `leonix_phone_verifications` (user_id, E.164 phone, code_hash, attempts, expires_at, verified_at, ip) | C4 | SMS OTP path |
| M5 | `grant_source` column on `listing_package_entitlements` + `leonix_partner_contracts` table | C5 | comp/partner/print/support provenance with DB truth |
| M6 | (conditional) atomic `redemption_count` increment RPC or trigger | C5 | fix max_redemptions race |
| M7 | (already-flagged from Package A, unrelated to C) Restaurante pause/resume status support — remains owner-gated | — | — |

Newest existing migration is `20260804120000_listings_publish_attempt_idempotency_key.sql`; all new migrations must postdate it. Four historical duplicate-timestamp pairs exist — do not repeat the pattern.

---

## 14. Required Owner Decisions

| ID | Decision | Blocks |
|---|---|---|
| OD-1 | **BR Inventory Pack capacity: locked Bible says +3 (total 4); repo constant says +4 (total 5)** (`publishCheckoutCheckpoint.ts:52-54`). Confirm 3 or 4. | C7 constant + C2 matrix copy |
| OD-2 | Refund / chargeback / cancellation revocation policy (immediate vs period-end entitlement end; refund → suspend?) | C3 refund/dispute handlers only |
| OD-3 | SMS provider selection + production credentials (Twilio Verify or equivalent) | live SMS QA only — build proceeds |
| OD-4 | Viajes paid-business price final lock (~$399 supported by repo matrix) | Viajes boundary SKU activation |
| OD-5 | Already-issued newsletter 25% codes: none distributed per Bible ("no codes were distributed") — confirm hard-disable of existing `LX-NEWS-*` rows issued by the live route since launch of that route, if any exist in production data | C4 retirement sweep completeness |
| OD-6 | Stripe dashboard webhook-endpoint registration set (which endpoints are live) — owner must confirm before C2 parallel-run design | C2 bridge sequencing |

No pricing decision blocks C2 start (Bible §14 confirmed; OD-1 affects a capacity constant, not a price).

---

## 15. External Credential Blockers

1. **SMS provider credentials** (OD-3) — blocks live SMS delivery QA only; C4 ships the full path code-complete behind env checks.
2. **Stripe dashboard webhook registration truth** (OD-6) — runtime config not in repo; needed to sequence legacy-endpoint retirement safely.
3. Vercel Preview Deployment Protection (standing I.13D owner item) — blocks browser QA on Preview, not implementation.

---

## 16. C2–C9 Implementation Blueprint

Recommended consolidation: **six heavy builds instead of eight** — C2+C3 combined (both live in the same webhook/fulfillment files), C5+C6 combined (both are entitlement-model work), C7 standalone (capacity), C4 standalone (security-sensitive verification), C8 standalone (readers), C9 terminal certification. Strictly serialized; Machine Resource Lock applies.

### BUILD 1 — C2+C3: Revenue OS Convergence, Idempotency, and Subscription Lifecycle
- **Objective:** one canonical payment path; true event idempotency; full subscription event handling with 7-day grace.
- **Reference reused:** frozen Restaurante loop (§4); `revenueFulfillment` dispatch pattern.
- **Files (likely):** `revenueStripe.ts` (idempotencyKey on session create), `revenueWebhook.ts` + `app/api/revenue-os/webhook/route.ts` (event dispatch expansion), new `stripeEventLedger.ts`, `revenueEntitlementFulfillment.ts` (endsAt from `current_period_end`; extension on invoice.paid), new grace module, `AutosPublishConfirmCore.tsx` (repoint to canonical), legacy autos webhook (source guard), `BrPagoExitoClient.tsx` (retire internal POST), `inventory-pack/checkout/route.ts` (fold/guard), pricing matrix (offers add-ons 9900→**7900** per lock; retire stale `unresolvedOwnerDecision` notes now locked; add Ofertas/Cupones SKUs if owner wants them in this build), checkpoint copy constants ($99→$79 displays).
- **Locked:** success pages stay read-only; no live price change beyond owner-locked values; legacy files not deleted (Package F).
- **Migrations:** M1, M2, M3.
- **Lanes:** all 8 canonical + 2 legacy convergences.
- **Tests:** event-replay (sequential + concurrent) focused tests; parallel-run proof legacy vs canonical; existing 30+ pins kept green; new grace-state selftest.
- **Stop:** any double-fulfillment in parallel proof; any webhook signature/dedupe unprovable.
- **Model:** Fable 5. Heavy processes: 1 (final build). Combinable: yes (C2+C3 same files).

### BUILD 2 — C4: 15% Verified Email/SMS Discount
- **Objective:** dual-path server-proven eligibility; 15% campaign; 25% retirement.
- **Files:** new `app/lib/auth/phoneVerification.ts` + `app/api/auth/phone-verification/{send,verify}/route.ts`; new `app/lib/listingPlans/verifiedDiscount.ts` (`resolveVerifiedDiscountEligibility`, single `VERIFIED_LAUNCH_DISCOUNT_PERCENT = 15`); checkout route integration (auto-apply or campaign-benefit selection per Bible); redemption metadata (`verification_method`); the full §9 25% sweep incl. newsletter route retirement and the P0 newsletter-code bypass; updated tests.
- **Migrations:** M4.
- **Rules:** no stacking; never on Premium print; no client checkbox; record original/discount/final/method.
- **Stop:** eligibility resolvable client-side in any way.
- **Model:** Fable 5. Heavy: 1. Combinable: no (security-sensitive, keep isolated).

### BUILD 3 — C5+C6: Comp/Partner/Print Fulfillment + Listing Plans/Package Catalog/Business Tools
- **Objective:** zero-dollar comp path creating real entitlements; grant-source rigor; `resolveCategoryListingPlan()`; benefits encoding; `resolveBusinessToolsAccess()`.
- **Files:** comp fulfillment module (bypasses Stripe, writes entitlement + audit); `package-entitlements/actions.ts` (source column adoption + placement-row parity); `leonix_partner_contracts` service; `categoryAdPlans.ts`→ new `resolveCategoryListingPlan.ts` joining `fetchRevenueOsAdPlanProofsForListings`; `businessToolsAccess.ts`; business-tools page truth wiring; per_customer_limit + one_time_use enforcement; redemption-count atomicity; Ofertas/Cupones SKU + boundary contract docs (product UI stays in Ofertas worktree); Comida Local checkpoint-card honesty fix; en-venta "Pro" label correction.
- **Migrations:** M5, M6.
- **Stop:** any grant path that fakes a Stripe payment.
- **Model:** Fable 5 core; Sonnet 5 may sweep display-copy adoptions after contracts frozen. Heavy: 1. Combinable: yes.

### BUILD 4 — C7: Parent/Child Commercial Capacity
- **Objective:** server-enforced capacity, both pipelines, all mutation paths.
- **Files:** BR: server-side counting service + enforcement in `listing-edit` route, add-inventory flow, restore/republish, admin guard parity (`BR_PARENT_ONLY_ACTIONS` + remove_public/restore_active); constants per OD-1; policy-file doc/price fixes; results-gate server migration (browser gate → server). Autos: role guards on legacy base route + `autosDealerInventoryBoostOwnership.ts`; parent-id/group ownership verification at child create; restore/republish capacity re-check; entitlement-expiry visibility linkage (consumes Build 1 subscription state).
- **Migrations:** none expected (BR `inventory_role` backfill remains the optional Package A note).
- **Stop:** child able to buy base package; capacity bypass via any edit.
- **Model:** Fable 5. Heavy: 1. Combinable: could merge into Build 3 if velocity demands; default standalone (payment-adjacent risk).

### BUILD 5 — C8: Dashboard/Admin Commercial Truth
- **Objective:** independent truth chips everywhere; admin subscription/grace/placement views; add-on truth from entitlements.
- **Files:** mis-anuncios chip sources; Empleos/Servicios dashboard commercial state; renewal surfacing beyond Rentas; admin placement page (reader of `leonix_placement_entitlements` — write-only today); subscription state views; Restaurantes `promoted` dual-writer reconciliation (entitlement-derived with audited staff override).
- **Model:** Fable 5 contracts → Sonnet 5 per-card wiring. Heavy: 1.

### BUILD 6 — C9: Sandbox Certification
- Full contract/adapter/signature/replay/partial-failure/subscription/discount/promo/capacity/truth test families; Stripe sandbox proof per paid family (one-time, subscription, add-on, promo, 15% email, 15% SMS-or-blocker, comp); aggregate gates once; TS baseline; changed-file lint; diff check; one final build; single Package C closure commit.
- **Model:** Fable 5 (+ Opus 5 adversarial payment review before Production per Bible §18 — scheduled at Package F merge, not here). Heavy: 1-2 (gate suite + build).

**Total heavy processes for Package C: ~7.** Serialized; nothing touches `listingPlans/**` concurrently.

---

## 17. Risks Ranked

**P0**
1. Monthly entitlements hard-expire +30d while Stripe keeps billing (no invoice.paid) — paying customers silently lose service. (Build 1)
2. Legacy Autos lane live for dealer base: env-priced, no ledger writes, revenue invisible; fragile implicit metadata-namespace separation between three webhooks sharing one secret. (Build 1)
3. Newsletter 25% code: global, unlimited, identity-free discount via scope-null bypass + unenforced one_time_use. (Build 2; interim mitigation possible in Build 1 if sequenced later)
4. BR capacity has zero server enforcement; entitlement expiry never affects children in either pipeline. (Build 4)

**P1**
5. No Stripe event ledger / no session idempotencyKey (duplicate pending rows, duplicate audit rows, concurrency-window duplicate entitlements). (Build 1)
6. 100% comp dead-end blocks all comp/partner/print-inclusion sales operations. (Build 3)
7. Duplicate-active entitlement possible (no DB uniqueness). (Build 1 migration)
8. Autos child can reach base/boost checkout via role-uncheck routes; client-trusted parent ids at child create. (Build 4)
9. Offers add-ons priced $99 vs locked $79. (Build 1)
10. Autos legacy `verify` is a GET that mutates.

**P2**
11. `per_customer_limit`/`one_time_use`/`redemption_count` enforcement gaps. (Build 3)
12. Placement entitlements write-only; admin grants create no placement rows. (Build 5 + Package D)
13. En-venta "Pro" label drift; Comida Local paid card with no package; policy-file doc/price drift (BR +5→8 text, $99.99 vs $99.00).
14. BR non-prod free-publish policy escape; BR results child-gate browser-side.

---

## 18. What Must NOT Be Changed

- Frozen reference behaviors in §4 (pending-before-checkout, webhook-sole-truth, lookup-only success, entitlement-enforced add-on edits, server pricing, metadata namespace `leonix_*`).
- Locked prices (Bible §8) — implementation aligns code TO them, never away.
- Package A/B protected files and contracts; `listingMediaContract.ts` runtime adapters.
- Isolated worktrees (Viajes/Ofertas/Concierge/hotfix product files); integration happens via shared contracts only.
- `.env` values; existing migrations (append-only); print-term discount ladder (separate economics).
- Success/cancel pages stay read-only forever.
- No Production action; Preview + owner QA before any merge (Package F).

---

## 19. Final TRUE/FALSE Audit

| Row | Value |
|---|---|
| Correct worktree confirmed | TRUE |
| Correct branch confirmed | TRUE |
| Package B closure commit present | TRUE (`9fbd301b` = HEAD) |
| origin/main unchanged | TRUE (`3fae3e8d`) |
| No active Git operation | TRUE |
| Bible fully read | TRUE (15/15 pages) |
| Restaurante runtime reference frozen | TRUE (§4, with test pins) |
| Exact Revenue OS checkout route traced | TRUE |
| Exact webhook route traced | TRUE |
| Webhook signature verification traced | TRUE (constructEvent, all 3 endpoints) |
| Event idempotency traced | TRUE (row-state only; ledger ABSENT — documented) |
| Existing payment ledger traced | TRUE |
| Existing package entitlement ledger traced | TRUE |
| Existing promo redemption ledger traced | TRUE |
| Existing placement entitlement ledger traced | TRUE (write-only) |
| All paid lanes mapped | TRUE (§6) |
| All free/mixed lanes mapped | TRUE (§6) |
| Autos legacy payment path mapped | TRUE (§7.1) |
| Bienes legacy payment path mapped | TRUE (§7.2) |
| Subscription event coverage mapped | TRUE (§8: 2 handled, 6 absent) |
| 15% email verification path mapped | TRUE (§9: one reader, no commercial consumer) |
| 15% SMS verification path mapped | TRUE (§9: ABSENT — build required) |
| Promo/comp/partner/print paths mapped | TRUE (§10) |
| Autos capacity path mapped | TRUE (§11) |
| Bienes capacity path mapped | TRUE (§11) |
| Dashboard commercial readers mapped | TRUE (§12) |
| Admin commercial readers mapped | TRUE (§12) |
| C2-C9 blueprint completed | TRUE (§16, six consolidated builds) |
| No pricing changed | TRUE |
| No runtime commercial behavior changed | TRUE |
| No Stripe files changed | TRUE |
| No migrations added | TRUE |
| No Package A files changed | TRUE |
| No Package B files changed | TRUE |
| No other worktree touched | TRUE |
| No files staged | TRUE |
| No commit | TRUE |
| No push | TRUE |
| No PR | TRUE |
| No deployment | TRUE |
| git diff --check passed | TRUE (run at close-out) |
| READY FOR C2 IMPLEMENTATION | **YES** |

---

*Gate C1 complete. This document is the Package C delta map of record; C2–C9 builds must update §6 terminal states and append their closure evidence here or in the master ledger.*
