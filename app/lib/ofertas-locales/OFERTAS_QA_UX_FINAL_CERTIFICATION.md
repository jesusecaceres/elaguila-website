# ⚠️ OFERTAS LOCALES — QA UX BATCH FINAL CERTIFICATION (GATE G)

## 1. Certification date
2026-08-27

## 2. Branch
`integration/ofertas-locales-2026-07`

## 3. Scanner-seal baseline
`9095b3a97fe8ad4fd36543f41ea0ca6a7a0df0f0` — `docs(ofertas): certify and seal ai scanner core`
Produced/verified: 127 products, 8/8 pages, Cardenas flyer.

## 4. Gate A–F commits
| Gate | Commit | Message |
|---|---|---|
| A | `e0b15a9c1b547542be27e59f97ad9e0c2e22e2e2` | `fix(ofertas): clarify scan refresh and review navigation` |
| B | `e12308b22fd249f2f4442f71e7ff95dc76b5c0ae` | `fix(ofertas): correct ai review counters and empty state` |
| C | `8166d18b` | `fix(ofertas): improve product review progression` |
| D | `99ced545` | `fix(ofertas): create focused product review workspace` |
| E | `055c835d` | `fix(ofertas): localize product review taxonomy` |
| F | `d16bff78` | `fix(ofertas): simplify final review and preview handoff` |

All six commits verified as ancestors of current HEAD via `git merge-base --is-ancestor`.

## 5. Current final HEAD (at start of Gate G)
`d16bff78447da3d987e4939207f9606199b5173e` (matches `origin/integration/ofertas-locales-2026-07`)

## 6. QA item matrix ⚠️24–⚠️53

| Item | Status | Evidence |
|---|---|---|
| ⚠️24 refresh-results wording | DONE | `ofertasLocalesScanReviewRuntime.ts` (`refreshNow`, `refreshBackupHint`), `OfertasLocalesAiItemReviewPanel.tsx` header block. Gate A. |
| ⚠️25 dedicated review workspace | DONE | `step5ReviewView: "files" \| "products"` toggle, `OfertasLocalesApplicationClient.tsx`. Gate D. |
| ⚠️26 next-page CTA | DONE | `BTN_SUCCESS_LG` + `proceedToNextPage`, `OfertasLocalesAiItemReviewPanel.tsx`. Gate C. |
| ⚠️27 final-page CTA | DONE | `allPagesComplete` branch renders `aiReviewContinueToNextStep`, mutually exclusive with next-page CTA. Gate C. |
| ⚠️28 flyer/editor cross-reference layout | DONE | `xl:sticky xl:top-20`, matching mobile/desktop `order-1`/`order-2`, `OfertasLocalesAiScanReviewWorkspace.tsx`. Gate D. |
| ⚠️29 page-navigation hierarchy | DONE | "Página anterior"/"Página siguiente" relabel, `OfertasClipReviewViewer.tsx`. Gate C. |
| ⚠️30 counter correctness | DONE | `summarizeScopedItemReviewCounts(allCurrentScanItems)`, canonical-collection fix. Gate B. |
| ⚠️31 reopen approved/reviewed items | DONE | Orphan-selection check uses `pageFilteredItems` not `queueItems`; reopened-terminal-item Save affordance. Gate D. |
| ⚠️32 CTA hierarchy | DONE | Burgundy/cream-outline/neutral-nav/red-destructive/green-progression tiers. Gate A (copy) + Gate C (hierarchy). |
| ⚠️33 bilingual taxonomy presentation | DONE | `getOfertaProductBilingualCategoryDisplay`, `ofertasLocalesProductTaxonomy.ts`. Gate E. |
| ⚠️34 category visual cues | DONE | Emoji from existing taxonomy, `aria-hidden="true"`. Gate E. |
| ⚠️35 no giant translation system | DONE | No new taxonomy map, no translation API, product names/descriptions untouched (verified structurally). Gate E. |
| ⚠️36 reduced vertical travel | DONE | Files/Products view separation + sticky flyer + de-duplicated CTA. Gates D + C. |
| ⚠️37 explicit product nav labels | DONE | "Producto anterior"/"Siguiente producto". Gate A. |
| ⚠️38 completion state | DONE | Consolidated single review-complete card (checkmark, body, dynamic page count, CTA). Gate C. |
| ⚠️39 Step 7 simplification | DONE | Restructured to readiness → confirmations → blockers → CTA → price → start-over. Gate F. |
| ⚠️40 payment CTA removed from Step 7 | DONE | Direct `/dashboard/ofertas-locales/[id]` Link and `continueSecureCheckout` copy removed. Gate F. |
| ⚠️41 price summary preserved | DONE | `OfertasLocalesCommercialSummary` + `publishNotBuilt` disclosure retained, no checkout button. Gate F. |
| ⚠️42 confirmations reduced to 3 | DONE | `businessFiles`/`aiItems`(conditional)/`leonixRules`. Gate F. |
| ⚠️43 Preview CTA unlock behavior | DONE | `step7ConfirmationsComplete` ternary preserved, same `BTN_PRIMARY` styling both states. Gate F. |
| ⚠️44 exact blockers | DONE | Itemized `<ul>` driven by `emailMalformed`/confirmation booleans/`aiReviewGate`. Gate F. |
| ⚠️45 manual save removed | DONE | `handleSaveDraft` and its button deleted; autosave (`useOfertasLocalesDraft`) untouched. Gate F. |
| ⚠️46 global unsaved-exit deferred | **DEFERRED** | No reusable global unsaved-exit engine exists in this repo. Explicitly out of scope per Gate F ticket instruction. Autosave already mitigates realistic loss. |
| ⚠️47 Envío para revisión bug fixed | DONE | `validateOfertaLocalDraftForServerPublish(draft, ownerId)`; panel now reads `serverPublishIssues` for both readiness and display, making the blank-card bug structurally impossible. Gate F. |
| ⚠️48 start-over demoted | DONE | Verified already-secondary/muted styling, own bordered box, unchanged `window.confirm` gate; no change needed. Gate F. |
| ⚠️49 final Step 7 hierarchy | DONE | Readiness → 3 confirmations → blockers → CTA → price → destructive action. Gate F. |
| ⚠️50 Preview final-inspection handoff | DONE | `continueToDashboardEs/En` Link to `/dashboard/ofertas-locales/[id]`; no new Stripe/session logic. Gate F. |
| ⚠️51 hard-refresh persistence | DONE | See Section 3 below. |
| ⚠️52 reuse-over-rebuild doctrine honored | DONE | See Section 8 below — zero new global/shared engines across Gates A–F. |
| ⚠️53 scanner protected boundary honored | DONE | See Section 9 below — zero protected-path files modified since seal. |

**Totals: DONE = 29, DEFERRED = 1, NOT APPLICABLE = 0, FAILED = 0.**

New deferred item discovered during Gate E (not part of the original ⚠️24–53 batch):

- **⚠️54 — Product taxonomy classifier substring collision.** `normalizeOfertaProductCategory` matches "Pantry" to the **bakery** group because "Pantry".toLowerCase() contains bakery's keyword substring `"pan"`. Pure display/filter-classification logic in `app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts` — zero scanner or persistence effect (confirmed: this function only maps already-stored `category`/`subcategory` text to a display bucket; it never mutates stored data). **DEFERRED** — not fixed in Gate E, F, or G per explicit instruction in all three tickets. Requires PM authorization to correct the keyword-matching order/specificity.

## 7. Hard-refresh result

Traced from source, not assumed:

- **Approved/rejected/needs_review status**: `patchOfertaLocalReviewItem` → `PATCH` request (`ofertasLocalesItemReviewClient.ts:55,67`) → server-side item update. DB-persisted, unaffected by any client-side gate change.
- **Field edits** (name, price, category, description, tags, commerce metadata): same `PATCH` pathway via `patchFromDraft`, DB-persisted.
- **Canonical listing id recovery**: `loadOfertaLocalAiScanSession()` reads from `localStorage`/`sessionStorage` (`ofertasLocalesAiScanRecordPersistence.ts`), independent of Gates A–F.
- **Owner-scoped draft identity**: `readOfertaLocalDraftOwnerStamp`/`writeOfertaLocalDraftOwnerStamp` (`ofertasLocalesDraftPersistence.ts`), consumed by `useOfertasLocalesDraft.ts` — untouched by Gates A–F (not in the changed-file list, Section 9).
- **Review items themselves**: `fetchOfertaLocalReviewItems` (`OfertasLocalesAiItemReviewPanel.tsx:737`) re-fetches from the server on every mount — the review UI never depends on any client-only cache of item state.
- **Gate D's `step5ReviewView` toggle**: explicitly ephemeral by design (`useState("files")`, no storage) — a hard refresh returns to the Files checklist, **not** to the product workspace, but the underlying review data and completion state are recovered independently and "Continuar revisión"/"Ver revisión" reopens the workspace without re-review.

**HARD REFRESH REQUIRES RE-REVIEW: FALSE.** No gap found; no new persistence created (none needed).

## 8. Globalization lock check

Diff against the scanner-seal baseline (`git diff --name-only 9095b3a97...HEAD`) touches exactly 22 files, all of which are either:
- `app/(site)/publicar/ofertas-locales/**` or `app/lib/ofertas-locales/**` (feature-scoped), or
- `scripts/*` / `package.json` (audit tooling).

No file under `app/components/`, no shared phone/WhatsApp/hours/gallery/payment/analytics/translation/address-verification module was created or modified. Confirmed: no new phone engine, no new WhatsApp engine, no new language engine, no new hours engine, no new gallery engine, no new payment engine, no new analytics engine, no new unsaved-exit engine, no new translation engine, no new address verifier. ⚠️46 remains deferred for exactly this reason — no reusable global unsaved-exit engine exists to hook into, and building an Ofertas-only one would violate this same doctrine.

## 9. Protected-path diff audit

All 11 source files changed since the seal baseline, cross-referenced against `OFERTAS_AI_SCANNER_PROTECTED_PATHS`:

```
app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx          safe
app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx  safe
app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx safe
app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx  safe
app/(site)/publicar/ofertas-locales/OfertasLocalesValidationPanel.tsx    safe
app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts     safe
app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx safe
app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx safe
app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts safe
app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts                 safe
app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts               safe (Gate A copy only)
```

**SCANNER PROTECTED FILES MODIFIED SINCE SEAL: NONE.**

## 10. Final user-flow diagram

```
Step 5 "Archivos" (files view)
  └─ upload checkpoint
  └─ scan checkpoint (OfertasLocalesAiScanPanel — PROTECTED, untouched)
  └─ review checkpoint
       "✓ Escaneo completado / N productos encontrados / N páginas procesadas"
       CTA: Revisar productos → / Continuar revisión → / Ver revisión →
            (openProductReviewWorkspace — view-state only, never re-scans)
       │
       ▼
Step 5 "Productos" (dedicated review workspace, full-width, two-column desktop / stacked mobile)
  └─ sticky flyer + editor (Gate D)
  └─ guided page review, page-complete CTA (green), final review-complete CTA (Gate C)
  └─ bilingual category hint on the category field (Gate E)
  └─ approved/rejected items reopenable, status preserved (Gate D)
  └─ ← Volver a Archivos (returns to files view, review data untouched)
       │
       ▼
Step 6 → Step 7 "Revisión final"
  └─ readiness summary (OfertasLocalesValidationPanel, ownerId-aware, honest)
  └─ 3 confirmations (businessFiles, aiItems*, leonixRules)
  └─ itemized blockers (only if incomplete)
  └─ CTA: Ver vista previa → (gated on step7ConfirmationsComplete)
  └─ price/package summary (OfertasLocalesCommercialSummary + billing disclosure)
  └─ secondary/destructive: Borrar esta solicitud y empezar de nuevo
       │
       ▼
Preview (final visual inspection point)
  └─ ← Volver a editar / ← Volver a revisión (existing nav, unchanged)
  └─ Enviar a Leonix para aprobación (existing submitOfertaLocalDraftForReview, now secondary)
  └─ Continuar para publicar → (NEW: routes to /dashboard/ofertas-locales/[id])
       │
       ▼
Owner Dashboard (UNCHANGED)
  └─ handleCheckout() → startRevenueCategoryCheckout({ category: "ofertas-locales", ... }) → Stripe
```

*aiItems confirmation only rendered when `aiIncludedInPackage` is true.

## 11. Step 5 review architecture

- `OfertasLocalesApplicationClient.tsx` owns `step5ReviewView` (ephemeral, `"files" | "products"`) and gates `showFullWidthReviewDesk`.
- `OfertasLocalesAiScanReviewWorkspace.tsx` — reused unchanged component wrapper; two-column grid (`xl:grid-cols-[minmax(0,54fr)_minmax(0,46fr)]`), flyer column sticky at `xl:top-20`.
- `OfertasLocalesAiItemReviewPanel.tsx` — reused, workspace-mode branch; owns counters, page picker, item editor, action-button hierarchy, completion CTAs.
- `OfertasLocalesProductClipPanel.tsx` / `OfertasClipReviewViewer.tsx` — reused, unmodified rendering logic (only page-nav labels relabeled).
- `ofertasLocalesProductTaxonomy.ts` — reused taxonomy data, one new bilingual display helper.

## 12. Step 7 / Preview / dashboard architecture

- Step 7 (`OfertasLocalesApplicationClient.tsx`, `case 7`) — readiness → confirmations → blockers → CTA → price → start-over. No checkout logic.
- `OfertasLocalesValidationPanel.tsx` — reused, now receives the ownerId-aware `serverPublishIssues` for both its ready/not-ready boolean and its displayed issues (same array, so they can never disagree).
- Preview (`OfertasLocalesPreviewClient.tsx` → `OfertasLocalesPreviewCard.tsx`) — reused rendering; new `dashboardHref` computed from `publishSuccess?.id ?? ofertaLocalId`; new `continueToDashboardEs/En` Link (primary); existing `submitOfertaLocalDraftForReview` preserved (now secondary styling).
- Dashboard (`app/(site)/dashboard/ofertas-locales/[id]/page.tsx`) — `handleCheckout` / `startRevenueCategoryCheckout` / `redirectToRevenueCategoryCheckout` completely unmodified.

## 13. Test matrix

| Suite | Result |
|---|---|
| `ofertas:ai-scanner-certified-baseline-audit` | PASS |
| Gate A audit | PASS (10/10 cases) |
| Gate B audit | PASS (6/6 cases) |
| Gate C audit | PASS (13/13 cases) |
| Gate D audit | PASS (18/18 cases) |
| Gate E audit | PASS (13/13 cases, "pantry" collision knowingly excluded from Case G's loop) |
| Gate F audit | PASS (22/22 cases) |
| Gate G audit (new) | PASS (16/16 cases) |
| `scanner-client-dispatch-regression-audit` | PASS |
| `scan-persist-publish-separation-audit` | PASS |
| `ai-entitlement-gate-regression-audit` | PASS |
| `ol7-ai-scan-action-candidate-review-audit` | PASS |
| `zero-candidate-review-state-audit` | PASS |
| `draft-identity-hydration-regression-audit` | PASS |
| `wizard-step-navigation-regression-audit` | PASS |
| `gate-1-foundation-audit` | PASS |
| `ofertas-advertiser-journey-audit.mjs` (updated Gate F) | PASS |
| `ofertas-package-10-product-completion-audit.mjs` (updated Gate F) | PASS |
| `ofertas-preview-submission-experience-audit.mjs` (updated Gate F) | PASS |
| `ofertas-public-state-resilience-audit.mjs` (updated Gate F) | PASS |
| `git diff --check` | clean |
| Full-repo `tsc --noEmit` | Only the 7 known pre-existing, unrelated e2e-spec errors |

## 14. Known deferred issues

- **⚠️46** — No reusable global unsaved-exit engine exists; building an Ofertas-only one would violate the reuse-over-rebuild doctrine. Deferred until a shared engine is designed.
- **⚠️54** — `normalizeOfertaProductCategory` classifies "Pantry" as bakery due to a keyword substring collision (`"pan"`). Display/filter-only, zero scanner or persistence impact. Deferred pending explicit PM authorization to touch classifier logic.

## 15. Explicit scanner-core lock reminder

The AI scanner core (readiness, scan-prep, scan route, Gemini, Document AI, provider fallback, normalization, item persistence, scanner DB schema, scanner ownership/RLS) that produced **127 products / 8 of 8 pages** on the certified Cardenas flyer **remains sealed and untouched** through Gates A–G. Any future change to a file listed in `app/lib/ofertas-locales/ofertasAiScannerProtectedPaths.ts` requires the REOPEN PROCEDURE in `OFERTAS_AI_SCANNER_SEALED.md` and re-running `npm run ofertas:ai-scanner-certified-baseline-audit` before and after.

## 16. Deployment / live-QA checklist

Before merge/deploy, a human should verify live, on staging or prod-preview:

- [ ] Upload a real multi-page flyer and confirm scan still returns full product counts (spot-check against the 127/8-page baseline behavior, not necessarily the exact same numbers).
- [ ] Confirm Step 5 Files view shows the dynamic "✓ Escaneo completado / N productos / N páginas" card after a scan.
- [ ] Click "Revisar productos →" and confirm the dedicated workspace opens without re-scanning.
- [ ] Approve/reject/review-later a few items; reopen an approved item and confirm its status doesn't reset.
- [ ] Hard-refresh mid-review and confirm all decisions are still there and "Continuar revisión" reopens the same state.
- [ ] Reach Step 7, confirm exactly 3 confirmation checkboxes (2 if the package excludes AI), and that "Ver vista previa" is visually locked until all are checked + email is valid.
- [ ] Confirm the "Envío para revisión" card never renders blank — either shows real issues or "✓ Listo para continuar".
- [ ] From Preview, confirm "Continuar para publicar →" routes to `/dashboard/ofertas-locales/[id]` and the existing "Pay now" flow still works end-to-end through Stripe checkout and returns to the dashboard.
- [ ] Confirm Spanish/English toggling shows correct primary/secondary bilingual category labels.
- [ ] Confirm no console errors on any of the above screens.

## 17. LIVE PRODUCTION QA REGRESSION — DEDICATED REVIEW / HARD REFRESH

**Status: NOT a final sign-off.** This section documents a regression caught during human production QA on the deployed `050c47ef` build (application `91480f95-ef6b-4641-8faf-05f437d0704c`) and the corrective fix applied on `integration/ofertas-locales-2026-07`. **Human visual QA of this fix on a fresh deploy has not yet occurred** — see item 5 below.

1. **Gate D honest limitation.** Gate D's `step5ReviewView` toggle was functionally separate from the Step 5 checklist (the workspace mounted in its own full-width section, gated by real view-state), but visually it still read as content appended underneath the Step 5 "Archivos" card rather than a genuinely distinct screen: no dedicated heading/identity, the Step 5 upload checklist and the wizard-level Back/Next footer both remained visible/present while the review workspace was open. Gate G's structural certification correctly verified the FUNCTIONAL separation existed but did not catch this residual VISUAL coupling, because no prior gate's regression audit asserted on the presence/absence of a distinct screen heading or on hiding the Step 5 footer during review.

2. **Human production QA finding.** After the owner had already reviewed and approved all 127/127 items across 8/8 pages, a hard refresh on the live production Step 5 screen showed "✓ Escaneo completado / [ Revisar productos → ]" followed by "Termina la revisión de IA para continuar." — a false blocker implying review had not started, when it was in fact 100% complete and persisted.

3. **Database status (read-only production audit, project `xuieateniufcrsfdomwl`, application `91480f95-ef6b-4641-8faf-05f437d0704c`).** Parent row confirmed (`owner_id 8eb33ba9-dac7-45e5-8b21-46464df7ae4d`, `status pending_review`, `ai_scan_status needs_review`, `ai_last_scan_job_id 75863f20-7407-49dd-8966-223e4a6415aa`). Scan job: 8/8 pages, 127 items extracted. `oferta_local_items`: **127 of 127 rows `review_status = 'approved'`**, distributed 16/16/16/15/16/16/16/16 across pages 1–8 (sums to 127). **All 127 review decisions persist. No data loss.** The bug was purely a client-side state-reconstruction gap, never a database issue.

4. **Repair implementation.**
   - **Root cause (proven, not assumed):** `aiReviewGate` — the client state driving `step5ReviewComplete` — was only ever populated by `OfertasLocalesAiItemReviewPanel`'s own effect, which only runs while the dedicated review workspace is mounted. `step5ReviewView` defaults to `"files"` on every fresh mount (Gate D, by design), so on a cold hard refresh the workspace never mounts, `aiReviewGate` stays at its zeroed initial value, and `step5ReviewComplete` (which requires `totalItems > 0`) falsely reads as incomplete regardless of real DB state.
   - **Fix:** added one lightweight `useEffect` in `OfertasLocalesApplicationClient.tsx` that reconstructs the same `OfertaLocalAiReviewGateState` shape directly from the existing certified `fetchOfertaLocalReviewItems` read path (reused unchanged, no new API) whenever a canonical id and last-scan-job id are known and the gate is still at its zeroed default. Once the workspace does mount, its own live effect takes over.
   - **Visual fix:** when `step5ReviewView === "products"`, the Step 5 card now shows a dedicated review-screen header (breadcrumb "Archivos · Revisión de productos", title "Revisar productos", live product/page count) instead of the upload checklist; the Start Over box and the wizard-level Back/Next footer are both hidden for that view. The dedicated review workspace (Gate D's two-column/sticky layout, unchanged) continues to own its own progression, including the existing direct-to-Step-6 completion CTA (`goToStep6`, unchanged). No new route, no new wizard step number, no new review system.
   - **Copy correction:** the "Termina la revisión de IA para continuar." blocker (shown only when genuinely incomplete, post-fix) was reworded to "Completa la revisión de productos antes de continuar a Extras." per the ticket's preferred honest phrasing.

5. **New regression coverage.** `scripts/ofertas-locales-gate-h-dedicated-review-hard-refresh-regression-audit.ts` (15 cases, A–O) — reconstruction runs independent of `step5ReviewView`, dedicated screen hides the Step 5 checklist/footer, completion routes directly to Step 6, all three CTA states (Revisar productos / Continuar revisión / Ver revisión) derive correctly, 127 review decisions are never written to by this client (read-only reconstruction), no scan triggered, no new API, no scanner-protected path touched.

**Human visual production QA of this specific fix is still PENDING** and must occur on a fresh deployment before any `LIVE PRODUCTION QA SIGN-OFF` section is added to this document.

## 18. LIVE HUMAN QA — WIZARD STEP ARCHITECTURE CORRECTION

**Status: NOT a final sign-off.** This section documents a second, deeper correction on top of section 17, made directly from live human QA of the deployed Gate H build, still on `integration/ofertas-locales-2026-07`. **Human visual production QA of this fix has not yet occurred.**

1. **Gate H's honest limitation.** Gate H fixed the cold-refresh reconstruction bug and gave product review a dedicated-looking screen, but kept that screen as a `step5ReviewView` sub-view of Step 5 — a deliberate risk-reduction compromise to avoid renumbering the wizard. Human QA on production proved the UX cost of that compromise too high: while a user reviewed 127 products, the wizard rail still read "5 Archivos," and Step 5 exposed two competing progression paths (a top "Continuar al siguiente paso →" box plus the generic wizard "Siguiente" button), neither of which matched what the user was actually doing.

2. **New QA items.**
   - ⚠️55 — Product review is now a **real, numbered wizard step**, not a Step 5 sub-view.
   - ⚠️56 — Step 5's competing/duplicate progression CTAs are removed; Step 5 owns only upload, scan, and a single scan-completion summary with one primary CTA.
   - ⚠️57 — The product-review step owns its own page-by-page progression and its own continuation into Extras; the generic wizard footer is hidden while it's open.

3. **Wizard renumbered from 7 to 8 steps — deliberately, this time.** The prior instruction to avoid renumbering was itself a risk-reduction compromise; human QA has overridden it.
   | # | ES | EN |
   |---|----|----|
   | 1 | Oferta | Offer |
   | 2 | Negocio | Business |
   | 3 | Detalles | Details |
   | 4 | Ubicación | Location |
   | 5 | Archivos | Files |
   | 6 | **Revisar productos** (new) | **Review products** (new) |
   | 7 | Extras (was 6) | Extras (was 6) |
   | 8 | Revisar (was 7) | Review (was 7) |

4. **Implementation.**
   - `ofertasLocalesWizardSteps.ts`: `OFERTAS_LOCALES_WIZARD_STEP_COUNT` → 8, `OfertasLocalesWizardStepId` → `1–8`, a new step-6 entry inserted, old steps 6/7 renumbered to 7/8, `clampWizardStep` and the hints tail-check updated to the new max.
   - `OfertasLocalesApplicationClient.tsx`: `step5ReviewView` state removed entirely. Step 5's `case 5` now renders only the upload checkpoint, the scan checkpoint, and — once scan is complete — a single completion summary (`✓ Escaneo completado` / product count / page count) with one primary CTA (`Revisar productos →` / `Continuar revisión →` / `Ver revisión →`, unchanged three-state derivation) that calls `setStep(6)`. The old review checkpoint card and the old top "Revisión completa" box are both removed — review no longer has a presence on Step 5 beyond that single CTA. A new `case 6` renders the dedicated review-screen header; the existing full-bleed section below the wizard shell (unchanged `OfertasLocalesAiScanReviewWorkspace`, unchanged two-column grid) is now gated on `step === 6` (`showStep6ReviewDesk`) instead of the removed sub-view toggle. `goToStep6` is renamed `goToStep7Extras` and now targets Step 7. The generic wizard Back/Next footer is hidden (`hideGenericFooter`) whenever Step 6 is open, or whenever Step 5 has completed its scan — eliminating the competing-CTA problem structurally rather than just visually.
   - **No new component, route, API, or DB change.** `OfertasLocalesAiScanReviewWorkspace` is reused byte-for-byte; `fetchOfertaLocalReviewItems` (Gate H's reconstruction effect) is untouched and still runs independent of which step the wizard is on.
   - **Old stored step compatibility.** A stored wizard step of `6` or `7` (meaningful under the previous 7-step numbering) is remapped to `5` on load, since Step 5 is always a safe landing spot regardless of which scheme wrote it — it never mis-renders a screen, and its own completion CTA immediately re-offers the correct next step from live, DB-backed review state. No draft data, asset, or review status is touched by this mapping.

5. **New regression coverage.** `scripts/ofertas-locales-gate-i-wizard-step-promotion-regression-audit.ts` (19 cases, A–S) — 8-step count, correct step identities, Step 5 never renders the review workspace, Step 5's CTA advances to Step 6, Step 6 reuses the existing workspace and rail-identifies as "Revisar productos," Step 6 completion advances directly to Step 7, Gate C's green CTA is intact, the completed-review state survives a hard refresh independent of step, no scan/API/DB side effects, old stored steps are safely remapped, and Step 8 preserves Gate F's Preview behavior exactly.
   - Gates D, E, F, G, H, and the standalone `ofertas-locales-wizard-step-navigation-regression-audit.ts` were re-verified against this change; the small number of assertions that literally encoded the now-superseded `step5ReviewView` mechanism (Gate D Cases A/C/R, Gate E Case N, Gate F Case U, Gate G Case D, Gate H Cases A/B/D/E/J, Gate C Case B's CTA copy) were updated to assert the equivalent guarantee against the new Step 6 architecture — the underlying protections (two-column layout, reopening approved items, no scan-on-open, no new API, cold-refresh reconstruction, scanner-protected paths untouched) are unchanged and still independently verified. All other gates ran unmodified and passed.

**Human visual production QA of this wizard-renumbering fix is still PENDING** and must occur on a fresh deployment before any `LIVE PRODUCTION QA SIGN-OFF` section is added to this document.

## 19. LIVE HUMAN QA — FINAL REVIEW WORKBENCH SIMPLIFICATION

**Status: NOT a final sign-off.** Human QA of Gate I's real Step 6 (still on the production deployment built from `45c19d01`) found two remaining layers of clutter left over from the Gate H/I transition, even though Step 6 was by then a real wizard step. **Human visual QA of this fix has not yet occurred.**

1. **Finding.** Step 5 showed its scan-completion summary twice — once in a separate green box floating above the checklist, and again (implicitly) in the already-collapsed scan checkpoint card's own summary line. Step 6 opened on a redundant intro card (breadcrumb, title, subtitle, count, "the review area is open below" hint) that only repeated what the wizard's own step header/rail already say, before the actual workbench appeared beneath it — the opposite of "enter Step 6 and immediately see the actual working interface."

2. **New QA items.**
   - ⚠️58 — Step 6 is exclusively flyer + product audit forms (verified; it already reused `OfertasLocalesAiScanReviewWorkspace` untouched, no upload/scan/Extras/membership fields ever leaked in).
   - ⚠️59 — Step 6's redundant intro/checkpoint card is removed; the workbench begins immediately.
   - ⚠️60 — Step 5 is reduced to exactly upload + AI analysis + a single review-progression CTA.
   - ⚠️61 — Each completed review page surfaces the existing green `Siguiente página →` CTA (Gate C, unchanged).
   - ⚠️62 — Final page completion surfaces the existing green `Continuar a Extras →` CTA (Gate C/I, unchanged) that opens Step 7 directly.

3. **Implementation.** Both changes are removals, not new machinery:
   - Step 5's `case 5`: the standalone green completion box (title/count/pages/CTA) is deleted. The scan checkpoint card's `summary` now also shows pages processed, and its `collapsedActions` now carries the one primary CTA (`step5ReviewOpenCtaLabel` → `openProductReviewWorkspace`) — so Step 5 has exactly one review-transition control, living inside the card it summarizes, not floating above it.
   - Step 6's `case 6`: the breadcrumb/title/subtitle/count/hint card is deleted; the branch now returns `null` for the normal (AI-included) case, so nothing renders inside the constrained wizard card and the existing full-bleed workspace section below is what the user sees. That section's "← Volver a Archivos" button row now also carries the small "127 productos · 8 páginas" supporting line, so the count isn't lost, just relocated next to the actual workbench instead of sitting in its own card above it.
   - No change to `OfertasLocalesAiScanReviewWorkspace`, `OfertasLocalesAiItemReviewPanel`, or any scanner-protected path — the page-by-page green CTA hierarchy (⚠️61/⚠️62) was already correct from Gates C/F/I and needed no rebuild.

4. **New regression coverage.** `scripts/ofertas-locales-gate-j-focused-review-ux-audit.ts` (30 cases, A–AD) — 8-step count intact, Step 5 has exactly one review CTA living in the scan card (no duplicate box, no third checkpoint card), Step 6 has no redundant intro and no upload/scan/Extras/membership content, the green page-complete and final-completion CTAs are unchanged and correctly wired, Step 7/8 content unchanged, approved-item reopening and bilingual taxonomy unchanged, hard-refresh reconstruction is step-independent, and no scanner/API/DB/Stripe surface was touched.
   - Two existing audits needed small updates to keep asserting the same guarantee against the new markup shape rather than the removed literal boxes: Gate H's Case D (its case-6 boundary regex assumed a `return (` immediately after `case 6:`, which is no longer always true now that the normal branch is `return aiIncludedInPackage ? null : (...)`) and Gate I's Case G (which asserted the now-deleted top green box's exact conditional instead of the CTA's new home in the scan card's `collapsedActions`). Both were updated to check the equivalent guarantee under the new markup; no assertion was weakened. All other gates (A, B, C, D, E, F, G, I, plus the five standalone audits) ran unmodified and passed.

**Human visual production QA of this workbench-simplification fix is still PENDING** and must occur on a fresh deployment before any `LIVE PRODUCTION QA SIGN-OFF` section is added to this document.

## 20. FINAL TWO-LANE PRODUCT CERTIFICATION

**Status: NOT a final sign-off — and not a full production rollout of either lane's commercial/entitlement pipeline.** This section documents the completion of Ofertas Locales as a genuine two-product offering: **Volante Interactivo** ($399/30d, AI-included, unchanged 8-step wizard) and **Cupones y Promociones** (FREE, manual-entry, new 7-step wizard, zero AI/scanner involvement). Everything below is source-verified (`scripts/ofertas-locales-gate-k-two-lane-final-verifier.ts`, 68 checks); **human visual QA of both lanes has not yet occurred.**

1. **Flyer lane architecture.** Unchanged from Gate J — 8 steps, `OFERTAS_LOCALES_FLYER_WIZARD_STEPS`, `aiIncluded: true` on both the display catalog and the commercial-product entry, $399/39900¢. Step 5 (Archivos), Step 6 (Revisar productos), Step 7 (Extras), Step 8 (Revisar) are byte-identical to the Gate J build; the switch's `case 7`/`case 8` now call shared `renderExtrasStepContent()`/`renderFinalReviewStepContent()` functions instead of inlining JSX, but the rendered output is unchanged (proven by Gate I/J re-runs, both still green).

2. **Coupon lane architecture.** New `OFERTAS_LOCALES_COUPON_WIZARD_STEPS` (7 steps: Oferta, Negocio, Detalles, Ubicación, **Cupones y ofertas**, Extras, Revisar). `ofertasLocalesWizardSteps.ts`'s step metadata, count, and `clampWizardStep` are now lane-parametrized (`getOfertasLocalesWizardSteps(isCouponsLane)` / `getOfertasLocalesWizardStepCount(isCouponsLane)`); `OfertasLocalesWizardProgress` takes `steps` as a prop instead of importing a fixed constant. The wizard `switch` reuses `renderExtrasStepContent()` at Step 6 and `renderFinalReviewStepContent()` at Step 7 for the coupon lane — no duplicated JSX between lanes.

3. **Coupon FREE correction.** `OFERTAS_LOCALES_COUPONS_PRICE_CENTS`, `OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.coupons.displayPriceUsd`, `OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons.amountCents`, `OFERTAS_LOCALES_PRICING.digitalCouponListing`, and the Step 1 card's own price field all changed from the stale $199 to `0`. `OfertasLocalesCommercialSummary` now renders `GRATIS`/`FREE` instead of `$0.00`, hides the Total row and the promo-code UI entirely for a $0 product (nothing to discount), and drops the "IA incluida" duration note when the resolved commercial product isn't AI-included.

4. **Coupon no-AI rule.** `OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.coupons.aiIncluded` and `OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons.aiIncluded` are now `false` (the commercial product type was widened from a hardcoded `true` literal to `boolean`). Because nearly every AI/scan gate in the client already keys off `isOfertaLocalAiIncludedInPackage(draft)` — `step5ScanRequired`, `showStep6ReviewDesk`, the Step 7/8 `aiItems` confirmation, the scan-summary details block — this single source-of-truth change structurally removes the scan panel, the review workspace, and the AI confirmation from the coupon lane everywhere, with no per-call-site special-casing needed. The protected `ofertasLocalesAiScanPersist.ts` validator already gated on this same flag (`if (!isOfertaLocalAiIncludedInPackage(draft)) issues.push(...)`), so `canOfertaLocalDraftPersistForAiScan()` now correctly returns `false` for a coupon draft with no code changes to that protected file at all — proven by an updated Case F in `scripts/ofertas-locales-scan-persist-publish-separation-audit.ts` (previously asserted the opposite, now-obsolete, pre-ticket behavior).
   - **Canonical-row persistence without AI.** The coupon lane previously (accidentally) depended on the AI scan panel being visible to trigger `ensureOfertaLocalRecordForAiScan` and create its canonical `ofertas_locales` row. Since that panel no longer renders for this lane, a new unprotected file `ofertasLocalesCouponRecordPersistClient.ts` calls the *same existing* `/api/ofertas-locales/scan-prep` endpoint/request-response contract (no new API, no scanner file touched) so the coupon lane still gets a real, persisted, hard-refresh-safe row for every field that endpoint's protected row-builder already understands (business info, location, contact, `coupon_assets`).

5. **Repeatable individual coupons.** New `OfertaLocalCouponEntryDraft` type (`id`, `title`, `description`, `couponCode`, `expirationDate`, `redemptionNote`, `imageUrl`, `imageUploadedUrl`, `imageUploadedFileName`) and `draft.couponEntries: OfertaLocalCouponEntryDraft[]`. `addCouponEntry`/`patchCouponEntry`/`removeCouponEntry` are plain array operations with **no cap** — deliberately not copying the Restaurante/Servicios 4-item limit or its `couponUpgradeEnabled`/`couponMonthlyPrice` paid-add-on gating, per the ticket's explicit instruction to reuse only the Restaurante *UX pattern* (repeatable card, image upload-or-URL either/or block with an "✓ Imagen añadida" accepted state), never its business rules.

6. **Discovery/search structure — proven, reported gap (Gate K item 38).** Individual coupon entries are fully authored, edited, validated (`hasCouponContent` now also accepts a titled `couponEntries` row, avoiding a redundant second title/description prompt), and rendered in Preview from the draft — they persist across a hard refresh in the same browser via the same generic `localStorage` draft mechanism every other wizard field already uses before a canonical row exists. They do **not** yet reach a structured, publicly-searchable database row. This was investigated, not assumed: the scanner-owned `oferta_local_items` table (where AI-extracted products/coupons already become searchable via `candidate_type: "coupon" | "promo"`) requires either a new insert path outside the sealed scan pipeline or a new API route — both forbidden without an explicit scanner/API reopen. The generic `draft_snapshot` JSONB column *could* safely carry this data in principle (it already does for `membershipCtaLabel`/`magazine.*`), but every current writer of that column (the protected `buildDraftSnapshotFromDraft` in `ofertasLocalesProductionRowAdapter.ts`, and the resubmit-only `ofertasLocalesOwnerUpdateMapper.ts`) uses a narrow explicit allowlist that doesn't forward these new fields, and the only unprotected insert path (`publish/route.ts`) additionally requires an active paid/partner-courtesy commercial entitlement to reach `pending_review` — a Stripe-adjacent business-rule decision (should FREE auto-grant entitlement, and how) this gate does not have authorization to make silently. **No DB migration, no new API, and no entitlement-logic change were made.** This is the one deliberate STOP per the ticket's own "STOP BEFORE INVENTING A NEW DB SCHEMA" clause.

7. **Full promo flyer + more-offers URL.** The "full flyer de cupones o promociones" reuses the *existing* `couponAssets` field/column/Preview-hero mechanism unchanged (no new persistence surface). `couponsMoreOffersUrl`/`couponsMoreOffersLabel` are new draft-only fields (same local-persistence profile as the coupon entries above), rendered as a `[Ver más cupones →]` button in Preview only when a URL is present, with the ticket's specified default label and empty-hides-CTA behavior.

8. **Shared application standards.** Step 2 (business identity/logo/taxonomy), Step 4 (location/phone/WhatsApp/website), and Extras (email/social/membership/digital-coupon) render from one shared case each for both lanes — confirmed lane-agnostic aside from pre-existing, intentional label-text differences (e.g. "Título de la promoción" vs "de la oferta"). `formatOfertaLocalPhoneDisplay` (shared, unchanged) already detects `+`-prefixed or extension-bearing input and passes it through unmasked, so WhatsApp was already international-safe before this gate — no fix needed.

9. **Preview parity.** `OfertasLocalesPreviewCard.tsx` gained a `#cupones` section (rendered only for the coupon lane, only when at least one titled entry exists) with per-coupon cards (image, code pill, title, description, valid-until, redemption note), a "Ver flyer de promociones →" button when a promo-flyer asset exists, and the more-offers CTA. `editHref`/`editReviewHref` are now lane-aware: "back to edit" lands on each lane's real Extras step (6 for coupons, 7 for flyer), and "back to review" (`?review=1`, AI-specific) is `null`/hidden entirely for the coupon lane rather than pointing at a step that no longer has anything to review.

10. **Global deferred items.** None newly identified beyond the existing ⚠️46 (unsaved-exit) and ⚠️54 (pantry taxonomy) — both untouched by this gate. WhatsApp formatting (checked above) needed no fix. `isFeaturedRequested`/`magazinePickupNotes`/`magazineDistributionStatus`/`magazineMonthlyDropEstimate`/`internalNotes` were re-confirmed to already be non-owner-facing (no visible form field renders them; the featured-placement UI block remains structurally gated `{false ? (...) : null}` from Gate F) — nothing to remove.

**New regression coverage.** `scripts/ofertas-locales-gate-k-two-lane-final-verifier.ts` — 68 checks; 67 TRUE, 1 honestly FALSE (item 38, documented above, not a silent failure — the script itself asserts that *exactly* item 38 is the only failing check and throws if any other item regresses). All prior gates (A–J) and the five standalone audits re-ran unmodified except: Gate H Case D, Gate I Case O/P, and Gate J Case U/V (case-boundary/markup regexes updated to match the shared-function refactor, not weakened), and `scan-persist-publish-separation-audit` Case F (updated from asserting the old "coupon can always AI-scan" behavior to the new, correct "coupon lane has no AI entitlement, so it can never persist for scan" behavior — a behavior change in a *protected* file's output caused entirely by an *unprotected* catalog-flag flip, not by editing that protected file).

**Human visual production QA of both lanes (flyer end-to-end unchanged; coupon end-to-end new) is still PENDING** and must occur on a fresh deployment before any `LIVE PRODUCTION QA SIGN-OFF` section is added to this document.
