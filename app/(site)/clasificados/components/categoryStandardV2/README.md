# Category Standard V2 - Global Leonix Category UI Template

## Overview

This package provides the global reusable category landing/results UI template extracted from the exact working Rentas/Bienes visual system. It enforces visual consistency across all category pages while allowing category-specific data, fields, links, and renderers.

## Source of Truth

These components are literal extractions from the working Rentas and Bienes Raíces implementations:

**Rentas visual source:**
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts`
- `app/(site)/clasificados/rentas/results/components/RentasResultsGatewayPanel.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsActiveFilters.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsToolbar.tsx`

**Bienes Raíces proof/reference:**
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx`
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsActiveFilters.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsHeader.tsx`

## Hard Rules

### Landing Pages

**Allowed CTA locations:**
1. Search shell CTA row
2. Partner/sponsor section if approved
3. Lower visibility strip if category needs it

**Not allowed:**
- Floating publish buttons under discovery
- Repeated empty-state CTA clutter
- Random CTA rows between sections

### Results Pages

**Forbidden content:**
- Partner/sponsor section
- Landing discovery cards
- Budget chips
- Practical/feature chips
- Category shortcut pill rows
- Random CTA rows
- Repeated publish CTAs
- Landing visibility/advertise CTA unless explicitly allowed lower and approved
- Fake active filters

**Final results order:**
1. Premium top shell/search
2. Active filters if any
3. Result count + sort/view controls
4. Results/cards/items or compact empty state
5. Optional lower visibility strip only if approved

### CTA Contract

**Primary CTA:**
- `bg-[#7A1E2C]`
- `hover:bg-[#5e1721]`
- `text-[#FFFDF7]`
- `min-h-[3rem] sm:min-h-[3.125rem]`
- `rounded-xl`
- `text-sm font-bold`
- `px-5`

**Secondary CTA:**
- `border border-[#C9A84A]/60`
- `bg-[#FFFDF7]`
- `text-[#3D3428]`
- `min-h-[3rem] sm:min-h-[3.125rem]`
- `rounded-xl`
- `text-sm font-semibold`
- `px-4`

Use `LeonixCategoryCta` for all CTAs. Do not create custom button styles.

## Components

### Page Shell

`LeonixCategoryPageShell` - Global page shell with background, texture, and content lane.

**Props:**
- `surface: "landing" | "results"`
- `children: ReactNode`
- `topSlot?: ReactNode`
- `className?: string`

### Hero Gateway

`LeonixCategoryHeroGateway` - Hero section with icon, title, tagline, intro, and search slot.

**Props:**
- `lang: "es" | "en"`
- `surface: "landing" | "results"`
- `title: string`
- `tagline: string`
- `intro: string`
- `introSecondary: string`
- `searchSlot: ReactNode`
- `tilesSlot?: ReactNode` (landing only)
- `eyebrow?: string`

**Hard rule:** For results surface, only renders hero/search identity and search slot. No landing discovery sections.

### Search Canvas

`LeonixCategorySearchCanvas` - Compact search interface with grid layout.

**Props:**
- `lang: "es" | "en"`
- `surface: "landing" | "results"`
- `query, city, state, zip, country: string`
- `onQuery, onCity, onState, onZip, onCountry: (v: string) => void`
- `onSearch: () => void`
- `onOpenFilters: () => void`
- `browseAllHref?: string`
- `browseAllLabel?: string`
- `searchButtonLabel: string`
- `filtersButtonLabel: string`
- `publishHref?: string` (landing only)
- `publishLabel?: string` (landing only)
- `extraSecondRowSlot?: ReactNode`
- `showBrowseAll?: boolean`
- `showPublish?: boolean`

### CTA Button

`LeonixCategoryCta` - Enforces exact CTA contract.

**Props:**
- `variant?: "primary" | "secondary" | "ghost"`
- `href?: string`
- `onClick?: () => void`
- `type?: "button" | "submit"`
- `children: ReactNode`
- `fullWidth?: boolean`
- `className?: string`
- `disabled?: boolean`

### Partner Section

`LeonixCategoryPartnerSection` - Partner/sponsor section (landing only).

**Props:**
- `enabled: boolean`
- `lang: "es" | "en"`
- `surface: "landing" | "results"`
- `eyebrow, title, body: string`
- `supportingLine?: string`
- `chips?: string[]`
- `primaryCta?: { label: string; href: string }`
- `secondaryCta?: { label: string; href: string }`

**Hard rule:** Returns `null` if `surface === "results"`.

### Discovery Grid

`LeonixCategoryDiscoveryGrid` - Discovery card grid (landing only).

**Props:**
- `lang: "es" | "en"`
- `surface: "landing" | "results"`
- `heading, subtitle: string`
- `items: DiscoveryGridItem[]`

**Hard rule:** Returns `null` if `surface === "results"`.

### Shortcut Section

`LeonixCategoryShortcutSection` - Shortcut/chip section (landing only).

**Props:**
- `lang: "es" | "en"`
- `surface: "landing" | "results"`
- `title, subtitle: string`
- `chips: ShortcutChipItem[]`
- `variant?: "budget" | "practical" | "default"`

**Hard rule:** Returns `null` if `surface === "results"`.

### Visibility Strip

`LeonixCategoryVisibilityStrip` - Visibility/advertise strip.

**Props:**
- `lang: "es" | "en"`
- `surface: "landing" | "results"`
- `allowOnResults?: boolean` (default: false)
- `eyebrow, title, body, ctaLabel, ctaHref: string`

**Default:** Returns `null` if `surface === "results"` and `allowOnResults !== true`.

### Results Shell

`LeonixCategoryResultsShell` - Results shell with fixed order.

**Props:**
- `surface: "results"` (hard rule)
- `hero: ReactNode`
- `activeFilters?: ReactNode`
- `toolbar?: ReactNode`
- `children: ReactNode`
- `emptyState?: ReactNode`
- `pagination?: ReactNode`
- `lowerVisibility?: ReactNode`
- `hasResults: boolean`

**Hard rules:**
- Does not accept `partnerSection` prop
- Does not accept `discoveryGrid` prop
- Does not accept `shortcutSections` prop
- Does not accept `randomCtaRows` prop
- `surface` must be `"results"`

### Active Filters

`LeonixCategoryActiveFilters` - Active filter chips.

**Props:**
- `label: string`
- `chips: ActiveFilterChip[]`
- `clearAllLabel: string`
- `onClearAll: () => void`

**Hard rule:** Hides when no chips.

### Results Toolbar

`LeonixCategoryResultsToolbar` - Results toolbar with count, sort, and view controls.

**Props:**
- `lang: "es" | "en"`
- `countText: string`
- `resultCount, showingFrom, showingTo: number`
- `sortLabel, sortValue: string`
- `onSortChange: (v: string) => void`
- `sortOptions: { value: string; label: string }[]`
- `viewMode: "grid" | "list"`
- `onViewModeChange: (mode: "grid" | "list") => void`
- `filtersButtonLabel?: string`
- `onOpenFilters?: () => void`
- `perPageLabel?: string`
- `perPageValue: number`
- `onPerPageChange: (v: number) => void`
- `perPageOptions: number[]`
- `clearAllLabel?: string`
- `onClearAll?: () => void`

**Hard rule:** Does not render landing CTA buttons.

### Compact Empty State

`LeonixCategoryCompactEmptyState` - Compact empty state.

**Props:**
- `title: string`
- `body: string`
- `ctaLabel?: string`
- `ctaHref?: string`

**Hard rule:** At most one CTA allowed.

## Migration Guide

To migrate a category to use this template:

1. **Replace shell components:**
   - Replace category-specific shell with `LeonixCategoryPageShell`
   - Pass `surface="landing"` or `surface="results"`

2. **Replace hero gateway:**
   - Replace category-specific hero with `LeonixCategoryHeroGateway`
   - Pass category-specific icon, copy, and search slot

3. **Replace search canvas:**
   - Replace category-specific search with `LeonixCategorySearchCanvas`
   - Wire up category-specific field handlers

4. **Replace CTAs:**
   - Replace all CTAs with `LeonixCategoryCta`
   - Use `variant="primary"` or `variant="secondary"`

5. **Replace landing sections:**
   - Replace partner section with `LeonixCategoryPartnerSection`
   - Replace discovery grid with `LeonixCategoryDiscoveryGrid`
   - Replace shortcut sections with `LeonixCategoryShortcutSection`
   - Replace visibility strip with `LeonixCategoryVisibilityStrip`

6. **Replace results components:**
   - Replace results shell with `LeonixCategoryResultsShell`
   - Replace active filters with `LeonixCategoryActiveFilters`
   - Replace toolbar with `LeonixCategoryResultsToolbar`
   - Replace empty state with `LeonixCategoryCompactEmptyState`

7. **Verify hard rules:**
   - Results pages do not render landing-only sections
   - CTA contract is enforced
   - Empty state has at most one CTA
   - No fake filters, sponsors, or listings

## Important Notes

- **Do not use generic styling.** Use these components for category pages.
- **Do not invent new visual systems.** The Rentas/Bienes system is the source of truth.
- **Do not genericize away exact classes.** The literal classes must remain present.
- **Do not add fake data.** Only use real category-specific data.
- **Do not break working pages.** Test thoroughly after migration.

## Next Steps

After this template is created, the next recommended pilot category is:
**CATEGORY-STANDARD-V2-PILOT-OFERTAS-LOCALES-V1**

This will validate the template before migrating other categories.
