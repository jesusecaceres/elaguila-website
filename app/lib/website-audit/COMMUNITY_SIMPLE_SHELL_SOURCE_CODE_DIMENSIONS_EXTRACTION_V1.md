# COMMUNITY-SIMPLE-SHELL-SOURCE-CODE-DIMENSIONS-EXTRACTION-V1

**Project:** Leonix Media / elaguila-website  
**Mode:** Audit / extraction only — no code changes  
**Date:** 2026-07-09  
**Scope:** Clases, Comunidad, Busco, Mascotas y Perdidos landing shells (source family for results polish)

---

## 1. Executive summary

All four target landing routes now share a **unified Category Standard V2 shell**: `LeonixCategoryPageShell` → content lane padding wrapper → `LeonixCategoryHeroGateway` with embedded `LeonixCategorySearchCanvas`. This is the **live render tree** checked into the repo at audit time.

**Important repo-state note:** A prior cleanup batch removed quick-filter pill sections and recent-listing preview blocks from the live `page.tsx` files. Those sections are **no longer mounted** on the four URLs. However, the **dimension tokens and orphan components** for quick filters (`LeonixCategoryShortcutSection`) and recent previews (`*LandingRecentListings.tsx`, `CategoryRecentListings.tsx`) still exist on disk and are documented below because they encode the visual recipe the owner described (and may still appear in screenshots / prior QA).

**Results pages today use a different shell family:**
- **Clases / Comunidad:** `CategoryStandardResultsPageShell` + `CommunityListingsResultsClient` (community module).
- **Busco / Mascotas:** `CategoryStandardResultsPageShell` (`max-w-3xl`) + category-local `*ShellLayout` + `*ResultsClient`.

The next results implementation should **lift the V2 landing lane + hero/search DNA** (`categoryStandardV2/constants.ts`) onto results via `LeonixCategoryPageShell surface="results"` + `LeonixCategoryHeroGateway surface="results"` + `LeonixCategorySearchCanvas surface="results"` + `LeonixCategoryResultsShell` ordering — without re-adding landing-only sections.

**Best single template category:** **Busco** (see §7).

---

## 2. Source category pages inspected

| Category | ES URL | EN URL | Route file |
|----------|--------|--------|------------|
| Comunidad | `/clasificados/comunidad?lang=es` | `/clasificados/comunidad?lang=en` | `app/(site)/clasificados/comunidad/page.tsx` |
| Busco | `/clasificados/busco?lang=es` | `/clasificados/busco?lang=en` | `app/(site)/clasificados/busco/page.tsx` |
| Mascotas y Perdidos | `/clasificados/mascotas-y-perdidos?lang=es` | `/clasificados/mascotas-y-perdidos?lang=en` | `app/(site)/clasificados/mascotas-y-perdidos/page.tsx` |
| Clases | `/clasificados/clases?lang=es` | `/clasificados/clases?lang=en` | `app/(site)/clasificados/clases/page.tsx` |

Canonical results URLs (both segments exist as re-exports):
- `/clasificados/{slug}/results?lang=…`
- `/clasificados/{slug}/resultados?lang=…`

---

## 3. Exact file ownership map

### 3.1 Comunidad

| Role | File | Notes |
|------|------|-------|
| Landing route | `comunidad/page.tsx` | `"use client"` default export wrapped in `Suspense` |
| Results route (canonical) | `comunidad/resultados/page.tsx` | Server component → `CommunityListingsResultsClient` |
| Results alias | `comunidad/results/page.tsx` | Re-export of resultados |
| Primary landing component | `ComunidadLandingPageInner` (inline in `page.tsx`) | — |
| V2 shell imports | `@/app/(site)/clasificados/components/categoryStandardV2` | `LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, `LeonixCategorySearchCanvas` |
| URL helpers | `comunidad/shared/utils/comunidadListaUrl.ts` | `buildComunidadListaUrl` → `buildCategoryResultsUrl("comunidad", …)` |
| Lang helpers | `@/app/clasificados/lib/hubUrl` | `resolveRouteLang`, `resolveHubCopyLang`, `appendLangToPath` |
| Publish href | `appendLangToPath("/clasificados/publicar/comunidad", routeLang)` | — |
| Orphan recent block | `comunidad/ComunidadLandingRecentListings.tsx` | **Not imported** by live landing |
| Orphan shared recent | `components/categoryLanding/CategoryRecentListings.tsx` | Clases/comunidad legacy; **not imported** by live landings |
| Results client | `community/CommunityListingsResultsClient.tsx` | Outside category dir; shared with Clases |

### 3.2 Busco

| Role | File | Notes |
|------|------|-------|
| Landing route | `busco/page.tsx` | `"use client"` |
| Results route | `busco/resultados/page.tsx` → `BuscoResultsClient.tsx` | Alias: `busco/results/page.tsx` |
| Primary landing component | `BuscoLandingPageInner` (inline) | — |
| Product copy config | `busco/shared/buscoShellCopy.ts` | `BUSCO_PRODUCT`, lang/path helpers |
| Results URL | `buildCategoryResultsUrl("busco", routeLang)` | From `categoryStandardRoutes.ts` |
| Publish href | `buscoPathWithLang("/publicar/busco/quick", routeLang)` | — |
| Orphan recent block | `busco/BuscoLandingRecentListings.tsx` | **Not imported** |
| Results shell | `busco/shared/BuscoShellLayout.tsx` | Breadcrumb + `CategoryStandardResultsPageShell max-w-3xl` |
| Listing card | `busco/BuscoRequestCard.tsx` | Results + orphan recent preview |

### 3.3 Mascotas y Perdidos

| Role | File | Notes |
|------|------|-------|
| Landing route | `mascotas-y-perdidos/page.tsx` | `"use client"` |
| Results route | `mascotas-y-perdidos/resultados/page.tsx` → `MascotasPerdidosResultsClient.tsx` | Alias: `results/page.tsx` |
| Shell copy | `mascotas-y-perdidos/shared/mascotasPerdidosShellCopy.ts` | Lang helpers |
| Publish URL | `mascotas-y-perdidos/shared/mascotasPerdidosBrowseUrls.ts` | `mascotasPerdidosPublishEntryUrl` |
| Orphan recent block | `mascotas-y-perdidos/MascotasPerdidosLandingRecentListings.tsx` | **Not imported** |
| Results shell | `mascotas-y-perdidos/shared/MascotasPerdidosShellLayout.tsx` | Same pattern as Busco |
| Listing card | `mascotas-y-perdidos/MascotasPerdidosNoticeCard.tsx` | — |

### 3.4 Clases

| Role | File | Notes |
|------|------|-------|
| Landing route | `clases/page.tsx` | `"use client"` |
| Results route | `clases/resultados/page.tsx` → `CommunityListingsResultsClient category="clases"` | Alias: `results/page.tsx` |
| URL helper | `clases/shared/utils/clasesListaUrl.ts` | `buildClasesListaUrl` → `buildCategoryResultsUrl("clases", …)` |
| Taxonomy (reference) | `clases/shared/fields/clasesTaxonomy.ts` | Quick-filter chip source data (not mounted on live landing) |

### 3.5 Shared V2 package (all four landings)

| File | Purpose |
|------|---------|
| `components/categoryStandardV2/LeonixCategoryPageShell.tsx` | Page bg, texture, content lane |
| `components/categoryStandardV2/LeonixCategoryHeroGateway.tsx` | Hero card, icon, copy, search slot |
| `components/categoryStandardV2/LeonixCategorySearchCanvas.tsx` | 12-col search grid |
| `components/categoryStandardV2/constants.ts` | **Authoritative Tailwind tokens** |
| `components/categoryStandardV2/LeonixCategoryShortcutSection.tsx` | Quick-filter card (landing-only; hard null on results) |
| `components/categoryStandardV2/LeonixCategoryResultsShell.tsx` | Results section order enforcer |
| `components/categoryStandardV2/LeonixCategoryCompactEmptyState.tsx` | Results empty state (≤1 CTA) |
| `components/categoryStandard/categoryStandardRoutes.ts` | `buildCategoryResultsUrl`, publish paths |
| `components/categoryStandard/categoryStandardTheme.ts` | `CATEGORY_STANDARD_COPY.quickFilters*` per category |

---

## 4. Component render trees

### 4.1 Live landing tree (all four — identical structure)

```
Page (default export)
└── Suspense fallback={null}
    └── *LandingPageInner
        └── LeonixCategoryPageShell { surface: "landing" }
            └── div.px-3.5.pb-8.sm:px-5.lg:px-6
                └── LeonixCategoryHeroGateway { surface: "landing", searchSlot }
                    ├── [icon span] LEONIX_GATEWAY_ICON + 24×24 SVG placeholder
                    ├── eyebrow → LEONIX_EYEBROW
                    ├── h1 title → LEONIX_H1
                    ├── tagline → LEONIX_TAGLINE
                    ├── intro → LEONIX_INTRO
                    ├── introSecondary → LEONIX_INTRO_SECONDARY
                    └── searchSlot
                        └── LeonixCategorySearchCanvas { surface: "landing" }
                            ├── row1: q(5) | city(2) | state(2) | zip(1) | search btn(2, sm+)
                            └── row2: country(3) | filters(2) | browseAll(3) | publish(4)
                            └── mobile: stacked search + publish buttons
```

**Not rendered on live landings (orphan / legacy):**
- `LeonixCategoryShortcutSection` (quick filters)
- `ComunidadLandingRecentListings` / `BuscoLandingRecentListings` / `MascotasPerdidosLandingRecentListings` / `CategoryRecentListings`

### 4.2 Legacy landing extension tree (pre-cleanup pattern — still in repo)

```
… same hero shell as §4.1 …
└── LeonixCategoryShortcutSection { surface: "landing" }
    └── LEONIX_SHORTCUT_SECTIONS (mt-6 space-y-5)
        └── LEONIX_LANDING_SECTION card
            └── chips in LEONIX_SHORTCUT_ROW (horizontal scroll mobile, wrap desktop)
└── *LandingRecentListings (category-local or CategoryRecentListings)
    └── LEONIX_LANDING_SECTION or legacy clases border variant
        └── h2 + optional "Ver todos" link
        └── ul grid of listing cards (limit 4)
```

### 4.3 Current results trees (for adaptation reference)

**Clases / Comunidad:**
```
resultados/page.tsx (server)
└── Suspense
    └── CommunityListingsResultsClient
        └── CategoryStandardResultsPageShell (max-w-[1080px], bg #FAF6EE)
            ├── CategoryStandardResultsHeader (back, title, count, publish, clear)
            ├── CAT_STD_RESULTS_REFINE_PANEL + CommunityResultsSearchPanel
            └── cards grid OR compact empty <p>
```

**Busco / Mascotas:**
```
resultados/page.tsx
└── Suspense
    └── BuscoResultsClient | MascotasPerdidosResultsClient
        └── BuscoShellLayout | MascotasPerdidosShellLayout
            └── CategoryStandardResultsPageShell max-w-3xl
                ├── breadcrumb nav + back link + h1
                ├── subtitle <p>
                ├── CAT_STD_RESULTS_REFINE_PANEL + *ResultsSearchPanel
                ├── count line
                └── card list OR compact empty <p>
```

---

## 5. Exact dimensions / classes / layout tokens

Source of truth: `components/categoryStandardV2/constants.ts` unless noted.

### A. Page background (`LeonixCategoryPageShell` landing)

| Token | Value |
|-------|-------|
| Root wrapper | `relative min-h-screen overflow-x-hidden` |
| Background | `LEONIX_LANDING_BG` → `bg-[#F3EBDD] text-[#1F241C]` |
| Radial texture | `LEONIX_TEXTURE_RADIAL` — triple radial gradient (gold/olive/burgundy) |
| Grid texture | `LEONIX_TEXTURE_GRID` → `opacity-[0.045]` + inline repeating 52px grid `#2A4536` |
| Header safe top | `LEONIX_HEADER_SAFE_TOP` → `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14` (applied on lane via shell) |
| z-index | Content `relative z-[1]` above textures |

**Results shell contrast (for migration target):**
- `LEONIX_RESULTS_PAGE_BG` → `min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]`
- `LEONIX_RESULTS_SHELL` → `relative mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-12 sm:px-4 lg:px-5`

**Legacy CAT-STD-1 results (current Busco/Mascotas/Community):**
- `CATEGORY_STANDARD_PAGE_BG` → `bg-[#FAF6EE] pb-12`
- `CATEGORY_STANDARD_MAIN` → `max-w-[1080px] px-3.5 pb-8 pt-[calc(3.25rem+…)] sm:px-4 sm:pt-8 lg:px-5 lg:pt-9`
- Busco/Mascotas override: `max-w-3xl` on results shell

### B. Outer content lane (landing)

| Token | Value |
|-------|-------|
| Lane | `LEONIX_LANDING_LANE` → `mx-auto w-full min-w-0 max-w-[1280px]` |
| Page inner padding (all 4 landings) | `px-3.5 pb-8 sm:px-5 lg:px-6` on child of shell |
| Centering | `mx-auto` on lane |
| Bottom | `pb-8` — compact end (no fill-space hero) |

### C. Hero card (`LeonixCategoryHeroGateway`)

| Element | Classes |
|---------|---------|
| Panel | `LEONIX_GATEWAY_PANEL` → `relative w-full overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:rounded-2xl` |
| Padding | `LEONIX_GATEWAY_PAD` → `px-4 py-6 sm:px-7 sm:py-7` |
| Icon row layout | `flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5` |
| Icon box | `LEONIX_GATEWAY_ICON` → `h-14 w-14 rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[…]` |
| Icon inner | `h-6 w-6` SVG (placeholder house) |
| Eyebrow | `LEONIX_EYEBROW` → `text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]` |
| H1 | `LEONIX_H1` → `mt-2 font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]` |
| Tagline | `LEONIX_TAGLINE` → `mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl` |
| Intro | `LEONIX_INTRO` → `mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base` |
| Intro secondary | `LEONIX_INTRO_SECONDARY` → `mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]` |
| Search slot offset | `LEONIX_SEARCH_SLOT` → `relative mt-5 min-w-0 sm:mt-6` |

### D. Search shell (`LeonixCategorySearchCanvas` landing)

| Element | Classes / behavior |
|---------|-------------------|
| Shell (inside hero) | `LEONIX_HERO_SEARCH_SHELL` → `rounded-xl bg-white/96 p-3.5 ring-1 ring-[#C9A84A]/30 shadow-[inset…] sm:p-4 sm:rounded-2xl` |
| Glow | `LEONIX_HERO_SEARCH_GLOW` → radial gold gradient `-inset-px` |
| Grid | `grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-12 sm:items-stretch` |
| Row 1 cols | keyword `sm:col-span-5`, city `2`, state `2`, zip `1`, search btn `2` (hidden on mobile) |
| Row 2 cols (with publish) | country `3`, filters `2`, browseAll `3`, publish `4` |
| Field | `LEONIX_SEARCH_FIELD_LANDING` → `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl border border-[#D6C7AD]/75 bg-white` |
| Input | `LEONIX_SEARCH_INPUT_LANDING` → `text-[0.9375rem] sm:text-base`, `px-3 py-2.5` |
| Primary btn | `LEONIX_BTN_PRIMARY_LANDING` → `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold` |
| Secondary btn | `LEONIX_BTN_SECONDARY_LANDING` → `min-h-[3rem] rounded-xl border border-[#C9A84A]/60` |
| Mobile | Full-width search + publish stacked (`sm:hidden` / `w-full sm:hidden`) |
| Search icon | 18×18, `pl-3.5`, color `#556B3E` |

**Results surface deltas** (`surface="results"` on same component):
- `browseAll` hidden → refine hint `text-xs text-[#5C5346]` in browse column
- `publish` column omitted (`hasPrimarySlot` false)
- country/filters/browse cols widen to `sm:col-span-4` each

### E. Section cards below hero

#### Quick filters (`LeonixCategoryShortcutSection` — legacy, not live)

| Element | Classes |
|---------|---------|
| Wrapper | `LEONIX_SHORTCUT_SECTIONS` → `mt-6 space-y-5 sm:mt-7` |
| Card | `LEONIX_LANDING_SECTION` → `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]` |
| Inner pad | `LEONIX_LANDING_SECTION_PAD` → `px-4 py-5 sm:px-6 sm:py-6` + `border-l-[3px]` accent |
| Heading | `LEONIX_SHORTCUT_HEADING` → `font-serif text-base font-bold text-[#2A4536] sm:text-lg` |
| Subtitle | `LEONIX_SHORTCUT_SUBTITLE` → `mt-1 text-xs text-[#5C5346]/85` |
| Chip row | `LEONIX_SHORTCUT_ROW` → horizontal scroll snap mobile, wrap desktop, gap-2 / sm:gap-2.5 |
| Default chip | `LEONIX_BUDGET_CHIP` → `h-[38px] rounded-lg border border-[#C9A84A]/55 px-4 text-xs font-bold` |
| Practical chip | `LEONIX_PRACTICAL_CHIP` → `h-[36px] border-[#556B3E]/30` |
| Chip config source | `categoryStandardQuickFilters(slug, lang)` from `categoryStandardTheme.ts` |

#### Recent listing block (orphan components)

| Variant | Section wrapper | Inner pad | Grid |
|---------|-----------------|-----------|------|
| Busco/Mascotas/Comunidad local | `LEONIX_LANDING_SECTION` | `px-4 py-4 sm:px-5 sm:py-5` | `mt-3 grid gap-3` (comunidad: `sm:grid-cols-2`) |
| Clases legacy (`CategoryRecentListings`) | `rounded-2xl border border-[#C9B46A]/22 bg-[#FFFCF7]/98 … ring-1` | `px-4 py-4 sm:px-5` | `mt-3 grid gap-3 sm:grid-cols-2` |
| Section title | `font-serif text-base font-bold text-[#2A4536] sm:text-lg` (local) OR uppercase `text-xs tracking-[0.14em]` (clases legacy) |
| Preview limit | 4 listings |
| Empty note | `max-w-lg text-sm leading-relaxed text-[#5C564E]` centered on mobile |

#### Listing card dimensions (preview + results)

| Card | Key dimensions |
|------|----------------|
| `BuscoRequestCard` | `rounded-2xl border border-[#B8C8EA]/40`; image `aspect-[16/10]` mobile, `sm:w-[min(44%,220px)] sm:min-h-[180px]` |
| `MascotasPerdidosNoticeCard` | Same family as Busco (shared layout pattern) |
| `CommunityDiscoveryListingCard` | `border-[#C9B46A]/35`; image `sm:min-h-[200px]`, `sm:w-[min(44%,220px)]` |
| Results grid (community) | `grid gap-5 sm:grid-cols-1 lg:grid-cols-2` |
| Results grid (busco/mascotas) | `grid gap-4` single column |

#### Compact empty (results target)

| Pattern | Classes |
|---------|---------|
| Current busco/mascotas (post-cleanup) | `rounded-xl border border-[#D6C7AD]/60 bg-[#FFFCF7]/95 px-4 py-5 text-sm text-[#5C5346]` — **no CTA button** |
| Community results | `rounded-xl border border-black/10 bg-white/90 px-4 py-6 text-sm text-[#5C564E]` |
| V2 empty component | `LEONIX_COMPACT_EMPTY_STATE` — dashed border, centered; allows ≤1 CTA via `LEONIX_EMPTY_CTA` |

### F. Footer transition

| Surface | Behavior |
|---------|----------|
| Landing | `pb-8` on inner lane — content ends compactly below hero; no visibility strip, no partner section |
| V2 shell | No min-height fill below hero on current live pages |
| Global site footer | Provided by `(site)/layout` — category pages do not add extra bottom marketing blocks |

### G. Mobile behavior summary

- Hero icon + copy stack vertically until `sm:` row layout.
- Search row 1 stacks single column; search button moves to bottom row on mobile.
- Publish CTA duplicates at bottom on mobile (`w-full sm:hidden`).
- Quick-filter chips (legacy): horizontal snap scroll `flex-nowrap overflow-x-auto` → `sm:flex-wrap`.
- Recent cards: single column → `sm:grid-cols-2` for community/clases variants.

---

## 6. Exact section order

### Live landing (current)
1. Global navbar (site layout)
2. Page shell + textures
3. Content lane (`max-w-[1280px]`)
4. Hero gateway card (icon, eyebrow, title, tagline, intro, introSecondary)
5. Embedded search canvas (2-row grid + mobile CTAs)
6. — end — (`pb-8`)

### Legacy landing (documented for visual reference)
1–5 same as above  
6. Quick filters shortcut section (`LeonixCategoryShortcutSection`)  
7. Recent listings preview section (`*LandingRecentListings`)  
8. — end —

### Target results order (V2 `LeonixCategoryResultsShell`)
1. Hero/search shell (`LeonixCategoryHeroGateway surface="results"` + `LeonixCategorySearchCanvas surface="results"`)
2. Active filters (`LeonixCategoryActiveFilters`) if any
3. Toolbar (count / sort / view — `LeonixCategoryResultsToolbar`)
4. Listing cards OR `LeonixCategoryCompactEmptyState`
5. Pagination (if supported)
6. Lower visibility strip **only** if `allowResultsVisibilityStrip === true` (default false — **not for simple categories**)

---

## 7. Best source category recommendation

### Pick: **Busco**

**Why Busco over the other three:**

| Criterion | Busco | Mascotas | Comunidad | Clases |
|-----------|-------|----------|-----------|--------|
| Cleanest live `page.tsx` | ✓ minimal COPY inline | ✓ similar | ✓ similar | ✓ similar |
| Category-local config | ✓ `buscoShellCopy.ts` (helper + not-dating note pattern) | shell copy only | hubUrl only | hubUrl only |
| Results URL wiring | ✓ `buildCategoryResultsUrl` | ✓ same | lista url helper | lista url helper |
| Shared-module coupling | **Low** — results fully local | Low | **High** — `CommunityListingsResultsClient` | **High** — same community client |
| Quick-filter / taxonomy risk | Isolated copy | Isolated | Event expiration logic in results | Class taxonomy filters |
| Closest to desired results layout | ✓ narrow lane + single-column cards already | ✓ tied | Wider 2-col discovery grid | Wider 2-col discovery grid |
| Easiest adapt without touching landing | ✓ swap `BuscoShellLayout` innards to V2 results shell | ✓ similar effort | Requires community module edit or fork | Requires community module edit or fork |

Busco and Mascotas are visually equivalent on landing; Busco wins on **lowest shared blast radius** and clearest **introSecondary / product-note** pattern for results hero copy.

---

## 8. Source snippets for next prompt

### 8.1 Live landing page render tree (Busco — representative)

```tsx
// app/(site)/clasificados/busco/page.tsx (structure shared by all four)
return (
  <LeonixCategoryPageShell surface="landing">
    <div className="px-3.5 pb-8 sm:px-5 lg:px-6">
      <LeonixCategoryHeroGateway
        lang={lang}
        surface="landing"
        title={…}
        tagline={t.tagline}
        intro={…}
        introSecondary={introSecondary}
        searchSlot={
          <LeonixCategorySearchCanvas
            surface="landing"
            browseAllHref={resultsHref}
            publishHref={postHref}
            …
          />
        }
        eyebrow={t.eyebrow}
      />
    </div>
  </LeonixCategoryPageShell>
);
```

### 8.2 Page shell usage

```tsx
// LeonixCategoryPageShell.tsx
<div className={`relative min-h-screen overflow-x-hidden ${LEONIX_LANDING_BG}`}>
  {/* radial + 52px grid textures */}
  <div className={`${LEONIX_LANDING_LANE} ${LEONIX_HEADER_SAFE_TOP}`}>
    {children}
  </div>
</div>
```

### 8.3 COPY object shape (inline per page)

```ts
const COPY = {
  es: { eyebrow, ctaPost, ctaView, tagline, intro?, helper? },
  en: { … },
} as const;
```

Busco additionally composes `introSecondary` from `BUSCO_PRODUCT.helper` + `BUSCO_PRODUCT.notDatingNote`.

### 8.4 Quick filters section (legacy — `LeonixCategoryShortcutSection`)

```tsx
<LeonixCategoryShortcutSection
  lang={lang}
  surface="landing"
  title={lang === "es" ? "Filtros rápidos" : "Quick filters"}
  subtitle={…}
  chips={chips.map(label => ({ id, label, href: buildCategoryResultsUrl(slug, lang, { q: label }) }))}
  variant="practical" // or "budget"
/>
```

Chips use `LEONIX_BUDGET_CHIP` / `LEONIX_PRACTICAL_CHIP`; labels from `categoryStandardQuickFilters("busco", lang)` etc.

### 8.5 Recent listing block (legacy — Busco)

```tsx
<section className={LEONIX_LANDING_SECTION}>
  <div className="px-4 py-4 sm:px-5 sm:py-5">
    <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
    <ul className="mt-3 grid gap-3">
      {rows.map(r => <li><BuscoRequestCard … /></li>)}
    </ul>
  </div>
</section>
```

### 8.6 Results shell target (`LeonixCategoryResultsShell`)

```tsx
<LeonixCategoryPageShell surface="results">
  <LeonixCategoryResultsShell
    surface="results"
    hero={<LeonixCategoryHeroGateway surface="results" searchSlot={<LeonixCategorySearchCanvas surface="results" … />} />}
    activeFilters={…}
    toolbar={…}
    hasResults={filtered.length > 0}
    emptyState={<LeonixCategoryCompactEmptyState title body />}
  >
    {/* listing cards */}
  </LeonixCategoryResultsShell>
</LeonixCategoryPageShell>
```

---

## 9. Results-page adaptation rules (no code)

### Keep from landing V2 DNA
- `LEONIX_RESULTS_PAGE_BG` + texture layers OR equivalent cream `#FAF6EE` with V2 lane `max-w-[1280px]`
- Centered premium lane — prefer `LEONIX_RESULTS_SHELL` padding over legacy `CATEGORY_STANDARD_MAIN` unless narrow category needs `max-w-3xl` inner section only
- `LeonixCategoryHeroGateway surface="results"` — title + search only; **no** tagline marketing expansion required but intro may shorten to one line
- `LeonixCategorySearchCanvas surface="results"` — same grid; no publish column; browseAll becomes refine hint
- `LEONIX_RESULTS_REFINE_PANEL` / `CAT_STD_RESULTS_REFINE_PANEL` for secondary filter forms (drawer/panel content stays category-local)
- Real listing cards (`BuscoRequestCard`, `MascotasPerdidosNoticeCard`, `CommunityDiscoveryListingCard`) — do not swap to discovery grid tiles
- Compact empty — text-only preferred for simple categories (match post-cleanup busco/mascotas pattern); avoid dashed mega-blocks with publish CTA

### Do NOT add on results
- `LeonixCategoryShortcutSection` (hard-null on results anyway)
- `*LandingRecentListings` / landing preview grids
- `LeonixCategoryVisibilityStrip` (unless explicit opt-in — **off** for these four)
- `LeonixCategoryPartnerSection`, `LeonixCategoryDiscoveryGrid`
- Duplicate publish CTAs (header may keep **one** publish link — community client already does this)
- Sponsor / partner / value strips
- Fake counts or placeholder listings

### Per-category migration notes

| Category | Current results owner | Suggested approach |
|----------|----------------------|-------------------|
| Busco | `BuscoResultsClient` + `BuscoShellLayout` | Replace shell with `LeonixCategoryPageShell surface="results"`; hero gateway + search canvas wired to URL params; keep `BuscoResultsSearchPanel` inside refine panel |
| Mascotas | `MascotasPerdidosResultsClient` | Same as Busco |
| Comunidad | `CommunityListingsResultsClient` | Either extend community client with V2 shell props OR add thin wrapper in `comunidad/` that composes V2 shell (avoid editing unrelated categories) |
| Clases | Same community client | Same as Comunidad with `category="clases"` |

### Param / route preservation
- Keep `lang` query via `appendLangToPath` / `buildCategoryResultsUrl`
- Preserve canonical `/results` and `/resultados` aliases
- Do not break `CommunityResultsSearchPanel`, `BuscoResultsSearchPanel`, `MascotasResultsSearchPanel` filter field names

---

## 10. Locked files warning

**Do not edit in the results implementation prompt unless explicitly scoped:**
- All four landing `page.tsx` files (this extraction is read-only for landings)
- `app/(site)/publicar/**`
- `admin/**`, `dashboard/**`, `auth/**`, `supabase/**`, `stripe/**`
- Non-target categories: autos, dealers, bienes, rentas, empleos, en-venta, servicios, restaurantes, ofertas, viajes
- Global redesign outside `categoryStandardV2` consumption

**Editable with care for results-only work:**
- `busco/BuscoResultsClient.tsx`, `busco/shared/BuscoShellLayout.tsx`
- `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx`, `…/MascotasPerdidosShellLayout.tsx`
- `clases/resultados/page.tsx`, `comunidad/resultados/page.tsx` (thin route wrappers)
- `components/categoryStandardV2/**` only if blast radius is results-only and matches Rentas/Bienes precedent
- `community/CommunityListingsResultsClient.tsx` — shared by Clases + Comunidad; treat as coupled change

---

## 11. TRUE/FALSE final audit

| Check | Result |
|-------|--------|
| All four landing route files inspected | TRUE |
| V2 shell component chain traced to `constants.ts` | TRUE |
| Legacy quick-filter dimensions extracted (`LeonixCategoryShortcutSection`) | TRUE |
| Legacy recent-listing dimensions extracted (orphan files) | TRUE |
| Live landing mount state documented (hero-only, no quick/recent) | TRUE |
| Current results ownership documented per category | TRUE |
| Best source category chosen with rationale | TRUE |
| Results adaptation rules written (no code) | TRUE |
| Only audit doc created; no other files modified | TRUE |
| npm run build run | FALSE (not required — audit only) |

---

*End of COMMUNITY-SIMPLE-SHELL-SOURCE-CODE-DIMENSIONS-EXTRACTION-V1*
