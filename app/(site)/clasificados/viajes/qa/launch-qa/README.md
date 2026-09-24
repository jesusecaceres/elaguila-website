# Viajes Launch QA — Evidence Index

Branch: `integration/viajes-launch-qa-2026-08`  
Base commit: `f563cdf336173625138c8f427d57754f92dc592f`  
Owner QA server: `http://localhost:3003`  
Screenshots captured from production smoke server `:3103` (same build).

## Screenshot index

| File | Route | Viewport | Fixture/source | Status | Auth | Globalization |
| --- | --- | --- | --- | --- | --- | --- |
| `landing-390.png` | `/clasificados/viajes?lang=es` | 390 | public landing | PASS | public | none |
| `landing-768.png` | `/clasificados/viajes?lang=es` | 768 | public landing | PASS | public | none |
| `landing-1440.png` | `/clasificados/viajes?lang=es` | 1440 | public landing | PASS | public | none |
| `results-default-390.png` | `/clasificados/viajes/resultados?lang=es` | 390 | live approved inventory | PASS | public | none |
| `results-default-768.png` | `/clasificados/viajes/resultados?lang=es` | 768 | live approved inventory | PASS | public | none |
| `results-default-1440.png` | `/clasificados/viajes/resultados?lang=es` | 1440 | live approved inventory | PASS | public | none |
| `results-filtered-390.png` | `resultados?budget=economico` | 390 | filtered live | PASS | public | none |
| `results-filtered-1440.png` | `resultados?budget=economico` | 1440 | filtered live | PASS | public | none |
| `results-sorted-390.png` | `resultados?sort=newest` | 390 | sorted live | PASS | public | none |
| `results-sorted-1440.png` | `resultados?sort=newest` | 1440 | sorted live | PASS | public | none |
| `results-empty-390.png` | `resultados?q=__no_match_empty_state_qa__` | 390 | empty | PASS | public | none |
| `results-empty-1440.png` | `resultados?q=__no_match_empty_state_qa__` | 1440 | empty | PASS | public | none |
| `offer-detail-full-390.png` | `/clasificados/viajes/oferta/vj-pri-1785892005889-escapada-privada` | 390 | live private QA row | PASS | public | none |
| `offer-detail-full-1440.png` | same | 1440 | live private QA row | PASS | public | none |
| `offer-detail-minimal-390.png` | same (second live card unavailable) | 390 | live private QA row | PASS (same source) | public | none |
| `offer-detail-minimal-1440.png` | same | 1440 | live private QA row | PASS (same source) | public | none |
| `provider-390.png` | `/clasificados/viajes/negocio/agencia-vj-bus-1785891474965` | 390 | live business profile | PASS | public | none |
| `provider-1440.png` | same | 1440 | live business profile | PASS | public | none |
| `business-publisher-step1-390.png` | `/publicar/viajes/negocios` | 390 | publisher shell | PASS (shell) | may show auth gate | none |
| `business-publisher-review-1440.png` | `/publicar/viajes/negocios?step=5` | 1440 | publisher shell | PASS (shell) | may show auth gate | none |
| `private-publisher-step1-390.png` | `/publicar/viajes/privado` | 390 | publisher shell | PASS (shell) | may show auth gate | none |
| `private-publisher-review-1440.png` | `/publicar/viajes/privado?step=4` | 1440 | publisher shell | PASS (shell) | may show auth gate | none |
| Business steps 2–5 signed-in media/submit | `/publicar/viajes/negocios` | 390/1440 | owner session | AUTHENTICATED OWNER CAPTURE REQUIRED | auth | none |
| Private steps 2–4 signed-in | `/publicar/viajes/privado` | 390/1440 | owner session | AUTHENTICATED OWNER CAPTURE REQUIRED | auth | none |
| Dashboard / admin | `/dashboard/viajes`, admin Viajes queue | — | owner/staff | AUTHENTICATED OWNER CAPTURE REQUIRED | auth | likes/analytics/sitemap = Globalization |

All listed public screenshots: **no horizontal overflow** (`PASS` from capture script). Authenticated surfaces are never fabricated.

## Fixtures

See `fixtures.ts` for the 15 QA fixture kinds.

## Owner checklist

See `OWNER-QA.md`.

## Capture command

```bash
npx next start -p 3103
node app/(site)/clasificados/viajes/qa/launch-qa/capture-screenshots.mjs
```
