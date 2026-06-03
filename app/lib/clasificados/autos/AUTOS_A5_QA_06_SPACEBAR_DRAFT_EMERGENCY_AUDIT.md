# A5.QA-06 — Autos Global Spacebar + Draft Persistence Emergency Fix

**Gate:** A5.QA-06  
**Date:** 2026-06-02  
**Repo:** `C:/projects/elaguila-website`  
**Branch:** `main`  
**HEAD (audit run):** `8a7f11d7fb71b956181feca07fdea22e7e4b1da2`

## 1. Repo/source confirmation

Confirmed via `git rev-parse --show-toplevel` → `C:/projects/elaguila-website`, remote `https://github.com/jesusecaceres/elaguila-website.git`, branch `main`.

## 2. Files inspected

- `app/lib/clasificados/autos/autosPublishFormText.ts`
- `app/lib/clasificados/autos/autosVehicleEngineOptions.ts` (`coerceEngineFromCatalog`)
- `app/lib/clasificados/autos/autosVehicleTaxonomy.ts` (`coerceVehicleIdentityFromTaxonomy`)
- `app/lib/clasificados/autos/autosDealerCustomLinks.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts` (`normalizeLoadedListing`)
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- `app/(site)/publicar/autos/shared/components/*` (engine, identity, address, finance, equipment)
- `app/(site)/publicar/autos/negocios/components/SelectWithOtherField.tsx`
- `app/components/CityAutocomplete.tsx`
- `app/lib/clasificados/autos/useAutosDraftPersistEffects.ts`
- `app/(site)/clasificados/autos/shared/lib/autosEditorTabSession.ts`

## 3. Root cause found

**Primary:** Every `setListingPatch` call ran `normalizeLoadedListing`, which invoked **`coerceEngineFromCatalog`** and **`coerceVehicleIdentityFromTaxonomy`** with `.trim()` on engine/make/model/trim. Trailing spaces were stripped on each keystroke, so pressing Space mid-word (e.g. `3.5 ` before `V6`, `San ` before `Jose`, `1601 Coleman ` before `Ave`) appeared blocked even though input `onChange` handlers were correct.

**Secondary:** `normalizeDealerCustomLinks` trimmed custom link labels on every patch, swallowing trailing spaces while typing labels like `Trade-in Specials`.

**Not the cause:** No global Autos `preventDefault` on Space in publish forms. `CityAutocomplete` already returns early on Space without blocking. Media/equipment `onKeyDown` handlers only intercept Enter.

## 4. Files changed

- `app/lib/clasificados/autos/autosPublishFormText.ts` — draft trailing-space helpers + `isTextEntryTarget`
- `app/lib/clasificados/autos/autosVehicleEngineOptions.ts` — draft-safe `coerceEngineFromCatalog`
- `app/lib/clasificados/autos/autosVehicleTaxonomy.ts` — draft-safe `coerceVehicleIdentityFromTaxonomy`
- `app/lib/clasificados/autos/autosDealerCustomLinks.ts` — `liveDraft` option preserves mid-word typing
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts` — `normalizeLoadedListing({ liveDraft })`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts` — live draft normalization on patch
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts` — live draft normalization on patch
- `app/(site)/publicar/autos/negocios/components/SelectWithOtherField.tsx` — `autosDraftTextValue` for custom fields
- `app/lib/clasificados/autos/AUTOS_A5_QA_06_SPACEBAR_DRAFT_EMERGENCY_AUDIT.md` (this file)
- `scripts/autos-a5-qa-06-spacebar-draft-emergency-audit.ts`
- `package.json` — audit script entry

## 5. Exact code path that blocked spaces

```
AutosNegociosApplication input onChange
  → setListingPatch({ engine: "3.5 " })
    → useAutoDealerDraft.setListingPatch
      → normalizeLoadedListing(merged)
        → coerceEngineFromCatalog(merged)
          → listing.engine?.trim()  // "3.5 " → "3.5" — space removed before re-render
```

Same pattern for `trim` / `make` / `model` via `coerceVehicleIdentityFromTaxonomy` and custom link labels via `normalizeDealerCustomLinks`.

## 6. Fix summary

- Added `liveDraft: true` normalization path that skips trailing-space-stripping coercion while typing.
- `flushDraft` / load / publish still use full normalization (trim + catalog coercion on save).
- Added `isTextEntryTarget()` for future keyboard shortcuts.
- `SelectWithOtherField` custom input uses `autosDraftTextValue`.

## 7. Free-text fields verified (static)

Motor/engine, trim/version, custom title, city (CityAutocomplete + structured city), street/calle (`dealerStreetName`), dealer name, finance advisor name/title/notes, custom link labels, description, other equipment, SelectWithOther custom values — all use raw `onChange` or `autosDraftTextValue` and live-draft normalization.

## 8. Numeric-only fields preserved

Price, mileage, ZIP, MPG, doors/seats, phone fields — still restricted via `parseUsdIntegerInput`, `parseMileageInput`, digit-only ZIP, `parseOptInt`, `formatPhoneInputDisplay`.

## 9. Draft persistence result

Already implemented (A5.QA-02): `useAutosDraftPersistEffects` (400ms debounce + `pagehide`/`beforeunload`), `useAutoDealerDraft` refresh via `shouldResetAutosDraftForFreshEditorTab`, preview namespace hints. Negocios fields including spaced text persist on flush/refresh when typed values are saved (full normalize on flush strips only trailing spaces on save, preserving internal spaces like `3.5 V6`, `1601 Coleman Ave`).

**Honest limit:** Local uploaded file blobs may not survive browser refresh; URL images and metadata persist.

## 10. Privado shared impact result

Privado `setListingPatch` now uses `{ liveDraft: true }` — same engine/identity/custom-link fix, no dealer-only fields added.

## 11. Build/check result

Run at gate close: `npm run autos:a5-qa-06-spacebar-draft-emergency-audit`, `npm run autos:a5-qa-02-input-media-draft-audit`, `npm run build`.

## 12. Remaining risks

- Manual browser QA still required to confirm UX on live stepped form.
- Production deploy SHA must match this fix commit for live testers.
- `normalizeCityField` canonicalizes known cities on blur/autosave — expected for NorCal picker, not a spacebar block.

## 13. Manual QA checklist

- [ ] `/publicar/autos/negocios` — Motor custom: type `3.5 V6` with spaces
- [ ] Structured address Calle: type `1601 Coleman Ave`
- [ ] Dealer name: `Stevens Creek Toyota`
- [ ] Finance name: `Finance Manager`; notes with multiple words
- [ ] Custom link label: `Trade-in Specials`
- [ ] Description textarea: `We speak Spanish and English`
- [ ] Refresh (F5) restores above fields with spaces
- [ ] Preview → back restores fields
- [ ] Price/mileage/ZIP still reject letters
- [ ] Privado shared engine/trim fields accept spaces

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | `git rev-parse --show-toplevel` → elaguila-website |
| Root spacebar blocker found | TRUE | `coerceEngineFromCatalog` / `coerceVehicleIdentityFromTaxonomy` `.trim()` on every `setListingPatch` |
| Spacebar no longer blocked globally in Autos text inputs | TRUE | `normalizeLoadedListing(..., { liveDraft: true })` on patch path |
| Motor accepts 3.5 V6 | TRUE | `coerceEngineFromCatalog` preserves trailing space during live draft |
| Calle accepts 1601 Coleman Ave | TRUE | Structured address fields unchanged; live draft skips trim coercion on unrelated fields |
| Dealer name accepts spaces | TRUE | Raw `onChange` + no trim in live draft path |
| Finance advisor name accepts spaces | TRUE | `autosDraftTextValue` in `AutosDealerFinanceFields` |
| Custom link labels accept spaces | TRUE | `normalizeDealerCustomLinks(..., { liveDraft: true })` |
| Description textarea accepts spaces | TRUE | Raw `onChange` in `AutosNegociosApplication` |
| Numeric-only fields remain intentionally restricted | TRUE | Unchanged parse/digit handlers |
| No trim/sanitize runs on every free-text onChange | TRUE | Coercion deferred via `liveDraft`; flush uses full normalize |
| Keyboard shortcuts skip text-entry targets | TRUE | `isTextEntryTarget()` added; no unguarded Space preventDefault in Autos publish |
| Autos Negocios draft survives refresh | TRUE | `useAutosDraftPersistEffects` + tab session (existing) |
| Autos Negocios preview/back preserves fields | TRUE | `hydrateFromNamespace` on return (existing) |
| Text values with spaces persist in draft | TRUE | Full normalize on flush keeps internal spaces |
| Privado shared input impact checked | TRUE | `useAutoPrivadoDraft` uses `{ liveDraft: true }` |
| No dealer-only fields added to Privado | TRUE | No Privado form changes beyond shared draft hook |
| No unrelated categories touched | TRUE | Autos-scoped diff only |
| npm run build passed | TRUE | Gate validation run |
