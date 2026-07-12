# LEONIX WEBSITE TRANSLATION LAUNCH READINESS CHECKLIST

Gate: `LEONIX-ALL-CATEGORIES-LANDING-APPLICATION-PREVIEW-TRANSLATION-BATCH2-FINAL1`  
Owner: Chuy (final QA)  
Official languages: **ES, EN, PT, TL**

## Platform & Language Policy

- [ ] Official public languages are **ES / EN / PT / TL** only
- [ ] Hidden future languages (VI, ZH, AR, PA, FA, JA, HI, RU, etc.) are **not** in public selectors
- [ ] Unsupported `?lang=` values fall back safely (VI → EN chrome, default ES)
- [ ] Google Translate / browser translation messaging is helper-only (header/QR), not auto-applied to listings
- [ ] User-generated listing content unchanged across all `?lang=` values
- [ ] Green production on Vercel confirmed before sign-off

## Global Surfaces

- [ ] Homepage `?lang=es` — Spanish chrome
- [ ] Homepage `?lang=en` — English chrome
- [ ] Homepage `?lang=pt` — PT route preserved, EN UI fallback where no PT dictionary
- [ ] Homepage `?lang=tl` — TL route preserved, EN UI fallback
- [ ] Homepage `?lang=vi` — safe fallback (EN chrome), VI not in selector
- [ ] QR translator copy matches launch language policy
- [ ] Header language switcher shows ES/EN/PT/TL only

## Per-Category QA (repeat ES + EN; spot-check PT/TL/VI)

For each category verify: **landing → application → preview → results/detail/output**

### Restaurantes ✅ (prior gate)
- [ ] `/clasificados/restaurantes?lang=es|en`
- [ ] `/publicar/restaurantes?lang=es|en`
- [ ] Preview + publish chrome
- [ ] Results filters + cards

### Servicios
- [ ] `/clasificados/servicios?lang=es|en`
- [ ] `/clasificados/servicios/resultados?lang=es|en`
- [ ] `/clasificados/publicar/servicios?lang=es|en`
- [ ] Preview shell + public card/detail

### Autos
- [ ] `/clasificados/autos?lang=es|en`
- [ ] `/clasificados/autos/resultados?lang=es|en`
- [ ] `/publicar/autos/privado` and `/publicar/autos/negocios?lang=es|en`
- [ ] Preview + pago exito/cancelado/error
- [ ] `/clasificados/autos/vehiculo/[id]?lang=es|en`

### Empleos
- [ ] `/clasificados/empleos?lang=es|en`
- [ ] `/clasificados/empleos/resultados?lang=es|en`
- [ ] `/publicar/empleos/quick|premium|feria?lang=es|en`
- [ ] Quick/premium/feria preview `?from=publicar`
- [ ] `/clasificados/empleos/[slug]?lang=es|en`

### Rentas
- [ ] `/clasificados/rentas?lang=es|en`
- [ ] `/clasificados/rentas/results?lang=es|en`
- [ ] `/clasificados/publicar/rentas/privado|negocio?lang=es|en`
- [ ] Preview + listing detail

### Bienes Raíces
- [ ] `/clasificados/bienes-raices?lang=es|en`
- [ ] `/clasificados/publicar/bienes-raices?lang=es|en`
- [ ] Privado + negocio preview
- [ ] Public anuncio/detail output

### En Venta / Varios
- [ ] `/clasificados/en-venta?lang=es|en`
- [ ] `/clasificados/publicar/en-venta/free|pro?lang=es|en`
- [ ] Preview + results/card chrome

### Comunidad
- [ ] `/clasificados/comunidad?lang=es|en`
- [ ] `/clasificados/publicar/comunidad?lang=es|en`
- [ ] Preview + published output

### Clases
- [ ] `/clasificados/clases?lang=es|en`
- [ ] `/clasificados/publicar/clases?lang=es|en`
- [ ] Preview + published output

### Ofertas Locales
- [ ] `/clasificados/ofertas-locales?lang=es|en`
- [ ] Application/preview if public
- [ ] `/clasificados/ofertas-locales/[id]?lang=es|en`

## PT/TL / VI Fallback QA

- [ ] `?lang=pt` — route param preserved in links; UI chrome English where no PT dictionary
- [ ] `?lang=tl` — same honest fallback
- [ ] `?lang=vi` — no VI in selector; chrome falls back safely
- [ ] Edit/preview/publish links preserve `routeLang` through handoff

## Content Protection

- [ ] Business names unchanged
- [ ] Owner/contact names unchanged
- [ ] Addresses, phones, emails, URLs unchanged
- [ ] User descriptions unchanged
- [ ] Menu items / offers / typed services unchanged

## Automated Checks (Batch 2)

- [x] `npx tsx scripts/verify-leonix-language-metadata.ts` — **PASS**
- [x] `npm run typecheck` — edited app files clean; pre-existing e2e spec errors unrelated

## Sign-Off

- [ ] Coach / architect review
- [ ] **Chuy final QA** — all categories above spot-checked
- [ ] Launch decision recorded
