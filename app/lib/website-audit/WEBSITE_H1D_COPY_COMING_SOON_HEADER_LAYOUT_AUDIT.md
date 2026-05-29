# Gate H1D — Copy Coming Soon V2 Header Layout for Normal Site Header

**Audit date:** 2026-05-29  
**Read-only reference:** `ComingSoonV2Shell.tsx` (header section only)  
**Scope:** Normal global header, nav config helper, placeholder routes only

---

## 1. Files inspected

| File | Purpose |
|---|---|
| `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` | Read-only header layout reference |
| `app/components/Navbar.tsx` | Normal site global header |
| Route inventory for nav destinations | Existing vs placeholder |

## 2. Files changed

| File | Change |
|---|---|
| `app/components/Navbar.tsx` | Recreated CS V2 header layout locally |
| `app/lib/publicNavConfig.ts` | **New** — approved nav labels/routes |
| `app/(site)/negocios-locales/page.tsx` | **New** — simple placeholder |
| `app/(site)/recursos-comunitarios/page.tsx` | **New** — simple placeholder |
| `scripts/website-h1d-copy-coming-soon-header-layout-audit.ts` | **New** audit script |
| `package.json` | Added H1D audit script |

## 3. Coming Soon V2 read-only inspection result

Mirrored patterns from `ComingSoonV2Shell.tsx` header:

| Pattern | Value |
|---|---|
| Container | `max-w-6xl px-4 sm:px-6` |
| Grid | `grid-cols-[auto_1fr_auto] py-1.5 sm:py-2 lg:py-2` |
| Background | `#FAF6EE/95`, `border-[#D6C7AD]`, gold shadow line |
| Logo | `h-8→lg:h-10`, `/logo.png`, gold ring |
| Brand | `font-serif`, `#2A4536` |
| Nav | `gap-x-4 xl:gap-x-5`, `text-[0.8125rem]`, burgundy underline active |
| Lang toggle | Rounded-full segmented, `#7A1E2C` active |
| CTA | Rounded-full burgundy pill |
| Mobile row | Horizontal scroll pills `lg:hidden` |

## 4. Coming Soon V2 protection result

**No edits** to:
- `ComingSoonV2Shell.tsx`
- `coming-soon-v2/page.tsx`
- `coming-soon-v2/layout.tsx`

Normal header does **not** import Coming Soon V2 components.

## 5. Header layout matching result

Normal header uses the same grid, padding, max-width, background, border, logo sizing, nav typography, active underline, lang toggle, and CTA styling as CS V2. Account control added between lang toggle and CTA (preserved normal site auth).

## 6. Logo/brand block result

Compact emblem + "Leonix Media" — same classes as CS V2. Links to `/home?lang=…`.

## 7. Nav tab result

Approved tabs with routes:

| Tab | Route |
|---|---|
| Inicio | `/home` |
| La Revista | `/magazine` |
| Clasificados | `/clasificados` |
| Negocios Locales | `/negocios-locales` (placeholder) |
| Recursos Comunitarios | `/recursos-comunitarios` (placeholder) |
| Viajes | `/clasificados/viajes` |
| Productos Promocionales | `/productos-promocion` |
| Noticias | `/noticias` |
| Más | Dropdown → Nosotros `/about`, Contacto `/contacto` |
| Anúnciate | Login → publish flow (preserved) |

Cupones hidden. Iglesias removed from top-level.

## 8. ES/EN toggle result

Segmented rounded-full toggle with Español/English labels; updates `?lang=` via router (preserved behavior).

## 9. Account/login result

Sign-in, account dropdown, dashboard links, sign-out — all preserved. Styled with CS V2 compact rounded-full controls.

## 10. Anúnciate CTA result

Burgundy rounded-full CTA matching `LaunchCtaLink` classes; route unchanged (`/login?mode=post…`).

## 11. Placeholder route result

Created simple bilingual placeholder pages for Negocios Locales and Recursos Comunitarios — no DB, listings, or pipeline logic.

## 12. Route safety result

All existing routes preserved. `/coupons` route/files untouched (hidden from nav only).

## 13. Desktop result

Three-column header: brand | centered nav + Más dropdown | lang + account + Anúnciate.

## 14. Mobile result

Same top grid + CS V2 horizontal scroll pill row; hamburger drawer for full nav including Más items; Anúnciate in top bar.

## 15. Risks / deferred work

- Nine primary nav items may feel dense on narrow `lg` viewports — may need horizontal scroll at intermediate widths in a future gate
- Placeholder pages are static copy only until real hubs launch
- Lang toggle shows full "Español"/"English" labels — may truncate on very narrow phones

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| ComingSoonV2Shell was inspected read-only | TRUE | Header patterns documented above |
| Coming Soon V2 files were not modified | TRUE | Not in git diff |
| Normal header does not import ComingSoonV2Shell | TRUE | Navbar.tsx |
| Normal header recreates the Coming Soon V2 header layout locally | TRUE | Grid, padding, colors match |
| Header uses compact logo/brand block like Coming Soon V2 | TRUE | Same logo classes |
| Header spacing/padding matches Coming Soon V2 closely | TRUE | max-w-6xl, py-1.5/sm:py-2 |
| Header active nav state matches Coming Soon V2 closely | TRUE | Burgundy underline |
| ES/EN toggle matches Coming Soon V2 style closely | TRUE | Segmented rounded-full |
| Anúnciate CTA matches Coming Soon V2 style closely | TRUE | Burgundy rounded-full pill |
| Account/login behavior was preserved | TRUE | Auth logic unchanged |
| Nav shows Inicio | TRUE | publicNavConfig |
| Nav shows La Revista | TRUE | publicNavConfig |
| Nav shows Clasificados | TRUE | publicNavConfig |
| Nav shows Negocios Locales | TRUE | publicNavConfig + placeholder |
| Nav shows Recursos Comunitarios | TRUE | publicNavConfig + placeholder |
| Nav shows Viajes | TRUE | publicNavConfig |
| Nav shows Productos Promocionales | TRUE | publicNavConfig |
| Nav shows Noticias | TRUE | publicNavConfig |
| Nav shows Más or equivalent secondary menu | TRUE | Desktop dropdown + mobile |
| Cupones is hidden from public nav | TRUE | Not in nav arrays |
| Coupons files/routes were not deleted | TRUE | /coupons untouched |
| Iglesias is not top-level nav | TRUE | Not in nav |
| Nosotros and Contacto remain accessible | TRUE | Más dropdown + mobile drawer |
| Negocios Locales is placeholder only if created | TRUE | Simple static page |
| Recursos Comunitarios is placeholder only if created | TRUE | Simple static page |
| No category split was implemented | TRUE | Scope limited |
| No category pipeline files were changed | TRUE | Out of scope |
| No publish flow files were changed | TRUE | Out of scope |
| No DB/schema files were changed | TRUE | Out of scope |
| No admin/dashboard files were changed | TRUE | Out of scope |
| No Stripe/payment files were changed | TRUE | Out of scope |
| Desktop header is clean and not crowded | TRUE | CS V2 grid layout |
| Mobile header is clean and usable | TRUE | Scroll pills + drawer |
| npm run build passed | TRUE | Exit 0 (2026-05-29) |
