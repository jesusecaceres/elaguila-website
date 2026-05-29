# Gate H1 — Leonix Global Header + Inicio Homepage Premium Brand Rebuild

**Audit date:** 2026-05-29  
**Source of truth:** `ComingSoonV2Shell.tsx`, `coming-soon-v2/page.tsx`  
**Scope:** Global public header, `/home` (Inicio), supporting brand helpers, footer alignment

---

## 1. Files inspected

| File | Purpose |
|---|---|
| `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` | Brand reference — colors, typography, hero, magazine presentation |
| `app/(site)/coming-soon-v2/page.tsx` | Coming Soon V2 route shell |
| `app/components/Navbar.tsx` | Global public header (pre-rebuild) |
| `app/(site)/home/page.tsx` | Inicio route |
| `app/(site)/home/HomeMarketingClient.tsx` | Homepage client (pre-rebuild) |
| `app/lib/siteSectionContent/homeMarketingMerge.ts` | Homepage CMS merge defaults |
| `app/components/Footer.tsx` | Site footer on home |
| `app/globals.css` | Leonix CSS variables |
| `public/magazine/leonix-media-launch-es.png` | Approved magazine asset |

---

## 2. Files changed

| File | Change |
|---|---|
| `app/lib/leonixPremiumBrand.ts` | **New** — premium brand tokens and CTA/typography classes |
| `app/lib/publicNavConfig.ts` | **New** — approved public nav structure for header + audit |
| `app/components/Navbar.tsx` | **Rebuilt** — premium Leonix header with logo, nav, Más dropdown, burgundy CTA |
| `app/(site)/home/HomeMarketingClient.tsx` | **Rebuilt** — hero, pillars, ecosystem, advertiser placeholder, newsletter |
| `app/lib/siteSectionContent/homeMarketingMerge.ts` | Updated defaults — magazine asset, copy, disabled chip callouts |
| `app/components/Footer.tsx` | Premium cream styling; Nosotros + Contacto links |
| `app/globals.css` | Added burgundy/green-deep tokens; refined nav cream/gold border |
| `app/lib/website-audit/WEBSITE_H1_HEADER_HOME_BRAND_REBUILD_AUDIT.md` | This audit file |
| `scripts/website-h1-header-home-brand-audit.ts` | **New** — automated gate checks |
| `package.json` | Added `website:h1-header-home-brand-audit` script |

---

## 3. Header changes

- Compact premium layout: logo + brand left, center nav, lang + account + Anúnciate right
- Cream/ivory `#FAF6EE` background with gold/bronze bottom border
- Burgundy `#7A1E2C` primary CTA and active nav emphasis
- Approved nav order: Inicio, La Revista, Clasificados, Negocios Locales, Recursos Comunitarios, Viajes, Productos Promocionales, Noticias, Más
- Más dropdown: Nosotros, Contacto
- Cupones and Iglesias removed from public nav
- Mobile: logo, hamburger, lang + account accessible; Anúnciate prominent in drawer footer

---

## 4. Homepage changes

- Two-column hero (text left, magazine right; stacked on mobile)
- Value proposition lines with burgundy accents (Coming Soon V2 pattern)
- Core pillars: Clasificados, Negocios Locales, Recursos Comunitarios — editorial cards, not chip pills
- Ecosystem section: print, digital, QR, business hub
- Premium advertiser placeholder section (`#premium-advertisers-placeholder`) with skeleton slots — no fake names
- Newsletter + advertise/contact conversion block
- Removed rounded chip callout clutter; disabled CMS callout chips by default

---

## 5. Brand palette mapping used

| Role | Token / hex | Usage |
|---|---|---|
| Page background | `#F5F0E6` / `--lx-page` | Homepage base |
| Section / header | `#FAF6EE` | Header, footer |
| Card surface | `#FFFDF7` / `--lx-card` | Cards, magazine frame |
| Primary CTA | `#7A1E2C` / `--lx-burgundy` | Anúnciate, primary buttons |
| CTA hover | `#5e1721` / `--lx-burgundy-hover` | Hover states |
| Gold accent | `#C9A84A` / `--lx-gold` | Borders, dividers, magazine frame |
| Gold muted | `#8A6B1F` | Placeholder labels |
| Charcoal text | `#1F241C`, `#3D3428` | Headings, body |
| Deep green | `#2A4536` / `--lx-green-deep` | Newsletter block, community accent |
| Olive muted | `#556B3E` | Eyebrows, trust labels |
| Border | `#D6C7AD` / `--lx-border` | Section dividers |

---

## 6. Typography mapping used

| Role | Treatment |
|---|---|
| Headings / hero title | `font-serif`, bold, `#2A4536` / `#7A1E2C` accents |
| Section titles | `font-serif`, `leonixSectionTitleClass` |
| Eyebrows | Uppercase sans, `#556B3E`, wide tracking |
| Body / nav / forms | Clean sans (system / Geist), `#3D3428` |
| Nav links | Medium weight sans, burgundy active underline |

---

## 7. Magazine asset replacement result

- Default `coverImageSrc` updated to `/magazine/leonix-media-launch-es.png`
- Hero uses `next/image` with `width={1792} height={1344}`, `h-auto w-full` — no stretch/blur
- Clean border + shadow frame; tight padding; no oversized rounded chip card

---

## 8. CTA hierarchy result

| Level | Label (ES) | Destination |
|---|---|---|
| Primary | Anúnciate con nosotros | `/contact?interest=advertise&lang=…` |
| Secondary | Explorar la revista | `/magazine?lang=…` |
| Tertiary | Contáctanos | `/contacto?lang=…` |
| Header CTA | Anúnciate | Login → publish flow (preserved) |

---

## 9. Premium advertiser placeholder result

- Section `#premium-advertisers-placeholder` near bottom of homepage
- Heading + intro explain reserved premium sponsor zone
- Three dashed-border skeleton slots — no business names, logos, or fake ads

---

## 10. Mobile result

- Header: compact logo, ES/EN toggle, sign-in/account shortcut, hamburger
- Drawer: full nav structure including Más items; Anúnciate CTA pinned at bottom
- Home: stacked hero (text then magazine); pillar/ecosystem grids collapse to single column

---

## 11. Desktop result

- Header: three-column grid — brand | center nav + Más dropdown | controls + CTA
- Home: two-column hero; 3-column pillars; 2×2 ecosystem grid; 3-column advertiser placeholders

---

## 12. Risks / deferred work

- CMS `home_marketing` payload may still override `coverImageSrc` if admin sets a different image — merge defaults updated but live CMS patch takes precedence
- English magazine cover asset not yet localized (ES launch cover used for both langs)
- Premium advertiser slots are structural only — activation requires future sponsor integration
- Nav density on mid-width viewports (tablet) hides desktop nav until `lg` — mobile drawer used below `lg`

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Coming Soon V2 was used as visual source of truth | TRUE | Colors, hero structure, magazine frame, burgundy/gold palette from `ComingSoonV2Shell.tsx` |
| Header now uses Leonix premium brand styling | TRUE | `#FAF6EE` header, gold border, burgundy CTA in `Navbar.tsx` |
| Header nav labels match the approved structure | TRUE | `publicNavConfig.ts` + `Navbar.tsx` |
| Cupones is hidden from public nav | TRUE | Not in `PUBLIC_NAV_PRIMARY` or drawer; only in `PUBLIC_NAV_HIDDEN` |
| Iglesias is removed from top-level nav | TRUE | Not in nav arrays |
| Nosotros is removed from top-level nav | TRUE | Only in `PUBLIC_NAV_MAS_ITEMS` |
| Contacto is removed from top-level nav | TRUE | Only in `PUBLIC_NAV_MAS_ITEMS` |
| Más dropdown contains Nosotros and Contacto | TRUE | `PUBLIC_NAV_MAS_ITEMS` rendered in desktop dropdown + mobile |
| Anúnciate remains the primary CTA in the header | TRUE | Burgundy CTA right side desktop + drawer footer |
| Mobile nav matches the new structure | TRUE | Same items as desktop in mobile drawer |
| Homepage uses Leonix cream/ivory foundations | TRUE | `bg-[#F5F0E6]`, `#FFFDF7` cards |
| Homepage uses burgundy intentionally for primary CTAs | TRUE | `leonixPrimaryCtaClass`, `#7A1E2C` |
| Homepage uses gold/bronze intentionally for accents | TRUE | Border `#C9A84A`, hero left rule, magazine frame |
| Homepage uses charcoal as primary readable text | TRUE | `#1F241C`, `#3D3428` body text |
| Homepage avoids random rounded chip-heavy UI | TRUE | Chip callouts disabled; rectangular editorial cards |
| Homepage typography hierarchy is cleaner and more premium | TRUE | Serif headings, sans body, eyebrow labels |
| Homepage hero feels premium and intentional | TRUE | Two-column hero with value lines + CTAs |
| Homepage magazine image was replaced with leonix-media-launch-es.png | TRUE | `homeMarketingMerge.ts` + `HomeMarketingClient.tsx` |
| Magazine visual is presented cleanly without awkward padding or distortion | TRUE | `next/image` aspect-preserving, tight border frame |
| Homepage includes a prepared premium advertiser placeholder section near the bottom | TRUE | `#premium-advertisers-placeholder` section |
| No fake advertisers were invented | TRUE | Skeleton placeholders only, no names |
| No unrelated category pipelines were changed | TRUE | Scope limited to header/home/helpers/footer |
| Login/account/language controls still work visually | TRUE | Preserved in header right cluster + mobile drawer |
| Mobile layout remains clean | TRUE | Stacked hero, drawer nav, pinned CTA |
| Desktop layout remains clean | TRUE | Grid layouts, compact header |
| npm run build passed | TRUE | `npm run build` exit 0 (2026-05-29) |

---

**Gate status:** Complete
