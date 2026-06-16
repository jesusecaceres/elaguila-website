# Gate OL-7B — Production AI Schema + Candidate Extraction — Audit

## Summary

| Check | Result |
|-------|--------|
| Production blocker | `public.ofertas_locales` missing — migration never applied |
| Schema fix | `20260616130000_ofertas_locales_ai_production_bootstrap.sql` |
| Scan route | Uses real storage + Document AI; schema errors documented |
| Parser | Real OCR lines; no fake candidates |
| Review UI | Editable fields; Keep/Remove/Save for review |
| Public safety | Approved+active filter preserved |

## IMPORTANT — Supabase deployment

**Vercel deploy alone is not enough.** Apply migration:

`supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql`

To production via Supabase Dashboard SQL Editor or `supabase db push`.

## Files changed

- `supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql` (new)
- `ofertasLocalesSupabaseSchema.ts` (new)
- `ofertasLocalesDocumentAiClient.ts` — page lines + bbox
- `ofertasLocalesAiNormalizer.ts` — real parser
- `ofertasLocalesScanApiHandler.ts` — schema errors, OCR summary
- `scan-prep/route.ts` — schema errors
- `ofertasLocalesAiDbMapper.ts`, `ofertasLocalesItemReviewMapper.ts`, `ofertasLocalesTypes.ts`
- `OfertasLocalesAiItemReviewPanel.tsx`, `ofertasLocalesApplicationCopy.ts`
