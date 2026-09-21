# 05B — COMMUNITY / LOW-COST LANES + VIAJES: PATHWAYS, ADOPTION MATRIX, REFERENCE LEDGER

**Batch 5 · Read-only forensic audit · 2026-09-09 · Companion to `04D_COMMUNITY_LANES_VIAJES_FULL_CYCLE.md`**

**REF FOR EVERY ROW BELOW: `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8`** (re-verified
immediately before writing). Where a row cites the Viajes worktree it is labelled
**`f563cdf3` (UNPUSHED)**. Where it cites the sealed Sept tree it is labelled **`e3956df8` (NOT IN PROD)**.

---

# PART 1 — ROUTE + STORAGE MAP (exact paths, per lane)

## 1.1 COMUNIDAD / EVENTOS

| Slot | Path (`origin/main`) |
|---|---|
| **LANDING** | `app/(site)/clasificados/comunidad/page.tsx` |
| **RESULTS** | `app/(site)/clasificados/comunidad/resultados/page.tsx` → `app/(site)/clasificados/community/CommunityListingsResultsClient.tsx` (`category="comunidad"`). Alias: `comunidad/results/page.tsx` (re-export) |
| **CHECKPOINT / "Ver Más"** | `app/(site)/publicar/comunidad/page.tsx` → `app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx`; card copy `app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts:627` (`comunidad_free`, "Ver más" modal). Registry `checkpointRoute: "/publicar/comunidad"` — `app/lib/listingIdentity/categoryRouteRegistry.ts:1208`. Legacy shim `app/(site)/clasificados/publicar/comunidad/page.tsx` |
| **APPLICATION** | `app/(site)/publicar/comunidad/quick/page.tsx` → `ComunidadQuickApplication.tsx` / `ComunidadQuickApplicationClient.tsx`; shared engine `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx` |
| **PREVIEW** | `app/(site)/publicar/comunidad/quick/preview/page.tsx` + `layout.tsx` → `ComunidadQuickPreviewPageClient.tsx`; shared `app/(site)/publicar/community/shared/preview/{CommunityQuickPreviewClient,CommunityQuickPreviewCard,CommunityContactCanvas}.tsx`; canvas `app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx` |
| **PUBLISH / CHECKOUT** | Publish only — **CHECKOUT N-A (free)**. `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts:170`, called from `CommunityQuickPreviewPublishBar.tsx:109,142` and `ComunidadQuickApplication.tsx:143` |
| **PUBLIC DETAIL** | **GENERIC** `app/(site)/clasificados/anuncio/[id]/page.tsx` (2,635 LOC) → early-return branch `:1406` → `app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx:87` |
| **DASHBOARD** | `app/(site)/dashboard/mis-anuncios/page.tsx?cat=comunidad` — `app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts:161-169`. ⚠ registry says `dashboardRoute: () => null` at `categoryRouteRegistry.ts:1213` (see B5-14) |
| **EDIT** | `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` + `categoryLifecycleAdapters.ts`; registry `:1212` |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/comunidad/page.tsx:8`; row editor `.../workspace/clasificados/listings/[id]/edit/page.tsx`; fields block `.../category/_components/CategoryDetailFieldsEditorBlock.tsx:29,83` |
| **API ROUTES** | **NONE lane-specific.** Generic only: `app/api/clasificados/listings/[id]/views/route.ts` (called `community/CommunityQuickPublicDetailSidebar.tsx:63`), `app/api/admin/clasificados/listings/[id]/route.ts`, `.../[id]/ai-review/route.ts`, `.../ai-review/bulk/route.ts`, `app/api/dashboard/analytics/listing/route.ts`, `app/api/translate-ad/route.ts` |
| **PRIMARY TABLE** | `listings` — `publishCommunityQuickToListings.ts:273` |
| **OWNER FIELD** | `owner_id` — `publishCommunityQuickToListings.ts:240` |
| **LISTING UUID** | `listings.id` (select `anuncio/[id]/page.tsx:111`) |
| **LEONIX AD ID** | `listings.leonix_ad_id`, DB-trigger, prefix **`COMM`** `20260506150000:70` → **`COM`** `20260520120000:13` (⚠ B5-13). Helper `community/shared/communityLeonixAdId.ts`; admin `app/admin/_lib/adminAdIdentity.ts:77` |
| **MIGRATIONS** | `20250316200000_listings_detail_pairs.sql`, `20260407140000_ensure_listings_detail_pairs.sql`, `20250311200000_listings_contact_and_status.sql`, `20260421130001_listings_enable_rls_full_policies.sql`, `20260506150000_leonix_ad_id_all_classifieds.sql:70`, `20260509120000_classifieds_republish_capability.sql`, `20260518120000_gate12d_listing_structured_payload.sql` |
| **VERIFIERS** | `scripts/comunidad-com{1,2,3,4}-*.ts`, `comunidad-preview-publish-id-gate-audit.ts`, `gate-1-comunidad-eventos-qa-selftest.ts`, `gate-2c-community-contact-uri-selftest.ts`, `gate-2d-community-owner-qa-debt-selftest.ts`, `gate-p2-community-preview-hook-order-selftest.ts`, `community-quick-publish-contract-smoke.ts`, `community-owner-ledger-final-audit.ts`, `community-owner-qa-final-repair-audit.ts`, `final-community-family-certification.ts`, `verify-globalization-foundation-01-community-publish-integrity.mjs`, `gate-0b-community-results-isolation-selftest.ts` |
| **E2E** | `e2e/community/{community-anuncio-public-polish,community-discovery-cards,community-preview-publish-bar,community-preview-published-shell-parity,community-quick-full-ui-smoke}.spec.ts`, `e2e/leonix-dashboard-admin-smoke.spec.ts` |

## 1.2 CLASES

| Slot | Path (`origin/main`) |
|---|---|
| **LANDING** | `app/(site)/clasificados/clases/page.tsx` |
| **RESULTS** | `app/(site)/clasificados/clases/resultados/page.tsx` → `CommunityListingsResultsClient` (`category="clases"`). Alias `clases/results/page.tsx` |
| **CHECKPOINT** | `app/(site)/publicar/clases/page.tsx` → `QuickLaneCheckpointClient`; copy `categoryPublishCheckpoints.ts:585` (`clases_free`). Registry `checkpointRoute: "/publicar/clases"` `:1164`. Legacy shim `app/(site)/clasificados/publicar/clases/page.tsx` |
| **APPLICATION** | `app/(site)/publicar/clases/quick/page.tsx` → `ClasesQuickApplication.tsx` / `ClasesQuickApplicationClient.tsx` |
| **PREVIEW** | `app/(site)/publicar/clases/quick/preview/page.tsx` + `layout.tsx` → `ClasesQuickPreviewPageClient.tsx`; canvas `app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx`; shared `CommunityContactCanvas.tsx` |
| **PUBLISH / CHECKOUT** | Publish only — **CHECKOUT N-A** (`clases_paid_30d` dormant by owner decision D2: `publicar/clases/page.tsx:5`, `categoryPublishCheckpoints.ts:499-500`). `publishCommunityQuickToListings.ts:170` from `ClasesQuickApplication.tsx:163` / `CommunityQuickPreviewPublishBar.tsx:109,142`. Payload `app/(site)/publicar/clases/lib/clasesPublishPayload.ts` |
| **PUBLIC DETAIL** | **GENERIC** `anuncio/[id]/page.tsx` → branch `:1406` → `CommunityQuickPublishedDetailPage.tsx` → `app/(site)/publicar/clases/components/ClasesPublishedQuickAd.tsx` |
| **DASHBOARD** | `mis-anuncios/page.tsx?cat=clases` — `dashboardMisAnunciosCategories.ts:146-158`. ⚠ registry `dashboardRoute: () => null` `:1177` |
| **EDIT** | `mis-anuncios/[id]/editar/page.tsx` — registry `:1173` |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/clases/page.tsx:8` + shared admin surfaces |
| **API ROUTES** | **NONE lane-specific.** Same generic set as comunidad |
| **PRIMARY TABLE** | `listings` |
| **OWNER FIELD** | `owner_id` — `publishCommunityQuickToListings.ts:240` |
| **LISTING UUID** | `listings.id` |
| **LEONIX AD ID** | `listings.leonix_ad_id`, prefix **`CLASS`** `20260506150000:69`; admin `adminAdIdentity.ts:78` |
| **MIGRATIONS** | Shared `listings` set; prefix `CLASS` at `20260506150000:69`, `20260507140000:12`, `20260508160000:12`, `20260519180000:12`, `20260520120000:12` |
| **VERIFIERS** | `scripts/clases-cl1-launch-stack-audit.ts`, `gate-2a-clases-qa-selftest.ts`, `gate-2b-clases-revenue-os-selftest.ts` + shared community scripts |
| **E2E** | `e2e/community/*.spec.ts` (shared) + `e2e/leonix-dashboard-admin-smoke.spec.ts` |

## 1.3 BUSCO / SE BUSCA

| Slot | Path (`origin/main`) |
|---|---|
| **LANDING** | `app/(site)/clasificados/busco/page.tsx` (+ `BuscoLandingRecentListings.tsx`, `buscoChildCategoryImages.ts`) |
| **RESULTS** | `app/(site)/clasificados/busco/resultados/page.tsx` → `BuscoResultsClient.tsx`. Alias `busco/results/page.tsx`. Loader `busco/shared/loadBuscoListings.ts` |
| **CHECKPOINT** | `app/(site)/publicar/busco/page.tsx` → `QuickLaneCheckpointClient`; copy `categoryPublishCheckpoints.ts:539` (`busco_free`). Registry `checkpointRoute: "/publicar/busco"` `:1110`. Legacy shim `app/(site)/clasificados/publicar/busco/page.tsx` |
| **APPLICATION** | `app/(site)/publicar/busco/quick/page.tsx` → `BuscoQuickFormClient.tsx`; route constant `busco/shared/buscoPublishRoutes.ts:4` |
| **PREVIEW** | `app/(site)/publicar/busco/quick/preview/page.tsx` + `layout.tsx` → `BuscoQuickPreviewClient.tsx` (`buscoPublishRoutes.ts:5`); canvas `app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx` |
| **PUBLISH / CHECKOUT** | Publish only — **CHECKOUT N-A (free)**. `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts:117`, from `BuscoQuickPreviewPublishBar.tsx:84`; activation `:289-292` (`status:"active", is_published:true`) |
| **PUBLIC DETAIL** | **GENERIC** `anuncio/[id]/page.tsx` → branch `:1359` → `app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx:66` → `BuscoQuickPublishedAd.tsx` |
| **DASHBOARD** | `mis-anuncios/page.tsx?cat=busco` — `dashboardMisAnunciosCategories.ts:172-179`; display helper `busco/shared/buscoDashboardDisplay.ts`; registry `dashboardRoute` → `/dashboard/mis-anuncios` `:1127` |
| **EDIT** | `mis-anuncios/[id]/editar/page.tsx` — registry `:1124`. (`buscoQuickEditUrl` `buscoPublishRoutes.ts:11` is a **draft-return** link, not a published-edit route) |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/busco/page.tsx:8`; `AdminListingsTable.tsx:130,138`; `_lib/clasificadosQueueSurfaceMeta.ts:63,67` |
| **API ROUTES** | **NONE lane-specific.** Generic admin/analytics/translate only |
| **PRIMARY TABLE** | `listings` — `publishBuscoQuickToListings.ts:290` |
| **OWNER FIELD** | `owner_id` — `publishBuscoQuickToListings.ts:162` |
| **LISTING UUID** | `listings.id` |
| **LEONIX AD ID** | `listings.leonix_ad_id`, prefix **`BUSCO`** — `20260520120000_leonix_listings_prefix_busco.sql:15` |
| **MIGRATIONS** | `20260520120000_leonix_listings_prefix_busco.sql` + shared `listings` set |
| **VERIFIERS** | `scripts/busco-b1-quick-connection-audit.ts`, `gate-4-busco-se-busca-qa-selftest.ts`, `gate-i5-1-canonical-route-contract-selftest.ts`, `gate-i5-2-publish-gateway-selftest.ts`, `gate-i5-3-publish-redirect-selftest.ts`, `gate-i6a/b/c-quick-clasificados-*`, `gate-pkgA-checkpoints-selftest.ts`, `cat-std-all-landing-results-audit.ts`, `clasificados-route-smoke-audit.ts`. Doc `app/lib/clasificados/busco/BUSCO_B1_QUICK_CONNECTION_AUDIT.md` |
| **E2E** | ⚠ **NONE.** No file under `e2e/` mentions `busco` |

## 1.4 MASCOTAS Y PERDIDOS / ADOPCION

| Slot | Path (`origin/main`) |
|---|---|
| **LANDING** | `app/(site)/clasificados/mascotas-y-perdidos/page.tsx` (+ `MascotasPerdidosLandingRecentListings.tsx`) |
| **RESULTS** | `app/(site)/clasificados/mascotas-y-perdidos/resultados/page.tsx` → `MascotasPerdidosResultsClient.tsx`. Alias `.../results/page.tsx` — ⚠ registry names `/results` canonical at `categoryRouteRegistry.ts:1252`. Loader `.../shared/loadMascotasPerdidosListings.ts` |
| **CHECKPOINT** | `app/(site)/publicar/mascotas-y-perdidos/page.tsx` → `QuickLaneCheckpointClient`; copy `categoryPublishCheckpoints.ts:673` (`mascotas_free`). Registry `checkpointRoute: "/publicar/mascotas-y-perdidos"` `:1249`. Legacy shim `app/(site)/clasificados/publicar/mascotas-y-perdidos/page.tsx` |
| **APPLICATION** | `app/(site)/publicar/mascotas-y-perdidos/quick/page.tsx` → `MascotasPerdidosQuickFormClient.tsx`; constant `.../shared/mascotasPerdidosPublishRoutes.ts:4` |
| **PREVIEW** | `app/(site)/publicar/mascotas-y-perdidos/quick/preview/page.tsx` + `layout.tsx` → `MascotasPerdidosQuickPreviewClient.tsx` (`:7`); canvas `app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx` |
| **PUBLISH / CHECKOUT** | Publish only — **CHECKOUT N-A (free)**. `app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts` from `.../quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx:12`. ⚠ `categoryRouteRegistry.ts:1258-1264` misattributes this to `publishCommunityQuickToListings` (B5-15) |
| **PUBLIC DETAIL** | **GENERIC** `anuncio/[id]/page.tsx` → branch `:1384` → `app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx:37` (**68 LOC total**). Pairs contract `.../shared/mascotasPerdidosListingDetailPairs.ts` |
| **DASHBOARD** | `mis-anuncios/page.tsx?cat=mascotas` — `dashboardMisAnunciosCategories.ts:182-194` (⚠ key is `"mascotas"`, not the full slug). Registry `dashboardRoute: () => null` `:1269` |
| **EDIT** | `mis-anuncios/[id]/editar/page.tsx` — registry `:1267`; adapter note `categoryLifecycleAdapters.ts:393`; page note `editar/page.tsx:370` |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/mascotas-y-perdidos/page.tsx:8`; `CategoryDetailFieldsEditorBlock.tsx:30,83`; `_lib/clasificadosQueueSurfaceMeta.ts:61` |
| **API ROUTES** | **NONE lane-specific.** Generic only |
| **PRIMARY TABLE** | `listings` — `publishMascotasPerdidosQuickToListings.ts:229` |
| **OWNER FIELD** | `owner_id` — `publishMascotasPerdidosQuickToListings.ts:141` |
| **LISTING UUID** | `listings.id` |
| **LEONIX AD ID** | `listings.leonix_ad_id`, prefix **`PET`** — `20260519180000_leonix_listings_prefix_mascotas_y_perdidos_pet.sql:14`; admin `adminAdIdentity.ts:79` |
| **MIGRATIONS** | `20260519180000_leonix_listings_prefix_mascotas_y_perdidos_pet.sql` + shared `listings` set |
| **VERIFIERS** | `scripts/gate-3-mascotas-perdidos-qa-selftest.ts`, `gate-4-busco-se-busca-qa-selftest.ts`, `audit-leonix-ad-ids.mts`, `gate-i6a/b/c-*`, `gate-i13b-public-visibility-filter-selftest.ts`, `gate-pkgA-{checkpoints,edit-save-truth,preview-modes}-selftest.ts`, `gate-pkgB-media-adoption-selftest.ts`, `cat-std-all-landing-results-audit.ts`, `clasificados-route-smoke-audit.ts`, `july1-free-clasificados-application-public-shell-audit.ts` |
| **E2E** | ⚠ **NONE dedicated.** Only incidental mentions in `e2e/en-venta-manual-qa-sample-content.ts`, `e2e/rentas/rentas-runtime-qa.spec.ts`, `e2e/rentas/rentas-sample-content-full-qa.spec.ts` |

## 1.5 EN VENTA / VARIOS — **the reference lane**

| Slot | Path (`origin/main`) |
|---|---|
| **LANDING** | `app/(site)/clasificados/en-venta/page.tsx` → `EnVentaHubPageClient.tsx` (+ `layout.tsx`, `hub/`) |
| **RESULTS** | `app/(site)/clasificados/en-venta/results/page.tsx` → `results/EnVentaResultsClient.tsx`. ⚠ **no `/resultados` alias** (unlike the other four). URL contract `results/contracts/enVentaResultsUrlParams.ts`; routes `shared/constants/enVentaResultsRoutes.ts` |
| **CHECKPOINT** | `app/(site)/publicar/en-venta/page.tsx` → `QuickLaneCheckpointClient`; `en_venta_free_v1` referenced `categoryPublishCheckpoints.ts:497`, free card `:726`. Registry `checkpointRoute: "/publicar/en-venta"` `:920`. Hub `app/(site)/clasificados/publicar/en-venta/EnVentaPublishHubClient.tsx` |
| **APPLICATION** | ⚠ **not under `app/(site)/publicar/`** — canonical is `app/(site)/clasificados/publicar/en-venta/pro/page.tsx` → `pro/application/LeonixEnVentaProApplication.tsx`; constant `en-venta/shared/constants/enVentaPublishRoutes.ts:5`. PARKED lanes `free/page.tsx:4`, `storefront/page.tsx:6` (registry `:955-978`) |
| **PREVIEW** | `app/(site)/clasificados/en-venta/preview/page.tsx` + `preview/layout.tsx` → `EnVentaPreviewPage.tsx`, `EnVentaPreviewShell.tsx`, `buildEnVentaPreviewModel.ts`; draft store `enVentaPreviewDraft.ts` / `enVentaPreviewDraftIdb.ts` |
| **PUBLISH / CHECKOUT** | Publish only — **CHECKOUT N-A** (Pro included at no charge, registry `:960-963`). `en-venta/publish/enVentaPublishFromDraft.ts` — insert `:444`, retries `:452,:463`, activation `:502`; trigger `publish/EnVentaPublishSubmitBar.tsx:14`; contract `contracts/enVentaPublishContract.ts` |
| **PUBLIC DETAIL** | **GENERIC** `anuncio/[id]/page.tsx` — en-venta is the shell's **default fallback category** (`coerceCategoryKey` `:234`). Branch `:1479`/`:1495` → `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` (1,446 LOC). Gate `en-venta/contracts/enVentaAnuncioRoute.ts` used at `page.tsx:682` |
| **DASHBOARD** | `mis-anuncios/page.tsx?cat=en-venta` — `dashboardMisAnunciosCategories.ts:53-62`, **default category** `:219`; card `en-venta/dashboard/EnVentaListingManageCard.tsx`; registry `:936` |
| **EDIT** | `mis-anuncios/[id]/editar/page.tsx` — registry `:932` |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx:8`; `.../category/_components/EnVentaCategoryContentBlock.tsx:39,194`; `.../category/[slug]/page.tsx:33`; `en-venta/admin/EnVentaModerationFields.tsx`; `AdminListingsTable.tsx:149` |
| **API ROUTES** | ✅ **the only community lane with its own routes**: `app/api/clasificados/en-venta/inquiry/route.ts` (re-exported by `app/api/clasificados/rentas/inquiry/route.ts:8`), `app/api/clasificados/en-venta/report/route.ts` (called `listing/EnVentaListingReportDrawer.tsx:98`), `app/api/clasificados/en-venta/dev-seed-listing/route.ts`. Plus generic: `listings/[id]/views`, admin listings + ai-review, `category-ops-audit`, `dashboard/analytics/listing`, `seller-stats`, `translate-ad` |
| **PRIMARY TABLE** | `listings` — `enVentaPublishFromDraft.ts:444` |
| **OWNER FIELD** | `owner_id` — `enVentaPublishFromDraft.ts:383` |
| **LISTING UUID** | `listings.id` (`.select("id").single()` `:444`) |
| **LEONIX AD ID** | `listings.leonix_ad_id`, prefix **`SALE`** — `20260506150000:67`; read back `enVentaPublishFromDraft.ts:263,288`; admin `adminAdIdentity.ts:72` |
| **MIGRATIONS** | `20260506150000:67` + `20250316200000`, `20260407140000`, `20250311200000`, `20260421130001`, `20260509120000`, `20260518112000`, `20260423120000`, `20260508140000` |
| **VERIFIERS** | `scripts/en-venta-*` (schema-readiness, go-live-selftest, gate-2h/2m/2n/2o/2p/2q/2qr/2r, r12/r14/r15 smokes), `scripts/varios-*` (p2, p3, p4*, r1–r11b, vl1, final-stack), `gate-i10b-en-venta-inline-save-owner-protection-selftest.ts`, `ofertas-locales-final-1b-en-venta-pipeline-audit.ts`, `playwright-en-venta-web-server.mjs`, `en-venta-varios-full-marketplace-screenshots.mjs`; in-tree `en-venta/tests/enVentaTaxonomySmoke.ts` |
| **E2E** | `e2e/en-venta-smoke.spec.ts`, `e2e/en-venta-auth-smoke.spec.ts`, `e2e/en-venta-seeded-trace.spec.ts`, `e2e/en-venta-manual-qa-seed.spec.ts`, `e2e/en-venta-manual-qa-sample-content.ts`, `e2e/leonix-dashboard-admin-smoke.spec.ts` |

## 1.6 VIAJES

| Slot | `origin/main` | `f563cdf3` (UNPUSHED) |
|---|---|---|
| **LANDING** | `app/(site)/clasificados/viajes/page.tsx` — DB-backed via `fetchViajesPublicBrowseRowsMerged()` `:23`. ⚠ `components/ViajesLowerSections.tsx:18` and `components/ViajesTopOffers.tsx:20` `return null` in production | + `ViajesLandingIntentPills`, `ViajesMobilitySection`, `ViajesNearbyEscapes`, `ViajesStaySection`, `viajesLocalSeo.ts` |
| **RESULTS** | `app/(site)/clasificados/viajes/resultados/page.tsx:9` → `ViajesResultsShell`, `ViajesResultsFilterRail`, `ViajesResultsDiscoveryStrip` | + `ViajesResultsActiveFilters`, `ViajesResultsViewToggle`, `ViajesResultsProviderRail`, `viajesResultsTripTypeOptions.ts`, `viajesResultsMetadata("es")` |
| **CHECKPOINT** | ✅ `app/(site)/publicar/viajes/checkpoint/page.tsx:29` → `QuickLaneCheckpointClient category="viajes"`; cards `categoryPublishCheckpoints.ts:786-861`. Registry `:1311` | ❌ **absent** (branch predates `e8b66da6`) — see 04D §2.5 |
| **APPLICATION** | `app/(site)/publicar/viajes/negocios/page.tsx` → `ViajesNegociosApplicationShell.tsx`; `app/(site)/publicar/viajes/privado/page.tsx` → `ViajesPrivadoApplicationShell.tsx`; V1 drafts `useViajesNegociosDraft.ts` / `useViajesPrivadoDraft.ts` | V2 drafts + `ViajesPublisherStepper`, `ViajesMediaManager`, `ViajesLocationFields`, `ViajesPillCollectionEditor`, 10 typed module editors, negocios/privado `Step*.tsx` (24 files) |
| **PREVIEW** | in-shell review step | `StepReview.tsx` (negocios + privado) |
| **PUBLISH / CHECKOUT** | `app/api/clasificados/viajes/submit/route.ts:74` (`listing_json = { version:1, negocios: draft }`; privado `:128`); resubmit forces `lifecycle_status:"submitted", is_public:false` `:95-96`. ⚠ **CHECKOUT advertised at $399/mo but NOT IMPLEMENTED** — no `revenueViajesFulfillment.ts`, no checkout call site (B5-03) | — |
| **PUBLIC DETAIL (oferta)** | `app/(site)/clasificados/viajes/oferta/[slug]/page.tsx:51` → `resolveViajesStagedOfferDetailBundle()`, sample fallback `:30,39,52`; monolithic `ViajesOfferDetailLayout` | layout rewritten (+430); split into `ViajesOfferDetailGallery`, `ViajesOfferModuleCards`, `ViajesOfferInquiryHub`, `ViajesOfferBusinessHub`, `ViajesOfferRelatedRails`, `ViajesOfferLocationsBlock`, `ViajesOfferPillSection` + `viajesOfferDetailRelatedServer.ts` + `lib/v2/mapViajesOfferV2ToDetailModel.ts` |
| **PUBLIC DETAIL (negocio)** | ⚠ **`app/(site)/clasificados/viajes/negocio/[slug]/page.tsx:42` → `notFound()` in production, unrecoverable** (`viajesPublicInventory.ts:20`). Data `data/viajesNegocioProfileSampleData.ts:31` — hardcoded, zero `.from(` | ✅ `resolveViajesProviderProfileFromStagedServer(slug, lang)` `:36,49`; demo only as fallback; `notFound()` only if both miss `:51` |
| **DASHBOARD** | `app/(site)/dashboard/viajes/page.tsx:175` (DB), edit entry `:263-273,341` → `/publicar/viajes/{negocios,privado}?stagedId=<id>`; generic mirror `dashboardInventory.ts:520` | + `viajesOwnerDashboardHero.ts`, `viajesOwnerDashboardLinks.ts` |
| **EDIT** | registry deliberately `editRoute: () => null` `categoryRouteRegistry.ts:1333` (honest null — lane not derivable from `ListingIdentity`); real path is the `?stagedId=` shell hydration `ViajesNegociosApplicationShell.tsx:41-74,57,66` | — |
| **ADMIN** | `app/api/admin/viajes/listings/[id]/route.ts:61,92,145`, `app/api/admin/viajes/staged-listings/route.ts`, `.../moderate/route.ts` | + `app/admin/(dashboard)/clasificados/viajes/business-offers/[id]/page.tsx`, `app/api/admin/viajes/staged-listings/[id]/route.ts` |
| **API ROUTES** | 6: `clasificados/viajes/{submit,staged-owner,inquiry}/route.ts`, `_lib/viajesOwnerBearer.ts`, `admin/viajes/listings/[id]`, `admin/viajes/staged-listings{,/moderate}` | 8 (+ `clasificados/viajes/media/draft-photo-upload`, `admin/viajes/staged-listings/[id]`) |
| **PRIMARY TABLE** | **`viajes_staged_listings`** (NOT `listings`) — `lib/viajesStagedListingsDbServer.ts`, 9 `.from(` sites; also `viajes_public_inquiries` (`lib/viajesPublicInquiriesDbServer.ts:17`) | + V2 serializer `lib/v2/serializeViajesOfferV2ForStaged.ts` |
| **OWNER FIELD** | **`owner_user_id`** — `20260410180000_viajes_staged_listings.sql:11`, NOT NULL `20260410200000` | — |
| **LISTING UUID** | `viajes_staged_listings.id` — update scoped `.eq("id",…).eq("owner_user_id",…)` `viajesStagedListingsDbServer.ts:196-208` | — |
| **LEONIX AD ID** | `viajes_staged_listings.leonix_ad_id`, prefix **`TRAV`** — `20260507140000_viajes_staged_leonix_ad_id_and_listings_prefix_trav.sql` | — |
| **MIGRATIONS** | `20260410180000_viajes_staged_listings.sql`, `20260410200000_viajes_staged_owner_not_null.sql`, `20260423140000_viajes_public_inquiries.sql`, `20260507140000_viajes_staged_leonix_ad_id_…sql` | branch `6d736840` authors `20260825150000` (one additive column) — **AUTHORED, NOT APPLIED** |
| **VERIFIERS** | `scripts/verify-viajes-pipeline.mjs`, `scripts/viajes-browse-filter-selftest.ts`, `scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts` | + `scripts/viajes-launch-qa-selftest.ts`, `viajes-prompt{1-v2,2-public-shell,3-lifecycle}-selftest.ts` |
| **E2E** | `e2e/viajes-runtime-qa.spec.ts` | modified + `playwright.viajes-runtime.config.mjs` + `qa/launch-qa/` (40+ artifacts) |

---

# PART 2 — PER-LANE GLOBAL SYSTEM ADOPTION (d)

**Legend:** ✅ TRUE (traced consumer path) · ❌ FALSE · ⬜ N-A (genuinely inapplicable, justified) ·
**COM**=comunidad **CLA**=clases **BUS**=busco **MAS**=mascotas-y-perdidos **ENV**=en-venta **VIA**=viajes

| # | Global system | COM | CLA | BUS | MAS | ENV | VIA |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | checkpoint / "Ver Más" | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | draft | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | unsaved guard | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 4 | preview | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | preview → edit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | publish | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6b | checkout | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ❌ |
| 7 | promo | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ❌ |
| 8 | media / gallery | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | video | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 10 | phone / SMS / WhatsApp | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | email | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | rich correo | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 13 | languages spoken | ❌ | ❌ | ⬜ | ⬜ | ❌ | ❌ |
| 14 | websites / social | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 15 | CTA connection hub | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 16 | translate ad | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 17 | ES / EN | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 18 | community trust | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 19 | google / yelp | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ❌ |
| 20 | address verifier | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 21 | location privacy / directions | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| 22 | saved search | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 23a | save / like | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 23b | share | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 23c | report | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 24 | analytics | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 25 | search / results | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 26 | related listings | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 27 | business hub | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ❌ |
| 28 | user dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 29 | active edit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 30 | republish same-row | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 31 | admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 32 | SEO | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 33 | mobile / PWA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 34 | security / RLS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Counts (36 rows per lane)

| Lane | ✅ TRUE | ❌ FALSE | ⬜ N-A |
|---|---:|---:|---:|
| COMUNIDAD | 22 | 8 | 6 |
| CLASES | 21 | 9 | 6 |
| BUSCO | 20 | 10 | 6 |
| MASCOTAS | 19 | 11 | 6 |
| **EN VENTA (reference)** | **26** | **5** | **5** |
| VIAJES | 16 | 19 | 1 |

### Traced consumer paths for the ✅ rows (evidence, not assertion)

- **1 checkpoint** — `QuickLaneCheckpointClient.tsx` mounted at `publicar/{comunidad,clases,busco,mascotas-y-perdidos,en-venta}/page.tsx` and `publicar/viajes/checkpoint/page.tsx:29`; cards `categoryPublishCheckpoints.ts:539,585,627,673,726,786`; registry `checkpointRoute` `:920,1110,1164,1208,1249,1311`.
- **2 draft** — `publicar/community/shared/hooks/useCommunityDraftSession.ts` (COM+CLA); `publicar/busco/shared/buscoQuickDraft.ts`; mascotas quick draft under `publicar/mascotas-y-perdidos/shared/`; `en-venta/preview/enVentaPreviewDraft.ts` + `enVentaPreviewDraftIdb.ts`; `publicar/viajes/{negocios,privado}/lib/useViajes*Draft.ts`.
- **3 unsaved guard (ENV only)** — `en-venta/publish/useEnVentaPublishLeaveGuard.ts`. Repo-wide `beforeunload` grep returns 16 files; **none** under `app/(site)/publicar/`.
- **5 preview → edit** — `comunidadPublishedQuickToDraft.ts`, `clasesPublishedQuickToDraft.ts`, `mascotasPerdidosPublishedQuickToDraft.ts`, `buscoPublishRoutes.ts:11`, en-venta `buildEnVentaPreviewModel.ts`, viajes `ViajesNegociosApplicationShell.tsx:41-74`.
- **10 phone/SMS/WhatsApp** — token sweep on `origin/main`: COM 61 `sms` / 41 `whatsapp`; BUS 34/28; MAS 30/21; CLA 8/5; ENV 31/94+133 `WhatsApp`; VIA 3/90. ⚠ international-digit gap persists (B5-09).
- **14 websites/social** — COM 35 `socialLinks` + 26 `SocialLinks`; CLA 10; ENV `FaFacebook/FaInstagram/FaTiktok/FaYoutube` at `EnVentaAnuncioLayout.tsx:31`. BUS/MAS: zero social tokens.
- **15 CTA connection hub** — `git grep -ln "digitalContact/humanConnection" origin/main -- app/` → in-scope consumers are exactly `publicar/busco/components/BuscoQuickAdCanvas.tsx`, `publicar/community/shared/lib/communityContactCtas.ts`, `publicar/community/shared/preview/CommunityContactCanvas.tsx` (COM+CLA), `publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx`. **ENV and VIA import it nowhere.** Separately, `connectionHubCtaDispatch` has only 3 importers repo-wide — `anuncio/[id]/page.tsx:2560` (unreachable for all five lanes, see 04D §4.2), `ofertas-locales/OfertasLocalesPublicDetailView.tsx`, `publicar/bienes-raices/.../BrAgenteResContactSidebar.tsx`.
- **16 translate ad** — `{translateControl}` is rendered **before** every bespoke early return: `anuncio/[id]/page.tsx:1362` (BUS), `:1387` (MAS), `:1409` (COM+CLA), `:1494` (ENV). Built from `TranslateAdControl` `:51` + `requestAdTranslation` `:52` + `useAnuncioListingTranslation` `:53`, rendered `:699`. VIA never routes through this page → ❌.
- **21 location/directions** — COM+CLA share `publicar/community/shared/lib/communityContactCtas.ts` (`buildCommunityMapQuery`, `googleMapsSearchUrl`, imported `anuncio/[id]/page.tsx:34`); BUS carries 3 `locationPrivacy` + 3 `Directions` tokens; MAS 3 `Directions`; ENV 9 `Directions` + 6 `directions` + `EnVentaLocationFauxMap.tsx`. CLA has zero `Directions` tokens of its own → ❌.
- **23b share** — `CommunityQuickPublishedDetailPage.tsx:164,172,190,198` (`trackCommunityListingShare` on `native_share` and `copy_link`); ENV `EnVentaEngagementRow.tsx:6` `LeonixShareButton` + `trackEnVentaListingShareGlobal`. BUS: no share symbol anywhere in `BuscoPublishedDetailPage.tsx`.
- **23c report** — `BuscoPublishedDetailPage.tsx:12,106-127,138`; `CommunityQuickPublishedDetailPage.tsx:13,201+`; ENV `EnVentaListingReportDrawer.tsx:98` → `app/api/clasificados/en-venta/report/route.ts`.
- **24 analytics** — `comunidadClasesBuscoGlobalAnalytics.ts` consumers: `BuscoPublishedDetailPage.tsx`, `CommunityQuickAnuncioDetail.tsx`, `CommunityQuickPublishedDetailPage.tsx`, `ClasesPublishedQuickAd.tsx`, `ClasesQuickAdCanvas.tsx`, `CommunityContactCanvas.tsx`, `ComunidadPublishedQuickAd.tsx`, `ComunidadQuickAdCanvas.tsx`, `app/lib/analytics/client/listingEngagementRecorder.ts`. ENV reference `enVentaGlobalAnalytics.ts` consumers: `EnVentaAnuncioLayout.tsx`, `EnVentaListingReportDrawer.tsx`, `EnVentaResultListingCard.tsx`, `EnVentaEngagementRow.tsx`. Cites `10_ANALYTICS_EVENT_COVERAGE.md:178-182`.
- **29 active edit / 30 republish** — shared narrow-patch editor `app/(site)/dashboard/lib/ownerListingsLifecycleClient.ts:36-50` (`.update(patch)`, owner-scoped, same-row) for all five; viajes `viajesStagedListingsDbServer.ts:196-208`. Cites `06_DATA_ROUND_TRIP_FIELD_AUDIT.md:447-448`. ⚠ TRUE for **safety**, scope-limited by design (`06:141`).
- **33 mobile/PWA** — site-wide, inherited by every lane: `app/manifest.ts`, `public/manifest.webmanifest`, `public/sw.js`.
- **34 security/RLS** — `20260421130001_listings_enable_rls_full_policies.sql:20,34,45,54,68,78,84-85,91`; viajes `20260410180000_viajes_staged_listings.sql:68` (`owner_user_id = auth.uid()`).

### N-A justifications (⬜)

| Row | Lanes | Justification |
|---|---|---|
| checkout, promo | COM CLA BUS MAS ENV | Genuinely free: `priceCents:0`, `billingMode:"free"`, `stripeEligible:false`, `promoEligible:false` (matrix `:380-475`). `validateRevenueCheckoutRequest` rejects on `stripeEligible !== true` (`:526`). Clases' $24.99 SKU is documented-dormant (`publicar/clases/page.tsx:5`). Nothing to checkout; nothing to discount. |
| languages spoken | BUS MAS | A wanted-ad and a lost-pet notice have no service provider; "languages spoken" is a business-profile attribute. (COM/CLA/ENV/VIA scored ❌, not N-A — a class instructor, event organizer, seller and travel operator all plausibly have one.) |
| google / yelp | COM CLA BUS MAS ENV | External business-reputation embedding presupposes a business listing. None of these five lanes publishes a business entity. Applicable to VIA negocio → ❌ there. |
| business hub | COM CLA BUS MAS ENV | Same reason. The only `BusinessHub` token in scope is `en-venta/shared/components/EnVentaLocationFauxMap.tsx`, which is a map component, not a hub. Applicable to VIA negocio → ❌ (the worktree's `ViajesOfferBusinessHub` is the missing piece). |
| VIAJES has only 1 N-A | — | Viajes is a commercial lane with a business profile, a paid SKU on `origin/main`, and a public marketplace surface. Almost nothing is genuinely inapplicable — which is why its FALSE count is 19. |

### ⚠ Note on row 17 (ES/EN)

Scored ❌ for all five community lanes **despite** broad `lang` plumbing, because the **results entry point**
— the first surface most visitors hit — discards the stored `leonix_lang` preference:
`BuscoResultsClient.tsx:91`, `CommunityListingsResultsClient.tsx:63` (serves both COM and CLA),
`EnVentaResultsClient.tsx:117`, `MascotasPerdidosResultsClient.tsx:66`, all
`sp?.get("lang") === "en" ? "en" : "es"`. The canonical helpers (`navCopyLang`, `resolveRouteLang`) exist and
are used elsewhere. Viajes scores ✅ because its results page resolves lang server-side.

---

# PART 3 — REFERENCE-IMPLEMENTATION LEDGER (e)

**Mandatory for every ❌ above.** Format:
`PROVEN REFERENCE EXISTS | REFERENCE CATEGORY | REFERENCE PATH | TARGET PATH | DIFFERENCE | ACTION`.
Per instruction, **En Venta / Varios is preferred as reference** for analytics and for the shared community
patch-editor pattern.

### R-01 · unsaved guard — COM, CLA, BUS, MAS, VIA
**YES** | **en-venta** | `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts` |
`app/(site)/publicar/{comunidad,clases,busco,mascotas-y-perdidos,viajes}/**` |
No `beforeunload` handler anywhere under `app/(site)/publicar/`; a mid-application tab close loses the draft
with no warning | **ADOPT EXISTING**

### R-02 · video — COM, CLA, BUS, MAS, VIA
**YES** | **en-venta** | `EnVentaAnuncioLayout.tsx` + `listing/EnVentaMediaGallery.tsx` (201 `VideoUrl` / 133 `videoUrl` tokens); `listings.mux_playback_id` read at `anuncio/[id]/page.tsx:1516` |
the four community lanes' canvases and `viajes` offer detail |
Community canvases render images only; no video URL field, no Mux playback, no embed. VIA has 6 `videoUrl` tokens but no gallery integration |
**ADOPT EXISTING** (COM/CLA/BUS/MAS) · **NET NEW** for VIA's V2 gallery unless the worktree's `ViajesOfferDetailGallery` covers it

### R-03 · rich correo — COM, CLA, BUS, MAS, VIA
**YES** | **en-venta** | `app/clasificados/lib/LeonixCorreoLeadModal.tsx`, imported `EnVentaAnuncioLayout.tsx:19` |
community bespoke detail pages + `viajes/oferta/[slug]` |
Community lanes expose only a raw `mailto:`; no structured lead capture, no lead row, no owner notification |
**ADOPT EXISTING**

### R-04 · languages spoken — COM, CLA, ENV, VIA
**YES** | **autos (dealer)** | `app/lib/clasificados/autos/autosDealerLanguages.ts` + `app/lib/business/languages.ts` |
all four |
`app/lib/business/languages.ts` exists as a shared primitive but no community/en-venta/viajes surface imports it |
**ADOPT EXISTING**

### R-05 · websites / social — BUS, MAS
**YES** | **comunidad** (nearest peer, same canvas family) | `publicar/community/shared/preview/CommunityContactCanvas.tsx` (35 `socialLinks` tokens); validator `app/lib/digitalContact/digitalContactSocialLinks.ts` |
`publicar/busco/components/BuscoQuickAdCanvas.tsx`, `publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx` |
Zero social tokens in either lane; both already import `digitalContact/humanConnection`, so the sibling module is one import away |
**ADOPT EXISTING**

### R-06 · CTA connection hub — ENV, VIA
**YES** | **comunidad / busco / mascotas** (in-batch) and **ofertas-locales** (dispatch side) | `publicar/community/shared/preview/CommunityContactCanvas.tsx`; dispatch `app/lib/analytics/client/connectionHubCtaDispatch.ts` consumed at `ofertas-locales/OfertasLocalesPublicDetailView.tsx` |
`en-venta/listing/EnVentaAnuncioLayout.tsx`, `clasificados/viajes/oferta/[slug]/**` |
Neither imports `digitalContact/humanConnection`. ENV additionally cannot reach `anuncio/[id]/page.tsx:2560` because it returns early at `:1487` |
**ADOPT EXISTING** — note this is the one axis where the reference lane is *behind* the community lanes

### R-07 · translate ad — VIA
**YES** | **the generic anuncio shell (all 5 community lanes)** | `app/components/translation/TranslateAdControl.tsx` + `app/lib/translation/requestAdTranslation.ts` + `app/api/translate-ad/route.ts`; mounted `anuncio/[id]/page.tsx:699`, passed through every bespoke branch |
`clasificados/viajes/oferta/[slug]/page.tsx`, `clasificados/viajes/negocio/[slug]/page.tsx` |
Viajes has 9 `TranslateAd` tokens but never routes through the shell that mounts the control |
**ADOPT EXISTING**

### R-08 · ES/EN (stored preference) — COM, CLA, BUS, MAS, ENV
**YES** | **the shared language module, already used elsewhere** | `app/lib/language.ts` (`navCopyLang`, `resolveRouteLang`); lane helpers `busco/shared/buscoShellCopy.ts`, `mascotas-y-perdidos/shared/mascotasPerdidosShellCopy.ts` |
`BuscoResultsClient.tsx:91`, `CommunityListingsResultsClient.tsx:63`, `EnVentaResultsClient.tsx:117`, `MascotasPerdidosResultsClient.tsx:66` |
Bare `sp?.get("lang") === "en"` discards the `leonix_lang` cookie/localStorage preference |
**FIX REGRESSION** — ⚠ the fix is **already written** in `245a70f1` (ref `e3956df8`, not in prod). This is a *merge*, not an implementation.

### R-09 · community trust — all six
**YES** | **site-wide component, zero lane adoption** | `app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx`, `app/lib/leonixCommunityTrust/{leonixEndorsementClient,leonixEndorsementServer}.ts` |
every lane in this batch |
The module exists and is wired to saved-search infrastructure, but no community/en-venta/viajes surface imports it |
**ADOPT EXISTING**

### R-10 · google / yelp — VIA
**NO** | — | **no reference exists anywhere in the repo** | `clasificados/viajes/negocio/[slug]/**` |
Repo-wide grep for `googlePlace` / `yelp` in lane trees returns nothing. There is no proven implementation to copy |
**NET NEW**

### R-11 · address verifier — all six
**NO (dead reference)** | — | `app/lib/businessAddress/{businessAddressContract,Directions,Normalize,Privacy,Provider}.ts` + `examples/comidaLocalAddressMappingExample.ts` |
every lane |
The modules exist but `git grep -ln "lib/businessAddress" origin/main -- app/` returns **count 0** — no importer anywhere in the repo. Independently re-verified this batch; confirms the prior batch's G23/G24 finding. A reference that nothing consumes is not a proven reference |
**NET NEW** (integration work; the primitives are already written but unproven in any live path)

### R-12 · location privacy / directions — CLA, VIA
**YES** | **comunidad** (directions) | `publicar/community/shared/lib/communityContactCtas.ts` (`buildCommunityMapQuery`, `googleMapsSearchUrl`), consumed `anuncio/[id]/page.tsx:34` |
`clasificados/clases/**`, `clasificados/viajes/oferta/[slug]/**` |
CLA shares the community module but renders no Directions affordance of its own; VIA has no directions token at all. Note the *privacy* half has no live reference anywhere (see R-11) |
**ADOPT EXISTING** (directions) · **NET NEW** (privacy)

### R-13 · saved search — all six
**YES** | **autos / bienes-raices / rentas** | `app/lib/saved-search/` (28 modules incl. `savedSearchCanonicalize.ts`, `savedSearchServerCrud.ts`, per-category adapters + matchers + delivery resolvers); UI `app/(site)/clasificados/components/savedSearch/SavedSearchButton.tsx`; API `app/api/saved-search/route.ts`, `app/api/saved-search/[id]/route.ts`; dashboard `app/(site)/dashboard/busquedas-guardadas/page.tsx` |
`{comunidad,clases,busco,mascotas-y-perdidos,en-venta,viajes}` results clients |
The generic engine, the shared button, the API and the dashboard page all exist. Each new lane needs an adapter + matcher + delivery resolver following the three existing triplets. Cites `14_SEARCH_..._AUDIT.md` |
**ADOPT EXISTING** (per-lane adapter triplet against a proven engine)

### R-14 · save / like — COM, CLA, BUS, MAS, VIA
**YES** | **en-venta** | `en-venta/shared/components/EnVentaEngagementRow.tsx:4-11` — `LeonixLikeButton`, `LeonixSaveButton`, `resolveListingsTableSavedListingKey` (`app/lib/listingSaveDbKey.ts`), `trackEnVentaLikeGlobal` / `trackEnVentaSaveGlobal`. Tables `user_saved_listings` (`20250311000004`), `user_liked_listings` (`20260506200000`) |
the four community bespoke detail pages + viajes offer detail |
**Same `listings` table, same `owner_id`, same save-key resolver** — the four community lanes can reuse `resolveListingsTableSavedListingKey` verbatim. Nothing lane-specific blocks it |
**ADOPT EXISTING** — lowest-effort, highest-symmetry item in this ledger

### R-15 · share — BUS, MAS, VIA
**YES** | **comunidad / clases** (nearest) and **en-venta** (canonical) | `CommunityQuickPublishedDetailPage.tsx:164,172,190,198` (`trackCommunityListingShare`, `native_share` + `copy_link`); ENV `LeonixShareButton` via `EnVentaEngagementRow.tsx:6` |
`busco/BuscoPublishedDetailPage.tsx`, `mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx`, `clasificados/viajes/oferta/[slug]/**` |
BUS already imports the *same analytics module* (`comunidadClasesBuscoGlobalAnalytics`) that exports `trackCommunityListingShare` — the emitter is present, only the UI is missing. MAS imports neither |
**ADOPT EXISTING**

### R-16 · report — MAS, VIA
**YES** | **en-venta** (canonical, with an API route) and **busco / community** (in-family) | ENV `en-venta/listing/EnVentaListingReportDrawer.tsx:98` → `app/api/clasificados/en-venta/report/route.ts`; in-family `BuscoPublishedDetailPage.tsx:12,106-127`; shared component `app/(site)/clasificados/components/LeonixInlineListingReport.tsx` (currently only consumed by `autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`) |
`mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx`, `clasificados/viajes/oferta/[slug]/**` |
MAS's detail page is 68 lines with no report affordance at all — in the category most exposed to scam and spam posts. `LeonixInlineListingReport` is a drop-in |
**FIX REGRESSION** for MAS — ⚠ **already written** in `245a70f1` (ref `e3956df8`, not in prod), which adds exactly this import and a `<LeonixInlineListingReport listingId={listing.id} lang={lang} />` block · **NET NEW** for VIA

### R-17 · analytics — MAS, VIA
**YES** | **EN VENTA — the designated reference** | `app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics.ts` (canonical `listings`-backed emitter set, per `10_ANALYTICS_EVENT_COVERAGE.md:159,179`). In-family sibling: `app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics.ts` (`SOURCE_TABLE="listings"` `:10`) |
`mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx:49-51`; `clasificados/viajes/lib/viajesPublicIntegration.ts:27-30` |
**MAS**: writes only `addListingView` (Recently Viewed); emits nothing to `listing_analytics`. It is on the **same `listings` table with the same `owner_id`** as the three lanes that already use `comunidadClasesBuscoGlobalAnalytics` — the emitter needs no new plumbing. **VIA**: `viajesTrack` is a literal no-op with `// TODO: connect to shared trackEvent` at `:29`; consent gating (`viajesAnalyticsAllowed`) is already correct, and `viajes_staged_listings.id` / `owner_user_id` are resolver-ready per `10:181` |
**FIX REGRESSION** for MAS — ⚠ **already written** in `245a70f1` (adds `trackCommunityListingView` with `category: "mascotas-y-perdidos"`) · **ADOPT EXISTING** for VIA (wire `viajesTrack` to the En Venta emitter shape)

### R-18 · related listings — COM, CLA, BUS, MAS, VIA
**YES** | **en-venta** | `en-venta/listing/EnVentaRelatedRail.tsx`, imported `EnVentaAnuncioLayout.tsx:46`. Cross-family: `RentasSameCompanyListingsSection`, `BrRelatedAgentPropertiesSection`, `BrSimilarOtherClientPropertiesSection` |
the four community bespoke detail pages + viajes offer detail |
Same `listings` table, same `category` column — a related rail is a category+city query the community lanes already run in their results clients. VIA's worktree has `ViajesOfferRelatedRails` + `viajesOfferDetailRelatedServer.ts` |
**ADOPT EXISTING** (COM/CLA/BUS/MAS) · **FIX REGRESSION** for VIA (rescue from `f563cdf3`)

### R-19 · business hub — VIA
**YES (unpushed)** | **viajes worktree** | `f563cdf3`: `ViajesOfferBusinessHub.tsx` + `lib/resolveViajesProviderProfileFromStagedServer.ts` |
`origin/main:app/(site)/clasificados/viajes/negocio/[slug]/page.tsx:42` |
`origin/main` has no business hub and the profile route is a hard 404 in production |
**FIX REGRESSION** — rescue by forward-port (see 04D §2.5)

### R-20 · SEO — COM, CLA, BUS, MAS
**YES** | **en-venta** | `en-venta/seo/enVentaJsonLd.ts` (`enVentaClassifiedAdJsonLd`) + `app/lib/seo/breadcrumbJsonLd.ts`, both consumed `EnVentaAnuncioLayout.tsx:47-48`; `export const metadata` in `en-venta/{page,results/page,preview/page}.tsx` |
`clasificados/{comunidad,clases,busco,mascotas-y-perdidos}/**` |
Zero `metadata` / `generateMetadata` and zero JSON-LD across all four lanes — no title, no description, no structured data on any landing, results or detail surface |
**ADOPT EXISTING**

### R-21 · checkout / promo — VIA
**YES** | **servicios / restaurantes / autos-dealer / rentas** | `revenueServiciosFulfillment.ts`, `revenueAutosDealerFulfillment.ts`, `revenueRentasFulfillment.ts`, `revenueClasesFulfillment.ts`; route `app/api/revenue-os/checkout/route.ts`; validator `revenuePricingMatrix.ts:526` |
`viajes_business_monthly` (`revenuePricingMatrix.ts:476-491`) — advertised at `categoryPublishCheckpoints.ts:786,794,813,819` |
**No `revenueViajesFulfillment.ts` exists.** All four `viajes_business_monthly` references on `origin/main` are the definition plus three display reads. The checkpoint advertises $399/mo + coupon eligibility with no collection path |
⚠ **The correct ACTION is NOT to build checkout.** The owner locked Viajes business FREE on 2026-08-25 (`d1447ae7` + `6d736840`, unintegrated). **ACTION: FIX REGRESSION** — integrate the free-lane catalog and the free-variant checkpoint card, which removes the $399 label rather than implementing a charge for it.

---

# PART 4 — WHAT PRODUCTION LACKS, BY MISSING COMMIT

| Missing commit | Ref status | Concrete production gap it closes |
|---|---|---|
| `245a70f1` | in `e3956df8`, **not in `origin/main`** | Comunidad/Clases detail-page expiry gate + Clases discovery expiry (B5-05); Mascotas analytics + Report (B5-06, R-16, R-17); stored-language fix on 4 results clients (B5-10, R-08); `EnVentaAnuncioLayout` + `SellerContactSection` + `categoryLifecycleAdapters` + 3 quick-form adoptions |
| `0e2f9b17` | in `e3956df8`, **not in `origin/main`** | WhatsApp international-digit gap in `enVentaContactActions.ts` and `humanConnection/nativeChannelHrefs.ts`; Report consolidation (−87 lines) on `anuncio/[id]/page.tsx`; verifier `verify-whatsapp-report-shared-surface-sweep.ts` (B5-09) |
| `13b0d172` | in `e3956df8`, **not in `origin/main`** | Empleos/Ofertas adoption — out of lane scope, but touches shared `dashboard/lib/ownerEntityCapabilityRegistry.ts` |
| `f67ee268` | in `e3956df8`, **not in `origin/main`** | Rentas Recently-Viewed + Report; verifier `verify-family2-bienes-rentas-adoption.ts` |
| `d1447ae7` + `6d736840` + `8fef4d26` + `c0912a71` | branch `globalization-release-reconcile-2026-08-14`, **not in `origin/main`** | Free Viajes + free community coupons owner lock; free-variant checkpoint card; `410 package_retired_now_free` checkout guard; `billingMode === "free"` badge fix (B5-03, B5-11, R-21) |
| `078c806c` | same branch, **not in `origin/main`** | Server-owned canonical `listing_source`; removes client-trusted `body.sourceTable` from checkout consent / attempt-key / intro-discount resolution |
| `f563cdf3` + 54 uncommitted files | **UNPUSHED, single local worktree** | The entire Viajes public-experience rebuild — DB-backed negocio profiles, Offer Model V2, decomposed detail, V2 publisher, 2 API routes, local SEO, QA harness (B5-02, B5-04, R-19) |

**Net:** of the 20 ❌ rows that are not simply un-built, **6 are already-written code on an unmerged ref**
(R-08, R-16 and R-17 for MAS via `245a70f1`; R-19 and R-21 via the branch/worktree; B5-09 via `0e2f9b17`).
The dominant remediation lever in this batch is **integration, not implementation.**

---

# PART 5 — EVIDENCE GAPS SPECIFIC TO THIS FILE

1. **Adoption scoring is import-and-token based**, cross-checked by reading the dispatch structure of
   `anuncio/[id]/page.tsx` and each bespoke detail component's import block. A feature reached through an
   unusual indirection could be scored ❌ when it is in fact wired. All such errors bias toward
   **under-reporting TRUE**.
2. **Token counts** (`sms`, `whatsapp`, `share`, `gallery`, …) are `git grep -oE` occurrence counts over each
   lane's directory set, used only as corroboration for a decision already grounded in a named import. The
   `share` token in particular is noisy (it matches `shared/` path segments) and was **not** used on its own
   to score any row.
3. **`app/(site)/publicar/community/` has no routable page** — verified by directory listing (no `page.tsx`
   anywhere beneath it) and by `categoryRouteRegistry.ts:1236-1241`. It is a shared library imported by both
   `/publicar/clases/quick` and `/publicar/comunidad/quick`. Rows scored for COM and CLA via this directory
   are therefore correctly attributed to both.
4. **Migration application state unverified** (see 04D §8.3). The `MIGRATIONS` rows list files that exist in
   `supabase/migrations/`, not files proven applied to the production database.
5. **`e3956df8` divergence is 63 commits; only 4 were examined.** **59 commits remain uncatalogued** and may
   contain further adoption work absent from production. Any lane scored ❌ here could already be ✅ on that
   ref. **This is the single largest open gap and should be the first follow-up.**
