# CLASIFICADOS FULL REPO TREE AUDIT REPORT

**Date:** March 20, 2026  
**Scope:** Complete structural audit of Clasificados system, preview flows, and BR negocio path  
**Purpose:** Identify active vs legacy files, duplication, wrappers, and safe retirement candidates

---

## 1. FULL HIGH-LEVEL TREE SUMMARY

### Top-Level Repo Layout
```
elaguila-website/
├── app/
│   ├── clasificados/          [PRIMARY FOCUS]
│   ├── preview-listing/        [Standalone preview route]
│   ├── components/             [Shared UI components]
│   ├── lib/                    [Shared utilities]
│   └── [other app routes...]
├── public/
└── [config files...]
```

### Major App Areas
- **`app/clasificados/`**: Main Clasificados system
  - **`publicar/[category]/page.tsx`**: Central publish wizard orchestrator (6,773 lines)
  - **`components/`**: Shared preview/listing components
  - **`bienes-raices/`**: BR category (privado + negocio branches)
  - **`rentas/`**: Rentas category (privado + negocio branches)
  - **`en-venta/`**: En Venta category
  - **`anuncio/[id]/page.tsx`**: Public listing view (open card)
  - **`config/`**: Taxonomy/config files (some deprecated re-exports)

- **`app/preview-listing/`**: Standalone preview route (dormant — no `setPreviewDraft` callers found)

---

## 2. CLASIFICADOS TREE SUMMARY

### Directory Structure
```
app/clasificados/
├── anuncio/[id]/              [Public listing page — custom inline UI, not using ListingView]
├── components/                 [Shared preview/listing components]
│   ├── ListingView.tsx         [ACTIVE SOURCE OF TRUTH — preview routing switchboard]
│   ├── BusinessListingIdentityRail.tsx  [ACTIVE — BR negocio/Rentas negocio rail]
│   └── [other shared components...]
├── publicar/
│   ├── [category]/page.tsx     [ACTIVE SOURCE OF TRUTH — publish wizard orchestrator]
│   └── components/
│       ├── PublishMediaPreviewPanel.tsx        [ACTIVE — inline wizard preview]
│       ├── PublishMediaPreviewRightPanel.tsx   [ACTIVE — right column detail preview]
│       └── PublishMediaPreviewGenericCard.tsx  [ACTIVE — generic left card]
├── bienes-raices/
│   ├── shared/
│   │   ├── fields/bienesRaicesTaxonomy.ts      [ACTIVE SOURCE OF TRUTH]
│   │   ├── preview/bienesRaicesPreviewDetailPartition.ts  [ACTIVE SOURCE OF TRUTH]
│   │   └── utils/bienesRaicesPreviewDetailPartition.ts   [DEPRECATED RE-EXPORT]
│   ├── privado/
│   │   ├── preview/BienesRaicesPreviewListing.tsx        [ACTIVE — BR privado preview]
│   │   └── preview/BienesRaicesPrivadoMediaPreviewCard.tsx  [ACTIVE — wizard card]
│   └── negocio/
│       ├── preview/BienesRaicesPreviewNegocioFresh.tsx   [ACTIVE SOURCE OF TRUTH — premium BR negocio]
│       ├── mapping/bienesRaicesNegocioListingMapper.ts   [ACTIVE SOURCE OF TRUTH — BR negocio mapper]
│       └── [contract/, publish/, utils/, rail/, sections/...]
├── rentas/
│   ├── shared/utils/rentasTaxonomy.ts         [ACTIVE SOURCE OF TRUTH]
│   └── privado/preview/RentasPrivadoPublishPreview.tsx  [ACTIVE — Rentas privado preview]
├── en-venta/
│   └── utils/enVentaTaxonomy.ts               [ACTIVE SOURCE OF TRUTH]
└── config/                                     [DEPRECATED RE-EXPORTS]
    ├── bienesRaicesTaxonomy.ts                 [DEPRECATED RE-EXPORT]
    ├── enVentaTaxonomy.ts                      [DEPRECATED RE-EXPORT]
    └── rentasTaxonomy.ts                       [DEPRECATED RE-EXPORT]
```

### Category Ownership
- **Bienes Raíces**: `bienes-raices/` (privado + negocio branches, shared utilities)
- **Rentas**: `rentas/` (privado + negocio branches, shared utilities)
- **En Venta**: `en-venta/` (single category, no branches)

### Preview-Related Areas
1. **Inline wizard preview**: `publicar/components/PublishMediaPreviewPanel.tsx` + sub-components
2. **Full preview modal**: `publicar/[category]/page.tsx` (lines 4250-4379) — uses `ListingView` or category-specific previews
3. **Standalone preview route**: `app/preview-listing/page.tsx` (dormant)
4. **Public listing page**: `anuncio/[id]/page.tsx` (custom inline UI, not using `ListingView`)

---

## 3. PREVIEW SYSTEMS MAP

### Active Preview Entrypoints

| Component/Route | Status | Purpose | Used By |
|----------------|--------|---------|---------|
| **`ListingView.tsx`** | **ACTIVE SOURCE OF TRUTH** | Central preview routing switchboard | `publicar/[category]/page.tsx` (full preview modal), `preview-listing/page.tsx` |
| **`BienesRaicesPreviewNegocioFresh.tsx`** | **ACTIVE SOURCE OF TRUTH** | Premium BR negocio preview (2-col layout, business rail) | `ListingView.tsx` (when `businessRailTier === "business_plus"` or `businessRail` present) |
| **`BienesRaicesPreviewListing.tsx`** | **ACTIVE** | BR privado preview | `ListingView.tsx` (when BR + no business rail) |
| **`RentasPrivadoPublishPreview.tsx`** | **ACTIVE** | Rentas privado preview | `publicar/[category]/page.tsx` (full preview modal, line 4283) |
| **`PublishMediaPreviewPanel.tsx`** | **ACTIVE** | Inline wizard preview (media step) | `publicar/[category]/page.tsx` (line 6508) — **NOT used for BR negocio** |
| **`PublishMediaPreviewRightPanel.tsx`** | **ACTIVE** | Right column detail preview in wizard | `PublishMediaPreviewPanel.tsx` |
| **`PublishMediaPreviewGenericCard.tsx`** | **ACTIVE** | Generic left card in wizard | `PublishMediaPreviewPanel.tsx` |
| **`BienesRaicesPrivadoMediaPreviewCard.tsx`** | **ACTIVE** | BR privado-specific left card in wizard | `PublishMediaPreviewPanel.tsx` (when `useBienesRaicesPrivadoLeftCard === true`) |
| **`PrivateBrPreviewContent`** (inline function) | **ACTIVE** | BR privado full preview modal content | `publicar/[category]/page.tsx` (line 4343) — **NOT used for BR negocio** |
| **`anuncio/[id]/page.tsx`** | **ACTIVE** | Public listing view (open card) | Direct route — custom inline UI, not using `ListingView` |

### Legacy/Dormant Preview Systems

| Component/Route | Status | Notes |
|----------------|--------|-------|
| **`app/preview-listing/page.tsx`** | **DORMANT** | Standalone preview route. `setPreviewDraft()` has **zero callers** in codebase. Route exists but draft is never populated programmatically. Safe to retire later. |

### Preview Flow Summary

**For BR Negocio:**
1. **Media step (step 6)**: `publicar/[category]/page.tsx` line 6495-6506 — **Bypasses `PublishMediaPreviewPanel`**, renders `ListingView` directly with `fullPreviewListingData`
2. **Full preview modal**: `publicar/[category]/page.tsx` line 4373-4379 — Uses `ListingView` with `previewMode={true}`
3. **`ListingView` routing**: Lines 325-330 — Routes to `BienesRaicesPreviewNegocioFresh` when `businessRailTier === "business_plus"` or `businessRail` present
4. **Data flow**: `fullPreviewListingData` (line 4008) → `buildBrNegocioListingData` (line 4048) → `ListingData` with `businessRail` → `ListingView` → `BienesRaicesPreviewNegocioFresh`

**For BR Privado:**
1. **Media step**: Uses `PublishMediaPreviewPanel` with `BienesRaicesPrivadoMediaPreviewCard` (left) + `PublishMediaPreviewRightPanel` (right)
2. **Full preview modal**: Uses `PrivateBrPreviewContent` inline function (line 4343) — **NOT using `ListingView`**
3. **`ListingView` routing**: Routes to `BienesRaicesPreviewListing` when BR + no business rail

**For Rentas Privado:**
1. **Media step**: Uses `PublishMediaPreviewPanel` with generic card
2. **Full preview modal**: Uses `RentasPrivadoPublishPreview` component (line 4283)

**For En Venta:**
1. **Media step**: Uses `PublishMediaPreviewPanel` with generic card
2. **Full preview modal**: Uses `ListingView` (line 4373) — generic preview

---

## 4. BR NEGOCIO FLOW MAP

### Step-by-Step Path from Publish Flow to Preview Renderer

```
1. USER NAVIGATION
   └─> /clasificados/publicar/bienes-raices?branch=negocio

2. PUBLISH WIZARD ORCHESTRATOR
   └─> app/clasificados/publicar/[category]/page.tsx
       ├─> Reads `categoryFromUrl` = "bienes-raices"
       ├─> Reads `details.bienesRaicesBranch` = "negocio"
       └─> Sets `isBienesRaicesNegocio = true`

3. PREVIEW DATA CONSTRUCTION (Media Step / Full Preview)
   └─> fullPreviewListingData useMemo (line 4008)
       ├─> Checks: categoryFromUrl === "bienes-raices" && branch === "negocio" (case-insensitive)
       ├─> Calls: buildBrNegocioListingData() (line 4048)
       │   └─> app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioListingMapper.ts
       │       ├─> Builds businessRail data
       │       ├─> Sets businessRailTier = "business_plus"
       │       └─> Returns ListingData with businessRail + structured facts
       └─> Returns ListingData with category: "bienes-raices" (explicit, line 4043)

4. PREVIEW RENDERING (Two Entry Points)

   A. MEDIA STEP (Step 6) — Inline Preview
      └─> publicar/[category]/page.tsx line 6495-6506
          ├─> Condition: isBienesRaicesNegocio === true
          ├─> Bypasses: PublishMediaPreviewPanel (NOT used for BR negocio)
          └─> Renders: <ListingView listing={fullPreviewListingData} previewMode hideProComparisonUI />
              └─> ListingView.tsx line 325-330
                  ├─> Checks: previewMode && isBienesRaices && (businessRailTier === "business_plus" || businessRail)
                  └─> Returns: <BienesRaicesPreviewNegocioFresh listing={listing} />
                      └─> app/clasificados/bienes-raices/negocio/preview/BienesRaicesPreviewNegocioFresh.tsx
                          ├─> Premium 2-column layout
                          ├─> Hero image/media band
                          ├─> Summary block
                          ├─> Grouped facts & features
                          ├─> Location section
                          ├─> Sticky premium business rail (BusinessListingIdentityRail with premiumBienesRaices={true})
                          └─> Lower agent/brokerage block

   B. FULL PREVIEW MODAL (openFullPreview button)
      └─> publicar/[category]/page.tsx line 4373-4379
          ├─> Condition: NOT isRentasPrivado && NOT isBienesRaicesPrivado
          ├─> Renders: <ListingView listing={fullPreviewListingData} previewMode={true} ... />
          └─> Same routing as Media Step → BienesRaicesPreviewNegocioFresh

5. BUSINESS RAIL RENDERING
   └─> BienesRaicesPreviewNegocioFresh.tsx
       └─> <BusinessListingIdentityRail
             businessRail={listing.businessRail}
             category="bienes-raices"
             businessRailTier={listing.businessRailTier}
             premiumBienesRaices={true}  [KEY: enables full premium layout]
             ... />
           └─> app/clasificados/components/BusinessListingIdentityRail.tsx
               └─> Renders premium BR negocio rail with full contact/social/tour rows
```

### Where the Wrong Preview Was Coming From (Historical Context)

**Previously (before Phase 3 fixes):**
- `fullPreviewListingData` condition could fail if `category` state lagged `categoryFromUrl` or branch detection was case-sensitive
- If mapper didn't run, `base` `ListingData` lacked `category: "bienes-raices"`, causing `ListingView` to fall back to generic preview
- Media step had redundant UI wrappers (borders, backgrounds) making premium preview appear "compact"

**Currently (after Phase 3 fixes):**
- ✅ Robust branch detection using `categoryFromUrl` + case-insensitive branch check
- ✅ Explicit `category: "bienes-raices"` on `base` `ListingData` when `categoryFromUrl` indicates BR
- ✅ `ListingView` explicitly checks `businessRailTier === "business_plus"` OR `businessRail` presence
- ✅ Simplified UI wrappers in media step and `BienesRaicesNegocioBasicsWizard` step 7

---

## 5. FILE STATUS TABLE

### ACTIVE SOURCE OF TRUTH

| File | Purpose | Notes |
|------|---------|-------|
| `app/clasificados/publicar/[category]/page.tsx` | Publish wizard orchestrator | 6,773 lines. Central orchestrator for all categories. Contains `fullPreviewListingData`, preview modal logic, BR branching. |
| `app/clasificados/components/ListingView.tsx` | Preview routing switchboard | Routes to category-specific previews based on `listing.category`, `previewMode`, `businessRail`. |
| `app/clasificados/bienes-raices/negocio/preview/BienesRaicesPreviewNegocioFresh.tsx` | Premium BR negocio preview | Final premium renderer with 2-col layout, business rail, structured facts. |
| `app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioListingMapper.ts` | BR negocio data mapper | Maps publish snapshot → `ListingData` with `businessRail`, `businessRailTier`, structured facts. |
| `app/clasificados/bienes-raices/privado/preview/BienesRaicesPreviewListing.tsx` | BR privado preview | Currently stub (returns "BR privado preview reset"). |
| `app/clasificados/components/BusinessListingIdentityRail.tsx` | Business rail component | Shared rail for BR negocio + Rentas negocio. Premium layout when `premiumBienesRaices={true}`. |
| `app/clasificados/anuncio/[id]/page.tsx` | Public listing view | Custom inline UI (not using `ListingView`). Active live route. |
| `app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy.ts` | BR taxonomy source | Single source of truth for BR taxonomy. |
| `app/clasificados/bienes-raices/shared/preview/bienesRaicesPreviewDetailPartition.ts` | BR preview detail partition | Splits detailPairs into quick facts vs feature tags. |
| `app/clasificados/en-venta/utils/enVentaTaxonomy.ts` | En Venta taxonomy source | Single source of truth. |
| `app/clasificados/rentas/shared/utils/rentasTaxonomy.ts` | Rentas taxonomy source | Single source of truth. |
| `app/clasificados/rentas/shared/utils/rentasFilters.ts` | Rentas filters | Single source of truth. |

### ACTIVE BUT LEGACY

| File | Purpose | Notes |
|------|---------|-------|
| `app/clasificados/publicar/components/PublishMediaPreviewPanel.tsx` | Inline wizard preview | Active for non-BR-negocio categories. BR negocio bypasses this in media step. |
| `app/clasificados/publicar/components/PublishMediaPreviewRightPanel.tsx` | Right column detail preview | Used by `PublishMediaPreviewPanel`. |
| `app/clasificados/publicar/components/PublishMediaPreviewGenericCard.tsx` | Generic left card | Used by `PublishMediaPreviewPanel` for non-BR-privado. |
| `app/clasificados/bienes-raices/privado/preview/BienesRaicesPrivadoMediaPreviewCard.tsx` | BR privado wizard card | Used by `PublishMediaPreviewPanel` when `useBienesRaicesPrivadoLeftCard === true`. |
| `app/clasificados/rentas/privado/preview/RentasPrivadoPublishPreview.tsx` | Rentas privado preview | Used in full preview modal for Rentas privado. |
| `PrivateBrPreviewContent` (inline function in `page.tsx`) | BR privado full preview | Inline function (line 850-1200+). Used in full preview modal for BR privado. **NOT used for BR negocio.** |

### COMPATIBILITY WRAPPER / DEPRECATED RE-EXPORT

| File | Purpose | Status | Import Sites |
|------|---------|--------|--------------|
| `app/clasificados/config/bienesRaicesTaxonomy.ts` | Re-export wrapper | **DEPRECATED** | `publicar/[category]/page.tsx` (line 93), `lista/page.tsx` (line 21), `PublishMediaPreviewRightPanel.tsx` (line 5) |
| `app/clasificados/config/enVentaTaxonomy.ts` | Re-export wrapper | **DEPRECATED** | `publicar/[category]/page.tsx` (line 38) |
| `app/clasificados/config/rentasTaxonomy.ts` | Re-export wrapper | **DEPRECATED** | `publicar/[category]/page.tsx` (line 80) |
| `app/clasificados/bienes-raices/shared/bienesRaicesTaxonomy.ts` | Re-export wrapper | **DEPRECATED** | None found (likely safe to delete) |
| `app/clasificados/bienes-raices/shared/utils/bienesRaicesPreviewDetailPartition.ts` | Re-export wrapper | **DEPRECATED** | None found (likely safe to delete) |
| `app/clasificados/rentas/rentasFilters.ts` | Re-export wrapper | **DEPRECATED** | Check import sites before deletion |

### PROBABLY SAFE TO RETIRE LATER

| File | Purpose | Notes |
|------|---------|-------|
| `app/preview-listing/page.tsx` | Standalone preview route | **DORMANT**. `setPreviewDraft()` has zero callers. Route exists but draft is never populated programmatically. Safe to retire after confirming no external/manual usage. |
| `app/lib/previewListingDraft.ts` | Preview draft helpers | Used by `/preview-listing` route. If route is retired, this can be retired too. |

### UNKNOWN / NEEDS MANUAL REVIEW

| File | Purpose | Notes |
|------|---------|-------|
| `app/clasificados/bienes-raices/privado/preview/BienesRaicesPreviewListing.tsx` | BR privado preview | Currently stub (returns "BR privado preview reset"). May be incomplete implementation. Check if BR privado full preview modal should use this instead of `PrivateBrPreviewContent`. |

---

## 6. DELETION / RETIREMENT CANDIDATES

### High-Confidence Safe Deletions (After Import Migration)

1. **`app/clasificados/config/bienesRaicesTaxonomy.ts`** (deprecated re-export)
   - **Why**: Re-exports from `bienes-raices/shared/fields/bienesRaicesTaxonomy.ts`
   - **Action**: Update imports in `publicar/[category]/page.tsx`, `lista/page.tsx`, `PublishMediaPreviewRightPanel.tsx` → delete

2. **`app/clasificados/config/enVentaTaxonomy.ts`** (deprecated re-export)
   - **Why**: Re-exports from `en-venta/utils/enVentaTaxonomy.ts`
   - **Action**: Update import in `publicar/[category]/page.tsx` → delete

3. **`app/clasificados/config/rentasTaxonomy.ts`** (deprecated re-export)
   - **Why**: Re-exports from `rentas/shared/utils/rentasTaxonomy.ts`
   - **Action**: Update import in `publicar/[category]/page.tsx` → delete

4. **`app/clasificados/bienes-raices/shared/bienesRaicesTaxonomy.ts`** (deprecated re-export)
   - **Why**: Re-exports from `bienes-raices/shared/fields/bienesRaicesTaxonomy.ts`
   - **Action**: Verify no imports → delete

5. **`app/clasificados/bienes-raices/shared/utils/bienesRaicesPreviewDetailPartition.ts`** (deprecated re-export)
   - **Why**: Re-exports from `bienes-raices/shared/preview/bienesRaicesPreviewDetailPartition.ts`
   - **Action**: Verify no imports → delete

6. **`app/clasificados/rentas/rentasFilters.ts`** (deprecated re-export)
   - **Why**: Re-exports from `rentas/shared/utils/rentasFilters.ts`
   - **Action**: Check import sites → update → delete

### Low-Risk Retirement Candidates (After Confirmation)

7. **`app/preview-listing/page.tsx`** (dormant route)
   - **Why**: `setPreviewDraft()` has zero callers. Draft is never populated programmatically.
   - **Action**: Confirm no external/manual usage → retire route + `app/lib/previewListingDraft.ts`

### Files to Keep (Protected)

- All files marked "ACTIVE SOURCE OF TRUTH"
- All publish shells (`*PublishShell.tsx`)
- All contract files (`bienes-raices/negocio/contract/*`)
- All mapping files
- All active preview components
- `app/clasificados/publicar/[category]/page.tsx` (central orchestrator)
- `app/clasificados/components/ListingView.tsx` (routing switchboard)

---

## 7. SAFE CLEANUP PLAN

### Phase 1: Migrate Imports Away from Deprecated Re-Exports

**Order:**
1. Update `publicar/[category]/page.tsx` imports:
   - `config/enVentaTaxonomy` → `en-venta/utils/enVentaTaxonomy`
   - `config/rentasTaxonomy` → `rentas/shared/utils/rentasTaxonomy`
   - `config/bienesRaicesTaxonomy` → `bienes-raices/shared/fields/bienesRaicesTaxonomy`
2. Update `lista/page.tsx` import:
   - `config/bienesRaicesTaxonomy` → `bienes-raices/shared/fields/bienesRaicesTaxonomy`
3. Update `PublishMediaPreviewRightPanel.tsx` import:
   - `config/bienesRaicesTaxonomy` → `bienes-raices/shared/fields/bienesRaicesTaxonomy`
4. Verify no other imports of deprecated re-exports
5. Run `npm run build` → fix errors

### Phase 2: Delete Deprecated Re-Export Files

**Order:**
1. Delete `app/clasificados/config/bienesRaicesTaxonomy.ts`
2. Delete `app/clasificados/config/enVentaTaxonomy.ts`
3. Delete `app/clasificados/config/rentasTaxonomy.ts`
4. Delete `app/clasificados/bienes-raices/shared/bienesRaicesTaxonomy.ts` (if no imports)
5. Delete `app/clasificados/bienes-raices/shared/utils/bienesRaicesPreviewDetailPartition.ts` (if no imports)
6. Delete `app/clasificados/rentas/rentasFilters.ts` (after import migration)
7. Run `npm run build` → verify green

### Phase 3: Review and Retire Dormant Route (Optional)

**Order:**
1. Confirm `/preview-listing` has zero external usage (manual testing, analytics)
2. If confirmed dormant:
   - Delete `app/preview-listing/page.tsx`
   - Delete `app/lib/previewListingDraft.ts` (or keep if other code uses it)
   - Remove `PREVIEW_LISTING_DRAFT_KEY` re-export from `classifiedsDraftStorage.ts` if unused
3. Run `npm run build` → verify green

### Dependencies and Risks

**Low Risk:**
- Deleting deprecated re-exports (after import migration)
- Retiring `/preview-listing` route (if confirmed unused)

**Medium Risk:**
- Updating imports in `publicar/[category]/page.tsx` (large file, many dependencies) — test thoroughly

**High Risk:**
- **DO NOT** delete any files marked "ACTIVE SOURCE OF TRUTH"
- **DO NOT** delete publish shells or contract files
- **DO NOT** delete active preview components

---

## 8. FINAL RECOMMENDATION

### Permanent Clean Architecture

**Core Structure:**
```
app/clasificados/
├── publicar/[category]/page.tsx          [Central orchestrator — KEEP]
├── components/
│   ├── ListingView.tsx                   [Preview routing switchboard — KEEP]
│   └── BusinessListingIdentityRail.tsx   [Business rail — KEEP]
├── bienes-raices/
│   ├── shared/fields/                    [Taxonomy source — KEEP]
│   ├── shared/preview/                   [Preview utilities — KEEP]
│   ├── negocio/
│   │   ├── preview/BienesRaicesPreviewNegocioFresh.tsx  [Premium preview — KEEP]
│   │   └── mapping/bienesRaicesNegocioListingMapper.ts  [Mapper — KEEP]
│   └── privado/preview/BienesRaicesPreviewListing.tsx   [Privado preview — KEEP/COMPLETE]
├── rentas/                               [Rentas structure — KEEP]
├── en-venta/                             [En Venta structure — KEEP]
└── config/                               [DELETE after import migration]
```

### Minimum Deletion Set

**Must Delete (after import migration):**
1. `app/clasificados/config/bienesRaicesTaxonomy.ts`
2. `app/clasificados/config/enVentaTaxonomy.ts`
3. `app/clasificados/config/rentasTaxonomy.ts`
4. `app/clasificados/bienes-raices/shared/bienesRaicesTaxonomy.ts` (if no imports)
5. `app/clasificados/bienes-raices/shared/utils/bienesRaicesPreviewDetailPartition.ts` (if no imports)
6. `app/clasificados/rentas/rentasFilters.ts` (after import migration)

**Optional Retirement (after confirmation):**
7. `app/preview-listing/page.tsx` + `app/lib/previewListingDraft.ts` (if confirmed unused)

### Root Cause Analysis

**Clasificados is suffering from:**
1. **Deprecated re-export wrappers** (6 files in `config/` and `shared/`) — causing import confusion
2. **Dormant route** (`/preview-listing`) — unused but still present
3. **Incomplete BR privado preview** (`BienesRaicesPreviewListing.tsx` is stub) — may need completion

**NOT suffering from:**
- ✅ Duplicated preview paths (BR negocio correctly uses single path: `ListingView` → `BienesRaicesPreviewNegocioFresh`)
- ✅ Misplaced ownership (category structure is clear after Phase 4 reorganization)
- ✅ Competing preview systems (single source of truth: `ListingView`)

### Shortest List of Files Causing Confusion

1. **`app/clasificados/config/*.ts`** (3 deprecated re-exports) — import confusion
2. **`app/preview-listing/page.tsx`** (dormant route) — noise
3. **`app/clasificados/bienes-raices/shared/bienesRaicesTaxonomy.ts`** (deprecated re-export) — duplicate path

### Safest First Deletion Wave

1. **Migrate imports** in `publicar/[category]/page.tsx`, `lista/page.tsx`, `PublishMediaPreviewRightPanel.tsx`
2. **Delete** `app/clasificados/config/bienesRaicesTaxonomy.ts`
3. **Delete** `app/clasificados/config/enVentaTaxonomy.ts`
4. **Delete** `app/clasificados/config/rentasTaxonomy.ts`
5. **Run** `npm run build` → verify green
6. **Delete** `app/clasificados/bienes-raices/shared/bienesRaicesTaxonomy.ts` (if no imports)
7. **Delete** `app/clasificados/bienes-raices/shared/utils/bienesRaicesPreviewDetailPartition.ts` (if no imports)
8. **Run** `npm run build` → verify green

### Single Most Likely Reason Wrong BR Negocio Preview Was Showing

**Historical (before Phase 3 fixes):**
The `fullPreviewListingData` `useMemo` condition could fail if:
1. `category` state lagged `categoryFromUrl` (URL parameter)
2. Branch detection was case-sensitive (`"Negocio"` vs `"negocio"`)
3. Mapper didn't run → `base` `ListingData` lacked `category: "bienes-raices"` → `ListingView.isBienesRaices` was `false` → fell back to generic preview

**Current (after Phase 3 fixes):**
✅ Fixed with:
- Robust branch detection using `categoryFromUrl` + case-insensitive check
- Explicit `category: "bienes-raices"` on `base` `ListingData`
- `ListingView` explicitly checks `businessRailTier === "business_plus"` OR `businessRail` presence

---

## SUMMARY

**Active Systems:**
- ✅ BR negocio preview correctly routes through `ListingView` → `BienesRaicesPreviewNegocioFresh`
- ✅ Single source of truth for preview routing: `ListingView.tsx`
- ✅ Clear category ownership structure (after Phase 4 reorganization)

**Issues Identified:**
- ⚠️ 6 deprecated re-export wrappers causing import confusion
- ⚠️ 1 dormant route (`/preview-listing`) with zero callers
- ⚠️ 1 incomplete BR privado preview stub

**Recommended Actions:**
1. Migrate imports away from deprecated re-exports
2. Delete deprecated re-export files
3. Retire `/preview-listing` route (after confirmation)
4. Complete `BienesRaicesPreviewListing.tsx` implementation (if needed)

**Build Status:** All active systems are green. Cleanup is safe after import migration.
