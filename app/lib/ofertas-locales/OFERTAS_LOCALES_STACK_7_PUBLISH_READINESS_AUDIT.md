# Stack 7 — Publish Readiness Audit

## Delivered

- `ofertas_locales` table + RLS (owner only; no public SELECT)
- `ofertasLocalesPublishMapper.ts` server validation + insert mapping
- `POST /api/ofertas-locales/publish` → `pending_review` insert
- Draft UI “Enviar para revisión” with success confirmation

## Out of scope

- Public results/detail pages, admin dashboard, payment, analytics, auto-approve

## Verify

```bash
npm run ofertas-locales:stack-7-publish-readiness-audit
npm run build
```
