# Ofertas Global Location Filter Pipeline Audit

## Task classification

**SCOPED GATED BUILD** — Ofertas Locales worldwide location intake, publish snapshot, and public search/filter matching.

## Files inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts`
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/api/ofertas-locales/public-search/route.ts`
- `app/api/ofertas-locales/public-offers/route.ts`

## Files changed

- `app/lib/ofertas-locales/ofertasLocalesLocationHelpers.ts` (new)
- `app/lib/ofertas-locales/ofertasLocalesLocationFieldControls.tsx` (new)
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `scripts/verify-ofertas-global-location-pipeline.mjs` (new)
- `package.json` (verifier script only)

## Existing pipeline findings

- Draft stores `city`, `state`, `country`, `zipCode` on `OfertaLocalDraft`.
- Publish writes `city`, `state`, `zip_code` columns; `country` lives in `draft_snapshot.location.country`.
- Public item/offer mappers read country from snapshot.
- Public APIs already accept `city`, `state`, `zip`, `country` query params and filter in helper layer after fetching candidates.
- Application postal input was already global-friendly; public search drawer still used numeric ZIP assumptions.

## Exact root gaps (before fix)

1. Country did not default to United States on new drafts.
2. No US state dropdown when country is US (application + filters).
3. Public filter/search ZIP fields used `inputMode="numeric"` and `maxLength={10}`.
4. `public-offers` ZIP filter stripped non-digits (US-only).
5. Keyword `q` search did not include city/state/country/postal tokens.
6. Blank country did not behave as United States for matching.

## Application form changes

- Country defaults to **United States** on new drafts; datalist suggestions, free text allowed.
- **State / Province / Region** label; US `<select>` with 50 states + DC when country is US; free text for non-US.
- **ZIP / Postal code** via shared text input (letters, numbers, spaces; max 20).
- City helper copy: examples are suggestions, not limits.

## Preview/submit/public mapping

- `createEmptyOfertaLocalDraft`: `country: "United States"`.
- `buildDraftSnapshotFromDraft`: persists normalized display country when blank → United States.
- Existing publish columns unchanged (`city`, `state`, `zip_code`); no migration.

## Public results/filter changes

- Filters drawer and search bar use shared region/postal controls.
- URL params remain `city`, `state`, `country`, `zip`; `postal` read as alias for `zip`.
- Copy updated to global labels (State / Province / Region, ZIP / Postal code).

## API/search matching changes

- Item and offer filters use normalized location tokens.
- International postal matching (no digit-only strip on offers).
- `q` keyword search includes city, state, country, postal.
- US state code/name equivalence via `resolveOfertaLocalUsStateInput`.
- Blank item country treated as United States for country filter matching.

## Country/state/postal strategy

- **Country:** default United States; US/USA/Estados Unidos aliases normalize for matching; user display text preserved on publish.
- **State:** US dropdown when country is US; manual region text internationally.
- **Postal:** text-only normalization; case-insensitive matching with spaces removed.

## Deferred items

- **DB column for country:** still snapshot-only; DB-level country filter would need a migration (not in this gate).
- **Admin/dashboard location editors:** not touched.
- **Owner update US ZIP validation:** deferred (owner path not in allowed UI files for this gate).

## TRUE/FALSE/PARTIAL table

| Check | Result |
|-------|--------|
| city accepts any city | TRUE |
| city helper says examples are not limits | TRUE |
| state/province/region label exists | TRUE |
| US state dropdown/combobox exists when country is US | TRUE |
| non-US region manual input works | TRUE |
| country defaults United States | TRUE |
| country accepts custom text | TRUE |
| postal accepts letters/numbers/spaces | TRUE |
| numeric-only postal restriction removed | TRUE |
| preview receives city/state/country/postal | TRUE (preview already read draft fields) |
| submit/publish includes city/state/country/postal | TRUE (country via snapshot) |
| public offer/item output includes city/state/country/postal | TRUE |
| results URL params include city/state/country/zip | TRUE |
| filter drawer controls are wired | TRUE |
| public-search API filters city | TRUE |
| public-search API filters state/region | TRUE |
| public-search API filters country | TRUE |
| public-search API filters postal/zip | TRUE |
| q search includes location tokens | TRUE |
| no NorCal-only blocker remains | TRUE |
| no unrelated categories touched | TRUE |
| Stripe untouched | TRUE |
| analytics untouched | TRUE |
| admin/dashboard untouched | TRUE |
