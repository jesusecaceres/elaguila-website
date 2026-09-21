# 04D — COMMUNITY / LOW-COST LANES + VIAJES: FULL-CYCLE CERTIFICATION

**Batch 5 · Read-only forensic audit · 2026-09-09**

Lanes certified: **COMUNIDAD/EVENTOS · CLASES · BUSCO/SE BUSCA · MASCOTAS-Y-PERDIDOS · EN VENTA/VARIOS · VIAJES**

---

## 0. REFS — SOURCE OF TRUTH (verified twice, at audit start and immediately before writing)

| Ref | SHA | Role |
|---|---|---|
| **`origin/main`** | **`a0a4783971b42ea1d71ab2602d4720d0d590baf8`** | **TRUE current production. Every finding below is labelled against this ref unless stated.** |
| primary worktree `HEAD` | `d09d979c` | **112 commits STALE.** Not read for any finding. |
| Sealed Sept | `e3956df8` | `docs(globalization): record Wave 3 G09/G10 and G26 fixes as done` (Sep 9 11:47) |
| `integration/viajes-launch-qa-2026-08` | `f563cdf3` | **NEVER PUSHED**, local worktree only |
| `globalization-release-reconcile-2026-08-14` | `c0912a71` | **NOT in `origin/main`** |

### 0.1 ⚠ TOPOLOGY FINDING — THE SEALED SEPT TREE IS NOT IN PRODUCTION

```
git merge-base --is-ancestor e3956df8 origin/main   -> exit 1  (NOT an ancestor)
git merge-base e3956df8 origin/main                 -> 7878d856  (Sep 8 13:21)
git rev-list --left-right --count origin/main...e3956df8 -> 51   63
```

`origin/main` and the sealed Sept globalization tree **diverged at `7878d856`**. `origin/main` carries 51
commits the globalization line does not have; the globalization line carries **63 commits production does
not have**. This is not a "stale worktree" problem — it is a **fork**. All four Sept commits named in the
brief are inside those 63.

This single fact reframes every FALSE in this report: most of them are **already-written code sitting on an
unmerged branch**, not unbuilt work.

---

## 1. (a) FREE vs PAID — `git show origin/main:app/lib/listingPlans/revenuePricingMatrix.ts`

File is 578 lines on `origin/main`. Type contract: `billingMode` `:41`, `stripeEligible` `:49`,
`priceCents` `:40`, `newSalesRetired` `:73`.

| Lane | packageKey | `priceCents` | `billingMode` | `stripeEligible` | `promoEligible` | Entry lines |
|---|---|---|---|---|---|---|
| **clases** | `clases_paid_30d` | **2499** `:396` | `"one_time"` `:397` | **true** `:404` | true `:401` | `:391-407` |
| **clases** | `clases_free` | **0** `:413` | `"free"` `:414` | **false** `:421` | false `:418` | `:408-424` |
| **comunidad** | `comunidad_free` | **0** `:430` | `"free"` `:431` | **false** `:438` | false `:435` | `:425-441` |
| **mascotas-y-perdidos** | `mascotas_free` | **0** `:447` | `"free"` `:448` | **false** `:455` | false `:452` | `:442-458` |
| **busco** | `busco_free` | **0** `:464` | `"free"` `:465` | **false** `:472` | false `:469` | `:459-475` |
| **en-venta** | `en_venta_free_v1` | **0** `:380` | `"free"` `:381` | **false** `:388` | false `:385` | `:375-390` |
| **viajes** | `viajes_business_monthly` | **39900** `:481` | `"monthly_subscription"` `:482` | **true** `:489` | **true** `:486` | `:476-491` |
| **viajes** | `viajes_affiliate` | **0** `:497` | `"affiliate"` `:498` | false `:505` | false `:502` | `:492-508` |

### 1.1 N-A DECLARATIONS (explicit, with evidence)

- **comunidad, mascotas-y-perdidos, busco, en-venta** are **genuinely free**: their only matrix entry is
  `priceCents: 0` / `billingMode: "free"` / `stripeEligible: false` / `promoEligible: false`.
  → **CHECKOUT = N-A · PROMO = N-A · STRIPE = N-A.** There is no checkout route, no Stripe session, and no
  promo validator path for these categories; `validateRevenueCheckoutRequest` rejects on
  `stripeEligible: false` (`revenuePricingMatrix.ts:526` `return def.stripeEligible === true;`).
  Checkpoint copy is truthful — `categoryPublishCheckpoints.ts:546, 592, 634, 680, 726` all read
  `"Publicar gratis"` / `"Post for free"`, and `:524` sets `priceLabel: es ? "Gratis" : "Free"`.

- **clases** is **free in the product**, paid only in the catalog. The $24.99 SKU is **deliberately dormant**:
  - `app/(site)/publicar/clases/page.tsx:5` — *"(clases_paid_30d) is deliberately not offered — no checkout path exists (owner decision D2)."*
  - `app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts:499-500` — *"The dormant `clases_paid_30d` SKU is deliberately NOT shown — no checkout path exists for it (owner decision D2: launch free-only)."*
  → **CHECKOUT = N-A · PROMO = N-A · STRIPE = N-A** *in the shipped product*, with the caveat that
  `revenueClasesFulfillment.ts` and `revenueCategoryCheckoutPayload.ts:29` keep the SKU wired server-side.
  This is an **honest** dormancy: it is documented in two places and no user-visible surface offers it.

- **viajes** is the **only non-free lane** in this batch — and it is the defect. See §1.3.

### 1.2 Unintegrated branch `globalization-release-reconcile-2026-08-14` — containment

```
c0912a71  fix(revenue-os): label free Viajes/Cupones as free, not paid     NOT in origin/main
d1447ae7  feat(revenue-os): lock free Viajes and Cupones catalog           NOT in origin/main
8fef4d26  feat(ofertas): make community coupons free                       NOT in origin/main
6d736840  feat(viajes): add free community opportunity intake              NOT in origin/main
078c806c  fix(revenue-os): canonicalize commercial listing identity        NOT in origin/main
```

All five verified with `git merge-base --is-ancestor <sha> origin/main` → exit 1. Branch tip is `c0912a71`.

What the branch carries (from `git show --stat` + commit bodies):

- **`d1447ae7`** — *Owner lock 2026-08-25*: new Viajes business publishing and basic Leonix community
  coupons are **FREE**. Introduces `viajes_business_free` and `ofertas_locales_coupons_free`
  (`priceCents: 0`, `billingMode: "free"`, no Stripe, no promo, no placement). Retires
  `viajes_business_monthly` ($399/mo) and `ofertas_locales_coupons_30d` ($199/30d) for new sales
  (`stripeEligible/promoEligible false`, `newSalesRetired true`) while keeping them resolvable for
  historical rows. Adds a `410 package_retired_now_free` guard to `app/api/revenue-os/checkout/route.ts`.
- **`6d736840`** — makes Viajes business free **in the product**, not just the catalog: free-variant
  checkpoint card (no $399, no coupon banner) routing through a mandatory ES/EN Community Opportunity
  Intake at `/publicar/viajes/negocios/intake`, writing the **same** `viajes_staged_listings` row.
- **`8fef4d26`** — free community coupons end-to-end; also fixes an admin commercial-discrepancy check
  that hardcoded the historical coupon key as "expected".
- **`c0912a71`** — fixes `revenueAdPlanBadgeLabel()` to test `billingMode === "free"` *before* the
  `customerType.includes("business")` fallthrough, and corrects the stale Viajes checkpoint header comment.
- **`078c806c`** — server-owned canonical `listing_source` resolver; removes client-trusted
  `body.sourceTable` from consent / attempt-key / intro-discount resolution in the checkout route.

### 1.3 ⚠ ANSWER: **YES — `origin/main` mislabels a free product as paid in a user-visible surface. [P0]**

**Owner-locked truth (2026-08-25, `d1447ae7` + `6d736840`):** Viajes business publishing is FREE.

**What `origin/main` actually renders:**

`app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts`
```
786    const businessPrice = monthlyPrice("viajes_business_monthly", "viajes");   // -> "$399.00/mes"
789        id: "viajes_negocios",
790        variant: "paid",
794        priceLabel: businessPrice,
801        modalTitle: `Qué incluye Negocio de viajes — ${businessPrice}`
813        `Precio mensual: ${businessPrice}`
819        couponEligible: isPromoEligible("viajes_business_monthly"),   // -> true
820        highlighted: true,
```
Rendered to users at `app/(site)/publicar/viajes/checkpoint/page.tsx:29`
(`<QuickLaneCheckpointClient lang={copyLang} category="viajes" />`).

So a publisher sees a **highlighted "paid" card, "$399.00/mes", a coupon banner, and "Precio mensual:
$399.00/mes"** for a product the owner locked FREE two weeks earlier.

**It gets worse — the $399 is never actually charged.** `ctaHref: negociosHref`
(`categoryPublishCheckpoints.ts:815`) routes straight to `/publicar/viajes/negocios`. Repo-wide,
`viajes_business_monthly` has **exactly four references on `origin/main`** and **none is a checkout or
fulfillment path**:
```
git grep -n "viajes_business_monthly" origin/main -- app/
  categoryPublishCheckpoints.ts:498   (comment)
  categoryPublishCheckpoints.ts:786   (price display)
  categoryPublishCheckpoints.ts:819   (promo eligibility display)
  revenuePricingMatrix.ts:478         (the definition)
```
There is no `revenueViajesFulfillment.ts` (compare `revenueClasesFulfillment.ts`,
`revenueServiciosFulfillment.ts`, `revenueAutosDealerFulfillment.ts`, `revenueRentasFulfillment.ts`,
which all exist). This corroborates and sharpens the **Viajes charge-without-fulfillment** finding in
`11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md`: the surface **advertises** a recurring charge and a
coupon that the system has no machinery to collect or honour.

**Secondary (latent, not currently reachable):** the badge bug `c0912a71` fixes is still present at
`app/lib/listingPlans/revenueDisplay.ts:108`:
```
108  } else if (def?.customerType?.includes("business") || def?.billingMode === "monthly_subscription") {
109      planLabel = lang === "es" ? "Negocio pagado" : "Paid business";
```
`billingMode === "free"` is never tested. On `origin/main` no free package has a `*_business`
`customerType` (the free community packages are `customerType: "community"`), so the literal
"Paid business" mislabel is **latent**. But the same fallthrough produces a **real, reachable** cosmetic
defect today: every free community package (`comunidad_free`, `clases_free`, `busco_free`,
`mascotas_free`, `en_venta_free_v1`) matches **no** branch at `:100-112` and falls to the generic default
at `:114-116` → the owner dashboard ad-plan badge reads **"Plan del anuncio" / "Ad plan"** instead of
**"Gratis" / "Free"**. A free listing never says "free" on the dashboard. **[P2]**

---

## 2. (b) THE VIAJES QUESTION

### 2.1 Worktree facts

```
git -C /c/projects/elaguila-website-viajes status --short   -> 46 modified + 8 untracked  (CONFIRMED)
git -C /c/projects/elaguila-website-viajes show --stat f563cdf3
  f563cdf336173625138c8f427d57754f92dc592f
  Jesus Caceres  Tue Aug 4 16:50:44 2026 -0700
  feat(viajes): complete publisher public experience and lifecycle
  136 files changed, 10215 insertions(+), 3488 deletions(-)
git merge-base --is-ancestor f563cdf3 origin/main   -> exit 1  (NOT an ancestor)
merge-base                                          -> 3fae3e8d
git rev-list --left-right --count origin/main...f563cdf3 -> 457   1
```

One commit, hanging **457 commits behind** current `origin/main`, never pushed, plus **46 files /
+545 −471** of uncommitted working-tree changes and 8 untracked entries on top. **~80 paths exist only
here, ~62 of them source.**

### 2.2 ⚠ IS VIAJES SHIPPABLE ON `origin/main`? **NO. [P0]**

`app/(site)/clasificados/viajes/negocio/[slug]/page.tsx`
```
42    if (!viajesAllowCuratedDemoCatalog()) notFound();
```
`app/(site)/clasificados/viajes/lib/viajesPublicInventory.ts`
```
17  export function viajesAllowCuratedDemoCatalog(): boolean {
18    if (process.env.NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED === "1") return false;
19    /** Production never merges curated sample rows — even if `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1` is set by mistake. */
20    if (process.env.NODE_ENV === "production") return false;
21    return process.env.NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED !== "0";
22  }
```

**Line 20 is unconditional and short-circuits ahead of every env read.** In production the function returns
`false` before `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED` is ever consulted. Therefore **every**
`/clasificados/viajes/negocio/<slug>` request in production is a hard 404, and **no env flag can turn it on.**

**Compounding:** the same gate blocks `components/ViajesLowerSections.tsx:18` and
`components/ViajesTopOffers.tsx:20` (both `return null` in production). Those two components are the **only**
consumers of `data/viajesHomeFeedSelectors.ts:22`, which is the **only** producer of
`profileHref: /clasificados/viajes/negocio/${slug}`. So in production the negocio route is simultaneously
**unreachable** (nothing renders a link to it) and **404** (line 42). The business-profile slot does not
exist for real users.

**Data source confirmed sample-only.** `app/(site)/clasificados/viajes/data/viajesNegocioProfileSampleData.ts`
(114 lines): header comment lines 1-3 ("replace with API later"); `:31`
`export const VIAJES_NEGOCIO_PROFILES: Record<string, ViajesNegocioProfileModel> = {` — a hardcoded object
literal with three slugs (`viajes-del-valle`, `pura-vida-escapes`, `bay-travel-co`); `:110`
`VIAJES_NEGOCIO_SLUGS`; `:112` `getViajesNegocioProfileBySlug`. **Zero `supabase`, zero `.from(`.**
Viajes landing (`page.tsx:23`) and results (`resultados/page.tsx:9`) *do* read real data via
`fetchViajesPublicBrowseRowsMerged()`, and offer-detail (`oferta/[slug]/page.tsx:51`) reads
`resolveViajesStagedOfferDetailBundle()` with sample as fallback — the negocio profile is the **one public
route with no DB path at all**, which is exactly why it is hard-gated off.

**Documentation actively contradicts the code.** `viajesPublicInventory.ts:6`, `viajesUiCopy.ts:331/475/668/812`
and `app/lib/clasificados/CLASIFICADOS_FULL_FIELD_INTEGRITY_AUDIT.md:305,364` all state samples appear in
production "unless/if `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1`". That is **false as written** — line 20 makes
the flag inert. Anyone reading the docs would wrongly conclude the page is flag-recoverable. **[P1]**

### 2.3 ⚠ IS THE WORKTREE MUST-RESCUE? **YES.**

It is the **only** place `resolveViajesProviderProfileFromStagedServer.ts` exists — the sole implementation
anywhere that makes the negocio page resolve **real DB-backed providers** (wired at
`negocio/[slug]/page.tsx:36,49`; `notFound()` only when both DB and demo miss, `:51`). It is unpushed, one
commit off a point 457 commits back, with 54 unbacked working-tree changes on top. Deleting that directory
is unrecoverable loss of ~10,200 added lines across 121 Viajes files.

### 2.4 What `origin/main` LACKS that the worktree HAS

| # | Missing capability | Worktree evidence |
|---|---|---|
| 1 | **DB-backed negocio profile resolution** — removes the production 404 | `lib/resolveViajesProviderProfileFromStagedServer.ts`, `lib/viajesProviderMatch.ts`, wired `negocio/[slug]/page.tsx:36,49` |
| 2 | **Entire Offer Model V2 layer** (10 files) — canonical model, defaults, validation, normalizer, staged serializer, browse+detail mappers, kind map, media guards, phone display | `.../viajes/lib/v2/` — **this directory does not exist on `origin/main`** |
| 3 | **Decomposed offer-detail experience** (7 components) | `ViajesOfferDetailGallery`, `ViajesOfferModuleCards`, `ViajesOfferInquiryHub`, `ViajesOfferBusinessHub`, `ViajesOfferRelatedRails`, `ViajesOfferLocationsBlock`, `ViajesOfferPillSection` + `viajesOfferDetailRelatedServer.ts` |
| 4 | **Results filtering upgrades** | `ViajesResultsActiveFilters`, `ViajesResultsViewToggle`, `ViajesResultsProviderRail`, `viajesResultsTripTypeOptions.ts`; filter rail rewritten |
| 5 | **Landing sections** | `ViajesLandingIntentPills`, `ViajesMobilitySection`, `ViajesNearbyEscapes`, `ViajesStaySection` |
| 6 | **V2 publisher / intake** (24 files) | stepper, media manager, location fields, pill-collection editor, 10 typed module editors (Flight/Cruise/CarRental/Accommodation/VacationRental/Activity/Food/Transportation/Addon/Itinerary), negocios+privado V2 draft hooks and step components |
| 7 | **Two API routes + admin detail page** | `app/api/clasificados/viajes/media/draft-photo-upload/route.ts`, `app/api/admin/viajes/staged-listings/[id]/route.ts`, `app/admin/(dashboard)/clasificados/viajes/business-offers/[id]/page.tsx` |
| 8 | **Owner dashboard libs** | `viajesOwnerDashboardHero.ts`, `viajesOwnerDashboardLinks.ts` |
| 9 | **Local SEO** | `viajesLocalSeo.ts` — metadata on landing + results |
| 10 | **Display/safety utilities** | `ViajesSafeImage.tsx`, `viajesPriceDisplay.ts`, `viajesPublicDateDisplay.ts`, `viajesPublicOfferTitle.ts` |
| 11 | **QA certification harness** | `qa/launch-qa/` (40+ artifacts: 390/768/1440 screenshots, build+playwright logs, DB probes, fixtures), `playwright.viajes-runtime.config.mjs`, 4 selftest scripts |
| 12 | **Analytics on 5 new surfaces** | business hub, inquiry hub, module cards, pill section, active filters |

### 2.5 ⚠ RESCUE CAVEAT — DO NOT MERGE THE BRANCH AS-IS

The branch is 457 commits behind and **lacks three artifacts that exist only on `origin/main`**:
`app/(site)/publicar/viajes/checkpoint/page.tsx` (the "Ver Más" checkpoint, added by `e8b66da6` *after* the
merge-base), `docs/globalization/package-f/VIAJES_GLOBALIZATION_DEPENDENCY_HANDOFF.md`, and
`scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts`. A rescue must be a **forward-port of the
Viajes file set onto current `main`**, not a merge — merging as-is regresses the checkpoint and the
globalization route-drift work.

---

## 3. (f) SEPT-ONLY COMMITS — CONTAINMENT AND WHAT PRODUCTION LACKS

All four verified: **`git merge-base --is-ancestor <sha> origin/main` → exit 1. NONE are in production.**
All four **are** ancestors of the sealed `e3956df8`.

### 3.1 `245a70f1` — "complete community classifieds globalization adoption" (Sep 1, 25 files, +232 −55)

**This is the single most load-bearing missing commit for this batch.** Three production defects follow
directly from its absence, each re-verified against `origin/main` itself (not merely against the commit's
parent):

**(i) [P1] Expired Comunidad/Clases listings never expire.**
`origin/main:app/(site)/clasificados/community/CommunityListingsResultsClient.tsx:101`
```
if (category === "comunidad" && !isCommunityEventActiveForDiscovery(pairs)) return false;
```
`git grep -n "isCommunityEventActiveForDiscovery" origin/main -- app/` returns **only** this call site plus
the helper's own definition. Consequences on `origin/main`:
- **Clases gets no discovery-expiration filtering at all** — and Clases is the one lane in this batch with a
  live, Stripe-eligible $24.99/30-day SKU registered in the matrix.
- **No expiry gate on the detail page for either category.** An expired event or finished class stays fully
  live and reachable at its direct `/clasificados/anuncio/<id>` URL **indefinitely**. The Sept fix adds
  `isExpiredCommunityQuickListing` and folds it into the not-found branch at `page.tsx:1304`; `origin/main`
  has neither.

**(ii) [P1] Mascotas y Perdidos detail page has zero analytics and zero Report.**
`origin/main:app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx` is **68
lines total**. Its entire instrumentation is:
```
8   import { addListingView } from "@/app/lib/recentlyViewed";
49    useEffect(() => {
51      addListingView(listing.id);
```
No `trackCommunityListingView`, no `LeonixInlineListingReport`. This is the page **every current Mascotas
listing actually renders through** (dispatched from `anuncio/[id]/page.tsx:1384`). A lost-and-found category
— the one most exposed to scam and spam posts — ships with **no reporting affordance whatsoever**.
Corroborates `10_ANALYTICS_EVENT_COVERAGE.md:150,180` ("mascotas-y-perdidos — NONE").

**(iii) [P2] Four results clients ignore the visitor's stored language preference.**
On `origin/main`, all four hardcode a bare query-param check and never read the `leonix_lang`
cookie/localStorage:
```
busco/BuscoResultsClient.tsx:91                      const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
community/CommunityListingsResultsClient.tsx:63      const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
en-venta/results/EnVentaResultsClient.tsx:117        const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx:66  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
```
An English-preferring visitor who navigates to any of these four results pages without an explicit `?lang=en`
is silently served Spanish. The Sept fix routes each through `navCopyLang(resolveRouteLang(...))` or the
lane's own `*LangFromSearchParams` helper.

### 3.2 `13b0d172` — "complete Empleos and Ofertas globalization adoption" (Sep 1, 17 files, +140 −32)
Out of this batch's lane scope (Empleos / Ofertas Locales). **Not in production.** Recorded for the ledger:
it also touches `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts`, a **shared** dashboard surface
these lanes read.

### 3.3 `f67ee268` — "adopt Recently Viewed + Report on Rentas; reclassify Bienes Raices cells" (Sep 1, 2 files, +72)
Out of lane scope. **Not in production.** Adds `scripts/verify-family2-bienes-rentas-adoption.ts` — production
therefore also lacks that verifier.

### 3.4 `0e2f9b17` — "close residual WhatsApp international-digit gap; consolidate Report on the generic anuncio page" (Sep 1, 10 files, +165 −103)
**Not in production.** Directly relevant here: it removes **87 lines** from
`app/(site)/clasificados/anuncio/[id]/page.tsx` by consolidating Report onto the shared surface, and fixes
international-digit handling in `app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts`
(+14) and `app/lib/digitalContact/humanConnection/nativeChannelHrefs.ts` (+8). **`origin/main` therefore
still carries the residual WhatsApp international-digit gap on the En Venta contact path and the shared
native-channel href builder**, and still has the duplicated in-page Report implementation. Production also
lacks `scripts/verify-whatsapp-report-shared-surface-sweep.ts`.

---

## 4. (c) ROUTE + STORAGE MAP — THE SHARED-vs-BESPOKE VERDICT

### 4.1 ALL FIVE community lanes share the generic `listings` table

Proven at the publish action in each lane (`origin/main`):

| Lane | Publish module | `.from("listings")` | `category:` | `owner_id:` |
|---|---|---|---|---|
| busco | `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts` | `:290` | `:161-175` | `:162` |
| clases | `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts` | `:273`, `:452` | `:239-253` (`kind`) | `:240` |
| comunidad | same module | `:273`, `:452` | `:239-253` (`kind`) | `:240` |
| mascotas-y-perdidos | `app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts` | `:229` | `:141-155` | `:141` |
| en-venta | `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` | `:444` | `:382-396` | `:383` |

Independently confirmed by `sourceTable: "listings"` in `app/lib/listingIdentity/categoryRouteRegistry.ts`
at `:915` (en-venta), `:1107` (busco), `:1161` (clases), `:1205` (comunidad), `:1246` (mascotas).

**Viajes is the exception** — it writes `viajes_staged_listings` with owner field `owner_user_id`
(`app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts`, 9 `.from(` sites; migrations
`20260410180000_viajes_staged_listings.sql`, `20260410200000_viajes_staged_owner_not_null.sql`).

### 4.2 ALL FIVE community lanes share the generic public page `/clasificados/anuncio/[id]`

Every adapter's `publicRoute` is `` `/clasificados/anuncio/${identity.sourceId}` `` —
`categoryRouteRegistry.ts:922, 1112, 1167, 1210, 1256`. **There is no bespoke public route file for any of
the five lanes.** `app/(site)/clasificados/anuncio/[id]/page.tsx` is **2,635 lines** on `origin/main`.

The bespoke-ness is **rendering inside the shared route**, dispatched by guard:

| Lane | Renderer component | Dispatch line | Guard flag defined |
|---|---|---|---|
| busco | `app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx:66` | `page.tsx:1359` | `:813` |
| mascotas-y-perdidos | `app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx:37` | `page.tsx:1384` | `:821-823` |
| clases + comunidad | `app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx:87` | `page.tsx:1406` | `:800-806` |
| en-venta | `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` | `page.tsx:1479` / `:1495` | `:682` |

**⚠ Architectural consequence — the early-return cliff.** Each of these branches is an **early `return`**
at `page.tsx:1360 / 1385 / 1407 / 1487`, well before the main render body begins at `:1559`. Only
`{translateControl}` is passed through the boundary. Everything the monolith wires **after** `:1559` is
therefore **unreachable for these lanes**, including:
- `LeonixShareButton` — `page.tsx:2235`
- `dispatchConnectionHubCta` — `page.tsx:2560` (the **only** importer of the connection hub among these lanes)
- the in-page Report block and the related/similar sections

Whatever each bespoke component does not re-implement itself is simply absent. That is precisely why
Mascotas (a 68-line component) has no Report and no analytics while En Venta (a 1,446-line component) has
everything — see §3.1(ii) and the matrix in `05B`.

**Fallback caveat:** each guard also requires the row's `detail_pairs` to satisfy the lane contract
(`isBuscoQuickListing`, `isMascotasPerdidosSimpleListing`, `isCommunityQuickListing`). A row that fails its
contract falls through to the generic monolith body — a *different* rendering with a *different* feature
set for the same category. Unknown categories coerce to `"en-venta"` at `page.tsx:234`.

### 4.3 Publish canvases — all three confirmed at the stated paths on `origin/main`
- `app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx` ✓
- `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx` ✓
- `app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx` ✓

### 4.4 Storage summary

| Lane | Table | Owner field | Listing UUID | Leonix Ad ID | Prefix (migration) |
|---|---|---|---|---|---|
| comunidad | `listings` | `owner_id` | `listings.id` | `listings.leonix_ad_id` | `COMM` `20260506150000:70` → later `COM` `20260520120000:13` |
| clases | `listings` | `owner_id` | `listings.id` | `listings.leonix_ad_id` | `CLASS` `20260506150000:69` |
| busco | `listings` | `owner_id` | `listings.id` | `listings.leonix_ad_id` | `BUSCO` `20260520120000:15` |
| mascotas-y-perdidos | `listings` | `owner_id` | `listings.id` | `listings.leonix_ad_id` | `PET` `20260519180000:14` |
| en-venta | `listings` | `owner_id` | `listings.id` | `listings.leonix_ad_id` | `SALE` `20260506150000:67` |
| viajes | `viajes_staged_listings` | `owner_user_id` | `.id` | `.leonix_ad_id` | `TRAV` `20260507140000` |

**⚠ [P2] Ad-ID prefix drift for comunidad.** `20260506150000_leonix_ad_id_all_classifieds.sql:70` assigns
`COMM`; four later migrations (`20260507140000:13`, `20260508160000:13`, `20260519180000:13`,
`20260520120000:13`) redefine the same trigger function with `COM`. Last-applied wins → live prefix is
`COM`, but any row created before `20260507140000` carries `COMM`. Two prefixes for one category in the same
column.

**RLS: TRUE for all five community lanes.** `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql`
— public read gated on `lower(status) = 'active'` (`:20,34,54,68`), owner select `owner_id = auth.uid()`
(`:45`), insert `with check (owner_id = auth.uid())` (`:78`), update `:84-85`, delete `:91`.

**No migration creates `public.listings`.** The base table predates the tracked migration set — a real
reproducibility gap for any clean-environment rebuild. **[P2 / EVIDENCE GAP]**

Full per-lane slot map (landing → results → checkpoint → application → preview → publish → detail →
dashboard → edit → admin → API → verifiers → e2e) is in the companion file
`05B_COMMUNITY_LANES_VIAJES_PATHWAYS.md`.

---

## 5. CROSS-LANE DEFECTS FOUND WHILE MAPPING

**[P2] Two competing dashboard truths for clases / comunidad / mascotas.**
`app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts:146,161,182` provides working `manageHref`s
into `/dashboard/mis-anuncios?cat=…`, while `app/lib/listingIdentity/categoryRouteRegistry.ts:1177,1213,1269`
returns `dashboardRoute: () => null` with `ready:false` comments. The registry comments are **stale relative
to the categories file on this ref**. Any consumer trusting the registry concludes these lanes have no
dashboard; any consumer trusting the categories file gets a working link.

**[P2] Stale registry comment on the Mascotas publisher.**
`categoryRouteRegistry.ts:1258-1264` states Mascotas rows are written by `publishCommunityQuickToListings`.
They are not — the live caller
(`app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx:12`)
uses the dedicated `publishMascotasPerdidosQuickToListings.ts`. Misleading for anyone reasoning about
round-trip safety from the registry alone.

**[P2] `app/lib/businessAddress/*` (G23/G24) still has ZERO importers repo-wide on `origin/main`.**
Independently re-verified this batch: `git grep -ln "lib/businessAddress" origin/main -- app/` → **count 0**.
Six modules (`businessAddressContract`, `Directions`, `Normalize`, `Privacy`, `Provider`, plus the
comida-local example) are entirely dead code. Confirms the prior batch. **Address verifier scores FALSE on
every lane in this batch.**

**[P1] Viajes analytics is still a literal TODO stub on `origin/main`.**
`app/(site)/clasificados/viajes/lib/viajesPublicIntegration.ts`
```
27  export function viajesTrack(_event: string, _payload?: Record<string, string | number | boolean>): void {
28    if (!viajesAnalyticsAllowed()) return;
29    // TODO: connect to shared `trackEvent` / Vercel Analytics / internal pipeline
30  }
```
Consent plumbing is correct; the emitter body is empty. Confirms `10_ANALYTICS_EVENT_COVERAGE.md:152-153,181`.

**[P2] No `beforeunload` guard on any community lane publish flow.**
`git grep -ln "beforeunload" origin/main -- app/` → 16 hits, and the only in-scope one is
`app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`. Nothing under
`app/(site)/publicar/` has one. A publisher who closes the tab mid-application on comunidad, clases, busco,
mascotas or viajes gets no warning.

**[P2] SEO metadata absent on four of six lanes.**
`export const metadata` / `generateMetadata` present only in `en-venta` (`page.tsx`, `results/page.tsx`,
`preview/page.tsx`, `launch-checklist/page.tsx`) and `viajes` (`page.tsx`, `oferta/[slug]/page.tsx`,
`negocio/[slug]/page.tsx`). **None** in comunidad, clases, busco, mascotas, or community. JSON-LD exists only
at `en-venta/seo/enVentaJsonLd.ts` (consumed by `EnVentaAnuncioLayout.tsx`) and `viajes/page.tsx`.

---

## 6. CONSISTENCY WITH PRIOR BATCH FILES (cited, not re-derived)

- **`06_DATA_ROUND_TRIP_FIELD_AUDIT.md`** — en-venta `:113`, comunidad `:114`, clases `:115`, busco `:116`,
  mascotas `:117` all **SAFE** via the shared narrow-patch owner editor (`:134-146`; lanes routed at
  `categoryRouteRegistry.ts` `:932/1121/1172/1213/1266`, per `:143`); viajes `:118`, `:406-411` **SAFE**
  (whole-snapshot round trip). **Not re-derived here.** This batch adds only the observation that the patch
  editor's limitation is *scope*, not safety (`06:141`), which is why "active edit" scores partial below.
- **`10_ANALYTICS_EVENT_COVERAGE.md`** — comunidad/clases/busco emit via
  `app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics.ts` (`SOURCE_TABLE="listings"` `:10`),
  per `10:178`; **en-venta is the REFERENCE** (`app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics.ts`,
  `10:159,179`); mascotas `10:180`, viajes `10:181`, negocios-locales `10:182` emit **NONE**.
  **Not re-derived.** Independently re-confirmed the consumer sets this batch (see `05B` §2).
- **`11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md`** — pricing free/paid classification and the
  **Viajes charge-without-fulfillment** finding. **Not re-derived.** §1.3 above sharpens it with the
  four-reference grep and the absent `revenueViajesFulfillment.ts`.
- **`14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md`** — saved search covers **only autos / bienes-raices /
  rentas**. **Not re-derived.** Re-confirmed: `git grep -ln -i savedSearch origin/main -- app/` shows
  consumers only at `autos/components/public/AutosSaveSearchButton.tsx`,
  `bienes-raices/resultados/BienesRaicesResultsClient.tsx`, `rentas/results/RentasResultsClient.tsx`.
  → **saved search FALSE on all six lanes in this batch.**

---

## 7. FINDINGS LEDGER (this batch)

| ID | Sev | Finding | Ref | Path:line |
|---|---|---|---|---|
| B5-01 | **P0** | Sealed Sept globalization tree (`e3956df8`) is **NOT an ancestor** of `origin/main`; 63 commits of adoption work never reached production | `origin/main` | `git merge-base --is-ancestor e3956df8 origin/main` → 1 |
| B5-02 | **P0** | Viajes negocio profile is **permanently 404 in production**; no env flag can enable it | `origin/main` | `clasificados/viajes/negocio/[slug]/page.tsx:42` + `viajes/lib/viajesPublicInventory.ts:20` |
| B5-03 | **P0** | Viajes business advertised at **$399.00/mo + coupon-eligible** with **no checkout and no fulfillment module**; owner locked it FREE on 2026-08-25 (`d1447ae7`, unintegrated) | `origin/main` | `clasificados/publicar/_lib/categoryPublishCheckpoints.ts:786,790,794,801,813,819` |
| B5-04 | **P0** | Viajes rebuild (~10,215 lines, 121 files, incl. the only DB-backed provider resolver) exists **only** on unpushed `f563cdf3` + 54 uncommitted files | worktree | `/c/projects/elaguila-website-viajes`, `merge-base --is-ancestor` → 1 |
| B5-05 | **P1** | Expired Comunidad/Clases listings **never expire** — no detail-page gate; Clases has **no** discovery expiry at all despite a live $24.99 SKU | `origin/main` | `community/CommunityListingsResultsClient.tsx:101` (sole call site) |
| B5-06 | **P1** | Mascotas y Perdidos detail page (68 lines) has **zero analytics and zero Report** | `origin/main` | `mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx:49-51` |
| B5-07 | **P1** | Viajes analytics emitter is a literal TODO no-op | `origin/main` | `clasificados/viajes/lib/viajesPublicIntegration.ts:29` |
| B5-08 | **P1** | Docs in 6 places claim the Viajes curated-seed flag works in production; line 20 makes it inert | `origin/main` | `viajesPublicInventory.ts:6`; `viajesUiCopy.ts:331,475,668,812` |
| B5-09 | **P1** | Residual WhatsApp international-digit gap + duplicated in-page Report still present (fix `0e2f9b17` not in prod) | `origin/main` | `en-venta/shared/utils/enVentaContactActions.ts`; `lib/digitalContact/humanConnection/nativeChannelHrefs.ts` |
| B5-10 | **P2** | Four results clients ignore stored `leonix_lang`; English visitors silently served Spanish | `origin/main` | `BuscoResultsClient.tsx:91`, `CommunityListingsResultsClient.tsx:63`, `EnVentaResultsClient.tsx:117`, `MascotasPerdidosResultsClient.tsx:66` |
| B5-11 | **P2** | Free packages render as generic "Plan del anuncio"/"Ad plan", never "Gratis"/"Free"; `billingMode==="free"` never tested | `origin/main` | `lib/listingPlans/revenueDisplay.ts:108-116` |
| B5-12 | **P2** | `app/lib/businessAddress/*` — **0 importers repo-wide** (6 dead modules) | `origin/main` | `git grep -ln "lib/businessAddress" origin/main -- app/` → 0 |
| B5-13 | **P2** | Leonix Ad ID prefix drift for comunidad: `COMM` vs `COM` in the same column | `origin/main` | `20260506150000:70` vs `20260520120000:13` |
| B5-14 | **P2** | Registry ↔ categories disagreement on dashboard availability (clases/comunidad/mascotas) | `origin/main` | `categoryRouteRegistry.ts:1177,1213,1269` vs `dashboardMisAnunciosCategories.ts:146,161,182` |
| B5-15 | **P2** | Registry comment misattributes the Mascotas publisher | `origin/main` | `categoryRouteRegistry.ts:1258-1264` |
| B5-16 | **P2** | No unsaved-changes guard on any community publish flow (en-venta is the sole reference) | `origin/main` | only `en-venta/publish/useEnVentaPublishLeaveGuard.ts` |
| B5-17 | **P2** | No SEO metadata / JSON-LD on comunidad, clases, busco, mascotas, community | `origin/main` | absent in those trees |
| B5-18 | **P2** | No migration creates `public.listings` — clean rebuild is not reproducible | `origin/main` | `supabase/migrations/` (163 files) |

---

## 8. EVIDENCE GAPS

1. **No runtime execution.** This is a static forensic audit. No dev server, no browser, no DB query was run.
   Every claim is grounded in file content at a named ref. Nothing here proves runtime behavior under real
   Supabase data.
2. **`public.listings` base schema is untracked.** The full column set (`is_published`, `detail_pairs`,
   `business_meta`, `mux_playback_id`, …) was inferred from writers and readers, not from a CREATE TABLE.
3. **Migration application state unknown.** `supabase/migrations/` contains 163 files; which are actually
   applied to production could not be verified read-only. Note the branch commit `6d736840` explicitly
   authors a migration it does **not** apply — that pattern may exist elsewhere.
4. **Bespoke detail components not exhaustively read.** `EnVentaAnuncioLayout.tsx` (1,446 lines) and
   `anuncio/[id]/page.tsx` (2,635 lines) were read by targeted grep and by section, not line-by-line. A
   feature wired deep inside either could have been missed — always in the direction of **under-reporting
   TRUE**, never over-reporting.
5. **Viajes worktree diff not fully read.** File-level inventory and stats are exact; the semantic quality of
   the ~10,215 added lines was not reviewed. "Must-rescue" is a judgment about **irreplaceability**, not a
   code-quality endorsement.
6. **Promo/entitlement runtime paths taken from `11_…` by citation**, per instruction not to re-derive.
7. **`e3956df8`'s other 59 commits not enumerated.** Only the four named in the brief were examined. The
   divergence is 63 commits; **59 remain uncatalogued** and may contain further production-absent fixes.
   *This is the largest open gap in the batch and should be the first follow-up.*
