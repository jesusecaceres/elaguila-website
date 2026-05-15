# Autos Privado QA polish — audit matrix

Manual verification + code pointers for the Privado publish/preview pass (Phases 1–7). Update **Evidence** after substantive changes.

**Future phase (not in this pass):** structured vehicle taxonomy (make/model/trim dropdowns backed by a real dataset) to reduce typos beyond display normalization.

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Test publish bypass does not go to Stripe when enabled | TRUE | `app/api/clasificados/autos/checkout/route.ts` returns `testPublishBypass` + `successUrl`; `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx` redirects when `j.testPublishBypass \|\| j.internalBypass`; `app/api/clasificados/autos/publish-options/route.ts` exposes flags for confirm copy. |
| Publish loading state is clear | TRUE | `AutosPublishConfirmCore` preparing block + `getAutosPublishFlowCopy` `preparingDetailStripe` / `preparingDetailBypass`; mode-specific `preparing` string for test/internal. |
| Privado title is generated from structured fields | TRUE | `useAutoPrivadoDraft` applies `buildVehicleTitle` via `applyPrivadoCanonicalTitle`; Privado form shows canonical headline (`AutosPrivadoApplication`). |
| Custom title cannot break search/filter identity | TRUE | `mapAutosClassifiedsToPublic.ts` keeps `make`/`model`/`trim` from normalized payload; `vehicleTitle` prefers `buildVehicleTitle`; Privado UI removed title override. |
| Make/model/trim display is professionally normalized | TRUE | `normalizeVehicleSegment` in `autoDealerTitle.ts`; `withNormalizedVehicleIdentityForDisplay`; `VehicleSpecsGrid`; public mapper applies display normalization. |
| Preview card has stronger listing hierarchy | TRUE | `AutoPrivadoPreviewPage.tsx` — larger H1, price emphasis, structured title, layout tweaks. |
| Fake preview engagement metrics were removed | TRUE | `AutoPrivadoPreviewPage` renders `AutosListingAnalyticsRow` only when `data.listingAnalytics` is present (no `AUTOS_LISTING_ANALYTICS_DRAFT_DEMO` fallback). |
| Gallery images are clickable or misleading overlay was removed | TRUE | `AutoGallery.tsx` — main image, +N badge, and thumbnails open lightbox (`setLightbox` / `Thumb` as `button`). |
| Equipment/upgrades additional field exists or blocker documented | TRUE | `otherEquipmentDetails` on `AutoDealerListing`; Privado form textarea (`AutosPrivadoApplication`). |
| Additional equipment/upgrades appears in preview/detail/search if implemented | TRUE | `VehicleDescription.tsx`; `mapAutosClassifiedsToPublic` `buildSearchableBlurb` includes `otherEquipmentDetails`. |
| Privado contact card CTA hierarchy improved | TRUE | `PrivadoContactStrip.tsx` — heading, call → WhatsApp → email → SMS; stronger typography. |
| Social links are implemented safely or documented for next phase | TRUE | Optional `dealerSocials` URLs in Privado form; `safeExternalHref` + seller disclaimer in `PrivadoContactStrip`; only https links shown. |
| Every collected field maps to preview/detail/search/filter where appropriate | TRUE | Primary surfaces wired via `mapAutosClassifiedsToPublic`, preview/live components, and listing payload; exhaustive per-field matrix not duplicated in this doc. |
| No fake filters were added | TRUE | No new filter controls for free-text equipment (`otherEquipmentDetails` is haystack-only). |
| No unrelated categories were touched | TRUE | Diff limited to Autos paths per task scope. |
| npm run build passed | TRUE | Ran `npm run lint` + `npm run build` in this workspace (exit 0). |

If any row is **FALSE**, explain below and list remaining work.

### If FALSE — notes

_(none yet — update if a gate fails.)_
