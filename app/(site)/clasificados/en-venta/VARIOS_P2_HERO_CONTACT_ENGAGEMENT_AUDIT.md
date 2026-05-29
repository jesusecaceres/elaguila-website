# Gate P2 — Varios Hero Header + Contact Card + Real Engagement Actions

Audit path: `app/(site)/clasificados/en-venta/VARIOS_P2_HERO_CONTACT_ENGAGEMENT_AUDIT.md`  
(Requested `app/lib/clasificados/en-venta/` does not exist; using nearest En Venta audit location.)

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx`
- `app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts`
- `app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx`, `LeonixShareButton.tsx`
- `app/(site)/clasificados/servicios/ServiciosListingResultCard.tsx` (engagement pattern reference)

## 2. Hero/header finding

Preview and live Varios detail used scattered chips, price-before-title on detail, and engagement mixed without hierarchy. Replaced with `EnVentaListingHero`: title (serif) → price + negotiable label → metadata line → primary CTA → save/share/report row.

## 3. Engagement action finding

- **Detail:** Real `LeonixLikeButton`, Supabase save toggle, `LeonixShareButton` with analytics, `EnVentaListingReportDrawer` for report.
- **Preview:** Save/report disabled with honest hints; share uses `LeonixShareButton` with `persistEngagement={false}`.
- No view/save/comment counters added.

## 4. Contact card finding

`EnVentaBuyerPanel` redesigned: 6px radius, ivory surface, gold borders. `EnVentaContactButtons` provides ordered CTAs with icons. WhatsApp gated by contact channel + digits.

## 5. Location/map finding

Location moved into contact card with “Ubicación indicada por el vendedor” note and map button. Preview distance estimator, “usar mi ubicación”, and `/api/clasificados/distance` block removed from contact card.

## 6. Price/negotiable finding

Hero shows `$` amount from preview model / `formatListingPrice` on detail. Negotiable label shown beside price without hiding amount. Gratis unchanged.

## 7. Copy/Varios naming finding

Preview seller subline uses “Anuncio de Varios”. Public labels remain Varios / For Sale via `enVentaPublicLabel`. No visible Spanish “En Venta” added.

## 8. Files changed

- `EnVentaListingHero.tsx` (new)
- `EnVentaContactButtons.tsx` (new)
- `EnVentaBuyerPanel.tsx`
- `EnVentaPreviewPage.tsx`
- `EnVentaAnuncioLayout.tsx`
- `buildEnVentaPreviewModel.ts`
- `enVentaContactActions.ts`
- `scripts/varios-p2-hero-contact-engagement-audit.ts`
- `package.json` (audit script)

## 9. Build/check result

See gate validation output.

## 10. Remaining risks

- Business seller rail still uses alternate layout (unchanged).
- Report button in hero scrolls to contact section where drawer lives; could add dedicated anchor later.
- Legacy listings without `Leonix:contactChannel` default to phone+email, never WhatsApp.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Varios preview/detail files inspected | TRUE | Section 1 |
| Servicios engagement/contact pattern inspected | TRUE | LeonixLike/Save/Share reference |
| Hero title hierarchy improved | TRUE | `EnVentaListingHero` |
| Price remains visible with dollar sign when negotiable | TRUE | Hero + preview model |
| Gratis display remains clean | TRUE | `formatListingPrice` / preview model |
| Core metadata is organized and not scattered | TRUE | `metadataParts` line |
| Save/heart action uses real behavior or blocker documented | TRUE | Detail: real save; preview: disabled + hint |
| Share action uses real behavior or blocker documented | TRUE | `LeonixShareButton` |
| Report action uses real behavior or blocker documented | TRUE | `EnVentaListingReportDrawer` |
| No fake engagement counters were added | TRUE | No counter UI added |
| Contact card redesigned with premium layout | TRUE | `EnVentaBuyerPanel` |
| WhatsApp only shows when provided | TRUE | `buildEnVentaLiveContactActions` + channel gate |
| Phone CTA only shows when phone exists | TRUE | Contact prefs + phone check |
| SMS/Mensaje CTA only shows when phone exists | TRUE | Contact prefs + phone check |
| Email CTA only shows when email exists | TRUE | Contact prefs + email check |
| Location moved into contact card | TRUE | Buyer panel location section |
| Distance estimator block removed/hidden from contact card | TRUE | Removed from preview page |
| Map CTA only shows when location exists | TRUE | `mapHref` conditional |
| Contact buttons have clear icons and contrast | TRUE | `EnVentaContactButtons` |
| Mobile contact card remains usable | TRUE | Stack layout, min-h 44px |
| Visible Spanish copy uses Varios where appropriate | TRUE | Preview subline + labels |
| No unrelated categories were touched | TRUE | Scope limited |
| npm run build passed | TRUE | See validation |
