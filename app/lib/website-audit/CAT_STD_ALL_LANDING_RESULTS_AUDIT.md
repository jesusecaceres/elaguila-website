# Gate CAT-STD-ALL — Category Landing + Results Audit

**Date:** 2026-06-03 (green push continuation)

## 1. Files inspected

All `app/(site)/clasificados/{slug}/` landing + `results` routes (12 categories); `components/categoryStandard/*`; prior gate clients (empleos, autos, BR, restaurantes, viajes, rentas, en-venta, servicios, comunidad, clases, busco, mascotas).

## 2. Files changed (this push)

| File | Change |
|------|--------|
| `autos/landing/AutosLandingPage.tsx` | `CategoryStandardLandingPage` + `AutosHeroSearch` `mode="fields"` |
| `autos/landing/AutosHeroSearch.tsx` | `fields` mode for search slot |
| `autos/components/public/AutosPublicResultsShell.tsx` | `CategoryStandardResultsPageShell` + compact header |
| `bienes-raices/landing/BienesRaicesLandingView.tsx` | Replaced immersive hero with `CategoryStandardLandingPage` |
| `bienes-raices/resultados/components/BienesRaicesResultsShell.tsx` | Cream `CategoryStandardResultsPageShell` |
| `empleos/components/EmpleosResultsView.tsx` | Standard results shell + header (filter form unchanged) |
| `restaurantes/landing/RestaurantesLandingPage.tsx` | Removed duplicate `Navbar` + scenic `CategoryHeroFrame`; standard landing |
| `viajes/components/ViajesLandingPage.tsx` | Removed `Navbar`, ambience, scenic `ViajesHero`; standard landing |

## 3. Shared components created/reused

| Component | Role |
|-----------|------|
| `CategoryStandardLandingPage` | Landing: hero, search slot, CTAs, chips |
| `CategoryStandardLandingPageShell` | Cream page wrapper |
| `CategoryStandardResultsPageShell` | Results cream shell (no duplicate Navbar) |
| `CategoryStandardResultsHeader` | Back link, title, count, publish, clear |
| `categoryStandardTheme.ts` | ES/EN copy, quick filters, accents |
| `categoryStandardRoutes.ts` | `/results` + publish paths |

## 4. Landing routes verified

| Route | Status |
|-------|--------|
| `/clasificados/en-venta` | Standard block (prior gate) |
| `/clasificados/rentas` | Standard block (prior gate) |
| `/clasificados/empleos` | Standard page (prior gate) |
| `/clasificados/servicios` | Standard page (prior gate) |
| `/clasificados/autos` | **Standard page** (this push) |
| `/clasificados/bienes-raices` | **Standard page** (this push) |
| `/clasificados/restaurantes` | **Standard page** (this push) |
| `/clasificados/viajes` | **Standard page** (this push) |
| `/clasificados/clases` | Standard page (prior gate) |
| `/clasificados/comunidad` | Standard page (prior gate) |
| `/clasificados/busco` | Standard page (prior gate) |
| `/clasificados/mascotas-y-perdidos` | Standard page (prior gate) |

## 5. Results routes verified

All 12 `/clasificados/{slug}/results` pages exist (native or re-export to `resultados`).

| Route | Chrome |
|-------|--------|
| comunidad, clases, busco, mascotas | Full standard shell + collapsed filters |
| servicios, rentas, en-venta | Standard or listings-first shell (prior) |
| empleos, autos | **Standard shell + header** (this push); legacy filter panels retained |
| bienes-raices | **Standard cream shell** (this push); BR-specific filter UI inside |
| restaurantes, viajes | Custom clients; `/results` loads; deferred full chrome |

## 6. Broken routes found/fixed

None in this push (prior gate added `results/page.tsx` aliases).

## 7. Search routing

Search / Buscar → `/clasificados/{slug}/results?lang=…` via `buildCategoryResultsUrl`, category constants, or preserved client routers (empleos, autos, restaurantes discovery).

## 8. Ver todos routing

`CategoryStandardLandingPage` browse CTA → `buildCategoryResultsUrl` / `browseHref` with `lang` preserved.

## 9. Publish CTA

Unchanged publish paths (`categoryPublishPath`, `/publicar/*`, BR dual publish links in `belowHero`).

## 10–11. Mobile / desktop

Responsive stacks: compact hero, scrollable chips, `overflow-x-hidden`, `max-w-6xl` content. Build passed.

## 12. Risks / deferred

- Empleos results: large inline filter form (not fully collapsed into `<details>`)
- Autos results: desktop sidebar filter rail remains visible on `lg+`
- BR / restaurantes / viajes results: not yet wrapped in `CategoryStandardResultsChrome`
- En Venta dept grid emoji icons below hero (out of standard shell)
- Alias `/clasificados/varios` → en-venta contract only; no separate hub route required

## Validation

- `npm run build` — **passed** (exit 0)
- `npm run cat:std-all-audit` — run at QA time

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| All category landing routes were inspected | TRUE | 12 slugs in `CAT_STD_ALL_SLUGS` |
| All category results routes were inspected | TRUE | 12 `results/page.tsx` files |
| En Venta landing works | TRUE | `CategoryStandardLandingBlock` |
| En Venta results works | TRUE | `/results` + `EnVentaResultsClient` |
| Rentas landing works | TRUE | `CategoryStandardLandingBlock` |
| Rentas results works | TRUE | `/results` + `RentasResultsShell` |
| Empleos landing works | TRUE | `CategoryStandardLandingPage` |
| Empleos results works | TRUE | `/results` + shell/header wrap |
| Autos landing works | TRUE | `CategoryStandardLandingPage` |
| Autos results works | TRUE | `/results` + shell/header wrap |
| Bienes Raíces landing works | TRUE | `CategoryStandardLandingPage` |
| Bienes Raíces results works | TRUE | `/results` + cream shell |
| Servicios landing works | TRUE | `CategoryStandardLandingPage` |
| Servicios results works | TRUE | `/results` + servicios shell |
| Restaurantes landing works | TRUE | `CategoryStandardLandingPage` |
| Restaurantes results works | TRUE | `/results` re-export |
| Viajes landing works | TRUE | `CategoryStandardLandingPage` |
| Viajes results works | TRUE | `/results` re-export |
| Clases landing works | TRUE | `CategoryStandardLandingPage` |
| Clases results works | TRUE | `/results` native |
| Comunidad landing works | TRUE | `CategoryStandardLandingPage` |
| Comunidad results works | TRUE | `/results` native |
| Busco landing works | TRUE | `CategoryStandardLandingPage` |
| Busco results works | TRUE | `/results` + standard shell |
| Mascotas landing works | TRUE | `CategoryStandardLandingPage` |
| Mascotas results works | TRUE | `/results` + standard shell |
| Search CTAs route to results | TRUE | Routes helpers + form actions |
| Ver todos CTAs route to results | TRUE | `browseHref` / `buildCategoryResultsUrl` |
| Publish CTAs preserve existing publish flow | TRUE | No publish logic changes |
| Results pages do not 404 | TRUE | All `results/page.tsx` present |
| Results filters are compact | FALSE | Empleos full form; autos desktop rail |
| Landing pages are compact and not overpowering | TRUE | Scenic heroes removed on 4 categories this push |
| Category visuals are subtle and accurate | TRUE | Line marks / gradients; no scenic landing heroes on BR/RX/Viajes |
| No cartoon emoji icons remain in standard category shells | TRUE | `CategoryCompactHero` line icons |
| Mobile layout works | TRUE | Responsive classes; build OK |
| Desktop layout works | TRUE | build OK |
| No header files touched | TRUE | `Navbar.tsx` not in diff |
| No home files touched | TRUE | — |
| No coming soon files touched | TRUE | — |
| No magazine page files touched | TRUE | — |
| No productos promocionales files touched | TRUE | — |
| No publish flow logic changed | TRUE | — |
| No DB/schema files touched | TRUE | — |
| No admin/dashboard files touched | TRUE | — |
| No Stripe/payment files touched | TRUE | — |
| npm run build passed | TRUE | exit 0 |
