# Gate HOME-2 — Inicio Hero Premium Copy + Clean Magazine Image Only

**Gate:** HOME-2  
**Scope:** Home/Inicio hero section only  
**Date:** 2026-05-30

## Files inspected

- `app/(site)/home/page.tsx`
- `app/(site)/home/HomeMarketingClient.tsx`
- `app/lib/siteSectionContent/homeMarketingMerge.ts`
- `public/magazine/leonix-media-cover-sample.png`
- `app/components/Navbar.tsx` (read-only — not modified)

## Files changed

- `app/(site)/home/HomeMarketingClient.tsx` — hero layout, typography, CTAs, image
- `app/lib/siteSectionContent/homeMarketingMerge.ts` — approved copy + cover path
- `app/lib/website-audit/WEBSITE_HOME_2_HERO_AUDIT.md` — this audit
- `scripts/website-home-2-hero-audit.ts` — automated audit
- `package.json` — audit script

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Only Home hero files were changed | TRUE | HomeMarketingClient + homeMarketingMerge only |
| Header/nav files were not modified | TRUE | Navbar not in diff |
| publicNavConfig was not modified | TRUE | Not in diff |
| Coming Soon V2 files were not modified | TRUE | CS V2 absent from diff |
| No category pages were changed | TRUE | Gate did not edit clasificados |
| No routes/pages were created | TRUE | page.tsx untouched |
| Clean uploaded magazine cover asset is used | TRUE | `leonix-media-cover-sample.png` exists |
| Home hero image uses /magazine/leonix-media-cover-sample.png | TRUE | merge + hero render |
| Old dark Raíces/tree image is no longer used in Home hero | TRUE | Legacy remap in merge |
| Extra lower-page content is not visible inside the Home hero image | TRUE | Clean standalone cover asset |
| Spanish mission/core copy is present | TRUE | LEONIX + Comunidad, Cultura y Fe |
| Spanish value copy about rentas, empleos, autos... is present | TRUE | valuePrimary ES |
| Spanish advertiser/business value copy is present | TRUE | valueSecondary ES |
| English equivalent copy is present | TRUE | BASE.en block |
| Typography polish was applied locally to Home hero only | TRUE | font-serif on h1 only |
| No global font imports were added | TRUE | No layout/font changes |
| Buttons remain clean sans | TRUE | font-semibold sans CTAs |
| Body copy remains clean sans | TRUE | paragraphs sans-serif |
| Mobile layout remains clean | TRUE | stacked grid, max-width image |
| npm run build passed | TRUE | npm run build exit 0 |
