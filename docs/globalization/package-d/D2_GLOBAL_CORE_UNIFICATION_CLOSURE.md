# Package D — Build D2: Global Core Unification — Closure

**Starting HEAD:** `a46be587` (Package C, verified on remote, `integration/lifecycle-foundation-2026-07`)
**Scope class:** Scoped gated build — connect and globalize existing strongest systems, fix confirmed live truth defects, create the minimum shared infrastructure D3 needs. Not a rewrite.

## Files inspected (read in full or substantial part before any edit)

`app/lib/listingPlans/placementEntitlements.ts`, `printDigitalVisibilityRank.ts`, `revenueEntitlementFulfillment.ts`, `magazinePlacementPriority.ts`, `listingPackageEntitlementPlacement.ts`; `app/(site)/clasificados/bienes-raices/lib/brPublicEntitlementOverlay.ts` and `resultados/lib/brResultsFilters.ts`; `app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts`, `serviciosBusinessHubContactTypes.ts`, `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`; `app/lib/analytics/client/recordAnalyticsEvent.ts`, `app/api/analytics/events/route.ts`, `app/lib/listingAnalyticsEventTypes.ts`, `app/lib/analytics/listingAnalyticsIdentity.ts`, `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`, `app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts`; `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx`, `ofertasLocalesPublicDetailCopy.ts`, `app/lib/ofertas-locales/ofertasLocalesTypes.ts`, `ofertasLocalesDbSchema.ts`, `ofertasLocalesPublicDetailHelpers.ts`; `app/(site)/clasificados/anuncio/[id]/page.tsx` (contact-CTA section), `app/(site)/clasificados/components/ContactActions.tsx`, `app/components/cta/types.ts`; `app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx`; `app/admin/(dashboard)/workspace/package-entitlements/actions.ts`; `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx` and `AgenteIndividualResidencialPreviewPage.tsx`; `app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx`.

## Exact diff scope (verified via `git status --short` / `git diff --name-status`, closure-correction gate)

- **Modified:** 15
- **Added:** 9
- **Deleted:** 0
- **Total changed files:** 24

Standing exclusions never staged as part of D2: `.claude/`, `public/title_banner_leonix.png`.

## Files changed (15)

- `app/lib/listingPlans/revenueEntitlementFulfillment.ts` — `activatePlacementForRealPayment` now calls the canonical writer internally; external signature/behavior unchanged.
- `app/admin/(dashboard)/workspace/package-entitlements/actions.ts` — print-included placement insert now routes through the canonical writer.
- `app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts` — strict-sort fix (Gate 3).
- `app/lib/analytics/listingAnalyticsIdentity.ts`, `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts` — added `ofertas_locales` as a recognized analytics source table/category.
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx` — added the 4 missing social/review buttons (TikTok, YouTube, Google Reviews, Yelp) and wired every visible contact/social/review CTA to truthful analytics.
- `app/(site)/clasificados/components/ContactActions.tsx` — `onContact` now receives the full clicked `CtaSheetIntent` (was a bare no-arg signal), so callers can label events truthfully, including distinguishing WhatsApp from SMS.
- `app/(site)/clasificados/anuncio/[id]/page.tsx` — the one wired `<ContactActions onContact>` call-site now dispatches a truthful per-CTA-type event instead of a generic `message_sent`.
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx`, `AgenteIndividualResidencialPreviewPage.tsx`, `app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx` — real listing identity threaded through, and the live contact sidebar's phone/email/website/Google Business/Google Reviews/Yelp/request-info/schedule-visit/MLS/tour/brochure CTAs now fire the existing `brGlobalAnalytics.ts` trackers. Social-icon clicks remain untracked in this pass (see Deferred).
- `app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx` — removed the two owner-editable rating/review-count number inputs (Gate 8).
- `scripts/gate-i10a-analytics-engagement-truth-selftest.ts` — historical gate triage: the gate pinned an exact count of legacy `trackEvent(..., "message_sent", ...)` call-sites; updated from 2→1 to reflect the new, correct truth after Gate 6C removed the one fabricated (non-chat) usage — not a bypass, a corrected pin.
- `scripts/gate-i10b-en-venta-inline-save-owner-protection-selftest.ts` — same stale-blanket-diff-scope-assertion pattern already fixed repeatedly in this program (see Package C closeout); rewired onto `excludeCurrentPackageFiles()` so D2's own already-authorized `app/lib/analytics/server/` touch doesn't trip its "no analytics server file in this gate's diff" check; the gate's substantive assertion is unchanged.
- `scripts/globalizationCurrentPackageDiff.ts` — added the "PACKAGE D BUILD D2" allowlist section (all 24 D2 files enumerated).

## Files created (9)

- `app/lib/listingPlans/placementResolution.ts` — canonical placement-resolution reader (Gate 1).
- `app/lib/listingPlans/placementRankingAdapter.ts` — reusable ranking input/adapter (Gate 2).
- `app/lib/listingPlans/placementEntitlementWriter.ts` — canonical placement writer (Gate 9).
- `app/lib/analytics/client/connectionHubCtaDispatch.ts` — unified CTA analytics dispatch contract (Gate 5).
- `app/components/contact/connectionHub/sharedConnectionHubContactTypes.ts`, `sharedConnectionHubContactModel.ts` — shared Connection Hub foundation (Gate 4).
- `scripts/verify-package-d-d2-br-strict-price-sort.ts`, `scripts/verify-package-d-d2-global-core-unification.ts` — narrow verifiers (Gate 11).
- This closure document.

## Placement architecture

- **Canonical source:** `leonix_placement_entitlements`, exclusively. No UI label, membership tier, or account plan is ever treated as entitlement — `placementResolution.ts` reads only real rows.
- **Reader:** `resolveCanonicalPlacementSignal` / `resolveCanonicalPlacementSignalsForListings` (`placementResolution.ts`) — filters by real category match, real surface eligibility, and real active status (reusing, never duplicating, `placementEntitlements.ts`'s pure functions), then resolves ties deterministically (tier rank → manual priority → rotation weight → entitlement id). Returns `null`/omits a listing when no active entitlement exists — never fabricates a default tier.
- **Ranking adapter:** `placementRankingAdapter.ts` converts a resolved signal into a default/relevance ranking weight, reusing the exact `PLACEMENT_TIER_RANK` table (already the locked 8-tier group order) — no second competing weight table. Documented, hard boundary: never imported by a strict numeric sort comparator.
- **Legacy fallback:** none introduced in D2. `printDigitalVisibilityRank.ts` remains the ranking engine of record where a category already uses it (Servicios, Restaurantes); this is not touched or reordered relative to the new placement reader — the two systems are documented as parallel, not merged, since merging every category's ranking onto the new resolver was explicitly out of D2 scope ("do not blindly replace every category sorter").
- **Admin writer:** `placementEntitlementWriter.ts` is now the one write path. `activatePlacementForRealPayment` (real Stripe/cleared payments) and the admin print-included grant path both call it — no caller hand-builds the insert anymore. Tier mapping, eligibility, print-included logic, Partner Premium, contract dates, category/surface scope, and payment/grant-source truth are all unchanged; only the physical write moved into one function.

## Ranking

- **Default discovery:** unchanged in D2 for every existing category — no category's live sorter was rewired onto the new adapter. The adapter exists and is verified correct (Gate 11) so D3 category adoption has a real foundation instead of re-inventing this each time.
- **Strict price truth:** proven directly, not just adapter-side. `brResultsFilters.ts`'s `precio_asc`/`precio_desc` sort was rewritten so price is the primary key and sponsored rank is only a tie-breaker on a genuine price tie — proven live via `verify-package-d-d2-br-strict-price-sort.ts` (cheaper unsponsored beats pricier sponsored on `precio_asc`; pricier unsponsored beats cheaper sponsored on `precio_desc`; a genuine tie still lets sponsorship break it; default/"reciente" discovery is intentionally unchanged).
- **Bienes correction:** this was the one confirmed live product-rule violation in D1 and is now fixed and regression-tested.

## Connection Hub

- **Shared model:** `sharedConnectionHubContactTypes.ts` (category-agnostic view model: contact, social, reviews, moreLinks, location — every field optional) + `sharedConnectionHubContactModel.ts` (`buildSharedConnectionHubContact`, a pure builder mirroring Servicios' proven mapper logic field-for-field, plus `isSafeExternalHref` guarding against dangerous/malformed hrefs).
- **Categories touched by full adoption in D2:** none — Servicios remains the untouched, canonical, production-proof reference (per the "do not destroy working Servicios behavior" instruction). The shared foundation exists and is verified (Gate 11) as the D3 adoption target.
- **Categories touched by targeted defect fixes (not full adoption):** Ofertas Locales' existing bespoke `ContactHub` component was fixed in place (missing buttons added, analytics wired) rather than swapped onto the new shared component — full adoption there would have required a page-shape redesign, which was explicitly out of scope for the confirmed-defect fix. Bienes Raíces' live contact sidebar was similarly fixed in place (analytics wiring only), not swapped.
- **Hidden-data behavior:** verified — empty source data hides the whole card; only fields with genuinely real data render a CTA; Google and Yelp review links always stay two separate entries, never combined into one number; no rating/review-count is ever fabricated by the shared builder.

## Reviews

- **Google:** unchanged in D2 — remains link-only (owner-pasted URL, outbound button, hidden when absent). No live API integration was built (explicitly deferred).
- **Yelp:** same — link-only, unchanged.
- **Manual rating cleanup:** Servicios' owner-editable `hero.rating`/`hero.reviewCount` number inputs are removed from `ServiciosApplicationForm.tsx`. The underlying type/schema and any historical stored values are untouched — no migration, no data loss, no fabricated replacement. Restaurantes' equivalent `externalRatingValue`/`externalReviewCount` fields were inspected; no active customer-editable UI exists for them in the current app, so per instruction nothing was changed there.
- **Deferred live API work:** Google Places / Yelp Fusion integration remains entirely out of scope, as directed.

## Analytics

- **Shared dispatch:** `connectionHubCtaDispatch.ts` — one function (`dispatchConnectionHubCta`) mapping a truthful CTA kind to the existing `ListingAnalyticsEventType` allowlist (phone→`phone_click`, whatsapp→`whatsapp_click`, email→`email_click`, website→`website_click`, directions→`directions_click`, share→`listing_share`; social/review→`cta_click` with truthful `metadata.provider`). No new table, no new allowlist entries — reuses `recordAnalyticsEvent`/`/api/analytics/events` exactly as-is.
- **Bienes:** the actual live contact-rendering path (`BrAgenteResContactSidebar.tsx`, reached via `BienesRaicesNegocioLiveDetailShell.tsx` → `AgenteIndividualResidencialPreviewPage.tsx`) previously fired zero analytics. It now fires the existing, correct `brGlobalAnalytics.ts` trackers (phone, WhatsApp, email, website, Google Business, Google Reviews, Yelp, request-info, schedule-visit, MLS, tour, brochure) with real listing identity, gated so the owner's pre-publish preview (no real listing id) never fires a click. Social-icon clicks in this component remain untracked in D2 — see Deferred.
- **Ofertas:** every visible CTA in `OfertasLocalesPublicDetailView.tsx`'s `ContactHub` (call, SMS, WhatsApp, website, directions, share, Facebook, Instagram, TikTok, YouTube, Google Business, Google Reviews, Yelp) now dispatches a truthful event via the new shared dispatcher — previously zero CTAs were tracked.
- **anuncio/[id]:** the one wired `<ContactActions onContact>` call-site (shared by the Rentas/community-quick contact rendering) no longer fabricates `message_sent` for every click. `ContactActions.tsx`'s `onContact` callback was fixed to pass the real clicked intent (including distinguishing WhatsApp from SMS, both `kind: "send_message"`), and the call-site now dispatches phone/whatsapp/email/website/directions truthfully. The five OTHER `<ContactActions>` call-sites in the repo (Mascotas y Perdidos, one Busco surface, the generic `ListingView.tsx` usages) still pass no `onContact` at all and remain untracked — unchanged, since they were not named as a confirmed D2 defect and fixing them was not required to correct the anuncio/[id] mislabeling.
- **Preserved:** Servicios' and Restaurantes' existing, already-correct analytics were not touched.

## Confirmed defects fixed

1. Bienes Raíces sponsored ranking overriding strict price sort — fixed, regression-tested.
2. Ofertas Locales missing TikTok/YouTube/Google Reviews/Yelp buttons despite real data — fixed.
3. Bienes Raíces live Business Hub/contact CTAs had zero analytics — fixed (core CTAs; social icons deferred).
4. Ofertas Locales CTAs had zero analytics — fixed.
5. `anuncio/[id]` generic/mislabeled `message_sent` for every CTA — fixed for the one wired call-site.
6. Servicios permitted manual owner entry of rating/review count — input controls removed.
7. Admin package/placement actions bypassed the canonical placement writer — now routed through one writer.
8. `leonix_placement_entitlements` not consumed by public ranking — **partially addressed, not fully closed at runtime.** D2 built the canonical placement-resolution reader and the ranking-adapter integration boundary, so the canonical placement system is now technically consumable by public ranking. D2 intentionally did NOT rewire any live category sorter to actually call it — per-category live adoption is deferred to D3 (see "do not blindly replace every category sorter"). Do not read this item as "public ranking is already globally consuming canonical placement truth" or "all category sorters are now wired" — neither is true yet.

**Placement/ranking scope truth, stated explicitly:**

- CANONICAL PLACEMENT READER EXISTS: **TRUE**
- RANKING ADAPTER EXISTS: **TRUE**
- LIVE GLOBAL CATEGORY ADOPTION COMPLETE: **FALSE** (expected FALSE in D2 — not a D2 failure, intentional scope truth)
- LIVE CATEGORY ADOPTION DEFERRED TO D3: **TRUE**

## Deferred to D3

- Broad category adoption of the shared Connection Hub component (Autos Dealer, Bienes Raíces, Restaurantes unification, Rentas, Viajes).
- Wiring the new placement reader/ranking adapter into each category's live default/relevance sort (Autos, Bienes Raíces, Rentas, Servicios, Restaurantes) — the boundary/adapter exists and is verified; per-category adoption is next.
- Social-icon CTA analytics on the Bienes Raíces contact sidebar (no clean existing tracker for that specific CTA type without a new export).
- The five untracked `ContactActions.tsx` call-sites outside anuncio/[id]'s Rentas/community-quick branch (Mascotas y Perdidos, one Busco surface, generic `ListingView.tsx`).
- Missing standalone public business-profile pages (Bienes Raíces Negocio, Ofertas Locales, Rentas).
- Broad duplicate/dead-code retirement (documented in D1, not deleted per Gate 10's narrow retirement policy — no item met all three required conditions: zero callers, replacement fully adopted, and active competing-runtime-truth risk).
- Google/Yelp live API snapshots.
- Viajes/Rentas/full category adoption generally.
- Homepage featured-business DB wiring.

## Verification

- `verify-package-d-d2-br-strict-price-sort.ts`: 4/4 checks passed.
- `verify-package-d-d2-global-core-unification.ts`: 36/36 checks passed (placement eligibility, ranking group order, Connection Hub hidden/visible/safe-href behavior, CTA analytics truthful mapping).
- Aggregate gate suite, TypeScript baseline, changed-file lint, `git diff --check`, and one final `npm run build` — recorded in the final report.

**Production touched:** NO
**Migration created:** NO
**Commit created:** NO (per instruction — STOP before commit)
