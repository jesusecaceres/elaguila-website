# 05A — SERVICIOS · RESTAURANTES · COMIDA LOCAL — FILE-BY-FILE PATHWAY DIAGRAMS

**REF:** `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` (verified twice — see
`04A_SERVICIOS_RESTAURANTES_COMIDA_FULL_CYCLE.md` header). Sealed Sept seal `e3956df8`.
Primary working tree (`HEAD = d09d979c`) is 112 commits stale and was **not** used as a source.

Every path below is repo-relative and exists in `origin/main` unless marked `✗ ABSENT`.
`⟶` = control/navigation flow · `⇢` = data flow · `⌁` = browser-storage hop.

**Alias reminder:** `tsconfig.json:25` maps `@/app/clasificados/*` → `./app/(site)/clasificados/*`;
`@/app/servicios/*` → `./app/(site)/servicios/*`. Servicios spans **two** trees.

---

# 1. SERVICIOS — `servicios_public_listings`

## 1.1 DISCOVERY LANE

```
/clasificados                       app/(site)/clasificados/ClasificadosHubClient.tsx:49
  ⟶ resolvePublicarGatewayDestination("servicios")
      app/(site)/publicar/publicarGatewayResolver.ts:99
      → adapter.checkpointRoute ?? adapter.hubRoute ?? adapter.applicationRoute
      → SERVICIOS_ADAPTER (app/lib/listingIdentity/categoryRouteRegistry.ts:244) declares NEITHER
        checkpointRoute NOR hubRoute  ⟹  falls through to applicationRoute
      ⟹ /publicar/servicios     ⚠ THE CHECKPOINT IS SKIPPED  (04A §6.1, GAP-04A-03)

LANDING
/clasificados/servicios             app/(site)/clasificados/servicios/page.tsx   (dynamic="force-dynamic")
  ⟶ landing/ServiciosLandingPage.tsx
      ⇢ lib/serviciosLandingBuild.ts
      ⇢ lib/serviciosLandingPublicMappers.ts
      ⇢ lib/serviciosPublicListingsServer.ts:154-160   (service-role read, cap 500/800)
      ⇢ lib/serviciosDestacados.ts → components/ServiciosDestacadosSection.tsx
      ⟶ landing/ServiciosHeroSearch.tsx · ServiciosCompactSearchCanvas.tsx ·
        ServiceCategoriesGrid.tsx · RecentServicesSection.tsx · FeaturedBusinessSection.tsx ·
        PublishServiceCTA.tsx
      ⟶ href built by lib/serviciosBrowseParams.ts

RESULTS
/clasificados/servicios/resultados  app/(site)/clasificados/servicios/resultados/page.tsx  (canonical)
/clasificados/servicios/results     app/(site)/clasificados/servicios/results/page.tsx:3
                                    → `export { default } from "../resultados/page"`
                                    ⚠ no redirect, no alternates.canonical → duplicate content (doc 14 GAP-016)
  ⇢ lib/serviciosPublicListingsServer.ts  listServiciosPublicListingsRaw
      .ilike("listing_status","published"):162  + re-check :167
  ⇢ lib/serviciosResultsFilter.ts   filterServiciosPublicListingRows / filterServiciosRowsByKeyword /
                                    filterServiciosRowsBySeller / sortServiciosResultsForDisplay
                                    (sorts WITHIN placement buckets — :874-879, the reference behaviour)
  ⇢ lib/serviciosEntitlementOverlay.ts:48-56  (rank only; fail-open :57-62 — no visibility gate)
  ⇢ app/lib/listingPlans/placementResultsOverlay.ts  resolveCanonicalVisibilityBucketWeights
  ⟶ ServiciosResultsPageShell.tsx (bespoke) + components/ServiciosHorizontalResultCard.tsx
    + ServiciosResultsActiveSummary.tsx + ServiciosResultsFilters.tsx
    + app/(site)/clasificados/components/categoryStandard/CategoryStandardPagination.tsx  (V1 kit)
  ⟶ ServiciosResultsViewAnalytics.tsx ⇢ lib/recordServiciosGlobalAnalytics.ts
  ✗ ABSENT: LeonixCategory* V2 kit (doc 14 §B.1)
```

## 1.2 PUBLISH LANE

```
CHECKPOINT / "VER MÁS"
/clasificados/publicar/servicios        app/(site)/clasificados/publicar/servicios/page.tsx  → 302
/clasificados/publicar/servicios/checkpoint
        app/(site)/clasificados/publicar/servicios/checkpoint/page.tsx
  ⟶ checkpoint/ServiciosCheckpointClient.tsx:39
      ⇢ app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts:163
          getServiciosCheckpointCard  ⇢ app/lib/listingPlans/revenuePricingMatrix.ts:244-252
                                        ("servicios_base_monthly", 39900, promoEligible:true)
      ⟶ app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx:59
          PaidPublishCheckpointCard  (+ :121 PaidPublishCheckpointModal = "Ver Más")
      ⟶ applicationHref = /publicar/servicios?product=servicios_profesionales&lang=…

APPLICATION
/publicar/servicios                     app/(site)/publicar/servicios/page.tsx
  ⟶ app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx
      ⇠ lib/defaultClasificadosServiciosState.ts
      ⇠ lib/clasificadosServiciosApplicationTypes.ts + …Normalize.ts + …Copy.ts
      ⇠ lib/businessTypePresets.ts · businessHighlightPresets.ts · presetStateMerge.ts
      ⇠ lib/serviciosApplicationStepLabels.ts · serviciosApplicationTemplateCopy.ts
      ⇠ lib/serviciosCustom{AmenityOptions,BusinessHighlights,PaymentMethods,QuickFacts,ServicesOffered}.ts
      ⇠ lib/serviciosContactVisibility.ts · serviciosPhoneUi.ts · socialAndUrlHelpers.ts
      ⌁ DRAFT  lib/clasificadosServiciosStorage.ts:14
               sessionStorage["leonix.clasificados.servicios.application.v1"]
             + lib/clasificadosServiciosDraftMedia.ts / …DraftMediaIdb.ts
               IndexedDB namespace "clasificados-servicios-v1"  (:17)
             (one-time legacy localStorage migration :52-62)
      ⟶ GUARD  app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts:35
               adopted at ClasificadosServiciosApplication.tsx:17,:615     ← SHARED, not a fork
      ⟶ MEDIA  components/ServiciosPublishSortableGallery.tsx
               lib/compressServiciosImage.ts · serviciosMediaTransport.ts · serviciosMuxVideoClient.ts
               POST app/api/clasificados/servicios/draft-media-upload/route.ts
      ⟶ EDIT-MODE HYDRATION (?mode=listing-edit&listingId=…)
               ClasificadosServiciosApplication.tsx:507
                 ⇢ lib/serviciosPublishedToApplicationDraft.ts
                 ⌁ primeServiciosExistingPublicSlug(hydratedListing.editIdentity.slug)
                   → sessionStorage["servicios_last_published_slug"]     ← ROW IDENTITY LIVES HERE
               (:435 and :664 CLEAR that key)

HARD REFRESH
  same tab  ⟶ sessionStorage + IDB rehydrate → draft restored
  new tab / browser restart ⟶ sessionStorage gone → DRAFT LOST (no server-side draft row)

PREVIEW
/clasificados/publicar/servicios/preview   app/(site)/clasificados/publicar/servicios/preview/page.tsx
  ⟶ preview/ClasificadosServiciosPreviewClient.tsx
      ⇠ lib/clasificadosServiciosPreviewHandoff.ts:17
          SERVICIOS_PREVIEW_RETURN_KEY = sessionStorage["leonix.clasificados.servicios.previewReturn.v1"]
      ⇢ lib/mapClasificadosServiciosApplicationToServiciosDraft.ts
      ⇢ app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts
      ⟶ preview/ServiciosProfessionalPreviewShell.tsx  (VM builder)
      ⇢ app/lib/listingIdentity/previewModeContract.ts  resolvePreviewMode   ← SHARED (b60801e2)
      ⇢ lib/serviciosPreviewReadiness.ts · serviciosPublishReadiness.ts

PREVIEW → EDIT  ("Volver a editar")
  ⌁ writes SERVICIOS_PREVIEW_RETURN_KEY (one-shot) + 30 s in-memory fallback (:54-63)
  ⟶ back to /publicar/servicios → consumed on remount → state preserved

CHECKOUT
  ⟶ app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx:119
      mounted at ClasificadosServiciosPreviewClient.tsx:777
      ⇢ app/lib/listingPlans/publishCheckoutCheckpoint.ts:238 resolvePublishCheckoutCheckpoint
        (servicios branch ~:320; SERVICIOS_OFFERS_ADDON_PACKAGE_KEY; coupons included in base)
  ⟶ pending_payment save: lib/saveServiciosPendingBeforeCheckout.ts
                        + app/(site)/clasificados/servicios/lib/localServiciosPublishStorage.ts
  ⟶ startRevenueCategoryCheckout  (ClasificadosServiciosPreviewClient.tsx:589)
      ⇢ app/lib/listingPlans/revenueCategoryCheckoutClient.ts → /api/revenue-os/checkout → Stripe
  ⟵ webhook activation → listing_status published

PUBLISH MAPPER → API → DB
  lib/buildServiciosPublishPayload.ts  buildServiciosPublishTransportBody
  lib/serviciosDraftPublishPrepare.ts  resolveServiciosDraftMediaToRemoteUrls
  lib/serviciosPublishClient.ts        postServiciosPublishApi
       ⌁ reads sessionStorage["servicios_last_published_slug"] → body.existingPublicSlug (:78-81)
  ⟶ POST app/api/clasificados/servicios/publish/route.ts:194
       ⇢ normalizeClasificadosServiciosApplicationState                      (:5)
       ⇢ mapClasificadosServiciosApplicationToServiciosDraft                 (:6)
       ⇢ mapServiciosApplicationDraftToBusinessProfile                       (:22)
       ⇢ applyClasificadosCouponsToServiciosWireProfile                      (:6)
       ⇢ stripAdvertiserVerificationFlags                                    (:130)
       ⇢ enforceServiciosOffersEntitlementServerTruth                        (:~170)
            ⇠ app/lib/listingPlans/addonEntitlementReader.ts fetchAddonEntitlementsForListings
       ⇢ mergeOpsControlledServiciosProfileFields                            (:24)
       ⇢ buildServiciosDiscoveryFacet                                        (:25)
       ⇢ buildProposedFinalMediaSet / validateProposedFinalMediaSet          (:30,:275)  ← SHARED
       ⇢ slug resolution                                                     (:298-310)
            baseSlug = slugifyServiciosBusinessName(businessName)
            allocateSlug(baseSlug)  (:119 — appends -2, -3, …)
            existingPublicSlug wins ONLY if the row exists AND owner matches
       ⇢ strict-mode payment guard                                           (:391-417)  → 402
       ⇢ DB
            existing → .from("servicios_public_listings").update({…}).eq("slug", slug)   :457-467
            else     → .from("servicios_public_listings").insert(insertRow)              :493-507
            leonix_ad_id assigned by TRIGGER servicios_public_listings_leonix_ad_id_bi
              supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql:169,:189
       ⇢ insertServiciosAnalyticsEvent (silo servicios_analytics_events)
            ⇢ lib/serviciosListingAnalyticsMirror.ts:59-76 → listing_analytics  ← CONVERGED (doc 10 §6)
  ⟶ detailPath = /clasificados/servicios/${slug}   (:692)

  ⚠ ROW IDENTITY: keyed on `slug`, primed from a sessionStorage string. Lose the session and rename
    the business ⟹ INSERT of a duplicate row.  (04A §4.1, GAP-04A-01)
```

## 1.3 PUBLIC DETAIL LANE

```
/clasificados/servicios/[slug]     app/(site)/clasificados/servicios/[slug]/page.tsx  (+ layout.tsx)
  ⇢ lib/serviciosPublicListingsServer.ts  getServiciosPublicListingBySlugForDiscovery
  ⇢ lib/serviciosDbReviewsMerge.ts + lib/serviciosOpsTablesServer.ts listApprovedServiciosReviewsForSlug
  ⇢ lib/serviciosPublicListingSort.ts (engagement key, net-like count, footer Leonix Ad ID)
  ⇢ lib/serviciosTemplateRouting.ts resolveServiciosListingTemplate
  ⇢ app/(site)/servicios/lib/resolveServiciosProfile.ts
  ⟶ :213 app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx   (professional template)
    :220 app/(site)/servicios/components/ServiciosProfileView.tsx                (standard template)
        ⟶ ServiciosHero.tsx · ServiciosTopBar.tsx · ServiciosQuickFacts.tsx
        ⟶ ServiciosBusinessHubContactCard.tsx  (757 lines, own fork model)
            ⇠ app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts
            ⇠ app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts:28
            ⟶ SHARED bits: SharedConnectionHubReviewButton (:50,:636) ·
                            copyToClipboard (:53,:147) ·
                            buildSharedConnectionHubMapEmbedSrc via serviciosBusinessHubMapEmbed.ts:6
            ⟶ LeonixCommunityTrust (:16,:611)                                   ← SHARED (G20 TRUE)
            ⟶ ServiciosBusinessHubFauxMap.tsx · ServiciosBusinessHubMapPanel.tsx
        ⟶ ServiciosGalleryWithTabs.tsx / ServiciosGallery.tsx / ServiciosMediaLightbox.tsx /
          ServiciosGalleryVideoTile.tsx  ⇠ serviciosVideoEmbed.ts · serviciosGalleryVideoCaps.ts
        ⟶ ServiciosHours.tsx ⇠ serviciosHeroHoursStatus.ts
        ⟶ ServiciosLanguageChipRow.tsx ⇠ serviciosLanguageChips.ts
        ⟶ ServiciosPromocionesCard.tsx / ServiciosCouponsCard.tsx / ServiciosOfferCard.tsx
        ⟶ ServiciosLeadInquiryForm.tsx ⟶ POST /api/clasificados/servicios/inquiry
        ⟶ ServiciosReviews.tsx / ServiciosReviewSubmitForm.tsx ⟶ /api/clasificados/servicios/review
        ⟶ ENGAGEMENT: ServiciosLikeEngagementCluster.tsx (:118 / :222)
                       LeonixShareButton (:128 / :234)
                       ✗ ABSENT: LeonixSaveButton  (app/lib/serviciosSavedListingIdentity.ts has 0 importers)
                       ✗ ABSENT: Report · Recently Viewed  (Sept 14c1e9b5 not merged)
        ⟶ TRANSLATE: ServiciosPublicTranslationLayer.tsx:14 ⇠ app/(site)/servicios/lib/serviciosTranslateAd.ts
        ⟶ ANALYTICS: ServiciosProfileViewAnalytics.tsx · serviciosProfileEngagementAnalytics.ts:24 ·
                      serviciosCtaIntents.ts · lib/recordServiciosGlobalAnalytics.ts
  ⟶ SEO: serviciosJsonLd (page.tsx:31,:189,:203)     ✗ no breadcrumbJsonLd
  ⟵ legacy: app/(site)/servicios/perfil/[slug]/page.tsx → 301 here
  ✗ ORPHAN ROUTE: app/(site)/servicios/perfil/preview/page.tsx renders a draft key nothing writes
  ✗ ORPHAN: app/(site)/servicios/components/ServiciosHeroActions.tsx (0 mounts, localStorage save fork)
```

## 1.4 DASHBOARD / EDIT / ADMIN LANE

```
/dashboard/servicios               app/(site)/dashboard/servicios/page.tsx
  ⇢ GET /api/clasificados/servicios/my-listings  ·  …/my-listing  ·  …/my-leads
  ⇢ app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx  (endorsement read-back)
  ⟶ EDIT  app/lib/listingIdentity/categoryRouteRegistry.ts SERVICIOS_ADAPTER editRoute
          app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts:88,:131
          /publicar/servicios?source=dashboard&mode=listing-edit&listingId=…&returnPanel=servicios
  ⟶ PREVIEW  SERVICIOS_DASHBOARD_PREVIEW_BASE = /clasificados/publicar/servicios/preview (:71)
  ⟶ OFFERS   mode=offers-edit&focus=coupon-upgrade  (secondaryManageRoute)
  ⟶ REPUBLISH → the SAME publish route as a first publish (§1.2) — no separate republish endpoint
                 same row IFF sessionStorage slug survived  ⚠ GAP-04A-01

/admin/workspace/clasificados/servicios
        app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx
  ⟶ ServiciosAdminClient.tsx · _components/ServiciosAdminOpsChrome.tsx · …OpsListingCard.tsx
  ⟶ _components/ServiciosAdminMonetizationPanel.tsx        ← BESPOKE
    ✗ ABSENT: workspace/clasificados/_components/AdminListingMonetizationSummary.tsx  (shared; Sept b9a9f3f7)
  ⇢ _lib/serviciosAdminCanonicalAnalytics.ts:40   (the ONLY per-category admin analytics reader — doc 10 §5)
  ⟶ actions.ts  ·  app/api/admin/servicios/listings/[id]/route.ts
/admin/clasificados/servicios      app/admin/(dashboard)/clasificados/servicios/page.tsx (second surface)
```

---

# 2. RESTAURANTES — `restaurantes_public_listings`

## 2.1 DISCOVERY LANE

```
/clasificados ⟶ publicarGatewayResolver.ts:99 → RESTAURANTES adapter (categoryRouteRegistry.ts:175)
                declares NEITHER checkpointRoute NOR hubRoute ⟹ /publicar/restaurantes
                ⚠ SELECTOR SKIPPED — the Comida Local cross-sell card is never shown (GAP-04A-03)

LANDING
/clasificados/restaurantes         app/(site)/clasificados/restaurantes/page.tsx  (+ layout.tsx)
  ⟶ landing/RestaurantesLandingPage.tsx:27 (categoryStandardV2 adopter)
      ⟶ landing/RestaurantesLandingShell.tsx · RestaurantesLandingHeroGateway.tsx ·
        RestaurantesCompactSearchCanvas.tsx
      ⇢ lib/restaurantesLandingInventoryServer.ts  ⇢ lib/restaurantesPublicListingsServer.ts
      ⇢ lib/restaurantesDestacados.ts → components/RestaurantesDestacadosSection.tsx
      ⟶ components/RestauranteLandingPublishedTeasers.tsx · RestaurantePublishedListingCard.tsx
      ⟶ landing/buildRestaurantesResultsHref.ts

RESULTS
/clasificados/restaurantes/resultados   app/(site)/clasificados/restaurantes/resultados/page.tsx
  ⟶ resultados/RestaurantesResultsShell.tsx:8-18   ← the ONLY full LeonixCategory* V2 kit adopter
  ⟶ resultados/RestauranteResultsClient.tsx
  ⇢ lib/restaurantesResultsInventoryServer.ts:31-38 (entitlement → badge + rank flag only)
  ⇢ lib/restaurantesPublicListingsServer.ts:97-105  (.eq("status","published"), cap 2000)
  ⇢ lib/restaurantesPublicListingMapper.ts  (:103-104 remote Unsplash fallback; :131 priceLevel ?? "$$")
  ⇢ lib/filterRestaurantesBlueprintRows.ts:194-216  sortRestaurantesBlueprintRows
        ⚠ :166 rank → :170 flat sort ⟹ paid placement discarded on any user sort (doc 14 GAP-018)
  ⇢ lib/restaurantesVisibilityRanking.ts · restaurantesEntitlementOverlay.ts
  ⟶ components/DiscoveryClient.tsx · R3Widgets.tsx  ⇠ lib/restaurantesDiscoveryContract.ts
/clasificados/restaurantes/results      results/page.tsx:1 → plain re-export
        ⚠ no redirect, no metadata, does not re-declare dynamic="force-dynamic" (doc 14 GAP-016)
/clasificados/restaurantes/paquetes     paquetes/page.tsx (+ layout.tsx)
```

## 2.2 PUBLISH LANE

```
SELECTOR / CHECKPOINT / "VER MÁS"
/clasificados/publicar/restaurantes   app/(site)/clasificados/publicar/restaurantes/page.tsx
  ⟶ RestaurantesSelectorClient.tsx:35
      ⇢ app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts:54
          getRestaurantesCheckpointCards
            card "restaurante_establecido" ⇢ revenuePricingMatrix "restaurantes_base_monthly" ($399/mo)
                 ctaHref :84 → /publicar/restaurantes?product=established_restaurant
            card "comida_local"            ⇢ revenuePricingMatrix "comida_local_base_monthly" ($129/mo)
                 ctaHref :130 → /publicar/comida-local        ← cross-link to the real product
      ⟶ _components/PublishEntryCheckpoint.tsx:262,:266  PublishEntryCheckpointStack + Modal
  ⚠ page.tsx carries a hardcoded COPY block with card2Price "$199/mes" / card1Price "$399/mes" —
    DEAD (only t.title and t.body are consumed) but contradicts the fixed pricing above (04A §6.10)

APPLICATION
/publicar/restaurantes                app/(site)/publicar/restaurantes/page.tsx
  ⟶ RestauranteApplicationClient.tsx
      ⟶ RestauranteApplicationSectionNav.tsx ⇠ restauranteApplicationSectionModel.ts
      ⟶ RestauranteAmenitiesFormBlock.tsx ⇠ lib/restauranteAmenitiesCatalog.ts
      ⟶ RestauranteExternalVideoUrlsSection.tsx ⇠ shell/restauranteVideoPreview.ts
      ⇠ restauranteApplicationFormCopy.ts · restauranteApplicationUiCopy.ts
      ⇠ application/restauranteListingApplicationModel.ts · restauranteTaxonomy.ts ·
        restaurantesTaxonomyUiLabels.ts · restauranteFeaturesNormalization.ts
      ⌁ DRAFT  application/useRestauranteDraft.ts
               ⇢ application/restauranteDraftStorage.ts:15
                 sessionStorage["restaurantes-draft"]
               + application/restauranteDraftMedia.ts / restauranteDraftMediaIdb.ts  (IndexedDB blobs)
               (one-time legacy localStorage migration :53-63)
      ⟶ GUARD  useBusinessApplicationLeaveGuard  (RestauranteApplicationClient.tsx:22,:213)  ← SHARED
      ⟶ MEDIA  application/RestaurantePublishMediaBuckets.tsx · RestaurantePublishMediaStrip.tsx ·
               RestauranteBucketSortableGrid.tsx · RestauranteSortableMediaTile.tsx ·
               RestauranteUploadRow.tsx · RestauranteMediaPreviewImg.tsx
               ⇢ application/compressRestauranteImage.ts · restauranteGalleryMediaSequence.ts ·
                 restauranteMediaDisplay.ts · restaurantePublishMediaAudit.ts
               POST app/api/clasificados/restaurantes/draft-media-upload/route.ts
      ⟶ EDIT-MODE (?mode=listing-edit&listingId=…) — draft keyed by listingId context
                 (app/lib/listingDrafts/draftWorkspaceContract.ts:152)
      ⟶ COUPON-EDIT (?mode=coupon-edit&focus=coupon-upgrade&listingId=…)

HARD REFRESH   same tab ⟶ rehydrates; new tab ⟶ draft lost (sessionStorage)

PREVIEW
/clasificados/restaurantes/preview    preview/page.tsx (+ preview/layout.tsx)
  ⟶ preview/RestaurantePreviewClient.tsx
      ⇢ application/mapRestauranteDraftToShell.ts  (VM builder)
      ⇢ application/restauranteShellDisplayFormat.ts · restaurantePreviewRequirements.ts ·
        restauranteHoursPreview.ts · restauranteMappingAudit.ts / runMappingAudit.ts
      ⇢ app/lib/listingIdentity/previewModeContract.ts                      ← SHARED (b60801e2)
      ⟶ shell/RestauranteDetailShell.tsx  (same shell as public detail)
PREVIEW → EDIT: both surfaces read/write the SAME sessionStorage["restaurantes-draft"] ⟹ preserved

CHECKOUT
  ⟶ PublishCheckoutCheckpoint (RestaurantePreviewClient.tsx:436)
      ⇢ publishCheckoutCheckpoint.ts:238 (restaurantes branch ~:295-315;
        isRestaurantCouponCheckoutBlocked():229 always false — coupons included in base)
  ⟶ application/saveRestaurantePendingBeforeCheckout.ts
  ⟶ startRevenueCategoryCheckout (:260) → /api/revenue-os/checkout → Stripe → webhook activation

PUBLISH MAPPER → API → DB
  application/buildRestaurantePublishPayload.ts
  application/restauranteDraftPublishPrepare.ts
  ⟶ POST app/api/clasificados/restaurantes/publish/route.ts:133
       ⇢ buildProposedFinalMediaSet / validateProposedFinalMediaSet   (:33,:281)   ← SHARED
       ⇢ owner identity resolved SERVER-SIDE only                      (:310)
       ⇢ existing row lookup by listing_json.draftListingId            (:325-337)
       ⇢ leonix_ad_id: reuse existing, else allocateNextRestauranteLeonixAdId (:437-452,:505)
       ⇢ DB  update .from("restaurantes_public_listings")  :460-461
             insert .from("restaurantes_public_listings")  :512-517
       ⇢ slug allocation :126
  ⟶ /clasificados/restaurantes/${slug}   (registry note: publish/route.ts:423)
  ✓ SAME-ROW republish is durable (server-stored draftListingId, not a browser value)
```

## 2.3 PUBLIC DETAIL LANE

```
/clasificados/restaurantes/[slug]   app/(site)/clasificados/restaurantes/[slug]/page.tsx
  ⇢ lib/restaurantesPublicListingsServer.ts + lib/restaurantesPublicListingMapper.ts
  ⇢ lib/restaurantesListingEngagementServer.ts · restaurantesLeonixAdId.ts · restaurantesSlug.ts
  ⟶ :8,:134 shell/RestauranteAdStoryPreview.tsx:16,:253
      ⟶ shell/RestauranteDetailShell.tsx
          ⟶ shell/RestauranteProfileHeader.tsx (LeonixLikeButton, LeonixShareButton)
          ⟶ shell/RestaurantContactHub.tsx (637 lines, own model buildRestaurantContactHub.ts:174)
              ⟶ SHARED: SharedConnectionHubReviewButton (:33,:548) ·
                        buildSharedConnectionHubMapEmbedSrc (:31,:446,:450) ·
                        copyToClipboard (:32,:100) · one shared TYPE (:34)
              ⟶ LeonixCommunityTrust (:519)                                  ← SHARED (G20 TRUE)
              ⟶ shell/RestaurantContactHubFauxMap.tsx · restaurantContactHubSocialBrand.tsx
              ⇠ shell/restaurantContactHubLeonix.ts (RCH_* tokens — byte-twin of Servicios SCH_*)
          ⟶ shell/RestauranteShellGalleryBlock.tsx · …VenueGalleryBlock.tsx · …GalleryPrimitives.tsx ·
            RestauranteLockedGallerySection.tsx · RestauranteVideoPreviewCard.tsx
          ⟶ shell/RestauranteShellPlatillosBlock.tsx · RestauranteAmenitiesShellSection.tsx ·
            RestauranteGroupedFeaturesSection.tsx · RestauranteOffersPreviewStrip.tsx ·
            RestauranteShellCouponsBlock.tsx · RestauranteShellDestacadosSection.tsx
          ⟶ shell/RestauranteShellInteractiveCtas.tsx
              ⟶ LeonixSaveButton  ⇠ app/lib/restaurantesSavedListingIdentity.ts  ← the SAVE reference
              ⟶ LeonixShareButton
          ⇢ lib/restauranteHoursLogic.ts · restauranteOpenNowFromHours.ts
          ⇢ lib/useRestauranteShellTranslation.ts:11 ⇠ lib/restaurantesTranslateAd.ts
          ⇢ lib/restaurantesCtaTracking.ts · analytics/restaurantesAnalytics.ts ·
            lib/recordRestaurantesGlobalAnalytics.ts:42-43 (social → cta_click)
          ⟶ components/RestauranteProfileViewAnalytics.tsx
  ⟶ SEO: restauranteJsonLd (:15,:95,:116) + breadcrumbJsonLd (:16,:108,:117)      ← the SEO reference
  ✗ ABSENT: Report · Recently Viewed  (Sept 14c1e9b5 not merged)
  ✗ SHIPPED BACKUP FILE: shell/RestauranteDetailShell.tsx.backup
```

## 2.4 DASHBOARD / EDIT / ADMIN LANE

```
/dashboard/restaurantes            app/(site)/dashboard/restaurantes/page.tsx  (:307-313 router.push)
  ⇢ app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts
      :285 restauranteListingEditHref  → /publicar/restaurantes?...&mode=listing-edit&listingId=…
      :291 restauranteCouponEditHref   → /publicar/restaurantes?...&mode=coupon-edit&listingId=…
      :310/:329 addon-checkout return routes
  ⇢ app/(site)/dashboard/lib/categoryDashboardActionContract.ts:95 editUrl
  ⇢ app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts:71 publishHref
  ⟶ REPUBLISH → the SAME /api/clasificados/restaurantes/publish route → SAME ROW via draftListingId
  ✗ registry knownLimitations: "No confirmed dashboard-listing-bound Preview route exists"

/admin/workspace/clasificados/restaurantes
        app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx
  ⇢ listRestaurantesPublicListingsAdminFromDb
  ⟶ _components/AdminListingMonetizationSummary.tsx (:18,:272)          ← SHARED, the ADMIN reference
  ⟶ _components/ClassifiedAdminRowActions.tsx · ClasificadosQueueActionChrome.tsx
  ⇢ app/admin/_lib/classifiedsRepublishCapability.ts restauranteRowIsPublicLive
  ⟶ app/api/admin/restaurantes/listings/[id]/route.ts
```

---

# 3. COMIDA LOCAL — `comida_local_public_listings`

## 3.1 DISCOVERY LANE

```
/clasificados ⟶ publicarGatewayResolver.ts:99 → COMIDA_LOCAL adapter (categoryRouteRegistry.ts:1016)
                checkpointRoute :1022 = "/publicar/comida-local/checkpoint"   ✓ CHECKPOINT HONOURED

LANDING (= RESULTS — there is no second route)
/clasificados/comida-local         app/(site)/clasificados/comida-local/page.tsx
  ⇢ app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts:102-112 (anon/RLS preferred)
        .eq("status", …PUBLISHED) :126
        COMIDA_LOCAL_PUBLIC_LISTING_SELECT :26 selects payment_status + package_tier
           ⚠ neither is used in ANY predicate (:56-82, :123-128) → unpaid rows are public (doc 14 B.2)
           ⚠ expires_at deliberately omitted from the public select (doc 14 B.3)
  ⇢ comidaLocalPublicListingMapper.ts · mapComidaLocalPublicListing.ts · comidaLocalCity.ts
  ⟶ components/ComidaLocalResultsFilters.tsx  (filters, but no paginated results route)
  ⟶ components/ComidaLocalListingCard.tsx  (:50-52 text placeholder, no remote stock photo)
  ✗ ABSENT: any /resultados or /results route · pagination · sorting (fixed published_at desc)
  ✗ ABSENT: placement / entitlement overlay of any kind
```

## 3.2 PUBLISH LANE

```
CHECKPOINT / "VER MÁS"
/publicar/comida-local/checkpoint   app/(site)/publicar/comida-local/checkpoint/page.tsx
  ⟶ app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx:23,:91
      ⇢ categoryPublishCheckpoints.ts:742 getComidaLocalCheckpointCard
        ⇢ revenuePricingMatrix.ts:287-298 "comida_local_base_monthly" ($129/mo, promoEligible:true)
      ⟶ PublishEntryCheckpoint.tsx PaidPublishCheckpointCard + Modal
  ⟶ CTA → /publicar/comida-local
  ⟵ ALSO reachable from the Restaurantes selector card "comida_local" (categoryPublishCheckpoints.ts:130)

APPLICATION
/publicar/comida-local              app/(site)/publicar/comida-local/page.tsx
  ⟶ ComidaLocalApplicationClient.tsx
      ⟶ ComidaLocalValidationPanel.tsx ⇠ app/lib/clasificados/comida-local/comidaLocalValidation.ts
      ⟶ components/ComidaLocalGalleryUpload.tsx · components/ComidaLocalImageUploadField.tsx
          ⇢ comidaLocalImageValidation.ts · comidaLocalImageNormalize.ts · comidaLocalDraftMediaUpload.ts
          POST app/api/clasificados/comida-local/draft-media-upload/route.ts
      ⇠ comidaLocalTypes.ts · comidaLocalConstants.ts · comidaLocalFieldCopy.ts · comidaLocalFormatting.ts
      ⇠ createEmptyComidaLocalDraft.ts
      ⌁ DRAFT  app/lib/clasificados/comida-local/useComidaLocalDraft.ts:47 (autosave 400 ms)
               ⇢ comidaLocalDraftPersistence.ts:23
                 localStorage["leonix:comida-local:draft:v1"]                     (:336,:352,:363)
               ⇢ EDIT workspace key :29  comidaLocalEditWorkspaceStorageKey(listingId)
                 = localStorage["leonix:comida-local:edit:v1:<listingId>"]
                 consumed at ComidaLocalApplicationClient.tsx:298
      ⟶ GUARD  useBusinessApplicationLeaveGuard  (ComidaLocalApplicationClient.tsx:22,:303)  ← SHARED
      ⟶ EDIT-MODE (?edit=1&listingId=…&source=dashboard)
                 ⇢ comidaLocalListingEditContext.ts readComidaLocalEditContext
      ✗ ABSENT: any video field · any coupon/flyer field · IndexedDB media offload

HARD REFRESH   localStorage ⟹ draft survives tab close AND browser restart  (the strongest of the three)

PREVIEW
/clasificados/comida-local/preview  preview/page.tsx  (hand-rolled robots noindex :8, not the shared const)
  ⟶ preview/ComidaLocalPreviewClient.tsx
      ⇢ comidaLocalDraftPersistence.ts loadComidaLocalDraftFromStorage(editKey or default)  (:66)
      ⇢ mapComidaLocalDraftToPreviewVm.ts   (VM builder; :291,:333 showAddressPublicly gate)
      ⇢ comidaLocalPreviewTypes.ts · comidaLocalPreviewImage.ts
      ⇢ app/lib/listingIdentity/previewModeContract.ts                         ← SHARED (b60801e2)
PREVIEW → EDIT: :80-81 rebuilds /publicar/comida-local?edit=1&listingId=… ; same localStorage key ⟹ preserved

CHECKOUT
  ⟶ PublishCheckoutCheckpoint (ComidaLocalPreviewClient.tsx:300)
  ⟶ onCheckout (:124-…) → saveComidaLocalDraftToStorage → Supabase session token required
  ⟶ startRevenueCategoryCheckout (:177) → /api/revenue-os/checkout → Stripe → webhook activation
  ⇢ comidaLocalPackages.ts · comidaLocalPaymentStatus.ts
  ⚠ app/lib/listingPlans/subscriptionLifecyclePolicy.ts:139 LANE_SUSPENSION has NO comida-local entry
     ⟹ 🔴 P0 the subscription can never be suspended (doc 11 §4)

PUBLISH MAPPER → API → DB
  app/lib/clasificados/comida-local/comidaLocalPublishClient.ts
  ⇢ comidaLocalPublishValidation.ts · comidaLocalPublishTypes.ts
  ⟶ POST app/api/clasificados/comida-local/publish/route.ts:73
       ⇢ comidaLocalPublishServerAuth.ts (owner from bearer)
       ⇢ existing row lookup :132-133 (.select id, slug, leonix_ad_id, status, package_tier,
                                       payment_status, owner_user_id) keyed on draft_listing_id
       ⇢ update .from("comida_local_public_listings").update(updatePayload) :192-193
                leonix_ad_id preserved from the existing row :185-187
         insert .from("comida_local_public_listings").insert({…, leonix_ad_id}) :258-265
                allocateNextComidaLocalLeonixAdId :245 · comidaLocalLeonixAdId.ts · comidaLocalSlug.ts
       ✗ ABSENT: app/lib/media/listingMediaContract.ts (buildProposedFinalMediaSet) — GAP-04A-02
  ⟶ /clasificados/comida-local/${slug}
  ⟶ lifecycle: app/api/clasificados/comida-local/lifecycle/route.ts
  ✓ SAME-ROW republish is durable (server-stored draft_listing_id)
```

## 3.3 PUBLIC DETAIL LANE

```
/clasificados/comida-local/[slug]   app/(site)/clasificados/comida-local/[slug]/page.tsx  (force-dynamic)
  ⇢ comidaLocalPublicQueries.ts getPublishedComidaLocalListingBySlug
  ⇢ mapComidaLocalPublicListing.ts  mapComidaLocalRowToDetailVm / mapComidaLocalRowToCardVm /
                                    resolveComidaLocalFoodTypeLabel
  ⟶ :16,:89 components/ComidaLocalPublicDetailClient.tsx:9,:36
      ⟶ LeonixCommunityTrust (:43)                                          ← SHARED (G20 TRUE)
      ⟶ :120 components/ComidaLocalDetailShell.tsx
          ⟶ components/ComidaLocalContactActions.tsx:23 (rendered :178)
              ⚠ FULL FORK — zero shared connection-hub imports (doc 13 §A.3)
              ⟶ phone / SMS / WhatsApp / email / website / directions
          ⟶ hours text (:171 businessAddressLine)   ✗ no open-now evaluator
          ⟶ language chips ⇠ comidaLocalTypes.ts ComidaLocalLanguageOption
          ⇠ components/comidaLocalContactStyles.ts · comidaLocalCustomerStyles.ts
      ⟶ TRANSLATE: lib/useComidaLocalPublicTranslation.tsx:14 ⇠ comidaLocalTranslateAd.ts
      ⟶ ANALYTICS: comidaLocalAnalytics.ts:166,198  (social → outbound_click :103-106)
  ⟶ SEO: title/description/canonical/openGraph only
       ✗ ABSENT: JSON-LD · breadcrumbJsonLd  (GAP-04A-07)
  ✗ ABSENT: save · like · share (Sept 50d1cd40 not merged) · report · recently viewed (14c1e9b5 not merged)
  ✗ ABSENT: related listings
```

## 3.4 DASHBOARD / EDIT / ADMIN LANE

```
/dashboard/mis-anuncios            app/(site)/dashboard/mis-anuncios/page.tsx
  ⟶ app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx   (own fetch/render path —
     never reaches the generic `listings`-table block)
      ⇢ comidaLocalDashboardQueries.ts fetchOwnerComidaLocalListings (:5,:7,:27 read expires_at)
      ⇢ mapComidaLocalDashboardListing.ts
      ⟶ EDIT  /publicar/comida-local?edit=1&listingId=<uuid>&source=dashboard
              (categoryRouteRegistry.ts:1035)
              ⚠ dashboard audit records the edit CTA is a plain secondary button, not the
                canonically-labelled primary doorway
  ✗ ABSENT: a dedicated /dashboard/comida-local hub (SRV and RST both have one)
  ⟶ REPUBLISH → the SAME /api/clasificados/comida-local/publish route → SAME ROW via draft_listing_id
       registry knownLimitations: legacy rows WITHOUT a stored draft_listing_id fail closed in the
       editor rather than risking a duplicate insert

/admin/workspace/clasificados/comida-local
        app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx
  ⇢ comidaLocalAdminQueries.ts listAdminComidaLocalListings (:7,:32 read expires_at)
  ⇢ mapComidaLocalAdminListing.ts mapComidaLocalRowsToAdminVms
  ⟶ ComidaLocalAdminListings.tsx
  ⟶ actions.ts updateComidaLocalPublicListingStatusAction
  ✗ ABSENT: _components/AdminListingMonetizationSummary.tsx  (GAP-04A-08)
```

---

# 4. CROSS-CATEGORY PATHWAY DELTAS AT A GLANCE

| Hop | SERVICIOS | RESTAURANTES | COMIDA LOCAL |
|---|---|---|---|
| Gateway → checkpoint | ✗ skipped (no `checkpointRoute`/`hubRoute`) | ✗ skipped | ✓ honoured |
| Draft medium | sessionStorage + IDB | sessionStorage + IDB | localStorage only |
| Draft survives tab close | ✗ | ✗ | ✓ |
| Leave guard | ✓ shared | ✓ shared | ✓ shared |
| Preview-mode contract | ✓ shared | ✓ shared | ✓ shared |
| Preview noindex | ✓ shared const | ✓ shared const | ⚠ hand-rolled |
| Shared media contract at publish | ✓ | ✓ | ✗ |
| Same-row republish key | ⚠ sessionStorage slug | ✓ `listing_json.draftListingId` | ✓ `draft_listing_id` |
| Leonix Ad ID origin | DB trigger | app allocator | app allocator |
| Results route | 2 URLs, no canonical | 2 URLs, no canonical | none at all |
| Detail JSON-LD | ✓ (no breadcrumb) | ✓ + breadcrumb | ✗ |
| Save / Like / Share | ✗ / ✓ / ✓ | ✓ / ✓ / ✓ | ✗ / ✗ / ✗ |
| Report / Recently viewed | ✗ / ✗ | ✗ / ✗ | ✗ / ✗ |
| Community trust | ✓ | ✓ | ✓ |
| Dedicated dashboard hub | ✓ | ✓ | ✗ |
| Admin shared monetization summary | ✗ (bespoke panel) | ✓ | ✗ |
| Subscription suspension lane | ✓ | ✓ | ✗ 🔴 P0 |
| E2E spec | ✓ ×2 | ✓ ×1 (+ own config) | ✗ none |
