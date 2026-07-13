# EN-VENTA-LANDING-RESULTS-FILTER-CTA-FUNCTIONALITY-FIX-V1

**Scope:** En Venta / Varios only — landing + results filter/CTA functionality. No redesign. No other categories touched.

**Date:** 2026-07-13

---

## 1. Executive summary

En Venta landing search was visual-only: `LeonixCategorySearchCanvas` in `EnVentaHubPageClient.tsx` used empty strings and no-op handlers for every input and CTA. This patch wires a functional landing search panel (same Leonix canvas UI) with real state, URL navigation via `buildEnVentaBrowseHref`, and an application-backed filter drawer. Results already had a working filter contract; this patch aligns default location semantics so clean submits do not emit `state=CA` or `country=United+States`, and active chips only reflect explicit URL params.

---

## 2. Gate 0 — Snapshot (pre-patch)

```
git status --short — unrelated workspace changes only (autos, bienes, package.json)
git diff --name-only — no en-venta files modified before this patch
```

**En Venta only selected:** TRUE

---

## 3. Files inspected

- `app/(site)/clasificados/en-venta/page.tsx`
- `app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaCompactSearchCanvas.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/(site)/clasificados/en-venta/results/contracts/enVentaResultsUrlParams.ts`
- `app/(site)/clasificados/en-venta/results/components/EnVentaResultsFiltersDrawer.tsx`
- `app/(site)/clasificados/en-venta/filters/enVentaFilterGroups.ts`
- `app/(site)/clasificados/en-venta/input/enVentaCanonicalKeys.ts`
- `app/(site)/clasificados/en-venta/shared/constants/enVentaLocationContract.ts`
- `app/(site)/clasificados/en-venta/shared/constants/enVentaResultsRoutes.ts`
- `app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel.tsx` (pattern reference)
- `app/lib/website-audit/CLASIFICADOS_REMAINING_CATEGORIES_LANDING_RESULTS_FILTER_FIELD_CONTRACT_AUDIT_V1.md`

---

## 4. Files changed

- `app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx`
- `app/(site)/clasificados/en-venta/shared/enVentaBrowseParams.ts` (new)
- `app/(site)/clasificados/en-venta/shared/components/EnVentaLandingSearchPanel.tsx` (new)
- `app/(site)/clasificados/en-venta/shared/components/EnVentaLandingDrawerFields.tsx` (new)
- `app/(site)/clasificados/en-venta/shared/components/EnVentaCompactSearchCanvas.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/(site)/clasificados/en-venta/results/contracts/enVentaResultsUrlParams.ts`
- `app/lib/website-audit/EN_VENTA_LANDING_RESULTS_FILTER_CTA_FUNCTIONALITY_FIX_V1.md` (this file)

---

## 5. Dead / no-op controls found (pre-fix)

| Control | Status |
|---------|--------|
| q input onChange | DEAD / NO-OP (`onQuery={() => {}}`) |
| city input onChange | DEAD / NO-OP |
| state select onChange | DEAD / NO-OP |
| zip input onChange | DEAD / NO-OP |
| country input onChange | DEAD / NO-OP |
| Buscar / submit | DEAD / NO-OP (`onSearch={() => {}}`) |
| Enter key submit | PARTIAL (form absent; canvas handlers no-op) |
| Filtros onClick | DEAD / NO-OP (`onOpenFilters={() => {}}`) |
| Ver todos los anuncios | WORKING (`browseAllHref`) |
| Publicar CTA | WORKING (`publishHref`) |
| Discovery / shortcut chips | WORKING |
| Landing drawer Apply | MISSING (no drawer) |
| Landing drawer Clear | MISSING (no drawer) |

---

## 6. Landing search fix

- Added `EnVentaLandingSearchPanel` with controlled `LeonixCategorySearchCanvas` state.
- `Buscar` and Enter submit navigate via `buildEnVentaBrowseHref(routeLang, loc, drawer, sanitizeOpts)`.
- `sanitizeEnVentaLocationForUrl` omits default CA / United States unless user touched or URL already had them.
- `Ver todos` and `Publicar` preserved unchanged.

---

## 7. Landing drawer fix

- `CategoryStandardFiltersDrawerShell` + `EnVentaLandingDrawerFields` with application-backed fields:
  - evDept, evSub, itemType, cond, priceMin, priceMax
  - free, nego, pickup, ship, delivery, meetup, seller
  - hasPhoto, hasVideo, featured
- Apply routes to results with search + drawer params; Clear resets drawer only (not main search defaults).
- No deferred brand/model/quantity facets; no fake filters.

---

## 8. Results consumption fix

- `onSubmitSearch` uses `sanitizeEnVentaLocationForUrl` with `urlHadState`, `urlHadCountry`, `stateTouched`, `countryTouched`.
- `EnVentaCompactSearchCanvas` tracks state/country touch via `onStateChange` / `onCountryChange`; remount key syncs URL values.
- Active chips: `state` only when `sp.has("state")`; `country` only when `sp.has("country")` and non-US alias.
- Existing drawer, filter logic, sort/view/page preserved.

---

## 9. Default location behavior

- Display defaults: CA, United States (visible in inputs).
- Clean landing Buscar → `/clasificados/en-venta/results?lang=es` only.
- Clean drawer Apply with no selections → no state/country params added.
- Explicit `?state=CA` or `?country=United+States` in URL still works and shows chips when applicable.

---

## 10. Active chips behavior

- All supported URL params produce chips when active.
- Chip remove calls `pushParams` with single key cleared; clear-all resets to clean results URL.
- Default CA/US not shown as chips on clean browse.

---

## 11. URL test matrix (code review)

| URL | Expected |
|-----|----------|
| `/clasificados/en-venta?lang=es` | Landing inputs editable; Buscar routes with typed params only |
| `/clasificados/en-venta/results?lang=es` | Clean browse; no CA/US chips |
| `...&q=samsung` | q chip; text filter applied |
| `...&city=San+Jose` | city chip; city filter applied |
| `...&zip=95116` | zip chip; zip filter applied |
| `...&free=1` | free chip; free filter applied |
| `...&hasPhoto=1` | hasPhoto chip; photo filter applied |
| `...&evDept=electronica` | dept chip (if valid key) |
| `...&cond=usado` | condition chip |
| `...&pickup=1` / `...&delivery=1` | fulfillment chips |

---

## 12. Mobile / PWA notes (code review @ 390px)

- Leonix landing canvas and EnVenta compact form use stacked flex + `min-w-0` / `overflow-x-hidden` patterns.
- Mobile Buscar submit button present (`sm:hidden` duplicate in compact canvas).
- Drawer: bottom sheet on mobile, fixed max-height, scrollable body, Apply/Clear in footer.
- Active chips row uses existing horizontal scroll / wrap from `EnVentaResultsChipsRow`.

---

## 13. TRUE/FALSE final audit

| Check | Result |
|-------|--------|
| En Venta only touched | TRUE |
| Landing q input works | TRUE |
| Landing city input works | TRUE |
| Landing state input/select works | TRUE |
| Landing zip input works | TRUE |
| Landing country input/select works | TRUE |
| Landing Buscar works | TRUE |
| Landing Enter submits | TRUE |
| Landing Filtros opens | TRUE |
| Landing drawer Apply works | TRUE |
| Landing drawer Clear works | TRUE |
| Ver todos los anuncios works | TRUE |
| Publish CTA preserved | TRUE |
| Results consume landing params | TRUE |
| Results drawer still works | TRUE |
| Active chips complete | TRUE |
| Chip remove works | TRUE |
| Clean submit does not emit default CA | TRUE |
| Clean submit does not emit default United States | TRUE |
| No fake filters added | TRUE |
| No result card redesign | TRUE |
| Ofertas untouched | TRUE |
| Viajes untouched | TRUE |
| Other categories untouched | TRUE |
| Build passed | TRUE |

---

## 14. Build

```
npm run build — exit 0 (2026-07-13)
```
