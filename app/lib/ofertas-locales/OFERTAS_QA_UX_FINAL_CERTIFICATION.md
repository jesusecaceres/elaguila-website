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
