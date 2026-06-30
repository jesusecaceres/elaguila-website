# Comunidad y Eventos — COM-1 Launch Audit

> Last updated: 2026-06-30  
> Status: **READY FOR LAUNCH** (all gates passed)

---

## Gate Summary

| Gate | Title | Status |
|------|-------|--------|
| A | Full pipeline audit | ✅ Complete |
| B | Smart date/time schedule UX — auto-activate weekday rows | ✅ Complete |
| C | Global-ready location UI (venue/addr/city/state/country/zip) + remove CA hardcode | ✅ Complete |
| D | Organizer Contact Hub on detail page — data-driven, hide empty | ✅ Complete |
| E | Leonix brand polish on form/detail/results cards | ✅ Complete |
| F | Results/landing/search/filter + country field in search blob | ✅ Complete |
| G | Preview/publish parity check and fix | ✅ Complete |
| H | Dashboard + admin visibility audit | ✅ Complete |

---

## Gate B — Smart Date/Time Schedule UX

**New file:** `app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection.tsx`

- Auto-activates weekday rows between event start and end dates using JS `Date` iteration.
- Inherits `eventSessionStart` / `eventSessionEnd` times into newly activated rows.
- Preserves manual edits — only fills open/close times on rows that have no time set yet.
- Shows helper copy from `COMUNIDAD_QUICK_COPY.*.fields.weeklyHelper`.
- Integrates `WeeklyScheduleEditor` below the smart controls.
- Wired into `CommunityQuickApplicationClient.tsx` (Comunidad path only).

---

## Gate C — Global-Ready Location UI

**Modified files:**

| File | Change |
|------|--------|
| `communityQuickDraft.ts` | Added `addressLine2`, `country` to `CommunityCommonDraft`, `emptyCommon`, `normalizeCommon` |
| `buildCommunityPublishEnvelope.ts` | Added `addressLine2`, `country` to `CommonSnapshot` and `buildCommonSnapshot` |
| `publishCommunityQuickToListings.ts` | Added `addressLine2`, `country` detail pairs; removed unused `stateForRow` |
| `CommunityQuickApplicationClient.tsx` | Rewrote `LocationSection` — venue→addr1→addr2→city→state/region→country→zip; both Clases and Comunidad call sites updated |
| `communityPublishCopy.ts` | Added `addressLine2`, `countryLabel`; updated `stateLabel`/`zipLabel` for global phrasing (all 4 locales) |
| `communityQuickAdPrimitives.tsx` | `cityStateZipLine` now accepts `country?`; removed `"CA"` fallback |
| `CommunityContactCanvas.tsx` | Shows `addressLine2`; location line includes country; removed `"CA"` fallback |
| `comunidadPublishedQuickToDraft.ts` | Hydrates `addressLine2`, `country`; removed `"CA"` fallback |
| `clasesPublishedQuickToDraft.ts` | Hydrates `addressLine2`, `country`; removed `"CA"` fallback |
| `ComunidadQuickAdCanvas.tsx` | Passes `country` to `cityStateZipLine` |
| `ClasesQuickAdCanvas.tsx` | Passes `country` to `cityStateZipLine` |
| `CommunityQuickAnuncioDetail.tsx` | Reads `Leonix:country`, `Leonix:addressLine2` from pairs; shows them in detail rows |
| `communityDiscoveryListingCardModel.ts` | `formatLocationLine` includes country; search blob includes `addr2` + `country` |
| `CommunityListingsResultsClient.tsx` | `communityLocationSearchBlob` includes `Leonix:country` + `Leonix:addressLine2` |

**Hardcoded `"CA"` fallbacks removed from all 4 locations:**
- `comunidadPublishedQuickToDraft.ts`
- `clasesPublishedQuickToDraft.ts`
- `communityQuickAdPrimitives.tsx`
- `CommunityContactCanvas.tsx`

---

## Gate D — Organizer Contact Hub

Already implemented via `CommunityContactCanvas`. All contact actions (phone, WhatsApp, SMS, email, website, map) are data-driven and hide when empty. No changes needed.

---

## Gate E — Leonix Brand Polish

Verified consistent use of brand tokens (`#C9B46A`, `#FCF9F2`, `#FFFCF7`, `#2A2826`) across:
- `ComunidadQuickAdCanvas` / `ClasesQuickAdCanvas`
- `CommunityDiscoveryListingCard`
- `CommunityContactCanvas`
- `CommunityQuickPublicDetailShell` / sidebar

---

## Gate F — Search/Filter

- `communityLocationSearchBlob` in `CommunityListingsResultsClient.tsx` now indexes `country` and `addressLine2`.
- `buildCommunitySearchBlob` in `communityDiscoveryListingCardModel.ts` now indexes `addr2` and `country`.
- `formatLocationLine` in card model includes `country` in the displayed location line.

---

## Gate G — Preview/Publish Parity

Both preview and publish paths share:
- Same `ComunidadQuickAdCanvas` / `ClasesQuickAdCanvas` components.
- `comunidadPublishedQuickToDraft` / `clasesPublishedQuickToDraft` hydrate all new fields from detail pairs.
- `cityStateZipLine` and `CommunityContactCanvas` updated identically for both paths.

---

## Gate H — Dashboard + Admin Visibility

Dashboard (`mis-anuncios`) correctly:
- Counts `comunidad` listings in category tallies.
- Shows `Comunidad` / `Community` category chip.
- Links to `/clasificados/comunidad/resultados` results page.
- Uses `formatLeonixAdId` for public ad ID display.

No changes required.

---

## Build Verification

```
npm run build   →  exit code 0 (compiled with pre-existing warnings only)
npx tsc --noEmit →  0 errors in app/ source files (e2e/ spec errors are pre-existing)
```

---

## Forbidden Actions (confirmed not done)

- ✅ No Stripe/Supabase schema changes
- ✅ No authentication changes
- ✅ No changes to unrelated categories
- ✅ No fake data or placeholder buttons
- ✅ No global restyling
- ✅ No staged/committed/pushed changes
