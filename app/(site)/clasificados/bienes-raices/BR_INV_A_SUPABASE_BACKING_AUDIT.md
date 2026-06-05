# BR-INV-A — Repo Audit + Supabase Backing Policy for Property Inventory

**Gate:** BR-INV-A  
**Date:** 2026-06-05  
**Repo:** `jesusecaceres/elaguila-website`  
**Scope:** Audit and policy only — **no feature build, no schema change, no migration, no policy change in this gate.**

---

## 1. Gate name

**BR-INV-A — Repo Audit + Supabase Backing Policy for Property Inventory**

Prepares Bienes Raíces for a future **multi-property inventory workflow** modeled on Autos Negocio inventory, using existing BR13 backend contract where applicable.

---

## 2. Repo status (preflight)

| Check | Result |
|-------|--------|
| `git status --short` | Clean at audit run |
| `git diff --name-only` | Empty |
| Latest commit | `1ec44924` (commit and push) |
| Staging / commit / push | None in this gate |
| Unrelated dirty files touched | No |

**Note:** Prior gates **BR13A–BR13D** and **MEDIA-DESC-HUB-03** / **DETAILS-COMMAS-02** are already merged. BR-INV-A does not revert them; it documents current truth and defines the **next** BR-INV stack (Autos-style in-application inventory) on top of polish + SQL contract work.

---

## 3. Files inspected

### Polish / pipeline baselines

- `app/(site)/clasificados/bienes-raices/MEDIA_DESC_HUB_03_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/DETAILS_COMMAS_02_PIPELINE_AUDIT.md`
- `app/(site)/clasificados/COPY_ENCODING_00_AUDIT.md` — **not found** (N/A)

### Prior BR inventory gates (read-only context)

- `app/(site)/clasificados/bienes-raices/BR13A_PROPERTY_INVENTORY_SQL_CONTRACT_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR13B_PROPERTY_INVENTORY_ADD_FLOW_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR13C_INVENTORY_QA_POLISH_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR13D_PROPERTY_INVENTORY_VALUE_DRAWER_AUDIT.md`

### Autos inventory reference pattern

- `app/lib/clasificados/autos/AUTOS_A5_QA_08A1_OPEN_INVENTORY_CTA_DRAWER_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md`
- `app/lib/clasificados/autos/AUTOS_A5_QA_07_APPLICATION_PERSISTENCE_INVENTORY_TRUTH_AUDIT.md`
- `scripts/autos-a5-qa-08a1-open-inventory-cta-drawer-audit.ts`
- `scripts/autos-a5-qa-08a2-vehicle-only-inventory-drawer-audit.ts`
- `scripts/autos-a5-qa-07-application-persistence-inventory-truth-audit.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts` (dealer inventory publish)
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`

### BR Privado

- `app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoApplication.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft.ts`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts`
- `app/(site)/clasificados/bienes-raices/preview/privado/**`

### BR Negocio / Agente

- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/**`
- `app/(site)/clasificados/bienes-raices/preview/negocio/**`
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx`
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawer.tsx`
- `app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx`

### Shared BR / publish / detail

- `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts`
- `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts`
- `app/(site)/clasificados/lib/leonixRealEstateListingContract.ts`
- `app/(site)/clasificados/lib/leonixListingStructuredPayload.ts`
- `app/(site)/clasificados/lib/leonixBrGate12d.ts`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts`
- `app/(site)/clasificados/bienes-raices/components/RelatedBrAgentProperties.tsx`
- `app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts`
- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/dashboard/lib/ownerListingsQuery.ts`
- `app/admin/_lib/listingsAdminSelect.ts`

### Supabase / migrations

- `supabase/migrations/20250311200000_listings_contact_and_status.sql`
- `supabase/migrations/20250316200000_listings_detail_pairs.sql`
- `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql`
- `supabase/migrations/20260508160000_leonix_listings_prefix_bienes_raices_br.sql`
- `supabase/migrations/20260518112000_gate12d_listing_structured_payload.sql`
- `supabase/migrations/20260518130600_br_property_inventory_grouping.sql`
- `app/lib/supabase/server.ts`, `app/lib/supabase/browser.ts`

---

## 4. Autos inventory pattern findings

### Reusable product behavior (copy/adapt for BR)

| Autos pattern | BR adaptation |
|---------------|---------------|
| **Pre-publish CTA** opens in-page drawer (not “publish first” modal) | BR-INV-B: “Agregar propiedad al inventario” on Negocio publish step — drawer shell only |
| **`additionalInventoryVehicles[]`** in draft V1 + localStorage/IDB persist | BR-INV-C: `additionalInventoryProperties[]` in Negocio draft — property-only fields |
| **Save / Save and add another / Cancel** in drawer | Same UX; no Publish inside drawer |
| **Bundle preview** on publish step (main + additional cards) | BR-INV-D: inventory preview section + results card shell |
| **Parent inherits** dealer name, contact, Business Hub, boost context | Child properties inherit agent/broker/company/contact/financing/lender from parent Negocio state |
| **Each vehicle = real row** with own `id`, `leonix_ad_id`, public URL | Each property = real `public.listings` row (BR13A contract) |
| **`dealer_inventory_group_id` + `inventory_role`** on `autos_classifieds_listings` | Use existing `br_inventory_group_id` + `inventory_role` on `public.listings` |
| **Post-publish dashboard inventory** section | BR13B/D already has dashboard add + value drawer — keep; extend after in-app flow |

### Do NOT copy directly

| Autos-specific | Why |
|----------------|-----|
| Separate table `autos_classifieds_listings` | BR uses shared `public.listings` |
| Vehicle fields (VIN, mileage, trim, drivetrain) | Property specs (beds/baths/sqft, HOA, property subtype) |
| `inventory_vehicle` role string | BR uses `inventory_property` |
| Autos Stripe boost / slot unlock pipeline | BR has separate $399 base + $99.99 upgrade product (BR13D) |
| Autos 10-vehicle cap | BR locked at 3 base / 8 with upgrade |

### Autos reference gates

- **A5.QA-08A.1:** drawer shell + draft array + bundle preview — **no publish in drawer**
- **A5.QA-08A.2:** vehicle-only fields inside drawer
- **A5.QA-07:** step/draft persistence truth
- **A5.QA-08B:** multi-listing publish mapping (downstream of drawer)

---

## 5. BR Privado architecture findings

| Layer | Implementation |
|-------|----------------|
| Application | `BienesRaicesPrivadoApplication` + `BienesRaicesPrivadoForm` — single-property wizard |
| Draft | `sessionStorage` key `br-privado-draft-v1` + `localStorage` fallback on quota |
| Preview | `mapBienesRaicesPrivadoStateToPreviewVm` → privado preview client |
| Publish | `publishLeonixListingFromBienesRaicesPrivadoDraft` → `leonixPublishRealEstateListingCore` |
| Public detail | `/clasificados/anuncio/[id]` via `leonixLiveAnuncioPath` |
| `seller_type` | `personal` |
| Inventory | **None** — no grouping columns set, no inventory UI |

**BR-INV-A policy:** Privado must **not** receive business/broker multi-property inventory unless explicitly approved in a future gate.

---

## 6. BR Negocio architecture findings

| Layer | Implementation |
|-------|----------------|
| Application | 15-step `BienesRaicesNegocioApplication` (tipo anunciante → publicar) |
| Sub-lanes | `agente-individual`, `equipo_agentes`, `oficina_brokerage`, `constructor_desarrollador` |
| Draft | `sessionStorage` `br-negocio-preview-draft` for preview handoff; form state in React |
| Identity / contact | `IdentidadNegocioSection`, `ContactoCtasNegocioSection`, `SegundoAgenteNegocioSection`, `AsesorFinancieroNegocioSection` |
| Property fields | `DatosPropiedadSection`, `DetallesDestacadosNegocioSection`, `DetallesCompletosNegocioSection`, `GaleriaMultimediaNegocioSection` |
| Preview | `mapBienesRaicesNegocioStateToPreviewVm` → `BienesRaicesNegocioPreviewView` |
| Publish | `publishLeonixListingFromBienesRaicesNegocioDraft(state, lang, inventoryContext?)` |
| Post-publish add (BR13B) | `inventoryMode=add` query params + `sessionStorage` `lx-br-inventory-add-context` — **full re-entry into Negocio application** for one child property |
| Dashboard (BR13D) | Value drawer → continue to add-flow href with real parent listing id |
| Public “more properties” | `RelatedBrAgentProperties` + `fetchBrRelatedInventoryListingsBrowser` on live detail (Negocio only) |

### Gap vs Autos in-application inventory

| Missing for BR-INV stack | Status |
|--------------------------|--------|
| Pre-publish “Agregar propiedad al inventario” CTA on publish step | **Not built** |
| In-application property drawer (property-only fields) | **Not built** |
| `additionalInventoryProperties[]` in Negocio draft | **Not built** |
| Save-and-add-another without leaving application | **Not built** |
| Bundle preview on publish step (main + draft children) | **Not built** |
| Batch publish: main + N children in one session | **Not built** — today each child is a separate publish after main exists |
| Stripe entitlement for upgrade | **Deferred** (env/localStorage placeholder) |

**BR-INV-A policy:** BR Negocio / Agente is the **first and only** lane for property inventory.

---

## 7. Shared BR findings

| Area | Finding |
|------|---------|
| Category slug | `bienes-raices` on `public.listings.category` |
| Live URL | `/clasificados/anuncio/[id]` (shared with En Venta layout) |
| Leonix Ad ID prefix | `BR-YYYY-######` via `leonix_listings_prefix` migration |
| Structured payload | Gate 12D: `listing_json`, `profile_json`, `contact_json` + legacy `detail_pairs` |
| Media | `listings.images` (HTTPS URLs); upload to Supabase Storage bucket `listing-images` at publish |
| Results / filters | `mapBrListingRowToCard`, `brFacetFromDetailPairs`, `brResultsUrlState` |
| En Venta hub | Shares detail layout; BR rows use same anuncio client |

---

## 8. Supabase / database backing findings

### 8.1 Published BR table

**Single table:** `public.listings` (not a dedicated `bienes_raices_listings` table).

Evidence: `leonixPublishRealEstateListingCore.ts` inserts via `insertListingsRowResilient`; BR13A audit confirms.

### 8.2 Key columns for inventory

| Column | Purpose |
|--------|---------|
| `id` | UUID listing row — public detail route param |
| `leonix_ad_id` | Public Leonix Ad ID (`BR-…`) |
| `owner_id` | Supabase auth user; RLS owner scope |
| `category` | `'bienes-raices'` |
| `seller_type` | `'business'` (Negocio) / `'personal'` (Privado) |
| `status`, `is_published` | Lifecycle; active public = `active` + published |
| `title`, `description`, `price`, `city`, `zip` | Core listing fields |
| `images` | Gallery URL array |
| `detail_pairs` | Legacy + machine facets (`Leonix:categoria_propiedad`, branch, operation, etc.) |
| `listing_json`, `profile_json`, `contact_json` | Gate 12D structured payloads |
| `business_name`, `business_meta` | Business identity |
| **`br_inventory_group_id`** | Shared group UUID (defaults to main listing id after first publish) |
| **`br_inventory_parent_listing_id`** | FK to parent listing row |
| **`inventory_role`** | `'main'` \| `'inventory_property'` \| null (legacy) |

Migration: `supabase/migrations/20260518130600_br_property_inventory_grouping.sql`

### 8.3 Leonix Ad ID generation

- Function `leonix_listings_prefix('bienes-raices')` → `'BR'`
- Assigned on insert / backfill via `leonix_ad_id_counters`
- Each inventory child gets **its own** `leonix_ad_id` at publish (separate row insert)

### 8.4 Group / parent-child readiness

| Question | Answer |
|----------|--------|
| Can current table support parent/child group? | **Yes** — nullable columns + FK + indexes exist in migration |
| Is JSON metadata enough temporarily? | **Partially** — grouping belongs in columns; property specs stay in `listing_json` / `detail_pairs` |
| New `inventory_group_id` column needed? | **No** — `br_inventory_group_id` already defined |
| New `property_inventory` table needed? | **Not for minimal launch** — real rows in `listings` preferred (matches Autos truth model) |
| Join table needed? | **No for launch** — group id + parent id on each row sufficient |
| Migration before final publish gate? | **BR13A migration must be applied** on target Supabase project (repo has file; apply status = **UNKNOWN** from repo alone) |

### 8.5 RLS / policies (document only — not changed)

- `listings_anon_select_public_catalog`: BR public read when `is_published = true` and `status in ('active','sold')`
- Owner insert/update/delete via `owner_id = auth.uid()`
- Inventory children are separate rows — same RLS as any listing; **no new policy required** for basic parent/child if each row has correct `owner_id`
- Related inventory queries use browser client with public select policy (active published rows only)

### 8.6 Dashboard / admin reads

| Surface | Inventory support |
|---------|-------------------|
| Owner dashboard | `ownerListingsQuery` selects `br_inventory_group_id`, `br_inventory_parent_listing_id`, `inventory_role`; `BrPropertyInventoryDashboardSection` |
| Admin queue | `listingsAdminSelect` includes inventory columns; `AdminListingsTable` shows inv-group bit |
| Public detail | `RelatedBrAgentProperties` filters by group id |

### 8.7 Publish path today

1. Browser Supabase client (authenticated owner)
2. `buildListingsInsertRowForLeonixPublish` → insert row
3. Upload photos → update `images` + description
4. Main Negocio: `mainListingInventoryPatchAfterInsert(listingId)` sets `br_inventory_group_id = id`, `inventory_role = 'main'`
5. Add-mode child: `inventoryMetadataForBrNegocioPublish({ mode: 'add', parentListingId, brInventoryGroupId })` sets parent link + `inventory_property`

---

## 9. Current table/field assumptions (evidence)

| Assumption | Evidence |
|------------|----------|
| One row per published property | `leonixPublishRealEstateListingCore` single insert per publish call |
| No nested fake child cards in DB | BR13B audit: “No fake nested inventory” |
| Group fallback without group id | `resolveBrInventoryGroupingKey` → `owner:{owner_id}` |
| Active count limits Negocio only | `isBrNegocioListing` + `countActiveBrInventoryListings` |
| Privado excluded from counts | BR13B QA SQL `privado_rows_not_counted` |

---

## 10. What already supports inventory

| Capability | Gate / file |
|------------|-------------|
| SQL grouping columns | BR13A migration |
| Publish metadata for main + child | `leonixBrPropertyInventoryPolicy.ts`, `leonixPublishRealEstateFromDraftState.ts` |
| Post-publish add flow (query-param re-entry) | BR13B `leonixBrPropertyInventoryAddFlow.ts` |
| Dashboard value drawer + add CTA | BR13D |
| Public related properties section | `RelatedBrAgentProperties.tsx` |
| Owner inventory counts / limits | `computeBrPropertyInventoryCounts` |
| Admin inventory column visibility | `listingsAdminSelect.ts` |
| Media / description / contact polish | MEDIA-DESC-HUB-03 |
| Numeric formatting on cards/detail | DETAILS-COMMAS-02 |

---

## 11. What is missing for real multi-listing publish (BR-INV product gap)

| Gap | Notes |
|-----|-------|
| In-application inventory drawer | Autos A5.QA-08A.1 equivalent — **BR-INV-B/C** |
| Draft array of additional properties pre-publish | Not in `bienesRaicesNegocioFormState` |
| Bundle preview on publish step | Not in Negocio application |
| Single-session multi-row publish | Today: N separate publish operations |
| Stripe entitlement truth for upgrade | Placeholder only |
| Legacy row backfill (`inventory_role` on old mains) | Optional ops task |
| Analytics event wiring | Documented only |

---

## 12. Required future schema/backing options

| Option | Recommendation |
|--------|----------------|
| **A. Column-based grouping (current)** | **Safest minimal launch** — keep BR13A columns; apply migration in prod |
| **B. JSON-only grouping in `listing_json`** | **Reject** — weak query/index story for “more from this agent” |
| **C. Separate `property_inventory` table** | **Defer** — only if non-listing staging needed; publish truth stays `listings` |
| **D. Join table parent↔child** | **Defer** — redundant if parent id + group id on row |

**Before BR-INV-E (publish mapping gate):** confirm BR13A migration applied in production Supabase.

---

## 13. Recommended safest launch approach

1. **Do not add new schema in BR-INV-B/C/D** — use existing `br_inventory_*` columns at publish time (BR-INV-E).
2. Build **Autos-parity in-application drawer** on BR Negocio publish step first (shell → property fields → preview).
3. Persist additional properties in **Negocio draft** only until publish; no fake public URLs/IDs in preview.
4. On publish (BR-INV-E): insert **one row per property** with shared group id and inherited contact JSON from parent form state.
5. Keep **Privado and Rentas** out of inventory until explicit product approval.
6. Wire **Stripe entitlement** before marketing upgrade slots in production.

---

## 14. Lane policy

| Lane | Inventory decision | Reason |
|------|-------------------|--------|
| **BR Negocio / Agente** | **TRUE (candidate)** | Business/agent catalog use case; SQL contract + post-publish add flow exist; missing in-app drawer + batch publish |
| **BR Privado** | **FALSE** | Single-owner residential; no broker inventory; protect from business grouping UX |
| **Rentas** | **DEFER** | No property-manager inventory lane found; shares publish core but no `br_inventory_*` product; keep out until approved |

---

## 15. Inheritance policy (future build)

### Additional properties inherit from parent

- Agent name, broker/company, contact phone/email/website, socials
- Financing / lender advisor block where applicable
- Business Hub / contact card identity
- Office/company identity, package/group context (`br_inventory_group_id`)

### Additional properties own

- Title, property type/subtype, price, specs, address/location/privacy
- Photos/media, description, status
- Public detail page, listing UUID, own Leonix Ad ID after publish

### Publish truth

- Each property → own `public.listings` row
- `inventory_role`: `main` vs `inventory_property`
- Shared `br_inventory_group_id`
- **No fake child-only public cards**

---

## 16. Analytics readiness (document only — not implemented)

Future event context fields:

- `listingId`, `leonixAdId`, `inventoryGroupId` (`br_inventory_group_id`)
- `parentListingId`, `childListingId`
- `category`, `propertyType`, `ownerId` / `sellerId`
- Result card context, detail page context, CTA action type (`add_inventory_open`, `save_property`, `save_and_add_another`, `publish_main`, `publish_child`)

Reference: Autos `AUTOS_INVENTORY_ANALYTICS_EVENTS` pattern in `autosAdditionalInventoryDraft.ts` — not wired in BR yet.

---

## 17. Future gate stack (BR-INV)

| Gate | Scope |
|------|-------|
| **BR-INV-A** | This audit — no feature changes |
| **BR-INV-B** | Add CTA + drawer opens; inventory count shell; preview shell; no publish/Stripe/schema |
| **BR-INV-C** | Property-only drawer: basics/specs/pricing/features/media/description; save / save-and-add-another / cancel; edit/remove; draft persistence |
| **BR-INV-D** | Inventory preview section; main + additional cards; no fake URLs/IDs; owner vs public CTA separation |
| **BR-INV-E** | Supabase publish mapping after schema approved: main + child rows, group id, inherited contact; migration apply if needed; full build |
| **BR-INV-F** | Dashboard/admin/public relationship QA; “more properties from this agent”; no owner CTAs on public |
| **BR-POLISH** | Visual polish after workflow truth is green |

**Relationship to BR13:** BR13A–D delivered **backend contract + post-publish add + dashboard value drawer**. BR-INV-B–D deliver **Autos-style pre-publish application inventory**; BR-INV-E may extend publish mapping for batch/session publish.

---

## 18. Risks

| Risk | Mitigation |
|------|------------|
| BR13A migration not applied in prod | Verify before BR-INV-E; run BR13A verification SQL |
| Duplicate product paths (post-publish add vs in-app drawer) | Document UX precedence in BR-INV-B; converge on one primary funnel |
| Draft quota / sessionStorage loss | Follow Autos IDB fallback patterns (BR13C noted preview quota handling) |
| Upgrade limit bypass without Stripe | Keep `isBrInventoryUpgradeActive` prod-false until entitlement gate |
| Privado contamination | Code review scope lock on Negocio paths only |
| Rentas accidental scope creep | Explicit DEFER in every BR-INV gate |

---

## 19. Do-not-build-yet list (BR-INV-A)

- In-application inventory drawer UI
- “Agregar propiedad al inventario” CTA on publish step
- `additionalInventoryProperties[]` draft state
- Batch multi-listing publish from one session
- New migrations or RLS policy changes
- Stripe / payment wiring
- Analytics implementation
- Rentas / Privado inventory
- Autos / Servicios / unrelated category edits

---

## 20. Polish baseline confirmation

| Baseline | Ready for inventory build? |
|----------|----------------------------|
| MEDIA-DESC-HUB-03 (media, public description, contact hub, CTA cleanup) | **Yes** — sufficient foundation |
| DETAILS-COMMAS-02 (numeric formatting) | **Yes** |
| COPY_ENCODING_00 | **N/A** — file not in repo |

---

## 21. Confirmations (this gate)

| Confirmation | Status |
|--------------|--------|
| No feature code changed | **TRUE** (audit doc + optional script only) |
| No schema/migration changed | **TRUE** |
| No Supabase policies changed | **TRUE** |
| No Stripe/payment touched | **TRUE** |
| No analytics implemented | **TRUE** |
| No files staged | **TRUE** |
| No commit created | **TRUE** |
| No push attempted | **TRUE** |

---

## 22. Supabase readiness matrix

| Need | Exists now | Missing | Future gate |
|------|------------|---------|-------------|
| Own listing row per property | **Yes** | — | BR-INV-E (batch publish wiring) |
| Own Leonix Ad ID per property | **Yes** | — | BR-INV-E |
| Group ID / parent-child link | **Yes** (columns + publish helpers) | Prod migration apply **UNKNOWN** | BR-INV-E |
| Inherited contact data | **Partial** | Auto-copy from parent on child publish in one session | BR-INV-E |
| Public detail relationship | **Yes** | — | BR-INV-F QA |
| Dashboard/admin relationship | **Partial** | In-app draft inventory not in dashboard | BR-INV-F |
| Analytics event context | **No** | Event schema + wiring | Post BR-INV-F |

---

## 23. Recommended next gate

**BR-INV-B — Add Property Drawer Shell** — Autos A5.QA-08A.1 parity: Negocio publish-step CTA, in-page drawer open/close, inventory count shell, bundle preview shell, no publish/Stripe/schema; unblocks property-only fields in BR-INV-C.

---

## TRUE/FALSE audit (BR-INV-A)

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| git status checked | TRUE | Clean at preflight |
| git diff checked | TRUE | Empty |
| Autos inventory pattern inspected | TRUE | §4 |
| BR Privado inspected | TRUE | §5 |
| BR Negocio inspected | TRUE | §6 |
| Shared BR inspected | TRUE | §7 |
| Supabase/database backing inspected | TRUE | §8 |
| Current publish/listing storage identified | TRUE | `public.listings` |
| Leonix Ad ID handling inspected | TRUE | §8.3 |
| Media storage/backing inspected | TRUE | `listing-images` + `listings.images` |
| Parent/child/group readiness assessed | TRUE | §8.4 |
| RLS/policy needs documented | TRUE | §8.5 |
| Dashboard/admin needs documented | TRUE | §8.6 |
| Analytics readiness documented only | TRUE | §16 |
| BR Negocio lane policy written | TRUE | §14 |
| BR Privado protection written | TRUE | §14 |
| Rentas exclusion/defer policy written | TRUE | §14 |
| Future gate stack written | TRUE | §17 |
| Audit doc created | TRUE | This file |
| No feature code changed | TRUE | §21 |
| No schema/migration changed | TRUE | §21 |
| No Stripe/payment touched | TRUE | §21 |
| No analytics implemented | TRUE | §21 |
| No unrelated categories touched | TRUE | §21 |
| No files staged | TRUE | §21 |
| No commit created | TRUE | §21 |
| No push attempted | TRUE | §21 |
