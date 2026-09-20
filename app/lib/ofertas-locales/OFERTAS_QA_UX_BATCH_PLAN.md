# Ofertas Locales — QA UX Batch Plan (⚠️24–⚠️53)

**PLAN ONLY. No implementation has occurred. No files other than this plan document were created or modified while producing it.**

Scanner baseline audit (`npm run ofertas:ai-scanner-certified-baseline-audit`): **PASS**, verified immediately before this plan was written.

Sealed scanner baseline: `9095b3a97fe8ad4fd36543f41ea0ca6a7a0df0f0`. Every proposal below was checked against `app/lib/ofertas-locales/ofertasAiScannerProtectedPaths.ts` — see the per-item "SCANNER PROTECTED PATH TOUCHED" row and §"Scanner Protected Boundary" summary at the end.

Every claim below was read directly from current source. Anything not directly verified is marked `UNKNOWN — NEEDS SOURCE VERIFICATION`.

---

## ⚠️24 — "Actualizar ahora" is misleading

| | |
|---|---|
| CURRENT FILE/COMPONENT | `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx` (buttons at lines ~1470 and ~1491); copy in `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts` (`aiReviewRefresh`, line 291/453-area) and `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts` (`refreshNow`/`refreshBackupHint`, lines 87-89) |
| CURRENT BEHAVIOR | Two separate render branches in the same panel use two different labels for the same action. Branch A (line 1470): plain button, `onClick={() => void loadItems()}`, label `c.aiReviewRefresh` = **"Actualizar"** — no explanatory copy. Branch B (line 1491): same `loadItems()` call, label `scanCopy.refreshNow` = **"Actualizar ahora"**, already paired with `scanCopy.refreshBackupHint` = *"Los resultados se actualizan automáticamente. Usa esto solo si algo no aparece."* — this is already almost word-for-word the ticket's own preferred copy. **Confirmed: both buttons call only `loadItems()` — a GET re-fetch of review items/scan job state. Neither button re-triggers a scan, calls `/api/ofertas-locales/scan`, or touches the provider.** |
| PROPOSED CHANGE | Harmonize both branches to one label ("Actualizar resultados", matching the ticket's preferred direction) and ensure both branches always show the `refreshBackupHint`-style helper copy, not just Branch B. |
| CLASSIFICATION | **COPY** |
| SCANNER PROTECTED PATH TOUCHED | FALSE — `OfertasLocalesAiItemReviewPanel.tsx` is not in the protected manifest; `loadItems()` calls the REVIEW_DATA-category `GET /api/ofertas-locales/items` route, whose *contract* is untouched (only a label string changes, not the call itself) |
| RISK | LOW |
| TEST REQUIRED | Manual: click the renamed button in both render states (workspace/compact) and confirm only a GET to `/api/ofertas-locales/items` fires, no `POST /scan`. Structural audit assertion: label string updated in copy file, `loadItems()` call sites unchanged. |
| DEPENDENCIES | none |

---

## ⚠️25 — Product review must become a dedicated review experience

| | |
|---|---|
| CURRENT FILE/COMPONENT | `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx` (`showFullWidthReviewDesk`, line ~328; rendering at lines 2046-2066); `OfertasLocalesAiScanReviewWorkspace.tsx` (already a two-column workspace); `OfertasLocalesAiItemReviewPanel.tsx` |
| CURRENT BEHAVIOR | Step 5 already contains three collapsible `Step5CheckpointCard`s (Upload / Scan / Review) stacked in the normal wizard card. **Separately**, when `step === 5 && aiIncludedInPackage && effectiveOfertaLocalId` is true, a full-width `<section ref={reviewWorkbenchRef}>` renders `OfertasLocalesAiScanReviewWorkspace` **below** the wizard card, on the same page. The Review checkpoint card's "Ver productos de esta página" button calls `scrollToReviewWorkbench` — i.e. today's "dedicated experience" is a same-page scroll-to-section, not a distinct screen/state. `OfertasLocalesAiScanReviewWorkspace` itself is *already* a two-column grid (`xl:grid-cols-[minmax(0,54fr)_minmax(0,46fr)]`) with the flyer/clip panel on one side and the item editor on the other (relevant to ⚠️28 too). |
| PROPOSED CHANGE | Introduce a client-local view-state (e.g. `step5View: "checklist" | "review"`) inside `OfertasLocalesApplicationClient.tsx`. When scan completes, Step 5 shows a compact "Escaneo completo — Revisar productos" CTA instead of the full workspace inline; clicking it swaps `step5View` to `"review"`, which renders the **exact same** `OfertasLocalesAiScanReviewWorkspace` component full-viewport-width, with a "Volver a Archivos" exit control. No new route, no new API, no new scanner call — purely a client-state toggle around an already-existing component. |
| CLASSIFICATION | **REUSE** (existing pathway/component) + **SMALL LOCAL LOGIC** (the view-state toggle) |
| SCANNER PROTECTED PATH TOUCHED | FALSE — `OfertasLocalesApplicationClient.tsx` and `OfertasLocalesAiScanReviewWorkspace.tsx` are both outside the protected manifest; no scan/provider/persistence call is added, removed, or reshaped |
| RISK | LOW-MEDIUM (state-toggle regression risk on draft/scan-poll continuity if the toggle unmounts/remounts the workspace — must preserve polling refs) |
| TEST REQUIRED | Regression: scan completes → review CTA appears → click → workspace shows same 127-item state → exit → return to checklist → re-enter review → item state (approved/rejected counts) unchanged. Structural audit: no new fetch/insert call introduced. |
| DEPENDENCIES | Should land after ⚠️30 (counter accuracy) so the "Revisar productos" CTA's item count is trustworthy from day one. |

---

## ⚠️26 — Strong "Siguiente página" completion CTA

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx` — page-completion state is not directly located in this pass; the panel does compute `needsReviewCount`/page-scoped filters (see ⚠️30 evidence). Existing copy `aiReviewPageComplete: "Página {page} completa. Puedes continuar a la siguiente página."` already exists in `ofertasLocalesApplicationCopy.ts` (line ~315). |
| CURRENT BEHAVIOR | The copy string for a page-complete message already exists in the copy file. `UNKNOWN — NEEDS SOURCE VERIFICATION`: whether it is currently rendered as a small inline text or not rendered at all, and the exact "next page" control it's paired with. |
| PROPOSED CHANGE | Render `aiReviewPageComplete` as a prominent green completion banner (per Leonix's "deep green = completion/trust" role) with a large "Siguiente página →" primary-styled button, replacing/augmenting the current small page-nav control for the guided flow. |
| CLASSIFICATION | **STYLE** + **LAYOUT** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual: reach a page where all items are approved/rejected/reviewed, confirm the green CTA appears and advances the page filter without any network call to scan/persistence endpoints. |
| DEPENDENCIES | ⚠️29 (page-nav hierarchy), ⚠️32 (CTA hierarchy) should be designed together to avoid two competing "next" concepts. |

---

## ⚠️27 — Last page completion CTA

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx`, Step 5 case, lines 1377-1391 |
| CURRENT BEHAVIOR | **Already exists and is close to the desired design**: when `step5ReviewComplete && step5UploadComplete`, an emerald-bordered card renders `c.step5CheckpointReviewComplete`, an item-count line (`c.step5ReviewCompleteCount`), and a primary button `onClick={goToStep6}` labeled `c.step5ContinueToNextStep`. This card is rendered at the TOP of the Step 5 case body (line 1377), meaning it appears above the checkpoint cards — not necessarily co-located with where the user finishes the last page inside the review workspace itself. |
| PROPOSED CHANGE | Confirm this same completion card (or an equivalent one) also renders **inside/adjacent to the review workspace** at the moment the last page's last item is resolved, so the user doesn't need to scroll up to discover it — add the "8 de 8 páginas completas" page-count line using `oferta_local_scan_jobs`-sourced `completedPages`/`totalPages` (already available via `liveJob`/`aiReviewGate` state) next to the existing count line. |
| CLASSIFICATION | **LAYOUT** (relocate/duplicate an existing completion card) + **COPY** (page-count line) |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual: complete the last page of a multi-page scan, confirm the completion card is visible without scrolling to the top of Step 5. |
| DEPENDENCIES | ⚠️25 (dedicated review view) — this card belongs inside that view. |

---

## ⚠️28 — Flyer and editor must remain cross-referenceable

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiScanReviewWorkspace.tsx`, lines 159-212 |
| CURRENT BEHAVIOR | **Already a two-column grid** (`grid xl:grid-cols-[minmax(0,54fr)_minmax(0,46fr)]`): left/`order-1` on `xl` is `OfertasLocalesProductClipPanel` (flyer/source with highlight), right/`order-2` is `OfertasLocalesAiItemReviewPanel`. Selection is bridged via `viewerBridge` (`selectItem`, `onPageChange`, `onShowOnFlyer`, `highlightFlyer`) — clicking a product highlights it on the flyer and vice versa. Below `xl` breakpoint, order flips (editor first, flyer second) and there's a `mobileViewerCollapsed` toggle for the flyer pane. |
| PROPOSED CHANGE | Add `sticky top-* self-start` positioning to the flyer/clip column and a bounded-height scroll container to the editor column on `xl`+ viewports, so long editor content scrolls independently while the flyer pane stays in view. Do not touch `viewerBridge` selection logic. |
| CLASSIFICATION | **STYLE** / **LAYOUT** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW-MEDIUM (sticky positioning interacting with the site's own header/nav sticky elements needs a real-browser check, not just code review) |
| TEST REQUIRED | Manual, desktop: scroll a long product edit form, confirm flyer pane stays visible and bbox highlight still updates on selection. |
| DEPENDENCIES | none |

---

## ⚠️29 — Existing tiny page controls become secondary

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx` — exact PÁG. ANT./PÁG. SIG. control location not read in this pass. `UNKNOWN — NEEDS SOURCE VERIFICATION` for exact line. |
| CURRENT BEHAVIOR | UNKNOWN — NEEDS SOURCE VERIFICATION (button exists per the ticket's own description; not located precisely in this reconnaissance pass). |
| PROPOSED CHANGE | Restyle (visually de-emphasize, e.g. smaller/ghost style) without removing — keep as a manual override path alongside the new primary page-completion CTA from ⚠️26. |
| CLASSIFICATION | **STYLE** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual: confirm PÁG. ANT./SIG. still functions identically after restyle. |
| DEPENDENCIES | ⚠️26, ⚠️32 |

---

## ⚠️30 — Review counters/status are contradictory

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx`, lines 889-901, 1284-1299 |
| CURRENT BEHAVIOR | Items fetched from `/api/ofertas-locales/items` (all 127, presumably) are narrowed twice before becoming the counters shown to the user: `assetScopedItems = items.filter(item => item.sourceAssetId === selectedSourceAssetId)` (line 889-893), then in workspace mode further scoped to `activeScanJobId` for the `gateItems` used to compute `totalItems`/`needsReviewCount` (lines 1284-1287: `totalItems: gateItems.length`, `needsReviewCount: gateItems.filter(...)`.length`). **Mechanism proven**: if the currently-selected asset tab (`selectedSourceAssetId`) or the resolved `activeScanJobId` does not match the asset/job that actually produced the 127 persisted items — e.g. a stale/default tab selection, or `activeScanJobId` resolving to `null`/a different job than `highlightScanJobId` — the gate counters compute against an empty subset while the raw `items` array is genuinely non-empty. This is a **real, structurally-possible cause**, not a guess about symptoms. `UNKNOWN — NEEDS SOURCE VERIFICATION`: the exact state values (`selectedSourceAssetId`, `activeScanJobId`) present during the specific live QA session that showed 0/0/0/0 — I cannot prove which one was stale without live reproduction. |
| PROPOSED CHANGE | Add a fallback: if `gateItems.length === 0` but `assetScopedItems.length > 0` (i.e. items exist for the selected asset but none matched the resolved job id), fall back to computing counters from `assetScopedItems` directly instead of the job-scoped subset, and log/surface which scan job the displayed items actually belong to. This is the smallest change that fixes the *symptom* (contradictory zero) without touching persistence. |
| CLASSIFICATION | **SMALL LOCAL LOGIC** |
| SCANNER PROTECTED PATH TOUCHED | FALSE — this is a client-side display-filter fix, not a change to `oferta_local_items` writes, the `/items` route's query, or any protected persistence path |
| RISK | MEDIUM (touches the counter computation that several other UI surfaces read from `onReviewGateChange`) |
| TEST REQUIRED | Regression: construct a fixture where `assetScopedItems` has items but `activeScanJobId` doesn't match any of their `scanJobId`s — assert counters no longer show 0 while items exist. Also assert the existing zero-*true*-candidate case (no items at all) still shows 0 correctly (must not regress `zero-candidate-review-state-audit`). |
| DEPENDENCIES | Should land before ⚠️25 (dedicated review screen) so the new screen doesn't inherit a known-wrong counter. |

---

## ⚠️31 — Approved/reviewed products must remain reopenable

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx`; `app/api/ofertas-locales/items/[itemId]/route.ts` (PATCH); `ofertasLocalesItemReviewMapper.ts` |
| CURRENT BEHAVIOR | `UNKNOWN — NEEDS SOURCE VERIFICATION` — the exact click handler for a highlighted flyer region / item row was not traced to its precise "does it open the editor for already-approved items" branch in this pass. The PATCH endpoint itself (`validateOfertaLocalItemReviewPatch`) is generic and accepts `review_status` transitions among `pending|needs_review|approved|rejected` plus `is_active` — nothing in the route contract inherently blocks re-opening an approved item for edits. |
| PROPOSED CHANGE | If the click handler currently gates opening the editor on `review_status !== "approved"` (or similar), remove that gate so any item (regardless of status) opens the editor on click; "Guardar cambios" continues to PATCH the same row via the existing endpoint. Do not change `review_status` semantics or add a new transition. |
| CLASSIFICATION | **SMALL LOCAL LOGIC** (pending confirmation of the exact current gate) |
| SCANNER PROTECTED PATH TOUCHED | FALSE — `[itemId]/route.ts` is in the manifest (REVIEW_DATA) but its *request/response contract* is unchanged; only a client-side "can I open this row" condition changes |
| RISK | LOW |
| TEST REQUIRED | Manual: approve an item, click it again, confirm the editor opens with current values and a save succeeds via the existing PATCH route. |
| DEPENDENCIES | none |

---

## ⚠️32 — Product-review CTA hierarchy needs cleanup

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx`; copy keys in `ofertasLocalesApplicationCopy.ts`: `aiReviewApproveAndNext` ("Aprobar y seguir"), `aiReviewReviewLater`/`aiReviewNeedsReview` ("Revisar después"), `aiReviewSaveEdits`/`aiReviewSave` ("Guardar cambios"), `aiReviewRejectProduct`/`aiReviewReject` ("Rechazar producto"), `aiReviewApprove` ("Aprobar") |
| CURRENT BEHAVIOR | Confirmed the exact set of six action labels the ticket describes all exist as real copy keys today, consistent with the reported "competing workflows" feel. |
| PROPOSED CHANGE | Re-skin (not rewire) existing buttons into the requested hierarchy: PRIMARY (burgundy) = Aprobar y continuar; SECONDARY (cream/gold outline) = Guardar cambios, Revisar después; PRODUCT NAV (plain/ghost) = Producto anterior / Siguiente producto; DESTRUCTIVE (red outline) = Rechazar producto; PAGE COMPLETION (green) = Siguiente página. Each button keeps its existing `onClick` handler — only visual role/prominence and grouping change. |
| CLASSIFICATION | **STYLE** + **LAYOUT** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual: every relabeled/restyled button still fires its original handler (approve/reject/save/review-later all persist correctly via existing PATCH calls). |
| DEPENDENCIES | ⚠️26, ⚠️29, ⚠️37 (naming disambiguation) |

---

## ⚠️33 — Spanish UI shows English-only category taxonomy

| | |
|---|---|
| CURRENT FILE/COMPONENT | `app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts` (taxonomy exists); usage confirmed only in `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx`; the review editor (`OfertasLocalesAiItemReviewPanel.tsx` line ~420) renders the raw `draftFields.category` value directly with no taxonomy lookup |
| CURRENT BEHAVIOR | **A canonical bilingual+emoji taxonomy already exists** (`OFERTA_PRODUCT_TAXONOMY`, each entry has `key`, `emoji`, `es`, `en`, `keywords`) and is explicitly documented as "does NOT change stored data — a display + grouping layer." It's currently wired into the customer-facing preview grid but **not** into the review editor, which is why raw English/inconsistent category text (e.g. "Meat & Seafood") shows through unmapped in the review UI. |
| PROPOSED CHANGE | Apply the same `OFERTA_PRODUCT_TAXONOMY` keyword-matching lookup already used by the preview grid to the review editor's category display, rendering both `es`/`en` labels per the ticket's example format. No new taxonomy, no schema change — reuse the existing module. |
| CLASSIFICATION | **REUSE** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Structural: review editor category display resolves through `OFERTA_PRODUCT_TAXONOMY` for known keywords and falls back to `"other"` gracefully for unmatched raw categories. |
| DEPENDENCIES | none |

---

## ⚠️34 — Category visual cues/icons

| | |
|---|---|
| CURRENT FILE/COMPONENT | `app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts` |
| CURRENT BEHAVIOR | Each taxonomy entry already carries an `emoji` field (🍎 produce, 🥖 bakery, etc.) — a repo-native "icon map" already exists in exactly the form the ticket asks to prefer over hardcoded emoji. |
| PROPOSED CHANGE | Render `entry.emoji` alongside the bilingual label wherever ⚠️33 is applied. This is the same change as ⚠️33, not a separate implementation. |
| CLASSIFICATION | **REUSE** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Same as ⚠️33. |
| DEPENDENCIES | ⚠️33 (same change) |

---

## ⚠️35 — Product name/translation scope

| | |
|---|---|
| CURRENT FILE/COMPONENT | N/A — planning/doctrine item, not a single file |
| CURRENT BEHAVIOR | No product-name/description translation engine exists (confirmed by absence of any translation-service import in the normalizer/persistence files read this session). |
| PROPOSED CHANGE | No implementation in this batch beyond ⚠️33/⚠️34's category bilingual work. Explicitly do NOT build a translation engine. Tag/search bilingual-improvement (mentioned in the ticket) should be scoped as its own future item once the category taxonomy reuse (⚠️33) is live and its search-relevance impact can be measured — not implemented now. |
| CLASSIFICATION | **N/A (doctrine only)** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | N/A |
| TEST REQUIRED | none in this batch |
| DEPENDENCIES | ⚠️33 |

---

## ⚠️36 — Review workspace has too much vertical travel

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx`, `OfertasLocalesAiScanReviewWorkspace.tsx` |
| CURRENT BEHAVIOR | Confirmed structurally: the workspace stacks a header row, optional asset-tab row, then the two-column grid (clip panel + review panel), and the review panel itself stacks page summary / item list / editor / action buttons vertically inside its own column. Exact spacing values not exhaustively audited in this pass. |
| PROPOSED CHANGE | Bundled with ⚠️25's dedicated-screen work and ⚠️28's sticky layout — compact the review panel's internal vertical rhythm (reduce redundant section padding, collapse the page-summary line into the sticky editor header) as part of the same layout pass rather than as an isolated change. |
| CLASSIFICATION | **LAYOUT** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual visual review, before/after. |
| DEPENDENCIES | ⚠️25, ⚠️28 |

---

## ⚠️37 — Ambiguous "Atrás/Siguiente"

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesAiItemReviewPanel.tsx` (product/page nav), `OfertasLocalesApplicationClient.tsx` (`goBack`/`goNext`, wizard-level Atrás/Siguiente at lines 2007-2022) |
| CURRENT BEHAVIOR | The wizard-level Atrás/Siguiente (`c.wizardBack`/`c.wizardNext`) is a distinct, already-generically-labeled control from whatever product/page nav exists inside the review panel. The exact current labels for product-vs-page nav inside the panel are `UNKNOWN — NEEDS SOURCE VERIFICATION` for this pass (not fully traced). |
| PROPOSED CHANGE | Ensure four distinct, unambiguous labels exist inside the review experience: "Producto anterior" / "Siguiente producto" (item-level) and "Página anterior" / "Siguiente página" (page-level), plus a distinct "Volver a Archivos" exit control (⚠️25's new toggle) — never reusing the wizard's generic "Atrás"/"Siguiente" inside the review screen. |
| CLASSIFICATION | **COPY** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual: confirm no two distinct navigation actions share the same visible label inside the review screen. |
| DEPENDENCIES | ⚠️25, ⚠️29, ⚠️32 |

---

## ⚠️38 — Finished-review state needs real completion UX

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx`, lines 1377-1391 (same completion card documented in ⚠️27) |
| CURRENT BEHAVIOR | The completion card already exists with a real continuation CTA (`goToStep6`) — this is not a "generic wizard Siguiente elsewhere" gap in Step 5's checklist view. The ticket's complaint likely refers to the moment of finishing the *last item on the last page inside the review workspace itself*, before the user has navigated back up to see this card (same root issue as ⚠️27). |
| PROPOSED CHANGE | Same as ⚠️27 — surface an equivalent completion card at the point of completion inside the review workspace, not only in the collapsed checklist view above it. |
| CLASSIFICATION | **LAYOUT** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Same as ⚠️27. |
| DEPENDENCIES | ⚠️25, ⚠️27 |

---

## ⚠️39 — Step 7 is overloaded

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx`, `case 7:` (lines 1775-1920+, read in full this session) |
| CURRENT BEHAVIOR | Confirmed Step 7 currently renders, in order: a "final review" card (title + submit-success/not-public-yet copy) → `OfertasLocalesCommercialSummary` (price/package) → a "continue to secure checkout" link (`continueSecureCheckout`, gated on `effectiveOfertaLocalId`) → conditionally the AI scan summary/continue-reviewing details block, OR the live `OfertasLocalesAiScanPanel` inline if no scan yet → `OfertasLocalesValidationPanel` (publish/preview readiness issues) → 4 confirmation checkboxes → save-draft/preview/start-over action row. This matches the ticket's description of an overloaded step exactly. |
| PROPOSED CHANGE | See ⚠️40/⚠️41/⚠️42/⚠️49 below for the specific simplifications; this row is the umbrella tracking item. |
| CLASSIFICATION | **LAYOUT** (composed of the sub-items below) |
| SCANNER PROTECTED PATH TOUCHED | FALSE — Step 7 consumes `OfertasLocalesAiScanPanel`/`OfertasLocalesValidationPanel` output, doesn't alter their contracts |
| RISK | MEDIUM (largest single-step rearrangement in the batch) |
| TEST REQUIRED | Full Step 7 regression pass after ⚠️40-⚠️42/⚠️49 land together. |
| DEPENDENCIES | ⚠️40, ⚠️41, ⚠️42, ⚠️43, ⚠️44, ⚠️45, ⚠️47, ⚠️48, ⚠️49 |

---

## ⚠️40 — Remove payment from Step 7

**GAP 1 RESOLVED — full pathway traced from source.**

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx` Step 7 (`continueSecureCheckout` link, line ~1793); `app/(site)/dashboard/ofertas-locales/[id]/page.tsx` (`handleCheckout`, lines 240-258); `app/lib/listingPlans/revenueCategoryCheckoutClient.ts` (`startRevenueCategoryCheckout`, `redirectToRevenueCategoryCheckout`) |
| CURRENT BEHAVIOR | **The real payment pathway does not run through Preview at all.** Step 7's "Continuar a pago seguro" is a plain `<Link href={`/dashboard/ofertas-locales/${id}?lang=${lang}`}>` — it navigates to the **owner dashboard listing page**, not to Preview. That dashboard page owns the actual checkout logic: `handleCheckout()` (guarded by `offer?.commercialProductKey && offer.checkoutEligible`, both fetched server-side for the canonical row) calls the shared, category-parameterized `startRevenueCategoryCheckout({ category: "ofertas-locales", packageKey: offer.commercialProductKey, listingId: offer.id, leonixAdId: offer.leonixAdId, returnPath: "/dashboard/ofertas-locales/${offer.id}?...", locale })`, then `redirectToRevenueCategoryCheckout(result.checkoutUrl)` sends the browser to Stripe; return lands back on the same dashboard page. Separately, `OfertasLocalesPreviewClient.tsx` (the Preview page) has **no payment code at all** — its only action is `handleSubmitForReview` → `submitOfertaLocalDraftForReview(draft, {...})` → `POST /api/ofertas-locales/publish`, a pure submission-for-review call. |
| PROPOSED CHANGE | Do not bare-remove Step 7's dashboard link — it is currently the *only* route from the wizard into real checkout. Smallest safe change: relocate the exact same `<Link href={`/dashboard/ofertas-locales/${id}...`}>` from Step 7 onto the Preview page (Preview already has the canonical id via `aiSession.ofertaLocalId`, loaded from `loadOfertaLocalAiScanSession()` — no new data-fetching needed). Then remove it from Step 7. Pure MOVE of one existing `<Link>`; zero new Stripe/checkout code; the dashboard's `handleCheckout` remains the single owner of real checkout, completely untouched. |
| CLASSIFICATION | **LAYOUT/MOVE** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW — link relocation only; the actual checkout owner (dashboard page) is not touched |
| TEST REQUIRED | Manual: from Preview, click the relocated link, confirm it lands on the dashboard with `handleCheckout` unchanged; confirm Step 7 no longer shows a payment CTA. |
| DEPENDENCIES | ⚠️41, ⚠️50 |

**Gap 1 answers:**
STEP 7 → PREVIEW: `<Link href={previewHref}>`, `previewHref = withClasificadosPublishLang("/publicar/ofertas-locales/preview", routeLang, {...})` (`OfertasLocalesApplicationClient.tsx` line 836)
PREVIEW ROUTE: `app/(site)/publicar/ofertas-locales/preview/page.tsx` → `OfertasLocalesPreviewClient.tsx`
PREVIEW → PAYMENT: **NONE** — Preview's only action is submission-for-review
PAYMENT ROUTE/API: `app/lib/listingPlans/revenueCategoryCheckoutClient.ts` (`startRevenueCategoryCheckout`) — the underlying Stripe session-creation route inside that shared Revenue OS client was not re-traced (out of scope: "do not modify Stripe in this planning task")
PAYMENT → RETURN: `returnPath: /dashboard/ofertas-locales/${offer.id}?${q}` — back to the same dashboard page
SUBMISSION FOR REVIEW: `submitOfertaLocalDraftForReview()` (`ofertasLocalesPublishSubmit.ts`) → `POST /api/ofertas-locales/publish`
CAN REMOVE "CONTINUAR A PAGO SEGURO" FROM STEP 7 WITHOUT BREAKING PAYMENT: **FALSE** as a bare removal — **TRUE** once relocated to Preview per the proposed change.

---

## ⚠️41 — Step 7 should show price summary only

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx` Step 7 — `<OfertasLocalesCommercialSummary draft={draft} lang={lang} />` |
| CURRENT BEHAVIOR | Confirmed: this component renders from `draft` alone (price/package display), takes no checkout callback/handler prop, and contains no checkout action of its own — the checkout action was always the separate `continueSecureCheckout` link (⚠️40), never this component. |
| PROPOSED CHANGE | Keep `OfertasLocalesCommercialSummary` exactly as-is; only ⚠️40's link is removed from Step 7. |
| CLASSIFICATION | **REUSE** (no change) |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | none beyond ⚠️40's |
| DEPENDENCIES | ⚠️40 |

---

## ⚠️42 — Reduce confirmation checkboxes to 3

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx` Step 7, lines 1853-1907; `step7Confirmations` state (`businessInfo`, `filesDates`, `aiItems`, `leonixRules`); `step7ConfirmationsComplete` (lines 669-679) |
| CURRENT BEHAVIOR | Exact current copy verified: `step7ConfirmBusiness` = "Confirmo que la información del negocio y contacto es correcta."; `step7ConfirmFiles` = "Confirmo que los archivos y fechas del volante/cupón son correctos."; `step7ConfirmAi` (rendered only when `aiIncludedInPackage`) = "Confirmo que los productos sugeridos por IA están listos, o terminé la revisión requerida."; `step7ConfirmRules` = "Confirmo que esta oferta cumple con las reglas de Leonix y soy responsable por la información enviada." `step7ConfirmationsComplete` computes as: `if (emailMalformed) return false; base = businessInfo && filesDates && leonixRules; return aiIncludedInPackage ? base && aiItems : base;` — for non-AI packages this is **already 3 checkboxes today**; the 4th (`aiItems`) only appears when `aiIncludedInPackage`. |
| PROPOSED CHANGE | Merge `businessInfo` + `filesDates` into one state field/checkbox with the ticket's proposed combined copy ("Confirmo que la información del negocio, contacto, archivos y fechas es correcta."), keep `aiItems` (conditional) and `leonixRules` unchanged — landing at 3 for both AI and non-AI packages. Update `step7ConfirmationsComplete`'s `base` expression to reference the merged field instead of two. `leonixRules` (legal/accountability) is not touched. |
| CLASSIFICATION | **COPY** + **SMALL LOCAL LOGIC** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Assert `step7ConfirmationsComplete` still requires the same underlying set of acknowledgements (business+contact+files+dates, AI review when applicable, Leonix rules) — no acknowledgement silently dropped. |
| DEPENDENCIES | ⚠️43 |
| **THREE CONFIRMATIONS SAFE** | **TRUE** — the merge combines two purely-informational accuracy confirmations (business/contact info; files/dates) into one without dropping any distinct legal or business requirement. `leonixRules` (the actual legal-accountability confirmation) and `aiItems` (the actual review-completion gate) are untouched and remain separate. No requirement is lost. |

---

## ⚠️43 — Preview CTA should visibly unlock

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx` Step 7, `step7ConfirmationsComplete` conditional around `<Link href={previewHref}>` |
| CURRENT BEHAVIOR | **Confirmed exact disabled expression**: the preview link renders only when `step7ConfirmationsComplete` is `true`; otherwise `c.step7PreviewGatedHelper` ("Marca todas las confirmaciones para ver la vista previa.") renders in its place — an absent-vs-disabled pattern, not a greyed-out button. `step7ConfirmationsComplete` depends ONLY on the confirmation checkboxes + `emailMalformed` — it does **not** depend on `publishFieldsReady`/`publishIssues` (those drive the separate "Envío para revisión" status card, ⚠️47, not the preview link's visibility). |
| PROPOSED CHANGE | Always render the "Ver vista previa" button; toggle disabled/enabled styling based on `step7ConfirmationsComplete` (post-⚠️42 merge), showing the exact blocker list from ⚠️44 alongside when disabled, instead of the current absent/present swap. |
| CLASSIFICATION | **STYLE** + **SMALL LOCAL LOGIC** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Manual: button visibly flips disabled→enabled as the last (merged) confirmation is checked. |
| DEPENDENCIES | ⚠️42, ⚠️44 |
| **PREVIEW DISABLED EXPRESSION** | `!step7ConfirmationsComplete` where `step7ConfirmationsComplete = !emailMalformed && businessInfo && filesDates && leonixRules && (aiIncludedInPackage ? aiItems : true)` |
| **PREVIEW BLOCKERS** | (1) malformed email (`emailMalformed`); (2) business/contact confirmation unchecked; (3) files/dates confirmation unchecked; (4) AI review confirmation unchecked (AI-included packages only); (5) Leonix rules confirmation unchecked. None of these come from `publishFieldsReady`/`publishIssues` — those are a separate, informational status card, not a preview blocker today. |

---

## ⚠️44 — Exact missing preview requirement must be shown

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx` lines 568-572 (`previewIssues`, `publishIssues`, `serverPublishIssues`, `previewReady`, `publishFieldsReady`); `OfertasLocalesValidationPanel.tsx` |
| CURRENT BEHAVIOR | `previewIssues = validateOfertaLocalDraftForPreview(draft)` (`ofertasLocalesValidation.ts`); `previewReady = previewIssues.length === 0`. These ARE real, existing, reusable validation results — not a parallel validator. See ⚠️47 for the separate, confirmed BUG in how `publishFieldsReady`/`publishIssues` are wired (they are NOT what gates the preview CTA — see ⚠️43 — but they ARE what the "Envío para revisión" status card shows, and they're currently broken). |
| PROPOSED CHANGE | Drive the ⚠️43 disabled-state blocker list from `step7ConfirmationsComplete`'s own boolean sub-conditions (checkbox-level, mapped to Spanish sentences per the ticket's examples) plus `previewIssues` (already real, already computed) for any underlying field-completeness gaps — no new validator. |
| CLASSIFICATION | **REUSE** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Confirm `previewIssues` messages are customer-appropriate before reusing verbatim. |
| DEPENDENCIES | ⚠️43 |
| **EXACT BLOCKER MESSAGES CAN REUSE CURRENT VALIDATION** | **TRUE** |

---

## ⚠️45 — Remove "Guardar borrador localmente"

**Reconfirmed from source, unchanged from prior pass.**

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx`, `handleSaveDraft` (lines 771-773: `useCallback(() => { saveOfertaLocalDraftToStorage(draft); }, [draft])`); autosave effect in `useOfertasLocalesDraft.ts` (lines 96-108, 400ms-debounced, calls the identical `saveOfertaLocalDraftToStorage` on every draft change while `hasLoadedDraft` and not mid-hydration) |
| CURRENT BEHAVIOR | `handleSaveDraft` performs **exactly** the same write (`saveOfertaLocalDraftToStorage(draft)` → writes to both `localStorage` and `sessionStorage` under `OFERTAS_LOCALES_DRAFT_STORAGE_KEY`) that autosave already performs automatically. It does not touch `applicationSessionId`, the owner stamp, or any DB-side state — no unique side effect exists. |
| PROPOSED CHANGE | Remove the "Guardar borrador localmente" button from Step 7. Autosave is completely untouched. |
| CLASSIFICATION | **LAYOUT** (removal) |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Confirm `savedLabel` (autosave "last saved" indicator) keeps updating with the manual button gone. |
| DEPENDENCIES | none |
| **MANUAL SAVE CTA UNIQUE FUNCTION** | **FALSE** |
| **SAFE TO REMOVE MANUAL SAVE CTA** | **TRUE** |

---

## ⚠️46 — Reuse global unsaved-exit/tab-close protection

| | |
|---|---|
| CURRENT FILE/COMPONENT | `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`; `app/(site)/clasificados/lib/publishFlowLifecycleClient.ts` |
| CURRENT BEHAVIOR | **Confirmed: no generic, category-agnostic leave-guard hook exists.** `useEnVentaPublishLeaveGuard` is EnVenta-specific — imports EnVenta-only draft-persistence functions and state types; cannot be imported as-is. Shared/reusable: two session-flag constants (`LEONIX_PREVIEW_NAV_SESSION_FLAG`, `LEONIX_RETURNING_TO_EDIT_SESSION_FLAG`) marking expected in-flow navigation. |
| PROPOSED CHANGE | **GAP REPORTED**, per instruction. Ofertas already autosaves aggressively (400ms, both storages) — lower data-loss risk than EnVenta's use case. Recommend deferring a dedicated leave-guard this batch. |
| CLASSIFICATION | **N/A (gap reported)** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | N/A |
| TEST REQUIRED | none this batch |
| DEPENDENCIES | none |

---

## ⚠️47 — Empty "Envío para revisión" card

**GAP 2 RESOLVED — exact bug found and proven from source. Classification: D — BUG.**

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesValidationPanel.tsx` (right-hand card, title `c.validationPublishTitle` = **"Envío para revisión"** — confirmed exact match, `ofertasLocalesApplicationCopy.ts` line 183); `OfertasLocalesApplicationClient.tsx` lines 568-572 |
| CURRENT BEHAVIOR | **Two compounding bugs, both proven from source:**<br>**(1)** `OfertasLocalesApplicationClient.tsx` line 572 calls `validateOfertaLocalDraftForServerPublish(draft)` — **with no `ownerId` argument**, even though the function signature is `(draft, ownerId?)` and the component already has a real `ownerId` state variable (added in commit `c53c7ce3` for the draft-ownership fix). Inside `validateOfertaLocalDraftForServerPublish` (`ofertasLocalesPublishMapper.ts` lines 169-181): `if (!ownerId?.trim()) issues.push({ field: "ownerId", message: "Debes iniciar sesión para enviar la oferta.", severity: "error" })`. Since `ownerId` is never passed, this condition is **always true**, so `serverPublishIssues` **always** contains at least one error — meaning `publishFieldsReady = serverPublishIssues.every(i => i.severity !== "error")` is **permanently `false`, even for a fully signed-in, fully complete draft**.<br>**(2)** The panel's issue list is driven by a **different** validator: `publishIssues = validateOfertaLocalDraftForFuturePublish(draft)` (line 569) — which has no `ownerId` check at all. Once the draft is genuinely complete, `publishIssues` (and thus `publishErrors`) is legitimately empty.<br>**Combined effect**: `publishFieldsReady` (from validator A, always false due to the missing-argument bug) says "not ready," while `publishErrors` (from validator B, correctly empty) has nothing to show — and `IssueList`'s `emptyMessage` prop for this card is hard-coded to `""` (`OfertasLocalesValidationPanel.tsx` line 78, vs. the sibling preview card which correctly passes `emptyMessage={c.previewReady}` at line 63). Not-ready + nothing-to-show + empty-string-fallback = a visually empty card, **always**, regardless of actual draft completeness. |
| PROPOSED CHANGE | (1) Pass the already-available `ownerId` into the call: `validateOfertaLocalDraftForServerPublish(draft, ownerId)`. This alone fixes `publishFieldsReady` to reflect real state. (2) Belt-and-suspenders: give the publish `IssueList` a real `emptyMessage` (mirroring the preview card's pattern) so the card can never render visually empty again even under some other future edge case. Neither change touches server-side enforcement — `/api/ofertas-locales/publish` independently re-validates ownership itself; this is purely a client-side display-readiness computation. |
| CLASSIFICATION | **SMALL LOCAL LOGIC** (one missing argument) + **COPY** (fallback string) |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW — display-only fix; does not touch `/api/ofertas-locales/publish`'s own server-side validation |
| TEST REQUIRED | Regression: construct a fully-complete, signed-in draft; assert `publishFieldsReady` (with `ownerId` passed) is `true` and the card shows the ready message, not empty. Also assert a genuinely-incomplete draft still shows real error messages, not an empty card. |
| DEPENDENCIES | none |

**Classification: D — BUG** (not a premature/placeholder/hidden-until-relevant card — the card's *intent* is correct, its *wiring* is broken by a one-argument omission).

---

## ⚠️48 — "Empezar de nuevo" must remain secondary/destructive

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx` — `handleStartFresh` (lines 516-548), rendered via `c.startOverDeleteCta` button (confirmed present in the Step 5 case, lines 1572-1584, and elsewhere) |
| CURRENT BEHAVIOR | Already styled as a bordered, muted button (`border-[#D4C4A8] bg-white text-[#1E1814]/70 hover:border-red-300 hover:text-red-800`) inside its own low-emphasis card with explanatory copy — already visually secondary, not competing with primary actions. |
| PROPOSED CHANGE | Verify the Step 7 render site (⚠️49) uses the same restrained styling; no functional change to `handleStartFresh`. |
| CLASSIFICATION | **STYLE** (verification only — likely already compliant) |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Visual confirmation only. |
| DEPENDENCIES | ⚠️49 |

---

## ⚠️49 — Final Step 7 hierarchy

| | |
|---|---|
| CURRENT FILE/COMPONENT | `OfertasLocalesApplicationClient.tsx`, `case 7:` |
| CURRENT BEHAVIOR | Documented in full under ⚠️39. |
| PROPOSED CHANGE | Reassemble existing components/blocks (no new components) into: `Revisión final` header → short readiness summary (reuse `OfertasLocalesValidationPanel`, now fixed per ⚠️47) → 3 confirmations (⚠️42) → `Ver vista previa →` (⚠️43/⚠️44) → price/package summary (`OfertasLocalesCommercialSummary`, unchanged, ⚠️41) → secondary/destructive `Borrar esta solicitud y empezar de nuevo` (⚠️48) at the bottom. The relocated dashboard/payment link (⚠️40) moves to Preview, not here. |
| CLASSIFICATION | **LAYOUT** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | MEDIUM (largest single reorder; execute last within Gate F, after every sub-item above is individually verified) |
| TEST REQUIRED | Full Step 7 walkthrough: draft-incomplete → confirmations → preview unlock → status card shows real state (not empty) → price summary visible → start-over still works. |
| DEPENDENCIES | ⚠️40-⚠️48 |

---

## ⚠️50 — Preview is the final inspection point

| | |
|---|---|
| CURRENT FILE/COMPONENT | `previewHref` (Step 7); `app/(site)/publicar/ofertas-locales/preview/` |
| CURRENT BEHAVIOR | Confirmed (Gap 1): Preview (`OfertasLocalesPreviewClient.tsx`) hosts final visual inspection + submission-for-review (`handleSubmitForReview`); it does not currently host payment. Once ⚠️40's link relocation lands, Preview also becomes the entry point to the existing dashboard-owned checkout — without Preview owning any payment logic itself. |
| PROPOSED CHANGE | No new logic beyond ⚠️40's link relocation — this row is the doctrine statement enforced by ⚠️40/41. |
| CLASSIFICATION | **N/A (doctrine, enforced via ⚠️40/41)** |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | N/A |
| TEST REQUIRED | Covered by ⚠️40's test. |
| DEPENDENCIES | ⚠️40 |

---

## ⚠️51 — Hard refresh persistence QA

**Reconfirmed from source.**

| | |
|---|---|
| CURRENT FILE/COMPONENT | `oferta_local_items.review_status`/`is_active` (DB-persisted); `app/api/ofertas-locales/items/[itemId]/route.ts` (PATCH); `useOfertasLocalesDraft.ts`; `effectiveOfertaLocalId` |
| CURRENT BEHAVIOR | Review decisions are DB-persisted via the certified `PATCH /api/ofertas-locales/items/[itemId]` route (repair manual §15) — not browser-only state. The canonical `oferta_local_id` is DB-backed on `ofertas_locales` and mirrored into `aiScanRecordId`/`submitSuccess`, restored on mount via `loadOfertaLocalSubmissionSession`/`loadOfertaLocalAiScanSession`. Page-level/review-completion state (`step5ReviewComplete`, `aiReviewGate` counts) is recomputed from live `GET /api/ofertas-locales/items` data on load, not cached client-only. The only ephemeral, non-persisted state this batch introduces is ⚠️25's `step5View` toggle (checklist vs. review screen) — resets to checklist on refresh, with zero data loss, since the 127 decisions and their statuses re-load correctly the moment the user re-enters the review screen. |
| PROPOSED CHANGE | No implementation required — persistence already exists and is correct. |
| CLASSIFICATION | **REUSE** (verification only) |
| SCANNER PROTECTED PATH TOUCHED | FALSE |
| RISK | LOW |
| TEST REQUIRED | Hard-refresh regression: approve several items, hard refresh, confirm counts/statuses survive and the checklist correctly reflects "review complete" or "N pending" without re-scanning. |
| DEPENDENCIES | ⚠️25 |
| **HARD REFRESH REQUIRES RE-REVIEW** | **FALSE** |
| **127 REVIEW DECISIONS DB-PERSISTED** | **TRUE** |

---

## ⚠️52 — Reuse > rebuild

Summary tally (also see FINAL REPORT counts below): the large majority of items in this batch are REUSE/RELABEL/RESTYLE/MOVE. Items requiring SMALL LOCAL LOGIC: ⚠️30 (counter fallback), ⚠️25 (view-state toggle), ⚠️31 (editor-open gate), ⚠️42/⚠️43 (checkbox merge + disabled-state). Zero items in this batch require a genuinely NEW component from scratch — ⚠️25's "dedicated screen" reuses the existing `OfertasLocalesAiScanReviewWorkspace` wholesale.

---

## ⚠️53 — Scanner protected boundary

Every file named as a proposed edit target above was checked against `app/lib/ofertas-locales/ofertasAiScannerProtectedPaths.ts`:

| File | PROTECTED |
|---|---|
| `OfertasLocalesApplicationClient.tsx` | FALSE |
| `OfertasLocalesAiScanReviewWorkspace.tsx` | FALSE |
| `OfertasLocalesAiItemReviewPanel.tsx` | FALSE |
| `OfertasLocalesPreviewProductGrid.tsx` | FALSE |
| `ofertasLocalesProductTaxonomy.ts` | FALSE |
| `ofertasLocalesApplicationCopy.ts` | FALSE |
| `ofertasLocalesScanReviewRuntime.ts` | FALSE |

**No file proposed for editing in this batch is on the protected-path manifest.** `app/api/ofertas-locales/items/[itemId]/route.ts` IS on the manifest (REVIEW_DATA category) but no proposed change alters its request/response contract — only client-side conditions around when it's called (⚠️31) or what its output labels as (nothing) change; the route itself is untouched code. This is flagged explicitly per the ticket's instruction even though the file isn't edited.

---

## Final Execution Architecture

Both plan gaps are now source-resolved. Gate lettering below is FINAL (A-G), optimized for scanner safety, minimal code change, maximum reuse, independent testability per gate, and one final hard-refresh QA pass. The one deliberate reordering from the original recommendation: counter accuracy (⚠️30) lands in Gate B, before the dedicated review screen (Gate D), so the new screen never launches showing a known-wrong number.

---

### GATE A — Copy / label / status honesty

FILES TO EDIT: `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`, `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts`
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️24, ⚠️37
TYPE OF WORK: COPY
TESTS: Manual — confirm renamed "Actualizar resultados" button still only calls `loadItems()` (no `/scan` POST); confirm product-nav vs page-nav labels are visually distinct.
EXPECTED COMMIT MESSAGE: `fix(ofertas): clarify scan-review refresh and navigation copy`
RISK: LOW

---

### GATE B — Counter correctness

FILES TO EDIT: `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️30
TYPE OF WORK: SMALL LOGIC
TESTS: New regression audit case — `gateItems.length === 0 && assetScopedItems.length > 0` must fall back to `assetScopedItems`-derived counters; existing zero-true-candidate case (`zero-candidate-review-state-audit`) must still show 0 correctly.
EXPECTED COMMIT MESSAGE: `fix(ofertas): fall back to asset-scoped items when scan-job counters mismatch`
RISK: MEDIUM

---

### GATE C — Product review CTA + navigation hierarchy

FILES TO EDIT: `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`, `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️26, ⚠️27, ⚠️29, ⚠️32, ⚠️38
TYPE OF WORK: STYLE, LAYOUT
TESTS: Manual — every relabeled/restyled button still fires its original approve/reject/save/review-later handler; page-completion CTA appears only when the current page's items are all resolved; last-page completion card visible without scrolling.
EXPECTED COMMIT MESSAGE: `fix(ofertas): restyle product-review CTA hierarchy and completion states`
RISK: LOW

---

### GATE D — Dedicated review workspace using existing component

FILES TO EDIT: `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`, `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx`
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️25, ⚠️28, ⚠️31, ⚠️36
TYPE OF WORK: SMALL LOGIC (view-state toggle), LAYOUT, STYLE
TESTS: Regression — scan completes → review CTA → workspace shows same item set (127) → exit → return → approved/rejected counts unchanged; sticky flyer pane keeps bbox-highlight sync on selection; previously-approved item reopens with current values and saves via existing PATCH.
EXPECTED COMMIT MESSAGE: `feat(ofertas): add dedicated product-review screen using existing workspace`
RISK: MEDIUM

---

### GATE E — Bilingual taxonomy presentation

FILES TO EDIT: `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx` (category display only)
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️33, ⚠️34, ⚠️35 (doctrine only, no implementation)
TYPE OF WORK: REUSE
TESTS: Structural — review-editor category display resolves through `OFERTA_PRODUCT_TAXONOMY`'s keyword matcher for known categories and falls back to `"other"` gracefully; no `oferta_local_items.category` value is rewritten in storage.
EXPECTED COMMIT MESSAGE: `fix(ofertas): apply existing bilingual taxonomy to review editor category display`
RISK: LOW

---

### GATE F — Step 7 simplification + existing preview/payment handoff

FILES TO EDIT: `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`, `app/(site)/publicar/ofertas-locales/OfertasLocalesValidationPanel.tsx`, `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`, `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`, `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️39, ⚠️40, ⚠️41, ⚠️42, ⚠️43, ⚠️44, ⚠️45, ⚠️47, ⚠️48, ⚠️49, ⚠️50
TYPE OF WORK: LAYOUT (removal/reorder), MOVE (dashboard link relocation), SMALL LOGIC (⚠️47's `ownerId` fix, ⚠️42's checkbox merge, ⚠️43's disabled pattern), COPY
TESTS: Full Step 7 walkthrough (draft-incomplete → 3 confirmations → preview visibly unlocks → "Envío para revisión" card shows real ready/not-ready state, never empty → price summary visible → start-over works); Preview walkthrough (relocated dashboard/payment link present and functional, submission-for-review still works).
EXPECTED COMMIT MESSAGE: `fix(ofertas): simplify Step 7 and move payment entry point to preview`
RISK: MEDIUM (largest gate — reorder Step 7 last within this gate, after ⚠️40/42/43/47's underlying fixes are individually verified)

---

### GATE G — Full regression / hard refresh / scanner baseline

FILES TO EDIT: none (verification only) — plus any new audit script(s) added alongside Gates A-F
PROTECTED SCANNER FILE: FALSE
QA ITEMS INCLUDED: ⚠️51 (plus a full re-verification pass of ⚠️24-⚠️50)
TYPE OF WORK: REUSE (verification)
TESTS: `npm run ofertas:ai-scanner-certified-baseline-audit` (must still PASS); hard-refresh regression (approve several items across pages, hard refresh, confirm counts/statuses/review-complete state survive without re-scanning); full click-through of every relabeled/restyled/relocated control from Gates A-F.
EXPECTED COMMIT MESSAGE: `test(ofertas): full QA batch regression and hard-refresh verification`
RISK: LOW (verification gate)

---

⚠️46 (leave-guard gap report) and ⚠️52/⚠️53 (reuse doctrine, protected-boundary audit) are cross-cutting planning outputs, already resolved in this document — not separately gated for implementation.

---

## Special Questions

1. **Can product review become a dedicated internal screen/state WITHOUT touching scanner-core files?** YES — confirmed. `OfertasLocalesAiScanReviewWorkspace.tsx` and `OfertasLocalesApplicationClient.tsx` are both outside `ofertasAiScannerProtectedPaths.ts`; the plan reuses the existing workspace component behind a client-only view-state toggle.

2. **Can flyer + editor become sticky/two-column WITHOUT changing scanner execution?** YES — it already IS two-column (`OfertasLocalesAiScanReviewWorkspace.tsx` lines 159-212); sticky positioning is a pure CSS/layout addition to the same non-protected file.

3. **Can approved products be reopened using current item/update APIs?** YES, structurally — `PATCH /api/ofertas-locales/items/[itemId]` accepts `review_status` transitions generically; nothing in the route contract blocks re-editing an approved row. The exact client-side gate (if any) preventing reopen was not located in this pass — flagged `UNKNOWN` at ⚠️31, but the API itself is not the blocker.

4. **Why do counters sometimes show 0 while 127 items exist?** Mechanism proven at ⚠️30: gate counters are computed from `items` filtered twice — by `selectedSourceAssetId` then by `activeScanJobId` — and if either doesn't match the asset/job that actually produced the persisted items, the gate subset is empty while the raw item set is not. The exact live trigger for the specific QA session is `UNKNOWN — SOURCE DOES NOT PROVE IT` without live reproduction, but the structural cause is proven from source.

5. **Is there already a bilingual taxonomy map that can solve Meat & Seafood / Carnes y mariscos cheaply?** YES — `ofertasLocalesProductTaxonomy.ts`, already used elsewhere (preview grid), not yet wired into the review editor.

6. **Can category icons be added presentation-only?** YES — the same taxonomy module already carries an `emoji` field per category; no new icon library needed.

7. **Can Step 7 payment CTA be removed while reusing the existing preview payment pathway?** RESOLVED (Gap 1): TRUE, but not by "reusing an existing preview payment pathway" — no such pathway exists today. The correct mechanism is relocating Step 7's existing dashboard `<Link>` (which is itself the real entry point to checkout, via the dashboard's `handleCheckout`) onto Preview. See ⚠️40.

8. **What exact current pathway handles preview → payment/submission?** RESOLVED (Gap 1): Preview → submission-for-review only (`handleSubmitForReview` → `POST /api/ofertas-locales/publish`). Payment is a separate, dashboard-owned pathway (`app/(site)/dashboard/ofertas-locales/[id]/page.tsx` → `handleCheckout` → `startRevenueCategoryCheckout` → Stripe → return to dashboard), currently reached only via Step 7's link, not via Preview. See ⚠️40.

9. **Can manual "Guardar borrador localmente" be removed safely because autosave already covers it?** YES, confirmed — `handleSaveDraft` calls the exact same `saveOfertaLocalDraftToStorage` function the autosave effect already calls automatically.

10. **Is there a shared global unsaved-exit warning available for reuse?** NOT AVAILABLE as a ready-made generic hook — `useEnVentaPublishLeaveGuard` is EnVenta-specific. Shared underlying session-flag primitives exist (`publishFlowLifecycleClient.ts`) that a *future* Ofertas-specific guard could build on, but nothing is reusable as-is today. Reported as a gap per instruction, not implemented this batch.

11. **Why is "Ver vista previa" currently disabled even when the user believes everything is complete?** RESOLVED: it isn't disabled — it's entirely absent until `step7ConfirmationsComplete` is true. `step7ConfirmationsComplete` depends only on the confirmation checkboxes + email validity, NOT on `publishFieldsReady`. Separately, the "Envío para revisión" status card the user also sees IS broken (⚠️47's bug) and would have shown "not ready" even for a complete draft — likely compounding the user's impression that something was blocking them, even though it wasn't actually gating the preview button itself.

12. **What exact validation state should drive the preview CTA?** `step7ConfirmationsComplete` (post-⚠️42 merge) — exact expression: `!emailMalformed && businessInfo && filesDates && leonixRules && (aiIncludedInPackage ? aiItems : true)`. No new validator; `previewIssues`/`validateOfertaLocalDraftForPreview` reused for any underlying field-completeness messaging.

13. **Does hard refresh preserve all 127 review decisions today?** YES — confirmed (⚠️51). DB-persisted, not browser-only.

14. **Which planned changes require ZERO business-logic changes?** ⚠️24, ⚠️26, ⚠️27, ⚠️28, ⚠️29, ⚠️32, ⚠️33, ⚠️34, ⚠️36, ⚠️37, ⚠️38, ⚠️39, ⚠️41, ⚠️44, ⚠️45, ⚠️48, ⚠️49, ⚠️50.

15. **Which planned changes truly require local logic changes?** ⚠️25 (view-state toggle), ⚠️30 (counter fallback), ⚠️31 (reopen gate, pending confirmation), ⚠️40 (link relocation — logic-adjacent but not new logic), ⚠️42 (checkbox merge), ⚠️43 (disabled/enabled pattern), ⚠️47 (missing `ownerId` argument — one-line fix).

---

## No-Guess Disclosures

Both plan gaps (Gap 1: preview→payment pathway; Gap 2: "Envío para revisión" card) are now fully resolved from source — see ⚠️40 and ⚠️47 above.

Remaining items explicitly marked `UNKNOWN — SOURCE DOES NOT PROVE IT` and NOT inferred: ⚠️26's exact current render state (page-completion message wiring not traced to its render call site), ⚠️29's exact page-nav line location, ⚠️31's exact client-side reopen-gate condition (the API itself is confirmed not to block reopening), ⚠️36's exact spacing values, ⚠️37's exact current product/page-nav label text, and the precise live-session trigger (which of `selectedSourceAssetId`/`activeScanJobId` was actually stale) for ⚠️30's zero-counter symptom during the specific QA session. None of these block Gate A-G execution — each is resolved through implementation-time verification within its own gate.
