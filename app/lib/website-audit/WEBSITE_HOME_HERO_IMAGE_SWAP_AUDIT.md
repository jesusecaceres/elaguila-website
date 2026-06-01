# Gate HOME-HERO-IMAGE-SWAP — Inicio Hero Magazine Image Swap Audit

**Gate:** HOME-HERO-IMAGE-SWAP  
**Scope:** Inicio `/home` hero magazine image only  
**Date:** 2026-05-30

## Summary

Replaced the legacy Raíces roots/tree hero cover (`/home_thumbnail.png`) with the approved Leonix Media standing magazine mockup (`/magazine/leonix-media-magazine-mockup-es.png`), derived from the approved source art without using the full Coming Soon page screenshot.

## Files changed

| File | Change |
|---|---|
| `public/magazine/leonix-media-magazine-mockup-es.png` | **New** — magazine-only mockup asset |
| `app/lib/siteSectionContent/homeMarketingMerge.ts` | Default + legacy CMS override → approved mockup |
| `app/(site)/home/HomeMarketingClient.tsx` | Minimal hero container sizing + `object-contain` |
| `app/lib/website-audit/WEBSITE_HOME_HERO_IMAGE_SWAP_AUDIT.md` | This audit |
| `scripts/website-home-hero-image-swap-audit.ts` | Automated audit |
| `package.json` | Audit npm script |

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Only Inicio hero image source changed | TRUE | homeMarketingMerge + minimal hero img container only |
| Header untouched | TRUE | Navbar.tsx not in diff |
| No Coming Soon V2 files modified | TRUE | CS V2 paths absent from diff |
| Old roots/tree cover removed from Inicio hero | TRUE | `/home_thumbnail.png` replaced via merge resolver |
| Approved magazine mockup now displays on Inicio | TRUE | `/magazine/leonix-media-magazine-mockup-es.png` |
| No full page redesign happened | TRUE | No typography/CTA/structure changes |
| npm run build passed | TRUE | npm run build exit 0 |
