# 14 — SEARCH / RESULTS / RELATED / SAVED SEARCH AUDIT (G25, G28, G29)
Ref: `origin/main`. Sept seal `e3956df8`. Stream status: **G28 COMPLETE** (6 surfaces) ·
**G25 COMPLETE** (this document resolves the open scheduler question) · G29 partial.

---

# PART A — SAVED SEARCH (G25)

## A.1 THE SCHEDULER QUESTION — RESOLVED

**A prior September audit claimed: "retry processor exists, admin endpoint exists, periodic trigger
may be missing."**

**VERDICT: the retry *infrastructure* exists. The periodic trigger is ABSENT. The admin retry
endpoint does NOT exist. The source documents its own gap.**

Evidence:
```
git show origin/main:vercel.json      →  fatal: path 'vercel.json' does not exist in 'origin/main'
git ls-tree -r --name-only origin/main -- app/api | grep -iE 'cron|schedul|sweep'
   →  app/api/digital-contact/schedule-request/route.ts        (unrelated)
   →  app/api/revenue-os/admin/subscription-sweep/route.ts     (unrelated — subscriptions)
git grep -l "pg_cron|cron.schedule" origin/main -- supabase/   →  (empty)
git ls-tree -r --name-only origin/main -- app/api/saved-search
   →  app/api/saved-search/route.ts        (GET :11, POST :45 only)
   →  app/api/saved-search/[id]/route.ts
```
**There is no `vercel.json` in the repository at all**, no cron route, no `pg_cron` migration, and no
saved-search admin or retry endpoint.

### The code states the gap in its own comments
`app/lib/saved-search/delivery/savedSearchEmailDelivery.ts` — `SAVED_SEARCH_EMAIL_MAX_ATTEMPTS = 3`:
> *"Number of real delivery attempts a match event may accumulate before the atomic claim RPC refuses
> to hand it out again. **This build makes exactly one attempt per event (no cron/worker to retry a
> failed one)**, so this bound only protects a future manual/admin retry surface."*

`app/lib/saved-search/autos/autosSavedSearchMatchOrchestrator.ts:12-13`:
> *"SMS, push, in-app notification, outbox delivery, **cron**, or Edge Function is called from here —
> this stops at writing `saved_search_match_events` rows with `status = 'pending'`."*

`:45` — *"never a global outbox scan."*

## A.2 THE ACTUAL ARCHITECTURE — EVENT-DRIVEN, NOT SCHEDULED

The match orchestrators are invoked **synchronously at publish/payment time**, not by any scheduler:

| Orchestrator | Invoked from |
|---|---|
| `autosSavedSearchMatchOrchestrator` | `app/lib/clasificados/autos/autosClassifiedsListingService.ts` |
| `bienesRaicesSavedSearchMatchOrchestrator` | `app/lib/clasificados/bienes-raices/brListingPaymentService.ts` |
| `rentasSavedSearchMatchOrchestrator` | `brListingPaymentService.ts`, `app/lib/listingPlans/revenueRentasFulfillment.ts` |

Flow: new/renewed listing → orchestrator matches saved searches → inserts
`saved_search_match_events` rows with `status='pending'` → `attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds)`
(`autosSavedSearchMatchOrchestrator.ts:221`) makes **exactly one bounded attempt for only the events
that run inserted** — explicitly never a global scan (`:216-218`), and it can never fail the caller.

## A.3 🟠 P1 — GAP-030: A FAILED SAVED-SEARCH EMAIL IS NEVER RETRIED

**EXACT FALSE:** if the single best-effort delivery attempt fails (mail provider down, transient
error), the `saved_search_match_events` row remains `status='pending'` with `attempt_count = 1`
**forever**. Nothing re-reads it. The subscriber is never notified, and the owner has no signal.

The supporting machinery for retry all exists and is unused:
- `supabase/migrations/20260818120000_saved_search_match_events.sql:18` — `saved_search_match_events`
- `…:84` — `public.saved_search_processing_failures` (failures ARE recorded —
  `autosSavedSearchMatchOrchestrator.ts:66`)
- `supabase/migrations/20260819090000_saved_search_match_events_delivery.sql:21-23` —
  `saved_search_match_events_attempt_count_check`
- `CLAIM_RPC = "claim_saved_search_match_event"` — an atomic claim RPC built for a worker that does
  not exist
- `SAVED_SEARCH_EMAIL_MAX_ATTEMPTS = 3` — a bound with no consumer

**PROVEN REFERENCE EXISTS: YES (partial).**
REFERENCE CATEGORY: **Revenue OS** · REFERENCE PATH:
`app/api/revenue-os/admin/subscription-sweep/route.ts` — an existing, working, machine-key-authorized
sweep endpoint (`machineKeyAuthorized` :40, constant-time compare :27-37, OR
`requireLeonixAdminPermission` :43) that calls `sweepDueSubscriptionTransitions` +
`reapStaleProcessingEvents`.
TARGET PATH: no equivalent exists under `app/api/saved-search/`.
DIFFERENCE: one sweep route that claims `pending` events via the existing
`claim_saved_search_match_event` RPC and calls the existing delivery function, plus a trigger to
invoke it (the repo has **no `vercel.json`**, so the scheduling mechanism itself must be chosen —
Vercel cron, Supabase `pg_cron`, or external).
**ACTION: ADOPT EXISTING (route shape) + OWNER_POLICY_DECISION (scheduling mechanism).**

## A.4 🟡 P2 — GAP-031: SAVED SEARCH COVERS 3 OF 14 CATEGORIES

`app/lib/saved-search/delivery/savedSearchEmailDelivery.ts:37`:
```ts
const CATEGORY_RESOLVERS: Record<string, SavedSearchDeliveryCategoryResolver> = {
  autos:            autosSavedSearchDeliveryResolver,
  "bienes-raices":  bienesRaicesSavedSearchDeliveryResolver,
  rentas:           rentasSavedSearchDeliveryResolver,
};
```
The file's own comment states the intended extension model — *"Category registry — the one place
delivery dispatches to a category's resolver. **Adding a category means adding one entry here, never
cloning this file.**"* — which is exactly the SHARED CONTRACT + CATEGORY ADAPTER doctrine, correctly
implemented.

Each covered category has a complete 6-file adapter set: `*PublicEligibleListing.ts`,
`*SavedSearchDeliveryResolver.ts`, `*SavedSearchEligibilitySupport.ts`,
`*SavedSearchMatchOrchestrator.ts`, `*SavedSearchResultsUrl.ts`, `savedSearch*Adapter.ts`,
`savedSearch*Matcher.ts`.

**Classification per category:**
- autos, bienes-raices, rentas → **TRUE**
- servicios, restaurantes, comida-local, empleos, ofertas-locales → **INTENTIONAL_NA** — saved search
  is an *inventory-search* feature; these are business-profile / offer surfaces
- comunidad, clases, busco, mascotas-y-perdidos, en-venta, viajes → **GLOBALIZATION_ADOPTION_GAP
  (P2/P3)** — arguably applicable (en-venta especially, being inventory-shaped)

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Autos** · REFERENCE PATH:
`app/lib/saved-search/autos/` (the complete 6-file adapter set) · TARGET: a new
`app/lib/saved-search/<category>/` directory + one line in `CATEGORY_RESOLVERS` ·
**ACTION: ADOPT EXISTING** (per category the Owner wants).

## A.5 STORAGE + CRUD
Table `public.saved_searches` — `supabase/migrations/20250313000002_saved_searches.sql:2`, reconciled
by `20260817120000_saved_searches_v1_reconcile.sql:104`. Match events
`20260818120000_saved_search_match_events.sql`, delivery state `20260819090000_…delivery.sql`,
BR/Rentas extension `20260819150000_…br_rentas.sql`.
CRUD: `app/api/saved-search/route.ts` (GET `:11`, POST `:45`), `app/api/saved-search/[id]/route.ts`.
Server CRUD `app/lib/saved-search/savedSearchServerCrud.ts`; canonicalization
`savedSearchCanonicalize.ts`; fingerprinting `savedSearchFingerprintBrowser.ts` /
`savedSearchFingerprintServer.ts`; client `savedSearchClient.ts`; types `savedSearchTypes.ts`;
email body `delivery/savedSearchMatchEmail.ts`.

**EVIDENCE GAP:** the dashboard management UI (list / disable / delete) and the public results-page
"save this search" CTA were not individually traced. Deferred to Batch 6 completion.

---

# PART B — SEARCH / RESULTS / FILTERS (G28)

## B.1 THE `categoryStandardV2` CLAIM — RESOLVED

**September claim: "Rentas and Bienes results may not consume `categoryStandardV2`."**
**VERDICT: CONFIRMED for results. REFUTED for landing.**

```
git grep -n "categoryStandardV2" origin/main -- "app/(site)/clasificados/rentas" "app/(site)/clasificados/bienes-raices"
→ exactly TWO hits, both landing-only, both importing only ImageDiscoveryCard:
  bienes-raices/landing/BienesRaicesLandingIntentTiles.tsx:10
  rentas/landing/RentasLandingIntentTiles.tsx:10
```

| Category | Landing V2 | Results V2 | Results shell actually used |
|---|---|---|---|
| servicios | **TRUE** (`landing/ServiciosLandingPage.tsx:14`) | **FALSE** | bespoke `ServiciosResultsPageShell` + V1 `categoryStandard/CategoryStandardPagination` |
| restaurantes | **TRUE** (`landing/RestaurantesLandingPage.tsx:27`) | **TRUE** (`resultados/RestaurantesResultsShell.tsx:8-18`, full kit) | the only full V2 adopter |
| comida-local | **FALSE** | **FALSE — no results route exists** | landing IS results |
| bienes-raices | partial (1 leaf card) | **FALSE** | `resultados/components/BienesRaicesResultsShell.tsx:5-10` — a 2-div wrapper |
| rentas | partial (1 leaf card) | **FALSE** | `results/components/RentasResultsShell.tsx:5-10` — same shape |
| negocios-locales | **FALSE** | **FALSE** | static hub, no data source at all |

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Restaurantes** · REFERENCE PATH:
`app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx:8-18` (imports
`LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, `LeonixCategorySearchCanvas`,
`LeonixCategoryResultsShell`, `LeonixCategoryActiveFilters`, `LeonixCategoryResultsToolbar`,
`LeonixCategoryCompactEmptyState`) · TARGETS: the bespoke shells above ·
DIFFERENCE: bespoke 2-div wrappers over local style constants instead of the shared V2 kit ·
**ACTION: ADOPT EXISTING** (cosmetic/structural, P3 — not a functional blocker).

## B.2 🟠 P1 — GAP-013: NO PAYMENT/ENTITLEMENT VISIBILITY GATE ON ANY SURFACE

Entitlements only **reorder**; no row is ever excluded for non-payment.
- servicios `lib/serviciosEntitlementOverlay.ts:48-56` (overlay after filtering; failure → organic `:57-62`)
- restaurantes `lib/restaurantesResultsInventoryServer.ts:31-38` (sets a badge + rank flag only)
- bienes-raices `lib/brPublicEntitlementOverlay.ts:92-113` (**fail-open** `:103,:110-112`); the read
  model explicitly refuses to synthesize (`resultados/lib/brMonetizationVisibilityReadModel.ts:67-74`)
- rentas `lib/fetchRentasPublicListingsForBrowse.ts:35-60` (`admin_promoted` → `destacada` badge only)

**Most exposed: comida-local** — `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts:26`
**selects `payment_status` and `package_tier`** and uses them in **no predicate** — neither in the
query (`:123-128`) nor in `applyFilters` (`:56-82`). An unpaid `status='published'` row is publicly visible.
**ACTION: OWNER_POLICY_DECISION** (is this intended?) then FIX.

## B.3 🟠 P1 — GAP-014: EXPIRATION GATE ABSENT EVERYWHERE EXCEPT RENTAS

- **bienes-raices** — `git grep -niE "expires_at|expired|expiration"` over the BR tree returns **zero
  non-`.md` hits**. BR never selects `expires_at`, never calls `resolveListingLifecycle`.
  **A BR listing published once is visible forever.**
- **comida-local** — `expires_at` exists and is read by admin (`comidaLocalAdminQueries.ts:7,32`) and
  dashboard (`comidaLocalDashboardQueries.ts:5,7,27`), but is **deliberately omitted** from
  `COMIDA_LOCAL_PUBLIC_LISTING_SELECT` (`comidaLocalPublicQueries.ts:26`) — the public surface cannot
  filter on it even if it wanted to.
- **servicios / restaurantes** — no listing-row expiration; only the entitlement window
  (`app/lib/listingPlans/listingPackageEntitlementsServer.ts:110-111`), which changes rank, never visibility.
- **rentas — ENFORCED, and the INVERSE bug.** `mapListingRowToRentasPublicListing.ts:279-291` calls
  `resolveListingLifecycle({… expiresAt: row.expires_at }, RENTAS_LISTING_LIFECYCLE_CONFIG)`;
  `listingLifecycleConfig.ts:8-20` sets `expirationRequired: true` and
  `publicVisibilityRequiresActiveLifecycle: true`. A rentas row with `expires_at = NULL` yields
  `lifecycleState:"unknown"`, `isPubliclyVisible:false` (`resolveListingLifecycle.ts:88-99`) →
  `browseActive === false` → **silently excluded from results AND detail**
  (`lib/fetchRentasListingForPublicDetail.ts:30`).

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Rentas** · REFERENCE PATH:
`app/lib/listingLifecycle/resolveListingLifecycle.ts` + `listingLifecycleConfig.ts` — a real, shared,
category-configured lifecycle engine · TARGETS: BR, comida-local, servicios, restaurantes public
queries · DIFFERENCE: they never call it · **ACTION: ADOPT EXISTING.**
**EVIDENCE GAP:** whether the rentas publish path always populates `expires_at` was not traced. If it
does not, live rentas listings are invisible today.

## B.4 PER-CATEGORY MECHANICS (condensed)

| | servicios | restaurantes | comida-local | bienes-raices | rentas |
|---|---|---|---|---|---|
| Results route | `/servicios/results` + `/resultados` (both live) | `/restaurantes/results` + `/resultados` (both live) | **none** | `/resultados` (canonical) | `/results` (canonical) |
| Table | `servicios_public_listings` | `restaurantes_public_listings` | `comida_local_public_listings` | `listings` | `listings` |
| Fetch site | server, service-role (`serviciosPublicListingsServer.ts:154-160`) | server, service-role (`restaurantesPublicListingsServer.ts:97-103`) | server, **anon/RLS preferred** (`comidaLocalPublicQueries.ts:102-112`) | **client browser** (`fetchBrPublishedListingsBrowser.ts:46`) | server SSR + client refetch (`fetchRentasPublicListingsForBrowse.ts:23`; `useRentasPublicBrowseInventory.ts:78`) |
| Row limit | 500 (cap 800) | **2000** | 300 | **80** | 5000 |
| Filtering | server, in-memory | **client-side** | server, in-memory | client-side | client-side |
| Page size | 12/24/48 (def 12) | 12/24/48 (def 12) | **none** | **9** | **6** |
| Published gate | `.ilike("listing_status","published")` `:162` + re-check `:167` | `.eq("status","published")` `:105` | `.eq("status", …PUBLISHED)` `:126` | `.eq("is_published",true).eq("status","active")` `:53-55` + JS + **parent gate** `:86-99` | **none in SQL by design** (`rentasListingPublicSelect.ts:58` — RLS + JS) |
| Placement | canonical weight → per-bucket sort ✅ | canonical weight, **then discarded by user sort** ⚠ | **none** | canonical weight, **zeroed for privado** `:292-293` | canonical weight, **all lanes** |
| Sorting | newest/name/rating/most_liked/most_saved/open_now | newest/name/rating | **none** (fixed `published_at` desc) | reciente/precio_asc/precio_desc | reciente/precio_asc/precio_desc |

## B.5 ADDITIONAL PROVEN DEFECTS

**🟡 P2 GAP-017 — BR pagination ceiling.** `BienesRaicesResultsClient.tsx:61` fetches `limit: 80` with
no count/offset and paginates client-side at `PAGE_SIZE = 9` (`:32`) → **row 81+ is unreachable**, and
displayed totals (`:147-148,:164`) are totals of the 80-row window, not the table.

**🟡 P2 GAP-017b — BR has 19 dead filter keys.** `resultados/lib/brResultsUrlState.ts:20` (`colonia`)
and `:36-52` (18 boolean characteristic filters) are parsed from the URL and **never applied** by
`filterBrListings` (`brResultsFilters.ts:151-260`). Self-documented as "Deferred… not yet wired".
Also `zip` is only applied `if (poolHasZip)` (`:226`) — it silently no-ops when no row on the current
page carries a zip.

**🟡 P2 GAP-018 — Restaurantes discards paid placement on any user sort.**
`RestaurantesResultsShell.tsx:166` ranks, then `:170` `sortRestaurantesBlueprintRows` sorts the
**entire flat list** (`filterRestaurantesBlueprintRows.ts:194-216`) with **no bucket preservation** —
unlike Servicios, which sorts *within* placement buckets (`serviciosResultsFilter.ts:874-879`).
Paid placement survives only on the default `newest` sort.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: **Servicios** `serviciosResultsFilter.ts:874-879` ·
**ACTION: ADOPT EXISTING.**

**🟠 P1 GAP-016 — route-slug chaos + duplicate-content SEO.**
BR canonicalizes `/results` → `/resultados` (permanent redirect, `next.config.ts:86-88`);
`bienes-raices/results/page.tsx:1` is a dead re-export.
Rentas canonicalizes the **opposite** (`/results`, `rentasPublishRoutes.ts:18`) and
`/clasificados/rentas/resultados` is a **hard 404** — no `rentas` line in `next.config.ts`.
Servicios (`results/page.tsx:3`) and Restaurantes (`results/page.tsx:1`) serve the **same page at both
URLs via a plain ES re-export — no redirect, no canonical tag** (servicios metadata
`resultados/page.tsx:27-30` sets no `alternates.canonical`; restaurantes exports no `metadata` at all).
Restaurantes' `results/page.tsx` additionally **does not re-declare `dynamic = "force-dynamic"`**.
Stray non-route file `servicios/resultados/page_temp.tsx` (UTF-16) is still shipped.

**🟡 P2 — rentas legacy-row loophole.** `mapListingRowToRentasPublicListing.ts:263-266` coerces an
empty `status` to `"active"` and treats `is_published === null` as published. The **server** browse
path has no `is_published` check at all (`fetchRentasPublicListingsForBrowse.ts:63` relies solely on
`browseActive`), unlike the client path (`useRentasPublicBrowseInventory.ts:91`). A row with
`status = NULL` passes.

**🟢 P3 GAP-026 — hot-linked stock-photo fallbacks + injected default price.**
Restaurantes: `restaurantesPublicListingMapper.ts:103-104` → a remote Unsplash URL.
BR: `mapBrListingRowToCard.ts:145` → a remote Unsplash URL.
Rentas correctly uses local `/logo.png` (`mapListingRowToRentasPublicListing.ts:395`).
Comida-local uses a text placeholder (`ComidaLocalListingCard.tsx:50-52`).
Restaurantes also injects `priceLevel ?? "$$"` (`restaurantesPublicListingMapper.ts:131`) — a listing
with no declared price silently displays and filter-matches as `$$`.

**🟢 P3 GAP-027 — rentas `recencyRank` wraps every ~100 days.**
`mapListingRowToRentasPublicListing.ts:572` —
`Math.min(100, Math.floor(Date.parse(publishedAt)/86400000) % 100)`. "Most recent" is not reliably
chronological. Separately, the rentas **client refetch** path
(`useRentasPublicBrowseInventory.ts:88-94`) performs **no entitlement hydration and no
placement-weight resolution** — when it fires, all promotion/placement data is silently lost.

**🟢 P3 — lane-derivation divergence.** BR derives privado/negocio from
`listings.seller_type === "business"` (`brMonetizationVisibilityReadModel.ts:50-51`); rentas derives
it from the Leonix detail-pairs branch (`mapListingRowToRentasPublicListing.ts:131-134`) and
**ignores `seller_type` entirely** even though it selects it (`rentasListingPublicSelect.ts:10`). A
rentas row with `seller_type='business'` but no Leonix branch pair renders as **privado**.

**Neither BR nor Rentas has separate privado/negocio results tracks** — one query, one grid, lane is
a client-side filter value (`sellerType` / `branch`).

---

# PART C — RELATED LISTINGS (G29)

**Status: PARTIAL.** Sept-only `88d844e1` "red burn-down — G23 address verifier, **G29 related
listings**, ledger reconciliation" is not in `origin/main`, so whatever it repaired is absent from
production. The September claim that **Bienes Privado may lack related listings** was not
independently re-verified before the audit stream was terminated.
**EVIDENCE GAP — carried to the remaining-work list.**

---

## SUMMARY OF NEW GAPS FROM THIS DOCUMENT
| ID | Sev | Finding |
|---|---|---|
| GAP-030 | **P1** | A failed saved-search email is never retried; `pending` rows persist forever. Claim/failure/attempt infrastructure exists and is unused. No `vercel.json`, no cron, no `pg_cron`, no admin retry endpoint |
| GAP-031 | P2 | Saved Search covers 3 of 14 categories (autos, bienes-raices, rentas) |
| GAP-013/014/016/017/018/026/027 | P1–P3 | See Part B; also logged in `17_ACTIVATION_GAP_LEDGER.md` |
