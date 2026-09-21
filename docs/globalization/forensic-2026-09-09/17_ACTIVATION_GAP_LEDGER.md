# 17 — ACTIVATION GAP LEDGER
Audit 2026-09-09 · Every defect proven against `origin/main` (`2dcf5c70` → `056a1486`) vs Sept seal `e3956df8`.
Severity: P0 data loss / wrong owner / security / payment corruption · P1 broken required behavior ·
P2 missing capability · P3 polish · P4 owner acceptance only.

---

## GAP-001 · P0 · ADMIN PRIVILEGE ESCALATION VIA STAFF PROVISIONING
> **REVISED 2026-09-09 after an adversarial re-audit.** Full evidence:
> `09A_ADMIN_AUTH_ADVERSARIAL_REAUDIT.md`. Two earlier claims are **RETRACTED** — see §RETRACTIONS.

| Field | Value |
|---|---|
| SYSTEM | G48 Admin OS · G53 Security |
| SURFACE | Admin server action |
| REQUIREMENT | Staff provisioning must require an affirmatively resolved super-admin identity |
| GLOBAL ENGINE EXISTS | **YES** — `app/admin/_lib/businessWorkspaceAccess.ts:106-168` `requireSalesWorkspaceAccess` is genuinely **fail-closed and sound**: live Supabase Auth Admin API lookup, roster-by-`auth_user_id`, double email match. It protects 51 of 82 admin route files |
| **EXACT FALSE (the proven P0)** | `app/admin/teamProvisioningActions.ts:41` `createStaffUserWithAuthAction`. `:42` calls `requireLeonixAdminCookie()` — the coarse gate only. `:35` guards the role as `if (access.rosterResolved && access.rosterRole !== "super_admin")`. With a bare forged cookie, `getCurrentAdminAccessContext` returns `rosterResolved: false`, so the `&&` **short-circuits and the super_admin check is skipped entirely**. Execution reaches `provisionStaffAuthUser` (`:65`), creating a **real Supabase Auth user + roster row with an attacker-chosen role AND temporary_password.** |
| WHY IT DEFEATS THE STRONG GUARD | The attacker then logs in normally at `/admin/login/auth` and thereby satisfies all 7 steps of `requireSalesWorkspaceAccess` **legitimately**. The strong guard is never broken — it is satisfied with credentials minted through the weak one. **All 51 "protected" routes fall.** |
| MIDDLEWARE VERDICT | `middleware.ts:37-42` gates `/admin` **only** by `cookies.get("leonix_admin")?.value !== "1"` — a string compare against a public constant, importing nothing from `adminSession.ts` or `businessWorkspaceAccess.ts`. `:79` `handleAdminRequest` fires only on `pathname.startsWith("/admin")`, so **`/api/admin/**` and `/api/revenue-os/admin/**` are never gated by middleware at all**. `:19-25,:87` whitelist `/api/ofertas-locales/*`. Middleware **confirms** rather than invalidates the finding |
| SECOND CONFIRMED P0 | `app/api/admin/revenue-os/manual-payments/route.ts:25` — **both** guards are no-ops. `requireLeonixAdminPermission` returns early at `leonixAdminGate.ts:45-47` (enforce flag off), and the `getCurrentAdminAccessContext` at `:48` is attribution-only, never branched on. `record → verify_cleared → manualClearedPayments.ts:143 activateEntitlementsForPayment`. **Cookie → paid entitlement.** |
| THIRD CONFIRMED P0 | `grantComplimentary` (same monetization workspace action family) — matrix-driven and category-agnostic, reachable on the coarse gate alone |
| CURRENT MAIN / SEPT | FALSE / FALSE (Sept does not address this) |
| **SMALLEST FIX THAT COLLAPSES THE P0** | `app/admin/teamProvisioningActions.ts:35` — require an **affirmatively resolved** `super_admin` roster row instead of skipping the check when `rosterResolved` is false. **One line removes the identity-minting bridge.** |
| REQUIRED ACTION | **FIX_REGRESSION** |
| SAFE TO IMPLEMENT | YES · OWNER POLICY: NO · EXTERNAL: NO |
| BLOCKS OWNER QA | **YES — for all Admin QA** |
| QA AFTER FIX | With only a forged `leonix_admin=1` cookie, confirm `createStaffUserWithAuthAction` refuses, and that manual-payments `verify_cleared` refuses |

### COUNTS (mechanical — 82 admin API route files enumerated at `origin/main`)
| Posture | Files |
|---|---|
| Strong downstream re-verification (`requireSalesWorkspaceAccess` / `requireStaffWorkspaceWriteAccess`) | **51** — all `app/api/admin/businesses/**` + 3 field-discovery |
| **Coarse gate ALONE** | **31 files → 33 handlers = 23 MUTATING, 10 READ** |
| No auth reference at all | **0** |
| Server actions | 5 monetization workspace files (12 exports) on `requireAdminCookie` + fail-open context; **1 unguarded export** (`confirmOfficialSpanishCore`) |

### RETRACTIONS — the Owner's challenge was substantially correct
1. **RETRACTED: "curl -H 'Cookie: leonix_admin=1' = full admin" (as a blanket claim).**
   **51 of 82 route files genuinely re-verify identity downstream**, exactly as
   `app/lib/supabase/server.ts:58-69` documents. The coarse gate is a real compatibility gate, not
   the authority boundary, for those 51.
2. **RETRACTED as OBSOLETE: "the bootstrap token is forgeable."** `94bd78c2` **is in `origin/main`**;
   the bootstrap token is a real **HMAC-SHA256, constant-time compared, expiring, and fails closed
   without the secret**. Both `/admin/login` paths require a real password step.
   `94bd78c2` explicitly left `leonix_admin` unsigned, reasoning it "was never the actual authority
   boundary" — **true for the 51, false for the 31.**

### REMAINING CONFIRMED DEFECTS FROM THE RE-AUDIT
| ID | Finding | Sev |
|---|---|---|
| A | `createStaffUserWithAuthAction` escalation (above) | **P0 — NEW** |
| B | `manual-payments` → entitlement minting | **P0** |
| C | `grantComplimentary` on the coarse gate | **P0 — NEW** |
| D | `app/api/admin/leads/**` — `adminLeadExportAuth.ts:6-12` is a literal `requireAdminCookie` passthrough; **8 handlers, 4 of which dump the full lead / newsletter-subscriber DB as CSV** | HIGH |
| E | `adminAccessControl.ts` fails open to `owner_admin` on 4 branches (`:193,:209,:234,:271`); `owner_admin` gets **no row scoping** (`:153-160` returns null) → all promo codes + entitlements. Perverse: the **minimal** forgery yields **maximal** privilege — adding a forged email risks a *scoped* role | HIGH |
| F | `leonixAdminGate.ts:45-47` `if (!enforce \|\| !email) return;` — **default posture OFF, deliberately.** W5 audit doc: "DEFERRED_INTENTIONAL / Default: shared-password cookie only"; E3: "not changed (locked) … REQUIRES OWNER QA"; F2 lists it still open as P0-6. **Nothing in the repo sets `ADMIN_ENFORCE_ROSTER_PERMISSIONS`.** ~28 call sites degrade to cookie-only | HIGH |
| G | 23 mutating handlers on the coarse gate alone | HIGH |
| H | `confirmOfficialSpanishCore` (`app/admin/recursosTranslationActions.ts:178-223`, write at `:213`) — the **only** export in that file lacking the gate its 6 siblings call on line 1. Next 15.5.7 registers every export of a `"use server"` module as an action, so registration is real. **EVIDENCE GAP** on action-id discoverability: no client component imports it, and confirming requires a build artifact (`.next/`) not in the repo | MEDIUM |
| I | `submitListingReportAction` — **RECLASSIFIED from P1 to MEDIUM.** It is **public by design** (imported by 4 `"use client"` public pages), not an admin bypass. Real defects remain: spoofable client-supplied `reporterId` + unauthenticated unbounded service-role insert with no rate limit | MEDIUM |

---

## GAP-002 · P0 · TWO DASHBOARD-EDIT DATA-DESTRUCTION BUGS LIVE IN PRODUCTION
| Field | Value |
|---|---|
| SYSTEM | G08 Save/Edit/Republish · G41 Bienes Parent/Child · G42 Rentas Commercial · G47 Dashboard |
| CATEGORY / LANE | Bienes Raíces **negocio**; Rentas **negocio** · Dashboard Active Edit → Republish |
| REQUIREMENT | Dashboard edit must not destroy fields absent from the edit mapper |
| GLOBAL ENGINE EXISTS | **YES — built and sealed** |
| BEST IMPLEMENTATION | `fix/globalization-final-closeout-2026-09` @ `733408dd` (Bienes), `67919479` (Rentas), ledger `16f45c77` — "reverse mappers" |
| CURRENT MAIN | **FALSE** — `git merge-base --is-ancestor 733408dd origin/main` → **false** |
| SEPT GLOBALIZATION | **TRUE** |
| EXACT FALSE | Production `main` today destroys published Bienes Negocio and Rentas Negocio listings on dashboard edit |
| ROOT CAUSE | Sept seal never merged (51 commits unmerged; 0-file conflict surface with main) |
| REQUIRED ACTION | **RECONCILE_MAIN_AND_GLOBALIZATION** |
| SAFE TO IMPLEMENT | YES — merge is mechanically clean vs main |
| BLOCKS OWNER QA | **YES** for Bienes Negocio and Rentas Negocio |
| QA AFTER FIX | Publish a full Negocio listing → dashboard edit one field → republish → verify **every** other field survives on the same row |

**⚠ Do NOT merge `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` first** — it conflicts with
these exact files (doc 01 §5 R2).

**OPEN — NOT AUDITED:** whether Bienes **Privado**, Rentas **Privado**, Autos Dealer/Privado, Empleos,
Servicios, Restaurantes, Comida Local and the generic community lanes share the same partial-mapper
shape. Those agent streams were killed. **This is the single highest-value remaining audit task.**

---

## GAP-003 · P0 · COMIDA LOCAL $129/mo SUBSCRIPTION CAN NEVER BE SUSPENDED
| Field | Value |
|---|---|
| SYSTEM | G33 Subscription Lifecycle · G31 Revenue OS |
| CATEGORY | comida-local |
| REQUIREMENT | Non-payment on a monthly subscription must suspend/unpublish the listing |
| GLOBAL ENGINE EXISTS | YES — `app/lib/listingPlans/subscriptionLifecyclePolicy.ts` `LANE_SUSPENSION` |
| EXACT FALSE | `subscriptionLifecyclePolicy.ts:139` contains only 4 lanes: restaurantes, servicios, autos, bienes-raices. `comida_local_base_monthly` (`revenuePricingMatrix.ts:287-298`, $129/mo, `monthly_subscription`, `stripeEligible`, has a fulfillment writer and is in the base-entitlement guard) has **no suspension lane** → `applyPaymentSuspension`/`reconcileSubscriptionRow` can never suspend it |
| CURRENT MAIN | **FALSE** — `git log -S'"comida-local": {' origin/main` → **empty**; it never existed on main |
| SEPT GLOBALIZATION | **TRUE** — added by `8b867eaf` "close global revenue lifecycle gaps" |
| CONSEQUENCE | A non-paying Comida Local business stays publicly live **indefinitely.** Direct revenue leak |
| REQUIRED ACTION | **RECONCILE_MAIN_AND_GLOBALIZATION** |
| BLOCKS OWNER QA | YES for Comida Local billing |
| QA AFTER FIX | Simulate `invoice.payment_failed` → grace → suspension; verify the listing leaves public results |

Companions in the same Sept diff (all absent from main): `categoryAdPlans.ts` Comida Local plan
(`comida_local_paid_business`) and `categoryListingMonetization.ts` pipeline classification —
without them Comida Local listings resolve to `unknown_from_row`.

---

## GAP-004 · P0 · CLIENT-TRUSTED ANALYTICS OWNER ATTRIBUTION
| Field | Value |
|---|---|
| SYSTEM | G27 Analytics · G01 Identity/Ownership |
| CATEGORY | ALL (shared Leonix Save/Like/Share buttons) |
| REQUIREMENT | Owner attribution on an engagement event must be resolved server-side |
| GLOBAL ENGINE EXISTS | **YES** — `app/api/analytics/events/route.ts` + `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts:92-313` (header `:2` — "never trust client owner_user_id") |
| EXACT FALSE | `app/lib/clasificadosAnalytics.ts:170,:175` — `supabase.from("listing_analytics").insert(payload)` **direct from the browser with the anon client**, `owner_user_id` client-supplied, no `source_table`/`source_id`/`canonical_ad_id`. **15 importers**, incl. `LeonixSaveButton.tsx:6`, `LeonixLikeButton.tsx`, `LeonixShareButton.tsx`, `LeonixEngagementBar.tsx`, `ContactActions.tsx` |
| SECOND INSTANCE | `app/lib/listingAnalytics.ts:26` `trackEvent` — same pattern, 3 importers, writes no identity columns at all |
| CURRENT MAIN / SEPT | FALSE / FALSE |
| CONSEQUENCE | Any client can attribute engagement to an arbitrary owner; rows are invisible to canonical identity reads; server dedupe bypassed |
| REQUIRED ACTION | **ADOPT_EXISTING_ENGINE** — repoint the shared buttons at `listingEngagementRecorder`. Reference pattern already in-tree: `serviciosListingAnalyticsMirror.ts:59-76` |
| BLOCKS OWNER QA | NO (analytics numbers will be untrustworthy until fixed) |

---

## GAP-005 · P1 · OFERTAS LEAKS EXACT STREET ADDRESS PUBLICLY
| Field | Value |
|---|---|
| SYSTEM | G23 Address Verifier · G24 Location Privacy · G53 Privacy |
| CATEGORY | ofertas-locales · public search, offer cards, detail |
| GLOBAL ENGINE EXISTS | YES — `resolveBusinessAddressPublicView`; adopted by other verticals |
| BEST IMPLEMENTATION | Sept `cddc34fa` "persist Ofertas address privacy" — 13 files, +239/−19, incl. migration `supabase/migrations/20260901120000_ofertas_locales_address_privacy.sql` (new column `ofertas_locales.show_exact_address`) |
| CURRENT MAIN | **FALSE** — `git grep "show_exact_address" origin/main -- app/lib/ofertas-locales/` → **zero matches**; migration absent from `origin/main` |
| SEPT | **TRUE** |
| EXACT FALSE | Exact street address + auto-derived Google Maps directions emitted **unconditionally**: `ofertasLocalesPublicOfferHelpers.ts:137,:150-155`; `ofertasLocalesPublicSearchHelpers.ts:280,:286-292`; `ofertasLocalesPreviewHelpers.ts:109-113,:231-236` |
| REQUIRED ACTION | **RECONCILE_MAIN_AND_GLOBALIZATION** (includes a DB migration — deploy ordering matters) |
| BLOCKS OWNER QA | YES for Ofertas privacy QA |

---

## GAP-006 · P1 · ONE-TIME PAID LANES LOST THE ANTI-DOUBLE-CHARGE GUARD
| Field | Value |
|---|---|
| SYSTEM | G08 Same-Row/No-Base-Recharge · G31 Revenue OS |
| CATEGORY | autos privado (`autos_privado_30d`), bienes-raices FSBO (`br_fsbo_45d`), empleos (`empleos_job_post_paid`) |
| GLOBAL ENGINE EXISTS | Partially — `app/lib/listingPlans/revenueActiveEntitlementGuard.ts:64-70` guards only 5 **monthly** package keys (autos_dealer, br_agent, restaurantes_base, servicios_base, comida_local_base) → HTTP 409 `active_entitlement_no_recharge` |
| BEST IMPLEMENTATION | Sept: `app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts` + 3 call sites in `app/api/revenue-os/checkout/route.ts` (`validateAutosPrivadoActiveEditCheckoutOwnership`, `validateBrFsboActiveEditCheckoutOwnership`, `validateEmpleosJobPostActiveEditCheckoutOwnership`) — Gate ref "Globalization Build C (RED #14)" |
| CURRENT MAIN | **FALSE — the file does not exist on `origin/main`** |
| EXACT FALSE | A customer editing an already-active one-time listing can be charged a second time for the same row |
| REQUIRED ACTION | **RECONCILE_MAIN_AND_GLOBALIZATION** |
| BLOCKS OWNER QA | YES for the "no base recharge" QA step on those three lanes |

---

## GAP-007 · P1 · VIAJES — CHARGE WITHOUT FULFILLMENT
| Field | Value |
|---|---|
| SYSTEM | G31 Revenue OS · G33 Subscription |
| CATEGORY | viajes |
| EXACT FALSE | `viajes_business_monthly` (`revenuePricingMatrix.ts:477-491`, $399/mo, `stripeEligible:true`, `promoEligible:true`) passes **every** validator in `validateRevenueCheckoutRequest` (matrix-driven, no allowlist) and would create a `leonix_payment_records` row and a real $399/mo Stripe subscription — but has **no** checkout payload const (`revenueCategoryCheckoutPayload.ts`), **no** return path (`revenueOsReturnPath.ts:31`), **no** suspension lane (`subscriptionLifecyclePolicy.ts:139`), and **no fulfillment writer** (no `revenueViajesFulfillment.ts` exists). The publish checkpoint nonetheless advertises "$399/mo" + "coupon eligible" — `categoryPublishCheckpoints.ts:786,:819` |
| CURRENT MAIN / SEPT | FALSE / FALSE |
| REQUIRED ACTION | **OWNER_POLICY_DECISION** (is Viajes a paid product?) then NET NEW fulfillment or remove from the matrix |
| EVIDENCE GAP | No client was found that constructs this call. Proven at route level; end-user reachability unconfirmed |
| RELATED | Unintegrated `globalization-release-reconcile-2026-08-14` (`d1447ae7`, `c0912a71`) locks Viajes as **free** — likely the intended answer |

---

## GAP-008 · P1 · SELF-ENGAGEMENT PREVENTION IS UI-ONLY
| Field | Value |
|---|---|
| SYSTEM | G26 Save/Like/Share/Report · G27 Analytics |
| GLOBAL ENGINE EXISTS | YES — `app/lib/analytics/selfEngagementGuard.ts:14-22` `isSelfEngagement` |
| EXACT FALSE (structural) | `/api/analytics/events` **never** compares `authenticatedUserId` to `identity.ownerUserId`. The guard lives only in button components (`LeonixSaveButton.tsx:86-89`). A direct POST records owner self-engagement freely |
| EXACT FALSE (4 specific, Sept-only `3eacdec9`) | All confirmed **still live on `origin/main`**: (1) `rentas/listing/[id]/RentasListingDetailClient.tsx:155` privado branch has no `ownerId`; `:170-183` `LeonixSaveButton` has no `ownerUserId`; (2) `rentas/preview/shared/RentasVisualMatchPreviewView.tsx:742-760` `LeonixLikeButton` has no `ownerUserId`; (3) `app/admin/actions.ts:13-23` `submitListingReportAction` inserts with **zero** ownership check; (4) `en-venta/report/submitEnVentaListingReport.ts` — grep for `isSelfEngagement\|owner_id\|self_report` returns **empty** |
| REQUIRED ACTION | **RECONCILE_MAIN_AND_GLOBALIZATION** for the 4; **FIX_REGRESSION** (server-side guard) for the structural hole |

---

## GAP-009 · P1 · `submitListingReportAction` — UNGUARDED SERVICE-ROLE WRITE
| Field | Value |
|---|---|
| SYSTEM | G26 Report · G53 Security |
| EXACT FALSE | `app/admin/actions.ts:13-23` — no guard of any kind; service-role insert into `listing_reports`; **`reporterId` is fully client-controlled** (attribution spoofing onto any user id); no rate limit, no captcha, no honeypot; `listingId` unvalidated. 4 public callers pass `user?.id ?? null` |
| CONTRAST | `app/api/clasificados/servicios/review/route.ts:54` and `app/api/iglesias/prayers/[id]/update/route.ts:30-34` both DO have protection |
| REQUIRED ACTION | **FIX_REGRESSION** — derive `reporterId` server-side, add rate limiting |

**Sibling, probable P1 — EVIDENCE GAP:** `app/admin/recursosTranslationActions.ts:178`
`confirmOfficialSpanishCore` is an unguarded non-`Action` export from a `"use server"` file that
writes `community_resources`. Every export of a `"use server"` module is an independently POST-able
endpoint. Build-output registration was not verified.

---

## GAP-010 · P1 · THE SEED DEFECT — FIVE DUPLICATED CATEGORY REGISTRIES
| Field | Value |
|---|---|
| SYSTEM | G02 Category Registry · G31 Revenue OS · G35 Promo · G48 Admin |
| CANONICAL ENGINE | `app/lib/listingPlans/revenuePricingMatrix.ts:86` `REVENUE_V1_PACKAGE_MATRIX` (14 categories) · `app/lib/listingIdentity/types.ts:47` `CanonicalDbCategory` (14, complete) · `categoryRouteRegistry.ts:1395` (17 lane-split adapters, complete) |
| EXACT FALSE | The 5-item list `[servicios, restaurantes, autos, bienes-raices, rentas]` is copy-pasted **verbatim into five files**: `packageEntitlementConstants.ts:12` · `promoCodeConstants.ts:17` (alias) · `package-entitlements/actions.ts:39` (**server-enforced**) · `packageEntitlements.ts:65` · `printDigitalVisibilityRank.ts:59` |
| IMPACT A — promo | 4 categories with genuinely `promoEligible:true` packages cannot get a category-scoped promo: **comida-local** ($129/mo), **empleos** ($24.99), **clases** ($24.99), **viajes** ($399/mo). Inconsistent within the same form: `PROMO_CODE_PACKAGE_SCOPE_OPTIONS:31-40` IS matrix-derived and DOES list them |
| IMPACT B — entitlement | `ALLOWED_CATEGORIES` hard-blocks manual grant/track for **ofertas-locales** and **comida-local**, both live paid products. Compounded by `PACKAGE_ENTITLEMENT_LISTING_SOURCES:20-25` naming no source table for either — **both constants must be fixed together** |
| IMPACT C — ofertas promo | **INTENTIONAL_NA.** Blocked earlier by `promoEligible:false` (`revenuePricingMatrix.ts:334,:351`) via `promoCodeRules.ts:103-108`. Fixing the constant changes nothing |
| ASYMMETRY | The promo server action has **no category allowlist at all** (`promo-codes/actions.ts:80,:210`) while the entitlement action hard-enforces one |
| MITIGATION | The complimentary/partner grant path (`package-entitlements/actions.ts:583,:591`) IS matrix-driven and works for all 14 categories; automated webhook fulfillment never touches this file |
| REQUIRED ACTION | **ADOPT_EXISTING_ENGINE** — derive all five from `REVENUE_V1_PACKAGE_MATRIX` |

---

## GAP-011 · P1 · OFERTAS CHECKOUT RENDERS A PERMANENTLY DEAD PROMO FIELD
`app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx:51-54,:119-123,:172-193,:208` — a fully
wired promo input where **no code that exists or could exist will ever succeed**
(`promoEligible:false` → `promoCodeRules.ts:103-108` → generic "no es válido" from
`revenuePromoValidation.ts:46-49`). **This is the owner-visible symptom behind the original
complaint.** ACTION: **OWNER_POLICY_DECISION** (enable promos for Ofertas) or hide the field.

---

## GAP-012 · P1 · OFERTAS COUPON PRICE — TWO SOURCES OF TRUTH DISAGREE
`revenuePricingMatrix.ts:346,:354` says `19900` + `stripeEligible:true`;
`ofertasLocalesConstants.ts:22-23,:152` says `0` + "free (locked)";
`ofertasLocalesCommercialServer.ts:357-363` returns `{source:"free"}` and never reaches Stripe;
`revenueFulfillment.ts:225-226` confirms "the free coupon lane never reaches Stripe at all".
Unintegrated `globalization-release-reconcile-2026-08-14` (`8fef4d26`, `c0912a71`) appears to be the
intended resolution. ACTION: **OWNER_POLICY_DECISION**.
Related: `revenueStripe.ts:117` hardcodes `aiIncluded:true` for the whole ofertas category while
`ofertasLocalesCommercial.ts:52` declares coupons `aiIncluded:false`, and `revenueFulfillment.ts:1299`
hard-rejects any ofertas session with `aiIncluded !== true`.

---

## GAP-013 · P1 · NO PAYMENT/ENTITLEMENT VISIBILITY GATE ON ANY AUDITED RESULTS SURFACE
Entitlements only **reorder**; no row is ever excluded for non-payment.
Servicios `serviciosEntitlementOverlay.ts:48-56` · Restaurantes `restaurantesResultsInventoryServer.ts:31-38` ·
BR `brPublicEntitlementOverlay.ts:92-113` (fail-open) · Rentas `fetchRentasPublicListingsForBrowse.ts:35-60`.
**Most exposed: comida-local** — `comidaLocalPublicQueries.ts:26` *selects* `payment_status` and
**never uses it in any predicate**. An unpaid published row is publicly visible.
ACTION: **OWNER_POLICY_DECISION** (is this intended?) then FIX.

---

## GAP-014 · P1 · EXPIRATION GATE ABSENT EVERYWHERE EXCEPT RENTAS — AND RENTAS HAS THE INVERSE BUG
- **Bienes Raíces:** `git grep -niE "expires_at|expired|expiration"` over the BR tree → **zero
  non-`.md` hits.** A BR listing published once is visible **forever**.
- **Comida Local:** `expires_at` exists and is read by admin (`comidaLocalAdminQueries.ts:7`) and
  dashboard (`comidaLocalDashboardQueries.ts:7`), but is **deliberately omitted** from
  `COMIDA_LOCAL_PUBLIC_LISTING_SELECT` (`comidaLocalPublicQueries.ts:26`) — the public surface
  *cannot* filter on it. Expired listings stay listed.
- **Servicios / Restaurantes:** no listing-row expiration; only the entitlement window, which changes
  ranking, never visibility.
- **Rentas — INVERSE P1:** `listingLifecycleConfig.ts:8-20` sets `expirationRequired:true`, so a
  rentas row with `expires_at = NULL` yields `lifecycleState:"unknown"` → `isPubliclyVisible:false`
  (`resolveListingLifecycle.ts:88-99`) → **silently excluded from results AND detail.**
  **EVIDENCE GAP:** whether the rentas publish path always populates `expires_at` was not traced.

---

## GAP-015 · P1 · BUSINESS HUB — THE SHARED ENGINE HAS ZERO CONSUMERS
| Field | Value |
|---|---|
| SYSTEM | G30 Business Hub |
| EXACT FALSE | `buildSharedConnectionHubContact` (`app/components/contact/connectionHub/sharedConnectionHubContactModel.ts:81`) — the one shared model the program was built around — has **ZERO app importers**; referenced only by docs and verifier scripts. `sharedConnectionHubHasVisibleContent`, `buildSharedConnectionHubDirectionsHref`, `isCoarseLocationLine`, and 11 of 13 exported types likewise have zero app consumers. `FullBusinessHubCard.tsx` / `ListingContactCard.tsx` **were never built** (`docs/global-business-hub/ADOPTION_PLAYBOOK.md:55-58`, confirmed absent) |
| REALITY | Every category ships a complete independent hub: **5** parallel contact models · **4** review buttons (2 orphaned) · **4** faux maps (1 orphaned) · **7** independent copies of the Google Maps `output=embed` formula · **4** social-brand engines · byte-identical tokens under `RCH_*`/`SCH_*` · whole-component fork `DealerBusinessStack.tsx` (504 lines) vs `PreviewDealerBusinessStack.tsx` (793) — **the public vehicle page renders the *Preview* one** |
| CLASSIFICATION | Not a regression — the engine was **never built**. Prior "TRUE_SOURCE" claims are **STALE_DOCUMENT** |
| REQUIRED ACTION | **OWNER_POLICY_DECISION** — build it for real, or formally accept per-category hubs and delete the orphaned shared layer |
| BLOCKS OWNER QA | NO — each category's hub works; they are just not shared |

---

## GAP-016 · P1 · ROUTE-SLUG CHAOS AND DUPLICATE-CONTENT SEO
| Category | State |
|---|---|
| bienes-raices | canonical `/resultados`; `/results` → permanent redirect (`next.config.ts:86-88`). `results/page.tsx` is a dead re-export |
| rentas | canonical `/results`; **`/resultados` is a hard 404 with no redirect** (no `rentas` line in `next.config.ts`) — the exact opposite convention |
| servicios | **both** `/resultados` and `/results` serve the same page via a plain ES re-export — **no redirect, no canonical tag** |
| restaurantes | same, and `results/page.tsx` **does not re-declare `dynamic = "force-dynamic"`** |
ACTION: **FIX_REGRESSION** — pick one convention, add redirects + canonical tags. Also: stray
non-route file `servicios/resultados/page_temp.tsx` (UTF-16) is still shipped.

---

## GAP-017 · P2 · BR RESULTS PAGINATION CEILING + 19 DEAD FILTERS
`BienesRaicesResultsClient.tsx:61` fetches `limit: 80` with no count/offset and paginates client-side
at `PAGE_SIZE = 9` (`:32`) → **row 81+ is unreachable**, and displayed totals are totals of the
80-row window, not the table. Separately, `brResultsUrlState.ts:20,:36-52` parses `colonia` + 18
boolean characteristic filters that `filterBrListings` **never applies** — self-documented as
"Deferred… not yet wired".

---

## GAP-018 · P2 · RESTAURANTES DISCARDS PAID PLACEMENT ON ANY USER SORT
`RestaurantesResultsShell.tsx:166` ranks, then `:170` sorts the **entire flat list**
(`filterRestaurantesBlueprintRows.ts:194-216`) with **no bucket preservation** — unlike Servicios,
which sorts *within* placement buckets (`serviciosResultsFilter.ts:874-879`). Paid placement survives
only on the default `newest` sort. Also ships up to **2000 rows to the browser**.

---

## GAP-019 · P2 · THREE CATEGORIES EMIT ZERO ANALYTICS
**mascotas-y-perdidos** (only local `addListingView`), **viajes**
(`viajesPublicIntegration.ts:26-29` is a literal `// TODO` stub — though `viajes_staged_listings` IS
an allowed `source_table` and the server resolver is ready), **negocios-locales** (not in
`LISTING_ANALYTICS_CATEGORIES`; no data source at all).

---

## GAP-020 · P2 · SIX EVENT KINDS ARE UNREPRESENTABLE + ONE DEAD METRIC
`checkout_start`, `checkout_success`, `payment_success`, `translate`, `gallery_open`, `video_play`
**do not exist as event types** — absent from `LISTING_ANALYTICS_EVENT_TYPES` and the DB CHECK;
`git grep` returns empty. **No category can emit them.** Separately `listing_impression` is read by
4 aggregators (`dashboardAnalyticsMetrics.ts:140`) and **emitted by nobody**.

---

## GAP-021 · P2 · DEALER/AGENT PARENT ROW CONSUMES A PAID CAPACITY SLOT
Sept's `inventory_role` capacity anchoring (Gate 6C.2) in `commercialWriteGuard.ts` —
`countActiveAutosDealerGroupInventory` filtering `row.inventory_role !== "inventory_vehicle"`, and the
BR `inventory_property` parallel — is **absent from `origin/main`**. Dealers/agents silently lose one
slot of paid inventory. ACTION: **RECONCILE_MAIN_AND_GLOBALIZATION**.

---

## GAP-022 · P2 · NO SCHEDULED EXPIRY ENFORCEMENT FOR OFERTAS
The 30-day term (`OFERTAS_LOCALES_PUBLIC_TERM_DAYS = 30`) is written on activation
(`ofertasLocalesAdminReviewMutations.ts:272-273`) and enforced **read-side only** at every public
surface. No `vercel.json` cron and no sweep writes `status = 'expired'`; the DB row stays
`status = 'approved'` past `expires_at`. The only batch job
(`admin/renewals/activate-due/route.ts`) is admin/worker-triggered, not scheduled.
**Related open question (agent killed): the Saved Search periodic trigger.** NOT PROVEN either way.

---

## GAP-023 · P2 · ADMIN AUDIT LOG CANNOT ATTRIBUTE ANY ACTION TO A PERSON
`admin_audit_log` has **no actor column at all** — confirmed by the code's own comment
(`adminAuditLogServer.ts:44-48`). Writes are fire-and-forget (`auditAdminWrite.ts:10` — `void`, no
`await`) and swallow all errors. Coverage: **~89%** of server-action files, but only **~9% (6/64)**
of mutating admin API routes. Unaudited high-value: manual-payments (payment + entitlement
fulfillment), all 9 `app/api/admin/leads/**` handlers (PII exports leave **no trace**), both moderate
routes, both upload routes, all 6 ofertas admin routes, and the whole `businesses/**` family.

---

## GAP-024 · P2 · OFERTAS SMS EVENT MIS-ATTRIBUTED AS A PHONE CALL
`OfertasLocalesPublicDetailView.tsx:374-375` — the SMS button calls `onCta("sms")` but
`track("phone","sms")`, recording a `phone_click` with `metadata.provider="sms"`.

---

## GAP-025 · P2 · OFERTAS ROUTE-ADAPTER COMMENT IS STALE
`app/lib/listingIdentity/categoryRouteRegistry.ts:1086-1087` asserts "No payment/checkout route was
confirmed for Ofertas Locales base publishing." A checkout route **does** exist
(`app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx` → `/api/revenue-os/checkout`).
**STALE_DOCUMENT** — the kind of stale in-source claim that misleads later audits.

---

## GAP-026 · P3 · HOT-LINKED STOCK-PHOTO FALLBACKS + INJECTED DEFAULT PRICE
Restaurantes missing-image fallback is a remote Unsplash URL
(`restaurantesPublicListingMapper.ts:103-104`); BR's likewise
(`mapBrListingRowToCard.ts:145`). Rentas correctly uses local `/logo.png`.
Restaurantes also injects `priceLevel ?? "$$"` (`restaurantesPublicListingMapper.ts:131`) — a listing
with no declared price silently displays and filter-matches as `$$`.

---

## GAP-027 · P3 · RENTAS `recencyRank` WRAPS EVERY ~100 DAYS
`mapListingRowToRentasPublicListing.ts:572` —
`Math.min(100, Math.floor(Date.parse(publishedAt)/86400000) % 100)`. "Most recent" is not reliably
chronological. Also: the rentas **client refetch** path
(`useRentasPublicBrowseInventory.ts:88-94`) performs no entitlement hydration and no placement-weight
resolution — when it fires, all promotion/placement data is silently lost.

---

## GAP-028 · P3 · ORPHANED CODE STILL SHIPPING (DO NOT DELETE NOW)
**Business Hub:** `ServiciosHubReviewLinkButton`, `RestaurantHubReviewLinkButton`,
`AutosNegociosBusinessHubFauxMap`, `OfertasLocalesBusinessHubLiteCard`, `ListingView` (default export
dead; only its types survive), `BusinessListingIdentityRail` (transitively),
`buildFullPreviewListingData`, `RestauranteDetailShell` **plus a committed `.backup` file**.
**Analytics (7, zero importers):** `autosAnalyticsExtended.ts`, `autosAnalyticsEvents.ts`,
`empleosAnalyticsExtended.ts`, `enVentaAnalyticsExtended.ts`, `leonixClasificadosAnalytics.ts`,
`restaurantesSellerAnalytics.ts`, `ofertasLocalesAnalyticsEvents.ts` — two still call legacy `trackEvent`.
**BR results:** `BienesRaicesFeaturedSection`, `BienesRaicesNegociosSpotlightBand`,
`BienesRaicesResultsHero`, `BienesRaicesPropiedadFilterChips`, `BienesRaicesMapToggle`,
`pickNegociosSpotlight`. **Rentas:** `RentasPropiedadFilterChips`, `RentasLandingFeatured`.
**Servicios landing:** `FeaturedBusinessSection`, `RecentServicesSection`.
**⚠ Four verifier scripts assert orphaned component *names* appear in source and now match only
comments — they are false-positive-prone:** `verify-servicios-shell-2d.mjs:51`,
`restaurantes-polish1-audit.ts:92`, `restaurantes-r-c1-contact-hub-audit.ts:130`,
`autos-a5-qa-01-business-hub-parity-audit.ts:113`.

---

## GAP-029 · P4 · VIAJES BUSINESS HUB 404s IN PRODUCTION
`app/(site)/clasificados/viajes/negocio/[slug]/page.tsx:42` —
`if (!viajesAllowCuratedDemoCatalog()) notFound();`. Data source is
`viajesNegocioProfileSampleData.ts`. The likely real implementation is the **never-pushed**
`integration/viajes-launch-qa-2026-08` working tree (doc 01 §5 R5).

---

## GAP-030 · P1 · A FAILED SAVED-SEARCH EMAIL IS NEVER RETRIED
See `14_SEARCH_RESULTS_RELATED_SAVED_SEARCH_AUDIT.md §A.3`. No `vercel.json` exists in the repo, no
cron route, no `pg_cron`, no saved-search admin/retry endpoint. Delivery is one best-effort attempt at
publish time; a failed event stays `status='pending'` forever. The claim RPC
(`claim_saved_search_match_event`), `attempt_count` CHECK, `saved_search_processing_failures` table
and `SAVED_SEARCH_EMAIL_MAX_ATTEMPTS = 3` all exist **and are unused** — the code says so itself:
*"no cron/worker to retry a failed one."*
**PROVEN REFERENCE EXISTS: YES (route shape)** · REFERENCE:
`app/api/revenue-os/admin/subscription-sweep/route.ts` (machine-key authorized sweep) ·
**ACTION: ADOPT EXISTING + OWNER_POLICY_DECISION** (choose the scheduling mechanism).

## GAP-031 · P2 · SAVED SEARCH COVERS 3 OF 14 CATEGORIES
`app/lib/saved-search/delivery/savedSearchEmailDelivery.ts:37` `CATEGORY_RESOLVERS` = autos,
bienes-raices, rentas. Servicios/restaurantes/comida-local/empleos/ofertas = INTENTIONAL_NA
(inventory-search feature). comunidad/clases/busco/mascotas/en-venta/viajes = ADOPTION GAP.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: `app/lib/saved-search/autos/` (complete 6-file adapter
set) · **ACTION: ADOPT EXISTING** — the file's own comment says "adding a category means adding one
entry here, never cloning this file."

---

## GAP-032 · P0 · GOOGLE/YELP OWNER PANEL IS UNREACHABLE FOR EVERY CATEGORY
| Field | Value |
|---|---|
| SYSTEM | G21 Google/Yelp · G47 Dashboard |
| GLOBAL ENGINE EXISTS | **YES** — `app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx:12`, consumed by `OwnerEntityWorkspace.tsx` |
| REGISTRY SAYS | `ownerEntityCapabilityRegistry.ts:143` (servicios) / `:158` (restaurantes) declare `externalReviews: "supported"` |
| **EXACT FALSE** | The `externalReputation` prop is passed by **ZERO pages** — all 4 occurrences in `app/` are inside `OwnerEntityWorkspace.tsx` itself (`:39,:64,:107,:108`). **The panel never renders for any category.** |
| ACTION | **ADOPT EXISTING** — pass the prop from the owner pages |
| BLOCKS OWNER QA | YES for any Google/Yelp dashboard step |

## GAP-033 · P1 · RENTAS NEGOCIO COLLAPSED INTO RENTAS PRIVADO IN THE DASHBOARD
`app/(site)/dashboard/mis-anuncios/[id]/page.tsx:597` collapses both Rentas lanes to
`"rentas-privado"`, justified by a source comment claiming identical shapes. **The comment is FALSE** —
`analytics` and `specialized.activity` differ (`ownerEntityCapabilityRegistry.ts:222/:228` vs `:231`).
Negocio rows render analytics/activity the registry declares **unsupported**; the `rentas-negocio` key
has zero adopters.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: BR's own `isBrNegocioListing` lane split at
`mis-anuncios/[id]/page.tsx:589-602` · **ACTION: ADOPT EXISTING.**

## GAP-034 · P1 · `dashboardRoute` IMPLEMENTED IN ALL 17 ADAPTERS, CALLED BY NOBODY
`app/lib/listingIdentity/categoryRouteRegistry.ts` — all 17 adapters implement it; the only reference
anywhere is the type declaration (`types.ts:178`). A complete, maintained, zero-consumer abstraction.
**ACTION: ADOPT EXISTING** (route the dashboard through it) **or** formally retire the field.

## GAP-035 · P1 · TWO REGISTRIES CONTRADICT EACH OTHER AT THE SAME REF
`categoryRouteRegistry.ts:1141-1143,:1288-1290` — clases/comunidad/mascotas adapters return
`dashboardRoute() = null` and state **in prose** that they are absent from Mis Anuncios. But
`app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts:155,166,191` marks all three `ready: true`
with real `manageHref`s. **ACTION: FIX REGRESSION** — pick one source of truth.

## GAP-036 · P1 · `contactHub` DECLARED SUPPORTED ON 17/18 KEYS WITH NO DASHBOARD SURFACE
No connection-hub surface exists anywhere under `app/(site)/dashboard`.
`buildSharedConnectionHubContact` re-confirmed **zero importers** (cross-ref GAP-015).
**EVIDENCE GAP:** owner-surface vs public-surface intent is ambiguous. **ACTION: OWNER_POLICY_DECISION.**

## GAP-037 · P2 · MIS-ANUNCIOS LIST IS A SILO FOR EVERY `listings`-TABLE CATEGORY
**The dominant structural dashboard finding.** Every *dedicated-table* category (servicios,
restaurantes, comida-local, empleos, viajes, ofertas-locales, autos dealer) is fully SHARED. Every
generic-`listings` category (bienes-raices, rentas, en-venta, clases, comunidad, busco, mascotas,
autos privado) is **SILO at the list level, SHARED at `/dashboard/mis-anuncios/[id]`**. That one split
accounts for **8 of 9 PARTIAL lanes**.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **Comida Local** · REFERENCE PATH:
`ComidaLocalDashboardListings.tsx:14,31,127-140,150` · **ACTION: ADOPT EXISTING.**

## GAP-038 · P2 · DASHBOARD ORPHANS AND STALE IN-SOURCE CLAIMS
Zero importers: `BusinessConciergeOwnerHome.tsx` — **while two in-tree audit docs at the same ref
claim `/dashboard/business-tools` uses it** · `DashboardCategoryLauncherCard` ·
`DashboardQuickActionCard` · `DashboardStatsCard` · `resolveLifecycleMutationDescriptors` ·
the `iglesias` key (honest, self-documented).
Stale: `app/lib/listingIdentity/businessProfileLifecycleAdapter.ts:13` says "COMPLETELY UNWIRED" —
it has **2 live importers**. **DO NOT DELETE NOW.**

> **CROSS-CUTTING WARNING, now confirmed a third time:** in-tree `.md` audit artifacts and source
> comments assert wiring truth that `origin/main` contradicts (GAP-025, GAP-028, GAP-035, GAP-038).
> **Prose in this repository is not evidence. Verify against source, always.**

---

# THE DESTRUCTIVE-EDIT CLASS — FULL SWEEP RESULT
Full evidence: `06_DATA_ROUND_TRIP_FIELD_AUDIT.md`. Ref `origin/main` = `a0a47839`.

> **THE SINGLE MOST IMPORTANT SCOPING FACT IN THIS AUDIT:**
> The September seal fixes **2 of the 8 destructive lanes**. Merging Sept is necessary and
> **not sufficient**. GAP-002 must be read together with GAP-039 … GAP-045 below.

### THE DEFECT SIGNATURE
1. **READ** — dashboard edit hydration hand-enumerates fields from a published row instead of
   restoring a whole snapshot or reusing the proven public-page parser.
2. **WRITE** — republish does a **whole-value replace** of a column built from that partial state.
   Smoking gun, identical in both Sept-proven lanes: `business_meta` is an unconditional whole-column
   replace (`app/api/clasificados/bienes-raices/listing-edit/route.ts:177`,
   `app/api/clasificados/rentas/listing-edit/route.ts:132`), while `detail_pairs` is only label-merged.
3. Every field in (2) missing from (1) is written back as schema default → **silently destroyed**.

### LANE VERDICTS
| Lane | Verdict | Fixed by Sept? |
|---|---|---|
| bienes-raices PRIVADO/FSBO | **SAFE** (narrow patch editor) | n/a |
| bienes-raices NEGOCIO parent | **DESTRUCTIVE** | ✅ `733408dd` |
| bienes-raices inventory child | **DESTRUCTIVE** | ❌ **NO** |
| rentas NEGOCIO | **DESTRUCTIVE** | ✅ `67919479` |
| **rentas PRIVADO** | **DESTRUCTIVE** | ❌ **NO — NEW, shared code path** |
| autos PRIVADO | **NO_EDIT_PATH** (form opens, no save reaches DB) | n/a |
| autos DEALER parent | **SAFE** (whole-blob round trip) | n/a |
| autos DEALER inventory child | **DESTRUCTIVE** | ❌ **NO** |
| **empleos PREMIUM/paid** | **DESTRUCTIVE — WORST** | ❌ **NO** |
| empleos QUICK | **DESTRUCTIVE** | ❌ NO |
| servicios | **DESTRUCTIVE** (conditional; partial server net) | ❌ NO |
| restaurantes | **SAFE — prior lead REFUTED** | n/a |
| comida-local | **SAFE** | n/a |
| ofertas-locales | **DESTRUCTIVE** (pre-approval statuses only) | ❌ NO |
| viajes | **SAFE** | n/a |
| en-venta · comunidad · clases · busco · mascotas | **SAFE** (patch editor) | n/a |

**CORRECTION:** the earlier lead "Restaurantes has no published→draft mapper" is **FALSE**.
`listingJsonToDraft` exists (`restaurantesPublicListingMapper.ts:292`) and
`app/(site)/dashboard/restaurantes/page.tsx:270-315` hydrates properly.

---

## GAP-039 · P0 · EMPLEOS REPUBLISH FORKS LISTING IDENTITY AND DOUBLE-CHARGES THE EMPLOYER
| Field | Value |
|---|---|
| SYSTEM | G01 Identity · G08 Same-Row/Republish · G31 Revenue OS |
| CATEGORY / LANE | empleos · premium/paid |
| **EXACT FALSE** | Empleos passes the field-parity test **cleanly** — then destroys the listing one step later. `buildEmpleosPublishEnvelope.ts:250` hardcodes `envelopeBase.listingId: null`. Republish therefore **INSERTS A NEW ROW** (`empleosPublicListingsDbServer.ts:227`) and **starts a NEW Stripe checkout against it** (`empleosRevenueCheckout.ts:60-68`). |
| CONSEQUENCE | The original **paid** job is orphaned and the employer is **charged twice**. Nothing blocks it |
| SECOND DEFECT, SAME LANE | "Guardar borrador" sets `lifecycle_status = draft` and `published_at = null` **on a LIVE paid job** — an owner can silently unpublish a job they paid for |
| CURRENT MAIN / SEPT | FALSE / **FALSE — no September commit fixes either defect** |
| WHY THE SEPT GUARD DOESN'T HELP | Porting `activePaidEditCheckoutOwnership.ts` (GAP-006) does **NOT** close this: a fresh `listingId` is minted *before* checkout, so the guard has nothing to match. **Empleos needs the identity fix AND the guard.** |
| REQUIRED ACTION | **FIX_REGRESSION** (preserve `listingId` through the envelope) **+ ADOPT EXISTING** (the guard) |
| PROVEN REFERENCE | **YES** — every other lane's same-row UPDATE path; 11 of 12 lane groups do this correctly |
| BLOCKS OWNER QA | **YES — do not QA Empleos republish against a real payment** |
| QA AFTER FIX | Publish a paid job → republish → confirm the SAME row id, no second Stripe session, `published_at` intact |

## GAP-040 · P0 · RENTAS PRIVADO DASHBOARD EDIT IS DESTRUCTIVE — NOT FIXED BY SEPT
Sept fixed only Rentas **Negocio**. Rentas **Privado** shares the same code path and is
**DESTRUCTIVE on `origin/main` and on `e3956df8` alike.**
**DB-certain destruction:** `business_meta` → null · `business_name` → null ·
`Leonix:prop:country` → **forced to `"United States"` by unconditional replace, which corrupts every
non-US listing**.
**Form-state-certain:** `zonaVecindario`, `direccionLinea1`, `mostrarDireccionExacta`,
`direccionPais`, `plazoContratoOtro`, `contactChannels`, and all residencial/comercial/terreno
property facts.
*(The auditing agent explicitly narrowed an initial over-claim here: two empty-skip layers do protect
`detail_pairs`. The `business_meta` / `business_name` / country destruction stands.)*
**PROVEN REFERENCE: YES** — the Sept Rentas Negocio reverse mapper (`67919479`).
**ACTION: ADOPT EXISTING** (extend the Sept reverse mapper to the privado lane).

## GAP-041 · P0 · BIENES RAÍCES INVENTORY CHILD EDIT IS DESTRUCTIVE — NOT FIXED BY SEPT
Destroyed: `state` → NULL · `zip` → NULL · `direccionLinea1/2` · `direccion` ·
`mostrarDireccionExacta` · `direccionPais` · `subtipoPropiedad` · `videoUrl` · `tourUrl` ·
`brochureUrl` · `ctaUrlMls` · `listadoUrl` · and `propertyForm` left permanently null.
Sept's `733408dd` covers the **parent** only.
**PROVEN REFERENCE: YES** — `733408dd`. **ACTION: ADOPT EXISTING.**

## GAP-042 · P0 · AUTOS DEALER INVENTORY CHILD INHERITS THE PARENT'S DATA ON EDIT
The child write is `{...parent, ...childSlice}`, so any field missing from `childSlice` **silently
inherits the PARENT's value** rather than the child's own:
`mpgCity`, `mpgHighway`, `doors`, `seats`, `titleStatus` (+Custom), `features`, `customEquipment`,
`otherEquipmentDetails`, `country`, `heroImages`, and **all 8 video/Mux keys — so the child vehicle
page plays the parent dealership's video.**
This is a *wrong-data* defect, not merely a *lost-data* defect. **ACTION: FIX_REGRESSION.**

## GAP-043 · P1 · SERVICIOS EDIT DESTROYS BUSINESS HIGHLIGHTS AND TRUST DATA
`businessHighlights` is destroyed **unconditionally** — the `bh_preset_` prefix is never stripped, and
trust ids are mis-filed into highlights. `quickFacts` and `reasons`/`trust` are lost on any **partial**
re-edit: the server safety net (`serviciosPublishOpsProfileMerge.ts:25-29`) only fires when the array
is **fully empty**.
**EVIDENCE GAP:** the "net fails on partial re-edit" path was reasoned from source; the UI sequence
was not exercised. **ACTION: FIX_REGRESSION.**

## GAP-044 · P1 · OFERTAS EDIT DESTROYS OWNER FIELDS PRE-APPROVAL
For pre-approval statuses only: `digital_coupon_url` · `digital_coupon_note` ·
`is_magazine_pickup_partner` · `internal_notes` (which carries `contactEmail`, `businessLogoUrl`,
linkedin/x/snapchat/pinterest URLs) · `country` · `membershipCtaLabel` ·
`requiresMembershipForDeals` · 3 `magazine*` keys. **ACTION: FIX_REGRESSION.**

## GAP-045 · P2 · EMPLEOS QUICK + AUTOS PRIVADO
empleos QUICK destroys `workModalityCustom` and forks identity the same way.
**autos PRIVADO has NO EDIT PATH at all** — the form opens but no save ever reaches the DB.
That is a silent no-op an owner will read as data loss. **ACTION: FIX_REGRESSION / NET NEW.**

## GAP-046 · P1 · SAME-ROW GUARANTEE HOLDS EVERYWHERE EXCEPT EMPLEOS
11 of 12 lane groups correctly UPDATE the same row. Exceptions: **empleos** (LIVE — forks on every
republish, GAP-039) and the currently-unreachable restaurantes `mode=listing-edit` path.
`revenueActiveEntitlementGuard.ts:64-70` is **identical on both refs** — 5 monthly keys only.
`activePaidEditCheckoutOwnership.ts` is **ABSENT on `origin/main`** (verified via `git cat-file`), so
`autos_privado_30d`, `br_fsbo_45d`, `empleos_job_post_paid` have **no recharge guard at all**.

### EVIDENCE GAPS FOR THIS CLASS
1. `empleosPublicListingsDbServer.ts` exists at **two paths**; only the `app/(site)/...` one was read.
2. All verdicts are **static analysis**. Only the two Sept-proven lanes carry a runtime claim.
3. Servicios partial-re-edit sequence not exercised in a browser.
4. `tipoCodigo`/`subtipo` reverse-label matching stays at defaults **even in the Sept fixes** —
   an accepted pre-existing limitation, not re-verified here.
5. Restaurantes `mode=listing-edit` "unreachable" is absence-of-evidence over a large `.tsx` surface.
6. Rentas `images` column shape and the `primaryImageIndex`/`estadoAnuncio` emit path not asserted.
7. **The Empleos double-charge is proven by code path, not by executing a live checkout.**

---

# BATCH 2 — SERVICIOS / RESTAURANTES / COMIDA LOCAL
Full evidence: `04A_SERVICIOS_RESTAURANTES_COMIDA_FULL_CYCLE.md`, `05A_..._PATHWAYS.md`.
Adoption tally (43 scored cells each): **Servicios 29 TRUE / 5 PARTIAL / 8 FALSE / 1 N-A** ·
**Restaurantes 32 / 4 / 6 / 1** · **Comida Local 19 / 4 / 19 / 1**.
Confirmed TRUE for all three: shared leave guard (`useBusinessApplicationLeaveGuard.ts:35`),
shared preview-mode contract (`b60801e2`, in origin/main), checkout, promo.

## GAP-047 · P0 · G23 ADDRESS VERIFIER HAS ZERO ADOPTERS ANYWHERE IN THE REPOSITORY
| Field | Value |
|---|---|
| SYSTEM | G23 Address Verifier · G24 Location Privacy |
| **EXACT FALSE** | `app/lib/businessAddress/*` — the canonical address-verification and address-privacy engine — has **ZERO app importers, repo-wide**. Not one category consumes it on `origin/main`. |
| CONSEQUENCE | G23/G24 must be scored **FALSE for every category** on current production source. The engine is built and completely unwired |
| SEPT | `3c23e875` "adopt G23 address verifier across 5 commercial categories" is **Sept-only** — that is the *only* adoption anywhere, and it is unmerged |
| PROVEN REFERENCE EXISTS | **NO working adopter exists on `origin/main`.** The only reference is the Sept branch itself |
| REQUIRED ACTION | **OWNER_POLICY_DECISION** (adopt Sept's adoption, or decide the engine's fate) — **not** a simple ADOPT EXISTING, because there is nothing on main to copy from |
| CROSS-REF | This is the third confirmed instance of a fully-built, fully-documented, zero-consumer global engine — alongside `buildSharedConnectionHubContact` (GAP-015) and `dashboardRoute` (GAP-034) |

## GAP-048 · P1 · SERVICIOS REPUBLISH IDENTITY IS A sessionStorage STRING → DUPLICATE ROWS
`app/api/clasificados/servicios/publish/route.ts:298-310` matches the existing row by
`.eq("slug", slug)` (`:467`) and otherwise INSERTs (`:493-507`). The slug comes from
`serviciosPublishClient.ts:78-81` reading `sessionStorage["servicios_last_published_slug"]`.
**A lost session plus a renamed business makes `allocateSlug()` (`:119`) mint `name-2` — creating a
DUPLICATE ROW instead of updating the original.** The repo already admits this in
`categoryRouteRegistry.ts` SERVICIOS `knownLimitations`.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORIES: **Comida Local** (`publish/route.ts:132`,
durable `draft_listing_id`) and **Restaurantes** (`:325`) · **ACTION: ADOPT EXISTING.**

## GAP-049 · P1 · PUBLISH GATEWAYS SKIP THE SERVICIOS AND RESTAURANTES CHECKPOINTS
`app/(site)/publicar/_lib/publicarGatewayResolver.ts:99` resolves
`checkpointRoute ?? hubRoute ?? applicationRoute`. Neither the SERVICIOS adapter
(`categoryRouteRegistry.ts:244`) nor RESTAURANTES (`:175`) declares **either** field, so both land the
user **straight on the application form**, bypassing the "Ver Más" checkpoint (G03).
The resolver's own comment at `:93-94` claims Restaurantes resolves via `hubRoute` — **false in
current source** (a sixth instance of prose contradicting code).
**FIX: one field per adapter.** **PROVEN REFERENCE EXISTS: YES** (adapters that do declare it) ·
**ACTION: ADOPT EXISTING.**

## GAP-050 · P1 · COMIDA LOCAL PUBLISH BYPASSES THE SHARED MEDIA CONTRACT
`app/lib/media/listingMediaContract.ts` is imported by Servicios (`publish/route.ts:30,:275`) and
Restaurantes (`:33,:281`) but **never by Comida Local**.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: Servicios / Restaurantes publish routes ·
**ACTION: ADOPT EXISTING.** (Cross-ref GAP-009/`15` — the media contract is also where
`droppedUnpersistable` lives.)

## GAP-051 · P1 · SAVE / REPORT / RECENTLY-VIEWED MISSING ACROSS ALL THREE
Save is absent on Servicios and Comida Local — `app/lib/serviciosSavedListingIdentity.ts` **exists with
zero importers** (**FIX REGRESSION**, not adoption). Report and Recently Viewed are absent from all
three `[slug]/page.tsx`. Sept-only `50d1cd40` (Save/Like/Share for SRV+CML, incl. a new
`ComidaLocalEngagementRow.tsx`) and `14c1e9b5` (`RecentlyViewedAndReportMount.tsx` + 3 mounts) supply
exactly this and are **unmerged**. **ACTION: RECONCILE (merge Sept).**

## GAP-052 · P2 · COMIDA LOCAL EMITS NO JSON-LD AND NO BREADCRUMB
`comida-local/[slug]/page.tsx` — Restaurantes has both.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: Restaurantes `[slug]/page.tsx` · **ACTION: ADOPT EXISTING.**

## GAP-053 · P2/P3 · BATCH-2 RESIDUE
Related listings absent on all three · Comida Local has **no video/flyer fields** and **no e2e spec**
(`e2e/` covers Servicios ×2, Restaurantes ×1) · Servicios + Restaurantes drafts are **sessionStorage
only** · Comida Local and Servicios admin lack the shared `AdminListingMonetizationSummary`
(Sept-only `b9a9f3f7` adds it for Servicios).
**Orphans (DO NOT DELETE NOW):** `servicios/publicar/components/ServiciosApplicationForm.tsx` ·
`app/(site)/servicios/perfil/preview/page.tsx` (a **live-but-dead route**) ·
`ServiciosHeroActions.tsx` (0 mounts, contains a localStorage save fork) · a stale **"$199/mes"**
copy block in `clasificados/publicar/restaurantes/page.tsx` (dead — `RestaurantesSelectorClient`
consumes only `t.title`/`t.body`; real prices come from `revenuePricingMatrix`).

### BATCH-2 SEPT CONTAINMENT (`git merge-base --is-ancestor`)
`b60801e2` **IS** in origin/main. **NOT** in origin/main: `68d45c6c` (Servicios address privacy, 12
files) · `50d1cd40` · `14c1e9b5` · `b9a9f3f7` · `80d4dbcb` (14 files, +324/−21, 3 owner-visible
Servicios P0s incl. `serviciosPublishedToApplicationDraft.ts` +53) · `69818522` (docs) ·
`629c5a46` (BR/Rentas only — these three already have the shared guard).

### BATCH-2 EVIDENCE GAPS
Static only; no publish executed and no DB observed (Supabase MCP unauthorized this session) — the
"no `draft_listing_id` on Servicios" claim is **inferred** from route payloads + migrations, not from
the live column list · `comida-local/lifecycle/route.ts` and `expires_at`-on-republish not traced ·
Restaurantes coupon-edit / Servicios offers-edit sub-flow write targets not traced past the shared
publish route · `app/manifest.ts` contents not read (mobile/PWA scored on structure).

---

# BATCH 3 — BIENES RAÍCES + RENTAS + G41
Full evidence: `04B_BIENES_RENTAS_FULL_CYCLE.md`, `12A_BIENES_PARENT_CHILD_AUDIT.md`.
**All five lanes write the same generic `listings` table; no server API exists in any publish path.**
**Same-row republish: TRUE on all five. No-recharge: TRUE on all five** (zero Stripe references in
either `listing-edit` route or the `editar` save path).
**G41 scorecard (18 items): TRUE 13 · PARTIAL 4 · FALSE 1.** The parent-visibility anchor was
re-verified byte-for-byte, plus a third adopted consumer the brief had missed
(`app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts:44-59`). Parent-inactive
cascade, archive-block and child-resume-gate are all live
(`brListingLifecycleService.ts:173-268`).

## ⚠ TWO CORRECTIONS TO THIS AUDIT'S OWN EARLIER STATEMENTS
1. **`629c5a46` "adopt global application leave guard" is on the THIRD BRANCH
   (`fix/br-negocio-inventory-hub-media-hydration-2026-08-27`), NOT on the September seal.** Earlier
   briefs in this audit attributed it to Sept. It is contained in **neither** `origin/main` **nor**
   `e3956df8`. Docs `02` and `17` are corrected by this entry.
2. **BR dispatch in the public-detail monolith is `app/(site)/clasificados/anuncio/[id]/page.tsx:1431`,
   not `:1473`; EnVenta is `:1479`, not `:1495`** — and EnVenta is **not** a BR code path. Earlier
   line references in docs `13` and `14` are superseded by these.

## GAP-054 · P0 · NO VIEW EVENT IS EMITTED ON ANY BIENES RAÍCES PUBLIC DETAIL PAGE
| Field | Value |
|---|---|
| SYSTEM | G27 Analytics · G41 |
| CATEGORY / LANE | bienes-raices — **all three lanes** |
| **EXACT FALSE** | `trackBrListingViewGlobal` has exactly one emitter, `BrLiveDetailAnalyticsMount.tsx:13-14`, which is mounted only from `EnVentaAnuncioLayout.tsx:774`. That is **unreachable for BR**: `anuncio/[id]/page.tsx:1431` (BR dispatch) **returns at `:1462`**, before the EnVenta branch at `:1479`. |
| CONSEQUENCE | **No `listing_view` or `listing_open` is ever recorded for any BR listing.** CTA and save events still fire — so every BR conversion metric has a **zero denominator**. Owner-facing analytics for the entire category are structurally wrong |
| CURRENT MAIN / SEPT | FALSE / FALSE |
| PROVEN REFERENCE EXISTS | **YES** — the `analyticsContext` is already built at `BienesRaicesNegocioLiveDetailShell.tsx:465-466`; every other category mounts its view tracker |
| REQUIRED ACTION | **FIX_REGRESSION — one line per shell** |
| BLOCKS OWNER QA | YES for any BR analytics QA step |

## GAP-055 · P0 · BIENES RAÍCES NEGOCIO BASE PLAN ALLOWS ZERO ADDABLE PROPERTIES
The parent row is counted as an inventory slot at **all three layers**:
`supabase/migrations/20260810120000_….sql:276` · `app/lib/listingPlans/commercialWriteGuard.ts:192-193` ·
`leonixBrPropertyInventoryPolicy.ts:123-129`.
**Net effect: the BR Negocio base plan yields 0 addable properties, and the inventory pack yields 3 of
the 4 purchased.** A paying agent cannot list what they bought.
**PROVEN REFERENCE EXISTS: YES** — Sept `10618f41` (Gate 6C.2) "exclude commercial parents from
inventory limits", confirmed **NOT** in `origin/main`. **ACTION: ADOPT EXISTING (merge Sept).**
*(Cross-ref GAP-021 — same root cause, now quantified.)*

## GAP-056 · P1 · ZERO UNSAVED-LEAVE GUARDS ON ALL FIVE BR/RENTAS LANES
The shared guard exists and works (`useBusinessApplicationLeaveGuard.ts:35`, calls `preventDefault`)
with **3 consumers, none of them BR or Rentas**.
BR-PRIVADO has **nothing**. BR-NEGOCIO and BR-CHILD are flush-only. Rentas is gated by
`if (!editContext) return` (`RentasPrivadoForm.tsx:311`, `RentasNegocioForm.tsx:301`) — so the
**new-draft path is completely bare**, which is exactly when a user has the most unsaved work.
`629c5a46` (on the third branch) fixes 4 lanes; **BR-CHILD is NET NEW — no commit anywhere covers it.**
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: `useBusinessApplicationLeaveGuard.ts:35` + its 3
existing consumers · **ACTION: ADOPT EXISTING (4 lanes) + NET NEW (BR-CHILD).**

## GAP-057 · P1 · BR PRIVADO CAN CREATE DUPLICATE PENDING PAYMENT ROWS
`leonixPublishRealEstateListingCore.ts:497-499` **excludes BR-PRIVADO from DB pending-row reuse**, so a
Stripe retry mints a second pending row. The only protection is a **client-side cache key**
(`BienesRaicesPrivadoPreviewClient.tsx:51`) — which does not survive a new tab or a cleared session.
**PROVEN REFERENCE EXISTS: YES** — the DB pending-row reuse path the other lanes use, in the same
file. **ACTION: FIX_REGRESSION.**

## GAP-058 · P1 · THE PARENT-VISIBILITY GATE IS APP-LAYER ONLY, AND TWO READERS SKIP IT
Two related-listing readers bypass the gate entirely:
`fetchBrRelatedInventoryListingsBrowser.ts:60` and `fetchBrSimilarOtherClientListingsBrowser.ts:99`.
And **RLS never enforces it**: `supabase/migrations/…listings_enable_rls_full_policies.sql:29/:63`
(SELECT) and `:74-78` (INSERT — `owner_id = auth.uid()` only).
**The child-parent visibility guarantee is application-layer only.** An orphaned child can surface
through the related-listings rails. **ACTION: FIX_REGRESSION** (+ consider an RLS predicate —
**OWNER_POLICY_DECISION**, since that is a DB change).

## GAP-059 · P1 · BR INVENTORY-CHILD EDIT VIA THE GENERIC DASHBOARD ROUTE IS SUPPRESSED, NOT FIXED
`LeonixRealEstateListingManageCard.tsx:118-131` (Gate D.2.1) — the repo **self-documents** this as a
broken path and hides the control rather than repairing it. Cross-ref GAP-041 (the child edit is also
destructive when reached). **ACTION: FIX_REGRESSION.**

## GAP-060 · P2 · BATCH-3 RESIDUE
`resolveLeonixLiveListingContact` is computed then **discarded** for BR (`page.tsx:737` vs
`:1445-1459`) · rentas `negocioHorario` is read but **never collected** · **no JSON-LD on the canonical
rentas detail route** · **no report control on BR** · 6 dead modules (see `16`).

---

# THE THIRD BRANCH — VERDICT: **MUST-MERGE**
`fix/br-negocio-inventory-hub-media-hydration-2026-08-27` (92 files, **+3364/−786**). All four
sampled fixes were tested against `origin/main` and **every defect is still LIVE — zero supersession.
`origin/main` is byte-identical to the pre-fix state.**

| Commit | Fix | Defect on origin/main today |
|---|---|---|
| `b3d85dc1` | draft-media reload loss | **LIVE** — `BienesRaicesPrivadoForm.tsx:150-157` is debounce-only, **zero `pagehide` handler** |
| `5d3f27cf` | inherited parent hub freeze | **LIVE** — `BrNegocioChildInventoryFullApplication.tsx:204-206` deps omit the snapshot |
| `42d68aa8` | multi-video + custom highlights | **LIVE** — `mapBrListingRowToPrivadoPreviewVm.ts:138,145,157-158` hardcoded empty |
| `2d0f63cd` | HOA / Open House | **LIVE** — same mapper `:185-186` (both cards null); `leonixBrGate12d.ts:507-510` ungated |
| `629c5a46` | global leave guard | **LIVE** — and this commit is on THIS branch, not Sept (see correction above) |

`git merge-base --is-ancestor` returns 1 for all five against **both** `origin/main` and `e3956df8`.
**Merge order remains: Sept seal first, then this branch, resolving the 20 shared files with Sept
semantics winning on the reverse mappers** (doc `01 §5 R2`, doc `22`).

### BATCH-3 EVIDENCE GAPS
No runtime/browser execution (auth-gated) · migrations read, **live DB not verified** · the GAP-055
slot numbers are derived from source plus `10618f41`'s own commit message, **not measured** ·
field-loss territory deliberately left to `06` · bespoke `next/navigation` intercepts not exhaustively
ruled out · verifiers and E2E specs inventoried but **not run**.

---

# BATCH 4 — AUTOS + EMPLEOS + G40
Full evidence: `04C_AUTOS_EMPLEOS_FULL_CYCLE.md`, `12B_AUTOS_PARENT_CHILD_AUDIT.md`.

**Autos** → `autos_classifieds_listings`, owner `owner_user_id`, **UUID is the permalink** (no slug),
`leonix_ad_id` prefix `AUTO`. App at `app/(site)/publicar/autos/**`; public+preview at
`app/(site)/clasificados/autos/**` — **a deliberate split, both canonical.**
**Empleos** → `empleos_public_listings` (lane check `quick|premium|feria`), **slug is the permalink**,
`leonix_ad_id` prefix `JOB`. **No parent/child columns → G40 is N-A for Empleos.**

## ✅ G40 AUTOS PARENT/CHILD: **18/18 TRUE, 0 FALSE**
**Autos HAS the parent-visibility gate** — `app/lib/clasificados/autos/autosPublicChildParentVisibility.ts:40-62`,
a self-documented port of the BR gate, enforced at **three** surfaces
(`autosClassifiedsListingService.ts:204-205` results pool · `:493-494` dealer group · `:786-791`
direct detail) **plus** saved search (`saved-search/autos/autosPublicEligibleListing.ts:28`).
**This is WIDER coverage than BR's two enforcement points. NOT an adoption item.**
Caveat (P2 only): the gate is app-layer; RLS (`20260409120000_….sql:39-42`) carries no parent
predicate — but no browser-side anon query exists against that table, so exposure is theoretical.
*Contrast GAP-058: BR's equivalent gate IS bypassed by two related-listing readers. **Autos is the
better implementation and is the reference for fixing BR**, reversing the usual direction.*

## ⚠ CORRECTION TO DOC `01 §5 R9` AND DOC `02` — THE THREE AUTOS BRANCHES: **DISCARD ALL THREE**
`git merge-base --is-ancestor` returned 1 (not-contained) for all 6 commits — **that is a FALSE
NEGATIVE. The content landed on main under different SHAs.** Proof:
| Branch | Finding |
|---|---|
| `autos-privados-preview` | Twin `18bc2b5b` **is on main**; 50 of 53 files byte-identical; the 3 differing files have **MORE** on main (F3 promo concurrency). `autosVehicleJsonLd.ts` and `AutosAnuncioAnalyticsStrip.tsx` are the **SAME BLOBS** (`c903d466` / `227c16d3`) |
| `autos-dealership-before-main-sync` | Local-only confirmed, but `git cherry` marks it **upstream**; twin `29ee58fc`. **Merging it would DELETE `AutosNegociosPreviewEngagementStrip` from the dealer preview** — a regression |
| `autos-location-readiness-micro-patches` | `git diff` vs `origin/main` across all 5 paths is **EMPTY** |

> **METHODOLOGICAL FINDING:** SHA-ancestry is not sufficient evidence of unintegrated work in this
> repository. Content is frequently re-landed under new SHAs. **Every "unintegrated" claim in doc `01`
> must be content-diffed before acting on it** — including the nine `global-*` feeder branches
> (`01 §5 R11`), which were already flagged as an EVIDENCE GAP and are now more likely to be
> already-captured.

## GAP-061 · P0 · EMPLEOS **QUICK** IS ALSO A PAID LANE AND ALSO DOUBLE-CHARGES
**CORRECTION TO `06_DATA_ROUND_TRIP_FIELD_AUDIT.md` §2.10**, which treated Quick as the lesser defect.
`empleosPreviewPaidCheckout.ts:17` defines `EmpleosPaidPublishLane = "quick" | "premium"`, and `:19-43`
gives Quick **the same package and price**; wired at `EmpleoQuickPreviewClient.tsx:99,:152-158`.
**Quick therefore double-charges exactly as Premium does (GAP-039) — this is a second P0, not a P1.**
**PROVEN REFERENCE EXISTS: YES — in-category** · REFERENCE PATH:
`EmpleoFeriaApplicationClient.ts:428` (the feria lane preserves identity correctly) ·
**ACTION: FIX_REGRESSION** (not NET NEW, as `06` implied).

## GAP-062 · P1 · PREVIEW → "VOLVER A EDITAR" DROPS LISTING IDENTITY IN ALL THREE EMPLEOS LANES
`empleosPublishRoutes.ts:22-25` emits only `?from=publicar` — no listing id. **The next save INSERTs a
duplicate row.** This is a *third* independent identity-loss path in Empleos, distinct from GAP-039
(republish) and GAP-061 (quick checkout). **ACTION: FIX_REGRESSION.**

## GAP-063 · P1 · NO VEHICLE-IDENTITY-SUBSTITUTION GUARD
`autosChildIdentityGuard.ts` is **ABSENT from `origin/main`** (BR's equivalent is too). The update path
`autosClassifiedsListingService.ts:236-306` **accepts any payload**, so a child vehicle's identity can
be substituted wholesale. Sept `651abd4e` "protect child listing identity integrity" is the intended
fix and is unmerged. **ACTION: ADOPT EXISTING (merge Sept).**

## GAP-064 · P1 · AUTOS DEALER PARENT ROW EATS A PAID SLOT (9/19 INSTEAD OF 10/20)
`autosDealerInventoryPolicy.ts:48-51`, `app/api/clasificados/autos/listings/route.ts:105`. The
migration from Sept `10618f41` is **absent from main**. Same root cause as GAP-055 (BR) and GAP-021,
now quantified for Autos. **ACTION: ADOPT EXISTING (merge Sept).**

## GAP-065 · P1 · THE EMPLEOS CLIENT-SIDE NO-RECHARGE GUARD IS DEAD CODE
`EmpleoQuickPreviewClient.tsx:56-65` reads params that **no producer ever emits**. Combined with
`activePaidEditCheckoutOwnership.ts` being absent from main (GAP-006/GAP-046), the one-time paid lanes
have **no recharge protection at any layer**. **ACTION: ADOPT EXISTING + FIX_REGRESSION.**

## GAP-066 · P2 · BATCH-4 RESIDUE
`/clasificados/publicar/autos` is a **live duplicate-render shadow route** — no redirect, no canonical —
while **Empleos solved exactly this correctly** at `clasificados/publicar/empleos/page.tsx:27`
(**PROVEN REFERENCE — ADOPT EXISTING**, cross-ref GAP-016) · the empleos shared checkpoint is dead code
(variant gate, hub `:177`) · paid **PREMIUM has no public entry card** · empleos drafts are
sessionStorage-only vs autos localStorage+IndexedDB · **empleos has no saved-search adapter** while
autos has all 7 (cross-ref GAP-031) · feria emits `JobPosting` JSON-LD **for a job fair**.

**`b60801e2` CONFIRMED IN MAIN AND THE FIX SURVIVES** — `dashboardInventory.ts:491` now points
`previewHref` at the real public page. Note this is the **only live protection**: the later component
guard is inert.

### BATCH-4 EVIDENCE GAPS
No live DB/Supabase query (MCP unauthenticated) — migration files only · no runtime or Stripe
execution · no verifier or e2e script run · feria field-level round-trip not swept · empleos
`staged/*` and visibility modules listed but not read · the adoption FALSEs for four matrix rows rest
on **zero-hit greps on canonical symbol names**, which is weaker evidence than a traced consumer.

---

# BATCH 5 — COMMUNITY LANES + VIAJES
Full evidence: `04D_COMMUNITY_LANES_VIAJES_FULL_CYCLE.md`, `05B_..._PATHWAYS.md`.

**FREE vs PAID, settled from `revenuePricingMatrix.ts` (origin/main, 578 LOC):**
| Lane | packageKey | priceCents | billingMode | stripeEligible | lines |
|---|---|---|---|---|---|
| en-venta | `en_venta_free_v1` | 0 | free | false | 375-390 |
| clases | `clases_free` | 0 | free | false | 408-424 |
| **clases** | **`clases_paid_30d`** | **2499** | one_time | **TRUE** | 391-407 |
| comunidad | `comunidad_free` | 0 | free | false | 425-441 |
| mascotas | `mascotas_free` | 0 | free | false | 442-458 |
| busco | `busco_free` | 0 | free | false | 459-475 |
| **viajes** | **`viajes_business_monthly`** | **39900** | monthly_subscription | **TRUE** | 476-491 |
| viajes | `viajes_affiliate` | 0 | affiliate | false | 492-508 |

CHECKOUT/PROMO/STRIPE are **genuinely N-A** for comunidad, mascotas, busco, en-venta, and for clases
(its paid SKU is documented-dormant: `publicar/clases/page.tsx:5`, checkpoints `:499-500`).

**Adoption counts (36 rows/lane) TRUE/FALSE/N-A:** comunidad 22/8/6 · clases 21/9/6 · busco 20/10/6 ·
mascotas 19/11/6 · **en-venta (reference) 26/5/5** · viajes 16/19/1.

**Shared architecture:** all five community lanes use table `listings` (`owner_id`) and the generic
`/clasificados/anuncio/[id]` (2,635 LOC). Their "bespoke-ness" is rendering only, dispatched at
`:1359` busco · `:1384` mascotas · `:1406` clases+comunidad · `:1479` en-venta — **all EARLY RETURNS
before the main body at `:1559`**, which is why `LeonixShareButton` (`:2235`) and
`dispatchConnectionHubCta` (`:2560`) are **unreachable for all five**.

## GAP-067 · P0 · PRODUCTION ADVERTISES A $399/mo VIAJES CHARGE IT CANNOT COLLECT
| Field | Value |
|---|---|
| **EXACT FALSE** | The Owner locked Viajes business as **FREE** on 2026-08-25 (`d1447ae7` + `6d736840`, branch `globalization-release-reconcile-2026-08-14` — **all 5 commits NOT in origin/main**). Production still renders `variant:"paid"`, **"$399.00/mes"**, and a coupon banner: `categoryPublishCheckpoints.ts:786,790,794,801,813,819` → `publicar/viajes/checkpoint/page.tsx:29` |
| WORSE | `viajes_business_monthly` has exactly **4 references repo-wide, none of them a checkout or fulfillment path**; no `revenueViajesFulfillment.ts` exists; `ctaHref` goes straight to the application form |
| NET EFFECT | The platform **advertises a recurring charge and a coupon it can neither collect nor honour** |
| RELATION TO GAP-007 | This **sharpens and supersedes** the earlier "charge without fulfillment" framing: the Owner already decided Viajes is free; main simply never received that decision |
| ACTION | **ADOPT EXISTING** — integrate `globalization-release-reconcile-2026-08-14` |

## GAP-068 · P1 · EVERY FREE COMMUNITY PACKAGE DISPLAYS AS A GENERIC PLAN, NEVER "GRATIS"
`revenueDisplay.ts:108` never tests `billingMode === "free"`, so all six free packages fall through to
the generic "Plan del anuncio" / "Ad plan" label instead of "Gratis" / "Free". **ACTION: FIX_REGRESSION.**

## GAP-069 · P1 · VIAJES NEGOCIO IS NOT SHIPPABLE ON `origin/main`
`clasificados/viajes/negocio/[slug]/page.tsx:42` → `notFound()` unless
`viajesAllowCuratedDemoCatalog()`, and `viajes/lib/viajesPublicInventory.ts` returns **false in
production before reading any opt-in flag**.
**NUANCE — this gate is DELIBERATE, and correctly so.** The source comment states: *"Production never
merges curated sample rows — even if `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1` is set by mistake."*
The defect is **not** the gate; it is that **Viajes has no DB-backed provider resolver on main at
all** — its only data source is `viajesNegocioProfileSampleData.ts:31` (zero `.from()` calls). So the
route is correctly refusing to serve sample data, and there is nothing real to serve instead.
Compounding: the same gate makes `ViajesLowerSections.tsx:18` and `ViajesTopOffers.tsx:20` return
null — and those are the **only producers of negocio links** — so the route is simultaneously
unreachable and 404.
**Docs in 6 places claim the flag enables it in production. That is FALSE** (a seventh instance of
prose contradicting code). **ACTION: see GAP-070.**

## GAP-070 · P1 · THE VIAJES WORKTREE IS MUST-RESCUE — AND MUST BE FORWARD-PORTED, NOT MERGED
`integration/viajes-launch-qa-2026-08` @ `f563cdf3` — **NEVER PUSHED**, 457 commits behind, 46
modified + 8 untracked, **+10,215/−3,488 across 121 Viajes files, ~80 paths existing nowhere else.**
It is the sole home of `resolveViajesProviderProfileFromStagedServer.ts` — **the only DB-backed
provider resolver in existence** — plus the whole `lib/v2/` offer model (10 files), 7 detail
components, 24 publisher files, 2 API routes, and local SEO.
⚠ **FORWARD-PORT, DO NOT MERGE:** the branch predates and therefore lacks
`publicar/viajes/checkpoint/page.tsx` (added by `e8b66da6`); a naive merge would delete it.
**ACTION: OWNER_POLICY_DECISION + FIX_REGRESSION.** *(Cross-ref doc `01 §5 R5` — highest-value
never-pushed work after `leo-final`.)*

## GAP-071 · P1 · EXPIRED COMUNIDAD AND CLASES LISTINGS NEVER EXPIRE
`CommunityListingsResultsClient.tsx:101` is the **sole call site** of the expiry check — there is **no
detail-page gate at all**, and **Clases has none anywhere** despite carrying a live $24.99 SKU.
Cross-ref GAP-014 (the same absence in BR, servicios, restaurantes, comida-local).
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: **Rentas** —
`app/lib/listingLifecycle/resolveListingLifecycle.ts` + `listingLifecycleConfig.ts` ·
**ACTION: ADOPT EXISTING.**

## GAP-072 · P1 · MASCOTAS/PERDIDOS HAS ZERO ANALYTICS AND ZERO REPORT CONTROL
`MascotasPerdidosPublishedDetailPage.tsx:49-51` — the entire detail page is 68 LOC with **no analytics
emitter and no Report affordance**, in **the category most exposed to scam and fraudulent posts**
(lost-pet reward scams). Cross-ref GAP-019.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE CATEGORY: **En Venta / Varios** · REFERENCE PATH:
`app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics.ts` + its Report mount ·
**ACTION: ADOPT EXISTING** — and Sept `245a70f1` already contains this work.

## GAP-073 · P2 · BATCH-5 RESIDUE
`viajesPublicIntegration.ts:29` is a literal TODO no-op (GAP-019) · WhatsApp international-digit gap
still live (`0e2f9b17` unmerged, cross-ref GAP-008) · **four results clients discard the stored
`leonix_lang`** (`BuscoResultsClient.tsx:91`, `CommunityListingsResultsClient.tsx:63`,
`EnVentaResultsClient.tsx:117`, `MascotasPerdidos:66`) · ad-ID prefix drift **`COMM` vs `COM`** ·
`categoryRouteRegistry.ts:1177,:1213,:1269` says `dashboardRoute` null while the categories file
disagrees (**third instance of GAP-035**) · **no `beforeunload` anywhere under `publicar/`**
(cross-ref GAP-056) · no SEO/JSON-LD on 4 lanes · **no migration creates `public.listings`** — the
platform's most-used table has no tracked schema definition.

## 🔑 THE KEY LEVER, QUANTIFIED
**Of the 20 FALSE cells across these six lanes, 6 are ALREADY-WRITTEN CODE sitting on unmerged refs**
— mascotas analytics + report and the `leonix_lang` fix via `245a70f1`; the Viajes free-lane and
business hub via `globalization-release-reconcile-2026-08-14` and the worktree; WhatsApp via
`0e2f9b17`. **Remediation here is INTEGRATION, not implementation.**

### BATCH-5 EVIDENCE GAPS
Static only, no runtime/DB · `public.listings` base schema untracked, columns inferred from
readers/writers · migration **application** state unverifiable read-only (note `6d736840` authors a
migration it deliberately does not apply) · the 2,635-LOC anuncio page and 1,446-LOC
`EnVentaAnuncioLayout` were read by targeted grep, **so errors bias toward under-reporting TRUE** ·
the Viajes worktree's code **quality** was not reviewed — "must-rescue" is a claim about
**irreplaceability**, not quality.
**One Batch-5 evidence gap is already closed:** the agent flagged "59 uncatalogued Sept commits". It
is not so — the divergence is **51 Sept-only / 63 main-only** (`merge-base 7878d856`), the 51 are
fully enumerated in doc `02 §5`, and the 63 are the LEO/Concierge programme.

---

# BATCH 6 — MEDIA / FLYER / PDF + TRUST / REVIEWS / ADDRESS
Full evidence: `15_MEDIA_FLYER_PDF_AUDIT.md`, `13B_TRUST_REVIEWS_ADDRESS_COMPLETION.md`.
*(Renumbered into this ledger's sequence; the source reports use their own local IDs.)*

## ⚠ CORRECTION — GAP-050 IS **REFUTED**
Comida Local **DOES** import the shared media contract
(`comidaLocalPublishValidation.ts:28,:219`). The Batch-2 claim was wrong.
**The real issue is broader and worse:** of 7 call sites, **6 DISCARD the computed set** — only the
dashboard editor persists through it. See GAP-074.

## GAP-074 · P1 · `droppedUnpersistable` IS IGNORED BY 11 OF 11 CALLERS — AND THE SEPT FIX DOES NOT CLOSE IT
| Field | Value |
|---|---|
| ENGINE | `app/lib/media/listingMediaContract.ts:132` (field), `:202` (return) |
| **EXACT FALSE** | **11 call sites across 7 files at `origin/main`; 11 of 11 IGNORE the signal.** The only readers repo-wide are two asserts in `gate-pkgB-media-contract-selftest.ts` |
| **THE SEPT FIX IS NOT USER-FACING** | `bd2ee01e:216-222` adds a **`console.warn` only** — its own commit message and docstring say so. **Users still silently lose uploaded media ON the September branch.** |
| CONSEQUENCE | This defect **SURVIVES THE MERGE**. It is **NET NEW** work, not an integration item |
| PROOF IT IS AN OVERSIGHT, NOT A DESIGN | Every caller already consumes `validate().ok` and returns a user-facing `media_invalid` from **the same object, three lines away** (`servicios/publish/route.ts:286-293`, `restaurantes:292`) |
| WORST CASE | All callers pass `minImages: 0`, so an all-blob input **publishes an EMPTY gallery as SUCCESS** |
| ACTION | **NET NEW** (surface it to the user) — the reference for *how* is the adjacent `media_invalid` path |

## GAP-075 · P0 · EMPLEOS DISCARDS 100% OF UPLOADED PHOTOS
| Field | Value |
|---|---|
| **EXACT FALSE** | The picker reads files via `readAsDataURL` (`EmpleosImageGalleryEditor.tsx:141`), **no upload route exists at all**, and the data is dropped at `buildEmpleosPublishEnvelope.ts:46`. Every photo an employer attaches is lost |
| COMPOUNDING | `mapImagesForPublish` sanitizes **BEFORE** the media contract runs (`:69,:168,:272`), so `droppedUnpersistable` is **ALWAYS EMPTY** for Empleos — **the September fix is a literal no-op for the one category that loses everything** |
| **PROVEN REFERENCE EXISTS: YES** | REFERENCE CATEGORIES: **Clases, Comunidad, Mascotas** — they use the **IDENTICAL editor component** and upload correctly |
| ACTION | **FIX_REGRESSION** |
| BLOCKS OWNER QA | **YES — do not QA Empleos media** |

## GAP-076 · P0 · FOUR EXACT-ADDRESS PUBLIC LEAKS, NOT ONE
GAP-005 identified Ofertas. There are **four**:
| Category | Leak site |
|---|---|
| **Ofertas** | `ofertasLocalesPublicOfferHelpers.ts:137,:150-155` (known) |
| **Clases** | `clasesPublishPayload.ts:69` — **the address is baked into the description text**, so it can never be gated later even if a privacy flag is added |
| **Empleos** | `QuickJobLocationCard.tsx:60-63` |
| **Servicios** | `serviciosProfileSanitize.ts:405-426` |
**ACTION: FIX_REGRESSION** (Clases is the most urgent — its leak is structurally un-gateable).

## GAP-077 · P1 · OFERTAS PUBLIC FLYER IS SEVERELY DEGRADED VS PREVIEW — CLAIM CONFIRMED, WORSE THAN STATED
**PUBLIC** (`OfertasLocalesPublicDetailView.tsx:209-215`): a label plus an **"Open PDF" link only**.
Tap-to-product overlays are **explicitly disabled** at `:160` (`&& !isPdf`). **Zero pdfjs anywhere
under `app/(site)/clasificados/`.**
**PREVIEW** (`OfertasLocalesFlyerViewerModal.tsx`): canvas render `:145-203` · real pdfjs page count
`:97` · page navigation `:355-366` · tap overlays `:227-245` · plus `PdfFlyerPreview.tsx` and
`ofertasLocalesPdfDocumentCache.ts:34`.
**SHARPEST DELTA:** public page-navigation gates on `assets.length` (`:268`) — **FILES, not PAGES** —
so a single 12-page PDF flyer gets **ZERO navigation**. The public user loses 7 capabilities,
including the flyer→product spatial link that Ofertas is built around.
**PROVEN REFERENCE EXISTS: YES — a working implementation in the same category** ·
**ACTION: ADOPT EXISTING.**
Related **P2**: `isPdfAssetHref` (`:54-56`) is `.includes(".pdf")` — false-positives degrade images.

## GAP-078 · P1 · G22 COMMUNITY TRUST ADMIN MODERATION IS UNREACHABLE
`leonixEndorsementAdminActions.ts` has **zero importers**; the sole repo reference is a verifier that
reads the file **as a string** (`verify-globalization-business-hub-trust-03.ts:53`).
Compounding: `can_manage_ads` — the permission it is gated by — **also grants hard-delete on
`public.listings`** (`admin/actions.ts:115-117`), while `can_manage_reports` already exists and fits.
**This is the cheapest high-value fix in the batch: one admin page.** **ACTION: NET NEW (small).**

## GAP-079 · P1 · RESTAURANTES DEFAULTS `showExactAddress: true` WITH NO UI TO TURN IT OFF
Open on **both** `origin/main` and `e3956df8`. **ACTION: FIX_REGRESSION.**

## GAP-080 · P1 · OFERTAS `google_review_url` IS A GHOST COLUMN
Written and read in code, present in **no migration**.
**EVIDENCE GAP:** needs a live schema check — unresolvable from source alone.

## GAP-081 · P1 · PREMIUM BR GETS LESS THAN FREE — RICH CORREO SUPPRESSED
The rich-correo composer is suppressed for **PREMIUM** BR at `EnVentaAnuncioLayout.tsx:1430`.
A paid tier receives less capability than a free one. **ACTION: FIX_REGRESSION.**

## GAP-047 — **RECLASSIFIED**: FIX_REGRESSION, not OWNER_POLICY_DECISION
The zero-importer status of `app/lib/businessAddress/*` was **independently confirmed three ways**
(path, tsconfig alias, bare symbol). Every `businessAddress` hit in `app/` is a coincidental substring
(`businessAddressLine`, `businessAddressLine1`) or a name collision (`normalizePostalCode`,
`normalizeCity`). **1 test-script importer, 0 app importers, 0 components, 0 API routes, no provider.**
The engine even ships `examples/comidaLocalAddressMappingExample.ts` while Comida Local uses a plain
`<input>` (`ComidaLocalApplicationClient.tsx:1276`).
**NEW:** **no `show_exact_address` COLUMN exists in any of the 163 migrations** — the two grep hits
are `detail_pairs` JSON keys.
Sept `3c23e875` covered **5**: Restaurantes, Comida Local, Autos Dealer, BR Negocio, Rentas
Negocio(+Privado). **9 of 17 lanes still lack G23 EVEN ON SEPT; 10 lack the verifier.**
→ Because the adoption work **exists** on an unmerged ref, this is **FIX_REGRESSION**, not an
owner decision. **G23/G24 remain FALSE for all 14 categories on `origin/main`.**

## PER-CATEGORY TRUST/REVIEWS COUNTS
- **G20 Community Trust — the HEALTHIEST system audited.** Public mount **TRUE 5/5**. Owner dashboard 2/5.
- **G21 Google/Yelp — 5 of 15 have anything.** 5 mutually incompatible implementations, 4 field-name
  conventions, **no registry, no DB column**. Dashboard TRUE for exactly **1** (Ofertas, bespoke) —
  which reconfirms GAP-032.
- **G23/G24 — 0 of 14.**

## ZERO-CONSUMER ENGINES — NOW SIX
Adding to the four already listed: **`MediaUploader.tsx`** (0 importers, while **13 forked uploaders
ship**) and **the G22 admin actions** (GAP-078).

### BATCH-6 EVIDENCE GAPS
(a) The Ofertas ghost column needs a **live schema check**. (b) Whether real Ofertas flyers are mostly
PDF determines GAP-077's blast radius. (c) BR/Rentas trust mounts, but paint depends on a runtime
identity fetch that **can 503**. (d) Servicios G21 render is structurally fragile (3 names, 1 field)
but traced correct — marked ⚠, **not** FALSE. (e) Sept commits were read as diffs, not executed.

---

# BATCH 7 — ADMIN OS (G48) CAPABILITY MATRIX
Full evidence: `09_ADMIN_OS_AUDIT.md` (720 lines). Security layer not redone — `09A` cited throughout.
**Matrix (39 capability rows): TRUE 28 · FALSE 10 · N-A 1.** Every TRUE carries a traced import chain;
none was marked TRUE on file existence alone.
**FALSE:** cross-category admin analytics · platform system health · user email/SMS/business
verification · listing expiry write · listing-level ranking · placement management · Stripe
tracking/reconciliation · subscription lifecycle · job applications · Community Trust moderation UI.
**N-A:** ofertas-locales in `adminActionTruth`/Business Hub (locked system, `promoEligible:false`).

**Per-category admin queue coverage: 14/14 categories have a real, guarded, reachable ops queue.**
Two are structurally degraded — **comida-local and ofertas-locales have no variant in
`ClassifiedAdminRowActions.tsx:17-23`**, so no Featured / verify / republish / AI-review, and both are
**100% unaudited**. Separately, **`/admin/clasificados/viajes` (7 pages, top-level nav) is MOCK** —
4 pages render `ADMIN_VIAJES_*_MOCK`; zero `"use server"` or `getAdminSupabase` in the subtree.

## ⚠ CENSUS CORRECTION TO `09A`
Four orphaned **URL-encoded** route files exist —
`app/api/admin/businesses/%5BbusinessId%5D/{advisor,assistant,creative-studio,outcomes}/route.ts` —
literal static segments carrying a Next-14 params signature under Next ^15.5.7. They are guarded, so
**not a security hole**, but they inflate the census.
**Corrected: 78 live admin route files / 47 strong re-verification / 31 coarse-gate.**
(`09A` said 82/51/31.) **No `09A` conclusion changes.**

## 🔑 GAP-001 UPDATE — THE FIX IS ALREADY WRITTEN AND UNUSED
`app/admin/_lib/adminAuthBoundary.ts:44-46` — **`canCreateStaffUsers` already requires
`rosterResolved`**, which is precisely the guard `teamProvisioningActions.ts:35` fails to apply.
**It has ZERO call sites.**
→ **GAP-001 is reclassified from FIX_REGRESSION to ADOPT_EXISTING.** The P0 staff-provisioning
escalation is closed by wiring an existing in-tree helper, not by new engineering.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE PATH: `adminAuthBoundary.ts:44-46` ·
TARGET PATH: `teamProvisioningActions.ts:35`.

## 🔑 `09A` FINDING I UPDATE — SEPT ALREADY HAS THE SELF-REPORT GUARD
`e3956df8:app/admin/actions.ts` contains an `isSelfEngagement` self-report guard (the Wave 3 G26 fix);
`origin/main:app/admin/actions.ts:13-23` does **not**.
→ **`09A` finding I is FIX_REGRESSION / ADOPT_EXISTING (merge Sept), not net-new.** Cross-ref GAP-008.

## GAP-082 · P1 · GRACE-EXPIRY SUSPENSION NEVER RUNS, PLATFORM-WIDE
`app/api/revenue-os/admin/subscription-sweep/route.ts:39` has **ZERO callers**. There is **no
`vercel.json` on `origin/main`**, **zero `"crons"` hits repo-wide**, and **no admin trigger UI**.
The sweep that transitions subscriptions out of grace into suspension is unreachable.
**This compounds GAP-003** — Comida Local has no `LANE_SUSPENSION` entry *and* the sweep that would
act on it never fires. Even the four lanes that DO have suspension entries are never swept.
**ACTION: NET NEW** (a trigger) — cross-ref GAP-030, which is the same missing-scheduler problem for
Saved Search. **One scheduling decision resolves both.**

## GAP-083 · P1 · THE ADMIN COMMAND CENTER IS BLIND TO FIVE CATEGORIES
`adminDashboardData.ts:55` reads 3 sources and `:35` reads 2. `/admin` therefore never surfaces
**restaurantes, servicios, autos, comida-local, ofertas-locales** in its expiring or pending-review
panels. **ACTION: ADOPT EXISTING** (the per-category queues already exist and work).

## GAP-084 · P1 · AN ATTRIBUTED AUDIT LOG ALREADY EXISTS AND THE MAIN ONE DOESN'T USE IT
`admin_audit_log` is actor-less (`adminAuditLogServer.ts:44-48`, cross-ref GAP-023) — **while a
working, fully attributed log exists in the same codebase**: `adminRosterAudit.ts:95-119` →
`admin_roster_audit_log`, with **4 actor columns and foreign keys**.
Additionally, **6 server-action files write zero audit rows**, including comida-local,
ofertas-locales, and `servicios/actions.ts` (3 exports) — so **those two categories are unauditable on
both surfaces**.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE PATH: `adminRosterAudit.ts:95-119` ·
**ACTION: ADOPT EXISTING.**

## GAP-085 · P2 · AUDIT-TRAIL POISONING
`adminRosterAudit.ts:38` resolves the audit **actor** from the email cookie **with no Auth
round-trip** — precisely what `businessWorkspaceAccess.ts:139-142` forbids. An attacker with the
coarse cookie can write audit entries attributed to someone else.
Related: `package-entitlements/actions.ts:409-410` writes a literal `revoked_by_name: "Admin"`.

## GAP-086 · P1 · SIXTEEN MORE HARDCODED CATEGORY LISTS IN `app/admin`
Beyond the five in doc `07`. **There are now THREE independent copy-paste registry families
(a 5-item, a 10-item, and a 6-source), none derived from `CanonicalDbCategory` or
`REVENUE_V1_PACKAGE_MATRIX`.**
| # | Path:line | Symbol / effect |
|---|---|---|
| N1 | `adminUserAds.ts:55` | `SOURCE_ORDER` (6) |
| N2 | `adminAdIdentity.ts:9` | `AdminAdSource` (6) |
| N3 | `adminAdEditSupportMap.ts:38-70` | (6) |
| N4 | `adminUserRollups.ts:76-181` | 6 tables → **`/admin/usuarios/[id]` cannot show comida-local or ofertas-locales listings at all** |
| N5/N6 | `adminDashboardData.ts:35` / `:55` | (2) / (3) — GAP-083 |
| N7/N8 | `payment-tracker/page.tsx:132` (6) / `sales-tracker/page.tsx:143` (5) | **mutually inconsistent** |
| N9 | `PromoCodeRecentCodesPanel.tsx:18-28` | (4) — **omits bienes-raices, which the form on the SAME page can create** |
| N10 | `ClassifiedAdminRowActions.tsx:17-23` | 6 variants — the comida-local/ofertas degradation |
| N11/N12 | `CategoryDetailFieldsEditorBlock.tsx:22-33` / `clasificadosCategoryContentActions.ts:22-33` | `EDITOR_SLUGS` (10) — **verbatim duplicate** |
| N13 | `classifiedsOpsContract.ts:7-14` | 7 kinds, no ofertas |
| N14 | `listingModerationPolicy.ts:185-230` | 5 rule sets |
| N15 | `adminActionTruth.ts:58-79` | see below |
| N16 | `serviciosAdminCanonicalAnalytics.ts:43` | pinned to one `source_table` |

## GAP-087 · P1 · `adminActionTruth.ts` IS **STALE AND DEAD** — 8th PROSE-CONTRADICTS-CODE INSTANCE
1. **Stale (comida-local):** `:47-50` prose ("NO write route at all… only a GET search form") and `:79`
   `NO_WRITE_ROUTE_PIPELINES` are **false** — `comida-local/actions.ts:17` is a real guarded
   (`requireAdminCookie :20`) status writer with `ALLOWED_STATUS :9-15`, wired at `page.tsx:24,:172`.
   **3 of 5 lifecycle statuses are misreported** as `ui_only_no_handler`.
2. **Stale (ofertas):** `:52-55` and `adminListingClassification.ts:66-69` claim no admin write
   surface; `ofertas-locales/actions.ts:58` plus 6 API routes prove otherwise.
3. **Stale (defaulting):** `:106-109` claims unlisted actions default to
   `"intentionally_unsupported"`; `:222`'s `?? {}` actually yields `undefined`.
4. **DEAD — the largest problem.** `adminActionTruth` / `adminListingClassification` /
   `adminStatusAttention` are imported **only by 2 self-test scripts**. **The live UI uses a
   DIFFERENT registry** — `adminOsActionRegistry.ts:15` (22 keys vs 15), wired at
   `ClassifiedAdminRowActions.tsx:15`.
   → A "truth table" that no runtime code reads, whose self-tests pass, and which misdescribes the
   system. **ACTION: FIX_REGRESSION or formally retire.**
*(The DEDICATED/GENERIC pipeline sets in the same file were verified route-by-route and ARE accurate.)*

## MAIN vs SEPT — ADMIN
Sept added **0** admin files since the merge-base; main added **34**. **No Admin capability exists on
Sept and not on main.** The 5 Sept-only `*Actor.ts` adapters were **deliberately replaced**
(`businessWorkspaceAccess.ts:198-215` — "forbidden … see `verify-business-concierge-actor-safety-01.ts`").
Only two Sept behaviours are lost: the self-report guard (above) and the Servicios queue's
`AdminListingMonetizationSummary` column (P2, cross-ref GAP-053).

### BATCH-7 EVIDENCE GAPS (8)
No DB-level verification of any column/RLS/constraint · Server-Action id discoverability for the
unimported endorsement actions (same gap as `09A` finding H) · `%5BbusinessId%5D` build behaviour ·
no viajes affiliate/campaign migration located (migrations not exhaustively swept) · runtime
`ADMIN_ENFORCE_ROSTER_PERMISSIONS` value inherited from `09A` · whether the `admin_audit_log`
migration is applied (the reader **degrades silently** if not) · `sales_rep` path allowlist not
enumerated · the 446 admin file count includes 6 `.md` docs and mock/type files — **126 reachable
pages, 38 server-action files**.

---

# BATCH 8 — NEWSLETTER · SEO · A11Y · PWA · SECURITY/RLS
Full evidence: `03B_NEWSLETTER_SEO_A11Y_PWA_SECURITY.md` (744 lines).

## GAP-088 · P0(conditional) · `service_role` HAS NO DML GRANT ON 45 PRE-CONCIERGE TABLES
| Field | Value |
|---|---|
| CLAIM | On `origin/main`'s migration set, `service_role` holds **no DML grant** on 45 tables — including `listings`, every lane table, and the entire Revenue OS pipeline. Every `getAdminSupabase()` read *and* write would throw **42501**. All ~75 `GRANT … TO service_role` statements in the tree belong to Business Concierge migrations |
| FIX | Exists **only on the Sept fork**: `14a78d46` → `supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql`. **Not in main** |
| ⚠ **HOW TO READ THIS** | The site is live, so it is **implausible that production is actually throwing 42501 platform-wide.** Therefore **one of two things is true, and they have very different remediations:** |
| **(A)** | The grants were **applied to the database out-of-band** (dashboard/psql) and never captured in a migration → **the repository and the live database have silently diverged.** This is itself a **P0 release-integrity defect**: `supabase db reset` cannot reproduce production, and any environment rebuilt from the repo is dead on arrival |
| **(B)** | The migration analysis is incomplete (a grant exists somewhere not swept) → the finding downgrades |
| REQUIRED NEXT STEP | **A single live query settles it** — check `information_schema.role_table_grants` for `service_role` on `public.listings`. This audit had **no DB access** (the Supabase MCP server requires authorization and was unavailable all session) |
| ACTION | **EXTERNAL_SETUP / OWNER_POLICY_DECISION** — verify, then either merge `14a78d46` or capture the out-of-band grants as a migration |

## GAP-089 · P0 · `public.listings` HAS NO TRACKED SCHEMA — CONFIRMED
**No migration creates it. 33 migrations depend on it.** There is no `schema.sql`, no declarative
schema directory, and no `config.toml`. Its **only** definition anywhere is
`scripts/c9-certification-schema-setup.sql:65` — a **test fixture transcribed from a production
snapshot**.
**`supabase db reset` cannot reproduce this database.** The platform's most-used table exists only in
production. (Settles GAP-073.) **ACTION: NET NEW** — capture a baseline migration.

## GAP-090 · P0 · `servicios_public_listings` IS ANON-READABLE WITH NO STATUS GATE
`supabase/migrations/20260402160000:18` — the public SELECT policy is `USING (true)`: **no status
gate, no role clause.** **All five sibling lane tables gate on published/active.**
Draft, rejected, suspended and `pending_payment` Servicios rows therefore appear **anon-readable
straight through PostgREST**.
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: the five sibling lane-table policies ·
**ACTION: ADOPT EXISTING.**
**EVIDENCE GAP:** not yet confirmed with a real anon-key query — but the policy text is unambiguous.

## GAP-091 · P0 · LEAD/SUBSCRIBER CSV EXPORT AND DESTRUCTIVE PATCH BEHIND THE UNSIGNED COOKIE
7 routes. `adminLeadExportAuth.ts:8-14` → `app/lib/supabase/server.ts:70-72`, and
`middleware.ts:80-82` **does not cover `/api/admin/**`**. Full subscriber/lead CSV plus
archive/delete PATCH. `server.ts:56-69` states in its own comment that this is *"not a security
boundary … real identity is always re-verified downstream"* — **here it never is.**
Confirms and sharpens `09A` finding D. **ACTION: ADOPT EXISTING** (`businessWorkspaceAccess`).

## GAP-092 · P1 · 134 TABLES HAVE RLS ENABLED AND ZERO POLICIES
**183 of 186 distinct tables have RLS enabled (98.4%) — but only 49 carry any policy. 134 are
RLS-on / zero-policy.** Of the 23 required tables: 23/23 enabled, **13 with policies, 10 with zero.**
RLS-on with no policy denies all non-service-role access — which is safe *only* while every reader
uses the service role, and that is precisely the pattern GAP-093 flags as unsafe.

## GAP-093 · P1 · PUBLIC READS BYPASS RLS IN 8+ MODULES
Public-facing reads run as **service role**, so RLS is not in force for anonymous visitors.
Worst cases: the Servicios slug read applies **no SQL status filter at all**
(`serviciosPublicListingsServer.ts:182-201`); and the public Servicios render queries **per-user**
`user_liked_listings` / `saved_listings` **with the service role** (`:100-152`).
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: **Comida Local** — `comidaLocalPublicQueries.ts:102-112`
prefers the anon/RLS client · **ACTION: ADOPT EXISTING.**

## GAP-094 · P1 · `listing_analytics` INSERT IS `WITH CHECK (true)`
Anonymous clients can insert analytics rows **directly through PostgREST**, bypassing the canonical
route entirely. Compounds GAP-004 (the legacy browser-direct writer) — the data integrity of
`listing_analytics` cannot be relied upon. Also: `sanitizeAnalyticsMetadata` has **no PII denylist**,
and **28 of 31 event types accept anonymous POSTs**.

## GAP-095 · P1 · TWO MORE PREDICATE HOLES IN THE `listings` ANON POLICY
Beyond GAP-058 (confirmed verbatim): a **raw-vs-`lower(category)` fallback**, and **`NULL is_published`
treated as published** — the same legacy-row loophole the rentas mapper has (cross-ref GAP-014).

## GAP-096 · P1 · NEWSLETTER (G49) IS A FRONT DOOR WITH NO BUILDING BEHIND IT
**No send pipeline** (no campaign/broadcast code anywhere) · **no scheduler** (cross-ref GAP-030/082) ·
**double opt-in is DEAD CODE** — `newsletterVerificationState.ts` has **0 importers** (a 7th
zero-consumer engine) · the **unsubscribe engine is CORRECT but UNREACHABLE**: no email ever emits the
link, and `sendLeonixResendEmail` has **no headers parameter**, so no `List-Unsubscribe` header can be
set. **CAN-SPAM exposure.** **ACTION: NET NEW.**
**Worktree verdict: DISCARD** — `merge-base(origin/main, cd52ffd2) == cd52ffd2`, a strict ancestor,
0 ahead. Content-diffed: the entire Step-5 unsubscribe subsystem exists **only on `origin/main`**; the
30 worktree-only files are all deleted BR-negocio preview mockups, **zero newsletter files**.

## GAP-097 · P1 · SEO (G50) — THE MATRIX
| Signal | Coverage |
|---|---|
| Hub canonical | 8/14 |
| **Hub JSON-LD** | **1/14** (viajes only) |
| BreadcrumbList | 2/14 |
| Detail canonical | 10/14 |
| Detail JSON-LD | 8/14 |
| **hreflang** | **0/14 — and 0 repo-wide**, despite a fully bilingual ES/EN product |
| ItemList | emitted nowhere |
**Root cause for 4 lanes:** comunidad, clases, busco and mascotas are `"use client"` on **line 1**, so
they **cannot export `metadata`** — yet **all four are listed in the sitemap**.
**No canonical builder exists in `app/lib/seo/`.** And `ClassifiedAd` — **not a schema.org type** — is
emitted on the shared detail route for **6 of 14** categories.

## GAP-098 · P1 · ACCESSIBILITY (G51) — ZERO ENFORCEMENT
**No CI at all.** No `jsx-a11y` plugin. **`npm run lint` is AUTOS-ONLY.** The so-called "responsive
gate" verifies **document headings**, not layout. G51 is documented, not enforced.

## GAP-099 · P0 · TWO CONFLICTING PWA MANIFESTS
`app/manifest.ts` (scope `/admin/`) and `public/manifest.webmanifest` (scope `/`) **both claim
`/manifest.webmanifest`**; `app/layout.tsx:25` points at the **static** one.
**PWA verdict:** installable **YES — but staff-only** (scope `/admin/`); all icons are real and
`2506f616` was genuine work. **Offline meaningfully NO** — precache is a single URL (`/offline`);
everything else is network-first by design.
**EVIDENCE GAP:** which manifest actually serves needs a live fetch.

## ⚠ CORRECTION TO GAP-016
The **servicios/restaurantes half is RESOLVED on `origin/main`**: `app/(site)/restaurantes/**` has
0 files and `app/(site)/servicios/page.tsx` is absent. The earlier finding was read from the **stale
tree**. **The autos half IS still live** (`clasificados/publicar/autos/page.tsx:3`).
*Note for reconciliation: the G28 stream described a `/results` vs `/resultados` re-export inside
`clasificados/`, while this batch describes top-level `(site)/servicios` and `(site)/restaurantes`
directories. These may be two different duplications. **Treat the autos shadow route as confirmed and
re-check the `/results` pair before acting.***

### BATCH-8 EVIDENCE GAPS
Which manifest actually serves at `/manifest.webmanifest` · whether real PII is in
`listing_analytics.metadata` today · `public.listings`' actual columns · **whether `14a78d46` was
applied out-of-band** (GAP-088 — the decisive question) · live grants on the 3 RLS-off tables ·
GAP-090 not yet confirmed by a real anon-key query · runtime behaviour of the `%5B` routes.

---

# BATCH 9 — ORPHANS · DUPLICATES · REPOSITORY ORGANIZATION
Full evidence: `16_ORPHANED_DUPLICATE_UNINTEGRATED_WORK.md`, `20_REPOSITORY_ORGANIZATION_MAP.md`.
Method: a whole-repo static reachability graph — **23,770 import edges, 4,242 app `.ts`/`.tsx` files,
BFS from 695 Next entry points.** It independently re-found every orphan already in this ledger.

## 🔴 GAP-100 · P0 · MIGRATION TIMESTAMP COLLISION — **BLOCKS THE SEPT MERGE**
```
Sept: supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql
Main: supabase/migrations/20260909120000_business_ownership_claim_foundation.sql
```
**Identical timestamps. Apply order is undefined.** One of these is the fix for GAP-088 (the
`service_role` DML grants). **Rename before merging** — this is a hard prerequisite for the
reconciliation plan in doc `22`.
**6 Sept-only migrations exist, 5 of them previously unrecorded by this audit:** comida-local reviews
URL · ofertas runtime schema **reconciliation** · autos `leonix_ad_id` **reconciliation** · parent
inventory capacity-counting **fix** · `service_role` DML grants global **fix**.
Note `C9_MIGRATION_CERTIFICATION_CLOSURE.md` hit the grants issue and **deliberately left it out of
the frozen migration** — so GAP-088 branch (A) is now the more likely reading.

## ✅ GAP-101 · CLOSED · THE NINE FEEDER BRANCHES ARE **ALREADY CAPTURED**
**11 of 11 already captured. Zero unintegrated. Zero mixed.**
`git merge-base --is-ancestor` returned FALSE for **all 11 — 11/11 false negatives**, exactly as the
Batch-4 methodological warning predicted. Proof used instead: **10 of 11 tips have a byte-identical
root tree SHA to a commit that IS an ancestor of main**; the 11th's own 6 feature files diff to zero
against its twin. All were re-landed under renamed "Saved Search 0N" / "Globalization Build 0N"
subjects, and **main is a full stage beyond them** (`6b155cf3` Build 05).
The alarming `--stat` was 32 legacy BR-negocio files that main **deleted**, plus superseded older
revisions inside modified files.
→ **Doc `01 §5 R11`'s EVIDENCE GAP is CLOSED. These nine branches are safe to archive.**

## GAP-102 · P2 · 434 FILES ARE DEAD TO EVERYTHING; 35 MORE LIVE ONLY BECAUSE A VERIFIER IMPORTS THEM
**469 of 4,242 app files (11.1%) are unreachable from any route.** Net new confirmed-dead ≈ **394**.
Notable: `translation/providers/*` forked and dead (637 LOC — the live route uses `provider.ts`,
singular) · `siteBlocks/*` forms a **closed 3-node dead cycle** · the Leo tool bus is dead **and 5
verifiers are falsely green on it** · `categoryStandard` V1 (10 files) fully superseded by V2 (17
files, 0 dead) · `autos/landing` is **17 of 19 dead**, `servicios/landing` **14 of 18** ·
`entitlementRedemption` + `entitlementActivationContract` have 0 importers · saved-listing-identity
is **3 of 4 dead**, not 1 of 4 · `app/data/classifieds` is **nested inside itself four levels deep,
with a `.bak` at each level**.
**3 zero-importer `"use server"` modules** remain a callable-surface risk (same class as `09A` finding H).
**⚠ REFINEMENT, not contradiction:** `businessAddress/*` and `sharedConnectionHubContactModel` are
**script-only — verifier-reachable, route-unreachable.** GAP-047/GAP-015 said "0 app importers,
1 test-script importer", which is consistent. **Prefer the phrase "route-unreachable" going forward.**

## 🔴 GAP-103 · P1 · THE VERIFIER ESTATE IS LARGELY THEATRE — **836 STRING-ASSERTING GATES, NOT 4**
| Measure | Value |
|---|---|
| String-asserting verifier scripts | **836 — 79% of `scripts/`** |
| npm scripts that are "gates" | **97% of 610** |
| `.includes("Symbol")` assertion lines | 1,591 |
| `assert.match` lines | 2,010 |
| Gates asserting an **orphaned** component name | **85** (24 distinct orphans "verified") |
| Gates certifying **markdown prose** | 66 |
| Gates asserting they are themselves in `package.json` | 1 |
| **Gates PROVABLY RED** (symbol exists only inside the gate) | **2** — `verify-servicios-dashboard-truth.mjs:12`, `ofertas-locales-offer-hub-audit.ts:226` |
| Scripts wired to nothing | **469 of 1,037** |
| **Gates `test:gates` actually runs** | **5 of ~792** |
`e2e/` (33 specs) is **clean** — it is the one trustworthy test surface.
**This explains how the platform accumulated 22 P0s while its own certification docs read green.**
**ACTION: OWNER_POLICY_DECISION** — this estate needs deletion or conversion to behavioural tests.

## GAP-104 · P1 · 230 OF 230 DOCS ARE STALE (100%)
**Zero files under `docs/` were touched on or after 2026-09-08.** **58 assert
COMPLETE / CERTIFIED / 100% / CLOSED in a heading.** All 6 misplaced root architecture docs are stale
(`AGENTS.md` 2026-03-31; the four `LEONIX_*` 2026-04-29; `README.md` 2025-12-02).
**Also: 446 `.md` files live INSIDE `app/` — nearly 2× the size of `docs/` — and 66 gates assert
against them.** This is the mechanism behind all nine prose-contradicts-code instances.

## GAP-105 · P2 · ≈428 COMMITTED BUILD ARTIFACTS
All 9 root items confirmed (`globalization-build.log` **98 KB**, `dev-out.log`, `build-out.log`,
`build-b31.log`, 3× `build-agent-log*.txt`, `README.txt`, `_MANIFEST/`).
**Playwright configs: 17, not 12** (16 one-offs, 9 wired to nothing).
**NEW:** `qa-final-screenshots/` **382 files** · `qa-smoke-screenshots/` 14 ·
`tmp/rentas-sample-content-report.json` · `e2e manual-qa-seed-output.json` ·
`RestauranteDetailShell.tsx.backup` · `page_temp.tsx` · 4× nested `sampleListings.ts.bak`.

## ⚠ SECOND CORRECTION TO GAP-016 — AND A NEW ONE
**The servicios/restaurantes `/resultados`-vs-`/results` duplication IS FIXED** —
`next.config.ts` now carries **14 permanent redirects**. Both this batch and Batch 8 independently
corrected the original finding, which came from the stale tree. **7 dead-behind-redirect files remain.**
**STILL LIVE:** `/clasificados/publicar/autos` (no redirect, no canonical) — **CONFIRMED**.
**NEW UNFIXED DUPLICATE: VIAJES** — a 1-line re-export with no redirect and no canonical;
`F2_FINAL_FIX_BUILD_CLOSURE.md:40` **admits it**.
Resolved as harmless: `coupons→cupones` and `contact→contacto` are correct redirect shims;
`app/contact/[slug]` is an unrelated feature, **not** a triplicate.
**`coming-soon` / `-live` / `-v2` are three live divergent pages — only the 703-line legacy one is
indexable.**

### BATCH-9 EVIDENCE GAPS
1. **Reachability is STATIC.** A module loaded via a runtime-computed string, or a server action
   invoked by action-id without an import, reads as dead. Confirming needs a `.next/` build artifact,
   which is not in the repo — **the same limit that blocked `09A` finding H.**
2. The 3 zero-importer `"use server"` modules could not be proven unreachable-by-action-id.
3. **Basename collisions bias every orphan count DOWNWARD — ≈394 is a floor, not a ceiling.**
4. No CI config (`.github/`, `vercel.json`) exists at `origin/main`, so whether the 469
   npm-unreferenced scripts run in CI is unverified.
5. **The "13 forked media uploaders" figure was carried forward, not re-derived** — a filename sweep
   found only 3 obvious ones, so either the other 10 are named differently or the figure is inflated.
   **Treat "13" as unproven.**
6. Inbound-link exposure of the 7 dead-behind-redirect routes needs analytics/GSC.
7. `eslint ignoreDuringBuilds: true` and lint scoped to 3 of ~18 categories — **real lint debt is
   unmeasured.**

---

## SUMMARY — ALL 9 BATCHES COMPLETE

| Severity | Count |
|---|---|
| **P0** | **23** |
| P1 | 58 |
| P2 | 21 |
| P3 | 3 |
| P4 | 1 |
| **TOTAL LOGGED** | **106 open + 1 closed (GAP-101)** |
| Refuted during the audit | GAP-050 |
| Corrected during the audit | GAP-016 (twice), GAP-001, GAP-047, `09A` finding I, doc `01 §5 R9`, doc `01 §5 R11` |

### ⚠ THE SINGLE BIGGEST EVIDENCE GAP IN THIS ENTIRE AUDIT
**No database access was available at any point.** The Supabase MCP server
(`plugin:supabase:supabase`) requires authorization and this session is non-interactive, so it could
not be used. **Every finding is source-level.**
Five P0s are wholly or partly contingent on a live check, and **each can be settled by a single
query**:
| Gap | The one query that settles it |
|---|---|
| GAP-088 `service_role` grants | `information_schema.role_table_grants` for `service_role` on `public.listings` |
| GAP-089 `public.listings` schema | `\d public.listings` — capture it as a baseline migration |
| GAP-090 servicios anon SELECT | anon-key `select * from servicios_public_listings where status <> 'published'` |
| GAP-080 Ofertas ghost column | does `ofertas_locales.google_review_url` exist? |
| GAP-099 which manifest serves | `curl -I https://<host>/manifest.webmanifest` |
**Recommend the Owner authorize the Supabase connector (claude.ai connector settings, or `/mcp` in an
interactive session) and re-run just these five checks before acting on GAP-088.**

### 🔑 THE DOMINANT THEME: THE FIX IS USUALLY ALREADY WRITTEN
Across 89 gaps, the recurring shape is **not** "this was never built". It is **"this was built, and
nothing calls it."** Confirmed instances where a working implementation exists in-tree and is unused:
| Defect | The fix that already exists, unused |
|---|---|
| GAP-001 P0 staff-provisioning escalation | `adminAuthBoundary.ts:44-46` `canCreateStaffUsers` — **zero call sites** |
| GAP-084 actor-less audit log | `adminRosterAudit.ts:95-119` → `admin_roster_audit_log`, 4 actor cols + FKs |
| GAP-075 Empleos loses 100% of photos | Clases/Comunidad/Mascotas use the **identical editor** and upload correctly |
| GAP-077 Ofertas public flyer degraded | `OfertasLocalesFlyerViewerModal.tsx` — full impl, same category |
| GAP-048 Servicios duplicate rows | Comida Local `publish/route.ts:132`, Restaurantes `:325` — durable `draft_listing_id` |
| GAP-018 Restaurantes loses paid placement on sort | Servicios `serviciosResultsFilter.ts:874-879` sorts within buckets |
| GAP-058 BR child-parent gate bypassed | **Autos** `autosPublicChildParentVisibility.ts:40-62` — 3 enforcement points vs BR's 2 |
| GAP-066 autos shadow route | Empleos solved it at `clasificados/publicar/empleos/page.tsx:27` |
| GAP-072 mascotas no analytics/report | **En Venta** `enVentaGlobalAnalytics.ts` |
| GAP-071 comunidad/clases never expire | **Rentas** `resolveListingLifecycle.ts` + `listingLifecycleConfig.ts` |
| GAP-032/034/047/078 + 2 more | six confirmed **zero-consumer global engines** |

**This is an INTEGRATION problem far more than an ENGINEERING problem** — which is exactly what the
Owner suspected at the outset, and it holds across every system audited.

### WHAT THE THREE-WAY MERGE DOES **NOT** FIX — the NET NEW list
Merging Sept + the BR branch is necessary and still leaves these. They are genuinely new work:
| Gap | Why the merge misses it |
|---|---|
| GAP-074 media `droppedUnpersistable` | Sept's fix is **`console.warn` only** — users still lose media silently on Sept |
| GAP-075 Empleos discards 100% of photos | No upload route exists at all; Sept's warn is a **literal no-op** here (sanitize runs first) |
| GAP-039/061 Empleos identity fork + double charge | No commit on any branch addresses it |
| GAP-078 G22 trust moderation unreachable | Never built a page |
| GAP-020 six missing analytics event types | Types don't exist in TS or the DB CHECK |
| GAP-030 saved-search retry trigger | No scheduler exists anywhere; **no `vercel.json` in the repo** |
| GAP-056 BR-CHILD leave guard | Covered by no commit on any branch |
| GAP-001 `teamProvisioningActions.ts:35` | Present on both refs |

### THE THREE-WAY MERGE IS NOW MANDATORY, NOT OPTIONAL
| Branch | Status | Verdict |
|---|---|---|
| `origin/main` `a0a47839` | ships today | carries all 13 P0s |
| `fix/globalization-final-closeout-2026-09` `e3956df8` | 51 commits, pushed | **MERGE FIRST** — 0-file conflict with main |
| `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` `0d80e891` | 32 commits, **+3364/−786**, pushed | **MUST-MERGE, SECOND** — all 5 sampled defects verified LIVE on main, **zero supersession**; 20-file conflict with Sept, resolve with Sept semantics winning on the reverse mappers |

### THE ZERO-CONSUMER ENGINE PATTERN — now confirmed FOUR times
This repository repeatedly contains a global engine that is **built, documented, verified by scripts,
and imported by nobody**. Treat any "the engine exists" claim as unproven until an importer is traced.
| Engine | Path | Importers |
|---|---|---|
| Shared Business Hub contact model | `sharedConnectionHubContactModel.ts:81` `buildSharedConnectionHubContact` | **0** (GAP-015) |
| **Address verifier / privacy (G23/G24)** | `app/lib/businessAddress/*` | **0 repo-wide** (GAP-047) |
| Dashboard route resolver | `categoryRouteRegistry.ts` `dashboardRoute` (all 17 adapters) | **0** (GAP-034) |
| Servicios saved-listing identity | `app/lib/serviciosSavedListingIdentity.ts` | **0** (GAP-051) |

| Required action | Gaps |
|---|---|
| RECONCILE_MAIN_AND_GLOBALIZATION (merge the Sept seal) | 002, 003, 005, 006, 008(part), 021 |
| FIX_REGRESSION | 001, 008(part), 016, 035, 039(part), 042, 043, 044, 045 |
| ADOPT_EXISTING_ENGINE | 004, 010, 014, 018, 030, 031, 032, 033, 034, 037, 039(part), 040, 041 |
| OWNER_POLICY_DECISION | 007, 011, 012, 013, 015, 036 |
| NET NEW | 020 (six missing analytics event types) |
| OTHER / P3 archive candidates | 017, 019, 022–029, 038 |

**Gaps resolved by merging the Sept seal alone: 6 — including 2 of the 10 P0s.**
**Gaps resolvable by ADOPTING AN EXISTING IN-TREE REFERENCE: 13.**
**Genuinely NET NEW work: 1.**

> ⚠ **THE SEPT MERGE IS NECESSARY BUT NOT SUFFICIENT.**
> It repairs **2 of the 8 destructive dashboard-edit lanes**. Six remain after the merge:
> rentas privado · BR inventory child · autos dealer child · empleos premium · empleos quick ·
> servicios · ofertas (pre-approval). **Do not treat "merge Sept" as closing the P0 data-loss class.**

*Batches remaining: 4–9 (Batch 1 done; 2–3 in flight). This summary is updated as each batch lands.*
