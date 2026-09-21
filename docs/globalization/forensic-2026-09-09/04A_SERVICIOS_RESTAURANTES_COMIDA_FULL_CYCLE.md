# 04A — SERVICIOS · RESTAURANTES · COMIDA LOCAL — FULL-CYCLE CERTIFICATION

**REF DISCIPLINE.** Every finding in this document is read from **`origin/main`**, verified twice
during this audit:

```
git rev-parse origin/main   →  a0a4783971b42ea1d71ab2602d4720d0d590baf8   (start of audit)
git rev-parse origin/main   →  a0a4783971b42ea1d71ab2602d4720d0d590baf8   (immediately before writing)
git rev-parse HEAD          →  d09d979c1bdba40002ac5e985d6971ce6a87bb0f
git rev-list --count HEAD..origin/main  →  112     (primary tree is 112 commits STALE — not used)
Sealed September seal       →  e3956df8  "docs(globalization): record Wave 3 G09/G10 and G26 fixes as done"
```

Unless a line is explicitly labelled `[SEPT e3956df8]` or `[COMMIT <sha>]`, it is **`origin/main`
truth = production truth**.

**REUSED, NOT RE-DERIVED** (per instruction — cited, never re-proven):
`14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md` Part B (search/results mechanics) ·
`13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md` Part A (business hub adoption) ·
`10_ANALYTICS_EVENT_COVERAGE.md` §4/§5 (analytics emitters) ·
`11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md` (revenue/checkout/promo).

**OUT OF SCOPE BY INSTRUCTION.** The dashboard-edit-hydration → republish *field-loss* analysis
belongs to `06_DATA_ROUND_TRIP_FIELD_AUDIT.md` (separate agent). This document covers the edit /
republish hops only at the level of **which route, which action, does it write the same row**.

---

# PART 1 — ROUTE + STORAGE MAP

## 1.1 SERVICIOS

| Hop | Exact repo-relative path (`origin/main`) |
|---|---|
| LANDING | `app/(site)/clasificados/servicios/page.tsx` → `landing/ServiciosLandingPage.tsx` |
| RESULTS | `app/(site)/clasificados/servicios/resultados/page.tsx` (canonical) · `app/(site)/clasificados/servicios/results/page.tsx` (**plain ES re-export, no redirect, no canonical tag**) |
| CHECKPOINT / "Ver Más" | `app/(site)/clasificados/publicar/servicios/checkpoint/page.tsx` → `checkpoint/ServiciosCheckpointClient.tsx:39` → `getServiciosCheckpointCard` (`app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts:163`) rendered by `PaidPublishCheckpointCard` + `PaidPublishCheckpointModal` (`app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx:59,:121`) |
| APPLICATION | `app/(site)/publicar/servicios/page.tsx` → `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx` |
| — legacy redirect | `app/(site)/clasificados/publicar/servicios/page.tsx` → 302 to `…/checkpoint`; `app/(site)/servicios/publicar/page.tsx` → 302 to `/clasificados/publicar/servicios` |
| — ORPHAN application | `app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx` + `hooks/useServiciosApplicationDraftState.ts` + `lib/serviciosDraftStorage.ts` — **no page renders it** |
| PREVIEW | `app/(site)/clasificados/publicar/servicios/preview/page.tsx` → `ClasificadosServiciosPreviewClient.tsx` (VM: `preview/ServiciosProfessionalPreviewShell.tsx`) |
| — ORPHAN preview | `app/(site)/servicios/perfil/preview/page.tsx` → `ServiciosPreviewClient.tsx:9` reads `SERVICIOS_APPLICATION_DRAFT_STORAGE_KEY`, **which no live writer writes** |
| CHECKOUT | `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx:119` (config resolved by `app/lib/listingPlans/publishCheckoutCheckpoint.ts:238 resolvePublishCheckoutCheckpoint`) mounted at `ClasificadosServiciosPreviewClient.tsx:777`; Stripe start `startRevenueCategoryCheckout` (`:589`) |
| PUBLIC DETAIL | `app/(site)/clasificados/servicios/[slug]/page.tsx` → `ServiciosProfessionalProfileShell` (`:213`, template branch) OR `ServiciosProfileView` (`:220`); legacy `app/(site)/servicios/perfil/[slug]/page.tsx` 301s here |
| DASHBOARD | `app/(site)/dashboard/servicios/page.tsx` (dedicated) + `app/(site)/dashboard/mis-anuncios/*` |
| EDIT | `/publicar/servicios?source=dashboard&mode=listing-edit&listingId=…&leonixAdId=…&returnPanel=servicios` — built by `app/lib/listingIdentity/categoryRouteRegistry.ts` SERVICIOS_ADAPTER `editRoute`, and by `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts:88,:131` |
| ADMIN | `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` (+ `ServiciosAdminClient.tsx`, `actions.ts`, `_lib/serviciosAdminCanonicalAnalytics.ts`) · `app/admin/(dashboard)/clasificados/servicios/page.tsx` · `app/api/admin/servicios/listings/[id]/route.ts` |
| API ROUTES | `app/api/clasificados/servicios/publish/route.ts` · `…/manage/route.ts` · `…/my-listing(s)/route.ts` · `…/my-leads/route.ts` · `…/inquiry/route.ts` · `…/review/route.ts` · `…/analytics/route.ts` · `…/draft-media-upload/route.ts` · `…/dev-listings/route.ts` · `…/smoke-row/route.ts` · auth helper `…/lib/serviciosPublishServerAuth.ts` |
| PRIMARY TABLE | `public.servicios_public_listings` |
| OWNER FIELD | `owner_user_id` |
| LISTING UUID FIELD | `id` (uuid) — but **the publish route keys on `slug`, not `id`** (see 4.1) |
| LEONIX AD ID FIELD | `leonix_ad_id`, assigned by DB trigger `servicios_public_listings_leonix_ad_id_bi` (`supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql:169,:189`) — **not** by the app |
| MIGRATION FILE(S) | `20260402160000_servicios_public_listings.sql` · `20260402173000_…internal_group.sql` · `20260407140000_servicios_listing_status.sql` · `20260410200000_servicios_public_owner_user.sql` · `20260411120000_servicios_leads_reviews_analytics.sql` · `20260422190000_servicios_analytics_slug_nullable.sql` · `20260506150000_leonix_ad_id_all_classifieds.sql` · `20260507140000_viajes_staged_leonix_ad_id_and_listings_prefix_trav.sql` · `20260713153000_servicios_pending_payment_status_and_published_at.sql` |
| VERIFIER SCRIPT(S) | ~50 under `scripts/verify-servicios-*.mjs` / `smoke-servicios-*` / `serviciosLaunchProof.ts` / `servicios-public-listing-schema-smoke.ts` / `servicios-publish-media-smoke.ts` / `servicios-video-publish-smoke.ts` |
| E2E SPEC(S) | `e2e/servicios-smoke.spec.ts` · `e2e/servicios-auth-smoke.spec.ts` (fixture `scripts/fixtures/servicios-smoke-publish-state.json`) |

**PATH-ALIAS NOTE (as warned).** `tsconfig.json:25` maps `@/app/clasificados/*` → `./app/(site)/clasificados/*`,
so `@/app/clasificados/publicar/servicios/lib/...` and `@/app/servicios/...` resolve into the two
Servicios trees above. Servicios genuinely has **two** trees: the publish/discovery tree under
`app/(site)/clasificados/servicios/` + `app/(site)/clasificados/publicar/servicios/`, and the
public-profile render tree under `app/(site)/servicios/` (which owns
`ServiciosBusinessHubContactCard.tsx` and `resolveServiciosProfile.ts`).

## 1.2 RESTAURANTES

| Hop | Exact repo-relative path (`origin/main`) |
|---|---|
| LANDING | `app/(site)/clasificados/restaurantes/page.tsx` → `landing/RestaurantesLandingPage.tsx` |
| RESULTS | `app/(site)/clasificados/restaurantes/resultados/page.tsx` → `resultados/RestaurantesResultsShell.tsx` (only full V2 kit adopter — doc 14 §B.1) · `restaurantes/results/page.tsx` = **plain re-export, no redirect, no `metadata`, does not re-declare `dynamic`** |
| CHECKPOINT / "Ver Más" | `app/(site)/clasificados/publicar/restaurantes/page.tsx` → `RestaurantesSelectorClient.tsx:35` → `getRestaurantesCheckpointCards` (`categoryPublishCheckpoints.ts:54`) → `PublishEntryCheckpointStack` (`PublishEntryCheckpoint.tsx:262,:266`) |
| APPLICATION | `app/(site)/publicar/restaurantes/page.tsx` → `RestauranteApplicationClient.tsx` (+ `RestauranteApplicationSectionNav.tsx`, `RestauranteAmenitiesFormBlock.tsx`, `RestauranteExternalVideoUrlsSection.tsx`) |
| — model/state | `app/(site)/clasificados/restaurantes/application/*` (≈28 modules: `useRestauranteDraft.ts`, `restauranteDraftTypes.ts`, `restauranteDraftStorage.ts`, `restauranteDraftMedia*.ts`, `buildRestaurantePublishPayload.ts`, …) |
| PREVIEW | `app/(site)/clasificados/restaurantes/preview/page.tsx` → `RestaurantePreviewClient.tsx` (+ `preview/layout.tsx`) |
| CHECKOUT | `PublishCheckoutCheckpoint` at `RestaurantePreviewClient.tsx:436`; Stripe start `:260` |
| PUBLIC DETAIL | `app/(site)/clasificados/restaurantes/[slug]/page.tsx:8,:134` → `shell/RestauranteAdStoryPreview.tsx` → `shell/RestauranteDetailShell.tsx` (+ `shell/RestaurantContactHub.tsx`) |
| DASHBOARD | `app/(site)/dashboard/restaurantes/page.tsx` (dedicated hub) + `mis-anuncios` |
| EDIT | `/publicar/restaurantes?source=dashboard&mode=listing-edit&listingId=…&returnPanel=restaurantes` — `categoryRouteRegistry.ts` RESTAURANTES `editRoute`; helper `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:285`; coupon sub-flow `mode=coupon-edit` (`:291`) |
| ADMIN | `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx` · `app/api/admin/restaurantes/listings/[id]/route.ts` |
| API ROUTES | `app/api/clasificados/restaurantes/publish/route.ts` · `…/draft-media-upload/route.ts` |
| PRIMARY TABLE | `public.restaurantes_public_listings` |
| OWNER FIELD | `owner_user_id` (server-verified only — `publish/route.ts:310` comment) |
| LISTING UUID FIELD | `id`; the same-row key on republish is `listing_json.draftListingId` → row lookup at `publish/route.ts:325` |
| LEONIX AD ID FIELD | `leonix_ad_id`, allocated in-app by `allocateNextRestauranteLeonixAdId` (`publish/route.ts:442,:505`) |
| MIGRATION FILE(S) | `20260408120000_restaurantes_public_listings.sql` · `20260410193000_…owner_select.sql` · `20260505140000_…leonix_ad_id.sql` · `20260506150000_leonix_ad_id_all_classifieds.sql` · `20260508150000_restaurantes_status_archived.sql` · `20260703120000_restaurantes_pending_payment_status.sql` |
| VERIFIER SCRIPT(S) | ~35 `scripts/restaurantes-*`, `scripts/verify-restaurantes-*.mjs`, `scripts/gate-g3-*`, `restaurant-contact-hub-qa.ts`, `restaurante-preview-readiness-smoke.ts` |
| E2E SPEC(S) | `e2e/restaurantes-smoke.spec.ts` (+ dedicated runner `playwright.restaurantes.config.mjs`) |

## 1.3 COMIDA LOCAL

| Hop | Exact repo-relative path (`origin/main`) |
|---|---|
| LANDING | `app/(site)/clasificados/comida-local/page.tsx` (**landing IS results** — registry `resultsRoute` duplicates `entryRoute`, self-declared as a known limitation) |
| RESULTS | **NO dedicated results route exists.** Filters live at `components/ComidaLocalResultsFilters.tsx`; no `resultados/` or `results/` directory. |
| CHECKPOINT / "Ver Más" | `app/(site)/publicar/comida-local/checkpoint/page.tsx` → `app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx:91` → `getComidaLocalCheckpointCard` (`categoryPublishCheckpoints.ts:742`) |
| APPLICATION | `app/(site)/publicar/comida-local/page.tsx` → `ComidaLocalApplicationClient.tsx` (+ `ComidaLocalValidationPanel.tsx`, `components/ComidaLocalGalleryUpload.tsx`, `components/ComidaLocalImageUploadField.tsx`) |
| PREVIEW | `app/(site)/clasificados/comida-local/preview/page.tsx` → `ComidaLocalPreviewClient.tsx`; VM builder `app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts` |
| CHECKOUT | `PublishCheckoutCheckpoint` at `ComidaLocalPreviewClient.tsx:300`; Stripe start `:177` |
| PUBLIC DETAIL | `app/(site)/clasificados/comida-local/[slug]/page.tsx:16,:89` → `components/ComidaLocalPublicDetailClient.tsx:9,:36` → `components/ComidaLocalDetailShell.tsx:120` |
| DASHBOARD | **no dedicated hub** — `app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx` inside `/dashboard/mis-anuncios`; queries `comidaLocalDashboardQueries.ts` |
| EDIT | `/publicar/comida-local?edit=1&listingId=<uuid>&source=dashboard` — `categoryRouteRegistry.ts` COMIDA_LOCAL `editRoute`; edit context `app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts` |
| ADMIN | `app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx` + `actions.ts` (`updateComidaLocalPublicListingStatusAction`) + `app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx` / `comidaLocalAdminQueries.ts` / `mapComidaLocalAdminListing.ts` |
| API ROUTES | `app/api/clasificados/comida-local/publish/route.ts` · `…/lifecycle/route.ts` · `…/draft-media-upload/route.ts` |
| PRIMARY TABLE | `public.comida_local_public_listings` |
| OWNER FIELD | `owner_user_id` |
| LISTING UUID FIELD | `id`; same-row key is the row's stored `draft_listing_id` (`publish/route.ts:132-133`) |
| LEONIX AD ID FIELD | `leonix_ad_id`, allocated in-app by `allocateNextComidaLocalLeonixAdId` (`publish/route.ts:245`) |
| MIGRATION FILE(S) | `20260604120000_comida_local_public_listings.sql` (table + RLS `:90,:92,:97`) · `20260826120000_leonix_endorsement_votes_comida_local.sql` · `20260827190000_leonix_endorsement_votes_comida_local_br_rentas_reconcile.sql` |
| VERIFIER SCRIPT(S) | `scripts/comida-local-food-l2…l9c-*.ts` (19 gates) · `comida-local-food-p1/p2-*` · `comida-local-food-qa1-*` · `verify-comida-local-gate-d-targeted.ts` · `gate-pkgA-comida-local-editor-selftest.ts` · `comida-local-rest-food-selector1-audit.ts` |
| E2E SPEC(S) | **NONE.** No `e2e/*comida*` spec exists. |

---

# PART 2 — DRAFT + HARD REFRESH + UNSAVED GUARD (G05 / G06)

| | SERVICIOS | RESTAURANTES | COMIDA LOCAL |
|---|---|---|---|
| Draft store module | `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage.ts` | `app/(site)/clasificados/restaurantes/application/restauranteDraftStorage.ts` | `app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts` |
| Key | `leonix.clasificados.servicios.application.v1` (`:14`) | `restaurantes-draft` (`:15`) | `leonix:comida-local:draft:v1` (`:23`) |
| Medium | **sessionStorage** JSON + **IndexedDB** blobs (`SERVICIOS_DRAFT_MEDIA_NAMESPACE = "clasificados-servicios-v1"`, `:17`); one-time legacy localStorage migration (`:52-62`) | **sessionStorage** JSON + **IndexedDB** blobs (`restauranteDraftMedia.ts`); one-time legacy localStorage migration (`:53-63`) | **localStorage** only (`:336,:352,:363`) — **no IndexedDB media offload** |
| Autosave | in `ClasificadosServiciosApplication.tsx` | `application/useRestauranteDraft.ts` | `app/lib/clasificados/comida-local/useComidaLocalDraft.ts:47` (`AUTOSAVE_MS = 400`) |
| Hard refresh rehydrates? | **YES, same tab/session only.** sessionStorage dies with the tab. | **YES, same tab/session only.** | **YES, and survives tab close / browser restart** (localStorage) |
| Per-listing EDIT namespace isolated from new-ad draft? | **YES** — `app/lib/listingDrafts/draftWorkspaceContract.ts:153` `editNamespaceIsolated: true` | **YES** — `draftWorkspaceContract.ts:152` `editNamespaceIsolated: true` (keyed by `listingId` query context) | **YES in code** — `comidaLocalEditWorkspaceStorageKey(listingId)` (`comidaLocalDraftPersistence.ts:29`), consumed at `ComidaLocalApplicationClient.tsx:298` and `ComidaLocalPreviewClient.tsx:66`. ⚠ **`draftWorkspaceContract.ts:161` still records `editNamespaceIsolated: false` / "no edit surface yet (Gate 5)" — STALE REGISTRY ENTRY, code is ahead of the contract.** |
| Unsaved / leave guard | **SHARED** — `useBusinessApplicationLeaveGuard` (`app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts:35`), adopted at `ClasificadosServiciosApplication.tsx:17,:615` | **SHARED** — adopted at `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx:22,:213` | **SHARED** — adopted at `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx:22,:303` |
| Category fork of the guard? | **NO** | **NO** | **NO** |

**All three are on the canonical shared guard in `origin/main`.** The Sept-only commit `629c5a46`
"fix(br-rentas): adopt global application leave guard" touched **only** BR-Negocio, BR-Privado,
Rentas-Negocio, Rentas-Privado (4 files, `git show --stat 629c5a46`); it did **not** touch these
three, because these three already had it. **G06 = TRUE ×3 in production.**

**G05 residual risk (P2).** Servicios and Restaurantes drafts are `sessionStorage`-scoped: an owner
who closes the tab mid-application loses the whole draft, while Comida Local (localStorage) does not.
There is no server-side draft row for any of the three.

---

# PART 3 — PREVIEW + PREVIEW→EDIT (G07)

| | SERVICIOS | RESTAURANTES | COMIDA LOCAL |
|---|---|---|---|
| Preview route | `/clasificados/publicar/servicios/preview` | `/clasificados/restaurantes/preview` | `/clasificados/comida-local/preview` |
| Preview client | `preview/ClasificadosServiciosPreviewClient.tsx` | `preview/RestaurantePreviewClient.tsx` | `preview/ComidaLocalPreviewClient.tsx` |
| VM builder | `preview/ServiciosProfessionalPreviewShell.tsx` + `app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts` | `application/mapRestauranteDraftToShell.ts` → `shell/RestauranteDetailShell.tsx` | `app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts` |
| Shared preview-mode contract `b60801e2` | **ADOPTED** — imports `app/lib/listingIdentity/previewModeContract.ts` | **ADOPTED** | **ADOPTED** |
| noindex on preview | `PREVIEW_NOINDEX_METADATA` (shared) | `PREVIEW_NOINDEX_METADATA` (shared) | ⚠ **hand-rolled** `robots: { index:false, follow:false }` (`preview/page.tsx:8`) — same effect, not the shared constant |
| "Volver a editar" preserves state? | **YES** — one-shot handoff `SERVICIOS_PREVIEW_RETURN_KEY = "leonix.clasificados.servicios.previewReturn.v1"` (`lib/clasificadosServiciosPreviewHandoff.ts:17`), consumed on application remount, with a 30 s in-memory fallback (`:54-63`) | **YES** — both surfaces read/write the **same** `restaurantes-draft` sessionStorage key; no handoff object needed | **YES** — both read the same localStorage key; edit link rebuilt at `ComidaLocalPreviewClient.tsx:80-81` as `/publicar/comida-local?edit=1&listingId=…` |

`b60801e2` **IS contained in `origin/main`** (`git merge-base --is-ancestor b60801e2 origin/main` → yes).
Contract file: `app/lib/listingIdentity/previewModeContract.ts` (`resolvePreviewMode`,
`previewModeSuppressesBasePlanCheckout`, `previewModeIsListingBound`); 8 app importers, all three
target categories among them. **G07 = TRUE ×3.**

---

# PART 4 — PUBLISH MAPPER → API → DB

| | SERVICIOS | RESTAURANTES | COMIDA LOCAL |
|---|---|---|---|
| Client transport builder | `publicar/servicios/lib/buildServiciosPublishPayload.ts` → `buildServiciosPublishTransportBody` ; poster `lib/serviciosPublishClient.ts` `postServiciosPublishApi` | `restaurantes/application/buildRestaurantePublishPayload.ts` | `app/lib/clasificados/comida-local/comidaLocalPublishClient.ts` |
| Media resolve-before-publish | `lib/serviciosDraftPublishPrepare.ts` `resolveServiciosDraftMediaToRemoteUrls` | `application/restauranteDraftPublishPrepare.ts` | `app/lib/clasificados/comida-local/comidaLocalDraftMediaUpload.ts` |
| Server mapper symbols | `normalizeClasificadosServiciosApplicationState` → `mapClasificadosServiciosApplicationToServiciosDraft` → `mapServiciosApplicationDraftToBusinessProfile` → `applyClasificadosCouponsToServiciosWireProfile` → `stripAdvertiserVerificationFlags` → `enforceServiciosOffersEntitlementServerTruth` → `mergeOpsControlledServiciosProfileFields` (`publish/route.ts:5,:6,:22,:24`) | payload → `listing_json` (`publish/route.ts:417`); hub model `application/buildRestaurantContactHub.ts:174` | `comidaLocalPublishValidation.ts` + `comidaLocalPublishTypes.ts` → row payload |
| API route | `app/api/clasificados/servicios/publish/route.ts` `POST` (`:194`) | `app/api/clasificados/restaurantes/publish/route.ts` `POST` (`:133`) | `app/api/clasificados/comida-local/publish/route.ts` `POST` (`:73`) |
| Auth | `serviciosOwnerIdFromBearer` / `isServiciosStrictPublishEnvironment` (`api/.../lib/serviciosPublishServerAuth.ts`) | server-verified owner (`:310`) | `comidaLocalPublishServerAuth.ts` |
| Shared media contract | **YES** — `buildProposedFinalMediaSet` / `validateProposedFinalMediaSet` (`app/lib/media/listingMediaContract.ts`) at `:30,:275` | **YES** at `:33,:281` | **NO — never imported** |
| DB write target | `.from("servicios_public_listings")` `.update(...)` `:457` / `.insert(insertRow)` `:506` | `.from("restaurantes_public_listings")` `.update(...)` `:460` / `.insert(...)` `:512` | `.from("comida_local_public_listings")` `.update(updatePayload)` `:193` / `.insert(...)` `:258` |
| Same-row key on republish | **`slug`** — `.eq("slug", slug)` `:467` | `listing_json.draftListingId` → row select `:325` | stored `draft_listing_id` → row select `:132` |
| Post-publish public path | `/clasificados/servicios/${slug}` (`:692`) | `/clasificados/restaurantes/${slug}` | `/clasificados/comida-local/${slug}` |

## 4.1 🟠 P1 — GAP-04A-01 · SERVICIOS REPUBLISH IDENTITY RIDES ON A `sessionStorage` STRING

`app/api/clasificados/servicios/publish/route.ts:298-310`:

```ts
const baseSlug = slugifyServiciosBusinessName(state.businessName || "borrador");
const existingSlugRaw = typeof b.existingPublicSlug === "string" ? b.existingPublicSlug.trim() : "";
let slug = await allocateSlug(baseSlug);                     // ← allocateSlug():119 appends -2, -3, …
if (existingSlugRaw && /…/.test(existingSlugRaw) && isSupabaseAdminConfigured()) {
  const row = await getServiciosPublicListingBySlugFromDb(existingSlugRaw, { visibility: "all" });
  if (row && ownerUserId) { const owner = row.owner_user_id;
    if (!owner || owner === ownerUserId) { slug = existingSlugRaw; } }
}
```

`existingPublicSlug` is read **from the browser** at `lib/serviciosPublishClient.ts:78-81`:
`sessionStorage.getItem(SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY /* "servicios_last_published_slug" */)`.
It is primed only at `ClasificadosServiciosApplication.tsx:507` and
`ClasificadosServiciosPreviewClient.tsx:252` (edit hydration), and explicitly **cleared** at
`ClasificadosServiciosApplication.tsx:435` and `:664`.

**Consequence:** the row identity of a Servicios republish is *not* the listing UUID and *not* the
`listingId` query param — it is a session-scoped browser string. If that value is absent (new tab,
browser restart, session cleared, a save path that did not prime it) **and** the owner has changed
the business name, `allocateSlug` mints `name-2` and the route takes the `insert` branch
(`:493-507`) → **a duplicate `servicios_public_listings` row, a second `leonix_ad_id`, and an
orphaned original listing.** The repository states this risk in its own words:

> `app/lib/listingIdentity/categoryRouteRegistry.ts` SERVICIOS_ADAPTER `knownLimitations`:
> *"Save-by-slug requires the caller to prime `existingPublicSlug` before this route resolver runs,
> or the underlying publish route may INSERT a duplicate row instead of updating in place … Not
> every save call site was independently verified to prime it."*

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Comida Local** (and Restaurantes) ·
REFERENCE PATH: `app/api/clasificados/comida-local/publish/route.ts:132-133` — the row is selected by
the durable, server-stored `draft_listing_id` carried on the row itself, never by a browser string;
Restaurantes does the same at `publish/route.ts:325` via `listing_json.draftListingId` ·
TARGET CATEGORY PATH: `app/api/clasificados/servicios/publish/route.ts:298-310` ·
DIFFERENCE: Servicios has no durable draft/listing id on the row to key on — the mapper writes
`draft.identity.slug` (`:313`) but never a `draft_listing_id`; the missing adapter is (a) persist the
application's `draftListingId` onto `servicios_public_listings`, (b) accept `listingId` from the
edit-route query params server-side and prefer it over `existingPublicSlug` ·
**ACTION: ADOPT EXISTING.**

## 4.2 🟠 P1 — GAP-04A-02 · COMIDA LOCAL PUBLISH BYPASSES THE SHARED MEDIA CONTRACT

`buildProposedFinalMediaSet` / `validateProposedFinalMediaSet` (`app/lib/media/listingMediaContract.ts`)
are imported and enforced by Servicios (`publish/route.ts:30,:275`) and Restaurantes (`:33,:281`).
`git grep -n "listingMediaContract" origin/main -- app/api/clasificados/comida-local` → **empty.**
Comida Local's publish route performs no shared media-set validation; gallery caps live only in the
client (`comidaLocalConstants.ts` `COMIDA_LOCAL_GALLERY_MAX`) and in
`comidaLocalImageValidation.ts` / `comidaLocalImageNormalize.ts`.

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Servicios** ·
REFERENCE PATH: `app/api/clasificados/servicios/publish/route.ts:30,:275` ·
TARGET CATEGORY PATH: `app/api/clasificados/comida-local/publish/route.ts` ·
DIFFERENCE: no `buildProposedFinalMediaSet` call, no `validateProposedFinalMediaSet` 422 branch ·
**ACTION: ADOPT EXISTING.**

---

# PART 5 — PER-CATEGORY GLOBAL SYSTEM ADOPTION MATRIX

`T` = TRUE (traced consumer) · `F` = FALSE · `N` = N-A (not a capability of this product)

| # | System | SRV | RST | CML | Traced consumer path (one per category, in order SRV / RST / CML) |
|---|---|:-:|:-:|:-:|---|
| 1 | checkpoint | **T** | **T** | **T** | `publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx:39` → `categoryPublishCheckpoints.ts:163` / `publicar/restaurantes/RestaurantesSelectorClient.tsx:35` → `:54` / `publicar/comida-local/checkpoint/page.tsx` → `QuickLaneCheckpointClient.tsx:91` → `:742`. **BUT see 6.1 — the gateway skips SRV+RST checkpoints.** |
| 2 | draft | **T** | **T** | **T** | `clasificadosServiciosStorage.ts:14` / `restauranteDraftStorage.ts:15` / `comidaLocalDraftPersistence.ts:23` |
| 3 | unsaved guard | **T** | **T** | **T** | `useBusinessApplicationLeaveGuard.ts:35` ← `ClasificadosServiciosApplication.tsx:615` / `RestauranteApplicationClient.tsx:213` / `ComidaLocalApplicationClient.tsx:303` |
| 4 | preview | **T** | **T** | **T** | `previewModeContract.ts` ← all three preview clients |
| 5 | preview→edit | **T** | **T** | **T** | `clasificadosServiciosPreviewHandoff.ts:17` / shared `restaurantes-draft` key / shared `leonix:comida-local:draft:v1` key |
| 6 | checkout | **T** | **T** | **T** | `PublishCheckoutCheckpoint.tsx:119` + `startRevenueCategoryCheckout` at `:777/:589`, `:436/:260`, `:300/:177` |
| 7 | promo | **T** | **T** | **T** | `revenuePricingMatrix.ts:252 / :210 / :295` all `promoEligible: true`; surfaced by `resolvePublishCheckoutCheckpoint` `opts.promoCode/promoDiscountCents/promoUiEnabled` |
| 8 | media / gallery | **T** | **T** | **F** | `listingMediaContract` at publish `:275` / `:281` / **absent** — see 4.2 |
| 9 | video | **T** | **T** | **F** | `serviciosMuxVideoClient.ts` + `SERVICIOS_MAX_VIDEO_URLS` / `RestauranteExternalVideoUrlsSection.tsx` + `shell/restauranteVideoPreview.ts` / **zero `video` hits in the whole Comida Local publish + type tree** |
| 10 | flyer | **T** | **T** | **F** | `serviciosPromoPdfUi.ts` + `couponFlyer` on the wire profile / `RestauranteShellCouponsBlock.tsx` / **zero `flyer` hits** |
| 11 | phone / SMS / WhatsApp | **T** | **T** | **T** | `serviciosWhatsAppHref.ts` + `serviciosContactActions.ts` / `restauranteContactHref.ts` / `ComidaLocalContactActions.tsx:23` |
| 12 | email | **T** | **T** | **T** | `ServiciosLeadInquiryForm.tsx` + `/api/clasificados/servicios/inquiry` / `RestaurantContactHub.tsx` mailto / `ComidaLocalContactActions.tsx` mailto |
| 13 | rich correo | **F** | **F** | **F** | Global gap — doc 10 §4 records `rich correo` as F for **all 15 categories**. No shared rich-email engine exists. |
| 14 | languages | **T** | **T** | **T** | `serviciosLanguageChips.ts` + `ServiciosLanguageChipRow.tsx` / `application/restauranteTaxonomy.ts` languages / `comidaLocalTypes.ts` `ComidaLocalLanguageOption` rendered in `ComidaLocalDetailShell.tsx` |
| 15 | hours / open-now | **T** | **T** | **P** | `ServiciosHours.tsx` + `serviciosHeroHoursStatus.ts` / `lib/restauranteHoursLogic.ts` + `lib/restauranteOpenNowFromHours.ts` + `application/restauranteHoursPreview.ts` / CML renders hours text in `ComidaLocalDetailShell.tsx` but has **no open-now evaluator and no results filter** (no results route to filter) |
| 16 | websites / social | **T** | **T** | **T** | `serviciosBusinessHubSocialBrand.tsx` / `shell/restaurantContactHubSocialBrand.tsx` / `ComidaLocalDetailShell.tsx` + `comidaLocalAnalytics.ts:103-106` (**4 forked social-icon engines — doc 13 §A.4; no shared renderer exists**) |
| 17 | CTA connection hub | **P** | **P** | **F** | doc 13 §A.3: SRV = own fork + shared review button/clipboard/map-embed; RST = own fork + same three shared bits; **CML = FULL FORK, zero shared imports** (`ComidaLocalContactActions.tsx`) |
| 18 | translate ad | **T** | **T** | **T** | `servicios/lib/serviciosTranslateAd.ts` ← `ServiciosPublicTranslationLayer.tsx:14` / `restaurantes/lib/restaurantesTranslateAd.ts` ← `useRestauranteShellTranslation.ts:11` / `comida-local/comidaLocalTranslateAd.ts` ← `useComidaLocalPublicTranslation.tsx:14`. **3 forks of `app/lib/translation/anuncioTranslateAd.ts`; no `translate` analytics event exists anywhere (doc 10 §4.1).** |
| 19 | ES / EN | **T** | **T** | **T** | `?lang=` honoured on landing, results, application, preview, detail for all three |
| 20 | community trust | **T** | **T** | **T** | `LeonixCommunityTrust` at `ServiciosBusinessHubContactCard.tsx:16,:611` / `RestaurantContactHub.tsx:519` / `ComidaLocalPublicDetailClient.tsx:43`; registry `leonixEndorsementRegistry.ts:20-24,:110-113` covers all three |
| 21 | google / yelp | **T** | **T** | **F** | `ServiciosHubReviewLinkButton.tsx` is an **orphan**; the live path is shared `SharedConnectionHubReviewButton` at `ServiciosBusinessHubContactCard.tsx:50,:636` / `RestaurantContactHub.tsx:33,:548` (its own `RestaurantHubReviewLinkButton.tsx` is likewise orphaned) / **CML has no review-link field or button** |
| 22 | address verifier (G23) | **F** | **F** | **F** | See 6.2 — `app/lib/businessAddress/*` has **zero app importers**. |
| 23 | location privacy / directions (G24) | **F** | **F** | **P** | See 6.3. SRV+RST use their own faux maps + `buildSharedConnectionHubMapEmbedSrc`; `businessAddressPrivacy.ts` is unused; **CML is the only one with a real publish-time privacy toggle** — `mapComidaLocalDraftToPreviewVm.ts:291` `draft.showAddressPublicly ? … : ""` |
| 24 | saved search (G25) | **N** | **N** | **N** | doc 14 §A.4 classifies all three **INTENTIONAL_NA** (business-profile surfaces, not inventory search). Resolver map `savedSearchEmailDelivery.ts:37` = autos / bienes-raices / rentas only. |
| 25a | save | **F** | **T** | **F** | `LeonixSaveButton` mounts: `RestauranteAdStoryPreview.tsx`, `RestauranteShellInteractiveCtas.tsx` only. **SRV and CML never mount it.** (SRV's `ServiciosHeroActions.tsx:41-56` is a `localStorage["servicios-saved-<slug>"]` fork — **and it is an orphan with zero mounts**.) |
| 25b | like | **T** | **T** | **F** | `ServiciosLikeEngagementCluster.tsx` ← `ServiciosProfileView.tsx:118` / `ServiciosProfessionalProfileShell.tsx:222` · `LeonixLikeButton` ← `RestauranteProfileHeader.tsx` / **CML: none** |
| 25c | share | **T** | **T** | **F** | `LeonixShareButton` ← `ServiciosProfileView.tsx:128`, `ServiciosProfessionalProfileShell.tsx:234` / `RestauranteShellInteractiveCtas.tsx` / **CML: none** |
| 25d | report | **F** | **F** | **F** | No `Report` mount on any of the three `[slug]/page.tsx` (`git grep -n "Report" origin/main -- …/[slug]/page.tsx` → empty). Sept `14c1e9b5` added it; **not in `origin/main`.** |
| 25e | recently viewed | **F** | **F** | **F** | `app/lib/recentlyViewed.ts` has **zero importers in these three trees**. Sept `14c1e9b5` added `RecentlyViewedAndReportMount.tsx`; **not in `origin/main`.** |
| 26 | analytics | **T** | **T** | **T** | doc 10 §5 — `recordServiciosGlobalAnalytics.ts` (+ converged ops mirror `serviciosListingAnalyticsMirror.ts:59-76`, the reference pattern) / `recordRestaurantesGlobalAnalytics.ts` / `comidaLocalAnalytics.ts:166,198`. All → `listing_analytics`. |
| 27 | results | **P** | **T** | **F** | doc 14 §B.1 — SRV bespoke `ServiciosResultsPageShell` + V1 pagination; RST = the only full V2 kit adopter; **CML has no results route at all**. |
| 28 | related listings (G29) | **F** | **F** | **F** | `git grep -lniE "relacionad\|similarListings"` over all three trees → **zero non-`.md` hits**. Working references exist: `en-venta/listing/EnVentaRelatedRail.tsx`, `bienes-raices/components/BrSimilarOtherClientProperties.tsx`. |
| 29 | business hub (G30) | **P** | **P** | **F** | doc 13 §A.3 verbatim — SRV `ServiciosBusinessHubContactCard.tsx` (757 lines, own fork model); RST `RestaurantContactHub.tsx` (637 lines, own model); **CML full fork, zero shared imports**. The shared builder `buildSharedConnectionHubContact` has **zero app importers** (doc 13 §A.2 GAP-015). |
| 30 | revenue OS | **T** | **T** | **T** | doc 11 §3 — `servicios_base_monthly` / `restaurantes_base_monthly` / `comida_local_base_monthly`; all three call `startRevenueCategoryCheckout` |
| 31 | subscription | **T** | **T** | **F** | doc 11 §4 🔴 **P0** — `subscriptionLifecyclePolicy.ts:139 LANE_SUSPENSION` contains restaurantes, servicios, autos, bienes-raices; **`comida-local` is absent → a Comida Local subscription can never be suspended.** |
| 32 | placement / ranking | **T** | **P** | **F** | doc 14 §B.4 — SRV sorts *within* placement buckets (`serviciosResultsFilter.ts:874-879`) ✅; **RST ranks then flat-sorts, discarding paid placement on any user sort (GAP-018, `RestaurantesResultsShell.tsx:166,:170`)**; CML has no placement at all |
| 33 | user dashboard | **T** | **T** | **P** | `/dashboard/servicios` / `/dashboard/restaurantes` (dedicated hubs) / **CML has no dedicated hub** — `ComidaLocalDashboardListings.tsx` inside `/dashboard/mis-anuncios`, and its own audit records the edit CTA is not the visually-primary action |
| 34 | active edit | **T** | **T** | **T** | registry `editRoute` × 3, all pointing at real, existing routes (see 1.1/1.2/1.3). Field-level round-trip deferred to `06_…` by instruction. |
| 35 | republish same-row | **F** | **T** | **T** | See 4.1 — SRV keys on a sessionStorage slug; RST keys on `listing_json.draftListingId` (`:325`); CML keys on the row's `draft_listing_id` (`:132`) |
| 36 | admin | **P** | **T** | **F** | RST `workspace/clasificados/restaurantes/page.tsx:18,:272` mounts shared `AdminListingMonetizationSummary`; **SRV's `workspace/clasificados/servicios/page.tsx` does NOT** (it has a bespoke `_components/ServiciosAdminMonetizationPanel.tsx` instead); **CML's page mounts neither**. Sept `b9a9f3f7` added the shared summary to Servicios — **not in `origin/main`.** |
| 37 | SEO | **T** | **T** | **F** | `serviciosJsonLd` at `servicios/[slug]/page.tsx:31,:189,:203` / `restauranteJsonLd` + `breadcrumbJsonLd` at `restaurantes/[slug]/page.tsx:15,:16,:95,:108,:116,:117` / **CML `[slug]/page.tsx` emits NO JSON-LD and NO breadcrumb** (it does have canonical + OG). Plus GAP-016 duplicate-content: SRV and RST both serve `/results` and `/resultados` from a plain re-export with no redirect and no canonical. |
| 38 | mobile / PWA | **P** | **P** | **P** | `app/manifest.ts` and `app/components/ServiceWorkerRegistration.tsx` are **site-wide**, not category-scoped; no category opts in or out. Responsive layouts exist in all three shells. No category-specific PWA adoption exists to be TRUE or FALSE. |
| 39 | security / RLS | **T** | **T** | **T** | `20260402160000_servicios_public_listings.sql:18,:21` · `20260408120000_restaurantes_public_listings.sql:46,:48` + `20260410193000_…owner_select.sql:4` · `20260604120000_comida_local_public_listings.sql:90,:92,:97`. All three publish routes write with the **service-role admin client**, bypassing RLS, with owner identity resolved server-side from the bearer token. |

**TALLY — 43 scored cells per category (rows 1–39 with 25 split into 25a–25e).**
Recounted cell-by-cell from the matrix above; `P` (partial) is scored separately from `F` and must
be treated as burn-down work alongside `F`.

| | TRUE | PARTIAL | FALSE | N-A | total |
|---|---:|---:|---:|---:|---:|
| SERVICIOS | 29 | 5 | 8 | 1 | 43 |
| RESTAURANTES | 32 | 4 | 6 | 1 | 43 |
| COMIDA LOCAL | 19 | 4 | 19 | 1 | 43 |

- SERVICIOS `P`: 17 CTA hub · 27 results · 29 business hub · 36 admin · 38 mobile/PWA.
  SERVICIOS `F`: 13 rich correo · 22 address verifier · 23 location privacy · 25a save ·
  25d report · 25e recently viewed · 28 related listings · 35 republish same-row.
- RESTAURANTES `P`: 17 · 29 · 32 placement/ranking · 38.
  RESTAURANTES `F`: 13 · 22 · 23 · 25d · 25e · 28.
- COMIDA LOCAL `P`: 15 hours/open-now · 23 · 33 user dashboard · 38.
  COMIDA LOCAL `F`: 8 media contract · 9 video · 10 flyer · 13 · 17 · 21 google/yelp · 22 ·
  25a–25e (5 cells) · 27 · 28 · 29 · 31 subscription · 32 · 36 · 37 SEO.

---

# PART 6 — REFERENCE-IMPLEMENTATION BLOCKS FOR EVERY FALSE

*(Rule: no replacement engines are designed here. Each block names the existing, proven code.)*

## 6.1 🟠 P1 — GAP-04A-03 · THE `/publicar` AND `/clasificados` GATEWAYS SKIP THE SERVICIOS AND RESTAURANTES CHECKPOINTS

`app/(site)/publicar/publicarGatewayResolver.ts:99`:

```ts
const dest = adapter.checkpointRoute ?? adapter.hubRoute ?? adapter.applicationRoute;
```

Live consumers: `app/(site)/publicar/PublicarGatewayClient.tsx:120,:222` (the `/publicar` gateway
grid + deep-link redirect) and `app/(site)/clasificados/ClasificadosHubClient.tsx:49` (the
`/clasificados` hub category cards).

`git grep -n "checkpointRoute" origin/main -- app/lib/listingIdentity/categoryRouteRegistry.ts` →
`en-venta:920`, `comida-local:1022`, `busco:1110`, `clases:1164`, `comunidad:1208`,
`mascotas:1249`, `viajes:1311`.
`git grep -n "hubRoute" …` → `bienes-raices:329,:637`, `autos:448,:579`, `rentas:704,:762`.

**Neither `servicios` nor `restaurantes` declares `checkpointRoute` OR `hubRoute`.** Both therefore
fall through to `applicationRoute` — `/publicar/servicios` and `/publicar/restaurantes` — which
render the **application form directly** (`app/(site)/publicar/servicios/page.tsx`,
`app/(site)/publicar/restaurantes/page.tsx`). The resolver's own doc-comment asserts the opposite:

> `publicarGatewayResolver.ts:93-94` — *"hubs that already render checkpoint cards (Autos, Bienes
> Raíces, Rentas, **Restaurantes**, Empleos) keep resolving via `hubRoute` unchanged."*

That statement is false for Restaurantes in current source.

**Owner-visible effect:** a visitor entering Servicios from `/publicar` or `/clasificados` never sees
the $399/mo checkpoint card or its "Ver Más" rules modal — the two real routes
`/clasificados/publicar/servicios/checkpoint` and `/clasificados/publicar/restaurantes` are only
reachable by direct URL or by the legacy redirect at
`app/(site)/clasificados/publicar/servicios/page.tsx`. For Restaurantes it also means the
**Comida Local cross-sell card** (`categoryPublishCheckpoints.ts:130`, the card that routes to
`/publicar/comida-local` at its real $129/mo price) is never shown.

**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Comida Local** ·
REFERENCE PATH: `app/lib/listingIdentity/categoryRouteRegistry.ts:1022`
(`checkpointRoute: "/publicar/comida-local/checkpoint"`) + `app/(site)/publicar/comida-local/checkpoint/page.tsx` ·
TARGET CATEGORY PATH: the `SERVICIOS_ADAPTER` (`categoryRouteRegistry.ts:244`) and
`RESTAURANTES` adapter (`:175`) ·
DIFFERENCE: **one missing field per adapter** — `checkpointRoute: "/clasificados/publicar/servicios/checkpoint"`
and `checkpointRoute: "/clasificados/publicar/restaurantes"`. Both destination routes already exist
and already render the shared checkpoint components. ·
**ACTION: ADOPT EXISTING.**

## 6.2 🟠 P1 — GAP-04A-04 · ADDRESS VERIFIER (G23) IS ORPHANED FOR ALL THREE — AND FOR THE WHOLE APP

```
git grep -n "businessAddress/" origin/main -- app/ | grep -v "^origin/main:app/lib/businessAddress"
→ (empty)
```

`app/lib/businessAddress/businessAddressContract.ts`, `businessAddressNormalize.ts`,
`businessAddressProvider.ts`, `businessAddressDirections.ts`, `businessAddressPrivacy.ts` have
**zero importers anywhere in `app/`**. The only file referencing them is the shared library's own
`examples/comidaLocalAddressMappingExample.ts` — an example, not a consumer. Every `businessAddress*`
grep hit in the three category trees is the unrelated Comida Local **field name**
`businessAddressLine` (`comidaLocalTypes.ts:199`, `ComidaLocalApplicationClient.tsx:1273-1281`).

**PROVEN REFERENCE EXISTS: NO** — there is no category anywhere in the repo consuming the address
verifier, so there is no working adopter to copy. The engine exists but has never been wired.
REFERENCE PATH (engine, unconsumed): `app/lib/businessAddress/businessAddressContract.ts` ·
TARGET CATEGORY PATHS: `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`,
`app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`,
`app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx` ·
DIFFERENCE: no category calls the normalize/verify provider at address entry ·
**ACTION: OWNER_POLICY_DECISION** (wire the existing engine into a first pilot, or formally archive
it) — **do not design a replacement.**

Sept `68d45c6c` *"fix: adopt shared address privacy contract (Servicios)"* (12 files, incl.
`resolveServiciosProfile.ts` +46/-9 and a new `scripts/verify-business-address-foundation.ts`) is
**NOT in `origin/main`**. Production Servicios therefore lacks the address-privacy contract that
September built.

## 6.3 🟡 P2 — GAP-04A-05 · LOCATION PRIVACY / DIRECTIONS (G24)

`app/lib/businessAddress/businessAddressPrivacy.ts` — zero importers (6.2).
`app/(site)/clasificados/shared/constants/sharedConnectionHubLocationHelpers.ts`:
`buildSharedConnectionHubMapEmbedSrc:13` has 2 importers (Servicios + Restaurantes),
`buildSharedConnectionHubDirectionsHref:20` and `isCoarseLocationLine:28` have **zero**
(doc 13 §A.2). `SharedConnectionHubLocation.isApproximate` is never read by any renderer.
Servicios has its own coarse-line formatter (`servicios/lib/formatServiciosPublicLocationLine.ts`)
and Restaurantes has `restaurantesCoarseGeolocation.ts`.

**The only real publish-time address-privacy control in the three is Comida Local's**
`draft.showAddressPublicly` (`mapComidaLocalDraftToPreviewVm.ts:291,:333`).

**PROVEN REFERENCE EXISTS: YES (partial)** · REFERENCE CATEGORY: **Comida Local** ·
REFERENCE PATH: `app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts:291` ·
TARGET CATEGORY PATHS: Servicios `app/(site)/servicios/lib/resolveServiciosProfile.ts`,
Restaurantes `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts` ·
DIFFERENCE: neither has an owner-facing "show exact address publicly" flag; both always render the
address they were given ·
**ACTION: ADOPT EXISTING** for the toggle; the shared `isCoarseLocationLine` /
`buildSharedConnectionHubDirectionsHref` helpers are already written and unused —
**ADOPT EXISTING** for those too.

## 6.4 🟠 P1 — GAP-04A-06 · SAVE / REPORT / RECENTLY-VIEWED MISSING

**SAVE — SRV `F`, CML `F`:**
PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **Restaurantes** ·
REFERENCE PATH: `app/components/clasificados/analytics/LeonixSaveButton.tsx` mounted at
`app/(site)/clasificados/restaurantes/shell/RestauranteShellInteractiveCtas.tsx` with identity
extras from `app/lib/restaurantesSavedListingIdentity.ts:40`, persisted via
`app/lib/savedListingsRuntime.ts` and read back by `app/(site)/dashboard/guardados/page.tsx` ·
TARGET CATEGORY PATHS: `app/(site)/servicios/components/ServiciosProfileView.tsx` /
`ServiciosProfessionalProfileShell.tsx` (which already mount `LeonixShareButton` beside where the
save button belongs), and `app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx` ·
DIFFERENCE: `app/lib/serviciosSavedListingIdentity.ts` **exists but has zero importers**; no
`comidaLocalSavedListingIdentity.ts` exists at all ·
**ACTION: ADOPT EXISTING** (Servicios: wire the identity module that is already written — this is a
**FIX REGRESSION**, the adapter was built and never connected. Comida Local: **ADOPT EXISTING**, one
new identity module + one mount).

**LIKE / SHARE — CML `F`:**
PROVEN REFERENCE EXISTS: **YES** · REFERENCE: `LeonixLikeButton` / `LeonixShareButton` as mounted by
Servicios (`ServiciosProfileView.tsx:118,:128`) · TARGET: `ComidaLocalDetailShell.tsx` ·
DIFFERENCE: no engagement row exists on the Comida Local detail shell ·
**ACTION: ADOPT EXISTING.** Sept `50d1cd40` built exactly this (`ComidaLocalEngagementRow.tsx`, +67
lines in `comidaLocalAnalytics.ts`, `verify-family1-save-like-share-adoption.ts`) — **not merged**.

**REPORT + RECENTLY VIEWED — all three `F`:**
PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **Bienes Raíces / Comunidad / Clases /
Busco / En Venta** (doc 10 §4 records `report = T` for those) · REFERENCE PATH: `app/lib/recentlyViewed.ts`
+ the BR report emitter in `app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts` ·
TARGET CATEGORY PATHS: `app/(site)/clasificados/servicios/[slug]/page.tsx`,
`app/(site)/clasificados/restaurantes/[slug]/page.tsx`,
`app/(site)/clasificados/comida-local/[slug]/page.tsx` ·
DIFFERENCE: no mount on any of the three detail pages ·
**ACTION: ADOPT EXISTING** — Sept `14c1e9b5` wrote the exact adapter
(`app/(site)/clasificados/components/RecentlyViewedAndReportMount.tsx`, 31 lines, + 2/2/6 lines of
mounts) and is **not in `origin/main`**.

## 6.5 🟠 P1 — GAP-04A-07 · COMIDA LOCAL HAS NO STRUCTURED DATA

PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **Restaurantes** ·
REFERENCE PATH: `app/(site)/clasificados/restaurantes/seo/restauranteJsonLd.ts` +
`app/lib/seo/breadcrumbJsonLd.ts`, emitted at `restaurantes/[slug]/page.tsx:95,:108,:116,:117` ·
TARGET CATEGORY PATH: `app/(site)/clasificados/comida-local/[slug]/page.tsx` — has
`alternates.canonical` and `openGraph`, but no `<script type="application/ld+json">` and no
`seo/` directory ·
DIFFERENCE: no `comidaLocalJsonLd.ts` and no emit ·
**ACTION: ADOPT EXISTING** (Comida Local is `FoodEstablishment`-shaped; Restaurantes' builder is the
direct analogue).

## 6.6 🟡 P2 — GAP-04A-08 · COMIDA LOCAL ADMIN LACKS THE SHARED MONETIZATION SUMMARY; SERVICIOS TOO

PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **Restaurantes** (also Autos, Empleos) ·
REFERENCE PATH: `app/admin/(dashboard)/workspace/clasificados/_components/AdminListingMonetizationSummary.tsx:92`
mounted at `…/restaurantes/page.tsx:18,:272` (also `…/autos/page.tsx:33,:352`, `…/empleos/page.tsx:18,:294`) ·
TARGET CATEGORY PATHS: `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` (uses the
bespoke `_components/ServiciosAdminMonetizationPanel.tsx` instead) and
`app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx` (mounts nothing) ·
DIFFERENCE: one import + one mount per page, plus `buildAdminListingMonetizationInput` ·
**ACTION: ADOPT EXISTING.** Sept `b9a9f3f7` did exactly this for Servicios (9 lines in
`workspace/clasificados/servicios/page.tsx` + a 59-line verifier) — **not in `origin/main`**.

## 6.7 🟡 P2 — GAP-04A-09 · RELATED LISTINGS ABSENT ON ALL THREE (G29)

PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **En Venta** (and Bienes Raíces) ·
REFERENCE PATH: `app/(site)/clasificados/en-venta/listing/EnVentaRelatedRail.tsx` ·
`app/(site)/clasificados/bienes-raices/components/BrSimilarOtherClientProperties.tsx` ·
TARGET CATEGORY PATHS: the three `[slug]/page.tsx` detail routes ·
DIFFERENCE: no related/similar rail component and no sibling query in any of the three trees ·
**ACTION: ADOPT EXISTING.** (Doc 14 Part C notes Sept `88d844e1` "G29 related listings" is likewise
absent from `origin/main`.)

## 6.8 🟡 P2 — GAP-04A-10 · COMIDA LOCAL: NO VIDEO, NO FLYER/COUPON

PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **Servicios** ·
REFERENCE PATHS: video — `app/(site)/clasificados/publicar/servicios/lib/serviciosMuxVideoClient.ts`
+ `app/(site)/servicios/lib/serviciosVideoEmbed.ts` + `serviciosGalleryVideoCaps.ts`;
flyer/coupons — `serviciosPromoPdfUi.ts` + `clasificadosServiciosPromo.ts` +
`app/(site)/servicios/components/ServiciosPromocionesCard.tsx` ·
TARGET CATEGORY PATH: `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx` +
`app/lib/clasificados/comida-local/comidaLocalTypes.ts` ·
DIFFERENCE: `ComidaLocalDraft` has no video or coupon/flyer fields at all
(`git grep -niE "video|flyer|cupon" … app/(site)/publicar/comida-local` → empty) ·
**ACTION: OWNER_POLICY_DECISION first** — at $129/mo this may be a deliberate product tier boundary,
not a gap; then ADOPT EXISTING if the Owner wants parity.

## 6.9 🔴 P0 (INHERITED, RE-CONFIRMED) · COMIDA LOCAL SUBSCRIPTION CANNOT BE SUSPENDED

Re-confirmed against `origin/main`, already logged in `11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md` §4.
`app/lib/listingPlans/subscriptionLifecyclePolicy.ts:139` `LANE_SUSPENSION` = restaurantes,
servicios, autos, bienes-raices. `comida_local_base_monthly` ($129/mo,
`revenuePricingMatrix.ts:287-298`) has no lane.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: the `servicios` lane entry in the same map, whose
source table is `servicios_public_listings` → the Comida Local analogue is
`comida_local_public_listings` · **ACTION: ADOPT EXISTING (merge the Sept work).**

## 6.10 🟢 P3 — ORPHANS AND DEAD COPY FOUND IN THESE THREE TREES (do not delete during audit)

| Orphan | Path | Evidence |
|---|---|---|
| Servicios legacy application form | `app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx` + `hooks/useServiciosApplicationDraftState.ts` + `lib/serviciosDraftStorage.ts` (`SERVICIOS_APPLICATION_DRAFT_STORAGE_KEY`) | no page renders it; `app/(site)/servicios/publicar/page.tsx` is a pure redirect |
| Servicios legacy preview — **a live, reachable route rendering a dead draft** | `app/(site)/servicios/perfil/preview/page.tsx` → `ServiciosPreviewClient.tsx:9` | reads `SERVICIOS_APPLICATION_DRAFT_STORAGE_KEY`, which only the orphaned form above ever writes → the route always renders empty |
| Servicios hero save/share fork | `app/(site)/servicios/components/ServiciosHeroActions.tsx:41-56` | `git grep -n "ServiciosHeroActions" origin/main -- app/` returns only the file itself — **zero mounts**. Writes `localStorage["servicios-saved-<slug>"]`, emits no analytics, `console.log`s on clipboard |
| Orphan review buttons | `ServiciosHubReviewLinkButton.tsx:29`, `RestaurantHubReviewLinkButton.tsx:29` | doc 13 §A.4 — both superseded by `SharedConnectionHubReviewButton` |
| Stale hardcoded checkpoint copy | `app/(site)/clasificados/publicar/restaurantes/page.tsx` `COPY` block: `card2Price: "$199/mes"`, `card1Price: "$399/mes"` (identical in the `en` branch) | **NOT rendered** — `RestaurantesSelectorClient.tsx` consumes only `t.title` and `t.body`; prices come from `getRestaurantesCheckpointCards` → `revenuePricingMatrix`. Dead but dangerously misleading to the next reader, since `categoryPublishCheckpoints.ts:64-72` documents fixing exactly this `$199` defect. |
| Shipped non-route file | `app/(site)/clasificados/servicios/resultados/page_temp.tsx` (UTF-16) | doc 14 §B.5 |
| Shipped backup file | `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx.backup` | in `git ls-tree origin/main` |

---

# PART 7 — SEPT-ONLY COMMIT CONTAINMENT (task (g))

`git merge-base --is-ancestor <sha> origin/main` run for each:

| Commit | Date | Subject | In `origin/main`? | What production lacks |
|---|---|---|:-:|---|
| `b60801e2` | 2026-08-03 | shared preview-mode contract + Empleos checkout defect | **YES** | — (adopted by all three) |
| `629c5a46` | 2026-08-28 | br-rentas: adopt global application leave guard | **NO** | Nothing for these three — the commit touches only BR/Rentas application forms (4 files). SRV/RST/CML already carry the shared guard in `origin/main`. |
| `68d45c6c` | 2026-09-01 | adopt shared address privacy contract (Servicios) | **NO** | 12 files: `showAddressPublicly`-style privacy plumbed through `clasificadosServiciosApplicationTypes/Normalize/defaultState`, `mapClasificadosServiciosApplicationToServiciosDraft`, `serviciosPublishedToApplicationDraft`, `mapServiciosApplicationDraftToBusinessProfile`, `serviciosApplicationDraft`/`serviciosBusinessProfile` types, and **`resolveServiciosProfile.ts` (+46/-9)**, plus verifier `scripts/verify-business-address-foundation.ts` (70 lines). **Production Servicios has no address-privacy control.** |
| `50d1cd40` | 2026-09-01 | Save/Like/Share on Servicios and Comida Local | **NO** | 8 files: new `ComidaLocalEngagementRow.tsx` (81 lines), +14/+15 lines of mounts in `ServiciosProfessionalProfileShell.tsx` / `ServiciosProfileView.tsx`, +67 lines in `comidaLocalAnalytics.ts`, `comidaLocalPublicTypes.ts` +4, `comidaLocalPublicQueries.ts` +1, verifier `verify-family1-save-like-share-adoption.ts` (111 lines). **Production: Comida Local has no save/like/share; Servicios has no save.** |
| `14c1e9b5` | 2026-09-01 | Recently Viewed + Report on all three | **NO** | 5 files: new shared `app/(site)/clasificados/components/RecentlyViewedAndReportMount.tsx` (31 lines) + mounts in `comida-local/[slug]/page.tsx` (+2), `restaurantes/[slug]/page.tsx` (+2), `servicios/[slug]/page.tsx` (+6), verifier (97 lines). **Production: none of the three has Report or Recently Viewed.** |
| `b9a9f3f7` | 2026-09-01 | shared Admin monetization summary on Servicios | **NO** | 2 files: +9 lines in `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx`, verifier (59 lines). **Production Servicios admin shows no shared monetization summary.** |
| `80d4dbcb` | 2026-09-08 | servicios: repair 3 real owner-visible P0 gaps | **NO** | 14 files / +324−21: `ClasificadosServiciosApplication.tsx` (+40), `clasificadosServiciosApplicationNormalize.ts` (+10), `…Types.ts` (+7), `defaultClasificadosServiciosState.ts` (+3), `mapClasificadosServiciosApplicationToServiciosDraft.ts` (+3), **`serviciosPublishedToApplicationDraft.ts` (+53/−?) — the edit-hydration mapper**, `ServiciosHours.tsx` (+22), `mapServiciosApplicationDraftToBusinessProfile.ts` (+3), `mapServiciosProfileToBusinessHubContact.ts` (+6), both Servicios type files, QA seed, and a new 171-line verifier `scripts/verify-servicios-p0-owner-gaps-2026-09-09.ts`. **Production Servicios still carries all three of those owner-visible P0s** (the hours/WhatsApp/hub-contact repairs). Field-level detail is deliberately left to `06_DATA_ROUND_TRIP_FIELD_AUDIT.md`. |
| `69818522` | 2026-09-08 | docs: record Servicios P0 integration pass | **NO** | Documentation only (91 lines, one new `.md`). No production impact. |

**7 of the 8 named commits are absent from `origin/main`.** Six of them carry real, shipped adapter
code. This is the single largest cause of the `FALSE` cells in Part 5.

---

# PART 8 — P0 / P1 SUMMARY AND EVIDENCE GAPS

## P0
| ID | Finding | Path:line |
|---|---|---|
| doc-11 §4 | Comida Local subscription can never be suspended — no `LANE_SUSPENSION` entry | `app/lib/listingPlans/subscriptionLifecyclePolicy.ts:139` |

## P1
| ID | Finding | Path:line |
|---|---|---|
| GAP-04A-01 | Servicios republish keys on a `sessionStorage` slug, not a durable id → duplicate-row risk; self-documented in the registry | `app/api/clasificados/servicios/publish/route.ts:298-310`; `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts:78-81`; `app/lib/listingIdentity/categoryRouteRegistry.ts` SERVICIOS `knownLimitations` |
| GAP-04A-02 | Comida Local publish bypasses the shared media contract | `app/api/clasificados/comida-local/publish/route.ts` (no `listingMediaContract` import) vs `…/servicios/publish/route.ts:30,:275` |
| GAP-04A-03 | `/publicar` + `/clasificados` gateways skip the Servicios and Restaurantes checkpoints (no `checkpointRoute`/`hubRoute`) | `app/(site)/publicar/publicarGatewayResolver.ts:99`; `app/lib/listingIdentity/categoryRouteRegistry.ts:175,:244` |
| GAP-04A-04 | Address verifier engine has zero app importers (G23) | `app/lib/businessAddress/*` |
| GAP-04A-06 | Save missing on SRV+CML (SRV's identity adapter exists, unwired); Report + Recently Viewed missing on all three | `app/lib/serviciosSavedListingIdentity.ts` (0 importers); the three `[slug]/page.tsx` |
| GAP-04A-07 | Comida Local detail emits no JSON-LD / breadcrumb | `app/(site)/clasificados/comida-local/[slug]/page.tsx` |
| doc-14 B.2 | Comida Local public query selects `payment_status`/`package_tier` and uses neither in any predicate → unpaid published rows are publicly visible | `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts:26,:56-82,:123-128` |
| doc-14 B.3 | No expiration gate on SRV / RST / CML public queries | as cited in doc 14 |
| doc-14 B.5 GAP-016 | `/results` + `/resultados` both live for SRV and RST via plain re-export — no redirect, no canonical | `servicios/results/page.tsx:3`; `restaurantes/results/page.tsx:1` |

## EVIDENCE GAPS (explicitly not proven by this pass)
1. **Runtime not exercised.** This is a static, read-only source audit. No page was loaded, no
   publish executed, no Stripe session started. Every "does it write the same row" claim is read from
   the route's branch logic, not observed against a live DB.
2. **`servicios_public_listings` column list not read from the live database.** The `draft_listing_id`
   absence for Servicios is inferred from the publish route's `insertRow`/`update` payloads and from
   `20260402160000_servicios_public_listings.sql` + later migrations; a live `information_schema`
   check was not run (the Supabase MCP server is unauthenticated in this session).
3. **Comida Local `expires_at` / lifecycle behaviour on republish** was not traced (doc 14 §B.3 flags
   the public-select omission; the `lifecycle/route.ts` endpoint was not read).
4. **Field-level round trip** (application → DB → edit hydration → republish) is deliberately
   untouched — owned by `06_DATA_ROUND_TRIP_FIELD_AUDIT.md`.
5. **Restaurantes `coupon-edit` sub-flow** and **Servicios `offers-edit` sub-flow** were confirmed to
   exist as routes and helpers, but their write targets were not traced beyond the shared publish
   route.
6. **`app/manifest.ts` contents** were not read; the mobile/PWA row is classified `P` on the basis
   that the manifest is site-wide with no category branch, not on an inspection of its fields.
7. **No E2E coverage exists for Comida Local** — `e2e/` contains specs for Servicios and
   Restaurantes only, so the Comida Local pathway has no automated regression net.
