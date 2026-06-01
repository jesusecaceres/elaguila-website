# Gate H1F — Surgical Header Collision Fix Audit

**Gate:** H1F — Surgical Header Collision Fix  
**Scope:** Normal global header/nav only  
**Date:** 2026-05-30 (revised spacing pass)

## Summary

Fixed header collision by restoring CS V2-style grid column gaps and moving inline desktop nav to `2xl` (1536px+) so laptop widths use hamburger instead of squeezed tabs. Nav split unchanged: 5 inline + Más; Viajes and secondary links in Más dropdown.

## Files changed

- `app/components/Navbar.tsx` — grid gaps, 2xl inline nav breakpoint, brand isolation
- `app/lib/publicNavConfig.ts` — H1F nav split (unchanged)
- `app/lib/website-audit/WEBSITE_H1F_HEADER_COLLISION_FIX_AUDIT.md` — this file
- `scripts/website-h1f-header-collision-fix-audit.ts` — automated audit

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Only normal header files were changed | TRUE | Navbar.tsx (+ audit/script); no page.tsx |
| No page.tsx files were changed | TRUE | No page.tsx in diff |
| Coming Soon V2 files were not modified | TRUE | CS V2 paths absent from diff |
| Header uses protected 3-zone layout | TRUE | `grid-cols-[auto_minmax(0,1fr)_auto]` + col-start 1/2/3 |
| Brand block does not overlap nav | TRUE | shrink-0 brand + gap-x-4/sm:gap-x-6; logo-only below 2xl |
| Center nav does not overlap right controls | TRUE | 2xl+ inline nav only; protected right zone shrink-0 |
| Top-level inline nav was reduced | TRUE | 5 items + Más in PUBLIC_NAV_DESKTOP |
| Viajes is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Productos Promocionales is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Noticias is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Nosotros is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Contacto is inside Más | TRUE | PUBLIC_NAV_MAS_ITEMS |
| Cupones is hidden | TRUE | Not in nav bundle |
| Iglesias is hidden top-level | TRUE | Not in nav bundle |
| Más is not jammed against ES/EN toggle | TRUE | Más in center col; hamburger below 2xl |
| ES/EN toggle is aligned and compact | TRUE | Segmented toggle in zone 3 |
| Account control is aligned and truncated | TRUE | truncate + max-w; 2xl+ desktop bar |
| Anúnciate CTA is aligned | TRUE | Burgundy pill zone 3; cream text |
| Header switches to mobile menu before collision | TRUE | Inline nav `2xl:flex`; hamburger `2xl:hidden` |
| Desktop header has zero text collision | TRUE | No inline nav below 2xl; gaps at 2xl+ |
| Mobile header has no horizontal overflow | TRUE | Logo + hamburger; drawer nav |
| No routes/pages were created | TRUE | No page.tsx changes |
| No category split was implemented | TRUE | No pipeline changes |
| npm run build passed | TRUE | npm run build exit 0 |
