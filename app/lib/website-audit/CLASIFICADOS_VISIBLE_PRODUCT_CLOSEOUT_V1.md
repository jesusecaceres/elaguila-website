# Clasificados Visible Product Closeout V1

**Task:** `CLASIFICADOS-LANDING-RESULTS-VISIBLE-PRODUCT-CLOSEOUT-V1`  
**Date:** 2026-07-02

## 1. Task classification

| Field | Value |
|---|---|
| Classification | BATTLEFIELD SCOPED BUILD — VISIBLE PRODUCT CLOSEOUT |
| Why | Prior shell work passed build but landing pages looked unchanged in browser — compact gateway + results carryover needed |
| Scope expanded | NO — visible layout/spacing/CTA placement only |

## 2. Visible standard

### Landing
- Compact top gateway (no min-h-screen empty pages)
- Search shell above the fold
- Primary + browse + publish CTAs near search
- Quick chips close to search
- Preview sections capped (4 items) — full feed on results only
- Useful next section within ~1 viewport of search

### Results
- Same search DNA as landing
- Refine eyebrow + panel
- Filters via drawer/details
- Listings directly under shell
- Pagination/load-more at bottom when real

## 3. Files changed

| File | Visible purpose |
|---|---|
| `categoryStandardTheme.ts` | Reduced top padding; removed min-h-screen empty landing |
| `CategoryStandardLandingPageShell.tsx` | Consistent 1080px width |
| `CategoryStandardResultsPageShell.tsx` | Consistent 1080px width |
| `CategoryStandardResultsChrome.tsx` | Tighter spacing; custom CTA slot; compact children wrapper |
| `CategoryStandardCtaRow.tsx` | Aligned button heights to Rentas |
| `CategoryStandardLandingPage.tsx` | Pass hideBrowse/hideCta/ctaSlot props |
| `EmpleosLandingPageClient.tsx` | Single shell — categories + jobs inside landing (no orphan section) |
| `empleosLandingUi.tsx` | Reduced section gap (mt-9 → mt-5) |
| `LatestJobsAndEmployer.tsx` | Tighter grid gap |
| `BienesRaicesLandingView.tsx` | Full-width gateway; aligned triple CTA row; removed redundant nav |
| `CategoryRecentListings.tsx` | Preview limit 4; compact grid |
| `clases/page.tsx` | Preview cap + clearer title |
| `comunidad/page.tsx` | Preview cap + clearer title |

## 4. Landing compactness table

| Category | Compact top shell | CTAs above fold | No huge whitespace | Useful next section close | Status |
|---|---|---|---|---|---|
| empleos | YES | YES | YES | YES | Fixed V1 |
| bienes-raices | YES | YES | YES | YES | Fixed V1 |
| clases | YES | YES | YES | YES | Fixed V1 |
| comunidad | YES | YES | YES | YES | Fixed V1 |
| busco | YES | YES | OK | OK | Prior V1 shell OK |
| mascotas | YES | YES | OK | OK | Prior V1 shell OK |
| servicios | OK | OK | OK | OK | Spot-check |
| restaurantes | OK | OK | OK | OK | Prior refine panel |
| en-venta | OK | OK | OK | OK | Prior refine panel |
| autos | OK | OK | OK | OK | Prior refine panel |
| viajes | OK | OK | OK | OK | Prior refine panel |
| rentas | YES | YES | YES | YES | Baseline — spot-check only |

## 5. Results carryover table

| Category | Same shell DNA | Filters near top | Active summary | Results under shell | Bottom pagination | Status |
|---|---|---|---|---|---|---|
| empleos | YES | YES | YES | YES | N/A | V2 shell |
| bienes-raices | YES | YES | YES | YES | YES | V2 shell |
| clases/comunidad | YES | YES | partial | YES | N/A | V1+V2 |
| busco/mascotas | YES | YES | partial | YES | N/A | V1 |
| servicios–viajes | YES | YES | partial | YES | varies | V2 refine |

## 6. CTA truth table

| Category | Search | Browse | Publish | Extra | All real |
|---|---|---|---|---|---|
| empleos | Buscar | Ver todos (in search) | Publicar empleo | — | YES |
| bienes-raices | Buscar | Ver propiedades | Negocio + Privado | Buscar propiedades | YES |
| clases | Buscar | Ver todos | Publicar clase | — | YES |
| comunidad | Buscar | Ver todos | Publicar aviso | — | YES |

## 7. Manual QA routes

Primary:
- `/clasificados/empleos?lang=es`
- `/clasificados/bienes-raices?lang=es`
- `/clasificados/clases?lang=es`
- `/clasificados/comunidad?lang=es`

Results:
- `/clasificados/empleos/results?lang=es`
- `/clasificados/bienes-raices/resultados?lang=es`
- `/clasificados/clases/results?lang=es`
- `/clasificados/comunidad/results?lang=es`

## 8. Remaining non-blockers

- Servicios/restaurantes/en-venta/autos/viajes landing hero atmospheres unchanged (custom shells)
- Empleos employer sidebar on landing could be further compacted in future pass
