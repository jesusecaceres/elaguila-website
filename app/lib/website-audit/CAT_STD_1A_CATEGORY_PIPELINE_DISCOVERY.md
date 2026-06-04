# Gate CAT-STD-1A — Category Pipeline Discovery + Standard Shell Foundation

**Date:** 2026-06-04  
**Scope:** Discovery and foundation only — no category page rollout in this gate.

---

## 1. Files inspected

- `app/(site)/clasificados/**` — all `page.tsx` routes, landing/results clients
- `app/(site)/clasificados/components/categoryStandard/**` (existing CAT-STD-ALL foundation)
- `app/(site)/clasificados/components/categoryLanding/**`
- `app/(site)/clasificados/community/**`
- `app/(site)/iglesias/page.tsx`
- `app/(site)/clasificados/components/categoryPipeline/catStd1aPipelineRegistry.ts` (new, read-only)

---

## 2. Files changed (this gate)

| File | Purpose |
|------|---------|
| `app/lib/website-audit/CAT_STD_1A_CATEGORY_PIPELINE_DISCOVERY.md` | This report |
| `app/(site)/clasificados/components/categoryPipeline/catStd1aPipelineRegistry.ts` | Read-only pipeline registry for gates 1B–1F |

**No category `page.tsx` or business-logic files edited.**

---

## 3. Dirty file classification (preflight)

| Classification | Paths |
|----------------|-------|
| **CAT_ALLOWED_WORK** (in progress elsewhere) | `clasificados/busco`, `clases`, `comunidad`, `en-venta`, `mascotas-y-perdidos`, `rentas`, `clasificados/page.tsx`, `hubUrl.ts`, … |
| **LOCKED_DO_NOT_TOUCH** (dirty — not modified by 1A) | `app/(site)/home/HomeMarketingClient.tsx`, `app/(site)/magazine/2026/june/issueContent.ts`, `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx`, `app/(site)/legal/page.tsx` |
| **UNRELATED_PARALLEL_WORK** | Same as locked dirty set above |

Gate 1A did **not** overwrite parallel work.

---

## 4. Category route inventory

| Category | Landing route | Landing file | Results route | Results file | Status |
|----------|---------------|--------------|---------------|--------------|--------|
| En Venta | `/clasificados/en-venta` | `en-venta/page.tsx` | `/clasificados/en-venta/results` | `en-venta/results/page.tsx` | OK |
| Rentas | `/clasificados/rentas` | `rentas/page.tsx` | `/clasificados/rentas/results` | `rentas/results/page.tsx` | OK |
| Empleos | `/clasificados/empleos` | `empleos/page.tsx` | `/clasificados/empleos/results` | `empleos/results/page.tsx` → `resultados/page.tsx` | OK (alias) |
| Autos | `/clasificados/autos` | `autos/page.tsx` | `/clasificados/autos/results` | `autos/results/page.tsx` → `resultados/page.tsx` | OK (alias) |
| Bienes Raíces | `/clasificados/bienes-raices` | `bienes-raices/page.tsx` | `/clasificados/bienes-raices/results` | `bienes-raices/resultados/page.tsx` | OK (alias) |
| Servicios | `/clasificados/servicios` | `servicios/page.tsx` | `/clasificados/servicios/results` | `servicios/resultados/page.tsx` | OK (alias) |
| Restaurantes | `/clasificados/restaurantes` | `restaurantes/page.tsx` | `/clasificados/restaurantes/results` | `restaurantes/resultados/page.tsx` | OK (alias) |
| Comunidad | `/clasificados/comunidad` | `comunidad/page.tsx` | `/clasificados/comunidad/results` | `comunidad/resultados/page.tsx` | OK (alias) |
| Clases | `/clasificados/clases` | `clases/page.tsx` | `/clasificados/clases/results` | `clases/resultados/page.tsx` | OK (alias) |
| Busco | `/clasificados/busco` | `busco/page.tsx` | `/clasificados/busco/results` | `busco/resultados/page.tsx` | OK (alias) |
| Mascotas | `/clasificados/mascotas-y-perdidos` | `mascotas-y-perdidos/page.tsx` | `…/results` | `…/resultados/page.tsx` | OK (canonical slug) |
| Viajes | `/clasificados/viajes` | `viajes/page.tsx` | `/clasificados/viajes/results` | `viajes/resultados/page.tsx` | OK (alias) |
| Iglesias | `/iglesias` | `iglesias/page.tsx` | — | — | Landing only |

**Not found:** `/clasificados/varios`, `/clasificados/mascotas`, `/clasificados/mascotas-perdidos`, `/clasificados/comunidad-y-eventos` as routes (varios is label/SEO alias for en-venta only).

**Also present (out of CAT-STD-1 marketplace scope):** `comida-local`, `negocios`, hub `clasificados/page.tsx`, publish subtree, previews, payment routes.

---

## 5. Category implementation map (summary)

See `catStd1aPipelineRegistry.ts` for machine-readable rows. Highlights:

| Category | Landing shell | Results shell | Risk |
|----------|---------------|---------------|------|
| Comunidad, Clases, Busco, Mascotas | `CategoryStandardLandingPage` | `CategoryStandardResultsPageShell` + shared header/filters | LOW |
| En Venta, Rentas, Empleos, Servicios | Partial standard blocks | Custom / partial chrome | MEDIUM–HIGH |
| Autos, BR, Restaurantes, Viajes | Custom heroes / imagery | Custom shells, sidebar or atmosphere | MEDIUM–HIGH |
| Iglesias | CMS `IglesiasPageClient` | N/A | LOW |

**Publish routes:** `categoryPublishPath()` in `categoryStandardRoutes.ts` (busco → `/publicar/busco/quick`, restaurantes → `/clasificados/restaurantes/publicar`).

**Shared foundation (already in repo — not recreated):**

- `CategoryStandardLandingPage`, `CategoryStandardLandingBlock`, `CategoryCompactHero`
- `CategoryStandardSearchRow`, `CategoryStandardQuickFilterChips`
- `CategoryStandardResultsPageShell`, `CategoryStandardResultsHeader`, `CategoryStandardResultsChrome`
- `categoryStandardTheme.ts`, `categoryStandardRoutes.ts`, `categoryStandardStyles.ts`

Gate 1A **did not** add duplicate `CategoryPageShell.tsx` names — existing `categoryStandard/*` is the approved foundation.

---

## 6. Missing route report

| Expected (user list) | Repo reality |
|----------------------|--------------|
| `/clasificados/mascotas` | **Missing** — use `mascotas-y-perdidos` |
| `/clasificados/varios` | **Missing** — en-venta is canonical |
| `/clasificados/comunidad-y-eventos` | **Missing** — `comunidad` is canonical |
| `/iglesias/results` | **Missing** — not required for 1A |
| All `*/results` for 12 slugs | **Present** (native or re-export to `resultados`) |

---

## 7. Existing visual / system issues

- **Inconsistent heroes:** Autos, BR, Restaurantes, Viajes still use large/custom or scenic bands on some passes.
- **Emoji in production catalog:** `ProductCatalog` is out of scope; Autos category tabs use emoji in `CATEGORY_ICONS` in older autos paths — separate from this gate.
- **Dual results segments:** `results` (QA/canonical EN path) + `resultados` (ES-first links) — must preserve both in rollout.
- **Filter wall risk:** Empleos, Autos (desktop rail), Rentas, BR have heavy filter UI.
- **External Unsplash:** Servicios/Restaurantes results still reference remote atmosphere URLs.
- **No generic lion background** in `categoryStandard` theme — good; per-category gradients + `CategoryStandardMark` line icons.

---

## 8. Shared standard foundation result

**No new UI components created** — existing `app/(site)/clasificados/components/categoryStandard/*` is the foundation.

**Added:**

- Read-only registry: `categoryPipeline/catStd1aPipelineRegistry.ts`
- This audit document

**Documented standards** (landing + results + visual flavor) are embedded in sections 7–10 of this file and in `categoryStandardTheme.ts` per-category gradients.

---

## 9. Category visual flavor plan

| Category | Flavor (subtle) |
|----------|-----------------|
| En Venta | Marketplace / items — gold warmth |
| Rentas | Housing green tones |
| Empleos | Blue-gray opportunity |
| Autos | Green/charcoal automotive |
| Bienes Raíces | Bronze property |
| Servicios | Tool/service neutral |
| Restaurantes | Warm dining accent |
| Comunidad | Community green |
| Clases | Learning blue-green |
| Busco | Help/search amber-green |
| Mascotas | Pet notice compassionate tones |
| Viajes | Sky/teal travel |
| Iglesias | Faith/community (CMS shell) |

Rule: gradient + line mark default; muted image only if category-specific and already in pipeline.

---

## 10. Query-param preservation notes

- **Never rename** slug-specific keys (e.g. `RENTAS_QUERY_*`, `AUTOS_BROWSE_URL_KEYS`, empleos `sort`, BR `buildBrResultsUrl` keys).
- **`lang`** must remain on all handoffs (`appendLangToPath`, `buildCategoryResultsUrl`).
- **Results pathname:** `CommunityListingsResultsClient` detects `results` vs `resultados` for form `action` — keep when standardizing.
- **Page/sort:** preserve pagination query keys per category client.

---

## 11. Recommended next safe gates

### CAT-STD-1B — Low-risk landings (polish only)
Comunidad, Clases, Busco, Mascotas-y-perdidos; Iglesias only if aligned with clasificados shell (optional).

### CAT-STD-1C — Marketplace / business landings
En Venta, Servicios, Restaurantes, Autos — hero + search slot only first.

### CAT-STD-1D — Complex transactional
Rentas, Bienes Raíces, Empleos — custom search bars in `searchSlot`; no query contract changes.

### CAT-STD-1E — Results standardization (groups)
1. Comunidad, Clases, Busco, Mascotas (already closest)  
2. Servicios, Restaurantes, Viajes  
3. En Venta, Rentas  
4. Empleos, Autos, BR  

### CAT-STD-1F — Validation
`npm run build`, route QA list below, mobile checklist, `cat:std-all-audit` if still in package.json from prior gate.

---

## 12. Build result

**Skipped by safe-stack plan** — no shared component logic changed; only read-only registry + markdown added. Final build reserved for **CAT-STD-1F** (or first gate that edits TS used by pages).

---

## 13. Manual QA links (later gates)

See gate prompt list (`leonixmedia.com/clasificados/...` and `/iglesias?lang=es`).

---

## 14. Confirmations

- No header/nav, Home, Magazine, Negocios Locales, Recursos Comunitarios, Productos Promocionales, Coming Soon touched  
- No publish flow, DB, admin, Stripe touched  
- No route slug changes  
- No fake listings  
- No files staged / no commit / no push  

---

## 17. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Category routes discovered from repo | TRUE | Glob + page.tsx reads |
| Every found landing route listed | TRUE | §4 table |
| Every found results route listed | TRUE | §4 + aliases |
| Query params inspected | TRUE | Contract files cited |
| Publish routes inspected | TRUE | `categoryStandardRoutes.ts` |
| Listing card components inspected | TRUE | §5 / registry |
| Data sources inspected | TRUE | §5 / registry |
| Missing routes reported | TRUE | §6 |
| No locked files changed | TRUE | Only audit + registry |
| No category logic changed | TRUE | No client edits |
| No search/filter logic changed | TRUE | — |
| No publish flow logic changed | TRUE | — |
| No DB/schema files changed | TRUE | — |
| No fake listings/stats added | TRUE | — |
| Next safe gate plan produced | TRUE | §11 |
