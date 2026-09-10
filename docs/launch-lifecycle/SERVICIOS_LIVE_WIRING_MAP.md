# SERVICIOS — LIVE WIRING MAP (AUTHORITATIVE)

Traced from runtime-consumed source only. File existence was never accepted as proof of live.
Every classification below is backed by a route, an import chain, a caller, an API/server action,
a table write, or a proven zero-consumer count.

Classification vocabulary (master §14): `LIVE` · `LIVE-SHARED` · `BUILT-NOT-WIRED` ·
`DUPLICATE-REFERENCED` · `DEAD-ZERO-CONSUMER` · `HISTORICAL` · `UNKNOWN`.

---

## 0. GATE STATUS

| Gate | Scope | Status |
|---|---|---|
| **SERVICIOS-1** | Launch-critical lifecycle repairs (§6.1–6.6, §5.1) | **CLOSED** — see §10 |
| **SERVICIOS-2** | Discovery + adoption (§5.3–5.6) + cleanup readiness (§4) | **CLOSED** — see §11 |

Everything marked **CLOSED (SERVICIOS-1 / SERVICIOS-2)** below is implemented on
`completion/launch-lifecycle-2026-09-09`. The only items still OPEN are the
subscription-sweep scheduler (§5.2, a platform decision) and aesthetic work.

---

## 1. WORKTREE TRUTH

| Field | Value |
|---|---|
| Worktree | `C:\projects\elaguila-website-launch-lifecycle` |
| Branch | `completion/launch-lifecycle-2026-09-09` |
| HEAD | `a0a4783971b42ea1d71ab2602d4720d0d590baf8` |
| `origin/main` | `a0a4783971b42ea1d71ab2602d4720d0d590baf8` |
| Divergence | `git rev-list --left-right --count origin/main...HEAD` → `0 0` (identical) |
| Working tree | clean except untracked `docs/launch-lifecycle/` (this document) |
| Sealed Globalization ref | `fix/globalization-final-closeout-2026-09` @ `e3956df893f5041ca22371c999038f297d536eae` — present locally, **NOT an ancestor of HEAD** (55 commits ahead, read-only evidence) |

Servicios source spans five trees. All five are real; only some are live:

| Tree | Files | Role |
|---|---|---|
| `app/(site)/clasificados/publicar/servicios/` | 56 | Checkpoint + application + preview + publish client — **LIVE** |
| `app/(site)/clasificados/servicios/` | 74 | Landing + results + public detail route + server readers — **LIVE (with a dead landing sub-island)** |
| `app/(site)/servicios/` | 112 | Public profile components, hub, profile libs — **LIVE (with a dead legacy publish/preview island)** |
| `app/api/clasificados/servicios/` + `app/api/admin/servicios/` | 13 | Publish, manage, leads, analytics, media upload, admin — **LIVE** |
| `app/admin/(dashboard)/workspace/clasificados/servicios/` | 10 | Admin ops workspace — **LIVE** |

`tsconfig.json` maps `@/app/servicios/*` → `app/(site)/servicios/*` and `@/app/clasificados/*` →
`app/(site)/clasificados/*`. Imports that look like they point at a non-existent `app/clasificados/`
are correct — do not "fix" them.

---

## 2. EXACT LIVE END-TO-END PATH

```
LANDING            /clasificados/servicios
                   app/(site)/clasificados/servicios/page.tsx
                     -> landing/ServiciosLandingPage.tsx  ("use client")                       LIVE
                   publish CTA -> /clasificados/publicar/servicios/checkpoint (line 37)
                   NOTE: static category navigation by design — no DB read (see §5.5)
  |
CHECKPOINT         /clasificados/publicar/servicios  -> redirect() -> .../checkpoint            LIVE
                   checkpoint/page.tsx -> ServiciosCheckpointClient.tsx
                   card  getServiciosCheckpointCard (clasificados/publicar/_lib/
                         categoryPublishCheckpoints)                                            LIVE-SHARED
                   shell clasificados/publicar/_components/PublishEntryCheckpoint               LIVE-SHARED
                   applicationHref = withClasificadosPublishLang("/publicar/servicios",
                                     routeLang, { product: "servicios_profesionales" })
  |
APPLICATION        /publicar/servicios
                   app/(site)/publicar/servicios/page.tsx  (renders directly, no redirect)
                     -> clasificados/publicar/servicios/components/
                        ClasificadosServiciosApplication.tsx  (3,962 L)                         LIVE
                   exit guard  app/lib/businessApplications/
                               useBusinessApplicationLeaveGuard.ts  (line 615)                  LIVE-SHARED
                   city input  app/components/CityAutocomplete                                  LIVE-SHARED
                   phone       app/components/forms/PhoneInput                                  LIVE-SHARED
                   languages   app/components/forms/LanguagesInput                              LIVE-SHARED
                   hours       app/components/forms/HoursEditor                                 LIVE-SHARED
                   location    clasificados/shared/constants/
                               leonixLocalBusinessLocationContract                              LIVE-SHARED
  |
DRAFT IDENTITY     clasificadosServiciosStorage.ts (sessionStorage JSON)                        LIVE
                   clasificadosServiciosDraftMediaIdb.ts (IndexedDB "lx-clasificados-
                   servicios-draft") for heavy blobs                                            LIVE
  |
HYDRATION          clasificadosServiciosPreviewHandoff.ts bootstrap
                   listing-edit lane: GET /api/clasificados/servicios/my-listing
                     -> serviciosPublishedToApplicationDraft() -> state + editIdentity
                     -> primeServiciosExistingPublicSlug(editIdentity.slug)  (line 507)         LIVE
  |
PREVIEW            /clasificados/publicar/servicios/preview
                   preview/page.tsx -> ClasificadosServiciosPreviewClient.tsx (821 L)           LIVE
                   canvas  clasificados/lib/preview/ClasificadosPreviewAdCanvas                 LIVE-SHARED
                   mode    app/lib/listingIdentity/previewModeContract
                           resolvePreviewMode / previewModeIsListingBound                       LIVE-SHARED
                   render  professional -> ServiciosProfessionalPreviewShell
                           standard     -> ServiciosProfileView                                 LIVE
                   card    ServiciosProfessionalResultCard | ServiciosHorizontalResultCard      LIVE
  |
PREVIEW -> EDIT    markPublishFlowReturningToEdit() + editHref
                   new draft      -> /publicar/servicios
                   listing-bound  -> serviciosBackToEditHrefFromPreview() (full dashboard ctx)  LIVE
  |
PAGAR              ClasificadosServiciosPreviewClient.onCheckout()
                   1. captureCheckoutNewsletterSubscriber(...)  awaited, never gates            LIVE-SHARED
                   2. saveServiciosPendingBeforeCheckout()
                      -> POST /api/clasificados/servicios/publish
                         { activationMode: "pending_payment" }
                      -> row saved as listing_status = "pending_payment", published_at = null
                      -> returns { listingId, leonixAdId, slug }                                LIVE
                   3. PublishCheckoutCheckpoint (shared) — confirmations, promo, consent        LIVE-SHARED
                   4. validateRevenuePromoForCheckout() (server-validated promo)                LIVE-SHARED
                   5. startRevenueCategoryCheckout({ ...SERVICIOS_BASE_CHECKOUT, listingId })   LIVE-SHARED
  |
REVENUE OS         app/lib/listingPlans/revenueCategoryCheckoutPayload.ts:85
                   SERVICIOS_BASE_CHECKOUT = { category "servicios",
                                               packageKey "servicios_base_monthly",
                                               returnPath "/clasificados/servicios" }
                   price  revenuePricingMatrix.ts:243  39900 cents, monthly_subscription,
                          stripeEligible true, promoEligible true,
                          capabilities ["coupons_offers"]  (owner-locked: coupons INCLUDED)     LIVE-SHARED
                   client is not the price authority — getRevenuePackageDefinition is           LIVE-SHARED
  |
STRIPE             POST /api/revenue-os/checkout -> revenueStripe
                   NO-RECHARGE GUARD: revenueActiveEntitlementGuard.ts:68 lists
                   "servicios_base_monthly" — a listing with an active entitlement is
                   refused a second base charge server-side                                     LIVE-SHARED
  |
WEBHOOK            POST /api/revenue-os/webhook
                   signature verify -> stripeEventLedger claim (layer-1 idempotency)
                   -> fulfillCheckoutSessionCompleted
                   -> reconcileSubscriptionByStripeId (subscription events)                     LIVE-SHARED
  |
ENTITLEMENT        revenueEntitlementFulfillment.activatePackageEntitlement
                   -> listing_package_entitlements                                              LIVE-SHARED
                   servicios offers module:
                     grantServiciosOffersAddonEntitlementFromBasePayment (bundled)
                     normalizeServiciosOffersAddonEntitlementSource (standalone, Gate E.1)      LIVE
  |
PUBLISH/ACTIVATION revenueFulfillment.tryActivateServiciosListingAfterEntitlement
                   -> revenueServiciosFulfillment.activatePaidServiciosListingFromRevenueOs
                      .from("servicios_public_listings").eq("id", listingId)   <-- ID-KEYED
                      pending_payment | paused_unpublished -> published; published_at set
                      suspended/rejected are never auto-activated
                      audit: "servicios_listing_activated_after_payment"                        LIVE
  |
RESULTS/SEARCH     /clasificados/servicios/results          <-- CANONICAL
                   results/page.tsx  = 3-line re-export of ../resultados/page.tsx
                   next.config.ts:115 permanently redirects /resultados -> /results
                   data     lib/serviciosPublicListingsServer.listServiciosPublicListingsRaw
                   gate     .ilike("listing_status","published") + in-code re-check
                   filters  lib/serviciosResultsFilter.ts (+ open_now via
                            serviciosHeroHoursStatus.serviciosHoursSummaryIsOpenNow)
                   placement resolveCanonicalVisibilityBucketWeights +
                            serviciosEntitlementOverlay                                         LIVE
                   paging   CategoryStandardPagination + catStdPerPage                          LIVE-SHARED
  |
PUBLIC LISTING     /clasificados/servicios/[slug]
                   [slug]/layout.tsx  -> generateMetadata: canonical, noindex on
                     pending_review / rejected / suspended, cookie-driven ES/EN                 LIVE
                   [slug]/page.tsx    -> getServiciosPublicListingBySlugForDiscovery
                     template routing -> ServiciosProfessionalProfileShell | ServiciosProfileView
                     reviews  serviciosDbReviewsMerge + listApprovedServiciosReviewsForSlug
                     addons   fetchAddonEntitlementsForListings (offers module truth)
                     jsonld   app/(site)/servicios/seo/serviciosJsonLd.ts                       LIVE
                   legacy   /servicios/perfil/[slug] -> 308 to the canonical URL                LIVE (shim)
  |
USER DASHBOARD     /dashboard/servicios
                   page.tsx -> LeonixDashboardShell / OwnerProductPageFrame /
                               OwnerEntityWorkspace                                             LIVE-SHARED
                   reads    GET /api/clasificados/servicios/my-listings
                            GET /api/clasificados/servicios/my-leads
                            GET /api/leonix-endorsements?category=servicios (Community Trust)
                            fetchOwnerEngagementDashboard (per-listing metrics)                 LIVE
                   caps     getOwnerEntityCapabilities("servicios")
                            (ownerEntityCapabilityRegistry.ts:139)                              LIVE-SHARED
                   lifecycle POST /api/clasificados/servicios/manage  (pause | resume)          LIVE
  |
ADMIN              /admin/workspace/clasificados/servicios                                      LIVE
                   actions.ts  updateServiciosPublicListingStatusAction,
                               setServiciosListingLeonixVerifiedAction,
                               setServiciosReviewModerationStatusAction
                   api        PATCH /api/admin/servicios/listings/[id]
                              (approve | suspend | reinstate | reject)
                   analytics  _lib/serviciosAdminCanonicalAnalytics.ts
                   legacy     /admin/clasificados/servicios -> redirect()                       LIVE (shim)
  |
PUBLISHED EDIT     serviciosListingEditHref() -> /publicar/servicios
                     ?edit=1&source=dashboard&listingId=…&leonixAdId=…&mode=listing-edit
                   (app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts:89)       LIVE
  |
SAME-ROW REPUBLISH POST /api/clasificados/servicios/publish
                   identity resolution (route.ts:299-310):
                     b.existingPublicSlug -> getServiciosPublicListingBySlugFromDb
                                          -> owner check -> .update().eq("slug", slug)
                     else                 -> allocateSlug() -> .insert()
                   <-- SLUG-KEYED, not id-keyed (see §5.1)
                   no-downgrade rule: an already-`published` row is never regressed to
                   pending on re-save (route.ts:452-456)                                        LIVE
  |
RENEWAL/EXPIRATION subscriptionLifecyclePolicy.ts:146 registers the servicios lane
                   (table servicios_public_listings, statusColumn listing_status,
                    suspendedValue "suspended")                                                 LIVE-SHARED
                   crank: /api/revenue-os/admin/subscription-sweep — has NO scheduler
                   (see §5.2)                                                                   BUILT-NOT-WIRED
  |
ANALYTICS          client  lib/recordServiciosGlobalAnalytics.ts + serviciosCtaIntents.ts
                   ops     POST /api/clasificados/servicios/analytics
                             -> servicios_analytics_events (15 allowed event types)
                   mirror  serviciosListingAnalyticsMirror.ts -> canonical listing_analytics
                             via serviciosCanonicalListingAnalyticsId                           LIVE-SHARED
                   self-engagement app/lib/analytics/selfEngagementGuard.ts                     LIVE-SHARED
```

---

## 3. SHARED-TOOL CONNECTIONS

| Tool | Shared implementation | Servicios consumer | Status | Action |
|---|---|---|---|---|
| **Translate Ad** | `app/components/translation/TranslateAdControl` + `app/lib/translation/helpers` + `/api/translate-ad` | `ServiciosPublicTranslationLayer.tsx` → `ServiciosProfileView:26`, `ServiciosProfessionalProfileShell:23` | **LIVE-SHARED** (Servicios is the pilot) | none |
| **Address / location normalization** | `app/lib/businessAddress/*` (contract, normalize, privacy, directions, provider) | **ZERO consumers — all 5 modules, repo-wide** | **BUILT-NOT-WIRED** | ADOPT (§7 G-1) |
| **Hydration** | `clasificadosServiciosPreviewHandoff` + `serviciosPublishedToApplicationDraft` + IndexedDB | application + preview | **LIVE** — but **lossy** on published→edit (§6.1) | REPAIR (§7 G-2) |
| **Unsaved-exit protection** | `app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts` | `ClasificadosServiciosApplication.tsx:615` | **LIVE-SHARED** | none |
| **Media durability** | `app/lib/media/listingMediaContract.ts`, `listingMediaConfigs.ts` (servicios lane: images min 0 / max 24, 8 external videos, `shared-https-strict`) | `publish/route.ts:275-295`; upload via `POST /api/clasificados/servicios/draft-media-upload` (Vercel Blob, MIME-gated, owner/anon-scoped) | **LIVE-SHARED (partial)** — `droppedUnpersistable` returned but never read | REPAIR (§7 G-3) |
| **ES / EN** | `resolveClasificadosPublishLangFromSearchParams`, `withClasificadosPublishLang`, `appendLangToPath`, `LEONIX_LANG_COOKIE` | checkpoint, application, preview, results, `[slug]` layout | **LIVE-SHARED** | none |
| **Newsletter** | `app/lib/newsletter/checkoutNewsletterCapture` → `POST /api/newsletter/checkout-capture` | preview checkout, `CHECKOUT_NEWSLETTER_SOURCES.servicios`; email is **visible + editable** before checkout; failure surfaces a note and never blocks payment | **LIVE-SHARED** | none |
| **Call / SMS / WhatsApp / Correo** | `serviciosCtaIntents.ts`, `serviciosDirectCta.ts`, `serviciosContactActions.ts`, `serviciosWhatsAppHref.ts`; Correo via `ServiciosLeadInquiryForm` → `POST /api/clasificados/servicios/inquiry` | profile shells + hub card | **LIVE** (category-local CTA engine) | WhatsApp international cap missing — ADOPT (§7 G-4) |
| **Google / Yelp** | `app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton` | `ServiciosBusinessHubContactCard.tsx:636`, fed by `mapServiciosProfileToBusinessHubContact` (`externalReviewLinks.google` / `.yelp`, `socialLinks.googleBusiness`) | **LIVE-SHARED** — link-only, no fabricated ratings | none (drawer deferred, master §D) |
| **Business Hub** | `app/components/contact/connectionHub/sharedConnectionHubContactModel.ts` | Servicios runs its **own** `ServiciosBusinessHubContactCard.tsx` + map panel + faux map + social brand, consuming only `SharedConnectionHubReviewButton` from the shared hub | **DUPLICATE-REFERENCED** (working, differentiated, owner-visible) | PRESERVE — master §C, do not consolidate during launch |
| **Community Trust** | `/api/leonix-endorsements`, `leonixEndorsementClient/Server` | hub card + `/dashboard/servicios` (read-only) | **LIVE-SHARED** | PRESERVE |
| **Save / Like / Share** | `LeonixShareButton`, `ServiciosLikeEngagementCluster`, `recordServiciosGlobalAnalytics` | both profile shells, result cards | **LIVE-SHARED** | none |
| **Coupons / flyer** | offers module gated by `listing_package_entitlements` (`SERVICIOS_OFFERS_ADDON_PACKAGE_KEY`), rendered by `ServiciosCouponsCard` / `ServiciosPromocionesCard`; server truth enforced in `publish/route.ts` (`enforceServiciosOffersEntitlementServerTruth`) | preview, `[slug]`, dashboard shortcut | **LIVE** | none |
| **Saved Search** | `app/lib/saved-search/*` — shared engine + `SavedSearchButton`, now with a **servicios** adapter alongside autos/bienes-raices/rentas | `resultados/page.tsx` (CTA), `savedSearchServiciosAdapter`, `serviciosSavedSearchResultsUrl`, `savedSearchServiciosMatcher`, `serviciosSavedSearchMatchOrchestrator`, `serviciosSavedSearchDeliveryResolver`, dashboard `CATEGORY_REGISTRY`, delivery `CATEGORY_RESOLVERS` | **LIVE-SHARED** | done (§11) |
| **Related Listings** | No shared engine exists (by design). Per-category readers only — `EnVentaRelatedRail`, `RelatedDealerCars`, `BrRelatedAgentPropertiesSection`, and now `serviciosRelatedListings` | `lib/serviciosRelatedListings.ts` + `components/ServiciosRelatedListingsSection.tsx`, rendered by `[slug]/page.tsx` on live public profiles only | **LIVE** (category reader, no new ranking engine) | done (§11) |
| **SEO** | `serviciosJsonLd.ts`, `PREVIEW_NOINDEX_METADATA`, `leonixDiscoveryContracts`, `app/sitemap.ts` | `[slug]/layout.tsx` (canonical + noindex states), `[slug]/page.tsx` (absolute-URL JSON-LD with real trade/city/service keywords), `app/sitemap.ts` (published detail URLs) | **LIVE** | done (§11) |
| **Analytics** | `listing_analytics` canonical + `selfEngagementGuard` | ops table + mirror + admin canonical reader (Servicios is the only category with a dedicated admin analytics reader) | **LIVE-SHARED** | none |
| **Dashboard / Admin** | `LeonixDashboardShell`, `OwnerEntityWorkspace`, `ownerEntityCapabilityRegistry`, admin workspace chrome | `/dashboard/servicios`, `/admin/workspace/clasificados/servicios` | **LIVE-SHARED** | none |
| **Revenue OS / Stripe / entitlement** | `revenueCategoryCheckout*`, `revenuePricingMatrix`, `revenueStripe`, `revenueWebhook`, `revenueFulfillment`, `revenueServiciosFulfillment`, `stripeEventLedger`, `revenueActiveEntitlementGuard` | preview checkout → webhook → activation | **LIVE-SHARED** | none |

---

## 4. DUPLICATE / DEAD / LEGACY PATHS

**Read this section before editing any Servicios file.** These paths look editable and change
nothing at runtime.

### 4.1 Live redirect shims — KEEP, do not treat as duplicates

| Path | Proof | Disposition |
|---|---|---|
| `app/(site)/servicios/publicar/page.tsx` | `redirect()` → `/clasificados/publicar/servicios` | KEEP |
| `app/(site)/servicios/perfil/[slug]/page.tsx` | live-row check then `redirect()` → `/clasificados/servicios/[slug]`; 404s otherwise | KEEP (correct SEO shim) |
| `app/admin/(dashboard)/clasificados/servicios/page.tsx` | `redirect()` → `/admin/workspace/...` | KEEP |
| `app/(site)/clasificados/servicios/results/page.tsx` | 3-line re-export of `../resultados/page` | KEEP |
| `app/(site)/clasificados/servicios/resultados/page.tsx` | its **route** is redirected away by `next.config.ts:115`, but the **module** is the live results implementation | KEEP — **do not move or rename**; `/results` depends on it |
| `app/(site)/publicar/servicios/page.tsx` | real mount of `ClasificadosServiciosApplication`; the checkpoint and the dashboard both target it deliberately | KEEP |

### 4.2 DEAD-ZERO-CONSUMER — legacy publish/preview island (`app/(site)/servicios/`)

One self-contained pre-Clasificados generation. Nothing outside the island imports any of it.

| Path | Consumer proof |
|---|---|
| `servicios/perfil/preview/page.tsx`, `layout.tsx`, `ServiciosPreviewClient.tsx` | zero inbound links; the file's own header calls itself legacy `?sample=` demo |
| `servicios/publicar/components/ServiciosApplicationForm.tsx` | zero importers |
| `servicios/publicar/hooks/useServiciosApplicationDraftState.ts` | zero importers |
| `servicios/publicar/lib/createEmptyServiciosApplicationDraft.ts` | zero importers |
| `servicios/publicar/lib/serviciosApplicationFieldValidation.ts` | zero importers |
| `servicios/publicar/lib/serviciosApplicationPublishReadiness.ts` | zero importers |
| `servicios/publicar/serviciosCategories.ts`, `serviciosPublicarCopy.ts` | zero importers |
| `servicios/data/demoServiciosBusinessProfile.ts` | zero importers |
| `servicios/data/serviciosApplicationDraftSamples.ts` | only the dead `ServiciosPreviewClient` |
| `servicios/lib/serviciosDraftStorage.ts` | only dead island files |
| `servicios/lib/serviciosDraftParse.ts` | only `serviciosDraftStorage.ts` (itself dead) |

> **This is the highest-risk edit trap in Servicios.** It contains a complete parallel application
> form, its own draft storage, and its own preview. Editing any of it produces zero runtime change.

### 4.3 DEAD-ZERO-CONSUMER — public profile components (`app/(site)/servicios/components/`)

Superseded by the professional/hub generation but never removed:

`ServiciosHero.tsx`, `ServiciosHeroActions.tsx`, `ServiciosGallery.tsx`, `ServiciosActionPanel.tsx`,
`ServiciosHighlightsSection.tsx`, `ServiciosHubReviewLinkButton.tsx`, `ServiciosLicense.tsx`,
`ServiciosMediaLightbox.tsx`, `ServiciosOpcionesFacilidadesCard.tsx`, `ServiciosPagosCard.tsx`,
`ServiciosProfessionalVisualProofRow.tsx`, `ServiciosPromoImageLightbox.tsx`,
`ServiciosReviewSubmitForm.tsx`, `ServiciosServiceAreas.tsx`.

Notes:
- `ServiciosHeroActions.tsx` carries its **own localStorage save fork** — a fork risk if revived.
- `ServiciosHubReviewLinkButton.tsx` was replaced in-place by `SharedConnectionHubReviewButton`
  (`ServiciosBusinessHubContactCard.tsx:630` documents the swap).
- `ServiciosHero.tsx` is dead, but `serviciosHeroHoursStatus.ts` (which it imports) **is live**,
  consumed by `serviciosResultsFilter.ts` for the `open_now` filter. Do not delete the helper.

### 4.4 DEAD-ZERO-CONSUMER — landing sub-island (`app/(site)/clasificados/servicios/landing/`)

The live landing (`ServiciosLandingPage.tsx`) consumes only `ServiciosLandingSearchPanel`,
`serviciosLandingSampleData` (static category taxonomy, **not** fake listings),
`serviciosChildCategoryImages`, `serviciosCategoryIcons`, and `serviciosBrowseParams`.

Dead: `FeaturedBusinessCard.tsx`, `FeaturedBusinessSection.tsx`, `RecentServiceCard.tsx`,
`RecentServicesSection.tsx`, `PublishServiceCTA.tsx`, `ServiceCategoriesGrid.tsx`,
`ServiciosCompactSearchCanvas.tsx`, `ServiciosHeroSearch.tsx`, `ServiciosLandingBrowseRow.tsx`,
`ServiciosLandingQuickFilterLinks.tsx`, `ServiciosQuickChips.tsx`, `TrustValueStrip.tsx`.

`FeaturedBusinessSection` / `RecentServicesSection` are the two components that would have rendered
real `servicios_public_listings` rows on the landing — both are unwired (see §5.5).

### 4.5 DEAD-ZERO-CONSUMER — stray modules

| Path | Note |
|---|---|
| `clasificados/servicios/resultados/page_temp.tsx` | stale scratch copy sitting **inside the App Router directory**; Next.js ignores it (not `page.tsx`), but it is a live editing trap |
| `clasificados/servicios/ServiciosListingResultCard.tsx` | superseded by `ServiciosProfessionalResultCard` / `ServiciosHorizontalResultCard` |
| `clasificados/servicios/analytics/serviciosAnalytics.ts` | superseded by `recordServiciosGlobalAnalytics.ts` + `serviciosCtaIntents.ts` |
| `clasificados/servicios/shell/ServiciosPreviewCard.tsx` | zero importers |
| `clasificados/servicios/shared/fields/serviciosTaxonomy.ts` | zero importers |
| `clasificados/servicios/shared/mapping/serviciosTier.ts` | zero importers |
| `clasificados/servicios/components/ServiciosDestacadoCard.tsx`, `ServiciosDestacadosSection.tsx` | zero importers (`lib/serviciosDestacados.ts` remains live) |
| `clasificados/servicios/lib/serviciosDiscoveryContract.ts` | zero importers |
| `clasificados/servicios/lib/serviciosLandingPublicMappers.ts` | zero importers |
| `clasificados/servicios/lib/serviciosResultsRanking.ts` | doc-only module; its own header points at the real implementations |
| `clasificados/publicar/servicios/components/ServiciosPublishModal.tsx` | zero importers |
| `clasificados/publicar/servicios/lib/serviciosCustomAmenityOptions.ts` | zero importers |
| `clasificados/publicar/servicios/lib/serviciosPromoPdfUi.ts` | zero importers — **not** part of the live coupon/flyer path |

### 4.6 DUPLICATE-REFERENCED / stale registry entries

| Path | Finding |
|---|---|
| `clasificados/components/categoryStandard/categoryStandardRoutes.ts:103` → `servicios: "/publicar/servicios"` | **Not a live checkpoint bypass.** `categoryPublishPath` is read only by `CategoryStandardLandingPage.tsx`, which has **zero importers**; Servicios uses its own landing, whose CTA correctly targets `/clasificados/publicar/servicios/checkpoint` (`ServiciosLandingPage.tsx:37`, `ServiciosResultsPageShell.tsx:17`). Classification: **HISTORICAL registry value, zero servicios consumers.** |
| `app/admin/_lib/classifiedsOpsContract.ts:89` → `/servicios/perfil/${slug}` | admin deep-link uses the legacy URL; harmless (308s to canonical), cosmetically stale |
| `api/clasificados/servicios/dev-listings/route.ts`, `smoke-row/route.ts` | dev-only, gated by `SERVICIOS_DEV_PUBLISH=1`; `dev-listings` returns an empty list when off, `smoke-row` 404s. Gate verified — keep, re-verify env before launch |

**Nothing above may be deleted in this pass.** Consumer counts are proven; retirement is a separate,
explicitly approved step (master §15).

---

## 5. POST-PREVIEW LAUNCH GAPS

### 5.1 Republish identity is slug-keyed, not id-keyed — **P1 — CLOSED (SERVICIOS-1)**
**Was:** `publish/route.ts` resolved the target row from `b.existingPublicSlug` (sessionStorage),
then `.update().eq("slug", slug)`; otherwise `allocateSlug()` + `.insert()`. A publish from a
session where the slug was not primed **and** with a changed business name minted a new slug and
**inserted a duplicate row**, orphaning the paid one.

**Now:** the `servicios_public_listings` row UUID is the persistence authority end to end.
- `buildServiciosPublishPayload.ts` — `ServiciosPublishTransportBody.existingListingId`
- `serviciosPublishClient.ts` — `SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY`,
  `primeServiciosExistingListingId()`, threaded into `postServiciosPublishApi`, re-primed from
  every successful publish response
- `serviciosPublicListingsServer.ts` — new `getServiciosPublicListingByIdFromDb()`
- `publish/route.ts` — `canonicalListingId` resolves the row by id, verifies ownership (403
  `listing_owner_mismatch` on a foreign row), **adopts that row's own slug** so the public URL is
  also stable across a rename, and drives the prior-row read, the strict payment guard, the
  existence read, and the `.update().eq("id", canonicalListingId)` predicate
- primed at both hydration sites: `ClasificadosServiciosApplication.tsx:513` and
  `ClasificadosServiciosPreviewClient.tsx:258`; cleared wherever the slug is cleared

The slug remains public routing/display identity only. `existingPublicSlug` survives solely as the
fallback for a session that never obtained a canonical id. The webhook activation path
(`activatePaidServiciosListingFromRevenueOs`) was already id-keyed and is unchanged.

### 5.2 No scheduler cranks renewal / expiration / suspension — **P1 (platform-wide)**
The Servicios lane **is** registered in `subscriptionLifecyclePolicy.ts:146`, and webhook deliveries
plus write-time guards do reconcile subscriptions. But `/api/revenue-os/admin/subscription-sweep`
— the documented operational backstop for grace-expired suspension — has **no caller**: there is no
`vercel.json`, no cron route, and no `pg_cron` anywhere in the repo. The route's own header says so.
A lapsed Servicios subscription is only caught if Stripe happens to deliver an event.

### 5.3 Saved Search not offered on Servicios results — **P2 — CLOSED (SERVICIOS-2)**
**Was:** engine, CRUD, fingerprinting, email delivery and `SavedSearchButton` all existed with
adapters for autos, bienes-raices and rentas; zero servicios references.

**Now:** Servicios plugs into the same shared engine. No Servicios-specific saved-search engine was
created — the new files are category translation only (the verifier asserts the adapter contains no
hashing, no `saved_searches` query and no Supabase client).

| Piece | File |
|---|---|
| Filter ↔ normalized translation | `app/lib/saved-search/servicios/savedSearchServiciosAdapter.ts` |
| Results-URL rebuild | `.../serviciosSavedSearchResultsUrl.ts` |
| Eligibility (branded type) | `.../serviciosPublicEligibleListing.ts` |
| Matcher | `.../savedSearchServiciosMatcher.ts` |
| Match orchestrator | `.../serviciosSavedSearchMatchOrchestrator.ts` |
| Delivery resolver | `.../serviciosSavedSearchDeliveryResolver.ts` |
| Results CTA | `resultados/page.tsx` → shared `SavedSearchButton` |
| Owner dashboard | `dashboard/busquedas-guardadas/page.tsx` `CATEGORY_REGISTRY` |
| Email delivery | `delivery/savedSearchEmailDelivery.ts` `CATEGORY_RESOLVERS` |
| DB | `supabase/migrations/20260910120000_saved_search_match_events_servicios.sql` |

Filter truth is exact: the CTA passes the results page's **own** `filterQuery`, and the matcher runs
the **same three functions in the same order** the results page runs
(`filterServiciosPublicListingRows` → `filterServiciosRowsByKeyword` → `filterServiciosRowsBySeller`).
`sort`/`page`/`perPage` are deliberately excluded from the fingerprint (presentation, not
inclusion), and `seller=all` is treated as no filter. `minPrice`/`maxPrice` are truthfully `null` —
Servicios has no price filter at all.

**Two boundaries found and handled honestly:**
1. `saved_search_match_events.category` / `saved_search_processing_failures.category` carried a
   `CHECK (category IN ('autos','bienes-raices','rentas'))`. Widened by the migration above,
   following `20260819150000`'s own documented pattern. `seller_lane` likewise widened to accept
   Servicios' real vocabulary (`business`/`independent`, the return type of
   `inferServiciosSellerPresentation`) rather than forcing a false uniformity.
2. The shared `SavedSearchDeliveryCategoryResolver.buildDetailUrl` was **synchronous**, but the
   Servicios canonical URL is slug-addressed and must be read from the row. Return type widened to
   `string | Promise<string>` and the single call site now awaits it — Autos/BR/Rentas still return
   a plain string and are untouched.

### 5.3b Saved Search match delivery trigger — **wired**
`revenueFulfillment.tryActivateServiciosListingAfterEntitlement` fires
`triggerServiciosSavedSearchMatchBestEffort` after a real `pending_payment → published` activation
(guarded on `outcome === "activated"`, so a re-delivered webhook cannot re-fire). Same
never-throws, strictly-after-commit contract as the Autos/BR/Rentas call sites.

### 5.4 Related Listings absent on the public vitrina — **P2 — CLOSED (SERVICIOS-2)**
**Was:** no related reader for Servicios. There is no shared related-listings engine on the platform
(confirmed again this gate: `EnVentaRelatedRail` on HEAD is still the decorative zero-fetch stub —
the real fetch version exists only on the sealed branch), so every category ships its own reader.

**Now:** `lib/serviciosRelatedListings.ts` + `components/ServiciosRelatedListingsSection.tsx`,
rendered by `[slug]/page.tsx` **only when `isPublishedLive`** (a paused/pending vitrina must not
advertise competitors, and its own page is noindex).

- Candidates come from `listServiciosPublicListingsRaw` — the **same canonical published reader the
  results page uses**, already published-only and already in discovery order. No bespoke query.
- Relationships are the category's real facets: `internal_group` (the same trade family the results
  `group=` filter matches and the landing's "Explora por giro" cards link into) and location,
  normalized with the **same helpers the results filter uses** (`normalizeServiciosSearchText` for
  city, `normalizeLeonixLbStateCode` for state).
- Scoring is a 4-tier explicit rule, not a tuned model: same trade + same city (4) > same trade +
  same state (3) > same trade (2) > same city (1) > **excluded (0)**. A shared state *alone* is
  deliberately not a relationship.
- **No fabrication:** nothing relevant → empty list → the section renders a real browse link into
  `/resultados` instead of filler rows. The verifier asserts no `Math.random`/placeholder/sample.
- **Not an ad slot:** the reader deliberately does not consult
  `resolveCanonicalVisibilityBucketWeights` — relatedness is editorial.
- Rendering reuses the existing `ServiciosHorizontalResultCard` (`density="compact"`). No card
  redesign, per this gate's scope.

`ownerEntityCapabilityRegistry` still declares `relatedListings: "unsupported"` for the **owner
dashboard** entity workspace — that is a different surface (owner tooling, not the public vitrina)
and remains accurate.

### 5.5 The Servicios landing declared a data contract it did not have — **P2 — CLOSED (SERVICIOS-2)**
**Was:** `clasificados/servicios/page.tsx` declared `export const dynamic = "force-dynamic"` under
the comment *"Marketplace landing must always reflect current `servicios_public_listings`"*, while
`ServiciosLandingPage.tsx` is a `"use client"` component that performs **no DB read**. The route was
paying a per-request dynamic render to display nothing dynamic.

**Traced intent first, as instructed.** Every section of the live landing is navigation or
marketing — search panel, "Explora por giro" trade cards, trust shortcuts, publisher/visibility
copy — and every one routes into `/clasificados/servicios/results`, where the real
`servicios_public_listings` pipeline (filter → entitlement overlay → visibility ranking) actually
runs. The two components that would have rendered live rows (`FeaturedBusinessSection`,
`RecentServicesSection`) are zero-consumer (§4.4). **Its product role is legitimately static
category navigation**, and live data is one deliberate navigation step away.

**Smallest truthful repair applied:** the false `force-dynamic` + data claim was removed and
replaced with an explicit contract note; **no query was added**, because the page has no surface to
render one. The `<Suspense>` boundary stays (it is what lets the client `useSearchParams()` read
language/search state under a static shell). The note records that reinstating a live Featured/
Recent rail is what would reintroduce the data dependency — and must reinstate a dynamic contract
with it.

### 5.6 Sitemap omitted per-listing detail URLs — **P2 — CLOSED for Servicios (SERVICIOS-2)**
**Was:** `app/sitemap.ts` emitted category hubs and marketing paths only, its header deferring
per-listing URLs until "a dedicated DB-backed sitemap generator" existed.

**Now:** that generator is what a category's own safety-gated reader already is — **Recursos had
already proved the platform mechanism** (a DB-backed section composed in `app/sitemap.ts` itself,
not in the pure contract). `serviciosSitemapEntries()` applies the same pattern to published
Servicios vitrinas:
- sourced from `listServiciosPublicListingsRaw` — published-only, so paused / pending-review /
  pending-payment / rejected / suspended rows can never be advertised;
- emits the canonical `/clasificados/servicios/[slug]`, never the robots-disallowed legacy
  `/servicios/perfil/[slug]` shim (verifier asserts this against comment-stripped code);
- `lastModified` from the row's real `updated_at`/`published_at`;
- wrapped in try/catch — one unavailable DB section can never fail the whole sitemap route;
- capped at the reader's real 800-row ceiling, stated honestly rather than implying more.

`leonixSitemapOmitsPerListingDetailUrls()` is **unchanged and still returns `true`** — the LEO
discovery sensor asserts it. Its docstring now records the scope precisely: it is a fact about the
pure `buildLeonixSitemap` contract, which still emits hubs/marketing only; DB-backed sections are
composed on top in the route module.

### 5.7 Dashboard lifecycle surface is pause/resume only — **P3, honest**
`ownerEntityCapabilityRegistry` declares `republish`, `renew`, `archive` as `unsupported` for
servicios. This is accurate to the code (`/manage` implements pause/resume only). Republish happens
through the edit→publish loop, not a dashboard button. Not a defect; recorded so it is not
mistaken for one during owner QA.

---

## 6. PRE-PREVIEW LAUNCH-CRITICAL GAPS

Application and Preview UX are **PROTECTED** (master §4). Everything below is a wiring or
data-integrity defect, not a redesign.

### 6.1 Published→edit hydration silently destroyed three owner-authored sections — **P0 — CLOSED (SERVICIOS-1)**
**Was:** the forward mapper writes reasons as `profile.trust[]` id `trust_${id}` (`:184`), the
custom reason as id `custom_reason` (`:193`), quick facts as `profile.quickFacts[]` (`:142-167`),
and highlights as `bh_preset_${id}` / `bh_custom_${n}` (`:209`, `:218`). The reverse mapper restored
**none** of the first three, and `mapSelectedBusinessHighlightIds` folded `profile.trust` into the
*businessHighlights* id list while returning the raw persisted `bh_preset_*` string (which no longer
resolves against `getBusinessHighlightPreset`). Opening a published listing, changing one word and
republishing wiped reasons-to-choose, the custom reason and every quick fact from the live vitrina.

**Now** — `serviciosPublishedToApplicationDraft.ts`, each function the exact reverse of the forward
mapper's own prefix, in the same style as the pre-existing `svc_` service reverse mapper:
- `mapSelectedReasonIds()` — `trust_${id}` to preset id, validated against the business type's
  `reasonsToChoose`
- `mapCustomReason()` — the `custom_reason` entry to `customReasonLabel` + `customReasonIncluded`
- `mapCustomQuickFacts()` — every persisted quick fact to `customQuickFacts` (exact owner wording
  preserved; no stable preset-chip id survives persistence, so a fact that began as a preset chip
  re-opens as its equivalent custom-text entry — zero data loss, documented tradeoff)
- `mapSelectedBusinessHighlightIds()` — now `bh_preset_${id}` to preset id only, no `trust` fold
- `mapCustomBusinessHighlights()` — only `bh_custom_*` entries become custom chips, so a preset
  highlight is no longer duplicated as both a preset and a custom entry

Semantics forward-ported from `80d4dbcb`; the `bh_preset_` reverse-match and the
`mapCustomBusinessHighlights` split are additional corrections found against current HEAD.

### 6.2 Address / location normalization + privacy never adopted — **P1 — CLOSED (SERVICIOS-1)**
**Was:** `app/lib/businessAddress/*` had zero consumers repo-wide; `resolveServiciosProfile` always
rendered the full street address and always emitted a directions link; `showExactAddress` did not
exist in any Servicios tree; the provider half of the engine did not exist on HEAD at all.

**Now** — no category-local address engine was created; the shared contract is the single gate:
- forward-ported from `88d844e1`: `app/lib/businessAddress/providers/googleAddressProvider.ts`,
  `providers/googleAddressProviderConfig.ts`, `app/api/business-address/suggest/route.ts`,
  `app/components/forms/BusinessAddressVerifiedInput.tsx` (fails closed with zero network calls when
  `GOOGLE_MAPS_API_KEY` is absent; manual entry is always valid and never blocks saving)
- picker mounted in the Servicios physical-address section
  (`ClasificadosServiciosApplication.tsx`), replacing the plain street input; a picked suggestion
  also auto-fills city/region/postal/country
- `showExactAddress` owner checkbox added beneath the address fields (semantics from `68d45c6c`)
- full additive round-trip for `showExactAddress`, `physicalVerificationStatus`,
  `physicalProvider`, `physicalProviderPlaceId`: state type → default → normalize → forward mapper
  → draft type → wire mapper → wire type → **public resolver** → reverse mapper → UI. No migration:
  every field is optional JSON, absent on any pre-existing listing.
- **public gate**: `resolveServiciosProfile.ts` delegates the reveal/hide DECISION to
  `resolveBusinessAddressPublicView` (`app/lib/businessAddress/businessAddressPrivacy.ts`).
  `physicalAddressDisplay` is populated only when `showExactAddress` resolves true, and
  `mapsSearchHref` only when `directionsAllowed` — so directions can never point at a hidden
  destination. Servicios' own formatters still build the string/query (they include suite + zip +
  country the generic builder omits): shared gate, no fidelity loss.
- `showExactAddress` absent on the wire defaults to **`true`**, so no already-public address is
  retroactively hidden.
- Every public read (`ServiciosProfileView`, `ServiciosProfessionalProfileShell`,
  `ServiciosBusinessHubContactCard`, `ServiciosProfessionalHero`, both result cards, `[slug]`
  JSON-LD) goes through the resolved profile — **16 reads via `profile.contact`, 0 raw-wire address
  reads in public components.** Results-side reads of `physicalStreet` are existence predicates only
  (`serviciosResultsFilter` "has physical location", `serviciosSellerKind`), never a rendered line.

### 6.3 Media: unpersistable drops computed and thrown away — **P1 — CLOSED (SERVICIOS-1)**
**Now:** `warnDroppedUnpersistableMedia()` added to the shared `listingMediaContract.ts`
(forward-ported from `bd2ee01e`) and called at the Servicios publish boundary; the dropped list is
additionally returned to the client as `droppedUnpersistableMedia` and carried to the success screen
on the **existing** notice channel (`?mediaDropped=N`, alongside the pre-existing `?videoSkipped=1`),
rendered by `ServiciosJustPublishedSuccessBanner`'s new `mediaDroppedNotice` slot and by the
pending-review branch of `[slug]/page.tsx`. The owner is now told, in ES/EN, how many files did not
save and to re-add them — no new media engine.

`minImages: 0` is **not** a defect and was not changed: it is the registered lane truth in
`listingMediaConfigs.ts:177` for the servicios pipeline. Changing it is an owner product decision.

### 6.4 Public "open now" frozen at publish time — **P1 — CLOSED (SERVICIOS-1)**
`ServiciosHours.tsx` now computes the pill with `buildServiciosHeroHoursPill(hours, lang)` at render
time — the same shared evaluator `serviciosResultsFilter.ts` already uses via
`serviciosHoursSummaryIsOpenNow` for the `open_now` filter, so the public profile and search now
agree. The publish-time-frozen `openNowLabel` string and its `"cerrado"` substring colour heuristic
remain only as the fallback for hours text that cannot be parsed into a time range.

### 6.5 WhatsApp digits: no E.164 upper bound — **P1 — CLOSED (SERVICIOS-1)**
`app/lib/whatsapp/internationalWhatsApp.ts` forward-ported (it was originally extracted *from*
Servicios). `normalizeServiciosWhatsAppDigits` and `stripServiciosWhatsAppDigits`
(`serviciosWhatsAppHref.ts`) plus `formatWhatsAppInputDisplay` and `isValidWhatsAppNumber`
(`serviciosPhoneUi.ts`) now delegate to it, picking up the 15-digit E.164 ceiling
(`normalizeInternationalWhatsAppDigits` returns `null` above 15). The WhatsApp field never had US
grouping and still does not; **the primary phone field's deliberate US `(XXX) XXX-XXXX` contract is
untouched** — `9ae1a0f2`'s `formatUsStylePhoneInputSafe` exists for *other* categories that opted a
primary-phone field into US grouping, which Servicios does not do, so it was not imported as dead
code here.

### 6.6 `additionalWebsites` — **CORRECTED: N/A on current source**
The earlier finding was wrong. `additionalWebsites` does not exist anywhere in Servicios on HEAD —
not in `ServiciosContactBlock`, not in the draft type, not in application state, not collected by
the form. It exists only for Restaurantes and Comida Local (and as a Globalization-branch addition).
**Servicios' equivalent feature is `extraLinks`, and it is already fully live:** collected
(`ClasificadosServiciosApplication.tsx:1780`), persisted
(`mapClasificadosServiciosApplicationToServiciosDraft.ts:344-356`, capped at 2), restored on
published→edit (`serviciosPublishedToApplicationDraft.ts:497-500`) and surfaced publicly in the
Business Hub `moreLinks` list (`mapServiciosProfileToBusinessHubContact.ts:96`). Nothing to repair;
no Business Hub redesign attempted.

### 6.7 ES / EN — **NO GAP.** Verified live end-to-end (checkpoint → application → preview → results
→ `[slug]` metadata via `LEONIX_LANG_COOKIE`). One documented, accepted limitation: a first-ever
visit to a bare `?lang=en` detail URL with no cookie renders ES tab/OG metadata (the page body still
respects `?lang=`) — Next.js does not pass `searchParams` to a layout's `generateMetadata`.

### 6.8 Draft hydration & unsaved-exit — **NO GAP.** sessionStorage + IndexedDB survive hard refresh;
`useBusinessApplicationLeaveGuard` is mounted and correctly suppressed for in-flow preview
round-trips.

### 6.9 Newsletter — **NO GAP.** Awaited (never fire-and-forget), never gates checkout, uses the
visible/editable email, and surfaces a note on failure.

---

## 7. EXISTING GLOBALIZATION FIXES AVAILABLE

Read-only source: `fix/globalization-final-closeout-2026-09` @ `e3956df8`.
**Do not merge the branch.** Forward-port the named semantics only.

**Gate SERVICIOS-1 status:** G-1, G-2, G-3, G-4 **forward-ported and applied against current
source** (never copied blindly — see §10 for the deltas). G-5 **retracted** (§6.6: the field does not
exist for Servicios on HEAD; `extraLinks` is the live equivalent and is already wired). G-6 confirmed
**already on HEAD, no Servicios delta**. G-7 remains a reference shape for a later gate.

| # | Gap | Commit | Files | Nature |
|---|---|---|---|---|
| **G-1** | §6.2 address verifier + privacy | `88d844e1` (provider + input + `/api/business-address/suggest`), `3c23e875` (5-category adoption), `68d45c6c` (**Servicios-specific** privacy adoption) | `app/components/forms/BusinessAddressVerifiedInput.tsx`, `app/lib/businessAddress/providers/googleAddressProvider*.ts`, `app/api/business-address/suggest/route.ts`; Servicios: application + types + normalize + defaults + both mappers + `resolveServiciosProfile` | New shared files + additive Servicios fields (`showExactAddress`, `physicalVerificationStatus`, `physicalProvider`, `physicalProviderPlaceId`). `showExactAddress` defaults `true` so no already-public address is retroactively hidden. |
| **G-2** | §6.1 published→edit data loss (**P0**) | `80d4dbcb` | `serviciosPublishedToApplicationDraft.ts` (+`mapSelectedReasonIds`, `mapCustomReason`, `mapCustomQuickFacts`; `mapSelectedBusinessHighlightIds` stops folding `trust` in), `clasificadosServiciosApplicationNormalize.ts`, `...ApplicationTypes.ts`, `defaultClasificadosServiciosState.ts`, `serviciosApplicationDraft.ts`, `serviciosBusinessProfile.ts` | Pure reverse-mapper repair. **Highest-value item in this table.** |
| **G-3** | §6.3 dropped-media signal | `bd2ee01e` | `app/lib/media/listingMediaContract.ts` (adds `warnDroppedUnpersistableMedia`), `servicios/publish/route.ts` (2-line adoption) | Server/console-level only. A user-facing message is explicitly **not** included and remains new work. |
| **G-4** | §6.4 frozen open-now, §6.5 WhatsApp/phone | `80d4dbcb` (`ServiciosHours.tsx` → `buildServiciosHeroHoursPill`; `serviciosWhatsAppHref.ts` → shared `internationalWhatsApp`), `9ae1a0f2` (`serviciosPhoneUi.formatUsStylePhoneInputSafe`) | as listed | `internationalWhatsApp.ts` must be forward-ported with it — absent on HEAD. Servicios' own US-only primary-phone contract is deliberately left unchanged by `formatUsStylePhoneInputSafe`. |
| **G-5** | §6.6 additional websites | `68d45c6c` / `80d4dbcb` (`resolveServiciosProfile` `additionalWebsites` block, capped at 8) | `resolveServiciosProfile.ts`, `serviciosBusinessProfile.ts`, reverse mapper | Additive render-layer only. |
| **G-6** | Self-engagement (own listing save/like/report) | `3eacdec9` | `app/lib/analytics/selfEngagementGuard.ts` + per-category call sites | `selfEngagementGuard.ts` **is** on HEAD. The commit's remaining deltas are en-venta / rentas / admin — **no Servicios delta**. Recorded so it is not re-opened as Servicios work. |
| **G-7** | Related listings reference shape | `88d844e1` (`EnVentaRelatedRail.tsx`, +125 L) | en-venta only | Reference shape for §5.4 — not a Servicios fix. |

Also present on the sealed branch and **not** Servicios: `733408dd` / `67919479` (Bienes & Rentas
Negocio dashboard-edit repair) — the same *class* of defect as G-2, useful as corroboration.

---

## 8. READY-TO-WIRE ACTIONS

### ADOPT EXISTING

| # | Action | Target | Source of truth | Status |
|---|---|---|---|---|
| **A1** | Forward-port the reverse-mapper repair so reasons / custom reason / quick facts survive republish | `serviciosPublishedToApplicationDraft.ts` + 5 type/normalize files | §7 **G-2** (`80d4dbcb`) | **DONE — SERVICIOS-1** |
| **A2** | Forward-port the real open-now pill + `internationalWhatsApp` delegation | `ServiciosHours.tsx`, `serviciosWhatsAppHref.ts`, `serviciosPhoneUi.ts`, new `app/lib/whatsapp/internationalWhatsApp.ts` | §7 **G-4** | **DONE — SERVICIOS-1** (`formatUsStylePhoneInputSafe` deliberately not imported: no Servicios consumer) |
| **A3** | Adopt the address verifier + `showExactAddress` privacy contract | shared provider/input/API + Servicios application, mappers, `resolveServiciosProfile` | §7 **G-1** | **DONE — SERVICIOS-1** |
| **A4** | ~~Surface `additionalWebsites`~~ | — | §7 **G-5** | **RETRACTED** — see §6.6; `extraLinks` is Servicios' live equivalent and already wired |
| **A5** | Add a Servicios Saved Search adapter + one `CATEGORY_RESOLVERS` entry + `SavedSearchButton` on results | `app/lib/saved-search/servicios/`, `ServiciosResultsPageShell` | `app/lib/saved-search/autos/` (proven 6-file adapter set) | OPEN — out of Gate 1 scope |

### REPAIR EXISTING

| # | Action | Target | Status |
|---|---|---|---|
| **R1** | Accept and prefer a durable `listingId` in the publish API; fall back to `existingPublicSlug` only when absent — eliminates the duplicate-row/republish window | `serviciosPublishClient.postServiciosPublishApi`, `publish/route.ts`, `getServiciosPublicListingByIdFromDb` | **DONE — SERVICIOS-1** (see §5.1) |
| **R2** | Read `droppedUnpersistable` at the publish boundary and warn | `publish/route.ts` + `listingMediaContract.ts` (§7 G-3) | **DONE — SERVICIOS-1** (server log **plus** owner-visible notice, see §6.3) |
| **R3** | Resolve the landing's stale contract: either wire `FeaturedBusinessSection`/`RecentServicesSection` to `servicios_public_listings`, or drop `force-dynamic` and the stale comment | `clasificados/servicios/page.tsx`, `landing/` | OPEN — P2, out of Gate 1 scope |
| **R4** | Point the admin deep-link at the canonical vitrina URL instead of the legacy shim | `app/admin/_lib/classifiedsOpsContract.ts:89` | OPEN — P3 |
| **R5** | Delete the scratch file inside the App Router directory | `clasificados/servicios/resultados/page_temp.tsx` | OPEN — P3, requires deletion approval |

### NEW CODE REQUIRED

| # | Item | Why nothing exists to adopt |
|---|---|---|
| **N1** | A scheduler that cranks `/api/revenue-os/admin/subscription-sweep` | No `vercel.json`, cron route or `pg_cron` exists anywhere in the repo. The endpoint is built, secured and idempotent; only the trigger is missing. **Platform decision, not a Servicios decision.** |
| **N2** | A Servicios related-listings reader | No business-profile-shaped related engine exists. BR/Autos readers are inventory-shaped (parent→children). `EnVentaRelatedRail` is the closest reference shape. Master §8 says prefer existing category/filter relationships over a new recommendation engine — so this should be a filter-derived reader (same trade/internal group + city), not a ranking system. |
| **N3** | ~~User-facing copy for the dropped-media warning~~ | **DONE — SERVICIOS-1.** The sealed branch's G-3 fix is server-log-level only; this gate added the ES/EN owner-facing notice on the existing success-banner channel (§6.3). |

> **NEW ENGINE REQUIRED FOR SERVICIOS: NO.** Every category-level gap resolves by adopting a sealed
> Globalization fix, wiring an existing shared engine, or repairing an existing boundary. N1 is a
> platform trigger, N2 is a thin category reader, N3 is copy.

---

## 9. PROTECTED / NO-TOUCH

Working application and Preview code. Do not refactor, relocate, restyle or "clean up". The
approved actions in §8 touch only mappers, the publish API boundary, `resolveServiciosProfile`,
`ServiciosHours.tsx`, and additive shared modules.

**Application**
- `clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx` (3,962 L)
- `clasificados/publicar/servicios/components/ServiciosPublishSortableGallery.tsx`
- `clasificados/publicar/servicios/components/ServiciosJustPublishedSuccessBanner.tsx`
- `clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx`

**Draft / media / preset / readiness surface** (`clasificados/publicar/servicios/lib/`)
- `clasificadosServiciosStorage.ts`, `clasificadosServiciosDraftMediaIdb.ts`,
  `clasificadosServiciosDraftMedia.ts`, `clasificadosServiciosPreviewHandoff.ts`
- `serviciosPreviewReadiness.ts`, `serviciosPublishReadiness.ts`, `serviciosDraftPublishPrepare.ts`
- `presetStateMerge.ts`, `businessTypePresets.ts`, `businessHighlightPresets.ts`
- `serviciosMediaTransport.ts`, `serviciosMuxVideoClient.ts`, `compressServiciosImage.ts`

**Preview**
- `clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx`
- `clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx`

**Public profile shells** (edit only the two files §8 names)
- `servicios/components/ServiciosProfessionalProfileShell.tsx`,
  `ServiciosProfileView.tsx`, `ServiciosBusinessHubContactCard.tsx`,
  `ServiciosPublicTranslationLayer.tsx`

**Shared, multi-category — never fork**
- `app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts`
- `app/lib/listingPlans/*` (Revenue OS, Stripe, webhook, entitlement, subscription lifecycle)
- `app/lib/media/listingMediaContract.ts` (additive only, per §7 G-3)
- `app/components/translation/TranslateAdControl`, `/api/translate-ad`
- `app/components/contact/connectionHub/*`
- `app/lib/saved-search/*` (extend by adapter; never rebuild)

**Do not edit anything listed in §4.2–§4.5.** It is dead. Editing it looks correct and changes
nothing at runtime.

---

## 10. GATE SERVICIOS-1 — IMPLEMENTATION EVIDENCE

Branch `completion/launch-lifecycle-2026-09-09`, one coherent commit. Not pushed to `main`. No
historical branch merged. No dead/duplicate path from §4 touched or deleted.

### Files changed (21 modified, 6 new)

**New — shared engines forward-ported from the sealed branch (no category-local engine created)**

| File | Source | Purpose |
|---|---|---|
| `app/lib/businessAddress/providers/googleAddressProvider.ts` | `88d844e1` | Real Google-Geocoding `BusinessAddressProvider`; fails closed with zero network calls when `GOOGLE_MAPS_API_KEY` is absent; never returns `verified` |
| `app/lib/businessAddress/providers/googleAddressProviderConfig.ts` | `88d844e1` | Readiness only; never reads or logs the key's value |
| `app/api/business-address/suggest/route.ts` | `88d844e1` | Server-only lookup; keeps the key out of the browser bundle; `ok:false` is a normal, non-blocking outcome |
| `app/components/forms/BusinessAddressVerifiedInput.tsx` | `88d844e1` | Shared picker; manual entry always valid; a pick sets `user_confirmed`, never `verified` |
| `app/lib/whatsapp/internationalWhatsApp.ts` | `e3956df8` | Canonical WhatsApp handling (originally extracted *from* Servicios); 15-digit E.164 ceiling |
| `scripts/verify-servicios-gate1-lifecycle.ts` | new (this gate) | The gate's own verifier — 20 checks, pure/unit + source-level, no network/DB/dev-server |

**Modified**

| File | Gate item |
|---|---|
| `.../publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts` | 6.1 P0 + 6.2 round-trip |
| `.../publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts` | 6.2 forward mapper |
| `.../publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts` · `...Normalize.ts` · `defaultClasificadosServiciosState.ts` | 6.2 state contract |
| `.../publicar/servicios/components/ClasificadosServiciosApplication.tsx` | 6.2 picker + privacy checkbox; 5.1 id priming |
| `.../publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx` | 5.1 id priming; 6.3 notice hand-off |
| `.../publicar/servicios/lib/serviciosPublishClient.ts` · `buildServiciosPublishPayload.ts` | 5.1 canonical id transport; 6.3 response field |
| `.../publicar/servicios/lib/serviciosPhoneUi.ts` | 6.5 |
| `.../publicar/servicios/components/ServiciosJustPublishedSuccessBanner.tsx` | 6.3 `mediaDroppedNotice` slot |
| `.../clasificados/servicios/lib/serviciosPublicListingsServer.ts` | 5.1 `getServiciosPublicListingByIdFromDb` |
| `.../clasificados/servicios/[slug]/page.tsx` | 6.3 owner-facing notice |
| `.../servicios/lib/resolveServiciosProfile.ts` | 6.2 public privacy gate |
| `.../servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts` | 6.2 wire mapper |
| `.../servicios/lib/serviciosWhatsAppHref.ts` | 6.5 |
| `.../servicios/components/ServiciosHours.tsx` | 6.4 |
| `.../servicios/types/serviciosBusinessProfile.ts` · `serviciosApplicationDraft.ts` | 6.2 wire/draft contract |
| `app/api/clasificados/servicios/publish/route.ts` | 5.1 canonical id; 6.3 dropped-media |
| `app/lib/media/listingMediaContract.ts` | 6.3 `warnDroppedUnpersistableMedia` (additive) |

### Source-level proofs

| Claim | Evidence |
|---|---|
| Published edit uses the canonical listing id | `publish/route.ts` — `canonicalListingId` drives the prior-row read (`:389`), the strict payment guard (`:439`), the existence read (`:491`) and the update predicate `.eq("id", canonicalListingId)` (`:523`); primed at `ClasificadosServiciosApplication.tsx:513` and `ClasificadosServiciosPreviewClient.tsx:258` |
| A rename cannot create a duplicate | when the id resolves, the route adopts **that row's own slug** as the target, so `allocateSlug()` output is discarded and the `.insert()` branch is unreachable for an existing row |
| Active edit cannot invoke base Servicios checkout | `revenueActiveEntitlementGuard.ts:68` lists `servicios_base_monthly`; `/api/revenue-os/checkout/route.ts:482-499` returns 409 `active_entitlement_no_recharge` from the real `listing_package_entitlements` table. Client-side, `publish/route.ts:506` never regresses a published row to `pending_payment` and `:696` gates the `pendingPayment: true` echo on `actualListingStatus`, so the preview never proceeds to checkout for an active listing |
| Address privacy reaches public rendering | `resolveServiciosProfile.ts:82` calls `resolveBusinessAddressPublicView`; `:101` gates `physicalAddressDisplay` on `showExactAddress`; `:112` gates `mapsSearchHref` on `directionsAllowed`. 16 public reads go through `profile.contact`; **0** raw-wire address reads in public components |
| Hours evaluator is shared and runtime-based | `ServiciosHours.tsx:19` calls `buildServiciosHeroHoursPill(hours, lang)`; the same module backs `serviciosResultsFilter.ts:612,:818` via `serviciosHoursSummaryIsOpenNow`; 0 occurrences of the old `openNowLabel.toLowerCase()` colour heuristic remain as primary logic |
| Protected Application/Preview not redesigned | `git diff --stat`: `ClasificadosServiciosApplication.tsx` +67/−8 (one input swapped for the shared picker, one checkbox added, id priming), `ClasificadosServiciosPreviewClient.tsx` +18/−4 (id priming + one query param). No step, layout, section order, storage key or readiness rule changed |
| Lint | ESLint over the full changed Servicios scope: **15 errors before, 15 after — zero new**. All are pre-existing unused-var/`prefer-const` findings (verified against a stashed baseline of the same file set) |
| Round-trip / unit | `scripts/verify-servicios-gate1-lifecycle.ts` — **20/20 PASS**. Exercises the real mappers end to end (authored state → publish wire → rehydrate → republish wire) plus the real `resolveServiciosProfile` privacy gate and the real WhatsApp/phone helpers; the rest are source-level assertions |
| Existing regression suite | `smoke-servicios-restaurantes-golden-loop-parity-01.mjs` PASS · `smoke-servicios-edit-route-restaurantes-parity-hard-fix-01.mjs` PASS · `verify-business-address-foundation.ts` PASS (19/19, includes the Comida Local privacy regression control) |
| TypeScript | **DEFERRED TO INTEGRATION GATE.** `tsc --noEmit` over this repo exhausts the V8 heap on this machine (`FATAL ERROR: ... JavaScript heap out of memory`, even scoped to the Servicios surface with `--max-old-space-size=8192`), and the machine is under a hard resource lock from running parallel Leonix worktrees. The only signal obtained before the OOM was a single error in `ServiciosTopBar.tsx` (`Cannot find module '@/public/logo.png'`) — an untouched file, caused solely by the generated `next-env.d.ts` being absent in a worktree that has never been built. **Zero type errors were reported in any file this gate changed.** Exact deferred command: `npm run typecheck` |

### Pre-existing failure, NOT caused by this gate

`scripts/smoke-servicios-global-checkout-standard-parity-01.mjs` fails on
`metadata must carry add-on price cents`. It asserts `servicios_offers_addon_price_cents` in
`app/lib/listingPlans/publishCheckoutCheckpoint.ts` — a file **not touched by this gate**
(`git diff --name-only` has zero matches), and the string is absent at `HEAD` too. The script is
stale against the owner-locked Package C Build 3 decision that made coupons/offers **included** in
the $399 base package (see `revenuePricingMatrix.ts:257-259`), which retired the separate add-on
price line. Recorded here, not fixed — correcting a stale historical gate script is out of Gate 1
scope.

### Not done in this gate (by instruction)

Saved Search (§5.3), Related Listings (§5.4), landing DB adoption (§5.5), sitemap (§5.6),
subscription-sweep scheduler (§5.2), and all aesthetic work remain OPEN. No dead or duplicate path
from §4 was deleted.

### Remaining before owner QA

Browser owner QA has **not** been performed — source proof only, per instruction. The full
`Landing → … → Republish → Same Row / No Recharge` walk of master §18 is the next validation step.

Carry into the integration gate:
1. `npm run typecheck` (deferred above — heap-constrained on this machine).
2. `npm run build` — never attempted in this gate.
3. Owner-browser QA of master §18, with particular attention to:
   - rename a published business, republish, confirm **one** row and the **same** public slug;
   - toggle `showExactAddress` off, confirm the street and "Cómo llegar" both disappear from the
     public vitrina while the city line remains;
   - confirm the hours pill reads a real Abierto/Cerrado and agrees with the `open_now` filter.
4. `GOOGLE_MAPS_API_KEY` is **absent** in this environment, so the address picker is in its
   fail-closed manual-entry mode and no suggestion has ever been exercised against the live
   provider. Provider-backed verification remains `BLOCKED_EXTERNAL` until that key is configured —
   the contract, the fail-closed path and manual entry are all proven.

---

## 11. GATE SERVICIOS-2 — IMPLEMENTATION EVIDENCE

Branch `completion/launch-lifecycle-2026-09-09`, one coherent commit on top of `849b45ea`. Not
pushed. `main` untouched. **Nothing from §4 was deleted.**

### Files changed (10 modified, 9 new)

**New — Servicios adapters into existing shared engines (no new global engine)**

| File | Role |
|---|---|
| `app/lib/saved-search/servicios/savedSearchServiciosAdapter.ts` | filter ↔ normalized translation + dashboard facet summary |
| `app/lib/saved-search/servicios/serviciosSavedSearchResultsUrl.ts` | rebuild a real results URL from a saved search |
| `app/lib/saved-search/servicios/serviciosPublicEligibleListing.ts` | branded published-only eligibility type |
| `app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts` | reuses the live results filter pipeline verbatim |
| `app/lib/saved-search/servicios/serviciosSavedSearchMatchOrchestrator.ts` | durable best-effort match ledger writer |
| `app/lib/saved-search/servicios/serviciosSavedSearchDeliveryResolver.ts` | eligibility revalidation + canonical detail URL |
| `app/(site)/clasificados/servicios/lib/serviciosRelatedListings.ts` | related reader (trade family + location) |
| `app/(site)/clasificados/servicios/components/ServiciosRelatedListingsSection.tsx` | rail using the existing result card |
| `supabase/migrations/20260910120000_saved_search_match_events_servicios.sql` | widen ledger CHECKs for `servicios` |
| `scripts/verify-servicios-gate2-discovery.ts` | this gate's verifier |

**Modified**

| File | Change |
|---|---|
| `clasificados/servicios/resultados/page.tsx` | mount shared `SavedSearchButton` with the page's own `filterQuery` |
| `clasificados/servicios/[slug]/page.tsx` | related listings (live-only) + absolute-URL JSON-LD with real keywords |
| `clasificados/servicios/page.tsx` | remove the false `force-dynamic`/live-data contract |
| `servicios/seo/serviciosJsonLd.ts` | absolute `url` doctrine + `additionalType` / `areaServed` / `makesOffer` |
| `app/sitemap.ts` | Servicios published-detail section; corrected stale header claim |
| `lib/seo/leonixDiscoveryContracts.ts` | scope-clarify `leonixSitemapOmitsPerListingDetailUrls` (value unchanged) |
| `lib/saved-search/delivery/savedSearchDeliveryCategoryResolver.ts` | `buildDetailUrl` → `string \| Promise<string>` |
| `lib/saved-search/delivery/savedSearchEmailDelivery.ts` | register servicios resolver; `await buildDetailUrl` |
| `dashboard/busquedas-guardadas/page.tsx` | `CATEGORY_REGISTRY` + browse link + bilingual copy |
| `lib/listingPlans/revenueFulfillment.ts` | fire the match trigger on real activation |

### Discovery-circuit proof (verifier check 6)

```
published row        listServiciosPublicListingsRaw (published-only)
  -> results         filterServiciosPublicListingRows -> ByKeyword -> BySeller
  -> Saved Search    SavedSearchButton(serviciosFilterQueryToSavedSearch(filterQuery))
                     -> shared fingerprint/CRUD -> dashboard -> rebuilt results URL
                     -> activation trigger -> ledger -> email -> canonical detail URL
  -> public detail   getServiciosPublicListingBySlugForDiscovery
  -> Related         listRelatedServiciosListings (same reader, trade family + location)
  -> canonical SEO   alternates.canonical + absolute-URL JSON-LD + sitemap entry
```

### Validation

| Check | Result |
|---|---|
| `scripts/verify-servicios-gate2-discovery.ts` | **19/19 PASS** — includes real adapter round-trip, fingerprint order/sort independence, eligibility rejection of all five non-published statuses, and JSON-LD omission behaviour |
| `scripts/verify-servicios-gate1-lifecycle.ts` | **20/20 PASS** — no Gate 1 regression |
| ESLint over the full Gate 2 changed scope | **0 errors, 0 warnings** |
| TypeScript / build | **DEFERRED TO INTEGRATION GATE** (machine-wide resource lock; see below) |

### Cleanup readiness — §4 dead paths re-verified, nothing deleted

Re-proved this gate by walking every `.ts/.tsx/.mjs` under `app/`, `scripts/`, `e2e/`, `tests/` and
matching real import specifiers (the dead island's own internal imports excluded):

| Path group | Zero-import proof | Route proof | Safe to remove after Servicios completion? |
|---|---|---|---|
| `servicios/publicar/{components,hooks,lib}`, `serviciosCategories.ts`, `serviciosPublicarCopy.ts` | 0 live importers | not routes | **YES** — but keep `servicios/publicar/page.tsx`, a live redirect shim |
| `servicios/perfil/preview/{page,layout,ServiciosPreviewClient}.tsx` | 0 live importers | **IS a reachable route** (`page.tsx`), robots-disallowed via `/servicios/perfil` | **YES, with a routing decision** — removing it removes a live URL; decide 410 vs redirect |
| `servicios/data/{demoServiciosBusinessProfile,serviciosApplicationDraftSamples}.ts` | 0 live importers | n/a | **YES** |
| `servicios/lib/{serviciosDraftStorage,serviciosDraftParse}.ts` | 0 live importers | n/a | **YES** — only the dead island referenced them |
| 14 dead `servicios/components/*` (incl. `ServiciosHeroActions`, with its own localStorage fork) | 0 live importers | n/a | **YES** — but `serviciosHeroHoursStatus.ts` is **LIVE**, do not sweep it with the folder |
| 12 dead `clasificados/servicios/landing/*` | 0 live importers | n/a | **YES** — note `FeaturedBusinessSection`/`RecentServicesSection` are the components §5.5 would need if a live rail is ever reinstated |
| `resultados/page_temp.tsx` | 0 live importers | **not a route** (Next routes only `page.tsx`) | **YES** — pure scratch file inside the App Router tree |
| `ServiciosListingResultCard`, `analytics/serviciosAnalytics`, `shell/ServiciosPreviewCard`, `shared/fields/serviciosTaxonomy`, `shared/mapping/serviciosTier`, `components/ServiciosDestacado*`, `lib/serviciosDiscoveryContract`, `lib/serviciosLandingPublicMappers`, `lib/serviciosResultsRanking`, `ServiciosPublishModal`, `serviciosCustomAmenityOptions`, `serviciosPromoPdfUi` | 0 live importers | n/a | **YES** |

Re-verified by the Gate 2 verifier itself (check 7a/7b), so the cleanup gate starts from a proof
that is re-runnable rather than a snapshot.

### Not done in this gate (by instruction)

Subscription-sweep scheduler (§5.2), owner-browser QA, and all aesthetic work. Community Trust,
Google/Yelp, Business Hub, PWA, Application and Preview were not redesigned — Gate 2 touched the
Application/Preview surface **not at all**.

### Deferred to the integration gate

1. `npm run typecheck` — not attempted; the machine is under a hard multi-worktree resource lock and
   this repo's `tsc` exhausted the V8 heap in Gate 1 even when scoped.
2. `npm run build` — not attempted, same reason.
3. **`supabase/migrations/20260910120000_saved_search_match_events_servicios.sql` has not been
   applied anywhere.** Until it runs, a Servicios match-event insert is rejected by the existing
   CHECK constraint. The orchestrator degrades safely (the write failure is recorded, never thrown),
   and the save/list/dashboard half of Saved Search works without it — but **match emails will not
   deliver until the migration is applied**.
4. Owner-browser QA of the discovery circuit, especially: save a filtered Servicios search → confirm
   it appears in `/dashboard/busquedas-guardadas` → reopen it → confirm the same result set.

---

**QUE RUJA EL LEÓN. HARD WORK. GOD FIRST.**
