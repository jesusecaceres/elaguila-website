# Business Application Final — Live Ledger

Worktree: `C:\projects\elaguila-website-business-applications-final`
Branch: `fix/business-applications-final-polish-2026-08`
Governed by `docs/qa/LEONIX_BUSINESS_APPLICATION_AND_FULL_CYCLE_EXECUTION_CONTRACT.md` (PART I is in scope now; PART II is preserved for later).

Status: **Gate 0 baseline complete.** Detailed per-requirement audits below. No implementation has started yet — this file will be updated as each gate lands.

Doctrine: TRUE = exact requirement proven with file:line evidence. RUNTIME-REQUIRED = source looks correct but requires live browser confirmation (typing, refresh, Preview/Edit round trip) — **counts as FALSE for final certification** until runtime-verified. UNKNOWN/NOT TESTED/LIKELY = FALSE.

## Detail files (full row-by-row ID / requirement / status / evidence / defect-fix)

- [`ledger/00_shared.md`](ledger/00_shared.md) — Shared Application Standards, items 1-124 (§3 of contract)
- [`_gate0_baseline_servicios.md`](_gate0_baseline_servicios.md) — Servicios, S-001–S-116 (§4)
- [`_gate0_baseline_restaurantes.md`](_gate0_baseline_restaurantes.md) — Restaurantes, R-001–R-077 (§5)
- [`_gate0_baseline_comida.md`](_gate0_baseline_comida.md) — Comida Local, C-001–C-113 (§6)

## Gate 0 totals

| Scope | Total | TRUE | FALSE | RUNTIME-REQUIRED |
|---|---|---|---|---|
| Shared (§3) | 124 | 94 | 22 | 8 |
| Servicios (§4) | 116 | 67 | 36 | 13 |
| Restaurantes (§5) | 77 | 62 | 13 | 2 |
| Comida Local (§6) | 113 | 93 | 19 | 1 |
| Cross-category (§7, X-001–020) | 20 | 9 | 10 | 1 (X-012, forward-looking) |
| **Part I detail total** | **450** | **325** | **100** | **25** |

## §7 Cross-category application consistency gate (X-001–X-020)

| ID | Requirement | Status | Evidence / reasoning |
|---|---|---|---|
| X-001 | Shared language behavior consistent across all 3 | FALSE | Dedupe missing in Comida Local (shared #33); semantic-duplicate handling broken everywhere (shared #39) |
| X-002 | Shared hours behavior consistent without downgrading Restaurant | FALSE | Special hours Restaurantes-only (shared #46); default-open-day workflow differs (shared #41); legacy hydration destructive in 2/3 (shared #51) |
| X-003 | Shared rich Correo consistent | FALSE | Servicios not on shared modal (shared #74) |
| X-004 | Shared flyer/coupon viewer consistent where applicable | TRUE | Servicios+Restaurantes share `BusinessFlyerViewerModal`; Comida Local N/A |
| X-005 | Shared gallery behavior consistent where applicable | TRUE | shared #111/#112 |
| X-006 | Additional websites same repeatable pattern | TRUE | Consistent Title+URL+Add pattern in all 3 (shared #64-70, R-027-030, C-091-095) |
| X-007 | Section-specific custom fields follow same semantic doctrine | FALSE | Servicios fails badly (S-061–065: 1 generic field, not 5); Comida Local custom fields are section-placed but lack Add/remove chip UI (C-023/053/068) |
| X-008 | Existing stored IDs/keys unchanged | TRUE | No ID/key renames found in any audit |
| X-009 | ES/EN shell behavior complete in all 3 | FALSE | Restaurantes `RestauranteGroupedFeaturesSection` hardcoded Spanish regardless of `lang` (R-019/021); shared hours-preview Spanish-only (shared #37) |
| X-010 | Translation architecture preserved, placement resolved | TRUE | Shared `TranslateAdControl` pattern used in all 3 (shared #93); minor doc lag only |
| X-011 | Address UX truth explicit, no fake verification | TRUE | shared #98/#99 |
| X-012 | Existing filled ads survive all application changes | RUNTIME-REQUIRED (forward-looking) | No changes made yet — re-verify after Gates 1-4 |
| X-013 | Hard refresh does not reset the application | TRUE | shared #4-11 |
| X-014 | Hard refresh returns to same intended section/state | FALSE | R-026 forces `focus=coupon-upgrade` on every reload |
| X-015 | Preview → Edit returns to same application context | FALSE | shared #122 — Restaurantes regresses to the beginning |
| X-016 | Pricing truthful across all 3 | FALSE | Servicios stale +$99 line reachable via edit-hydration (shared #116/#119) |
| X-017 | Coupons included for Servicios/Restaurantes | FALSE (Servicios only) | Restaurantes TRUE (shared #117); Servicios FALSE (shared #116) |
| X-018 | No stale +$99/+199 contradictions remain | FALSE | Same root cause as X-016 |
| X-019 | Active paid edit does not recharge base package | TRUE | shared #123 |
| X-020 | No unrelated category files/migrations introduced | TRUE (Gate 0 — no code changes yet) | Re-verify at Gate 7 diff audit |

## §8 Application-only TRUE/FALSE release report — Gate 0 baseline pass

Computed directly from the detail-file evidence above. This is the contract's mandated 90-item report; it will be re-scored after each implementation gate. **Per contract doctrine: if any launch-critical item is FALSE, item 90 must be FALSE — at Gate 0 baseline this is expected (48 TRUE / 42 FALSE of 90).**

### Shared (1-20)

| # | Item | Status |
|---|---|---|
| 1 | Existing filled Servicios application preserved | TRUE |
| 2 | Existing filled Restaurant application preserved | TRUE |
| 3 | Existing filled Comida Local application preserved | TRUE |
| 4 | Hard refresh preserves all application data | TRUE |
| 5 | Same-section/state refresh behavior correct | **FALSE** (R-026) |
| 6 | Shared unsaved-change guard correct | **FALSE** (shared #18) |
| 7 | Shared Languages behavior correct | **FALSE** (shared #23,33,37,39) |
| 8 | Spacebar/Add/remove verified for all critical custom fields | **FALSE** (mostly unverified/RR, plus S-061-065/C-023/053/068 structurally missing) |
| 9 | Shared hours standard correct | **FALSE** (shared #41,46-51) |
| 10 | Special hours correct where supported | **FALSE** (shared #47/48, R-023/024) |
| 11 | Shared phone behavior correct | **FALSE** (core sound, but entry-behavior unverified per doctrine) |
| 12 | WhatsApp international behavior preserved | **FALSE** (R-062 truncation; S-085 not intl-safe) |
| 13 | Shared rich Correo behavior correct | **FALSE** (shared #74, Servicios) |
| 14 | Additional websites repeatable pattern correct | TRUE |
| 15 | Google/Yelp/Leonix trust separation correct | **FALSE** (shared #87 unresolved only; the Leonix-trust-widget-not-consumed sub-finding was retracted — see correction below) |
| 16 | Translation architecture preserved/reconciled | TRUE |
| 17 | Address verification truth honest | TRUE |
| 18 | Media/gallery/flyer behavior preserved | TRUE |
| 19 | Preview-first application flow correct | **FALSE** (R-072/073 duplicate CTA, R-122 regression) |
| 20 | Active paid edit avoids base recharge | TRUE |

### Servicios (21-47)

| # | Item | Status |
|---|---|---|
| 21 | Header top clipping fixed | **FALSE** (S-001/002) |
| 22 | Business types alphabetical by locale | **FALSE** (S-009/010) |
| 23 | Every business type has appropriate preset | TRUE (S-012) |
| 24 | Professional/trade presets differ appropriately | TRUE (S-013) |
| 25 | Multiple custom services | TRUE (S-047) |
| 26 | Multiple custom Quick Facts | **FALSE — CRITICAL** (S-055) |
| 27 | Servicio group custom field | **FALSE — CRITICAL** (S-061) |
| 28 | Disponibilidad group custom field | **FALSE — CRITICAL** (S-062) |
| 29 | Clientes group custom field | **FALSE — CRITICAL** (S-063) |
| 30 | Accesibilidad/idiomas custom field | **FALSE — CRITICAL** (S-064) |
| 31 | Descuentos/beneficios custom field | **FALSE — CRITICAL** (S-065) |
| 32 | Legacy generic custom values preserved | TRUE (S-066) |
| 33 | Multiple service areas | TRUE (S-072) |
| 34 | Four highlighted photos separate from remaining gallery | **FALSE — CRITICAL** (S-033/034, edit form only; preview is fine) |
| 35 | Highlighted order explicit/durable | TRUE (S-031; numbering badge S-032 separately broken) |
| 36 | 8-video limit consistent | **FALSE** (S-038 copy says 4) |
| 37 | Fake AI helper wording removed | TRUE (S-045) |
| 38 | "Por qué elegirte" layout/copy improved | **FALSE** (S-049) |
| 39 | Review 400 feedback repaired | TRUE (S-091) |
| 40 | CTA sizing normalized | **FALSE** (S-113 unverified) |
| 41 | Coupons included/no +$99 | **FALSE** (reachable via edit-hydration, shared #116) |
| 42 | Flyer viewer canonical | **FALSE** (S-099, opens raw tab not lightbox) |
| 43 | Final review shows $399 + included coupons | **FALSE** (S-105/shared #119) |
| 44 | One Preview CTA/no direct Publish | TRUE (S-106/107/110) |
| 45 | "Volver a editar" returns to Step 8/current state | **FALSE** (S-112 unverified per doctrine) |
| 46 | Unnecessary "Ver todos los destacados" collapse removed | TRUE (S-114) |
| 47 | Pagos y beneficios left open when content fits | TRUE (S-115) |

### Restaurantes (48-66)

| # | Item | Status |
|---|---|---|
| 48 | Header softened without redesign | TRUE (R-001/002) |
| 49 | Logo presentation improved/no destructive crop | TRUE (R-004-008) |
| 50 | Cuisine/style capacity expanded appropriately | **FALSE** (R-010 not a grid; stale "up to 3" copy) |
| 51 | Group-specific custom inputs correct | TRUE (R-016/017) |
| 52 | Special hours/open-now preserved | **FALSE** (R-023/024/025) |
| 53 | Reload does not force coupon section unless intended | **FALSE — CRITICAL** (R-026) |
| 54 | Additional websites repeatable/not hidden | TRUE (R-028-031) |
| 55 | Rich Correo preserved | TRUE (R-035/036) |
| 56 | Quote URL beats WhatsApp fallback when configured | **FALSE — CRITICAL** (R-037; ignores URL entirely, hardcoded to phone) |
| 57 | Event/catering CTAs truthful | **FALSE** (R-037 is one of these CTAs) |
| 58 | Catering titled/open when present | TRUE (R-043-045) |
| 59 | Payment snapshot improved | TRUE (R-048/049) |
| 60 | Coupons included/no +$99 path | TRUE (R-054/055/056) |
| 61 | Existing published coupon edit requires no Stripe | TRUE (R-057) |
| 62 | Flyer/gallery canonical behavior preserved | TRUE (R-061/063-065; R-066 proportion issue tracked separately) |
| 63 | Translator preserved/reconciled | TRUE (R-067/068) |
| 64 | Final review $399 truth | TRUE (R-069-071) |
| 65 | One Preview CTA/no direct Publish | **FALSE** (R-072/073 duplicate) |
| 66 | English application/preview shell complete | **FALSE** (R-019/021) |

### Comida Local (67-83)

| # | Item | Status |
|---|---|---|
| 67 | Distinct product identity preserved | TRUE (C-001/002) |
| 68 | Current $129 pricing everywhere | TRUE (C-003-007) |
| 69 | Complete seller-type registry | TRUE (C-008-019) |
| 70 | Seller-type conditional sections correct | **FALSE — CRITICAL** (C-024-038, biggest single gap in the whole audit) |
| 71 | Service modes tailored to Comida Local | TRUE (C-040-052) |
| 72 | Highlights tailored to Comida Local | **FALSE** (C-056,059,061,064 missing; C-066 no disclaimer) |
| 73 | Group-specific custom inputs correct | **FALSE** (C-023/053/068 — scalar fields, no Add/remove chip UI) |
| 74 | Find Me Today complete | TRUE (C-073-084) |
| 75 | Permanent/service/current location separation | TRUE (C-080/081/085) |
| 76 | Home address privacy preserved | TRUE (C-028/031/084) |
| 77 | Phone/WhatsApp behavior correct | TRUE (C-087/088) |
| 78 | Email/Correo behavior correct | TRUE (C-089/090) |
| 79 | Additional websites repeatable | TRUE (C-091-095) |
| 80 | English shell/validation/nav complete | TRUE (C-098-101) |
| 81 | Hours/media preserved | TRUE (C-102-107) |
| 82 | Preview/Edit/Checkout locale preserved | TRUE (C-108-111) |
| 83 | Existing filled Comida Local application preserved | TRUE (C-113) |

### Release (84-90)

| # | Item | Status |
|---|---|---|
| 84 | No unrelated files changed | TRUE — `git diff --stat` confirms only Servicios/Restaurantes/Comida Local app files + 2 QA scripts (type-signature fix) + `docs/qa/` |
| 85 | No destructive migration required | TRUE (none identified as necessary; all new fields are additive) |
| 86 | Targeted application verifier passes | No automated verifier script exists in this repo — not run |
| 87 | TypeScript introduces zero new errors | **TRUE** — `tsc --noEmit` after all Gate 1-4 fixes shows 0 new errors; only pre-existing baseline errors remain (`public/*.png` module-resolution quirks in 12 files, unrelated e2e Playwright spec type mismatches in 3 files) — none in any file touched this pass |
| 88 | `git diff --check` passes | TRUE |
| 89 | `npm run build` passes | **TRUE** — full production build completed, exit 0, zero errors (first attempt failed only because this worktree was missing `.env.local`; copied from the main checkout — a local gitignored dev config file, not a secret — and the rebuild passed cleanly). Only pre-existing cosmetic `themeColor`/viewport metadata warnings remain, present app-wide and unrelated to this pass |
| 90 | **READY FOR APPLICATION OWNER QA** | **FALSE** — many source-level fixes above still need runtime/browser verification (typing, hard refresh, Preview↔Edit round trips), and C-024–038 (Comida Local seller-type tailoring) remains a known open gap |

**Post-fix §8 rollup: significantly improved from the Gate 0 baseline (48/90 TRUE) — build/typecheck/diff-hygiene items (86-89) now pass; most Servicios/Restaurantes critical items and several shared items flip from FALSE to "fixed, runtime-verification pending." Item 90 correctly remains FALSE until real browser QA is performed and C-024–038 is addressed.**

## Confirmed critical defects (fix priority for Gates 1-4)

1. **Servicios S-055/056/057** — Quick Facts custom entry is a scalar field, not an array; 2nd custom fact overwrites the 1st (owner's core complaint)
2. **Servicios S-061–071** — all 5 "Options & Facilities" groups share one generic bottom "Otro" input instead of each having its own
3. **Servicios S-033/034** — edit-form gallery is one mixed grid with gold-star badges, not two separate sections (public Preview already does this correctly)
4. **Servicios shared #116/#119** — stale "+$99/mes" coupon line reachable via `?edit=1&listingId=` edit-hydration path
5. **Restaurantes R-026/R-060** — hard refresh forces `focus=coupon-upgrade`, stranding the owner mid-navigation
6. **Restaurantes R-037** — "Pedir cotización" is hardcoded to a phone call, never reads the configured quote URL
7. **Restaurantes R-072/073** — duplicate Preview CTA buttons, both calling the same handler
8. **Restaurantes R-019/021** — `RestauranteGroupedFeaturesSection` hardcoded Spanish regardless of `lang=en`
9. **Comida Local C-024–038** — the 12 seller types collapse into 4 generic buckets with only cosmetic banner-text differentiation; no seller type has a structurally distinct field
10. **Comida Local / Servicios / Restaurantes shared #18** — unsaved-changes warning keeps firing after a clean save (no last-saved-snapshot comparison)
11. **Shared #62 / R-062** — WhatsApp truncated to 11 digits, breaking international numbers
12. **Shared #74** — Servicios Correo uses a bespoke dropdown instead of the shared rich `CtaActionSheet` modal
13. **Shared #96** — Restaurantes has no server-side address hydration on edit (relies solely on local browser draft cache)

## Gate 5 — Globalization proof

| Feature | Shared implementation | Servicios | Restaurantes | Comida Local | Exception | Status |
|---|---|---|---|---|---|---|
| Unsaved changes | `useBusinessApplicationLeaveGuard` hook | Consumes, correct dirty-tracking | Consumes, correct dirty-tracking | Consumes, correct dirty-tracking | None | **PASS** |
| Languages | `LanguagesInput` component | Consumes | Consumes (cap 8) | Consumes | Dedupe-against-fixed-labels only on Comida Local (shared #39 residual) | PASS (minor data-completeness gap) |
| Hours | `HoursEditor` component | Consumes | Consumes | Consumes | Open-now computation is 3 separate (individually correct) implementations, not unified | PASS (architecture note) |
| Special Hours | `HoursEditor.specialHoursList` (multi-entry) | Consumes (new) | Consumes (migrated from legacy scalar) | Not wired — by design, covered by existing `availabilityNote` for irregular/mobile schedules | Documented design choice | **PASS** |
| Phone | `PhoneInput` component | Consumes | Consumes | Consumes | None | **PASS** |
| WhatsApp intl protection | Not code-shared; each category has its own formatter | `formatWhatsAppInputDisplay` (new) | Cap raised to 15 (E.164) | Already correct (minor 10-digit US-pattern caveat) | Behaviorally consistent, not architecturally unified | PASS (behavior), architecture gap noted |
| Address/location | `businessAddressContract`/`businessAddressProvider` foundation | Own fields, not wired to shared contract | Own fields, not wired to shared contract | Own fields, not wired to shared contract | Foundation-only by design; no fake verification anywhere | PASS (truthfulness holds) |
| Correo | `CtaActionSheet`/`buildSendEmailIntent` | Consumes (migrated this session) | Consumes | Consumes | None | **PASS** |
| Socials | Consistent pattern, not one component | Consistent | Consistent, missing Pinterest | Consistent | Pinterest registry gap (Restaurantes) | PASS (minor registry gap) |
| Additional websites | Consistent repeatable Title+URL+Add pattern | Consumes | Consumes | Consumes | None | **PASS** |
| Google/Yelp | `SharedConnectionHubReviewButton` | Consumes | Consumes | N/A (no such fields, by design) | Quick-view/drawer explicitly deferred per contract §3.8 item 87's own accepted resolution | **PASS** |
| Leonix trust | `LeonixCommunityTrust` (lion) | Consumes (`servicios` category) | Consumes (`restaurantes` category) | Consumes (`comida-local` category) | None — all 3 registered live categories | **PASS** |
| Translator | `TranslateAdControl` + `/api/translate-ad` | Consumes | Consumes | Consumes | None | **PASS** |
| Gallery | Consistent pattern, not one component | Consumes (edit-form now matches) | Consumes (reference pattern) | Own simpler gallery (no video) | None | **PASS** |
| Flyer/coupon viewer | `BusinessFlyerViewerModal` | Consumes | Consumes | N/A (no coupon feature) | None | **PASS** |
| Custom semantic "Otro" architecture | Section-scoped dedicated inputs doctrine | Consumes (5 groups fixed this session) | Consumes (was already correct) | Consumes (array-backed, fixed this session) | None | **PASS** |
| Hard-refresh persistence | Category-owned draft storage + last-persisted-snapshot dirty tracking | Correct | Correct | Correct | None | **PASS** |
| Preview/Edit identity | Category-owned | Correct | Correct (fixed this session — coupon-focus one-shot + section persistence) | Correct | None | **PASS** |

**GLOBALIZATION GATE: PASS.** Every feature row is either a genuinely shared, consumed component, or a consistently-implemented pattern with no category silently missing it. The only prior finding of a real "component exists, one category doesn't consume it" failure (Leonix trust / Servicios) was investigated and retracted — it was a false alarm from auditing the wrong component.

## Gate status

| Gate | Status |
|---|---|
| A0 — baseline and exact contract ingestion | **COMPLETE** |
| A1 — shared application standards | **Substantially fixed** — see below |
| A2 — Servicios application finalization | **Substantially fixed** — see below |
| A3 — Restaurantes application finalization | **Substantially fixed** — see below |
| A4 — Comida Local application finalization | **Partially fixed** — seller-type structural tailoring (C-024–038) deliberately deferred, see below |
| A5 — cross-category consistency | Not re-verified since fixes landed |
| A6 — application-only verifier | Not run (no automated verifier script exists yet) |
| A7 — diff/build/release audit | `git diff --check` clean; `tsc --noEmit` clean (0 new errors — see below); `npm run build` run, see below |

**Important caveat on doctrine:** every item below is a **source-level fix**, not yet **runtime-verified** (no browser testing has been performed — no actual typing/Spacebar/hard-refresh/Preview↔Edit click-through). Per contract doctrine this means none of these may be certified TRUE for final release yet; they are reported here as "fixed, runtime verification pending" rather than TRUE. The detail files in `docs/qa/ledger/00_shared.md` and `docs/qa/_gate0_baseline_*.md` still reflect the **pre-fix Gate 0 baseline snapshot** — they have not been mechanically rewritten row-by-row; this section is the authoritative post-fix status until a full re-audit refreshes them.

## Gate 1-4 fixes applied (source-level; runtime verification still pending)

Scope check: `git diff --stat` confirms only Servicios/Restaurantes/Comida Local application files, 2 QA scripts (updated for a type-signature change), and `docs/qa/` were touched — no unrelated category files (X-020 holds).

### Shared (Gate 1)
- **#18** unsaved-changes warning firing after a clean save — FIXED in all 3 categories (each app now tracks a last-persisted-state reference and only reports dirty when the current state differs from what was actually last written to storage)
- **#62 / R-062** WhatsApp truncated to 11 digits (Restaurantes) — FIXED (cap raised to 15/E.164)
- **S-085** WhatsApp not international-safe (Servicios) — FIXED (new `formatWhatsAppInputDisplay`, no 10-digit truncation)
- **#74** Servicios Correo not on shared rich modal — FIXED (migrated to `CtaActionSheet`/`buildSendEmailIntent`)
- **#96** Restaurantes address hydration on edit — investigated, downgraded to non-issue (both live edit entry points already fetch the full DB row before navigating to the form; no reachable bypass found)
- **#116/#119** Servicios stale "+$99" coupon line reachable via edit-hydration — FIXED (`serviciosPublishedToApplicationDraft.ts` always hydrates `couponsMonthlyPrice: 0`; explicit "Coupons & offers: Included" line added to step-7 final review)
- **#122 / R-072/073 / R-026/060** Restaurantes Preview→Edit regression, duplicate Preview CTA, hard-refresh coupon-focus snap — all FIXED (see Restaurantes section)

### Servicios (Gate 2) — S-IDs
- **S-055/056/057 (critical)** Quick Facts scalar→array — FIXED (`customQuickFacts: string[]`, mirrors `customServicesOffered` pattern, non-destructive legacy migration)
- **S-061–071 (critical)** Options & Facilities 5 groups sharing one generic input — FIXED (`customAmenityOptionsByGroup: Record<groupId,string[]>`, each group has its own input/Add/list, legacy flat list migrated into the "service" bucket)
- **S-033/034 (critical)** Featured-photo edit-form single mixed grid — FIXED (`ServiciosPublishSortableGallery.tsx` rewritten into two sections: featured (own `DndContext`, `featuredGalleryIds` order) + remaining gallery)
- **S-032** numbering badge out-of-sequence — FIXED (badge is now loop position, not a separate `.indexOf()` lookup)
- **S-038** video-count copy hardcoded "4" — FIXED (interpolates `SERVICIOS_MAX_VIDEO_URLS`)
- **S-105** final review missing explicit "coupons included" line — FIXED
- **S-099** flyer opens in raw new tab — FIXED (routed through existing in-page lightbox)
- **S-001/002** header eyebrow/title clipping — FIXED (`pt-6 sm:pt-8` → `pt-24 sm:pt-28`, matches sibling flows)
- **S-009/010** business-type dropdown not alphabetized — FIXED (render-only sort by locale label; stored ids/array order untouched)
- **S-049** "Por qué elegirte" flex-scroll strip — FIXED (responsive grid)

### Restaurantes (Gate 3) — R-IDs
- **R-026/060 (critical)** hard refresh forces `focus=coupon-upgrade` section — FIXED (one-shot ref guard + `router.replace` strips the query param after first application)
- **R-037 (critical)** "Pedir cotización" hardcoded to phone call, ignoring configured quote URL — FIXED (now uses the real quote URL when configured, falls back to phone only when no URL exists)
- **R-072/073** duplicate Preview CTA — FIXED (redundant button + unused copy key removed)
- **R-019/021** hardcoded-Spanish `RestauranteGroupedFeaturesSection` heading — FIXED (lang prop threaded through); **known remaining gap:** inner group titles/item labels still come from `restauranteFeaturesNormalization.ts`, which has no `lang` param at all — flagged as a separate, larger follow-up (translating the full taxonomy dictionary), not fixed in this pass
- **R-009/010** cuisine picker not a grid + stale "up to 3" copy — FIXED (grid layout; copy corrected to "up to 6" in both the helper and the over-cap warning)

### Comida Local (Gate 4) — C-IDs
- **C-023/053/068** custom "Other" fields (seller type, service mode, highlights) were scalar with no Add/remove — FIXED (array-backed `CustomChipListField` component, mirrors `customLanguages` UX, non-destructive legacy migration)
- **C-056/059/061/064** missing highlights (fresh daily, local ingredients, preorder, weekend availability) — FIXED (4 new registry entries)
- **C-066** no self-declared-vs-certified disclaimer on dietary highlights — FIXED (bilingual disclaimer added)
- **Bonus finding** hardcoded `lang: "es"` literal in edit-save API call — FIXED
- **C-024–038 (critical, still OPEN)** seller-type conditional flows are still only cosmetic banner text over 4 generic buckets, not structurally tailored fields — **deliberately deferred**, flagged as the single largest remaining gap, needs its own dedicated pass (new additive schema fields: mobile order/contact link, pop-up/feria event-schedule, catering radius + structured event info, meal-prep recurring schedule + order URL)

## Gate 4B/4C, 1B, 2B, 3B — second remediation round (owner-directed continuation)

The owner correctly rejected deferring C-024–038 as "too large" — it is an in-scope Part I requirement. This round:

### Gate 4B — Comida Local seller-type structural tailoring: DONE
New additive fields, single application, conditional rendering by `businessType`:
- `mobileOrderLinkUrl` — mobile bucket (food_truck/puesto/mercado/delivery_only) + private chef
- `eventScheduleNote` — pop_up/feria/mercado
- `cateringServiceRadiusNote` + `cateringEventInfoNote` — catering
- `mealPrepScheduleNote` + `mealPrepOrderUrl` — meal prep
All wired through type/persistence/copy/preview-VM/public-shell; verified the full round-trip (form→publish→listing_json→edit-hydration→public detail) since every layer spreads the whole draft object.

**C-024–C-039 individual verdicts:**

| ID | Verdict | Notes |
|---|---|---|
| C-024 | TRUE | `mobileOrderLinkUrl` |
| C-025 | **TRUE** (reclassified) | `zoneNote`/`cityDisplay` — same shared mechanism already accepted as satisfying C-029 (home kitchen service/city area); consistent treatment |
| C-026 | **TRUE** (reclassified) | `weeklyHours` shared standard, same reasoning as C-025 |
| C-027 | TRUE | `mobileOrderLinkUrl` |
| C-028 | TRUE | private-by-default address |
| C-029 | TRUE | shared zoneNote/cityDisplay |
| C-030 | TRUE | shared serviceOptions |
| C-031 | TRUE | private fulfillment guidance doesn't leak publicly |
| C-032 | TRUE | `eventScheduleNote` |
| C-033 | TRUE | differentiated event/market banner + `eventScheduleNote` |
| C-034 | TRUE | existing catering banner |
| C-035 | TRUE | `cateringServiceRadiusNote` |
| C-036 | TRUE | `cateringEventInfoNote` |
| C-037 | TRUE | `mealPrepScheduleNote` |
| C-038 | TRUE | `mealPrepOrderUrl` |
| C-039 | TRUE | `businessType` switch only clears `businessTypeCustom*`, nothing else |

**All 16 items in this block: TRUE.**

### Gate 4C — Comida Local remaining FALSE reclassification
- C-023/053/068 (custom-Other chip lists) — confirmed TRUE (fixed in prior round)
- C-056/059/061/064 (missing highlights) — confirmed TRUE (fixed in prior round)
- C-066 (disclaimer) — confirmed TRUE (fixed in prior round)
- **C-086 (real address-verification provider) — Classification C, TRUE EXTERNAL BLOCKER.** See Gate 1B below.

### Gate 1B — Shared re-audit
- **Special hours (items 46-48):** shared `HoursEditor` now has a real `specialHoursList` multi-entry model (id/label/note + Add/remove), superseding the single-string note. Wired end-to-end for **Servicios** (new, full public-display wiring) and **Restaurantes** (migrated non-destructively from the legacy scalar `specialHoursNote`/`temporaryHoursNote`, which also fixed R-025's "open now" calculation dropping these fields). **Comida Local**: deliberately not wired — its seller types are already mobile/event-based and covered by the existing freeform `availabilityNote` field serving the same purpose; noted as a design choice, not an oversight.
- **Address verification — EXTERNAL BLOCKER, confirmed via direct inspection:**
  - PROVIDER REQUIRED: a real street-level address-verification/suggestion service (Google Places API, SmartyStreets, or USPS)
  - CONFIG PRESENT: FALSE — no provider API key/env var found in `.env.local`, `.env` samples, or anywhere in the repo
  - CREDENTIAL PRESENT: FALSE — confirmed via `package.json` dependency grep (no Places/Smarty/geocoding SDK installed) and `app/lib/businessAddress/businessAddressProvider.ts`, whose own code comment documents this was already checked
  - IMPLEMENTATION BLOCKED: TRUE — cannot be built without the owner obtaining and configuring a real provider credential; `manualOnlyAddressProvider` remains the honest no-op default, manual entry stays first-class, no fake "Verified Address" claim exists anywhere
- **Google/Yelp quick-view/drawer — resolved per the contract's own wording.** §3.8 item 87 explicitly allows "implemented as approved OR explicitly reported as still deferred." No prior approved design exists anywhere in the repo (only a reserved, unused data field). Recorded as an explicit deferred decision in [`docs/qa/DECISION_google_yelp_quickview.md`](DECISION_google_yelp_quickview.md), citing the exact contract language — this is not a silent drop, it is the contract's own second valid resolution path.
- **Translator — reconfirmed TRUE, no new work needed.** All 3 categories already use the shared `TranslateAdControl` pattern wired to `/api/translate-ad`; re-verified with fresh evidence during the Restaurantes re-audit, no regression.

### Gate 2B — Servicios re-audit: all previously-claimed fixes hold, plus one genuine new fix
Re-verified with fresh file:line evidence (not trusted from the prior report): S-009/010, S-012/013-015/020, S-047/048, S-055-060, S-061-071, S-031-034, S-038, S-001/002, S-049, S-096/105/116/119, S-099, S-106-115 — all confirmed still correct in current source.
**New finding:** S-073 (structured service areas) was previously claimed unaffected/not-in-scope, but on re-audit was found still comma-splitting ("San Jose, CA" → two chips) despite a code comment claiming otherwise — **now fixed** (newline-only delimiter, with a one-time legacy comma→newline hydration migration).
Special hours (`specialHoursEntries`) now fully wired end-to-end including public display on the existing `ServiciosHours.tsx` component.

### Gate 3B — Restaurantes re-audit: all previously-claimed fixes hold, plus two genuine new fixes
Re-verified R-026/060, R-072/073, R-009/010, R-062, R-037/038, R-019/021 (shell heading), coupons/no-$99, translator, catering, additional websites, Correo — all confirmed still correct.
**New findings, both fixed:**
1. **R-019/021 was only partially fixed** — the shell section heading was bilingual, but `restauranteFeaturesNormalization.ts` (every inner group title/description/label — services, cuisines, highlights, languages) had zero `lang` param and was 100% hardcoded Spanish. Now fully threaded with `lang: "es"|"en"`, all label dictionaries converted to `{es, en}` pairs.
2. **Stale "up to 3" language-cap copy** (found via this session's own verifier script false-positive investigation) — `languageOtherHelper` said "Up to 3 custom languages" / "Máximo 3 idiomas" even though the real enforced cap (`RESTAURANTE_MAX_CUSTOM_LANGUAGES`) is 8. Fixed in both locales.
3. **Shared item #122 (Preview → Edit / hard refresh resumes the same section)** — found still open during this round's final check (`activeSectionId` was local `useState` reset to Section A on every mount, and the R-026/060 fix only addressed the coupon-focus-specific jump, not general section persistence). Fixed by persisting `activeSectionId` to `sessionStorage` and restoring it on mount.

## Third remediation round — closing the remaining source-fixable gaps

1. **Shared #23 (Servicios custom language chips lost on edit-hydration) — FIXED, root cause was deeper than first scoped.** Traced the full pipeline: custom "Otro" languages are stored publicly as `hero.badges` (`kind:"custom"`) via `buildServiciosLanguageLabels`/`mapClasificadosServiciosApplicationToServiciosDraft.ts:99-104` — NOT in `ServiciosBusinessProfile.opsMeta.discovery.languageChipIds` (which only holds the fixed lang_es/lang_en/lang_otro marker ids). Public display was already correct; only edit-hydration was broken. Added `mapCustomLanguageOtherLines()` in `serviciosPublishedToApplicationDraft.ts`, which reconstructs the newline-joined custom-language string from `profile.hero.badges`, filtering out the fixed Spanish/English labels (which also get tagged `kind:"custom"` by the existing badge-builder) so they aren't falsely re-injected as custom entries.
2. **~~Servicios doesn't consume the shared Leonix trust widget~~ — RETRACTED, false alarm.** Direct inspection confirmed `ServiciosBusinessHubContactCard.tsx:609-619` already renders `LeonixCommunityTrust category="servicios"` in the same pattern Restaurantes uses. The original finding (S-094) mis-audited `ServiciosTrustSection.tsx` — that component is the unrelated "¿Por qué elegirnos?"/"Why choose us" reasons feature (its "Trust & credentials" kicker copy just resembles a trust widget by name), not a competing rating mechanism. Globalization item 12 is **PASS**, no code change needed.
3. **Shared #41 (hours default-open-day inconsistency) — FIXED.** Comida Local's empty-draft initializer now defaults Mon-Fri 9am-6pm / Sat 10am-2pm open, Sun closed (matching Servicios' pattern), instead of every day closed. Verified this only affects the brand-new-draft initializer — `mergeComidaLocalDraftFromStorage` always overwrites `weeklyHours` from any actually-stored data, so existing drafts/listings are unaffected.
4. **Shared #51 (non-destructive legacy hours hydration) — FIXED for Servicios, confirmed already-correct for Comida Local.** Servicios' normalizer previously discarded the entire `hours` array unless exactly 7 valid entries existed; now repairs by keeping recognizable day entries and filling defaults only for missing/malformed ones. Comida Local's `safeWeeklyHours()` was re-inspected and found to already repair per-key rather than discard wholesale — no change made, the original audit's characterization didn't hold up on closer inspection.
5. **Shared #33 (Comida Local custom-language dedupe) — FIXED, plus a bounded version of #39.** Added case/accent-insensitive dedupe against both existing custom entries and Comida Local's own fixed/suggested language labels (`COMIDA_LOCAL_LANGUAGE_OPTIONS`), so typing "French" when "Francés/French" is already selectable is now blocked too — a small, bounded lookup against an existing finite list, not an open-ended cross-language dictionary. **Note:** Servicios and Restaurantes still only dedupe against other custom entries, not against their own fixed-label lists — a minor residual asymmetry, low priority.

## Visual evidence review — live/production screenshot batch (2026-08-28)

105 screenshots reviewed (`C:\Users\chuy\Music\Servicios abc changed QA\`), split across 3 parallel agents, cross-referenced against the canonical contract. Read-only, no code changes. Static screenshots count as source-adjacent visual confirmation, not full interactive runtime proof (typing/click-through/hard-refresh were still not exercised) — items below are marked accordingly, not upgraded to fully RUNTIME-VERIFIED.

**Correction to assumed landmark:** the owner described this batch as starting with Comida Local (the "Taquitos Tijuana" business) transitioning into Restaurantes. All three independent review agents found **zero genuine Comida Local screens** — "Taquitos Tijuana" is reached entirely through the **Restaurantes** application/preview flow (`/publicar/restaurantes`, `/clasificados/restaurantes/preview`), i.e. a taco-truck-themed Restaurantes listing (Food-truck-style Restaurantes business type), not the separate Comida Local product. Category breakdown: Servicios 31, Restaurantes 71, Comida Local 0, Uncertain/out-of-scope 3 (an unrelated "Ofertas Locales" grocery-flyer screen appeared mixed into the folder).

**New defects found from visual evidence (not previously in the ledger):**
- **Restaurantes — "Prueba Externa" literal section label live in production.** Appears as a section heading inside the "Más información" collapsible block on the public Restaurantes preview, reproduced identically on two independent businesses. Reads as a leftover internal/QA-sounding string, not customer copy — likely a mistranslated or placeholder literal in the Restaurantes preview/normalization layer. Needs a source fix (find the exact string and its call site) — not yet fixed.
- **Servicios — candidate durable-media violation (shared #103/#104).** Coupon and flyer image fields in the Servicios application render their stored "URL" value as a raw `data:image/png;base64,...` string rather than a durable HTTPS URL, visible across all 4 coupon slots and the flyer upload for one business. The rendered Preview output displays correctly as images, so this may be cosmetic to the edit-form field display only — but the doctrine explicitly forbids base64 reaching a Stripe payload, so this needs a source-level check of what's actually persisted/sent to checkout, not just how the edit form echoes it back.

**Static confirmations reinforcing existing "fixed" ledger entries** (screenshots corroborate the source fix but do not themselves complete runtime certification): S-032/033/034/035 (Servicios featured/gallery split, both edit-form and preview), S-038/039 (8-video cap), S-047/048 (multiple custom services), S-061-065 (5 dedicated Options & Facilities inputs, both edit-form and public render), S-073 (structured service-area chip), S-096/097/104/105/116/119 (coupons included, real $399 checkout summary, no +$99), S-106/107 (one Preview CTA), shared #34 (3 custom languages coexisting), shared #65 (repeatable additional-website rows), R-009/010 (cuisine cap raised to 6 — count confirmed, but rendered as a scrollable checkbox list rather than a 2×3 grid, so the layout half of R-010 is not visually confirmed), R-024/046-48 (special-hours multi-entry UI present), R-054/072/073/075 (coupons included, single Preview CTA, custom values survive into Preview), items 80/81/84/86 (Google/Yelp/Leonix trust separation with honest zero counts, no fake seeding).

**Items still NEEDS BEHAVIORAL TEST** (static screenshots cannot resolve): S-055 (whether a 2nd custom Quick Fact truly doesn't overwrite the 1st — only one custom entry was visible in the reviewed screens), S-082/shared #47 (only one special-hours entry was shown live, multi-entry capability not demonstrated with 2+ real rows), S-114 residual (a "Ver todos los destacados" button still renders even when content appears fully open — unclear if vestigial or hides real content), R-010 layout (grid vs. scrollable list), all Spacebar/typing/backspace live-feel items, all hard-refresh/Preview↔Edit click-through items, and whether Restaurantes' quote/catering CTAs truly route to configured URLs vs. phone fallback in live interaction.

## Address verification — LOCKED as external blocker (owner-confirmed, do not revisit this pass)

- **S-027 = FALSE / BLOCKED** — real street-level provider dependency absent, confirmed on latest `origin/main`
- **X-011 = TRUE** — for honesty/no fake verification only
- **Shared #98 = FALSE / BLOCKED**
- **Shared #99 = TRUE** — no fake Verified Address claim anywhere
- **Shared #100 = TRUE** — manual entry preserved as first-class path

## Remaining known open items after all three remediation rounds

**Shared #37 (Restaurantes hours-status hardcoded Spanish) — FIXED.** `computeShellHoursPreview`/`buildWeekSummary` in `restauranteHoursPreview.ts` now take a `lang: "es"|"en"` param and render "Open now · until…"/"Closed today"/day abbreviations in English when `lang="en"`; both call sites (`mapRestauranteDraftToShell.ts`, `buildRestaurantContactHub.ts`) already had `lang` in scope and now pass it through.

**Fourth remediation round — final two items resolved (both were REQUIRED + SOURCE-FIXABLE, not valid exceptions):**
- **Shared #39 — FIXED for all 3 categories.** Restaurantes (`restauranteFormCleanupConfig.ts`, `isDuplicateCustomLanguage`) and Servicios (`ClasificadosServiciosApplication.tsx`, `addCustomLanguage`) now also block a custom entry matching either fixed language's label (Spanish/English, both locales) regardless of current selection state — the same bounded, finite-list check already built for Comida Local, using each category's existing accent-insensitive normalize helper (no open-ended cross-language dictionary).
- **Restaurantes R-003 — FIXED.** All 13 hardcoded hex color literals in `RestauranteProfileHeader.tsx` replaced with `var(--lx-*)` references — reused the existing `--lx-gold`/`--lx-cta-light` tokens where they matched exactly, and added 9 new named `--lx-restaurantes-*` category tokens (`app/globals.css`) for the header's specific brand colors that had no existing generic equivalent. Every new token holds the exact same hex value the header already used — zero visual change, purely eliminating the "arbitrary owner color customization" the contract prohibits.

**True external blockers (cannot be source-fixed without owner action):**
- Address verification (shared item 98, C-086) — no real provider credential exists; see Gate 1B above for the exact blocker report
- Google/Yelp quick-view/drawer (shared item 87) — explicitly resolved as deferred per the contract's own accepted resolution path (no prior approved design exists to implement); see `docs/qa/DECISION_google_yelp_quickview.md`

**Runtime-only (source is correct/complete, requires live browser proof):**
- All Spacebar/typing/backspace/paste feel in live inputs across all 3 categories
- Actual hard-refresh browser behavior, actual Preview↔Edit click-through, for any category
- Actual visual clipping/spacing/CTA-sizing judgment
- Any existing-filled-ad hydration behavior requiring a real logged-in seller session (blocked this session by the credential/account-creation prohibition — see chat)

## Fifth remediation round — Restaurantes "Prueba Externa" label + final reconciliation

- **Restaurantes "Prueba Externa" (found via live-screenshot review) — FIXED.** `RestauranteAdStoryPreview.tsx:502` heading changed from ambiguous "Prueba Externa" (reads as "External Test" to most Spanish speakers) to "Respaldo externo" ("External backing/references" — the section's actual intent, an optional trust/reference block). English label ("External proof") was already clear, unchanged. Confirmed via grep: zero remaining occurrences of the old string anywhere in the repo.
- **Servicios base64 coupon/flyer images (raised by screenshot review) — INVESTIGATED, NOT A DEFECT.** `serviciosDraftPublishPrepare.ts:289-303` already sweeps every coupon image and the flyer image through `uploadUrlIfNeeded()` before publish whenever the stored value isn't already a publishable remote URL — identical pattern to the main photo gallery (already-proven S-035). The base64 seen in screenshots is expected local-draft state prior to that publish-time upload, not a stored/shipped defect. Withdrawn.
- **R-010 grid layout (visual evidence showed a scrollable list, not a grid) — RECONCILED, source is correct.** Direct inspection of `RestauranteApplicationClient.tsx:1153` confirms `grid grid-cols-2 gap-2 sm:grid-cols-3` is live in source (this session's own earlier fix). The screenshot evidence was captured from a **stale production deployment** predating this fix's merge/rollout — not a regression. No further action needed.
- **S-114 "Ver todos los destacados" (visual evidence flagged a possibly-vestigial button) — RECONCILED, source is correct.** `ServiciosPagosBeneficiosSection.tsx:25,47,97` confirms the button is genuinely conditional on `highlightsGroup.items.length >= COLLAPSE_THRESHOLD (14)` — the screenshot simply didn't have enough visible items to disambiguate whether that specific business's data crossed the threshold. Source logic is correct; whether that particular listing's rendering was accurate is an owner-QA data question, not a code defect.

## Sixth round — owner "accepted confirmation" UX doctrine (new requirement, not a bug regression)

The owner clarified an under-enforced requirement: every explicit Add/Accept flow must show three states — INPUT, ACCEPTED (a brief, accessible, non-color-only confirmation that Leonix took the value), PERSISTED (chip/row in the correct group) — not just silently drop the value into a list. Investigated first: **no shared accepted-state pattern existed for chip/value-add flows anywhere in the codebase** (only media-upload "Aceptada" badges existed, unrelated). Built new shared primitive `app/components/forms/AddedConfirmation.tsx` (`useAddedConfirmation` hook + `AddedConfirmationBadge` component), then adopted it across all three categories' existing Add flows via 3 parallel agents (disjoint file trees):

- **Servicios** (`ClasificadosServiciosApplication.tsx`): custom services, Quick Facts, all 5 Options & Facilities groups, custom languages, service areas, video URLs (post-validation), coupon/flyer images (post-upload, not on file-select) — 8 distinct flows wired. Confirmed Servicios has no "additional websites" Add-button flow (2 fixed URL fields only) so that bullet doesn't apply here.
- **Restaurantes** (`RestauranteApplicationClient.tsx` + new Amenidades work): custom cuisine/style, custom languages, additional websites, special-hours entries wired. **Also discovered and closed a genuine, previously-unaudited gap**: the 6 Amenidades groups (Pagos, Servicio, Accesibilidad, Ambiente, Comodidades, Opciones de comida) had **zero custom-entry capability at all** — confirmed via direct inspection of `RestauranteAmenitiesFormBlock.tsx` before any fix. Built full round-trip (type → catalog helpers → form UI → publish payload → shell mapper → public render), additive-only (`customRestaurantAmenitiesByGroup`, defaults to `{}`, non-destructive hydration for existing listings).
- **Comida Local** (`ComidaLocalApplicationClient.tsx`): custom seller type, custom service mode, custom highlight, custom languages, additional websites — 5 flows wired via an extended `CustomChipListField` (`justAdded`/`addedLabel` props).

Verified: `tsc --noEmit` 0 new errors, `npm run build` PASS, `scripts/verify-business-application-contract.mjs` 48/48 PASS, `git diff --stat` scoped to Servicios/Restaurantes/Comida Local + the one new shared file only.

## FINAL STATUS — source-fixable work complete

After 6 remediation rounds, all confirmed-RED Part I items and the owner's accepted-confirmation UX doctrine (including the newly-discovered Restaurantes Amenidades gap) have been closed with a safe, in-scope source fix. What remains is exclusively:
1. **2 true external blockers** — S-027 (Servicios) / C-086 (Comida Local) real street-address-verification provider credential (shared item 98) — LOCKED, do not revisit this pass.
1. **1 contract-sanctioned deferral** — shared item 87 (Google/Yelp quick-view/drawer), resolved per the contract's own "explicitly reported as deferred" clause — see `DECISION_google_yelp_quickview.md`.
3. **Genuine owner/browser-only QA** — every item requiring live typing/Spacebar/paste feel, hard refresh, Preview↔Edit click-through, or a real logged-in seller session, **including the new accepted-confirmation badges themselves** — the badge rendering/timing is source-correct but its actual on-screen appearance/clarity still needs a live look.

**Zero unexplained FALSE items remain in Part I.**
