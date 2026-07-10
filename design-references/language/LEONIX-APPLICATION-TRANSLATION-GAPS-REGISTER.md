# LEONIX APPLICATION TRANSLATION GAPS REGISTER

Gate: `LEONIX-APPLICATION-TRANSLATION-COVERAGE-AUDIT-AND-FIX1` + final pass `LEONIX-RESTAURANTES-LANDING-APPLICATION-PREVIEW-TRANSLATION-FINAL-PASS1`
Date: 2026-07-10
Future batch gate: `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1`

Official languages: `es`, `en`, `pt`, `tl` (PT/TL UI chrome falls back to EN via `navCopyLang` until dedicated dictionaries exist).

**Restaurantes status (final pass):** Landing, application (sections A–K + Final), preview, publish/checkout chrome, and primary results filters — **ES/EN complete**. See [`LEONIX-RESTAURANTES-LANDING-APPLICATION-PREVIEW-TRANSLATION-FINAL-PASS.md`](LEONIX-RESTAURANTES-LANDING-APPLICATION-PREVIEW-TRANSLATION-FINAL-PASS.md).

---

## Gap Table

| Category | Surface | Gap | Risk | Recommended Future Gate |
|----------|---------|-----|------|-------------------------|
| Restaurantes | ~~Application section body copy~~ | **RESOLVED** — `restauranteApplicationFormCopy.ts` + client wiring (final pass) | — | — |
| Restaurantes | ~~Select placeholders / field labels~~ | **RESOLVED** — `fc.common.selectPlaceholder` and section dictionaries | — | — |
| Restaurantes | Static page metadata title (`/publicar/restaurantes`) | Spanish-only browser tab title | Low | Optional metadata gate |
| Autos | `AutosPrivadoApplication.tsx`, `AutosNegociosPublishConfirm.tsx`, `AutosPublishConfirmCore.tsx` | Binary `?lang=en` parsing; no `resolveClasificadosPublishLang` | High — same root cause as pre-fix Restaurantes | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| Servicios | `ServiciosApplicationForm.tsx`, servicios publish/preview flows | Binary lang checks; Spanish-only validation/issue strings | High | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| Empleos | `EmpleoQuickApplicationClient.tsx`, `EmpleoPremiumApplicationClient.tsx`, `EmpleoFeriaApplicationClient.tsx` | Binary `sp?.get("lang") === "en"` | High | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| Bienes Raíces | `brNegocio*` application sections, `AgenteIndividual*` preview | Binary locale checks; mixed ES inventory labels | High | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| Rentas | `RentasPrivadoForm.tsx`, `RentasAnuncioFormSection.tsx`, `RentasShowingTourSection.tsx` | Window/searchParams binary lang; Spanish form chrome | High | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| En Venta | `LeonixEnVentaStorefrontApplication.tsx` | Binary lang on application entry | Medium | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| Comunidad | `ComunidadQuickAdCanvas.tsx` | Sched lang forced to es/en binary | Medium | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| Clases | `ClasesQuickAdCanvas.tsx` | Same sched lang binary pattern | Medium | `LEONIX-APPLICATION-TRANSLATION-COVERAGE-BATCH2-CATEGORIES1` |
| All categories | Dedicated PT/TL application dictionaries | No PT/TL UI copy objects; honest EN fallback only | Low (documented) | Future PT/TL dictionary gate after ES/EN batch |

---

## Proven Pattern To Reuse (Batch 2)

1. `resolveClasificadosPublishLang(searchParams?.get("lang"))` → `{ routeLang, copyLang }`
2. `withClasificadosPublishLang(href, routeLang)` for preview/edit/dashboard links
3. `navCopyLang` / `clasificadosPreviewPublishCopy` for shared chrome (optional, required, back, preview, publish)
4. Category-specific `*ApplicationUiCopy.ts` for section nav, taxonomy labels, preview shell
5. Replace `item.labelEs` / `o.labelEs` with lang-aware taxonomy helpers
6. Do **not** translate user-entered listing content

---

## Out of Scope (This Register)

- Supabase / auth / Stripe / payments
- Dashboard admin (except shared copy imports already in use)
- Magazine DeepL proof outputs
- Hidden languages in public UI
