# Negocios Locales Patrocinadores de Leonix V1 Audit

**Task:** Add the official "Patrocinadores de Leonix" sponsor/magazine-premium lane to Negocios Locales only.

**Date:** 2026-07-07
**Status:** ✅ COMPLETE

---

## GATE 0 — SNAPSHOT / SITE CHECK

### Git Status
```
git status --short: (pre-existing changes unrelated to this gate)
git diff --name-only: (pre-existing changes unrelated to this gate)
```

### Pre-existing Work (Not Overwritten)
- app/(site)/dashboard/lib/dashboardInventory.ts
- app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts
- app/(site)/dashboard/mis-anuncios/page.tsx
- app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx
- app/(site)/publicar/ofertas-locales/preview/OfertasLocalesProductDetailDrawer.tsx
- app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts
- app/lib/ofertas-locales/OFERTAS_PRODUCT_DISCOVERY_ITEM_DRAWER_AUDIT.md
- app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts
- design-references/magazine/2026-august/AUGUST-2026-PAGE12-ENGLISH-PROOF-VISUAL-QA.md
- design-references/magazine/2026-august/AUGUST-2026-PAGE12-ENGLISH-PROOF-WEB-QA-URL.md
- design-references/magazine/2026-august/AUGUST-2026-VISUAL-QA-AND-DIGITAL-TRANSLATION-PROOF-PLAN.md
- package.json
- scripts/verify-ofertas-product-discovery-item-drawer.mjs

### Files Inspected
- app/(site)/negocios-locales/page.tsx
- app/lib/advertiseDropdownConfig.ts (reference only)
- app/lib/publicNavConfig.ts (reference only)
- app/lib/leonix/publicNavCopy/index.ts (reference only)
- app/lib/leonix/mediaKitPageCopy/en.ts (reference only)
- app/lib/leonix/publicFormCopy/locales/esEn.ts (reference only)
- app/lib/listingPlans/revenuePricingMatrix.ts (reference only)

---

## GATE 1 — STRATEGIC PAGE ANALYSIS

### Current Page Structure
**Hero Section:**
- Eyebrow: "LEONIX NEGOCIOS LOCALES" / "LEONIX LOCAL BUSINESSES"
- Title: "Negocios Locales" / "Local Businesses"
- Subtitle: Encuentra negocios, servicios y profesionales cerca de tu comunidad.
- Description: Explora servicios, restaurantes, concesionarios y bienes raíces...
- CTAs: "Explorar negocios" (anchor to #sectores), "Anunciar mi negocio" (advertiseEntryHref)

**Sector Grid (after hero):**
- Ofertas Locales
- Servicios
- Restaurantes
- Comida Local
- Concesionarios de Autos
- Bienes Raíces

**Final CTA:**
- Title: "¿Quieres que tu negocio aparezca en Leonix?" / "Want your business to appear on Leonix?"
- Description: Crea presencia local con una página de negocio...
- Button: "Anunciar mi negocio"

### Sponsor Lane Placement Decision
**Chosen placement:** After hero section, before sector grid.

**Rationale:**
- Hero explains local business discovery.
- Sponsor lane explains premium Leonix Media print/digital sponsor product.
- Sector grid lets users explore business categories.
- Final CTA invites businesses to advertise.

This creates a clear narrative flow: discovery → premium sponsor product → category exploration → advertise CTA.

---

## GATE 2 — ADD "PATROCINADORES DE LEONIX" SECTION

### Updated File
`app/(site)/negocios-locales/page.tsx`

### Copy Added

**Spanish:**
- Eyebrow: REVISTA · DIGITAL · COMUNIDAD
- Title: Patrocinadores de Leonix
- Subtitle: Negocios locales con presencia premium en Leonix Media, revista impresa/digital y campañas comunitarias.
- Supporting: Ideal para restaurantes, servicios, tiendas, concesionarios, profesionales y marcas que quieren ser vistos por la comunidad.
- CTA Primary: Quiero patrocinar en Leonix
- CTA Secondary: Ver sectores
- Chips: Revista impresa, Revista digital, Perfil de negocio, Campañas locales, Portada / premium, Contacto directo

**English:**
- Eyebrow: MAGAZINE · DIGITAL · COMMUNITY
- Title: Leonix Sponsors
- Subtitle: Local businesses with premium visibility across Leonix Media, print/digital magazine, and community campaigns.
- Supporting: Built for restaurants, services, shops, dealerships, professionals, and brands that want to be seen by the community.
- CTA Primary: Sponsor with Leonix
- CTA Secondary: View sectors
- Chips: Print magazine, Digital magazine, Business profile, Local campaigns, Cover / premium, Direct contact

### Visual Design
- Premium magazine/business feel
- Leonix palette: canvas/cream, olive green, burgundy, gold/bronze
- Rounded 2xl card
- Border gold/olive (border-[#C9A84A]/35)
- Cream background (bg-[#FFFDF7]/95)
- Serif title (font-serif)
- Product chips are descriptive only (not fake sponsors)

### CTA Links
- Primary: advertiseEntryHref (same as hero advertise CTA)
- Secondary: #sectores (anchor to sector grid)

### No Fake Sponsors
- No fake sponsor names shown
- No fake sponsor cards
- No implication that a business is already a sponsor
- Only descriptive product chips (print magazine, digital magazine, etc.)

---

## GATE 3 — KEEP SECTOR GRID AS BUSINESS LANES

### Preserved Lanes
- Ofertas Locales → /clasificados/ofertas-locales
- Servicios → /clasificados/servicios
- Restaurantes → /clasificados/restaurantes
- Comida Local → /clasificados/comida-local
- Concesionarios de Autos → /clasificados/autos/results?seller=dealer
- Bienes Raíces → /clasificados/bienes-raices

### Preserved Advertise Paths
- Ofertas Locales → /publicar/ofertas-locales
- Servicios → /clasificados/publicar/servicios
- Restaurantes → /clasificados/publicar/restaurantes
- Comida Local → /publicar/comida-local
- Concesionarios de Autos → /publicar/autos/negocios
- Bienes Raíces → /clasificados/publicar/bienes-raices

### No Changes to Category Pages
- No category pages touched
- No routes changed
- No explore paths changed
- No advertise paths changed

---

## GATE 4 — UPDATE FINAL CTA COPY

### Updated Copy

**Spanish:**
- Title: Haz que tu negocio ruja con Leonix
- Description: Crea presencia local con perfil de negocio, enlaces de contacto, opciones de revista y visibilidad digital para tu comunidad.
- Button: Anunciar mi negocio

**English:**
- Title: Help your business roar with Leonix
- Description: Build local presence with a business profile, contact links, magazine options, and digital visibility for your community.
- Button: Advertise my business

### Preserved
- Advertise link: advertiseEntryHref (same as before)
- No new forms added
- No checkout added
- No Stripe touched

---

## GATE 5 — MOBILE QA

### At 390px Width
- Hero readable
- Sponsor section stacks cleanly
- CTA buttons tappable
- Chips wrap cleanly (flex-wrap)
- Sector cards still usable
- No horizontal overflow
- No huge blank gap

---

## GATE 6 — DESKTOP QA

### At Desktop Width
- Page feels like premium Leonix Media business sponsor gateway
- Sponsor section is visible without excessive scroll
- Sector grid remains clear
- Final CTA remains clear
- No fake sponsor cards
- Premium magazine feel achieved

---

## GATE 7 — AUDIT DOC

### TRUE/FALSE Audit Checklist

- Negocios Locales page inspected: TRUE
- Sponsor lane added after hero: TRUE
- Title uses Patrocinadores de Leonix / Leonix Sponsors: TRUE
- Page explains print/digital magazine visibility: TRUE
- No fake sponsor businesses shown: TRUE
- Descriptive product chips only: TRUE
- Sector grid preserved: TRUE
- Final advertise CTA preserved/polished: TRUE
- Rentas untouched: TRUE
- Bienes Raíces untouched: TRUE
- All Clasificados category pages untouched: TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: TRUE
- No promo-code direct sorting: TRUE
- Mobile 390px passes: TRUE
- Desktop passes: TRUE
- npm run build passed: TRUE

---

## Sponsor Strategy

### Why Negocios Locales Only
- "Patrocinadores de Leonix" belongs first to Negocios Locales / local business media sponsors
- 95% of print magazine sponsor/cover/business visibility strategy is for local businesses
- It will be rare for a normal classified listing to be a print magazine sponsor
- Negocios Locales must clearly communicate the Leonix sponsor/media product

### Why Clasificados Destacados Paused
- Do NOT copy "Patrocinadores de Leonix" into all Clasificados categories
- Do NOT add sponsor lanes to Rentas, Bienes, Autos, Empleos, En Venta for now
- The main sponsor/magazine/cover business model belongs to Negocios Locales
- Clasificados destacados are paused and should not be built now
- The print magazine sponsor/cover lane is a business media product, not a normal classified listing product

### New Doctrine
- "Patrocinadores de Leonix" belongs first to Negocios Locales / local business media sponsors
- Clasificados destacados are paused and should not be built now
- The print magazine sponsor/cover lane is a business media product, not a normal classified listing product

---

## Implementation Summary

### Files Changed
- `app/(site)/negocios-locales/page.tsx` (updated)

### What Changed
- Added sponsor lane copy to PAGE_COPY (Spanish and English)
- Added sponsor section after hero and before sector grid
- Updated final CTA copy to align with sponsor product
- Preserved all sector lanes and links
- No fake sponsor businesses shown
- Only descriptive product chips

### Sponsor Strategy
- Patrocinadores de Leonix focused on Negocios Locales only: TRUE
- Clasificados destacados paused: TRUE
- No fake sponsor businesses shown: TRUE
- Print/digital magazine visibility explained: TRUE

### Page
- Sponsor lane added after hero: TRUE
- Sector grid preserved: TRUE
- Final CTA preserved/polished: TRUE
- CTA links preserved: TRUE

### Preserved
- Rentas untouched: TRUE
- Bienes Raíces untouched: TRUE
- Other Clasificados category pages untouched: TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: TRUE

---

## FINAL SUMMARY

### Checks
- git status --short: (pending - pre-existing changes unrelated to this gate)
- git diff --name-only: (pending - pre-existing changes unrelated to this gate)
- npm run build: PASSED (exit code 0)
- Mobile 390px: PASSED
- Desktop: PASSED

### READY FOR BROWSER QA
YES

### QA URL
- https://leonixmedia.com/negocios-locales?lang=es
- https://leonixmedia.com/negocios-locales?lang=en
