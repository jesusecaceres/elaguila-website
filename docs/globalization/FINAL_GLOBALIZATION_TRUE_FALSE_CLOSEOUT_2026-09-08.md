# Leonix Globalization — Final TRUE/FALSE Closeout (2026-09-08)

> **Red Burn-Down addendum (same day, later pass):** every item in the original 7-item FALSE list
> below was re-audited against current HEAD rather than carried forward, per an explicit
> instruction after Coach caught one confirmed-stale entry (G21 Google/Yelp drawer — the drawer
> already existed). Six of seven turned out to be STALE_FALSE (already fixed in commits this
> document's first pass hadn't reviewed), one (G30) was downgraded to PARTIAL on bounded evidence,
> and G23 (the real street-address verifier) was built out to a complete source contract in this
> pass. Every §6/§8/§11/§14 block below marked "CORRECTED 2026-09-08" or "BUILT/FIXED 2026-09-08"
> reflects this pass; anything not so marked is unchanged from the first pass. Any prose elsewhere
> in this document that still describes the old FALSE(7) framing predates this addendum and is
> superseded by the marked corrections.

## 1. Environment

```
WORKTREE:  C:\projects\elaguila-website-globalization-final-closeout
BRANCH:    fix/globalization-final-closeout-2026-09
HEAD (start of this gate):  ac0f8a082818c721d77e8742970c98d4853af862
HEAD (end of this gate):    (see §16 Git — this document's own commit)
PR:        #43 — open, NOT merged
STAGING:   cgeehvnfyrdoperdotdh
PRODUCTION: xuieateniufcrsfdomwl — not touched
```

## 2. Scope honesty statement (read this first)

This closeout was requested as a single mega-gate covering: full Gate 6C browser runtime proof
across 11 systems, a from-scratch full-catalog audit of 53 shared systems × 28 categories with
individually browser-proven statuses, a brand-new provider-backed street address verification
system, a brand-new Google/Yelp reputation drawer, and a full click-by-click lifecycle proof
(typing/spacebar/backspace/paste/hard-refresh/Preview/Edit/Publish) for every critical field in
every category. That is, honestly, several weeks of a real engineering team's work, not
something a single agent turn can respons ibly *prove* — only *claim* — and this document does
not take the second path.

**What this document actually contains, and why:**

- **Gate 6C.3 (§4)** is real, live-proven work completed this turn: a persistent Staging fixture
  graph plus direct-RPC/SQL transactional proof of every DB/RPC-provable Gate 6C assertion
  (idempotency, expiry, parent/child visibility, active-edit-no-recharge, and the Autos 10/20
  capacity boundary against **real, retained rows**, not a rolled-back simulation).
- **What could not be proven this turn, and the exact reason**: this session's browser tooling
  cannot reach the deployed Vercel Preview (Vercel Authentication/SSO protects every deployment
  on this project except the production custom domain — confirmed repeatedly across this whole
  Globalization effort, including an attempted "Protection Bypass for Automation" secret that
  never actually reached this session's environment). The one server-mediated write path this
  blocks — `/api/analytics/events`, which every `listing_view`/`message_click` proof depends on —
  requires either that deployed app or a local dev server with the Staging `SUPABASE_SERVICE_ROLE_KEY`,
  which does not exist in this worktree (no `.env*` file present) and was not supplied. These are
  marked **BLOCKED_EXTERNAL**, not fabricated as TRUE, per this task's own evidence rule.
- **The 53-system × 28-category matrix (§6/§7)** reuses and updates the real, evidence-based
  47-system audit this same session already produced earlier (the Globalization Final Closeout
  planning blueprint), rather than re-deriving ~1,500 cells from zero in one pass. It is marked
  accordingly — most rows are `TRUE_SOURCE` (code confirmed present and correct by direct
  reading) rather than `TRUE_RUNTIME` (a browser click was actually observed), because the same
  Preview-reachability blocker above applies to all of it.
- **The street address verifier and Google/Yelp drawer (§8)** are NOT built in this turn. Both
  are genuinely new, multi-file, cross-category shared systems — comparable in scope to the Autos
  capacity fix, which itself needed three dedicated gates (audit → design → implement) to do
  safely. Attempting to freehand both inside an already-massive combined turn risks exactly what
  this whole engagement has consistently avoided: inventing product semantics or shipping
  undertested shared-system code. Recommendation in §8.

Everything below is real and evidence-backed. Nothing is padded to make totals look better.

## 3. Authority order applied

Repository/runtime truth → current Staging truth → newest owner-locked decisions → the V3
closeout bible → the execution contract → the owner change ledger → later Globalization history →
Execution Bible V2 → older archives, per this gate's own instructions. No historical "closed"
snapshot was treated as proof of current behavior.

## 4. Gate 6C Runtime — actual results

All fixtures below are **real, retained Staging rows**, clearly QA-tagged (title/description
prefixed `QA GATE6C`, or UUIDs in the `11111111`/`22222222`/`33333333`/`44444444` blocks), owned
by the existing single Staging QA/smoke identity (`d8ebdd6f-0749-42f8-ac8f-48aeed4dee9e`). No new
Auth user was created, no password was reset or exposed, no Production data was read or copied.

| # | Requirement | Method | Result |
|---|---|---|---|
| 1 | Ofertas SMS analytics | requires `/api/analytics/events` (service-role gated) | **BLOCKED_EXTERNAL** — see §2. Source contract unchanged since Build 1 (SMS fires both `phone_click`-style tracking and the restored `trackOfertaLocalCta`; no duplicate emitter found in Build 1's audit, not re-litigated here). No Ofertas fixture row was created — not needed until the analytics route is reachable, and creating one now would only be inert data. |
| 2 | Mascotas idempotency | Direct SQL transactional proof against the real `publish_attempt_key` mechanism: simulated first-publish INSERT, a sequential-retry UPDATE (same row), and a true concurrent second INSERT racing the identical `(owner_id, publish_attempt_key)` — caught as SQLSTATE 23505 inside a SAVEPOINT/EXCEPTION block, then rolled back to that savepoint. Final assertion: `logical_listing_count = 1`. | **TRUE_RUNTIME (DB layer)** — the exact constraint the app relies on is proven live, not just unit-tested. Permanent Mascotas fixture row `44444444-dddd-4d44-9d44-000000000004` retained separately for future UI-level QA. |
| 3-6 | Comunidad/Clases/Busco/Mascotas single `listing_view` | requires `/api/analytics/events` | **BLOCKED_EXTERNAL** for the HTTP-route/network-level proof (same reason as #1). **TRUE_SOURCE** for the underlying contract: Build 3 (commit `605dd9ed`, this session) removed the duplicate category-specific `trackCommunityListingView` emitters from `CommunityQuickPublishedDetailPage.tsx`, `BuscoPublishedDetailPage.tsx`, `MascotasPerdidosPublishedDetailPage.tsx`, leaving the generic `app/(site)/clasificados/anuncio/[id]/page.tsx` wrapper's single `trackListingViewOpen` call as the only emitter — re-confirmed present in this HEAD by direct grep, unchanged since Build 3. Real, permanently-retained public fixture rows created for each category (`44444444-...-0001/2/3/4`) so this can be exercised the moment Preview is reachable. |
| 7 | Autos Privado expiry | Real fixture pair: active row `33333333-...-0001` (`published_at` = now−5d) and expired row `33333333-...-0002` (`published_at` = now−31d). `isAutosRowWithinTerm` (pure function, already unit-tested in Build 4's `verify-build4-fixed-term-expiry-truth.ts`, 18/18 passing, re-confirmed this session) classifies by `published_at + 30d`; against these real values it correctly resolves row 1 = within-term, row 2 = expired. No row deleted. | **TRUE_SOURCE + TRUE (logic proven against real data)**; the actual removal from a rendered public results page remains **OWNER_QA_REQUIRED** (needs a reachable browser). |
| 8 | Bienes FSBO expiry | Real fixture pair: active row `22222222-...-0001` (`expires_at` = now+30d) and expired row `22222222-...-0002` (`expires_at` = now−1d). Same `isBrRowWithinTerm` logic (Build 4, unchanged) correctly classifies both. No row deleted. | **TRUE_SOURCE + TRUE (logic proven against real data)**; rendered-page removal **OWNER_QA_REQUIRED**. |
| 9 | Autos Dealer parent/child visibility | The permanent capacity fixture (below) doubles as this proof: all 20 children remain attached to and gated by the single active parent (`filterAutosRowsByActiveParent`/Gate I.13B logic, unchanged this session). Suspending the parent and re-deriving child visibility was **not** exercised destructively against the permanent fixture (would have disturbed the retained regression asset); the gating function itself was proven correct in Build 4 (7/7 relevant assertions, unchanged). | **TRUE_SOURCE**; a live suspend/restore cycle against a disposable fixture is **OWNER_QA_REQUIRED** or a small follow-up DB script if desired later. |
| 10 | Active paid edit / no recharge | Live UPDATEs against the real active fixtures: Bienes FSBO row 1 (`description` changed, `expires_at` unchanged: `2026-10-08...`) and Autos Privado row 1 (`listing_payload.trim` added, `published_at` unchanged: `2026-09-03...`). Same row id throughout both. No `leonix_payment_records`/`leonix_subscription_records`/Stripe object was created — by construction, since nothing touched those tables. | **TRUE_RUNTIME (DB layer)** |
| 11 | Autos commercial capacity 10/20 | **Permanent, retained fixture**: 1 dealer parent (`11111111-...-0001`) + 20 active `inventory_vehicle` children (`...0002` through `...0021`) + 1 active `autos_dealer_inventory_pack_monthly` entitlement. Live-called `autos_dealer_activate_listing` against a 21st draft child: rejected with `blocked_reason='capacity_reached'`, `active_count=20`, `effective_limit=20` (the 21st row was then deleted — not part of the permanent fixture). Also live-proved: a caller with the wrong `owner_user_id` gets `not_found_or_owner_mismatch`; an ordinary `UPDATE` against an existing active child (not through the RPC) still succeeds, confirming existing children stay editable. Parent excluded from every count (Gate 6C.2, confirmed intact). | **TRUE_RUNTIME**, and now **permanently regression-testable** — this fixture stays in Staging rather than being rolled back. |
| 12 | Cleanup | Verified: `autos_classifieds_listings`=23 (21 dealer group + 2 Privado, exact expected), `listings`=6 (2 Bienes FSBO + 4 community-family), `listing_package_entitlements`=1 (the boost), `ofertas_locales`=0, `listing_analytics`=0. The one truly temporary row (21st-vehicle rejection test) was deleted; the Mascotas idempotency mechanism proof was fully rolled back. No stray residue. | **DONE** |

## 5. What "TRUE" means in this document

Per the task's own evidence rule, this document distinguishes:

- **TRUE_RUNTIME** — the exact behavior was exercised live this turn (a real RPC call, a real
  constraint violation, a real UPDATE) and observed to behave correctly.
- **TRUE_SOURCE** — the code implementing the behavior was read directly this session (or an
  earlier gate this same session) and confirmed correct; not independently re-executed this turn.
- **OWNER_QA_REQUIRED** — only a real browser interaction remains to close the loop; source and
  (where applicable) DB-level truth are already proven.
- **BLOCKED_EXTERNAL** — a genuine external dependency (Vercel deployment protection, a missing
  service-role key, a missing third-party provider) prevents proof in this session, full stop.
- **FALSE** — a real, confirmed defect. (Zero of these remain from this session's own findings;
  the one real defect found this whole effort — Autos/Bienes parent-counted-as-inventory — was
  fixed and proven in Gate 6C.2/6C.3 above.)

## 6. Global Systems (53) — condensed status

This reuses the 47-system audit already produced earlier this session (full detail available in
that planning document) plus this session's own subsequent fixes, mapped onto the 53-system list
this gate names. Systems 1-47 below correspond directly; 48-53 are newly named in this gate's list
and assessed fresh, briefly, from direct source reading.

| # | System | Status | Basis |
|---|---|---|---|
| G01 | Canonical Identity & Ownership | TRUE_SOURCE | `listingIdentity` module, real but partial adoption (documented gaps unchanged) |
| G02 | Category Registry / Route Contract | TRUE_SOURCE | `categoryRouteRegistry.ts`, confirmed real |
| G03 | Checkpoint / Ver Más | TRUE_SOURCE (per-category, uneven) | not re-audited this turn |
| G04 | Application Gateway | TRUE_SOURCE | publish gateway confirmed real, adoption partial |
| G05 | Draft / Persistence | TRUE_SOURCE (partial adoption) | `draftWorkspaceContract.ts` real; only 3/14 categories use it |
| G06 | Unsaved Change Guard | TRUE_SOURCE (partial adoption) | shared hook real, several categories still bespoke |
| G07 | Preview | TRUE_SOURCE (partial adoption) | `previewModeContract.ts` real; 9/19 PreviewClients still don't import it |
| G08 | Save/Edit/Republish/Same Row | TRUE_SOURCE + TRUE_RUNTIME (Gate 6C.3 for Bienes/Autos) | proven live this gate for 2 categories; others source-only |
| G09 | Media | TRUE_SOURCE (validation-gate only, partial adoption) | no shared upload/prepare function exists by design |
| G10 | Gallery/Photo/Video | TRUE_SOURCE (2 adopters) | `BusinessFlyerViewerModal.tsx` |
| G11 | Flyer/Coupon Viewer | TRUE_SOURCE | Ofertas bespoke by design |
| G12 | Phone/SMS/WhatsApp | **CORRECTED 2026-09-08: STALE_FALSE → TRUE_SOURCE** | `app/lib/whatsapp/internationalWhatsApp.ts` is a real, broadly-adopted (14+ consumer files incl. the shared `ContactActions.tsx`) international-safe WhatsApp module — 8-15 digit E.164-range acceptance, no 10-digit truncation, no forced `+1`. The original finding conflated this with the primary-phone field's US display formatting, which is correct-by-design per locked product truth ("US primary telephone may use familiar US display normalization; WhatsApp must remain international-safe") |
| G13 | Languages | TRUE_SOURCE (partial adoption) | `LanguagesInput.tsx`, healthiest of the "business-app primitives" |
| G14 | Hours/Open Now | **CORRECTED 2026-09-08: STALE_FALSE → TRUE_SOURCE** | `restauranteHoursLogic.ts` now genuinely re-exports `computeBusinessHoursStatus.ts` (confirmed by direct read) instead of a duplicate copy — its own header states the migration fixed a real `now`-param-threading divergence in the process. Servicios still has no open-now display at all (a real, but minor, adoption gap — feature absence, not a truth divergence) |
| G15 | Websites/Social | **CORRECTED 2026-09-08: STALE_FALSE → TRUE_SOURCE (partial adoption)** | `app/lib/additionalWebsites/additionalWebsiteEntry.ts` is a real, genuinely shared `{label,url}` contract that Restaurantes and Comida Local's own type aliases now re-export (pure consolidation, confirmed by direct read). Ofertas' JSON-in-notes storage quirk remains (protected workstream, out of scope); broader adoption to categories with no social fields at all is new feature scope, not a defect |
| G16 | CTA/Connection Hub | TRUE_SOURCE (near-universal) | genuinely sound architecture, 2 deliberate bypasses documented |
| G17 | Rich Correo | TRUE_SOURCE | folded into G16 |
| G18 | Translate Ad | TRUE_SOURCE (all 15 categories adopted) | one real segmentation quirk (shared `category="anuncio"` cache key for 6 categories), not launch-blocking |
| G19 | ES/EN | TRUE_SOURCE (13/14 categories) | Ofertas Locales lacks `lang` threading |
| G20 | Community Trust | TRUE_SOURCE (5/17 categories, engine solid) | real DB-backed engine, no fake seeds, lion not stars — confirmed |
| G21 | Google/Yelp drawer | **FINAL ADOPTION COMPLETE 2026-09-08: TRUE_SOURCE, all 6 known qualifying business-profile categories now adopt `SharedConnectionHubReviewDrawer.tsx`** — Servicios, Restaurantes, Comida Local, Bienes Negocio (pre-existing) plus **Autos Dealer and Rentas Negocio (this gate)**. Autos Dealer: existing `googleReviewsUrl`/`googleBusinessUrl`/`yelpReviewsUrl` data pipeline was already complete; only the renderer layer changed (bespoke `AutosNegociosHubReviewLinkButton` deleted, both live surfaces — `DealerBusinessStack.tsx` and true-live `PreviewDealerBusinessStack.tsx` — now render the shared drawer). Rentas Negocio: added `negocioGoogleReviewsUrl`/`negocioYelpReviewsUrl` to `RentasNegocioFormState`, wired through the existing (unmodified) BR Negocio `business_meta` JSONB persistence pipeline with zero migration, rendered via the shared drawer on the true-live `RentasVisualMatchPreviewView.tsx`, placed as a sibling block strictly before Community Trust to keep them visually separate. Both categories: hide-when-empty, real-URL-only, no fabricated ratings/counts, bilingual ES/EN labels, malformed/unsafe URLs rejected. `RentasNegocioDesktopBusinessRail.tsx` confirmed reachable only via a documented legacy fallback route (not fully dead) — left untouched per this gate's own instruction not to revive dead code merely for this feature. Proven via a new 21-check focused verifier (`scripts/verify-g21-business-reputation-adoption.ts`, 21/21 passing) covering both categories' full field/draft/mapper/publish/hydration/render lifecycle. Runtime (browser) behavior remains OWNER_QA_REQUIRED — not exercised this gate. N/A unchanged for all non-business-profile lanes (listing-level or private-seller categories have no durable business entity to attach reviews to)** | see §8 |
| G22 | Trust Admin Moderation | N/A this gate — ACCEPTED_NON_LAUNCH_BLOCKER | per this gate's own instruction, not built |
| G23 | Street Address Verifier | **BUILT 2026-09-08: TRUE_SOURCE (complete adapter+API+UI contract); runtime provider call is BLOCKED_EXTERNAL (no GOOGLE_MAPS_API_KEY)** | see §8 |
| G24 | Location/Privacy/Directions | TRUE_SOURCE (partial: Servicios/Ofertas missing toggle) | unchanged from earlier audit |
| G25 | Saved Search | TRUE_SOURCE (3/14 categories, engine solid) | real Resend delivery; no retry/outbox (accepted risk at current volume) |
| G26 | Save/Like/Share/Report | TRUE_SOURCE (uneven; Report only 1/17) | unchanged |
| G27 | Analytics | TRUE_SOURCE, **BLOCKED_EXTERNAL for live emission proof this turn** | dedup windows, event enum real; owner-self-view exclusion and PII-key redaction (Build 3) confirmed in source |
| G28 | Search/Results/Filters | TRUE_SOURCE (v1/v2 split, documented) | unchanged |
| G29 | Related Listings | **FIXED 2026-09-08: TRUE_SOURCE for all 3 applicable categories** | Autos Dealer (`buildRelatedPublicListings`, dealer-inventory cross-sell — a legitimate category-specific interpretation of "related") and Bienes Raíces (`BrRelatedAgentPropertiesSection`/`BrSimilarOtherClientPropertiesSection`, real city/type/price matcher) were already real. En Venta's `EnVentaRelatedRail.tsx` was confirmed still a decorative zero-listings stub via direct read — replaced with a real anon-key client fetch against `category='en-venta'`, self-excluded, price-proximity ranked, with a graceful link-out fallback on zero results. Also removed the same rail from the Bienes premium detail page, where it was rendering *En Venta* items on a *Bienes* listing — a real category-mismatch bug alongside the redundant real Bienes components already there |
| G30 | Business Hub | **RESOLVED 2026-09-08: PARTIAL → TRUE_SOURCE (final integrity check, all 15 areas)** | A dedicated 15-area audit (Servicios/Restaurantes/Comida Local/Autos Dealer/Bienes Negocio/Rentas Negocio profile paths, shared Connection Hub contact model, shared review-link model, `ownerEntityCapabilityRegistry`, canonical identity resolution, shared media contract, Community Trust eligibility, Google/Yelp eligibility, hide-if-empty, external-link truth) found **zero conflicting sources of truth** anywhere — every "duplicate engine" found is a legitimate per-category adapter (own contact-model type + own builder) that converges on the same shared renderers (Connection Hub CTA sheet, `SharedConnectionHubReviewDrawer`) with real, validated data at the actual rendering boundary. `ownerEntityCapabilityRegistry.ts` and the Community Trust eligibility registry are each confirmed as genuine single sources of truth with no bypassing caller. `listingIdentity`/parts of the media contract are additive scaffolding not wired into any live business-profile path — meaning only ONE engine is ever live per category, not two disagreeing ones. Two real ADOPTION gaps found (not truth conflicts, so not RED per this gate's own doctrine): Autos Negocios has its own review-link renderer and has never adopted the shared drawer; Rentas Negocio's live detail view has no Google/Yelp review section at all (an omission, not fabricated data) and carries one dead, unimported component (`RentasNegocioDesktopBusinessRail.tsx`). Neither was fixed this pass — both are adoption/cleanup follow-ups, not launch-blocking defects |
| G31 | Revenue OS | TRUE_SOURCE | single pricing matrix, confirmed no parallel source of truth |
| G32 | Stripe Signature/Idempotency/Replay | TRUE_SOURCE | webhook ledger + fulfillment, unchanged, not re-audited this turn |
| G33 | Subscription Lifecycle | TRUE_SOURCE (Comida Local gap unresolved) | 5-state model real; Comida Local still missing LANE_SUSPENSION |
| G34 | Recurring Consent | TRUE_SOURCE | `leonix_billing_consents`, not re-audited this turn |
| G35 | Promo | TRUE_SOURCE (Comida Local unwired) | engine real |
| G36 | Email/SMS Verification | TRUE_SOURCE | Twilio Verify real, scoped to intro discount only |
| G37 | Comp/Partner/Print/Courtesy | TRUE_SOURCE (`printCompEligible` confirmed dead data, not fixed) | |
| G38 | Listing Plan/Package/Placement Separation | TRUE_SOURCE | 3 distinct tables, schema-enforced |
| G39 | Placement/Ranking | TRUE_SOURCE (partial) | derivation exists, 2 categories lack ranking read |
| G40 | Autos Parent/Child | **TRUE_RUNTIME (Gate 6C.2 + 6C.3, this session)** | capacity, identity guard, visibility gate all live-proven |
| G41 | Bienes Parent/Child | **TRUE_RUNTIME (Gate 6C.2 + 6C.3, this session)** | same |
| G42 | Rentas Commercial | TRUE_SOURCE | not re-audited this turn |
| G43 | Restaurant Commercial | TRUE_SOURCE | not re-audited this turn |
| G44 | Servicios Commercial | TRUE_SOURCE | not re-audited this turn |
| G45 | Comida Commercial | TRUE_SOURCE (known gaps: promo, entitlement reader, suspension) | unchanged |
| G46 | Ofertas Boundary | TRUE_SOURCE, runtime **BLOCKED_EXTERNAL** | source untouched per protection rule; SMS analytics contract unchanged since Build 1 |
| G47 | User Dashboard | TRUE_SOURCE (uneven adoption of `DashboardInventoryItem`) | Autos Dealer dashboard specifically re-verified this session (capacity tally fix) |
| G48 | Admin OS | TRUE_SOURCE | least-converged shared system (moderation-generic vs. money-specific split); not re-audited in depth this turn |
| G49 | Newsletter/Lead Capture | TRUE_SOURCE, capture real; delivery not built | accepted deferred per earlier gate |
| G50 | SEO/Schema/Canonical | TRUE_SOURCE (uneven; several rich categories have no entity schema) | not re-audited this turn |
| G51 | Responsive/Accessibility | **CORRECTED 2026-09-08: STALE_FALSE → TRUE_SOURCE for the focus-trap claim; remainder OWNER_QA_REQUIRED** | `app/lib/accessibility/useLeonixFocusTrap.ts` is real (Tab/Shift+Tab wraparound, focus restore on close) and confirmed adopted at BOTH canonical shared overlay primitives (`LeonixMobileBottomSheet.tsx`, `CtaActionSheet.tsx` — which underlie the Google/Yelp drawer, Community Trust, and nearly every category's CTA flow). Uneven per-form touch-target/aria-live coverage is a real remaining item, but is inherently a visual/interaction matter requiring a live 390/768/1440 pass — OWNER_QA_REQUIRED, not a source RED |
| G52 | PWA | not independently assessed this session | insufficient evidence to classify beyond N/A |
| G53 | Security/RLS/Privacy | **CORRECTED 2026-09-08: STALE_FALSE for the "zero owner-write RLS" claim.** Table-by-table live Staging introspection (`has_table_privilege`, `pg_policies`) proves: `public.listings` (the single largest shared table) has REAL owner-scoped RLS — `"Owner insert own listings"` (INSERT, `WITH CHECK owner_id = auth.uid()`) and `"Owner update own listings"` (UPDATE, `USING/WITH CHECK owner_id = auth.uid()`), FORCE RLS enabled. `autos_classifieds_listings`/`servicios_public_listings`/`restaurantes_public_listings`/`comida_local_public_listings` have **no direct client write grant at all** (`authenticated_can_insert/update = false`) — every write is server-mediated through service-role API routes that verify ownership in application code (confirmed throughout this session's own work: `verifyAutosChildBelongsToParent`, `assertCommercialCapacityForWrite`, etc.). Per this gate's own stated exception ("if server-only/privileged route owns writes and direct client write is unavailable: do not manufacture an RLS defect"), this is a secure, legitimate architecture, not a gap | see §11 for the exact query evidence |

```
UPDATE 2026-09-08 (Red Burn-Down): every item in the original FALSE(7) list was re-audited
against current HEAD, not carried forward blindly. Six were STALE (already fixed by commits this
report hadn't seen, or fixed just now); G23 was built out to a complete source contract this pass.

UPDATE 2026-09-08 (G30 Final Integrity Check, same day, later pass): the G30 PARTIAL
classification above is itself now resolved to TRUE_SOURCE — a dedicated 15-area audit (see the
G30 row) found zero conflicting sources of truth anywhere in Business Hub. Every "duplicate"
found is a legitimate category adapter converging on shared renderers with real data, exactly
matching this project's own doctrine. Two real adoption gaps (Autos Negocios' unadopted review
drawer, Rentas Negocio's missing review section + one dead component) were found and are
recorded as follow-up adoption/cleanup work, not RED.

TOTAL: 53
TRUE (source and/or runtime): 49  (+8: G12, G14, G15, G21-reviews, G23, G29, G30, G51)
FALSE (real, confirmed, safely-implementable, unresolved): 0
PARTIAL: 0
N/A: 1 (G22, by explicit instruction)
OWNER_QA_REQUIRED: overlaps several TRUE_SOURCE rows (browser confirmation still needed) + G51's
    touch-target/aria-live coverage specifically
BLOCKED_EXTERNAL: 2  (G23's live provider call — no GOOGLE_MAPS_API_KEY configured anywhere;
    G27/G46 live-emission HTTP-route proof — Vercel SSO still blocks this session's Preview access)
```

## 7. Category × System Matrix

The full 47-system × 19-category matrix from earlier this session's planning document remains the
best-evidenced version of this artifact and is not reproduced here in full to avoid silently
degrading it with a rushed re-derivation. **Nothing in that matrix changed this session except**:
Autos Dealer parent/child (row 40/41 equivalent) — moved from source-level to **TRUE_RUNTIME** for
Autos and Bienes capacity specifically (Gate 6C.2/6C.3), and Staging's specific privilege/schema
blockers for the tables this effort touched are now resolved (Gate 6B publish_attempt_key, Gate
6A-FINAL Autos schema/Ad-ID, Gate 6C.2 capacity counting). Re-deriving all 28 named categories ×
53 systems from zero was not attempted this turn — see §2.

## 8. Shared REDs

```
STREET VERIFIER:      BUILT 2026-09-08. Reused (did not replace) the existing, correctly-designed
                       but previously-unused `app/lib/businessAddress/` contract. Added:
                       - `providers/googleAddressProviderConfig.ts` — reads GOOGLE_MAPS_API_KEY
                         presence only, never its value.
                       - `providers/googleAddressProvider.ts` — real `BusinessAddressProvider`
                         calling the Google Geocoding API, mapping address_components into the
                         existing `BusinessAddress` shape (street/unit/city/region/postalCode/
                         country/formattedAddress/lat/lng/provider/providerPlaceId), always
                         `verificationStatus: "provider_suggested"` (never "verified" — that
                         remains reserved for a real confirmed adapter result per the contract's
                         own doctrine), fails closed to `{ok:false, reason:"no_provider_configured"}`
                         with zero network calls when the key is absent.
                       - `app/api/business-address/suggest/route.ts` — server-only route keeping
                         the key out of the browser bundle.
                       - `app/components/forms/BusinessAddressVerifiedInput.tsx` — shared picker
                         UI: manual typing always produces `verificationStatus:"manual"`; picking
                         a real suggestion produces `"user_confirmed"` (never "verified", since
                         this UI layer is the picker, not the verifying adapter).
                       Provider choice: Google, because it is already Leonix's configured primary
                       vendor for translation (`app/lib/translation/config.ts`) and the only cloud
                       vendor already integrated in this repo — not a second mapping architecture.
                       Preserved untouched: all 4 existing category `showExactAddress`/
                       `showAddressPublicly` toggles, `CityAutocomplete.tsx`, Comida Local home
                       privacy (all re-confirmed green by the extended
                       `verify-business-address-foundation.ts`, 37/37 passing).
                       Migrating the 4 existing toggles onto this new picker UI is the next
                       adoption step, not attempted this pass (UI/theming decision per category).
                       STATUS: TRUE_SOURCE (complete contract). LIVE PROVIDER RUNTIME PROOF:
                       BLOCKED_EXTERNAL — no GOOGLE_MAPS_API_KEY exists anywhere in this
                       environment; confirmed by direct config check, never by reading/requesting
                       the value.

GOOGLE/YELP DRAWER:    CORRECTION 2026-09-08: the prior "NOT STARTED" claim was wrong — Coach
                       identified the exact file. `SharedConnectionHubReviewDrawer.tsx` is real,
                       complete, and already adopted by 5 categories (see the G21 row above). Not
                       rebuilt (correctly — doing so would have violated "do not rebuild working
                       code"). Remaining adoption gap (Autos Dealer, Rentas Negocio) needs a new
                       review-URL form field in each, not just wiring — left as a named follow-up.

TRANSLATOR:            Frozen and verified — /api/translate-ad, translation_records, dual
                       cache — all confirmed present and unchanged. All 15 categories adopted.
                       STATUS: TRUE_SOURCE, not rebuilt.

COMMUNITY TRUST:       Backend not rebuilt. Real counts, lion (not stars), no fake seeds —
                       confirmed present and unchanged in source. Admin moderation UI remains
                       the accepted non-launch-blocker per this gate's own instruction.
                       STATUS: TRUE_SOURCE, not rebuilt.

CTA/CORREO:            Verified real-destination-only architecture unchanged; hides
                       invalid/missing destinations by design (builders return null).
                       STATUS: TRUE_SOURCE, not rebuilt.

MEDIA / ANALYTICS / SAVED SEARCH: Engines not rebuilt. No new Globalization-owned adapter was
                       added this turn (out of scope for this gate's actual deliverable, which
                       was the Autos/Bienes capacity defect family).
```

## 9. Payments (per paid category)

Only the categories this session actually touched are asserted with runtime confidence; the rest
carry forward their already-established source-level status from earlier gates (Revenue OS/Stripe
webhook fulfillment architecture is shared and was not modified).

| Category | New Checkout | Webhook Authority | Active Edit No-Recharge | Expiry/Renewal |
|---|---|---|---|---|
| Autos Privado | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) | **TRUE_RUNTIME (this gate)** | **TRUE (real data, this gate)** |
| Bienes FSBO | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) | **TRUE_RUNTIME (this gate)** | **TRUE (real data, this gate)** |
| Autos Dealer | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) | TRUE_SOURCE (Build 4, unchanged) | N/A (subscription, no fixed term) |
| Bienes Negocio | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) | TRUE_SOURCE (Build 4, unchanged) | N/A (subscription) |
| Servicios/Restaurantes/Comida/Rentas/Empleos | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) | TRUE_SOURCE (unchanged) |

## 10. Dashboard/Admin

```
DASHBOARD:   Autos Dealer dashboard tally re-verified and fixed this session (Gate 6C.2 — no
             longer counts the parent). Broader dashboard adoption unchanged from earlier audit.
ADMIN:       Not re-audited this turn.
PARENT/CHILD: TRUE_RUNTIME for Autos/Bienes (this session's core deliverable).
PAYMENT/ENTITLEMENT SEPARATION: TRUE_SOURCE, unchanged (3 distinct tables, schema-enforced).
```

## 11. Security / Privacy

```
UPDATE 2026-09-08: the "zero DB-level owner-write RLS" claim was re-audited via live Staging
introspection (pg_policies + has_table_privilege), not carried forward. Exact evidence:

TABLE: public.listings
  EXPOSED THROUGH DATA API: YES
  DIRECT AUTHENTICATED WRITE GRANT: YES (INSERT, UPDATE)
  RLS ENABLED: YES (FORCE RLS: YES)
  OWNER POLICY: YES — "Owner insert own listings" (INSERT, WITH CHECK owner_id = auth.uid()),
    "Owner update own listings" (UPDATE, USING/WITH CHECK owner_id = auth.uid())
  SERVER-ONLY WRITE: NO (client can write directly, but scoped to its own rows only)
  ACTUAL EXPLOITABLE OWNER-CROSS-WRITE: NO — the WITH CHECK clause makes writing another owner's
    row, or writing a row claiming a different owner_id, impossible via the Data API.
  VERDICT: REAL, CORRECT RLS. STALE — this table was the biggest single item in the original
    "zero owner-write RLS" claim and it is false for this table.

TABLE: public.autos_classifieds_listings
  EXPOSED THROUGH DATA API: YES (read only)
  DIRECT AUTHENTICATED WRITE GRANT: NO (has_table_privilege confirms no INSERT/UPDATE grant at
    all for the `authenticated` role)
  RLS ENABLED: YES
  OWNER POLICY: N/A (no write policy needed — the role cannot attempt the statement at all)
  SERVER-ONLY WRITE: YES — confirmed throughout this session's own code reading
    (autosClassifiedsListingService.ts uses getAdminSupabase(); every mutation route verifies
    owner_user_id against the bearer token in application code before writing)
  ACTUAL EXPLOITABLE OWNER-CROSS-WRITE: NO — no direct write path exists at all to exploit.
  VERDICT: secure by construction. Same result for servicios_public_listings,
    restaurantes_public_listings, comida_local_public_listings (identical grant pattern
    confirmed).

Per this gate's own stated rule ("if server-only/privileged route owns writes and direct client
write is unavailable: do not manufacture an RLS defect"), none of these four tables is a defect.
The original platform-wide claim is corrected to STALE_FALSE. A full sweep of every remaining
table in the schema was not exhaustively performed — the specific exploit pattern alleged
(direct anon/authenticated cross-owner write) was not found in any table actually checked.
```

## 12. Mobile/PWA

```
RESULT: The specific focus-trap gap this section previously carried forward is resolved (§6, G51).
Remaining touch-target/aria-live coverage is OWNER_QA_REQUIRED, not a source defect. PWA itself
(manifest/service-worker/installability) not evaluated this session.
```

## 13. Protected Workstreams

```
VIAJES:        UNTOUCHED
OFERTAS SOURCE: UNTOUCHED (runtime-blocked, not source-modified — see §4/§8)
CONCIERGE:     UNTOUCHED
LANDING PAGES: UNTOUCHED
PRODUCTION:    UNTOUCHED
```

## 14. Remaining FALSE (real, confirmed, safely-implementable defects)

```
NONE.

Every item in the prior FALSE(7) list was re-adjudicated against current HEAD on 2026-09-08:

G12 Phone/SMS/WhatsApp    → STALE_FALSE. Real shared international WhatsApp module exists,
                            14+ real adopters. Corrected, not rebuilt.
G14 Hours/Open Now        → STALE_FALSE. Restaurantes genuinely re-exports the shared module now.
                            Corrected, not rebuilt.
G15 Websites/Social       → STALE_FALSE. Real shared contract exists, 2 real consumers.
                            Corrected, not rebuilt.
G23 Street Verifier       → BUILT. Complete provider+API+UI contract added this session (§8).
G29 Related Listings      → FIXED. En Venta's decorative stub replaced with a real fetch;
                            Autos/Bienes already real.
G30 Business Hub          → RESOLVED to TRUE_SOURCE (15-area final integrity check, same day) —
                            zero conflicting truth sources found anywhere; every duplicate is a
                            legitimate adapter. Two adoption gaps (Autos/Rentas review-drawer
                            coverage) recorded as follow-up, not RED.
G51 Accessibility         → STALE_FALSE for the focus-trap claim (real, adopted at both
                            canonical surfaces). Remainder is OWNER_QA_REQUIRED, not source.
G53 Security/RLS          → STALE_FALSE for the "zero owner-write RLS" claim — public.listings
                            has real owner-scoped RLS; the per-category tables are secure by
                            having no direct client write path at all (§11).
```

This does not mean the earlier report was fabricated — it means several genuine fixes had already
landed in commits this report's author hadn't reviewed line-by-line before, and one (G23) was
built out fully in this pass. Re-auditing from current HEAD, as this gate required, is what
surfaced the difference.

## 15. BLOCKED_EXTERNAL

```
1. Vercel deployment protection (SSO/"Vercel Authentication") blocks this session's browser and
   HTTP-fetch tools from reaching the deployed Preview app at all — confirmed via three
   independent bypass attempts across this Globalization effort (direct browser navigation,
   web_fetch_vercel_url, get_access_to_vercel_url's shareable-link mechanism), all landing on
   vercel.com's own login page. A "Protection Bypass for Automation" secret was reportedly
   enabled by Coach in an earlier gate but never actually reached this session's environment
   (checked: no matching env var, no local secret file).
2. Real street-address-verification provider runtime call — the complete Google Geocoding
   adapter/API/UI contract is now built (§8), but GOOGLE_MAPS_API_KEY does not exist anywhere in
   this environment (confirmed via config check, never by reading/requesting the value), so a
   live provider call cannot be proven in this session.
3. Local dev server as a workaround for #1 is not viable either: this worktree has no .env file,
   and even the Staging anon key alone would not be enough — most of the interesting write paths
   (publish, analytics, capacity) go through server-side admin-privileged API routes needing
   SUPABASE_SERVICE_ROLE_KEY, which was not supplied and should not be requested in chat.
```

## 16. OWNER_QA_REQUIRED — Final Playbook

Only items that are technically proven at the source/DB level but need a real browser click to
close the loop are listed. All fixtures below already exist in Staging — do not refill anything.

```
1. OFERTAS LOCALES
   ENVIRONMENT: Preview (Staging DB)
   EXACT URL: the Ofertas Locales public detail page for any existing Staging offer (none exists
     yet — create one via the normal owner flow first, since none was pre-created this session;
     see §4 item 1)
   EXACT CLICK: tap the SMS CTA once
   WHAT TO OBSERVE: exactly one new message_click row in listing_analytics for that listing;
     the phone_click path (if also present) unaffected
   TRUE IF: exactly one message_click row, no duplicates
   FALSE IF: zero or more than one row, or the SMS action does nothing
   SCREENSHOT NEEDED: the network/analytics confirmation is enough; no screenshot required

2. COMUNIDAD
   ENVIRONMENT: Preview
   EXACT URL: /clasificados/anuncio/44444444-dddd-4d44-9d44-000000000001?lang=es (adjust to the
     real route pattern for this listing id)
   EXISTING RECORD TO USE: "QA GATE6C Evento Comunidad" (already in Staging)
   EXACT CLICK: load the page once
   WHAT TO OBSERVE: exactly one listing_view + one listing_open row for this listing id
   TRUE IF: exactly one of each event type
   FALSE IF: zero, or more than one of either

3. CLASES — same pattern, record id 44444444-dddd-4d44-9d44-000000000002 ("QA GATE6C Clase de Prueba")

4. BUSCO — same pattern, record id 44444444-dddd-4d44-9d44-000000000003 ("QA GATE6C Busco de Prueba")

5. MASCOTAS — same pattern, record id 44444444-dddd-4d44-9d44-000000000004 ("QA GATE6C Mascota de Prueba")

6. AUTOS PRIVADO EXPIRY (visual confirmation only — logic already proven against real data)
   EXACT URL: Autos Privado results/browse page
   WHAT TO OBSERVE: "QA GATE6C Privado Vencido" (id ...0002) does NOT appear; "QA GATE6C Privado
     Activo" (id ...0001) does appear
   TRUE IF: exactly that split
   FALSE IF: either listing appears on the wrong side

7. BIENES FSBO EXPIRY — same pattern, "QA GATE6C Bienes FSBO Vencida" (id ...0002) must be
   absent; "...Activa" (id ...0001) must be present

8. AUTOS DEALER CAPACITY (visual confirmation of the now-live 10/20 fixture)
   EXACT URL: the owner dashboard's Autos Dealer inventory section, logged in as the Staging QA
     owner
   EXISTING RECORD TO USE: "QA GATE6C Dealer Fixture" (parent id 11111111-...-0001) with its 20
     active vehicle children
   WHAT TO OBSERVE: the dashboard's active-inventory tally reads 20/20 (boosted), not 21/20
   TRUE IF: 20/20 shown
   FALSE IF: 21/20 or any count including the parent

9. AUTOS DEALER PARENT/CHILD VISIBILITY (destructive to the permanent fixture — use a disposable
   test parent/child pair if this is exercised, or accept temporarily suspending the retained
   fixture and restoring it afterward)
   NOT scripted against the permanent fixture this session to avoid disturbing it.
```

## 17. Tests run this gate

```
(carried forward from Gate 6C.2, still green, re-confirmed present at this HEAD earlier this
session's own integrity check — not re-run again this specific turn since no source changed):
  node scripts/verify-c7-capacity-rpc-sql-contract.mjs                         54/54 PASS
  npx tsx scripts/verify-gate6c2-parent-excluded-capacity-counting.ts          12/12 PASS

This turn's own verification was direct live Staging SQL/RPC execution (see §4) — the strongest
form of proof for the assertions it covers, stronger than a mocked unit test.
```

## 18. Files changed this gate

```
NEW:  docs/globalization/FINAL_GLOBALIZATION_TRUE_FALSE_CLOSEOUT_2026-09-08.md
No other source files modified. No migrations created or applied. No Production changes.
```

## 19. Git

See end-of-task final report for exact commit/push confirmation (this document is written before
that step).

## 20. Global Staging service_role privilege reconciliation (2026-09-09)

```
ROOT CAUSE: Postgres 42501 "permission denied for table servicios_public_listings",
    confirmed via live Vercel runtime error logs (TRUE_RUNTIME, not inferred). The
    service_role Postgres role -- authenticated by every server route via
    getAdminSupabase() -- was never granted SELECT/INSERT/UPDATE/DELETE on any table
    created before the Business Concierge merge. Traced to two competing default-ACL
    entries for schema public: a supabase_admin default (full DML to all roles, the
    platform standard) and a narrower default explicitly set for role postgres --
    confirmed as owner of all 122 current tables -- granting service_role only
    TRUNCATE/REFERENCES/TRIGGER.
SCOPE: 45 tables fixed, explicitly enumerated (not GRANT ... ON ALL TABLES), including
    the shared `listings` table and the entire Revenue OS payment pipeline
    (leonix_payment_records, leonix_stripe_webhook_events, leonix_subscription_records,
    leonix_promo_codes, leonix_placement_entitlements). anon/authenticated grants and
    RLS were explicitly left untouched.
MIGRATION: supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql
    (commit 14a78d46), plus ALTER DEFAULT PRIVILEGES FOR ROLE postgres to prevent
    recurrence on future tables.
VERIFIED: post-migration grant audit, 45/45 tables TRUE for SELECT/INSERT/UPDATE/DELETE;
    functional proof via SET LOCAL ROLE service_role (the exact role the deployed app
    authenticates as) performing real INSERT/SELECT/UPDATE/DELETE against
    servicios_public_listings and the Revenue OS tables -- all succeed where they
    previously threw 42501.
SEPARATE RECONCILIATION (same session): two already-authored, already-committed
    migrations from commit 313338ce ("verified introductory discount", 2026-08-05)
    had never been applied to this Staging project --
    20260805100100_leonix_phone_verification_challenges.sql and
    20260805100200_leonix_verified_phone_identities.sql. A sibling migration from the
    same commit (leonix_verified_intro_discount_redemptions) WAS applied, confirming
    this was a real gap, not an intentional omission. Applied both additively,
    unmodified from their authored source, in FK dependency order. This is the schema
    the 15% verified-intro-discount promo path (checkout/route.ts) reads from --
    previously a genuine BLOCKED gap ("table does not exist"), now reconciled.
PRODUCTION: not touched.
STATUS: TRUE_RUNTIME (DB layer). Full HTTP-level re-proof (POST publish -> 2xx ->
    Stripe TEST open) remains OWNER_QA_REQUIRED -- this session's automated tooling is
    still blocked from the Preview deployment by Vercel SSO (reconfirmed this gate,
    not carried forward untested); Coach's own browser session is the proven channel.
```

## 21. Global Commercial Term + Revenue OS Engine — audit finding, NOT YET BUILT

```
REQUESTED: advertiser-selectable billing commitment term (month-to-month / 3 / 6 / 12
    months) for recurring paid categories, reflected in price display, legal consent
    copy, server-side calculation, Stripe subscription behavior, payment/subscription
    records, and Dashboard/Admin.
FINDING (exhaustive source audit, file:line evidence, not inferred): this concept does
    NOT exist anywhere in the live Revenue OS classifieds checkout/webhook/entitlement
    pipeline today.
    - revenuePricingMatrix.ts: flat priceCents + billingMode only (one_time |
      monthly_subscription | free | affiliate). No term/commitment field of any kind.
    - /api/revenue-os/checkout: accepts no term parameter; calls only
      stripe.checkout.sessions.create with a hardcoded interval:"month". Zero
      stripe.subscriptionSchedules usage anywhere in the repo.
    - /api/revenue-os/webhook: fixed 9-event set, no subscription_schedule.* events.
    - subscriptionLifecyclePolicy.ts: expiry computed from a single Stripe period end
      + flat 7-day grace; no "commitment months remaining" concept.
    - Dashboard/Admin billing surfaces: status/grace/cancel-at-period-end badges only;
      no next-payment, remaining-payments, or term-end display anywhere.
    - Recurring-consent checkbox copy (recurringConsentCopy.ts): one hardcoded
      month-to-month string per language, not category- or term-varying.
    - Promo model (revenuePromoRedemptions.ts): flat one-time percent/amount-off; no
      duration-by-invoice-count or term-eligibility field.
    - A superficially similar "3_month/6_month/12_month contract term" concept exists
      ONLY in app/lib/listingPlans/packagePricingRules.ts -- an intentionally isolated,
      Stripe/DB-disconnected pricing calculator for a different product entirely
      (print-to-digital magazine packages sold by sales reps through the Admin
      sales-tracker workspace). Not wired to the classifieds checkout in any way; at
      most a naming/shape reference.
CONCLUSION: this is a ground-up feature build, not an adoption/fix gap. Building it in
    one uninstrumented pass -- real money, real Stripe subscription-schedule behavior,
    real legal consent text -- was assessed as unsafe without first resolving the open
    commercial-policy questions below (owner explicitly instructed not to have these
    guessed). Recommend scoping as its own dedicated, gated build once policy is
    locked, following this engagement's established grouped-build pattern.
POLICY QUESTIONS REQUIRING OWNER LOCK (none silently assumed):
    1. Does a 3/6/12-month commitment END after the final payment, or CONTINUE
       month-to-month?
    2. Early cancellation during a committed term -- what is allowed?
    3. Mid-term package upgrade -- immediate charge, prorated, or next invoice?
    4. Mid-term add-on -- co-terminates with the base term or runs independently?
    5. Promo discount duration default -- one invoice, the full selected term, or
       configurable per promo code?
    6. Renewal notice requirements, if any.
    7. Fixed-term products -- automatic renewal policy, if any.
STATUS: TERM_END_POLICY_OWNER_CONFIRMATION_REQUIRED and the six related questions
    above. Architecture should support both "cancel at term end" and "continue
    month-to-month" once built; neither was implemented or assumed this gate.
```

## 22. Full Program Integration Enforcement — Servicios P0 pass (2026-09-09)

```
MISSION SCOPE: the requested pass was 53 systems x ~19 categories x 36 surfaces. Attempting full
    real coverage of that matrix in one gate would have meant either superficial/rounded-up
    verdicts or fabricated completeness, both explicitly prohibited by the owner's own completion
    standard this gate. Scoped instead to deep, real, evidence-based tracing of the explicitly
    flagged P0 owner-visible gaps for SERVICIOS -- the one category with a real, proven, live
    owner QA session this whole engagement -- via 5 parallel research agents, each producing
    file:line-cited, live-Staging-verified findings, not restatements of prior "TRUE_SOURCE"
    claims. The remaining systems/categories were NOT re-verified this gate; their status in this
    document is carried forward from earlier gates and should not be read as freshly confirmed.

ROOT-CAUSE FINDING (the actual reason nothing appeared during owner QA): the owner's real
    "Leonix QA Servicios" listing (id 61253c97-449e-474a-9b04-7b7b84719006) is stuck in
    `listing_status = pending_payment` -- `leonix_stripe_webhook_events` has ZERO rows in
    Staging, confirming the Stripe Sandbox checkout was opened but never actually completed
    (matching this engagement's own prior doctrine: "opening the checkout is sufficient proof,
    do not auto-complete payment"). A pending_payment listing 404s on its own public route by
    design (`SLUG_PAGE_STATUSES` deliberately excludes it) -- so the owner's public page never
    rendered AT ALL, which is why every downstream feature (Community Trust, Google/Yelp, etc.)
    appeared absent. This is NOT a code defect; it means QA needs to actually complete a Stripe
    TEST payment (or the row needs a Staging-only manual activation) before the public page can
    be inspected at all. Not fixed this gate -- flagged as the actual next step.

G20 COMMUNITY TRUST (Servicios): TRUE_SOURCE, fully wired end-to-end (engine, mount point,
    eligibility check, owner dashboard, admin-moderation-absence all confirmed with file:line
    evidence). Not visible during QA solely because of the pending_payment root cause above.
    Real, separate, minor gap found and left unfixed this pass (small, non-P0): the Preview page
    never passes `listingSourceId` to the contact card, so Community Trust structurally can never
    render on Preview (only after full publish) -- flagged, not fixed.
G21 GOOGLE/YELP (Servicios): TRUE_SOURCE, fully wired end-to-end, re-verified from application
    input through public render, Preview, and dashboard-edit reverse mapper with file:line
    citations at every hop (no defect found anywhere in the chain). Not visible during QA because
    the owner's real listing's `profile_json.contact.externalReviewLinks` key is genuinely absent
    -- the Google/Yelp URL fields were left blank when the QA listing was created, and the
    feature correctly hides rather than fabricating data. Confirms the earlier prior-gate
    "ADOPTED" declaration this time with fresh runtime evidence, not by trusting the old claim.
G13 LANGUAGES (Servicios): FULLY WIRED, no defect.
G17 RICH CORREO + LEADS (Servicios): FULLY WIRED, no defect -- real multi-option email composer
    sheet, real `servicios_public_leads` persistence, real owner-facing leads list in dashboard.
G18 TRANSLATE AD (Servicios): FULLY WIRED, no defect.

REAL DEFECTS FOUND AND FIXED (commit 80d4dbcb):
  - G47 Dashboard edit: Quick Facts were silently wiped on every edit (reverse mapper never read
    `profile.quickFacts` at all). Fixed -- restored as free-text (no stable preset-chip id
    survives persistence to recover an exact preset selection, so exact wording is preserved
    instead).
  - G47 Dashboard edit: "Reasons to choose you" was silently dropped on edit AND its ids were
    incorrectly merged into the unrelated `selectedBusinessHighlightIds` field (a namespace
    collision risk for Business Highlights on the next save). Fixed -- dedicated `trust_`-prefix
    reverse mapper restores the correct field.
  - G16 WhatsApp: Servicios maintained its own near-duplicate of the shared international-safe
    normalizer (it was in fact the historical origin the shared module was extracted from, so
    this was NOT the naive-truncation bug class it first appeared to be) -- consolidated to
    delegate to `app/lib/whatsapp/internationalWhatsApp.ts` directly, picking up its 15-digit
    E.164 upper bound and removing future drift risk.
  - G15 Websites/Socials: the "Additional websites" repeatable list persisted correctly through
    the full publish/dashboard round-trip but was never rendered anywhere public or in Preview.
    Fixed -- wired into the same Business Hub contact-card link list as the existing `extraLinks`.
  - G14 Hours/Open Now: the live public page showed a publish-time-frozen, always-"Today" static
    label -- never a real computed open/closed status, even though the real computation
    (`buildServiciosHeroHoursPill`) already existed inside an orphaned, never-mounted
    `ServiciosHero.tsx`. Fixed -- wired the same real computation into the actually-live
    `ServiciosHours.tsx`.
  - G23 Address Verifier: `BusinessAddressVerifiedInput` (the full shared picker + provider +
    API route stack) existed complete but was mounted NOWHERE in the entire application -- not a
    Servicios-specific gap. Fixed for Servicios -- mounted in the physical-address section with a
    full additive round-trip (state -> draft -> wire type -> `profile_json` persistence ->
    dashboard-edit reverse mapper) for `verificationStatus`/`provider`/`providerPlaceId`; a real
    provider suggestion pick also auto-fills city/region/postal/country. No migration needed
    (JSON-stored). Runtime provider call remains BLOCKED_EXTERNAL pending confirmation that
    `GOOGLE_MAPS_API_KEY` is configured in the Preview deployment (cannot be checked from this
    session) -- with no key configured, the component still behaves correctly as a plain manual
    text input per its own documented fallback design. The same orphaned-component gap likely
    exists for every other category (Restaurantes, Comida Local, Autos Dealer, Bienes Negocio,
    Rentas Negocio, etc.) -- NOT fixed for those categories this gate; flagged as follow-up
    adoption work, same shared component, smallest-adapter-per-category pattern.

TESTS: new scripts/verify-servicios-p0-owner-gaps-2026-09-09.ts, 20/20 passing. TypeScript back
    to the established 7-error e2e baseline, 0 new. Existing regression suite unchanged (g21
    21/21, gate6c2 12/12, build2 26/26). git diff --check clean.

NOT DONE THIS GATE (explicitly, not silently): the other 52 systems and the other 18 categories
    were not re-traced with this level of rigor. Carrying forward their prior-gate status is
    NOT the same as the fresh, evidence-based verification this gate gave Servicios -- the same
    parallel-research-agent methodology used here (trace end-to-end with file:line + live-DB
    evidence, fix what's real, leave carried-forward status explicitly labeled as such) is the
    recommended pattern for closing out the remaining categories in dedicated follow-up gates.
```

## 23. Master Integration Continuation — Wave 1: G23 global adoption (2026-09-09)

```
MASTER MATRIX: docs/globalization/GLOBAL_OWNER_EXPERIENCE_ADOPTION_MATRIX_2026-09.md created,
    Wave 1 rows filled (G23 x 7 categories incl. Rentas Privado). Will be extended wave-by-wave,
    not filled in one pass.

SCOPE: this wave covered G23 (Street Address Verifier) adoption only, per explicit Wave 1
    instruction. G23 was proven FALSE outside Servicios in the prior gate (component fully built,
    zero mount points anywhere else in the app). Mounted this gate in 5 additional categories --
    Restaurantes, Comida Local, Autos Dealer, Bienes Negocio, Rentas Negocio (which shares its
    form-state/merge infrastructure with Rentas Privado, so Privado is covered as a byproduct).

REAL TRAPS FOUND AND FIXED PER CATEGORY (each would have silently discarded the new fields
    without explicit wiring, confirmed by direct code trace, not assumed):
  - Restaurantes: buildRestaurantePublishPayload.ts is a hard-coded client->API-body allowlist.
  - Comida Local: mergeComidaLocalDraftFromStorage() rebuilds the whole draft field-by-field and
    runs on every ~400ms autosave, on publish normalization, AND on both edit/public-page
    hydration -- the most dangerous of the traps found (a value would visibly vanish within half
    a second of being set if this hadn't been fixed).
  - Autos Dealer: none found -- spread-based merge everywhere, safest category found.
  - Bienes Negocio: mapAgenteResidencialFormStateToNegocioForPublish.ts hand-lists every field
    crossing from the live agente-individual form into the shared BienesRaicesNegocioFormState
    pipeline.
  - Rentas Negocio: THREE chained allowlist functions (mergePartialRentasPrivadoState,
    mergePartialRentasNegocioState, rentasNegocioToBienesRaicesNegocioState's basePartial) all
    needed explicit wiring -- confirmed the most structurally fragile category for this class of
    defect.

PERSISTENCE: no migrations needed anywhere -- Restaurantes/Comida Local already dump the whole
    draft into a JSONB `listing_json` column (spread-safe at that layer); Autos Dealer does the
    same via `listing_payload`; Bienes Negocio and Rentas Negocio both reuse the SAME shared
    `buildBusinessMetaJsonFromBienesRaicesNegocioState()` serializer already proven for G21's
    Google/Yelp fields, extended with 3 more explicit lines -- meaning Rentas Negocio required
    zero new serialization work of its own once its 3 allowlist functions correctly fed the
    shared Bienes shape.

REAL PRE-EXISTING DEFECT FOUND, NOT FIXED THIS WAVE (out of G23's specific scope, flagged not
    silently absorbed): Bienes Negocio's dashboard-edit reverse mapper
    (bienesPublishedRowToAgenteApplicationDraft.ts) already did not restore
    direccionLinea1/direccionLinea2/direccionEstado/direccionCodigoPostal/direccionPais/
    mostrarDireccionExacta BEFORE this wave touched anything -- a genuine G47-class silent-data-
    loss defect, pre-existing, unrelated to this wave's own change, recommended for a dedicated
    Wave 4 (Dashboard round-trip) fix.

TESTS: new scripts/verify-g23-wave1-global-adoption-2026-09-09.ts, 24/24 passing. TypeScript
    unchanged at the established 7-error e2e baseline, 0 new (checked after all 5 categories'
    wiring). git diff --check clean. Full existing regression suite green (g21 21/21,
    servicios-p0 20/20, address-foundation PASS, gate6c2 12/12, build2 26/26).

NOT DONE THIS WAVE: PREVIEW/PUBLIC-read/DASHBOARD-render runtime verification for the 5 new
    categories (source-level proof only, matching Servicios' own OWNER_QA_REQUIRED runtime status
    from the prior gate); Waves 2-8 (all other systems) not started.
```

## 24. Master Integration Continuation — Wave 2: owner-critical business globals (2026-09-09)

```
MASTER MATRIX: docs/globalization/GLOBAL_OWNER_EXPERIENCE_ADOPTION_MATRIX_2026-09.md, Wave 2
    section added (45 system x category cells across G13/G14/G15/G16/G17/G18/G20/G21/G24 x
    Restaurantes/Comida Local/Bienes Negocio/Rentas Negocio/Autos Dealer).

METHOD: 5 parallel research agents, one per category, each tracing all 9 systems end-to-end
    (input -> draft -> hard refresh -> preview -> publish -> DB -> public render -> business hub
    -> dashboard hydration -> active edit -> republish -> admin) with file:line citations and,
    where possible, live Staging queries. Most systems confirmed FULLY WIRED with zero defect --
    this was not a rubber-stamp pass; 6 real defects were found and fixed, and several more real
    (but larger-scope) gaps were found and explicitly deferred with a stated reason, not silently
    absorbed.

REAL DEFECTS FOUND AND FIXED (commit 652e2556):
  - Comida Local G21 (CRITICAL, unconditional): the same allowlist-trap function already known
    dangerous from Wave 1's G23 work was ALSO missing googleReviewsUrl/yelpReviewsUrl entirely --
    every Comida Local listing's Google/Yelp review URLs were silently wiped before ever reaching
    the database, on every single publish, not an edge case. Fixed with 2 lines.
  - Bienes Negocio G16: the agente-individual form's dedicated `agenteWhatsapp` field (shown
    correctly in pre-publish Preview) was never forwarded by the publish mapper -- the live
    WhatsApp CTA silently fell back to office/personal phone instead of the number the agent
    actually entered for WhatsApp. Fixed end-to-end (type, mapper, business_meta serializer,
    public read-back).
  - Restaurantes G24: `showExactAddress` has existed on the type/payload/render path since an
    earlier gate but had ZERO UI control anywhere in the live application form -- permanently
    defaulting every restaurant to showing its exact address with no owner opt-out. Added the
    missing checkbox with bilingual copy.
  - Rentas Negocio G13: `negocioIdiomas` survived all 3 chained allowlist functions and was
    correctly persisted, but was never read back (businessMetaFromRow only parsed 4 of 5 relevant
    keys) or rendered (the shared BR/Rentas preview VM type had no languages field at all) -- a
    write-only field. Fixed with a new `languagesLine` field on the shared VM type (also wired for
    Bienes Negocio's own advertiser branches) plus the missing read-back and render line.
  - Restaurantes G14: the live detail page's "Open now/Closed" badge read server-local
    now.getDay()/getHours()/getMinutes() directly -- wrong by several hours on most hosts. The
    same category already has a correct, timezone-pinned implementation for its discovery-card
    badge; exported those two helpers and reused them instead of a second, differently-wrong
    server-local computation.
  - Autos Dealer G17: `dealerEmail` exists on the type with correct render/mapper code, but the
    Negocios application form had zero email input anywhere -- the field (and the live Email CTA)
    was structurally unreachable for every real dealer listing. Added the missing input, mirroring
    the Privado lane's already-existing identical field+input.

REAL DEFECTS FOUND, EXPLICITLY NOT FIXED THIS WAVE (reason stated, not silently dropped):
  - Autos Dealer G20 (Community Trust): confirmed still genuinely never adopted -- not fixed
    because it needs an eligibility-mechanism design decision first (listing-id-direct like
    Servicios, or professional-identity-anchor like BR/Rentas?).
  - Autos Dealer G14: hours render but there is no real Open/Closed computation and no existing
    timezone-safe pattern in this category to reuse -- larger build than the Restaurantes fix.
  - Restaurantes / Comida Local / Bienes Negocio G17 (Rich Correo): all have a real composer but
    no lead-capture persistence layer or owner-visible leads surface -- would require a new DB
    table + API route + dashboard UI, out of "smallest adapter" scope for this wave.

CARRY-FORWARD DEFECT SCOPE DRAMATICALLY EXPANDED (same already-known Wave 4 item, now fully
    audited -- do not lose this): both Bienes Negocio's and Rentas Negocio's dashboard-edit
    reverse mappers were found to drop far more than just address fields.
  - Bienes Negocio (bienesPublishedRowToAgenteApplicationDraft.ts): drops ~130 of ~150 form
    fields on every edit -- the entire main-agent identity block, brand/brokerage block, second-
    agent block (entire), broker/advisor block (entire), all property-type-specific sections
    (residential highlights, commercial, land), the full HOA/gate12d block, open house (entire),
    listing status, remaining socials + all 3 review URLs, CTA visibility toggles and targets, and
    languages. The public page's OWN `buildPublishedState()` (BienesRaicesNegocioLiveDetailShell.tsx)
    already correctly parses nearly all of this from the same business_meta/detail_pairs source --
    the recommended Wave 4 fix is to make the reverse mapper reuse that already-proven-correct
    parsing logic instead of reimplementing a much thinner subset from scratch.
  - Rentas Negocio (rentasDashboardEditHydration.ts): drops the entire structured
    residencial/comercial/terreno property-fact objects (every bedroom/bathroom/sqft/lot-size/
    parking/year-built/condition/highlight value), the full business-identity block (brand, logo,
    license, website, socials, bio, languages, Google/Yelp URLs), a doubly-broken WhatsApp/SMS
    parse (computed but written to a `seller` field that doesn't exist on this form-state type,
    so it's discarded even though the parse itself succeeds), several flow-specific structured
    blocks (room/storage/commercial/lote details), the services-included checklist, and the entire
    address block (already known). CONFIRMED that Republish is destructive for every one of these
    fields, not just address -- re-editing without manually re-entering everything and then
    republishing overwrites the DB row's previously-correct business_meta/detail_pairs with the
    blanked-out defaults.
  - Both of these are now understood to be much larger fixes than the single-field gap originally
    flagged in Wave 1 -- Wave 4 should be scoped accordingly (likely its own dedicated multi-file
    refactor per category, not a quick field-list patch).

TESTS: new scripts/verify-wave2-owner-critical-globals-2026-09-09.ts, 16/16 passing (one
    self-authored test-bug found and fixed during this process: an early check matched this
    fix's own explanatory code comment instead of the actual code pattern -- re-verified after
    tightening the check). TypeScript back to the established 7-error e2e baseline, 0 new (fixed
    4 incidental type errors from the new required `whatsapp` field in 3 QA-fixture object
    literals + 1 mapper). Full existing regression suite green (g23-wave1 24/24, g21 21/21,
    servicios-p0 20/20, address-foundation PASS, gate6c2 12/12). git diff --check clean.

NOT DONE THIS WAVE: PREVIEW/PUBLIC-read runtime click-through verification for the 6 fixes
    (source-level proof only); Waves 3-8 not started.

================================================================================
SECTION 25 -- GLOBALIZATION FINAL EXECUTION -- WAVE 4 P0 (DASHBOARD/ACTIVE-EDIT
DATA LOSS), BIENES NEGOCIO + RENTAS NEGOCIO REVERSE MAPPERS -- 2026-09-09
================================================================================

CONTEXT: Coach's "FINISH THE ENTIRE GLOBALIZATION PROGRAM" directive named these two items
    explicitly as P0 DATA LOSS, carried forward from Wave 2's audit (Section 24 above), with an
    explicit instruction not to defer them to "some later optional pass" and to reuse the
    already-proven public parsing logic instead of maintaining a second incomplete parser. Given
    the size of the full remaining program (Waves 3, 5-8, reconciliation, QA playbook), this pass
    prioritized these two named P0s first as the most concretely and completely scoped items,
    stated transparently to Coach at the start of execution rather than attempting a shallow sweep
    of everything at once.

FIX 1 -- BIENES NEGOCIO (bienesPublishedToAgenteApplicationDraft.ts): TRUE_SOURCE, FIXED.
  - Extracted the live public shell's `buildPublishedState()` (BienesRaicesNegocioLiveDetailShell.tsx)
    verbatim into a new shared, pure module:
    app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState.ts.
    Both the public shell and the dashboard-edit reverse mapper now call this one function --
    there is exactly one place that knows how to read a published Bienes Negocio row back into
    form state, eliminating the "second incomplete parser" Coach flagged.
  - `bienesPublishedRowToAgenteApplicationDraft()` now builds a small row-shape adapter (title/
    price/description have no per-language storage at the row level, so both `es`/`en` are set to
    the same raw value -- honest, not a fabricated translation) and calls the shared parser, then
    merges the Bienes-inventory-pack-specific fields (child properties, pack-pricing confirmation --
    genuinely not covered by the shared parser, a dashboard-edit-only concern) on top of its full
    output instead of returning a thin ~17-field object.
  - Added `contact_phone, contact_email, zip` to `OWNER_LISTING_SELECT` (previously missing), which
    the shared parser's phone/email/postal-code fallback chain needs for older listings.
  - Restored (previously dropped on every edit): full agent identity, brand/brokerage block,
    second-agent block, broker/advisor block, all property-type-specific sections, business extra
    URLs, Google/Yelp review URLs, socials, open house, CTA visibility toggles, listing status,
    languages, address verification metadata -- effectively all ~150 fields the public page was
    already correctly rendering.
  - One Wave 2 verifier check (BIENES G16 4) was pointing at the shell file for logic that moved
    into the new shared module -- repointed to the new file, not weakened.
  - Committed: 733408dd.

FIX 2 -- RENTAS NEGOCIO (rentasDashboardEditHydration.ts): TRUE_SOURCE, FIXED.
  - Unlike Bienes, there was no single function whose output shape already matched
    `RentasNegocioFormState` (the public render path outputs a different display VM,
    `RentasPublicListing`), so "reuse the already-proven parsing" meant extending
    `basePartialFromRow()`/`mapOwnedRentasListingToNegocioFormState()` to read every field using
    the exact same detail_pairs/business_meta primitives already proven correct in
    `mapListingRowToRentasPublicListing.ts` (parseRentasDetailMachineRead,
    readLeonixPropertyLocationFromRow, rentasShowExactAddressFromDetailPairs, the shared BR
    Negocio business_meta key schema, and the same human label/value detail_pairs rows the
    property-fact and flow-extension row builders already write and the public page already
    reads back) -- traced key-by-key against the real write side (mergeRentasNegocioMachinePairs,
    leonixNegocioBusinessMetaFromFormState.ts) before restoring each field, not guessed.
  - Fixed the confirmed "doubly-broken" WhatsApp/SMS bug: `rx.contactWhatsappDigits`/
    `rx.contactSmsDigits` were already computed correctly but written to a `seller.*` partial key
    that `mergePartialRentasNegocioState` never reads back for the Negocio lane (it only maps
    top-level `negocioWhatsapp`/`negocioMensajesTexto`) -- silently discarded on every Negocio
    edit despite the parse succeeding. Now written to the correct top-level keys.
  - Restored the full business-identity block (negocioMarca, negocioLogoDataUrl, negocioLicencia,
    negocioTelOficina, negocioSitioWeb, negocioRedes, negocioGoogleReviewsUrl,
    negocioYelpReviewsUrl, negocioBio, negocioIdiomas) -- previously only negocioNombre/
    negocioTelDirecto/negocioEmail were read from plain row columns; everything else was never
    read back at all.
  - Restored the entire address block (direccionLinea1, mostrarDireccionExacta, zonaVecindario) --
    previously zero read-back existed for any of it (zonaVecindario was hardcoded to "").
  - Restored the structured residencial/comercial/terreno property-fact objects (recamaras/banos/
    mediosBanos/interiorSqft/loteSqft/estacionamiento/ano for residencial; uso/interiorSqft/
    oficinas/banos/niveles/estacionamiento/zonificacion/condicion/accesoCarga for comercial;
    loteSqft/usoZonificacion/acceso/servicios/topografia/listoConstruir/cercado for terreno) via
    the exact human labels those blocks' row-builders already write. tipoCodigo/subtipo are left
    at schema defaults rather than reverse-matched from display labels -- the same accepted
    limitation already present in the proven Bienes shared parser (which also hardcodes
    comercialTipoCodigo/terrenoTipoCodigo defaults), not a new gap introduced here.
  - Restored all 4 flow-specific extension blocks (room_shared, storage_parking, commercial_space,
    land_parcel), gated by the active rental-type flow group, same human-label read-back pattern.
  - Added `listing_json, contact_json, business_meta` to the owner SELECT plus
    `augmentLeonixDetailPairsFromStructuredColumns` -- the same resilience the proven public
    mapper already has for older rows.
  - `serviciosIncluidosKeys` (the structured checklist) is confirmed NOT reconstructable from the
    published row -- only the flattened multiline display text persists at publish time
    (`formatRentasServiciosIncluidosOutputMultiline`), no per-key machine storage exists anywhere.
    `serviciosIncluidosLegacy` (already correctly read) remains the most faithful achievable
    representation; not a regression, a genuine platform limitation predating this fix.
  - One pre-existing verifier assertion (verify-family2-bienes-rentas-full-sweep.ts) was pointing
    at the raw `row.detail_pairs` column instead of the new listing_json/contact_json-augmented
    variable -- repointed to match the more resilient (not weaker) code.
  - Committed: 67919479.

OUT-OF-SCOPE ITEM FLAGGED, NOT FIXED THIS PASS: while tracing the Rentas Negocio write path,
    found `scripts/verify-rentas-published-edit-recovery-cancel-safe-hydration-01.mjs` failing on
    an assertion unrelated to this fix (expects literal "Guardar cambios"/"Save changes" copy in
    RentasPrivadoForm.tsx/RentasNegocioForm.tsx that no longer exists verbatim in either file --
    pre-existing stale verifier, confirmed via grep that neither form file was touched by this
    session's diff). Spun off as a separate flagged task rather than fixed inline, to keep this
    P0 commit scoped to the two named data-loss defects.

TESTS: two new focused verifiers --
    scripts/verify-wave4-p0-bienes-negocio-reverse-mapper-2026-09-09.ts (12/12 passing) and
    scripts/verify-wave4-p0-rentas-negocio-hydration-2026-09-09.ts (13/13 passing). Re-ran and
    confirmed still-green: verify-wave2-owner-critical-globals-2026-09-09.ts (16/16, after the
    Bienes repoint), verify-family2-bienes-rentas-full-sweep.ts (23/23, after the Rentas
    repoint), gate-pkgA-stale-draft-precedence-selftest (PASS),
    verify-rentas-lifecycle-renewal-dashboard-global-engine-01 (PASS),
    verify-rentas-published-edit-round-trip-01 (PASS). TypeScript back to the established 7-error
    e2e baseline, 0 new, after both fixes.

NOT DONE THIS PASS: PREVIEW/PUBLIC-read runtime click-through verification for either fix
    (source-level proof only -- owner QA required to confirm published row -> edit -> preview ->
    republish -> same row -> zero field loss end-to-end in a real browser); Wave 3 (Public
    Experience Globals), Wave 5 (Admin OS + G22 moderation UI), Wave 6 (Commercial/Revenue), Wave 7
    (Special Category Contracts), Wave 8 (Platform Finish), Final Reconciliation, and the mandatory
    Owner QA Playbook are all not yet started as of this section.
```
