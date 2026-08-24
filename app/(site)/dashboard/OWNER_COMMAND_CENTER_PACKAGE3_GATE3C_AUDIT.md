# Owner Command Center — Package 3, Gate 3C Audit

Specialized Owner Systems Migration — Empleos Quick / Premium / Feria, Autos Privado,
Autos Dealer parent + vehicle child, Bienes Raíces Negocio parent + property child,
Comida Local.

## Controlling document

`LEONIX_OWNER_COMMAND_CENTER_SINGLE_SOURCE_CONSTRUCTION_BIBLE.md` — read in full from
`C:\Users\chuy\Documents\LEONIX_OWNER_COMMAND_CENTER_SINGLE_SOURCE_CONSTRUCTION_BIBLE.md`
before any Gate 3C edit.

```
CONTROLLING BIBLE READ: YES
GLOBAL SHELL RULE UNDERSTOOD:
A = global dashboard shell
B = global owner product page frame
C = global owner entity workspace
SPECIALIZED WORKFLOW DOES NOT MEAN SPECIALIZED PRODUCT IDENTITY: YES
CATEGORY-SPECIFIC DASHBOARD GRAMMAR ALLOWED: NO
```

No conflict requiring a report was found: every requirement below was implementable from
current repo truth (shared workspace + specialized module slot + small category adapter).

## 1. Boundary

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged before/after)
```

Do-not-touch systems left untouched: `app/admin/**`, Recursos, Business Concierge engines,
Stripe/payment/subscription/entitlement writers, RLS/auth, analytics event writers,
Community Trust writers, VIN decoder, application backend pipeline, inventory mutation
backend, public product UX, publisher/checkpoint business logic, LEO, Ad Branding,
Iglesias, Viajes, Ofertas Locales. No migrations.

## 2. Architecture applied

```
GLOBAL SHELL (LeonixDashboardShell)
+ GLOBAL PAGE FRAME WHERE APPLICABLE (OwnerProductPageFrame)
+ GLOBAL ENTITY WORKSPACE (OwnerEntityWorkspace)
+ SPECIALIZED MODULE SLOT (OwnerEntitySpecializedTools children / activity)
+ CATEGORY ADAPTER
= SPECIALIZED OWNER EXPERIENCE
```

`OwnerEntityWorkspace` gained an optional `specialized.children` slot so Applications /
Vehicle Inventory / Property Inventory can render as gold-grammar modules without a second
shell. `OwnerEntityActivity` gained optional per-row `actions` so Empleos application status
mutations stay on the existing API.

No new category dashboard routes were created.

## Nine-lane certification index (explicit; no grouped omission)

Every Gate 3C target is documented as its own section below. Required fields on every row:
CURRENT OWNER ROUTE, TARGET OWNER ROUTE, PARENT ENTITY, CHILD ENTITY, IDENTITY KEY,
PUBLIC ROUTE, RESULTS ROUTE, EDIT ROUTE, PREVIEW, ANALYTICS, LIFECYCLE, ACTIVITY,
SPECIALIZED MODULE, COMMERCIAL / ENTITLEMENT DISPLAY TRUTH, CAPABILITY STATES,
SHARED COMPONENTS, LEGACY UI REMOVED, RESPONSIVE STATUS, ES/EN STATUS, DEFERRED ITEMS.

| # | Lane | Audit heading | Engineering status |
|---|---|---|---|
| 1 | EMPLEOS QUICK | EMPLEOS QUICK | MIGRATED |
| 2 | EMPLEOS PREMIUM | EMPLEOS PREMIUM | MIGRATED |
| 3 | EMPLEOS FERIA | EMPLEOS FERIA | MIGRATED |
| 4 | AUTOS PRIVADO | AUTOS PRIVADO | MIGRATED |
| 5 | AUTOS DEALER PARENT | AUTOS DEALER PARENT | MIGRATED |
| 6 | AUTOS DEALER VEHICLE CHILD | AUTOS DEALER VEHICLE CHILD | MIGRATED (child management remains inside parent inventory module; no standalone child dashboard route) |
| 7 | BIENES RAÍCES NEGOCIO PARENT | BR NEGOCIO PARENT | MIGRATED |
| 8 | BIENES RAÍCES PROPERTY CHILD | BR PROPERTY CHILD | MIGRATED (child edit remains parent inventory `openChildDraftId`; no standalone child editor) |
| 9 | COMIDA LOCAL | COMIDA LOCAL | MIGRATED |

---

## EMPLEOS QUICK

- **CURRENT OWNER ROUTE:** `/dashboard/empleos` (collection) + `/dashboard/empleos/{id}`
- **TARGET OWNER ROUTE:** same routes; presentation migrated onto Layers A+B+C (collection) and A+C (detail)
- **PARENT ENTITY:** n/a (single listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `empleos_public_listings.id` (UUID); public uses `slug`
- **PUBLIC ROUTE:** `/clasificados/empleos/{slug}`
- **RESULTS ROUTE:** `/clasificados/empleos/resultados`
- **EDIT ROUTE:** `/publicar/empleos/quick?edit={id}`
- **PREVIEW:** lane draft preview exists at `/clasificados/empleos/quick-preview` (publish-time); owner workspace uses public view when published. Registry `preview: unsupported` at category level remains honest for listing-bound owner preview.
- **ANALYTICS:** `view_count` / `apply_count` on the listing row shown as performance when numeric. Full analytics page remains `unproven`.
- **LIFECYCLE:** PATCH `/api/clasificados/empleos/listings/{id}` with `published` / `paused` / `archived`. Reactivate is the real published restore — registry corrected from `unsupported` → `supported`. No distinct "cerrar vacante" mutation exists; `close` corrected to `unsupported`.
- **ACTIVITY:** Applications, not Messages.
- **SPECIALIZED MODULE:** Aplicaciones (gold) → detail workspace; detail renders the existing applications API through `OwnerEntityActivity` with viewed/shortlist/reject actions.
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** lane badge only (Quick paid product). No hard-coded price.
- **CAPABILITY STATES:** `empleos` — edit/publicView/results `supported`; preview `unsupported`; analytics `unproven`; pause/reactivate/archive `supported`; close `unsupported`; applications/activity `specialized`; inventory/leads `unsupported`; payment/entitlement/placement default `unsupported`
- **SHARED COMPONENTS:** `LeonixDashboardShell`, `OwnerProductPageFrame`, `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** dedicated table + mobile island cards + gold-gradient publish button
- **RESPONSIVE STATUS:** structural via shared workspace (390 sheet / 768 wrap / 1440 workbench)
- **ES/EN STATUS:** bilingual labels through shared helpers
- **DEFERRED ITEMS:** authenticated pixel QA; listing-bound preview; full analytics page

## EMPLEOS PREMIUM

- **CURRENT OWNER ROUTE:** `/dashboard/empleos` (collection) + `/dashboard/empleos/{id}`
- **TARGET OWNER ROUTE:** same routes; same Layers A+B+C / A+C as Quick — lane badge and edit href are the only payload differences
- **PARENT ENTITY:** n/a (single listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `empleos_public_listings.id` (UUID); public uses `slug`; `lane=premium`
- **PUBLIC ROUTE:** `/clasificados/empleos/{slug}`
- **RESULTS ROUTE:** `/clasificados/empleos/resultados`
- **EDIT ROUTE:** `/publicar/empleos/premium?edit={id}`
- **PREVIEW:** `/clasificados/empleos/premium-preview` is publish-time draft preview; owner workspace uses public view when published. Category-level `preview: unsupported` remains honest
- **ANALYTICS:** same as Quick — `view_count` / `apply_count` when numeric; full analytics page `unproven`
- **LIFECYCLE:** same PATCH `/api/clasificados/empleos/listings/{id}` (`published` / `paused` / `archived`); reactivate supported
- **ACTIVITY:** Applications, not Messages
- **SPECIALIZED MODULE:** Aplicaciones (gold) → `/dashboard/empleos/{id}`; same applications API as Quick
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** lane badge "Preservado (premium)" / "Preserved (premium)". No hard-coded price
- **CAPABILITY STATES:** `empleos` — edit/publicView/results `supported`; preview `unsupported`; analytics `unproven`; pause/reactivate/archive `supported`; close `unsupported`; applications/activity `specialized`; inventory/leads `unsupported`; payment/entitlement/placement default `unsupported`. Lane payload differs from Quick only by badge + `/publicar/empleos/premium?edit={id}`.
- **SHARED COMPONENTS:** `LeonixDashboardShell`, `OwnerProductPageFrame`, `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** no Premium-specific dashboard island was created or retained
- **RESPONSIVE STATUS:** shared workspace (390 sheet / 768 wrap / 1440 workbench)
- **ES/EN STATUS:** bilingual labels through shared helpers
- **DEFERRED ITEMS:** authenticated pixel QA; listing-bound preview; full analytics page

## EMPLEOS FERIA

- **CURRENT OWNER ROUTE:** `/dashboard/empleos` (collection) + `/dashboard/empleos/{id}`
- **TARGET OWNER ROUTE:** same routes; same Layers A+B+C / A+C as Quick — applications omitted by lane truth
- **PARENT ENTITY:** n/a (single listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `empleos_public_listings.id` (UUID); public uses `slug`; `lane=feria`
- **PUBLIC ROUTE:** `/clasificados/empleos/{slug}`
- **RESULTS ROUTE:** `/clasificados/empleos/resultados`
- **EDIT ROUTE:** `/publicar/empleos/feria?edit={id}`
- **PREVIEW:** `/clasificados/empleos/feria-preview` is publish-time draft preview; owner workspace uses public view when published. Category-level `preview: unsupported` remains honest
- **ANALYTICS:** `view_count` when numeric; `apply_count` omitted (no internal applications)
- **LIFECYCLE:** same PATCH `/api/clasificados/empleos/listings/{id}`; reactivate supported
- **ACTIVITY:** none — Leonix does not collect internal applications for job fairs; footer note preserved; no fabricated zeros
- **SPECIALIZED MODULE:** none (gold Aplicaciones action omitted when `lane === "feria"`)
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** lane badge "Feria de empleo" / "Job fair". Feria is the free lane; no hard-coded price
- **CAPABILITY STATES:** `empleos` — same registry row as Quick/Premium: edit/publicView/results `supported`; preview `unsupported`; analytics `unproven`; pause/reactivate/archive `supported`; close `unsupported`; applications/activity `specialized` at registry, **omitted in the adapter** when `lane === "feria"`; inventory/leads `unsupported`; payment/entitlement/placement default `unsupported`
- **SHARED COMPONENTS:** `LeonixDashboardShell`, `OwnerProductPageFrame`, `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** no Feria-specific dashboard island was created or retained
- **RESPONSIVE STATUS:** shared workspace (390 sheet / 768 wrap / 1440 workbench)
- **ES/EN STATUS:** bilingual labels through shared helpers
- **DEFERRED ITEMS:** authenticated pixel QA

---

## AUTOS PRIVADO

- **CURRENT OWNER ROUTE:** `/dashboard/mis-anuncios?cat=autos` (paid autos section)
- **TARGET OWNER ROUTE:** same; each privado row is now an `OwnerEntityWorkspace`
- **PARENT ENTITY:** n/a (`supportsParentChildInventory: false`; privado is a single listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `autos_classifieds_listings.id`, `lane=privado`; optional `leonix_ad_id`
- **PUBLIC ROUTE:** `/clasificados/autos/vehiculo/{id}`
- **RESULTS ROUTE:** `/clasificados/autos/resultados`
- **EDIT ROUTE:** `/publicar/autos/privado?edit=1&source=dashboard&listingId={id}&returnPanel=autos`
- **PREVIEW:** `/clasificados/autos/privado/preview?edit=1&source=dashboard&listingId={id}&returnPanel=autos`
- **ANALYTICS:** `/dashboard/analytics/listing?source_table=autos_classifieds_listings&source_id={id}` — registry corrected to `supported`
- **LIFECYCLE:** unpublish (`removed`) + restore (`active`). Pause is not a real status — registry `pause: unsupported`, `archive` + `reactivate` supported. Restore corrected from `unsupported` → `supported`.
- **ACTIVITY:** none proven
- **SPECIALIZED MODULE:** none (VIN decode stays on the publish form; not modified)
- **CAPABILITY STATES:** `autos-privado` — edit/publicView/preview/results/analytics `supported`; pause `unsupported`; reactivate/archive `supported`; inventory/applications/leads/activity default `unsupported`; payment/entitlement/placement default `unsupported`
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** none invented on this card
- **VEHICLE IDENTITY DATA:** title (year/make/model/trim), price, mileage, city, status — from the already-loaded dashboard row. VIN not on that row; not fetched.
- **SHARED COMPONENTS:** `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** flat paid-autos list row inside the gold dealer shell
- **RESPONSIVE STATUS:** shared workspace sheet
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA; VIN display on the owner card (would require exposing payload fields, not done)

## AUTOS DEALER PARENT

- **CURRENT OWNER ROUTE:** `/dashboard/mis-anuncios?cat=autos`
- **TARGET OWNER ROUTE:** same; dealer group is an `OwnerEntityWorkspace`
- **PARENT ENTITY:** `autos_classifieds_listings` row with `lane=negocios`, `inventory_role=main`, id = parent UUID
- **CHILD ENTITY:** `inventory_role=inventory_vehicle`, `dealer_inventory_parent_listing_id={parentId}`, shared `dealer_inventory_group_id`
- **IDENTITY KEY:** parent row UUID for public/edit/analytics of the parent; grouping key is dashboard-local only
- **PUBLIC ROUTE:** `/clasificados/autos/vehiculo/{parentId}`
- **RESULTS ROUTE:** registry dealer results `/clasificados/dealers-de-autos/results` unchanged (not rewritten)
- **EDIT ROUTE:** `autosDealerListingEditHref` (`/publicar/autos/negocios?...mode=listing-edit&listingId={parentId}`)
- **PREVIEW:** `autosDealerListingPreviewHref`
- **ANALYTICS:** `autosPaidListingAnalyticsHref` keyed by parent id
- **LIFECYCLE:** unpublish/restore on the parent row
- **ACTIVITY:** unsupported
- **SPECIALIZED MODULE:** gold inventory — manage-inventory href + add-vehicle drawer + child list
- **CAPABILITY STATES:** `autos-negocios` — edit/publicView/preview/results `supported`; analytics `specialized`; pause `unsupported`; reactivate/archive `supported`; inventory `specialized`; applications/leads/activity `unsupported`; plan/entitlement `supported`; placement `unproven`
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** capacity lines from existing `dealerInventory` payload + existing upgrade pitch/limit copy. No hard-coded historical prices in this gate.
- **SHARED COMPONENTS:** `OwnerEntityWorkspace`, `OwnerEntitySpecializedTools` children, `DashboardListingActionBar`
- **LEGACY UI REMOVED:** gold-gradient category wrapper + duplicate flat listing list + emerald restore buttons
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA; dealer leads/activity (unproven)

## AUTOS DEALER VEHICLE CHILD

- **CURRENT OWNER ROUTE:** nested inside parent inventory on `/dashboard/mis-anuncios?cat=autos` (`AutosDealerInventoryDashboardSection`)
- **TARGET OWNER ROUTE:** same — canonical child management stays inside the parent inventory specialized module. **No standalone child dashboard route invented.**
- **PARENT ENTITY:** dealer parent `autos_classifieds_listings.id` (`inventory_role=main`)
- **CHILD ENTITY:** `inventory_role=inventory_vehicle`, `dealer_inventory_parent_listing_id={parentId}`, shared `dealer_inventory_group_id`
- **IDENTITY KEY:** child row UUID for public / preview / analytics / unpublish / restore; parent UUID opens the inventory editor
- **PUBLIC ROUTE:** `/clasificados/autos/vehiculo/{childId}`
- **RESULTS ROUTE:** child appears through autos/dealer surfaces; registry dealer results remain `/clasificados/dealers-de-autos/results`
- **EDIT ROUTE:** `autosDealerInventoryEditHref({ listingId: parentId })&editVehicleId={childId}`
- **PREVIEW:** `autosDealerListingPreviewHref` keyed by child id
- **ANALYTICS:** `autosPaidListingAnalyticsHref` keyed by child `source_id` / optional child `leonix_ad_id`
- **LIFECYCLE:** child unpublish/restore by child row id (restore is capacity-guarded by existing API)
- **ACTIVITY:** unsupported (no owner leads module)
- **SPECIALIZED MODULE:** child rows render inside the parent's gold inventory module; edit stays in the parent inventory editor
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** child creation/restore consumes parent-group capacity from existing `dealerInventory` payload; no hard-coded prices
- **CAPABILITY STATES:** same `autos-negocios` registry row; child role is `inventory_vehicle`
- **SHARED COMPONENTS:** `DashboardListingActionBar` inside `OwnerEntityWorkspace` specialized children
- **LEGACY UI REMOVED:** emerald restore buttons; no new `/dashboard/autos/[id]` child page
- **RESPONSIVE STATUS:** stacked specialized module (390); wrap (768); workbench via mis-anuncios shell (1440)
- **ES/EN STATUS:** bilingual shared labels
- **DEFERRED ITEMS:** authenticated pixel QA

---

## BR NEGOCIO PARENT

- **CURRENT OWNER ROUTE:** `/dashboard/mis-anuncios/[id]` (already Layer C from Gate 3B) + library card
- **TARGET OWNER ROUTE:** same `[id]` workspace, now capability-keyed as `bienes-raices-negocio`
- **PARENT ENTITY:** `listings.id` with `inventory_role=main`
- **CHILD ENTITY:** `inventory_role=inventory_property`, `br_inventory_parent_listing_id={parentId}`
- **IDENTITY KEY:** parent `listings.id` UUID; `leonix_ad_id` display-only
- **PUBLIC ROUTE:** `/clasificados/anuncio/{parentId}`
- **RESULTS ROUTE:** `/clasificados/bienes-raices/resultados` (unchanged)
- **EDIT ROUTE:** `bienesListingEditHref` (`/clasificados/publicar/bienes-raices/negocio?...mode=listing-edit`)
- **PREVIEW:** `bienesListingPreviewHref` (specialized, parent only)
- **ANALYTICS:** same `listing_analytics` path as Gate 3B — registry corrected `unproven` → `supported`
- **LIFECYCLE:** pause / archive / discontinue / resume all go through existing `callBrLifecycleMutation` → `/api/clasificados/bienes-raices/listing-lifecycle`. Generic `applyOwnerListingPatch` remains for non-BR rows. **No new backend.**
- **ACTIVITY:** real per-listing `messages` — registry `activity` corrected to `supported`
- **SPECIALIZED MODULE:** gold `Gestionar inventario` → existing `bienesInventoryEditHref`. Full inventory list is not fetched on `[id]` (performance guardrail); library still has `BrPropertyInventoryDashboardSection` / `BrNegocioListingInventoryActions`.
- **CAPABILITY STATES:** `bienes-raices-negocio` — edit/publicView/results/analytics `supported`; preview `specialized`; pause/reactivate/archive/markSold `specialized` (safe RPC); close `unsupported`; inventory `specialized`; applications `unsupported`; activity `supported`; plan/entitlement `supported`; placement `unproven`
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** unchanged; capacity authority stays on the existing RPC
- **SHARED COMPONENTS:** `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** direct-write pause/archive/sold for BR rows on this page
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA; inlining the full property inventory list onto `[id]` (would be extra I/O)

## BR PROPERTY CHILD

- **CURRENT OWNER ROUTE:** `/dashboard/mis-anuncios/[childId]`
- **TARGET OWNER ROUTE:** same `[id]` workspace, capability-keyed as `bienes-raices-negocio` when `isBrNegocioListing`
- **PARENT ENTITY:** `listings.id` of the business/agent main (`inventory_role=main`)
- **CHILD ENTITY:** `inventory_role=inventory_property`, `br_inventory_parent_listing_id={parentId}`
- **IDENTITY KEY:** child's own `listings.id` UUID; parent UUID remains on `br_inventory_parent_listing_id`; `leonix_ad_id` display-only
- **PUBLIC ROUTE:** `/clasificados/anuncio/{childId}`
- **RESULTS ROUTE:** `/clasificados/bienes-raices/resultados` (unchanged)
- **EDIT ROUTE:** parent inventory-edit + `openChildDraftId=br-db-child-{childId}` via existing `bienesInventoryEditHref` (no standalone child editor invented)
- **PREVIEW:** registry child listing-bound preview is null — not fabricated on this page
- **ANALYTICS:** same `listing_analytics` path as parent (`supported`)
- **LIFECYCLE:** pause / archive / discontinue / resume all go through existing `callBrLifecycleMutation` (same safe RPC as parent)
- **ACTIVITY:** real per-listing `messages` when present (`specialized.activity: supported`)
- **SPECIALIZED MODULE:** child does not get parent inventory gold CTA; identity rows show role + parent short-ref from already-fetched columns
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** child cannot grant itself capacity; activation/resume still authorized by the existing parent-scoped RPC
- **CAPABILITY STATES:** `bienes-raices-negocio` row; lifecycle `specialized`; inventory `specialized` (owned by parent)
- **SHARED COMPONENTS:** `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** direct-write pause/archive/sold for BR child rows on this page
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA; pre-existing child hydration bug on the generic editor (Gate D.2.1) left untouched; inlining full sibling inventory on `[id]` (would be extra I/O)

---

## COMIDA LOCAL

- **CURRENT OWNER ROUTE:** `/dashboard/mis-anuncios?cat=comida-local`
- **TARGET OWNER ROUTE:** same; `ComidaLocalDashboardListings` is now an adapter around `OwnerEntityWorkspace`
- **ARCHITECTURE DECISION:** **A** — generic enough for shared workspace directly. No real specialized module (no menu/hours/orders/coupons).
- **PARENT ENTITY:** n/a (single listing)
- **CHILD ENTITY:** n/a
- **IDENTITY KEY:** `comida_local_public_listings.id`; public `slug`; Leonix ID `COMIDA-YYYY-######`
- **PUBLIC ROUTE:** `/clasificados/comida-local/{slug}` via `item.publicPath`
- **RESULTS ROUTE:** `/clasificados/comida-local` (landing = browse; no `/resultados`)
- **EDIT ROUTE:** `/publicar/comida-local?edit=1&listingId={id}&source=dashboard`
- **PREVIEW:** draft preview exists; not a strong listing-bound owner preview (`preview: unsupported`)
- **ANALYTICS:** `unproven` for owner UI (public events exist; no owner analytics CTA)
- **LIFECYCLE:** existing POST `/api/clasificados/comida-local/lifecycle` pause/resume
- **ACTIVITY:** unsupported
- **SPECIALIZED MODULE:** none
- **CAPABILITY STATES:** `comida-local` — edit/publicView `supported`; preview/results `unsupported` (no listing-bound preview; landing is browse, not `/resultados`); analytics `unproven`; pause/reactivate `supported`; archive/close `unsupported`; inventory/applications/leads/activity default `unsupported`; payment/entitlement/placement default `unsupported`
- **COMMERCIAL / ENTITLEMENT DISPLAY TRUTH:** package + payment *labels* already on the VM (not Stripe-wired)
- **SHARED COMPONENTS:** `OwnerEntityWorkspace`
- **LEGACY UI REMOVED:** bespoke article/card shell
- **RESPONSIVE STATUS:** shared workspace
- **ES/EN STATUS:** bilingual
- **DEFERRED ITEMS:** authenticated pixel QA; owner analytics CTA

## 3. Capability registry reconciliation

| Key | Change | Evidence |
|---|---|---|
| `empleos.lifecycle.reactivate` | unsupported → supported | Owner PATCH to `published` |
| `empleos.lifecycle.close` | specialized → unsupported | No distinct close-vacancy mutation |
| `autos-privado.identity.analytics` | unsupported → supported | `autosPaidListingAnalyticsHref` |
| `autos-privado.lifecycle.reactivate` | unsupported → supported | restore API |
| `autos-negocios.lifecycle.pause` | supported → unsupported | Real actions are unpublish/restore, not pause |
| `autos-negocios.lifecycle.archive` | unsupported → supported | unpublish API |
| `bienes-raices-negocio.identity.analytics` | unproven → supported | shared `[id]` `listing_analytics` path |
| `bienes-raices-negocio.specialized.activity` | unsupported → supported | shared `[id]` messages fetch |

## 4. Performance

No new per-card fetches. Empleos applications load after listing first paint. Autos still uses one `GET /api/clasificados/autos/listings`. BR `[id]` does not fetch full property inventory. Gate 2A listing-select cache untouched.

## 5. Authenticated pixel QA

Deferred to final QA. Engineering completion does not require signed-in entity pixels.

## 6. Ready for Gate 3D

Yes, after verifier + production build pass. Do not start Gate 3D in this session. Do not stage / commit / push / PR.

## 7. Architecture certifications (explicit)

### Empleos dashboard-island convergence

Quick, Premium, and Feria no longer have independent dashboard islands. All three lanes share `/dashboard/empleos` (Layers A+B+C) and `/dashboard/empleos/{id}` (Layers A+C). They differ only by truthful capability payload: lane badge, edit href (`/publicar/empleos/{quick|premium|feria}?edit={id}`), and whether gold Aplicaciones is shown (omitted for Feria). Dedicated table island, mobile island cards, and the gold-gradient publish button were removed. No `/dashboard/empleos-quick`, `/dashboard/empleos-premium`, or `/dashboard/empleos-feria` pages exist.

### Real Empleos reactivate truth

Reactivate is a real owner PATCH of `lifecycle_status` to `published` via existing `/api/clasificados/empleos/listings/{id}`. The capability registry was corrected from `unsupported` → `supported`. The CTA uses shared `resumeListingLabel` + tone `"positive"`. There is no distinct "cerrar vacante" mutation; `close` remains `unsupported`. Application backend was not modified.

### Autos parent/child inventory architecture

Privado rows are single entities (`supportsParentChildInventory: false`) on `/dashboard/mis-anuncios?cat=autos`. Dealer parent remains `inventory_role=main` with grouping key `dealer_inventory_parent_listing_id` / `dealer_inventory_group_id`. Vehicle children stay inside the parent's gold inventory specialized module (`editVehicleId={childId}`). No standalone child dashboard route was invented. Inventory still loads from one `GET /api/clasificados/autos/listings`. VIN decode is untouched.

### BR parent/child property architecture

Parent is `listings.id` with `inventory_role=main`. Child is `inventory_role=inventory_property` related by `br_inventory_parent_listing_id`. Both manage through `/dashboard/mis-anuncios/[id]` keyed as `bienes-raices-negocio`. Child edit stays in parent inventory context (`openChildDraftId=br-db-child-{childId}`). Full sibling inventory is not fetched on `[id]` (no new per-card I/O). Capacity/cascade remains on the existing RPC.

### BR safe lifecycle routing

On `/dashboard/mis-anuncios/[id]`, BR Negocio pause, archive, discontinue (mark-sold), and resume all call existing `callBrLifecycleMutation`. Generic `applyOwnerListingPatch` remains only for non-BR rows. No new RPC. No schema change. Direct-write pause/archive/sold for BR rows on this page was removed.

### Comida Local final classification

Decision **A**: shared `OwnerEntityWorkspace` with no specialized module (no menu/hours/orders/coupons). Adapter is `ComidaLocalDashboardListings` on `/dashboard/mis-anuncios?cat=comida-local`. No dedicated `/dashboard/comida-local` page. Publisher/lifecycle backend unchanged (`POST /api/clasificados/comida-local/lifecycle`). Preview/results remain honest `unsupported` at registry (browse landing, not `/resultados`; no listing-bound owner preview CTA).
