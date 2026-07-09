# CATEGORY STANDARD V2 EXTRACT RENTAS/BIENES GLOBAL TEMPLATE V1 - AUDIT

## GATE 0 — SNAPSHOT / INSPECTION

### Files Inspected

**Rentas visual source:**
- ✅ `app/(site)/clasificados/rentas/page.tsx` - Entry point
- ✅ `app/(site)/clasificados/rentas/RentasLandingHub.tsx` - Landing hub
- ✅ `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx` - Landing shell
- ✅ `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx` - Hero gateway
- ✅ `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx` - Intent tiles
- ✅ `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx` - Shortcut sections
- ✅ `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx` - Visibility strip
- ✅ `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx` - Search canvas
- ✅ `app/(site)/clasificados/rentas/components/RentasFiltersDrawer.tsx` - Filters drawer
- ✅ `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts` - UI constants
- ✅ `app/(site)/clasificados/rentas/results/RentasResultsClient.tsx` - Results client
- ✅ `app/(site)/clasificados/rentas/results/components/RentasResultsGatewayPanel.tsx` - Results gateway
- ✅ `app/(site)/clasificados/rentas/results/components/RentasResultsActiveFilters.tsx` - Active filters
- ✅ `app/(site)/clasificados/rentas/results/components/RentasResultsToolbar.tsx` - Results toolbar

**Bienes Raíces proof/reference:**
- ✅ `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx` - Landing view
- ✅ `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx` - Hero gateway
- ✅ `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx` - Shortcut sections
- ✅ `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx` - Search canvas
- ✅ `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` - Results client
- ✅ `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx` - Results gateway
- ✅ `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsActiveFilters.tsx` - Active filters
- ✅ `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsHeader.tsx` - Results header

**Existing categoryStandard files inspected:**
- ✅ `app/(site)/clasificados/components/categoryStandard/` - Existing shared components (too generic, not matching Rentas/Bienes exactly)
- ✅ `app/(site)/clasificados/components/categoryStandardV2/` - Empty directory (confirmed new V2 folder needed)

### Decision
- ✅ Created V2 folder to avoid breaking existing categoryStandard components
- ✅ No category migration planned in this gate (architectural build only)

---

## GATE 1 — EXTRACT VISUAL CONSTANTS

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/types.ts` - TypeScript types
- ✅ `app/(site)/clasificados/components/categoryStandardV2/constants.ts` - Visual constants

### Visual Constants Extracted

**Page shell:**
- ✅ `LEONIX_HEADER_SAFE_TOP` - Safe top spacing
- ✅ `LEONIX_LANDING_LANE` - Landing content lane
- ✅ `LEONIX_RESULTS_SHELL` - Results shell lane
- ✅ `LEONIX_RESULTS_PAGE_BG` - Results page background
- ✅ `LEONIX_LANDING_BG` - Landing page background
- ✅ `LEONIX_TEXTURE_RADIAL` - Radial gradient texture
- ✅ `LEONIX_TEXTURE_GRID` - Subtle grid texture

**Hero gateway:**
- ✅ `LEONIX_GATEWAY_PAD` - Gateway panel padding
- ✅ `LEONIX_GATEWAY_PANEL` - Gateway panel
- ✅ `LEONIX_GATEWAY_ICON` - Icon wrapper
- ✅ `LEONIX_EYEBROW` - Eyebrow text
- ✅ `LEONIX_H1` - H1 title
- ✅ `LEONIX_TAGLINE` - Tagline
- ✅ `LEONIX_INTRO` - Intro paragraph
- ✅ `LEONIX_INTRO_SECONDARY` - Secondary intro
- ✅ `LEONIX_SEARCH_SLOT` - Search slot container

**Search canvas:**
- ✅ `LEONIX_SEARCH_SHELL` - Search shell
- ✅ `LEONIX_SEARCH_SHELL_LANDING` - Landing search shell
- ✅ `LEONIX_SEARCH_SHELL_GLOW` - Search shell glow
- ✅ `LEONIX_SEARCH_SHELL_GLOW_LANDING` - Landing search glow
- ✅ `LEONIX_HERO_SEARCH_SHELL` - Hero search shell
- ✅ `LEONIX_HERO_SEARCH_GLOW` - Hero search glow
- ✅ `LEONIX_RESULTS_REFINE_PANEL` - Results refine panel
- ✅ `LEONIX_SEARCH_FIELD` - Search field
- ✅ `LEONIX_SEARCH_FIELD_LANDING` - Landing search field
- ✅ `LEONIX_SEARCH_INPUT` - Search input
- ✅ `LEONIX_SEARCH_INPUT_LANDING` - Landing search input

**CTA buttons:**
- ✅ `LEONIX_BTN_PRIMARY` - Primary CTA
- ✅ `LEONIX_BTN_PRIMARY_LANDING` - Landing primary CTA
- ✅ `LEONIX_BTN_SECONDARY` - Secondary CTA
- ✅ `LEONIX_BTN_SECONDARY_LANDING` - Landing secondary CTA

**Landing sections:**
- ✅ `LEONIX_LANDING_SECTION` - Landing section wrapper
- ✅ `LEONIX_LANDING_SECTION_PAD` - Landing section padding
- ✅ `LEONIX_LANDING_TILES_INTEGRATED` - Intent tiles zone
- ✅ `LEONIX_LANDING_TILES_ACCENT` - Intent tiles accent

**Chips:**
- ✅ `LEONIX_LANDING_CHIP` - Default landing chip
- ✅ `LEONIX_BUDGET_CHIP` - Budget/gold chip
- ✅ `LEONIX_PRACTICAL_CHIP` - Practical/olive chip

**Discovery grid:**
- ✅ `LEONIX_DISCOVERY_GRID` - Discovery grid
- ✅ `LEONIX_DISCOVERY_CARD` - Discovery card
- ✅ `LEONIX_DISCOVERY_ICON` - Discovery card icon
- ✅ `LEONIX_DISCOVERY_LABEL` - Discovery card label
- ✅ `LEONIX_DISCOVERY_HINT` - Discovery card hint

**Shortcut sections:**
- ✅ `LEONIX_SHORTCUT_SECTIONS` - Shortcut sections wrapper
- ✅ `LEONIX_SHORTCUT_HEADING` - Shortcut heading
- ✅ `LEONIX_SHORTCUT_SUBTITLE` - Shortcut subtitle
- ✅ `LEONIX_SHORTCUT_ROW` - Shortcut chips row

**Active filters:**
- ✅ `LEONIX_ACTIVE_FILTERS_PANEL` - Active filters panel
- ✅ `LEONIX_ACTIVE_FILTER_CHIP` - Active filter chip
- ✅ `LEONIX_ACTIVE_FILTERS_LABEL` - Active filters label

**Results toolbar:**
- ✅ `LEONIX_RESULTS_TOOLBAR_WRAPPER` - Toolbar wrapper
- ✅ `LEONIX_RESULTS_TOOLBAR_INNER` - Toolbar inner
- ✅ `LEONIX_RESULTS_COUNT` - Results count text
- ✅ `LEONIX_RESULTS_COUNT_LABEL` - Results count label
- ✅ `LEONIX_RESULTS_COUNT_NUMBER` - Results count number
- ✅ `LEONIX_SORT_SELECT` - Sort select
- ✅ `LEONIX_VIEW_TOGGLE_GROUP` - View toggle group
- ✅ `LEONIX_VIEW_TOGGLE_BUTTON` - View toggle button
- ✅ `LEONIX_VIEW_TOGGLE_BUTTON_ACTIVE` - Active view toggle
- ✅ `LEONIX_VIEW_TOGGLE_BUTTON_INACTIVE` - Inactive view toggle

**Compact empty state:**
- ✅ `LEONIX_COMPACT_EMPTY_STATE` - Compact empty state
- ✅ `LEONIX_EMPTY_TITLE` - Empty state title
- ✅ `LEONIX_EMPTY_BODY` - Empty state body
- ✅ `LEONIX_EMPTY_CTA` - Empty state CTA

**Visibility strip:**
- ✅ `LEONIX_VISIBILITY_STRIP` - Visibility strip
- ✅ `LEONIX_VISIBILITY_GRADIENT` - Visibility gradient
- ✅ `LEONIX_VISIBILITY_ICON` - Visibility icon
- ✅ `LEONIX_VISIBILITY_EYEBROW` - Visibility eyebrow
- ✅ `LEONIX_VISIBILITY_TITLE` - Visibility title
- ✅ `LEONIX_VISIBILITY_BODY` - Visibility body
- ✅ `LEONIX_VISIBILITY_CTA` - Visibility CTA

**Card accents:**
- ✅ `LEONIX_ACCENT_BURGUNDY` - Burgundy accent
- ✅ `LEONIX_ACCENT_GREEN` - Green accent
- ✅ `LEONIX_ACCENT_GOLD` - Gold accent

### Verification
- ✅ Exact classes copied from Rentas/Bienes
- ✅ CTA contract physically present in constants
- ✅ No generic design drift
- ✅ Literal CSS classes preserved

---

## GATE 2 — CREATE PAGE SHELL

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPageShell.tsx`

### Implementation
- ✅ Copied RentasLandingShell behavior and visual style
- ✅ Background color: `bg-[#F3EBDD]` (landing), `bg-[#FAF6EE]` (results)
- ✅ Text color: `text-[#1F241C]`
- ✅ Radial gradient texture layer
- ✅ Subtle grid texture layer
- ✅ Centered content lane: `mx-auto max-w-[1280px]`
- ✅ Padding: `px-3.5 pb-14 sm:px-5 lg:px-6`
- ✅ Safe top spacing consistent with Rentas/Bienes
- ✅ No horizontal overflow
- ✅ Supports children, topSlot, className override
- ✅ No dependency on Rentas category

### Verification
- ✅ Page shell created
- ✅ Background/texture/lane copied
- ✅ No dependency on Rentas category

---

## GATE 3 — CREATE HERO GATEWAY

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryHeroGateway.tsx`

### Implementation
- ✅ Copied Rentas/Bienes hero/gateway rhythm
- ✅ Icon wrapper: `h-14 w-14 rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90`
- ✅ Eyebrow: `text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]`
- ✅ H1: `font-serif text-[2.1rem] font-bold sm:text-[2.5rem] lg:text-[2.65rem]`
- ✅ Tagline: `font-serif text-lg font-semibold italic text-[#7A1E2C]`
- ✅ Intro: `text-[0.9375rem] leading-relaxed text-[#3D3428]`
- ✅ Intro secondary: `text-sm leading-relaxed text-[#5C5346]`
- ✅ Search slot supported
- ✅ Tiles slot supported (landing only)
- ✅ Surface prop: "landing" | "results"
- ✅ Hard rule: For results surface, only renders hero/search identity and search slot

### Verification
- ✅ Hero gateway created
- ✅ Exact classes copied
- ✅ Search slot supported
- ✅ Surface rules documented
- ✅ Results hard-block implemented

---

## GATE 4 — CREATE SEARCH CANVAS + CTA

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryCta.tsx`

### Search Canvas Implementation
- ✅ Copied RentasCompactSearchCanvas/BienesCompactSearchCanvas
- ✅ Shell: `rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-3`
- ✅ Landing shell: `rounded-2xl border-2 border-[#C9A84A]/50 bg-[#FFFDF7] p-3.5`
- ✅ Grid: `grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3`
- ✅ Desktop spans: keyword (5/4), city (2), state (2), zip (1), search (2)
- ✅ Second row: country (3/4), filters (2/3/4), browse (3/5/4), publish (4)
- ✅ Input heights: `min-h-[3rem] sm:min-h-[3.125rem]`
- ✅ Input: `rounded-xl border border-[#D6C7AD]/75 bg-white px-3`
- ✅ Surface prop: "landing" | "results"
- ✅ Publish CTA only on landing
- ✅ Category-agnostic field names

### CTA Implementation
- ✅ Primary CTA: `bg-[#7A1E2C] hover:bg-[#5e1721] text-[#FFFDF7]`
- ✅ Primary dimensions: `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl px-5`
- ✅ Secondary CTA: `border border-[#C9A84A]/60 bg-[#FFFDF7] text-[#3D3428]`
- ✅ Secondary dimensions: `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl px-4`
- ✅ Supports Link (href) and button (onClick)
- ✅ Variant: "primary" | "secondary" | "ghost"
- ✅ Exact primary/secondary CTA classes locked

### Verification
- ✅ Search canvas created
- ✅ CTA classes exact
- ✅ Input heights exact
- ✅ Button heights exact
- ✅ Grid spans exact
- ✅ No floating CTA behavior introduced

---

## GATE 5 — CREATE LANDING SECTIONS

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPartnerSection.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryDiscoveryGrid.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryShortcutSection.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryVisibilityStrip.tsx`

### Partner Section Implementation
- ✅ Section wrapper: `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96`
- ✅ Padding: `px-4 py-5 sm:px-6 sm:py-6`
- ✅ Chips: `h-[36px] to h-[38px]`
- ✅ Primary/secondary CTA uses LeonixCategoryCta
- ✅ Eyebrow, title, body, supporting line
- ✅ Chips array support
- ✅ Hard rule: Returns `null` if `surface === "results"`

### Discovery Grid Implementation
- ✅ Grid: `mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4`
- ✅ Card: `min-h-[4.75rem] sm:min-h-[5rem] rounded-xl border bg-gradient-to-br p-3`
- ✅ Icon: `h-8 w-8 sm:h-9 sm:w-9 rounded-lg`
- ✅ Label: `font-serif text-sm font-bold`
- ✅ Hint: `text-[10px] sm:text-[11px]`
- ✅ Card accents: burgundy, green, gold
- ✅ Hard rule: Returns `null` if `surface === "results"`

### Shortcut Section Implementation
- ✅ Wrapper: `mt-6 space-y-5 sm:mt-7`
- ✅ Section: `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96`
- ✅ Padding: `px-4 py-5 sm:px-6 sm:py-6`
- ✅ Budget chip: `h-[38px] border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#FBF7EF]`
- ✅ Practical chip: `h-[36px] border-[#556B3E]/30 bg-gradient-to-b from-[#F8FAF6] to-[#FFFDF7]`
- ✅ Chip: `px-4 text-xs font-bold/semibold`
- ✅ Hard rule: Returns `null` if `surface === "results"`

### Visibility Strip Implementation
- ✅ Compact strip with gradient
- ✅ Icon: `h-11 w-11 rounded-xl border border-[#C9A84A]/45 bg-[#FFF9F0]`
- ✅ Eyebrow: `text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A1E2C]`
- ✅ Title: `font-serif text-base font-bold sm:text-lg`
- ✅ Body: `text-xs leading-relaxed sm:text-sm`
- ✅ CTA: `min-h-[2.75rem] rounded-xl border border-[#7A1E2C]/35 bg-[#7A1E2C]`
- ✅ Default: Returns `null` if `surface === "results"` and `allowOnResults !== true`

### Verification
- ✅ Landing sections created
- ✅ Results hard-blocks implemented
- ✅ Exact card/chip dimensions copied
- ✅ Exact section styling copied

---

## GATE 6 — CREATE RESULTS COMPONENTS

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryResultsShell.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryActiveFilters.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryResultsToolbar.tsx`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryCompactEmptyState.tsx`

### Results Shell Implementation
- ✅ Enforces final order:
  1. Hero/search shell
  2. Active filters if active
  3. Result count + sort/view controls
  4. Cards/items/listings or compact empty state
  5. Optional pagination
  6. Optional lower visibility strip if explicitly allowed
- ✅ Hard rules:
  - Does not accept `partnerSection` prop
  - Does not accept `discoveryGrid` prop
  - Does not accept `shortcutSections` prop
  - Does not accept `randomCtaRows` prop
  - `surface` must be `"results"`
- ✅ README states: results pages cannot render landing-only sections

### Active Filters Implementation
- ✅ Panel: `flex flex-col gap-2 rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7]/90`
- ✅ Chip: `inline-flex max-w-full items-center rounded-full border border-[#D6C7AD]/70 bg-white px-3 py-1`
- ✅ Label: `text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]`
- ✅ Supports Link (href) and button (onClear)
- ✅ Clear all button
- ✅ Hides when no chips
- ✅ Compact wrap/no overflow
- ✅ No category shortcut chips

### Results Toolbar Implementation
- ✅ Count text with label and numbers
- ✅ Sort select with options
- ✅ View toggle (grid/list)
- ✅ Per page select (optional)
- ✅ Clear all button (optional)
- ✅ Compact mobile stacking
- ✅ Does not render landing CTA buttons

### Compact Empty State Implementation
- ✅ `rounded-[20px] border border-dashed`
- ✅ Compact px/py
- ✅ Title, body
- ✅ Optional single CTA max
- ✅ Hard rule: No multi-button CTA clutter

### Verification
- ✅ Results shell created
- ✅ Forbidden landing sections impossible by component API
- ✅ Compact empty state created
- ✅ Results order enforced
- ✅ Empty state max one CTA

---

## GATE 7 — EXPORTS / README

### Files Created
- ✅ `app/(site)/clasificados/components/categoryStandardV2/index.ts`
- ✅ `app/(site)/clasificados/components/categoryStandardV2/README.md`

### Index Implementation
- ✅ All types exported
- ✅ All constants exported
- ✅ All components exported
- ✅ No category route changed
- ✅ Non-breaking export path

### README Implementation
- ✅ Source-of-truth Rentas/Bienes paths documented
- ✅ Exact rules for landing documented
- ✅ Exact rules for results documented
- ✅ CTA contract documented
- ✅ Partner section rules documented
- ✅ Discovery rules documented
- ✅ How to migrate a category later documented
- ✅ "Do not use generic styling; use these components" warning
- ✅ Next recommended pilot category documented

### Verification
- ✅ Exports complete
- ✅ README explains migration contract
- ✅ No category route changed

---

## GATE 8 — AUDIT DOC

### Files Created
- ✅ `app/lib/website-audit/CATEGORY_STANDARD_V2_EXTRACT_RENTAS_BIENES_GLOBAL_TEMPLATE_V1.md`

### Audit Contents
- ✅ Files inspected documented
- ✅ Files created documented
- ✅ Exact classes copied documented
- ✅ CTA contract copied documented
- ✅ Landing rules documented
- ✅ Results rules documented
- ✅ Locked files respected documented
- ✅ Migration NOT performed documented
- ✅ Next recommended pilot category documented

---

## GATE 9 — BUILD

### Build Status
- ⏳ Pending (will run after audit doc completion)

---

## TRUE/FALSE AUDIT

### Source Inspection
- ✅ Rentas landing shell inspected: TRUE
- ✅ Rentas hero inspected: TRUE
- ✅ Rentas search canvas inspected: TRUE
- ✅ Rentas landing sections inspected: TRUE
- ✅ Rentas results inspected: TRUE
- ✅ Bienes results cleanup rules inspected: TRUE

### File Creation
- ✅ V2 folder created: TRUE
- ✅ types.ts created: TRUE
- ✅ constants.ts created: TRUE
- ✅ page shell created: TRUE
- ✅ hero gateway created: TRUE
- ✅ search canvas created: TRUE
- ✅ CTA component created with exact classes: TRUE
- ✅ partner section created and blocks results: TRUE
- ✅ discovery grid created and blocks results: TRUE
- ✅ shortcut section created and blocks results: TRUE
- ✅ visibility strip created with results guard: TRUE
- ✅ results shell created with fixed order: TRUE
- ✅ active filters created: TRUE
- ✅ toolbar created: TRUE
- ✅ compact empty state created: TRUE
- ✅ index.ts created: TRUE
- ✅ README created: TRUE
- ✅ audit doc created: TRUE

### Visual System Extraction
- ✅ page shell: TRUE
- ✅ hero gateway: TRUE
- ✅ search canvas: TRUE
- ✅ CTA classes: TRUE
- ✅ landing discovery grid: TRUE
- ✅ shortcut/chip sections: TRUE
- ✅ partner section: TRUE
- ✅ visibility strip: TRUE
- ✅ results shell/order: TRUE
- ✅ active filters: TRUE
- ✅ toolbar: TRUE
- ✅ compact empty state: TRUE

### Hard Rules
- ✅ partner section blocks results: TRUE
- ✅ discovery grid blocks results: TRUE
- ✅ shortcut sections block results: TRUE
- ✅ results shell cannot accept landing sections: TRUE
- ✅ empty state max one CTA: TRUE
- ✅ exact primary CTA contract copied: TRUE
- ✅ exact secondary CTA contract copied: TRUE

### Preservation
- ✅ no category migrated yet: TRUE
- ✅ Rentas untouched: TRUE
- ✅ Bienes untouched: TRUE
- ✅ Ofertas untouched: TRUE
- ✅ Restaurantes untouched: TRUE
- ✅ all other categories untouched: TRUE
- ✅ admin/dashboard/auth/Supabase/Stripe untouched: TRUE

---

## FILES CREATED SUMMARY

### V2 Components
1. `app/(site)/clasificados/components/categoryStandardV2/types.ts`
2. `app/(site)/clasificados/components/categoryStandardV2/constants.ts`
3. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPageShell.tsx`
4. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryHeroGateway.tsx`
5. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`
6. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryCta.tsx`
7. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPartnerSection.tsx`
8. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryDiscoveryGrid.tsx`
9. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryShortcutSection.tsx`
10. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryVisibilityStrip.tsx`
11. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryResultsShell.tsx`
12. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryActiveFilters.tsx`
13. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryResultsToolbar.tsx`
14. `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryCompactEmptyState.tsx`
15. `app/(site)/clasificados/components/categoryStandardV2/index.ts`
16. `app/(site)/clasificados/components/categoryStandardV2/README.md`

### Audit Documentation
17. `app/lib/website-audit/CATEGORY_STANDARD_V2_EXTRACT_RENTAS_BIENES_GLOBAL_TEMPLATE_V1.md`

---

## NEXT RECOMMENDED PILOT CATEGORY

**CATEGORY-STANDARD-V2-PILOT-OFERTAS-LOCALES-V1**

This will validate the template before migrating other categories.

---

## LOCKED FILES RESPECTED

- ✅ Rentas files: NOT EDITED
- ✅ Bienes files: NOT EDITED
- ✅ Ofertas files: NOT EDITED
- ✅ Restaurantes files: NOT EDITED
- ✅ Servicios files: NOT EDITED
- ✅ Autos files: NOT EDITED
- ✅ Empleos files: NOT EDITED
- ✅ En Venta files: NOT EDITED
- ✅ Viajes files: NOT EDITED
- ✅ Negocios Locales files: NOT EDITED
- ✅ admin: NOT EDITED
- ✅ dashboard: NOT EDITED
- ✅ auth: NOT EDITED
- ✅ middleware: NOT EDITED
- ✅ Supabase migrations: NOT EDITED
- ✅ Stripe/payment: NOT EDITED
- ✅ promo-code logic: NOT EDITED
- ✅ API routes: NOT EDITED
- ✅ global nav/footer/header: NOT EDITED
- ✅ package.json: NOT EDITED
- ✅ tsconfig: NOT EDITED
- ✅ next config: NOT EDITED

---

## GATE 9 BUILD STATUS

⏳ PENDING - Will run `npm run build` after audit doc completion
