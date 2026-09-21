# 16 — ORPHANED / DUPLICATE / UNINTEGRATED WORK

**Audit date:** 2026-09-09 · **Batch 9 (final research batch)** · **READ-ONLY. NOTHING WAS MOVED,
RENAMED OR DELETED. NO REORGANIZATION WAS PERFORMED.**

## 0. SOURCE OF TRUTH — VERIFIED TWICE

| Ref | SHA | Note |
|---|---|---|
| **`origin/main` — TRUE CURRENT** | **`a0a4783971b42ea1d71ab2602d4720d0d590baf8`** | verified at batch start AND re-verified immediately before writing this file — unchanged |
| Local primary worktree `HEAD` | `d09d979c` | **112 commits STALE.** Not read from. Every finding below is read via `git ls-tree -r --name-only origin/main` / `git grep -n "PAT" origin/main` / `git show origin/main:<path>` |
| Sealed September branch | `e3956df8` | **A FORK, NOT AN ANCESTOR.** merge-base `7878d856`; 51 Sept-only / 63 main-only |

Known counts re-confirmed at `origin/main`: app **4700** · app/lib **1315** · app/api **262** ·
app/admin **446** · app/(site) **2393** · docs **230** · scripts **1057** · supabase **164** ·
e2e **33** · public **356** (task sheet said 355) · data **29**.

> ⚠ **`docs/globalization/forensic-2026-09-09/` — including this file — is NOT tracked on
> `origin/main`.** `git ls-tree -r origin/main -- docs/globalization` returns 13 files, none of
> them this audit series. This audit exists only in the local working tree.

---

## 1. METHOD — HOW THE NEW ORPHANS WERE FOUND

Prior batches proved orphans one symbol at a time. This batch built a **whole-repo static
reachability graph** at `origin/main`, which finds *transitive* dead clusters that per-symbol
grepping cannot (a module with 3 importers is still dead if all 3 importers are themselves dead).

1. Extracted **23,770 import/require/dynamic-import specifiers** from every `.ts/.tsx/.js/.mjs`
   under `app/`, `scripts/`, `e2e/`, `tests/`, `pages/`, `middleware.ts` at `origin/main`.
2. Reduced each specifier to its final path segment; built a `basename → file(s)` map over all
   **4,242 `.ts/.tsx` files under `app/`**, plus `directory-name → directory/index.ts` so barrel
   imports do not break the chain.
3. BFS from the **695 real Next.js entry points** (`page.tsx`, `layout.tsx`, `route.ts`,
   `not-found.tsx`, `error.tsx`, `loading.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`,
   `middleware.ts`, …) — then a **second** BFS adding `scripts/`, `e2e/`, `tests/`, `pages/` as
   roots, to separate "dead" from "alive only because a verifier script imports it".

**Bias note (deliberately conservative):** basename collisions can only make a dead file look
*reachable*, never the reverse. Every number below is therefore a **floor**, not a ceiling.

### 1.1 HEADLINE RESULT

| Class | Count | Meaning |
|---|---:|---|
| `.ts/.tsx` files under `app/` at `origin/main` | 4,242 | denominator |
| **Unreachable from any Next.js entry point** | **469** | **11.1 % of the app's TypeScript is not on any route** |
| **Unreachable from ANYTHING (app *or* scripts)** | **434** | true dead code — **10.2 %** |
| **Reachable ONLY from `scripts/` or `e2e/`** | **35** | alive only because a verifier imports it |

**434 fully-dead modules** is the new floor. The pre-existing ledger inventory (§2) accounts for
roughly 40 of them; **the remaining ~394 are NEW to this batch.** Deduplicating against the
ledger's already-named items and excluding the 35 script-only files, the net new confirmed-dead
count is **≈ 394 modules**.

Validation of the method — every one of these ledger-proven orphans was independently
re-discovered by the graph with no prior knowledge: `MediaUploader.tsx`,
`serviciosSavedListingIdentity.ts`, `leonixEndorsementAdminActions.ts`,
`BusinessConciergeOwnerHome.tsx`, `autosAnalyticsExtended.ts`,
`AutosNegociosBusinessHubFauxMap.tsx`, `BienesRaicesFeaturedSection.tsx`,
`BienesRaicesNegociosSpotlightBand.tsx`, `BienesRaicesResultsHero.tsx`,
`BienesRaicesPropiedadFilterChips.tsx`, `BienesRaicesMapToggle.tsx`,
`ofertasLocalesAnalyticsEvents.ts`, `restaurantesSellerAnalytics.ts`,
`app/lib/businessAddress/*`.

---

## 2. CARRIED FORWARD FROM `17_ACTIVATION_GAP_LEDGER.md` — NOT RE-DERIVED

The following are **already proven** and are restated here only so this document is a complete
inventory. See doc 17 for their evidence. **All carry: DO NOT DELETE NOW.**

**Six zero-consumer global engines:** `buildSharedConnectionHubContact`
(`sharedConnectionHubContactModel.ts:81`) · `app/lib/businessAddress/*` · `dashboardRoute`
(implemented in all 17 adapters of `categoryRouteRegistry.ts`, called by nobody) ·
`app/lib/serviciosSavedListingIdentity.ts` · `MediaUploader.tsx` (0 importers while 13 forked
uploaders ship) · `leonixEndorsementAdminActions.ts`.

**Business Hub orphans:** `ServiciosHubReviewLinkButton` · `RestaurantHubReviewLinkButton` ·
`AutosNegociosBusinessHubFauxMap` · `OfertasLocalesBusinessHubLiteCard` · `ListingView` default
export · `BusinessListingIdentityRail` · `buildFullPreviewListingData` · `RestauranteDetailShell`
+ its committed `.backup`.

**Analytics orphans (7):** `autosAnalyticsExtended.ts` · `autosAnalyticsEvents.ts` ·
`empleosAnalyticsExtended.ts` · `enVentaAnalyticsExtended.ts` · `leonixClasificadosAnalytics.ts` ·
`restaurantesSellerAnalytics.ts` · `ofertasLocalesAnalyticsEvents.ts`.

**Dashboard orphans:** `BusinessConciergeOwnerHome.tsx` · `DashboardCategoryLauncherCard` ·
`DashboardQuickActionCard` · `DashboardStatsCard` · `resolveLifecycleMutationDescriptors`.

**BR/Rentas/Servicios orphans:** `BienesRaicesFeaturedSection` · `BienesRaicesNegociosSpotlightBand`
· `BienesRaicesResultsHero` · `BienesRaicesPropiedadFilterChips` · `BienesRaicesMapToggle` ·
`pickNegociosSpotlight` · `RentasPropiedadFilterChips` · `RentasLandingFeatured` ·
`FeaturedBusinessSection` · `RecentServicesSection` · `ServiciosApplicationForm.tsx` ·
`ServiciosHeroActions.tsx` · live-but-dead route `app/(site)/servicios/perfil/preview/page.tsx`.

**Duplicate sets:** 5 parallel contact models · 4 review buttons · 4 faux maps · **7 copies of the
Google Maps `output=embed` formula** · 4 social-brand engines · byte-identical `RCH_*`/`SCH_*`
tokens · `DealerBusinessStack.tsx` vs `PreviewDealerBusinessStack.tsx` · 13 forked media uploaders.

### 2.1 RE-CONFIRMATIONS AND CORRECTIONS TO THE CARRIED-FORWARD SET

| Ledger claim | Status at `a0a47839` | Evidence |
|---|---|---|
| 7 copies of the Google Maps `output=embed` formula | ✅ **STILL EXACTLY 7 FILES** (8 occurrences) | `QuickJobLocationCard.tsx` ×1 · `sharedConnectionHubLocationHelpers.ts` ×2 · `BuscoQuickAdCanvas.tsx` ×1 · `CommunityContactCanvas.tsx` ×1 · `MascotasPerdidosQuickAdCanvas.tsx` ×1 · `autosDealerStructuredAddress.ts` ×1 · `ofertasLocalesPreviewHelpers.ts` ×1 |
| `app/lib/businessAddress/*` has **0 importers repo-wide** | ⚠ **REFINED — 0 importers *in app code*, but 5 of its 6 files ARE imported by `scripts/`** | `businessAddressContract.ts`, `businessAddressDirections.ts`, `businessAddressNormalize.ts`, `businessAddressPrivacy.ts`, `businessAddressProvider.ts` are all in the **script-only** class. Only `examples/comidaLocalAddressMappingExample.ts` is dead to everything. **The engine is kept "green" by its own verifiers while shipping to no route.** This is the sharpest instance of the false-confidence hazard in the repo |
| `sharedConnectionHubContactModel.ts` — 0 consumers | ⚠ **REFINED — script-only.** Same shape: verifier-reachable, route-unreachable | `script_only` class |
| `DealerBusinessStack.tsx` vs `PreviewDealerBusinessStack.tsx` | ✅ confirmed — **both alive, different callers** | `AutoDealerPreviewPage.tsx:21` imports `DealerBusinessStack`; `AutosNegociosDealershipPreviewPage.tsx:22` imports `PreviewDealerBusinessStack`. Neither is orphaned; they are a genuine 504-vs-793-line fork |
| `RestauranteDetailShell.tsx.backup` committed | ✅ **CONFIRMED PRESENT** at `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx.backup` | see §6 |

---

## 3. NEW FINDINGS — ZERO-CONSUMER GLOBAL ENGINES AND CLUSTERS

Format: **PATH | SYSTEM | WHY IT EXISTS | CURRENT CONSUMERS | CLASS | SAFE TO ARCHIVE LATER**

### 3.1 🔴 NEW-01 — THE TRANSLATION PROVIDER STACK IS FORKED; HALF OF IT IS DEAD

| Field | Value |
|---|---|
| **PATHS** | `app/lib/translation/providers/index.ts` (75 L) · `providers/deepl.ts` (133 L) · `providers/google.ts` (228 L) · `serverProvider.ts` (25 L) · `config.ts` (130 L) · `index.ts` (46 L) — **637 dead lines** |
| **SYSTEM** | G-Translate / Ad Translation (`/api/translate-ad`) |
| **WHY IT EXISTS** | `423876dc 2026-05-28` (index/serverProvider/deepl), `39712bac 2026-06-05` (config), `9609722d 2026-06-08` (providers/google) — the original multi-provider abstraction |
| **CURRENT CONSUMERS** | **NONE.** The live route `app/api/translate-ad/route.ts` imports `@/app/lib/translation/**provider**` (singular, 342 L, `9609722d 2026-06-08`) — **not** `providers/` (plural) |
| **PROOF** | 27 app-side importers reach `translation/types`, `translation/helpers`, `translation/requestAdTranslation`, `translation/provider`. Zero reach `translation/providers/*`, `serverProvider`, `config`, or the `index.ts` barrel |
| **CLASS** | **DUPLICATE (superseded fork) + ORPHAN** — `provider.ts` is CANONICAL; `providers/` is LEGACY |
| **SAFE TO ARCHIVE LATER** | **needs-owner-decision** — `providers/deepl.ts` is the only DeepL implementation in the tree, and 6 `docs/magazine-deepl-*` docs describe DeepL as live. Archiving it may delete the only record of a capability the owner believes he has. **DO NOT DELETE NOW.** |

### 3.2 🔴 NEW-02 — `app/lib/siteBlocks/*` — THE PAGE-BLOCKS FOUNDATION IS A CLOSED DEAD LOOP

| Field | Value |
|---|---|
| **PATHS** | `app/lib/siteBlocks/sitePageBlocksData.ts` · `blockTypes.ts` · `validateBlocks.ts` (entire directory) |
| **SYSTEM** | G-CMS / Site Page Blocks |
| **WHY IT EXISTS** | `2a1f91fb 2026-05-07` — all three landed in one commit; documented in `docs/site-page-blocks-foundation.md` |
| **CURRENT CONSUMERS** | **NONE outside the directory.** `sitePageBlocksData.ts` has 0 importers; it imports `blockTypes` and `validateBlocks`; `validateBlocks` imports `blockTypes`. A perfect 3-node closed cycle with no external edge. **Per-symbol grepping reports 1–2 importers each and misses this entirely — only the transitive graph exposes it.** |
| **CLASS** | **ORPHAN (transitive dead cluster)** |
| **SAFE TO ARCHIVE LATER** | **yes** — but `docs/site-page-blocks-foundation.md` must be archived with it or it becomes a stale doc describing a system that no longer exists. **DO NOT DELETE NOW.** |

### 3.3 🔴 NEW-03 — THE LEO "UNIVERSAL TOOL BUS" IS DEAD AND ITS VERIFIERS CANNOT TELL

| Field | Value |
|---|---|
| **PATHS** | `app/leo/_lib/leoToolService.ts` · `leoToolAdapters.ts` · `leoAdminCapabilitiesAdapter.ts` · `leoGovernanceService.ts` |
| **SYSTEM** | G-Leo (Executive AI OS) |
| **WHY IT EXISTS** | `12f8f88a 2026-08-18` (service + admin-capabilities adapter), `d5898bd8 2026-08-18` (tool adapters), `00cae1cd 2026-08-17` (governance service) |
| **CURRENT CONSUMERS** | **NONE.** `leoToolService.ts` → 0 importers. `leoToolAdapters.ts` → 1 importer = `leoToolService.ts` (dead). `leoAdminCapabilitiesAdapter.ts` → 1 importer = `leoToolAdapters.ts` (dead). Closed dead chain |
| **⚠ THE HAZARD** | 5 verifier scripts *appear* to cover it — `verify-leo-11-universal-tool-bus.ts:50,51,56`, `verify-leo-12-connected-project-brain.ts:271-272`, `verify-leo-13-gmail-calendar-intelligence.ts:433`, `verify-leo-17a-connected-action-persistence.ts:156`, `verify-leo-17b-conversation-proposal-wiring.ts:271`. **Not one of them imports the module.** Every one does `src("app/leo/_lib/leoToolService.ts")` — reads the file as a **string** and `.includes()`-matches it. A dead file's text still contains the expected tokens, so **all 5 gates are permanently green on code no route can reach** |
| **CLASS** | **ORPHAN (dead cluster) + FALSE-GREEN VERIFIER COVERAGE** |
| **SAFE TO ARCHIVE LATER** | **needs-owner-decision** — Leo is an active programme (`docs/leo/LEO_MASTER_ROADMAP.md`); this may be built-ahead rather than abandoned. **DO NOT DELETE NOW.** |

### 3.4 🔴 NEW-04 — `categoryStandard` (V1) SUPERSEDED BY `categoryStandardV2`, V1 NEVER REMOVED

| Field | Value |
|---|---|
| **PATHS** | 10 of 25 files under `app/(site)/clasificados/components/categoryStandard/` incl. `CategoryStandardLandingPage.tsx` · `CategoryStandardLandingPageShell.tsx` · `CategoryStandardResultsChrome.tsx` · `CategoryStandardResultsFilterPanel.tsx` · `CategoryStandardLandingSearch.tsx` · `CategoryStandardQuickFilterChips.tsx` · `CategoryStandardCtaRow.tsx` · `CategoryCompactHero.tsx` · `CategoryStandardMark.tsx` · `catStd1aPipelineRegistry.ts` |
| **SYSTEM** | G-Category Standard (global category landing/results template) |
| **CURRENT CONSUMERS** | **NONE for those 10.** Meanwhile `categoryStandardV2/` = **17 files, 0 orphaned** — 100 % live |
| **THE DOC PROBLEM** | `app/(site)/clasificados/components/categoryStandardV2/README.md` declares itself "**Source of Truth**" for the global category UI. Two competing "global category standards" ship side by side; only V2 is wired |
| **CLASS** | **DUPLICATE — V2 CANONICAL, V1 LEGACY/ORPHAN** |
| **SAFE TO ARCHIVE LATER** | **yes for the 10 unreferenced V1 files; NO for the other 15** (still live) — this directory must be split, not archived wholesale. **DO NOT DELETE NOW.** |
| **⚠ VERIFIER HAZARD** | `scripts/website-cat-std-1-category-landing-results-audit.ts:116` string-asserts `CategoryStandardResultsFilterPanel` — an orphan. False green |

### 3.5 🔴 NEW-05 — WHOLE-DIRECTORY LANDING-SHELL ORPHANS (largest single mass of dead UI)

Entire category landing systems were rebuilt and the predecessors left in the tree:

| Directory | Files | Orphaned | % dead | System |
|---|---:|---:|---:|---|
| `app/(site)/clasificados/autos/landing/` | 19 | **17** | **89 %** | G-Autos landing |
| `app/(site)/clasificados/servicios/landing/` | 18 | **14** | **78 %** | G-Servicios landing |
| `app/(site)/clasificados/empleos/components/` | 52 | **16** | 31 % | G-Empleos |
| `app/(site)/clasificados/bienes-raices/resultados/` | 31 | **11** | 35 % | G-BR results |
| `app/(site)/clasificados/restaurantes/shell/` | 30 | **9** | 30 % | G-Restaurantes detail shell |
| `app/(site)/clasificados/rentas/shared/` | 28 | **9** | 32 % | G-Rentas shared |

Named autos-landing casualties: `AutosLandingShell.tsx` · `AutosHeroSearch.tsx` ·
`AutosLandingInventoryCard.tsx` · `AutosLandingLangSwitch.tsx` · `AutosLandingPublishCTA.tsx` ·
`AutosLandingSectionEmpty.tsx` · `AutosPrimaryDiscoveryCta.tsx` · `AutosQuickChips.tsx` ·
`BodyStyleBrowseSection.tsx` · `FeaturedCarsSection.tsx` · `FeaturedDealersSection.tsx` ·
`NeedBasedBrowseSection.tsx` · `RecentAutosSection.tsx` · plus
`components/public/AutosPublicLanding.tsx`, `AutosLaneCrossNav.tsx`,
`AutosPublicResultsQuickChips.tsx`, `AutosPublicFeaturedCard.tsx`,
`DealersDeAutosHubCategoryCard.tsx`.

**CLASS:** ORPHAN (superseded). **SAFE TO ARCHIVE LATER:** needs-owner-decision per directory —
these are visual systems the owner may still recognise from QA screenshots. **DO NOT DELETE NOW.**

### 3.6 🔴 NEW-06 — THREE UNGUARDED `"use server"` ACTION MODULES WITH ZERO IMPORTERS

| PATH | WHY IT EXISTS | CONSUMERS | CLASS |
|---|---|---|---|
| `app/admin/siteSectionActions.ts` | `755408ab 2026-04-08` | **0** | ORPHAN |
| `app/admin/revistaIssueRegistryActions.ts` | `755408ab 2026-04-08` | **0** | ORPHAN |
| `app/admin/_actions/setAdminUiLang.ts` | `e6b6e41c 2026-06-02` | **0** | ORPHAN |

**SYSTEM:** G48 Admin OS. **SECURITY NOTE — reinforces GAP-001 item H:** Next 15.5.7 registers
*every* export of a `"use server"` module as a callable server action **whether or not any client
imports it**. These three files are therefore **live callable surface with no UI, no reviewer, and
no test**. They belong to the same class as `confirmOfficialSpanishCore`.
**SAFE TO ARCHIVE LATER: needs-owner-decision (security-relevant — archiving these *reduces*
attack surface, but confirm no external caller first). DO NOT DELETE NOW.**

### 3.7 🔴 NEW-07 — `entitlementRedemption.ts` + `entitlementActivationContract.ts`

| Field | Value |
|---|---|
| **PATHS** | `app/lib/listingPlans/entitlementRedemption.ts` · `app/lib/listingPlans/entitlementActivationContract.ts` |
| **SYSTEM** | G31 Revenue OS · G-Entitlements |
| **WHY IT EXISTS** | `c7c5daf3 2026-05-26` and `baa2090c 2026-05-26` |
| **CURRENT CONSUMERS** | **0 each** |
| **⚠ WHY THIS MATTERS** | `docs/entitlement-redemption-attachment-model.md` and `docs/package-entitlement-model.md` describe these as **the** entitlement contract. A revenue-critical named "contract" module with zero call sites is the highest-consequence orphan class in the repo |
| **CLASS** | **ORPHAN — named global contract, unwired** |
| **SAFE TO ARCHIVE LATER** | **needs-owner-decision — revenue-adjacent. DO NOT DELETE NOW.** |

### 3.8 🔴 NEW-08 — THE SAVED-LISTING-IDENTITY FAMILY IS 3-of-4 DEAD, NOT 1-of-4

Doc 17 named only `serviciosSavedListingIdentity.ts`. The graph shows the rot is wider:

| PATH | LAST TOUCH | CONSUMERS | CLASS |
|---|---|---|---|
| `app/lib/autosSavedListingIdentity.ts` | — | **live** | CANONICAL |
| `app/lib/serviciosSavedListingIdentity.ts` | (per doc 17) | **0** | ORPHAN |
| `app/lib/restaurantesSavedListingIdentity.ts` | `35d5c84b 2026-06-03` | **0** | **ORPHAN — NEW** |
| `app/lib/empleosSavedListingIdentity.ts` | `714f7465 2026-06-04` | **0** | **ORPHAN — NEW** |

**SYSTEM:** G-Saved Listings / G01 Identity. **This is a per-category fork of a global identity
concern where 3 of the 4 forks were abandoned mid-rollout.**
**SAFE TO ARCHIVE LATER: needs-owner-decision. DO NOT DELETE NOW.**

### 3.9 NEW-09 — REMAINING NAMED `app/lib` + `app/components` ORPHANS (0 importers, verified)

All verified by both the reachability graph and a direct `git grep` for their import path.
All: **DO NOT DELETE NOW.**

| PATH | SYSTEM | WHY IT EXISTS | CONSUMERS | CLASS | ARCHIVE LATER |
|---|---|---|---|---|---|
| `app/lib/listingLifecycle/listingExpirationNotifications.ts` | G33 Lifecycle | `328ce238 2026-07-14` | 0 | ORPHAN | needs-owner-decision (a lifecycle capability the owner may believe is live) |
| `app/lib/email/newsletterPromoCodeEmail.ts` | G-Newsletter/Promo | `480f7a05 2026-07-07` | 0 | ORPHAN | needs-owner-decision |
| `app/lib/recursos/resourceCatalog.ts` | G-Recursos | `51f182fb 2026-08-18` | 0 | ORPHAN | needs-owner-decision (recent) |
| `app/lib/recursos/intake/urlMultiEntityIntakeOrchestrator.ts` | G-Recursos intake | 2026-08 | 0 | ORPHAN | needs-owner-decision |
| `app/lib/leonix/publicRouteHrefs.ts` | G-Nav/SEO | `063ec500 2026-06-12` | 0 | ORPHAN (route-href source of truth nobody reads) | yes |
| `app/lib/content/i18n.ts` + `content/translationKeys.ts` | G-i18n | `597b9454`/`0638aa01 2026-06-08` | closed 2-node cycle, 0 external | ORPHAN cluster | yes |
| `app/lib/clasificados/restaurantes/RestauranteOfertasLocalesUpsellCard.tsx` + `...CheckoutSecondaryCard.tsx` + `restaurantesOffersUpsellCopy.ts` + `restaurantesOffersCheckoutSecondaryCopy.ts` + `restaurantesOffersComboPricing.ts` | G-Restaurantes × Ofertas upsell | 2026-07/08 | 0 (5-file dead cluster) | ORPHAN | needs-owner-decision (revenue feature) |
| `app/lib/ofertas-locales/ofertasLocalesPublishSubmit.ts` | G-Ofertas publish | 2026-08 | 0 | ORPHAN | needs-owner-decision (**publish path** — verify no route needs it) |
| `app/lib/ofertas-locales/ofertasLocalesPartnerAdminMutations.ts` | G-Ofertas partner admin | 2026-08 | 0 | ORPHAN | needs-owner-decision |
| `app/lib/ofertas-locales/ofertasLocalesOperationalRecovery.ts` | G-Ofertas ops | 2026-08 | 0 | ORPHAN | yes |
| `app/lib/ofertas-locales/ofertasLocalesAiArchitecture.ts` | G-Ofertas AI | 2026-08 | 0 | ORPHAN | yes |
| `app/lib/ofertas-locales/ofertasLocalesStagingFixtures.ts` | G-Ofertas QA | 2026-08 | 0 | ORPHAN (fixture) | yes |
| `app/lib/magazine/getApprovedMagazineVisualAsset.ts` · `magazineVisualTranslationManifest.ts` · `printVisualInstructions.ts` · `visualIssueManifestTypes.ts` | G-Magazine visual translation | 2026-07/08 | 0 (4-file cluster) | ORPHAN | needs-owner-decision (12 `docs/magazine-*` docs describe this as shipped) |
| `app/lib/business/advisor/signalScanner.ts` · `business/healthMap/longitudinal.ts` · `business/learning/institutionalLearning.ts` · `business/notifications/notifications.ts` · `business/fieldDiscovery/uploadClient.ts` · `business/creativeStudio/fixtures.ts` · `business/index.ts` | G-Business Concierge | 2026-07/08 | 0 | ORPHAN | needs-owner-decision |
| `app/lib/digitalContact/digitalContactShareMessages.ts` · `digitalContact/humanConnection/index.ts` · `humanConnection/providers/googleMeetProvider.ts` | G-Human Connection Router | 2026-06/07 | 0 | ORPHAN | needs-owner-decision (`docs/human-connection-router-architecture.md`) |
| `app/lib/clasificados/autos/autosMuxVideoClient.ts` | G-Media/Mux | 2026-07 | 0 | ORPHAN (fork of the live Mux client) | needs-owner-decision |
| `app/lib/clasificados/autos/autosNegociosChildMediaBrowserProof.ts` | G-Autos QA | 2026-08 | 0 | ORPHAN (proof harness) | yes |
| `app/lib/clasificados/autos/dealersDeAutosHubCategoryCopy.ts` | G-Autos dealers hub | 2026-07 | 0 | ORPHAN | yes |
| `app/lib/clasificados/bienes-raices/bienesChildPropertyInventory.ts` | G41 BR parent/child | 2026-07 | 0 | ORPHAN | **needs-owner-decision — GAP-002 territory** |
| `app/lib/clasificados/bienes-raices/brPublishCheckoutClient.ts` | G-BR checkout | 2026-07 | 0 | ORPHAN | needs-owner-decision (revenue) |
| `app/lib/clasificados/en-venta/dashboard/mapListingRowToEnVentaRepublishDraft.ts` | G08 Save/Edit/Republish | 2026-07 | 0 | ORPHAN — **an unused "reverse mapper" of exactly the shape GAP-002 says is missing elsewhere** | **needs-owner-decision — HIGH VALUE** |
| `app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts` · `en-venta/varios-display-normalizer.ts` | G-En Venta | 2026-06/07 | 0 | ORPHAN | yes |
| `app/admin/_lib/websiteContentScaffold.ts` | G48 Admin | `dc2d3757 2026-04-06` | 0 | ORPHAN | yes |
| `app/admin/_lib/adminViajesBusinessOffersMock.ts` + `adminViajesBusinessOffersTypes.ts` | G-Viajes admin | `7492e09f 2026-04-09` | 0 | ORPHAN (mock data shipped in the app bundle) | yes |
| `app/admin/_components/AdminCard.tsx` · `AdminLangToggle.tsx` · `AdminQuickActionsRail.tsx` · `AdminSearchForm.tsx` | G48 Admin UI | 2026-04/06 | 0 | ORPHAN | yes |
| `app/admin/(dashboard)/leo/_components/LeoExecutiveHeader.tsx` · `(dashboard)/workspace/clasificados/ClasificadosCategoryOpsAudit.tsx` | G48 Admin UI | 2026-07/08 | 0 | ORPHAN | yes |
| `app/components/MagazineReader.tsx` · `FlipBookViewer.tsx` | G-Magazine | **`803f0aea 2025-12-02` — the initial project commit** | 0 | ORPHAN — oldest dead code in the repo | yes |
| `app/components/CinematicCarousel.tsx` | G-Home | `d7cc6574 2026-02-27` | 0 | ORPHAN | yes |
| `app/components/PageHero.tsx` · `LogoFloating.tsx` | G-Chrome | `d5314f5d 2026-04-21` | 0 | ORPHAN | yes |
| `app/components/ComingSoonGate.tsx` | G-Launch Lock | `c654d166 2026-05-27` | 0 | ORPHAN — **a launch gate nothing gates** | needs-owner-decision |
| `app/components/CouponCard.tsx` | G-Cupones | `d50e400a 2026-05-27` | 1 importer, **itself dead** (`CuponesPageClient.tsx`, labelled "legacy, unused" in `app/lib/website-audit/CUPONES_LANDING_RESULTS_FINAL_POLISH_V1_AUDIT.md:24`) | ORPHAN (transitive) | yes |
| `app/(site)/cupones/CuponesPageClient.tsx` | G-Cupones | — | 0 | **LEGACY — self-documented as unused** | yes |
| `app/components/leonix/LeonixLaunchCouponCard.tsx` | G-Launch 25 | 2026-06 | 0 | ORPHAN | yes · ⚠ string-asserted by `verify-launch-25-public-placements.mjs:42,45` and `verify-launch-25-opportunity-surfaces.mjs:58` — **false green** |
| `app/components/clasificados/analytics/LeonixListingMetricsSummary.tsx` → `LeonixEngagementBar.tsx` → `LeonixMetricPill.tsx` | G27 Analytics UI | `d3647a5c 2026-04-29` | 0 external (3-node dead chain) | ORPHAN cluster | yes |
| `app/components/clasificados/EmailContactOptionsSheet.tsx` | G-Contact | `ad3f5c30 2026-05-12` | 0 | ORPHAN | yes · ⚠ string-asserted by `final-community-family-certification.ts:44`, `gate-2c-community-contact-uri-selftest.ts:90`, `gate-2d-community-owner-qa-debt-selftest.ts:250` — **3 false greens** |
| `app/components/digitalContact/humanConnection/FaceToFaceVideoCta.tsx` | G-Human Connection | 2026-07 | 0 | ORPHAN | yes · ⚠ string-asserted by `digital-contact-human-connection-12-assert.ts:96`, `-13-assert.ts:58`, `-13a:79` |
| `app/components/forms/NorCalCitySelect.tsx` | G-Location | `04769d82 2026-06-11` | 0 | ORPHAN | yes |
| `app/components/translation/index.ts` | G-Translate UI | 2026-06 | 0 | ORPHAN barrel | yes |
| `app/(site)/components/mobile/LeonixStickyActionBar.tsx` | G-Mobile chrome | 2026-06 | 0 | ORPHAN | yes |
| `app/data/classifieds.ts` · `data/events.ts` · `data/restaurants.ts` · `data/rss-events.ts` | pre-Supabase seed data | `ef969037 2026-03-03` / `915cdd5e 2025-12-06` / `a9dc3163 2026-02-25` / `d5314f5d 2026-04-21` | 0 | **LEGACY — the hard-coded fixtures the platform ran on before Supabase** | yes |

### 3.10 NEW-10 — "GLOBAL-ENGINE-NAMED" ORPHANS (the priority class requested)

Modules whose names promise a *global* engine — `canonical`, `shared`, `global`, `adapter`,
`registry`, `engine`, `contract`, `matrix`, `resolver`, `builder` — that **no route reaches**.
This is the single most misleading orphan class: the name asserts platform-wide authority.

**Route-unreachable (51 files) — the named "contracts" and "registries":**
`autos/contracts/autosCanonicalIdentity.ts` · `autos/contracts/autosInventoryAndTrustFields.ts` ·
`autos/dealer/contracts/autosDealerLaneContract.ts` ·
`autos/free/contracts/autosFreePrivateContract.ts` ·
`autos/privado/contracts/autosPrivadoProduct.ts` ·
`autos/pro/contracts/autosProPrivateContract.ts` ·
`bienes-raices/shared/brFilterContract.ts` · `bienes-raices/shared/brPublishDiscoveryReadiness.ts` ·
`empleos/lib/empleosFilterContract.ts` · `servicios/lib/serviciosDiscoveryContract.ts` ·
`viajes/lib/viajesCanonicalFieldInventory.ts` · `dashboard/lib/dashboardDataContract.ts` ·
`components/categoryPipeline/catStd1aPipelineRegistry.ts` ·
`en-venta/input/enVentaCanonicalKeys.ts` · `en-venta/shared/utils/evCityCanonical.ts` ·
`restaurantes/adapters/restauranteApplicationToDiscoveryRow.ts` ·
`clasificados/lib/stripLegacySharedWizardBrKeys.ts` ·
`{clases,comunidad,empleos,restaurantes,servicios}/shared/fields/*Taxonomy.ts` (5 files) ·
`rentas/shared/{filters/rentasFilters,mapping/rentasPublishDetailPairs,rentasPreferenceKeys,rentasDraftVideoHydrate,rentasDraftVideoMuxSource,rentasDraftVideoStore,rentasMuxVideoClient}.ts` ·
`rentas/shared/publish/{RentasPublishShell,RentasPublishTrackStep}.tsx` ·
`publicar/empleos/shared/publish/empleosAdminProjection.ts` ·
`publicar/empleos/shared/types/empleosAdminListingCompatibility.ts` ·
`publicar/community/shared/CommunityQuickApplicationClient.tsx` ·
`tienda/product-configurators/business-cards/designer-v2/adapters/toBusinessCardDocument.ts` ·
`app/lib/listingPlans/entitlementActivationContract.ts` (§3.7) ·
`app/leo/_lib/leo{ToolAdapters,AdminCapabilitiesAdapter}.ts` (§3.3) ·
`app/admin/revistaIssueRegistryActions.ts` (§3.6).

**Script-only — "green" but unrouted (9 files):**
`app/components/contact/connectionHub/sharedConnectionHubContactModel.ts` ·
`app/lib/businessAddress/businessAddressContract.ts` ·
`app/lib/business/creativeStudio/{archetypes/registry,brand/brandAssetRegistry,imageQualityEngine,languageEngine,preflightEngine,qrRegistry}.ts` ·
`app/lib/qaFoundation/qaFixtureRegistry.ts`.

**CLASS:** ORPHAN (global-engine-named). **SAFE TO ARCHIVE LATER: needs-owner-decision for all —
each name implies an architectural promise that must be reconciled before removal.
DO NOT DELETE NOW.**

### 3.11 NEW-11 — `app/lib/business/creativeStudio/*` — 13 OF ~20 FILES ARE VERIFIER-ONLY

`canvaHandoff.ts` · `canvaPromptCompiler.ts` · `compliance.ts` · `exports.ts` ·
`imageQualityEngine.ts` · `languageEngine.ts` · `preflightEngine.ts` · `productionRules.ts` ·
`qrRegistry.ts` · `archetypes/registry.ts` · `brand/brandAssetRegistry.ts` · `brand/brandRules.ts` ·
`brand/brandTypes.ts` — **route-unreachable; the only thing importing them is
`scripts/program6-creative-studio-verifier.ts`.** `fixtures.ts` is dead even to that.
**SYSTEM:** G-Business Concierge / Program 6. **CLASS:** ORPHAN (verifier-only engine).
**SAFE TO ARCHIVE LATER:** needs-owner-decision. **DO NOT DELETE NOW.**

---

## 4. ROUTE / `.tsx` SHADOW PAIRS — RESOLVED

### 4.1 ✅ `/clasificados/publicar/autos` — **STILL A LIVE DUPLICATE RENDER. CONFIRMED.**

| | |
|---|---|
| Route A | `app/(site)/clasificados/publicar/autos/page.tsx` (22 L) |
| Route B | `app/(site)/publicar/autos/page.tsx` |
| Shared body | **Both render `PublicarAutosBranchClient`.** Route A reaches it via the tsconfig alias `"@/app/publicar/*" → "./app/(site)/publicar/*"` (one of 18 such route-group aliases) |
| Redirect? | **NO.** `next.config.ts` `redirects()` has 14 entries; neither path appears |
| Canonical? | **NO** `alternates.canonical` on either file |
| **VERDICT** | **DUPLICATE — both LIVE, both indexable. Ledger claim CONFIRMED at `a0a47839`.** Legacy one is **reachable**. SAFE TO ARCHIVE LATER: **needs-owner-decision** (needs a redirect + canonical, not deletion). **DO NOT DELETE NOW.** |

### 4.2 ⚠️ `/resultados` vs `/results` — **THE LEDGER CLAIM IS NOW STALE. THIS IS A CORRECTION.**

Doc 17 states servicios and restaurantes serve one page at both paths "with no redirect and no
canonical tag". **That is no longer true at `a0a47839`.** `next.config.ts` now carries **14
permanent redirects**, added by Package F Build F2 Gate 4, which explicitly verified direction
against live navigational callers rather than assuming from file location:

| Category | Redirect | ⇒ TRUE LIVE PATH | Dead-behind-redirect file |
|---|---|---|---|
| autos | `/resultados` → `/results` | `/results` | `autos/resultados/page.tsx` (10 L) is never served directly; `autos/results/page.tsx` (11 L) re-exports its default and adds `alternates.canonical` |
| restaurantes | `/resultados` → `/results` | `/results` | `restaurantes/resultados/page.tsx` (19 L) — **live via re-export**, dead as a URL |
| servicios | `/resultados` → `/results` | `/results` | `servicios/resultados/page.tsx` (246 L) — **live via re-export**, dead as a URL |
| bienes-raíces | `/results` → `/resultados` | `/resultados` | **`bienes-raices/results/page.tsx` (1 L) — GENUINELY DEAD.** Ledger claim ✅ CONFIRMED |
| en-venta | `/resultados` → `/results` | `/results` | — |
| empleos · busco · clases · mascotas-y-perdidos · comunidad | `/results` → `/resultados` | `/resultados` | **5 dead 1–5-line re-export files** |

**🔴 NEW-12 — VIAJES IS THE ONE UNFIXED DUPLICATE, AND F2 ADMITS IT**

| | |
|---|---|
| PATHS | `app/(site)/clasificados/viajes/resultados/page.tsx` (15 L, real) · `app/(site)/clasificados/viajes/results/page.tsx` (**1 L**, `export { default } from "../resultados/page";`) |
| Redirect? | **NO — `viajes` appears in ZERO of the 14 redirect rules** |
| Canonical? | **NO** |
| **VERDICT** | **DUPLICATE — byte-identical content served at two indexable URLs. The last unremediated instance of a defect Package F closed everywhere else.** |
| Corroboration | `docs/globalization/package-f/F2_FINAL_FIX_BUILD_CLOSURE.md:40` — "*Viajes' equivalent duplicate is documented, not fixed … Viajes is not Globalization-owned*"; `:130` defers it to `VIAJES_GLOBALIZATION_DEPENDENCY_HANDOFF.md`. **Known and consciously deferred, not lost.** |
| SAFE TO ARCHIVE LATER | **needs-owner-decision** — the fix is a `next.config.ts` redirect, not an archive. **DO NOT DELETE NOW.** |

**DEAD-BEHIND-REDIRECT re-export files (7):** `bienes-raices/results/page.tsx` ·
`busco/results/page.tsx` · `empleos/results/page.tsx` · `mascotas-y-perdidos/results/page.tsx` ·
`clases/results/page.tsx` · `comunidad/results/page.tsx` · `autos/resultados/page.tsx`.
**CLASS: LEGACY (unreachable). SAFE TO ARCHIVE LATER: yes — but only *after* confirming no
external inbound links, since the redirects are what preserve their SEO value. DO NOT DELETE NOW.**

### 4.3 ✅ `app/(site)/coupons` vs `app/(site)/cupones` — **RESOLVED, BENIGN**

`app/(site)/coupons/page.tsx` is **6 lines**: `redirect("/cupones?lang=en")`. Not a duplicate
render. **CANONICAL = `cupones`; `coupons` = intentional redirect shim.** However
`app/(site)/cupones/CuponesPageClient.tsx` is **orphaned** and self-documented as
"legacy, unused" (§3.9) — the *real* cupones dead code is inside the canonical directory.
**SAFE TO ARCHIVE LATER: no for `coupons/page.tsx` (working redirect); yes for
`CuponesPageClient.tsx` + `app/components/CouponCard.tsx`. DO NOT DELETE NOW.**

### 4.4 ✅ `app/(site)/contact` vs `contacto` vs `app/contact` — **THREE DIFFERENT THINGS, NOT A TRIPLICATE**

| PATH | ROLE | VERDICT |
|---|---|---|
| `app/(site)/contacto/page.tsx` + `ContactIntakeHero.tsx` | the real contact page | **CANONICAL** |
| `app/(site)/contact/page.tsx` (41 L) | param-preserving redirect → `/contacto`, uses `parseInquiryType` | **REDIRECT SHIM — correct, keep** |
| `app/contact/[slug]/page.tsx` (51 L) | **Digital Contact Card** — `DigitalContactPageClient`, `DigitalContactJsonLd`, `getPublishedExecutiveContactProfile` | **UNRELATED FEATURE.** A dynamic per-executive vCard route that merely shares the word "contact" |
| **VERDICT** | **NOT a duplicate set.** The apparent triplicate is one canonical page, one correct shim, and one distinct product. **⚠ Route-collision risk worth noting:** `/contact` (shim, static) and `/contact/[slug]` (feature, dynamic) share a URL prefix across two different route trees. SAFE TO ARCHIVE LATER: **no — all three are load-bearing. DO NOT DELETE NOW.** |

### 4.5 ⚠️ `coming-soon` vs `coming-soon-live` vs `coming-soon-v2` — **THREE LIVE, DIVERGENT LAUNCH PAGES**

| PATH | LINES | RENDERS | VERDICT |
|---|---:|---|---|
| `app/(site)/coming-soon/page.tsx` | **703** | a self-contained inline monolith — its own `DEEP_RED = "#A30F18"`, its own `normalizeLang`, its own 7-drawer CSS-only accordion. Imports **no** Leonix component | **LEGACY MONOLITH — but `robots` NOT set, so it is indexable** |
| `app/(site)/coming-soon-live/page.tsx` | 14 | `<LeonixComingSoonView mode="page" />` · `robots: { index: false }` | ACTIVE (noindex preview) |
| `app/coming-soon-v2/page.tsx` | 13 | `<ComingSoonV2Shell />` · `robots: { index: false }` · "capa 1 (shell y encabezado)" | ACTIVE (noindex, explicitly a *layer-1 partial*) |
| **VERDICT** | **TRIPLICATE — all three reachable.** Two are noindex previews of two *different* successor designs; the 703-line original is the only indexable one and shares **zero code** with either successor. `ComingSoonGate.tsx` (§3.9), the component that would gate them, has **0 importers**. SAFE TO ARCHIVE LATER: **needs-owner-decision — this is a launch-facing brand surface. DO NOT DELETE NOW.** |

### 4.6 ✅ `servicios/resultados/page_temp.tsx` — **CONFIRMED PRESENT**

Still tracked at `origin/main`. Not a Next route file (`page_temp` is not a reserved name), so it
never renders — but it **is** shipped in the repo and picked up by `tsc`.
**CLASS: ORPHAN (committed scratch file). SAFE TO ARCHIVE LATER: yes. DO NOT DELETE NOW.**

---

## 5. THE NINE `global-*` FEEDER BRANCHES — CONTENT DIFF

⚠ **The methodology warning was correct, and the failure rate was total.**
`git merge-base --is-ancestor <branch> origin/main` returned **NOT-AN-ANCESTOR for all 11
branches** — **11 / 11 FALSE NEGATIVES.** Every branch was cherry-picked or rebased onto `main`
under a new SHA *and* a renamed commit subject, so ancestry is worthless here.

**Decisive evidence used instead of diff sampling: root-tree-SHA identity.** 10 of 11 branch tips
have a **byte-identical root tree SHA** to a commit that *is* an ancestor of `origin/main`.
Identical tree SHA = every byte of every file in the entire repo matches. No stronger content
proof exists in git.

| # | Branch (all `…-2026-08`) | Tip | Date | is-ancestor | Twin on main | Tree | **VERDICT** |
|---:|---|---|---|---|---|---|---|
| 1 | `global-business-hub-os` | `4aeb0f5a` | 08-17 | FALSE | `11ca9e39` | IDENTICAL | **ALREADY CAPTURED** |
| 2 | `global-saved-search-watchlist-architecture` | `fcb7058a` | 08-17 | FALSE | `13b857ee` | IDENTICAL | **ALREADY CAPTURED** |
| 3 | `global-location-privacy-security-proof` | `4b3f1730` | 08-17 | FALSE | `822f4dab` | IDENTICAL | **ALREADY CAPTURED** |
| 4 | `global-saved-search-storage-rls` | `48cecca3` | 08-17 | FALSE | `d4593fa0` | IDENTICAL | **ALREADY CAPTURED** |
| 5 | `global-saved-search-autos-matcher` | `1de8cdaf` | 08-18 | FALSE | `08bbb579` | IDENTICAL | **ALREADY CAPTURED** |
| 6 | `global-saved-search-autos-ui` | `b36499e6` | 08-18 | FALSE | `b9a4655b` | IDENTICAL | **ALREADY CAPTURED** |
| 7 | `global-saved-search-autos-outbox` | `e6300e05` | 08-18 | FALSE | `d23a4ef0` | IDENTICAL | **ALREADY CAPTURED** |
| 8 | `global-saved-search-email-delivery` | `abff6b57` | 08-18 | FALSE | `3ae8e1cf` | see note | **ALREADY CAPTURED** |
| 9 | `global-saved-search-br-rentas` | `ca9a41ff` | 08-18 | FALSE | `1000d3db` | IDENTICAL | **ALREADY CAPTURED** |
| 10 | `global-business-hub-trust-cta-media` | `e7c8ac42` | 08-19 | FALSE | `390b939c` | IDENTICAL | **ALREADY CAPTURED** |
| 11 | `global-lifecycle-translate-seo` | `6766c0bf` | 08-19 | FALSE | `d21efda3` | IDENTICAL | **ALREADY CAPTURED** |

**GENUINELY UNINTEGRATED: 0 · MIXED: 0.** All 11 twins verified as ancestors of `origin/main`.
Every branch is exactly 1 commit ahead of its merge-base; each merge-base is the *previous* stage
already on main — a linear release train re-landed under staged names (e.g. branch *"feat: add
Autos saved search email delivery"* → main `3ae8e1cf` *"Saved Search 05: Autos email delivery
engine"*). Main even carries the follow-on `6b155cf3` *"Globalization Build 05: final production
closeout certification"* — **a full stage beyond the last feeder branch.**

**Why the raw `--stat` looks alarming and is not.** `git diff --stat origin/main <branch>` shows
1,735–2,087 files and 274k–304k deletions. Breakdown of the *additions* side:

- **32 status-`A` files, the identical set on all 11 branches** (path-list md5 `31c47a65` ×11),
  6,121 lines. **Not branch content** — they were present on main historically at `11ca9e39` and
  main later *deleted* them in a restructure. They are the legacy BR-negocio monolith
  (`publicar/bienes-raices/negocio/application/**`, 19 `*NegocioSection.tsx`, the `preview-mockup/`
  tree), superseded on main by a per-role module tree
  (`publicar/bienes-raices/negocio/agente-individual/application/**`) — right down to the same
  `utils/readFileAsDataUrl.ts`, merely relocated. Plus one rename main performed:
  `clasificados/lib/LeonixCorreoLeadModal.tsx` → `clasificados/en-venta/preview/EnVentaCorreoModal.tsx`.
- **Remaining insertions are superseded older revisions inside modified files.** Largest:
  `publicar/community/shared/CommunityQuickApplicationClient.tsx` — 1,298 L on the branch vs
  **22 L** on main, because main decomposed it into ~25 modules under
  `publicar/community/shared/{components,constants,copy,hooks,lib,preview,publish}/`. Nothing lost.
  *(Note: that 22-line barrel is itself now route-unreachable — see §3.10.)*
- **The 274k–304k deletions are main-ahead content**, not branch content.

**Feature-file presence at `origin/main` HEAD** (files each branch introduced/touched): **0 absent,
across all 11.** business-hub-os 34/34 · watchlist 6/6 · location-privacy 3/3 · storage-rls 2/2 ·
autos-matcher 9/9 · autos-ui 15/15 · autos-outbox 5/5 · email-delivery 6/6 · br-rentas 28/28 ·
trust-cta-media 15/15 · lifecycle-translate-seo 23/23. Symbol spot-checks on `origin/main`:
`autosSavedSearchMatchOrchestrator` 3 files · `savedSearchEmailDelivery` 7 · `savedSearchMatchEmail`
3 · `autosSavedSearchEligibilitySupport` 5. The full SS-01→06 migration chain is present
(`20250313000002_saved_searches.sql`, `20260817120000_saved_searches_v1_reconcile.sql`,
`20260818120000_saved_search_match_events.sql`, `20260819090000_…_delivery.sql`,
`20260819150000_…_br_rentas.sql`).

**Note on #8** (the one non-identical tree): it differs from twin `3ae8e1cf` by 24 files
(+2,233/−1,906), but **its own 6 feature files diff to exactly ZERO** against that twin. The
24-file delta is unrelated main-ahead work merged in between (`3ae8e1cf`'s parent is `7dcdc1d5`
*"merge: website public navigation and SEO shell into main"*) — `ClasificadosHubClient.tsx`,
`MagazineHubClient.tsx`, `NegociosLocalesClient.tsx`, `RecursosComunitariosClient.tsx`,
`PublicPillarJsonLd.tsx`, `publicPillarSeo.ts`, Navbar/Footer/sitemap. All 24 are main-only.
**Verdict stands: ALREADY CAPTURED.**

> **CONCLUSION:** All 11 feeder branches are content-complete on `origin/main`. Their apparent
> divergence is 100 % explained by SHA rewrite during cherry-pick/rebase plus main advancing
> past them. **They are retirement candidates — but DO NOT DELETE NOW; branch deletion is
> irreversible without a reflog and is an owner decision.**

---

## 6. COMMITTED BACKUP / SCRATCH SOURCE FILES

| PATH | WHY IT EXISTS | CLASS | ARCHIVE LATER |
|---|---|---|---|
| `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx.backup` | manual editor backup, committed | ORPHAN artifact | yes |
| `app/(site)/clasificados/servicios/resultados/page_temp.tsx` | scratch copy (UTF-16 per doc 17), non-route, still shipped | ORPHAN artifact | yes |
| `app/data/classifieds/sampleListings.ts.bak` | seed-data backup | ORPHAN artifact | yes |
| `app/data/classifieds/classifieds/sampleListings.ts.bak` | **self-nested duplicate** | ORPHAN artifact | yes |
| `app/data/classifieds/classifieds/classifieds/sampleListings.ts.bak` | **self-nested duplicate ×3** | ORPHAN artifact | yes |
| `app/data/classifieds/classifieds/classifieds/classifieds/sampleListings.ts.bak` | **self-nested duplicate ×4** | ORPHAN artifact | yes |

🔴 **NEW-13 — the `app/data/classifieds/` path is nested inside itself four times deep**, each
level holding a `.bak` of the same seed file. This is a botched recursive copy that was committed
and never cleaned. It is inside `app/`, so it counts against the 4,700-file app tree and is walked
by `tsc` and the Next.js build. **ALL: DO NOT DELETE NOW.**

---

## 7. CROSS-CUTTING RISK — WHY THIS ORPHAN MASS PERSISTED

The reachability graph and the verifier audit (doc 20 §C) explain each other:

1. **836 of 1,057 scripts (79 %) assert on source TEXT, not behaviour.** A `.includes("Symbol")`
   check on a file's raw string passes whether or not that symbol is ever rendered.
2. **85 scripts string-assert a component name with ZERO importers** — 24 distinct orphaned
   components are "verified" this way. Confirmed false greens include
   `AutosNegociosBusinessHubFauxMap`, `ServiciosHubReviewLinkButton`,
   `RestaurantHubReviewLinkButton`, `EmailContactOptionsSheet`, `LeonixLaunchCouponCard`,
   `CategoryStandardResultsFilterPanel`, `RestauranteOfertasLocales*Card`, `FaceToFaceVideoCta`.
3. **Two gates are provably RED** and therefore never executed:
   `verify-servicios-dashboard-truth.mjs:12` asserts `ServiciosListingMetricsPills` and
   `ofertas-locales-offer-hub-audit.ts:226` asserts `EmailContactRow` — **both symbols exist
   nowhere in the repo except inside those scripts themselves.**
4. **469 of 1,037 executable scripts (45 %) are referenced by no npm script at all.**

**Net effect: the repo's verification layer cannot distinguish live code from dead code, because
it reads text rather than exercising routes.** That is the mechanism by which ~434 dead modules
accumulated while gates stayed green.

---

## 8. SUMMARY LEDGER

| Class | Count | Basis |
|---|---:|---|
| `.ts/.tsx` under `app/` at `origin/main` | 4,242 | denominator |
| **Unreachable from any Next.js entry point** | **469** | 11.1 % |
| **Unreachable from anything (true dead code)** | **434** | 10.2 % |
| **NEW confirmed-dead modules (net of ledger + script-only)** | **≈ 394** | §3 |
| Reachable only from `scripts/`/`e2e/` | 35 | "verifier-only" |
| Global-engine-named orphans | 51 route-unreachable + 9 script-only | §3.10 |
| Zero-importer `"use server"` action modules (NEW) | 3 | §3.6 |
| Whole-directory orphan clusters ≥ 30 % dead | 6 | §3.5 |
| Committed `.backup`/`.bak`/`_temp` source files | 6 | §6 |
| Dead-behind-redirect route files | 7 | §4.2 |
| **Live unredirected duplicate routes remaining** | **2** (`publicar/autos`, `viajes/results`) | §4.1, §4.2 |
| Feeder branches genuinely unintegrated | **0 of 11** | §5 |

> **EVERY ITEM IN THIS DOCUMENT: DO NOT DELETE NOW.**
> Nothing here was moved, renamed, deleted, or reorganized. This document is traceability only.

---

## APPENDIX — PROPOSAL ONLY, NOT PERFORMED

*Nothing below has been done. It is a suggested future sequence for an owner-approved cleanup.*

1. **Fix, do not archive, the 2 live duplicate routes** — add `next.config.ts` redirects for
   `/clasificados/viajes/results → /resultados` and `/clasificados/publicar/autos → /publicar/autos`,
   plus `alternates.canonical`. Lowest risk, highest SEO return.
2. **Delete the 4-deep `app/data/classifieds/classifieds/…` nest and the 6 `.backup`/`.bak`/
   `_temp` files.** Zero behavioural risk; they are unreferenced by construction.
3. **Before archiving ANY module, replace its string-asserting verifier with a behavioural test.**
   Otherwise archiving silently turns a false green into a false green on a missing file.
4. **Split `categoryStandard/`**: keep the 15 live files, move the 10 V1-only ones to an archive
   path once V2's coverage is confirmed by route, not by grep.
5. **Triage the 3 zero-importer `"use server"` modules on SECURITY grounds first**, not tidiness —
   they are callable surface (see GAP-001 item H).
6. **Retire the 11 feeder branches** only after the owner confirms the tree-SHA proof in §5.
7. **Do not touch** `app/lib/businessAddress/*`, the Leo tool bus, or `entitlement*` modules until
   the owner confirms they are abandoned rather than built-ahead.
