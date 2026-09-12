# LEONIX OWNER COMMAND CENTER — SERVICIOS GOLDEN RECEIVER LEDGER

**Canonical destination:** `docs/launch-lifecycle/SERVICIOS_OWNER_DASHBOARD_RUNTIME_LEDGER_2026-09-11.md`  
**Date:** 2026-09-11  
**Owner lane:** User Dashboard / Owner Command Center  
**Quarterback lane:** Servicios Golden Reference lifecycle  
**Prior Gate 5 freeze HEAD:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**Committed receiver HEAD:** `394d6fdbb98891278ab2436135136e55c9fba1c7`
**Source HEAD certified (Prompt 1):** `394d6fdbb98891278ab2436135136e55c9fba1c7`
**Current production main / product SHA:** `9fcadb4daf599e15fca62adcb647abbf96ce6bd8`
**Gate 0 (2026-09-11):** COMPLETE — at that checkpoint receiver HEAD equaled then-current `origin/main` `d1b2994d`.  
**Gates 1–4 (2026-09-11):** COMPLETE — DASH-01 through DASH-76 have source-audit dispositions. Product source unchanged at that freeze. Runtime Golden listing still required.  
**Gate 5 (2026-09-11):** COMPLETE — implementation plan + ownership freeze. Product source unchanged. DASH-53 / DASH-58–60 remain Golden/shared upstream.  
**Gates A–C (2026-09-11):** COMPLETE — fetch + fast-forward reconciliation to current `origin/main` `9fcadb4d` (21 Admin OS commits; 0 semantic conflicts). Targeted Servicios-dependent DASH recheck against current main. Receiver product source not edited.  
**Gates D–E (2026-09-11):** COMPLETE — durable state checkpoint only. No product implementation.
**Gate F (2026-09-11):** COMPLETE — ledger tracked (`b49cebf6`).
**Gates J–K (2026-09-11):** COMPLETE — receiver docs pushed; remote Golden inspected read-only (not consumed).
**Gates 1–6 receiver source completion (2026-09-11):** COMPLETE — fresh DASH-01–76 TRUE/FALSE source proof against current worktree product SHA `9fcadb4d` (docs HEAD `b49cebf6`). No receiver product implementation. Bucket D empty.
**Runtime Golden listing:** NOT YET CREATED / NOT YET TESTED
**Prompt 1 (2026-09-11):** SOURCE CERTIFIED against current main `9fcadb4d` at source HEAD `394d6fdb`. Verifiers 22/22, 33/33, OK, Rentas 9/9, paid-lifecycle PASS, 182/182, Gate20 PASS. `tsc` 7 e2e-only baseline 0 new. Production build PASS (Compiled successfully in 2.9min). Product source unchanged. Isolated Preview after this docs commit is pushed. QA NOT RUN / NOT AUTHORIZED.
**Parked receiver HEAD:** `8363569110adc5755dac0ce8b23b848150fc994f`
**Prompt 2 (2026-09-11):** EXTERNAL CONTRACTS NOT LANDED — origin/main still `9fcadb4d`; no PM-authorized coordinated SHA.
**Gate status:** OCC PARKED AT `83635691` — WAITING ONLY FOR EXTERNAL GOLDEN CONTRACT LANDING — QA FORBIDDEN UNTIL PM AUTHORIZES

## 0. Executive lock

The Owner Command Center is the **receiver**. The Servicios Golden Reference thread is the **quarterback**.

**CURRENT MAIN TRUTH → RECONCILE → TRACE → BUILD ONLY REAL DASHBOARD GAPS → VERIFY → CLEAR ALL 76 → COMMIT → PUSH → ISOLATED VERCEL PREVIEW → ABSOLUTE REPORT → GOLDEN LISTING RUNTIME QA**

No stale-source coding. No duplicate architecture. No guessing. No false-green from tests. No claiming owner-runtime proof before the Golden listing exists.

## 1. Final operating locks

### Preview policy
Vercel Preview is explicitly **re-authorized only for this Servicios Golden Receiver certification**. It is an isolated integration/certification environment and does not change broader Production release doctrine.

### Stale-branch policy
Before the 76-item audit or implementation:
1. Fetch current `origin/main`.
2. Compare the receiver branch to current main.
3. If the receiver branch is behind, reconcile current main into it first.
4. Audit/build only after reconciliation.
5. If reconciliation creates a semantic conflict with active Servicios/shared contracts: **STOP → REPORT → DO NOT BLINDLY RESOLVE.**

## 2. Authority order

1. Current runtime-consumed source
2. Current `origin/main`
3. Current Dashboard receiver worktree
4. Current Servicios Golden Reference requirements
5. Current Owner Command Center architecture
6. Historical dashboard work only as provenance

The June User Dashboard audit is historical, not current truth.

## 3. Architecture lock

Preserve and consume:
- Owner Command Center
- `LeonixDashboardShell`
- `OwnerProductPageFrame`
- `OwnerEntityWorkspace`
- canonical listing identity
- listing lifecycle domain
- commercial-state resolver
- Revenue OS
- Stripe fulfillment
- entitlement system
- analytics engine
- Messages
- Saved Listings
- Saved Search
- Business Tools / Business Concierge owner bridge
- Community Trust
- Translate Ad
- media contract
- coupon/offers capability resolver
- shared address/privacy truth

**Do not create duplicate engines.**

## 4. Current-main baseline truths to reconfirm after reconciliation

Gate 0 reconfirmation against live source at HEAD = `origin/main` = `d1b2994d36b1e78f1fb91a6d3f801638156b9119` (no merge; receiver was not stale):

- `main` baseline: `d1b2994d36b1e78f1fb91a6d3f801638156b9119` — **CONFIRMED** as current `origin/main` after fetch, and identical to this receiver HEAD.
- `/dashboard/mis-anuncios/[id]` exists — **CONFIRMED** (`app/(site)/dashboard/mis-anuncios/[id]/page.tsx`). Live workspace reads `public.listings` via `fetchOwnerListingForWorkspace`; it is not the Servicios entity workspace.
- `DASHBOARD_INTERNAL_INBOX_READY = true` — **CONFIRMED** (`app/(site)/dashboard/lib/dashboardProductTruth.ts`).
- `DASHBOARD_SAVED_LISTINGS_READY = true` — **CONFIRMED** (same file).
- `DASHBOARD_SAVED_SEARCHES_READY = true` — **CONFIRMED** (same file).
- `/dashboard/guardados` is live — **CONFIRMED** (`app/(site)/dashboard/guardados/page.tsx`).
- `/dashboard/busquedas-guardadas` is live — **CONFIRMED** (`app/(site)/dashboard/busquedas-guardadas/page.tsx`). Current `CATEGORY_REGISTRY` adapters are `autos`, `bienes-raices`, `rentas` only.
- Servicios engagement identity maps to `servicios_public_listings` — **CONFIRMED** (`recordServiciosGlobalAnalytics.ts`, `resolveListingAnalyticsIdentity.ts`, owner key collection).
- Owner engagement key collection recognizes Servicios `id`, `slug`, `leonix_ad_id` — **CONFIRMED** (`collectOwnerListingKeysForAnalytics` in `app/lib/ownerEngagementListingKeys.ts`; aliases also in `serviciosLikeCountAliasKeys`).
- Servicios Pause/Resume have existing owner management authority — **CONFIRMED** (`POST /api/clasificados/servicios/manage` from `/dashboard/servicios` and `/dashboard/mis-anuncios`).
- Commercial attention should consume shared Revenue OS/entitlement truth — **CONFIRMED consumer path**: `fetchDerivedDashboardFeed` → `POST /api/dashboard/listing-package-entitlements` → `resolveCommercialStateBadges()`.
- `/dashboard/business-tools` consumes the owner-safe Business Concierge bridge — **CONFIRMED** (`GET /api/dashboard/business/home` + `GET /api/dashboard/business/diy-concierge/my-businesses`).
- Architecture is global/shared with category adapters — **CONFIRMED** (`LeonixDashboardShell` + `OwnerProductPageFrame` + `OwnerEntityWorkspace` + Servicios adapters).

If reconciled source differs, record and trace before coding. **This Gate 0: no difference from the named SHA.**

## 5. Worktree preflight

Recorded 2026-09-11 after `git fetch origin main`. Dedicated Owner Command Center worktree only. Launch-lifecycle worktree `C:/projects/elaguila-website-launch-lifecycle` was not touched.

- `pwd`: `C:\projects\elaguila-website-owner-command-center`
- worktree: `C:/projects/elaguila-website-owner-command-center` — **CONFIRMED dedicated Owner Command Center worktree** (`git worktree list`)
- branch: `integration/owner-command-center-globalization-2026-08`
- HEAD: `d1b2994d36b1e78f1fb91a6d3f801638156b9119`
- upstream: `origin/integration/owner-command-center-globalization-2026-08` (up to date)
- `origin/main`: `d1b2994d36b1e78f1fb91a6d3f801638156b9119` (fetched)
- merge-base: `d1b2994d36b1e78f1fb91a6d3f801638156b9119`
- commits on `origin/main` missing from this branch: **none**
- commits on this branch missing from `origin/main`: **none**
- git status: clean tracked tree; untracked `.claude/` only (not part of this gate)
- branch stale? **NO**
- reconciliation required? **NO**
- reconciliation result: **NOT REQUIRED** — receiver HEAD already equals current `origin/main`
- semantic conflicts? **NO**
- safe to begin trace? **YES**

## 5A. Gate 0 Source Orientation — live Servicios receiver source map

Traced 2026-09-11 against current HEAD. No product source changed. DASH-01 through DASH-76 are **not** dispositioned here.

Canonical identifiers used across this cable unless noted: `servicios_public_listings.id` (UUID), `.slug`, `.leonix_ad_id`, `.owner_user_id`. Engagement aliases: `serviciosEngagementListingKey` prefers `leonix_ad_id` → `id` → `slug`.

### DASHBOARD LIBRARY
`/dashboard` → `app/(site)/dashboard/page.tsx` (`OwnerAccountCommandCenter`) → `countOwnerActiveListingsAcrossSources` / `countOwnerInventoryListings` (`app/lib/ownerEngagementListingKeys.ts`) + `fetchDerivedDashboardFeed` → `servicios_public_listings` by `owner_user_id` (counts + payment-attention lookup via `fetchOwnerServiciosListings`). Home preview (`fetchOwnerListingsForDashboard`) reads `public.listings` only — Servicios cards are **not** in that 4-item preview.

`/dashboard/mis-anuncios` → `app/(site)/dashboard/mis-anuncios/page.tsx` + `buildServiciosInventoryItems` / `fetchOwnerServiciosListings` (`dashboardInventory.ts`) → `GET /api/clasificados/servicios/my-listings` → `listServiciosPublicListingsForOwner` → `servicios_public_listings` (`id` / `slug` / `leonix_ad_id`).

### ENTITY WORKSPACE
`/dashboard/servicios` → `app/(site)/dashboard/servicios/page.tsx` (`OwnerEntityWorkspace` + `OwnerProductPageFrame` + `LeonixDashboardShell`) → `GET /api/clasificados/servicios/my-listings` → `listServiciosPublicListingsForOwner` → `servicios_public_listings` (`id` / `slug` / `leonix_ad_id`). Dedicated manage URL from `buildServiciosDashboardActionContract.manageUrl`. **No dedicated `/dashboard/mis-anuncios/[id]` Servicios consumer** — that route is the generic `listings` workspace.

### EDIT
Manage/Edit CTA → `serviciosListingEditHref` (`serviciosDashboardOffersAddonCheckout.ts`) → `/publicar/servicios?edit=1&source=dashboard&mode=listing-edit&listingId&listingSlug&leonixAdId` → `ClasificadosServiciosApplication.tsx` hydrates via `GET /api/clasificados/servicios/my-listing?id|slug|leonixAdId` → `serviciosPublishedToApplicationDraft` → `servicios_public_listings.profile_json` (owner-scoped by `owner_user_id`). Preview: `/clasificados/publicar/servicios/preview` (same my-listing hydration).

### REPUBLISH
`ClasificadosServiciosApplication` Save → `POST /api/clasificados/servicios/publish` → same-row `servicios_public_listings.update(...).eq("slug", slug)` when existing owner row found (`existingPublicSlug` / allocated slug); insert only when no existing row. Same-row key: `slug` (+ returned `id` / `leonix_ad_id`).

### PAUSE/RESUME
UI: `/dashboard/servicios` `manageListing(slug, action)` and `/dashboard/mis-anuncios` `manageServiciosListing(slug, action)` (`dashboardMisAnunciosCategoryTools` pause/resume) → `POST /api/clasificados/servicios/manage` `{ slug, action: pause|resume }` → `servicios_public_listings.update({ listing_status }).eq("slug").eq("owner_user_id")`. Pause: `published` → `paused_unpublished`. Resume: `paused_unpublished` → `published`. Authority: bearer owner must match `owner_user_id`. This manage route does **not** itself consult Revenue OS / entitlement (source fact for later DASH-26/27).

### COMMERCIAL STATE
UI: `/dashboard/mis-anuncios` Servicios cards (`resolveCommercialStateBadges` + `commercialStateBadgesToLifecycleNote`); `/dashboard` payment-attention feed; `/dashboard/servicios` coupons via `fetchDashboardListingPackageEntitlementBadges` / `dashboardHasCapabilityForKey(..., "coupons_offers")` → `POST /api/dashboard/listing-package-entitlements` (`listingPackageEntitlementsServer` + `resolveBusinessToolsAccess` + `leonix_subscription_records` / `listing_package_entitlements`) keyed by `servicios_public_listings.id` (capability categories include `servicios`). Offers-addon flag on my-listings uses `fetchAddonEntitlementsForListings` on canonical UUID only.

### ANALYTICS
Owner UI: `/dashboard/analytics` (`fetchDashboardAnalyticsSummary`) + per-listing metrics on `/dashboard/servicios` via `fetchOwnerEngagementDashboard` → `GET /api/dashboard/owner-engagement` → `fetchOwnerDashboardAnalyticsServer` + `fetchOwnerEngagementRollupsServer`. Canonical IDs: `collectOwnerListingKeysForAnalytics` (`id`, `slug`, `leonix_ad_id`) + `serviciosBySlug` rollup. Event domain: `listing_analytics` (`source_table=servicios_public_listings`); public writers `recordServiciosGlobalAnalyticsEvent` → `POST /api/analytics/events` (`listing_view`, `phone_click`, `message_click`/SMS, `whatsapp_click`, `email_click`, `website_click`, `directions_click`, `cta_click`, `lead_created`). Likes/saves also roll up from engagement tables via `serviciosLikeCountAliasKeys`. Resolver: `resolveListingAnalyticsIdentity` case `servicios_public_listings`.

### LEADS
`/dashboard/servicios` activity (`OwnerEntityActivity`) → `GET /api/clasificados/servicios/my-leads` → `listServiciosLeadsForProvider` → `servicios_public_leads` by `provider_user_id`; listing join key `listing_slug`. Contact CTA is `mailto:` to `sender_email`.

### MESSAGES
`/dashboard/mensajes` → direct `messages` table (`receiver_id` = owner). Listing context resolves UUID `listing_id` against `public.listings` only (generic `/clasificados/anuncio/{id}`). Servicios quote/leads are **not** this inbox; they live on `servicios_public_leads`.

### SAVED LISTINGS
Public save extras: `serviciosSavedListingIdentity.ts` (`category=servicios`, `source_table=servicios_public_listings`, `listing_id` = engagement key). Persistence: `saved_listings` (`savedListingsRuntime.ts`). Owner UI `/dashboard/guardados` → `listSavedListingIdsForUser` + `resolveSavedListingsForDashboard` (resolves UUID against `servicios_public_listings.id` among other tables). Distinct from Like / Community Trust.

### SAVED SEARCH
`/dashboard/busquedas-guardadas` → `listSavedSearchesClient` → `app/api/saved-search/**` → `saved_searches` (`savedSearchServerCrud.ts`). Live `CATEGORY_REGISTRY` on that page: `autos` | `bienes-raices` | `rentas` only — **no Servicios adapter in current source**.

### BUSINESS TOOLS
`/dashboard/business-tools` → `BusinessConciergeOwnerHome` + `fetchMyBusinesses` → `GET /api/dashboard/business/diy-concierge/my-businesses` (`business_memberships` + `businesses.id`) then `GET /api/dashboard/business/home?businessId=` (owner-safe Concierge bridge). Servicios coupons rows on the same page via `fetchOwnerServiciosListings` + entitlement badges; specialized CTA `ownerBusinessToolsSpecializedGroup` from `/dashboard/servicios`. No separate Servicios business dashboard.

### COMMUNITY TRUST
`/dashboard/servicios` `OwnerEntityCommunityTrust` → `GET /api/leonix-endorsements?category=servicios&targetId={id}` → `getLeonixEndorsementSummary` / `leonix_endorsement_votes`. Canonical identity: `servicios_public_listings.id`. Analytics sidecar: `leonix_endorsement_add` / `leonix_endorsement_remove` on `listing_analytics`.

### EXTERNAL REPUTATION
Same `/dashboard/servicios` `OwnerEntityExternalReputation` — URLs only from `GET /api/clasificados/servicios/my-listings` (`google_review_url` / `yelp_review_url`) sourced from `profile_json.contact.externalReviewLinks.{googleReviewsUrl,yelpReviewsUrl}` via `safeExternalWebsiteHref`. Never invented.

### TRANSLATION
Public overlay: `ServiciosPublicTranslationLayer` → `TranslateAdControl` → `requestServiciosAdTranslation` → `POST /api/translate-ad` (session + server cache overlay; source profile unchanged). Dashboard edit hydrates authoring fields from `servicios_public_listings.profile_json` — no independent Owner Command Center translation table.

### MEDIA
Edit hydrates gallery/videos from `profile_json` via `serviciosPublishedToApplicationDraft` + `rehydrateServiciosApplicationMedia`. Uploads: `POST /api/clasificados/servicios/draft-media-upload` (Vercel Blob). Persist: `POST /api/clasificados/servicios/publish` writes `profile_json` under shared media contract (`listingMediaConfigs` pipeline `servicios`: max 24 images, 8 external videos).

### ADMIN
`/admin/workspace/clasificados/servicios` → `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` + `listServiciosPublicListingsAdminQueueFromDb` → `servicios_public_listings`. Lifecycle mutations: `updateServiciosPublicListingStatusAction` / `setServiciosListingLeonixVerifiedAction` (`.eq("id", id)`). Admin leads: `servicios_public_leads`. Admin analytics: `serviciosAdminCanonicalAnalytics.ts` (`listing_analytics` where `source_table=servicios_public_listings`).

**DASH-01 through DASH-76:** Gate 1 filled DASH-01 through DASH-23. DASH-24 through DASH-76 remain un-dispositioned.

## Gate 1 — Identity / Edit / Same-Row Source Audit

**Date:** 2026-09-11  
**HEAD:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**Product source changed:** NO

### Exact files inspected

- `app/(site)/dashboard/servicios/page.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/mis-anuncios/[id]/page.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts`
- `app/(site)/dashboard/lib/categoryDashboardActionContract.ts`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/(site)/dashboard/lib/ownerListingsQuery.ts`
- `app/api/clasificados/servicios/my-listings/route.ts`
- `app/api/clasificados/servicios/my-listing/route.ts`
- `app/api/clasificados/servicios/publish/route.ts`
- `app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts`
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts`
- `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts`
- `app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload.ts`
- `app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx`
- `app/(site)/clasificados/servicios/[slug]/page.tsx`
- `app/lib/listingPlans/revenueActiveEntitlementGuard.ts`
- `app/api/revenue-os/checkout/route.ts`
- `app/api/dashboard/enable-included-capability/route.ts`
- `app/lib/listingPlans/revenuePricingMatrix.ts`
- `app/lib/translation/provider.ts` / `serverCache.ts` / `ServiciosPublicTranslationLayer.tsx`

### Exact runtime consumers

- Library: `/dashboard/mis-anuncios` via `fetchOwnerServiciosListings` → `GET /api/clasificados/servicios/my-listings`
- Owner workspace: `/dashboard/servicios` (`OwnerEntityWorkspace`) — **not** `/dashboard/mis-anuncios/[id]`
- Edit: `serviciosListingEditHref` → `/publicar/servicios?edit=1&source=dashboard&mode=listing-edit`
- Hydration: `GET /api/clasificados/servicios/my-listing` (owner_user_id + id|slug|leonixAdId)
- Save: listing-bound preview `handlePublishFromPreview` → `POST /api/clasificados/servicios/publish` (`existingPublicSlug` from sessionStorage)
- Public: `/clasificados/servicios/[slug]` → `getServiciosPublicListingBySlugForDiscovery`

### Exact gaps found

1. Same-row publish locates the existing row by **slug only** (`existingPublicSlug` / sessionStorage). Canonical UUID and `leonix_ad_id` are **not** sent on the publish body. Missing/unprimed slug causes `allocateSlug(businessName)` then **INSERT**.
2. Publish coupon-write authority still reads retired `servicios_offers_addon` via `fetchAddonEntitlementsForListings`, while dashboard coupon UI uses base `coupons_offers` capability. New coupon edits can be stripped on save when no retired-addon row exists.
3. `customQuickFacts` is not restored in `serviciosPublishedToApplicationDraft` (defaults empty).
4. Servicios has no hide-address / private-street product flag; stored street is in `profile_json` and the public resolver can display it.

### Implementation queue (minimal; PM decision required before coding)

1. **DASH-21 / DASH-23** — Make active-edit publish locate the existing `servicios_public_listings` row by canonical UUID (`listingId` already present on dashboard edit URLs), not sessionStorage slug alone. Fail closed instead of INSERT when edit identity is present but unresolved.
2. **DASH-15 / DASH-16 persistence** — Align publish offer-write gate with live `coupons_offers` / `servicios_base_monthly` capability (stop requiring retired `servicios_offers_addon` for entitled coupon edits).
3. **DASH-18** — Restore `customQuickFacts` in published→draft hydration if that field remains a supported product input.

Do **not** build a Servicios island on `/dashboard/mis-anuncios/[id]`.

### Owner-runtime items deferred

DASH-02, DASH-03, DASH-04, DASH-05, DASH-07, DASH-08, DASH-09, DASH-10, DASH-12, DASH-13, DASH-14, DASH-15, DASH-16, DASH-18, DASH-19, DASH-21, DASH-22 (source-live; Golden listing still required).

## Cross-Thread Servicios Source Blockers from Gate 1

Recorded 2026-09-11. These are **Servicios Golden Reference / category global code** repairs. This receiver worktree must not implement them.

**OWNER OF FIX:** SERVICIOS GOLDEN REFERENCE / CATEGORY GLOBAL CODE THREAD  
**DASHBOARD SOURCE CHANGE:** NONE

### SRV-GOLDEN-01
Canonical same-row active edit is not fail-closed by UUID. Current publish path can INSERT if expected edit slug is unresolved.

- Affected receiver items: DASH-21, DASH-23
- Required Servicios-lane outcome: active edit must target the existing canonical published row and fail closed rather than allocate/insert a new row if edit identity cannot be resolved.
- Status: **RECORDED — NOT FIXED IN THIS WORKTREE**

### SRV-GOLDEN-02
Servicios base package advertises `coupons_offers`, but publish persistence still gates offer writes on retired `servicios_offers_addon`.

- Affected receiver items: DASH-16, DASH-17 runtime consequence
- Required Servicios-lane outcome: offer persistence must consume canonical current package/capability truth and must not require a retired add-on for an entitled base-package owner.
- Status: **RECORDED — NOT FIXED IN THIS WORKTREE**

### SRV-GOLDEN-03
`customQuickFacts` is not restored by the current published→application hydration adapter.

- Affected receiver item: DASH-18
- Required Servicios-lane outcome: if `customQuickFacts` remains an approved Servicios field, restore it during published edit hydration and preserve it through republish.
- Status: **RECORDED — NOT FIXED IN THIS WORKTREE**

### SRV-GOLDEN-04
Servicios Pause/Resume authority can restore `published` without validating current commercial/subscription authority.

- Affected receiver item: DASH-27
- Owner of fix: SERVICIOS GOLDEN REFERENCE / lifecycle-commercial lane
- Dashboard source change: NONE
- Required Servicios-lane outcome: Resume (and paused republish) must fail closed unless current `leonix_subscription_records` / entitlement authority permits reactivation. Payment suspension must not leave a paused row freely republishable.
- Status: **RECORDED — NOT FIXED IN THIS WORKTREE**

## 6. Classification legend

Use only:
**LIVE · LIVE-SHARED · REPAIR REQUIRED · BUILD REQUIRED · NEEDS OWNER RUNTIME PROOF · NOT SUPPORTED — CURRENT PRODUCT · UNKNOWN · BLOCKED**

`UNKNOWN` must be traced before implementation.

## 7. Proof fields for every item

Every DASH item must contain:
- Requirement
- Current source truth
- Classification
- Exact route
- Exact component/file
- Exact API/server action
- Exact table/domain
- Work required
- Implementation result
- Automated/source proof
- Preview proof where possible
- Runtime-owner proof still required
- Final disposition


# 8. Dashboard Receiver Ledger — DASH-01 through DASH-76

## Identity / Canonical Listing
### DASH-01 — Canonical Servicios owner resolver consumes servicios_public_listings
- Requirement: Owner dashboard must resolve Servicios from the canonical public table, not a parallel dashboard store.
- Current source truth: Owner cloud inventory is `listServiciosPublicListingsForOwner(userId)` → `.from("servicios_public_listings").eq("owner_user_id", ownerUserId)`. Dashboard `/dashboard` home preview does **not** use this table (`fetchOwnerListingsForDashboard` reads `public.listings` only).
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`, `/dashboard/mis-anuncios`
- Exact component/file: `app/(site)/dashboard/servicios/page.tsx`; `fetchOwnerServiciosListings` in `dashboardInventory.ts`
- Exact API/server action: `GET /api/clasificados/servicios/my-listings`
- Exact table/domain: `servicios_public_listings` (`owner_user_id`)
- Work required: None (receiver consume-only)
- Implementation result: N/A this gate
- Automated/source proof: `my-listings/route.ts` + `serviciosPublicListingsServer.ts:203-217`
- Preview proof: not run
- Runtime-owner proof still required: YES — Golden listing appears in owner inventory
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED

### DASH-02 — Dashboard preserves canonical UUID
- Requirement: Dashboard must carry `servicios_public_listings.id` and not invent a substitute identity.
- Current source truth: `GET my-listings` returns `id`. Inventory `buildServiciosInventoryItems` uses `id` (fallback `servicios:${slug}` only if id missing). Edit href sets `listingId`. Hydration `GET my-listing` prefers `id` over slug over `leonixAdId`. **Publish body does not include UUID.**
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`, `/dashboard/mis-anuncios`, `/publicar/servicios`
- Exact component/file: `servicios/page.tsx`; `dashboardInventory.ts`; `serviciosListingEditHref`
- Exact API/server action: `GET /api/clasificados/servicios/my-listings`; `GET /api/clasificados/servicios/my-listing?id=`
- Exact table/domain: `servicios_public_listings.id`
- Work required: None for dashboard display/edit URLs. Write-key gap tracked under DASH-21/23.
- Implementation result: N/A this gate
- Automated/source proof: `my-listings` maps `id`; `my-listing` `.eq("id", id)` when present
- Preview proof: not run
- Runtime-owner proof still required: YES — UUID visible and reused on Manage/Edit
- Final disposition: GATE 1 SOURCE AUDIT — LIVE (display/edit identity); UUID is not the publish write key

### DASH-03 — Dashboard preserves slug truth
- Requirement: Dashboard must preserve the public slug used as the canonical public URL key.
- Current source truth: Cloud rows keyed/displayed by `slug`. Public href `/clasificados/servicios/${slug}`. Pause/Resume body `{ slug }`. Edit href `listingSlug`. Publish same-row lookup uses `existingPublicSlug`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`, `/dashboard/mis-anuncios`
- Exact component/file: `servicios/page.tsx`; `categoryDashboardActionContract.ts`; `dashboardMisAnunciosCategoryTools.ts`
- Exact API/server action: `GET my-listings`; `POST /api/clasificados/servicios/manage`; `POST /api/clasificados/servicios/publish`
- Exact table/domain: `servicios_public_listings.slug`
- Work required: None for dashboard preservation
- Implementation result: N/A this gate
- Automated/source proof: public URL + manage + publish all slug-keyed
- Preview proof: not run
- Runtime-owner proof still required: YES — slug unchanged after Save & Republish
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-04 — Dashboard preserves Leonix Ad ID
- Requirement: Dashboard must preserve `leonix_ad_id` (SERV-YYYY-NNNNNN) as a first-class identity.
- Current source truth: `GET my-listings` returns `leonix_ad_id`. Workspace header `leonixId`. Edit href `leonixAdId`. `GET my-listing` can resolve `.eq("leonix_ad_id", leonixAdId)`. Publish UPDATE does not touch `leonix_ad_id` (preserved by omission on same-row UPDATE).
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`, `/dashboard/mis-anuncios`
- Exact component/file: `servicios/page.tsx` `OwnerEntityWorkspace` header; `serviciosListingEditHref`
- Exact API/server action: `GET my-listings`; `GET my-listing?leonixAdId=`
- Exact table/domain: `servicios_public_listings.leonix_ad_id`
- Work required: None for dashboard display/edit
- Implementation result: N/A this gate
- Automated/source proof: my-listings map + my-listing lookup + publish update select returns `leonix_ad_id`
- Preview proof: not run
- Runtime-owner proof still required: YES — Ad ID unchanged after republish
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-05 — /dashboard/mis-anuncios can resolve and render Servicios
- Requirement: Mis Anuncios library must list owner Servicios rows from canonical source.
- Current source truth: `mis-anuncios/page.tsx` loads `fetchOwnerServiciosListings` in parallel, builds `serviciosInventory`, renders category section + `cat=servicios` filter. Pause/Resume wired via `manageServiciosListing`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/mis-anuncios` (`?cat=servicios`)
- Exact component/file: `app/(site)/dashboard/mis-anuncios/page.tsx`; `buildServiciosInventoryItems`
- Exact API/server action: `GET /api/clasificados/servicios/my-listings`; `POST /api/clasificados/servicios/manage`
- Exact table/domain: `servicios_public_listings`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: `fetchOwnerServiciosListings` + `showServiciosSection` render
- Preview proof: not run
- Runtime-owner proof still required: YES — Golden listing card on Mis Anuncios
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-06 — /dashboard/mis-anuncios/[id] supports Servicios
- Requirement: Entity workspace for a Servicios listing (do not assume this route is that workspace).
- Current source truth: `/dashboard/mis-anuncios/[id]/page.tsx` loads `fetchOwnerListingForWorkspace` against **`public.listings` only**. Zero Servicios consumers. Canonical owner workspace is **`/dashboard/servicios`**. Architecture lock forbids a second category island.
- Classification: **NOT SUPPORTED — CURRENT PRODUCT**
- Owner: NONE — NOT SUPPORTED — CURRENT PRODUCT (dedicated workspace is /dashboard/servicios)
- Exact route: `/dashboard/mis-anuncios/[id]` (generic listings); live Servicios workspace `/dashboard/servicios`
- Exact component/file: `mis-anuncios/[id]/page.tsx` (`fetchOwnerListingForWorkspace`); `servicios/page.tsx`
- Exact API/server action: none for Servicios on `[id]`
- Exact table/domain: `listings` (this route); Servicios lives on `servicios_public_listings`
- Work required: Do **not** build Servicios onto `[id]`
- Implementation result: N/A this gate
- Automated/source proof: `ownerListingsQuery.ts` `.from("listings")`; grep of `[id]` has no `servicios`
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 1 SOURCE AUDIT — NOT SUPPORTED — CURRENT PRODUCT (dedicated `/dashboard/servicios` is the workspace)

### DASH-07 — View Public Listing routes to exact canonical Servicios row
- Requirement: View Public must open the canonical Servicios public row.
- Current source truth: Dashboard public CTA is `/clasificados/servicios/${encodeURIComponent(slug)}`. Public page loads `getServiciosPublicListingBySlugForDiscovery(slug)` → `servicios_public_listings` by slug. Not UUID-addressed.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/clasificados/servicios/[slug]`
- Exact component/file: `servicios/page.tsx` publicView; `mis-anuncios` `item.publicHref`; `app/(site)/clasificados/servicios/[slug]/page.tsx`
- Exact API/server action: server load `getServiciosPublicListingBySlugForDiscovery`
- Exact table/domain: `servicios_public_listings.slug`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: href construction + `[slug]/page.tsx` slug lookup
- Preview proof: not run
- Runtime-owner proof still required: YES — View Public opens the Golden row
- Final disposition: GATE 1 SOURCE AUDIT — LIVE


## Edit / Hydration / Media / Coupons / Translation
### DASH-08 — Manage/Edit action routes to the live published Servicios editor
- Requirement: Manage/Edit must open the live published Servicios editor, not a dashboard-local form.
- Current source truth: `serviciosListingEditHref` → `/publicar/servicios?edit=1&source=dashboard&mode=listing-edit&listingId&listingSlug&leonixAdId&returnPanel=servicios`. Used as primary action on `/dashboard/servicios` and Mis Anuncios. Legacy `/clasificados/publicar/servicios` is explicitly not the dashboard edit mount.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` (dashboard listing-edit)
- Exact component/file: `serviciosDashboardOffersAddonCheckout.ts`; `ClasificadosServiciosApplication.tsx` (`isDashboardListingEditMode`)
- Exact API/server action: none until hydration GET
- Exact table/domain: identity params for `servicios_public_listings`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: href builder + `isExistingDashboardListingMode` gate
- Preview proof: not run
- Runtime-owner proof still required: YES — Manage/Edit lands in hydrated editor
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-09 — Published edit hydration consumes the canonical Servicios row
- Requirement: Edit must hydrate from the owner-owned canonical row.
- Current source truth: On `editRequested`, application fetches `GET /api/clasificados/servicios/my-listing?id|slug|leonixAdId` with Bearer token. Route queries `servicios_public_listings` scoped `.eq("owner_user_id", data.user.id)`, prefers id then slug then leonix_ad_id. Maps via `serviciosPublishedToApplicationDraft`. Dashboard source clears local draft first. Primes `existingPublicSlug`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` (edit=1)
- Exact component/file: `ClasificadosServiciosApplication.tsx` hydration effect; `serviciosPublishedToApplicationDraft.ts`
- Exact API/server action: `GET /api/clasificados/servicios/my-listing`
- Exact table/domain: `servicios_public_listings` + `profile_json`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: my-listing owner filter + adapter
- Preview proof: not run
- Runtime-owner proof still required: YES — editor shows published fields
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-10 — Edit hydration restores all supported business/profile fields
- Requirement: Supported business/profile fields must restore from the published row.
- Current source truth: Adapter restores identity, city, physical address parts, contact/social/review URLs, hours, about, services (catalog ids + custom titles), highlights, amenities, payment methods, credentials/docs, gallery/cover/logo/videos, coupons/flyer/more-offers, promotions, testimonials, businessTypeId. Confirm checkboxes reset false (intentional). `customQuickFacts` is **not** mapped (stays default empty).
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` edit hydration
- Exact component/file: `serviciosPublishedToApplicationDraft.ts`
- Exact API/server action: `GET my-listing` → `profile_json`
- Exact table/domain: `servicios_public_listings.profile_json`
- Work required: Restore `customQuickFacts` if still a supported input (DASH-18)
- Implementation result: N/A this gate
- Automated/source proof: adapter field list vs application state
- Preview proof: not run
- Runtime-owner proof still required: YES — field-by-field Golden listing check
- Final disposition: GATE 1 SOURCE AUDIT — LIVE (customQuickFacts exception recorded)

### DASH-11 — Edit hydration restores hidden/private address only to authorized owner
- Requirement: Hidden/private street address restores only to the authorized owner.
- Current source truth: Owner GET my-listing returns full `profile_json.contact.physicalStreet*`. There is **no** Servicios hide-address / city-only product flag in the application. Public resolver `resolveServiciosProfile` also formats `physicalStreet` for display. Business Tools `addressVisibility` is `businesses` onboarding, not this listing editor.
- Classification: **NOT SUPPORTED — CURRENT PRODUCT**
- Owner: NONE — NOT SUPPORTED — CURRENT PRODUCT (no separate hidden-address store)
- Exact route: `/publicar/servicios` (owner hydrate); public `/clasificados/servicios/[slug]`
- Exact component/file: `my-listing/route.ts`; `serviciosPublishedToApplicationDraft.ts`; `resolveServiciosProfile.ts`
- Exact API/server action: owner-scoped GET my-listing
- Exact table/domain: `profile_json.contact.physicalStreet*`
- Work required: None unless PM later authorizes a hide-address product
- Implementation result: N/A this gate
- Automated/source proof: no hide-address field in Servicios application types; public resolver prints street
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed for current product)
- Final disposition: GATE 1 SOURCE AUDIT — NOT SUPPORTED — CURRENT PRODUCT (stored street hydrates to owner as ordinary profile data under DASH-10)

### DASH-12 — Existing photos hydrate without reupload
- Requirement: Existing photos restore as remote URLs, not forcing reupload.
- Current source truth: `mapGallery` copies `profile.gallery[].url` when HTTPS. Cover/logo via `hero.coverImageUrl` / `hero.logoUrl`. `rehydrateServiciosApplicationMedia` after hydrate. Publish transport strips data:/blob: and requires prior Blob upload only for new local files.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` edit
- Exact component/file: `serviciosPublishedToApplicationDraft.ts` `mapGallery`; `rehydrateServiciosApplicationMedia`
- Exact API/server action: GET my-listing; uploads only `POST /api/clasificados/servicios/draft-media-upload` for new files
- Exact table/domain: `profile_json.gallery` / hero URLs (Vercel Blob HTTPS)
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: `fromUrl` HTTPS-only restore
- Preview proof: not run
- Runtime-owner proof still required: YES — gallery present without reupload
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-13 — Existing videos hydrate without re-entry
- Requirement: Existing videos restore without re-pasting URLs.
- Current source truth: `mapGallery` restores `profile.galleryVideos` url + mux ids + poster + primary flag. Application rehydrate path runs after hydrate.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` edit
- Exact component/file: `serviciosPublishedToApplicationDraft.ts` videos mapping
- Exact API/server action: GET my-listing
- Exact table/domain: `profile_json.galleryVideos`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: video map + filter on url
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-14 — Existing media order/cover survives where supported
- Requirement: Cover and gallery order/featured set survive hydration.
- Current source truth: `coverUrl` from `hero.coverImageUrl`. Gallery array order preserved. `featuredGalleryIds` restored when ids still in gallery, else first 4 gallery ids. Shared media contract: max 24 images, 8 videos.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` edit
- Exact component/file: `serviciosPublishedToApplicationDraft.ts`; `listingMediaConfigs.ts` pipeline `servicios`
- Exact API/server action: GET my-listing
- Exact table/domain: `profile_json` gallery + `featuredGalleryIds` + `hero.coverImageUrl`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: featured restore + cover field
- Preview proof: not run
- Runtime-owner proof still required: YES — cover/order after hydrate and after republish
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED

### DASH-15 — Existing coupons/offers hydrate
- Requirement: Existing coupons/offers restore in the editor.
- Current source truth: `mapCoupons` (up to 4), `couponFlyer.imageUrl`, `couponMoreOffers`, `inferCouponsAddOnFromProfile` from content presence. Dashboard offers shortcut `serviciosOffersEditHref` (`mode=offers-edit`).
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/publicar/servicios` (`mode=listing-edit` or `offers-edit`)
- Exact component/file: `serviciosPublishedToApplicationDraft.ts` coupon maps; `servicios/page.tsx` offers CTA
- Exact API/server action: GET my-listing
- Exact table/domain: `profile_json.coupons` / `couponFlyer` / `couponMoreOffers`
- Work required: Persistence of **new** coupon edits while on base entitlement is a separate write-gate gap (see DASH-16 / queue item 2)
- Implementation result: N/A this gate
- Automated/source proof: coupon mapper
- Preview proof: not run
- Runtime-owner proof still required: YES — existing coupons visible in editor
- Final disposition: GATE 1 SOURCE AUDIT — LIVE

### DASH-16 — Included coupons/offers remain part of the $399 entitlement
- Requirement: Coupons/offers stay inside the $399 base entitlement, not a second charge.
- Current source truth: `servicios_base_monthly` `capabilities: ["coupons_offers"]`. Dashboard uses `dashboardHasCapabilityForKey(..., "coupons_offers")`. `startServiciosDashboardOffersAddonCheckout` is a capability check (`POST /api/dashboard/enable-included-capability`) with **no Stripe**. Retired `servicios_offers_addon` is `stripeEligible: false` / `newSalesRetired: true`. **However** publish `enforceServiciosOffersEntitlementServerTruth` still entitles offer *writes* only when `fetchAddonEntitlementsForListings({ packageKey: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY })` is `active`.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/publicar/servicios`; `POST /api/clasificados/servicios/publish`
- Exact component/file: `revenuePricingMatrix.ts`; `serviciosDashboardOffersAddonCheckout.ts`; `publish/route.ts` Gate E.3.1
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`; `POST /api/dashboard/enable-included-capability`; publish offer-write gate
- Exact table/domain: `listing_package_entitlements` (`servicios_base_monthly` vs retired `servicios_offers_addon`)
- Work required: Align publish offer-write with `coupons_offers` / base package (queue item 2)
- Implementation result: N/A this gate
- Automated/source proof: matrix capabilities vs publish addon-key lookup
- Preview proof: not run
- Runtime-owner proof still required: YES — no extra charge; coupon save persists
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED (dashboard capability); write-gate mismatch recorded

### DASH-17 — Coupon edits during active entitlement do NOT trigger another base charge
- Requirement: Editing coupons while entitled must not start another $399 checkout.
- Current source truth: Dashboard listing-bound preview sets `showFinalCheckout = !listingBoundPreview` (false). Publish from that path calls `postServiciosPublishApi` **without** `activationMode`. Pricing summary hidden in `isExistingDashboardListingMode`. Offers “activation” is capability-only. `/api/revenue-os/checkout` returns 409 `active_entitlement_no_recharge` for `servicios_base_monthly` when `requiresBaseCheckout` is false.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: listing-bound `/clasificados/publicar/servicios/preview`; `/api/revenue-os/checkout`
- Exact component/file: `ClasificadosServiciosPreviewClient.tsx`; `revenueActiveEntitlementGuard.ts`
- Exact API/server action: `POST /api/clasificados/servicios/publish` (no pending_payment); checkout guard
- Exact table/domain: `listing_package_entitlements` (`servicios_base_monthly`)
- Work required: None for no-recharge. Coupon *persist* mismatch is DASH-16 queue item 2.
- Implementation result: N/A this gate
- Automated/source proof: `showFinalCheckout` false + no activationMode + checkout 409
- Preview proof: not run
- Runtime-owner proof still required: YES — no Stripe session on coupon/save
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED

### DASH-18 — Existing custom Servicios values hydrate
- Requirement: Custom Servicios values (non-catalog) restore.
- Current source truth: Restored: `customServicesOffered` (from `profile.services` titles), `customBusinessHighlights`, `customPaymentMethods`, `customAmenityOptions` / by-group, certifications, `languageOtherLines`. **Not restored:** `customQuickFacts` (absent from adapter; default `[]`).
- Classification: **BLOCKED — SERVICIOS GOLDEN (SRV-GOLDEN-03)**
- Owner: SERVICIOS GOLDEN — SRV-GOLDEN-03 customQuickFacts hydration; other custom fields OCC-consumable
- Exact route: `/publicar/servicios` edit
- Exact component/file: `serviciosPublishedToApplicationDraft.ts`
- Exact API/server action: GET my-listing
- Exact table/domain: `profile_json` services/highlights/amenities/payment/credentials
- Work required: Restore `customQuickFacts` if product still supports that input
- Implementation result: N/A this gate
- Automated/source proof: adapter vs application custom fields
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 7 SOURCE COMPLETENESS — BLOCKED — SERVICIOS GOLDEN (SRV-GOLDEN-03); other custom fields remain OCC-consumable

### DASH-19 — Translation records remain attached to canonical listing
- Requirement: Translations stay attached to canonical listing identity; dashboard must not fork them.
- Current source truth: Public overlay `ServiciosPublicTranslationLayer` / `TranslateAdControl` uses `listingKey = analyticsListingSlug || profile.identity.slug`. `POST /api/translate-ad` → `translateAdWithConfiguredProvider` in `app/lib/translation/provider.ts` looks up/writes `translation_records` (`category` + `listing_key`). Overlay does not mutate `profile_json`. Dashboard editor has no Translate Ad write path.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public `/clasificados/servicios/[slug]`; `POST /api/translate-ad`
- Exact component/file: `ServiciosPublicTranslationLayer.tsx`; `app/lib/translation/serverCache.ts`
- Exact API/server action: `POST /api/translate-ad`
- Exact table/domain: `translation_records` (listing_key ≈ slug); session cache `leonix:adTranslate`
- Work required: None for dashboard. Slug-keyed cache would orphan if slug forked (DASH-23).
- Implementation result: N/A this gate
- Automated/source proof: listingKey + translation_records columns
- Preview proof: not run
- Runtime-owner proof still required: YES — translate overlay still works after republish
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED

### DASH-20 — Dashboard does NOT create independent translation storage
- Requirement: Owner Command Center must not invent a second translation store.
- Current source truth: No dashboard translation table, API, or editor persist. Edit hydrates authoring `profile_json` only. Translate Ad is the shared public overlay + optional `translation_records`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: none on dashboard
- Exact component/file: dashboard Servicios pages have no TranslateAdControl
- Exact API/server action: none from dashboard
- Exact table/domain: none dashboard-owned
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: grep of dashboard Servicios tree — no translation persist
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 1 SOURCE AUDIT — LIVE


## Same-Row / No-Recharge
### DASH-21 — Save & Republish targets same published Servicios row
- Requirement: Active Save & Republish must update the same published Servicios row.
- Current source truth: Dashboard edit → listing-bound preview → `handlePublishFromPreview` → `postServiciosPublishApi` with `existingPublicSlug` from sessionStorage (`servicios_last_published_slug`), primed on hydrate. Publish: `allocateSlug(businessName)` then **overwrite slug with `existingPublicSlug` only if** that slug exists and (`owner_user_id` is null or matches bearer). Then `getServiciosPublicListingBySlugFromDb(slug)` → UPDATE `.eq("slug", slug)` including business_name, city, profile_json, listing_status, updated_at, optional owner restamp. **UUID is not in the publish body.** UPDATE does not set `id` or `leonix_ad_id` (preserved by omission). Entitlement rows are not rewritten. If `existingPublicSlug` is missing/unmatched, path falls through to INSERT (DASH-23).
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/clasificados/publicar/servicios/preview` (listing-bound) → publish
- Exact component/file: `serviciosPublishClient.ts`; `publish/route.ts` lines 298–310, 436–469
- Exact API/server action: `POST /api/clasificados/servicios/publish`
- Exact table/domain: `servicios_public_listings` UPDATE by `slug`
- Work required: Queue item 1 — locate by UUID when dashboard edit identity is present
- Implementation result: N/A this gate
- Automated/source proof: existingPublicSlug reuse + update-not-insert when row found
- Preview proof: not run
- Runtime-owner proof still required: YES — same UUID/slug/Ad ID after save
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED (primed-slug happy path); UUID write-key NOT PROVEN

### DASH-22 — Normal active edit does NOT trigger new base checkout
- Requirement: Ordinary active edit must not start another $399 checkout.
- Current source truth: (1) UI: listing-bound preview `showFinalCheckout=false`; dashboard edit hides pricing/checkout; publish called without `activationMode`. (2) Publish: if existing owner row is `published` | `paused_unpublished` | `pending_review`, strict `payment_required` 402 is skipped (`allowedOwnerRepublish`). If client sent `pending_payment` against an already-published row, status stays PUBLISHED and response does not echo checkout. (3) Stripe choke: `/api/revenue-os/checkout` `requiresBaseCheckout` for `servicios_base_monthly` → 409 `active_entitlement_no_recharge`. New-application preview still has checkout (`showFinalCheckout` true) — that is first publish, not dashboard active edit.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: dashboard listing-edit + listing-bound preview; `/api/revenue-os/checkout`
- Exact component/file: `ClasificadosServiciosPreviewClient.tsx`; `publish/route.ts` payment_required + actualListingStatus; `revenueActiveEntitlementGuard.ts`
- Exact API/server action: `POST /api/clasificados/servicios/publish`; `POST /api/revenue-os/checkout`
- Exact table/domain: `listing_package_entitlements` (`servicios_base_monthly`); listing status on `servicios_public_listings`
- Work required: None for dashboard active-edit no-recharge
- Implementation result: N/A this gate
- Automated/source proof: showFinalCheckout false; no activationMode; checkout 409
- Preview proof: not run
- Runtime-owner proof still required: YES — no Stripe session on Golden edit
- Final disposition: GATE 1 SOURCE AUDIT — LIVE-SHARED

### DASH-23 — Republish cannot create duplicate Servicios public row
- Requirement: Republish must not insert a second public Servicios row.
- Current source truth: INSERT occurs when `getServiciosPublicListingBySlugFromDb(slug)` finds no row (`publish/route.ts` else-insert). `slug` is `existingPublicSlug` only when primed **and** row exists **and** `ownerUserId` is present **and** owner is null or matches. Otherwise `allocateSlug(slugifyServiciosBusinessName(businessName))` — a new unused slug **INSERT**s. Dashboard edit URLs already carry `listingId`; publish ignores it. SessionStorage miss, hydration miss, `primeServiciosExistingPublicSlug(null)` (new-app / delete-draft), or ownerUserId-null (non-strict) are source-proven duplicate paths. Unique-slug collision with another owner returns 409 `slug_conflict` (does not UPDATE that row).
- Classification: **BLOCKED — SERVICIOS GOLDEN (SRV-GOLDEN-01)**
- Owner: SERVICIOS GOLDEN — SRV-GOLDEN-01 UUID fail-closed active edit
- Exact route: `POST /api/clasificados/servicios/publish` consumed by dashboard golden-loop
- Exact component/file: `publish/route.ts` allocateSlug + insert branch; `serviciosPublishClient.ts` sessionStorage slug
- Exact API/server action: `POST /api/clasificados/servicios/publish`
- Exact table/domain: `servicios_public_listings` INSERT
- Work required: Queue item 1 — UUID-keyed same-row; fail closed on unresolved edit identity (no INSERT)
- Implementation result: none this gate (audit only)
- Automated/source proof: insert branch when existing lookup misses; UUID absent from transport body
- Preview proof: not run
- Runtime-owner proof still required: YES after repair
- Final disposition: GATE 1 SOURCE AUDIT — REPAIR REQUIRED


## Lifecycle / Moderation
### DASH-24 — Pause is owner-accessible and uses canonical Servicios management authority
- Requirement: Owner Pause must use canonical Servicios management authority, not generic `listings` pause.
- Current source truth: Two UI consumers call the same API: `/dashboard/servicios` `manageListing(slug,"pause")` and `/dashboard/mis-anuncios` `manageServiciosListing(slug,"pause")` via `buildInventoryListingActions` when `item.status==="published"`. Body `{ slug, action:"pause" }`. `POST /api/clasificados/servicios/manage` authenticates Bearer user, loads row by slug (`visibility:"all"`), requires `owner_user_id === bearer`, requires current `listing_status==="published"`, then UPDATE `listing_status="paused_unpublished"` `.eq("slug").eq("owner_user_id")`. Zero-row write → 409. No entitlement consult. Capability registry `lifecycle.pause="supported"`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/dashboard/mis-anuncios?cat=servicios`
- Exact component/file: `app/(site)/dashboard/servicios/page.tsx`; `app/(site)/dashboard/mis-anuncios/page.tsx`; `dashboardMisAnunciosCategoryTools.ts`
- Exact API/server action: `POST /api/clasificados/servicios/manage`
- Exact table/domain: `servicios_public_listings.listing_status` (`published` → `paused_unpublished`)
- Work required: None for Pause authority itself
- Implementation result: N/A this gate
- Automated/source proof: manage route pause branch + both dashboard callers
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE

### DASH-25 — Paused lifecycle state is represented correctly in Dashboard
- Requirement: Paused Servicios must display as paused, not as live/published.
- Current source truth: Inventory `status` is raw `listing_status`. Mis Anuncios uses `resolveOwnerDashboardStatusDisplay("servicios","paused_unpublished")` → canonical `paused_unpublished`, warn tone, labels "Pausado (no público)" / "Paused (unpublished)". Entity workspace uses `resolveListingUiStatus({status})` → visibility bucket `suspended` → UI `paused`. Pause CTA hidden; Resume shown. Public discovery lists only `listing_status=published`; direct `/clasificados/servicios/[slug]` still loads paused (`slug_page`) with a paused banner (not search-listed). Admin queue shows raw `listing_status`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/mis-anuncios`; `/dashboard/servicios`; public slug page
- Exact component/file: `dashboardOwnerStatusDisplay.ts`; `listingDisplayStatus.ts`; `listingLifecycleDomain.ts`; `servicios/[slug]/page.tsx`
- Exact API/server action: `GET /api/clasificados/servicios/my-listings` (status passthrough)
- Exact table/domain: `servicios_public_listings.listing_status`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: I.8B servicios mapper + pause/resume CTA gating on exact status string
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE

### DASH-26 — Resume is owner-accessible when entitlement authority permits it
- Requirement: Owner Resume must be available when commercial authority permits reactivation.
- Current source truth: Resume CTA on `/dashboard/servicios` and Mis Anuncios when `listing_status==="paused_unpublished"`. Same manage API `action:"resume"`. State machine only: current must be `paused_unpublished` → write `published`. **No read of `leonix_subscription_records`, entitlements, or `commercialWriteGuard`.** Entitled paused listings can resume (happy path). Commercially invalid paused listings can also resume — DASH-27.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/dashboard/mis-anuncios`
- Exact component/file: `servicios/page.tsx` `manageListing`; `mis-anuncios/page.tsx` `manageServiciosListing`
- Exact API/server action: `POST /api/clasificados/servicios/manage` `{action:"resume"}`
- Exact table/domain: `servicios_public_listings.listing_status` (`paused_unpublished` → `published`)
- Work required: Fail-closed commercial gating is DASH-27 (Servicios-lane), not a missing Resume button
- Implementation result: N/A this gate
- Automated/source proof: resume CTA + manage resume branch; grep of manage route — no entitlement import
- Preview proof: not run
- Runtime-owner proof still required: YES (entitled Golden pause→resume)
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-27 — Resume fails closed when commercial authority does not permit free reactivation
- Requirement: Resume must not restore public visibility when payment failed, grace expired, subscription canceled, or listing commercially suspended.
- Current source truth: Manage resume never consults Revenue OS. Payment engine `applyPaymentSuspension("servicios", listingId)` only fires from **visible** `listing_status==="published"` → writes `suspended` (+ `suspended_reason='payment'`). A **paused** row is `not_visible`, so grace-expiry/cancel suspension **does not** overwrite `paused_unpublished`. Owner Resume then publishes anyway. Sibling hole: `POST /api/clasificados/servicios/publish` `allowedOwnerRepublish` includes `paused_unpublished` and UPDATE can set `listing_status` to `published` without subscription check. Shared `commercialWriteGuard` is used by Autos/BR/checkout, **not** by servicios/manage. If listing is already `suspended`/`rejected`, manage resume 409s (`invalid_state`) — that path is fail-closed; the proven hole is **paused + invalid commercial**.
- Classification: **BLOCKED — SERVICIOS GOLDEN (SRV-GOLDEN-04)**
- Owner: SERVICIOS GOLDEN — SRV-GOLDEN-04 Resume commercial authority
- Exact route: `POST /api/clasificados/servicios/manage` (Resume); also paused republish via `POST /api/clasificados/servicios/publish`
- Exact component/file: `app/api/clasificados/servicios/manage/route.ts`; `publish/route.ts` `allowedOwnerRepublish`; `subscriptionLifecycle.ts` `applyPaymentSuspension`; `subscriptionLifecyclePolicy.ts` servicios spec
- Exact API/server action: manage resume; publish UPDATE
- Exact table/domain: `servicios_public_listings.listing_status`; unread `leonix_subscription_records`
- Work required: **SERVICIOS-LANE OWNED** — fail closed on resume/paused-republish unless subscription/entitlement permits reactivation. Do not implement in this receiver worktree.
- Implementation result: none this gate
- Automated/source proof: manage route has no subscription import; pause is excluded from `visibleStatuses: ["published"]`
- Preview proof: not run
- Runtime-owner proof still required: YES after Servicios-lane repair
- Final disposition: GATE 2 SOURCE AUDIT — REPAIR REQUIRED (SERVICIOS-LANE)

### DASH-28 — Customer cannot override Leonix suspended/rejected moderation authority
- Requirement: Owner must not self-restore a Leonix-moderated rejected/suspended listing to public.
- Current source truth: Manage pause requires `published`; resume requires `paused_unpublished`. `rejected`/`suspended` → 409 `invalid_state`. Strict publish `allowedOwnerRepublish` is only `published` | `paused_unpublished` | `pending_review` — `rejected`/`suspended` → 402 `payment_required` (wrong code, still no UPDATE). Admin `updateServiciosPublicListingStatusAction` can set those statuses by `id`. Payment-suspended listings (`listing_status=suspended`, `suspended_reason=payment`) also cannot resume via manage. Gap remaining is commercial-paused resume (DASH-27), not moderation override.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: manage + publish + admin workspace
- Exact component/file: `manage/route.ts`; `publish/route.ts`; `admin/.../servicios/actions.ts`
- Exact API/server action: `POST /api/clasificados/servicios/manage`; `POST /api/clasificados/servicios/publish`; admin `updateServiciosPublicListingStatusAction`
- Exact table/domain: `servicios_public_listings.listing_status` (`rejected`, `suspended`)
- Work required: None for moderation fail-closed; DASH-27 is commercial
- Implementation result: N/A this gate
- Automated/source proof: invalid_state 409; allowedOwnerRepublish set excludes rejected/suspended
- Preview proof: not run
- Runtime-owner proof still required: YES (attempt resume/republish on moderated row)
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-29 — Archive current Servicios support is traced and truthfully classified
- Requirement: Trace whether owner Archive exists for canonical Servicios (do not inherit `listings` archive).
- Current source truth: `OWNER_ENTITY_CAPABILITIES.servicios.lifecycle.archive = "unsupported"`. Mis Anuncios `CATEGORY_LISTING_TOOL_TRUTH.servicios` has pause/reactivate only — no archive key. Manage API actions are pause|resume only. No Servicios archive mutation. Domain helper `getAvailableOwnerActions` lists archive for paused_unpublished as generic theory; Dashboard does not wire it for Servicios.
- Classification: **NOT SUPPORTED — CURRENT PRODUCT**
- Owner: NONE — NOT SUPPORTED — CURRENT PRODUCT (no Archive)
- Exact route: none
- Exact component/file: `ownerEntityCapabilityRegistry.ts`; `dashboardMisAnunciosCategoryTools.ts`; `manage/route.ts`
- Exact API/server action: none
- Exact table/domain: none for Servicios owner archive
- Work required: None unless product later approves Archive
- Implementation result: N/A this gate
- Automated/source proof: capability + tool truth + manage action enum
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 2 SOURCE AUDIT — NOT SUPPORTED — CURRENT PRODUCT

### DASH-30 — Delete current Servicios support is traced and truthfully classified
- Requirement: Trace whether owner Delete exists for canonical Servicios (do not inherit generic listing DELETE).
- Current source truth: No owner DELETE/close on `servicios_public_listings`. Manage has no delete action. Capability `lifecycle.close="unsupported"`. Dashboard data contract: no owner DELETE on ads for generic listings either (soft archive). Admin may change status; that is not owner delete.
- Classification: **NOT SUPPORTED — CURRENT PRODUCT**
- Owner: NONE — NOT SUPPORTED — CURRENT PRODUCT (no Delete)
- Exact route: none
- Exact component/file: `manage/route.ts`; `ownerEntityCapabilityRegistry.ts`
- Exact API/server action: none
- Exact table/domain: none for owner delete
- Work required: None unless product later approves Delete
- Implementation result: N/A this gate
- Automated/source proof: no delete consumer in dashboard Servicios tools
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 2 SOURCE AUDIT — NOT SUPPORTED — CURRENT PRODUCT


## Subscription / Billing / Commercial State
### DASH-31 — Cancel Subscription current support is traced
- Requirement: Trace customer-facing subscription cancellation for Servicios.
- Current source truth: No listing-level "Cancel Subscription" CTA on `/dashboard/servicios` or Mis Anuncios Servicios cards. No dashboard API that cancels a Stripe subscription. Customer destination is `/dashboard/perfil` Billing → static `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` (if set). Stripe webhooks write `leonix_subscription_records` (`canceled`, `cancel_at_period_end`) via `revenueSubscriptionEvents.ts`. Dashboard then displays those states (DASH-37/38). Cancellation is portal/Stripe-owned, not a Servicios manage action.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/perfil` (portal CTA); Stripe webhook → subscription records
- Exact component/file: `app/(site)/dashboard/perfil/page.tsx`; `revenueSubscriptionEvents.ts`
- Exact API/server action: none for cancel-from-dashboard; webhook path updates `leonix_subscription_records`
- Exact table/domain: `leonix_subscription_records`
- Work required: Signed Billing Portal session is DASH-32 (dashboard-owned). No listing cancel button unless product adds one.
- Implementation result: N/A this gate
- Automated/source proof: grep dashboard — no cancelSubscription; perfil portal href
- Preview proof: not run
- Runtime-owner proof still required: YES (portal configured + cancel reflects on badges)
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-32 — Stripe Customer Portal current support is traced
- Requirement: Trace Stripe Customer Portal for the owner.
- Current source truth: `/dashboard/perfil` Billing CTA. If `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` is set, opens that URL in a new tab. If unset, disabled button + "portal not configured". **No** `stripe.billingPortal.sessions.create` (or any portal-session API) exists in this repo. `dashboardDataContract.ts` still documents the session route as not present. Not Servicios-specific.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER — OPTIONAL / NON-BLOCKING deferred (static portal URL traced)
- Exact route: `/dashboard/perfil`
- Exact component/file: `app/(site)/dashboard/perfil/page.tsx`; `dashboardDataContract.ts`
- Exact API/server action: none (static env URL only)
- Exact table/domain: none
- Work required: **DASHBOARD-OWNED** optional — owner-safe Billing Portal session API if static public portal URL is insufficient
- Implementation result: N/A this gate
- Automated/source proof: env-gated `<a href={NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}>`; repo grep no billingPortal
- Preview proof: not run
- Runtime-owner proof still required: YES if env is set in the Golden environment
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED (env-gated static URL; no session API)

### DASH-33 — Next renewal/current subscription state is surfaced where current architecture supports it
- Requirement: Surface current subscription / next renewal where the shared architecture supports it.
- Current source truth: Owner-safe `POST /api/dashboard/listing-package-entitlements` returns `subscriptionStates` (`status`, `cancelAtPeriodEnd`, `graceEndsAt`, `suspensionReason`, `recoveredAt`) keyed by `leonix_subscription_records.listing_id`. It does **not** select `current_period_end`. Entitlement badges include `startsAt`/`endsAt` from `listing_package_entitlements`. Mis Anuncios Servicios cards render `commercialStateBadgesToLifecycleNote` (status), not `endsAt`. BR cards (`LeonixRealEstateListingManageCard`) do render `endsAt`. `/dashboard/servicios` does not fetch `subscriptionStates`.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER — OPTIONAL / NON-BLOCKING deferred (endsAt presentation)
- Exact route: `/dashboard/mis-anuncios?cat=servicios`; `/api/dashboard/listing-package-entitlements`
- Exact component/file: `listing-package-entitlements/route.ts`; `mis-anuncios/page.tsx` lifecycleNote; `dashboardPackageEntitlementBadges.ts`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`
- Exact table/domain: `leonix_subscription_records`; `listing_package_entitlements`
- Work required: **DASHBOARD-OWNED** (optional) — project `current_period_end` and/or render `endsAt` on Servicios cards / entity workspace
- Implementation result: N/A this gate
- Automated/source proof: subscription select list omits current_period_end; Servicios card metaItems have no endsAt
- Preview proof: not run
- Runtime-owner proof still required: YES for status line on Golden listing
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-34 — Payment attention state is surfaced
- Requirement: Owner Attention / payment-attention must include Servicios when commercial badges require it.
- Current source truth: `fetchDerivedDashboardFeed` loads `fetchOwnerServiciosListings`, builds entitlement lookup `listingSource: servicios_public_listings`, `listingId: id ?? slug`. Same `fetchDashboardListingPackageEntitlementBadges` + `resolveCommercialStateBadges`. Attention keys: `grace`, `suspended_nonpayment`, `disputed`, `cancels_at_period_end`, `canceled`. Home `/dashboard` maps via `buildAccountAttentionItems`. Mis Anuncios Servicios `lifecycleNote` shows the same badges. Entity workspace does not.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard` Owner Attention; `/dashboard/mis-anuncios?cat=servicios`
- Exact component/file: `derivedDashboardFeed.ts`; `ownerAttentionModel.ts`; `dashboard/page.tsx`; `mis-anuncios/page.tsx`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`; `GET /api/clasificados/servicios/my-listings`
- Exact table/domain: `leonix_subscription_records` joined by listing UUID
- Work required: None for home + library; entity workspace omission is display-incomplete, not a second engine
- Implementation result: N/A this gate
- Automated/source proof: serviciosRows included in derived feed payment_attention loop
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE

### DASH-35 — Grace-period state is surfaced
- Requirement: Grace must display from canonical subscription truth, not a fabricated listing status.
- Current source truth: Webhooks/reconciliation set `leonix_subscription_records.status="grace"` + `grace_ends_at` (7 calendar days). Owner API returns those fields. `resolveCommercialStateBadges` emits `grace` with date. Consumed by Mis Anuncios lifecycleNote and home payment_attention. Listing row typically stays `published` during grace (`applyPaymentSuspension` waits until grace expires). Dashboard does not invent a grace listing_status.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard`; `/dashboard/mis-anuncios`
- Exact component/file: `commercialStateBadges.ts`; `subscriptionLifecycle.ts`; `listing-package-entitlements/route.ts`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`
- Exact table/domain: `leonix_subscription_records.status/grace_ends_at`
- Work required: None for adapter; Golden listing still required
- Implementation result: N/A this gate
- Automated/source proof: badge key grace; feed attention includes grace
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-36 — Failed-payment state is surfaced
- Requirement: Failed payment / nonpayment suspension must surface truthfully.
- Current source truth: After grace expiry, subscription `status="suspended"`, `suspension_reason="payment_failure"`, and if listing was `published`, `listing_status="suspended"`. Badges: `suspended_nonpayment` (or `disputed` if reason `chargeback`). Dashboard Servicios cards show that via lifecycleNote + home attention. There is no separate owner "payment_failed" listing_status string for Servicios; UI maps listing `suspended` via owner status display (danger). Failed payment while paused does not change listing_status (DASH-27).
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard`; `/dashboard/mis-anuncios`
- Exact component/file: `commercialStateBadges.ts`; `subscriptionLifecycle.ts` `reconcileSubscriptionRow`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`
- Exact table/domain: `leonix_subscription_records`; `servicios_public_listings.listing_status` when suspension applied
- Work required: None for display of applied suspension; DASH-27 for paused+failed
- Implementation result: N/A this gate
- Automated/source proof: badge suspended_nonpayment; lane spec servicios suspendedValue
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-37 — Cancels-at-period-end state is surfaced if supported
- Requirement: If Stripe cancel-at-period-end exists, dashboard must show it.
- Current source truth: Webhook persists `cancel_at_period_end` on `leonix_subscription_records`. Owner API returns `cancelAtPeriodEnd`. Resolver emits `cancels_at_period_end` when `status==="active"` and flag true. Mis Anuncios + home attention consume it. Supported.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard`; `/dashboard/mis-anuncios`
- Exact component/file: `commercialStateBadges.ts`; `revenueSubscriptionEvents.ts`; `listing-package-entitlements/route.ts`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`
- Exact table/domain: `leonix_subscription_records.cancel_at_period_end`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: badge key + derived feed attention list
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-38 — Canceled/ended subscription state is surfaced correctly
- Requirement: Canceled/ended subscription must display from canonical records.
- Current source truth: `subscriptionStatus==="canceled"` → badge `canceled` ("Suscripción cancelada"). Home payment_attention + Mis Anuncios lifecycleNote. Does not by itself unpublish a **paused** listing (DASH-27). A previously published listing should already be `suspended` if payment-suspension ran from `published`.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard`; `/dashboard/mis-anuncios`
- Exact component/file: `commercialStateBadges.ts`; `derivedDashboardFeed.ts`; `mis-anuncios/page.tsx`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`
- Exact table/domain: `leonix_subscription_records.status`
- Work required: Display LIVE-SHARED; visibility fail-closed for paused+canceled is DASH-27
- Implementation result: N/A this gate
- Automated/source proof: canceled badge + attention key
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE-SHARED

### DASH-39 — Dashboard commercial state consumes Revenue OS/entitlement truth rather than inventing separate status
- Requirement: Dashboard must not invent a second Servicios commercial status engine.
- Current source truth: Single owner-safe route `POST /api/dashboard/listing-package-entitlements` (ownership-checked) reads `listing_package_entitlements` + `leonix_subscription_records` + `resolveBusinessToolsAccess` for servicios capabilities. Display uses shared `resolveCommercialStateBadges` / `commercialStateBadgesToLifecycleNote`. No Servicios-only commercial table or parallel badge math. `/dashboard/servicios` uses the same entitlements route for `coupons_offers` only — it does not re-derive subscription status.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/api/dashboard/listing-package-entitlements`; consumers `/dashboard`, `/dashboard/mis-anuncios`, `/dashboard/servicios` (capabilities)
- Exact component/file: `listing-package-entitlements/route.ts`; `commercialStateBadges.ts`; `listingPackageEntitlementsServer.ts`; `categoryCommercialPlan.ts`
- Exact API/server action: `POST /api/dashboard/listing-package-entitlements`
- Exact table/domain: `leonix_subscription_records`; `listing_package_entitlements`
- Work required: None (do not add a Servicios commercial engine)
- Implementation result: N/A this gate
- Automated/source proof: servicios in CAPABILITY_CATEGORIES; feed comment names Servicios as monthly-sub category using the same resolver
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 2 SOURCE AUDIT — LIVE

## Gate 2 — Lifecycle / Commercial Source Audit

**Date:** 2026-09-11  
**HEAD:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**Product source changed:** NO

### Exact files inspected

- `app/api/clasificados/servicios/manage/route.ts`
- `app/api/clasificados/servicios/publish/route.ts`
- `app/(site)/dashboard/servicios/page.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts`
- `app/(site)/dashboard/lib/dashboardOwnerStatusDisplay.ts`
- `app/(site)/dashboard/lib/listingDisplayStatus.ts`
- `app/(site)/dashboard/lib/derivedDashboardFeed.ts`
- `app/(site)/dashboard/lib/dashboardPackageEntitlementBadges.ts`
- `app/(site)/dashboard/lib/ownerAttentionModel.ts`
- `app/(site)/dashboard/lib/dashboardDataContract.ts`
- `app/(site)/dashboard/perfil/page.tsx`
- `app/api/dashboard/listing-package-entitlements/route.ts`
- `app/lib/listingPlans/commercialStateBadges.ts`
- `app/lib/listingPlans/commercialWriteGuard.ts`
- `app/lib/listingPlans/subscriptionLifecycle.ts`
- `app/lib/listingPlans/subscriptionLifecyclePolicy.ts`
- `app/lib/listingPlans/revenueSubscriptionEvents.ts`
- `app/lib/listingPlans/revenueServiciosFulfillment.ts`
- `app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts`
- `app/(site)/clasificados/servicios/[slug]/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts`
- `app/lib/clasificados/listingLifecycleDomain.ts`

### Exact runtime consumers

- Pause/Resume UI: `/dashboard/servicios` + `/dashboard/mis-anuncios` → `POST /api/clasificados/servicios/manage`
- Paused display: Mis Anuncios statusDisplay + entity workspace UI status + public slug banner
- Commercial display: `/dashboard` payment_attention + `/dashboard/mis-anuncios` lifecycleNote → `POST /api/dashboard/listing-package-entitlements` → `leonix_subscription_records` / `listing_package_entitlements`
- Billing portal: `/dashboard/perfil` static env URL
- Moderation write: admin `updateServiciosPublicListingStatusAction` by UUID
- Payment visibility projection: `applyPaymentSuspension` / `liftPaymentSuspension` for category `servicios`

### Exact gaps found

1. **DASH-27 (SERVICIOS-LANE):** Resume (and paused republish) can set `listing_status=published` without reading subscription/entitlement. Payment suspension does not apply to `paused_unpublished`, so a paused + canceled/expired sub can be freely reactivated.
2. **DASH-32 (DASHBOARD-OWNED, optional):** No Stripe Billing Portal session API; perfil uses `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` only.
3. **DASH-33 (DASHBOARD-OWNED, optional):** Owner subscription payload omits `current_period_end`; Servicios cards do not render entitlement `endsAt` (BR cards do). `/dashboard/servicios` does not show commercial badges.

### Implementation queue (minimal; do not code in this worktree)

1. **DASH-27 — Servicios-lane:** Fail-close `POST /api/clasificados/servicios/manage` resume (and paused `publish` reactivation) on canceled / suspended / grace-expired commercial authority. Align with shared subscription records; do not invent a dashboard lifecycle engine.
2. **DASH-32/33 — Dashboard-owned, after PM:** signed Customer Portal session if required; optional `current_period_end`/`endsAt` on Servicios library/workspace.

Do not implement Archive/Delete for Servicios (current product: unsupported).

### Owner-runtime items deferred

DASH-24, DASH-25, DASH-26, DASH-28, DASH-31, DASH-32, DASH-33, DASH-34, DASH-35, DASH-36, DASH-37, DASH-38, DASH-39 (source-live or env-gated; Golden listing still required). DASH-27 after Servicios-lane repair.


## Analytics / Engagement / Leads / Messages
### DASH-40 — /dashboard/analytics recognizes Servicios canonical engagement identity
- Requirement: Owner analytics must roll up Servicios via canonical identity, not `public.listings` only.
- Current source truth: `collectOwnerListingKeysForAnalytics` adds `servicios_public_listings.id`, `.slug`, `.leonix_ad_id`. `GET /api/dashboard/owner-engagement` + `fetchOwnerDashboardAnalyticsServer` load `listing_analytics` by those keys and `owner_user_id`. `/dashboard/analytics` renders **totals** from that snapshot. Per-listing **leaders/laggards** use `loadHubListingsForLeaders` on `public.listings` only — Servicios rows do not appear there. Per-listing Servicios metrics live on `/dashboard/servicios` via `serviciosBySlug`.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER — OPTIONAL / NON-BLOCKING deferred (analytics leaders expansion)
- Exact route: `/dashboard/analytics`; `/dashboard/servicios`
- Exact component/file: `dashboard/analytics/page.tsx`; `ownerEngagementListingKeys.ts`; `fetchOwnerDashboardAnalyticsServer.ts`; `ownerEngagementRollupsServer.ts`
- Exact API/server action: `GET /api/dashboard/owner-engagement`; dashboard analytics summary fetch
- Exact table/domain: `listing_analytics` (`source_table=servicios_public_listings`); `servicios_public_listings`
- Work required: None for totals/workspace metrics. Optional DASHBOARD-OWNED: include Servicios in analytics leaders (do not invent a second engine).
- Implementation result: N/A this gate
- Automated/source proof: owner key collection includes servicios; leaders query listings table
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE-SHARED

### DASH-41 — Analytics resolver understands UUID/slug/Leonix Ad ID correctly
- Requirement: Writes and rollups must resolve UUID, slug, and `leonix_ad_id`.
- Current source truth: Client `recordServiciosGlobalAnalyticsEvent` sends `source_table=servicios_public_listings`, `source_id=UUID`, optional `canonical_ad_id`. `POST /api/analytics/events` → `resolveListingAnalyticsIdentity` `fetchRowByIdOrSlug` (id/slug/leonix). Persist `listing_id`/`canonical_ad_id` = `buildCanonicalAdId` (leonix_ad_id → slug → `table:uuid`). Owner rollup queries all three aliases. Ops CTA without `sourceId` skips the global write.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `POST /api/analytics/events`
- Exact component/file: `resolveListingAnalyticsIdentity.ts`; `listingAnalyticsIdentity.ts`; `recordServiciosGlobalAnalytics.ts`
- Exact API/server action: `POST /api/analytics/events`
- Exact table/domain: `listing_analytics.listing_id` / `source_id` / `canonical_ad_id`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: servicios case in resolver; buildCanonicalAdId order
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-42 — Listing views can roll up to Servicios owner analytics
- Requirement: Public profile view must persist and roll up.
- Current source truth: Live public vitrina mounts `ServiciosProfileViewAnalytics` → `trackServiciosPublicProfileView` → ops `profile_view` with `clientListingAnalytics:true` (no server mirror) + `listing_view` via `/api/analytics/events` (`event_source: detail`). Deduped ~30m. Dashboard metrics count `listing_view`. **Not** `listing_open` (Servicios does not emit it). Card navigation emits `result_card_click` separately.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/clasificados/servicios/[slug]`
- Exact component/file: `ServiciosProfileViewAnalytics.tsx`; `serviciosProfileEngagementAnalytics.ts`
- Exact API/server action: `POST /api/analytics/events`; `POST /api/clasificados/servicios/analytics`
- Exact table/domain: `listing_analytics.event_type=listing_view`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: one-shot useRef mount; map profile_view → listing_view
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-43 — Call CTA events can roll up
- Requirement: Call CTA must emit and roll up.
- Current source truth: `trackServiciosListingCta(..., "cta_call_click")` from `ServiciosBusinessHubContactCard`, `ServiciosActionPanel`, `ServiciosProfessionalHero`, result cards (`ServiciosListingResultCard`, `ServiciosHorizontalResultCard`, `ServiciosProfessionalResultCard`). Maps to `phone_click`. Requires `sourceId` (UUID) for global write.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina + results cards
- Exact component/file: `serviciosCtaIntents.ts`; contact/hero/result card files above
- Exact API/server action: `POST /api/analytics/events` (`phone_click`)
- Exact table/domain: `listing_analytics`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: map cta_call_click → phone_click; dashboard `phone_clicks`
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-44 — SMS CTA events can roll up
- Requirement: SMS/quote-message CTA must emit and roll up.
- Current source truth: No `sms_click` type. Product SMS is `cta_quote_sms_click` → `message_click` from Get Quote / gallery / services grid / business hub. Dashboard counts `message_clicks`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina quote/SMS intents
- Exact component/file: `ServiciosBusinessHubContactCard.tsx`; `ServiciosGallery.tsx`; `ServiciosServicesGrid.tsx`; `serviciosCtaIntents.ts`
- Exact API/server action: `POST /api/analytics/events` (`message_click`)
- Exact table/domain: `listing_analytics`
- Work required: None (do not invent a second SMS event type)
- Implementation result: N/A this gate
- Automated/source proof: map cta_quote_sms_click → message_click
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-45 — WhatsApp CTA events can roll up
- Requirement: WhatsApp CTA must emit and roll up.
- Current source truth: `cta_whatsapp_click` → `whatsapp_click` from hub, hero, action panel, result cards.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina + results
- Exact component/file: same CTA family as DASH-43
- Exact API/server action: `POST /api/analytics/events` (`whatsapp_click`)
- Exact table/domain: `listing_analytics`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: map + dashboard `whatsapp_clicks`
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-46 — Email CTA events can roll up
- Requirement: Email CTA must emit and roll up.
- Current source truth: `cta_email_click` → `email_click` from hub, action panel, horizontal result card. Distinct from quote **form** `lead_created`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina + results
- Exact component/file: `ServiciosBusinessHubContactCard.tsx`; `ServiciosActionPanel.tsx`; `ServiciosHorizontalResultCard.tsx`
- Exact API/server action: `POST /api/analytics/events` (`email_click`)
- Exact table/domain: `listing_analytics`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: map cta_email_click → email_click
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-47 — Website CTA events can roll up
- Requirement: Website/review outbound CTA must emit and roll up.
- Current source truth: `cta_website_click` and `cta_review_click` both map to `website_click` (hub website/social + review links; horizontal card website).
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina + results
- Exact component/file: `ServiciosBusinessHubContactCard.tsx`; `ServiciosHorizontalResultCard.tsx`
- Exact API/server action: `POST /api/analytics/events` (`website_click`)
- Exact table/domain: `listing_analytics`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: map website + review → website_click
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-48 — Directions CTA events can roll up
- Requirement: Directions/maps CTA must emit and roll up.
- Current source truth: `cta_maps_click` → `directions_click` from hub, action panel, hero, professional/horizontal result cards.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina + results
- Exact component/file: `ServiciosBusinessHubContactCard.tsx`; `ServiciosActionPanel.tsx`; `ServiciosProfessionalHero.tsx`; result cards
- Exact API/server action: `POST /api/analytics/events` (`directions_click`)
- Exact table/domain: `listing_analytics`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: map cta_maps_click → directions_click
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-49 — Share events can roll up
- Requirement: Share must emit `listing_share` and roll up.
- Current source truth: `serviciosGlobalShareRecorder` on public detail (`detail_share`) and result cards (`results_card_share`) via `LeonixShareButton`. Unused local `ServiciosHeroActions` clipboard share is **not mounted**.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public vitrina + results
- Exact component/file: `ServiciosProfileView.tsx`; `ServiciosProfessionalProfileShell.tsx`; `ServiciosListingResultCard.tsx`; `recordServiciosGlobalAnalytics.ts`
- Exact API/server action: `POST /api/analytics/events` (`listing_share`)
- Exact table/domain: `listing_analytics`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: share recorder wired on live shells
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-50 — Like/Community Trust events resolve canonical Servicios identity
- Requirement: Like and Community Trust must use canonical Servicios identity, not a generic listings key.
- Current source truth: **Like** = `LeonixLikeButton` / `ServiciosLikeEngagementCluster` → `listing_like`/`listing_unlike` with UUID `source_id`. **Community Trust** = `LeonixCommunityTrust` `category=servicios` `targetId=listing UUID` → `leonix_endorsement_votes` + sidecar `leonix_endorsement_add`/`remove` (`source_table=servicios_public_listings`). Owner workspace reads `GET /api/leonix-endorsements?category=servicios&targetId={id}`. Distinct from Save.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public hub/hero; `/dashboard/servicios`
- Exact component/file: `ServiciosLikeEngagementCluster.tsx`; `ServiciosBusinessHubContactCard.tsx`; `leonixEndorsementAnalytics.ts`; `dashboard/servicios/page.tsx`
- Exact API/server action: `POST /api/analytics/events`; endorsement RPC; `GET /api/leonix-endorsements`
- Exact table/domain: `listing_analytics`; `leonix_endorsement_votes`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: category/targetId UUID; like recorder UUID
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE-SHARED

### DASH-51 — Servicios quote/lead records resolve correctly for owner-facing destination
- Requirement: Quote requests must land in owner-visible Servicios leads, not Messages.
- Current source truth: Public `ServiciosLeadInquiryForm` ("Solicitar cotización") on professional + standard shells → `POST /api/clasificados/servicios/inquiry` → `insertServiciosPublicLead` (`listing_slug`, `provider_user_id`, sender name/email/phone-in-message, `request_kind`, `created_at`, `read_at`). Owner: `/dashboard/servicios` `GET /api/clasificados/servicios/my-leads` → `OwnerEntityActivity` (`mailto:` sender). Admin queue also lists `servicios_public_leads`. `lead_created` mirrored to `listing_analytics` (no `clientListingAnalytics` on inquiry). `read_at` is stored but dashboard does not mark-read or show a follow-up workflow. Pedir cotización CTAs that open SMS/WA/email sheets are **not** this form (they are DASH-44/45/46).
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/clasificados/servicios/[slug]` form; `/dashboard/servicios` activity
- Exact component/file: `ServiciosLeadInquiryForm.tsx`; `inquiry/route.ts`; `dashboard/servicios/page.tsx`
- Exact API/server action: `POST /api/clasificados/servicios/inquiry`; `GET /api/clasificados/servicios/my-leads`
- Exact table/domain: `servicios_public_leads` (join key `listing_slug`)
- Work required: None unless product wants read-state UX (not current)
- Implementation result: N/A this gate
- Automated/source proof: form POST + my-leads map + activity mailto
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-52 — Messages system can surface correct listing context where supported
- Requirement: Trace Messages vs Servicios quotes; do not merge them.
- Current source truth: Quotes are **category-specific leads** (`servicios_public_leads`), not `messages`. `/dashboard/mensajes` reads `messages` where `receiver_id=owner` and resolves UUID `listing_id` against **`public.listings` only** (`/clasificados/anuncio/{id}`). No Servicios sender writes into `messages` from the quote form. If a Servicios UUID appeared in `messages.listing_id`, context would not resolve.
- Classification: **NOT SUPPORTED — CURRENT PRODUCT** (Servicios quotes are not Messages; listing-context resolver is listings-only)
- Owner: NONE — NOT SUPPORTED — CURRENT PRODUCT (quotes are servicios_public_leads, not Messages)
- Exact route: `/dashboard/mensajes`
- Exact component/file: `app/(site)/dashboard/mensajes/page.tsx`
- Exact API/server action: direct Supabase `messages` select (RLS)
- Exact table/domain: `messages` + `listings` (not `servicios_public_listings`)
- Work required: None — do not duplicate messaging for quotes
- Implementation result: N/A this gate
- Automated/source proof: listing context query `.from("listings")` only; inquiry writes `servicios_public_leads`
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed product split)
- Final disposition: GATE 3 SOURCE AUDIT — NOT SUPPORTED — CURRENT PRODUCT


## Save / Guardados / Saved Search
### DASH-53 — Saved Listing engine accepts Servicios listing identity
- Requirement: Public Save must persist canonical Servicios identity into the shared saved-listings engine.
- Current source truth: Shared engine `saved_listings` + `LeonixSaveButton` + `serviciosSavedListingExtras` (`category=servicios`, `source_table=servicios_public_listings`, `source_id=UUID|slug`, `canonical_ad_id` = engagement key leonix_ad_id→id→slug) **exist**. Live public Servicios surfaces mount **Like + Share only**. `serviciosSavedListingExtras` has **zero runtime callers**. `serviciosGlobalSaveRecorder` is unused. `ServiciosHeroActions` localStorage "Guardar" is **not mounted**. `hubEngagementVariant=save_only` only hides hub Like/Share because they already render in the hero — it is not a Save control.
- Classification: **BLOCKED — SERVICIOS GOLDEN (DASH-53 public Save mounts)**
- Owner: SERVICIOS GOLDEN — public Save mounts; Guardados engine already OWNER COMMAND CENTER consume
- Exact route: public `/clasificados/servicios/[slug]` (missing Save); engine `/dashboard/guardados`
- Exact component/file: `serviciosSavedListingIdentity.ts` (unused); `LeonixSaveButton.tsx` (not imported by Servicios); live shells use `ServiciosLikeEngagementCluster` + `LeonixShareButton`
- Exact API/server action: `upsertSavedListingForUser` (not called from Servicios public)
- Exact table/domain: `saved_listings` (engine ready; no Servicios writer)
- Work required: **SHARED-ENGINE ADOPTION** — mount `LeonixSaveButton` with `serviciosSavedListingExtras` on the live public vitrina/results (Servicios public consumer). Do not invent a second save table.
- Implementation result: none this gate
- Automated/source proof: grep — no LeonixSaveButton under servicios trees; extras helper unreferenced
- Preview proof: not run
- Runtime-owner proof still required: YES after adoption
- Final disposition: GATE 3 SOURCE AUDIT — BUILD REQUIRED (SHARED-ENGINE ADOPTION)

### DASH-54 — /dashboard/guardados resolves a saved Servicios card correctly
- Requirement: Guardados must resolve a saved Servicios key to the current public row.
- Current source truth: `resolveSavedListingsForDashboard` looks up `servicios_public_listings` by UUID, then `leonix_ad_id`, else `slug`; href `/clasificados/servicios/{slug}`. Same-row republish that preserves UUID/`leonix_ad_id` would still resolve; a Gate-1 duplicate INSERT would orphan the old key. Path is live **if** a row exists; public Save currently cannot create one.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/guardados`
- Exact component/file: `savedListingsDashboardResolve.ts`; `guardados/page.tsx`
- Exact API/server action: `listSavedListingIdsForUser` + resolver (browser Supabase)
- Exact table/domain: `saved_listings` → `servicios_public_listings`
- Work required: None for resolver; blocked on DASH-53 for runtime
- Implementation result: N/A this gate
- Automated/source proof: UUID / leonix / slug branches + Servicios href
- Preview proof: not run
- Runtime-owner proof still required: YES after DASH-53
- Final disposition: GATE 3 SOURCE AUDIT — LIVE-SHARED

### DASH-55 — Guardados removal works for Servicios
- Requirement: Remove must delete only the current user's saved row.
- Current source truth: `deleteSavedListingForUser(sb, ownerId, listingId)` `.eq("user_id").eq("listing_id")` on `saved_listings`. Guardados UI calls that with the resolved card's `listing_id`. Identity-key specific; not a listing-row delete.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/guardados`
- Exact component/file: `guardados/page.tsx`; `savedListingsRuntime.ts`
- Exact API/server action: `deleteSavedListingForUser`
- Exact table/domain: `saved_listings`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: delete scoped to user_id + listing_id
- Preview proof: not run
- Runtime-owner proof still required: YES after DASH-53
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-56 — Saved Listing remains distinct from Like
- Requirement: Save and Like must not collapse.
- Current source truth: Like = `LeonixLikeButton` / `listing_like` (+ public like counts). Save (engine) = `saved_listings` / `listing_save`. Community Trust = `leonix_endorsement_votes`. Three domains. Live Servicios public currently exposes Like (and Trust), not Save.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: public Like; Guardados Save
- Exact component/file: `ServiciosLikeEngagementCluster.tsx`; `savedListingsRuntime.ts`; `leonixEndorsementServer.ts`
- Exact API/server action: analytics like vs saved_listings vs endorsement RPC
- Exact table/domain: `listing_analytics` vs `saved_listings` vs `leonix_endorsement_votes`
- Work required: Keep distinct when wiring DASH-53
- Implementation result: N/A this gate
- Automated/source proof: separate components/tables
- Preview proof: not applicable
- Runtime-owner proof still required: NO for distinctness (source-closed)
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-57 — Saved Search remains distinct from Saved Listing
- Requirement: Saved Search ≠ Saved Listing.
- Current source truth: Saved Search = `saved_searches` (category/city/price/`filter_payload`/fingerprint) via `/api/saved-search/**` + `/dashboard/busquedas-guardadas`. Saved Listing = `saved_listings` + `/dashboard/guardados`. No shared table.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/busquedas-guardadas` vs `/dashboard/guardados`
- Exact component/file: `savedSearchServerCrud.ts`; `savedListingsRuntime.ts`
- Exact API/server action: `/api/saved-search/**` vs saved_listings client helpers
- Exact table/domain: `saved_searches` vs `saved_listings`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: separate CRUD + dashboard pages
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 3 SOURCE AUDIT — LIVE

### DASH-58 — /dashboard/busquedas-guardadas supports Servicios category
- Requirement: Owner Saved Search management must support Servicios if the shared engine can adopt it.
- Current source truth: Generic engine is live (`saved_searches`, Bearer CRUD, fingerprint, email delivery). Dashboard `CATEGORY_REGISTRY` = `autos` | `bienes-raices` | `rentas` only. Public `SavedSearchButton` is on Autos/BR/Rentas results only — **not** Servicios resultados. No `app/lib/saved-search/servicios/*` adapter, matcher, results URL, or delivery resolver. API accepts any `category` string (no allowlist), but unmatched rows render without facet/URL builders. Generic engine does **not** match Servicios indirectly.
- Classification: **BLOCKED — SERVICIOS GOLDEN / SHARED UPSTREAM (DASH-58 adapter+registry)**
- Owner: SERVICIOS GOLDEN / SHARED UPSTREAM — Saved Search adapter + registry
- Exact route: `/dashboard/busquedas-guardadas`; missing `/clasificados/servicios/resultados` SavedSearchButton
- Exact component/file: `busquedas-guardadas/page.tsx` CATEGORY_REGISTRY; Rentas reference: `savedSearchRentasAdapter.ts` + matcher + `SavedSearchButton`
- Exact API/server action: `POST /api/saved-search` (generic)
- Exact table/domain: `saved_searches` (no schema change required)
- Work required: **SHARED-ENGINE ADOPTION** — Servicios adapter + matcher + results URL + dashboard registry + delivery resolver + public SavedSearchButton, consuming **existing** `serviciosBrowseParams` / discovery filters. Not a new engine. Public filter contract is Servicios-lane already; do not rewrite it.
- Implementation result: none this gate
- Automated/source proof: registry keys; no SavedSearchButton under servicios resultados
- Preview proof: not run
- Runtime-owner proof still required: YES after adoption
- Final disposition: GATE 3 SOURCE AUDIT — BUILD REQUIRED (SHARED-ENGINE ADOPTION)

### DASH-59 — Servicios Saved Search supports canonical location
- Requirement: Location must use the shared Saved Search location model.
- Current source truth: Engine location is `saved_searches.city` via `normalizeLocationKey`. Rentas also stores zip/state/country in `filter_payload`. Servicios discovery already has city/state/zip/country (`serviciosDiscoveryContract` / `serviciosBrowseParams`). No adapter maps those fields yet. Blocked on DASH-58.
- Classification: **BLOCKED — SERVICIOS GOLDEN / SHARED UPSTREAM (DASH-59)**
- Owner: SERVICIOS GOLDEN / SHARED UPSTREAM — Saved Search location
- Exact route: n/a until adapter
- Exact component/file: `savedSearchCanonicalize.ts`; `serviciosBrowseParams.ts` (source filters)
- Exact API/server action: generic saved-search CRUD
- Exact table/domain: `saved_searches.city` + `filter_payload`
- Work required: Same adoption as DASH-58 — map Servicios location into city + payload (Rentas-shaped reference). No new column.
- Implementation result: none this gate
- Automated/source proof: discovery contract lists city/zip; no servicios adapter
- Preview proof: not run
- Runtime-owner proof still required: YES after adoption
- Final disposition: GATE 3 SOURCE AUDIT — BUILD REQUIRED (SHARED-ENGINE ADOPTION)

### DASH-60 — Servicios Saved Search supports relevant category/filter payload
- Requirement: Persist only filters the live Servicios results matcher uses.
- Current source truth: Live URL/drawer filters include q, group, seller, verified, licensed, offers, photos/videos, language, etc. (`SERVICIOS_DISCOVERY_CONTRACT_VERSION=2`). No `filter_payload` adapter or matcher orchestrator. Reference: Rentas adapter copies only fields `filterRentasPublicListings` uses.
- Classification: **BLOCKED — SERVICIOS GOLDEN / SHARED UPSTREAM (DASH-60)**
- Owner: SERVICIOS GOLDEN / SHARED UPSTREAM — Saved Search filter/matcher
- Exact route: `/clasificados/servicios/resultados` (filters live; save CTA missing)
- Exact component/file: `serviciosDiscoveryContract.ts`; `serviciosResultsFilter.ts`; Rentas reference adapter
- Exact API/server action: none for Servicios
- Exact table/domain: `saved_searches.filter_payload`
- Work required: Adapter + matcher over existing public filter — no new persistence schema. Matcher/orchestrator is shared-engine adoption, not a dashboard-only registry line.
- Implementation result: none this gate
- Automated/source proof: no saved-search/servicios directory
- Preview proof: not run
- Runtime-owner proof still required: YES after adoption
- Final disposition: GATE 3 SOURCE AUDIT — BUILD REQUIRED (SHARED-ENGINE ADOPTION)

## Gate 3 — Engagement / Saved Systems Source Audit

**Date:** 2026-09-11  
**HEAD:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**Product source changed:** NO

### Exact files inspected

- `app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics.ts`
- `app/(site)/servicios/lib/serviciosCtaIntents.ts`
- `app/(site)/servicios/lib/serviciosProfileEngagementAnalytics.ts`
- `app/(site)/servicios/lib/serviciosAnalyticsIdentity.ts`
- `app/(site)/servicios/components/ServiciosProfileViewAnalytics.tsx`
- `app/(site)/servicios/components/ServiciosLeadInquiryForm.tsx`
- `app/(site)/servicios/components/ServiciosLikeEngagementCluster.tsx`
- `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`
- `app/api/analytics/events/route.ts`
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`
- `app/lib/ownerEngagementListingKeys.ts`
- `app/lib/ownerEngagementRollupsServer.ts`
- `app/admin/(dashboard)/workspace/clasificados/servicios/_lib/serviciosAdminCanonicalAnalytics.ts`
- `app/api/clasificados/servicios/inquiry/route.ts`
- `app/api/clasificados/servicios/my-leads/route.ts`
- `app/(site)/dashboard/mensajes/page.tsx`
- `app/lib/serviciosSavedListingIdentity.ts`
- `app/lib/savedListingsRuntime.ts`
- `app/lib/savedListingsDashboardResolve.ts`
- `app/(site)/dashboard/guardados/page.tsx`
- `app/(site)/dashboard/busquedas-guardadas/page.tsx`
- `app/lib/saved-search/savedSearchTypes.ts`
- `app/lib/saved-search/rentas/savedSearchRentasAdapter.ts` (reference)
- `app/(site)/clasificados/servicios/lib/serviciosDiscoveryContract.ts`

### Exact runtime consumers

- Analytics write: public vitrina/results → `POST /api/analytics/events` (+ ops log with `clientListingAnalytics`)
- Owner rollup: `/dashboard/analytics` totals + `/dashboard/servicios` `serviciosBySlug`
- Admin: `fetchServiciosAdminCanonicalAnalyticsByRows` same `listing_analytics`
- Leads: inquiry form → `servicios_public_leads` → `/dashboard/servicios` activity
- Messages: generic listings inbox only
- Guardados: resolver ready; public Save not mounted
- Saved Search: autos / bienes-raices / rentas only

### Exact gaps found

1. **DASH-53 (SHARED-ENGINE ADOPTION):** Live Servicios public has Like/Share, not `LeonixSaveButton` / `saved_listings`. Identity helper unused.
2. **DASH-58/59/60 (SHARED-ENGINE ADOPTION):** No Servicios Saved Search adapter/matcher/registry/public CTA. Engine + discovery filters already exist.
3. **DASH-40 (DASHBOARD-OWNED, optional):** Analytics leaders/laggards are `public.listings` only; Servicios totals still roll up.
4. **DASH-52:** Not a build — quotes are leads, not Messages.

### Implementation queue (minimal; do not code in this worktree)

1. **DASH-53** — Mount shared Save on live Servicios public with `serviciosSavedListingExtras`.
2. **DASH-58–60** — Servicios Saved Search adoption set (adapter, matcher, results URL, dashboard registry, delivery resolver, results `SavedSearchButton`), mapping existing discovery filters. Reference: Rentas.

Do not merge quotes into Messages. Do not invent analytics/save/search engines.

### Owner-runtime items deferred

DASH-40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 54, 55 (source-live or resolver-live; Golden listing still required). DASH-53, 58, 59, 60 after adoption.


## Business Tools / Reputation / Community Trust
### DASH-61 — Business Tools resolves correct owner/business identity for Servicios
- Requirement: Business Tools must use canonical `public.businesses.id` + membership, not listing-title inference.
- Current source truth: Servicios workspace specialized group `ownerBusinessToolsSpecializedGroup` → `/dashboard/business-tools` (no listingId). That page `fetchMyBusinesses` → `GET /api/dashboard/business/diy-concierge/my-businesses` (active `business_memberships` ∩ `businesses`). Then `fetchBusinessHome(chosen.businessId)` → `GET /api/dashboard/business/home?businessId=` → `resolveBusinessHomeAccess` requires exact membership (`cross_business_denied` 403). Canonical id is `businesses.id`. Servicios listing rows are not the business id; coupon rows on the same page are listing capability links back to `/dashboard/servicios`.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios` doorway; `/dashboard/business-tools`
- Exact component/file: `ownerBusinessToolsSpecializedGroup.ts`; `business-tools/page.tsx`; `businessHomeClient.ts`; `businessHome/access.ts`
- Exact API/server action: `GET /api/dashboard/business/diy-concierge/my-businesses`; `GET /api/dashboard/business/home`
- Exact table/domain: `business_memberships`; `public.businesses`
- Work required: None (do not infer business from listing title)
- Implementation result: N/A this gate
- Automated/source proof: membership exact-match; 403 cross_business_denied
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE-SHARED

### DASH-62 — Do not create a separate Servicios business dashboard
- Requirement: Do not fork a Servicios-only Concierge/business OS.
- Current source truth: `/dashboard/servicios` is the listing `OwnerEntityWorkspace`. Business intelligence is shared `BusinessConciergeOwnerHome` on `/dashboard/business-tools`. No Servicios Concierge copy, no `/dashboard/servicios/business` route.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios` vs `/dashboard/business-tools`
- Exact component/file: `dashboard/servicios/page.tsx`; `BusinessConciergeOwnerHome.tsx`
- Exact API/server action: none extra
- Exact table/domain: listing vs businesses (distinct)
- Work required: None — keep the split
- Implementation result: N/A this gate
- Automated/source proof: single specialized href to shared business-tools
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 4 SOURCE AUDIT — LIVE

### DASH-63 — Google link is shown only when real stored provider URL exists
- Requirement: Google link only from stored URL; never fabricate ratings/counts.
- Current source truth: `GET /api/clasificados/servicios/my-listings` reads `profile_json.contact.externalReviewLinks.googleReviewsUrl` through `safeExternalWebsiteHref` (http/s only; dangerous schemes stripped). Dashboard `/dashboard/servicios` pushes `{provider:"google", href}` only if that value is truthy. `OwnerEntityExternalReputation` renders `<a href>` labels only — no stars, no review counts. Missing/invalid → field null → section omitted.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`
- Exact component/file: `my-listings/route.ts`; `serviciosProfileSanitize.ts`; `OwnerEntityExternalReputation.tsx`; `dashboard/servicios/page.tsx`
- Exact API/server action: `GET /api/clasificados/servicios/my-listings`
- Exact table/domain: `servicios_public_listings.profile_json`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: validator + omit-empty section; no rating props
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE

### DASH-64 — Yelp link is shown only when real stored provider URL exists
- Requirement: Same fail-closed rule for Yelp.
- Current source truth: Parallel to DASH-63 using `yelpReviewsUrl` → `yelp_review_url`. Same validator and presentation component.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`
- Exact component/file: same as DASH-63
- Exact API/server action: `GET /api/clasificados/servicios/my-listings`
- Exact table/domain: `servicios_public_listings.profile_json`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: yelp field + OwnerEntityExternalReputation
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE

### DASH-65 — Google/Yelp remain separate from Leonix Community Trust
- Requirement: Do not merge external links with Community Trust.
- Current source truth: External reputation section = stored Google/Yelp hrefs. Community Trust = `OwnerEntityCommunityTrust` from `GET /api/leonix-endorsements`. Separate props, components, and domains. Comments forbid merging.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`
- Exact component/file: `OwnerEntityExternalReputation.tsx`; `OwnerEntityCommunityTrust.tsx`; `OwnerEntityWorkspace.tsx` section order
- Exact API/server action: my-listings vs leonix-endorsements
- Exact table/domain: `profile_json` vs `leonix_endorsement_votes`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: two sections, two APIs
- Preview proof: not applicable
- Runtime-owner proof still required: NO (source-closed)
- Final disposition: GATE 4 SOURCE AUDIT — LIVE

### DASH-66 — Community Trust shows real persisted Leonix counts only
- Requirement: Owner-facing counts must be persisted Leonix votes; zero is truthful; not stars/saves/Google.
- Current source truth: Public votes persist in `leonix_endorsement_votes` keyed `category=servicios` + `targetId=servicios_public_listings.id`. Dashboard fetches the same GET summary (read-only; owner cannot self-vote here). Zero-count keys still render. Registry is discrete endorsements, not 1–5 stars. Distinct from `servicios_listing_reviews` and `saved_listings`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`
- Exact component/file: `dashboard/servicios/page.tsx`; `OwnerEntityCommunityTrust.tsx`; `leonixEndorsementRegistry.ts`
- Exact API/server action: `GET /api/leonix-endorsements?category=servicios&targetId=`
- Exact table/domain: `leonix_endorsement_votes`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: read-only owner component; zero still shown
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE


## Admin Parity
### DASH-67 — Owner Dashboard and Admin both resolve same canonical Servicios listing source
- Requirement: Same canonical listing table/identity.
- Current source truth: Dashboard inventory/workspace/edit/public all terminate in `servicios_public_listings` (`id`/`slug`/`leonix_ad_id`). Admin queue `/admin/workspace/clasificados/servicios` lists the same table; status mutations `.eq("id")`.
- Classification: **LIVE**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/dashboard/mis-anuncios`; `/admin/workspace/clasificados/servicios`
- Exact component/file: `listServiciosPublicListingsForOwner`; `listServiciosPublicListingsAdminQueueFromDb`; `servicios/actions.ts`
- Exact API/server action: my-listings vs admin queue
- Exact table/domain: `servicios_public_listings`
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: both select the same table
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE

### DASH-68 — Dashboard lifecycle state and Admin lifecycle state use the same truth
- Requirement: Same lifecycle source; different controls OK; mutation must not contradict commercial/moderation truth.
- Current source truth: **Read:** both sides display `servicios_public_listings.listing_status` (dashboard via my-listings; admin via queue + `updateServiciosPublicListingStatusAction`). **Write:** Admin may set published/paused/rejected/suspended. Owner Pause/Resume uses the same column via manage. Owner Resume does **not** consult commercial records (DASH-27 / SRV-GOLDEN-04) — dashboard can write `published` while subscription truth would reject free reactivation. Same column, unsafe owner mutation vs commercial.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: manage API; admin actions
- Exact component/file: `manage/route.ts`; `admin/.../servicios/actions.ts`
- Exact API/server action: `POST /api/clasificados/servicios/manage`; `updateServiciosPublicListingStatusAction`
- Exact table/domain: `servicios_public_listings.listing_status`
- Work required: None extra here — DASH-27 owns the mutation fail-closed repair
- Implementation result: N/A this gate
- Automated/source proof: same column; resume ignores subscription
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE-SHARED (read parity PROVEN; owner mutation not fail-closed commercially)

### DASH-69 — Dashboard package/entitlement and Admin package/entitlement use the same commercial truth
- Requirement: Same Revenue OS / entitlement / subscription tables.
- Current source truth: Dashboard: `POST /api/dashboard/listing-package-entitlements` → `listing_package_entitlements` + `leonix_subscription_records` + `resolveCommercialStateBadges`. Admin Servicios **listing queue** monetization uses `resolveCategoryListingMonetization` from the listing row (plan catalog; `package_entitlement_not_supplied` warning) — it does **not** load subscription rows on that card. Admin **customer** commercial context (`fetchAdminCustomerCommercialContext`) reads the same entitlement/subscription tables as dashboard. Underlying commercial truth is shared; Admin queue UI is a different projection.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: dashboard entitlements API; admin usuarios commercial; admin Servicios monetization panel
- Exact component/file: `listing-package-entitlements/route.ts`; `adminCustomerCommercialContext.ts`; `ServiciosAdminMonetizationPanel.tsx`
- Exact API/server action: dashboard POST entitlements; admin customer aggregator
- Exact table/domain: `listing_package_entitlements`; `leonix_subscription_records`
- Work required: None for dashboard receiver. Do not invent a second commercial engine.
- Implementation result: N/A this gate
- Automated/source proof: shared badge resolver on customer admin; queue panel is catalog-only
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE AUDIT — LIVE-SHARED


## Responsive / Mobile
### DASH-70 — Mobile 390px Owner Command Center construction is safe
- Requirement: Source construction for ~390px: drawer nav, primary dominance, overflow sheet, wrapping — not visual QA.
- Current source truth: `LeonixDashboardShell` below `sm` (640px): hamburger trigger `sm:hidden`, nav is a fixed drawer (`w-[min(88vw,360px)]`), not a persistent sidebar. Page `overflow-x-hidden` + grid `min-w-0`. `OwnerEntityWorkspace` / `DashboardCategoryListingCard`: primary action always visible; quick/lifecycle/specialized collapse into `DashboardMobileActionSheet` (`md:hidden`). Action bars `flex-wrap` + `break-words`. Specialized tools stack in the sheet. **Source construction only — no browser QA this gate.**
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard`, `/dashboard/mis-anuncios`, `/dashboard/servicios`, `/dashboard/business-tools`
- Exact component/file: `LeonixDashboardShell.tsx`; `OwnerEntityWorkspace.tsx`; `DashboardMobileActionSheet.tsx`; `DashboardListingActionBar.tsx`
- Exact API/server action: n/a (CSS/layout)
- Exact table/domain: n/a
- Work required: None from source defects found; NEEDS OWNER RUNTIME PROOF
- Implementation result: N/A this gate
- Automated/source proof: sm:hidden trigger; md:hidden sheet; flex-wrap/break-words
- Preview proof: not run (explicitly not visual QA)
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

### DASH-71 — Tablet 768px construction is safe
- Requirement: Navigation/layout adaptation; wrap cards/actions/metrics; columns only where safe.
- Current source truth: At 768px (`md`/`sm+`): shell sidebar becomes in-flow (`sm:static sm:block`) in a **single-column** grid until `lg` (1024). Action bars show inline (`md:block` / `md:flex`). Metrics `flex-wrap`. Compact Mis Anuncios two-column only at `lg:flex`. No 768-specific fixed-width action wall in these consumers.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: same dashboard surfaces
- Exact component/file: `LeonixDashboardShell.tsx` (`sm:` / `lg:grid-cols`); `DashboardCategoryListingCard.tsx` (`lg:flex`)
- Exact API/server action: n/a
- Exact table/domain: n/a
- Work required: None from source; runtime proof still required
- Implementation result: N/A this gate
- Automated/source proof: lg: two-column grid; md: inline actions
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

### DASH-72 — Desktop 1440px construction is safe
- Requirement: Persistent workbench/sidebar, sane max-width, not mobile-forced.
- Current source truth: Workbench `lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]`, main `max-w-[90rem]`. Sidebar persistent at `lg+`. Actions inline, not in the mobile sheet (`md:hidden` sheet). No source-imposed mobile-only treatment at 1440.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: workbench dashboard pages
- Exact component/file: `LeonixDashboardShell.tsx` (`contentLayout="workbench"`)
- Exact API/server action: n/a
- Exact table/domain: n/a
- Work required: None from source; runtime proof still required
- Implementation result: N/A this gate
- Automated/source proof: lg grid + max-w-[90rem]
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

### DASH-73 — Long business names and lifecycle labels wrap safely
- Requirement: Long names/labels must wrap, not force overflow.
- Current source truth: `OwnerEntityHeader` title sits in `min-w-0`; h1 has no `whitespace-nowrap` (normal wrap). Action labels `break-words leading-snug`. Status chips are color classes without nowrap. Mis Anuncios card title has no nowrap (wraps); subtitle `truncate` (slug only). No source `nowrap` on Servicios business names. Unbreakable strings still need runtime check.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/dashboard/mis-anuncios`
- Exact component/file: `OwnerEntityHeader.tsx`; `DashboardCategoryListingCard.tsx`; `DashboardListingActionBar.tsx`
- Exact API/server action: n/a
- Exact table/domain: n/a
- Work required: None from a proven nowrap defect
- Implementation result: N/A this gate
- Automated/source proof: min-w-0 + break-words on actions; no nowrap on titles
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

### DASH-74 — Owner actions do not create persistent horizontal overflow
- Requirement: Actions must wrap/overflow into sheet, not a fixed-width wall.
- Current source truth: `DashboardListingActionBar` `flex min-w-0 max-w-full flex-wrap`. Mobile sheet for secondary groups. Shell `overflow-x-hidden` as last-resort net after `min-w-0` grid fix (BCO-3R-B.7). Specialized groups stack.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: workspace + mis-anuncios cards
- Exact component/file: `DashboardListingActionBar.tsx`; `OwnerEntityWorkspace.tsx`; `LeonixDashboardShell.tsx`
- Exact API/server action: n/a
- Exact table/domain: n/a
- Work required: None from a proven fixed-width wall
- Implementation result: N/A this gate
- Automated/source proof: flex-wrap + mobile sheet + min-w-0
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

### DASH-75 — Primary Manage/Edit action is obvious on mobile
- Requirement: Primary Manage/Edit remains visible/dominant on mobile.
- Current source truth: Workspace `primaryAction` always rendered (tone primary) outside the sheet. Mis Anuncios Servicios first action is `tone:"primary"` edit/openPanel (`serviciosListingEditHref`). Sheet holds the rest (`md:hidden`).
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/dashboard/mis-anuncios`
- Exact component/file: `OwnerEntityWorkspace.tsx`; `dashboardMisAnunciosCategoryTools.ts`; `DashboardCategoryListingCard.tsx`
- Exact API/server action: n/a
- Exact table/domain: n/a
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: primary slot always mounted; edit is first primary
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

### DASH-76 — Secondary lifecycle actions are organized safely on mobile
- Requirement: Pause/Resume and other secondary actions organized, not a mobile wall.
- Current source truth: Pause/Resume are `lifecycleActions` (`warning`/`positive`). On `md+` they render in their own action bar. Below `md` they go in `DashboardMobileActionSheet` after quick actions, before specialized. Mis Anuncios card groups lifecycle by tone into the same sheet.
- Classification: **LIVE-SHARED**
- Owner: OWNER COMMAND CENTER (consume); remaining work none in this receiver
- Exact route: `/dashboard/servicios`; `/dashboard/mis-anuncios`
- Exact component/file: `OwnerEntityWorkspace.tsx` overflowActions order; `DashboardCategoryListingCard.tsx` restActions
- Exact API/server action: n/a
- Exact table/domain: n/a
- Work required: None
- Implementation result: N/A this gate
- Automated/source proof: lifecycle hidden md:block; sheet includes lifecycle
- Preview proof: not run
- Runtime-owner proof still required: YES
- Final disposition: GATE 4 SOURCE CONSTRUCTION — LIVE-SHARED · NEEDS OWNER RUNTIME PROOF

## Gate 4 — Business / Admin / Responsive Source Audit

**Date:** 2026-09-11  
**HEAD:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**Product source changed:** NO

### Exact files inspected

- `app/(site)/dashboard/lib/ownerBusinessToolsSpecializedGroup.ts`
- `app/(site)/dashboard/business-tools/page.tsx`
- `app/(site)/dashboard/lib/businessHomeClient.ts`
- `app/api/dashboard/business/diy-concierge/my-businesses/route.ts`
- `app/api/dashboard/business/home/route.ts`
- `app/lib/business/businessHome/access.ts`
- `app/api/clasificados/servicios/my-listings/route.ts`
- `app/(site)/servicios/lib/serviciosProfileSanitize.ts`
- `app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx`
- `app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx`
- `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts`
- `app/admin/_lib/adminCustomerCommercialContext.ts`
- `app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminMonetizationPanel.tsx`
- `app/(site)/dashboard/components/LeonixDashboardShell.tsx`
- `app/(site)/dashboard/components/OwnerEntityWorkspace.tsx`
- `app/(site)/dashboard/components/OwnerEntityHeader.tsx`
- `app/(site)/dashboard/components/DashboardListingActionBar.tsx`
- `app/(site)/dashboard/components/DashboardMobileActionSheet.tsx`
- `app/(site)/dashboard/components/DashboardCategoryListingCard.tsx`

### Exact gaps found this gate

None new that require product implementation in this receiver. DASH-68 commercial fail-closed remains SRV-GOLDEN-04 / DASH-27. DASH-69 Admin listing-queue monetization is a catalog projection, not a second engine.

Responsive items are **source-construction LIVE-SHARED** and still need Golden listing visual QA (not claimed here).

## Full 76-item Source Audit Closure Inventory

Inventory only. Dispositions from Gates 1–4. Runtime Golden listing still required for SOURCE READY items.

### A. SOURCE READY — runtime proof still needed

DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-07, DASH-08, DASH-09, DASH-10, DASH-12, DASH-13, DASH-14, DASH-15, DASH-16, DASH-17, DASH-18, DASH-19, DASH-20, DASH-21, DASH-22, DASH-24, DASH-25, DASH-26, DASH-28, DASH-31, DASH-34, DASH-35, DASH-36, DASH-37, DASH-38, DASH-39, DASH-41, DASH-42, DASH-43, DASH-44, DASH-45, DASH-46, DASH-47, DASH-48, DASH-49, DASH-50, DASH-51, DASH-54, DASH-55, DASH-56, DASH-57, DASH-61, DASH-62, DASH-63, DASH-64, DASH-65, DASH-66, DASH-67, DASH-68, DASH-69, DASH-70, DASH-71, DASH-72, DASH-73, DASH-74, DASH-75, DASH-76

(Cross-thread SRV-GOLDEN-01/02/03 still affect DASH-21 happy-path, DASH-16 persist, DASH-18 `customQuickFacts` without reclassifying those items away from LIVE/LIVE-SHARED.)

### B. REPAIR / BUILD REQUIRED

NONE in this receiver. Former DASH-23 / DASH-27 / DASH-53 / DASH-58 / DASH-59 / DASH-60 are **BLOCKED — SERVICIOS GOLDEN / SHARED UPSTREAM**, not Owner Command Center product work.

### C. NOT SUPPORTED — CURRENT PRODUCT

DASH-06, DASH-11, DASH-29, DASH-30, DASH-52

### D. OPTIONAL / NON-BLOCKING PRESENTATION ENHANCEMENT

DASH-32 (signed Billing Portal session vs static env URL), DASH-33 (`current_period_end` / `endsAt` on Servicios cards), DASH-40 (Servicios rows in `/dashboard/analytics` leaders)

### E. BLOCKED / UNKNOWN

**BLOCKED — SERVICIOS GOLDEN / SHARED UPSTREAM (current-main source):** DASH-18 (`customQuickFacts` hydration / SRV-GOLDEN-03), DASH-23 (SRV-GOLDEN-01), DASH-27 (SRV-GOLDEN-04), DASH-53 public Save, DASH-58, DASH-59, DASH-60. DASH-16 persist and DASH-21 write-key remain Golden-owned without reclassifying dashboard display/identity emission off LIVE-SHARED/LIVE.

**UNKNOWN:** NONE

**ALL DASH-01 THROUGH DASH-76 ACCOUNTED FOR:** YES

## Remaining Gap Ownership Matrix

### DASH-23
- Gap: Active-edit publish can INSERT a new `servicios_public_listings` row if slug/session identity is unresolved (UUID not the write key).
- Ownership: **SERVICIOS GOLDEN / CATEGORY GLOBAL OWNED**
- Files: `app/api/clasificados/servicios/publish/route.ts`; `serviciosPublishClient.ts`
- Next lane: Servicios Golden Reference / publish identity

### DASH-27 (SRV-GOLDEN-04)
- Gap: Resume / paused republish can set `listing_status=published` without subscription/entitlement fail-closed.
- Ownership: **SERVICIOS GOLDEN / CATEGORY GLOBAL OWNED**
- Files: `app/api/clasificados/servicios/manage/route.ts`; `publish/route.ts` `allowedOwnerRepublish`; `subscriptionLifecycle.ts`
- Next lane: Servicios lifecycle-commercial

### DASH-53
- Gap: Public Servicios Save CTA is not mounted; shared `saved_listings` + `serviciosSavedListingExtras` already exist.
- Ownership: **SHARED ENGINE ADOPTION — CROSS-WORKTREE COORDINATION REQUIRED**
- Files: public `app/(site)/servicios/components/*` / `app/(site)/clasificados/servicios/*` (mount `LeonixSaveButton`); `app/lib/serviciosSavedListingIdentity.ts`; `LeonixSaveButton.tsx`
- Next lane: coordinate with Servicios public engagement; do not invent a save engine

### DASH-58 / DASH-59 / DASH-60
- Gap: No Servicios Saved Search adapter, matcher, dashboard registry, delivery resolver, or results `SavedSearchButton`.
- Ownership: **SHARED ENGINE ADOPTION — CROSS-WORKTREE COORDINATION REQUIRED**
- Files: `app/lib/saved-search/*` (new servicios adapter — do not add here without coordination); `app/(site)/dashboard/busquedas-guardadas/page.tsx`; `app/(site)/clasificados/servicios/resultados/*`; `serviciosBrowseParams.ts`
- Next lane: Saved Search 06-style adoption using existing discovery filters (Rentas reference)

### Cross-thread (not reclassified)
- SRV-GOLDEN-01 → DASH-21/23 — SERVICIOS GOLDEN — publish UUID fail-closed
- SRV-GOLDEN-02 → DASH-16 persist — SERVICIOS GOLDEN — `publish/route.ts` offers gate
- SRV-GOLDEN-03 → DASH-18 — SERVICIOS GOLDEN — `serviciosPublishedToApplicationDraft.ts`

### Optional dashboard enhancements
- DASH-32 / DASH-33 / DASH-40 — **DASHBOARD RECEIVER OWNED** — perfil portal session; entitlement `endsAt` display; analytics leaders

**DASHBOARD RECEIVER OWNED:** DASH-32, DASH-33, DASH-40 (optional)

**SERVICIOS GOLDEN / CATEGORY GLOBAL OWNED:** DASH-23, DASH-27; plus SRV-GOLDEN-01/02/03 (DASH-21/16/18 persist/hydration)

**SHARED ENGINE ADOPTION — RECEIVER SAFE:** NONE (registry-only would be incomplete)

**SHARED ENGINE ADOPTION — CROSS-WORKTREE COORDINATION REQUIRED:** DASH-53, DASH-58, DASH-59, DASH-60

**PRODUCT DECISION REQUIRED:** NONE (Archive/Delete/Messages-for-quotes already classified NOT SUPPORTED)

## Gate 5 — Implementation Plan + Ownership Freeze

**Date:** 2026-09-11  
**HEAD:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**origin/main:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**merge-base HEAD origin/main:** `d1b2994d36b1e78f1fb91a6d3f801638156b9119`  
**SOURCE STILL CURRENT:** YES  
**git status:** clean product tree; untracked `.claude/` and `docs/launch-lifecycle/` (this ledger) only  
**Product source changed this gate:** NO

### Refreshed Git truth

`git fetch origin` on 2026-09-11. Receiver HEAD equals current `origin/main`. Reconciliation not required. Plan is against the same baseline as Gates 0–4.

### Implementation ownership freeze

| Gap | Lane | Receiver may edit now? |
|---|---|---|
| SRV-GOLDEN-01 / DASH-23 | SERVICIOS GOLDEN / CATEGORY GLOBAL | NO |
| SRV-GOLDEN-02 | SERVICIOS GOLDEN / CATEGORY GLOBAL | NO |
| SRV-GOLDEN-03 | SERVICIOS GOLDEN / CATEGORY GLOBAL | NO |
| SRV-GOLDEN-04 / DASH-27 | SERVICIOS GOLDEN / CATEGORY GLOBAL | NO |
| DASH-53 | SHARED ENGINE ADOPTION — CROSS-WORKTREE COORDINATION REQUIRED | NO until PM |
| DASH-58 / 59 / 60 | SHARED ENGINE ADOPTION — CROSS-WORKTREE COORDINATION REQUIRED | NO until PM |
| DASH-32 / 33 / 40 | OPTIONAL / NON-BLOCKING — DEFERRED | NO this Golden receiver gate |

File class codes used below:

- **A** = SAFE TO EDIT IN DASHBOARD RECEIVER WORKTREE
- **B** = OWNED BY ACTIVE SERVICIOS GOLDEN WORKTREE
- **C** = SHARED FILE — COORDINATION REQUIRED BEFORE EDIT
- **D** = NO EDIT REQUIRED

### DASH-53 implementation plan (minimal adoption)

**Do not invent a save engine.** Mount existing `LeonixSaveButton` + `serviciosSavedListingExtras`.

#### Current truth (no Save CTA)

Live public engagement is Like + Share only:

- Detail (trade): `ServiciosProfileView` `heroEngagementSlot`
- Detail (professional): `ServiciosProfessionalProfileShell` hero `engagementSlot`
- Results: `ServiciosResultCardEngagementStrip` (used by `ServiciosHorizontalResultCard` + `ServiciosProfessionalResultCard` on `/clasificados/servicios/results` via `resultados/page.tsx`; `/resultados` re-exports that page)
- Hub `hubEngagementVariant="save_only"` only hides hub Like/Share because they already render in the hero — it is **not** a Save control
- `serviciosSavedListingExtras` has **zero runtime callers**
- `serviciosGlobalSaveRecorder` exists unused in `recordServiciosGlobalAnalytics.ts`
- `ServiciosListingResultCard` still has Like/Share but has **no live importer** on the results page — not a required mount

#### Exact mount points (required)

1. `app/(site)/servicios/components/ServiciosProfileView.tsx` — hero engagement cluster next to Like/Share
2. `app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx` — same hero cluster
3. `app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx` — results cards (covers both live card shells)

Detail-only is **not** sufficient. Other categories persist Save from both detail and result cards; Guardados identity extras already expect discovery-originated saves. Results Save is required for DASH-53 completeness.

#### Exact props/identity

Reuse, do not rewrite:

- `listingId` = engagement key (`serviciosEngagementListingKey` / `engagementListingId`)
- `savedListingKey` = canonical UUID `listingSourceId` / `row.id` when present, else engagement key
- `saveExtras` = `serviciosSavedListingExtras({ slug, id, leonix_ad_id })` or `serviciosSavedListingExtrasFromClient`
- `category="servicios"`
- `ownerUserId` = listing owner (self-save blocked inside `LeonixSaveButton`)
- `persistEngagement` = same flag already used for Like/Share (`persistListingEngagement`)
- `recordSaveEvent` = `serviciosGlobalSaveRecorder(globalListing)` when `globalListing` exists (replaces default `trackListingSave`)
- `lang` / `variant="small"` to match Like/Share

Writer: `upsertSavedListingForUser` / `deleteSavedListingForUser` in `savedListingsRuntime.ts` → `saved_listings`.  
Guardados: `savedListingsDashboardResolve.ts` already resolves Servicios by UUID → `leonix_ad_id` → slug. **D.**

#### Analytics

`LeonixSaveButton` **does** emit analytics automatically via `trackListingSave` unless `recordSaveEvent` is passed. Servicios should pass `serviciosGlobalSaveRecorder` so Save matches Like/Share global analytics (same pattern as Rentas `trackListingSaveToggleAuthed`). No new event table.

#### Schema

**NO** database/schema change. `saved_listings` already stores extras fields used by Guardados.

#### File ownership (DASH-53)

| File | Class |
|---|---|
| `app/components/clasificados/analytics/LeonixSaveButton.tsx` | D |
| `app/lib/serviciosSavedListingIdentity.ts` | D |
| `app/lib/savedListingsRuntime.ts` | D |
| `app/lib/savedListingsDashboardResolve.ts` | D |
| `app/(site)/dashboard/guardados/page.tsx` | D |
| `app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics.ts` (`serviciosGlobalSaveRecorder` already present) | D unless recorder signature must change |
| `ServiciosProfileView.tsx` | B — collision risk |
| `ServiciosProfessionalProfileShell.tsx` | B — collision risk |
| `ServiciosResultCardEngagementStrip.tsx` | B — collision risk |
| `ServiciosHorizontalResultCard.tsx` / `ServiciosProfessionalResultCard.tsx` | D if strip is the only mount; B if extra props must be plumbed (strip already has slug/sourceId/engagement id) |

**DASH-53 COLLISION RISK:** exact — all required mounts are live Servicios public shells. Do **not** edit them in this receiver worktree until PM coordinates with Servicios Golden.

#### Minimal verifier after implementation (future; not this gate)

- Source: `LeonixSaveButton` imported from the three mount files; `serviciosSavedListingExtras` called; no second save table
- Targeted: extend `scripts/servicios-engagement-smoke.ts` to assert Save mount + extras identity
- Runtime Golden QA: signed-in shopper Save on detail + results → `/dashboard/guardados` card; owner self-save blocked; unauthenticated redirects to login

### DASH-58 / 59 / 60 implementation plan (minimal Saved Search adoption)

**Do not invent a new Saved Search engine.** Clone the Rentas 06 *pattern* only: adapter + matcher wrapping **existing** discovery filters + results URL + delivery resolver + dashboard registry + public `SavedSearchButton`.

#### Current truth

- Generic engine live: `saved_searches`, `POST/GET /api/saved-search`, fingerprint, `savedSearchEmailDelivery.ts`
- Dashboard `CATEGORY_REGISTRY`: autos / bienes-raices / rentas only (`busquedas-guardadas/page.tsx`)
- Delivery `CATEGORY_RESOLVERS`: same three keys
- Public `SavedSearchButton`: Rentas `RentasResultsClient.tsx` (reference). Servicios results have **no** `SavedSearchButton`
- No `app/lib/saved-search/servicios/*`
- Live filter contract: `serviciosBrowseParams.ts` + `serviciosResultsFilter.ts` (`ServiciosResultsFilterQuery`). Canonical results path: `/clasificados/servicios/results` (`SERVICIOS_RESULTS_PATH`)
- Servicios has **no price band** in discovery → `minPrice`/`maxPrice` stay `null`
- **Exclude from payload:** `sort`, `page`, `perPage` (cosmetic / pagination, matching Rentas doctrine)

#### DASH-59 location mapping (existing fields only)

- `saved_searches.city` ← `ServiciosResultsFilterQuery.city` (engine location column)
- `filter_payload.state` / `zip` / `country` ← same URL keys already in `serviciosBrowseParams` (Rentas-shaped; no new columns)

#### DASH-60 filter_payload (only live matcher fields)

Persist flags/fields `filterServiciosPublicListingRows` actually uses: `q`, `group`, `seller` (when not `all`), and the existing `"1"` flags (`whatsapp`, `promo`, `call`, `verified`, `web`, `bilingual`, `email`, `emergency`, `mobileSvc`, `msg`, `phys`, `svcMulti`, `offer`, `legal`, `langEs`, `langEn`, `langOt`, `vint`, `wknd`, `openNow`, `licensed`, `insured`, `freeEstimate`, `freeConsultation`, `hasPhotos`, `hasVideos`, `hasOffers`, `sameDay`, `appointment`).

Matcher must call existing `filterServiciosPublicListingRows` (one-row array) — **no second filter implementation**.

#### Planned change list

| File | Function/component | Behavior to add | Shared vs Servicios-specific | Lane | Collision | No-new-engine proof |
|---|---|---|---|---|---|---|
| `app/lib/saved-search/servicios/savedSearchServiciosAdapter.ts` (**new**) | `serviciosFilterStateToSavedSearch` / reverse / `describeServiciosSavedSearchFacets` / `SAVED_SEARCH_SERVICIOS_CATEGORY="servicios"` | Map `ServiciosResultsFilterQuery` ↔ `SavedSearchNormalizedInput` | Servicios-specific adapter over shared contract | COORDINATION — new file, but consumes B filter types | Medium if Golden also creates this dir | Reuses `savedSearchTypes`; no new table |
| `app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts` (**new**) | `matchesServiciosSavedSearch` | One-row wrap of `filterServiciosPublicListingRows` | Servicios-specific | COORDINATION | Medium | Reuses live results filter |
| `app/lib/saved-search/servicios/serviciosPublicEligibleListing.ts` (**new**) | certify published/public row | Eligibility gate for match/delivery | Servicios-specific | COORDINATION | Medium | Mirror Rentas `certify*PublicEligibleListing` using existing listing_status/public loader |
| `app/lib/saved-search/servicios/serviciosSavedSearchResultsUrl.ts` (**new**) | `buildServiciosSavedSearchResultsUrl` | Rebuild `/clasificados/servicios/results?...` via `buildServiciosResultsBrowseHref` / `serviciosFilterQueryToUrlParams` | Servicios-specific | COORDINATION | Medium | Reuses browse href builder |
| `app/lib/saved-search/servicios/serviciosSavedSearchDeliveryResolver.ts` (**new**) | `serviciosSavedSearchDeliveryResolver` | `revalidateListingStillEligible` + public detail URL `/clasificados/servicios/{slug}` | Servicios-specific; must **not** import orchestrator | COORDINATION | Medium | Implements existing `SavedSearchDeliveryCategoryResolver` |
| `app/lib/saved-search/servicios/serviciosSavedSearchEligibilitySupport.ts` (**new**) | eligibility helpers | Neutral support so delivery does not import orchestrator | Servicios-specific | COORDINATION | Medium | Same isolation as Autos/BR/Rentas |
| `app/lib/saved-search/servicios/serviciosSavedSearchMatchOrchestrator.ts` (**new**) | `triggerServiciosSavedSearchMatchBestEffort` | Best-effort match events + `attemptSavedSearchEmailDeliveryBestEffort` | Servicios-specific orchestrator calling **shared** delivery | COORDINATION | Medium | Reuses `savedSearchServerCrud` + `saved_search_match_events` |
| `app/lib/saved-search/delivery/savedSearchEmailDelivery.ts` | `CATEGORY_RESOLVERS` | Add `servicios:` entry | Shared | **C** | High — single registry | One key, no clone of delivery engine |
| `app/(site)/dashboard/busquedas-guardadas/page.tsx` | `CATEGORY_REGISTRY` | Add `servicios` label/facets/results URL/browsePath `/clasificados/servicios/results` | Dashboard consumer of adapters | **A** only after adapters exist | Low–medium | Registry plug-in only |
| `app/(site)/clasificados/servicios/resultados/page.tsx` and/or `ServiciosResultsFilters.tsx` / `ServiciosResultsPageShell.tsx` | mount `SavedSearchButton` | Pass `serviciosFilterStateToSavedSearch(filterQuery)` like Rentas toolbar | Servicios public results | **B** | High | Reuses generic `SavedSearchButton` |
| `app/api/clasificados/servicios/publish/route.ts` | POST persist success | Call `triggerServiciosSavedSearchMatchBestEffort(listingId)` when row becomes/stays public | Servicios publish | **B** | High | Same hook pattern as Rentas fulfillment |
| `app/api/clasificados/servicios/manage/route.ts` | resume success | Same trigger on Resume → published | Servicios manage | **B** | High | Existing manage route |
| Revenue/fulfillment activate path if webhook publishes without going through manage | existing Servicios fulfillment | Same best-effort trigger | Servicios-lane commercial | **B** | High | Do not add a cron |

**D — no edit:** `savedSearchTypes.ts` (category is already `string`), `savedSearchServerCrud.ts`, `app/api/saved-search/**`, `SavedSearchButton.tsx`, `saved_searches` schema, `serviciosBrowseParams.ts` / `serviciosResultsFilter.ts` (consume only; do not rewrite filters).

**DATABASE MIGRATION REQUIRED:** NO  
**NEW ENGINE REQUIRED:** NO

**SAVED SEARCH COLLISION RISK:** exact — public results mount + publish/manage hooks are B; delivery registry is C; new `app/lib/saved-search/servicios/*` must be assigned by PM so Golden and receiver do not both create it.

Receiver must **not** ship a registry-only DASH-58 (incomplete, unmatched rows).

### Optional items deferred

DASH-32, DASH-33, DASH-40 remain **OPTIONAL / NON-BLOCKING — DEFERRED**. Source has not moved to make them correctness-required. Do not create Billing Portal session API, renewal-date UX, or analytics leaders expansion in this Golden receiver gate.

### Servicios Golden / Category Global — cross-thread handoff

Copy-paste block for the quarterback thread:

```
SRV-GOLDEN-01 / DASH-21 write-key + DASH-23
DEFECT: Active-edit publish resolves identity by existingPublicSlug / sessionStorage only.
If slug is missing, allocateSlug() mints a new slug and INSERT can create a duplicate
servicios_public_listings row.
FILES: app/api/clasificados/servicios/publish/route.ts (POST; getServiciosPublicListingBySlugFromDb;
allocateSlug; UPDATE .eq("slug") vs INSERT);
app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts
(SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY).
REQUIRED: Canonical write key is servicios_public_listings.id (UUID). Missing/unresolved
edit identity must fail closed — never INSERT a second public row for an in-progress edit.
ACCEPTANCE: Same-row save always UPDATE by id; unresolved identity → 4xx, zero INSERT;
slug may change only as a field on that id.
RECEIVER DEPENDENCY: DASH-23 cannot be certified until this lands. Guardados/Save can
orphan keys if duplicates exist.
GOLDEN QA BLOCKED UNTIL REPAIRED: YES (duplicate-row risk)

SRV-GOLDEN-02 / DASH-16 persist
DEFECT: enforceServiciosOffersEntitlementServerTruth still looks up
fetchAddonEntitlementsForListings({ packageKey: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY })
(retired servicios_offers_addon). Dashboard commercial truth grants coupons_offers from
canonical base package (+ legacy addon via categoryCommercialPlanPolicy).
FILE: app/api/clasificados/servicios/publish/route.ts
FUNCTION: enforceServiciosOffersEntitlementServerTruth / serviciosOffersAddonEntitled.
REQUIRED: Persist-gate must use current listing_package_entitlements commercial authority
(same capability truth dashboard uses), not the retired addon key alone. Unentitled
requests must not write new offer content; entitled/base-bundled offers must persist.
ACCEPTANCE: Owner with active canonical Servicios package that includes coupons_offers
can save offers; unentitled cannot create/edit offer content; no second offers table.
RECEIVER DEPENDENCY: Dashboard offers CTA can already display; persist remains Golden.
GOLDEN QA BLOCKED UNTIL REPAIRED: YES (offer persist)

SRV-GOLDEN-03 / DASH-18
DEFECT: serviciosPublishedToApplicationDraft never reads customQuickFacts.
Grep of that file: zero customQuickFacts restorations (defaults to []).
FILE: app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts
FUNCTION: serviciosPublishedToApplicationDraft.
REQUIRED: Restore persisted custom quick facts into application state (same cap/normalize
rules as publish).
ACCEPTANCE: Published listing with customQuickFacts hydrates those labels on edit; no
fabricated facts.
RECEIVER DEPENDENCY: Workspace edit/resume copy can drop custom facts until repaired.
GOLDEN QA BLOCKED UNTIL REPAIRED: YES (edit hydration)

SRV-GOLDEN-04 / DASH-27 / DASH-68 mutation
DEFECT: POST /api/clasificados/servicios/manage resume sets listing_status=published
from paused_unpublished with owner+slug checks only — no subscription/entitlement read.
Publish allowedOwnerRepublish also treats paused_unpublished as payable-path bypass
without current commercial fail-closed.
FILES: app/api/clasificados/servicios/manage/route.ts (POST resume);
app/api/clasificados/servicios/publish/route.ts (allowedOwnerRepublish).
REQUIRED: Resume/paused republish must fail closed unless current Revenue OS /
listing_package_entitlements + leonix_subscription_records permit public reactivation.
ACCEPTANCE: Canceled/expired/suspended cannot Resume to published; entitled paused
listing can; Admin listing_status column remains the same source.
RECEIVER DEPENDENCY: Owner Pause/Resume CTA stays mounted; mutation is Golden.
GOLDEN QA BLOCKED UNTIL REPAIRED: YES (commercial lifecycle)
```

### Planned verification (future implementation only; not run this gate)

No full build / typecheck / test suite / dev server this gate.

After authorized implementation, targeted only:

- `npx tsx scripts/servicios-engagement-smoke.ts` (extend for Save mount)
- New `npx tsx scripts/verify-saved-search-servicios-07.ts` patterned on `scripts/verify-saved-search-br-rentas-06.ts` (adapter round-trip, matcher reuses `filterServiciosPublicListingRows`, registry keys, delivery isolation, no orchestrator↔delivery import cycle)
- Source grep: `LeonixSaveButton` under `app/(site)/servicios` and `app/(site)/clasificados/servicios`
- Source grep: `CATEGORY_REGISTRY` / `CATEGORY_RESOLVERS` include `servicios`

### Planned commit boundaries (future; none this gate)

**This gate:** ledger documentation only. No product commit.

**After PM authorization, never mix lanes:**

- **COMMIT A — receiver-safe shared-adoption only** (only if PM assigns A-class files): e.g. `busquedas-guardadas/page.tsx` registry **after** Servicios adapters exist. Do not include publish/manage/public shells.
- **COMMIT B — ledger/certification updates**
- **Servicios Golden commits (other worktree):** SRV-GOLDEN-01–04, DASH-53 mounts, SavedSearchButton on results, orchestrator hooks, new `app/lib/saved-search/servicios/*` if PM assigns that directory to Golden

If PM assigns `app/lib/saved-search/servicios/*` to this receiver **and** Golden agrees not to touch it, that directory may enter COMMIT A together with the dashboard registry — still excluding B public/publish files.

**READY FOR PM IMPLEMENTATION AUTHORIZATION:** YES  
**Receiver coding authorization:** NOT YET — wait for PM direction on DASH-53 / Saved Search file split.

# 9. Product decision rule

If Archive, Delete, Cancel Subscription, Stripe Customer Portal, or another capability is not part of the approved Servicios product, **do not invent it because it appears in this ledger**.

Classify it:

**NOT SUPPORTED — CURRENT PRODUCT**

If a suitable shared capability exists globally and Servicios is merely unwired, wire the existing engine only.

# 10. Implementation change log

Every changed file/function must be recorded.

| # | File | Function/Component | Previous behavior | New behavior | Shared engine reused | Why required | Tests | Regression |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |

# 11. Route impact map

| Route | Before | After | Dashboard-owned change? | Golden runtime proof needed? |
|---|---|---|---|---|
| `/dashboard` | | | | |
| `/dashboard/mis-anuncios` | | | | |
| `/dashboard/mis-anuncios/[id]` | | | | |
| `/dashboard/servicios` | | | | |
| `/dashboard/analytics` | | | | |
| `/dashboard/mensajes` | | | | |
| `/dashboard/guardados` | | | | |
| `/dashboard/busquedas-guardadas` | | | | |
| `/dashboard/business-tools` | | | | |

Add every additional affected route.

# 12. Data/domain impact map

| Domain/Table | Read | Write | Why | Canonical? | Shared with Admin/Revenue? |
|---|---:|---:|---|---|---|
| `servicios_public_listings` | | | | | |
| `servicios_public_leads` | | | | | |
| `listing_analytics` | | | | | |
| `messages` | | | | | |
| Saved Listings domain | | | | | |
| Saved Search domain | | | | | |
| package entitlement domain | | | | | |
| Revenue OS/commercial state | | | | | |
| Business Concierge owner bridge | | | | | |
| Community Trust domain | | | | | |
| translation domain | | | | | |
| media/storage domain | | | | | |

# 13. Verification ledger

| Check | Exact command | Result | Exact count/output | Notes |
|---|---|---|---|---|
| TypeScript baseline | | | | |
| Lint touched files | | | | |
| Dashboard targeted tests | | | | |
| Servicios management | | | | |
| Lifecycle | | | | |
| Commercial state | | | | |
| Analytics | | | | |
| Saved Listings | | | | |
| Saved Search | | | | |
| Messages | | | | |
| Engagement / Community Trust | | | | |
| Translation | | | | |
| Media handoff | | | | |
| `git diff --check` | | | | |
| Production build | | | | |

Do not dismiss failures as unrelated without source proof.

# 14. Resource control

- No background/detached full builds.
- No duplicate dev servers.
- One heavy Node/TypeScript/build process at a time.
- Inspect active heavy processes before validation.
- Prefer targeted tests during trace/repair.
- Run one final production build after repairs are complete.

# 15. Git / delivery gates

## Gate 1 — TRACE
No coding until exact runtime consumers are known.

## Gate 2 — IMPLEMENT
Only dashboard-owned, source-proven gaps.

## Gate 3 — VERIFY
Targeted tests plus final build.

## Gate 4 — LEDGER CLEAR
DASH-01 through DASH-76 all have explicit source-audit dispositions (2026-09-11). No omitted numbers. Product source was not implemented in this audit. Runtime Golden listing / preview certification remains later.

## Gate 5 — COMMIT
- commit SHA:
- message:
- exact files:
- tracked status:

## Gate 6 — PUSH
- branch:
- remote:
- pushed SHA:
- upstream:
- git status:

## Gate 7 — ISOLATED VERCEL PREVIEW
Authorized for this Golden Receiver certification only.
- project:
- deployment ID:
- exact URL:
- state:
- source branch:
- source SHA:
- Preview SHA == pushed SHA? YES/NO

**Do not merge to `main`.**

# 16. Required absolute report

Return:
A. WORKTREE TRUTH  
B. EXACT FILES CHANGED  
C. EXACT FUNCTIONS/COMPONENTS CHANGED  
D. EXACT ROUTES AFFECTED  
E. EXACT TABLES/DOMAINS CONSUMED  
F. DASH-01 THROUGH DASH-76 RESULTS  
G. EXACT TEST RESULTS  
H. BUILD RESULT  
I. COMMIT SHA + MESSAGE  
J. PUSH REMOTE + SHA  
K. PREVIEW ID + URL + STATE + SHA  
L. REMAINING OWNER-BROWSER QA  
M. KNOWN BLOCKERS  
N. FINAL CERTIFICATION

Final certification must be exactly:

**OWNER COMMAND CENTER READY TO RECEIVE SERVICIOS GOLDEN LISTING: YES**

or

**OWNER COMMAND CENTER READY TO RECEIVE SERVICIOS GOLDEN LISTING: NO**

If NO, list every blocker.

# 17. Servicios Golden Listing — Runtime Card

**Leave unfilled until the real Golden listing exists.**

PUBLISHED UUID:  
SLUG:  
LEONIX AD ID:  
OWNER USER ID:  
BUSINESS ID:  
STRIPE CUSTOMER:  
STRIPE SUBSCRIPTION:  
PACKAGE ENTITLEMENT:  
PUBLIC URL:  
DASHBOARD MANAGE URL:  
ADMIN URL:  

DASHBOARD: **NOT TESTED**  
EDIT HYDRATION: **NOT TESTED**  
SAME ROW: **NOT TESTED**  
NO RECHARGE: **NOT TESTED**  
PAUSE: **NOT TESTED**  
RESUME: **NOT TESTED**  
PAYMENT ATTENTION: **NOT TESTED**  
COUPONS: **NOT TESTED**  
MEDIA ROUND TRIP: **NOT TESTED**  
TRANSLATION ROUND TRIP: **NOT TESTED**  
ANALYTICS CONTINUITY: **NOT TESTED**  
LEADS: **NOT TESTED**  
MESSAGES: **NOT TESTED**  
SAVE: **NOT TESTED**  
SAVED LISTINGS: **NOT TESTED**  
SAVED SEARCH: **NOT TESTED**  
BUSINESS TOOLS: **NOT TESTED**  
COMMUNITY TRUST: **NOT TESTED**  
ADMIN PARITY: **NOT TESTED**  
MOBILE: **NOT TESTED**

# 18. Golden Runtime QA order — no bouncing

1. Capture Golden identity card.
2. `/dashboard`.
3. `/dashboard/mis-anuncios`.
4. Servicios Manage workspace — complete before leaving.
5. View Public.
6. Edit hydration.
7. Save & Republish — same row/no recharge.
8. Pause.
9. Resume.
10. Commercial/payment attention.
11. Coupons/offers.
12. Media round trip.
13. Translation round trip.
14. Analytics continuity.
15. Leads/Messages.
16. Save/Guardados.
17. Saved Search.
18. Business Tools.
19. Community Trust + external reputation separation.
20. Admin parity.
21. 390px mobile.
22. 768px tablet.
23. 1440px desktop.
24. Final cross-surface consistency pass.

**One surface reaches GREEN before moving on.**

# 19. Same-row / no-recharge proof card

## Before active edit
UUID:  
slug:  
Leonix Ad ID:  
owner ID:  
business ID:  
entitlement ID/status:  
Stripe subscription/payment identity if safely observable:  
media count/order:  
analytics baseline:  

## After Save & Republish
UUID:  
slug:  
Leonix Ad ID:  
owner ID:  
business ID:  
entitlement ID/status:  
Stripe checkout triggered? YES/NO  
duplicate public row created? YES/NO  
media preserved? YES/NO  
analytics preserved? YES/NO  
public URL continuity:  
result: PASS/FAIL

A normal active Servicios edit must **not** trigger another base `$399` charge.

# 20. Lifecycle proof matrix

| State/Action | Dashboard | Public | Admin | Commercial authority | Result |
|---|---|---|---|---|---|
| Active | | | | | |
| Pause | | | | | |
| Resume | | | | | |
| Payment attention | | | | | |
| Grace | | | | | |
| Failed payment | | | | | |
| Cancels at period end | | | | | |
| Canceled/ended | | | | | |
| Suspended/moderation blocked | | | | | |
| Archive | | | | | |
| Delete | | | | | |

Archive/Delete may legitimately be **NOT SUPPORTED — CURRENT PRODUCT** if source proves that.

# 21. Analytics / engagement proof matrix

| Event | Public action | Raw event/source | Owner rollup | Admin agrees | Same canonical identity | Result |
|---|---:|---:|---:|---:|---:|---|
| View/open | | | | | | |
| Call | | | | | | |
| SMS | | | | | | |
| WhatsApp | | | | | | |
| Email | | | | | | |
| Website | | | | | | |
| Directions | | | | | | |
| Share | | | | | | |
| Like / Trust | | | | | | |
| Quote / Lead | | | | | | |

No metric is proven merely because a dashboard card can display it.

# 22. Save / Like / Saved Search proof

## Like / Community Trust
- action source:
- persistence:
- canonical Servicios identity:
- owner count/visibility:
- result:

## Saved Listing
- action source:
- persistence:
- `/dashboard/guardados` card:
- exact public link:
- removal:
- result:

## Saved Search
- category: Servicios
- canonical location:
- relevant Servicios filters:
- persistence:
- `/dashboard/busquedas-guardadas`:
- pause/reactivate/delete:
- delivery/match behavior if safely testable:
- result:

**Saved Listing, Like, and Saved Search are distinct products.**

# 23. Business Tools / Trust proof

- correct owner membership:
- correct `business_id`:
- listing attached to expected business identity:
- no duplicate Servicios business dashboard:
- Business Identity:
- Next Right Move:
- Needs Attention:
- Health:
- Action Plan:
- What Leonix Understands:
- Work With Leonix:
- Progress:
- Assistant if real:
- Google URL only if stored:
- Yelp URL only if stored:
- Community Trust remains Leonix first-party truth:
- external ratings not fabricated:
- result:

# 24. Admin parity proof

Compare the exact Golden listing:
- UUID
- slug
- Leonix Ad ID
- owner
- business
- listing status
- lifecycle state
- moderation state
- package
- entitlement
- subscription/commercial state
- analytics
- lead/engagement identity

Dashboard may expose fewer controls than Admin.

**Different controls are acceptable. Different truth is not.**

# 25. Zero-mistake certification rule

The receiver may return:

**OWNER COMMAND CENTER READY TO RECEIVE SERVICIOS GOLDEN LISTING: YES**

only when:
- current main was reconciled first if needed,
- all 76 DASH items have explicit disposition,
- zero required Dashboard-owned wiring remains unknown,
- zero known Dashboard-owned source blockers remain,
- no duplicate architecture was created,
- required source/automated checks pass,
- production build passes,
- exact receiver commit is pushed,
- isolated Preview is READY on the exact pushed SHA,
- browser-runtime-only items remain honestly marked for Golden listing QA.

The Golden runtime card remains **NOT TESTED** until the real Servicios Golden listing exists.

# 25A. Gates A–E — current-main reconciliation + durable checkpoint (2026-09-11)

## A. Receiver git reconciliation

- Previous receiver HEAD: `d1b2994d36b1e78f1fb91a6d3f801638156b9119`
- Current receiver HEAD: `9fcadb4daf599e15fca62adcb647abbf96ce6bd8`
- Current `origin/main`: `9fcadb4daf599e15fca62adcb647abbf96ce6bd8`
- Ahead/behind before merge: 0 / 21
- Reconciliation: **FAST-FORWARD** (no merge commit)
- Incoming commits: 21 Admin OS release commits
- Semantic conflicts: **NONE**
- Required Dashboard / Servicios product source in incoming main: **NONE**
- Receiver currently synchronized with main at this checkpoint: **YES**
- Product source edited by receiver Gates A–E: **NO**

Golden feature-branch reports (including claimed DASH-58/59/60 and SRV-GOLDEN-02/03/04 closures) are **not** current receiver source until they land on `origin/main`.

## B. Current ownership freeze

**OWNER COMMAND CENTER REQUIRED PRODUCT SOURCE WORK: NONE PROVEN**

Servicios Golden / shared upstream blockers — do **not** convert into receiver tasks:

- SRV-GOLDEN-01
- SRV-GOLDEN-02
- SRV-GOLDEN-03
- SRV-GOLDEN-04
- DASH-53 public Save adoption (detail + result-card)
- DASH-58
- DASH-59
- DASH-60

Receiver coding authorization: **NO**

## C. Targeted DASH recheck against current main `9fcadb4d`

| Item | Classification |
|---|---|
| DASH-16 | LIVE-SHARED — receiver display ready; upstream publish persistence still blocked on current main (`servicios_offers_addon`) |
| DASH-18 | LIVE-SHARED — receiver edit routing ready; upstream `customQuickFacts` hydration missing on current main |
| DASH-21 | LIVE — receiver emits canonical identity; upstream write-key remains Golden |
| DASH-23 | BLOCKED — SERVICIOS GOLDEN |
| DASH-26 | LIVE |
| DASH-27 | BLOCKED — SERVICIOS GOLDEN |
| DASH-53 detail Save | BUILD REQUIRED UPSTREAM / SERVICIOS GOLDEN on current main |
| DASH-53 result-card Save | BUILD REQUIRED UPSTREAM / SERVICIOS GOLDEN on current main |
| DASH-53 Guardados/persistence | LIVE-SHARED |
| DASH-58 | BUILD REQUIRED UPSTREAM |
| DASH-59 | BUILD REQUIRED UPSTREAM |
| DASH-60 | BUILD REQUIRED UPSTREAM |
| DASH-68 | LIVE-SHARED with DASH-27 upstream dependency |

## D. Deferred optional items

DASH-32 / DASH-33 / DASH-40 remain **OPTIONAL / NON-BLOCKING — DEFERRED**. Unchanged. Not launch blockers. Not promoted to required work.

## E. Next receiver action

After Servicios Golden lands its finished contracts onto current main, or provides the coordinated integration SHA this receiver is authorized to consume:

1. fetch current `origin/main`
2. reconcile receiver if needed
3. rerun only the affected targeted source checks
4. clear upstream-dependent DASH classifications
5. identify any true receiver-owned residual
6. only then proceed to final receiver integration certification

No owner/browser QA before that final source report/certification.

# 25B. Gates 1–6 — Full DASH-01–76 TRUE/FALSE source proof (2026-09-11)

**Audit HEAD (docs):** `b49cebf669c5b517eb7d78df649f59e9dfdc3312`
**Product SHA in this worktree:** `9fcadb4daf599e15fca62adcb647abbf96ce6bd8` (`origin/main`; receiver 2 docs commits ahead)
**origin/main advanced since last reconciliation:** NO
**Receiver-owned product implementation this gate:** NONE
**Duplicate architecture:** NONE (single `LeonixDashboardShell` / `OwnerEntityWorkspace`; one Saved Listing engine; one Saved Search engine; no Servicios dashboard island; commercial badges from `resolveCommercialStateBadges`)
**QA:** NOT RUN (forbidden until PM reviews this MD)

TRUE = Owner Command Center's required source contract in this worktree is complete.
FALSE = required contract is not met in this source (always with an owner).

| DASH | Classification | SOURCE CONTRACT TRUE | Owner / blocker |
|---|---|---|---|
| 01 | LIVE-SHARED | TRUE | runtime deferred |
| 02 | LIVE | TRUE | runtime deferred; write-key is DASH-23 |
| 03 | LIVE | TRUE | runtime deferred |
| 04 | LIVE | TRUE | runtime deferred |
| 05 | LIVE | TRUE | runtime deferred |
| 06 | NOT SUPPORTED — CURRENT PRODUCT | TRUE | dedicated workspace is `/dashboard/servicios`; `[id]` is `public.listings` |
| 07 | LIVE | TRUE | runtime deferred |
| 08 | LIVE | TRUE | runtime deferred |
| 09 | LIVE | TRUE | runtime deferred |
| 10 | LIVE | TRUE | runtime deferred; custom facts via DASH-18 |
| 11 | NOT SUPPORTED — CURRENT PRODUCT | TRUE | no separate hidden-address owner-only store |
| 12 | LIVE | TRUE | runtime deferred |
| 13 | LIVE | TRUE | runtime deferred |
| 14 | LIVE-SHARED | TRUE | runtime deferred |
| 15 | LIVE | TRUE | runtime deferred |
| 16 | LIVE-SHARED | TRUE | OCC display `coupons_offers`; persist FALSE on Golden SRV-GOLDEN-02 |
| 17 | LIVE-SHARED | TRUE | runtime deferred |
| 18 | LIVE + BLOCKED hydration | FALSE | SERVICIOS GOLDEN SRV-GOLDEN-03 `customQuickFacts` |
| 19 | LIVE-SHARED | TRUE | runtime deferred |
| 20 | LIVE | TRUE | no independent dashboard translation table |
| 21 | LIVE-SHARED | TRUE | OCC emits `listingId`; UPDATE-by-UUID is DASH-23 / SRV-GOLDEN-01 |
| 22 | LIVE-SHARED | TRUE | runtime deferred |
| 23 | BLOCKED — SERVICIOS GOLDEN | FALSE | SRV-GOLDEN-01 allocateSlug+INSERT fallback |
| 24 | LIVE | TRUE | runtime deferred |
| 25 | LIVE | TRUE | runtime deferred |
| 26 | LIVE-SHARED | TRUE | CTA live; commercial fail-closed is DASH-27 |
| 27 | BLOCKED — SERVICIOS GOLDEN | FALSE | SRV-GOLDEN-04 Resume authority |
| 28 | LIVE-SHARED | TRUE | runtime deferred |
| 29 | NOT SUPPORTED — CURRENT PRODUCT | TRUE | no Archive product |
| 30 | NOT SUPPORTED — CURRENT PRODUCT | TRUE | no Delete product |
| 31 | LIVE-SHARED | TRUE | portal/Stripe-owned cancel; runtime deferred |
| 32 | LIVE-SHARED | TRUE | optional session API deferred; static env URL traced |
| 33 | LIVE-SHARED | TRUE | optional `endsAt` on Servicios cards deferred |
| 34 | LIVE | TRUE | runtime deferred |
| 35 | LIVE-SHARED | TRUE | runtime deferred |
| 36 | LIVE-SHARED | TRUE | runtime deferred |
| 37 | LIVE-SHARED | TRUE | runtime deferred |
| 38 | LIVE-SHARED | TRUE | runtime deferred |
| 39 | LIVE | TRUE | runtime deferred |
| 40 | LIVE-SHARED | TRUE | optional analytics leaders expansion deferred |
| 41 | LIVE | TRUE | runtime deferred |
| 42 | LIVE | TRUE | runtime deferred |
| 43 | LIVE | TRUE | runtime deferred |
| 44 | LIVE | TRUE | runtime deferred |
| 45 | LIVE | TRUE | runtime deferred |
| 46 | LIVE | TRUE | runtime deferred |
| 47 | LIVE | TRUE | runtime deferred |
| 48 | LIVE | TRUE | runtime deferred |
| 49 | LIVE | TRUE | runtime deferred |
| 50 | LIVE-SHARED | TRUE | runtime deferred |
| 51 | LIVE | TRUE | runtime deferred |
| 52 | NOT SUPPORTED — CURRENT PRODUCT | TRUE | quotes are `servicios_public_leads`, not Messages |
| 53 | BLOCKED — SERVICIOS GOLDEN | FALSE | public Save mounts; Guardados engine LIVE-SHARED |
| 54 | LIVE-SHARED | TRUE | runtime deferred after DASH-53 writer exists |
| 55 | LIVE | TRUE | runtime deferred after DASH-53 |
| 56 | LIVE | TRUE | source-closed distinctness |
| 57 | LIVE | TRUE | source-closed distinctness |
| 58 | BLOCKED — SERVICIOS GOLDEN | FALSE | no Servicios Saved Search registry/adapter on current main |
| 59 | BLOCKED — SERVICIOS GOLDEN | FALSE | blocked on DASH-58 |
| 60 | BLOCKED — SERVICIOS GOLDEN | FALSE | blocked on DASH-58 |
| 61 | LIVE-SHARED | TRUE | runtime deferred |
| 62 | LIVE | TRUE | no Servicios dashboard island |
| 63 | LIVE | TRUE | runtime deferred |
| 64 | LIVE | TRUE | runtime deferred |
| 65 | LIVE | TRUE | runtime deferred |
| 66 | LIVE | TRUE | runtime deferred |
| 67 | LIVE | TRUE | runtime deferred |
| 68 | LIVE-SHARED | TRUE | same `listing_status`; DASH-27 mutation still Golden |
| 69 | LIVE-SHARED | TRUE | runtime deferred |
| 70 | LIVE-SHARED | TRUE | construction only; visual QA deferred |
| 71 | LIVE-SHARED | TRUE | construction only; visual QA deferred |
| 72 | LIVE-SHARED | TRUE | construction only; visual QA deferred |
| 73 | LIVE-SHARED | TRUE | construction only; visual QA deferred |
| 74 | LIVE-SHARED | TRUE | construction only; visual QA deferred |
| 75 | LIVE-SHARED | TRUE | construction only; visual QA deferred |
| 76 | LIVE-SHARED | TRUE | construction only; visual QA deferred |

### Buckets

**A. TRUE — SOURCE COMPLETE:** DASH-06, DASH-11, DASH-20, DASH-29, DASH-30, DASH-52, DASH-56, DASH-57, DASH-62

**B. TRUE — SOURCE COMPLETE, RUNTIME PROOF STILL REQUIRED:** DASH-01, 02, 03, 04, 05, 07, 08, 09, 10, 12, 13, 14, 15, 16, 17, 19, 21, 22, 24, 25, 26, 28, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 54, 55, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76

**C. BLOCKED — EXTERNAL PARALLEL CONTRACT:** DASH-18 (SRV-GOLDEN-03), DASH-23 (SRV-GOLDEN-01), DASH-27 (SRV-GOLDEN-04), DASH-53 (public Save), DASH-58, DASH-59, DASH-60. Related persist/write notes: SRV-GOLDEN-02 (DASH-16 persist), SRV-GOLDEN-01 (DASH-21 UPDATE-by-id)

**D. FALSE — OWNER COMMAND CENTER WORK STILL REQUIRED:** NONE

**UNKNOWN:** NONE

**OWNER COMMAND CENTER REQUIRED PRODUCT SOURCE WORK:** NONE PROVEN

**READY FOR FINAL SOURCE CERTIFICATION GATE:** YES (external Bucket C remaining; QA still forbidden)

# 25C. EXTERNAL GOLDEN INTAKE CHECKPOINT — OCC PARKED AT 83635691

**Date:** 2026-09-11
**Worktree:** `C:\projects\elaguila-website-owner-command-center`
**Branch:** `integration/owner-command-center-globalization-2026-08`
**Parked HEAD:** `8363569110adc5755dac0ce8b23b848150fc994f`
**Product / origin/main SHA:** `9fcadb4daf599e15fca62adcb647abbf96ce6bd8`
**OCC required product work:** NONE
**UNKNOWN:** NONE
**QA:** NOT RUN / NOT AUTHORIZED
**Prompt 1 Preview (parked SHA):** `dpl_8Yt2jgiwxFHaLaArmn47HRYRQrMm` — `https://leonix-media-s3hnb7zbd-jesus-caceres-projects.vercel.app` — READY — Preview SHA == `83635691`
**Do not implement Golden source in this worktree.**
**Do not poll. Resume only on the trigger below.**

This section is the resume memory for a fresh Cursor context. Do not reconstruct from chat history.

## OCC RESUME ONLY WHEN ONE OF THESE IS TRUE

A. `origin/main` advances with one or more named Golden/shared contracts below
OR
B. PM provides an explicitly authorized coordinated SHA containing completed contracts

When resumed:

1. stay in OCC worktree `C:\projects\elaguila-website-owner-command-center`
2. fetch current truth (`origin/main` + origin receiver)
3. inspect only affected external-contract paths listed below
4. classify each LANDED / PARTIAL / NOT LANDED (PARTIAL is not certifiable)
5. reconcile current main into this OCC branch if mechanically safe (normal merge; no rebase; no squash; no force). STOP on semantic conflict in identity / auth / Stripe / entitlement / lifecycle / Saved Listings / Saved Search / Business Tools
6. recheck only affected DASH items (16, 18, 21, 23, 26, 27, 53, 54, 58, 59, 60, 68)
7. implement only a proven OCC-side residual (smallest adapter/registry). Never publish/hydration/lifecycle/Save-engine/Saved-Search-engine
8. run final source certification (targeted verifiers → tsc vs 7-error e2e baseline → production build `NODE_OPTIONS=--max-old-space-size=12288` → `git diff --check` → TESTS.json parse)
9. commit/push to `origin/integration/owner-command-center-globalization-2026-08` only
10. create exact-SHA isolated Vercel Preview (never `--prod`)
11. STOP for PM proof audit

Do not authorize QA in this resume contract.

## Contract map (all NOT LANDED on parked SHA / current main)

### 1. SRV-GOLDEN-01

- Affected: DASH-21 write authority; DASH-23
- STATUS NOW: NOT LANDED
- OCC MAY IMPLEMENT EXTERNAL SOURCE: NO
- QA REQUIRED NOW: NO
- Expected landing proof: active edit/update by canonical UUID; fail-closed if canonical edit identity missing; no `allocateSlug` + INSERT fallback for an existing listing
- Exact files/functions to recheck: `app/api/clasificados/servicios/publish/route.ts` (`allocateSlug` ~119, `allocateSlug(baseSlug)` ~301, `.insert(insertRow)` ~507)
- Current parked proof: `allocateSlug` + INSERT fallback still present
- Receiver expected product change: NONE unless new source proves residual
- Related: DASH-21 OCC `serviciosListingEditHref` listingId emission remains TRUE — do not flip FALSE if only write authority is still Golden

### 2. SRV-GOLDEN-02

- Affected: DASH-16 persistence
- STATUS NOW: NOT LANDED
- OCC MAY IMPLEMENT EXTERNAL SOURCE: NO
- QA REQUIRED NOW: NO
- Expected landing proof: coupons/offers persist consumes canonical $399 entitlement/package truth; retired standalone offers add-on key is no longer persistence authority
- Exact source to recheck: `app/api/clasificados/servicios/publish/route.ts` (`SERVICIOS_OFFERS_ADDON_PACKAGE_KEY` import ~28, packageKey ~361); `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- Current parked proof: publish still uses `SERVICIOS_OFFERS_ADDON_PACKAGE_KEY`
- Receiver expected product change: NONE
- Related: DASH-16 OCC display via `coupons_offers` / `resolveBusinessToolsAccess` remains TRUE — do not flip FALSE

### 3. SRV-GOLDEN-03

- Affected: DASH-18
- STATUS NOW: NOT LANDED
- OCC MAY IMPLEMENT EXTERNAL SOURCE: NO
- QA REQUIRED NOW: NO
- Expected landing proof: `customQuickFacts` restored from published Servicios row into application draft
- Exact source to recheck: `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts`
- Current parked proof: that adapter has no `customQuickFacts` mapping
- Receiver expected product change: NONE

### 4. SRV-GOLDEN-04

- Affected: DASH-27; recheck DASH-26 / DASH-68 parity
- STATUS NOW: NOT LANDED
- OCC MAY IMPLEMENT EXTERNAL SOURCE: NO
- QA REQUIRED NOW: NO
- Expected landing proof: commercial-safe reactivation authority; unpaid/unauthorized resume fails closed
- Exact authority/helper to look for: `resolveServiciosReactivationAuthority` or the current canonical successor on Resume / `POST /api/clasificados/servicios/manage`
- Current parked proof: `resolveServiciosReactivationAuthority` has zero matches in this worktree
- Receiver expected product change: NONE unless dashboard bypasses landed authority
- Related: DASH-26 Resume CTA remains TRUE; DASH-68 same `listing_status` column remains TRUE

### 5. DASH-53 PUBLIC SAVE

- Affected: DASH-53; runtime dependency for DASH-54 / DASH-55
- STATUS NOW: NOT LANDED
- OCC MAY IMPLEMENT EXTERNAL SOURCE: NO
- QA REQUIRED NOW: NO
- Expected landing proof: `LeonixSaveButton` on canonical Servicios public/detail/result surfaces; shared Saved Listing engine reused; canonical Servicios identity/extras preserved (`serviciosSavedListingExtras` in `app/lib/serviciosSavedListingIdentity.ts`)
- Exact source to recheck: `app/(site)/servicios/**`, `app/(site)/clasificados/servicios/**` for `LeonixSaveButton`; Guardados resolver `app/lib/savedListingsDashboardResolve.ts` (`servicios_public_listings`)
- Current parked proof: no `LeonixSaveButton` under those Servicios trees
- Receiver expected product change: NONE unless Guardados resolver fails after public writer lands
- Related: DASH-54 / DASH-55 OCC resolver/delete remain TRUE

### 6. DASH-58 / DASH-59 / DASH-60 SAVED SEARCH

- Affected: DASH-58, DASH-59, DASH-60
- STATUS NOW: NOT LANDED
- OCC MAY IMPLEMENT EXTERNAL SOURCE: NO
- QA REQUIRED NOW: NO
- Expected landing proof: Servicios Saved Search category adapter exists; canonical location support; relevant Servicios filter payload; live matcher/discovery path; dashboard category registry can manage Servicios saved searches
- Exact source to recheck: `app/lib/saved-search/servicios/**` (expected new); Rentas reference `app/lib/saved-search/rentas/savedSearchRentasAdapter.ts`; public `SavedSearchButton` on `/clasificados/servicios/resultados`; dashboard `CATEGORY_REGISTRY` in `app/(site)/dashboard/busquedas-guardadas/page.tsx` (currently `autos` | `bienes-raices` | `rentas` only)
- Current parked proof: no `saved-search/servicios` directory; no `servicios` registry key
- Potential OCC residual: only a small dashboard `CATEGORY_REGISTRY` entry if upstream lands engine/adapter but not owner dashboard registry
- Receiver expected product change: NONE unless that registry residual is proven after landing

# 26. Final motto

**QUE RUJA EL LEÓN.**  
**HARD WORK. GOD FIRST.**
