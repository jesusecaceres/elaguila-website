# 00 — EXECUTIVE CERTIFICATION
**Leonix Global LLC — Definitive Forensic Audit**
Audit date: 2026-09-09 · Mode: **READ-ONLY** · Source / DB / main / production: **NOT MODIFIED**

---

## 0. AUDIT INTEGRITY STATEMENT

This audit performed **no** application source edits, migrations, test edits, package edits, merges,
rebases, cherry-picks, resets, stashes, pushes, PRs, deploys, Vercel changes, Supabase changes,
production changes, or main modifications. Only read-only git commands and file reads were used.
The only writes are the audit documents in this directory.

### 0.1 COVERAGE — **100%, ALL 9 BATCHES COMPLETE**

> **STATUS: COMPLETE.** An earlier run of this audit was truncated by an API rate limit at 14:50 PT,
> which terminated 9 of 19 research streams. **That gap has since been closed.** The audit was resumed
> in nine sequential small batches (max 3 concurrent agents) and every remaining stream finished.
>
> | Measure | Result |
> |---|---|
> | Global systems mapped | **53 / 53** |
> | Category-lanes audited | **22 / 22** |
> | Required reports created | **23 / 23** (+13 supporting detail documents) |
> | Research batches completed | **9 / 9** |
> | Category × system cells classified | **394** |
> | Gaps logged, each with an exact path and action | **106 open + 1 closed** |
>
> The coverage table that previously stood here is superseded. See
> `AUDIT_COVERAGE_AND_REMAINING_WORK.md` for the per-batch record, and §0.2 below for the one
> limitation that remains.

### 0.2 THE ONE REMAINING LIMITATION — NO DATABASE ACCESS

**This audit executed no runtime, no browser, no Stripe transaction, and no database query.** The
Supabase MCP server requires authorization and this session was non-interactive throughout. Every
finding is **source-level**, and every `TRUE` is therefore also `OWNER_QA_REQUIRED`.

**Five P0s are contingent on a live check, and each needs exactly one query** — GAP-088, GAP-089,
GAP-090, GAP-080, GAP-099. They are listed with their exact queries in
`22_FINAL_RECONCILIATION_PLAN.md §2`. **Authorize the Supabase connector and run those five before
acting on GAP-088.**

### 0.3 WHAT CHANGED SINCE THE FIRST DRAFT OF THIS DOCUMENT
Seven findings were **corrected or retracted** by later evidence. This is recorded rather than
quietly overwritten:
| Item | Correction |
|---|---|
| "`leonix_admin=1` = full admin" | **RETRACTED** — 51 of 82 routes genuinely re-verify. See §4 |
| "the bootstrap token is forgeable" | **RETRACTED as obsolete** — `94bd78c2` is in main; it is real HMAC-SHA256 |
| GAP-050 Comida Local media contract | **REFUTED** — it does import the contract |
| GAP-016 servicios/restaurantes duplicate routes | **CORRECTED twice** — fixed on main; read from the stale tree |
| Doc `01 §5 R9` three autos branches | **CORRECTED** — already captured; ancestry was a false negative |
| Doc `01 §5 R11` nine feeder branches | **CLOSED** — 11/11 proven already captured |
| GAP-001 remediation class | **UPGRADED** — the fix already exists at `adminAuthBoundary.ts:44-46` |

| Audit stream | Status | Confidence |
|---|---|---|
| Repository / worktree / branch inventory | ✅ COMPLETE | HIGH |
| Commit archaeology 2026-07-14 → now | ✅ COMPLETE | HIGH |
| Revenue OS / Stripe / Promo / Entitlements | ✅ COMPLETE | HIGH |
| **Category Registry Consistency Matrix** | ✅ COMPLETE | HIGH |
| Analytics (G27) | ✅ COMPLETE | HIGH |
| Ofertas Locales commerce + lifecycle pipeline | ✅ COMPLETE | HIGH |
| Admin API privileged-write / auth guard sweep | ✅ COMPLETE | HIGH |
| Business Hub (G30) | ✅ COMPLETE | HIGH |
| Search/Results (G28) — servicios, restaurantes, comida-local, negocios-locales | ✅ COMPLETE | HIGH |
| Search/Results (G28) — bienes-raices, rentas | ✅ COMPLETE | HIGH |
| Admin OS full capability matrix | ⚠️ PARTIAL (killed) | LOW |
| Bienes / Rentas full-cycle + G41 parent-child | ❌ INCOMPLETE (killed) | — |
| Autos / Empleos full-cycle + G40 parent-child | ❌ INCOMPLETE (killed) | — |
| Servicios / Restaurantes / Comida full-cycle round-trip | ❌ INCOMPLETE (killed) | — |
| Community lanes + Viajes + Newsletter + PWA + SEO | ❌ INCOMPLETE (killed) | — |
| User Dashboard / Owner Command Center (G47) | ❌ INCOMPLETE (killed) | — |
| Saved Search (G25) scheduler question | ⚠️ PARTIAL (killed) | LOW |
| Community Trust / Google-Yelp / Address (G20–G24) | ⚠️ PARTIAL (killed) | LOW |
| Media / Flyer / PDF (G09–G11) | ⚠️ PARTIAL (killed) | LOW |
| CTA / Connection Hub (G16) | ⚠️ PARTIAL (killed) | LOW |
| Orphan / duplicate / repo-organization sweep | ❌ NOT RUN (concurrency limit) | — |

**Therefore this audit does NOT claim** "53/53 systems certified", "all category × system cells have
a status", or "every category has READY FOR CHUY QA TRUE/FALSE". Those completion-gate items are
**NOT MET**. What it does deliver is a set of **hard, source-proven, exactly-located defects** —
several of which outrank the seed defect the Owner asked about — plus a complete map of where the
unintegrated work lives. See `AUDIT_COVERAGE_AND_REMAINING_WORK.md` for the exact remaining scope.

---

## 1. THE HEADLINE

> **The September Globalization seal is real, verified, and correct — and it is NOT in production.**

`fix/globalization-final-closeout-2026-09` @ `e3956df8` is **51 commits ahead of, and 62 behind,
`origin/main`**. Every one of its fixes — including **two P0 data-destruction repairs** — is absent
from the branch that ships. Meanwhile `origin/main`'s 62 unique commits are an entirely disjoint
LEO / Business-Concierge build-out that **touches 0 of the same files**.

**The two lines of work do not conflict. The merge is mechanically clean. It simply was never done.**

That single fact is the largest finding in this audit and the cause of the majority of the P0/P1
defects listed below.

---

## 2. VERIFIED BASELINE

| Coordinate | Value | Verified |
|---|---|---|
| Primary checkout | `C:\projects\elaguila-website` | ✅ |
| Primary checkout HEAD (`main`) | `d09d979c` | ✅ **111 commits BEHIND origin/main** |
| `origin/main` at audit start | `2dcf5c70d84d823bdf729fd0b3a32b3eb011ab37` | ✅ |
| `origin/main` at audit end | `056a1486346d02604de8134891ad438484fbf319` | ✅ **moved mid-audit** |
| Sealed Sept Globalization | `e3956df893f5041ca22371c999038f297d536eae` | ✅ local == remote, tree CLEAN |
| Sept ahead / behind origin/main | **51 / 62** | ✅ |
| Merge base | `7878d856` (2026-09-08) | ✅ |
| Historical Globalization closeout `6b155cf3` | Build 05, 2026-08-19 | ✅ in main AND Sept |
| Known Build 03 `390b939c` | 2026-08-19 | ✅ in main AND Sept |
| Commits since 2026-07-14, all refs | **614** (Jul 113 · Aug 414 · Sep 88) | ✅ |
| Commits unreachable from origin/main | **132** across 11 branches | ✅ |
| Local branches | 79 (**30 not in origin/main**, **26 never pushed**) | ✅ |
| Worktrees / disk folders | 39 registered / 38 `elaguila-website*` + 1 recovery | ✅ |
| Reverts in window | **0** (one false-positive keyword match) | ✅ |

All 8 claimed Sept commits verified present in the sealed head. All 12 supplied historical SHAs
validated; `a6ab8410` is a superseded twin of `cbad30f4`.

---

## 3. THE SEED DEFECT — VERDICT: **CONFIRMED, BUT THE OWNER'S DIAGNOSIS IS WRONG**

**Claim tested:** `PACKAGE_ENTITLEMENT_CATEGORIES` omits `ofertas-locales`, and *that* is why an
Admin-generated Ofertas promo fails checkout eligibility.

**The omission is REAL and confirmed identical on `main`, `origin/main` (both `2dcf5c70` and
`056a1486`), and `e3956df8`:**
```
app/admin/_lib/packageEntitlementConstants.ts:12
export const PACKAGE_ENTITLEMENT_CATEGORIES = [
  servicios · restaurantes · autos · bienes-raices · rentas
] as const;                       // last modified 2026-07-07 (d8bf9a6c)
```
It IS aliased into promo: `app/admin/_lib/promoCodeConstants.ts:17`
`PROMO_CODE_CATEGORIES = PACKAGE_ENTITLEMENT_CATEGORIES`.

### 3.1 BUT — for Ofertas + promo, this is **INTENTIONAL_NA**, not the cause

Both Ofertas packages are declared **`promoEligible: false`** in the canonical matrix:
- `app/lib/listingPlans/revenuePricingMatrix.ts:334` — `ofertas_locales_flyer_30d` ($399)
- `app/lib/listingPlans/revenuePricingMatrix.ts:351` — `ofertas_locales_coupons_30d` ($199)

Promo validation short-circuits on **package key**, before it ever reads category scope:
```
app/lib/listingPlans/promoCodeRules.ts:103-108
if (packageKey && !isPromoEligiblePackageKey(packageKey)) return { eligible: false, ... }
```
**Adding `ofertas-locales` to `PACKAGE_ENTITLEMENT_CATEGORIES` would change nothing at checkout.**
The category-scope check at `promoCodeRules.ts:139-141` is unreachable for Ofertas.

### 3.2 The omission's REAL victims are four OTHER categories

Categories with ≥1 genuinely `promoEligible: true` package that **cannot** be given a category-scoped
promo from Admin:

| Category | Promo-eligible package | Price | Matrix line |
|---|---|---|---|
| **comida-local** | `comida_local_base_monthly` | $129/mo | `revenuePricingMatrix.ts:287,295` |
| **empleos** | `empleos_job_post_paid` | $24.99 | `:307,316` |
| **clases** | `clases_paid_30d` | $24.99 | `:393,401` |
| **viajes** | `viajes_business_monthly` | $399/mo | `:478,486` |

Inconsistent *within the same Admin form*: `PROMO_CODE_PACKAGE_SCOPE_OPTIONS`
(`promoCodeConstants.ts:31-40`) IS matrix-derived and DOES list these packages — so an admin can
scope by *package* but not by *category*.

### 3.3 The entitlement half is WORSE than described — a second, server-enforced copy

```
app/admin/(dashboard)/workspace/package-entitlements/actions.ts:39
const ALLOWED_CATEGORIES = new Set(["servicios","restaurantes","autos","bienes-raices","rentas"]);
                                                        // enforced at :101-104, redirect invalid_category
```
This is a **hard server-side block**, not a dropdown — unposted-form-bypassable, unlike promo.
An operator **cannot manually grant or track a package entitlement** for `ofertas-locales` or
`comida-local`, both of which are **live paid Stripe products**.
Compounded by `PACKAGE_ENTITLEMENT_LISTING_SOURCES` (`packageEntitlementConstants.ts:20-25`) having
no ofertas or comida-local source — so the two constants must be fixed **together**.
*Mitigation:* the complimentary/partner grant path in the same file (`:583,:591`) IS matrix-driven
and category-agnostic, and automated webhook fulfillment never touches this file.

### 3.4 The 5-item list is copy-pasted VERBATIM into FIVE files

| # | Path:line | Symbol |
|---|---|---|
| 1 | `app/admin/_lib/packageEntitlementConstants.ts:12` | `PACKAGE_ENTITLEMENT_CATEGORIES` |
| 2 | `app/admin/_lib/promoCodeConstants.ts:17` | `PROMO_CODE_CATEGORIES` (alias of 1) |
| 3 | `app/admin/(dashboard)/workspace/package-entitlements/actions.ts:39` | `ALLOWED_CATEGORIES` (server-enforced) |
| 4 | `app/lib/listingPlans/packageEntitlements.ts:65` | `PACKAGE_ENTITLEMENT_V1_CATEGORIES` |
| 5 | `app/lib/listingPlans/printDigitalVisibilityRank.ts:59` | `PRINT_DIGITAL_V1_CATEGORIES` |

**Fixing `packageEntitlementConstants.ts` alone fixes 2 of 5. There is no single source of truth.**

### 3.5 SEED DEFECT VERDICT

| Question | Verdict |
|---|---|
| Is the omission real? | **TRUE** — confirmed on all three refs |
| Can Admin create an ofertas-scoped promo? | **FALSE** via UI (dropdown); the *server action* has **no allowlist at all** (`promo-codes/actions.ts:80,:210`) and would accept a hand-posted value |
| Does Ofertas checkout reject the promo? | **TRUE — always**, via `promoEligible:false`, **not** via this list |
| Is this list the root cause for Ofertas? | **FALSE** — `INTENTIONAL_NA` for promo |
| Is the list a real defect elsewhere? | **TRUE — HIGH**: 4 categories for promo, 2 live paid categories for entitlement grants |

**Root cause:** `app/lib/listingPlans/revenuePricingMatrix.ts:334,:351` (`promoEligible:false`) —
plus five duplicated registries.
**Action:** OWNER_POLICY_DECISION (should Ofertas accept promos at all?) + ADOPT_EXISTING_ENGINE
(make all five registries derive from `REVENUE_V1_PACKAGE_MATRIX`).

### 3.6 BONUS DEFECT FOUND AT THE SAME SPOT — P1, owner-visible today

`app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx` renders a **fully wired, permanently
dead promo-code field** — copy at `:51-54`, state `:119-123`, submit `:172-193`, passed to checkout
`:208`. **No code that exists or could ever exist will succeed in that field.** Every attempt returns
"Este código promocional no es válido para este pago." This is exactly the symptom the Owner has been
chasing — and its cause is the pricing matrix, not the admin constant.

---

## 4. DEFECTS THAT OUTRANK THE SEED DEFECT

### 🔴 P0-01 — ADMIN PRIVILEGE ESCALATION VIA STAFF PROVISIONING
> **REVISED after an adversarial re-audit. The Owner's challenge to the original blanket claim was
> substantially correct.** Two claims are **RETRACTED**; a genuine P0 was found on a path the first
> pass missed. Full evidence: `09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md`.

**RETRACTED (1):** "curl -H 'Cookie: leonix_admin=1' = full admin" as a blanket statement.
**51 of 82 admin route files genuinely re-verify identity downstream.**
`app/admin/_lib/businessWorkspaceAccess.ts:106-168` `requireSalesWorkspaceAccess` is **fail-closed
and sound** — live Supabase Auth Admin API lookup, roster-by-`auth_user_id`, double email match.
**RETRACTED (2) as OBSOLETE:** "the bootstrap token is forgeable." `94bd78c2` **is in `origin/main`**;
the token is a real HMAC-SHA256, constant-time compared, expiring, failing closed without the secret.
Both `/admin/login` paths require a real password step.

**THE P0 THAT SURVIVES — and it is worse, because it defeats the strong guard by satisfying it:**
```
app/admin/teamProvisioningActions.ts:41   createStaffUserWithAuthAction
  :42  requireLeonixAdminCookie()                      ← coarse gate only
  :35  if (access.rosterResolved && access.rosterRole !== "super_admin") { ...deny... }
```
With a bare forged cookie, `getCurrentAdminAccessContext` returns `rosterResolved: false`, so the
`&&` **short-circuits and the super-admin check is skipped entirely.** Execution reaches
`provisionStaffAuthUser` (`:65`), creating a **real Supabase Auth user + roster row with an
attacker-chosen role and temporary_password.** The attacker then logs in normally at
`/admin/login/auth` and satisfies all 7 steps of `requireSalesWorkspaceAccess` **legitimately**.
The strong guard is never broken — it is satisfied with credentials minted through the weak one.
**All 51 "protected" routes fall.**

**SMALLEST FIX:** `teamProvisioningActions.ts:35` — require an *affirmatively resolved* `super_admin`
roster row instead of skipping the check when `rosterResolved` is false. **One line.**

**MIDDLEWARE VERDICT (the prior EVIDENCE GAP, now closed):** `middleware.ts:37-42` gates `/admin`
**only** by a string compare on `leonix_admin`, importing nothing from `adminSession.ts` or
`businessWorkspaceAccess.ts`; `:79` fires only on `pathname.startsWith("/admin")`, so
**`/api/admin/**` and `/api/revenue-os/admin/**` are never gated by middleware at all.**
Middleware confirms rather than invalidates the finding.

**TWO FURTHER CONFIRMED P0s:**
- `app/api/admin/revenue-os/manual-payments/route.ts:25` — **both** guards are no-ops
  (`leonixAdminGate.ts:45-47` returns early; the access context at `:48` is attribution-only, never
  branched on). `record → verify_cleared → manualClearedPayments.ts:143 activateEntitlementsForPayment`.
  **Cookie → paid entitlement.**
- `grantComplimentary` — reachable on the coarse gate alone.

**COUNTS:** 82 admin API route files — **51** strongly re-verified · **31 files / 33 handlers
(23 mutating, 10 read)** on the coarse gate alone · **0** with no auth reference.
**HIGH (not P0):** `app/api/admin/leads/**` — `adminLeadExportAuth.ts:6-12` is a literal cookie
passthrough; 8 handlers, 4 of which dump the full lead / newsletter-subscriber DB as CSV.
`adminAccessControl.ts` fails open to `owner_admin` on 4 branches, and `owner_admin` gets **no row
scoping**. `ADMIN_ENFORCE_ROSTER_PERMISSIONS` is **deliberately OFF** and set nowhere in the repo —
three internal audit docs already record this as a known deferred P0.

### 🔴 P0-02 — TWO DASHBOARD-EDIT DATA-DESTRUCTION BUGS ARE LIVE IN PRODUCTION
Sept commits `733408dd` (Bienes Negocio) and `67919479` (Rentas Negocio) — "stop dashboard-edit from
destroying published listings" — are **Sept-only**. `git merge-base --is-ancestor 733408dd origin/main`
→ **false**. **Production `main` today still destroys those listings on dashboard edit.**

### 🔴 P0-03 — COMIDA LOCAL $129/mo SUBSCRIPTION CAN NEVER BE SUSPENDED
`app/lib/listingPlans/subscriptionLifecyclePolicy.ts:139` `LANE_SUSPENSION` has only 4 lanes
(restaurantes, servicios, autos, bienes-raices). `comida_local_base_monthly` is a live
`monthly_subscription` with a fulfillment writer and a base-entitlement guard — but **no suspension
lane**, so non-payment **never unpublishes the listing**. Revenue leak, indefinite.
`git log -S'"comida-local": {' origin/main` → **empty**: it never existed on main.
The lane **exists on `e3956df8`** (added by `8b867eaf`) and was never merged.

### 🔴 P0-04 — CLIENT-TRUSTED ANALYTICS OWNER ATTRIBUTION
`app/lib/clasificadosAnalytics.ts:170,:175` writes `owner_user_id` **straight from the browser** via
the anon client, bypassing `/api/analytics/events` entirely. Any client can attribute engagement to
an arbitrary owner. The canonical resolver explicitly forbids this
(`app/lib/analytics/server/resolveListingAnalyticsIdentity.ts:2` — "never trust client
owner_user_id"), yet the legacy engine sits under the **shared Leonix Save/Like/Share buttons**
(15 importers) — i.e. on nearly every category's hot path.

### 🟠 P1-05 — OFERTAS LEAKS EXACT STREET ADDRESS PUBLICLY
Sept `cddc34fa` "persist Ofertas address privacy" (13 files + migration
`20260901120000_ofertas_locales_address_privacy.sql`) is **Sept-only**. On `origin/main`,
`show_exact_address` **does not exist for Ofertas** — exact street address and an auto-derived Google
Maps directions query are emitted **unconditionally** on every public Ofertas surface
(`ofertasLocalesPublicOfferHelpers.ts:137,:150-155`; `ofertasLocalesPublicSearchHelpers.ts:280-292`).

### 🟠 P1-06 — ONE-TIME PAID LANES LOST THEIR ANTI-DOUBLE-CHARGE GUARD
`app/lib/listingPlans/revenueActiveEntitlementGuard.ts:64-70` guards only 5 monthly-subscription
package keys. Sept has `app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts` + 3 call sites
guarding `autos_privado_30d`, `br_fsbo_45d`, `empleos_job_post_paid`. **That file does not exist on
`origin/main`.** A customer can be charged twice for the same live row.

### 🟠 P1-07 — VIAJES: CHARGE-WITHOUT-FULFILLMENT
`viajes_business_monthly` ($399/mo, `stripeEligible:true`) passes **every** checkout validator and
would open a real Stripe subscription, but has **no** checkout payload const, **no** return path,
**no** suspension lane, and **no fulfillment writer**. The publish checkpoint advertises "$399/mo" and
"coupon eligible" (`categoryPublishCheckpoints.ts:786,:819`). *Reachability caveat: no client was
found that constructs this call — proven at route level, not end-user level.*

### 🟠 P1-08 — SELF-ENGAGEMENT PREVENTION IS UI-ONLY
`/api/analytics/events` never compares `authenticatedUserId` to `identity.ownerUserId`;
`isSelfEngagement` lives only in button components. A direct POST records owner self-engagement
freely. Sept `3eacdec9` closed 4 specific gaps (Rentas self-save/self-like, self-report via both
implementations) — **all 4 confirmed still live on `origin/main`**.

### 🟠 P1-09 — MEDIA/ANALYTICS SILENT LOSSES & DEAD METRICS
Six event kinds — `checkout_start`, `checkout_success`, `payment_success`, `translate`,
`gallery_open`, `video_play` — **do not exist as event types at all**; no category can emit them.
`listing_impression` is read by 4 aggregators and **emitted by nobody**. Three categories
(**mascotas-y-perdidos, viajes, negocios-locales**) emit **zero analytics**.

### 🟡 P2-10 — DEALER/AGENT PARENT ROW EATS A PAID CAPACITY SLOT
Sept's `inventory_role` capacity anchoring in `commercialWriteGuard.ts` (Gate 6C.2) is absent from
main; the parent row is counted as inventory, so dealers/agents silently lose one paid slot.

---

## 5. THE BUSINESS HUB VERDICT (G30) — THE ENGINE WAS NEVER BUILT

The prior September audit's suspicion is **confirmed and worse than claimed**. The "Global Business
Hub OS" is a **contract plus two leaf primitives**, not an engine.

- `docs/global-business-hub/ADOPTION_PLAYBOOK.md:55-58` states `FullBusinessHubCard.tsx` and
  `ListingContactCard.tsx` **were not built** — confirmed absent from the tree.
- **`buildSharedConnectionHubContact`** (`sharedConnectionHubContactModel.ts:81`) — the one shared
  model the whole program was built around — has **ZERO app importers**. It is referenced only by
  docs and verifier scripts. **It is test-only code.**
- 11 of 13 exported shared types have zero app consumers.
- The only shared renderer actually adopted is `SharedConnectionHubReviewButton` (3 adopters).

**Every category ships its own complete, independent hub.** Verified duplicates:
5 parallel contact-model implementations · 4 review-button implementations (2 orphaned) ·
4 faux-map implementations (1 orphaned) · **7 independent copies of the Google Maps `output=embed`
formula** · 4 social-brand icon engines · byte-identical design tokens under two prefixes
(`RCH_*` / `SCH_*`) · and a whole-component fork (`DealerBusinessStack.tsx` 504 lines vs
`PreviewDealerBusinessStack.tsx` 793 lines — **the public vehicle page renders the *Preview* one**).

Confirmed orphans (zero importers, proven by exhaustive grep): `ServiciosHubReviewLinkButton`,
`RestaurantHubReviewLinkButton`, `AutosNegociosBusinessHubFauxMap`, `OfertasLocalesBusinessHubLiteCard`,
`ListingView` (default export dead; only its types survive), `BusinessListingIdentityRail`
(transitively), `buildFullPreviewListingData`, `RestauranteDetailShell` (+ a committed `.backup` file).

**Viajes' business hub 404s in production** — `viajes/negocio/[slug]/page.tsx:42` calls `notFound()`
unless a demo flag is set, and its data source is sample data.

---

## 6. SEARCH / RESULTS VERDICT (G28) — THE `categoryStandardV2` CLAIM

| Category | Landing V2 | Results V2 | Notes |
|---|---|---|---|
| servicios | **TRUE** | **FALSE** | bespoke shell |
| restaurantes | **TRUE** | **TRUE** | the only full V2 results adopter |
| comida-local | **FALSE** | **FALSE** | **has no results route at all** — landing IS results |
| bienes-raices | partial (1 leaf card) | **FALSE** | bespoke `BienesRaicesResultsShell` |
| rentas | partial (1 leaf card) | **FALSE** | bespoke `RentasResultsShell` |
| negocios-locales | **FALSE** | **FALSE** | static hub, no data source at all |

**The September claim is CONFIRMED for results, and REFUTED for landing** (both do consume one V2
leaf card, `ImageDiscoveryCard`).

### 6.1 Cross-cutting search defects proven
- **Payment/entitlement visibility gate: ABSENT in all six surfaces.** Entitlements only reorder.
  Most exposed: comida-local *selects* `payment_status` (`comidaLocalPublicQueries.ts:26`) and
  **never uses it** — an unpaid published row is publicly visible.
- **Expiration gate: ABSENT everywhere except rentas.** BR has no `expires_at` reference anywhere in
  its tree — a BR listing published once stays visible forever. comida-local's `expires_at` exists and
  is read by admin/dashboard but **deliberately omitted from the public select**.
- **Rentas has the opposite bug:** `expirationRequired: true` means a rentas row with
  `expires_at = NULL` is **silently invisible** in results *and* detail.
- **Route-slug chaos:** BR canonicalizes `/results` → `/resultados` (permanent redirect,
  `next.config.ts:86-88`). Rentas canonicalizes the **opposite** (`/results`), and
  `/clasificados/rentas/resultados` is a **hard 404 with no redirect**. Servicios and Restaurantes
  serve the **same page at both URLs with no redirect and no canonical tag** — a duplicate-content
  SEO defect.
- **BR pagination ceiling bug:** DB `limit: 80` with client-side paging means row 81+ is
  **unreachable**, and displayed totals are totals of the 80-row window, not the table.
- **BR has 19 dead filter keys** parsed from the URL and never applied (`colonia` + 18 booleans).
- **BR `recencyRank` / rentas `recencyRank`**: rentas' is a lossy `% 100` day bucket
  (`mapListingRowToRentasPublicListing.ts:572`) that **wraps every ~100 days** — "most recent" is not
  reliably chronological.
- **Restaurantes ships up to 2000 rows to the browser** and filters client-side; its placement
  ranking is computed and then **discarded by any explicit user sort**
  (`filterRestaurantesBlueprintRows.ts:194-216` sorts the flat list with no bucket preservation) —
  unlike Servicios, which sorts *within* placement buckets. **Paid placement is lost on user sort.**
- **Restaurantes' missing-image fallback is a hot-linked Unsplash stock photo**
  (`restaurantesPublicListingMapper.ts:103-104`); BR's is too (`mapBrListingRowToCard.ts:145`).
  Rentas correctly uses a local `/logo.png`.
- **Restaurantes injects `priceLevel ?? "$$"`** (`restaurantesPublicListingMapper.ts:131`) — a listing
  with no declared price silently displays and matches as `$$`.

---

## 7. SEPT SEAL vs `origin/main` — THE RECONCILIATION IS CLEAN

| Measure | Value |
|---|---|
| Sept-only commits | **51** |
| main-only commits | **62** |
| Files touched by Sept-only | 264 |
| Files touched by main-only | 436 |
| **INTERSECTION (conflict surface)** | **0 files** — verified two independent ways |

The 62 main-only commits are a single self-contained **LEO Admin / Executive-Intelligence +
Business-Concierge** build-out that never touches the business-listing surfaces Sept modified.

**⚠ BUT there is a THIRD line of work that DOES conflict.**
`fix/br-negocio-inventory-hub-media-hydration-2026-08-27` — **32 commits, 92 files, pushed,
2026-08-27/28, in neither main nor Sept** — carries substantial BR/Rentas work including data-loss
fixes (`b3d85dc1` draft-media hydration reload loss, `5d3f27cf` inherited parent hub in inventory
child, `42d68aa8` multi-video + custom highlights through publish, `0d80e891` production build
repair). It shares a **20-file conflict surface with the Sept seal**, including the exact files the
Wave 4 P0 reverse-mapper fixes touched
(`mapAgenteResidencialFormStateToNegocioForPublish.ts`, `rentasDashboardEditHydration.ts`).
Its conflict surface with main-only work is **0 files**.

**Merge order matters.** A naive three-way merge will conflict on the P0 reverse mappers.

---

## 8. UNINTEGRATED WORK AT RISK — RANKED

| # | Location | Risk | Content |
|---|---|---|---|
| R1 | `fix/globalization-final-closeout-2026-09` (51 commits, pushed) | Not in prod | Entire Wave 1–4 program incl. 2× P0 |
| R2 | `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` (32, pushed) | Not in prod + **conflicts with R1** | BR/Rentas feature + data-loss fixes |
| **R3** | `elaguila-website-leo-final` — **NEVER PUSHED** | 🔴 **HIGHEST LOSS RISK** | 3 commits + 15 untracked files incl. `leoGmailWriteAdapter.ts`, `leoCalendarWriteAdapter.ts`, and **an uncommitted Supabase migration** `20260819223000_leo_final02_connected_action_truth.sql` — one `git clean` from permanent loss |
| R4 | `qa/community-final-owner-qa-2026-08` @ `a0a47839` — **UNPUSHED** | High | 113-file landing-imagery commit made **at 12:15 during this audit**; no upstream |
| R5 | `integration/viajes-launch-qa-2026-08` — **NEVER PUSHED** | High | 1 commit + 46 modified/8 untracked = a near-complete Viajes rebuild existing only on disk |
| R6 | `globalization-release-reconcile-2026-08-14` (5, pushed) | Medium | Revenue OS free Viajes/Cupones catalog — directly relevant to the pricing contradiction in §9 |
| R7 | `feature/digital-contact-platform` (6, pushed) | Medium | Digital Contact / Executive Hub v1, 59 files |
| R8 | `fix/business-applications-final-polish-2026-08` (4, pushed) | Low | 3 unique beyond the superseded `a6ab8410` |
| R9 | 3× autos micro-branches (1 local-only) | Low | SEO JSON-LD, analytics strip, dealer address |
| R10 | 5 single-commit branches | Low | ofertas pre-payment checkout, servicios QA, ad-branding, etc. |
| R11 | 9 `global-*` feeder branches | **EVIDENCE GAP** | Probably captured downstream — **not proven**. Do not delete. |

---

## 9. A CONTRADICTION THE OWNER MUST RESOLVE — OFERTAS COUPON PRICE

Two sources of truth disagree, in-tree, today:

| Source | Says |
|---|---|
| `app/lib/listingPlans/revenuePricingMatrix.ts:346,:354` | `priceCents: 19900`, `stripeEligible: true` |
| `app/lib/ofertas-locales/ofertasLocalesConstants.ts:22-23,:152` | `PRICE_CENTS = 0`, "Cupones is a free product (locked)", `displayPriceUsd: 0` |
| `app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts:357-363` | returns `{ source: "free" }` — never reaches Stripe |
| `app/lib/listingPlans/revenueFulfillment.ts:225-226` | "the free coupon lane never reaches Stripe at all" |

The unintegrated branch `globalization-release-reconcile-2026-08-14` (`8fef4d26` "make community
coupons free", `c0912a71` "label free Viajes/Cupones as free, not paid") appears to be the intended
resolution — and it was never merged. **OWNER_POLICY_DECISION required.**

Related: `app/lib/listingPlans/revenueStripe.ts:117` hardcodes `aiIncluded: true` for the entire
`ofertas-locales` category while `ofertasLocalesCommercial.ts:52` declares coupons `aiIncluded: false`;
`revenueFulfillment.ts:1299` hard-rejects any ofertas session whose `metadata.aiIncluded !== true`.
A coupon session would only pass because of the category-wide hardcode.

---

## 10. WHAT IS GENUINELY HEALTHY — DO NOT REBUILD THESE

Proven correct and matrix-driven (no category registry in the path, so they cannot drift):
- **Stripe webhook signature verification** — `revenueWebhook.ts:178-206`
- **Two-layer idempotency / replay protection** on `leonix_stripe_webhook_events` —
  `stripeEventLedger.ts:56-128` (sequential replay skips; concurrent replay: exactly one delivery wins)
- **Checkout-attempt race guard** — `checkout/route.ts:664-687` never mints a second payable session
- **Promo redemption recorded only after webhook**, never on Apply — `revenuePromoValidation.ts:52`
- **Stripe mode + recurring consent derivation** — purely `billingMode`-driven
- **The canonical analytics server pipeline** — server-forced owner/category identity, metadata
  sanitization, dedupe windows; DB CHECK (33 event types) matches the TS union exactly
- **`businessWorkspaceAccess` admin guard chain** (`:106-168`) — fail-closed, ~46 handlers
- **Servicios analytics mirror** (`serviciosListingAnalyticsMirror.ts:59-76`) — the **reference
  pattern** for converging an ops silo into `listing_analytics` without double-counting

---

## 11. FINAL DECISION

| Question | Answer |
|---|---|
| 53 GLOBAL SYSTEMS AUDITED | **53 / 53** |
| ALL CATEGORY/LANES AUDITED | **YES — 22 / 22** |
| ALL REQUIRED REPORTS CREATED | **YES — 23 / 23** |
| GLOBALIZATION CORE RECOVERED | **TRUE** — located, verified, sealed, clean, at `e3956df8` |
| GLOBALIZATION CORE IN PRODUCTION | **FALSE** — 51 commits unmerged, including 2× P0 |
| ALL CATEGORY ADOPTION PROVEN | **FALSE** — 99 FALSE cells, each with a named gap and action |
| MAIN ↔ SEPT RECONCILIATION SAFE | **TRUE** — 0-file conflict surface |
| THIRD-BRANCH RECONCILIATION SAFE | **FALSE** — 20-file conflict with Sept; needs deliberate ordering |
| MERGE BLOCKED BY | **GAP-100** — migration timestamp collision. Rename first |
| READY TO BEGIN BROAD CATEGORY QA | **FALSE** — 3 categories ready now, 6 with a named stop, 15 not |
| SOURCE MODIFIED | **NO** |
| DATABASE MODIFIED | **NO** |
| MAIN MODIFIED | **NO** |
| PRODUCTION MODIFIED | **NO** |

### 11.0 THE ONE-SENTENCE CONCLUSION
**Only 2 of 53 systems were never built, and 4 more are built but route-unreachable — so this is an
integration problem far more than an engineering problem, and for a majority of the 106 logged gaps a
working implementation already exists in-tree and is simply not wired.**

### 11.1 THE ORDER OF OPERATIONS

1. **P0 — Secure the never-pushed work.** Commit/push `elaguila-website-leo-final` (esp. the
   uncommitted migration), `-viajes`, and `a0a47839`. *Owner decision; this audit wrote nothing.*
2. **P0 — Fix admin auth.** Route every admin guard through `businessWorkspaceAccess`.
   Nothing else in Admin is trustworthy until this lands.
3. **P0 — Merge the Sept seal into main.** 0-file conflict; recovers both P0 dashboard-edit fixes,
   the Comida Local suspension lane, the one-time-lane recharge guards, Ofertas address privacy,
   the G26 self-engagement fixes, and G23 address-verifier adoption.
4. **P1 — Then reconcile `fix/br-negocio-...-2026-08-27`**, resolving the 20 conflict files with
   Sept-seal semantics winning on the reverse mappers.
5. **P1 — Fix `main` being 111 behind** in the primary checkout before any Owner QA
   (`git pull --ff-only`) — otherwise QA tests stale code.
6. **P1 — Collapse the five duplicated category registries** onto `REVENUE_V1_PACKAGE_MATRIX`.
7. **P2 — Decide the Ofertas promo + coupon-price policy** (§3.5, §9), then hide or enable the
   dead promo field.
8. **Then, and only then, resume the incomplete audit streams** (§0.1) before declaring QA readiness.

---

**No file moves were performed. No cleanup was performed. Nothing was deleted.**
