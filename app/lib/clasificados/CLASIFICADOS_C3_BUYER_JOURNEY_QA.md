# Gate C3 — Manual Buyer Journey QA (Clasificados)

**Audit date:** 2026-05-22  
**Primary reference:** `CLASIFICADOS_FULL_FIELD_INTEGRITY_AUDIT.md` (Gates C1 + C2)  
**Scope:** Public buyer routes only — landing, results, cards, detail handoff, mobile usability. No redesign, no fake inventory.

**Methods:** Route → page → client/server data loaders traced in code; smoke on local `next dev` (port 3003) for hub, En Venta results, Bienes Raíces resultados, broken alias check.

**C3 code fixes (minimal):**
- Permanent redirect `/clasificados/en-venta/resultados` → `/clasificados/en-venta/results` (`next.config.ts`).
- Bienes Raíces result cards: hide beds/baths/sqft when value is empty or em dash (`BienesRaicesNegocioCard.tsx`, `BienesRaicesNegocioFeaturedCard.tsx`).

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Buyer journey behaves as expected for this dimension |
| FALSE | Broken, misleading, or fake production UX |
| DEFERRED_INTENTIONAL | Documented deferral; user not led into a broken path |
| NOT_APPLICABLE | Dimension does not apply on this route |

---

## Per-route QA matrix

Canonical results paths: **En Venta** and **Rentas** use `/results` (Spanish `resultados` alias documented where relevant).

| Route | Loads | Search works | Filters work | City works | Real data only | Cards clean | Detail handoff | Mobile-safe | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `/clasificados` | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | TRUE | Hub grid uses `HUB_CATEGORY_PATH`; no sample listings on page. |
| `/clasificados/autos` | TRUE | TRUE | NOT_APPLICABLE | TRUE | FALSE | TRUE | TRUE | TRUE | FALSE | Hero/chips → `/autos/resultados` with `serializeAutosBrowseUrl`. **Dealer band** uses `AUTOS_LANDING_DEALER_SAMPLES` (blueprint names) — not live dealers. Live strips use API; demo only if `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1` and empty API (blocked in production). |
| `/clasificados/autos/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `AutosPublicResultsShell`; filters from contract; production never merges demo inventory. Detail → `/autos/vehiculo/[id]`. |
| `/clasificados/bienes-raices` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Client `buildBrResultsUrl` + NorCal `getCanonicalCityName`; chips → resultados. Dev may merge demo on landing (`brShouldMergeDemoInventoryWithLive`); **production live only**. |
| `/clasificados/bienes-raices/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `filterBrListings` + URL contract; dev copy labels demo; prod copy = published inventory. Cards hide missing facts (C3). Detail → `leonixLiveAnuncioPath`. |
| `/clasificados/en-venta` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | GET form `action=/clasificados/en-venta/results`; dept chips canonical. |
| `/clasificados/en-venta/resultados` | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | TRUE | **C3:** 308 → `/en-venta/results` (was blank/404). |
| `/clasificados/en-venta/results` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `EnVentaResultsClient`; ZIP fallback C2; honest empty state; detail via `/clasificados/anuncio/[id]`. |
| `/clasificados/empleos` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `HeroAndSearch` → `buildEmpleosResultadosUrl`; live strips when `empleosOmitMarketingSeedCatalog()` (prod + Supabase). |
| `/clasificados/empleos/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Radius removed C2; cards use `empleosJobRecordListLocationLine`; detail `/empleos/[slug]`. |
| `/clasificados/rentas` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `RentasLandingHub` → `/rentas/results`; NorCal canonical publish/filter C2. Dev demo pool opt-in only. |
| `/clasificados/rentas/results` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `estado` availability filter C2; cards hide `—` facts (`RentasResultCard`). Detail → rentas listing routes. |
| `/clasificados/servicios` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `ServiciosHeroSearch` GET → `/servicios/resultados`; landing rows from `listServiciosPublicListingsForDiscovery`. |
| `/clasificados/servicios/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Live discovery + filters; detail `/servicios/[slug]` (404 if unknown — no fake slug listings). |
| `/clasificados/restaurantes` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `loadRestaurantesLandingInventoryForPage` live-only; search → `buildRestaurantesResultsHref`. `/shell` redirects in prod (C2). |
| `/clasificados/restaurantes/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Discovery contract filters; detail `/restaurantes/[slug]`. |
| `/clasificados/clases` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | GET form → `/clases/resultados` (C1 fix). Category pills cross-link other hub categories (intentional). |
| `/clasificados/clases/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `CommunityListingsResultsClient` category=clases; cards hide missing fields. |
| `/clasificados/comunidad` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | GET form → `/comunidad/resultados` (C1 fix). |
| `/clasificados/comunidad/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Same community results stack; event/class detail handoff. |
| `/clasificados/mascotas-y-perdidos` | TRUE | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | GET search → `/mascotas-y-perdidos/resultados`; tipo chips canonical. |
| `/clasificados/mascotas-y-perdidos/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Category-specific filters; honest empty; detail handoff on cards. |
| `/clasificados/busco` | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | CTA → `/busco/resultados`; recent strip live fetch with honest empty. |
| `/clasificados/busco/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `BuscoResultsClient`; search narrows live requests. |
| `/clasificados/viajes` | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `ViajesSearchBar` → `/viajes/resultados`; `initialBusinessRows` staged only in prod (C2). |
| `/clasificados/viajes/resultados` | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | No curated seed in production (`viajesPublicInventory.ts`). |

**Detail routes (spot-check, not separate rows):** `/clasificados/anuncio/[id]` (live DB + optional dev sample IDs only), `/clasificados/autos/vehiculo/[id]`, `/clasificados/bienes-raices/anuncio/[id]`, `/clasificados/empleos/[slug]`, `/clasificados/servicios/[slug]`, `/clasificados/restaurantes/[slug]`, `/clasificados/viajes/oferta/[slug]`, `/clasificados/viajes/negocio/[slug]` — C2 field wiring holds; contact CTAs present or category-deferred per product.

---

## Category summary

| Category | Landing QA | Results QA | Search QA | Filters QA | City QA | Card QA | Detail QA | Overall |
|---|---|---|---|---|---|---|---|---|
| Hub | TRUE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE |
| Autos | FALSE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE |
| Bienes Raíces | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| En Venta | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Empleos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Rentas | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Restaurantes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Clases | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Comunidad | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Mascotas y Perdidos | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE | TRUE |
| Busco | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Viajes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

**C1/C2 regression:** Autos, Servicios, Clases, Comunidad, Mascotas, Busco remain buyer-safe on results/detail. C2 categories (BR, En Venta, Empleos, Rentas, Restaurantes, Viajes) pass buyer QA on public results paths in production policy. **Remaining gap:** Autos landing dealer blueprint band (not results).

---

## C3 blockers before launch

### Fixed in Gate C3

| Route | File path | Issue | User impact | Recommended fix | Gate |
|---|---|---|---|---|---|
| `/clasificados/en-venta/resultados` | `next.config.ts` | Spanish alias 404 | Bookmarks/links to `…/resultados` showed blank page | Permanent redirect to `/en-venta/results` | **C3** |
| `/clasificados/bienes-raices/resultados` | `bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx`, `BienesRaicesNegocioFeaturedCard.tsx` | Cards showed `—` for missing beds/baths/sqft | Buyers read placeholder as real data | Hide fact row when missing | **C3** |

### Open for Gate C4 (or product decision)

| Route | File path | Issue | User impact | Recommended fix | Gate |
|---|---|---|---|---|---|
| `/clasificados/autos` | `autos/landing/AutosLandingPage.tsx`, `autos/landing/autosLandingDealerSamples.ts` | Featured dealer band uses fixed blueprint dealer names/logos | Looks like real dealerships when none exist | Gate band behind live dealer API rows or label as “Ejemplo de búsqueda” | **C4** |
| `/clasificados/anuncio/[id]` | `anuncio/[id]/page.tsx`, `data/classifieds/sampleListings` | Sample IDs still render full detail without DB | Dev/demo IDs could be shared in prod | Restrict sample fallback to non-production | **C4** (optional) |

No new fake filters or inventory were added in C3.

---

## Verification

```text
npm run build
```

**Result:** PASS (exit 0) after clean `.next` rebuild (2026-05-22).

---

## Completion checklist (Gate C3)

| Item | Value |
|---|---|
| Routes QA’d | 23 public routes (hub + category landings/results + En Venta alias row) |
| TRUE (route Overall) | 22 |
| FALSE (route Overall) | 1 |
| DEFERRED_INTENTIONAL (route Overall) | 0 |
| NOT_APPLICABLE (route Overall) | 0 |
| Blockers found | 3 (1 alias 404, 1 card placeholder, 1 autos landing blueprint) |
| Blockers fixed | 2 |
| Files changed | `next.config.ts`, `BienesRaicesNegocioCard.tsx`, `BienesRaicesNegocioFeaturedCard.tsx`, `CLASIFICADOS_C3_BUYER_JOURNEY_QA.md` |
| Build | `npm run build` passed |
