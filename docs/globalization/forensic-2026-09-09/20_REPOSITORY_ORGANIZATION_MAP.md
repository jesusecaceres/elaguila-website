# 20 — REPOSITORY ORGANIZATION MAP · MIGRATIONS · TESTS · SCRIPTS

**Audit date:** 2026-09-09 · **Batch 9 (final research batch)** · **READ-ONLY. NOTHING WAS MOVED,
RENAMED OR DELETED. NO REORGANIZATION WAS PERFORMED.**

## 0. SOURCE OF TRUTH — VERIFIED TWICE

| Ref | SHA | Note |
|---|---|---|
| **`origin/main` — TRUE CURRENT** | **`a0a4783971b42ea1d71ab2602d4720d0d590baf8`** | verified at batch start AND re-verified immediately before writing — unchanged |
| Local worktree `HEAD` | `d09d979c` | **112 commits STALE.** Never read from |
| Sealed September branch | `e3956df8` | **FORK, not ancestor.** merge-base `7878d856` |

Every path, count and line number below is read from `origin/main`.

---

# PART A — STRUCTURAL MAP

## A.1 REPOSITORY ROOT

| Item | Type | Files | Classification |
|---|---|---:|---|
| `app/` | source | **4,700** | canonical application |
| `scripts/` | tooling | **1,057** | verification corpus (see Part C) |
| `public/` | assets | **356** | canonical |
| `docs/` | documentation | **230** | canonical docs root |
| `supabase/` | schema | **164** (163 migrations + `.temp`) | canonical |
| `design-references/` | assets/docs | **64** | historical design source-of-record |
| `e2e/` | tests | **33** | **the only behavioural test suite in the repo** |
| `data/` | data | 29 | canonical |
| **`qa-final-screenshots/`** | **generated** | **382** | 🔴 **COMMITTED BUILD ARTIFACT** |
| **`qa-smoke-screenshots/`** | **generated** | **14** | 🔴 **COMMITTED BUILD ARTIFACT** |
| `pages/` | source | 4 | ⚠ **legacy Pages Router surviving alongside App Router** (`_app.tsx`, `_document.tsx`, `api/coupons.ts`, `api/entries.ts`) |
| `tests/` | tests | 1 | orphan directory — a single Ofertas scenario file |
| `tmp/` | generated | 1 | 🔴 `tmp/rentas-sample-content-report.json` — a `tmp/` directory committed to git |
| **17 × `playwright.*.config.mjs`** | config | 17 | 🔴 see A.4 |
| **9 root-level build/log artifacts** | generated | 9 | 🔴 see A.4 |
| **7 root-level `.md` architecture docs** | docs | 7 | 🔴 misplaced — see A.5 |
| `middleware.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `package.json`, `package-lock.json`, `.gitignore` | config | 8 | canonical |

## A.2 `app/` — DIRECT CHILDREN (4,700 files)

| Child | Files | Role |
|---|---:|---|
| `app/(site)/` | **2,393** | all public + dashboard routes (route group) |
| `app/lib/` | **1,315** | shared engines / domain logic |
| `app/admin/` | **446** | Admin OS |
| `app/api/` | **262** | route handlers |
| `app/leo/` | — | Leo Executive AI OS (`_lib` + routes) |
| `app/components/` | 108 | global components |
| `app/data/` | — | ⚠ pre-Supabase seed fixtures (§A.6) |
| `app/contact/` | — | Digital Contact Card feature — `[slug]` dynamic route (NOT a duplicate of `(site)/contacto`, see doc 16 §4.4) |
| `app/coming-soon-v2/` | 2 | third launch page (see doc 16 §4.5) |
| `app/translate-site/`, `app/visitanos/`, `app/offline/`, `app/_rss_disabled/` | small | feature/utility routes; `_rss_disabled` is a **disabled-by-underscore route left in the tree** |
| `layout.tsx`, `globals.css`, `metadata.ts`, `manifest.ts`, `robots.ts`, `sitemap.ts`, `not-found.tsx`, `favicon.ico` | 8 | app shell |

## A.3 CANONICAL GLOBAL SYSTEM LOCATIONS vs CATEGORY-SPECIFIC

### `app/lib/` — direct children (1,315 files)

**Global engines (canonical):** `analytics` (12) · `auth` (4) · `businessAddress` (6) ·
`businessApplications` (1) · `businessHours` (1) · `content` (2) · `digitalContact` (50) ·
`email` (9) · `i18n` (2) · `launchLock` (2) · `leonix` (45) · `leonixCommunityTrust` (6) ·
`listingDrafts` (1) · `listingIdentity` (12) · `listingLifecycle` (7) · `listingPlans` (78) ·
`media` (4) · `mux` (1) · `newsletter` (4) · `openai` (1) · `pwa` (2) · `qaFoundation` (1) ·
`saved-search` (29) · `security` (1) · `seo` (4) · `siteBlocks` (3) · `siteCategory` (1) ·
`siteSectionContent` (10) · `sms` (4) · `supabase` (6) · `translation` (17)

**Category-specific under `app/lib/` (the largest concentration):**
`clasificados` (**384**) · `ofertas-locales` (**182**) · `business` (**181**) · `website-audit`
(**72**) · `recursos` (57) · `leonix` (45) · `iglesias` (34) · `magazine` (29) · `tienda` (22)

**Loose top-level files (18)** — global concerns that never got a folder:
`clasificadosAnalytics.ts` · `listingAnalytics.ts` · `listingAnalyticsEventTypes.ts` ·
`autosSavedListingIdentity.ts` · `empleosSavedListingIdentity.ts` ·
`restaurantesSavedListingIdentity.ts` · `serviciosSavedListingIdentity.ts` ·
`savedListingsDashboardResolve.ts` · `savedListingsRuntime.ts` · `listingSaveDbKey.ts` ·
`ownerEngagementListingKeys.ts` · `ownerEngagementRollupsServer.ts` · `leonixBrand.ts` ·
`leonixPublicConsent.ts` · `leonixEngagementClientDiagnostics.ts` · `googleTranslateWebsite.ts` ·
`lang.ts` · `language.ts` · `publicNavConfig.ts` · `advertiseDropdownConfig.ts` ·
`recentlyViewed.ts` · `distance.ts` · `formatListingPrice.ts` · `contactEmailMailto.ts` ·
`rootIntroCopy.ts` · `supabaseClient.ts`
> ⚠ `lang.ts` **and** `language.ts` **and** `i18n/` **and** `translation/` **and**
> `googleTranslateWebsite.ts` are five language concerns at four different levels of the tree.

### `app/api/` — direct children (262 files)

`admin` **75** · `clasificados` **62** · `dashboard` **32** · `ofertas-locales` **24** · `digital-contact` 9 ·
`leo` 9 · `business` 6 · `iglesias` 6 · `tienda` 5 · `revenue-os` 4 · `mux` 3 · `newsletter` 3 ·
`rss` 3 · `verified-intro-discount` 3 · `_lib` 2 · `preview` 2 · `saved-search` 2 · `analytics` 1 ·
`contact` 1 · `leads` 1 · `leonix-endorsements` 1 · `leonix-professional-identity` 1 · `magazine` 1 ·
`media-kit` 1 · `translate-ad` 1 · `seller-stats` 1 · **`debug` 1** · **`supabase-test` 1** ·
**`test-env` 1**
> 🔴 **`/api/debug`, `/api/supabase-test`, `/api/test-env` are development/diagnostic endpoints
> shipped in the production route tree.** Middleware (`middleware.ts:79`) gates only
> `pathname.startsWith("/admin")` — these are **not** gated.

### `app/admin/` — direct children (446 files)

`(dashboard)` **241** · `_lib` **99** · `_components` **62** · `field` 5 · `login` 3 · `logout` 1 ·
`_actions` 1 · plus **31 loose `*Actions.ts` server-action modules at the directory root** ·
plus **2 committed `.md` audit docs inside the source tree**
(`DASHBOARD_CEO_COMMAND_CENTER_AUDIT.md`, `DASHBOARD_MOBILE_COMMAND_CENTER_AUDIT.md`).

### `app/(site)/` — direct children (2,393 files)

`clasificados` **1,500** · `publicar` **296** · `tienda` **182** · `dashboard` **148** ·
`servicios` **112** · `magazine` 57 · `iglesias` 18 · `aprender` 8 · `negocios-locales` 8 ·
`components` 7 · `home` 7 · `noticias` 5 · `productos-promocion` 5 · `recursos-comunitarios` 5 ·
`lib` 4 · `cupones` 3 · `newsletter` 3 · `revenue-os` 3 · `contacto` 2 · `coming-soon-live` 2 ·
`legal` 2 · `media-kit` 2 · `qr` 2 · `about`/`auth`/`coming-soon`/`contact`/`coupons`/
`data-deletion`/`login`/`privacy`/`terms` 1 each · `layout.tsx`, `page.tsx`,
`RootIntroPageClient.tsx`
> ⚠ **`app/(site)/servicios/` (112) exists in parallel with
> `app/(site)/clasificados/servicios/`.** Servicios is the only category with a top-level route
> tree *and* a clasificados sub-tree. Doc 17 already flags the live-but-dead
> `app/(site)/servicios/perfil/preview/page.tsx` inside it.

## A.4 🔴 GENERATED ARTIFACTS COMMITTED TO THE REPOSITORY — **CONFIRMED AND EXTENDED**

**All nine known root artifacts CONFIRMED present at `a0a47839`:**

| File | Size | Verdict |
|---|---:|---|
| `globalization-build.log` | 97,894 B | 🔴 build log |
| `dev-out.log` | 51,563 B | 🔴 dev-server log |
| `build-out.log` | 34,353 B | 🔴 build log |
| `build-agent-log3.txt` | 4,356 B | 🔴 agent transcript |
| `build-agent-log2.txt` | 3,770 B | 🔴 agent transcript |
| `build-b31.log` | 3,098 B | 🔴 build log |
| `build-agent-log.txt` | 2,886 B | 🔴 agent transcript |
| `README.txt` | 86 B | 🔴 stray (distinct from `README.md`) |
| `_MANIFEST/` | dir | 🔴 `_MANIFEST/README.txt` + `_MANIFEST/filelist.txt` — a **generated file listing** |

**Playwright configs — CONFIRMED 17 at root** (task sheet said "12+"):
`playwright.config.mjs` is the only canonical one. The other **16 are one-offs**:
`autos-polish-32` · `autos-recovery-25` · `-26` · `-27` · `-28` · `-29` · `-30` ·
`autos-runtime` · `br-runtime` · `community-preview` · `community-quick-ui-smoke` ·
`empleos-runtime` · `leonix-smoke` · `rentas-runtime` · `rentas-start` · `restaurantes`.
Only **7** are wired to an npm script; the other 9 are invoked by nothing.

**🔴 ADDITIONAL GENERATED ARTIFACTS FOUND THIS BATCH (not previously listed):**

| Path | Files | Verdict |
|---|---:|---|
| **`qa-final-screenshots/`** | **382** | screenshot corpus (`*-desktop.png`, `*-mobile-390.png`) committed to git |
| **`qa-smoke-screenshots/`** | **14** | same |
| **`tmp/rentas-sample-content-report.json`** | 1 | a `tmp/` output committed |
| `e2e/empleos/manual-qa-seed-output.json` | 1 | test *output* committed next to its spec |
| `app/data/classifieds/…/sampleListings.ts.bak` ×4 | 4 | **the same file `.bak`'d inside a 4-deep self-nested directory** (doc 16 §6, NEW-13) |
| `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx.backup` | 1 | editor backup |
| `app/(site)/clasificados/servicios/resultados/page_temp.tsx` | 1 | scratch copy, non-route, still type-checked |

**Total committed generated artifacts identified: ≈ 428 files.**

## A.5 🔴 MISPLACED ARCHITECTURE DOCS AT ROOT — **ALL 6 CONFIRMED, ALL STALE**

| File | Last touched on `origin/main` | Staleness vs Sept work |
|---|---|---|
| `AGENTS.md` | `3e76f5c1` **2026-03-31** ("commit and push") | **5 months stale** |
| `LEONIX_AD_STORY_SYSTEM.md` | `72a5c22d` **2026-04-29** | **4 months stale** |
| `LEONIX_CATEGORY_DESIGN_SYSTEM.md` | `51872eb9` **2026-04-29** | **4 months stale** |
| `LEONIX_PREVIEW_CARD_CONTRACT.md` | `9eabc235` **2026-04-29** | **4 months stale** |
| `LEONIX_RESTAURANTES_FIELD_OUTPUT_BLUEPRINT.md` | `992513b6` **2026-04-29** | **4 months stale** |
| `COMUNIDAD_EVENTOS_COM1_LAUNCH_AUDIT.md` | `f59fb5ce` **2026-06-30** | **2 months stale** |
| `README.md` | `803f0aea` **2025-12-02** — the initial project commit | **9 months stale** |

`AGENTS.md` is the agent-operating contract every automation session reads first, and it has not
been updated since **March**, across the entire Globalization programme.

## A.6 ROOT-LEVEL AND IN-TREE LEGACY

| Path | Why it is legacy | Evidence |
|---|---|---|
| `pages/` (4 files) | Pages Router surviving beside the App Router | `_app.tsx`, `_document.tsx`, `api/coupons.ts`, `api/entries.ts` |
| `app/data/{classifieds,events,restaurants,rss-events}.ts` | pre-Supabase hard-coded fixtures | last touched 2025-12-06 → 2026-04-21; **0 importers** (doc 16 §3.9) |
| `app/_rss_disabled/` | a route disabled by renaming the folder rather than removing it | present in tree |
| `README.txt` + `_MANIFEST/` | packaging leftovers | §A.4 |
| `tests/` (1 file) | superseded by `e2e/` | single Ofertas scenario file |

## A.7 🔴 ARCHITECTURE DOCS LIVE IN **FOUR** PLACES — THE HEADLINE ORGANIZATION FINDING

| Location | `.md` files | Status |
|---|---:|---|
| **`app/`** | **446** | 🔴 **documentation shipped INSIDE the Next.js source tree** |
| `docs/` | 229 | the nominal docs root |
| `design-references/` | 42 | design/translation record |
| repository root | 7 | §A.5 |
| `data/` | 3 | — |
| `scripts/` | 2 | — |
| `qa-final-screenshots/`, `public/` | 1 each | — |

**`app/` holds nearly twice as many markdown documents as `docs/` does.** Concentrations:

`app/lib/clasificados/autos` **124** · `app/lib/ofertas-locales` **87** ·
**`app/lib/website-audit` 72 (a directory that is 100 % documentation living under `app/lib`)** ·
`app/lib/clasificados/en-venta` 23 · `app/lib/clasificados/comida-local` 21 ·
`app/(site)/clasificados/bienes-raices` 18 · `app/(site)/clasificados/en-venta` 15 ·
`app/(site)/dashboard` 13 · `app/lib/clasificados/restaurantes` 12 · `app/lib/clasificados` 12 ·
`app/lib/clasificados/bienes-raices` 9 · `app/admin` 2 · … (25 directories in total)

**Consequence:** 446 of `app/`'s 4,700 files (**9.5 %**) are prose. They are walked by the Next.js
build, counted in every "app file count", and — critically — **66 verifier scripts assert against
them** (Part C.3), so audit prose is load-bearing for CI outcomes.

---

# PART B — `docs/` INVENTORY (230 files)

## B.1 TOP-LEVEL GROUPINGS

| Grouping | Files | Note |
|---|---:|---|
| top-level `.md` (flat) | **183** | no folder structure |
| `docs/globalization/` | 13 | `G1_STAGING_MIGRATION_LOG.md` + `package-c` (6), `package-d` (2), `package-e` (2), `package-f` (2) |
| `docs/business-concierge/` | 12 | |
| `docs/qa/` | 9 | incl. `docs/qa/ledger/00_shared.md` |
| `docs/bienes-raices/` | 8 | incl. `BR_SYSTEM_SOURCE_OF_TRUTH.md` |
| `docs/leo/` | 2 | incl. `LEO_MASTER_ROADMAP.md` |
| `docs/community/` · `docs/global-business-hub/` · `docs/restaurantes/` | 1 each | single-file folders |

> ⚠ **`docs/globalization/forensic-2026-09-09/` — this audit series — is NOT on `origin/main`.**
> It exists only in the local working tree.

## B.2 🔴 DUPLICATE DOCS COVERING THE SAME TOPIC

Topic clusters among the 183 flat top-level docs:

| Topic | Docs | Examples of the overlap |
|---|---:|---|
| **Ofertas Locales** | **33** | `OFERTAS_PACKAGE_3` … `_14`, with **5 separate `PACKAGE_13_*`** (`QA_CONTROL_CENTER`, `REAL_QA_RUNBOOK`, `REAL_QA_DATA_CONTRACT`, `ENVIRONMENT_QA_MATRIX`, `MIGRATION_EXECUTION_MATRIX`, `HISTORICAL_AUDIT_GOVERNANCE`) and **5 `PACKAGE_14_*`** all describing the same QA cycle |
| **Restaurantes** | **16** | `restaurantes-p0a` → `p0g` — **7 near-identical single-defect docs**, plus 3 more coupon/addon docs |
| **Admin** | **14** | `leonix-admin-command-center-master-audit` vs `leonix-admin-os-master-audit-02` — two "master audits" of the same system |
| **Magazine** | **12** | 6 of them DeepL-specific (`magazine-deepl-key-local-readiness`, `-pt-full-local-proof`, `-pt-single-page-smoke`, `-readiness-audit`, `magazine-pdf-deepl-compatibility-preflight`, `magazine-translation-platform-runbook`) |
| **Stripe** | **11** | `stripe-revenue-os-*` — 10 sequentially-numbered variants of one integration |
| **Revenue OS** | **10** | overlaps the Stripe set; `revenue-os-newsletter-promo-checkout-validation-01` **and** `-02` are the same subject |
| **Servicios** | 8 | `servicios-p0a`/`p0b`/`p0c` mirror the restaurantes `p0*` pattern |
| **Bienes** | 8 | 3 separate `bienes-child-…-media-…-fix` docs |
| **Entitlements** | 3 | `package-entitlement-model` · `print-package-entitlement-model` · `entitlement-redemption-attachment-model` — three models for one concept |
| **Promo codes** | 6 | `admin-promo-code-clarity-01` · `admin-promo-code-os-v2` · `promo-code-lifecycle-model` · `pricing-promo-code-sales-model` · `newsletter-promo-code-readiness` · `revenue-os-promo-admin-os-tracking-01` |
| **Translation** | 3 in `docs/` + **13 in `design-references/language/`** | `leonix-global-translation-plan` · `leonix-translation-architecture` · `global-es-en-translation-foundation` + a parallel 13-doc corpus in a different top-level directory |
| **Category matrix / route contract** | 4 | `gate-i5-7f-full-catalog-route-contract-matrix` · `BIENES_RAICES_FIELD_MATRIX` · `revenue-os-category-pipeline-matrix-and-checkpoint-standard-02` · `global-paid-category-pipeline-coverage-audit-and-gap-matrix-01` |

## B.3 THE NAMED DOCS REQUESTED — AND THEIR DATES

**There is no file named "Globalization Bible" or "Execution Bible" anywhere at `origin/main`.**
A filename search for `BIBLE` returns zero results. The closest functional equivalents:

| Role | Exact filename | Last-modified commit | Date |
|---|---|---|---|
| **Globalization closeout (final)** | `docs/globalization/package-f/F2_FINAL_FIX_BUILD_CLOSURE.md` | `18bc2b5b` | **2026-08-12** |
| Globalization — Admin closeout | `docs/globalization/package-e/E3_ADMIN_OS_GLOBAL_OPERATIONS_CLOSURE.md` | `1203eee7` | **2026-08-12** |
| Globalization — Dashboard closeout | `docs/globalization/package-e/E2_USER_DASHBOARD_GLOBAL_COMMAND_CENTER_CLOSURE.md` | — | 2026-08 |
| Globalization — Category adoption | `docs/globalization/package-d/D3_CATEGORY_ADOPTION_CLOSURE.md` | `dc597fd5` | **2026-08-11** |
| Globalization — Core unification | `docs/globalization/package-d/D2_GLOBAL_CORE_UNIFICATION_CLOSURE.md` | — | 2026-08 |
| **Migration certification** | `docs/globalization/package-c/C9_MIGRATION_CERTIFICATION_CLOSURE.md` | `a46be587` | **2026-08-11** |
| Revenue OS freeze | `docs/globalization/package-c/C1_REVENUE_OS_REFERENCE_FREEZE_AND_CATEGORY_DELTA_AUDIT.md` | — | 2026-08 |
| **Staging/traceability log** | `docs/globalization/G1_STAGING_MIGRATION_LOG.md` | `fc55a50f` | **2026-08-26** |
| **Execution contract** | `docs/qa/LEONIX_BUSINESS_APPLICATION_AND_FULL_CYCLE_EXECUTION_CONTRACT.md` | — | 2026-08 |
| **Ledger — business applications** | `docs/qa/BUSINESS_APPLICATION_FINAL_LIVE_LEDGER.md` | `2824069e` | **2026-08-28** |
| **Ledger — community** | `docs/community/FINAL_OWNER_LEDGER_AUDIT.md` | `a2977915` | **2026-08-28** |
| Ledger — shared | `docs/qa/ledger/00_shared.md` | — | 2026-08 |
| **Category/route matrix** | `docs/gate-i5-7f-full-catalog-route-contract-matrix.md` | `708c2546` | **2026-08-04** |
| Category pipeline matrix | `docs/global-paid-category-pipeline-coverage-audit-and-gap-matrix-01.md` | `cbef0a4f` | **2026-07-07** |
| BR field matrix | `docs/BIENES_RAICES_FIELD_MATRIX.md` | `9ec91362` | **2026-04-22** |
| BR source of truth | `docs/bienes-raices/BR_SYSTEM_SOURCE_OF_TRUTH.md` | `0cb85907` | **2026-04-22** |
| Admin master audit | `docs/leonix-admin-os-master-audit-02.md` | `14ade95c` | **2026-06-26** |
| Dashboard master audit | `docs/leonix-user-dashboard-command-center-master-audit.md` | `0dcab511` | **2026-06-25** |

## B.4 🔴 STALENESS SWEEP — **ALL 230 DOCS PREDATE THE SEPT WORK**

Mechanical result — `git log -1 --format=%ad --date=short origin/main -- <path>` over every one of
the 230 files under `docs/`:

| Bucket | Count |
|---|---:|
| last modified **before** 2026-09-08 | **230** |
| last modified **on or after** 2026-09-08 | **0** |

**Every single document in `docs/` is stale relative to the 2026-09-08/09 work.** The newest are
2026-08-28 (`FINAL_OWNER_LEDGER_AUDIT.md`, `BUSINESS_APPLICATION_FINAL_LIVE_LEDGER.md`); the
oldest load-bearing one is 2026-04-22. **58 of them carry `COMPLETE` / `CERTIFI*` / `100%` /
`CLOSED` in a heading.**

## B.5 🔴 STALE PROSE THE CURRENT SOURCE CONTRADICTS

Doc 17 documented 7 instances. This batch confirms the hazard and adds precise citations:

**1. `docs/globalization/package-f/F2_FINAL_FIX_BUILD_CLOSURE.md:35-40` — PARTIALLY VINDICATED, AND
IT CORRECTS DOC 17.** It claims the `/results` vs `/resultados` duplicate is "**FIXED + PROVEN**",
and **the source agrees**: `next.config.ts` now carries **14 permanent redirects**. Doc 17's claim
that servicios and restaurantes have "no redirect and no canonical" is therefore **itself stale** —
see doc 16 §4.2. But F2's own `:40` and `:130` admit **Viajes was left unfixed**, and it still is:
`app/(site)/clasificados/viajes/results/page.tsx` is a 1-line re-export of
`../resultados/page` with **no redirect rule and no canonical**. *A "final fix closure" doc whose
own escape clause is the only remaining defect.*

**2. `docs/globalization/package-c/C9_MIGRATION_CERTIFICATION_CLOSURE.md:23` — SUBSTANTIVELY
CORRECT, NUMERICALLY STALE.** It states `public.listings` *"has no `CREATE TABLE` anywhere in this
repo's **105** tracked migrations."* The claim is **still true today** (Part C.2) — but the count
is now **163**. The doc is right about the defect and wrong about the scale, and it is the *only*
place in the repository where this platform-critical fact is written down.

**3. `LEONIX_CATEGORY_DESIGN_SYSTEM.md` (2026-04-29) declares itself a source of truth for the
category design system**, while `app/(site)/clasificados/components/categoryStandardV2/README.md`
*also* declares "**Source of Truth**", and the V1 `categoryStandard/` package it supersedes still
ships with **10 orphaned files** (doc 16 §3.4). Three competing authorities for one system.

**4. `docs/site-page-blocks-foundation.md`** describes `app/lib/siteBlocks/` as a foundation.
That directory is a **closed 3-node dead cycle with zero external importers** (doc 16 §3.2).

**5. `docs/entitlement-redemption-attachment-model.md` + `docs/package-entitlement-model.md`**
describe `entitlementRedemption.ts` / `entitlementActivationContract.ts` as the entitlement
contract. **Both modules have 0 importers** (doc 16 §3.7).

**6. `docs/human-connection-router-architecture.md`** — `humanConnection/index.ts`,
`providers/googleMeetProvider.ts` and `FaceToFaceVideoCta.tsx` are all orphaned (doc 16 §3.9).

**7. The 6 `magazine-deepl-*` docs** describe DeepL translation as delivered.
`app/lib/translation/providers/deepl.ts` — the only DeepL implementation — is **unreachable**; the
live `/api/translate-ad` route imports `translation/provider.ts` instead (doc 16 §3.1).

**8. `app/lib/website-audit/CUPONES_LANDING_RESULTS_FINAL_POLISH_V1_AUDIT.md:24`** is the rare
*honest* one — it labels `CuponesPageClient.tsx` "(legacy, unused)", and the graph confirms it.

---

# PART C — MIGRATIONS · TESTS · SCRIPTS INVENTORY

## C.1 SUPABASE MIGRATIONS

`git ls-tree -r --name-only origin/main -- supabase/` → **164 paths = 163 migrations + `supabase/.temp`.**
`supabase/` has exactly two children: `migrations/` and `.temp/`. **There is no
`supabase/functions/`, `supabase/seed.sql`, or `supabase/config.toml` in the repo.**

### The 25 most recent migrations at `origin/main`

| # | Migration | System touched |
|---:|---|---|
| 1 | `20260909120000_business_ownership_claim_foundation.sql` | G-Business Ownership Claim |
| 2 | `20260827190000_leonix_endorsement_votes_comida_local_br_rentas_reconcile.sql` | G22 Endorsements |
| 3 | `20260827180000_leonix_professional_identities_br_rentas_community_trust.sql` | G-Community Trust / Identity |
| 4 | `20260827180000_leonix_newsletter_unsubscribe.sql` | G-Newsletter |
| 5 | `20260826130000_leonix_newsletter_verification_state.sql` | G-Newsletter |
| 6 | `20260826120000_leonix_endorsement_votes_comida_local.sql` | G22 Endorsements |
| 7 | `20260822120000_leo22c_response_feedback.sql` | G-Leo |
| 8 | `20260821140000_recursos_official_spanish_bridge.sql` | G-Recursos |
| 9 | `20260821090000_recursos_spanish_bridge_foundation.sql` | G-Recursos |
| 10 | `20260820120000_recursos_intake_os_schema.sql` | G-Recursos intake |
| 11 | `20260820120000_business_creative_opportunities_foundation.sql` | G-Business Concierge / Creative Studio |
| 12 | `20260820045236_iglesias_church_intake.sql` | G-Iglesias |
| 13 | `20260820010000_leo17a_connected_action_proposals.sql` | G-Leo |
| 14 | `20260819210000_leonix_endorsement_votes.sql` | G22 Endorsements |
| 15 | `20260819203513_iglesias_prayer_network.sql` | G-Iglesias |
| 16 | `20260819185941_iglesias_prayer.sql` | G-Iglesias |
| 17 | `20260819180000_leo_scheduled_watches_notifications.sql` | G-Leo |
| 18 | `20260819150000_saved_search_match_events_br_rentas.sql` | G-Saved Search (SS-06) |
| 19 | `20260819120000_leo14_executive_action_os.sql` | G-Leo |
| 20 | `20260819120000_iglesias_churches.sql` | G-Iglesias |
| 21 | `20260819120000_community_resource_candidate_reviews.sql` | G-Recursos |
| 22 | `20260819090000_saved_search_match_events_delivery.sql` | G-Saved Search (SS-05) |
| 23 | `20260818150000_community_resources.sql` | G-Recursos |
| 24 | `20260818120000_saved_search_match_events.sql` | G-Saved Search (SS-04) |
| 25 | `20260817120000_saved_searches_v1_reconcile.sql` | G-Saved Search (SS-01) |

**Concentration:** of the last 25, **6 are Leo**, **5 Recursos**, **4 Iglesias**, **4 Saved
Search**, **3 Endorsements**, **2 Newsletter**. No migration in the last 25 touches Autos, Bienes
Raíces, Rentas, Servicios, Restaurantes, Empleos, Ofertas or Revenue OS.

### 🔴 C.1.1 MIGRATIONS IN SEPT (`e3956df8`) BUT **NOT** IN `origin/main` — DEPLOYMENT RISK

`git diff --name-status origin/main e3956df8 -- supabase/`:

| Sept-only migration (status `A`) | System | Risk |
|---|---|---|
| **`20260901120000_ofertas_locales_address_privacy.sql`** | G24 Location Privacy | **KNOWN** — backs GAP-005. Ofertas leaks exact street address on main until applied |
| **`20260902120000_comida_local_google_yelp_reviews_url.sql`** | G-Comida Local trust | **NEW to this audit** |
| **`20260902120500_ofertas_locales_runtime_schema_reconciliation.sql`** | G-Ofertas runtime schema | **NEW** — a *reconciliation* migration; implies main's Ofertas schema is drifted |
| **`20260903090000_autos_leonix_ad_id_reconciliation.sql`** | G-Autos identity | **NEW** — reconciles `leonix_ad_id`; C9 already proved this trigger family has drifted from its migration |
| **`20260903150000_fix_parent_inventory_capacity_counting.sql`** | G-Capacity / parent-child | **NEW — HIGH.** A *fix* to capacity counting; C9 certified the capacity RPCs and found a `text = uuid` defect in this same area |
| **`20260909120000_service_role_dml_grants_global_fix.sql`** | G-Security / grants | **NEW — HIGH.** C9 §32 hit exactly this (`permission denied for table` for `service_role`) and applied the grant *only to the certification project, explicitly not to the frozen migration*. Sept turned it into a real migration; **main still lacks it** |

**5 of the 6 Sept-only migrations were previously unrecorded.** Four of them are named
*reconciliation* or *fix*, which means main's live schema is believed by the Sept branch to be
wrong in four places.

🔴 **TIMESTAMP COLLISION — MERGE HAZARD.** Sept's `20260909120000_service_role_dml_grants_global_fix.sql`
and main's `20260909120000_business_ownership_claim_foundation.sql` share the **identical
timestamp prefix `20260909120000`**. Supabase orders migrations lexicographically by that prefix;
two files with the same timestamp have **undefined relative order**. This must be resolved by
renaming one before any merge.

Conversely, `git diff` reports 6 migrations as `D` (present on main, absent from Sept):
`20260817120000_leo_living_book_foundation`, `20260819120000_leo14_executive_action_os`,
`20260819180000_leo_scheduled_watches_notifications`, `20260820010000_leo17a_connected_action_proposals`,
`20260822120000_leo22c_response_feedback`, `20260909120000_business_ownership_claim_foundation`.
These are **main-ahead** (Sept forked before them), not deletions.

## C.2 🔴 GAP-073 — **SETTLED. THERE IS GENUINELY NO MIGRATION CREATING `public.listings`.**

Searched exhaustively at `origin/main`:

```
git grep -n -iE "create table (if not exists )?(public\.)?listings\b" origin/main -- supabase/ scripts/ docs/
  → exactly ONE hit, and it is NOT a migration:
    scripts/c9-certification-schema-setup.sql:65  create table if not exists public.listings (
```

**Findings:**

1. **Zero of the 163 migrations create `public.listings`.** The only `CREATE TABLE` for it in the
   entire repository is in `scripts/c9-certification-schema-setup.sql:65` — a **certification
   fixture script**, not a migration, not run by any deploy path.
2. **The earliest migration that touches it is already an `ALTER`.**
   `supabase/migrations/20250311000001_listings_price_drop.sql:2` — the **second migration file in
   the repo's entire history** — opens with `ALTER TABLE listings ADD COLUMN IF NOT EXISTS …`.
   **The table therefore predates the repo's migration-tracking convention entirely.**
3. Every other `create table … listings` in `supabase/migrations/` is a **different** table:
   `servicios_public_listings`, `restaurantes_public_listings`, `autos_classifieds_listings`,
   `viajes_staged_listings`, `empleos_public_listings`, `comida_local_public_listings`,
   `user_saved_listings`, `user_liked_listings`, `saved_listings`. **None is `public.listings`.**
4. ~30 migrations `ALTER` / add policies to / index `public.listings` — including
   `20260421130001_listings_enable_rls_full_policies.sql`. **RLS is enabled on a table the
   migration chain cannot create.**

**VERDICT — CONFIRMED, WITH CONSEQUENCES:**
- A clean `supabase db reset` from `supabase/migrations/` alone **cannot succeed** — it fails at
  the second file. The migration chain is **not self-hosting** for the platform's most-used table.
- `public.listings` exists only in the live Supabase project, created outside version control.
- `C9_MIGRATION_CERTIFICATION_CLOSURE.md:23-28` independently documents this and adds a concrete
  drift proof: `20260506150000_leonix_ad_id_all_classifieds.sql` "*implies a differently-named,
  INSERT-only trigger than what the live snapshot actually shows (renamed, INSERT-OR-UPDATE, with
  a `WHEN` guard) — direct proof the migration history for this table no longer matches reality.*"
- The C9 doc is therefore the **only** written record of a P0-class infrastructure gap, buried in
  a closure document last touched 2026-08-11, and its own migration count (105) is now wrong.

**RECOMMENDED (NOT PERFORMED):** promote `scripts/c9-certification-schema-setup.sql`'s verbatim
`public.listings` definition into a real, timestamped baseline migration. **DO NOT DELETE NOW** —
that script is currently the only committed record of the production schema for this table.

## C.3 `e2e/` AND `scripts/`

| | Count |
|---|---:|
| `e2e/` | **33** |
| `scripts/` | **1,057** (1,017 flat + 6 subdirectories: `fixtures`, `magazine`, `package-c`, `recursos`, `sql`, `translation`) |
| scripts by extension | `.ts` 614 · `.mjs` 420 · `.mts` 8 · `.sql` 7 · `.js` 3 · `.md` 2 · `.json` 2 · `.cjs` 1 |
| **Files named `verify`/`verifier`/`audit`/`check`/`certif`** | **798** (all in `scripts/`; **0 in `e2e/`**) |
| keyword split | audit 413 · verify 374 · check 35 · certif 11 · verifier 6 |
| **Executable scripts referenced by NO npm script** | **469 of 1,037 (45 %)** |

### C.3.1 VERIFIER SCRIPTS — 60 MOST SIGNIFICANT (of 798), BY SYSTEM

`[STRING]` = asserts on source **text**, not behaviour (see C.3.2).

**AUTOS — 109 total**
1. `autos-a5-final-acceptance-live-completion-audit.ts` — Negocios+Privado live completion gate
2. `autos-a5-qa-01-business-hub-parity-audit.ts` — Business Hub parity `[STRING :113]`
3. `autos-a5-qa-05-full-recovery-final-audit.ts` — full recovery / final QA readiness
4. `autos-a5-recovery-20-added-inventory-real-listings-master-audit.ts` — added-inventory master
5. `autos-a5-recovery-10-field-parity-audit.ts` — child/parent field parity `[STRING :155]`
6. `autos-a5-qa-08a2-vehicle-only-inventory-drawer-audit.ts` — vehicle-only drawer `[STRING :143]`
7. `autos-a5-vdata-a-shared-vehicle-data-audit.ts` — shared vehicle data model `[STRING :141]`
8. `autos-a5-media-02-negocios-video-lightbox-audit.ts` — video lightbox `[STRING :61]`
9. `autos-landing-results-cross-nav-audit.ts` — landing/results cross-nav `[STRING :181-182]`
10. `autos-privado-dealers-public-split-audit.ts` — privado/dealer split `[STRING :56]`
11. `autos-phase-4-durable-video-audit.ts` — durable video gate `[STRING :87]`
12. `autos-final-war-room-closeout-audit.ts` — closeout roll-up
13. `autos-a5-ship-03r-production-ui-mismatch-vin-decode-audit.ts` — VIN decode `[STRING :132]`
14. `autos-a2-structured-vehicle-taxonomy-audit.ts` — vehicle taxonomy contract
15. `autos-a3-field-search-filter-sort-audit.ts` — field/search/filter/sort coverage
16. `autos-a4-0-dealer-inventory-sql-contract-audit.ts` — dealer inventory SQL contract

**RESTAURANTES — 28**
17. `restaurantes-r-c1-contact-hub-audit.ts` — Gate R-C1 contact hub `[STRING :130]`
18. `restaurantes-polish1-audit.ts` — public detail compression `[STRING :92]`
19. `verify-restaurantes-pending-publish-and-coupon-offers-truth-01.mjs` `[STRING :83,:90]`
20. `verify-restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01.mjs` `[STRING :83]`

**SERVICIOS — 38 (worst-affected system)**
21. `verify-servicios-shell-2.mjs` — public output truth `[STRING :38,:63,:67]`
22. `verify-servicios-shell-2b.mjs` — section order + coupon placement `[STRING :68,:74]`
23. `verify-servicios-shell-2d.mjs` — Restaurante blueprint lock `[STRING :51,:52,:68,:69,:70]`
24. `verify-servicios-preview-published-parity.mjs` — preview→results→published `[STRING :38]`
25. `verify-servicios-trade-render-parity.mjs` — trade render parity `[STRING :31,:60]`
26. `verify-servicios-dashboard-truth.mjs` — seller dashboard `[STRING :12 — PROVABLY RED]`
27. `verify-servicios-destacados-module.mjs` — destacados module `[STRING :58]`
28. `verify-servicios-print-digital-ranking.mjs` — Gate G2 ranking `[STRING :204-206]`
29. `verify-servicios-entitlement-overlay.mjs` — Gate G2A entitlement overlay
30. `verify-servicios-interaction-polish.mjs` — gallery/video embed `[STRING :47]`
31. `servicios-engagement-smoke.ts` — engagement analytics smoke `[STRING :52]`

**BIENES RAÍCES**
32. `br-inv-b-drawer-shell-audit.ts` — pre-publish inventory drawer `[STRING :45]`
33. `br-inv-fix-01b-durable-child-inventory-media-audit.ts` — child inventory media `[STRING :68]`
34. `br-draft-persist-01-audit.ts` — Agente draft+inventory persistence `[STRING :58]`
35. `bienes-final-publish-stripe-rotation-05-audit.ts` — launch-gate artifact validator
36. `verify-bienes-draft-hydration-media-lock-01.mjs` — draft hydration `[STRING :68]`
37. `bienes-child-future-child-parent-parity-final-09-audit.ts` — parent/child parity `[STRING :64]`

**RENTAS**
38. `verify-rentas-full-stacked-production-closure-01.mjs` — production closure `[STRING :91]`
39. `smoke-revenue-os-rentas-paid-publish-lockdown-01.mjs` — paid-publish lockdown `[STRING :65]`

**EMPLEOS**
40. `empleos-e3-master-paid-job-product-audit.ts` — Gate EMPLEOS-E3 master
41. `verify-empleos-simplification-qa-alignment.mjs` `[STRING :78]`
42. `verify-empleos-global-location-readiness.mjs` `[STRING :93]`

**ADMIN — 68**
43. `verify-admin-category-live-truth-style.mjs` `[STRING :133]`
44. `verify-package-e-e3-admin-os-global-operations.ts` — Admin OS consolidation `[STRING :46]`
45. `verify-dashboard-category-edit-hydration-01.mjs` `[STRING :39]`
46. `audit-admin-language.mjs` — admin UI language coverage
47. `admin-verifier-suite-triage-and-repair` family — meta-audit of the verifier suite itself

**REVENUE / STRIPE — 45**
48. `verify-publish-checkout-checkpoint-standard-01.mjs` `[STRING :78]`
49. `verify-revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.mjs` `[STRING :157]`
50. `verify-revenue-os-promo-redemption-business-attribution-01.mjs` `[STRING :34]`
51. `verify-final-monetization-visibility-stack.mjs` `[STRING :33,:34,:54,:57,:76]`
52. `verify-website-launch-25-checkout-wiring.mjs` — checkout/redemption wiring `[:343]`
53. `verify-launch-25-public-placements.mjs` `[STRING :42,:45]`
54. `gate-pkgC-event-ledger-idempotency-selftest.ts` — Stripe event-ledger idempotency

**GLOBALIZATION — 30**
55. `run-all-gates.ts` — aggregate runner (see C.3.4)
56. `verify-globalization-business-hub-trust-03.ts` `[STRING :53,:80,:81,:89,:90]`
57. `verify-globalization-final-closeout-05.ts` — final closeout certification
58. `gate-2c-community-contact-uri-selftest.ts` — canonical contact URI `[STRING :90]`
59. `gate-2d-community-owner-qa-debt-selftest.ts` — owner-QA debt `[STRING :250]`

**COMMUNITY / OFERTAS / LEO / OTHER**
60. `final-community-family-certification.ts` `[STRING :44]` · `community-owner-ledger-final-audit.ts`
    · `ofertas-release-gate-audit.mjs` · `ofertas-locales-gate-k-two-lane-final-verifier.ts` ·
    `ofertas-locales-offer-hub-audit.ts` `[STRING :226 — PROVABLY RED]` ·
    `verify-ofertas-product-discovery-item-drawer.mjs` `[STRING :310,:405,:503]` ·
    `verify-leo-11-universal-tool-bus.ts` `[STRING :50,:51,:56]` ·
    `verify-sales-business-workspace-01.ts` `[STRING :669,:691,:743,:746]` ·
    `program6-creative-studio-verifier.ts` `[STRING :861]` ·
    `website-cat-std-1-category-landing-results-audit.ts` `[STRING :116]` ·
    `iglesias-prayer-network-build-03-selftest.ts` · `en-venta-gate-2p-final-repo-completion-audit.ts`
    · `digital-contact-human-connection-13-assert.ts` `[STRING :58,:87,:123,:125]`

*(60 shown of **798** name-matching files.)*

### C.3.2 🔴 STRING-ASSERTING VERIFIERS — **836 SCRIPTS, NOT 4**

The task sheet named 5 confirmed instances. **The real number is 836.** This is not an exception —
**it is the dominant verification style in the repository.**

| Metric | Count |
|---|---:|
| **Scripts that read a source file and assert on its TEXT** | **836** (835 in `scripts/`, 1 in `e2e/`: `e2e/servicios-auth-smoke.spec.ts`) |
| …of those, also verifier-named | 699 |
| `readFileSync`/`readFile` call sites | 1,649 across 863 files |
| `.includes("PascalCaseSymbol")` assertion lines | 1,591 across 427 files |
| `assert.match(src, /regex/)` lines | 2,010 across 164 files |
| regex `.test(src)` | 425 files |
| `.indexOf(src…)` | 172 files |
| Scripts asserting against `.md` **audit docs** | **66** |
| Scripts string-reading `.tsx` files | 702 |
| Distinct PascalCase symbols asserted | 949 (357 component-shaped) |
| **…component symbols with NO importer anywhere** | **91** |
| **Scripts asserting an orphaned component name** | **85** |
| Distinct orphaned components "verified" this way | **24** |

**`e2e/` is essentially clean** — only 2 of 33 specs read source text. **All of the hazard lives in
`scripts/`.**

**All five task-sheet instances confirmed**, plus the full population. Top confirmed false greens
(path:line — symbol):

| # | Path:line | Asserted symbol | Class |
|---:|---|---|---|
| 1 | `verify-servicios-shell-2d.mjs:51` | `ServiciosHubReviewLinkButton` | orphan |
| 2 | `verify-servicios-shell-2d.mjs:68,69,70` | `ServiciosOpcionesFacilidadesCard`, `ServiciosPagosCard`, `ServiciosHighlightsSection` | orphan |
| 3 | `verify-servicios-shell-2.mjs:38` | `ServiciosMediaLightbox` | orphan |
| 4 | `verify-servicios-destacados-module.mjs:58` | `ServiciosDestacadosSection` | orphan |
| 5 | `verify-final-monetization-visibility-stack.mjs:33,34,54,57` | `ServiciosDestacadosSection`, `RestaurantesDestacadosSection` | orphan |
| 6 | `restaurantes-r-c1-contact-hub-audit.ts:130` | `RestaurantHubReviewLinkButton` | orphan |
| 7 | `restaurantes-polish1-audit.ts:92` | `RestaurantHubReviewLinkButton` | orphan |
| 8 | `autos-a5-qa-01-business-hub-parity-audit.ts:113` | `AutosNegociosBusinessHubFauxMap` | orphan |
| 9 | `autos-a5-qa-08a2-…:143` / `autos-a5-vdata-a-…:141` | `AutosInventoryVehicleDrawerForm` | orphan |
| 10 | `autos-a5-recovery-10-field-parity-audit.ts:155` | `AutosInventoryChildSteppedShell` | orphan |
| 11 | `autos-landing-results-cross-nav-audit.ts:181,182` | `AutosLaneCrossNav` | orphan |
| 12 | `autos-privado-dealers-public-split-audit.ts:56` | `DealersDeAutosHubCategoryCard` | orphan |
| 13 | `website-cat-std-1-category-landing-results-audit.ts:116` | `CategoryStandardResultsFilterPanel` | orphan |
| 14 | `final-community-family-certification.ts:44`, `gate-2c-…:90`, `gate-2d-…:250` | `EmailContactOptionsSheet` | orphan ×3 |
| 15 | `verify-launch-25-public-placements.mjs:42,45`, `verify-launch-25-opportunity-surfaces.mjs:58` | `LeonixLaunchCouponCard` | orphan ×3 |
| 16 | `verify-empleos-simplification-qa-alignment.mjs:78` | `JobFairLandingBanner` | orphan |
| 17 | `verify-restaurantes-pending-publish-…:83,90` + `…checkout-remove-ofertas-…:83` | `RestauranteOfertasLocalesCheckoutSecondaryCard` / `…UpsellCard` | orphan |
| 18 | `ofertas-locales-stack-c-clickable-item-preview-audit.ts:100,141` | `OfertasLocalesClickableItemPreviewPanel` | orphan |
| 19 | `ofertas-locales-stack-4-asset-audit.ts:116` | `OfertasLocalesPreviewAssetCards` | orphan |
| 20 | `verify-ofertas-product-discovery-item-drawer.mjs:405` | `OfertasFutureShoppingListCard` | orphan |
| 21 | `digital-contact-human-connection-12-assert.ts:96`, `-13:58`, `-13a:79` | `FaceToFaceVideoCta` | orphan ×3 |
| 22 | `verify-globalization-business-hub-trust-03.ts:53,80,81,89,90` | reads files as strings | — |
| 23 | `verify-leo-11-universal-tool-bus.ts:50,51,56` | `leoToolService`/`leoToolAdapters`/`leoAdminCapabilitiesAdapter` **files** | dead cluster |
| 24 | `verify-servicios-shell-2d.mjs:52` | `HubDivider` — **exists nowhere**; negative guard → vacuously true forever | phantom |
| 25 | `verify-sales-business-workspace-01.ts:669,691,743,746` | workspace symbols | — |

**Worked proof #1 — `AutosNegociosBusinessHubFauxMap`.** Its only *code* reference is its own
definition at `…/autos/negocios/components/AutosNegociosBusinessHubFauxMap.tsx:10`. Every other
occurrence is prose in 4 `.md` audit files. Yet `autos-a5-qa-01-business-hub-parity-audit.ts:113`
asserts it against `DealerBusinessStack.tsx` **and passes** — because the name survives there only
as text.

**Worked proof #2 — `ServiciosHubReviewLinkButton`.** Three hits in `app/`: its own definition; a
**comment** at `ServiciosBusinessHubContactCard.tsx:630`; a doc-comment at
`SharedConnectionHubReviewButton.tsx:14`. `verify-servicios-shell-2d.mjs:51` reads
`ServiciosBusinessHubContactCard.tsx` and matches the **comment**. The real renderer was replaced
by `SharedConnectionHubReviewButton`. **Textbook false green.**

**🔴 TWO PROVABLY-RED GATES (assert a symbol that exists ONLY inside the gate itself):**
- `scripts/verify-servicios-dashboard-truth.mjs:12` —
  `assert(dash.includes("ServiciosListingMetricsPills"), "dashboard: per-listing metrics")`.
  `ServiciosListingMetricsPills` appears in **exactly one file repo-wide: this script.**
  npm entry `verify:servicios-dashboard-truth` exists. **It can only throw ⇒ it is never run.**
- `scripts/ofertas-locales-offer-hub-audit.ts:226` —
  `assert.ok(preview.includes("EmailContactRow"), "preview: email row")`. Same shape.
  npm entry `ofertas-locales:offer-hub-audit`.

**🔴 SECOND-ORDER HAZARD — 66 GATES CERTIFY MARKDOWN PROSE.** Examples:
`restaurantes-r-c1-contact-hub-audit.ts:110-113` asserts `md.includes("Gate R-C1")` and
`md.includes("| Requirement | TRUE/FALSE | Evidence |")`;
`autos-a5-qa-01-business-hub-parity-audit.ts:84` asserts `md.includes(\`| ${row} |\`)`;
`varios-p4f-desktop-detail-layout-repair-audit.ts:58` asserts `line?.includes("| TRUE |")`.
**These prove only that someone typed "TRUE" into a markdown table.** This is why the 446 in-tree
`.md` files (§A.7) are load-bearing for CI.

**🔴 THIRD-ORDER HAZARD — SELF-REFERENTIAL PACKAGE CHECKS.**
`restaurantes-r-c1-contact-hub-audit.ts:134` asserts
`pkg.includes('"restaurantes:r-c1-contact-hub-audit"')` — **the gate asserts that it is itself
registered in `package.json`.**

### C.3.3 `e2e/` — THE ENTIRE BEHAVIOURAL SUITE (33 files)

`autos/` 10 (7 recovery/polish specs + `autos-go-live-smoke` + `autos-manual-qa-seed` +
`manual-qa-sample-content.ts`) · `community/` 5 · `empleos/` 4 (incl. a committed
`manual-qa-seed-output.json`) · `bienes-raices/` 2 · `rentas/` 2 · en-venta 5 (flat) ·
`restaurantes-smoke` · `servicios-smoke` · `servicios-auth-smoke` · `viajes-runtime-qa` ·
`leonix-dashboard-admin-smoke`.

> **33 behavioural specs against 4,700 app files and 836 text-asserting gates.**

### C.3.4 `npm` SCRIPTS — `git show origin/main:package.json`

| Class | Count | Share |
|---|---:|---:|
| **VERIFIER / AUDIT** | **592** | **97.0 %** |
| **BUILD / DEV / TEST** | **15** | 2.5 % |
| **OTHER** (seed/data helpers) | 3 | 0.5 % |
| **TOTAL** | **610** | |

**The complete BUILD/DEV/TEST list (all 15):**

| Script | Command | Class |
|---|---|---|
| `dev` | `next dev` | DEV |
| `build` | `node scripts/next-build.js` | BUILD |
| `start` | `next start` | BUILD |
| `typecheck` | `tsc --noEmit` | BUILD |
| `lint` | `eslint "app/(site)/clasificados/autos/**" … --max-warnings 0` | BUILD ⚠ **autos-scoped only** |
| `lint:br` | `eslint "app/(site)/clasificados/bienes-raices/**" …` | BUILD ⚠ scoped |
| `lint:servicios` | `eslint "app/(site)/clasificados/servicios/**" "e2e/**/*.ts" …` | BUILD ⚠ scoped |
| `test:program7` | `npx tsx scripts/program7-business-concierge-tests.ts` | TEST |
| `test:gates` | `tsx scripts/run-all-gates.ts` | TEST |
| `autos:a5-recovery-25-browser-proof` … `-30-browser-proof` (6) | `npx playwright test -c playwright.autos-recovery-NN.config.mjs` | TEST |
| `autos:a5-polish-32-browser-proof` | `npx playwright test -c playwright.autos-polish-32.config.mjs` | TEST |

**OTHER (3):** `seed:owner-admin-auth` (`node scripts/seed-owner-admin-auth.mjs`),
`autos:a5-yellow-to-green-dashboard-analytics`, and one further seed/data helper.

Namespace distribution of all 610: `verify:` 272 · `autos:` 110 · `ofertas-locales:` 69 ·
`smoke:` 29 · `varios:` 24 · `comida-local:` 20 · `br:` 15 · `enventa:` 12 · `restaurantes:` 12 ·
`website:` 11 · unnamespaced 6 · `bienes:` 5 · `seed:` 4 · `audit:`/`i18n:` 3 each ·
`lint`/`test` 2 each · 11 singletons.
Runner shapes: 57× `npx tsx` · 22× `npx playwright` · 8× `npm run` · remainder direct
`node scripts/*.mjs` / `tsx scripts/*.ts`.

**🔴 THE AGGREGATE GATE RUNNER COVERS < 2 % OF THE GATES.** `test:gates` →
`scripts/run-all-gates.ts`, which globs only `/^gate-.*-selftest\.ts$/`. **Only 5 such files
exist.** The script's own header states it was written to cover "60 at the time of writing".
There is no aggregate runner for the other ~787 verifiers.

**🔴 LINTING IS SCOPED TO 3 OF ~18 CATEGORIES**, and `next.config.ts` sets
`eslint: { ignoreDuringBuilds: true }` with the comment *"TEMPORARY: allow build even if ESLint
fails (we will turn this back on later)."* (`typescript.ignoreBuildErrors` is correctly `false`.)

---

## D. FUTURE ARCHIVE CANDIDATES (IDENTIFIED ONLY — NOTHING ARCHIVED)

Ranked by risk-to-archive, lowest first. **EVERY ITEM: DO NOT DELETE NOW.**

| Tier | Items | Rationale |
|---|---|---|
| **1 — zero behavioural risk** | 9 root build/log artifacts · `_MANIFEST/` · `README.txt` · `tmp/` · 6 `.backup`/`.bak`/`page_temp` files · the 4-deep `app/data/classifieds/…` nest · `e2e/empleos/manual-qa-seed-output.json` | generated output, unreferenced by construction |
| **2 — near-zero** | 396 QA screenshot PNGs · 9 unwired `playwright.*.config.mjs` · 469 npm-unreferenced scripts | large, generated, wired to nothing |
| **3 — low, after a redirect audit** | 7 dead-behind-redirect route files (doc 16 §4.2) · `app/(site)/cupones/CuponesPageClient.tsx` + `app/components/CouponCard.tsx` · `app/data/*.ts` fixtures · `pages/` | unreachable, but inbound links must be checked first |
| **4 — needs owner decision** | ~394 orphan modules (doc 16) · `categoryStandard/` V1 subset · `autos/landing`, `servicios/landing` · Leo tool bus · `app/lib/translation/providers/` · `entitlement*` modules · `app/lib/businessAddress/*` | may be built-ahead rather than abandoned; several are revenue- or security-adjacent |
| **5 — must NOT archive; must be REWRITTEN instead** | all 230 `docs/` files · the 446 in-tree `.md` files · `AGENTS.md` | 100 % stale, but 66 gates assert against them — archiving breaks CI before it fixes anything |
| **6 — must NOT archive; must be PROMOTED** | `scripts/c9-certification-schema-setup.sql` | the only committed record of the `public.listings` production schema (C.2) |

---

## APPENDIX — PROPOSAL ONLY, NOT PERFORMED

> ⚠ **NOTHING BELOW HAS BEEN DONE.** No file was moved, renamed, deleted or reorganized in this
> batch. This is a sketch for a future, owner-approved effort — recorded here so the analysis is
> not lost, **not** an instruction and **not** a change.

**A proposed future layout (NOT PERFORMED):**

```
/                       ← config only: package.json, next.config.ts, tsconfig.json,
                          eslint.config.mjs, postcss.config.mjs, middleware.ts, README.md
/config/playwright/     ← the 16 one-off playwright configs (canonical one stays at root)
/docs/architecture/     ← the 6 misplaced root LEONIX_*/AGENTS/COMUNIDAD_* docs
/docs/audits/<system>/  ← the 446 .md files currently inside app/
/docs/archive/<date>/   ← superseded closure docs, once rewritten rather than deleted
/artifacts/             ← .gitignore'd; qa-*-screenshots, build logs, _MANIFEST, tmp
/supabase/migrations/   ← + a NEW baseline migration creating public.listings (C.2)
```

**A proposed sequence (NOT PERFORMED):** (1) `.gitignore` the generated artifacts and stop
committing them; (2) add the `public.listings` baseline migration so `db reset` works;
(3) rename one of the two colliding `20260909120000_*` migrations **before** any Sept merge;
(4) replace string assertions with behavioural checks **before** archiving any orphan, so a false
green does not become a false green on a missing file; (5) move the 446 in-tree `.md` files only
after the 66 doc-asserting gates are rewritten; (6) rewrite `AGENTS.md`, which has been stale
since 2026-03-31, first — every future automation session reads it.

---

**END OF DOCUMENT — READ-ONLY AUDIT. NOTHING WAS MOVED, RENAMED, DELETED OR REORGANIZED.
DO NOT DELETE NOW.**
