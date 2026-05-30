# Gate H1F — Surgical Header Collision Fix Audit

**Gate:** H1F — Surgical Header Collision Fix  
**Scope:** Normal global header/nav only (`Navbar.tsx`, `publicNavConfig.ts`)  
**Date:** 2026-05-29

## Summary

Reduced desktop inline nav from 7 tabs to 5 + Más dropdown. Implemented explicit CSS grid 3-zone layout with protected brand and right-control columns. Moved Viajes into Más alongside secondary links. Inline nav shows only at `xl` (1280px+); hamburger below that breakpoint.

## Files changed

- `app/components/Navbar.tsx` — 3-zone grid, brand isolation, center nav xl+, Más in center zone
- `app/lib/publicNavConfig.ts` — desktop/mobile/Más nav split (Viajes moved to Más)
- `app/lib/website-audit/WEBSITE_H1F_HEADER_COLLISION_FIX_AUDIT.md` — this file
- `scripts/website-h1f-header-collision-fix-audit.ts` — automated audit
- `package.json` — `website:h1f-header-collision-fix-audit` script

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Only normal header files were changed | TRUE | git diff: Navbar.tsx, publicNavConfig.ts, audit, script, package.json only |
| No page.tsx files were changed | TRUE | No page.tsx in git diff |
| Coming Soon V2 files were not modified | TRUE | CS V2 protected paths absent from diff |
| Header uses protected 3-zone layout | TRUE | `gridTemplateColumns: auto minmax(0,1fr) auto`, col-start 1/2/3 |
| Brand block does not overlap nav | TRUE | Zone 1 shrink-0 + max-width; brand text xl+ only; center nav isolated col 2 |
| Center nav does not overlap right controls | TRUE | Zone 3 w-max shrink-0; center justify-self-center with px-4 |
| Top-level inline nav was reduced | TRUE | 5 items in PUBLIC_NAV_DESKTOP + Más button |
| Viajes is inside Más | TRUE | `PUBLIC_NAV_MAS_ITEMS` id viajes |
| Productos Promocionales is inside Más | TRUE | `PUBLIC_NAV_MAS_ITEMS` |
| Noticias is inside Más | TRUE | `PUBLIC_NAV_MAS_ITEMS` |
| Nosotros is inside Más | TRUE | `PUBLIC_NAV_MAS_ITEMS` |
| Contacto is inside Más | TRUE | `PUBLIC_NAV_MAS_ITEMS` |
| Cupones is hidden | TRUE | Not in nav bundle |
| Iglesias is hidden top-level | TRUE | Not in nav bundle |
| Más is not jammed against ES/EN toggle | TRUE | Más rendered in center nav (col 2), not right zone |
| ES/EN toggle is aligned and compact | TRUE | Segmented rounded toggle in zone 3, aria-pressed |
| Account control is aligned and truncated | TRUE | truncate + max-w on account button, xl+ desktop |
| Anúnciate CTA is aligned | TRUE | Burgundy pill in zone 3, xl+ inline |
| Header switches to mobile menu before collision | TRUE | Center nav `hidden xl:flex`; hamburger `xl:hidden` |
| Desktop header has zero text collision | TRUE | Grid columns prevent overlap; 5 tabs + Más fits xl+ |
| Mobile header has no horizontal overflow | TRUE | Logo + hamburger only; drawer for full nav |
| No routes/pages were created | TRUE | No page.tsx in diff |
| No category split was implemented | TRUE | No clasificados pipeline files in diff |
| npm run build passed | TRUE | npm run build exit 0 |
