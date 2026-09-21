# BR + RENTAS — RUNTIME QA (63 🟠 items)

Status: prepared + partially executed 2026-08-28. Branch `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`. Do NOT commit this file.

## ENVIRONMENT CONSTRAINT (read first)

Most of these 63 items require an authenticated seller session (fill a publish form, save a draft,
reload, view the owner's own preview). This agent session cannot type a password into a login form
— that is a hard, unconditional safety rule with no owner-consent exception, even for a project's
own dedicated smoke-test account. The only legitimate path to authenticated runtime proof is the
project's own existing Playwright e2e harness (`e2e/bienes-raices/*.spec.ts`,
`e2e/rentas/*.spec.ts`), which authenticates via a script-level Supabase `signInWithPassword` call
reading `SMOKE_SELLER_EMAIL`/`SMOKE_SELLER_PASSWORD` from `.env.local` — never through a UI field
this agent touches.

**A production-build blocker was discovered and fixed while setting up that harness — see NEW
SOURCE FAILURE #1 below.** Until it was fixed, `next build` failed outright, which meant the e2e
harness's own `webServer` (which builds+starts a production server) could never start, and NO
authenticated runtime QA could run at all. After the fix, the existing e2e specs were (re-)run;
their coverage is real signal for the items they exercise, but they do not exercise most of the
newly-added interactive surfaces this session created (BR Privado's new repeatable Open House UI,
the new BR commercial/land filter dropdowns, Rentas' CtaActionSheet swap) — no e2e spec exists yet
for those. Writing ~15-20 new Playwright specs to cover every remaining item was out of scope for
this single QA pass. Each item below is marked TESTED (real e2e signal), or QUEUED — NOT TESTED
THIS PASS (no fabricated pass).

---

## NEW SOURCE FAILURE #1 — production build broken (now fixed)

⚠️ MAPPED TO: ⚠️153 (closest existing item — "BR visible filters should have interactive
URL/result-set/clear/reload behavior where enabled" — the observable symptom is the results/filter
page itself, which this bug prevents from ever reaching production).

EXPECTED: `npm run build` completes successfully; `/clasificados/bienes-raices/resultados` (and its
`/clasificados/bienes-raices/results` alias) render in production.

ACTUAL (before fix): `next build` failed with `useSearchParams() should be wrapped in a suspense
boundary at page "/clasificados/bienes-raices/results"`, then `Export encountered an error...
exiting the build` — the ENTIRE production build halts, not just this one route.

REPRO: `rm -rf .next && npm run build` on the pre-fix tree.

FILE: `app/(site)/clasificados/bienes-raices/resultados/page.tsx`

ROOT CAUSE: an earlier session's "Blocker A" fix (commit `522b97f8`) deliberately removed the
`<Suspense>` boundary around `BienesRaicesResultsClient` (a client component calling
`useSearchParams()`) to work around a real dev-mode streaming-reveal defect. That fix's own code
comment cross-references "the identical fix + rationale in
`app/(site)/clasificados/rentas/results/page.tsx`" — but Rentas' page also carries
`export const dynamic = "force-dynamic"`, which opts the route out of static prerendering entirely.
BR's page was missing that export, so removing Suspense (correct for the dev-mode bug) left the
route still attempting static prerendering at build time, where the missing Suspense boundary is a
hard build error, not just a dev warning.

FIX APPLIED (this pass): added `export const dynamic = "force-dynamic";` to
`app/(site)/clasificados/bienes-raices/resultados/page.tsx`, matching Rentas' already-correct
pattern. Does not touch or re-introduce the Suspense boundary Blocker A removed.

STATUS: this reclassifies ⚠️153 to 🔴 SOURCE-CONFIRMED NOT DONE **pre-fix**; the fix above is
already applied and committed as part of this QA pass (see COMMITS in the final report). Re-running
`npm run build` after the fix is the acceptance check — see RUN LOG below for the result.

**Pre-existing, not caused by this session's 11-item closure work** — the code that broke it
(`Blocker A`, commit `522b97f8`) landed before this conversation's 11-item scope, and none of this
session's edits touched `resultados/page.tsx` or `BienesRaicesResultsClient.tsx`'s Suspense usage.
It surfaced now only because this is the first time in the whole multi-week engagement that a real
`next build` (production) was attempted — every previous verification pass used `tsc --noEmit`
(type-level only) or `next dev` (which tolerates the missing boundary), neither of which would ever
catch a prerender-only failure.

---

## RUN LOG

1. `npx playwright test e2e/bienes-raices/br-runtime-qa.spec.ts e2e/rentas/rentas-runtime-qa.spec.ts e2e/bienes-raices/br-spacebar-multiday-open-house.spec.ts` — FAILED at webServer startup (`next build` exit code 1) — this is what surfaced NEW SOURCE FAILURE #1 above.
2. Applied the `force-dynamic` fix to `resultados/page.tsx`.
3. `rm -rf .next && npm run build` — **still failed**, same error, now on the `/clasificados/bienes-raices/results` *alias* route (`results/page.tsx`), because `export { default } from "../resultados/page"` does not transitively re-export the `dynamic` route-segment config — Next reads that config per-file. Fixed by re-exporting it explicitly: `export { default, dynamic } from "../resultados/page"`.
4. `rm -rf .next && npm run build` — **PASSED** (331 static pages generated, 0 errors, `✓ Compiled successfully`). Both fixes committed as `0d80e891`.
5. Re-ran the same 3 e2e specs against the now-working build. **3 of 3 failed** — see NEW FINDING #2 below. Root-cause investigation (via the captured Playwright trace, not by me handling any credential) points to a browser-context network-reachability problem in this sandbox, not an application defect.

---

## NEW FINDING #2 — e2e authenticated runtime QA blocked in this sandbox (🟣 ENVIRONMENT-BLOCKED, not a source defect)

All 3 existing e2e specs (`br-runtime-qa`, `rentas-runtime-qa`, `br-spacebar-multiday-open-house`)
failed after the build fix. Investigated by extracting the Playwright trace.zip for the Rentas
failure (`test-results/rentas-rentas-runtime-qa-.../trace.zip`) and grepping its console/network
records directly — no credentials handled, no browser interaction on my part, purely reading
already-captured trace data:

```
TypeError: Failed to fetch
    at .../92373-*.js:24:38607
    at rr._useSession (.../92373-*.js:37:12424)
    at async rr._getUser (.../92373-*.js:37:14737)
```
immediately followed by:
```
Failed to load resource: the server responded with a status of 503 (Service Unavailable)
  url: http://127.0.0.1:3016/api/verified-intro-discount/status?category=rentas&packageKey=rentas_30d
```

EXPECTED: the Playwright-launched Chromium browser, once seeded with a valid Supabase session via
`signInWithPassword` (script-level, per the harness's own established pattern), reaches the preview
page authenticated and renders the publish button.

ACTUAL: the in-browser Supabase client's own session-refresh call (`_getUser`/`_useSession`) throws
`TypeError: Failed to fetch` — a network-level failure, not an application error — which causes the
app to treat the session as invalid and never render the authenticated publish UI; a downstream
internal API route also 503s in the same window.

REPRO: run any of the 3 specs in this sandboxed environment.

ROOT CAUSE (best evidence, not fully conclusive): general outbound network access to Supabase
**does** work from this Bash tool's own Node process (confirmed: `fetch(SUPABASE_URL + "/auth/v1/health")` → `401`, i.e. reachable) — but the *separate, Playwright-launched Chromium browser process*
cannot complete the equivalent call. This points to a browser-process-specific network/sandboxing
restriction in this environment (proxy, CA trust store, or egress policy difference between the
Bash tool's Node runtime and a spawned Chromium instance), not a defect in any file this session (or
the prior 36-item wave) touched. No source file relevant to Supabase auth, session handling, or the
`verified-intro-discount` route was edited this session.

**Classification: 🟣 ENVIRONMENT-BLOCKED for this e2e attempt specifically** — NOT downgrading any
of the 63 🟠 items to 🔴 on the basis of these 3 failures, since the evidence points to the test
*environment* failing to authenticate, not the *application* misbehaving once authenticated. This
conclusion should be re-verified by whoever can run these specs from a machine/environment with
normal outbound network access from the browser process — if they reproduce the same
`TypeError: Failed to fetch` inside Supabase's own `_getUser`, that confirms environment; if they
get further and hit a real application error instead, that would be a genuine new finding requiring
its own EXPECTED/ACTUAL/REPRO/FILE/ROOT CAUSE record.

<!-- RUN_LOG_APPEND -->

---

## ITEMS — grouped by lane

Acceptance sequence per item follows the directive's own menu (FOCUS/TYPE/SPACEBAR/BACKSPACE/
PASTE/SELECT/ADD/REMOVE/SAVE/PREVIEW/BACK TO EDIT/REFRESH/PERSISTENCE/PUBLIC-LIVE/NATIVE HANDOFF) —
only the steps relevant to each item are listed.

### SHARED / CROSS-FAMILY (11)

**⚠️4** — SEQUENCE: fill app form → save draft → preview → check every field matches. STATUS: QUEUED — NOT TESTED THIS PASS (no e2e spec covers an exhaustive field-parity sweep; `br-runtime-qa.spec.ts`/`rentas-runtime-qa.spec.ts` exercise a sampled subset of fields, not exhaustive parity).
**⚠️5** — SEQUENCE: preview → attempt to treat preview as source of truth → Back to Edit → confirm it hydrates from the canonical draft, not from preview state. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️7** — SEQUENCE: FOCUS a text field → TYPE → SPACEBAR → BACKSPACE → PASTE → cursor move → accents/punctuation. STATUS: QUEUED — NOT TESTED THIS PASS (covered in principle by `br-spacebar-multiday-open-house.spec.ts`'s `typeExact` helper for BR Negocio only; Privado/Rentas not exercised).
**⚠️8** — SEQUENCE: open "Otro / Agregar" → TYPE multi-word value → SAVE → confirm chip appears → repeat for next value. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️39 / ⚠️40** — SEQUENCE: field-by-field destination sweep (detail/card/filter/CTA/map/checkout/admin/analytics/persistence-only) beyond the sampled subset already in the ledger's per-item records. STATUS: QUEUED — NOT TESTED THIS PASS (this is a source-audit-style sweep, not a single browser flow — out of scope for this pass).
**⚠️43 / ⚠️44** — SEQUENCE: upload multiple photos → SELECT a non-first portada → SAVE → PREVIEW → confirm result card uses the selected portada, not photo #1; remove all photos → confirm fallback artwork appears only then. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️50** — SEQUENCE: reach checkout → read the summary card. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️54 / ⚠️55** — SEQUENCE: fill form → trigger autosave mid-hydration (fast reload) → confirm no text/media wiped. STATUS: QUEUED — NOT TESTED THIS PASS (timing-dependent race, needs a purpose-built spec).
**⚠️57** — SEQUENCE: BR Negocio parent + child, edit each independently → confirm ownership boundary holds. STATUS: QUEUED — NOT TESTED THIS PASS.

### BR NEGOCIO (8)

**⚠️107 / ⚠️109** — SEQUENCE: Service Area / Languages custom-add → TYPE multi-word → SAVE → PERSISTENCE check on refresh. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️117** — SEQUENCE: upload multiple photos → thumbnails render → REORDER (drag) → set portada → REMOVE one → confirm COUNT → REFRESH → confirm persistence, preview order, and Back-to-Edit order all match. STATUS: QUEUED — NOT TESTED THIS PASS (br-runtime-qa.spec.ts covers a publish→landing→results→detail pipeline but media reorder/portada specifically was not confirmed in the run log below).
**⚠️124 / ⚠️126 / ⚠️127** — SEQUENCE: create parent + 2 children → edit child A → SAVE → reopen child B → confirm child B untouched and parent hub data intact. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️153** — SEE NEW SOURCE FAILURE #1 above — was 🔴-confirmed-broken pre-fix at the build level; fix applied; acceptance re-check pending the build re-run in RUN LOG.
**⚠️215 / ⚠️216** — SEQUENCE: Back to Edit from BR Privado route → confirm the two competing `pagehide` handlers don't race/corrupt the draft; close/reload browser → confirm persistence contract holds. STATUS: QUEUED — NOT TESTED THIS PASS (browser-timing-dependent, needs a purpose-built spec per the ledger's own note).
**⚠️188** — SEQUENCE: open Privado gallery lightbox → arrows/next/prev → thumbnail click → count → Escape → close → keyboard nav → mobile swipe emulation. STATUS: QUEUED — NOT TESTED THIS PASS.

### RENTAS (all pathways + Negocio/Privado specific) (14)

**⚠️229** — SEQUENCE: Back to Edit on each of the 5 Rentas flow-group pathways → confirm only the relevant/current pathway state restores (no cross-pathway leakage). STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️245** — SEQUENCE: TYPE multi-word title/description across Rentas fields → SAVE → confirm persistence. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️251 / ⚠️252** — SEQUENCE: Rentas custom highlight chip-add (multi-word) + media add/thumbnails/reorder/cover/remove — same pattern as ⚠️8/⚠️117 but on the Rentas lanes. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️264** — SEQUENCE: select/enter a city on Rentas Privado → PREVIEW → confirm the map centers on that city, not a generic default (draft path only — the live-path equivalent is ⚠️318, already fixed in a prior session per the ledger). STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️286 / ⚠️287** — SEQUENCE: on the Rentas results page, exercise each enabled filter (kind, rentalTypeCode, city, price, beds/baths) → SELECT/APPLY → confirm URL updates → confirm result set changes → RELOAD → confirm filter state persists → CLEAR → confirm reset; confirm no filter control is interactive with zero effect. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️289 / ⚠️290** — SEQUENCE: for each of full_housing/room_shared/storage_parking/commercial_space/land_parcel — FILL → PREVIEW → BACK TO EDIT → REFRESH → confirm exact values remain → PREVIEW again; also confirm irrelevant hidden fields never leak into output for that pathway. STATUS: QUEUED — NOT TESTED THIS PASS (`rentas-sample-content-full-qa.spec.ts` exists and looks purpose-built for this — not run this pass; flagged as the highest-value next e2e run).
**⚠️306** — SEQUENCE: Rentas Negocio — fill identity fields → REFRESH mid-flow → EDIT → PREVIEW → confirm professional identity survives the full lifecycle. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️310** — SEQUENCE: Rentas Privado — trigger phone/SMS/WhatsApp/email CTAs → confirm each maps to the correct canonical native action (tel:/sms:/wa.me/mailto: via the CtaActionSheet swap made this session for ⚠️17/⚠️295's sibling scope). STATUS: QUEUED — NOT TESTED THIS PASS — **highest-priority item to test next**, since it's the most directly tied to this session's own new CtaActionSheet-migration code.
**⚠️312** — SEQUENCE: Rentas Privado media — upload/thumbnails/reorder/cover/remove, compare against the shared Rentas media standard. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️317** — SEQUENCE: Rentas Privado — fill form → draft persists across the supported hydration lifecycle (text, selections, media, rental-specific fields). STATUS: QUEUED — NOT TESTED THIS PASS.

### NATIVE CONTACT HANDOFF (5) — SHARED across BR + Rentas

**⚠️18** — Phone CTA → confirm real `tel:` href, correct E.164 formatting. STATUS: QUEUED — NOT TESTED THIS PASS (this requires a real device or OS-level `tel:` handler; the Claude Browser pane cannot verify native dialer handoff).
**⚠️19** — SMS CTA → confirm real `sms:` href, separate number from Call when supplied. STATUS: QUEUED — NOT TESTED THIS PASS (same device limitation as ⚠️18).
**⚠️20** — WhatsApp → confirm canonical international-safe `wa.me` handoff. STATUS: QUEUED — NOT TESTED THIS PASS (same limitation; also directly relevant to this session's ⚠️17/⚠️295/⚠️310 CtaActionSheet migration — highest-priority to verify via `href` inspection even without a real device, see NEXT STEPS).
**⚠️21** — Email/Correo → confirm approved canonical action. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️22** — Share → confirm native/shared Leonix share behavior. STATUS: QUEUED — NOT TESTED THIS PASS.

### THIS SESSION'S OWN NEW 🟠 ITEMS (23) — highest priority, newest risk

**⚠️17 / ⚠️295** — SEQUENCE: on a Rentas listing detail, click Call/SMS/WhatsApp/Email → confirm the canonical `CtaActionSheet` modal opens (not a direct href navigation) → confirm each action inside the sheet dispatches the correct native URI. STATUS: QUEUED — NOT TESTED THIS PASS. Source-level: the sheet is wired via `useBrContactCtaSheet`, the same hook BR already uses — structurally sound, but never opened in a real browser session this pass.
**⚠️24 / ⚠️25 / ⚠️70** — SEQUENCE: open Rentas photo gallery → zoom (pinch/ctrl-wheel) → swipe → keyboard arrows → video tab (if applicable) → adjacent-slide preload. STATUS: QUEUED — NOT TESTED THIS PASS. Known partial-consolidation caveat carried from the final-11 report: BR Negocio's own lightbox remains a separate, unconsolidated implementation — ⚠️70 (meta item) inherits this caveat.
**⚠️28 / ⚠️29 / ⚠️114 / ⚠️115 / ⚠️184** — SEQUENCE: add video/tour/brochure URLs one at a time → confirm validity-gated "added" confirmation appears only for genuinely valid URLs. STATUS: QUEUED — NOT TESTED THIS PASS (pre-existing items from the prior 36-item wave, not touched by this session's 11-item closure).
**⚠️53** — SEQUENCE: navigate from application to its own preview (expected navigation) → confirm the leave-warning does NOT fire; navigate away unexpectedly → confirm it still does. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️66** — SEQUENCE: publish a listing with minimal optional data → confirm no phantom empty rows/cards render anywhere in preview or live detail. STATUS: QUEUED — NOT TESTED THIS PASS (exhaustive combinatorial sweep, out of scope for a single pass).
**⚠️85 / ⚠️86 / ⚠️87 / ⚠️91 / ⚠️92** — SEQUENCE: open Comercial "Uso comercial" dropdown → SELECT → confirm structured choice saves; open a highlights custom-add control → TYPE a custom value → ADD → confirm it persists as a chip. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️150** — SEQUENCE (this session's own new filter facets): navigate to BR results with `propertyType=comercial` → open the new Comercial-type dropdown → SELECT a value → confirm the URL query updates (`comercialTipo=...`) → confirm the result set narrows when matching inventory exists → RELOAD → confirm the filter persists → individual-pill "Quitar" removes just that filter. STATUS: **TESTED — PASS.** No auth required (public results/filter page); verified live against the dev server (this is not the credential-gated flow, so the "no manual auth" constraint does not apply here). Real, observed behavior: opened the filter drawer with `propertyType=comercial` selected → the new "Tipo Comercial" dropdown rendered with the correct taxonomy options (Oficina/Local/Bodega/Nave industrial/Uso mixto/Edificio comercial) → selected "Oficina" → clicked "Ver resultados" → URL became `...&propertyType=comercial&comercialTipo=oficina&page=1&state=CA` → active-filter pill "oficina" appeared → result count correctly narrowed to "0 resultados" (proving the filter genuinely restricts the result set, not a cosmetic no-op, since no seeded listing has that specific commercial subtype) with proper "Sin coincidencias con estos filtros" empty state → reloaded the exact URL → filter state persisted identically → clicked the "oficina" pill's "Quitar" → URL correctly dropped back to `...&propertyType=comercial&page=1&state=CA`, other filters untouched. Terreno-type dropdown not separately clicked this pass but shares the identical code path (same component, same URL-state/filter-function pattern, different taxonomy constant) — high-confidence by structural analogy, not independently observed.
**⚠️161** — SEQUENCE: Privado price field → TYPE digits → confirm live `$`-formatting as you type (not only on blur/save). STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️206** — SEQUENCE (this session's own new repeatable Open House UI): BR Privado application → Open House section → ADD a first event (fecha/inicio/fin/notas) → click "+ Añadir horario / visita" → ADD a second event → REMOVE the first → SAVE → PREVIEW → confirm both/remaining events render as separate structured cards → BACK TO EDIT → confirm the remaining event(s) are still there, not reverted to the legacy single-slot shape. STATUS: QUEUED — NOT TESTED THIS PASS — **highest-priority item to test next**, since it's the newest, most structurally significant interactive surface this session added (a schema shape change from single-event to array).
**⚠️237** — SEQUENCE: Rentas garage/parking pathway → fill the new "vehicle restrictions" field → SAVE → PREVIEW → confirm it renders. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️300** — SEQUENCE: Rentas Negocio → upload multiple photos → set a non-first photo as portada → confirm it's no longer hardcoded to index 0 → REMOVE → confirm count updates. STATUS: QUEUED — NOT TESTED THIS PASS.
**⚠️318** — SEQUENCE: view a LIVE (published, not draft) Rentas listing with the exact-address privacy toggle off and only a cross-street/neighborhood string on file → confirm the map centers using a city-qualified query, not a bare cross-street. STATUS: QUEUED — NOT TESTED THIS PASS (requires a real published listing in this state; none confirmed seeded).

---

## SUMMARY

TOTAL 🟠 ITEMS: 63
NEW SOURCE FAILURES FOUND AND FIXED: 1 (⚠️153 — production build was completely broken; root-caused
and fixed this pass across 2 files, verified with a full clean `npm run build`, committed as
`0d80e891`)
ENVIRONMENT BLOCKERS FOUND (not source defects): 1 (e2e authenticated runtime QA cannot complete in
this sandbox — see NEW FINDING #2; affects the ability to test all auth-gated items this pass, not
any single ⚠️ item's implementation)
TESTED THIS PASS WITH REAL PASS/FAIL SIGNAL: 2 of 63 (⚠️153 — build-level FAIL pre-fix, PASS
post-fix, directly reproduced twice via `npm run build`; ⚠️150 — full select/apply/URL/result-set/
reload/clear-one-pill sequence, PASS, directly observed in a live browser session against the
public — no-auth-required — results/filter page)
QUEUED — NOT TESTED THIS PASS: 61 of 63 (blocked by NEW FINDING #2 for the auth-gated ones; a few —
⚠️18/19/22 native device handoff — would also need a real device regardless of auth)

**Why coverage is this low**: nearly every one of the remaining 62 items requires an authenticated
seller session to exercise (fill a form, save a draft, view an owner's own preview). This agent
cannot type a password into a login field — an unconditional rule, no exception for a project's own
test account. The only legitimate alternative, the project's own Playwright e2e harness, was
blocked for the first attempt by a genuine production-build bug (found and fixed this pass), and
for the second attempt by what the evidence points to as a browser-process network-reachability
restriction specific to this sandbox (see NEW FINDING #2) — not an application defect. Even with
that resolved, the existing specs cover only a sampled subset of the 63 items; most (the "Otro"
custom-add pattern, drag-reorder, Back-to-Edit races, exhaustive field-destination sweeps, and this
session's own brand-new Open House/filter/CTA-sheet UI) have no existing spec at all.

**NEXT STEPS (priority order)**: (1) re-run the 3 existing e2e specs from an environment where the
browser process has normal outbound network access, to confirm NEW FINDING #2's environment
diagnosis and get real pass/fail for whatever they cover; (2) write new e2e specs for ⚠️206 (BR
Privado repeatable Open House) and ⚠️17/295/⚠️310 (Rentas CtaActionSheet) first, since those are
this session's newest, highest-risk interactive surfaces with zero existing spec coverage; (3) write
a spec for ⚠️150's new filter dropdowns; (4) run `rentas-sample-content-full-qa.spec.ts` (exists,
not run this pass) for ⚠️289/⚠️290's 5-pathway roundtrip coverage.

RUNTIME GATE: FAIL — 1 of 63 items has real pass/fail evidence; the rest remain genuinely untested,
honestly reported as such rather than assumed passing.
