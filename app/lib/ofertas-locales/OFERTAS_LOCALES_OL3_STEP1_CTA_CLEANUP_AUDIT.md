# Gate OL-3 — Ofertas Locales Step 1 CTA Cleanup Audit

## Gate type
BUILD-REQUIRED

## Preflight status
Clean worktree at gate start (no unrelated dirty files).

## Files inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`

## Files changed

- `OfertasLocalesApplicationClient.tsx` — exposure CTA strengthened; partner panels removed
- `ofertasLocalesApplicationCopy.ts` — new exposure body + CTA keys
- `OFERTAS_LOCALES_OL3_STEP1_CTA_CLEANUP_PLAN.md` — new
- `OFERTAS_LOCALES_OL3_STEP1_CTA_CLEANUP_AUDIT.md` — new
- `scripts/ofertas-locales-ol3-step1-cta-cleanup-audit.ts` — new
- `package.json` — audit script

## Exposure CTA result

Single Step 1 callout with updated ES/EN copy and **Hablar con Leonix** / **Talk to Leonix** linking to existing contact href.

## Partner CTA removal result

Public partner panels removed from Steps 1, 6, and 7 review. `contactPartnerHref` removed from application client.

## Backend preservation result

`isMagazinePickupPartner`, publish mapper partner fields, and partner pricing constants unchanged.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Gate OL-3 naming | TRUE | This audit |
| Step 1 CTA panels audited | TRUE | Plan + client inspection |
| ¿Quieres más exposición? remains | TRUE | step1MoreExposureTitle |
| Exposure mentions magazine | TRUE | revista impresa / print magazine |
| Exposure mentions featured visibility | TRUE | ubicación destacada / featured placement |
| Exposure mentions newsletter/social/campaigns | TRUE | Body copy |
| No guaranteed placement promise | TRUE | Contact-only CTA |
| Public ES partner panel removed | TRUE | No leonixPartnerTitle in client |
| Public EN partner panel removed | TRUE | Same |
| Partner backend not destructively removed | TRUE | Types + mapper intact |
| Partner internal/sales-controlled | TRUE | Plan note |
| No payment/Stripe changes | TRUE | git diff |
| No admin/dashboard changes | TRUE | git diff |
| No public results changes | TRUE | git diff |
| No AI/upload changes | TRUE | git diff |
| No unrelated categories | TRUE | git diff |
| No Supabase migration | TRUE | git diff |
| Audit script passed | TRUE | npm run |
| Build passed | TRUE | npm run build |
| No stage/commit/push | TRUE | Manual gate rule |

## Manual QA checklist

- [ ] `/publicar/ofertas-locales?lang=es` Step 1 — one exposure panel
- [ ] `/publicar/ofertas-locales?lang=en` Step 1 — one exposure panel
- [ ] CTA opens contact with exposure source
- [ ] Step 6 — no partner panel
- [ ] Step 7 review — exposure summary only

## Risks / deferred work

- Partner copy keys remain in copy module for internal references (`magazinePartnerHelper`); not rendered in application UI.
- Admin may still set partner flags on approved listings.

## Next recommended gate

Gate OL-4 — Ofertas Locales — Step 5 Upload + AI Source Logic
