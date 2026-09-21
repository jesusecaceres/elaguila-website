# 03 — GLOBAL ENGINE SOURCE MAP, G01–G53
Ref: `origin/main` = `a0a47839` · Sept seal `e3956df8` (a **fork**: merge-base `7878d856`, 51 Sept-only
/ 63 main-only). **53 of 53 systems mapped.**

**ENGINE STATUS legend** — `BUILT+ADOPTED` · `BUILT+PARTIAL` · `BUILT+ZERO-CONSUMER` (route-unreachable)
· `FORKED` (no shared engine; per-category copies) · `NOT BUILT` · `N/A`.
**Adoption is scored separately from existence throughout.** Detail lives in the per-system reports
named in the last column.

---

| ID | SYSTEM | CANONICAL PATH · KEY SYMBOL | ENGINE STATUS | ADOPTION | DETAIL |
|---|---|---|---|---|---|
| **G01** | Identity / Ownership | `app/lib/listingIdentity/types.ts:47` `CanonicalDbCategory` (14, complete); `identityBuilders.ts` | BUILT+ADOPTED | 14/14 categories. **BUT** Empleos discards row identity at `buildEmpleosPublishEnvelope.ts:250`, and Servicios keys identity off `sessionStorage` | GAP-039/048/061/062 |
| **G02** | Category Registry / Route | `categoryRouteRegistry.ts:1395` `CATEGORY_ROUTE_REGISTRY` (17 adapters, `satisfies Record<…>`) | BUILT+ADOPTED | Canonical is complete — but **3 independent copy-paste registry families** shadow it | `07`, GAP-010/086 |
| **G03** | Checkpoint / Ver Más | `publishCheckoutCheckpoint.ts:238` `resolvePublishCheckoutCheckpoint`; `categoryPublishCheckpoints.ts` | BUILT+PARTIAL | **Servicios and Restaurantes skip it entirely** — neither declares `checkpointRoute` nor `hubRoute` (`publicarGatewayResolver.ts:99`); empleos checkpoint is dead code | GAP-049, `04A`, `04C` |
| **G04** | Application Gateway | `app/(site)/publicar/_lib/publicarGatewayResolver.ts:99` | BUILT+PARTIAL | Same defect as G03 | GAP-049 |
| **G05** | Draft / Persistence | per-category; IndexedDB (BR agente), localStorage+IDB (autos), sessionStorage (servicios, restaurantes, empleos) | FORKED | No shared draft engine. BR-privado draft-media reload loss is live | GAP-053, BR branch |
| **G06** | Unsaved Guard | `useBusinessApplicationLeaveGuard.ts:35` (calls `preventDefault`) | BUILT+PARTIAL | **3 consumers.** TRUE for servicios/restaurantes/comida. **All 5 BR/Rentas lanes FALSE**; no `beforeunload` anywhere under `publicar/` | GAP-056/073 |
| **G07** | Preview | shared preview-mode contract, `b60801e2` — **in main** | BUILT+ADOPTED | TRUE across audited categories | `04A`–`04D` |
| **G08** | Save / Edit / Republish / Same Row | per-category edit routes + `revenueActiveEntitlementGuard.ts:64` | BUILT+PARTIAL | **Same-row TRUE for 11 of 12 lane groups.** Empleos forks. **8 lanes destroy data on edit; Sept fixes 2** | **`06`**, GAP-002/039–046 |
| **G09** | Media | `app/lib/media/listingMediaContract.ts:132,:202` `droppedUnpersistable` | BUILT+PARTIAL | **11 of 11 callers ignore the drop signal.** Sept's fix is `console.warn` only. Empleos discards 100% of photos | **`15`**, GAP-074/075 |
| **G10** | Gallery / Photo / Video | per-category; `MediaUploader.tsx` **zero-consumer** | FORKED | Forked uploaders ship instead (count unproven — see `16` gap 5) | `15`, GAP-102 |
| **G11** | Flyer / Coupon Viewer | `OfertasLocalesFlyerViewerModal.tsx` (preview, full pdfjs) | BUILT+PARTIAL | **Public gets a bare "Open PDF" link**; overlays disabled at `:160`; page-nav gates on files not pages | **`15`**, GAP-077 |
| **G12** | Phone / SMS / WhatsApp | `connectionHubCtaDispatch.ts:58` + per-category CTA modules | BUILT+PARTIAL | Emitters traced for 11 of 15 categories. **International phone truncation live** (`9ae1a0f2` unmerged); WhatsApp digit gap live | `10 §4`, GAP-008 |
| **G13** | Languages | per-category language chips/filters | BUILT+PARTIAL | Filterable in servicios/restaurantes; **4 community results clients discard stored `leonix_lang`** | GAP-073 |
| **G14** | Hours / Open Now | per-category | FORKED | `open_now` sort exists in servicios only; rentas `negocioHorario` read but never collected | GAP-060 |
| **G15** | Websites / Social | 4 social-brand engines, no shared renderer | FORKED | Despite `SharedConnectionHubSocialPlatform` being defined | `13 §A.4` |
| **G16** | CTA / Connection Hub | `connectionHubCtaDispatch.ts:58` | BUILT+PARTIAL | **3 importers.** Unreachable for all 5 community lanes (early returns before `:2560`) | `13 §B`, `04D` |
| **G17** | Rich Correo | composer per category | BUILT+PARTIAL | **Suppressed for PREMIUM BR** (`EnVentaAnuncioLayout.tsx:1430`) — paid tier gets less than free | GAP-081 |
| **G18** | Translate Ad | `restaurantesTranslateAd`, `useComidaLocalPublicTranslation` etc. | FORKED | Detail-page only; **never on results**. No `translate` analytics event exists | GAP-020 |
| **G19** | ES / EN | `resolveClasificadosPublishLang*`, `app/lib/i18n/*` | BUILT+ADOPTED | Broad. **hreflang 0/14 and 0 repo-wide** | GAP-097 |
| **G20** | Community Trust | `leonixEndorsementRegistry.ts:90` (5 lanes) + `20260819210000_leonix_endorsement_votes.sql` | BUILT+ADOPTED | **Public mount 5/5 — the healthiest system audited.** Owner dashboard 2/5 | `13B` |
| **G21** | Google / Yelp | none — **no registry, no DB column** | FORKED | **5 of 15 have anything; 5 incompatible implementations, 4 field conventions.** Dashboard TRUE for 1 | `13B`, GAP-032 |
| **G22** | Trust Admin Moderation | `leonixEndorsementAdminActions.ts:18,:48` | **BUILT+ZERO-CONSUMER** | **Zero importers; no UI.** Sole reference is a verifier reading the file as a string | GAP-078 |
| **G23** | Street Address Verifier | `app/lib/businessAddress/*` | **BUILT+ZERO-CONSUMER** | **0 route importers repo-wide, confirmed 3 ways. FALSE for all 14.** Sept `3c23e875` adopts it for 5; **9 of 17 lanes lack it even on Sept** | GAP-047 |
| **G24** | Location / Privacy / Directions | same module + `resolveBusinessAddressPublicView` | **BUILT+ZERO-CONSUMER** | **4 exact-address public leaks**: Ofertas, Clases (baked into description — un-gateable), Empleos, Servicios. **No `show_exact_address` column in any of 163 migrations** | GAP-005/076 |
| **G25** | Saved Search | `savedSearchEmailDelivery.ts:37` `CATEGORY_RESOLVERS` | BUILT+PARTIAL | **3 of 14 categories** (autos, BR, rentas), each with a complete 6-file adapter set. **No retry trigger exists** | **`14 §A`**, GAP-030/031 |
| **G26** | Save / Like / Share / Report | `LeonixSaveButton/LikeButton/ShareButton`, `selfEngagementGuard.ts:14` | BUILT+PARTIAL | Self-engagement is **UI-only**; 4 Sept gaps live. Save missing on servicios+comida; report missing on BR and mascotas | GAP-008/051/072 |
| **G27** | Analytics | `app/lib/analytics/**` + `POST /api/analytics/events` | BUILT+PARTIAL | Server pipeline is **sound**. But a legacy browser-direct writer with **client-supplied `owner_user_id`** sits under the shared buttons (15 importers); **no view event on any BR page**; 3 categories emit nothing | **`10`**, GAP-004/054 |
| **G28** | Search / Results / Filters | `categoryStandardV2` kit | BUILT+PARTIAL | Results V2: **1 of 6** (restaurantes). No payment gate anywhere; no expiration gate except rentas | **`14 §B`** |
| **G29** | Related Listings | per-category readers | FORKED | Absent on servicios/restaurantes/comida; BR readers **bypass the parent gate** | GAP-058, `14 §C` |
| **G30** | Business Hub | `sharedConnectionHubContactModel.ts:81` | **BUILT+ZERO-CONSUMER** | **The engine was never finished.** `FullBusinessHubCard`/`ListingContactCard` never built. 5 parallel contact models, 4 review buttons, 7 map-embed copies | **`13 §A`**, GAP-015 |
| **G31** | Revenue OS | `revenuePricingMatrix.ts:86` `REVENUE_V1_PACKAGE_MATRIX` (24 pkgs, 14 cats) | BUILT+ADOPTED | Matrix-driven and sound. Checkout resolves for all paid categories except viajes end-to-end | **`11`** |
| **G32** | Stripe Signature / Idempotency / Replay | `revenueWebhook.ts:178-206`; `stripeEventLedger.ts:56-128` | BUILT+ADOPTED | **Verified correct — two-layer replay protection. DO NOT REBUILD** | `11 §2` |
| **G33** | Subscription Lifecycle | `subscriptionLifecycle.ts`; `subscriptionLifecyclePolicy.ts:139` | BUILT+PARTIAL | `LANE_SUSPENSION` has **4 lanes**; comida-local absent. **And the sweep has zero callers — suspension never runs at all** | GAP-003/082 |
| **G34** | Recurring Consent / Commercial Terms | `recurringConsent.ts` → `leonix_billing_consents` | BUILT+ADOPTED | `billingMode`-driven; cannot drift | `11 §2` |
| **G35** | Promo | `promoCodeRules.ts:103`; `revenuePromoRedemptions.ts` | BUILT+PARTIAL | Redemption-after-webhook is correct. **4 promo-eligible categories cannot be scoped from Admin**; Ofertas renders a permanently dead promo field | **`11 §7`**, GAP-010/011 |
| **G36** | Email / SMS Verification | — | **NOT BUILT** | Admin capability matrix scores it FALSE | `09` |
| **G37** | Comp / Partner / Print / Courtesy | `package-entitlements/actions.ts:583,:591` | BUILT+ADOPTED | Matrix-driven, works for all 14 — **the one category-agnostic admin grant path** | `11 §8` |
| **G38** | Plan / Package / Placement Separation | `revenuePricingMatrix.ts`; `placementEntitlements.ts` | BUILT+ADOPTED | Clean separation in the matrix | `11` |
| **G39** | Placement / Ranking | `placementResultsOverlay.ts:43`; `resolveCanonicalVisibilityBucketWeights` | BUILT+PARTIAL | Servicios sorts **within** buckets (correct). **Restaurantes discards placement on any user sort**; BR zeroes it for privado; admin placement management FALSE | GAP-018, `09` |
| **G40** | Autos Parent / Child | `autosPublicChildParentVisibility.ts:40-62` | BUILT+ADOPTED | **18/18 TRUE — the strongest parent/child implementation, 3 enforcement points + saved search.** Reference for fixing BR | **`12B`** |
| **G41** | Bienes Parent / Child | `brPublicChildParentVisibility.ts:51-74` | BUILT+PARTIAL | **13 TRUE / 4 PARTIAL / 1 FALSE.** Two related-listing readers bypass the gate; RLS carries no parent predicate | **`12A`**, GAP-058 |
| **G42** | Rentas Commercial | `rentasDashboardEditHydration.ts` | BUILT+PARTIAL | Negocio fixed on Sept; **privado destructive on both refs** | GAP-040 |
| **G43** | Restaurant Commercial | `restaurantes_public_listings` + base monthly | BUILT+ADOPTED | Edit path **SAFE** (prior lead refuted) | `06`, `04A` |
| **G44** | Servicios Commercial | `servicios_public_listings` + base monthly | BUILT+PARTIAL | Destructive edit (highlights/trust); sessionStorage identity | GAP-043/048 |
| **G45** | Comida Commercial | `comida_local_public_listings` + `comida_local_base_monthly` | BUILT+PARTIAL | Edit **SAFE**. **But no suspension lane, not in the monetization classifier, unauditable in admin** | GAP-003, `09` |
| **G46** | Ofertas Boundary | `ofertasLocalesCommercial*`; deliberately excluded from the admin truth table | BUILT+PARTIAL | Deliberate isolation is respected. Public flyer degraded; address leaks; ghost column | `15`, GAP-077/080 |
| **G47** | User Dashboard | `OwnerEntityWorkspace.tsx:33`; `ownerEntityCapabilityRegistry.ts:137` (18 keys, complete) | BUILT+PARTIAL | Registry is **real** (10 importers, 16/18 keys traced). Dedicated-table categories fully SHARED; **generic-`listings` categories are SILO at the list level** | **`08`**, GAP-037 |
| **G48** | Admin OS | `app/admin/**`; `businessWorkspaceAccess.ts:106-168` | BUILT+PARTIAL | **28 TRUE / 10 FALSE / 1 N-A.** 14/14 queues exist; 47 of 78 routes strongly guarded; **31 on the coarse cookie** | **`09`, `09A`** |
| **G49** | Newsletter | signup + unsubscribe engine | BUILT+PARTIAL | **No send pipeline, no scheduler; double opt-in is dead code; unsubscribe is correct but unreachable** | `03B`, GAP-096 |
| **G50** | SEO | `app/sitemap.ts`, `robots.ts`, `leonixDiscoveryContracts.ts:32` | BUILT+PARTIAL | Hub JSON-LD **1/14**; hreflang **0/14**; 4 lanes are `"use client"` so cannot export metadata yet are in the sitemap; no canonical builder | `03B`, GAP-097 |
| **G51** | Accessibility / Responsive | — | **NOT BUILT (unenforced)** | No CI, no `jsx-a11y`, `npm run lint` is **autos-only**; the "responsive gate" checks doc headings | GAP-098 |
| **G52** | PWA | `app/manifest.ts` + `public/manifest.webmanifest` | BUILT+PARTIAL | Installable **staff-only** (scope `/admin/`); **two conflicting manifests**; offline precache is one URL | GAP-099 |
| **G53** | Security / RLS / Privacy | `businessWorkspaceAccess.ts` + `supabase/migrations/**` | BUILT+PARTIAL | **RLS on 183/186 tables but only 49 carry a policy.** `servicios_public_listings` anon SELECT is `USING (true)`. `listing_analytics` INSERT is `WITH CHECK (true)`. **`public.listings` has no tracked schema** | **`03B`, `09A`**, GAP-088–095 |

---

## SUMMARY BY ENGINE STATUS

| Status | Count | Systems |
|---|---|---|
| BUILT+ADOPTED | **13** | G01, G02, G07, G19, G20, G31, G32, G34, G37, G38, G40, G43 |
| BUILT+PARTIAL | **28** | G03, G04, G06, G08, G09, G11, G12, G13, G16, G17, G25, G26, G27, G28, G33, G35, G39, G41, G42, G44, G45, G46, G47, G48, G49, G50, G52, G53 |
| **BUILT+ZERO-CONSUMER** | **4** | **G22, G23, G24, G30** |
| FORKED (no shared engine) | **6** | G05, G10, G14, G15, G18, G21, G29 |
| NOT BUILT | **2** | G36, G51 |
| **TOTAL** | **53** | |

### THE HEADLINE OF THIS MAP
**Only 2 of 53 systems were never built.** Four more are built and **route-unreachable**. The rest
exist and work — they are simply **not adopted evenly across categories**. This is an integration
problem, not a construction problem, which is exactly the defect class the audit was commissioned to
find.

### THE FOUR ZERO-CONSUMER ENGINES — the audit's signature finding
| System | Engine | Route importers |
|---|---|---|
| G30 Business Hub | `buildSharedConnectionHubContact` | **0** |
| G23 Address Verifier | `app/lib/businessAddress/*` | **0** |
| G24 Location Privacy | same module | **0** |
| G22 Trust Admin | `leonixEndorsementAdminActions.ts` | **0** |
Plus three more zero-consumer modules outside the G-list: `dashboardRoute` (all 17 adapters),
`serviciosSavedListingIdentity.ts`, `newsletterVerificationState.ts` (double opt-in), and
`MediaUploader.tsx`. All are **verifier-reachable but route-unreachable** — which is why the gate
estate reports green.
