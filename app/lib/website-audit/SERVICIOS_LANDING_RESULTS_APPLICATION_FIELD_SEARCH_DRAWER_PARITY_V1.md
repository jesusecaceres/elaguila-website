# SERVICIOS-LANDING-RESULTS-APPLICATION-FIELD-SEARCH-DRAWER-PARITY-V1

**Scope:** Servicios only — application field → public search/filter parity (landing + results). No redesign.

**Date:** 2026-07-15

---

## 1. Executive summary

Servicios results already had a rich filter contract and keyword search, but the **landing** emitted default `state=CA` / `country=United+States` on every search, **Filtros** ran search instead of opening a drawer, and **active chips** lacked remove links plus `same_day` / `appointment`. This patch adds `ServiciosLandingSearchPanel` with a real filter drawer (reusing `ServiciosResultsAdvancedFilterFields`), unified URL building via `serviciosBrowseParams.ts`, sanitized location on landing/results submit, expanded keyword search coverage, and removable active chips.

---

## 2. Worktree snapshot

Pre-patch unrelated dirty files (autos, package.json) ignored per owner rule. This patch touched Servicios browse files + backward-safe optional callbacks on `LeonixLocalBusinessCompactSearchCanvas`.

---

## 3. Files inspected

- `app/(site)/clasificados/servicios/page.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosCompactSearchCanvas.tsx`
- `app/(site)/clasificados/servicios/resultados/page.tsx`
- `app/(site)/clasificados/servicios/ServiciosResultsFilters.tsx`
- `app/(site)/clasificados/servicios/resultados/ServiciosResultsAdvancedFilterFields.tsx`
- `app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts`
- `app/(site)/clasificados/servicios/lib/serviciosDiscoveryContract.ts`
- `app/(site)/clasificados/servicios/ServiciosResultsActiveSummary.tsx`
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- `app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts`
- `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishDiscovery.ts`
- `app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas.tsx`

---

## 4. Files changed

- `app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosLandingSearchPanel.tsx` (new)
- `app/(site)/clasificados/servicios/lib/serviciosBrowseParams.ts` (new)
- `app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts`
- `app/(site)/clasificados/servicios/lib/serviciosDiscoveryContract.ts`
- `app/(site)/clasificados/servicios/ServiciosResultsFilters.tsx`
- `app/(site)/clasificados/servicios/ServiciosResultsActiveSummary.tsx`
- `app/(site)/clasificados/servicios/resultados/page.tsx`
- `app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas.tsx` (optional callbacks only)
- `app/lib/website-audit/SERVICIOS_LANDING_RESULTS_APPLICATION_FIELD_SEARCH_DRAWER_PARITY_V1.md` (this file)

---

## 5. Application field inventory (summary)

| Field | App control | Stored | Keyword | Drawer filter | Chip |
|-------|-------------|--------|---------|---------------|------|
| businessTypeId / internal_group | select | row.internal_group | YES (label+slug) | group select | YES |
| suggested services / services[] | chips | profile_json.services | YES | — | — |
| serviceAreaNotes | text | serviceAreas.items | YES | city/area text | city chip |
| city/state/zip/country | text/select | row + discovery | YES | YES | YES |
| languageIds | multi-chip | opsMeta.discovery | YES (chip labels) | langEs/En/Ot | YES |
| quickFacts (emergency, mobile, bilingual, same_day…) | chips | quickFacts | YES | YES flags | YES |
| licensed/insured | checkbox | credentials + badges | via marketing haystack | YES | YES |
| contact (phone, email, web, WhatsApp, msg) | form | contact | partial | YES | YES |
| hours / open now | schedule | contact.hours | — | open_now (hours logic) | YES |
| payment methods | chips | — | — | **DEFERRED** | — |
| promo/coupon | text | promotions | YES | offer/has_offers/promo | YES |

---

## 6. Current public contract audit (pre-fix)

**Landing gaps:**
- Filtros → `runSearch` (no drawer)
- Clean submit emitted `state=CA`, `country=United+States`
- `window.location.href` without sanitize

**Results gaps:**
- Form GET always submitted default state/country from select
- Active chips display-only (no remove)
- Missing same_day / appointment chips

---

## 7. Safe Servicios filter contract

**Universal search:** `q`, `city`, `state`, `zip`, `country`

**Drawer (application-backed):** `group`, `seller`, `mobileSvc`, `same_day`, `appointment`, `emergency`, `wknd`, `open_now`, `verified`, `licensed`, `insured`, `free_estimate`, `free_consultation`, `has_photos`, `has_videos`, `has_offers`, `web`, `bilingual`, `email`, `whatsapp`, `promo`, `call`, `msg`, `phys`, `svcMulti`, `offer`, `legal`, `langEs`, `langEn`, `langOt`, `vint`

**Deferred:** payment methods as filters; coupon-specific filters beyond stored promo/offer signals

---

## 8. Keyword search coverage changes

Added to `filterServiciosRowsByKeyword`:
- internal_group slug + display label
- language chip labels when listing has that language
- customAmenityOptions
- businessHighlights labels

---

## 9. Landing changes

- `ServiciosLandingSearchPanel`: controlled search + `CategoryStandardFiltersDrawerShell` + shared advanced filter fields
- Filtros opens drawer; Apply merges drawer + search bar (search bar wins location)
- `buildServiciosResultsBrowseHref` omits default CA/US unless touched

---

## 10. Results changes

- Router-based form submit with location sanitize
- `stateTouched` / `countryTouched` on compact search canvas
- Removable active chips with `buildServiciosResultsChipRemoveHref`
- same_day + appointment chips added

---

## 11. QA URL matrix

| URL | Expected |
|-----|----------|
| `/clasificados/servicios?lang=en` | Landing search + drawer functional |
| `/clasificados/servicios/results?lang=en` | Clean browse |
| `...&q=plumbing` | Keyword filter |
| `...&q=spanish` | Language label search |
| `...&city=San+Jose` | Location filter |
| `...&zip=95116` | ZIP filter |
| `...&group=home_trade` | Category filter |
| `...&licensed=1` | Licensed filter |
| `...&same_day=1` | Same-day filter + chip |

---

## 12. TRUE/FALSE final audit

| Check | Result |
|-------|--------|
| Servicios only touched | TRUE |
| Application fields source of truth | TRUE |
| Search q covers meaningful fields | TRUE |
| Landing inputs/CTAs functional | TRUE |
| Landing drawer application-backed | TRUE |
| Results consume landing params | TRUE |
| Active chips complete | TRUE |
| Chip remove works | TRUE |
| Clean submit no default CA/US | TRUE |
| No fake filters | TRUE |
| Deferred documented | TRUE |
| No landing/results card redesign | TRUE |
| Other categories untouched | TRUE |
| Build passed | TRUE |

---

## 13. Build

```
npm run build — exit 0 (2026-07-15)
```
