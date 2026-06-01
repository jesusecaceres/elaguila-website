# Gate HOME-IMAGE-FIX — Restore H1F Header State and Replace Home Magazine Image Only

**Gate:** HOME-IMAGE-FIX  
**Date:** 2026-05-30  
**Scope:** Verify H1F header preserved; swap `/home` hero magazine image only

---

## 1. Files inspected

| File | Purpose |
|---|---|
| `app/components/Navbar.tsx` | H1F 3-zone header state |
| `app/lib/publicNavConfig.ts` | H1F desktop/Más nav split |
| `app/lib/siteSectionContent/homeMarketingMerge.ts` | Home hero `coverImageSrc` default + CMS remap |
| `app/(site)/home/HomeMarketingClient.tsx` | Home hero image render |
| `app/(site)/home/page.tsx` | Home route (no CS V2 import) |
| `public/magazine/leonix-media-magazine-mockup-es.png` | Standalone approved magazine mockup |
| `public/home_thumbnail.png` | Legacy Raíces roots/tree cover (removed from hero path) |
| `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` | Read-only CS V2 protection check |

## 2. Files changed

| File | Change |
|---|---|
| `app/lib/siteSectionContent/homeMarketingMerge.ts` | Default + legacy remap → standalone mockup |
| `app/(site)/home/HomeMarketingClient.tsx` | Minimal hero container + `object-contain` |
| `public/magazine/leonix-media-magazine-mockup-es.png` | **New** standalone magazine mockup asset |
| `app/lib/website-audit/WEBSITE_HOME_IMAGE_FIX_AUDIT.md` | This audit |
| `scripts/website-home-image-fix-audit.ts` | Automated audit |
| `package.json` | Audit npm script |

**Not changed:** `Navbar.tsx`, `publicNavConfig.ts`, Coming Soon V2 files, category pages, routes.

## 3. H1F header state result

**Preserved — no restoration needed.**

Committed state (`3463254e`) includes:
- 3-zone grid: `auto minmax(0, 1fr) auto` with `col-start-1/2/3`
- Desktop inline: Inicio, La Revista, Clasificados, Negocios Locales, Recursos Comunitarios, Más
- Más dropdown: Viajes, Productos Promocionales, Noticias, Nosotros, Contacto
- Cupones / Iglesias hidden from public nav
- `xl` breakpoint: inline nav vs hamburger

Working tree has **no diff** on `Navbar.tsx` or `publicNavConfig.ts`.

## 4. Home image source before

`/home_thumbnail.png` — dark Raíces roots/tree cover (LEONIX / RAÍCES / Enero 2026)

Also remapped when CMS persisted legacy path via `home_marketing.coverImageSrc`.

## 5. Home image source after

`/magazine/leonix-media-magazine-mockup-es.png`

## 6. Approved magazine asset path used

`public/magazine/leonix-media-magazine-mockup-es.png`

Standalone mockup (standing magazine, woman in white blazer, advertiser strip, “Conecta tu negocio con nuestra comunidad”). **Not** the full Coming Soon page screenshot (`leonix-media-launch-es.png` / `coming-soon-exact.png`).

## 7. Coming Soon V2 protection result

**PASS** — No CS V2 files modified. `/home` does not import or render `ComingSoonV2Shell`.

## 8. Desktop result

Home hero shows standalone magazine mockup at proportional width (`w-72 sm:w-80 md:w-[22rem]`, `object-contain`). H1F header unchanged with 3-zone layout at `xl+`.

## 9. Mobile result

Home hero mockup scales proportionally; header uses hamburger drawer with full nav including Más items.

## 10. Risks / deferred work

- **Deploy required:** Production `leonixmedia.com/home` will show old cover until this commit is deployed.
- **CMS override:** Admin can set a custom `coverImageSrc` in `home_marketing`; legacy paths are remapped automatically.
- **Parallel working tree:** Unrelated en-venta diffs exist; not part of this gate.

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| H1F header state was checked | TRUE | Navbar + publicNavConfig inspected; H1F audit markers |
| H1F header state is preserved/restored | TRUE | No diff on header files; 3463254e committed |
| No Coming Soon V2 files were modified | TRUE | CS V2 paths absent from gate diff |
| /home does not import ComingSoonV2Shell | TRUE | `home/page.tsx` imports only HomeMarketingClient |
| /home does not render Coming Soon V2 | TRUE | No CS V2 references in home tree |
| Old dark Raíces/tree image was removed from Home hero | TRUE | `resolveHomeCoverImageSrc` remaps `/home_thumbnail.png` |
| Approved standalone magazine mockup is used on Home hero | TRUE | `/magazine/leonix-media-magazine-mockup-es.png` |
| Full Coming Soon page screenshot was not used as Home hero image | TRUE | Not referenced in hero render path |
| Browser screenshot was not used as Home hero image | TRUE | `coming-soon-exact.png` not used |
| Home layout was not redesigned | TRUE | Only img container sizing + object-contain |
| Header was not redesigned beyond restoring H1F if needed | TRUE | Navbar untouched |
| No category pages were changed | TRUE | No category files in gate diff |
| No page routes were created | TRUE | No new routes |
| No category split was implemented | TRUE | N/A |
| Desktop Home remains usable | TRUE | Build + hero renders via coverImageSrc |
| Mobile Home remains usable | TRUE | Responsive container preserved |
| npm run build passed | TRUE | npm run build exit 0 |
