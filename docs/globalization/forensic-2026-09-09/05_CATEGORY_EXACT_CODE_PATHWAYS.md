# 05 — CATEGORY EXACT CODE PATHWAYS (MASTER)
Ref: `origin/main` = `a0a47839`. File-by-file hops per category.
Per-family detail: `05A_SERVICIOS_RESTAURANTES_COMIDA_PATHWAYS.md` ·
`05B_COMMUNITY_LANES_VIAJES_PATHWAYS.md` · route/storage maps in `04B` and `04C`.

**Purpose:** the Owner asked where the code actually lives in a repository that has become hard to
navigate. This is that answer.

---

## THE SINGLE MOST IMPORTANT NAVIGATION FACT

Publish flows and public pages live in **different trees**, and the split is deliberate but undocumented:

```
app/(site)/publicar/<category>/          application / draft / preview  (autos, empleos, community)
app/(site)/clasificados/publicar/<cat>/  application  (servicios, restaurantes, BR, rentas, ofertas)
app/(site)/clasificados/<category>/      public detail, results, landing
app/(site)/<category>/                   Servicios ONLY: profile shell + business hub card
app/lib/clasificados/<category>/         server queries, mappers, analytics
app/lib/listingPlans/                    ALL revenue, pricing, entitlement, placement
app/lib/listingIdentity/                 the canonical category + route registry
app/(site)/dashboard/                    owner surfaces
app/admin/                               admin surfaces
```

`tsconfig.json:25` maps `@/app/clasificados/*` to `./app/(site)/clasificados/*`, so an **import path
does not match the on-disk path**. This cost two audit agents significant time.

---

## SERVICIOS
```
/clasificados/servicios                      landing/ServiciosLandingPage.tsx
  -> /clasificados/servicios/results         resultados/page.tsx:99   (/results is a re-export)
  -> [!] NO CHECKPOINT (GAP-049)             publicarGatewayResolver.ts:99 falls through
  -> /publicar/servicios                     clasificados/publicar/servicios/...
  -> draft: sessionStorage                   serviciosPublishClient.ts:78-81
  -> /clasificados/publicar/servicios/preview
  -> POST /api/clasificados/servicios/publish   route.ts:298-310 (.eq slug :467 | insert :493-507)
  -> servicios_public_listings               owner_user_id · leonix_ad_id via DB trigger
  -> /clasificados/servicios/[slug]          page.tsx:212 branches:
        :213 ServiciosProfessionalProfileShell   |   :220 ServiciosProfileView
      business hub -> app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx (757 L)
  -> dashboard -> OwnerEntityWorkspace.tsx:33
  -> edit -> serviciosPublishedToApplicationDraft.ts        [!] DESTRUCTIVE (GAP-043)
  -> republish -> same slug -> [!] duplicate row if session lost (GAP-048)
```

## RESTAURANTES — the cleanest pathway in the platform
```
/clasificados/restaurantes                   page.tsx:6-16 (server-fetches inventory)
  -> /clasificados/restaurantes/results      resultados/RestaurantesResultsShell.tsx:99  [categoryStandardV2]
  -> /publicar/restaurantes
  -> POST /api/clasificados/restaurantes/publish     (durable draft_listing_id :325)
  -> restaurantes_public_listings
  -> /clasificados/restaurantes/[slug]       page.tsx:134 -> RestauranteAdStoryPreview.tsx:253
      business hub -> shell/RestaurantContactHub.tsx (637 L)
  -> dashboard/restaurantes/page.tsx:270-315   hydrates via listingJsonToDraft (mapper :292)
  -> edit -> republish -> SAME ROW  [OK]
```

## COMIDA LOCAL
```
/clasificados/comida-local                   page.tsx:40   <-- THE LANDING **IS** THE RESULTS PAGE
  -> /publicar/comida-local/checkpoint -> /publicar/comida-local
  -> POST /api/clasificados/comida-local/publish     (durable draft_listing_id :132)
  -> comida_local_public_listings            [!] selects payment_status, never uses it (GAP-013)
  -> /clasificados/comida-local/[slug]       -> ComidaLocalDetailShell.tsx:120
  -> edit -> republish -> SAME ROW  [OK]
  [!] no results route · no pagination (300-row cap) · no JSON-LD · no video/flyer · no e2e spec
```

## BIENES RAICES (3 lanes) — all write `listings`
```
/clasificados/bienes-raices -> /resultados   (/results is permanently redirected)
  -> /clasificados/publicar/bienes-raices/{privado|negocio}
  -> draft: privado bienesRaicesPrivadoDraft.ts · negocio brAgenteResDraftMediaIdb.ts (IndexedDB)
  -> /clasificados/bienes-raices/preview/{privado|negocio}
  -> leonixPublishRealEstateListingCore.ts   [!] privado excluded from pending-row reuse :497-499
  -> listings (owner_id)
  -> /clasificados/anuncio/[id]   <-- 2,635-LOC monolith · BR dispatch :1431 · RETURNS :1462
      negocio shell -> BienesRaicesNegocioLiveDetailShell.tsx:473
                    -> AgenteIndividualResidencialPreviewPage.tsx:796
                    -> BrAgenteResContactSidebar.tsx (688 L)
      [!!] NO VIEW ANALYTICS — the tracker mounts only from EnVentaAnuncioLayout.tsx:774,
           which sits at :1479, after the BR return at :1462  (GAP-054)
  -> child gate: fetchBrPublishedListingsBrowser.ts:86-99 -> brPublicChildParentVisibility.ts:51-74
                 and again at anuncio/[id]/page.tsx:621-647
  -> edit -> POST /api/clasificados/bienes-raices/listing-edit     (UPDATE :219-222)
      [!!] business_meta is an UNCONDITIONAL whole-column replace at :177  <-- the GAP-002 signature
```

## RENTAS (2 lanes)
```
/clasificados/rentas -> /results              (/resultados is a HARD 404 — no redirect exists)
  -> /clasificados/publicar/rentas/{privado|negocio}
  -> /clasificados/rentas/preview/{privado|negocio}
  -> listings (owner_id)
  -> /clasificados/rentas/listing/[id]:41     <-- canonical; renders NO business section
       (the negocio rail appears only via the anuncio monolith at :2189)
  -> mapListingRowToRentasPublicListing.ts    :279-291 lifecycle · :572 recencyRank %100 wrap
      [!] expires_at NULL  =>  listing is INVISIBLE (expirationRequired:true)
  -> edit -> POST /api/clasificados/rentas/listing-edit     (UPDATE :141-143)
      [!!] business_meta whole-column replace at :132 — negocio AND privado (GAP-040)
```

## AUTOS (3 lanes) — the strongest parent/child implementation in the platform
```
/clasificados/autos -> /clasificados/autos/results
  -> app/(site)/publicar/autos/{privado|negocios}          <-- app tree
  -> draft: useAutoPrivadoDraft.ts (localStorage + IndexedDB)
  -> app/(site)/clasificados/autos/{privado|negocios}/preview   <-- public tree
  -> autos_classifieds_listings (owner_user_id · UUID is the permalink)
  -> /clasificados/autos/vehiculo/[id] -> AutosLiveVehicleClient.tsx:203
      dealer -> AutosNegociosDealershipPreviewPage.tsx:313 -> PreviewDealerBusinessStack.tsx (793 L)
      [!] NOT DealerBusinessStack.tsx (504 L) — that one is publish-flow only
  -> parent gate: autosPublicChildParentVisibility.ts:40-62
      enforced at listing service :204-205, :493-494, :786-791 + saved search :28
      <-- 3 enforcement points, the best in the repository
  -> dealer parent edit -> whole-blob round trip  [OK] SAFE
  -> child edit -> {...parent, ...childSlice}   [!!] missing fields INHERIT THE PARENT (GAP-042)
  -> privado edit -> [X] NO SAVE PATH AT ALL (GAP-045)
```

## EMPLEOS (3 lanes) — the platform's worst identity handling
```
/clasificados/empleos -> /publicar/empleos
  -> /clasificados/empleos/{quick|premium|feria}-preview
  -> buildEmpleosPublishEnvelope.ts:250   [!!] envelopeBase.listingId = null   <-- THE DEFECT
  -> empleosPublicListingsDbServer.ts:227    INSERTS A NEW ROW on every republish
  -> empleosRevenueCheckout.ts:60-68         opens a SECOND Stripe checkout => DOUBLE CHARGE
  -> empleos_public_listings (slug permalink)
  -> /clasificados/empleos/[slug]
  [!] preview -> "volver a editar" emits only ?from=publicar (empleosPublishRoutes.ts:22-25)
      => the next save inserts a duplicate
  [!] photos: picker -> readAsDataURL (EmpleosImageGalleryEditor.tsx:141)
      -> NO UPLOAD ROUTE EXISTS -> dropped at :46   (100% of photos lost)
  [OK] feria handles identity correctly — EmpleoFeriaApplicationClient.ts:428 is the in-category reference
```

## OFERTAS LOCALES (protected source — read only)
```
/clasificados/ofertas-locales -> /publicar/ofertas-locales
  -> AI flyer scan: /api/ofertas-locales/scan -> Gemini 2.5 flash/pro (Document AI OCR fallback)
  -> assets: VERCEL BLOB (not Supabase storage) — ofertasLocalesStoragePaths.ts:37
  -> oferta_local_items  (review_status needs_review, is_active false)
  -> /publicar/ofertas-locales/preview -> OfertasLocalesFlyerViewerModal.tsx  <-- FULL pdfjs viewer
  -> /dashboard/ofertas-locales/[id]/checkout -> /api/revenue-os/checkout
      [!] renders a promo field that can NEVER succeed (promoEligible:false)
  -> webhook -> revenueFulfillment.ts:172-273 -> auto-publish (flyer only) :228
  -> ofertas_locales
  -> /clasificados/ofertas-locales/[id] -> OfertasLocalesPublicDetailView.tsx
      [!!] :209-215 a bare "Open PDF" LINK · overlays disabled :160
           page navigation counts FILES not PAGES at :268, so a 12-page PDF gets none
      [!] exact address emitted unconditionally (GAP-005)
```

## COMMUNITY LANES (comunidad · clases · busco · mascotas · en-venta)
```
All five -> listings (owner_id) -> /clasificados/anuncio/[id]
  dispatch: :1359 busco · :1384 mascotas · :1406 clases+comunidad · :1479 en-venta
  [!!] ALL are EARLY RETURNS before the main body at :1559 — so LeonixShareButton (:2235)
       and dispatchConnectionHubCta (:2560) are UNREACHABLE for all five lanes
  publish canvases: publicar/{busco|community|mascotas-y-perdidos}/...Canvas.tsx
  edit: shared patch editor  [OK] SAFE on all five
  analytics: en-venta  = enVentaGlobalAnalytics.ts          <-- THE REFERENCE IMPLEMENTATION
             comunidad/clases/busco = comunidadClasesBuscoGlobalAnalytics.ts
             mascotas = NOTHING AT ALL (GAP-072)
  [!] clases bakes the address into description text — clasesPublishPayload.ts:69 (GAP-076)
```

## VIAJES
```
/clasificados/viajes -> viajes_staged_listings
  -> /clasificados/viajes/negocio/[slug]:42 -> notFound() unless viajesAllowCuratedDemoCatalog()
  -> viajesPublicInventory.ts  returns FALSE in production BEFORE reading any flag — deliberate,
     and the source comment says so explicitly
  -> data source: viajesNegocioProfileSampleData.ts:31 (zero .from() calls)
  => THE ROUTE IS BOTH UNREACHABLE AND 404 IN PRODUCTION (GAP-069)
  The only DB-backed provider resolver — resolveViajesProviderProfileFromStagedServer.ts —
  exists ONLY in the never-pushed worktree C:\projects\elaguila-website-viajes  (GAP-070)
```

---

## CROSS-CUTTING PATHWAY HAZARDS

| Hazard | Where |
|---|---|
| A 2,635-line public-detail monolith serving 8 categories by early return | `app/(site)/clasificados/anuncio/[id]/page.tsx` |
| Import paths that do not match disk paths | `tsconfig.json:25` |
| Two publish trees with no documented rule for which category uses which | `publicar/` vs `clasificados/publicar/` |
| Public page renders the `Preview`-prefixed component, not the plain one | Autos dealer |
| The canonical route renders less than the legacy route | Rentas negocio |
| The landing page *is* the results page | Comida Local |
| 446 `.md` files live inside `app/` | see `20` |
