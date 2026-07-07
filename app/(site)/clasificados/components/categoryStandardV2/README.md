# Leonix Category Standard V2

Global reusable category landing/results UI template extracted from the proven Rentas/Bienes Raíces visual system.

## Purpose

This template exists to prevent visual drift across category pages. Every category can migrate into these shared components by supplying only category-specific data, fields, links, and renderers.

**This is NOT a redesign.** These components contain the exact Rentas/Bienes classes, sizes, colors, and interaction patterns.

## Source of Truth

The visual system was extracted from these working files:

### Rentas (Primary Source)
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/rentas/components/RentasFiltersDrawer.tsx`
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts`
- `app/(site)/clasificados/rentas/results/RentasResultsClient.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsGatewayPanel.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsActiveFilters.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsToolbar.tsx`

### Bienes Raíces (Proof/Reference)
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx`
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsActiveFilters.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsHeader.tsx`

## Components

### Core Components

#### `LeonixCategoryPageShell`
Page shell with background, texture, and layout.
- Landing: warm cream (#F3EBDD) with radial gradient + subtle grid
- Results: light cream (#FAF6EE) with same texture
- Centered content lane max-w-[1280px]
- Safe top spacing below global navbar

#### `LeonixCategoryHeroGateway`
Integrated hero panel with text, search, and optional tiles.
- Rounded panel with border, background, shadow, backdrop blur
- Icon wrapper with border and shadow
- Eyebrow, title, tagline, intro, introSecondary text hierarchy
- Search slot below text
- Optional tiles slot below search (landing only)
- For results surface: renders only hero/search identity

#### `LeonixCategorySearchCanvas`
Compact search interface with exact layout.
- Rounded shell with border, background, glow
- Grid layout: keyword (5), city (2), state (2), zip (1), search (2)
- Second row: country (3/4), filters (2/3), browse (3/4/5), publish (4)
- Input heights: min-h-[3rem] sm:min-h-[3.125rem]
- Button heights: match inputs

#### `LeonixCategoryCta`
Enforces the exact CTA contract.
- Primary: bg-[#7A1E2C], hover:bg-[#5e1721], text-[#FFFDF7]
- Secondary: border border-[#C9A84A]/60, bg-[#FFFDF7], text-[#3D3428]
- Landing size vs results size variants

### Landing Sections

#### `LeonixCategoryPartnerSection`
Landing-only sponsor/partner section.
- Rounded-2xl section wrapper with border, background, shadow
- Compact padding px-4 py-5 sm:px-6 sm:py-6
- Chips h-[36px] to h-[38px]
- Primary/secondary CTA using LeonixCategoryCta
- **HARD RULE: Returns null on results surface**

#### `LeonixCategoryDiscoveryGrid`
Landing-only discovery card grid.
- Grid: mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4
- Card: min-h-[4.75rem] sm:min-h-[5rem], rounded-xl, border, gradient
- Icon: h-8 w-8 sm:h-9 sm:w-9, rounded-lg
- Label: font-serif text-sm font-bold
- Hint: text-[10px] sm:text-[11px]
- **HARD RULE: Returns null on results surface**

#### `LeonixCategoryShortcutSection`
Landing-only shortcut/chip section.
- Container: mt-6 space-y-5 sm:mt-7
- Section: rounded-2xl border bg-[#FFFDF7]/96 shadow
- Budget chip: h-[38px], gold border, gradient bg
- Practical chip: h-[36px], olive border, gradient bg
- Left border accent (gold or olive)
- **HARD RULE: Returns null on results surface**

#### `LeonixCategoryVisibilityStrip`
Visibility/advertise CTA section.
- Same section wrapper as other landing sections
- Gradient overlay background
- Icon with border and shadow
- Eyebrow, title, body text hierarchy
- CTA button
- **RULE: Results only renders if allowOnResults === true**

### Results Components

#### `LeonixCategoryResultsShell`
Results page shell with background, texture, and layout.
- Light cream background (#FAF6EE) with radial gradient + subtle grid
- Centered content lane max-w-[1280px]
- Safe top spacing below global navbar
- **HARD RULES: Does NOT accept partnerSection, discoveryGrid, shortcutSections, randomCtaRows props**

#### `LeonixCategoryActiveFilters`
Displays active filter chips with clear functionality.
- Panel: rounded-xl border bg-[#FFFDF7]/90
- Chips: rounded-full border bg-white
- Label: uppercase tracking text-[#556B3E]
- Compact wrap/no overflow
- Chip min-h around 36-40px
- **RULE: Only active filters generated from URL/query state**

#### `LeonixCategoryResultsToolbar`
Displays result count, sort, view toggle, and controls.
- Container: mt-6 border-t pt-4
- Inner: rounded-xl border bg-[#FFFDF7]/90
- Count text with badge styling
- Sort select, view toggle, per page options
- Compact mobile stacking
- **RULE: Must NOT render landing CTA buttons**

#### `LeonixCategoryCompactEmptyState`
Compact empty state for results pages.
- rounded-[20px] border dashed
- bg section/card
- compact px/py
- title, body, optional single CTA max
- **HARD RULE: No multi-button CTA clutter, max one CTA**

## Visual Constants

All exact classes are exported from `constants.ts`:
- Page shell backgrounds and textures
- Gateway panel and icon styles
- Hero text hierarchy
- Search canvas inputs and buttons
- CTA button styles (primary/secondary, landing/results)
- Landing section wrappers
- Chip styles (default, budget, practical)
- Discovery grid and card styles
- Active filters panel and chip styles
- Results toolbar styles
- Empty state styles
- Visibility strip styles

**DO NOT modify these constants.** They are the source of truth for the global template.

## CTA Contract

### Allowed CTA Locations on Landing
1. Search shell CTA row
2. Partner/sponsor section if approved
3. Lower visibility strip if category needs it

### NOT Allowed
- Floating publish buttons under discovery
- Repeated empty-state CTA clutter
- Random CTA rows between sections

### Results Page CTA Rules
- Results empty state allows at most one CTA
- No landing visibility/advertise CTA unless explicitly allowed lower and approved
- No repeated publish CTAs

## Landing Rules

### Required Sections
1. Hero/search gateway
2. Optional partner/sponsor section
3. Optional discovery sections (chips or cards)
4. Optional shortcut/chip sections
5. Optional visibility strip

### Visual Standards
- Background: #F3EBDD (warm cream)
- Text: #1F241C (dark olive)
- Texture: Radial gradient + subtle grid
- Content lane: max-w-[1280px], centered
- Padding: px-3.5 pb-14 sm:px-4 lg:px-5

## Results Rules

### Required Sections (in order)
1. Hero/search shell
2. Active filters if active
3. Result count + sort/view controls
4. Cards/items/listings or compact empty state
5. Optional pagination
6. Optional lower visibility strip if explicitly allowed

### Forbidden Content
Results pages must NOT render:
- Partner/sponsor section
- Landing discovery cards
- Budget chips
- Practical/feature chips
- Category shortcut pill rows
- Random CTA rows
- Repeated publish CTAs
- Landing visibility/advertise CTA unless explicitly allowed lower and approved
- Fake active filters

### Visual Standards
- Background: #FAF6EE (light cream)
- Text: #1F241C (dark olive)
- Texture: Radial gradient + subtle grid
- Content lane: max-w-[1280px], centered
- Padding: px-3.5 pb-12 sm:px-4 lg:px-5

## Migration Guide

To migrate a category to the V2 template:

1. **Replace page shell** with `LeonixCategoryPageShell`
2. **Replace hero gateway** with `LeonixCategoryHeroGateway`
3. **Replace search canvas** with `LeonixCategorySearchCanvas`
4. **Replace CTAs** with `LeonixCategoryCta`
5. **Replace landing sections** with V2 components (Partner, Discovery, Shortcut, Visibility)
6. **Replace results shell** with `LeonixCategoryResultsShell`
7. **Replace active filters** with `LeonixCategoryActiveFilters`
8. **Replace toolbar** with `LeonixCategoryResultsToolbar`
9. **Replace empty state** with `LeonixCategoryCompactEmptyState`

### What to Supply
- Category-specific copy (titles, labels, CTAs)
- Category-specific fields (filter options, discovery chips)
- Category-specific links (browse all, publish, filter URLs)
- Category-specific renderers (listing cards, icons)

### What NOT to Change
- Visual classes (colors, sizes, spacing)
- Component structure and layout
- CTA contract and placement rules
- Surface-based hard blocks

## Locked Files

Do NOT edit these files during category migration:
- Rentas files
- Bienes files
- Ofertas files
- Restaurantes files
- Servicios files
- Autos files
- Empleos files
- En Venta files
- Viajes files
- Negocios Locales files
- Admin, dashboard, auth, middleware
- Supabase migrations
- Stripe/payment
- Promo-code logic
- API routes
- Global nav/footer/header
- package.json
- tsconfig
- Next config

## Next Steps

After this template is created, the recommended pilot category is:
**CATEGORY-STANDARD-V2-PILOT-OFERTAS-LOCALES-V1**

This will validate the template works for a category with different field requirements before broader migration.
