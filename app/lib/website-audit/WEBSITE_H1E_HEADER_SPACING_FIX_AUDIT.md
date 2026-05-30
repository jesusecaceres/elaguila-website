# Gate H1E — Header Spacing Fix to Match Coming Soon V2 Structure

**Audit date:** 2026-05-29  
**Read-only reference:** `ComingSoonV2Shell.tsx` header section  
**Scope:** Normal global header + nav config helper only

---

## 1. Files inspected

| File | Purpose |
|---|---|
| `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` | Read-only header layout reference |
| `app/components/Navbar.tsx` | Normal site global header |
| `app/lib/publicNavConfig.ts` | Nav label/route split for spacing |

## 2. Files changed

| File | Change |
|---|---|
| `app/components/Navbar.tsx` | True 3-zone grid, xl breakpoint, removed cramped mobile pill row |
| `app/lib/publicNavConfig.ts` | Split `PUBLIC_NAV_DESKTOP` vs `PUBLIC_NAV_MAS_ITEMS` |
| `scripts/website-h1e-header-spacing-fix-audit.ts` | **New** audit script |
| `package.json` | Added H1E audit script |

## 3. Coming Soon read-only comparison

| Pattern | CS V2 | Normal header (H1E) |
|---|---|---|
| Container | `max-w-6xl px-4 sm:px-6` | Same |
| Row padding | `py-1.5 sm:py-2 lg:py-2` | Same |
| Grid | `auto 1fr auto` | `auto minmax(0,1fr) auto` (overflow-safe) |
| Brand gap | `gap-1.5 sm:gap-2` | `gap-2.5 sm:gap-3` (10–12px) |
| Nav gap | `gap-x-4 xl:gap-x-5` | `gap-x-[1.375rem] 2xl:gap-x-[1.875rem]` (22–30px) |
| Nav font | `0.8125rem` / `0.875rem` xl | Same |
| Active | Burgundy underline | Same |
| Lang toggle | Rounded-full segmented | Same (ES/EN compact for extra controls) |
| CTA | Burgundy rounded-full | Same |
| Background | `#FAF6EE/95`, `#D6C7AD` border | Same |

## 4. 3-zone layout result

`grid-cols-[auto_minmax(0,1fr)_auto]` with `gap-x-4 sm:gap-x-6` between zones. Left/right `shrink-0`; center `min-w-0` with centered flex nav. Desktop nav hidden below `xl` to prevent squeeze/overlap.

## 5. Brand block result

Compact logo emblem + truncated-safe "Leonix Media" text; `shrink-0`; 10–12px logo/text gap; does not encroach on center column.

## 6. Center nav result

**Top-level desktop (7 items):** Inicio, La Revista, Clasificados, Negocios Locales, Recursos Comunitarios, Viajes, Más.

**Removed from top-level:** Productos Promocionales, Noticias, Nosotros, Contacto.

## 7. Más dropdown result

Contains: Productos Promocionales, Noticias, Nosotros, Contacto. Cupones hidden. Iglesias hidden.

## 8. ES/EN toggle result

CS V2 segmented rounded-full style; compact ES/EN labels; preserves `?lang=` router behavior.

## 9. Account result

Auth preserved; max-width truncate on desktop; hidden below xl in header bar (available in mobile drawer).

## 10. Anúnciate result

Burgundy CS V2-style CTA; desktop xl+ only in header bar; prominent in mobile drawer.

## 11. Desktop result

Full 3-zone header at xl+. No inline nav below xl. No horizontal pill overflow row.

## 12. Mobile result

Brand left | lang + hamburger right. Drawer lists all approved items + Anúnciate. No horizontal overflow nav row.

## 13. Risks / deferred work

- Desktop full nav requires xl (~1280px); lg/tablet uses hamburger only
- Long "Recursos Comunitarios" label may still feel tight at xl — Más consolidation helps
- Account/sign-in only in drawer below xl

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Coming Soon V2 was inspected read-only | TRUE | Patterns documented |
| Coming Soon V2 files were not modified | TRUE | Not in git diff |
| Only normal header files were changed | TRUE | Navbar + publicNavConfig + audit |
| No page.tsx files were changed | TRUE | Not in git diff |
| Header uses true 3-zone layout | TRUE | `auto minmax(0,1fr) auto` grid |
| Brand block does not overlap nav | TRUE | shrink-0 + xl breakpoint |
| Brand block has controlled logo/text spacing | TRUE | gap-2.5 sm:gap-3 |
| Center nav does not overlap brand | TRUE | minmax middle column |
| Center nav does not overlap right controls | TRUE | xl-only center nav |
| Top-level desktop nav is reduced for spacing | TRUE | 6 tabs + Más |
| Productos Promocionales is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Noticias is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Nosotros is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Contacto is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Cupones is hidden from public nav | TRUE | Not in config |
| Iglesias is hidden from top-level nav | TRUE | Not in config |
| ES/EN toggle matches Coming Soon style closely | TRUE | Segmented rounded-full |
| Account control remains functional and aligned | TRUE | Auth preserved |
| Anúnciate CTA matches Coming Soon style closely | TRUE | Burgundy pill |
| Desktop header has no text collision | TRUE | xl breakpoint + 3-zone |
| Desktop header has no nav wrapping | TRUE | whitespace-nowrap |
| Mobile header has no horizontal overflow | TRUE | No pill scroll row |
| No category split was implemented | TRUE | Out of scope |
| No routes/pages were created | TRUE | No page.tsx changes |
| No category pipeline files were changed | TRUE | Out of scope |
| No publish flow files were changed | TRUE | Out of scope |
| No DB/schema files were changed | TRUE | Out of scope |
| No admin/dashboard files were changed | TRUE | Out of scope |
| No Stripe/payment files were changed | TRUE | Out of scope |
| npm run build passed | TRUE | Exit 0 (2026-05-29) |
