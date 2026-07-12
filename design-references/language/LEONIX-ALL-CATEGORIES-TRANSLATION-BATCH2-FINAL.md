# LEONIX ALL CATEGORIES TRANSLATION BATCH 2 FINAL

Gate: `LEONIX-ALL-CATEGORIES-LANDING-APPLICATION-PREVIEW-TRANSLATION-BATCH2-FINAL1`  
Date: 2026-07-12  
Prior proven pattern: `LEONIX-RESTAURANTES-LANDING-APPLICATION-PREVIEW-TRANSLATION-FINAL-PASS1`

## Executive Summary

Remaining launch-category flows were audited and patched for ES/EN UI chrome using the Restaurantes pattern (`resolveClasificadosPublishLang`, `navCopyLang`, `withClasificadosPublishLang`, shared `clasificadosUiChromeCopy`).

- Official languages remain **ES / EN / PT / TL**.
- Hidden future languages remain inactive in public UI.
- PT/TL route language is preserved; UI chrome honestly falls back to EN via `navCopyLang` where dedicated dictionaries do not exist.
- User listing content (titles, descriptions, contact info, addresses) remains untouched.
- No DeepL or Google Translate API calls were made.
- No database, auth, Stripe, or migration changes.

## Category Coverage Table

| Category | Landing | Results | Application | Preview | Output | Status | Remaining Gap |
|----------|---------|---------|-------------|---------|--------|--------|---------------|
| Restaurantes | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** (prior gate) | Optional metadata title ES-only |
| Servicios | ✅ | ✅ patched | ⚠️ | ✅ | ✅ | **IMPROVED** | Legacy `/servicios/publicar` form; metadata ES-only |
| Autos | ✅ | ✅ | ⚠️ | ✅ | ✅ patched | **IMPROVED** | Full privado/negocios application still uses inline ES/EN; some metadata ES-only |
| Empleos | ✅ | ✅ patched | ✅ patched | ✅ patched | ⚠️ | **IMPROVED** | Detail shell clients (`EmpleoQuickDetailPage`, etc.) still binary lang parse |
| Rentas | ✅ | ✅ patched | ✅ patched | ✅ | ✅ patched | **IMPROVED** | Listing detail client inherits lang from server; demo recovery copy ES-only in places |
| Bienes Raíces | ✅ | ✅ | ⚠️ | ✅ patched | ✅ | **IMPROVED** | Privado form section literals; BR pago clients binary; privado preview recovery ES-only |
| En Venta / Varios | ✅ | ✅ | ✅ patched | ✅ | ✅ | **IMPROVED** | Storefront route is future/coming-soon; metadata ES-only |
| Comunidad | ✅ | ✅ | ✅ | ✅ | ✅ | **READY** | Sched lang binary in canvas (PT/TL → EN fallback OK) |
| Clases | ✅ | ✅ | ✅ | ✅ | ✅ | **READY** | Same sched pattern as Comunidad |
| Ofertas Locales | ✅ | ✅ | ✅ | ⚠️ | ✅ patched | **IMPROVED** | Some preview empty-state copy ES-only |

## Shared Fixes

- `app/lib/clasificados/clasificadosUiChromeCopy.ts` — added `clasificadosTr()` inline bilingual helper; existing preview/publish/category chrome dictionaries unchanged.
- `resolveClasificadosPublishLang` / `resolveClasificadosPublishLangFromSearchParams` applied across server results/detail pages and client publish/preview flows.
- `previewBackToEditLabel()` used in Empleos preview shells.
- `empleosHandoffPreviewUrl()` now accepts `SupportedLang` (route lang preserved in preview handoff).
- Rentas shared sections (`RentasAnuncioFormSection`, `RentasShowingTourSection`) accept explicit `lang` prop — removed `window.location.search` parsing.
- Autos pago success/cancel/error clients split `routeLang` vs `copyLang` via `resolveAutosRouteLang` / `normalizeAutosNegociosLang`.

## Per-Category Fixes

### Servicios
- `servicios/resultados/page.tsx` — server lang via `resolveClasificadosPublishLangFromSearchParams`; pagination preserves `routeLang`.

### Autos
- `autos/vehiculo/[id]/page.tsx`, `autos/dealer/[...]/page.tsx` — server copy lang via resolver.
- `autos/pago/exito|cancelado|error` — route vs copy lang split; hrefs preserve PT/TL.

### Empleos
- `publicar/empleos/quick|premium|feria` application clients — `resolveClasificadosPublishLang`; preview URLs use `routeLang`.
- `empleos/quick|premium|feria-preview` — resolver + `previewBackToEditLabel`; premium/feria shells pass `lang`.
- `empleos/[slug]/page.tsx`, `EmpleosResultsView.tsx` — resolver pattern; nav hrefs use `routeLang`.

### Rentas
- `publicar/rentas/shared/*` — explicit `lang` prop on shared form sections.
- `publicar/rentas/privado|negocio` forms — pass `lang` to shared sections.
- `rentas/results/page.tsx`, `rentas/listing/[id]/page.tsx` — server resolver.

### Bienes Raíces
- `preview/privado|negocio` clients — resolver; publish/live hrefs use `routeLang`.

### En Venta
- `LeonixEnVentaStorefrontApplication.tsx` — resolver + `withClasificadosPublishLang` back link (future storefront draft).

### Ofertas Locales
- `ofertas-locales/[id]/page.tsx` — server resolver for detail chrome/metadata fallbacks.

## Residual Hardcoded Audit

| Search Term | Result | Classification |
|-------------|--------|----------------|
| `lang === "en"` | Many hits in category copy dictionaries (`*Copy.ts`, `labelEs`/`labelEn` pairs) | Dictionary source — not directly rendered |
| `get("lang") === "en"` | Reduced in launch paths; remains in Empleos detail components, BR pago, some Autos application internals | Real visible gap — future spot-fix or Batch 3 |
| `labelEs` | Taxonomy / filter definition files | Dictionary source — rendered via lang-aware helpers where wired |
| `Vista previa` / `Volver a editar` | Centralized in `clasificadosUiChromeCopy` + Empleos preview clients | Translated through helper |
| `Información` / `Contacto` / `Dirección` | Form section titles in BR privado literals, some Autos sections | Real gap in BR privado application — documented |
| `Cocina principal` | Restaurantes-only taxonomy | N/A — Restaurantes complete |
| `No hay` / `Aún no` | Results empty states — bilingual inline in Servicios/Empleos results | Translated through helper/inline ES/EN |
| `resolveClasificadosPublishLang` | Wired in patched files | Pattern applied |
| `navCopyLang` | Used in landing hubs + resolver chain | PT/TL honest EN fallback |

## Remaining Launch Blockers

No **hard** launch blockers in scoped translation surfaces for ES/EN chrome on primary landing → application → preview → results/detail paths. Final manual QA still required for:

- Bienes Raíces privado application section literals (ES visible under `?lang=en`).
- Autos privado/negocios full application inline copy (not pago/output).
- Empleos public detail shell components (binary lang parse).
- Category `metadata` titles/descriptions still Spanish-default on several routes (low SEO risk; not user-visible page chrome).
- BR privado preview recovery panel — Spanish-only copy.

## TRUE/FALSE

- All categories audited: **TRUE**
- ES/EN chrome improved: **TRUE**
- PT/TL fallback honest: **TRUE**
- Hidden languages inactive: **TRUE**
- User content untouched: **TRUE**
- Residual audit complete: **TRUE**
- Ready for final website translation launch QA: **YES**

## Final Decision

`LEONIX_ALL_CATEGORIES_TRANSLATION_BATCH2_FINAL_DONE`

**Final line:** `READY FOR FINAL WEBSITE TRANSLATION LAUNCH QA: YES`
