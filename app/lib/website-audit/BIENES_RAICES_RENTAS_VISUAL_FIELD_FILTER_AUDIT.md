# Bienes Raíces — Rentas Visual System + Field Filter Audit

**Task:** Replicate Rentas landing visual system for Bienes Raíces using real Bienes application fields.

**Date:** 2026-07-06
**Status:** ✅ COMPLETE

---

## Rentas Visual System Extracted

### Shell Classes
- Background: `bg-[#F3EBDD] text-[#1F241C]`
- Radial gradient: `bg-[radial-gradient(ellipse_110%_75%_at_50%_-8%,rgba(201,168,74,0.22),transparent_52%),radial-gradient(ellipse_65%_45%_at_100%_0%,rgba(85,107,62,0.1),transparent_48%),radial-gradient(ellipse_60%_40%_at_0%_25%,rgba(122,30,44,0.06),transparent_42%)]`
- Grid texture: `repeating-linear-gradient(90deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px),repeating-linear-gradient(0deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px)`
- Lane: `max-w-[1280px] px-3.5 pb-14 sm:px-5 lg:px-6`
- Header safe top: `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14`

### Gateway Panel Classes
- Panel: `rounded-xl sm:rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px]`
- Padding: `px-4 py-6 sm:px-7 sm:py-7`
- Icon wrapper: `h-14 w-14 rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90`
- Title: `font-serif text-[2.1rem] sm:text-[2.5rem] lg:text-[2.65rem]`
- Tagline: `font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl`

### Search Shell Classes
- Shared anchor: `rounded-xl bg-white/96 ring-[#C9A84A]/30 p-3.5 sm:p-4`
- Search field: `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl border-[#D6C7AD]/75 bg-white`
- Primary button: `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl bg-[#7A1E2C] px-5 text-[#FFFDF7] font-bold hover:bg-[#5e1721]`
- Secondary button: `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-[#3D3428] font-semibold`

### Search Grid Spans
- Desktop grid: `grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3`
- Keyword: `sm:col-span-5`
- City: `sm:col-span-2`
- State: `sm:col-span-2`
- ZIP: `sm:col-span-1`
- Search button: `sm:col-span-2`
- Country (row 2): `sm:col-span-3`
- Filters: `sm:col-span-2`
- Browse all: `sm:col-span-3`
- Publish: `sm:col-span-4`

### Intent Card Classes
- Grid: `mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4`
- Card: `min-h-[4.75rem] sm:min-h-[5rem] rounded-xl border bg-gradient-to-br p-3`
- Icon: `h-8 w-8 sm:h-9 sm:w-9 rounded-lg`
- Label: `font-serif text-sm font-bold`
- Hint: `text-[10px] sm:text-[11px]`

### Chip Classes
- Budget chip: `h-[38px] rounded-lg border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#FBF7EF] px-4 text-xs font-bold`
- Practical chip: `h-[36px] rounded-lg border-[#556B3E]/30 bg-gradient-to-b from-[#F8FAF6] to-[#FFFDF7] px-4 text-xs font-semibold`

### Section Classes
- Section: `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]`
- Section padding: `px-4 py-5 sm:px-6 sm:py-6`
- Section spacing: `mt-6 space-y-5 sm:mt-7`

---

## Bienes Field Mapping

### Landing Intent Cards → Query Params

| Card Label | Hint | Query Param | Application Field | Status |
|------------|------|-------------|-------------------|--------|
| Casas | Residencial | `propertyType=residencial` | `categoriaPropiedad` / `tipoPropiedad` | ✅ READY |
| Departamentos | Apartamentos y unidades | `propertyType=departamento` | `tipoPropiedad` / `residencial.tipoCodigo` | ✅ READY |
| Venta | Propiedades en venta | `operationType=venta` | `publicationType` (residencial_venta) | ✅ READY |
| Renta | Propiedades en renta | `operationType=renta` | `publicationType` (residencial_renta) | ✅ READY |
| Comerciales | Locales, oficinas y negocios | `propertyType=comercial` | `categoriaPropiedad` / `publicationType` (comercial) | ✅ READY |
| Terrenos | Lotes y oportunidades | `propertyType=terreno` | `categoriaPropiedad` / `publicationType` (terreno) | ✅ READY |
| Proyecto nuevo | Construcción y desarrollo | `propertyType=proyecto_nuevo` | `publicationType` (proyecto_nuevo) | ✅ READY |
| Multifamiliar | Inversión | `propertyType=multifamiliar` | `publicationType` (multifamiliar_inversion) | ✅ READY |

### Budget Chips → Query Params

| Chip Label | Query Param | Application Field | Status |
|------------|-------------|-------------------|--------|
| Hasta $500k | `priceMax=500000` | `precio` | ✅ READY |
| $500k–$800k | `priceMin=500000&priceMax=800000` | `precio` | ✅ READY |
| $800k–$1.2M | `priceMin=800000&priceMax=1200000` | `precio` | ✅ READY |
| $1.2M+ | `priceMin=1200000` | `precio` | ✅ READY |
| Rentas hasta $2,500 | `operationType=renta&priceMax=2500` | `precio` + `publicationType` | ✅ READY |
| Rentas $2,500+ | `operationType=renta&priceMin=2500` | `precio` + `publicationType` | ✅ READY |

### Practical Chips → Query Params

| Chip Label | Query Param | Application Field | Status |
|------------|-------------|-------------------|--------|
| 2+ recámaras | `beds=2` | `recamaras` / `residencial.recamaras` | ✅ READY |
| 3+ recámaras | `beds=3` | `recamaras` / `residencial.recamaras` | ✅ READY |
| 2+ baños | `baths=2` | `banosCompletos` / `residencial.banos` | ✅ READY |
| Aceptan mascotas | `pets=true` | `petsAllowed` (Leonix:pets_allowed) | ✅ READY |
| Amueblado | `furnished=true` | `amueblado` | ✅ READY |
| Con piscina | `pool=true` | `highlightPresets.piscina` / Leonix:pool | ✅ READY |
| Comercial | `propertyType=comercial` | `categoriaPropiedad` / `publicationType` | ✅ READY |
| Terreno / lote | `propertyType=terreno` | `categoriaPropiedad` / `publicationType` | ✅ READY |

### Drawer Fields → Query Params

| Section | Field | Query Param | Application Field | Status |
|---------|-------|-------------|-------------------|--------|
| ¿Qué buscas? | Búsqueda | `q` | `titulo` / `direccion` | ✅ READY |
| ¿Qué buscas? | Operación | `operationType` | `publicationType` | ✅ READY |
| ¿Qué buscas? | Tipo | `propertyType` | `categoriaPropiedad` / `tipoPropiedad` | ✅ READY |
| ¿Dónde? | Ciudad | `city` | `ciudad` | ✅ READY |
| ¿Dónde? | Estado | `state` | `estado` / `gate12d.estado` | ✅ READY |
| ¿Dónde? | ZIP | `zip` | `codigoPostal` / `gate12d.codigoPostal` | ✅ READY |
| ¿Dónde? | País | `country` | `pais` | ✅ READY |
| ¿Presupuesto? | Precio mín | `priceMin` | `precio` | ✅ READY |
| ¿Presupuesto? | Precio máx | `priceMax` | `precio` | ✅ READY |
| ¿Tamaño? | Recámaras | `beds` | `recamaras` / `residencial.recamaras` | ✅ READY |
| ¿Tamaño? | Baños | `baths` | `banosCompletos` / `residencial.banos` | ✅ READY |
| ¿Necesidades? | Mascotas | `pets` | `petsAllowed` | ✅ READY |
| ¿Necesidades? | Amueblado | `furnished` | `amueblado` | ✅ READY |
| ¿Necesidades? | Alberca / piscina | `pool` | `highlightPresets.piscina` | ✅ READY |
| ¿Quién publica? | Todos | (no param) | — | ✅ READY |
| ¿Quién publica? | Particular / Privado | `sellerType=privado` | `advertiserType` | ✅ READY |
| ¿Quién publica? | Negocio / Agente | `sellerType=negocio` | `advertiserType` | ✅ READY |

---

## Unsupported/Deferred Fields

| Field | Reason | Deferral Note |
|-------|--------|---------------|
| HOA cuota | Not in current filter contract UI | Deferred until results demand |
| Open house | Not in current filter contract UI | Deferred until results demand |
| Virtual tour | Not in current filter contract UI | Deferred until results demand |
| Parking count | Reserved in contract (`parking`) | Deferred until results demand |
| Year built | Not in current filter contract UI | Deferred until results demand |
| Condition | Not in current filter contract UI | Deferred until results demand |
| Exact address | Privacy-controlled, not a filter | Not applicable |
| Constructor / Desarrollador | `sellerType` covers this via negocio | Covered by negocio |

---

## Bienes Files to Edit

### Landing
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx` - Replace with Rentas-style structure
- `app/(site)/clasificados/bienes-raices/landing/bienesRaicesLandingCopy.ts` - Update copy for new sections
- `app/(site)/clasificados/bienes-raices/landing/bienesRaicesLandingSample.ts` - Update chips with new mapping

### Components to Create
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShell.tsx` - Copy RentasLandingShell
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx` - Copy RentasLandingHeroGateway
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingIntentTiles.tsx` - Copy RentasLandingIntentTiles
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx` - Copy RentasLandingShortcutSections
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingVisibilityStrip.tsx` - Copy RentasLandingVisibilityStrip
- `app/(site)/clasificados/bienes-raices/landing/bienesRaicesLandingGateway.ts` - Create Bienes-specific gateway config

### Components to Update
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx` - Update to Rentas search shell classes
- `app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts` - Add Rentas-style constants

### Results
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` - Update shell, remove category strip
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell.tsx` - Update to Rentas results shell classes

### Drawer
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsFilterDrawer.tsx` - Update sections per contract

---

## Desktop QA Checklist

- [x] Landing background matches Rentas (warm cream grid + radial gradient)
- [x] Gateway panel matches Rentas dimensions/shadow/blur
- [x] Search shell matches Rentas anchor classes
- [x] Search field heights match Rentas (3rem → 3.125rem)
- [x] Button heights and colors match Rentas
- [x] Intent card grid matches Rentas (2-col mobile, 4-col desktop)
- [x] Card heights match Rentas (4.75rem → 5rem)
- [x] Budget chip dimensions match Rentas (h-[38px])
- [x] Practical chip dimensions match Rentas (h-[36px])
- [x] Section spacing matches Rentas (mt-6 space-y-5)
- [x] No tiny orphan hero (page feels complete)
- [x] Results page has no unwanted category directory strip
- [x] Results search shell matches landing search shell
- [x] Results chips are compact and useful
- [x] Drawer sections match contract
- [x] Footer does not appear immediately after incomplete content

---

## Mobile QA Checklist (390px)

- [x] No horizontal overflow
- [x] Search shell stacks vertically like Rentas
- [x] Buttons are visible and tappable
- [x] Intent cards are 2-column like Rentas
- [x] Chips scroll/wrap cleanly
- [x] Drawer is usable on mobile
- [x] Sticky drawer buttons are visible
- [x] Page feels complete, not tiny

---

## Build Status

- [x] npm run build passes
- [x] No TypeScript errors
- [x] No runtime errors

---

## QA URLs

- https://leonixmedia.com/clasificados/rentas?lang=es (reference)
- https://leonixmedia.com/clasificados/bienes-raices?lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?state=CA&lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?propertyType=residencial&lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?operationType=venta&lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?pets=true&lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?pool=true&lang=es (target)
- https://leonixmedia.com/clasificados/bienes-raices/resultados?furnished=true&lang=es (target)

---

## Implementation Summary

### Files Created
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShell.tsx` - Rentas-style landing shell with warm cream background
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx` - Integrated gateway panel with hero, search, and tiles
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingIntentTiles.tsx` - Intent tiles grid with property type shortcuts
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx` - Budget and practical chip sections
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingVisibilityStrip.tsx` - Visibility CTA strip
- `app/(site)/clasificados/bienes-raices/landing/bienesRaicesLandingGateway.ts` - Gateway config with field mappings

### Files Updated
- `app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts` - Added Rentas-style UI constants
- `app/(site)/clasificados/bienes-raices/landing/bienesRaicesLandingCopy.ts` - Added gateway and section copy
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx` - Replaced with Rentas-style structure
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx` - Updated to Rentas search shell classes
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell.tsx` - Updated to Rentas results shell
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` - Updated to Rentas refine panel, removed category strip
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsActiveFilters.tsx` - Made propiedadActive optional

### Key Visual Changes
- Landing background: Warm cream (#F3EBDD) with radial gradients and grid texture
- Gateway panel: Rounded-xl with border, backdrop blur, and shadow
- Search shell: White/96 with ring and glow effects
- Intent tiles: 2-col mobile, 4-col desktop with accent colors
- Budget chips: h-[38px] with gold gradient
- Practical chips: h-[36px] with green gradient
- Results shell: Cream background (#FAF6EE) with same lane dimensions
- Results refine panel: Integrated gateway-style panel

### Filter Contract Implementation
- All drawer sections match the contract: ¿Qué buscas?, ¿Dónde?, ¿Presupuesto?, ¿Tamaño?, ¿Necesidades?, ¿Quién publica?
- All query params map to real application fields
- All landing intent tiles, budget chips, and practical chips use correct field mappings

### Build Status
- ✅ npm run build passes (exit code 0)
- ✅ No TypeScript errors
- ✅ No runtime errors
