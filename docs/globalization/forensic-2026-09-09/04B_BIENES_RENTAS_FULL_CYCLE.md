# 04B — BIENES RAÍCES + RENTAS FULL-CYCLE CERTIFICATION

**Audit date:** 2026-09-09
**SOURCE OF TRUTH:** `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` (`git rev-parse origin/main`).
**Primary worktree HEAD** = `d09d979c` — **112 commits STALE**. No finding in this report was read from the working tree.
**Sept sealed ref** = `e3956df893f5041ca22371c999038f297d536eae` (`fix/globalization-final-closeout-2026-09`).
**Third branch** = `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`, tip `0d80e891` — pushed, in **neither** `origin/main` nor Sept.
Clean Sept checkout used for cross-reference only: `/c/projects/elaguila-website-globalization-final-closeout`. `/c/projects/elaguila-website-final-audit-fixes` was **not** read.

**Lanes certified:** BR-PRIV (privado/FSBO) · BR-NEG (negocio parent) · BR-CHILD (inventory property child) · RENT-PRIV · RENT-NEG.

### Companion documents — cited, not re-derived
- `12A_BIENES_PARENT_CHILD_AUDIT.md` — the G41 parent/child matrix (this report's §6 is a pointer only).
- `14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md` Part B — BR/Rentas **results mechanics**: routes, tables, gates, pagination, placement, the BR 80-row ceiling, the 19 dead BR filters, the rentas `expirationRequired` inverse bug, and the rentas lane derivation from the Leonix branch rather than `seller_type`. **Not re-derived here.**
- `13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md` Part A — BR negocio hub = `BrAgenteResContactSidebar.tsx`; Rentas negocio hub = `RentasNegocioDesktopBusinessRail.tsx`; canonical `rentas/listing/[id]` renders **no** business section. Re-confirmed at `origin/main` in §5 row 28, not re-derived.
- `11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md` — checkout / promo / entitlement.
- `10_ANALYTICS_EVENT_COVERAGE.md` — emitter inventory.
- `06_DATA_ROUND_TRIP_FIELD_AUDIT.md` (concurrent) — owns the dashboard-edit-hydration → republish **destructive-mapper / field-loss** question. §7 here answers only *which route/action* and *same row yes-or-no*.

### Brief corrections established by this audit
1. The brief cites BR public-detail dispatch at `:1473` and EnVenta at `:1495`. At `origin/main` the true lines are **BR dispatch `anuncio/[id]/page.tsx:1431`**, **BR return `:1462-1476`** (shell selection `:1470-1474`), **EnVenta `:1479`** — and **the EnVenta branch is not a BR code path at all**: the BR branch returns before it. This has a P0 consequence (F-01).
2. `629c5a46` "adopt global application leave guard" is **not** a Sept commit. `git branch -a --contains 629c5a46` places it solely on the **third branch**. It is in neither `origin/main` nor `e3956df8`.

---

## 1. LANE → ROUTE + STORAGE MAP

All paths @`origin/main`. Canonical route constants live in `app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes.ts` and `app/(site)/clasificados/rentas/shared/utils/rentasPublishRoutes.ts`.

### 1.1 Route map

| Hop | BR-PRIV | BR-NEG | BR-CHILD | RENT-PRIV | RENT-NEG |
|---|---|---|---|---|---|
| **LANDING** | `/clasificados/bienes-raices` (`bienes-raices/page.tsx` → `BienesRaicesLandingHub.tsx`) | same | same | `/clasificados/rentas` (`rentas/page.tsx`, `dynamic="force-dynamic"`) | same |
| **RESULTS** | `/clasificados/bienes-raices/resultados` (`BR_RESULTS`). `/results` is a compat alias — `results/page.tsx` = `export { default } from "../resultados/page"` + permanent redirect in `next.config.ts` | same | same (gated by `bienes-raices/lib/brPublicInventoryMode.ts`) | `/clasificados/rentas/results` (`RENTAS_RESULTS`) | same |
| **CHECKPOINT / "Ver Más"** | `getBienesCheckpointCards` id `br_privado` — `publicar/_lib/categoryPublishCheckpoints.ts:386-400`; rendered `bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx:8`, `:325` | id `br_negocio` + pack card, same registry; rendered `publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx:12`, `:756` | **lane-local** `BrAgenteInventoryPackCheckpoint` via `negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx:27` | id `rentas_privado` — `categoryPublishCheckpoints.ts:296-334`; rendered `rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx:36`, `:378` | id `rentas_negocio` — `:340-378`; rendered `rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx:35`, `:379` |
| **APPLICATION** | `/clasificados/publicar/bienes-raices/privado` (`BR_PUBLICAR_PRIVADO`); public entry `/publicar/bienes-raices/privado`. Component `privado/application/BienesRaicesPrivadoApplication.tsx` → `BienesRaicesPrivadoForm.tsx` | `/clasificados/publicar/bienes-raices/negocio` (`BR_PUBLICAR_NEGOCIO`); selector `/publicar/bienes-raices`, alias `/publicar/bienes-raices/negocios`. Component `negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` | drawer inside the parent app: `negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx`, shell `BrNegocioPrePublishInventoryShell.tsx` | `/clasificados/publicar/rentas/privado`; entry `/publicar/rentas/privado`. `RentasPrivadoApplication.tsx` → `RentasPrivadoForm.tsx` | `/clasificados/publicar/rentas/negocio`; entry `/publicar/rentas/negocio`. `RentasNegocioApplication.tsx` → `RentasNegocioForm.tsx` |
| **PREVIEW** | `/clasificados/bienes-raices/preview/privado` (`BR_PREVIEW_PRIVADO`); hub `/clasificados/bienes-raices/preview` | `/clasificados/bienes-raices/preview/negocio` (`BR_PREVIEW_NEGOCIO`) **and** in-flow `publicar/bienes-raices/negocio/agente-individual/preview/page.tsx` | overlay `BrNegocioChildInventoryFullPreviewOverlay.tsx` (renders the **same** `AgenteIndividualResidencialPreviewPage`); standalone hop via `brNegocioInventoryAddModePreviewHandoff.ts` | `/clasificados/rentas/preview/privado` (`RENTAS_PREVIEW_PRIVADO`) | `/clasificados/rentas/preview/negocio` (`RENTAS_PREVIEW_NEGOCIO`) |
| **CHECKOUT** | `preview/privado/lib/bienesRaicesFsboPreviewPaidCheckout.ts:4-7` → `app/lib/listingPlans/**`; return `/clasificados/bienes-raices/pago/exito` \| `/cancelado` | `AgenteIndividualResidencialPreviewClient.tsx:17,23,24,29`; same pago routes | **no Stripe hop** — `isInventoryAdd ⇒ needsPayment=false` (`AgenteIndividualResidencialPreviewClient.tsx:376`), then server `activate_pending` `:393-400` | `rentas/preview/shared/rentasPreviewPaidCheckout.ts:10-13`, call `RentasPrivadoPreviewClient.tsx:203`; return `/revenue-os/pago/exito` \| `/cancelado` (**no rentas-dedicated pago route**) | call `RentasNegocioPreviewClient.tsx:200`; same generic pago routes |
| **PUBLIC DETAIL** | `/clasificados/anuncio/[id]` → `BienesRaicesPrivadoLiveDetailShell` (`anuncio/[id]/page.tsx:1431`, `:1470-1474`). Alias `/clasificados/bienes-raices/anuncio/[id]` = redirect | same route → `BienesRaicesNegocioLiveDetailShell` | same route + shell, `isChild` at `BienesRaicesNegocioLiveDetailShell.tsx:416`; public visibility gated (see 12A) | canonical `/clasificados/rentas/listing/[id]` (`page.tsx:41-54`). Legacy `/clasificados/rentas/anuncio/[id]` = param-preserving redirect (Gate I.5.4D); legacy monolith branch `anuncio/[id]/page.tsx:2189` | same |
| **DASHBOARD** | `/dashboard/mis-anuncios` → `LeonixRealEstateListingManageCard.tsx:351` | same card `:353-364` | `bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx`; child actions `bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx:195-213` | same card `:90`, `:94-111` | same card `:91`, `:100` |
| **EDIT** | `/dashboard/mis-anuncios/[id]/editar` (`LeonixRealEstateListingManageCard.tsx:343` `fsboDashboardEditHref`, used `:352`) — **generic inline editor, 30-min window** (`editar/page.tsx:30`, `:259`) | `/clasificados/publicar/bienes-raices/negocio?edit=1&mode=listing-edit&…` via `bienesListingEditHref` (`LeonixRealEstateListingManageCard.tsx:353-364`) | parent workspace + `&openChildDraftId=br-db-child-<id>` (`dashboard/mis-anuncios/[id]/page.tsx:792-793`, `BrNegocioListingInventoryActions.tsx:195`). Generic dashboard-linked child edit is **deliberately suppressed** — see F-05 | `/clasificados/publicar/rentas/privado?edit=1&mode=listing-edit&listingId=…&lane=privado` (`LeonixRealEstateListingManageCard.tsx:94-111`) | `…/rentas/negocio?…&lane=negocio` (same builder) |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/bienes-raices/page.tsx` → `ListingsCategoryOpsQueuePage` (category-level, no lane split) | same | same + role/parent badges `app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx:119-122`; guard `app/admin/_lib/adminInventoryActionGuard.ts:19-25`; activation `app/api/admin/clasificados/listings/[id]/route.ts:129`, `:198` | `app/admin/(dashboard)/workspace/clasificados/rentas/page.tsx:8` (`categorySlug="rentas"`) + `rentas/[id]/page.tsx` | same |
| **API ROUTES** | none for publish (client-side write). Lifecycle `POST /api/clasificados/bienes-raices/listing-lifecycle` | `POST /api/clasificados/bienes-raices/listing-edit` (`route.ts:234`); lifecycle as left; `GET /api/clasificados/bienes-raices/public/entitlement-overlay` | same `listing-edit` route | `POST /api/clasificados/rentas/listing-edit`; `POST /api/clasificados/rentas/draft-media-upload`; `POST /api/clasificados/rentas/inquiry` | same |

### 1.2 Storage map

| Field | BR-PRIV | BR-NEG | BR-CHILD | RENT-PRIV | RENT-NEG |
|---|---|---|---|---|---|
| **PRIMARY TABLE** | `public.listings` | `public.listings` | `public.listings` | `public.listings` | `public.listings` |
| **OWNER FIELD** | `owner_id` (`leonixPublishRealEstateListingCore.ts:185`) | same | same | same | same |
| **LISTING UUID** | `listings.id` | `listings.id` | `listings.id` (own row) | `listings.id` | `listings.id` |
| **LEONIX AD ID** | `listings.leonix_ad_id`, prefix `BR` — `supabase/migrations/20260508160000_leonix_listings_prefix_bienes_raices_br.sql`; allocator `clasificados/lib/leonixAdIdAllocator.ts:38-44` (`allocateLeonixAdIdForListingsCategory`) | same | same (own id) | `listings.leonix_ad_id` (rentas prefix) | same |
| **PARENT FIELD** | N-A | `br_inventory_parent_listing_id` = null; is itself the parent | `br_inventory_parent_listing_id uuid` → `listings.id`, FK `on delete set null` | N-A (registry: `supportsParentChildInventory: false`) | N-A |
| **INVENTORY ROLE FIELD** | N-A (null) | `inventory_role='main'` | `inventory_role='inventory_property'` | N-A | N-A |
| **GROUP FIELD** | N-A | `br_inventory_group_id` (self-heal `leonixPublishRealEstateListingCore.ts:610-621`) | `br_inventory_group_id` (shared with parent) | N-A | N-A |
| **DRAFT STORE** | sessionStorage `br-privado-draft-v1` + localStorage mirror `br-privado-draft-v1-ls-fallback` (`privado/application/utils/bienesRaicesPrivadoDraft.ts:12`, `:18`); media IDB `lx-br-privado-draft` ns `br-privado-v1` (`bienesRaicesPrivadoDraftMedia.ts:9-10`) | sessionStorage, **instance-scoped** `br-negocio-agente-residencial-preview-draft:${applicationInstanceId}` (`agente-individual/application/utils/previewDraft.ts:176-178`); instance id mirrored to the URL `AgenteIndividualResidencialApplication.tsx:209-215`; media IDB `lx-br-agente-res-draft` store `kv` (`brAgenteResDraftMediaIdb.ts:6-8`) | sessionStorage `br-negocio-child-inventory-editor-session` (`brNegocioChildInventoryEditorSession.ts:15`, `:20-21`); media reuses the L2 IDB (`brNegocioChildMediaCanonical.ts:7-10`) | sessionStorage `rentas-privado-draft-v1` + `…-ls-fallback` (`rentasPrivadoDraft.ts:12`, `:15`); media IDB `lx-rentas-privado-draft` ns `rentas-privado-v1` | sessionStorage `rentas-negocio-draft-v1` + `…-ls-fallback` (`rentasNegocioDraft.ts:12`, `:14`); media IDB `lx-rentas-negocio-draft` ns `rentas-negocio-v1` |
| **MIGRATIONS** | `20260421130001_listings_enable_rls_full_policies.sql`, `20260508160000_leonix_listings_prefix_bienes_raices_br.sql`, `20260804120000_listings_publish_attempt_idempotency_key.sql`, `20260509120000_classifieds_republish_capability.sql`, `20260812090000_listing_analytics_owner_scoped_select_rls.sql` | + `20260810120000_autos_br_negocio_capacity_activation_rpc.sql` | + `20260518130600_br_property_inventory_grouping.sql` | `20250313200000_listings_rentas_negocio.sql`, `20260421120000_rentas_listings_zip_and_public_read.sql`, `20260714231500_rentas_lifecycle_reminders_and_expiration_index.sql` | same |
| **SHARED (all 5)** | `20260819150000_saved_search_match_events_br_rentas.sql`, `20260827180000_leonix_professional_identities_br_rentas_community_trust.sql`, `20260827190000_leonix_endorsement_votes_comida_local_br_rentas_reconcile.sql` | | | | |
| **VERIFIERS** | `scripts/br-draft-persist-01-audit.ts`, `br-launch-selftest.ts`, `br-authenticated-smoke.ts`, `br-supabase-anon-smoke.ts`, `bienes-active-application-refresh-persistence-audit.ts`, `bienes-hydration-proof-01-core.ts`, `br12d-2-hoa-application-surfacing-audit.ts`, `bienes-spacebar-multiday-open-house-01-core.ts` | + `bienes-final-publish-stripe-rotation-05-audit.ts`, `bienes-final-launch-golden-stack-01-core.ts`, `bienes-titled-business-links-hydration-01-core.ts` | + `br13a/b/c/d-property-inventory-*`, `br-inv-a..e-*`, `br-inv-fix-01a..01e-*`, `br-inv-wave1-gate1-2-4-5-selftest.ts`, `bienes-child-inventory-persistence-rehydration-audit.ts`, `bienes-final-parent-child-publish-inspection-08-audit.ts`, `bienes-child-future-child-parent-parity-final-09-audit.ts`, `bienes-worldwide-location-visible-parent-child-06-audit.ts`, `gate-g2-3-1..3-5-br-*-selftest.ts`, `gate-i4-4c-br-inventory-final-prefetch-gap-selftest.ts` | `scripts/rentas-e2e-pipeline-smoke.ts` | same |
| **E2E** | `e2e/bienes-raices/br-runtime-qa.spec.ts`, `e2e/bienes-raices/br-spacebar-multiday-open-house.spec.ts` (config `playwright.br-runtime.config.mjs`) | same | **none dedicated** | `e2e/rentas/rentas-runtime-qa.spec.ts`, `e2e/rentas/rentas-sample-content-full-qa.spec.ts` (configs `playwright.rentas-runtime.config.mjs`, `playwright.rentas-start.config.mjs`) | same |

---

## 2. DRAFT · HARD REFRESH · UNSAVED GUARD (G05 / G06)

| Lane | Storage kind + key | Media persisted across F5? | Hard-refresh rehydration | Autosave trigger | **Leave guard** |
|---|---|---|---|---|---|
| **BR-PRIV** | sessionStorage `br-privado-draft-v1` (+ LS mirror) | **YES** — photos + seller photo in IDB `lx-br-privado-draft`. **Device video LOST by design**: `videoLocalDataUrl` stripped at `bienesRaicesPrivadoDraft.ts:81-83` | `BienesRaicesPrivadoForm.tsx:126-147` → `loadBienesRaicesPrivadoDraft()` `:129` → inlines IDB at `bienesRaicesPrivadoDraft.ts:62` | 280 ms debounce `BienesRaicesPrivadoForm.tsx:151-157`; per-media `queueMicrotask` `:195,:211,:641,:654,:664,:737,:768` | **NOT ADOPTED — no guard of any kind.** Zero `beforeunload`/`pagehide` under `publicar/bienes-raices/privado/`. Worst of the five. *(The `useLeonixPublishFlowExitClear` hook at `BienesRaicesPrivadoApplication.tsx:9`,`:27` is a publish-flow **cleanup** hook, not a leave guard.)* |
| **BR-NEG** | sessionStorage, instance-scoped `br-negocio-agente-residencial-preview-draft:${id}` | **YES** — IDB `lx-br-agente-res-draft`; `data:` blobs stripped from session JSON (`previewDraft.ts:348`) | `AgenteIndividualResidencialApplication.tsx:238-270` (`useLayoutEffect` → `bootstrapAgenteIndividualResidencialApplicationStateResolved` `:244`, `setState` `:258`); dashboard-edit branch `:276-326` | adaptive: **0 ms** if unpersisted `data:` photos, else 800 ms — `:171-190` | **NOT ADOPTED — silent.** `beforeunload` at `:202` but handler `onPageHide` `:194-200` is **flush-only**: no `preventDefault()`, no `returnValue` ⇒ browser shows no warning |
| **BR-CHILD** | sessionStorage `br-negocio-child-inventory-editor-session` | **YES via durable IDB refs** (`brNegocioChildMediaCanonical.ts:43-45`, `isDurablePhotoUrl` `brNegocioInventoryDraftPersistence.ts:31-38`). The in-memory `childInventoryMediaBridge` `:13-20` is **volatile and does not survive F5** | (a) drawer open `BrNegocioChildInventoryFullApplication.tsx:158-162`; (b) shell remount after F5 `BrNegocioPrePublishInventoryShell.tsx:196-208` (re-adopts `editingId` so `CHILD_EDITOR_*` IDB media can rehydrate) | adaptive: 0 ms with raw `data:` photos else 400 ms — `BrNegocioChildInventoryFullApplication.tsx:289-299` | **NOT ADOPTED — silent.** `beforeunload` `:310`, handler `onPageHide` `:304-308` flush-only |
| **RENT-PRIV** | sessionStorage `rentas-privado-draft-v1` (+ LS fallback) | **YES** — IDB `lx-rentas-privado-draft` (photos + seller photo) | new draft `RentasPrivadoForm.tsx:252-262`; dashboard-edit `:182-251` via `hydrateRentasDashboardEditDraft` `:206`,`:231` | 280 ms `:271-282`; **pagehide/visibilitychange flush `:290-308`**; per-media `queueMicrotask` `:361,:399,:715,:728,:738,:811,:841` | **NOT ADOPTED for the new-draft flow.** `beforeunload` `:310-319` — but `:311` is `if (!editContext) return;`, so it arms **only** in dashboard-edit. The FSBO/new-listing publish flow is unguarded |
| **RENT-NEG** | sessionStorage `rentas-negocio-draft-v1` (+ LS fallback) | **YES** — IDB `lx-rentas-negocio-draft` (photos + logo) | new draft `RentasNegocioForm.tsx:257-262`; dashboard-edit `:236-254` | 280 ms `:265-273`; pagehide/visibilitychange flush `:280-298` | **NOT ADOPTED for the new-draft flow.** Identical defect: `beforeunload` `:300-309`, gated by `:301` `if (!editContext) return;` |

### The shared guard exists and no lane uses it
`app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts:35` — does `e.preventDefault(); e.returnValue = ""` at `:53-54`, plus a pagehide re-persist `:44-48` and in-flow preview suppression `:16-22`. Its **only** consumers at `origin/main`:
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx:17` (import), `:615` (call)
- `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx:22`, `:303`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx:22`, `:213`

Zero hits under `bienes-raices/` or `rentas/`. The module exists identically at Sept `e3956df8` — **the missing piece is the five consumer call sites, not the module.**

### Containment of `629c5a46` "adopt global application leave guard"
- `git merge-base --is-ancestor 629c5a46 origin/main` → **1** (not contained)
- `git merge-base --is-ancestor 629c5a46 e3956df8` → **1** (not contained)
- `git branch -a --contains 629c5a46` → **only** `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` (local + remote)

**It is a THIRD-BRANCH commit, not a Sept commit** (correcting the brief). 4 files, +48 lines, insertions only: `AgenteIndividualResidencialApplication.tsx` (+12), `BienesRaicesPrivadoForm.tsx` (+10), `RentasNegocioForm.tsx` (+13), `RentasPrivadoForm.tsx` (+13). It would fix **BR-PRIV, BR-NEG, RENT-PRIV, RENT-NEG**. It would **not** fix **BR-CHILD** — `BrNegocioChildInventoryFullApplication.tsx` is not in its diff.

**REFERENCE-IMPLEMENTATION RULE — leave guard**
- PROVEN REFERENCE EXISTS: **YES** · REFERENCE CATEGORY: **Servicios** (nearest sibling, same `publicar/` tree) — secondary: Restaurantes
- REFERENCE PATH: `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx:17` + `:615`
- TARGET PATHS: `BienesRaicesPrivadoForm.tsx` (highest severity — no guard at all) · `AgenteIndividualResidencialApplication.tsx:194-207` · `RentasPrivadoForm.tsx:310-319` · `RentasNegocioForm.tsx:300-309` · `BrNegocioChildInventoryFullApplication.tsx:304-315`
- DIFFERENCE: targets either have nothing, or a flush-only `beforeunload` with no `preventDefault()`/`returnValue`, or an `editContext`-gated guard that skips the new-draft flow
- **ACTION: ADOPT EXISTING** for the four top-level lanes (merge `629c5a46`) · **NET NEW** for BR-CHILD (no commit anywhere covers it)

---

## 3. PREVIEW + PREVIEW→EDIT (G07)

| Lane | Preview route | Preview VM builder | Shared preview shell? | Preview→edit mechanism |
|---|---|---|---|---|
| **BR-PRIV** | `/clasificados/bienes-raices/preview/privado` | `privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts`; live-row twin `bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm.ts` | **TRUE** — `LeonixPreviewPageShell` at `BienesRaicesPrivadoPreviewClient.tsx:39`; gallery `BienesRaicesPrivadoPreviewView.tsx:5-11` (`leonixGallerySlides`, `LeonixPreviewGalleryLightbox`) | **TRUE (shared)** — `LeonixApplicationVerAnuncioActions` at `BienesRaicesPrivadoForm.tsx:11`, rendered `:1265`; shell `editHref` |
| **BR-NEG** | `/clasificados/bienes-raices/preview/negocio` + in-flow `…/agente-individual/preview/page.tsx` | `negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts` (+ `brNegocioInputToPreviewMap.ts`, `bienesRaicesNegocioPreviewVm.ts`) | **FALSE** — bespoke `AgenteIndividualResidencialPreviewPage.tsx` (own lightbox `AgenteIndividualResidencialMediaLightbox.tsx`, wired `:49`) | **FALSE (lane-local)** — `markPublishFlowReturningToEdit` at `AgenteIndividualResidencialPreviewClient.tsx:52` |
| **BR-CHILD** | overlay `BrNegocioChildInventoryFullPreviewOverlay.tsx:5` | **shares the parent's** — renders `AgenteIndividualResidencialPreviewPage` (single VM builder for parent and child; no divergent child renderer) | **FALSE** (inherits BR-NEG's bespoke shell) | **FALSE (overlay-local)** — `BrNegocioChildInventoryFullApplication.tsx:38` |
| **RENT-PRIV** | `/clasificados/rentas/preview/privado` | `publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts` | **TRUE** — `LeonixPreviewPageShell` at `RentasPrivadoPreviewClient.tsx:15`, rendered `:319`. `ClasificadosPreviewAdCanvas` / `buildFullPreviewListingData` **FALSE** | **FALSE (shared component)** — return via shell `editHref` `:319` + `ClasificadosApplicationTopActions` (`RentasPrivadoForm.tsx:6`) |
| **RENT-NEG** | `/clasificados/rentas/preview/negocio` | `mapRentasNegocioStateToPreviewVm.ts` + `rentasNegocioToBienesRaicesNegocioState.ts` (cross-maps into the BR Negocio VM) | **TRUE** — `RentasNegocioPreviewClient.tsx:15`, rendered `:314` | **FALSE (shared component)** — shell `editHref` `:314` + `ClasificadosApplicationTopActions` (`RentasNegocioForm.tsx:12`) |

**REFERENCE-IMPLEMENTATION RULE — `LeonixApplicationVerAnuncioActions`**
PROVEN REFERENCE EXISTS: **YES** · CATEGORY: **Bienes Raíces privado** · REFERENCE PATH `publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx:11` (+ `:1265`) · TARGET PATHS `AgenteIndividualResidencialPreviewClient.tsx:52` · `BrNegocioChildInventoryFullApplication.tsx:38` · `RentasPrivadoForm.tsx` · `RentasNegocioForm.tsx` · DIFFERENCE: four lanes hand-roll the preview→edit return · **ACTION: ADOPT EXISTING**.

**REFERENCE-IMPLEMENTATION RULE — `LeonixPreviewPageShell`**
PROVEN REFERENCE EXISTS: **YES** · CATEGORY: **BR privado / Rentas both lanes** · REFERENCE PATH `BienesRaicesPrivadoPreviewClient.tsx:39` · TARGET PATH `AgenteIndividualResidencialPreviewPage.tsx` (and therefore BR-CHILD) · DIFFERENCE: BR Negocio owns a parallel premium shell + a parallel lightbox · **ACTION: ADOPT EXISTING — but scope-heavy**; the BR Negocio shell is the richest preview in the repo and a straight swap would regress it. Recommend deferring behind an explicit design decision rather than treating it as a defect.

---

## 4. PUBLISH MAPPER → API → DB

**All five lanes share one publish core and one table.** There is **no server API route in the publish path for any of them** — the write is a client-side Supabase call from the preview component.

| Lane | Mapper symbol(s) | Params builder | Publish entry | API route | DB write target |
|---|---|---|---|---|---|
| **BR-PRIV** | `mapBienesRaicesPrivadoStateToPreviewVm` | `buildPublishParamsFromBienesRaicesPrivadoDraft` — `clasificados/lib/leonixPublishRealEstateFromDraftState.ts:206` | `publishLeonixListingFromBienesRaicesPrivadoDraft` `:254`, called `BienesRaicesPrivadoPreviewClient.tsx:169` with `activationMode:"pending_payment"` `:170` | **none** (client-side) | `listings` |
| **BR-NEG** | `mapBienesRaicesNegocioStateToPreviewVm` / `mapAgenteResidencialFormStateToNegocioForPublish` | `buildPublishParamsFromAgenteResidencialDraft` `:448` (`mode:"main"`) | `publishLeonixListingFromAgenteResidencialDraft` `:468`, called `AgenteIndividualResidencialPreviewClient.tsx:384-386` | **none** | `listings` |
| **BR-CHILD** | `brNegocioChildInventoryFormMapping.ts` → same agente mapper | `buildPublishParamsFromAgenteResidencialDraft` `:448` with `mode:"add"`, `parentListingId`, `brInventoryGroupId` — role resolved `clasificados/lib/leonixBrPropertyInventoryPolicy.ts:199-206` | `publishLeonixListingFromAgenteResidencialDraft` `:468`, called `AgenteIndividualResidencialPreviewClient.tsx:149`+`:384` and `brNegocioInventoryBundlePendingPublish.ts:232` | **none** | `listings` (own row; `br_inventory_parent_listing_id` `:205`, `inventory_role` `:206`) |
| **RENT-PRIV** | `mapRentasPrivadoStateToPreviewVm` | `buildRentasPrivadoListingParams` `:293` | `publishLeonixListingFromRentasPrivadoDraft` `:278` (sets `rentasPaymentLane:"privado"`), called `RentasPrivadoPreviewClient.tsx:166` | **none** for the row; media pre-upload `POST /api/clasificados/rentas/draft-media-upload` via `rentas/shared/rentasDraftPublishPrepare.ts:17` | `listings` |
| **RENT-NEG** | `mapRentasNegocioStateToPreviewVm` + `rentasNegocioToBienesRaicesNegocioState` | `buildRentasNegocioListingParams` `:501` | `publishLeonixListingFromRentasNegocioDraft` `:486` (`rentasPaymentLane:"negocio"`), called `RentasNegocioPreviewClient.tsx:159` | same media route | `listings` |

**Common core — `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts`:**
- browser client `:18` (`createSupabaseBrowserClient`) — the write happens **in the browser under RLS**, not on the server
- insert payload assembled `:184-197`; BR inventory columns appended `:199-206`
- pending-row reuse lookup `:497-521` (Gate 3: a failed lookup is a **hard stop**, `:531-540`)
- **same-row branch** `:558-570`: reusable pending id ⇒ `updateListingsRowResilient` `:565`; else `insertListingsRowResilient` `:567`
- BR `main` group-id self-heal after insert `:610-621`

**Same-row proof at publish:** for RENT-PRIV, RENT-NEG, BR-NEG and BR-CHILD, a retried publish **reuses the existing pending row** (`:565`) — matched on owner + category + seller_type + status + title, and for BR business additionally on `inventory_role` and `br_inventory_parent_listing_id` (`:512-518`). **BR-PRIV is excluded from that reuse branch** (`:497-499` admits only `rentas` or `bienes-raices && seller_type==="business"`) — see F-04.

**Activation after payment:** BR → `activateBrNegocioListingAtomic` (`app/lib/listingPlans/capacityActivationRpc.ts:90-99`) from `brListingPaymentService.ts:209` / `brListingLifecycleService.ts:326`,`:372`. Rentas → `app/lib/listingPlans/revenueRentasFulfillment.ts:254` `.from("listings").update(patch).eq("id", …).eq("category","rentas")`, `is_published:true` at `:147`.

---

## 5. PER-LANE GLOBAL SYSTEM ADOPTION

`TRUE(path:line)` = the **lane's own file** imports/calls the shared module. Module existence alone is never counted. `N-A` = no such system exists, or it is app-global with no per-lane surface.

| # | System | BR-PRIV | BR-NEG | BR-CHILD | RENT-PRIV | RENT-NEG |
|---|---|---|---|---|---|---|
|1|checkpoint|TRUE `BienesRaicesPrivadoPreviewClient.tsx:8`|TRUE `AgenteIndividualResidencialPreviewClient.tsx:12`|FALSE (lane-local `BrNegocioPrePublishInventoryShell.tsx:27`)|TRUE `RentasPrivadoPreviewClient.tsx:36`|TRUE `RentasNegocioPreviewClient.tsx:35`|
|2|draft (shared)|FALSE (substrate only: `bienesRaicesPrivadoDraftMedia.ts:6` → `app/lib/media/draftHeavyMediaIdb`)|FALSE (substrate only: `AgenteIndividualResidencialApplication.tsx:96` → `app/lib/listingDrafts/draftWorkspaceContract`)|FALSE (fully lane-local)|FALSE `RentasPrivadoForm.tsx:67`|FALSE `RentasNegocioForm.tsx:75`|
|3|unsaved guard|**FALSE** (no guard at all)|FALSE (flush-only `:202`)|FALSE (flush-only `:310`)|FALSE (edit-only `:311`)|FALSE (edit-only `:301`)|
|4|preview shell|TRUE `BienesRaicesPrivadoPreviewClient.tsx:39`|FALSE (bespoke)|FALSE (bespoke)|TRUE `RentasPrivadoPreviewClient.tsx:15`|TRUE `RentasNegocioPreviewClient.tsx:15`|
|5|preview→edit|TRUE `BienesRaicesPrivadoForm.tsx:11`|FALSE `AgenteIndividualResidencialPreviewClient.tsx:52`|FALSE `BrNegocioChildInventoryFullApplication.tsx:38`|FALSE (shell `editHref` `:319`)|FALSE (shell `editHref` `:314`)|
|6|checkout|TRUE `bienesRaicesFsboPreviewPaidCheckout.ts:4-7`|TRUE `AgenteIndividualResidencialPreviewClient.tsx:17,23,24,29`|TRUE `brNegocioInventoryBundlePendingPublish.ts:11`|TRUE `RentasPrivadoPreviewClient.tsx:34-35`,`:203`|TRUE `RentasNegocioPreviewClient.tsx:33-34`,`:200`|
|7|promo|FALSE for `RevenuePromoField`; logic TRUE `bienesRaicesFsboPreviewPaidCheckout.ts:6`|FALSE for the field; logic TRUE `…PreviewClient.tsx:23`|FALSE|FALSE for the field; wired via checkpoint `RentasPrivadoPreviewClient.tsx:393`→`:121`|FALSE for the field; `RentasNegocioPreviewClient.tsx:394`|
|8|media/gallery|TRUE strip `BienesRaicesPrivadoForm.tsx:45`; slides+lightbox `BienesRaicesPrivadoPreviewView.tsx:5-11`|TRUE strip `steps01-03.tsx:8`; lightbox FALSE (own)|TRUE strip (transitive `BrNegocioChildInventoryFullApplication.tsx:6-10`); slides/lightbox FALSE|TRUE strip `RentasPrivadoForm.tsx:42`,`:706`; lightbox FALSE|TRUE strip `RentasNegocioForm.tsx:43`,`:725`; lightbox FALSE|
|9|video|TRUE (transitive) `BienesRaicesPrivadoPreviewView.tsx:13`|FALSE (BR-local `brPreviewVideoEmbed`, `BrPreviewVideoModal.tsx:13`)|FALSE|FALSE (external-URL list `RentasPrivadoForm.tsx:367-390`; Mux chain `rentasDraftVideoHydrate.ts` is **dead**)|FALSE `RentasNegocioForm.tsx:370-379`|
|10|phone/SMS/WhatsApp|TRUE `bienesRaicesPrivadoFormState.ts:18-22` + `mapBienesRaicesPrivadoStateToPreviewVm.ts:35-39`|TRUE `bienesRaicesNegocioFormState.ts:11,15` + `mapBienesRaicesNegocioStateToPreviewVm.ts:30`|FALSE (inherited slice, not channel-typed — `BrNegocioChildInventoryInheritedContactPanel.tsx`)|TRUE(partial) `rentasPrivadoFormState.ts:21,25` + `mapRentasPrivadoStateToPreviewVm.ts:33`; hrefs hand-rolled `:275-276`|TRUE(partial) `rentasNegocioFormState.ts:23,27` + `mapRentasNegocioStateToPreviewVm.ts:34`; hrefs `:150-151`|
|10b|`ContactActions` / `leonixListingContactResolve`|FALSE (see F-06)|FALSE|FALSE|FALSE|FALSE|
|11|email / lead|FALSE (raw `mailto:` `mapBrListingRowToPrivadoPreviewVm.ts:77`)|FALSE (raw `mailto:` `BienesRaicesNegocioLiveDetailShell.tsx:308`, `BrAgenteResContactSidebar.tsx:181`)|FALSE|TRUE `RentasListingDetailClient.tsx:229` → `/api/clasificados/rentas/inquiry`|TRUE (same, shared route)|
|12|rich correo|FALSE|FALSE|FALSE|TRUE `RentasListingDetailClient.tsx:14`|TRUE (same)|
|13|languages|FALSE|TRUE `steps04-09.tsx:31,37` (Step07 `:1225`)|FALSE (child imports Step04/05/06/09 only — `BrNegocioChildInventoryFullApplication.tsx:11-16`)|FALSE|TRUE `RentasNegocioForm.tsx:46,52`|
|14|hours|FALSE|FALSE (Step09 open-house slots `steps04-09.tsx:1404` are not business hours)|FALSE|FALSE (free text `RentasTipoFlowDetailFields.tsx:284`)|FALSE — **and `negocioHorario` is read at `rentas/negocio/mapping/buildRentasNegocioPreviewListingData.ts:100` but never collected by the form** (zero matches in `publicar/rentas/**`)|
|15|websites/social|TRUE `mapBienesRaicesPrivadoStateToPreviewVm.ts:32`|FALSE (uses `leonixNegocioBusinessMetaFromFormState`)|FALSE|TRUE `mapRentasPrivadoStateToPreviewVm.ts:36`|TRUE `mapRentasNegocioStateToPreviewVm.ts:31`|
|16|CTA hub|FALSE|TRUE `BrAgenteResContactSidebar.tsx:45` (dispatch `:237`)|TRUE (same sidebar, ungated)|FALSE|FALSE|
|17|translate|TRUE `anuncio/[id]/page.tsx:51`, rendered `:1468`|TRUE (same)|TRUE (same)|TRUE `RentasListingDetailClient.tsx:11-13` + `rentas/lib/useRentasListingTranslation.ts:11`|TRUE (same)|
|18|ES/EN (`app/lib/i18n/**`)|FALSE (per-lane copy: `bienesRaicesPreviewViewI18n.ts` + `clasificadosPublishLang`)|FALSE (`brAgenteResidencialCopy.es/en.ts` + `BrAgenteResidencialLocaleContext.tsx`)|FALSE `BrNegocioChildInventoryFullApplication.tsx:17-19`|TRUE `RentasPrivadoForm.tsx:73` (`getLaunchUiMessages`)|TRUE `RentasAnuncioFormSection.tsx:31` (via `RentasNegocioForm.tsx:44`) + `:80`|
|19|community trust|FALSE|TRUE `BrAgenteResContactSidebar.tsx:47`|TRUE (same, ungated)|TRUE `RentasPrivadoPreviewClient.tsx:18` → `RentasVisualMatchPreviewView.tsx:25`,`:813`|TRUE `RentasNegocioPreviewClient.tsx:16` → same `:813`|
|20|google/yelp|FALSE|TRUE `BrAgenteResContactSidebar.tsx:46` (`:453,:465,:471`)|TRUE (same, ungated)|FALSE|FALSE|
|21|address verifier|**N-A**|N-A|N-A|N-A|N-A — no `addressVerif*` module exists anywhere in `app/` @origin/main. **This system does not exist; it is NET NEW for every category.**|
|22|location privacy / directions|FALSE (`googleMapsSearchUrl` `mapBienesRaicesPrivadoStateToPreviewVm.ts:33`)|FALSE (`BrLeonixPreviewMiniMap` `AgenteIndividualResidencialPreviewPage.tsx:48`)|FALSE|FALSE (`mostrarDireccionExacta` `mapRentasPrivadoStateToPreviewVm.ts:217,233`; no directions CTA)|FALSE (`mapRentasNegocioStateToPreviewVm.ts:160,243`)|
|23|saved search|TRUE `app/lib/saved-search/bienes-raices/**` (button on BR results, lane-agnostic)|TRUE (same)|TRUE — child eligibility explicitly handled: `bienesRaicesSavedSearchEligibilitySupport.ts` imports `brPublicChildParentVisibility`|TRUE `revenueRentasFulfillment.ts:15,197`; UI `RentasResultsClient.tsx:70`|TRUE (same, category-level)|
|24|save / like / share|FALSE-ish — bespoke heart+share `BienesRaicesPrivadoLiveDetailShell.tsx:82,91`; no shared buttons|FALSE-ish — bespoke `BienesRaicesNegocioLiveDetailShell.tsx:389,398`|FALSE-ish (same shell)|TRUE `RentasListingDetailClient.tsx:7,8,9`|TRUE (same)|
|24b|report (`LeonixInlineListingReport`)|FALSE|FALSE|FALSE|FALSE|FALSE|
|25|analytics|**PARTIAL** — save-toggle TRUE `BienesRaicesPrivadoLiveDetailShell.tsx:7`; **no `listing_view`/`listing_open`** (F-01)|**PARTIAL** — CTA/contact TRUE `BienesRaicesNegocioLiveDetailShell.tsx:7,21,465-466,475` → `BrAgenteResContactSidebar.tsx:44`; **no `listing_view`** (F-01)|PARTIAL (same shell)|TRUE `rentas/analytics/rentasAnalytics.ts:1`; consumed `RentasListingDetailClient.tsx:16`, `RentasVisualMatchPreviewView.tsx:17,33`|TRUE (same)|
|26|results|TRUE (single BR surface, `bienes-raices/resultados/components/BienesRaicesResultsFilters.tsx` uses `categoryStandard`)|TRUE|TRUE (gated by `brPublicInventoryMode.ts`)|FALSE — bespoke `rentas/results/**`; `categoryStandard` only in `rentas/landing/**`|FALSE|
|27|related listings|FALSE|TRUE `BienesRaicesNegocioLiveDetailShell.tsx:27`, rendered `:492` (`RelatedBrAgentProperties`)|FALSE — explicitly gated off `{!isChild && portfolio.length …}` `:491`|FALSE — `RentasSameCompanyListingsSection` only at legacy `anuncio/[id]/page.tsx:2154`|FALSE|
|28|business hub|FALSE|FALSE for `BusinessListingIdentityRail`; own hub `BrAgenteResContactSidebar.tsx:203`|FALSE; own `BrNegocioChildInventoryInheritedHubPanel.tsx`|N-A|**FALSE — 13_'s finding re-confirmed**: canonical `rentas/listing/[id]/page.tsx:41-54` renders only `RentasListingDetailClient`, which has no business rail (imports `:3-34`). `RentasNegocioDesktopBusinessRail` is rendered only at legacy `anuncio/[id]/page.tsx:2189` and `en-venta/listing/EnVentaAnuncioLayout.tsx:981`|
|29|revenue OS|TRUE `bienesRaicesFsboPreviewPaidCheckout.ts:5,7`|TRUE `AgenteIndividualResidencialPreviewClient.tsx:24,29`; `…Application.tsx:86`|TRUE `brNegocioInventoryBundlePendingPublish.ts:11`|TRUE `RentasPrivadoPreviewClient.tsx:34-35`; `revenueRentasFulfillment.ts:147,218,254`|TRUE `RentasNegocioPreviewClient.tsx:33-34`|
|30|placement / ranking|FALSE|FALSE|FALSE — only the server route `app/api/clasificados/bienes-raices/public/entitlement-overlay/route.ts` touches `placementRankingAdapter`; no lane UI consumes it|FALSE — no `priority_score`/`placementScore`/`rankingScore` anywhere in `app/`; no `.order()` in `rentas/lib/fetchRentasPublicListingsForBrowse.ts`|FALSE|
|31|dashboard|TRUE `dashboard/mis-anuncios/page.tsx:2154` → `LeonixRealEstateListingManageCard.tsx:351`|TRUE `:353-364`|TRUE `bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx`; actions `BrNegocioListingInventoryActions.tsx:195-213`|TRUE `LeonixRealEstateListingManageCard.tsx:90,94-111`|TRUE `:91,:100`|
|32|active edit|TRUE — generic editor `/dashboard/mis-anuncios/[id]/editar`, entered `LeonixRealEstateListingManageCard.tsx:343`,`:352`; **30-min window** `editar/page.tsx:30,259`|TRUE — `POST /api/clasificados/bienes-raices/listing-edit`, called `AgenteIndividualResidencialApplication.tsx:426` and `AgenteIndividualResidencialPreviewClient.tsx:546`|TRUE — same API, entered via the parent workspace `BrNegocioListingInventoryActions.tsx:195`|TRUE — `POST /api/clasificados/rentas/listing-edit`, called `RentasPrivadoForm.tsx:437`; ctx `:76,:82`, hydration `:75`|TRUE — same route, called `RentasNegocioForm.tsx:430`; ctx `:81,:83,:89`|
|33|republish **same row**|**YES — UPDATE** `dashboard/lib/ownerListingsLifecycleClient.ts:48-52` (`.from("listings").update(patch).eq("id", id)`), called `editar/page.tsx:586`|**YES — UPDATE** `api/clasificados/bienes-raices/listing-edit/route.ts:219-222` (`.update(builtPatch.patch).eq("id", input.existing.id).eq("owner_id", …)`)|**YES — UPDATE** same helper, child call `route.ts:352-359`, extra scope `.eq("br_inventory_parent_listing_id", …)` `:224-225`. **No `.insert()` anywhere in that route**|**YES — UPDATE** `api/clasificados/rentas/listing-edit/route.ts:141-143` (`.from("listings").update(patch).eq("id", listingId)`)|**YES — UPDATE** same route/line|
|34|no-recharge|TRUE — no Stripe/checkout in the save path `editar/page.tsx:535-597`|TRUE — zero `stripe`/`checkout` calls in `listing-edit/route.ts` (only a comment at `:286`)|TRUE (same route)|TRUE — zero Stripe references in `api/clasificados/rentas/listing-edit/route.ts`|TRUE (same route)|
|35|admin|TRUE `admin/(dashboard)/workspace/clasificados/bienes-raices/page.tsx` (`ListingsCategoryOpsQueuePage`)|TRUE (same)|TRUE (same + role badges `AdminListingsTable.tsx:119-122`, guard `adminInventoryActionGuard.ts:19-25`, RPC activation `api/admin/clasificados/listings/[id]/route.ts:129,198`)|TRUE `admin/(dashboard)/workspace/clasificados/rentas/page.tsx:8`|TRUE (same)|
|36|SEO|TRUE `anuncio/[id]/layout.tsx:9` (`generateMetadata`) + `leonixListingStructuredPayload` `anuncio/[id]/page.tsx:361`|TRUE (same)|TRUE (same)|PARTIAL `rentas/listing/[id]/page.tsx:17-39` (title/canonical/OG). **No JSON-LD on the canonical detail**|PARTIAL (same)|
|37|mobile / PWA|N-A (app-global `app/manifest.ts`, `app/components/ServiceWorkerRegistration.tsx`, `public/sw.js`)|N-A|N-A|N-A|N-A|
|38|security / RLS|TRUE `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql:29` (anon), `:63` (authed), `:74`/`:80` (owner writes)|TRUE (same, lane-blind)|TRUE for the row rule — **but child/parent gating is app-level only, not RLS** (see 12A F-03)|TRUE `:19-23`|TRUE (same)|

### Adoption tallies (38 rows per lane, excluding the 10b/24b sub-rows)

| Lane | TRUE | PARTIAL | FALSE | N-A |
|---|---|---|---|---|
| BR-PRIV | 16 | 1 | 19 | 2 |
| BR-NEG | 17 | 1 | 18 | 2 |
| BR-CHILD | 12 | 1 | 23 | 2 |
| RENT-PRIV | 18 | 1 | 17 | 2 |
| RENT-NEG | 19 | 1 | 16 | 2 |

---

## 6. G41 BIENES PARENT / CHILD

Fully covered in **`12A_BIENES_PARENT_CHILD_AUDIT.md`**. Headline: the pre-supplied anchor is **CONFIRMED byte-for-byte** at `origin/main` (`brPublicChildParentVisibility.ts:51-74`, `fetchBrPublishedListingsBrowser.ts:86-99`, `anuncio/[id]/page.tsx:616-646` with the call at `:642`), plus a **third adopted consumer** the brief did not list (`app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts:44-59`).
**Tally: TRUE 13 · PARTIAL 4 · FALSE 1** over the 18 G41 items.
Its own findings F-01…F-07 (capacity 0/1, two ungated fetchers, RLS gap, missing child identity guard, hub-freeze, child leave guard, analytics blackout) are summarised in §8 below where they are cross-lane.

---

## 7. ACTIVE EDIT / REPUBLISH — route + same-row only

Per the brief, the field-loss / destructive-mapper analysis belongs to `06_DATA_ROUND_TRIP_FIELD_AUDIT.md` and is **not** re-derived. Facts only:

| Lane | Route / action | Same row? |
|---|---|---|
| BR-PRIV | `/dashboard/mis-anuncios/[id]/editar` → `save()` `editar/page.tsx:530`,`:586` → `applyOwnerListingPatch` (`dashboard/lib/ownerListingsLifecycleClient.ts:36-52`) | **YES** — `.from("listings").update(patch).eq("id", id)` `:48-52` |
| BR-NEG | `POST /api/clasificados/bienes-raices/listing-edit` (`route.ts:234`) → `updateOneListing` | **YES** — `.update(...).eq("id", input.existing.id).eq("owner_id", input.ownerId)` `:219-222` |
| BR-CHILD | same route, child loop `route.ts:334-364` | **YES** — same helper, `.eq("br_inventory_parent_listing_id", …)` added `:224-225`. New children are **refused**, returned as `skippedNewChildren` `:333-337`,`:373` |
| RENT-PRIV | `POST /api/clasificados/rentas/listing-edit` (from `RentasPrivadoForm.tsx:437`) | **YES** — `.from("listings").update(patch).eq("id", listingId)` `route.ts:141-143` |
| RENT-NEG | same route (from `RentasNegocioForm.tsx:430`) | **YES** — same line; only the payload builder differs by lane |

---

## 8. FINDINGS (P0 / P1 / P2), each with the reference-implementation rule

### F-01 — **P0** · No `listing_view` / `listing_open` analytics on any Bienes Raíces public detail
`trackBrListingViewGlobal` / `trackBrListingOpenGlobal` (`app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts:110,:114`) have one emitter — `bienes-raices/listing/BrLiveDetailAnalyticsMount.tsx:13-14` — mounted from one place — `en-venta/listing/EnVentaAnuncioLayout.tsx:774` — which **BR rows can never reach**: `anuncio/[id]/page.tsx:1431` returns at `:1462-1476`, before `:1479`. Neither BR live shell mounts it (each imports only `trackListingSaveToggleAuthed`, `:7`). `BrEngagementRow.tsx` is likewise mounted only from `EnVentaAnuncioLayout.tsx:960` and `bienes-raices/shell/BienesRaicesPreviewCard.tsx:245`. Contact/CTA and save-toggle events **do** fire, so the funnel reports conversions with a zero denominator. Affects **BR-PRIV, BR-NEG, BR-CHILD**.
→ REFERENCE **YES** · CATEGORY En Venta · REFERENCE PATH `EnVentaAnuncioLayout.tsx:51`+`:774` · TARGET `BienesRaicesNegocioLiveDetailShell.tsx` (covers NEG+CHILD) and `BienesRaicesPrivadoLiveDetailShell.tsx` · DIFFERENCE: shells never mount it, though `analyticsContext` is already built at `BienesRaicesNegocioLiveDetailShell.tsx:465-466` in the exact prop shape · **ACTION: FIX REGRESSION** (one line per shell).

### F-02 — **P0** · BR Negocio base plan delivers **0** inventory properties; pack delivers **3 of 4**
The commercial parent is counted as a capacity slot at all three layers: DB `supabase/migrations/20260810120000_…:276` (against `v_limit` `:262`, block `:278`), server `app/lib/listingPlans/commercialWriteGuard.ts:178-194` (`:192-193`), client `clasificados/lib/leonixBrPropertyInventoryPolicy.ts:123-129` (`isActiveBrNegocioInventoryRow` never filters to `inventory_property`) → `:130-142` → `:151+`, consumed at `AgenteIndividualResidencialPreviewClient.tsx:358-374`. With `BR_BASE_INCLUDED_PROPERTIES=1` (`publishCheckoutCheckpoint.ts:65`), a base-plan agent can activate **zero** children.
→ REFERENCE **YES** · CATEGORY Autos + BR @Sept · REFERENCE PATH `10618f41` (Gate 6C.2) — `commercialWriteGuard.ts`, `…_fix_parent_inventory_capacity_counting.sql`, verifier `scripts/verify-gate6c2-parent-excluded-capacity-counting.ts`; **not in origin/main** (`--is-ancestor` → 1) · TARGET the three paths above · **ACTION: ADOPT EXISTING**. Detail in 12A F-01.

### F-03 — **P1** · No unsaved-changes leave guard on any of the five lanes
See §2. BR-PRIV has **nothing**; BR-NEG and BR-CHILD have flush-only `beforeunload` handlers with no `preventDefault()`; RENT-PRIV/RENT-NEG arm only when `editContext` is set, leaving the new-listing publish flow bare (`RentasPrivadoForm.tsx:311`, `RentasNegocioForm.tsx:301`).
→ REFERENCE **YES** · CATEGORY Servicios · REFERENCE PATH `publicar/servicios/components/ClasificadosServiciosApplication.tsx:17`+`:615` · TARGETS the five files listed in §2 · **ACTION: ADOPT EXISTING** for the four top-level lanes (`629c5a46`, third branch) · **NET NEW** for BR-CHILD.

### F-04 — **P1** · BR-PRIV (FSBO) has no DB-side pending-row reuse — duplicate pending rows across devices/sessions
`leonixPublishRealEstateListingCore.ts:497-499` admits only `category==="rentas"` or `bienes-raices && seller_type==="business"` into the reuse branch. BR-PRIV publishes with `activationMode:"pending_payment"` (`BienesRaicesPrivadoPreviewClient.tsx:169-170`), so every abandoned-Stripe retry takes the `insertListingsRowResilient` path at `:567`. Idempotency is provided only by a **client-side** cache key `br-fsbo-pending-checkout-listing-v1` (`BienesRaicesPrivadoPreviewClient.tsx:51`, validated `:140-161`, written `:183`) — it does not survive a cleared cache, a private window, or a different device.
→ REFERENCE **YES** · CATEGORY Rentas + BR Negocio (same file) · REFERENCE PATH `leonixPublishRealEstateListingCore.ts:497-521` (owner+category+seller_type+status+title match, hard-stop on lookup error `:531-540`) · TARGET the same predicate at `:497-499` · DIFFERENCE: BR privado is excluded from the branch · **ACTION: FIX REGRESSION** — widen the predicate to include `bienes-raices && seller_type==="personal"`.

### F-05 — **P1** · BR-CHILD edit via the generic dashboard-linked route is a known-broken path, suppressed rather than fixed
Documented in source at `dashboard/components/LeonixRealEstateListingManageCard.tsx:118-131` (Gate D.2.1/D.2.2): *"a child's Edit/Preview via the generic dashboard-linked route is confirmed broken … the hydration path re-includes the child as one of its own inventory properties, and the save API's self-referential `br_inventory_parent_listing_id` filter then fails."* `brDashboardEditHref` therefore resolves to `undefined` for a child (`:352-359`), and `brDashboardPreviewHref` likewise (`:371-382`). The working path is the parent-scoped `openChildDraftId` deep link (`dashboard/mis-anuncios/[id]/page.tsx:792-793`).
→ REFERENCE **YES** · CATEGORY BR Negocio parent · REFERENCE PATH `bienesListingEditHref` / `canonicalBrActions.get("edit")` `LeonixRealEstateListingManageCard.tsx:353-364` · TARGET the child hydration path in `bienesPublishedToAgenteApplicationDraft.ts` + the self-referential filter at `api/clasificados/bienes-raices/listing-edit/route.ts:224-225` · **ACTION: FIX REGRESSION** (currently masked, explicitly out of scope in-source).

### F-06 — **P2** · `resolveLeonixLiveListingContact` is computed then discarded for BR
`anuncio/[id]/page.tsx:737` resolves the canonical live contact, but it is not passed into `brListingProps` (`:1445-1459`), so BR detail falls back to raw `mailto:`/`tel:` construction (`mapBrListingRowToPrivadoPreviewVm.ts:77`, `BienesRaicesNegocioLiveDetailShell.tsx:308`, `BrAgenteResContactSidebar.tsx:181`). Affects all three BR lanes.
→ REFERENCE **YES** · CATEGORY En Venta / generic ListingView · REFERENCE PATH `en-venta/listing/EnVentaAnuncioLayout.tsx`, `clasificados/components/ListingView.tsx` · TARGET `anuncio/[id]/page.tsx:1445-1459` · **ACTION: FIX REGRESSION**.

### F-07 — **P2** · Rentas negocio hours field is read but never collected
`rentas/negocio/mapping/buildRentasNegocioPreviewListingData.ts:100` reads `d.negocioHorario`, but nothing under `publicar/rentas/**` ever collects it (zero matches). The value can only ever be empty for a real Rentas Negocio listing.
→ REFERENCE **YES** · CATEGORY Servicios / Restaurantes / Comida Local / Autos · REFERENCE PATH `app/components/forms/HoursEditor.tsx` + `app/lib/businessHours/computeBusinessHoursStatus.ts` (consumers: `publicar/servicios/components/ClasificadosServiciosApplication.tsx`, `publicar/restaurantes/RestauranteApplicationClient.tsx`, `publicar/comida-local/ComidaLocalApplicationClient.tsx`) · TARGET `publicar/rentas/negocio/application/RentasNegocioForm.tsx` · **ACTION: ADOPT EXISTING**.

### F-08 — **P2** · No JSON-LD structured data on the canonical Rentas detail
`rentas/listing/[id]/page.tsx:17-39` sets title/canonical/OpenGraph (Package F Build F2 Gate 7) but emits no JSON-LD. BR gets it via `anuncio/[id]/page.tsx:361` (`leonixListingStructuredPayload`).
→ REFERENCE **YES** · CATEGORY Bienes Raíces · REFERENCE PATH `anuncio/[id]/page.tsx:361` · TARGET `rentas/listing/[id]/page.tsx` · **ACTION: NET NEW** (BR's payload builder is reusable, but a Rentas emitter must be written).

### F-09 — **P2** · No report/abuse control on any BR detail; no shared save/like/share on BR
`LeonixInlineListingReport` has zero BR consumers. `BrEngagementRow` (which wraps `LeonixLikeButton`/`LeonixShareButton`) is mounted only from `EnVentaAnuncioLayout.tsx:960` and `bienes-raices/shell/BienesRaicesPreviewCard.tsx:245` — never from the BR live shells, which hand-roll a heart+share pair (`BienesRaicesPrivadoLiveDetailShell.tsx:82,91`; `BienesRaicesNegocioLiveDetailShell.tsx:389,398`).
→ REFERENCE **YES** · CATEGORY Autos / En Venta / Rentas · REFERENCE PATH `autos/vehiculo/[id]/AutosLiveVehicleClient.tsx` (report), `rentas/listing/[id]/RentasListingDetailClient.tsx:7-9` (save/like/share) · TARGET both BR live shells · **ACTION: ADOPT EXISTING**.

### F-10 — **P2** · BR-PRIV owner edit is time-boxed to 30 minutes; the other four lanes are unbounded
`dashboard/mis-anuncios/[id]/editar/page.tsx:30`,`:259` enforce a 30-minute post-publish edit window. BR-NEG/BR-CHILD edit through `listing-edit/route.ts` with no such window; both Rentas lanes likewise. An asymmetry, not a bug — flagged for an explicit product decision.
→ REFERENCE **YES** · CATEGORY BR Negocio / Rentas · REFERENCE PATH `api/clasificados/bienes-raices/listing-edit/route.ts` · TARGET `editar/page.tsx:30` · **ACTION: product decision, not a code defect.**

### Dead / unreachable modules found along the way (informational, no action claimed)
`app/(site)/clasificados/lib/listingDraftsDb.ts` · `app/(site)/clasificados/lib/buildFullPreviewListingData.ts` · `app/(site)/clasificados/components/MediaUploader.tsx` · `app/(site)/clasificados/bienes-raices/components/BrRelatedAgentPropertiesSection.tsx` (the live one is `RelatedBrAgentProperties.tsx`) · `app/(site)/clasificados/bienes-raices/preview/negocio/components/BrNegocioGalleryLightbox.tsx` · `app/(site)/clasificados/rentas/shared/rentasDraftVideoHydrate.ts` (the whole Mux chain for Rentas). `leonixClasificadosPublishPrep.ts` has zero consumers. Also note the inverted dependency: `clasificados/lib/classifiedsDraftStorage.ts:12` imports **from** `publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft.ts` — a shared module depending on a lane module.

---

## 9. THE THIRD BRANCH — must-merge or superseded?

`fix/br-negocio-inventory-hub-media-hydration-2026-08-27` (tip `0d80e891`): **32 commits**, `git diff --stat origin/main...branch` = **92 files, +3364 / −786**. Containment for every commit checked: `--is-ancestor <sha> origin/main` → **1**, `--is-ancestor <sha> e3956df8` → **1**. Nothing downstream carries it.

| # | Commit | Defect it fixes | Branch fix | origin/main status | Verdict |
|---|---|---|---|---|---|
|1|`b3d85dc1`|Draft-media hydration reload loss: `BienesRaicesPrivadoForm` persists **only** via a 280 ms debounce (no pagehide/visibilitychange flush, unlike its Rentas siblings), and `loadBienesRaicesPrivadoDraft` treats a single empty sessionStorage read as "no draft" — the empty initial state is then autosaved over the real draft, losing photos on reload|`BienesRaicesPrivadoForm.tsx:253-270` (flush); `bienesRaicesPrivadoDraft.ts:63` `readDraftRawWithRetry` + `:90`; `bienesRaicesPrivadoDraftMedia.ts:45` `hasPersistedMedia`; `app/lib/media/draftHeavyMediaIdb.ts:35,168,194` `hasNamespaceEntries`|`BienesRaicesPrivadoForm.tsx:150-157` = debounce only; **zero** `pagehide`/`visibilitychange`/`beforeunload` in that file. `bienesRaicesPrivadoDraft.ts:58` still `const raw = readDraftRaw(); if (!raw) return null;`. `bienesRaicesPrivadoDraftMedia.ts` exports only 3 fns (`:12,:24,:36`). `draftHeavyMediaIdb.ts:166` return object has no `hasNamespaceEntries`|**DEFECT STILL PRESENT — MUST-MERGE**|
|2|`5d3f27cf`|Inherited parent hub frozen in the inventory child editor: `parentHubRef.current` refreshed only in the bootstrap effect, which omits `parentHubSnapshot` from deps|`BrNegocioChildInventoryFullApplication.tsx:209-231` (narrow effect keyed on `parentHubIdentityKey`, re-merging over `pickChildPropertySlice(prev)`)|Same file `:160` assigns inside the bootstrap effect only; `:204-206` = `// Intentionally omit parentHubSnapshot identity churn` with deps `[open, editingId, childMediaId, initialDraft?.id, lang, total, preferredCategoria]`; next statement `:208` is `isDirty` — no sync effect, no `parentHubIdentityKey` anywhere|**DEFECT STILL PRESENT — MUST-MERGE** *(editor-only; the public child page inherits parent identity correctly at `BienesRaicesNegocioLiveDetailShell.tsx:412-442`)*|
|3|`42d68aa8`|Multi-video + custom highlights never reach a published BR Privado listing: the live mapper hardcodes them empty and publish writes no video/custom-highlight detail pairs at all|`leonixRealEstateListingContract.ts:44-50` (new `Leonix:br:video_url[_2..4]`, `Leonix:br:custom_highlights`); `leonixBrMachineFacetPairsFromFormState.ts:270` (up to 4 video URLs) + preset-vs-custom highlight split; `mapBrListingRowToPrivadoPreviewVm.ts:134,143,158,186,197,209-210`|`mapBrListingRowToPrivadoPreviewVm.ts:138` `videoPlaybackUrls:[null,null]`, `:145` `hasVideo1:false`, `:157` `highlightsRows:[]`, `:158` `hasHighlights:false`. Contract has only `LEONIX_DP_BR_SHOW_EXACT_ADDRESS:37`, `_LISTING_STATUS:39`, `_MAP_URL:41` — **no** video/custom-highlight keys. `leonixBrMachineFacetPairsFromFormState.ts:105` still slugifies all residencial `highlightKeys` (free text destroyed) and emits no video pairs|**DEFECT STILL PRESENT — MUST-MERGE** *(user-visible data loss at publish)*|
|4|`2d0f63cd`|HOA / Open House never reach the published Privado listing: (a) HOA fee/frequency/includes render even when `hasHoa !== "yes"`; (b) an end-only open-house range renders as an unqualified single date; (c) `buildBrLiveGate12dHoaCard` / `buildBrLiveGate12dOpenHouseCard` exist but are **never called**|`leonixBrGate12d.ts:539` (`if (g.hasHoa === "yes")`), `:578` (`Hasta`/`Through`); `leonixBrGate12dHoaPreview.ts:76`; `mapBrListingRowToPrivadoPreviewVm.ts:237-238` (wires both builders in); `agenteResidencialPreviewFormat.ts:1042`|`leonixBrGate12d.ts:507-510` pushes fee/frequency/includes **ungated**; `:540-544` `formatRange` ends `return a \|\| b;`. `leonixBrGate12dHoaPreview.ts:74-79` same ungated pushes. `mapBrListingRowToPrivadoPreviewVm.ts:185-186` `hoaCommunityCard: null, openHouseCard: null` (and no import of `leonixBrGate12d`). `agenteResidencialPreviewFormat.ts:1038` `return startDisp \|\| endDisp;`|**DEFECT STILL PRESENT — MUST-MERGE** *(user-visible data loss at publish)*|
|5|`629c5a46`|Global application leave guard not adopted by BR/Rentas (see §2)|4 files, +48 lines, insertions only|No lane consumes `useBusinessApplicationLeaveGuard`; zero hits under `bienes-raices/` or `rentas/`|**DEFECT STILL PRESENT — MUST-MERGE**|

### The other 28 commits — themes
1. **Rentas/BR taxonomy + field-set completion** — separate levels/stories, structured uso comercial, vehicle restrictions, service area, agente 2, commercial/land filter facets, conditional field-set gaps (`35bde2cb`, `4c752fc9`, `d064bc70`, `f5f91bc2`, `92f14987`, `03786280`).
2. **Shared presentation-primitive adoption** — facts-grid/chip-card, reusable "Agregar otra característica" custom chip, consolidation onto `LeonixOpenHouseSlotCards`, gallery lightbox preload + touch-swipe, native share (`f7cc596f`, `6dbf4262`, `a6489165`, `f6548632`, `7180e927`, `1712cf83`).
3. **Live-listing / preview mapping + i18n** — Rentas live mapper, i18n label selftest, price formatting, map centering, dedupe facts, standardized preview labels, deprecated `enlaceMapa` removal (`d09b1cc5`, `0a3646e6`, `d1d98820`, `e17488aa`, `9d73898f`).
4. **Checkout / checkpoint copy and flow** — price+duration for FSBO/Rentas one-time packages, BR Privado checkout reorder, Business Hub value copy, content-driven brand visibility, appointment-only + booking link (`5e31c67d`, `98064569`, `45a1ef38`, `644aff6c`, `966aaa0a`, `8e13dae7`).
5. **SSR/hydration + build infra** — Navbar/root-intro hydration mismatch, Suspense reveal with the `lang` param, `tel:` E.164, Rentas results `error.tsx`, and opting the Rentas results route out of static prerender to restore the production build (`bc9b235a`, `522b97f8`, `8d14de69`, `0d80e891`).

### **BRANCH VERDICT: MUST-MERGE**
All five audited defects are still live in `origin/main`. In every case the origin/main code is byte-identical to the branch's pre-fix parent state at the cited lines — **zero evidence of supersession by other means**. Three of the five (`42d68aa8`, `2d0f63cd`, and the highlights/video channel) are user-visible data loss on the public listing surface; `b3d85dc1` is draft data loss; `629c5a46` is the only fix anywhere for the four-lane leave-guard gap. The branch is in neither `origin/main` nor `e3956df8`, so nothing downstream carries it.

---

## 10. SEPT COMMIT CONTAINMENT (all four Sept-only)

| Commit | Date | Subject | In `origin/main`? | In `e3956df8`? | Scope | Impact on these lanes |
|---|---|---|---|---|---|---|
|`10618f41`|2026-09-03|fix(capacity): exclude commercial parents from inventory limits|**NO**|YES|7 files, +586/−23 — incl. `commercialWriteGuard.ts`, a new `…_fix_parent_inventory_capacity_counting.sql` (+289, `CREATE OR REPLACE` on both RPCs), `autosDealerInventoryPolicy.ts`, verifier `verify-gate6c2-parent-excluded-capacity-counting.ts`|**BR-NEG, BR-CHILD** — the sole fix for F-02 (P0)|
|`651abd4e`|2026-09-02|fix(globalization): protect child listing identity integrity|**NO**|YES|6 files, +390/−2 — new `brChildIdentityGuard.ts` (+73), `autosChildIdentityGuard.ts` (+69), wired into `bienes-raices/listing-edit/route.ts` (+28), verifier (+188)|**BR-CHILD** — 12A F-04 (P2). Confirmed absent: `git ls-tree … \| grep -i childIdentity` → no matches|
|`da25bc92`|2026-09-01|fix: preserve Bienes drafts and edit hydration|**NO**|YES|3 files, +50/−29 — `useLeonixPublishFlowExitClear.ts` (−, simplified), `bienesPublishedToAgenteApplicationDraft.ts` (+39), `BienesRaicesPrivadoForm.tsx`|**BR-PRIV, BR-NEG** — draft/edit hydration; overlaps `06_`'s scope|
|`4f676ef8`|2026-09-01|feat: finish Bienes and Rentas globalization adoption|**NO**|YES|9 files, +234/−3 — `leonixContactChannelsV1.ts` (+45), `mapAgenteResidencialFormStateToNegocioForPublish.ts`, `BienesRaicesPrivadoForm.tsx`, `rentasDashboardEditHydration.ts`, `publicar/shared/Gate12cContactChannelsFields.tsx` (+53), `dashboard/mis-anuncios/page.tsx`, `app/lib/i18n/rentasLaunchUiExtras.ts` (+30), `activePaidEditCheckoutOwnership.ts`, verifier `verify-family2-bienes-rentas-full-sweep.ts` (+55)|**all five lanes** — contact channels, Rentas i18n extras, edit-checkout ownership|

Sept is a **strict superset of nothing** relative to `origin/main` on these four commits — all four are Sept-only and none reached main.

---

## 11. EVIDENCE GAPS

1. **No runtime execution.** Every verdict is static-source at `origin/main`. Routes are auth-gated and no live session was available. Nothing here was observed in a browser.
2. **No live-DB verification.** Migration files were read; whether the deployed Supabase project actually carries `br_negocio_activate_listing` at the `:276` revision, and whether the RLS policies match `20260421130001_…`, was not confirmed against the running project.
3. **F-02's user-facing numbers are derived, not measured** — from the SQL/TS source plus `10618f41`'s own commit message ("0/3 real properties instead of the locked 1/4"). No seeded account was exercised.
4. **`06_`'s territory deliberately untouched.** Field-level hydration → republish loss is not assessed here; §7 records only route + same-row facts. Where §9's `b3d85dc1` and §10's `da25bc92` touch that surface, the finding is stated as the *branch/commit's* claim plus the origin/main line-state, not as an independent field audit.
5. **Router-level navigation intercepts not exhaustively ruled out.** §2 searched for `beforeunload`, `pagehide`, `LeaveGuard`, `useUnsavedChanges`, `useLeaveGuard`, `applicationLeaveGuard`. A bespoke `next/navigation` intercept under a non-matching identifier could exist unfound.
6. **Adoption tallies in §5 are counts over this report's own row set** (38 systems, sub-rows 10b/24b excluded). They are comparative, not absolute coverage percentages.
7. **BR-CHILD media durability not traced field-by-field.** The durable-IDB-ref path is proven (`brNegocioInventoryDraftPersistence.ts:31-38`), but not every child-media field was followed end-to-end through an F5.
8. **Verifier scripts and E2E specs were inventoried, not executed.**
9. **`app/lib/i18n/**` non-adoption by the three BR lanes is UNPROVEN as a gap** — no BR-adjacent reference consumer was found; every clasificados lane inspected uses per-lane copy files, so the "shared ES/EN system" may simply not be the intended pattern for `publicar/` lanes.
