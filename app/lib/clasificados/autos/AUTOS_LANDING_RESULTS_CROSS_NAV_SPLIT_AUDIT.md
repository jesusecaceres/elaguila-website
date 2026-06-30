# AUTOS LANDING + RESULTS CROSS-NAV SPLIT AUDIT

## Objective

Finish Autos landing/results split so Autos Privado and Dealer de Autos are clearly separated while intentionally connected through premium Leonix cross-navigation cards.

## Preflight Dirty File Classification

- PRE-EXISTING UNRELATED PARALLEL WORK: None.
- AUTOS LANDING/RESULTS FILES CURRENTLY DIRTY: None at gate start.
- LOCKED_DO_NOT_TOUCH: No locked files were dirty at gate start.
- PARALLEL UNRELATED WORK OBSERVED DURING VALIDATION: `app/lib/clasificados/EMPLEOS_TWO_PATH_REROUTE_PREVIEW_AUDIT.md` appeared dirty after implementation started and was left untouched.

## Route / Component Inventory

- Landing route: `/clasificados/autos` via `app/(site)/clasificados/autos/page.tsx` -> `AutosPublicLanding` -> `AutosLandingPage`.
- Landing hero/search: `AutosHeroSearch`, `CategoryStandardLandingPage`, `AutosQuickChips`.
- Landing listing bands: `FeaturedCarsSection`, `RecentAutosSection`, `FeaturedDealersSection`, `BodyStyleBrowseSection`, `NeedBasedBrowseSection`.
- Landing publish CTA: `AutosLandingPublishCTA`.
- Results routes: `/clasificados/autos/resultados` and `/clasificados/autos/results` via `AutosPublicResultsShell`.
- Results API: `/api/clasificados/autos/public/listings` and `/api/clasificados/autos/public/listings/[id]`.
- Results cards: `AutosPublicFeaturedCard`, `AutosPublicStandardCard`, and `AutosResultCard`.
- Results filters/chips/sort: `AutosPublicFilterRail`, `AutosPublicResultsQuickChips`, `AutosPublicResultsActiveFilters`, `autosBrowseFilterContract`.
- Lane filtering: existing `seller=private|dealer` query maps to Privado/Negocios through `sellerType`.
- Dealer/Negocios route: dealer results use `/clasificados/autos/results?seller=dealer`; dealer public group route remains `/clasificados/autos/dealer/[dealerInventoryGroupId]`; dealer publish remains `/publicar/autos/negocios`.
- Privado route: private results use `/clasificados/autos/results?seller=private`; Privado publish remains `/publicar/autos/privado`; public detail remains `/clasificados/autos/vehiculo/{id}`.

## Route Decision

- Chosen Private Autos route: `/clasificados/autos/results?seller=private`.
- Chosen Dealer de Autos route: `/clasificados/autos/results?seller=dealer`.
- Chosen publish routes: `/publicar/autos/privado` and `/publicar/autos/negocios`.
- Reason: the existing URL contract already parses/serializes `seller` and the results filter applies real seller type filtering. No new route was needed.

## Results

- Landing cross-nav card result: FIXED/PASS. Added four compact premium cards after hero/search: private cars, dealer cars, sell private, publish as dealer.
- Results cross-nav strip result: FIXED/PASS. Added compact two-card strip after search controls; private results point to dealer + private publish, dealer results point to private + dealer publish, neutral results show private + dealer.
- Filter/search/chip organization result: PASS. Existing search/filter/chips remain functional and compact; no fake filters added.
- Results card lane truth result: PASS. Cards continue using existing seller badges, correct `/clasificados/autos/vehiculo/{id}` links, no-photo fallback, and real video badge state.
- Mobile/PWA result: PASS. Landing cards use a responsive grid; results strip uses horizontal scroll on mobile and two columns on desktop.
- Analytics/CTA truth result: PASS. Cross-nav links are real links only; no fake counts or fake analytics were added.
- Privado preservation result: PASS. Privado detail/contact card and publish routes were not edited.
- Negocios preservation result: PASS. Dealer Business Hub, dealer publish flow, and dealer inventory route were not edited.
- URL-video-only result: PASS. No video pipeline/copy files changed and no Mux/local upload copy added.
- Validation result: PASS. `git diff --check`, `npm run autos:landing-results-cross-nav-audit`, `npm run autos:application-war-room-audit`, `npm run autos:final-war-room-closeout-audit`, and `npm run build` passed. Build exited 0 with the known non-blocking Ofertas Locales `module.createRequire` warning.

## Files Changed

- `app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx`
- `app/(site)/clasificados/autos/landing/AutosLandingPage.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx`
- `app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy.ts`
- `app/lib/clasificados/autos/AUTOS_LANDING_RESULTS_CROSS_NAV_SPLIT_AUDIT.md`
- `scripts/autos-landing-results-cross-nav-audit.ts`
- `scripts/autos-application-war-room-audit.ts`
- `scripts/autos-final-war-room-closeout-audit.ts`
- `package.json`

## Remaining Risks

Authenticated end-to-end QA should still spot-check one private listing and one dealer listing in results, but no code-side route or build blocker is expected from this gate.

## Requirement Table

| Requirement                                      | PASS/FIXED/BLOCKED | Evidence |
| ------------------------------------------------ | ------------------ | -------- |
| Existing landing/results architecture inspected  | PASS | Routes/components listed above. |
| Private Autos route chosen using existing code   | PASS | `/clasificados/autos/results?seller=private`. |
| Dealer de Autos route chosen using existing code | PASS | `/clasificados/autos/results?seller=dealer`. |
| Landing cross-nav cards added/refined            | FIXED | `AutosLaneCrossNav` renders four landing cards. |
| Cards link to real routes                        | PASS | Links use existing results seller filter and publish routes. |
| No dead cross-nav links                          | PASS | No invented routes. |
| Results cross-nav strip added/refined            | FIXED | `AutosPublicResultsShell` renders compact strip. |
| Search remains functional                        | PASS | Existing search form unchanged. |
| Filters use real Autos fields only               | PASS | No new filters added; existing seller filter used. |
| City remains open/free input compatible          | PASS | City input unchanged. |
| Zip/state preserved if supported                 | PASS | ZIP input and state inference unchanged. |
| Applied chips are aligned/compact                | PASS | Existing active filters/chips unchanged. |
| No giant chip wall before results                | PASS | Compact strip appears before inventory notice/chips. |
| Mobile results appear quickly                    | PASS | Results strip is small and horizontally scrollable on mobile. |
| Privado cards do not show dealer modules         | PASS | Results cards unchanged; no Business Hub in Privado. |
| Dealer cards remain dealer/business truthful     | PASS | Dealer route uses existing seller=dealer filter. |
| No fake partner/sponsored claims added           | PASS | Copy avoids partner/sponsor claims. |
| No fake analytics added                          | PASS | Links only; no counters/events added. |
| URL-video-only policy preserved                  | PASS | No video upload/Mux copy added. |
| Privado preserved                                | PASS | Privado files untouched. |
| Negocios preserved                               | PASS | Negocios files untouched. |
| Build passed                                     | PASS | `npm run build` exited 0; known Ofertas Locales warning was non-blocking. |
| No unrelated files touched                       | PASS | Autos gate touched only Autos landing/results/audit files; unrelated Empleos audit file was observed but left untouched. |
| No files staged                                  | PASS | No staging commands run. |
| No commit created                                | PASS | No commit commands run. |
| No push attempted                                | PASS | No push commands run. |

## Final Release Decision

READY TO COMMIT AND PUSH: YES
