# RESTAURANTES — LIVE WIRING MAP (AUTHORITATIVE)

Gate Zero + live-wiring MRI. Traced from runtime-consumed source only. File existence was never
accepted as proof of live. **No fixes implemented. Nothing deleted.**

Classification vocabulary (master §14): `LIVE` · `LIVE-SHARED` · `BUILT-NOT-WIRED` ·
`DUPLICATE-REFERENCED` · `DEAD-ZERO-CONSUMER` · `HISTORICAL` · `UNKNOWN`.

Servicios is referenced only where the engine is genuinely shared. Restaurantes' own architecture
differs in several places and is, in three of them, **stronger** than Servicios was pre-Gate-1 —
those are recorded as such, not "fixed toward" the Servicios shape.

---

## 0. GATE STATUS

| Gate | Scope | Status |
|---|---|---|
| **RESTAURANTES-0** | Gate Zero + live wiring MRI | **COMPLETE** |
| **RESTAURANTES-1** | Launch-critical lifecycle repairs (§5.1, §5.5, §6.1–6.6) | **CLOSED** — see §10 |

Servicios (Gates 1–2) is **LOCKED** and was not reopened.

---

## 1. WORKTREE TRUTH

| Field | Value |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `2d28624c` (Gate SERVICIOS-2) |
| Accepted below it | `849b45ea` (Gate SERVICIOS-1) · `a0a47839` (`origin/main`) |
| Working tree at trace time | clean |
| `origin/main` | `a0a47839` — untouched |

Restaurantes source spans six trees:

| Tree | Files | Role |
|---|---|---|
| `app/(site)/clasificados/restaurantes/` | 127 | landing, results, public detail, preview, shell renderer, application libs, seo — **LIVE** |
| `app/(site)/publicar/restaurantes/` | 8 | the real application mount — **LIVE** |
| `app/lib/clasificados/restaurantes/` | 23 | offers/coupon helpers, status authority, video urls, 12 historical audit `.md` — **mixed** |
| `app/api/clasificados/restaurantes/` | 2 | `publish`, `draft-media-upload` — **LIVE** |
| `app/api/admin/restaurantes/` | 1 | staff status actions — **LIVE** |
| `app/admin/(dashboard)/workspace/clasificados/restaurantes/` | — | admin ops queue — **LIVE** |

**Structural note vs Servicios:** Restaurantes has only **two** category API routes. There is no
`my-listing` / `my-listings` / `manage` / `analytics` / `inquiry` route. The owner dashboard reads
`restaurantes_public_listings` **directly through the browser Supabase client** (RLS-scoped by
`.eq("owner_user_id", user.id)`), not through a category API. That is a real architectural
difference, not a missing file.

---

## 2. EXACT LIVE END-TO-END PATH

```
LANDING            /clasificados/restaurantes
                   page.tsx -> loadRestaurantesLandingInventoryForPage()  <-- REAL DB READ
                     -> landing/RestaurantesLandingPage.tsx                              LIVE
                   (unlike Servicios, this landing genuinely reads published inventory)
  |
CHECKPOINT         /clasificados/publicar/restaurantes
                   page.tsx -> RestaurantesSelectorClient
                   Two-lane chooser: "Restaurante establecido $399/mes"
                                     "Puesto/Pop-up/Vendedor móvil $199/mes"             LIVE
                   ** the $199 figure contradicts Revenue OS ($129) — see §6.2 **
  |
APPLICATION        /publicar/restaurantes
                   page.tsx -> RestauranteApplicationClient.tsx (2,871 L)                LIVE
                   exit guard  app/lib/businessApplications/
                               useBusinessApplicationLeaveGuard  (line 213)              LIVE-SHARED
                   legacy alias /clasificados/restaurantes/publicar -> redirect()        LIVE (shim)
  |
DRAFT IDENTITY     application/restauranteDraftStorage.ts
                   sessionStorage key "restaurantes-draft" (+ one-time localStorage
                   legacy migration), heavy media offloaded to IndexedDB namespaced by
                   `draftListingId`                                                      LIVE
                   ** draftListingId is the DURABLE PERSISTENCE KEY — see §2.1 **
  |
HYDRATION          useRestauranteDraft + loadRestauranteDraftFromStorageResolved()
                   (JSON + IndexedDB blob inline)                                        LIVE
  |
PREVIEW            /clasificados/restaurantes/preview
                   preview/page.tsx -> RestaurantePreviewClient.tsx (456 L)              LIVE
                   canvas  clasificados/lib/preview/ClasificadosPreviewAdCanvas          LIVE-SHARED
                   render  shell/RestauranteAdStoryPreview + shell/RestaurantePreviewCard
  |
PREVIEW -> EDIT    same sessionStorage draft; no separate handoff key                    LIVE
  |
PAGAR              RestaurantePreviewClient
                   1. captureCheckoutNewsletterSubscriber(CHECKOUT_NEWSLETTER_SOURCES
                      .restaurantes)                                                     LIVE-SHARED
                   2. saveRestaurantePendingBeforeCheckout(draft)
                      -> POST /api/clasificados/restaurantes/publish {pendingPayment}
                      -> row written status = "pending_payment"                          LIVE
                   3. PublishCheckoutCheckpoint (shared)                                 LIVE-SHARED
                   4. startRevenueCategoryCheckout({...RESTAURANTES_BASE_CHECKOUT})      LIVE-SHARED
  |
REVENUE OS         revenueCategoryCheckoutPayload.RESTAURANTES_BASE_CHECKOUT
                   category "restaurantes" / packageKey "restaurantes_base_monthly"
                   price  revenuePricingMatrix:200-218  39900 cents monthly_subscription
                          stripeEligible true · capabilities ["coupons_offers"]          LIVE-SHARED
                   Client is NOT the price authority: the preview reads
                   getRevenuePackageDefinition(...).priceCents (fallback 39900) for
                   DISPLAY only; the server resolves the charge.                         PROVEN
                   `package_tier` ("free"/"standard") is a lane label, never a price.
  |
STRIPE             POST /api/revenue-os/checkout
                   NO-RECHARGE GUARD: revenueActiveEntitlementGuard:67 lists
                   "restaurantes_base_monthly" -> 409 active_entitlement_no_recharge     LIVE-SHARED
  |
WEBHOOK            POST /api/revenue-os/webhook -> stripeEventLedger claim
                   -> fulfillCheckoutSessionCompleted                                    LIVE-SHARED
  |
ENTITLEMENT        revenueEntitlementFulfillment -> listing_package_entitlements         LIVE-SHARED
  |
PUBLISH/ACTIVATION revenueFulfillment:1361/:1751 tryActivateRestauranteListingAfterEntitlement
                   -> revenueRestaurantFulfillment
                      .activatePaidRestauranteListingFromRevenueOs                       LIVE
                   pending_payment -> published, ID-KEYED
                   revenueFulfillment:1399/:1787 tryActivateRestauranteCouponAddonAfterEntitlement
                   -> activateRestauranteCouponAddonFromRevenueOs                        LIVE
                      ** only reachable via the RETIRED $79 add-on — see §5.1 **
  |
RESULTS/SEARCH     /clasificados/restaurantes/resultados   (force-dynamic)
                   -> loadRestaurantesResultsInventoryForPage()
                      tryListRestaurantesPublicListingsFromDb(2000) .eq("status","published")
                      -> overlayActiveEntitlementsForRestaurantesResults
                      -> applyRestaurantesPromotedFromEntitlement
                      -> mapRestaurantesPublicListingDbRowsToShellInventory
                      -> like counts -> resolveCanonicalVisibilityBucketWeights          LIVE
                   NO sample/blueprint fallback on the launch path (explicitly documented);
                   `inventory_unavailable` / `inventory_query_failed` return EMPTY + a banner.
                   alias /clasificados/restaurantes/results = re-export of ../resultados  LIVE
  |
PUBLIC DETAIL      /clasificados/restaurantes/[slug]   (force-dynamic)
                   getRestaurantePublicListingBySlugFromDb(slug)
                     .eq("slug") .eq("status","published")  -> else notFound()           LIVE
                   listing_json -> listingJsonToDraft -> mapRestauranteDraftToShellData
                   render shell/RestauranteAdStoryPreview inside RestaurantesShellChrome
                   coupons gated by fetchAddonEntitlementsForListings(...)               ** §5.1 **
                   linked offers fetchRestauranteLinkedOffersForPublicPage               LIVE
                   jsonLd restauranteJsonLd + breadcrumbJsonLd                           LIVE
  |
USER DASHBOARD     /dashboard/restaurantes  (558 L)
                   direct browser Supabase read of restaurantes_public_listings,
                   RLS-scoped .eq("owner_user_id", user.id)                              LIVE
                   edit: reads listing_json + draft_listing_id, forces
                         merged.draftListingId = row.draft_listing_id,
                         saves to sessionStorage, routes to the application              LIVE
                   coupon edit: hydrateRestauranteListingForCouponEdit                   LIVE
  |
ADMIN              /admin/workspace/clasificados/restaurantes                            LIVE
                   PATCH /api/admin/restaurantes/listings/[id]
                   actions: suspend | unsuspend | archive | (publish/verify/promote)     LIVE
  |
EDIT PUBLISHED     application rehydrated from listing_json (FULL draft, lossless)       LIVE
  |
SAME-ROW REPUBLISH POST /api/clasificados/restaurantes/publish
                   .eq("draft_listing_id", draft.draftListingId)   <-- DURABLE KEY
                   .eq("status", statusDecision.targetStatus)      <-- COMPARE-AND-SET
                   else -> allocateSlug + insert                                         LIVE
                   status authority: restauranteOwnerEditStatusAuthority                 LIVE
  |
RENEWAL/EXPIRATION subscriptionLifecyclePolicy:140 registers the restaurantes lane
                   (table restaurantes_public_listings, statusColumn status,
                    suspendedValue "suspended")                                          LIVE-SHARED
                   crank: /api/revenue-os/admin/subscription-sweep — NO CALLER           BUILT-NOT-WIRED
  |
ANALYTICS          lib/recordRestaurantesGlobalAnalytics.ts, lib/restaurantesCtaTracking.ts,
                   lib/restaurantesAnalyticsIdentity.ts, components/
                   RestauranteProfileViewAnalytics (6 consumer files)                    LIVE
```

### 2.1 Same-row identity — **stronger than Servicios pre-Gate-1**

Restaurantes keys the published row on **`draft_listing_id`**, a durable id minted with the draft
and stored on the row — never on the slug and never on a name-derived value. Consequences:

- A business rename **cannot** orphan the paid row: the slug is derived from the name only on
  first insert (`allocateSlug`), and an update preserves the existing slug.
- The dashboard edit path explicitly re-seeds it
  (`merged.draftListingId = data.draft_listing_id`, `dashboard/restaurantes/page.tsx:298-301`), so
  the golden loop closes on the real row.
- The update carries a **compare-and-set on `status`**, so a concurrent staff moderation or a
  Stripe webhook landing mid-edit makes the update match zero rows (409) instead of silently
  clobbering the other writer.

**Residual risk (narrow):** the draft lives in **sessionStorage**. A publish attempted from a
session that never went through the dashboard edit path mints a fresh `draftListingId` and is
therefore treated as a NEW listing — correct by definition, but it means the "edit my listing" loop
depends on always entering through the dashboard. There is no `?listingId=` server-side fallback
the way Servicios now has after Gate 1.

### 2.2 Owner edit can never self-publish — **stronger than Servicios**

`resolveRestauranteOwnerEditTargetStatus` (`app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority.ts`)
is a pure, zero-I/O authority: **an ordinary owner edit may only ever target the row's own current
status.** The `pendingPayment` request flag is deliberately not even accepted as a parameter, and an
unknown/legacy/missing status **fails closed**. Only two paths may move a row toward `published`:
the Revenue OS webhook, or the staff admin route. This closes, by construction, the class of bypass
that Gate SERVICIOS-1 had to repair defensively.

---

## 3. SHARED-TOOL CONNECTIONS

| Tool | Shared implementation | Restaurantes consumer | Status | Action |
|---|---|---|---|---|
| **Translate Ad** | `app/components/translation/TranslateAdControl` + `/api/translate-ad` | `shell/RestauranteAdStoryPreview.tsx:21,:102` + `lib/useRestauranteShellTranslation` + `lib/restaurantesTranslateAd` | **LIVE-SHARED** | none |
| **Address / privacy** | `app/lib/businessAddress/*` (+ the `resolveBusinessAddressPublicView` gate Servicios adopted in Gate 1) | **ZERO refs.** Restaurantes runs its own `shouldShowRestaurantStreetAddress` + `resolveRestaurantMapsHref(d, showStreet)` in `application/buildRestaurantContactHub.ts:391-413` | **DUPLICATE-REFERENCED** (functionally correct — it **does** gate both the street line and the maps href) | consider ADOPT; not a leak |
| **ES / EN** | `resolveClasificadosPublishLangFromSearchParams`, `appendLangToPath` | 6 files across application/results/detail/dashboard | **LIVE-SHARED** | one copy leak (§6.3) |
| **Unsaved-exit** | `useBusinessApplicationLeaveGuard` | `RestauranteApplicationClient.tsx:213` | **LIVE-SHARED** | none |
| **Media durability** | `listingMediaContract` (`buildProposedFinalMediaSet` / `validateProposedFinalMediaSet` / `warnDroppedUnpersistableMedia`) + `restauranteDraftMediaIdb` + `POST /api/clasificados/restaurantes/draft-media-upload` + `restauranteDraftPublishPrepare` | `publish/route.ts:33,:281` — **build + validate only**; `droppedUnpersistable` never read, `warnDroppedUnpersistableMedia` not imported | **LIVE-SHARED (partial)** | REPAIR (§6.1) |
| **Newsletter** | `checkoutNewsletterCapture` | `RestaurantePreviewClient:233` `CHECKOUT_NEWSLETTER_SOURCES.restaurantes` | **LIVE-SHARED** | none |
| **Call/SMS/WhatsApp/Correo** | category-local `application/restauranteContactHref.ts` + `shell/RestaurantContactHub.tsx` | public detail + preview | **LIVE** | WhatsApp does **not** use the shared `internationalWhatsApp` module ported in Gate 1 (0 refs) — §6.4 |
| **Google / Yelp** | — | `buildRestaurantContactHub`, `buildRestaurantePublishPayload`, `createEmptyRestauranteDraft`, `mapRestauranteDraftToShell` | **LIVE** | none |
| **Business Hub** | `app/components/contact/connectionHub/*` | Restaurantes runs its own `shell/RestaurantContactHub.tsx` | **DUPLICATE-REFERENCED** (working, differentiated) | PRESERVE — master §C |
| **Coupons** | base package `capabilities: ["coupons_offers"]`; `enableRestauranteCouponModuleFromCapability`; `activateRestauranteCouponAddonFromRevenueOs`; `fetchAddonEntitlementsForListings` | publish route + public detail + dashboard coupon edit | **BROKEN BRIDGE** | **P0 — §5.1** |
| **Saved Search** | `app/lib/saved-search/*` — engine + `SavedSearchButton` + adapters for autos, bienes-raices, rentas, **servicios** (Gate 2) | **ZERO refs** | **BUILT-NOT-WIRED** | ADOPT |
| **Related Listings** | no shared engine; per-category readers (`serviciosRelatedListings` is the newest reference) | **ZERO refs** | **absent** | NEW CODE (thin reader) |
| **SEO** | `seo/restauranteJsonLd.ts`, `breadcrumbJsonLd`, `leonixDiscoveryContracts` | `[slug]/page.tsx` — canonical `alternates`, LocalBusiness JSON-LD, breadcrumb JSON-LD, lang-aware category label | **LIVE** | relative JSON-LD `url`; not in sitemap (§5.4) |
| **Hours / open-now** | category-local | results: `isRestauranteOpenNowFromWeeklyHours` (tz-aware, `Intl.DateTimeFormat`); detail: `restauranteHoursPreview` + `new Date()` | **LIVE — real runtime evaluation on both surfaces** | two implementations (§6.5) |
| **Analytics** | `listing_analytics` canonical + `restaurantesAnalyticsIdentity` | 6 files | **LIVE** | `selfEngagementGuard` not referenced (0) |
| **Revenue OS / Stripe / entitlement / no-recharge** | `revenueCategoryCheckout*`, `revenuePricingMatrix`, `revenueRestaurantFulfillment`, `revenueActiveEntitlementGuard`, `stripeEventLedger` | preview → webhook → activation | **LIVE-SHARED** | none |

---

## 4. DUPLICATE / DEAD / LEGACY PATHS

**Read this before editing any Restaurantes file.**

### 4.1 Live shims and aliases — KEEP

| Path | Proof | Disposition |
|---|---|---|
| `clasificados/restaurantes/publicar/page.tsx` | `redirect()` → `/publicar/restaurantes`, preserving `lang`/`plan`/`placeType` | KEEP |
| `clasificados/restaurantes/results/page.tsx` | one-line re-export of `../resultados/page` | KEEP |
| `clasificados/restaurantes/paquetes/` | live packages page (sets `plan=pro`) | KEEP |

### 4.2 ⚠️ `shell/` IS LIVE — the biggest trap in this category

`/clasificados/restaurantes/shell` is a **dev-only design route** (`redirect()` in production,
`robots: noindex`, robots-disallowed) rendering `DEMO_RESTAURANT_DETAIL_SHELL` fixed data.

**But the folder is not dead.** `shell/RestauranteAdStoryPreview.tsx` is the **actual public detail
renderer** (imported by `[slug]/page.tsx` and by `RestaurantePreviewClient`), and
`shell/RestaurantesShellChrome` + `shell/RestaurantContactHub` + `shell/RestaurantePreviewCard` are
equally live. Deleting or "cleaning up" `shell/` on the strength of its route being demo-only would
take down the public vitrina. Only these three files inside it are zero-consumer:
`RestaurantHubReviewLinkButton.tsx`, `RestauranteDetailShell.tsx`, `RestauranteShellDataUrlModal.tsx`.

### 4.3 DEAD-ZERO-CONSUMER (22 modules — proven zero import specifiers)

| Group | Files |
|---|---|
| landing (superseded by `RestaurantesLandingPage`) | `RestaurantesLandingShell.tsx`, `RestaurantesLandingHeroGateway.tsx`, `RestaurantesCompactSearchCanvas.tsx`, `buildRestaurantesResultsHref.ts`, `restaurantesLandingAssets.ts` |
| results/discovery (superseded by `RestaurantesResultsShell`) | `resultados/RestauranteResultsClient.tsx`, `components/DiscoveryClient.tsx`, `components/RestaurantesDestacadosSection.tsx`, `components/RestauranteLandingPublishedTeasers.tsx` |
| shell | `RestaurantHubReviewLinkButton.tsx`, `RestauranteDetailShell.tsx`, `RestauranteShellDataUrlModal.tsx` |
| application | `RestaurantePublishMediaStrip.tsx`, `restaurantePreviewRequirements.ts`, `runMappingAudit.ts` |
| adapters / analytics / shared | `adapters/restauranteApplicationToDiscoveryRow.ts`, `analytics/restaurantesAnalytics.ts`, `shared/fields/restaurantesTaxonomy.ts`, `lib/restaurantesCoarseGeolocation.ts` |
| `app/lib/clasificados/restaurantes` | `RestauranteOfertasLocalesCheckoutSecondaryCard.tsx`, `RestauranteOfertasLocalesUpsellCard.tsx`, `restaurantesSellerAnalytics.ts` |

Also present: **12 historical `*_AUDIT.md`** files inside `app/lib/clasificados/restaurantes/`
(source tree, not `docs/`) — `HISTORICAL`, harmless, but they inflate that folder and belong in
`docs/restaurantes/`.

**Nothing above may be deleted in this gate.** Consumer counts are proven; retirement is a separate,
explicitly approved step (master §15), and must respect §4.2.

---

## 5. POST-PREVIEW LAUNCH GAPS

### 5.1 Coupons are owner-locked as INCLUDED but could never appear publicly — **P0 — CLOSED (RESTAURANTES-1)**

The single most serious finding. Three parts of the system disagree:

1. **Product truth** — `revenuePricingMatrix:200-218`: `restaurantes_base_monthly` ($399/mo) carries
   `capabilities: ["coupons_offers"]`, and `restaurantes_offers_addon` ($79) is retired
   (`stripeEligible: false`, `newSalesRetired: true`, `promoEligible: false`). Coupons are included.
2. **Owner enable path** — `enableRestauranteCouponModuleFromCapability`
   (`revenueRestaurantFulfillment.ts:173`, called by `/api/dashboard/enable-included-capability`)
   writes **only** `listing_json.couponUpgradeEnabled = true`. It performs **no**
   `listing_package_entitlements` insert (`grep listing_package_entitlements` in that file: 0 hits).
3. **Public render gate** — `[slug]/page.tsx` (Gate E.2.2) deliberately ignores
   `listing_json.couponUpgradeEnabled` and requires a live entitlement:
   `fetchAddonEntitlementsForListings({ category:"restaurantes", packageKey:
   RESTAURANTES_COUPON_ADDON_PACKAGE_KEY /* = "restaurantes_offers_addon" */ })`, then
   `couponAddonActive ? shellData.coupons : undefined`. The publish route applies the same gate to
   stored content (`serverVerifiedCouponEntitlement`, `route.ts:356-362`).

**Net effect:** a new $399 restaurant has no `restaurantes_offers_addon` entitlement row — nothing
creates one from a base payment — so **its coupons are stripped on publish and hidden on the public
page, permanently.** Only a legacy $79 purchase (now unpurchasable) produces that row. The owner
sees "enabled" in the dashboard and nothing on the vitrina.

**Servicios does not have this bug** because `revenueServiciosFulfillment
.grantServiciosOffersAddonEntitlementFromBasePayment` writes a real entitlement row from the base
payment. Restaurantes has **no equivalent function** — that is precisely the missing bridge.

**RESOLUTION (RESTAURANTES-1).** Owner truth is locked: $399/month, coupons INCLUDED, the retired
add-on is not a separate paid entitlement. Of the three candidate repairs, the second was taken —
**the base entitlement is the commercial authority, resolved through the existing capability
architecture** — because it requires no new entitlement row, no migration, no second checkout, and
revives no retired purchase path.

A second, independent defect was found while implementing it, and it is why the capability route
would have failed even if it had already been used:

> `revenueEntitlementFulfillment.ts:179` writes `listing_source: input.category` (the bare string
> `"restaurantes"`), but `categoryCommercialPlan.fetchEntitlementRows` filtered
> `.eq("listing_source", listingSource)` where every caller passes the **table** name
> `"restaurantes_public_listings"`. The canonical plan resolver therefore matched **zero rows for a
> genuinely paid listing** — so `resolveBusinessToolsAccess` reported "no plan", and the dashboard's
> own capability upgrade (`dashboardHasCapabilityForKey(..., "coupons_offers")`,
> `dashboard/restaurantes/page.tsx:399`) and `/api/dashboard/enable-included-capability` were
> silently broken too. `addonEntitlementReader.ts` had already documented this exact column problem
> ("Never filters by `listing_source` — Gate E.1 found that column has been written
> inconsistently"); the plan resolver had not adopted the same remedy.

Changes:
- `app/lib/listingPlans/categoryCommercialPlan.ts` — dropped the `listing_source` predicate, keeping
  `category` + `listing_id` (the durable identity). Strictly widening: it can only find rows it
  should already have found. This repairs the public page, the publish route, the owner dashboard
  badge and the enable-capability route **at once**, for Servicios as well as Restaurantes.
- new `app/(site)/clasificados/restaurantes/lib/restauranteCouponCapabilityServer.ts` —
  `restauranteCouponsCapabilityActive(listingId)`, a single write-free read that asks
  `resolveBusinessToolsAccess` for `coupons_offers`. Fails closed on an empty id or any error.
- `[slug]/page.tsx` and `api/.../publish/route.ts` — both now gate coupon rendering / stored-content
  trust on that capability instead of a live entitlement row for the retired
  `restaurantes_offers_addon` key. Gate E.2.2's doctrine is preserved exactly: the legacy
  `listing_json.couponUpgradeEnabled` flag is still **never** trusted as the authority.

Properties this preserves, proven in the verifier:
- a paid `restaurantes_base_monthly` entitlement alone yields `coupons_offers` — **no second charge,
  no add-on row, no revived checkout path** (checks 1b, 1g);
- historical $79 add-on holders keep access through the policy's own legacy-add-on branch (1c);
- `suspended` blocks and an unpaid listing denies — fails closed (1d);
- the Stripe webhook remains the sole writer of the entitlement state this reads, so the read is
  trivially idempotent and adds no fulfillment surface (1h);
- coupon **content** is untouched on publish/edit/republish — only what is rendered changes.

### 5.2 No scheduler cranks renewal / expiration / suspension — **P1 (platform-wide)**
The restaurantes lane **is** registered in `subscriptionLifecyclePolicy:140`, and webhook deliveries
plus write-time guards reconcile subscriptions. But `/api/revenue-os/admin/subscription-sweep` still
has **no caller** — no `vercel.json`, no cron route, no `pg_cron`. Identical to the Servicios finding;
it is one platform decision covering both categories.

### 5.3 Saved Search and Related Listings absent — **P2**
Zero references to either. Saved Search is now a four-category shared engine (Gate 2 added the
Servicios adapter), so this is a clean ADOPT: build a `savedSearchRestaurantesAdapter` against the
real `RestaurantesResultsShell` filter contract. Related Listings has no shared engine — a thin
category reader (cuisine + city) modeled on `serviciosRelatedListings` is the proven shape.

Note: the ledger CHECK constraint widened for `servicios` in the Gate 2 migration does **not**
include `restaurantes`; adopting Saved Search here needs the same one-line widening.

### 5.4 Published detail URLs are not in the sitemap — **P2**
`app/sitemap.ts` now emits Servicios detail URLs via `serviciosSitemapEntries` (Gate 2). Restaurantes
has only its hub in `LEONIX_SITEMAP_CATEGORY_HUBS`. The mechanism and the safety-gated reader
(`tryListRestaurantesPublicListingsFromDb`, published-only) both already exist — this is an ADOPT.

### 5.5 JSON-LD `url` was relative — **P2 — CLOSED (RESTAURANTES-1)**
**Was:** `restauranteJsonLd({ url: "/clasificados/restaurantes/<slug>" })` — a relative path, which
schema.org consumers resolve without page context, making it an unusable entity URL.

**Now:** `${LEONIX_SITE_ORIGIN}/clasificados/restaurantes/<slug>` — the same value the route already
declares as `alternates.canonical`, built with the existing origin helper (identical doctrine to the
Servicios fix in Gate SERVICIOS-1). `restauranteJsonLd` itself and the page's own canonical were
correct and are unchanged; only the argument became absolute.

### 5.6 Owner dashboard has no lifecycle controls — **P3, honest**
No pause/resume/renew/archive controls on `/dashboard/restaurantes` (0 matches). Status changes are
staff-only via the admin route. Accurate to the code; recorded so it is not mistaken for a defect
during QA. Servicios by contrast has an owner `manage` route with pause/resume.

### 5.7 Non-published listings 404 rather than showing a status page — **by design, verified**
`getRestaurantePublicListingBySlugFromDb` filters `.eq("status","published")`, so pending/suspended/
archived rows `notFound()`. This is a different model from Servicios (which renders a status page with
`noindex`), and it is internally consistent: because these URLs 404, Restaurantes needs no
`PREVIEW_NOINDEX_METADATA` branch. **Not a gap.** The owner's own view of a pending listing is
`/clasificados/restaurantes/preview`.

---

## 6. PRE-PREVIEW LAUNCH-CRITICAL GAPS

Application and Preview UX are **PROTECTED** (master §4). Everything below is a wiring or truth
defect, not a redesign.

### 6.1 Media: unpersistable drops computed and thrown away — **P1 — CLOSED (RESTAURANTES-1)**
**Was:** `publish/route.ts` built and validated the media set but never read `droppedUnpersistable`.
A `blob:`/`data:` entry surviving into a draft was dropped from the saved listing with no signal
anywhere — the owner was told the save succeeded while photos were missing.

**Now** — the existing shared pattern adopted, no second media engine (verifier asserts the publish
route defines neither `buildProposedFinalMediaSet` nor a warn helper of its own):
- `warnDroppedUnpersistableMedia("restaurantes-publish", …)` — the shared helper added to
  `listingMediaContract.ts` in Gate SERVICIOS-1; semantics identical to sealed commit `bd2ee01e`,
  which had made this exact one-line adoption;
- the dropped list is returned on **both** publish responses as `droppedUnpersistableMedia`;
- carried through `saveRestaurantePendingBeforeCheckout`'s result type so the Preview can show a
  **non-blocking** amber note beside the checkout checkpoint — payment is never blocked for this,
  and the note is deliberately rendered outside `PublishCheckoutCheckpoint` because that
  component's own note slot is newsletter-scoped;
- the dashboard-edit save path now tells the owner ("your changes were saved, but N image(s) could
  not be saved") instead of navigating silently back to the dashboard.

### 6.2 The publish checkpoint advertised the wrong Comida Local price — **P1 — CLOSED (RESTAURANTES-1)**
**Was:** the selector sold the Comida Local lane at **`$199/mes`** in both locales (6 occurrences),
while Revenue OS resolves **$129/mo** (`comida_local_base_monthly`, `priceCents: 12900`) — the price
the server actually charges — and master §9 says $129. The customer was shown $199 at the decision
point.

**Now:** all six occurrences are `$129`. Copy only — the checkpoint was not redesigned, and Revenue
OS (the price authority) was not touched. The verifier asserts the checkpoint file contains no
`$199` and that both `$129` and `$399` appear in each locale.

### 6.3 English copy contained Spanish price units — **P2 — CLOSED (RESTAURANTES-1)**
**Was:** the EN block rendered `$399/mes` / `$199/mes` — the cadence unit was never translated.

**Now:** the EN block says `/month`; the ES block still says `/mes`. The verifier asserts the EN
block contains no `/mes` and the ES block contains no `/month`, so the two cannot drift back into
each other.

### 6.4 WhatsApp did not use the shared international module — **P2 — CLOSED (RESTAURANTES-1)**
**UNKNOWN RESOLVED — it was unsafe.** Restaurantes had **two** independent naive builders, each
digit-stripping `raw` straight into `https://wa.me/{digits}` with no country-code logic at all —
`application/restauranteContactHref.ts:waHref` (public detail contact hub) and
`application/mapRestauranteDraftToShell.ts:waHref` (shell mapper). Both produced a malformed link
for any non-US number and, for a bare 10-digit US number, a `wa.me` URL with no country code — while
the same files' own `telHref`/`smsHref` siblings already prepended `+1` correctly.

Both now delegate to `buildInternationalWhatsAppWaMeHrefWithText` from the shared
`app/lib/whatsapp/internationalWhatsApp.ts` (forward-ported in Gate SERVICIOS-1), picking up the
10-digit US prefix rule, the 8-digit floor and the 15-digit E.164 ceiling. Semantics taken from
sealed commit `0e2f9b17`, which had made the identical repair.

### 6.5 Open-now: server-local time on the detail page — **P1 (worse than first traced) — CLOSED (RESTAURANTES-1)**
**The Gate-0 MRI understated this.** Both surfaces did evaluate at request time (neither was
publish-time frozen), but they were not equally correct:
- results/landing → `isRestauranteOpenNowFromWeeklyHours` — correct, timezone-pinned to
  `America/Los_Angeles` via `Intl.DateTimeFormat`;
- public detail → `computeShellHoursPreview` read `now.getDay()` / `getHours()` / `getMinutes()` —
  the **SERVER process's local time**, i.e. UTC in production. The public "Abierto ahora / Cerrado"
  badge could be wrong by several hours and disagreed with the discovery card for the same listing.

`computeShellHoursPreview` now reuses the already-correct evaluator's own helpers
(`weekdayKeyFromDateInTimeZone`, `minutesInTimeZone`, both newly exported), so both surfaces share
one timezone-pinned implementation. Behavior preserved, divergence removed — hours logic itself was
not redesigned. Semantics taken from sealed commit `652e2556` (G14).

Proven behaviorally in the verifier, not only structurally: a Mon–Fri 09:00–17:00 listing reads
**open** at 20:00 UTC (13:00 PT) — which the old server-local reading would have called *closed* —
and **closed** at 13:00 UTC (06:00 PT).

Still open (cosmetic, not a defect): the results-side field is named `openNowDemo` although it
carries real data — a naming trap, left untouched this gate.

### 6.6 Address privacy: toggle unreachable AND ineffective — **P1 (worse than first traced) — CLOSED (RESTAURANTES-1)**
Per this gate's instruction, the category-local privacy implementation was **not** refactored merely
for shared-code purity. Tracing did, however, find a real launch defect — two, in fact — so a
targeted repair was made:

1. **The toggle was unreachable.** `showExactAddress` has existed on the draft type, publish payload
   and public render path for several gates, but there was **no control for it anywhere in the live
   application form** (0 matches in `RestauranteApplicationClient.tsx`). Every restaurant published
   its exact street address with no way to opt out. Fixed by adding the checkbox with bilingual copy
   in Section E — semantics from sealed commit `652e2556` (G24).
2. **The toggle was also ineffective.** `shouldShowRestaurantStreetAddress` honoured
   `showExactAddress === false` only when `homeBasedBusiness` was **also** true, so a storefront
   restaurant that turned it off would still have published its exact address. The explicit owner
   opt-out now always wins. This second defect is **not** in the sealed branch — it was found here,
   and without it the checkbox added in (1) would have been a promise the render path did not keep.

Absent (`undefined`) still means "show", so no existing listing's already-public address changes.
The maps/directions href was already correctly gated by the same predicate
(`resolveRestaurantMapsHref(d, showStreet)`) and needed no change — directions can never point at a
now-hidden destination. The shared `businessAddressPrivacy` contract remains unadopted here by
choice; that is consistency work, not a launch blocker.

### 6.7 ES/EN — **NO GAP** (beyond §6.3). Threaded through checkpoint, application, preview, results,
detail metadata and dashboard; the detail page's category label is lang-aware and user-authored
content is never machine-translated.

### 6.8 Draft hydration & unsaved-exit — **NO GAP.** sessionStorage + IndexedDB survive in-tab reload
and preview round-trips; the shared leave guard is mounted.

### 6.9 Newsletter — **NO GAP.** Captured at checkout through the shared engine with the
`restaurantes` source tag.

### 6.10 Published→edit hydration — **NO GAP, and structurally safer than Servicios.**
Restaurantes persists the **entire draft** as `listing_json` and rehydrates with
`mergeRestauranteDraft(listing_json)` — a symmetric round-trip, not a lossy wire-profile reverse
mapper. The destructive-hydration class of defect that Gate SERVICIOS-1 had to repair (reasons,
custom reason, quick facts silently wiped) **does not exist here by construction.**

---

## 7. EXISTING SHARED FIXES AVAILABLE

All of these are already on this branch (Gates SERVICIOS-1/2) — forward-porting is adoption, not
new code:

| # | Gap | Existing implementation to adopt |
|---|---|---|
| A1 | §6.1 dropped media | `warnDroppedUnpersistableMedia` in `app/lib/media/listingMediaContract.ts` + the owner-visible notice pattern (`droppedUnpersistableMedia` on the publish response → `?mediaDropped=N` → success banner slot) |
| A2 | §5.5 relative JSON-LD url | `LEONIX_SITE_ORIGIN` + the absolute-canonical doctrine now documented on `serviciosJsonLd` |
| A3 | §5.3 Saved Search | the 4-category shared engine + `SavedSearchButton`; `app/lib/saved-search/servicios/*` is the newest 6-file adapter reference; needs the ledger CHECK widened for `restaurantes` |
| A4 | §5.4 sitemap | `serviciosSitemapEntries` in `app/sitemap.ts` is the working precedent (safety-gated reader, canonical path, try/catch, honest cap) |
| A5 | §6.6 address privacy | `resolveBusinessAddressPublicView` (`app/lib/businessAddress/businessAddressPrivacy.ts`), plus the provider/picker set forward-ported in Gate 1 |
| A6 | §6.4 WhatsApp | `app/lib/whatsapp/internationalWhatsApp.ts` |
| A7 | §5.3 Related Listings | `serviciosRelatedListings.ts` is the proven category-reader shape (bounded pool from the real published reader, explicit tiers, honest empty) |
| — | §5.1 coupons | **No adoptable fix.** `grantServiciosOffersAddonEntitlementFromBasePayment` is the right *shape*, but the decision of which of the three repairs to apply is an owner/product call, not a port. |

Sealed Globalization branch (`fix/globalization-final-closeout-2026-09` @ `e3956df8`) was not
re-mined for Restaurantes in this gate — it should be checked for Restaurantes-specific commits
before Gate RESTAURANTES-1, exactly as §7 of the Servicios map did.

---

## 8. PROTECTED / NO-TOUCH

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx` (2,871 L) and its section
  components (`RestauranteAmenitiesFormBlock`, `RestauranteApplicationSectionNav`,
  `RestauranteExternalVideoUrlsSection`) and copy modules
- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- the whole `application/` draft, media, IDB, prepare and model surface
  (`restauranteDraftStorage`, `restauranteDraftMediaIdb`, `restauranteDraftPublishPrepare`,
  `useRestauranteDraft`, `restauranteListingApplicationModel`, `createEmptyRestauranteDraft`)
- **`shell/RestauranteAdStoryPreview.tsx`, `shell/RestaurantesShellChrome.tsx`,
  `shell/RestaurantContactHub.tsx`, `shell/RestaurantePreviewCard.tsx`** — these render the live
  public vitrina despite living beside a demo-only route (§4.2)
- `app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority.ts` — the status bypass guard
- shared, multi-category: `app/lib/listingPlans/*`, `app/lib/media/listingMediaContract.ts`,
  `app/lib/saved-search/*`, `app/components/translation/*`, `useBusinessApplicationLeaveGuard`

**Do not edit anything in §4.3.** It is dead; editing it looks correct and changes nothing at runtime.

---

## 9. GATE ZERO — RESOLVED

| Question | Answer |
|---|---|
| entry route | `/clasificados/publicar/restaurantes` (two-lane selector) |
| checkpoint | same page; the paid checkpoint proper is `PublishCheckoutCheckpoint` inside Preview |
| application | `/publicar/restaurantes` → `RestauranteApplicationClient` |
| draft identity | `draftListingId` in sessionStorage `restaurantes-draft` + IDB namespace |
| preview | `/clasificados/restaurantes/preview` |
| checkout | Preview → `saveRestaurantePendingBeforeCheckout` → `startRevenueCategoryCheckout` |
| publish action | `POST /api/clasificados/restaurantes/publish` |
| results | `/clasificados/restaurantes/resultados` (`/results` aliases it) |
| public detail | `/clasificados/restaurantes/[slug]` |
| dashboard | `/dashboard/restaurantes` (direct RLS-scoped Supabase read) |
| admin | `/admin/workspace/clasificados/restaurantes` + `PATCH /api/admin/restaurantes/listings/[id]` |
| edit route | dashboard hydrate → `/publicar/restaurantes` |
| republish action | same publish route, `draft_listing_id`-keyed with status compare-and-set |
| lifecycle reader | `restauranteOwnerEditStatusAuthority` + `subscriptionLifecyclePolicy` restaurantes lane |
| analytics recorder | `recordRestaurantesGlobalAnalytics` / `restaurantesCtaTracking` / `RestauranteProfileViewAnalytics` |

**Gate Zero is clear — implementation proceeded in Gate RESTAURANTES-1 (§10).**

---

## 10. GATE RESTAURANTES-1 — IMPLEMENTATION EVIDENCE

One coherent commit on `completion/launch-lifecycle-2026-09-09`, on top of `2d28624c`
(Gate SERVICIOS-2). Not pushed. `main` untouched. Servicios not reopened. Nothing deleted.

### Files changed (12 modified, 2 new)

| File | Gate item |
|---|---|
| `app/lib/listingPlans/categoryCommercialPlan.ts` | §5.1 — drop the `listing_source` predicate |
| **new** `clasificados/restaurantes/lib/restauranteCouponCapabilityServer.ts` | §5.1 — the one coupon-truth read |
| `clasificados/restaurantes/[slug]/page.tsx` | §5.1 capability gate · §5.5 absolute JSON-LD |
| `api/clasificados/restaurantes/publish/route.ts` | §5.1 capability gate · §6.1 dropped media |
| `clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout.ts` | §6.1 carry the dropped list |
| `clasificados/restaurantes/preview/RestaurantePreviewClient.tsx` | §6.1 non-blocking owner note |
| `publicar/restaurantes/RestauranteApplicationClient.tsx` | §6.1 owner note on dashboard save · §6.6 privacy checkbox |
| `publicar/restaurantes/restauranteApplicationFormCopy.ts` | §6.6 bilingual toggle copy |
| `clasificados/publicar/restaurantes/page.tsx` | §6.2 $129 · §6.3 EN `/month` |
| `clasificados/restaurantes/lib/restauranteOpenNowFromHours.ts` | §6.5 export the tz helpers |
| `clasificados/restaurantes/application/restauranteHoursPreview.ts` | §6.5 use them |
| `clasificados/restaurantes/application/restauranteContactHref.ts` | §6.4 shared WhatsApp · §6.6 opt-out always wins |
| `clasificados/restaurantes/application/mapRestauranteDraftToShell.ts` | §6.4 shared WhatsApp |
| **new** `scripts/verify-restaurantes-gate1-lifecycle.ts` | this gate's verifier |

### Sealed Globalization branch — what was mined and what was used

Read-only from `fix/globalization-final-closeout-2026-09` @ `e3956df8`. Eight commits touch
Restaurantes; four carried semantics relevant to this gate:

| Commit | Semantics | Used? |
|---|---|---|
| `bd2ee01e` | `warnDroppedUnpersistableMedia("restaurantes-publish", …)` one-line adoption | **YES** — §6.1, extended here with the owner-visible half the sealed commit explicitly left out of scope |
| `0e2f9b17` | both `waHref` builders delegate to `internationalWhatsApp` | **YES** — §6.4, applied verbatim in semantics |
| `652e2556` | G14 timezone-safe hours + G24 `showExactAddress` checkbox | **YES** — §6.5 and §6.6(1) |
| `3c23e875` | G23 address-verifier adoption | **NO** — deliberately not taken; this gate does not refactor category-local address handling for purity (instruction 7) |
| `c6519f30`, `a1a0aaa9`, `14c1e9b5`, `85cc86f7` | hours-logic consolidation, reputation/trust, Recently Viewed/Report | **NO** — outside this gate's scope |

Two defects fixed here are **not** in the sealed branch and were found by tracing current source:
the `listing_source` filter breaking the whole capability resolver (§5.1), and
`shouldShowRestaurantStreetAddress` requiring `homeBasedBusiness` for the opt-out to apply (§6.6-2).

### Validation

| Check | Result |
|---|---|
| `scripts/verify-restaurantes-gate1-lifecycle.ts` | **15/15 PASS** — includes real policy-level entitlement decisions (base-only, legacy add-on, suspended, unpaid), a behavioral timezone proof for open-now, and real `shouldShowRestaurantStreetAddress` cases |
| `scripts/verify-servicios-gate1-lifecycle.ts` | **20/20 PASS** — no regression from the shared `categoryCommercialPlan` change |
| `scripts/verify-servicios-gate2-discovery.ts` | **19/19 PASS** — same |
| ESLint over the full changed scope | **13 errors before, 13 after — zero new** (all pre-existing unused-var findings, verified against a stashed baseline of the same file set) |
| TypeScript / build | **DEFERRED TO INTEGRATION GATE** |

### Deferred to the integration gate

1. `npm run typecheck` and `npm run build` — not attempted; four Leonix worktrees are active under a
   hard resource lock and this repo's `tsc` has exhausted the V8 heap before, even scoped.
2. Owner-browser QA, especially: pay for a new $399 restaurant → confirm coupons render publicly
   with **no** second checkout; toggle the new address privacy checkbox off → confirm the street
   line and "Cómo llegar" both disappear while the city line stays; confirm the detail-page
   open-now badge now agrees with the discovery card.
3. **No migration is required by this gate** — the coupon repair deliberately writes no new
   entitlement rows. (The still-unapplied Servicios Saved Search migration from Gate SERVICIOS-2
   remains separately outstanding.)

### Not done in this gate (by instruction)

Saved Search (§5.3), Related Listings (§5.3), sitemap (§5.4), subscription-sweep scheduler (§5.2),
dead-code deletion (§4), browser QA, aesthetics. The shared `businessAddress` contract remains
unadopted for Restaurantes by choice (§6.6). `openNowDemo`'s misleading name (§6.5) left as-is.

---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**
