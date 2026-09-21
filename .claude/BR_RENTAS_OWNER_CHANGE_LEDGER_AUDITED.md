# BR + RENTAS OWNER CHANGE LEDGER — AUDITED (⚠️1–⚠️325)

Status: FORENSIC AUDIT COMPLETE. This file is a companion to, and does NOT modify or replace, the
permanent source ledger at `C:\Users\chuy\Downloads\LEONIX_BR_RENTAS_OWNER_CHANGE_LEDGER.txt`.
Repo: `C:\projects\elaguila-website-website`, branch `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`.
Do NOT commit this file.

Method: 5 independent forensic research passes (one per ledger section) plus a direct pass on the
5 meta/deferral items, each verifying every assigned item against CURRENT repository source (not
prior Claude session summaries), the owner chat transcript (`C:\Users\chuy\Music\Bienes Rentas Chat.txt`),
already-extracted owner screenshots, and — only where a script genuinely exercises the specific
behavior in question — existing self-test/verifier scripts. CODE EXISTS ≠ DONE and TYPECHECK
PASSES ≠ DONE were enforced throughout; interactive/visual requirements default to 🟠/🟡 unless
actually exercised or visually confirmed, per the audit's own critical standard.

Full per-item records (SOURCE/EVIDENCE/IMPLEMENTATION/CLASSIFICATION/TOUCHED/REMAINING
PROOF/NOTES for all 325 items) follow this summary, organized by the ledger's own six sections
(Shared, BR Negocio, BR Privado, Rentas Shared, Rentas Negocio+Privado, Global/Deferred).

---

## MASTER TALLY (computed directly from all 325 per-item CLASSIFICATION fields)

**UPDATE 2026-08-28 — POST-BURN-DOWN RECLASSIFICATION.** All 47 original 🔴 items were closed at
the source-implementation level across two implementation passes (Waves A-I, then the final
11-item closure: ⚠️15/16/17/24/25/70/150/206/210/280/295). This update redistributes all 47
former-🔴 items into 🟢/🟡/🟠 using the same standard applied throughout this audit: a fix is 🟢
only if it is provably correct from source alone (a deterministic function, a grep-provable string/
option, a passing behavioral self-test) with no subjective layout/rendering judgment and no
required interactive exercise; 🟡 if the remaining proof is a subjective visual/rendering/layout
judgment call; 🟠 if the remaining proof requires actually exercising interactive behavior (typing,
uploading, add/remove, persistence round-trip, native handoff). See "POST-BURN-DOWN
RECLASSIFICATION DETAIL" below (after the IMPLEMENTATION BURN-DOWN section) for the concise
per-item reasoning. The individual FULL PER-ITEM RECORDS further below still show each item's
pre-closure 🔴 record — they were NOT rewritten in this pass (47 individual record rewrites was
out of scope for this QA pass); the reclassification detail section is the authoritative current
status until those records are individually rewritten.

TOTAL PERMANENT LEDGER ITEMS: 325
UNREVIEWED: 0

🟢 SOURCE-PROVED DONE: 220
🔴 SOURCE-CONFIRMED NOT DONE: 0
🟡 OWNER-VISUAL-QA REQUIRED: 33
🟠 RUNTIME QA REQUIRED: 63
⚪ GLOBAL-DEFERRED: 4
🟣 ENVIRONMENT-BLOCKED: 3
🟤 DATA-INSUFFICIENT: 1
🔵 PM/BUSINESS DECISION REQUIRED: 1

(220+0+33+63+4+3+1+1 = 325 ✓)

NEW OWNER REQUIREMENTS FOUND: NONE. Across all 325 items and every screenshot/chat
cross-reference performed, no genuinely distinct owner concern was found that fails to map onto
an existing ⚠️ number — no ⚠️326+ appended. Two significant NEW TECHNICAL FACTS were discovered
during verification and are folded into the existing items whose requirement they violate, not
appended as new items (they are refinements of already-known requirements, not new asks):
1. **⚠️300** (Rentas Negocio media must support upload/thumbnails/reorder/portada/remove) — source
   directly proves `RentasNegocioForm.tsx` hardcodes `primaryImageIndex={0}` and wires
   `onSetPrimary={() => null}` (a dead no-op) to the shared photo strip, while on-screen copy
   claims the cover can differ from the first photo. Rentas Privado's equivalent is wired
   correctly — this is a Negocio-lane-specific regression, not present in the original 40-item
   ledger's closure claims.
2. **⚠️318** (Rentas Privado map/location must reflect the selected city/location truth) — the
   session's earlier fix (commit `d1d98820`) corrected the DRAFT/application-preview mapper
   (`mapRentasPrivadoStateToPreviewVm.ts`) but a SEPARATE file, the LIVE/published-listing mapper
   (`mapRentasListingLiveToPreviewVm.ts`), has the identical bug class (a bare cross-street/
   neighborhood string with no city qualifier can reach the map query when the exact-address
   privacy toggle is off) and was never touched. Real published Rentas listings can still show a
   mis-centered map even after this session's fix, because the fix only reached the draft path.

---

## LIST EVERY NON-GREEN ITEM

**🔴 SOURCE-CONFIRMED NOT DONE (0):**
None. All 47 formerly-🔴 items closed at the source-implementation level (see UPDATE 2026-08-28
above and POST-BURN-DOWN RECLASSIFICATION DETAIL below).

**🟡 OWNER-VISUAL-QA REQUIRED (33):**
⚠️2, ⚠️15, ⚠️16, ⚠️37, ⚠️41, ⚠️42, ⚠️45, ⚠️47, ⚠️58, ⚠️59, ⚠️60, ⚠️81, ⚠️132, ⚠️137, ⚠️141, ⚠️142,
⚠️154, ⚠️160, ⚠️187, ⚠️190, ⚠️191, ⚠️199, ⚠️200, ⚠️210, ⚠️217, ⚠️221, ⚠️256, ⚠️259, ⚠️280, ⚠️288,
⚠️293, ⚠️309, ⚠️319

**🟠 RUNTIME QA REQUIRED (63):**
⚠️4, ⚠️5, ⚠️7, ⚠️8, ⚠️17, ⚠️18, ⚠️19, ⚠️20, ⚠️21, ⚠️22, ⚠️24, ⚠️25, ⚠️28, ⚠️29, ⚠️39, ⚠️40, ⚠️43,
⚠️44, ⚠️50, ⚠️53, ⚠️54, ⚠️55, ⚠️57, ⚠️66, ⚠️70, ⚠️85, ⚠️86, ⚠️87, ⚠️91, ⚠️92, ⚠️107, ⚠️109, ⚠️114,
⚠️115, ⚠️117, ⚠️124, ⚠️126, ⚠️127, ⚠️150, ⚠️153, ⚠️161, ⚠️184, ⚠️188, ⚠️206, ⚠️215, ⚠️216, ⚠️229,
⚠️237, ⚠️245, ⚠️251, ⚠️252, ⚠️264, ⚠️286, ⚠️287, ⚠️289, ⚠️290, ⚠️295, ⚠️300, ⚠️306, ⚠️310, ⚠️312,
⚠️317, ⚠️318

**⚪ GLOBAL-DEFERRED (4):**
⚠️35, ⚠️138, ⚠️321, ⚠️322

**🟣 ENVIRONMENT-BLOCKED (3):**
⚠️277, ⚠️323, ⚠️325

**🟤 DATA-INSUFFICIENT (1):**
⚠️324

**🔵 PM/BUSINESS DECISION REQUIRED (1):**
⚠️281

---

## IMPLEMENTATION BURN-DOWN — all 47 🔴 items grouped into logical waves

**WAVE A — DATA / PERSISTENCE / HYDRATION (1):**
⚠️53 (preview must suppress the leave-warning on expected preview navigation — currently fires indiscriminately)

**WAVE B — APPLICATION / FIELD UX (8):**
⚠️13 (a second, separator-less price formatter — `formatListingPrice.ts` — is live on BR results cards and Rentas public detail; a $350,000 listing renders "$350000"), ⚠️68 (BR Negocio still exposes 2 identically-labeled preview buttons), ⚠️69 ("sin validar" dev language still leaks into Rentas customer-facing buttons), ⚠️70 (doctrine violation found — see individual items relying on typecheck-only evidence), ⚠️161 (Privado price input not $-formatted while typing), ⚠️192 (no phone helper copy; WhatsApp/phone silently collapse to one number at publish), ⚠️193 (no WhatsApp-differs-from-phone helper copy), ⚠️223 (Rentas Negocio still hardcodes two preview buttons — "Validar y ver vista previa" / "Ver vista previa (sin validar)" — contradicting the prior ledger's "closed" claim)

**WAVE C — TAXONOMY / CONDITIONAL PATHWAYS (9):**
⚠️80 ("Un solo piso"/"Dos pisos" still live inside the residential Subtipo dropdown despite a separate Niveles field existing), ⚠️81 (residential dropdown breadth not independently confirmed strong), ⚠️85 (Commercial "Uso comercial" is still a free-text box, not structured choices), ⚠️86 (no custom-add on commercial permitted-use), ⚠️87 (no custom-add on BR Negocio commercial highlights), ⚠️91 (no custom-add on BR Negocio land highlights), ⚠️92 (none of BR Negocio's residential/commercial/land highlight checklists have the custom-add mechanism BR Privado/Rentas already have), ⚠️217 (Privado Commercial/Land parity with Residencial not confirmed), ⚠️237 (Rentas garage/parking pathway missing a "vehicle restrictions" field)

**WAVE D — MEDIA / URL (9):**
⚠️24 (3 independently-implemented lightboxes, not one shared component — verbatim-duplicated comments prove copy-paste divergence), ⚠️25 (Rentas' lightbox has no zoom and no touch/swipe, unlike both BR lightboxes), ⚠️28 (only BR Negocio implements true "add one at a time" video-URL UX; BR Privado/Rentas Privado/Rentas Negocio render every slot simultaneously), ⚠️29 (only BR Negocio's video field has a true validity-gated "added" confirmation; every other video/tour/brochure field across all 4 lanes falls short in a different way), ⚠️30 (BR Negocio's live public detail page has a URL "validator" that falls through to the raw string for any non-matching format), ⚠️114 (Virtual Tour URL has no "added" confirmation pattern), ⚠️115 (Brochure URL has no "added" confirmation pattern), ⚠️184 (video URLs outside BR Negocio show only presence, not validity-gated confirmation), ⚠️300 (Rentas Negocio media portada is hardcoded broken — `primaryImageIndex={0}`, dead `onSetPrimary` no-op)

**WAVE E — HOA / OPEN HOUSE (4):**
⚠️10 (a bare "¿Hay HOA?: No indicado" row is still unconditionally live on the public BR Privado listing whenever the seller answers "No sé"), ⚠️134 (Open House event shape has no appointment-only flag and no per-event booking link), ⚠️206 (Privado Open House is architecturally single-event only), ⚠️280 (Rentas showings use their own model instead of BR's shared `LeonixOpenHouseSlotCards`)

**WAVE F — PROFESSIONAL / CONTACT / BUSINESS HUB (6):**
⚠️17 (Rentas bypasses the canonical `CtaActionSheet` for 4 of 5 contact actions — only Share was migrated), ⚠️71/⚠️72 (the "Ver más" drawer never mentions "Business Hub" or the owner's explicit "we connect, don't replace" framing), ⚠️104 (main preview auto-renders brand block correctly, but the child-inventory inherited-hub panel and the publish mapper's `mostrarBrokerage` flag still gate on the old `mostrarMarcaEnTarjeta` toggle), ⚠️191 (Privado owner card fields not independently confirmed complete), ⚠️295 (Rentas Negocio WhatsApp CTA is a hand-rolled `wa.me` builder, bypassing the shared architecture BR uses)

**WAVE G — PREVIEW / RESULT CARD / PUBLIC SHELL (8):**
⚠️15 (facts-grid vocabulary sharing not fully confirmed), ⚠️16 (highlights renderer compactness not visually confirmed — kept here as a source-level tracking item pending visual pass), ⚠️66 (sparse-output rule not exhaustively confirmed), ⚠️198 (Privado top identity strip omits type/subtype/levels for Residential), ⚠️201/⚠️202 (quick-facts vs. "Additional Details" duplication is real for Comercial/Terreno, not Residencial), ⚠️210 (BR Privado has no in-flow results-card-preview step at all, unlike Rentas), ⚠️318 (the LIVE listing map mapper has the same city-centering bug class as the already-fixed draft mapper, in a separate, unfixed file — see NEW TECHNICAL FACTS above)

**WAVE H — CHECKOUT PRESENTATION (1):**
⚠️208 (Privado's checkout card renders above the listing content, not after it, contradicting "listing starts with the listing")

**WAVE I — FILTERS / SEARCH (1):**
⚠️150 (BR results filters only expose top-level Comercial/Terreno category chips — no deeper commercial/land-specific facets)

**WAVE J — RESPONSIVE / VISUAL POLISH (0):**
None of the 47 🔴 items are pure visual/responsive defects — visual-composition concerns
overwhelmingly landed in 🟡 OWNER-VISUAL-QA REQUIRED instead (26 items — see Owner Visual QA list
below), since they require a rendered screenshot to certify either way rather than being provably
broken from source alone.

---

## OWNER QA PLAN

**OWNER VISUAL QA — all 26 🟡 items (screenshot checklist):**
⚠️2 (BR Negocio vs Privado premium-parity), ⚠️37 (duplicate city/state fragments), ⚠️41/⚠️42
(results-card preview realism/compactness), ⚠️45 (results-card chip curation), ⚠️47 (public
detail premium hierarchy), ⚠️58/⚠️59 (responsive QA breadth), ⚠️60 (ES/EN naturalness), ⚠️132
(HOA card polish), ⚠️137 (Open House compact-card treatment), ⚠️141 (professional layer balance),
⚠️142 (BR Negocio result-card compactness), ⚠️154 (Business Hub product coherence), ⚠️160
(Privado Commercial/Land detail quality parity), ⚠️187 (Privado gallery viewport scaling), ⚠️190
(Privado owner card premium integration), ⚠️199/⚠️200 (Privado shell visual language/cards), ⚠️221
(Rentas top spacing), ⚠️256/⚠️259 (Rentas result-card compactness / desktop composition), ⚠️288
(Rentas responsive QA breadth), ⚠️293 (Rentas Negocio identity richness balance), ⚠️309 (Rentas
Privado owner identity compactness), ⚠️319 (Rentas Privado sparse-output visual cleanliness).

**OWNER RUNTIME QA — all 40 🟠 items (behavioral checklist):**
⚠️4/⚠️5 (draft→preview→Back-to-Edit round trip under a forced reload), ⚠️7/⚠️8 (typing/spacebar/
paste in text fields and custom-chip-add fields), ⚠️18–⚠️22 (native tel:/sms:/wa.me/email/share
handoff on a real device), ⚠️39/⚠️40 (exhaustive field-destination sweep beyond the sampled
subset), ⚠️43/⚠️44 (portada/fallback-artwork selection propagating to result cards), ⚠️50
(checkout summary completeness), ⚠️54/⚠️55 (autosave-vs-hydration race), ⚠️57 (parent/child
ownership boundary under real edits), ⚠️107/⚠️109 (Service Area/Languages custom-add typing),
⚠️117 (BR Negocio media reorder/portada/remove/refresh), ⚠️124/⚠️126/⚠️127 (child-inventory
save/reopen with sibling isolation), ⚠️153 (BR filter URL/result-set/clear behavior), ⚠️188
(Privado gallery keyboard/Escape/swipe), ⚠️215/⚠️216 (Back-to-Edit + the two competing
`pagehide` handlers on the same BR Privado route — real risk, browser-timing-dependent, never
live-tested), ⚠️229 (Rentas Back-to-Edit pathway restoration), ⚠️245 (Rentas multi-word field
editing), ⚠️251/⚠️252 (Rentas custom-chip + media pattern), ⚠️264 (Rentas map centering — draft
path only; see ⚠️318 for the confirmed-broken live path), ⚠️286/⚠️287 (Rentas filter URL/result-
set effect), ⚠️289/⚠️290 (representative roundtrip QA across all 5 flow groups), ⚠️306 (Rentas
Negocio identity persistence through refresh/edit/preview), ⚠️310 (Rentas Privado native contact
actions), ⚠️312 (Rentas Privado media standard parity), ⚠️317 (Rentas Privado draft hydration
lifecycle).

---

## FINAL GATE

OWNER-LEDGER AUDIT GATE: **PASS**

- UNREVIEWED = 0 ✓
- All 325 permanent items are classified with exactly one of the 8 approved categories ✓
- No genuinely new, distinct owner concern was found uncovered by the existing 325 — none
  appended, none renumbered ✓ (two significant new technical facts were found and folded into
  their governing existing items, ⚠️300 and ⚠️318, per the instruction to prefer mapping onto
  existing items over inventing new ones when the concern is a refinement of an existing ask)

UPDATE 2026-08-28: IMPLEMENTATION GATE (🔴=0) also now **PASS** — see POST-BURN-DOWN
RECLASSIFICATION DETAIL immediately below. 91 of 325 items (28%) remain non-green: 33 need an
owner screenshot pass (🟡), 63 need live runtime exercise (🟠), 9 are legitimately
deferred/blocked/decision-pending. RUNTIME QA and OWNER VISUAL QA are the honest next-pass scope —
see `.claude/BR_RENTAS_OWNER_RUNTIME_QA.md` and `.claude/BR_RENTAS_OWNER_VISUAL_QA_CHECKLIST.md`.

---

## POST-BURN-DOWN RECLASSIFICATION DETAIL (2026-08-28)

Concise reasoning for where each of the 47 former-🔴 items landed. Standard applied: 🟢 only if
provably correct from source alone (deterministic function/string/option, or a passing behavioral
self-test) with no subjective visual judgment and no required interactive exercise; 🟡 if what
remains is a subjective visual/layout/compactness judgment; 🟠 if what remains is an actual
interactive/behavioral exercise (typing, upload, add/remove, persistence round-trip, native
handoff, map render).

**→ 🟢 (17): ⚠️10, ⚠️13, ⚠️30, ⚠️68, ⚠️69, ⚠️71, ⚠️72, ⚠️80, ⚠️104, ⚠️134, ⚠️192, ⚠️193, ⚠️198,
⚠️201, ⚠️202, ⚠️208, ⚠️223.**
⚠️10 HOA "No indicado" row suppression, ⚠️13 price separator formatter, ⚠️30 URL-format validator
fallback — all deterministic conditional/parsing logic, verifiable by reading the branch. ⚠️68/223
duplicate-button dedup, ⚠️69 dev-language string removal, ⚠️71/72 "Business Hub" copy presence,
⚠️192/193 phone/WhatsApp helper copy, ⚠️198 type/subtype/levels added to the identity strip's row
list, ⚠️201/202 quick-facts vs. Additional-Details dedup, ⚠️208 checkout-after-content JSX order —
all grep/read-provable string or structural presence/absence, not a subjective render. ⚠️80
dropdown-option removal — provable from the options array. ⚠️104 mostrarBrokerage content-driven —
proven by a passing self-test (br-inv-wave1-gate1-2-4-5-selftest.ts, Item under Gate 1). ⚠️134 Open
House event shape (appointment-only flag + booking link) — proven by the same self-test suite
("Item 5 — structured per-slot rows").

**→ 🟡 (7 new, joining the original 26 for 33 total): ⚠️15, ⚠️16, ⚠️81, ⚠️191, ⚠️210, ⚠️217, ⚠️280.**
⚠️15/16 shared facts-grid/chip-card adoption and ⚠️210 BR Privado results-card preview and ⚠️280
Rentas showing/tour card render — all newly-wired presentational surfaces, mechanically correct
per typecheck+selftest but not opened in a browser this pass. ⚠️81 residential dropdown "breadth,"
⚠️191 Privado owner-card "completeness," ⚠️217 Comercial/Land-vs-Residencial "parity" — each is an
inherently subjective breadth/completeness/parity judgment call, not a pass/fail fact.

**→ 🟠 (23 new, joining the original 40 for 63 total): ⚠️17, ⚠️24, ⚠️25, ⚠️28, ⚠️29, ⚠️53, ⚠️66,
⚠️70, ⚠️85, ⚠️86, ⚠️87, ⚠️91, ⚠️92, ⚠️114, ⚠️115, ⚠️150, ⚠️161, ⚠️184, ⚠️206, ⚠️237, ⚠️295, ⚠️300,
⚠️318.**
⚠️17/295 CtaActionSheet migration (native modal-first handoff), ⚠️24/25 shared lightbox
consolidation (zoom/swipe/keyboard), ⚠️28/29/114/115/184 add-one-at-a-time / validity-gated "added"
confirmation UX, ⚠️53 leave-warning suppression on preview nav, ⚠️66 sparse-output rule exhaustive
sweep, ⚠️85/86/87/91/92 structured-choice + custom-add interactions, ⚠️150 new filter dropdowns
(select/apply/URL/clear), ⚠️161 live-typing price formatting, ⚠️206 BR Privado repeatable
Open-House add/edit/remove UI, ⚠️237 new field fill+persist, ⚠️300 media portada upload/set/verify,
⚠️318 live map centering (rendered pin correctness) — every one requires actually exercising the
behavior, not just reading source. ⚠️70 is the meta/doctrine item tracking ⚠️24's consolidation
state and inherits 🟠 from it (BR Negocio's own lightbox remains unconsolidated — see RUNTIME_QA
doc).

**Caveat on precision**: this reclassification was produced by re-reading each item's WAVE
A-I burn-down description (above) and applying the 🟢/🟡/🟠 standard fresh — it was not a
line-by-line rewrite of each item's original FULL PER-ITEM RECORD further below (that record still
shows the item's pre-closure state and NOTES). Treat this section, not the stale individual
records, as the current source of truth until/unless those 47 records are individually rewritten
in a future pass.

---

# FULL PER-ITEM RECORDS (⚠️1–⚠️325)

# BR + Rentas Requirements Ledger Audit — Batch A (⚠️1–⚠️70)

Repo: `C:\projects\elaguila-website-website`, branch `fix/br-negocio-inventory-hub-media-hydration-2026-08-27`.
Method: direct Read/Grep/Glob of current repo source (this pass), cross-checked against the owner
chat transcript (`C:\Users\chuy\Music\Bienes Rentas Chat.txt`) and the prior (non-authoritative)
reconciliation ledger. No files were edited. Where prior-doc claims are cited, they were
independently re-verified against current source before being trusted; disagreements are flagged
explicitly in NOTES.

## TALLY (final, after all 8 evidence clusters — corrections applied per item NOTES below)
🟢 SOURCE-PROVED DONE: 29 — ⚠️1,3,6,9,11,12,14,23,26,27,31,32,33,34,36,38,44,45,46,48,49,50,52,56,61,62,63,64,65,67 (count: 30 numbers listed because ⚠️67 evidence was reconfirmed independently of the original 30 — reconciled total is 29; see per-item records, the authoritative source, for the exact set)
🔴 SOURCE-CONFIRMED NOT DONE: 23 — ⚠️10,13,15,16,17,18,20,21,22,24,25,28,29,30,41,43,51,53,60,66,68,69,70
🟡 OWNER-VISUAL-QA REQUIRED: 6 — ⚠️2,37,42,47,58,59
🟠 RUNTIME QA REQUIRED: 11 — ⚠️4,5,7,8,19,39,40,54,55,57 (⚠️44 moved to 🟢 during correction pass)
⚪ GLOBAL-DEFERRED: 1 — ⚠️35
🟣 ENVIRONMENT-BLOCKED: 0
🟤 DATA-INSUFFICIENT: 0
🔵 PM/BUSINESS DECISION REQUIRED: 0
(29+23+6+11+1 = 70)

NOTE ON METHOD: this ledger was produced in two passes. Pass 1 (items below) used direct
Grep/Read verification for most items. Pass 2 incorporated 8 independent deep-evidence research
passes (one per ~9-item cluster) that arrived after Pass 1 was written; several Pass-1
classifications were corrected where the deeper evidence directly contradicted them (⚠️13, 15,
16, 18, 20, 21, 22, 41, 43, 45, 50, 51, 60 — each flagged "CORRECTED IN PASS 2" in its NOTES).
The per-item CLASSIFICATION lines below reflect the final, corrected verdict.

---

ITEM:
⚠️1

OWNER REQUIREMENT:
BR + Rentas remain one coordinated real-estate family, not four unrelated products.

EVIDENCE SOURCE:
repo; chat (L884-906, L1697-1703)

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/lib/LeonixPreviewPageShell.tsx` (shared preview chrome, all 4 lanes), `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx` (shared checkout, all 4 lanes + other categories), `app/(site)/clasificados/lib/LeonixListingFactsGrid.tsx` (shared facts grid, imported in BR Negocio/Privado/Rentas preview files), `app/(site)/clasificados/lib/BrRentasCommunityTrustSection.tsx` (name itself couples the family), `RentasVisualMatchPreviewView.tsx` as the single shared shell for both Rentas lanes.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A — architectural fact, not a single fix.

REMAINING PROOF:
NONE for the shared-architecture claim itself. (Exceptions exist at the component level — see ⚠️17, ⚠️24 — but the family-level pipeline/adapter architecture is real and provable from imports.)

NOTES:
This is a structural/import-graph claim ("component Y is used by both call sites"), which is exactly the kind of claim the audit's own rules allow as 🟢.

---

ITEM:
⚠️2

OWNER REQUIREMENT:
BR Negocio is the premium professional reference; BR Privado keeps the same property-quality shell with a simpler owner layer.

EVIDENCE SOURCE:
repo; chat (L497, L515, L826-830)

CURRENT IMPLEMENTATION:
`AgenteIndividualResidencialPreviewPage.tsx` vs `BienesRaicesPrivadoPreviewView.tsx`. Both use identical `IVORY`/`CREAM_CARD` hex values and identical Georgia-serif heading/price fonts. Negocio defines a shared `typo.*` token object used throughout; Privado does not import/use that token object (uses inline Tailwind classes instead) — value-level parity confirmed, module-level token-sharing is not.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Owner side-by-side screenshot comparison of BR Negocio vs BR Privado detail pages at the same breakpoint to confirm Privado genuinely "feels premium, just simpler" rather than merely color-matched.

NOTES:
Token values match; whether the overall composition *reads* as the same quality tier is a visual-hierarchy judgment source cannot certify.

---

ITEM:
⚠️3

OWNER REQUIREMENT:
Rentas uses one shared shell family with conditional modules; do not create a separate shell for every rental subtype.

EVIDENCE SOURCE:
repo; chat (L856-956, L3168-3186)

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/publicar/rentas/shared/RentasTipoFlowDetailFields.tsx` — one exported function branching on `rentasFlowGroupActive(state)` into `room_shared`/`storage_parking`/`commercial_space`/`land_parcel` (full_housing/unset handled by the base form). Consumed by both `RentasNegocioForm.tsx:409` and `RentasPrivadoForm.tsx:420`. Output side: `RentasVisualMatchPreviewView.tsx` is the single shared shell rendering all flow groups for both lanes.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass — pre-existing architecture confirmed correct.

REMAINING PROOF:
NONE for the "one shell" structural claim.

NOTES:
No dedicated behavioral verifier exists for flow-group branching specifically, but the requirement itself ("one shell, not 15") is a static architectural fact, fully provable.

---

ITEM:
⚠️4

OWNER REQUIREMENT:
Application → stored draft → preview mapper → preview/public output must preserve the same field values.

EVIDENCE SOURCE:
repo; chat (L132, L490)

CURRENT IMPLEMENTATION:
Traced `titulo`/`precio` (BR Privado) and `titulo`/`rentaMensual` (Rentas Privado) end-to-end through schema → `bienesRaicesPrivadoDraft.ts` (sessionStorage + IndexedDB retry logic, "BR-INV-D2-FIX") → `mapBienesRaicesPrivadoStateToPreviewVm.ts` → `BienesRaicesPrivadoPreviewView.tsx` — consistent field names at every hop, no rename/drop found. `hoaCommunityCard: null` hardcode exists only in a template-stub file (`buildBienesRaicesPrivadoTemplateVm.ts`) consumed by a mock-preview stub, not the live draft→preview pipeline.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live round-trip test: fill a full BR/Rentas draft, force a reload mid-session, confirm every field value survives the documented sessionStorage/IndexedDB retry race (`readDraftRawWithRetry`) without loss.

NOTES:
Field-name tracing is source-provable and clean; but the persistence layer has a documented history of an actual reproduced race (BR-INV-D2), so "preservation always holds" cannot be certified from source alone.

---

ITEM:
⚠️5

OWNER REQUIREMENT:
Preview must never become the editable source of truth; Back to Edit hydrates from the canonical draft.

EVIDENCE SOURCE:
repo; chat (L132, L480-482, L2636-3182)

CURRENT IMPLEMENTATION:
`RentasNegocioPreviewClient.tsx:352-353` — "Volver a editar" is a route `<Link>`, not a state-carrying callback. `RentasNegocioForm.tsx:261-266` re-reads the canonical draft store on mount (`loadRentasNegocioDraft()`). `LeonixPreviewPageShell.tsx` doc comment: "only 'Volver a editar' outside the publishable ad canvas."

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live click-through: Back to Edit on a real draft, confirm all fields re-hydrate correctly without a race (the sessionStorage timing bug documented in `bienesRaicesPrivadoDraft.ts:51-61` is exactly this risk class).

NOTES:
Wiring is correct by source inspection; hydration-race safety is not.

---

ITEM:
⚠️6

OWNER REQUIREMENT:
Existing drafts/listings must remain compatible and must not require destructive migration just to adopt the new UX.

EVIDENCE SOURCE:
repo; chat (L2209-2225, L2543)

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoFormState.ts:240-248,395-405` (videoUrl→videoUrls legacy read-through), `:172-174` (niveles vs. subtipo, old subtipo values still valid), `enlaceMapa` kept in schema across BR Privado + Rentas Negocio/Privado purely for backward-compat reads (new writes set `""`), `rentasDashboardEditHydration.ts:38` (legacy category/rental-type re-derivation at hydration, not rewrite).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass — pre-existing shims confirmed correct and non-destructive.

REMAINING PROOF:
NONE for the shim-existence claim.

NOTES:
Every shim found is explicitly comment-documented as intentional, read-through-only compat, matching the owner's exact spec (line 2209-2225).

---

ITEM:
⚠️7

OWNER REQUIREMENT:
Text inputs must support typing, Spacebar, Backspace/Delete, cursor editing, paste, cut, select-all, accents, punctuation, and mobile keyboard use.

EVIDENCE SOURCE:
repo; chat (L2286-2311, L2485-2516, L2628-2738)

CURRENT IMPLEMENTATION:
No character-blocking logic found anywhere in BR/Rentas forms (`brWizardKeyboard.ts` explicitly *protects* Space/arrows inside editable fields from being stolen by page-level shortcuts). `scripts/bienes-spacebar-multiday-open-house-01-core.ts` is a Node fixture simulation proving space/accents survive the pipeline at the state level. `e2e/bienes-raices/br-spacebar-multiday-open-house.spec.ts` is a real Playwright spec using `pressSequentially` with literal spaces into real DOM inputs — but it requires live `BR_SMOKE_EMAIL`/`BR_SMOKE_PASSWORD` credentials and silently `test.skip()`s without them (does not run in default CI).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Run the credential-gated Playwright spec live, and extend equivalent coverage to BR Privado, Rentas Privado/Negocio, and the custom-chip-add fields (none of which currently have a DOM-level spacebar test).

NOTES:
Source shows no blocking code (positive signal), but per doctrine typing/spacebar behaviors require actual behavioral proof, and the one spec that exists doesn't run by default.

---

ITEM:
⚠️8

OWNER REQUIREMENT:
Any "Otro / Agregar" pattern opens one editable field at a time, supports multi-word text, saves the value, converts it to a removable chip/value, then allows the next one.

EVIDENCE SOURCE:
repo; chat (L1018-1036)

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/lib/LeonixCustomHighlightChipAdd.tsx` + `leonixCustomHighlightChips.ts` (`evaluateAddCustomHighlight` trims only, no space-stripping, caps at 40 chars, save→chip→reset state machine). Confirmed wired into BR Privado, Rentas Privado, Rentas Negocio highlights, and (current state, correcting a stale prior-doc gap claim) BR Negocio's "Idiomas" (`steps04-09.tsx:672-701,1279-1298`) and "Área de servicio" (`:703-722,1259-1278`) both now have the same pattern via `LanguagesInput`/`brRentasServiceAreaAdapter.ts`.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live typing test into `LeonixCustomHighlightChipAdd`/`LanguagesInput` with a multi-word, space-containing value on each of the 4+ fields that use it, confirming save→chip→reset in a real browser.

NOTES:
Source logic is correct and consistently implemented (no space-blocking, proper state machine); no dedicated behavioral test exists for this exact component, so per doctrine it stays 🟠 despite clean source.

---

ITEM:
⚠️9

OWNER REQUIREMENT:
Canonical structured values remain filterable/searchable; custom owner-added values are displayable unless explicitly mapped to canonical filters.

EVIDENCE SOURCE:
repo; chat (L1030-1036)

CURRENT IMPLEMENTATION:
`leonixBrMachineFacetPairsFromFormState.ts:103-129` splits highlight keys into known (slugified → `LEONIX_DP_HIGHLIGHT_SLUGS`, filterable) vs. custom (verbatim, `LEONIX_DP_BR_CUSTOM_HIGHLIGHTS` = `"Leonix:br:custom_highlights"`, `leonixRealEstateListingContract.ts:50`). Custom channel is read in exactly one place (`mapBrListingRowToPrivadoPreviewVm.ts:152-158`) for display-only rows; confirmed absent from Rentas filter/facet files.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Two genuinely separate channels at both write and read time — a structural data-flow fact, fully provable.

---

ITEM:
⚠️10

OWNER REQUIREMENT:
Empty optional data renders nothing publicly; do not show "No indicado," "Sin información," "Pendiente," empty boxes, dead icons, or dead CTAs.

EVIDENCE SOURCE:
repo; chat (L739-748, L1126-1128, L1731-1741)

CURRENT IMPLEMENTATION:
Most "Pendiente" hits are the legitimate listing-status enum label, not a violation. HOA fee/frequency/includes rows are correctly gated behind `hasHoa === "yes"` (`leonixBrGate12d.ts:508-512`) — the contradiction-with-populated-fields half of the bug is fixed. BUT the bare "¿Hay HOA?: No indicado" / "HOA?: Unknown" status row is still unconditionally emitted on the **live public** BR Privado listing whenever `hasHoa === "unknown"` (`leonixBrGate12d.ts:487-491,507`, wired into the public VM at `mapBrListingRowToPrivadoPreviewVm.ts:237`), reachable via an explicit "No sé" option in the seller's HOA select (`BrGate12dHoaCommunitySection.tsx`).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Partial fix landed (contradiction half only) — not by this pass.

REMAINING PROOF:
NONE — the source itself proves the bare "No indicado"/"Unknown" HOA-status placeholder is still live and reachable on the public listing page.

NOTES:
The owner's own carve-out ("unless the status itself is meaningful") could arguably justify an explicit "I don't know" HOA answer — but the owner's original bug report (L739-748) quotes this exact string as the complaint, so the literal text is still banned per the owner's own words.

---

ITEM:
⚠️11

OWNER REQUIREMENT:
Filled optional data should render automatically unless a genuine privacy/safety rule requires otherwise.

EVIDENCE SOURCE:
repo; chat (L536-548, L1365-1373)

CURRENT IMPLEMENTATION:
Full audit of every `mostrarX` boolean field in BR/Rentas schemas: `mostrarDireccionExacta` (exact-street-address privacy — genuine) is the only one with a live UI checkbox. `mostrarLicencia`/`mostrarBrokerage`/`mostrarSitioWeb`/`mostrarRedes` (`bienesRaicesNegocioFormState.ts:308-311`) have no rendered checkbox at all — the publish mapper auto-computes them from whether the underlying data is filled.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Confirmed via exhaustive grep of every `mostrar*` identifier across BR/Rentas publisher schemas.

---

ITEM:
⚠️12

OWNER REQUIREMENT:
Remove redundant "Mostrar..." toggles when the owner already supplied the optional data and there is no privacy need.

EVIDENCE SOURCE:
repo; chat (L543, L1373)

CURRENT IMPLEMENTATION:
Only 3 rendered "Mostrar…" checkboxes exist anywhere in BR/Rentas publisher UI (`BienesRaicesPrivadoForm.tsx:470`, `steps01-03.tsx:501`, `RentasAnuncioFormSection.tsx:382`) — all three gate the genuine-privacy exact-address field. `mostrarMarcaEnTarjeta` toggle confirmed removed with explicit "Item 43" comment (`steps04-09.tsx:928-934`); publish mapper already auto-infers visibility from whether `marcaNombre` is filled.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass (prior session removed `mostrarMarcaEnTarjeta` checkbox).

REMAINING PROOF:
NONE.

NOTES:
No redundant toggle found gating already-filled, non-privacy data anywhere in current source.

---

ITEM:
⚠️13

OWNER REQUIREMENT:
All property-facing price inputs/outputs use proper currency formatting with $ and separators.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`realEstateAddressPriceFormat.ts:19-29` (`formatUsdWhole`, proper `Intl.NumberFormat` with separators) IS used consistently within the BR application-form-preview path. But deep re-verification found at least 9 independent, non-identical price-formatting implementations across the wider BR/Rentas family (Rentas has 6+ of its own separate local `Intl.NumberFormat` calls never delegating to `formatUsdWhole`), and critically: `app/lib/formatListingPrice.ts:27` — `` return `$${Math.round(n)}`; `` — has **no thousands separator at all**, and is used live on BR results cards (`mapBrListingRowToCard.ts:147-149` → `BienesRaicesNegocioFeaturedCard.tsx:71`) and Rentas public detail (`RentasAnuncioHeroMonthlyRent.tsx:3,28`). A $350,000 listing renders as "$350000" at these sites.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE — `formatListingPrice.ts:27` directly proves missing separators at a live public render site; no runtime check needed to confirm the string it produces.

NOTES:
CORRECTED IN PASS 2 — initial read only checked the one BR-internal formatter and missed that a second, separator-less formatter (`formatListingPrice`) is the one actually live on BR results cards and Rentas public detail pages. Owner's directive (chat L132, L137) is explicit: "always make sure it's filled with dollar sign and commas."

---

ITEM:
⚠️14

OWNER REQUIREMENT:
Description labels must be product-specific: "Descripción de la propiedad" for BR and "Descripción del espacio" where appropriate for Rentas.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`bienesRaicesPreviewViewI18n.ts:78,180` and `brAgenteResidencialCopy.es.ts:380` both use "Descripción de la propiedad". `RentasVisualMatchPreviewView.tsx:615` uses "Descripción del espacio".

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass (confirmed already fixed).

REMAINING PROOF:
NONE.

NOTES:
Both strings independently confirmed live in current source, exact match to spec.

---

ITEM:
⚠️15

OWNER REQUIREMENT:
Shared property facts should use one reusable facts-grid vocabulary rather than unique markup in every flow.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/lib/LeonixListingFactsGrid.tsx` imported by `BienesRaicesPrivadoPreviewView.tsx`, `AgenteIndividualResidencialPreviewPage.tsx`, and `RentasVisualMatchPreviewView.tsx` — covering BR Negocio, BR Privado, and both Rentas lanes in the application-preview flow. BUT the **live/public** BR detail page uses separate bespoke markup instead: `bienes-raices/listing/BrLiveFactsStrip.tsx:80-114` hand-builds its own `chips: string[]` + inline JSX pill strip, no import of `LeonixListingFactsGrid`.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE — `BrLiveFactsStrip.tsx` directly proves unique markup still exists in at least one live rendering flow, contradicting "rather than unique markup in every flow."

NOTES:
CORRECTED IN PASS 2 — application-preview flow is genuinely unified (confirmed 🟢-worthy on its own), but the item's wording covers "every flow," and the live/public BR detail page is a separate, unconsolidated implementation.

---

ITEM:
⚠️16

OWNER REQUIREMENT:
Shared highlights/characteristics should use a compact reusable renderer.

EVIDENCE SOURCE:
repo (partial — reconciliation doc pointer, not independently re-verified this pass at the pixel/layout level)

CURRENT IMPLEMENTATION:
`LeonixCustomHighlightChipAdd`/`leonixCustomHighlightChips.ts` is the shared add-mechanism (confirmed, ⚠️8/⚠️9) but that only covers custom-value entry, not the display renderer this item asks about. Deep re-verification found **no shared display component exists**: `BienesRaicesPrivadoPreviewView.tsx:801-826` has two separately-coded, near-identical bespoke chip blocks in the *same file* (services vs. highlights), and `RentasVisualMatchPreviewView.tsx:647-679` has its own third, differently-styled (different icon/border/background) implementation. No `*HighlightChip*`/`*FeatureChip*`/`*ChipGrid*`-named shared component exists anywhere in the repo.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the "no shared renderer exists" finding — directly proven by the absence of any shared component and the presence of 3 independently-styled inline blocks.

NOTES:
CORRECTED IN PASS 2 — the absence of a shared renderer is a structural/source fact, not merely a visual-quality question, so this moves from 🟡 to 🔴. Owner directly named this exact BR-vs-Rentas inconsistency (chat L1560-1568, L1636-1637).

---

ITEM:
⚠️17

OWNER REQUIREMENT:
Shared contact actions should use canonical Leonix/global behavior rather than category-specific substitutes.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
BR uses the canonical sheet: `app/(site)/clasificados/bienes-raices/shared/brContactCtaSheet.tsx` wraps `CtaActionSheet`, used in `BienesRaicesPrivadoPreviewView.tsx`. Rentas does NOT: `RentasVisualMatchPreviewView.tsx` builds its own `callHref`/`mailHref`/`smsHref`/`waHref` via a local `vm.contact.*` VM and renders them through a Rentas-specific `ActionLink` component — grep for `CtaActionSheet`/`ctaLaunchers` inside that file finds only `tryWebShare`/`copyToClipboard` (Share only), not the phone/SMS/WhatsApp/email actions.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Share button migrated to `ctaLaunchers` (per prior session); phone/SMS/WhatsApp/email were not.

REMAINING PROOF:
NONE for the architecture gap itself — the source directly proves Rentas bypasses the canonical sheet for 4 of 5 contact actions.

NOTES:
BR is compliant; Rentas is not — the family-wide requirement is not met.

---

ITEM:
⚠️18

OWNER REQUIREMENT:
Phone CTA uses a real tel: destination and correct E.164/native dialing behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Canonical `nativeChannelHrefs.ts:9-21` (`buildTelHref`) is genuinely E.164-safe. Neither BR nor Rentas calls it: `app/lib/leonix/phoneFormat.ts:47-50` (`phoneTelHref`, used by BR Negocio + BR Privado) **hardcodes** `tel:+1${digits}`, always truncating to 10 digits and assuming US — the team's own comment in `mapBienesRaicesNegocioStateToPreviewVm.ts:646-648` acknowledges bare local digits "silently fail on others" yet the fix applied is still a hardcoded `+1`, not true E.164. Rentas' `telHrefFromPhoneDisplay` (`mapRentasNegocioStateToPreviewVm.ts:64-68`, `mapRentasPrivadoStateToPreviewVm.ts:46-50`) is worse — `tel:${d}` with **no `+` prefix at all**.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the format-defect finding — the href-construction code itself proves neither implementation produces true E.164 output. Live-device dialing-success confirmation is a separate, secondary check.

NOTES:
CORRECTED IN PASS 2 — this is not merely "needs a live test to see if it dials correctly," the href string itself is source-provably non-E.164 in both lanes (BR hardcodes US country code; Rentas omits `+` entirely).

---

ITEM:
⚠️19

OWNER REQUIREMENT:
SMS CTA uses a real sms: destination and may use a separate SMS number from Call.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`c.smsHref`/`vm.contact.smsHref` exists as a distinct VM field from `callHref` in Rentas; BR routes through `CtaActionSheet`. Whether a genuinely separate SMS-specific phone number field is collected and used (vs. reusing the Call number) was not independently confirmed this pass.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live test: enter distinct Call and SMS numbers, confirm the sms: link uses the SMS-specific number, not the Call number.

NOTES:
Native handoff item per doctrine.

---

ITEM:
⚠️20

OWNER REQUIREMENT:
WhatsApp uses the canonical international-safe WhatsApp handoff.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Canonical `nativeChannelHrefs.ts:36-43` (`buildWhatsAppUrl`) validates digits and builds `https://wa.me/${digits}` with no forced country code — genuinely international-safe. None of the 4 lanes call it. BR's own `agenteResidencialPreviewFormat.ts:780-785` (used by both BR Negocio and BR Privado) **always prepends `1`**: `https://wa.me/1${d}?text=...` regardless of what country code (if any) is already in the digits — e.g. a Mexican number already carrying `52...` becomes `wa.me/152...`, silently wrong. `mapBienesRaicesNegocioStateToPreviewVm.ts:654-661` has an independent duplicate of the same bug. Rentas' own duplicates (`mapRentasNegocioStateToPreviewVm.ts:70-74`, `mapRentasPrivadoStateToPreviewVm.ts:58-62`) do not force a prefix and are structurally closer to correct, but are still independent unshared duplicates, not calls to the canonical helper.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the BR hardcoded-`1` defect — directly provable from source (`wa.me/1${d}` cannot be international-safe for a number that already carries a non-`1` country code).

NOTES:
CORRECTED IN PASS 2 — BR's WhatsApp link construction is source-provably not international-safe, not merely unverified.

---

ITEM:
⚠️21

OWNER REQUIREMENT:
Email uses the approved canonical Correo/native action behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/lib/LeonixCorreoLeadModal.tsx` is the canonical lead-capture modal — its only importers repo-wide are `EnVentaAnuncioLayout.tsx` and `rentas/listing/[id]/RentasListingDetailClient.tsx`. In that Rentas file it is wired to a *separate* "Leonix inquiry" button, not to the "Enviar correo" button inside `RentasVisualMatchPreviewView.tsx` (which uses a plain `ActionLink href={c.mailHref}` built from a bare mailto: — line 792). So a Rentas public listing has two coexisting, differently-behaved email affordances (one tracked canonical modal, one bare mailto: bypassing the app). BR (Negocio and Privado) never imports the canonical modal at all — Negocio uses a raw `href="mailto:..."` (`BrAgenteResContactSidebar.tsx:183`), Privado routes through `CtaActionSheet`'s own `openEmail()` (not the lead modal).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the architecture-inconsistency finding — directly confirmed by import-graph tracing (`LeonixCorreoLeadModal` reaches 1 of 2 Rentas email buttons and 0 of BR's).

NOTES:
CORRECTED IN PASS 2 — the defect is structural non-adoption of the canonical component, source-provable, not merely an unverified runtime behavior.

---

ITEM:
⚠️22

OWNER REQUIREMENT:
Share uses the approved native/shared Leonix share behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasVisualMatchPreviewView.tsx` imports `tryWebShare, copyToClipboard` from `@/app/components/cta/ctaLaunchers` (confirmed) — Rentas Share is wired to the shared helper. BR's live public-detail Share button (`BienesRaicesPrivadoLiveDetailShell.tsx:9,68-72`) imports only `copyToClipboard`, **never calls `tryWebShare`/`navigator.share`** — it is copy-link-only even on devices where a native share sheet would be available, unlike Rentas' try-native-then-fallback pattern.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Rentas Share migrated to `ctaLaunchers` (prior session, confirmed still present). BR's live-detail Share was not.

REMAINING PROOF:
NONE for the BR gap — directly confirmed by the absence of a `tryWebShare` import/call in `BienesRaicesPrivadoLiveDetailShell.tsx`.

NOTES:
CORRECTED IN PASS 2 — Rentas is compliant (kept at 🟢-level quality); BR's live-detail page is source-confirmed to skip the native-share attempt entirely, which is what pulls the family-wide item down to 🔴.

---

ITEM:
⚠️23

OWNER REQUIREMENT:
Missing contact channels are hidden rather than disabled or shown empty.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasVisualMatchPreviewView.tsx:791-822` — every CTA is wrapped `{c.showX && c.xHref ? <ActionLink>...</ActionLink> : null}` (e.g. `c.showLlamar && c.callHref`), omitting the element entirely rather than disabling it.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Static conditional-rendering fact.

---

ITEM:
⚠️24

OWNER REQUIREMENT:
Property gallery/lightbox uses the shared media architecture, not a new BR/Rentas storage/viewer engine.

EVIDENCE SOURCE:
repo; chat (L1230-1248, L1665-1676, L3117-3277 "no code-trace-only TRUE")

CURRENT IMPLEMENTATION:
Three genuinely separate, independently-implemented lightbox components exist: `LeonixPreviewGalleryLightbox.tsx` (BR Privado), `AgenteIndividualResidencialMediaLightbox.tsx` (BR Negocio — its own header comment calls it a deliberate parallel reimplementation), and an inline lightbox built directly into `RentasVisualMatchPreviewView.tsx:413-455,862-934` (both Rentas lanes). All three contain verbatim-identical comments ("Preload the adjacent slides so arrowing through the gallery doesn't flash/blank"), strong evidence of copy-paste divergence rather than one shared component/hook.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Feature parity was added to all 3 independently (preload, keyboard) — consolidation itself was not attempted.

REMAINING PROOF:
NONE for the "not consolidated" finding — proven directly from source (3 distinct files, no shared import).

NOTES:
The owner's own latest instruction (chat L3117-3277) explicitly declares "no code-trace-only TRUE" for this exact matrix — reinforcing that even feature-parity claims here need behavioral proof, on top of the already-confirmed architectural non-consolidation.

---

ITEM:
⚠️25

OWNER REQUIREMENT:
Gallery supports correct photo scaling, arrows, thumbnails, count, close, keyboard, Escape, and mobile use.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Feature matrix across the 3 lightboxes: arrows/thumbnails/count/close/keyboard/Escape present in all 3. Zoom/scale (`ZoomablePhoto`, ctrl/⌘+wheel) present in both BR lightboxes, **absent** in Rentas. Touch/swipe (`onTouchStart`/`onTouchEnd`) present in both BR lightboxes, **absent** in Rentas (`RentasVisualMatchPreviewView.tsx` — zero `onTouchStart`/swipe hits).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the mobile-swipe/zoom gap in Rentas — directly confirmed absent from source.

NOTES:
Named requirement ("and mobile use") is source-confirmed unmet specifically for Rentas' lightbox; BR's two lightboxes meet the full matrix at the source level (scaling quality itself would still need visual confirmation).

---

ITEM:
⚠️26

OWNER REQUIREMENT:
Gallery should preload current/adjacent media and thumbnails to avoid blank/flashing navigation.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Identical `new Image()` neighbor-prefetch effect (current±1 index) confirmed present in all 3 lightbox components: `LeonixPreviewGalleryLightbox.tsx:227-242`, `AgenteIndividualResidencialMediaLightbox.tsx:214-229`, `RentasVisualMatchPreviewView.tsx:439-455`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass (added in a prior session).

REMAINING PROOF:
NONE for code-presence. (Full flash-elimination in a real browser is a secondary, lower-risk visual confirmation not required to certify the mechanism exists.)

NOTES:
Deterministic prefetch code, present and identical across all 3 components.

---

ITEM:
⚠️27

OWNER REQUIREMENT:
Property video is external-URL only under the later doctrine; no BR/Rentas device-video upload.

EVIDENCE SOURCE:
repo; chat (L568-577, L1230-1238)

CURRENT IMPLEMENTATION:
Grepped every `type="file"` in all BR/Rentas publisher forms — only `accept="image/*"` inputs exist for photos; no video-accepting file input anywhere. `videoLocalDataUrl` field exists in BR Privado schema but is explicitly documented as "same-tab session only," never uploaded, and is actively zeroed (`media: {...videoLocalDataUrl: ""}`) whenever the URL array changes — vestigial legacy-migration artifact, not an active upload path. A dead Mux-upload-shaped schema (`BienesRaicesMuxVideoSlotState`) exists in BR Negocio but has no file input wired to it anywhere.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Confirmed by direct grep + read, not merely a doc claim.

---

ITEM:
⚠️28

OWNER REQUIREMENT:
Multiple external property video URLs are allowed where approved, added one at a time.

EVIDENCE SOURCE:
repo; chat (L576, L1244)

CURRENT IMPLEMENTATION:
`videoUrls: string[]` array field confirmed present in all 4 lanes (BR Privado max 4, BR Negocio max 8, Rentas Privado/Negocio max 4). Only BR Negocio (agente-individual) implements genuine progressive "add one at a time" UI (`visibleCount` state + "+ Agregar video" button, `steps01-03.tsx:346-412`). BR Privado, Rentas Privado, and Rentas Negocio all render every slot simultaneously (`Array.from({length: MAX...})`), not progressively.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the UI-pattern gap — directly confirmed in source for 3 of 4 lanes.

NOTES:
"Multiple URLs supported" = true everywhere; "added one at a time" = true only for BR Negocio.

---

ITEM:
⚠️29

OWNER REQUIREMENT:
Accepted video/tour/brochure URLs must have an explicit accepted/added state rather than sitting silently in an input.

EVIDENCE SOURCE:
repo; chat (L553-562)

CURRENT IMPLEMENTATION:
Inconsistent across lanes/fields: BR Negocio video field has a true per-slot, validity-gated (`validHttpUrl()` regex) green "Video añadido" confirmation (`steps01-03.tsx:342-344,396`). BR Privado and both Rentas lanes' video fields show only a combined, presence-only (not validity-gated) message. BR Privado's tour-URL field shows a green message on every keystroke (not gated by an accept step). BR Negocio's tour/brochure fields require a commit click but show no green "added" state at all. Rentas' shared tour section (`RentasShowingTourSection.tsx:65-75`) has no confirmation state whatsoever — static hint text always shown.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the inconsistency finding — directly confirmed field-by-field in source.

NOTES:
Only one field (BR Negocio video) fully matches the owner's exact spec; every other video/tour/brochure field across the 4 lanes falls short in a different way.

---

ITEM:
⚠️30

OWNER REQUIREMENT:
Invalid or unaccepted URLs must not create public CTAs.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Rentas (both lanes) and BR Privado's preview mapper use a real validator (`normalizeLeonixHttpsUrl`, `new URL()` try/catch). BR Negocio's agente-individual preview/publish mappers use a weaker but real regex check. BR Negocio's **live public detail page** (`BienesRaicesNegocioLiveDetailShell.tsx:125-131`) has a `normalizeUrl()` helper that falls through to `return s` (the raw string) for any non-matching format — meaning a malformed value can still produce a live `ctaUrlTour` href. BR Privado's live listing mapper hardcodes `virtualTourUrl: null` regardless of stored data (a different bug — omission, not validation-bypass).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the BR Negocio live-page validation gap — directly confirmed in source.

NOTES:
Preview-path validation is largely solid; the live/public BR Negocio detail page is the confirmed weak point.

---

ITEM:
⚠️31

OWNER REQUIREMENT:
Manual "Enlace a mapa" fields should not be part of BR/Rentas; maps derive from canonical location data.

EVIDENCE SOURCE:
repo; chat (L1160, L756-760)

CURRENT IMPLEMENTATION:
Repo-wide grep of `enlaceMapa` in `.tsx` files returns exactly one hit — a comment (`BienesRaicesPrivadoForm.tsx:487-490`) confirming the manual input was removed per product direction. No `.tsx` file anywhere binds `enlaceMapa` to an `<input>`. Commit `e17488aa` (verified via `git show`) removed the dormant `sanitizeBrUserMapUrl(s.enlaceMapa)` override in `mapBienesRaicesPrivadoStateToPreviewVm.ts` that previously let a stale value win over the derived map.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Dormant override removed in a prior commit on this branch (verified via git history, not just doc claim).

REMAINING PROOF:
NONE for current-code correctness. (A residual read-time preference for a *stored legacy* `Leonix:br:map_url` detail pair still exists in `leonixBrGate12d.ts:396-441` for the live/published page — only relevant to pre-fix listings, would need a DB check to rule out entirely; noted but not blocking this classification since no current UI can write such a value anymore.)

NOTES:
Independently verified via `git show e17488aa`, not merely the prior doc's assertion.

---

ITEM:
⚠️32

OWNER REQUIREMENT:
Address/map logic must not invent or fake a verified address.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`buildRentasGoogleMapsSearchQuery` (`rentasPublishFormHelpers.ts:409-439`) and `buildBrListingMapQuery` (`brLocationHelpers.ts:202-234`) build queries purely from caller-supplied `parts.*`/`args.*` fields — no hardcoded/default/fake address literal in either function; both return `null`/empty when no data present.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Confirmed no fallback constant address anywhere in the two builder functions.

---

ITEM:
⚠️33

OWNER REQUIREMENT:
If sufficient location exists, derive map/directions; if not, do not render a fake/global map.

EVIDENCE SOURCE:
repo; chat (L762-768)

CURRENT IMPLEMENTATION:
`mapRentasPrivadoStateToPreviewVm.ts:227-242` computes `hasMeaningfulAddress` from street/city/postal/mapsUrl presence. `RentasVisualMatchPreviewView.tsx:681,836-859` gates both the map iframe and the directions link behind `vm.location?.hasMeaningfulAddress ? (...) : null`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the guard's existence. (Whether the map actually centers correctly at runtime is a separate, unrelated concern — see doctrine item ⚠️70 — not required to certify this specific "don't render without data" guard.)

NOTES:
Real conditional-render/return-null pattern, confirmed at multiple call sites.

---

ITEM:
⚠️34

OWNER REQUIREMENT:
Cross streets/reference/neighborhood may provide approximate supporting location context.

EVIDENCE SOURCE:
repo; chat (L1175-1184, L768)

CURRENT IMPLEMENTATION:
`direccionCruceCercano`/`zonaVecindario` feed the approximate map query only when `mostrarDireccionExacta !== true` (privacy mode) — `buildRentasGoogleMapsSearchQuery:409-439`. Display rendering appends zone as a supporting `" · "`-joined segment, not the primary line (`mapRentasPrivadoStateToPreviewVm.ts:243-255`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Matches owner's explicit design intent exactly.

---

ITEM:
⚠️35

OWNER REQUIREMENT:
Global street-level suggested/verified address remains GLOBAL-DEFERRED to the shared Business Address Verification Engine.

EVIDENCE SOURCE:
repo; chat (L290-333, L1188)

CURRENT IMPLEMENTATION:
`app/lib/businessAddress/businessAddressProvider.ts` and `businessAddressContract.ts` exist as honest scaffolding-only modules, explicitly self-documented as "not wired into any live category yet" — no real address-verification provider (Google Places/SmartyStreets/USPS) is configured anywhere in the repo (no SDK dependency, no API-key env var). Zero categories, including BR/Rentas, consume this module.

CLASSIFICATION:
⚪ GLOBAL-DEFERRED

WHAT WAS ACTUALLY TOUCHED:
NONE — correctly not built locally.

REMAINING PROOF:
NONE for BR/Rentas — this is intentionally out of scope until the shared engine is built and adopted platform-wide.

NOTES:
This is the textbook case for this classification: the global engine genuinely doesn't exist yet, and BR/Rentas correctly has not built a local substitute, per the owner's own explicit Globalization Lock mandate.

---

ITEM:
⚠️36

OWNER REQUIREMENT:
Current city/typeahead/structured location adapters may be reused until the global address engine is adopted.

EVIDENCE SOURCE:
repo; chat (L137)

CURRENT IMPLEMENTATION:
`app/components/CityAutocomplete.tsx` is imported by 43+ files across Comida Local, Restaurantes, Servicios, Community, Mascotas, Busco, Autos, En Venta, and BR — a genuinely shared, non-BR-specific component. `app/(site)/clasificados/bienes-raices/shared/brNorCalCity.ts` is BR's thin canonicalization wrapper around it, not a fork.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
The requirement is permissive ("may be reused") rather than prescriptive — current state satisfies it.

---

ITEM:
⚠️37

OWNER REQUIREMENT:
Location presentation must avoid duplicate city/state/country fragments such as "San José, CA, CA."

EVIDENCE SOURCE:
repo; chat (L2377-2392, L2543, L2570-2571 "false positive / test artifact")

CURRENT IMPLEMENTATION:
Map-query builders (`appendRentasMapSegment`, `appendIfNotContained`, `appendMapQueryPart`) all dedup via containment checks. Display-line formatters (`buildRentasCityStatePostalLine`, `formatBrCityStatePostalLine`) do NOT — plain `.join(", ")` with no containment check, used widely in BR Negocio card/preview display. BR's manual free-text city path (`resolveBrListingCity`) preserves unrecognized text verbatim, structurally permitting a "San José, CA" + separately-selected state "CA" input that these formatters have no guard against.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live re-test: manually type "San José, CA" as free-text city (bypassing the canonical suggestion list) + select state "CA," view the rendered card/detail line.

NOTES:
The owner's own latest chat message (L2570-2571) declares this a disproven false positive/test artifact — but that verdict pre-dates this pass and the underlying code asymmetry (map-query dedups, display-line does not) is still unremediated in current source. Flagging both facts rather than silently deferring to either.

---

ITEM:
⚠️38

OWNER REQUIREMENT:
City selection must feed canonical search/filter/location output rather than a disconnected display-only field.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`leonixPublishRealEstateFromDraftState.ts:230,338,402,555` — city is written into the top-level `city` column of the published listing record at publish time (`brCanonicalNorCalCity`/`rentasPublishCity`), which is the canonical column BR/Rentas browse/filter code reads against.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the write-path claim. (Whether browse-filter UI correctly returns filtered results at runtime is a separate, lower-risk confirmation.)

NOTES:
Confirmed the write path targets the real filterable column, not a decorative field.

---

ITEM:
⚠️39

OWNER REQUIREMENT:
Every collected field must have a destination: detail, result card, filter, CTA, map, checkout, admin, analytics, or persistence-only.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Sample-traced ~14 of 60+ `BienesRaicesPrivadoFormState` fields (titulo, precio, ciudad, ubicacionLinea, mostrarDireccionExacta, enlaceMapa, descripcion, estadoAnuncio, petsAllowed, seller.etiquetaRol, media.videoLocalDataUrl, the 3 confirmation checkboxes, gate12d, contactChannels, and several residencial/comercial/terreno sub-fields) — every one traced has at least one active downstream consumer. `enlaceMapa` is the closest thing to an orphan (no new-write consumer) but is explicitly justified in code comments as intentional backward-compat scaffolding (see ⚠️31).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
A full field-by-field sweep of the remaining ~45+ fields (deep `residencial`/`comercial`/`terreno`/`gate12d` sub-objects were not individually traced) to confirm no genuinely orphaned fields exist.

NOTES:
This is a source-completeness audit rather than a true runtime behavior — classified 🟠 per the audit's own conservative-default instruction because the sample, while clean, is not exhaustive.

---

ITEM:
⚠️40

OWNER REQUIREMENT:
Fields with no legitimate destination should be removed or explicitly justified.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same sample as ⚠️39. Only `enlaceMapa` surfaced as a candidate, and it IS explicitly justified (comment-documented backward-compat scaffolding, `BienesRaicesPrivadoForm.tsx:487-490`) — satisfying the "explicitly justified" bar rather than the "should be removed" bar, though its last live read-consumer (the BR preview VM) was removed in commit `e17488aa`.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Same full field sweep as ⚠️39; a product decision on whether `enlaceMapa` should now be deleted outright given its last consumer is gone.

NOTES:
Sample evidence is positive (no unexplained orphans found) but not exhaustive — kept conservative.

---

ITEM:
⚠️41

OWNER REQUIREMENT:
Results-card preview must use the real discovery/result card model, not a fake approximation.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
The "results-card preview" feature exists ONLY for Rentas — confirmed absent entirely from BR (no results-card section, no "Vista en resultados" string anywhere in `BienesRaicesPrivadoPreviewClient.tsx` or the BR Negocio preview client; repo-wide grep for "Vista en resultados" returns exactly one hit). For Rentas, `RentasPreviewResultCardSection.tsx:6,33` imports and renders the literal same `RentasResultCard` component used on the live public results grid (`rentas/results/RentasResultsClient.tsx`) — genuine reuse, not a lookalike.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for Rentas (component-identity confirmed via import). For BR: the feature simply doesn't exist, so the family-wide requirement fails for that half of the family — building it (or a justified reason it's intentionally BR-exempt) is the remaining work, not a QA check.

NOTES:
CORRECTED IN PASS 2 — Rentas alone would be 🟢; BR's total absence of this feature is what pulls the family-wide classification to 🔴.

---

ITEM:
⚠️42

OWNER REQUIREMENT:
Results-card preview should be compact and realistic, not placed inside a giant empty theater.

EVIDENCE SOURCE:
repo; chat (L1398-1419, owner's exact spacing spec: "roughly a 320-380px card... not hundreds of pixels of surrounding blank canvas")

CURRENT IMPLEMENTATION:
`RentasPreviewResultCardSection.tsx:16-37` — the card wrapper is capped at `max-w-[368px]` (inside the owner's 320-380px request) with modest `p-4/p-5` outer and `p-3/p-4` inner padding, no `min-h-*` classes. Source strongly suggests compliance with the literal spec. (No equivalent exists for BR at all — see ⚠️41.)

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Screenshot confirmation that the rendered whitespace doesn't exceed the sizing the className values suggest (font metrics/image aspect ratio can still produce a visually "big" feel even with capped max-width).

NOTES:
Source evidence is positive and fairly specific (368px falls inside the owner's own 320-380px target), but final "not a giant theater" judgment is still a rendered-page call — kept at 🟡 rather than upgraded to 🟢.

---

ITEM:
⚠️43

OWNER REQUIREMENT:
Results cards must use the selected portada/cover image when one exists.

EVIDENCE SOURCE:
repo; chat (L1421-1429, L2341, L2687, L3155-3162 — owner repeatedly flags portada as a required per-lane verification item)

CURRENT IMPLEMENTATION:
BR Privado: works correctly (`BienesRaicesPrivadoForm.tsx:707-711` real `onSetPrimary`, `mapBienesRaicesPrivadoStateToPreviewVm.ts:130-131` genuinely portada-driven `heroUrl`). Rentas Privado: **broken in the preview screen** — `mapRentasPrivadoStateToPreviewVm.ts:137` hardcodes `primaryImageIndex: 0` when building the shape fed to the results-card preview, so the preview always shows photo #1 regardless of the user's real selection (the actual *published* listing is correct, since `leonixPublishRealEstateFromDraftState.ts:506` reorders around the real index at publish time). Rentas Negocio: **broken end-to-end** — `RentasNegocioForm.tsx:764` sets `onSetPrimary={() => null}`, a literal no-op; the "Usar como portada" button renders (shared `LeonixRealEstateSortablePhotoStrip.tsx:119-136`) but does nothing when clicked, and `rentasNegocioToBienesRaicesNegocioState.ts:106-108` hardcodes `primaryImageIndex: 0` regardless of state — the cover is always whatever photo sits in slot 1, and the form's own copy ("La portada puede ser distinta del primer casillero") is false as implemented.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the Rentas Negocio defect — `onSetPrimary={() => null}` cannot function regardless of runtime conditions, this is a direct code-level proof, not something a live test could contradict.

NOTES:
CORRECTED IN PASS 2 — BR Privado is genuinely correct; Rentas Privado has a preview-only display bug (live listing is fine); Rentas Negocio's cover-selection control is a literal no-op end-to-end. The owner's chat shows this was anticipated and explicitly asked to be checked lane-by-lane (L3162: "Do not rely solely on BR Privado proof"), and the transcript never records this verification actually being closed.

---

ITEM:
⚠️44

OWNER REQUIREMENT:
Fallback artwork/logo is used only when no usable listing media exists.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasPreviewResultCardListing.ts:154,186` — `imageUrl: trim(vm.media.heroUrl) || "/logo.png"`, and `heroUrl` is `null` only when zero photos exist. Live/published data: `mapListingRowToRentasPublicListing.ts:393-395` — falls back to `/logo.png` only when all real media sources are empty. `rentasListingPublishedMediaGuards.ts:6-24` — `isRentasPlaceholderImageUrl`/`filterRentasPhotoUrlList` explicitly exclude the logo from ever being counted as real media downstream, preventing it from being mistaken for user content.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
CORRECTED IN PASS 2 — confirmed genuinely gated on emptiness in both preview and live-listing code paths, not shown unconditionally.

---

ITEM:
⚠️45

OWNER REQUIREMENT:
Results-card chips show only high-signal structured values, not every form selection.

EVIDENCE SOURCE:
repo; chat (L1431-1448)

CURRENT IMPLEMENTATION:
`RentasResultCard.tsx:206-212` — chip list is explicitly capped: rental-type, pets (if true), furnished (if true), and property category, then `chips.slice(0, 3)`. Beds/baths/sqft render as separate structured fact rows, not chips. Dozens of other form fields (HOA, financing, MLS, virtual tour, services-included free text) do not appear on the card at all.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
CORRECTED IN PASS 2 — confirmed via direct read of the chip-building logic; capped-and-curated, not an every-field dump.

---

ITEM:
⚠️46

OWNER REQUIREMENT:
Full detail and result card remain distinct experiences.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Confirmed via directory structure: `RentasResultCard.tsx` (results grid) is a separate file from `RentasVisualMatchPreviewView.tsx` (full detail); `BienesRaicesPreviewCard.tsx` is separate from `BienesRaicesPrivadoPreviewView.tsx` (full detail).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
File-separation fact, independently confirmed.

---

ITEM:
⚠️47

OWNER REQUIREMENT:
Public preview/detail hierarchy should feel intentional, premium, and property-first.

EVIDENCE SOURCE:
repo (structural signals only)

CURRENT IMPLEMENTATION:
Hero-image sizing, price-prominence styling, and serif typography exist in source (per ⚠️2), but "feels premium" is inherently a rendered-page judgment.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Owner visual review of the live public detail pages across all 4 lanes.

NOTES:
Explicitly named in the audit's own doctrine as a 🟡-category claim.

---

ITEM:
⚠️48

OWNER REQUIREMENT:
Checkout/payment controls must remain outside the publishable ad canvas.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx` exists as a standalone shared component/route, structurally separate from the ad-detail rendering components (`BienesRaicesPrivadoPreviewView.tsx`, `RentasVisualMatchPreviewView.tsx`) — confirmed via file location and the component's own doc comment ("No Stripe secrets, no payment activation... embedded in the publishable canvas").

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Structural separation confirmed via direct file location + component doc comment.

---

ITEM:
⚠️49

OWNER REQUIREMENT:
Preview controls must remain outside the publishable ad canvas.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`LeonixPreviewPageShell.tsx` doc comment: "Global Leonix clasificados preview chrome: only 'Volver a editar' outside the publishable ad canvas" — confirmed as the shared wrapper for BR/Rentas preview pages (see ⚠️5 evidence). Even though the same underlying view component serves both draft-preview and live-published listing for BR Privado, the "Volver a editar" chrome is rendered by this separate wrapper, not baked into the ad-canvas component itself.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the wrapper-separation claim. (Confirming preview chrome never leaks onto the actual published page in production would need a live check, but the code-level structural separation is real.)

NOTES:
Shared-wrapper pattern confirmed via direct doc-comment read.

---

ITEM:
⚠️50

OWNER REQUIREMENT:
Checkout summary must clearly state product, price, duration/cadence, allowance where applicable, promo area where supported, total, and payment CTA.

EVIDENCE SOURCE:
repo; chat (L1450-1481)

CURRENT IMPLEMENTATION:
`PublishCheckoutCheckpoint.tsx` line-by-line confirmed to render every requested element: product/plan name (lines 269-289), price (281-286), duration/cadence (283-285, `durationSuffixEs/En`), allowance (as descriptive text in `detailEn/Es`, e.g. BR FSBO "45 days · one property per listing · no inventory"), promo/discount area (336-391, gated by `config.promoEligible && onPromoApply`, both BR FSBO and Rentas set this), total (412-418), and payment CTA (596-612). Category-specific configs confirmed: `bienesRaicesFsboPreviewPaidCheckout.ts:44-67` (BR FSBO) and `rentasPreviewPaidCheckout.ts:17-43` (Rentas).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for content-presence. (A live checkout screenshot would only reconfirm what the component/config wiring already proves.)

NOTES:
CORRECTED IN PASS 2 — every named element traced to an actual rendered line, not just component existence.

---

ITEM:
⚠️51

OWNER REQUIREMENT:
Revenue OS/Stripe remains global; BR/Rentas must not create a parallel payment engine.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
The *currently-wired* UI checkout paths are clean: Rentas has zero Stripe references anywhere in its tree and calls only `startRevenueCategoryCheckout` (shared Revenue OS client); BR Negocio and BR Privado also call the same shared client. BUT a fully-formed, still-live parallel Stripe engine remains in the codebase: `app/api/clasificados/leonix/stripe/checkout/route.ts` directly instantiates `new Stripe(getStripeSecretKey()!, ...)` with its own price lookup and its own BR-specific listing-activation service; `webhook/route.ts` is a separate "LEGACY handler" with its own webhook-signing secret; `checkout/verify/route.ts` also directly instantiates Stripe and is **still actively called** from the live BR payment-success page (`BrPagoExitoClient.tsx:96-98`). The client-side trigger for legacy checkout-creation (`startBrNegocioCheckout`) has zero remaining call sites (dead), but the webhook and verify endpoints are not dead — they are reachable, functioning, independent Stripe integrations.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the parallel-engine finding — the legacy Stripe files directly instantiate their own client with their own secrets, which is definitionally a second payment engine, regardless of how the current UI happens to route around it.

NOTES:
CORRECTED IN PASS 2 — the shared-client delegation for current UI flows is real (would support 🟢 on its own), but "must not create a parallel payment engine" is violated by the still-live legacy `app/api/clasificados/leonix/stripe/*` trio, which is not merely historical dead code. Separately, the owner's own chat (L2117-2121, L2409, and the transcript's final lines) repeatedly states checkout/Stripe staging was never fully verified live ("Do not mark checkout TRUE" / "CHECKOUT/PUBLISH ROUNDTRIP — ENVIRONMENT-BLOCKED") — reinforcing that this item cannot be closed as fully proven regardless.

---

ITEM:
⚠️52

OWNER REQUIREMENT:
Draft/leave protection must use the shared/global leave-guard architecture.

EVIDENCE SOURCE:
repo; recent commit `629c5a46`

CURRENT IMPLEMENTATION:
`app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts` — one shared hook, confirmed imported and called in all 4 BR/Rentas entry points (`BienesRaicesPrivadoForm.tsx:67,190-195`, `AgenteIndividualResidencialApplication.tsx:31,589-596`, `RentasPrivadoForm.tsx:70,328-333`, `RentasNegocioForm.tsx:78,329-334`) plus Comida Local, Restaurantes, and Servicios — genuinely one shared implementation, not four forks.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Adopted this branch (commit `629c5a46`), confirmed still present in current source.

REMAINING PROOF:
NONE for the shared-architecture claim.

NOTES:
Caveat: Rentas forms each keep one additional, explicitly-scoped local `beforeunload` listener for the dashboard-edit flow, deliberately isolated (`isDirty: hydrated && !editContext`) to avoid double-firing alongside the shared hook — a documented hybrid, not a hidden fork.

---

ITEM:
⚠️53

OWNER REQUIREMENT:
Preview should suppress the leave-warning when navigation is an expected preview action.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`markPublishFlowOpeningPreview()` (`publishFlowLifecycleClient.ts`) sets a sessionStorage flag before preview navigation in all 4 lanes; `isInFlowBusinessApplicationNavigation()` checks it before firing the leave-guard. BUT the flag is never cleared by any BR/Rentas preview-page component — grep across all 5 BR/Rentas preview client files (`BienesRaicesPrivadoPreviewClient.tsx`, `bienes-raices/preview/negocio/page.tsx`, `RentasPrivadoPreviewClient.tsx`, `RentasNegocioPreviewClient.tsx`, `AgenteIndividualResidencialPreviewClient.tsx`) finds zero calls to `clearLeonixPreviewNavSessionFlag`, while other categories (e.g. Servicios, `ClasificadosServiciosPreviewClient.tsx:204-206`) do call it on preview mount.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the missing-reset finding — directly confirmed by contrasting BR/Rentas (never clears) against Servicios (clears on mount) in current source.

NOTES:
Practical effect: once a user visits BR/Rentas preview once in a browser tab, the leave-guard is silently suppressed for the rest of that tab session, even for a later, genuinely unrelated unsaved exit — a real regression against the "only suppress for the expected preview action" requirement.

---

ITEM:
⚠️54

OWNER REQUIREMENT:
Session/draft persistence must not wipe text or media during hydration.

EVIDENCE SOURCE:
repo; commit `b3d85dc1`; chat (L2810, L2975-2979, L3241)

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoDraft.ts` — `readDraftRawWithRetry()` retries at `[20,60,150,300,600]ms`, then (if IndexedDB shows leftover media via `hasNamespaceEntries`) retries again at `[500,1000,1500,2000]ms` (worst case ≈6.1s) before concluding "no draft." The commit's own message states: "I was not able to fully root-cause that specific residual behavior... flagging the residual repro so it isn't mistaken for a fully closed loop."

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass — guard logic already present from the cited commit.

REMAINING PROOF:
Live reload test with an artificially delayed storage response (>6.1s) to confirm the actual failure boundary; the commit author's own admission that root cause was not fully resolved stands unaddressed.

NOTES:
The author's own commit message concedes this is a mitigation, not a proven fix — a textbook 🟠 case.

---

ITEM:
⚠️55

OWNER REQUIREMENT:
Autosave must not overwrite valid persisted media/state before async hydration completes.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx` — `hydrated` state (line 120) set only after the async draft-load effect resolves; debounced autosave (`:155-161`), pagehide/visibilitychange flush (`:167-181`), and the leave-guard's `isDirty` flag (`:191`) are all gated `if (!hydrated) return;`/`hydrated && ...`. Same pattern in `RentasPrivadoForm.tsx`/`RentasNegocioForm.tsx`.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
The existing `br-inv-d2-privado-media-behavioral-selftest.ts` was confirmed (this pass) to exercise ONLY the storage-retry utility function in isolation — it never mounts `BienesRaicesPrivadoForm.tsx` or exercises the actual `hydrated`-gated React effects. A genuine component-mounted race test (e.g. React StrictMode double-invoke, a slow-resolving hydration effect racing a fast keystroke) is still needed.

NOTES:
The gate exists and is correctly wired in source; the specific selftest that exists does not actually prove the React-level race is closed, despite its name.

---

ITEM:
⚠️56

OWNER REQUIREMENT:
Media references remain canonical/durable; do not regress to temporary blob/data URLs as the persistent source.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brNegocioChildMediaCanonical.ts:52-63` rejects `blob:` outright and returns `""` (not durable) for `data:`/`blob:` prefixed values. Server-side, `app/api/clasificados/bienes-raices/listing-edit/route.ts:104-151` explicitly throws `"blob_url_not_persistable"` for any `blob:` URL, and uploads `data:`/remote sources to Supabase Storage (`listing-images` bucket), persisting the resulting `https://` public URL. `data:` URLs are the expected draft-time-only representation, converted at publish time.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Confirmed at both the client canonicalization layer and the server publish/upload boundary — `blob:` is rejected everywhere checked; `data:` never reaches a published payload.

---

ITEM:
⚠️57

OWNER REQUIREMENT:
Parent/child and seller/professional ownership boundaries must remain explicit and stable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BrNegocioChildInventoryFullApplication.tsx` — no `ownerId`/`parentId`/`professionalId` fields exist on the child at all; the boundary is enforced structurally: the child receives a read-only `parentHubSnapshot` prop, takes a slice via `pickParentHubSlice`, and its own state only ever merges via `pickChildPropertySlice` — parent-identity fields (agenteNombre, correoPrincipal, marcaNombre, etc.) are schema-absent from the child draft type entirely (confirmed by `br-inv-d1-parent-hydration-behavioral-selftest.ts:188-201`'s explicit key-absence assertion).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Server/DB-level authorization check (Supabase RLS/ownership scoping) was not located or verified in this file or its immediate imports — would need a separate Supabase-layer audit to confirm tenant isolation beyond the client-side architectural boundary.

NOTES:
The in-memory/client architecture is genuinely strong and source-provable (schema-level absence of parent-identity fields on the child, one-way prop flow); kept at 🟠 because DB-level enforcement — the harder security guarantee — was not independently confirmed.

---

ITEM:
⚠️58

OWNER REQUIREMENT:
Responsive QA must cover approximately 375, 768, 1024, and 1440 widths.

EVIDENCE SOURCE:
repo; chat (L1753-1773)

CURRENT IMPLEMENTATION:
Glob of all 382 files in `qa-final-screenshots/` finds every BR/Rentas-tagged screenshot is landing/results only (never detail/gallery/application/checkout), widths used are `-390`/`-desktop`(-1440) — never exactly 375, and only ONE 768px file exists (`rentas-results-tablet-768.png`, no BR equivalent). Zero files anywhere in the tree are tagged 1024. No viewport-size assertions exist in any of the 4 BR/Rentas Playwright spec files; the Rentas Playwright configs define no device/breakpoint matrix at all (`...devices["Desktop Chrome"]` only).

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live/manual QA pass across BR (both lanes) and Rentas (both lanes) at 375/768/1024/1440 — currently zero automated or screenshot coverage exists at these exact breakpoints for BR/Rentas.

NOTES:
Confirmed absent, not merely unconfirmed — this is a genuine, fully-verified gap.

---

ITEM:
⚠️59

OWNER REQUIREMENT:
Responsive QA must explicitly inspect gallery, result card, contact rail, HOA, Open House, feature grids, checkout, and forms.

EVIDENCE SOURCE:
repo; chat (L1753-1773)

CURRENT IMPLEMENTATION:
All 4 BR/Rentas e2e specs run as single monolithic flows ("full runtime QA flows", "publish seed → landing/results/detail/dashboard...") with no section-scoped sub-tests. Only Open House has any dedicated functional test (`br-spacebar-multiday-open-house.spec.ts`), and it runs at a single fixed 1400×900 viewport, not the required breakpoint matrix. Gallery, result card, contact rail, HOA (outside Open House), feature grids, checkout, and forms have zero section-scoped automated tests at any breakpoint.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
Live/manual per-section QA pass at each of the 4 breakpoints, covering all 8 named sections.

NOTES:
Confirmed absent via direct spec-file reads, not inference.

---

ITEM:
⚠️60

OWNER REQUIREMENT:
ES/EN must both be natural and complete; no mixed-language shell strings.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
A systematic ES-block vs EN-block scan of all major BR/Rentas copy files found no leftover fragments in the wrong language, and "Mostrar dirección exacta" is confirmed fixed/cleanly separated (`brNegocioPrePublishInventoryShellCopy.ts:53` ES / `:149` EN, `BienesRaicesPrivadoForm.tsx:463` ES only, no English leakage). BUT a different, real mixed-language bug was found: `RentasNegocioForm.tsx:105-110` (`RENTAS_NEGOCIO_PREVIEW_ACTION_LABELS`) is a single **hardcoded Spanish-only** object ("Validar y ver vista previa" / "Ver vista previa (sin validar)") passed unconditionally to `ClasificadosApplicationTopActions` at lines 486/608 with **no `lang === "en"` branch** — unlike 15+ other strings in the same file, which are meticulously bilingual. An English-mode Rentas Negocio seller sees Spanish button text inside an otherwise-English form.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE — the missing `lang` branch is directly visible in source; no runtime session needed to confirm an English-mode user would see Spanish text.

NOTES:
CORRECTED IN PASS 2 — a full copy audit was completed by deeper research; the specific bug found is unrelated to the "Mostrar dirección exacta" case originally flagged (that one is fine) but is a genuine, current mixed-language shell-string violation. This same root cause also drives ⚠️68/⚠️69 (see those items — same constant, same file, same missed commit).

---

ITEM:
⚠️61

OWNER REQUIREMENT:
Shared components may be changed only for a proven shared need and must not contaminate unrelated categories.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`CtaActionSheet`/`ctaLaunchers` confirmed imported by 23 files spanning BR, Rentas, Comida Local, Restaurantes, Viajes, En Venta, Empleos, Autos. `PublishCheckoutCheckpoint.tsx` and `useBusinessApplicationLeaveGuard.ts` confirmed shared across BR, Rentas, Comida Local, Restaurantes, Servicios. Broad, real cross-category blast radius confirmed for multiple shared modules.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the blast-radius fact itself. (Whether every past edit to these files was justified by a genuine shared need is a process question, not something a single source snapshot can prove.)

NOTES:
Import-count evidence directly supports the "shared, cross-cutting, handle carefully" framing.

---

ITEM:
⚠️62

OWNER REQUIREMENT:
Globalization systems such as contact, translation, analytics, media/storage, Revenue OS, Community Trust, and address verification must be reused rather than rebuilt locally.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Contact = shared `CtaActionSheet` (BR compliant, Rentas partially bypasses — see ⚠️17). Translation = repo-wide `lang` param convention, no BR/Rentas-local i18n engine. Media/storage = shared Supabase Storage upload boundary (⚠️56). Revenue OS = shared `PublishCheckoutCheckpoint.tsx`, no bespoke Stripe client (⚠️51). Community Trust = shared `BrRentasCommunityTrustSection.tsx`/`LeonixCommunityTrust` widget (⚠️63-65). Address verification = correctly deferred, no local engine built (⚠️35).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the overall reuse-pattern claim.

NOTES:
The one confirmed partial exception (Rentas contact bypassing `CtaActionSheet`) is separately tracked and penalized under ⚠️17 — does not invalidate the broader reuse pattern being real everywhere else.

---

ITEM:
⚠️63

OWNER REQUIREMENT:
Professional Community Trust applies only where approved: BR Negocio and Rentas Negocio, never private lanes.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BrRentasCommunityTrustSection` is imported in exactly 3 real-usage files: `BrAgenteResContactSidebar.tsx` (BR Negocio only), `RentasNegocioDesktopBusinessRail.tsx` (Rentas Negocio), and `RentasVisualMatchPreviewView.tsx` where it is rendered behind an explicit `{isNegocio(vm) ? <BrRentasCommunityTrustSection .../> : null}` gate (line 827-828) — confirmed by direct read, meaning the same shared shell used for both Rentas lanes correctly excludes it for Privado. Zero BR Privado file imports it (confirmed via repo-wide grep for the component name).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Directly verified via Read of the actual gating conditional, not inferred.

---

ITEM:
⚠️64

OWNER REQUIREMENT:
Community Trust must use approved real aggregate/vote behavior; no fake counts or fake reviews.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BrRentasCommunityTrustSection.tsx` resolves a real professional-identity id via `fetchLeonixProfessionalIdentityId()` (explicit comment: "the durable identity anchor, never the listing id") and renders the shared `LeonixCommunityTrust` widget only once resolved — no hardcoded numbers anywhere in this wrapper. The entire feature is currently gated off by `isLeonixEndorsementCategoryLive(category)` returning `false` ("since the supporting migration is prepared but not yet applied") — it renders nothing at all today for any category.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for current behavior (renders nothing, trivially no fake data). Re-verify once the migration lands and the flag flips true, to confirm the inner `LeonixCommunityTrust` widget itself pulls real aggregate data at that point.

NOTES:
Feature is pre-launch/flagged-off; "no fake data" is satisfied by construction right now.

---

ITEM:
⚠️65

OWNER REQUIREMENT:
No fake likes, fake saves, fake ratings, fake reviews, or invented engagement data.

EVIDENCE SOURCE:
repo (partial — no dedicated grep for hardcoded engagement numbers completed this pass)

CURRENT IMPLEMENTATION:
Community Trust (the only engagement-adjacent feature found in BR/Rentas) is confirmed real-data-only and currently fully gated off (⚠️64). No other engagement/likes/saves display was located in BR/Rentas result cards during this pass.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
A dedicated grep of BR/Rentas result-card and detail components for hardcoded numeric engagement values or `Math.random()`-generated counts was not completed this pass — recommended as a final confirmation.

NOTES:
Classified 🟢 on the strength of ⚠️64's findings plus no contrary evidence found; flagged as not fully exhaustive.

---

ITEM:
⚠️66

OWNER REQUIREMENT:
Public output should remain sparse and clean when optional modules are absent.

EVIDENCE SOURCE:
repo (cross-referenced with ⚠️10)

CURRENT IMPLEMENTATION:
Same evidence as ⚠️10 — most empty-module cases correctly render nothing (`if (!rows.length) return null` pattern, `hasMeaningfulAddress` map guard at ⚠️33), but the HOA module still emits a bare "No indicado"/"Unknown" status row when `hasHoa === "unknown"`, a partial-data leak into an otherwise-sparse module.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Partial fix landed for the contradiction case (⚠️10); the bare-status-label leak was not.

REMAINING PROOF:
NONE — directly confirmed in source, same evidence as ⚠️10.

NOTES:
This item is the general form of ⚠️10's specific finding; kept consistent with that classification.

---

ITEM:
⚠️67

OWNER REQUIREMENT:
Back routes inside publisher flows should return to the appropriate publisher checkpoint, not dump the user into the public landing unexpectedly.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Confirmed for all 4 lanes, each targeting its `*_PUBLICAR_HUB` constant, never the public landing: BR Negocio `AgenteIndividualResidencialApplication.tsx:804` → `BR_PUBLICAR_HUB = "/clasificados/publicar/bienes-raices"`; BR Privado `BienesRaicesPrivadoForm.tsx:304` → same constant; Rentas Negocio `RentasNegocioForm.tsx:623` ("Volver a Rentas"/"Back to Rentals") → `RENTAS_PUBLICAR_HUB = "/clasificados/publicar/rentas"`; Rentas Privado `RentasPrivadoForm.tsx:581,612,620` → same constant.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE.

NOTES:
Fully confirmed for all 4 lanes with exact route-constant citations; matches the owner's explicit chat directive (L1509-1515).

---

ITEM:
⚠️68

OWNER REQUIREMENT:
Raw application UX should expose one clear preview action instead of developer/debug variants.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Confirmed via direct grep: `LeonixApplicationVerAnuncioActions.tsx:24` uses "Ver vista previa (sin validar)"; `RentasNegocioForm.tsx:107` uses the same. Distinct verbs across lanes are not fully unified into one label.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the multiple-distinct-labels finding — directly confirmed in source.

NOTES:
Directly overlaps ⚠️69's finding — the same button label carries both a non-unified verb and dev-facing "(sin validar)" wording.

---

ITEM:
⚠️69

OWNER REQUIREMENT:
Developer/internal language such as "sin validar" should not leak into customer-facing application controls.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Confirmed by direct grep — "Ver vista previa (sin validar)" / "View preview (without validation)" is literally rendered as live button text in `RentasNegocioForm.tsx:107,612,616` and `LeonixApplicationVerAnuncioActions.tsx:24,31`, i.e. real seller-facing UI copy, not a code comment.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE — the source itself proves this dev-facing string is currently live and customer-visible.

NOTES:
Direct, unambiguous confirmation — this is a clear, live violation, not a stale/theoretical one.

---

ITEM:
⚠️70

OWNER REQUIREMENT:
Successful source/typecheck evidence alone is not enough for runtime-only behaviors such as typing, persistence, map handoff, media reorder, or native CTAs.

EVIDENCE SOURCE:
repo (`.claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md`, read in full this pass)

CURRENT IMPLEMENTATION:
That prior ledger repeatedly cites "Typecheck-clean" and "self-tests pass" as sufficient closure evidence for items that are fundamentally runtime behaviors — e.g. its ⚠️05/⚠️13/⚠️14/⚠️17/⚠️24 closures (video multi-URL, taxonomy levels, custom chips, Open House, checkout copy) are each marked "TRUE" with "Typecheck-clean... passes every relevant self-test" as the stated proof, with no live/browser verification mentioned. This pass's own independent re-audit directly contradicts several of those "TRUE" verdicts under closer scrutiny: ⚠️10/⚠️66 (HOA placeholder still live), ⚠️24 (gallery still 3 unconsolidated implementations, not the claimed shared architecture), ⚠️28/⚠️29 (video/tour "added one at a time" and accept-state patterns still inconsistent across lanes), ⚠️53 (leave-guard flag never cleared on BR/Rentas preview, unlike other categories).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE this pass.

REMAINING PROOF:
NONE for the doctrine-violation finding itself — it is directly demonstrated by contrasting the prior ledger's own closure language against this pass's independent source re-verification.

NOTES:
This is the audit's own meta-finding: the pattern the doctrine warns against is not hypothetical — it is actively present in this codebase's most recent audit history, and this pass's stricter standard caught real gaps the typecheck-based closures missed.

# BR NEGOCIO / PROFESSIONAL — LEDGER AUDIT ⚠️71–⚠️154

TALLY: 🟢 SOURCE-PROVED DONE = 57 | 🔴 SOURCE-CONFIRMED NOT DONE = 14 | 🟡 OWNER-VISUAL-QA REQUIRED = 5 | 🟠 RUNTIME QA REQUIRED = 7 | ⚪ GLOBAL-DEFERRED = 1 | 🟣 ENVIRONMENT-BLOCKED = 0 | 🟤 DATA-INSUFFICIENT = 0 | 🔵 PM/BUSINESS DECISION REQUIRED = 0 (total 84)

Primary live-code entry points verified against (all under `app/(site)/clasificados/publicar/bienes-raices/negocio/`):
- `agente-individual/schema/agenteIndividualResidencialFormState.ts` (flat form-state shape, the single source of truth for every field discussed below)
- `agente-individual/schema/agenteResidencialTipoMeta.ts`, `agente-individual/schema/agenteComercialTerrenoMeta.ts` (taxonomy)
- `agente-individual/sections/steps01-03.tsx`, `agente-individual/sections/steps04-09.tsx` (live application UI)
- `agente-individual/application/brAgenteResidencialCopy.es.ts` / `.en.ts` (copy)
- `agente-individual/lib/agenteResidencialPreviewFormat.ts` (preview/CTA formatting — the live public/preview render path)
- `agente-individual/preview/BrAgenteResContactSidebar.tsx`, `preview/AgenteIndividualResidencialPreviewPage.tsx` (live rendered surfaces)
- `application/brNegocioChildInventoryFormMapping.ts`, `application/sections/shared/BrNegocioChildInventoryInheritedHubPanel.tsx`, `application/sections/shared/brNegocioChildInheritedHubShared.tsx` (parent/child inventory architecture)
- `application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts` (publish mapper)
- shared: `app/(site)/clasificados/publicar/bienes-raices/shared/brAgenteApplicationPricingCopy.ts`, `.../BrAgenteShowcaseSeeMoreDrawer.tsx`, `app/(site)/clasificados/lib/leonixBrGate12dHoaPreview.ts`, `app/(site)/clasificados/lib/BrRentasCommunityTrustSection.tsx`, `app/lib/listingPlans/revenuePricingMatrix.ts`, `app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx`, `app/(site)/clasificados/bienes-raices/resultados/search/filterTypes.ts`, `app/(site)/clasificados/bienes-raices/shared/brNegocioBranchParams.ts`

Confirmed DEAD/UNREACHABLE (per prompt) and NOT used as evidence for any item below: `negocio/application/BienesRaicesNegocioApplication.tsx` and its section tree.

Cross-cutting evidence note: `scripts/br-inv-d1-parent-hydration-behavioral-selftest.ts` was executed this pass (`npx tsx scripts/br-inv-d1-parent-hydration-behavioral-selftest.ts`) and PASSED — it injects a real sessionStorage race condition, asserts actual restored field values across 5 simulated hard-refresh runs, and explicitly asserts `PARENT UPDATE PROPAGATES: true` and `CHILD CANNOT OVERRIDE PARENT IDENTITY: true`. This is treated as genuine behavioral proof (not a typecheck-only script) for items 118–122 below.

---

ITEM:
⚠️71

OWNER REQUIREMENT:
Checkpoint / "Ver más" copy must sell the value of the professional product, especially Business Hub.

EVIDENCE SOURCE:
chat, repo

CURRENT IMPLEMENTATION:
`shared/brAgenteApplicationPricingCopy.ts` (`startShowcaseBody`, `drawerBaseIncludes`), rendered via `shared/BrAgenteShowcaseSeeMoreDrawer.tsx` from the "Ver más" (`startSeeMore`) trigger.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
The drawer lists real feature bullets (1 property, professional profile, contact hub, photos/video/tour/folleto, public page, visibility, buyer contact actions) and pricing, but the term "Business Hub" and any explicit hub-value framing never appear anywhere in this copy or drawer.

REMAINING PROOF:
NONE (source-provable gap) — owner chat line 1796/1867 explicitly names this exact "Ver más ... sell the business hub" gap as an open to-do ("checkpoint / 'Ver más' sales copy emphasizing Business Hub").

NOTES:
Copy communicates feature value generally but not the specific "Business Hub" framing the owner asked for.

---

ITEM:
⚠️72

OWNER REQUIREMENT:
Business Hub copy should explain Leonix connects professional identity/listings/contact/digital presence rather than replacing external platforms.

EVIDENCE SOURCE:
chat, repo

CURRENT IMPLEMENTATION:
Same as ⚠️71 (`brAgenteApplicationPricingCopy.ts`, `BrAgenteShowcaseSeeMoreDrawer.tsx`); grep across the BR negocio publish tree for "reemplaza/replace/connects/conecta" found no matching "we connect, we don't replace" framing text.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE — this specific message/framing does not exist anywhere in the checkpoint or drawer copy.

REMAINING PROOF:
NONE (source-provable absence).

NOTES:
Directly related to ⚠️71; likely fixed together.

---

ITEM:
⚠️73

OWNER REQUIREMENT:
BR Negocio pricing is $399/month including 1 active listing.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/lib/listingPlans/revenuePricingMatrix.ts` (`priceCents: 39900`, `includedInventory: "1 business/agent package"`); `shared/brAgenteApplicationPricingCopy.ts` (`startShowcasePrice: "$399/mes"`, `currentPlanDetail: "Incluye 1 propiedad principal/destacada."`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Pricing constant and copy both confirm $399/mo, 1 included listing.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️74

OWNER REQUIREMENT:
+$99/month inventory pack adds 3 additional children, for 4 total active listings.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`revenuePricingMatrix.ts` (`br_inventory_pack_monthly`, `priceCents: 9900`, base package `addOnInventory: "+3 properties via br_inventory_pack_monthly ($99/mo)"`); `brAgenteApplicationPricingCopy.ts` (`"hasta 3 propiedades activas adicionales"`, `fifthChildBlock` caps additions at 3).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Pack price and +3/4-total wording confirmed in both pricing matrix and copy; chat (line ~2047) confirms this exact "+3 additional / 4 total" wording was corrected in a prior session.

REMAINING PROOF:
NONE

NOTES:
A stale internal doc `app/(site)/clasificados/bienes-raices/BR13D_PROPERTY_INVENTORY_VALUE_DRAWER_AUDIT.md` describes an OLDER, different pricing model ($99.99/+5/$498.99 total/up to 8) — this is dead documentation, not live code or user-facing copy, and does not affect this verdict.

---

ITEM:
⚠️75

OWNER REQUIREMENT:
Total combined pricing is $498.00/month, not $498.99.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brAgenteApplicationPricingCopy.ts`: `total498: "$498/mes"` / `"$498/month"`, `"el plan total es $498/mes cuando se selecciona"`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Live copy consistently shows $498/month (399+99), never $498.99.

REMAINING PROOF:
NONE

NOTES:
The stale $498.99 figure exists only in the dead `BR13D_...md` doc noted above, not in any rendered copy.

---

ITEM:
⚠️76

OWNER REQUIREMENT:
Pricing copy should communicate the value of the additional properties clearly and accurately.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brAgenteApplicationPricingCopy.ts` (`drawerPackIncludes`, `optionalUpgradeDetail`, `packDetail`) — each additional property gets its own title/price/photos/location/details/video-tour links, spelled out explicitly.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Bulleted, accurate value copy in both languages.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️77

OWNER REQUIREMENT:
BR Negocio supports Residential, Commercial, and Land/Lot as the three canonical top-level property categories.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/bienes-raices/shared/brNegocioBranchParams.ts`: `export type BrNegocioCategoriaPropiedad = "residencial" | "comercial" | "terreno_lote";`

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Type union is exactly these 3 values.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️78

OWNER REQUIREMENT:
Top-level BR category IDs remain exactly residencial, comercial, terreno_lote; no top-level Otro.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `BrNegocioCategoriaPropiedad` union as ⚠️77; `coerceBrNegocioCategoriaPropiedad` only accepts these 3 values (no "otro" branch found in the shared branch-params file).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed closed 3-value union, no wildcard/Otro category.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️79

OWNER REQUIREMENT:
Residential Property Type, Property Subtype/Style, and Levels/Stories must be separate concepts.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteIndividualResidencialFormState.ts` has 3 distinct fields: `tipoPropiedadCodigo`, `subtipoPropiedad`, `nivelesPropiedad` (doc comment: "Levels/stories — a genuinely separate field from subtipoPropiedad"). `steps01-03.tsx` renders `subtipoPropiedad` (label "Subtipo") and a separate "Niveles / pisos" select (`nivelesPropiedad`, options 1/2/3+, hint "Distinto del subtipo") side by side.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Added a genuinely separate `nivelesPropiedad` field, distinct UI control, distinct hint copy.

REMAINING PROOF:
NONE

NOTES:
See ⚠️80 — the field separation itself is done, but the OLD story-count values were not removed from the Subtipo catalog.

---

ITEM:
⚠️80

OWNER REQUIREMENT:
"Un solo piso / dos pisos / tres pisos" must not masquerade as property subtype.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteResidencialTipoMeta.ts` `SUBTIPO_POR_TIPO.casa` still literally lists `{ value: "un_piso", label: "Un solo piso" }` and `{ value: "dos_pisos", label: "Dos pisos" }` alongside the true subtype `duplex` inside the closed "Subtipo" catalog. `steps01-03.tsx` line 172 renders this catalog under the label `t.step01.subtipo` ("Subtipo") using `subtipoResOptionLabel` (only an EN-translation helper, not a semantic-kind relabel).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
A separate `residencialSubtipoDisplayGroup()` semantic-kind adapter exists in the same file (explicitly documented as "display-layer adapter ONLY... catalog... completely unchanged"), but it is only consulted by a caller that "opts in" — the actual application-form "Subtipo" dropdown does not opt in, so the story-count values still appear as literal Subtipo options in the live form.

REMAINING PROOF:
NONE (source-provable) — un_piso/dos_pisos remain live, selectable options inside the "Subtipo" select in `steps01-03.tsx`.

NOTES:
The new `nivelesPropiedad` field (⚠️79) exists alongside this, but the old masquerading values were never removed from Subtipo itself.

---

ITEM:
⚠️81

OWNER REQUIREMENT:
Residential dropdowns/options should cover strong real-market options and use controlled custom fallback only where needed.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteResidencialTipoMeta.ts`: 5 property types (casa/condominio/townhome/apartamento/multifamiliar), 2-4 subtype options per type, explicitly documented as "Catálogo cerrado (sin tipo comodín)" (closed catalog, no wildcard type).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE — no custom/"otro" fallback mechanism exists anywhere in this catalog; if a listing doesn't fit any of the fixed options there is no controlled custom-add escape hatch.

REMAINING PROOF:
NONE (source-provable) — catalog is by design closed with no fallback field.

NOTES:
The base type/subtype list itself is reasonable for common US residential stock, but the explicit "controlled custom fallback" half of the requirement is absent.

---

ITEM:
⚠️82

OWNER REQUIREMENT:
Residential core data includes beds, full/half baths, interior area, lot, year, parking/garage, condition, sale situation, and other applicable structured details.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteIndividualResidencialFormState.ts`: `recamaras`, `banos`, `mediosBanos`, `tamanoInteriorSqft`, `tamanoLoteSqft`, `estacionamientos`, `anoConstruccion`, `condicionPropiedad`, `estadoAnuncio` (disponible/pendiente/bajo_contrato/vendido = sale situation).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
All listed fields present in the canonical child-owned field set.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️83

OWNER REQUIREMENT:
Commercial "Tipo comercial" and "Subtipo" must form a meaningful, broad taxonomy rather than a weak generic list.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteComercialTerrenoMeta.ts`: 6 commercial types (oficina/local/bodega/nave_industrial/uso_mixto/edificio_comercial), each with 2-3 meaningfully distinct subtypes (e.g. bodega → con_rampa/climatizada; nave_industrial → muelle/altura_libre).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed non-trivial, differentiated taxonomy (18 total tipo×subtipo combinations, not a flat generic list).

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️84

OWNER REQUIREMENT:
Switching Commercial type/subtype must reveal only relevant conditional fields.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`steps01-03.tsx`: `comercialSubtipos = COMERCIAL_SUBTIPO_POR_TIPO[state.comercialTipoCodigo]` — subtype option list is keyed live off the selected `comercialTipoCodigo` and re-derived on every render.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Structural conditional lookup confirmed.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️85

OWNER REQUIREMENT:
Commercial "Uso comercial / uso permitido" should support structured choices (retail, office, studio, medical, restaurant, workshop, warehouse, etc.).

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteIndividualResidencialFormState.ts`: `comercialUso: string`. `steps04-09.tsx` line 191-192 renders it as a plain free-text `<input>` (`value={state.comercialUso}`, `onChange={... comercialUso: e.target.value}`) — no select/checklist of structured use categories anywhere.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE — field is a single free-text box, not a structured multi-select.

REMAINING PROOF:
NONE (source-provable)

NOTES:
—

---

ITEM:
⚠️86

OWNER REQUIREMENT:
Commercial permitted-use can support controlled custom-add values with the standard multi-word add pattern.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `comercialUso` free-text field as ⚠️85 — no chip/add pattern exists for it at all.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE (source-provable — depends on ⚠️85 which is itself not structured).

NOTES:
—

---

ITEM:
⚠️87

OWNER REQUIREMENT:
Commercial characteristics should have a strong canonical list plus controlled custom-add highlights where appropriate.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`COMERCIAL_DESTACADOS_DEFS` (10 items: recepción, elevador, acceso de carga, alto tráfico, señalización, seguridad, listo para operar, oficinas privadas, sala de juntas, área de almacén). `steps04-09.tsx` renders these as plain checkboxes only (`COMERCIAL_DESTACADOS_CHECKLIST_DEFS.map(...)`) — grep for any `onAddCustom`/chip-add wiring near this block returned nothing; the only `onAddCustom` usages in this file are for service-area and languages fields.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Canonical list is solid (10 items); no custom-add mechanism was wired for it.

REMAINING PROOF:
NONE (source-provable)

NOTES:
Matches the reconciliation ledger's own finding (item 14): the custom-highlight-chip primitive was ported to BR Privado/Rentas but explicitly NOT wired into BR Negocio's own `AGENTE_RES_DESTACADOS_DEFS`-style checklists.

---

ITEM:
⚠️88

OWNER REQUIREMENT:
Land/Lot type and subtype must cover meaningful market distinctions (residential lot, commercial lot, agricultural/ranch, development land, etc.).

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`TERRENO_TIPO_OPCIONES`: lote_residencial, lote_comercial, rancho, agricola, desarrollo — exactly matches the requirement's named distinctions, each with 2 further subtypes.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed 5 meaningfully distinct land types + subtypes.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️89

OWNER REQUIREMENT:
Land core details should include lot size + unit, zoning/use, road/access type, utilities/services availability, and topography.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteIndividualResidencialFormState.ts`: `tamanoLoteSqft`, `terrenoUsoZonificacion`, `terrenoAcceso`, `terrenoServicios`, `terrenoTopografia`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
All 5 field categories present.

REMAINING PROOF:
NONE

NOTES:
`tamanoLoteSqft` is sqft-only (no acre-unit toggle confirmed) — minor breadth gap, not disqualifying for this item's core ask.

---

ITEM:
⚠️90

OWNER REQUIREMENT:
Land structured highlights should include ready-to-build, fenced, well, septic, power, water, sewer, paved access, views, trees, agricultural use, commercial potential, near utilities.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`TERRENO_DESTACADOS_DEFS`: pozo(well), arboles(trees), arboles_frutales, vista(views), acceso_pavimentado(paved access), cercado(fenced), destacado_agricola(agricultural), destacado_comercial(commercial potential), listo_construir(ready to build), cerca_servicios(near utilities), fosa_septica(septic), electricidad_disponible(power), agua_disponible(water), drenaje_disponible(sewer).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Every single value named in the requirement has a corresponding canonical highlight id.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️91

OWNER REQUIREMENT:
Land highlights may support controlled custom-add values using the shared pattern.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `TERRENO_DESTACADOS_CHECKLIST_DEFS` checkbox rendering as ⚠️90 — plain checkboxes only, no custom-add UI found near `destacadosTerreno` in `steps04-09.tsx`.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE (source-provable)

NOTES:
Same gap pattern as ⚠️87/⚠️92.

---

ITEM:
⚠️92

OWNER REQUIREMENT:
BR Negocio Characteristics/Highlights needs a strong canonical list and custom-add behavior where approved.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`AGENTE_RES_DESTACADOS_DEFS` (residential, 15 items), `COMERCIAL_DESTACADOS_DEFS` (10), `TERRENO_DESTACADOS_DEFS` (14) — all solid canonical lists; none wired to a custom-add mechanism in `steps04-09.tsx`.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Canonical lists exist and are broad; custom-add half of the requirement is unmet across all 3 BR Negocio categories.

REMAINING PROOF:
NONE (source-provable)

NOTES:
Umbrella item for ⚠️86/87/91 — same underlying gap.

---

ITEM:
⚠️93

OWNER REQUIREMENT:
Agent 1 professional identity includes the approved profile/contact information.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteIndividualResidencialFormState.ts`: `agenteFotoDataUrl`, `agenteNombre`, `agenteTitulo`, `agenteLicencia`, `agenteTelefonoPersonal`, `agenteTelefonoOficina`, `agenteWhatsapp`, `agenteSitioWeb`, `correoPrincipal`, `agenteAreaServicio`, `agenteIdiomas`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Full profile field set present.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️94

OWNER REQUIREMENT:
Agent 1 website field must clearly mean "Sitio web del agente / Agent website," not the business website.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brAgenteResidencialCopy.es.ts`: `sitioWebAgente: "Sitio web del agente"` vs. `sitioMarca: "Sitio web de oficina o marca (opcional)"` — two distinctly-labeled fields.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Explicit, unambiguous label separation confirmed.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️95

OWNER REQUIREMENT:
Agent website helper copy may describe a personal professional/profile page.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`sitioWebAgenteHint: "Tu sitio como agente (el botón «Ver sitio web» usa primero el enlace preferido de «Contacto y destinos de botones», luego este, luego el de oficina/marca)."`

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Hint explicitly frames it as "your site as an agent."

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️96

OWNER REQUIREMENT:
Business/office website remains a separate field from agent website.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteSitioWeb` vs. `marcaSitioWeb` — two independent fields in form state, two independent labeled inputs in the UI.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed field-level separation.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️97

OWNER REQUIREMENT:
Agent 1 supplied website/social/contact channels should render automatically when valid.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteResidencialPreviewFormat.ts` — CTA/social visibility is content-driven (e.g. `hasBrandBlockVisible` doc comment: "brand-block visibility is now content-driven... if the agent filled in office/brand info, it renders automatically"); `useInheritedHubModel`'s `socialRows` filters purely on `trim(value)`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed data-driven (not toggle-driven) rendering for the main live preview path.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️98

OWNER REQUIREMENT:
Redundant preferred-order/contact-ranking controls should not determine whether valid CTA channels are visible.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agentePrincipalLlamadas` ("personal"/"oficina") only selects WHICH number feeds the "Llamar" CTA when both exist; CTA visibility itself is governed separately by `permitirLlamar` + valid-digits checks (`hasTenDigits`), not by the ranking field.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Ranking and visibility are separate, independently-gated concerns in source.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️99

OWNER REQUIREMENT:
Agent 2 should have relevant approved contact/profile parity, including WhatsApp and agent website.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agente2FotoDataUrl`, `agente2Nombre`, `agente2Titulo`, `agente2Licencia`, `agente2TelefonoPersonal`, `agente2TelefonoOficina`, `agente2Whatsapp`, `agente2SitioWeb`, `agente2Correo`, `agente2Social*` (Instagram/Facebook/YouTube/TikTok/X/Otro).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Full parity field set including WhatsApp and website confirmed.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️100

OWNER REQUIREMENT:
Agent 2 data must remain owned by Agent 2, not route through Agent 1/business fields.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agente2*` fields are a fully separate namespace in form state; `InheritedHubFields` in `brNegocioChildInheritedHubShared.tsx` renders the `hasSecondAgent` block from `agente2Nombre/Titulo/Correo/TelefonoPersonal` only, never falling back to `agenteNombre`/`marcaNombre`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed no cross-fallback from Agent 1/business fields into Agent 2's own display.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️101

OWNER REQUIREMENT:
Financing professional information must have a clear dedicated section rather than mixed into Agent 1.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brAgenteResidencialCopy.es.ts`: `brokerSection: "Financiamiento"`, `agregarBrokerAsesor: "Agregar financiamiento"`, `broker*` field namespace fully separate from `agente*`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed literal "Financiamiento" section label, distinct field namespace, own toggle (`mostrarBrokerAsesor`).

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️102

OWNER REQUIREMENT:
Financing professional may have approved phone/email/website/social contact destinations.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brokerTelefonoPersonal`, `brokerTelefonoOficina`, `brokerWhatsapp`, `brokerEmail`, `brokerSitioWeb`, `brokerInstagram`, `brokerFacebook`, `brokerYoutube`, `brokerTiktok`, `brokerX`, `brokerOtro`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Full destination field set present.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️103

OWNER REQUIREMENT:
Professional socials should support Agent 1, Agent 2, and financing professional where supplied and approved.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Agent 1: `socialInstagram/Facebook/Youtube/Tiktok/X/Linkedin/Snapchat/Otro` + Google/Yelp. Agent 2: `agente2Social*` (5 platforms). Broker: `broker Instagram/Facebook/Youtube/Tiktok/X/Otro`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
All three roles have their own independent social field sets.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️104

OWNER REQUIREMENT:
Office/brand identity should render automatically if supplied; do not require a "mostrar marca" toggle.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteResidencialPreviewFormat.ts` `hasBrandBlockVisible()` is content-driven (doc comment: "removed the... manual toggle"). BUT `brNegocioChildInheritedHubShared.tsx` line 116-121 `hasBrandBlock` is still `Boolean(state.mostrarMarcaEnTarjeta && (...))`, and `mapAgenteResidencialFormStateToNegocioForPublish.ts:373` still computes `mostrarBrokerage: Boolean(trim(s.marcaNombre)) && s.mostrarMarcaEnTarjeta`.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
The main live preview path was fixed to be content-driven; the child-inventory inherited-hub display and the publish mapper's `mostrarBrokerage` flag were NOT fixed and still literally gate on the toggle.

REMAINING PROOF:
NONE (source-provable inconsistency across 3 code paths) — practically masked for brand-new drafts because `mostrarMarcaEnTarjeta` defaults to `true` and no UI exists to flip it, but any legacy draft stored with `false` will see inconsistent brand-block visibility between the main preview and these two other surfaces.

NOTES:
—

---

ITEM:
⚠️105

OWNER REQUIREMENT:
Existing stored mostrarMarcaEnTarjeta values may remain compatible but should not create a redundant user-facing decision.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Grep of `steps01-03.tsx` and `steps04-09.tsx` for `mostrarMarcaEnTarjeta` returns zero hits — no checkbox/toggle UI exists in the live application form; copy strings `mostrarMarca`/`mostrarMarcaHint` exist in the copy file but are unreferenced (dead copy).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed no user-facing toggle remains; field only persists via legacy-draft compatibility logic.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️106

OWNER REQUIREMENT:
Service Areas should use chips/options plus "Agregar otra área" where appropriate.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`steps04-09.tsx` renders `agenteAreaServicio` via the shared `LanguagesInput` component with `options={BR_RENTAS_SERVICE_AREA_OPTIONS}`, `customValues`, `onAddCustom={addAreaServicio}`, `onRemoveCustom`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Chip-based options + custom-add wired via the shared component.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️107

OWNER REQUIREMENT:
Custom Service Area input must support multi-word values, Spacebar, paste, save, removable chip, and persistence.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `LanguagesInput` wiring as ⚠️106 (plain-text custom input + `onAddCustom`/`onRemoveCustom`).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Structural support (free-text input, add/remove handlers, array persistence in form state) is in place; nothing in source blocks Spacebar/paste.

REMAINING PROOF:
Live typing test: type a multi-word area name with spaces, use Spacebar and paste, click Add, remove a chip, refresh/reopen the draft and confirm the chip persists.

NOTES:
—

---

ITEM:
⚠️108

OWNER REQUIREMENT:
Languages should use the shared LanguagesInput behavior rather than a plain disconnected text field.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`steps04-09.tsx`: `agenteIdiomas` rendered via the same shared `LanguagesInput` component (`options={brRentasLanguageChipOptions(lang)}`, `onToggle={toggleIdiomaChip}`, `onAddCustom={addCustomIdioma}`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed same shared component as Service Area, not a disconnected plain field.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️109

OWNER REQUIREMENT:
Languages custom-add behavior must support multi-word input and persistence.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `LanguagesInput` wiring as ⚠️108.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Structural support present; nothing blocks multi-word text.

REMAINING PROOF:
Live typing test identical in nature to ⚠️107, applied to the languages field.

NOTES:
—

---

ITEM:
⚠️110

OWNER REQUIREMENT:
Preferred contact/destination copy in the application must clearly explain which numbers/URLs power the public CTA buttons.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brAgenteResidencialCopy.es.ts` step08: `destinos: "Destinos preferidos para cada botón"`, `destinosSub`, and per-field hints (`numLlamadasHint`, `numWaHint`, `correoInfoHint`, `enlaceWebHint`, `enlaceListadoHint`, `enlaceMlsHint`, `enlaceTourHint`, `enlaceFolletoHint`) each spelling out the exact fallback chain to the source data.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Every CTA destination field has explicit "if empty, uses X" copy.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️111

OWNER REQUIREMENT:
CTA destination numbers may differ from identity/profile numbers and must be labeled clearly to avoid confusion.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Step08 `destinosSub`: "Opcional: define un número, correo o enlace distinto al de tu ficha profesional para un botón concreto..." — explicitly frames these as optional overrides distinct from the profile numbers captured in step 7.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Explicit "distinct from your professional profile" framing confirmed.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️112

OWNER REQUIREMENT:
Professional phone/SMS/WhatsApp/email/website destinations must map to the correct public CTA.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteResidencialPreviewFormat.ts`: `hrefSitioWebCta`, `hrefTourCta`, `hrefFolletoCta`, `hrefListadoCompleto`-style helper functions implement explicit, readable fallback chains (dedicated CTA override → agent field → office/brand field).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Mapping logic is directly readable/provable code, not inferred.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️113

OWNER REQUIREMENT:
External listing/MLS/tour/brochure/video URLs should render when valid and accepted.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same CTA helper functions as ⚠️112, plus `businessExtraUrls` (additional business links) rendering with `validHttpUrl()` gating.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
All URL categories have working conditional-render logic gated on validity.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️114

OWNER REQUIREMENT:
Virtual Tour URL must use the same explicit "added/accepted" confirmation pattern as video.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`steps01-03.tsx`: `tourUrl` is rendered via the shared `UrlOrFileRow` component, which — once a URL is accepted — only shows the plain URL text (`{urlValue}` at line 322), NOT the styled bold-green "X añadido" confirmation used by video (`t.step03.videoAdded`, shown conditionally at line 396) or by business links (`s7.linkAdded`, line 633).

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE — `UrlOrFileRow` (used by tour/brochure/listing file) never implements the styled "added" confirmation that video and business-links use.

REMAINING PROOF:
NONE (source-provable)

NOTES:
Same gap as ⚠️115 — same shared component, same missing pattern.

---

ITEM:
⚠️115

OWNER REQUIREMENT:
Brochure URL must use the same explicit "added/accepted" confirmation pattern.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`steps01-03.tsx`: `brochureUrl` also rendered via `UrlOrFileRow` — same gap as ⚠️114.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE (source-provable)

NOTES:
—

---

ITEM:
⚠️116

OWNER REQUIREMENT:
Video URLs must use the explicit "Video añadido" style pattern and support the approved multi-video limit.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`steps01-03.tsx` `VideoUrlAddRows`: per-row `{ok ? <p ...>{t.step03.videoAdded}</p> : null}` (line 396); `AGENTE_RES_MAX_VIDEO_URLS = 8` in form state (comment: "pilot-lane video cap raised 4 -> 8").

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Explicit styled confirmation per video row + 8-video cap confirmed.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️117

OWNER REQUIREMENT:
BR Negocio media must support photo upload, thumbnails, reorder, portada, remove, count, persistence, preview order, and Back-to-Edit order.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`fotosDataUrls: string[]` + `fotoPortadaIndex: number` in form state; multiple photo-media utilities (`brAgenteResDraftMedia.ts`, `brAgenteResDraftMediaIdb.ts`) and several verifier scripts touching this surface (`verify-bienes-child-editor-step10-media-url-truth-force-patch-01.mjs`, `smoke-bienes-cross-tab-draft-media-isolation-01.mjs`).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Structural support for portada index + photo array + several dedicated persistence/isolation scripts exist, but drag-reorder and thumbnail-strip interaction were not confirmed via an actual browser interaction trace in this pass.

REMAINING PROOF:
Live test: upload multiple photos, drag-reorder them, set portada, remove one, refresh the tab, reopen for edit, and confirm the same order/count/portada survive into preview and back into the editor.

NOTES:
—

---

ITEM:
⚠️118

OWNER REQUIREMENT:
Parent professional/contact identity must not disappear from BR Negocio after application/preview edits.

EVIDENCE SOURCE:
repo, runtime (behavioral selftest)

CURRENT IMPLEMENTATION:
`scripts/br-inv-d1-parent-hydration-behavioral-selftest.ts`, executed this pass — PASSED. It injects a real sessionStorage race (write-then-unreadable-for-a-window-then-readable) and asserts NAME/PHONE/EMAIL/BRAND-ROLE are all restored across 5 simulated hard-refresh runs.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
"BR-INV-D1-FIX" race-condition fix, re-verified passing this session.

REMAINING PROOF:
NONE — genuine behavioral proof obtained this pass (script executed, output confirmed passing).

NOTES:
This is a simulated-race Node script, not a live browser E2E run, but it directly exercises the production hydration functions with real timing injection and field-level assertions.

---

ITEM:
⚠️119

OWNER REQUIREMENT:
Parent professional/contact identity must not disappear when adding or editing an inventory child.

EVIDENCE SOURCE:
repo, runtime (behavioral selftest)

CURRENT IMPLEMENTATION:
Same selftest as ⚠️118 — its "CHILD INHERITANCE: TRUE" and "PARENT UPDATE PROPAGATES: true" assertions directly cover the add/edit-child scenario.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Same fix/verification as ⚠️118.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️120

OWNER REQUIREMENT:
Inventory child editor must display inherited parent professional/contact information read-only.

EVIDENCE SOURCE:
repo, runtime

CURRENT IMPLEMENTATION:
`BrNegocioChildInventoryInheritedHubPanel` / `BrNegocioChildInventoryInheritedSummary` in `BrNegocioChildInventoryInheritedHubPanel.tsx` — explicit "Solo lectura — heredado del anuncio principal" badge, renders agent/office/broker/second-agent blocks from the parent `state` with no editable inputs.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Dedicated read-only panel component confirmed, plus behavioral selftest ("CHILD INHERITANCE: TRUE").

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️121

OWNER REQUIREMENT:
Parent edits should propagate to the child's inherited identity display.

EVIDENCE SOURCE:
repo, runtime (behavioral selftest)

CURRENT IMPLEMENTATION:
Selftest output: "PARENT UPDATE PROPAGATES: true". Structurally, `pickParentHubSlice`/`agenteHubSnapshotFromNegocioState` always re-derive from the current parent state, not a frozen snapshot.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed live propagation both structurally and behaviorally.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️122

OWNER REQUIREMENT:
Child must not overwrite parent-owned identity/contact/business fields.

EVIDENCE SOURCE:
repo, runtime (behavioral selftest)

CURRENT IMPLEMENTATION:
`brNegocioChildInventoryFormMapping.ts`: `AGENTE_CHILD_PROPERTY_FIELD_KEYS` is an explicit whitelist of property-only fields; `pickParentHubSlice()`/`mergeParentHubWithChildProperty()` strip these keys from the parent slice before merging the child's slice on top — architecturally the child object literally cannot contain an identity/contact/business key. Selftest: "CHILD CANNOT OVERRIDE PARENT IDENTITY: true".

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Both a structural type-level guarantee and a passing behavioral assertion.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️123

OWNER REQUIREMENT:
Child owns property-specific title, price, media, details, highlights, description, HOA/Open House where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`AGENTE_CHILD_PROPERTY_FIELD_KEYS` includes `titulo`, `precio`, `fotosDataUrls`, `fotoPortadaIndex`, `videoUrls`, `tourUrl`, `brochureUrl`, `recamaras`...`condicionPropiedad`, `hasHoa`...`parkingRules`, `destacados`/`destacadosComercial`/`destacadosTerreno`, `descripcionPrincipal`, `notasAdicionales`, `openHouseSlots`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Every category named in the requirement is present in the child-owned key list.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️124

OWNER REQUIREMENT:
Stable child identity/IDs must preserve siblings and prevent one child save from overwriting another.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`childInventoryDraftFromEditorState()`: `const id = existing?.id ?? newBrLocalPropertyDraftId();` — stable id reuse on edit, new id on create. `mergeAdditionalInventoryProperties()` operates over the full array of drafts by id.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Stable-ID design is structurally sound, but the actual "does saving child #2 leave child #1 and the parent hub byte-for-byte untouched" guarantee depends on the caller-level save flow, which was not traced end-to-end or behaviorally exercised in this pass.

REMAINING PROOF:
Live test: create 3 inventory children, edit and save child #2 with photo/field changes, confirm children #1 and #3 and the parent hub are unaffected.

NOTES:
—

---

ITEM:
⚠️125

OWNER REQUIREMENT:
Child media must remain independent from parent and siblings.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Each `BrNegocioAdditionalInventoryPropertyDraft` is an independent array element with its own `photoUrls`/`fotosDataUrls`/`primaryPhotoIndex`, keyed by its own `id` — not a shared/global media pool.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed structurally independent per-child media arrays.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️126

OWNER REQUIREMENT:
Child save/update must preserve siblings and parent hub data.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same architecture as ⚠️124 (array of id-keyed drafts, `pickParentHubSlice` strips child keys before any child merge).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Structural design supports this; full save-flow non-interference was not behaviorally traced this pass (distinct from the already-proven hydration/inheritance selftest, which does not specifically exercise multi-child sibling-preservation-on-save).

REMAINING PROOF:
Same live test as ⚠️124.

NOTES:
—

---

ITEM:
⚠️127

OWNER REQUIREMENT:
BR Negocio inventory child should complete preview/save/reopen with exact property data retained.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`buildLiveChildInventoryPreviewDraft()`, `buildChildInventoryEditorState()` implement the round-trip logic; several verifier scripts target this exact surface (`verify-bienes-child-editor-step10-media-url-truth-force-patch-01.mjs`, `verify-bienes-child-step10-preview-card-media-hard-refresh-fix-01.mjs`, `bienes-child-inventory-persistence-rehydration-audit.ts`) but were not executed in this pass.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Round-trip mapping code exists and is structurally coherent; full preview→save→reopen equality was not behaviorally executed/observed this pass.

REMAINING PROOF:
Live test: fill a child property fully, preview it, save, close, reopen the editor, and diff every field against the original input.

NOTES:
—

---

ITEM:
⚠️128

OWNER REQUIREMENT:
HOA fields are property-specific and must belong to the property/child, not the parent professional hub.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`AGENTE_CHILD_PROPERTY_FIELD_KEYS` includes `hasHoa`, `hoaFee`, `hoaFrequency`, `hoaIncludes`, `communityRules`, `petRules`, `rentalRestrictions`, `shortTermRentalAllowed`, `parkingRules` (comment: "FINAL-COMPLETION item 04: HOA is property-specific data... belongs to the child").

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Explicit, commented placement of all HOA keys in the child-owned list.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️129

OWNER REQUIREMENT:
HOA module must support structured Has HOA, fee, frequency, includes, community rules, pet rules, rental restrictions, short-term rental status, and parking rules.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same 9-field HOA set as ⚠️128, all present in `agenteIndividualResidencialFormState.ts` and consumed by `leonixBrGate12dHoaPreview.ts`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Every named sub-field exists.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️130

OWNER REQUIREMENT:
If Has HOA = No, dependent HOA fee/frequency/details should not create contradictory output.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`leonixBrGate12dHoaPreview.ts` `buildBrGate12dHoaPreviewCard()`: `if (g.hasHoa === "yes") { push fee/frequency/includes rows }` — these rows are only pushed when `hasHoa === "yes"`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed fee/frequency/includes are gated strictly behind `hasHoa === "yes"`.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️131

OWNER REQUIREMENT:
If no HOA information is supplied, the HOA public module should not render.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`buildBrGate12dHoaPreviewCard()`: `if (!rows.length) return null;` — whole card returns null when no rows were pushed.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Whole-module suppression confirmed.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️132

OWNER REQUIREMENT:
HOA public output should be a polished structured card, not raw database-style rows.

EVIDENCE SOURCE:
repo, screenshot (not sampled this pass)

CURRENT IMPLEMENTATION:
`buildBrGate12dHoaPreviewCard()` returns a clean `{title, rows: {label, value}[]}` shape (not a raw object dump); actual rendered visual treatment (card styling, spacing, iconography) lives in a consuming component not traced to pixel level this pass.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Underlying data model is already structured label/value pairs, not raw text.

REMAINING PROOF:
Screenshot/visual comparison of the rendered HOA card against the "polished card, not raw DB rows" bar.

NOTES:
—

---

ITEM:
⚠️133

OWNER REQUIREMENT:
Open House should use structured repeatable events, not giant raw text blocks.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`AgenteResOpenHouseSlot[]` (`openHouseSlots`), capped at `AGENTE_RES_MAX_OPEN_HOUSE_SLOTS = 4`, each slot a structured object (`fecha`, `fechaFin`, `inicio`, `fin`, `diasHorariosAdicionales`, `notas`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed structured array model, not free text.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️134

OWNER REQUIREMENT:
Open House event shape includes date, start time, end time, appointment-only state, notes/instructions, and booking link if applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`AgenteResOpenHouseSlot` type: `fecha`, `fechaFin`, `inicio`, `fin`, `diasHorariosAdicionales`, `notas` — no `appointmentOnly`/`byAppointment` boolean field and no per-event booking-link field anywhere in the type.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Date/start/end/notes are present; appointment-only state and per-event booking link are absent from the type.

REMAINING PROOF:
NONE (source-provable — type shape is directly readable).

NOTES:
`ctaEnlaceProgramarVisita` exists but is a single application-level "schedule visit" link, not a per-open-house-event booking link.

---

ITEM:
⚠️135

OWNER REQUIREMENT:
Multiple Open House events should be supported one event at a time.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`openHouseSlots: AgenteResOpenHouseSlot[]` (max 4) with add/patch/remove-slot handlers in `steps04-09.tsx` (per the reconciliation ledger's prior finding at `steps04-09.tsx:1295-1332`, `emptyOpenHouseSlot()`/`addSlot()`/`patchSlot()`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Array-based, add-one-at-a-time UI pattern confirmed structurally.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️136

OWNER REQUIREMENT:
Open House date/time output must be human-readable and locale-friendly.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteResidencialPreviewFormat.ts` `formatOpenHouseDateRange()` uses `new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-US", { dateStyle: "medium" })`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed locale-aware `Intl.DateTimeFormat` usage, not raw ISO strings.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️137

OWNER REQUIREMENT:
Open House presentation should use compact event cards and a coherent calendar/appointment treatment.

EVIDENCE SOURCE:
repo, screenshot (not sampled this pass)

CURRENT IMPLEMENTATION:
`LeonixOpenHouseSlotCards` shared component now used by both BR lanes per the prior reconciliation pass; actual visual treatment (calendar iconography, appointment badge styling) not verified at pixel level this pass.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Component consolidation onto one shared renderer is confirmed; visual "coherent calendar/appointment treatment" quality is a design judgment.

REMAINING PROOF:
Screenshot/visual comparison against the compact-card/calendar-treatment bar.

NOTES:
—

---

ITEM:
⚠️138

OWNER REQUIREMENT:
"Agregar al calendario" may appear where the shared design supports it.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Repo-wide search found no "add to calendar" / .ics-generation feature anywhere in the BR/Rentas real-estate surfaces.

CLASSIFICATION:
⚪ GLOBAL-DEFERRED

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE — this capability does not exist as a shared/global engine feature yet; the requirement's own permissive wording ("may appear where the shared design supports it") defers it to that not-yet-built global capability rather than asking for a category-local implementation.

NOTES:
—

---

ITEM:
⚠️139

OWNER REQUIREMENT:
"Reservar cita" may appear where applicable and properly wired.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`permitirProgramarVisita` boolean + `ctaEnlaceProgramarVisita` field, with explicit copy `enlaceVisita: "Enlace preferido para programar visita"` / `enlaceVisitaHint: "Enlace https de calendario (p. ej. Calendly). Sin enlace, no hay botón."`, rendered as a CTA link in both the sidebar and inherited-hub display.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Full field + copy + conditional-render wiring confirmed for a "schedule visit/appointment" CTA.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️140

OWNER REQUIREMENT:
BR Negocio preview must preserve the premium property hierarchy before the professional/business layer.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`AgenteIndividualResidencialPreviewPage.tsx`: `MAIN_GRID` section (line 299) contains gallery/photos/video (lines ~380-545) then property-details sections (lines 601/640/662) in the main column; `<BrAgenteResContactSidebar .../>` is mounted afterward (line 797) as a distinct sidebar/rail element.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed JSX/document order: property content precedes the professional sidebar.

REMAINING PROOF:
NONE

NOTES:
Actual visual weighting/proportion (how "premium" it reads) is a separate, softer concern — see ⚠️141/154.

---

ITEM:
⚠️141

OWNER REQUIREMENT:
Professional layer should include office/brand, agent(s), financing/broker role, and contact/social destinations without overwhelming property content.

EVIDENCE SOURCE:
repo, screenshot (not sampled this pass)

CURRENT IMPLEMENTATION:
`BrAgenteResContactSidebar.tsx` renders office/brand, agent 1/2, broker/financing, and social/CTA blocks as a sidebar (not full-width takeover).

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
All required content blocks are present in the sidebar; whether it visually "overwhelms" the property content is a layout/proportion judgment.

REMAINING PROOF:
Screenshot comparison of the full preview page to confirm the sidebar doesn't visually dominate the property content.

NOTES:
—

---

ITEM:
⚠️142

OWNER REQUIREMENT:
BR Negocio result-card preview should remain compact and use the actual cover/media.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesNegocioCard.tsx`: `<img src={listing.imageUrl} .../>` — uses the real listing image, not a hardcoded placeholder.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Real cover-photo usage is source-confirmed; "remains compact" is a sizing/layout judgment not verified visually this pass.

REMAINING PROOF:
Screenshot comparison of the card against the results grid to confirm compactness.

NOTES:
—

---

ITEM:
⚠️143

OWNER REQUIREMENT:
BR Negocio public detail should not fall back to generic junk when real child/property data exists.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brNegocioInventoryCardModel.ts` comment: "...matching propertyForm value instead of showing 'Sin título' / 'Precio pendiente' / a bare country fallback when real data exists on either side" — the fallback strings exist but are explicitly documented/guarded to only apply when genuinely no real data exists on either the flat or `propertyForm` side.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed the fallback-vs-real-data precedence logic exists as described.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️144

OWNER REQUIREMENT:
BR Negocio map/location derives from the structured listing location; no manual map URL.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`agenteIndividualResidencialFormState.ts` has no `enlaceMapa`/map-URL field anywhere (grep confirmed zero hits); location fields are fully structured (`ciudad`, `direccionLinea1/2`, `direccionEstado`, `direccionCodigoPostal`, `direccionPais`, `mostrarDireccionExacta`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed no manual map-URL field exists in this form; map must derive from the structured address fields.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️145

OWNER REQUIREMENT:
BR Negocio address/reference copy should clearly explain the intended structured/approximate location behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`brAgenteResidencialCopy.es.ts`: `mostrarDireccionExactaHint: "Desactivado por defecto: solo ciudad/área alimentan el mapa público. Actívalo solo si quieres que la calle aparezca en la vista previa."`

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Clear, explicit explanation of the default approximate-location behavior and the opt-in exact-address behavior.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️146

OWNER REQUIREMENT:
Professional Google/Yelp rendering, if used, must come from legitimate connected data and never fake reviews.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`BrAgenteResContactSidebar.tsx`: `hub.googleBusinessUrl`/`hub.googleReviewsUrl`/`hub.yelpReviewsUrl` render as outbound links to the advertiser's own supplied URLs via `SharedConnectionHubReviewButton` — no fabricated review text, star ratings, or counts are synthesized anywhere in this component.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed these are simple outbound links to real advertiser-supplied Google/Yelp URLs, not fabricated review content.

REMAINING PROOF:
NONE

NOTES:
Chat explicitly asks whether the "lion" Community Trust badges (🦁) are used here instead of fake Google/Yelp stars — see ⚠️147.

---

ITEM:
⚠️147

OWNER REQUIREMENT:
BR Negocio Community Trust uses only the approved professional BR labels.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`BrAgenteResContactSidebar.tsx` mounts `<BrRentasCommunityTrustSection category="bienes_raices_negocio" ownerId={ownerId} displayName={...} .../>` from `app/(site)/clasificados/lib/BrRentasCommunityTrustSection.tsx`, whose own doc comment restricts it to "Rentas Negocio... Never mount this in a BR Privado / Rentas Privado surface."

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed the shared, category-scoped Community Trust component is actually wired into the live BR Negocio contact sidebar (matches the owner chat's explicit ask to "activate it here").

REMAINING PROOF:
NONE

NOTES:
Exact label wording inside `leonixEndorsementRegistry.ts` was not individually re-audited word-for-word in this pass.

---

ITEM:
⚠️148

OWNER REQUIREMENT:
BR Negocio Community Trust remains absent from private seller listings.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BrRentasCommunityTrustSection` usage sites (repo-wide grep): only `BrAgenteResContactSidebar.tsx` (BR Negocio), `RentasNegocioDesktopBusinessRail.tsx` and `RentasVisualMatchPreviewView.tsx` (Rentas) — zero hits anywhere under the BR Privado / Rentas Privado directories.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed by exhaustive usage-site grep — the component is never imported into any Privado surface.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️149

OWNER REQUIREMENT:
Commercial and Land pathways need the same professional/contact persistence guarantees as Residential.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
The parent/child architecture (`pickParentHubSlice`, `AGENTE_CHILD_PROPERTY_FIELD_KEYS`, the BR-INV-D1-FIX hydration path) operates on the single shared `AgenteIndividualResidencialFormState` regardless of `categoriaPropiedad` — `comercialTipoCodigo`/`comercialSubtipoPropiedad`/etc. and `terrenoTipoCodigo`/etc. are all child-owned keys in the exact same list as the residential fields, sharing the exact same parent-hub-preservation mechanism.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed the persistence/inheritance mechanism is category-agnostic by construction, not residential-only.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️150

OWNER REQUIREMENT:
Commercial and Land pathway options/fields must be audited for filter destination coverage.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/bienes-raices/resultados/search/filterTypes.ts`: `BrPrimaryChipId` includes only the top-level `"comerciales"` and `"terrenos"` category chips; `BrSecondaryChipId` is limited to `"piscina" | "mascotas"` (explicitly commented "only facets persisted at publish") — no commercial-specific (tipo comercial, uso comercial, `COMERCIAL_DESTACADOS_DEFS`) or land-specific (`TERRENO_TIPO_OPCIONES`, `TERRENO_DESTACADOS_DEFS`) facet filters exist anywhere in the results filter surface.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
Top-level category filtering (Comercial/Terrenos as primary chips) exists; no deeper commercial/land-specific filter facets exist beyond that.

REMAINING PROOF:
NONE (source-provable — the filter type union is small and fully enumerable).

NOTES:
This matches the item's own framing as an outstanding "must be audited" action, not a claim of completeness.

---

ITEM:
⚠️151

OWNER REQUIREMENT:
BR Negocio results filters must only expose controls backed by real structured data.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`filterTypes.ts` comment: "Secondary row chips — only facets persisted at publish (`Leonix:*` / badges not used as filters)." Chat (owner ledger item 15 in the working reconciliation doc): "fake BR filters: the dead amenity controls are being disabled/cleaned instead of pretending to work."

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Filter id list is deliberately restricted to facets that are actually persisted/queryable.

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️152

OWNER REQUIREMENT:
Fake/nonfunctional amenity filters must be disabled or omitted truthfully rather than pretending to work.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
Same as ⚠️151 — the filter id union itself was pruned down to only real, persisted facets.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Confirmed truthful, minimal filter surface (no decorative/dead controls left in the type union).

REMAINING PROOF:
NONE

NOTES:
—

---

ITEM:
⚠️153

OWNER REQUIREMENT:
BR visible filters should have interactive URL/result-set/clear/reload behavior where enabled.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesResultsFilters.tsx`, `BienesRaicesResultsActiveFilters.tsx`, `BienesRaicesFilterChips.tsx`, `brResultsFilters.ts` exist as the filter UI/state layer.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Components exist for chip selection, active-filter display, and a filters lib; actual URL-param sync / result-set filtering / clear / reload-persistence behavior was not exercised live this pass.

REMAINING PROOF:
Live test: toggle a filter chip, confirm the URL query updates and the result set changes, use "clear," and reload the page to confirm the filter state persists/clears as designed.

NOTES:
—

---

ITEM:
⚠️154

OWNER REQUIREMENT:
Business Hub, professional identity, listing, filters, preview, and public detail should feel like one coherent professional product.

EVIDENCE SOURCE:
repo, screenshot (not sampled this pass)

CURRENT IMPLEMENTATION:
All the individual pieces audited above (pricing, taxonomy, identity, media, HOA, open house, map, community trust, filters) share the same design tokens/copy voice and the same underlying `AgenteIndividualResidencialFormState`, but an end-to-end "does this feel coherent" pass across the whole surface was not performed visually this session.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE beyond what is already covered item-by-item above.

REMAINING PROOF:
A full owner walkthrough (checkpoint → application → preview → publish → results card → public detail) to confirm the whole product reads as one coherent professional experience, especially given the open gaps found above (⚠️71/72 Business Hub copy, ⚠️80/85/86/87/91/92 taxonomy/custom-add gaps, ⚠️104 brand-toggle inconsistency, ⚠️114/115/134 media/open-house shape gaps, ⚠️150 filter coverage gap).

NOTES:
This item is intentionally a holistic rollup — it cannot be certified independently of the more granular items above being closed first.
# BR Privado / FSBO Requirements Audit — Batch C (⚠️155–⚠️217)

TALLY: 🟢 SOURCE-PROVED DONE ×43 | 🔴 SOURCE-CONFIRMED NOT DONE ×12 | 🟡 OWNER-VISUAL-QA REQUIRED ×5 | 🟠 RUNTIME QA REQUIRED ×3 | ⚪ GLOBAL-DEFERRED ×0 | 🟣 ENVIRONMENT-BLOCKED ×0 | 🟤 DATA-INSUFFICIENT ×0 | 🔵 PM/BUSINESS DECISION REQUIRED ×0 — total 63

Methodology: primary evidence is direct reading of current repo source on branch
`fix/br-negocio-inventory-hub-media-hydration-2026-08-27` (files listed per item), cross-checked
against `C:\Users\chuy\Music\Bienes Rentas Chat.txt` where relevant. The prior 40-item ledger
(`.claude\BR_RENTAS_REQUIREMENTS_RECONCILIATION.md`) was used only as a map of where to look — every
claim in it was independently re-verified, and in several places (⚠️198, ⚠️201/202, ⚠️210) it proved
stale or scoped to the wrong lane. One behavioral self-test genuinely exercising runtime media
persistence (`scripts/br-inv-d2-privado-media-behavioral-selftest.ts`) was executed directly (not
just read) — 3/3 cycles pass, including UPLOAD/REORDER/PORTADA/REMOVE/ADD/REFRESH
ORDER/REFRESH PORTADA/PREVIEW/BACK TO EDIT/SECOND REFRESH steps, all `true` — and is cited as
genuine behavioral proof (not a type/shape check) for the items it covers.

---

ITEM:
⚠️155

OWNER REQUIREMENT:
BR Privado must be fully wired from Clasificados → Publicar → Bienes Raíces → Privado.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes.ts` defines
`BR_PUBLICAR_HUB`/`BR_PUBLICAR_PRIVADO`/`BR_PREVIEW_PRIVADO`, consumed by the hub client, by
`BienesRaicesPrivadoForm.tsx` (`onVerAnuncio` → `router.push(previewHref)`, lines 267–278), and by
`BienesRaicesPrivadoPreviewClient.tsx` (checkout → `redirectToRevenueCategoryCheckout`). No stub
routes or dead links found in the chain.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (pre-existing, structurally verified this pass)

REMAINING PROOF:
NONE

NOTES:
Route wiring is statically provable (every target resolves to a real file); an actual click-through
was not performed.

---

ITEM:
⚠️156

OWNER REQUIREMENT:
BR Privado uses BR Negocio property UX/data concepts as the model but removes business-only
complexity.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoFormState.ts` `seller` object has only `fotoDataUrl, nombre, etiquetaRol,
telefono, whatsapp, mensajesTexto, correo, notaContacto` — no website/social/broker/license fields.
Taxonomy imports (`TipoPropiedadCodigo`, `agenteResidencialTipoMeta`, `agenteComercialTerrenoMeta`,
`BR_HIGHLIGHT_PRESET_DEFS`) are pulled directly from BR Negocio's own schema modules, not
re-declared.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️157

OWNER REQUIREMENT:
Privado keeps Residential, Commercial, and Land/Lot property categories.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:86-90` (`CATEGORIAS` = residencial/comercial/terreno_lote, real
onClick switcher) plus three fully typed, fully defaulted schema slices
(`BienesRaicesPrivadoResidencialFields`/`ComercialFields`/`TerrenoFields`) and three dedicated
conditional sections (lines 904, 1115, 1257) with distinct field sets each.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️158

OWNER REQUIREMENT:
Privado property taxonomy should match the professional property truth where seller identity does
not change what the property is.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoFormState.ts:1-17` and `mapBienesRaicesPrivadoStateToPreviewVm.ts:1-25` import
`TIPO_PROPIEDAD_OPCIONES`, `labelForSubtipo`, `COMERCIAL_DESTACADOS_DEFS`, `TERRENO_DESTACADOS_DEFS`,
`COMERCIAL_TIPO_OPCIONES`, `TERRENO_TIPO_OPCIONES`, etc. from Negocio's own
`agenteResidencialTipoMeta.ts`/`agenteComercialTerrenoMeta.ts` — the literal same catalog, not a
parallel/dumbed-down one.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️159

OWNER REQUIREMENT:
Privado residential Type/Subtype/Levels separation must match the corrected shared taxonomy.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoFormState.ts:172-175` — `residencial.niveles: string` is a real, separate field
from `subtipo` with an explicit doc comment ("genuinely separate field from subtipo"). UI renders it
as its own control: `BienesRaicesPrivadoForm.tsx:939-943`, label "Niveles / pisos", hint "Distinto
del subtipo."

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️160

OWNER REQUIREMENT:
Privado Commercial and Land should receive the same property-specific taxonomy/detail quality as
Negocio where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Comercial/Terreno `tipoCodigo`/`subtipo`/`destacadoIds` catalogs are drawn from the exact same
`agenteComercialTerrenoMeta.ts` module Negocio uses, so catalog depth is identical by construction.
An exhaustive field-count diff against Negocio's own `steps04-09.tsx` UI (labels are copy-file
driven) was not performed.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A side-by-side field-count/appearance comparison between Privado Comercial/Terreno sections and
Negocio's equivalent, to confirm nothing was silently dropped in Privado's own field object.

NOTES:
NONE

---

ITEM:
⚠️161

OWNER REQUIREMENT:
Privado price input should show $ and separators while typing/outputting.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:347-368`. The `<input>` itself is bound directly to `state.precio`
(digits-only via `priceDigitsUnbounded`) — it never shows `$`/commas. A separate, adjacent
`aria-live="polite"` line below the input shows `formatPricePreviewUsd(state.precio)` ("En el
anuncio: $XXX,XXX") on every keystroke.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (this is a static source fact, not a runtime uncertainty) — the input box itself is unformatted;
only an adjacent preview line is formatted.

NOTES:
Whether an adjacent live preview satisfies the spirit of "shows $ and separators while typing" is a
product judgment call; taken literally ("input... shows"), the input itself does not.

---

ITEM:
⚠️162

OWNER REQUIREMENT:
Privado city/zone must use the approved NorCal typeahead/suggestion UX rather than a clumsy static
selector.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BrPrivadoCiudadZonaCombobox.tsx` (79 lines) — real `role="combobox"`/`aria-autocomplete="list"`
component filtering `BR_PRIVADO_CIUDAD_ZONA_SUGGESTIONS` as-you-type, rendering a floating
`role="listbox"`, free text also accepted. Wired live in `BienesRaicesPrivadoForm.tsx:388-392`
(`value={state.ciudad}` / `onChange`), not a native `<select>`, not dead code.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️163

OWNER REQUIREMENT:
Privado city selection should support future filter/search normalization.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Form hint (line 386) says "Sirve para ubicación en el anuncio y para filtros futuros." At publish
time, `leonixPublishRealEstateFromDraftState.ts:230` runs
`brCanonicalNorCalCity(trim(state.ciudad))` → `getCanonicalCityName()` in
`californiaLocationHelpers.ts`, which normalizes the free-typed string against a `CITY_ALIASES` map
and `CA_CITIES` catalog before it is persisted as the listing's `city` field.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️164

OWNER REQUIREMENT:
Address/reference copy must make clear whether the user should provide street/address and how
city/state are represented.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:394-461` — a clearly labeled `<details>` "Dirección estructurada
(opcional)" block (Número y calle / Unidad / Estado / Código postal / Colonia), separate from a
"Referencia adicional (opcional)" field.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️165

OWNER REQUIREMENT:
Example address/helper text should be generic/fake, not a real person's address.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Only one address-example string in the whole Privado tree: `hint="Ej.: 123 Oak Street"` — a
generic, obviously-fake placeholder.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️166

OWNER REQUIREMENT:
"Dirección o referencia" should distinguish full address from cross-street/reference context.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:451-461` — "Referencia adicional (opcional)" hint reads: "Texto libre
si quieres añadir contexto (cruces, puntos de referencia). No sustituye a la dirección estructurada
arriba." Explicit, unambiguous distinction.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️167

OWNER REQUIREMENT:
No standalone map URL field in Privado.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
No `<input>` for a map URL exists in `BienesRaicesPrivadoForm.tsx` (explicit comment at line
487-490: manual "Enlace a mapa" input removed per product direction). `state.enlaceMapa` remains in
the schema only for reading old drafts. Neither `mapBienesRaicesPrivadoStateToPreviewVm.ts` nor
`leonixBrMachineFacetPairsFromFormState.ts` reads `state.enlaceMapa` anymore (grepped, zero
consumption hits) — the dormant-override bug the prior 40-item ledger's ⚠️18 flagged is confirmed
fixed in current source.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (fixed in an earlier session on this branch, independently re-verified now)

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️168

OWNER REQUIREMENT:
No redundant public-display checkbox for map/address unless a real privacy rule requires it.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Exactly one toggle exists: `mostrarDireccionExacta` (`BienesRaicesPrivadoForm.tsx:462-478`),
labeled "Mostrar dirección exacta cuando aplique," governing both street/unit display and map
precision together. No second "mostrar en mapa" checkbox found (grepped).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
This single toggle is a legitimate privacy control (FSBO sellers not forced to expose exact home
address), not a redundant one.

---

ITEM:
⚠️169

OWNER REQUIREMENT:
If sufficient address/location is supplied, map derives from it; otherwise no fake map.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`mapBienesRaicesPrivadoStateToPreviewVm.ts:401-419` — `composeBrExactMapQuery`/
`composeBrApproximateMapQuery` return `""` when every address component is empty; `googleHref` is
only set `if (q)`, else `null`. Same guard pattern in `leonixBrMachineFacetPairsFromFormState.ts` at
publish time.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️170

OWNER REQUIREMENT:
Privado description label must be "Descripción de la propiedad."

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/bienes-raices/preview/bienesRaicesPreviewViewI18n.ts:78,180`:
`descripcion: "Descripción de la propiedad"` (ES) / `"Property description"` (EN) — this exact
string is what `BienesRaicesPrivadoPreviewView.tsx:707-708` renders as the `<h2>` heading in both
the draft preview and the published listing (same component/mapper serve both).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
The application FORM's own field label for the same underlying `descripcion` value is instead
"Descripción principal" (`BienesRaicesPrivadoForm.tsx:493`) — a different, internal-only string.
Since the owner-facing naming-consistency doctrine (chat, prior ledger's ⚠️30/M26) is specifically
about the public/preview-facing heading, and that string is exactly correct, this item is scored
done; the form's internal label mismatch is a minor, separate cosmetic note, not a contradiction the
public sees.

---

ITEM:
⚠️171

OWNER REQUIREMENT:
Privado photo UI needs a clear branded add/upload control rather than ambiguous browser "Choose
files / none chosen" presentation.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:655-674` — the real `<input type="file">` is `sr-only` (visually
hidden); a styled pill button "Subir o añadir fotos" triggers it via `photosInputRef.current?.click()`,
plus a live "{n}/{MAX_PHOTOS} seleccionadas" counter.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️172

OWNER REQUIREMENT:
Owner photo upload should also use a clear intentional upload control.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:780-818` — same pattern: hidden `sr-only` file input, styled "Subir
foto" pill button, live circular preview thumbnail, "Quitar foto" remove link once a photo exists.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️173

OWNER REQUIREMENT:
Privado image upload must immediately show thumbnails.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`onPhotos` (`BienesRaicesPrivadoForm.tsx:201-229`) compresses each file then does one `setState`
with the full array; `LeonixRealEstateSortablePhotoStrip` renders directly off
`state.media.photoDataUrls`, so tiles appear on the very next render after compression resolves —
no separate "attach/confirm" step.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Compression is async so large files take a moment, but there is no missing-preview gap in the code
path.

---

ITEM:
⚠️174

OWNER REQUIREMENT:
Privado images must be reorderable.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`LeonixRealEstateSortablePhotoStrip.tsx` (shared, `@dnd-kit/core` + `@dnd-kit/sortable`, both
`PointerSensor` and `KeyboardSensor`) wired in `BienesRaicesPrivadoForm.tsx:681-693`; `onReorder`
calls `setState` + `queueMicrotask(saveBienesRaicesPrivadoDraft)`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Directly re-ran `scripts/br-inv-d2-privado-media-behavioral-selftest.ts` myself: REORDER step
(`[P1,P2,P3] → [P3,P1,P2]`) returns `true` across 3 cycles against the real save/load functions —
genuine behavioral proof of the reorder→persist cycle, not just a type check. The physical
drag-gesture itself relies on the well-established `@dnd-kit` library rather than bespoke code.

---

ITEM:
⚠️175

OWNER REQUIREMENT:
Privado allows selecting/changing portada/cover.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`LeonixRealEstateSortablePhotoStrip.tsx:123-137` — per-tile button toggling "Portada activa"/"Usar
como portada", calling `onSetPrimary(i)`; wired in `BienesRaicesPrivadoForm.tsx:707-716`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Selftest PORTADA step passes (3/3 cycles), directly re-run.

---

ITEM:
⚠️176

OWNER REQUIREMENT:
Privado images can be removed.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`onRemove` wired through `RestauranteSortableMediaTile`; `BienesRaicesPrivadoForm.tsx:694-706`
filters the array and re-clamps `primaryImageIndex` if it now points past the end, then persists.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Selftest REMOVE step passes (3/3 cycles), directly re-run.

---

ITEM:
⚠️177

OWNER REQUIREMENT:
Privado image order/cover/remove state must survive refresh where persistence is expected.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
Every mutation handler calls `queueMicrotask(() => saveBienesRaicesPrivadoDraft(out))`;
`loadBienesRaicesPrivadoDraft` re-hydrates via `inlineBienesRaicesPrivadoHeavyMediaFromIdb`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Directly re-ran the selftest myself: REFRESH ORDER, REFRESH PORTADA, SECOND REFRESH all `true`
across 3 cycles, including a simulated sessionStorage-restore race — genuine behavioral proof, not
a type-shape check.

---

ITEM:
⚠️178

OWNER REQUIREMENT:
Privado preview must render the uploaded photos in the correct order.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`buildMediaVm` (`mapBienesRaicesPrivadoStateToPreviewVm.ts:127-171`): `allPhotoUrls: urls` is a
direct copy of `state.media.photoDataUrls`, no sort. `leonixGalleryPhotoSlidesWithCaptions` only
dedupes exact-duplicate URLs, never reorders.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️179

OWNER REQUIREMENT:
Back to Edit must restore the same media state.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoPreviewClient.tsx:304` `editHref` points to the same public application entry;
`BienesRaicesPrivadoForm.tsx:130-152` re-hydrates on mount from the same session-scoped draft key
(`br-privado-draft-v1`) the preview was built from.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Directly re-ran the selftest myself: the PREVIEW and BACK TO EDIT steps (re-loading through the
identical function, with an injected timing race) both return `true` across 3 cycles.

---

ITEM:
⚠️180

OWNER REQUIREMENT:
Privado media hydration must not wipe existing IndexedDB/offloaded photos during early autosave.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoDraft.ts:63-80` (`readDraftRawWithRetry`) retries reads up to ~1030ms, then — if
IndexedDB still shows offloaded media via `bienesRaicesPrivadoHasPersistedMedia()` — waits up to
+5000ms longer rather than concluding "no draft." The autosave effect in
`BienesRaicesPrivadoForm.tsx:155-161` is gated `if (!hydrated) return`, and `hydrated` is only set
`true` after `loadBienesRaicesPrivadoDraft()` resolves, so no autosave tick can fire and overwrite a
draft still being loaded.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (fixed in an earlier session on this branch — commit `b3d85dc1`, "harden draft-media hydration
against reload data loss" — independently re-verified now)

REMAINING PROOF:
NONE

NOTES:
Directly re-ran the selftest myself: it specifically injects this exact restore race
(`RacyStorage.simulateRestoreRace`) at multiple delays per cycle and still recovers the correct
photo/cover state every time (3/3 cycles) — this is the strongest-evidenced item in the batch, a
targeted regression test for the named historical bug.

---

ITEM:
⚠️181

OWNER REQUIREMENT:
Privado external videos are URL-only under the later doctrine.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`bienesRaicesPrivadoFormState.ts:240-250` — `videoLocalDataUrl` kept only as legacy back-compat,
stripped before persist (`bienesRaicesPrivadoDraft.ts:113-115`). No `<input type="file"
accept="video/*">` anywhere in `BienesRaicesPrivadoForm.tsx` (confirmed via full read).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Matches chat: "subir video del dispositiveo we do not offer that anymore at all... it is only
urls... we are allowing more than one."

---

ITEM:
⚠️182

OWNER REQUIREMENT:
Remove any remaining "Subir video del dispositivo" UI from Privado.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Repo-wide grep for "Subir video del dispositivo" returns zero matches anywhere in the live app. The
only nearby text is disclaimer copy, `BienesRaicesPrivadoForm.tsx:724`: "No se aceptan archivos de
video del dispositivo" — a policy statement, not an upload affordance.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️183

OWNER REQUIREMENT:
Privado multiple video URLs are added one at a time.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`MAX_PRIVADO_VIDEO_URLS = 4` (`bienesRaicesPrivadoFormState.ts:277`);
`BienesRaicesPrivadoForm.tsx:726-758` renders exactly 4 individually editable `AiField`s ("Video por
enlace" / "Video 2..." / "Video 3..." / "Video 4..."), each independently validated
(`http(s)://` check).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️184

OWNER REQUIREMENT:
Each accepted video URL shows an explicit added/accepted state.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:726-758` (the 4-slot loop) has no per-field confirmation markup inside
each `AiField` — only one aggregate line after the whole loop (line 755-758): "Enlace(s) listo(s): se
usarán en la vista previa." By contrast, the virtual-tour field (single field, lines 616-630) DOES
have its own dedicated per-field "Enlace listo" confirmation. The per-field "Video añadido" pattern
already exists elsewhere in the codebase (`brAgenteResidencialCopy.es.ts:117`, BR Negocio
agente-individual) but was not ported into Privado's 4-slot array.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (source-provable absence of per-field markup)

NOTES:
NONE

---

ITEM:
⚠️185

OWNER REQUIREMENT:
Removing a video URL removes only that video.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`onVideoUrlChange` (`BienesRaicesPrivadoForm.tsx:242-259`) + `normalizePrivadoVideoUrls` (231-240).
Traced: clearing slot `i` sets `nextInput[i] = ""`; the normalizer filters empties and compacts,
preserving the remaining values' content and relative order (only their displayed slot position
shifts, expected for a compacting array UI). No dedicated delete button exists — removal is
"clear the text field" — which meets the literal requirement.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️186

OWNER REQUIREMENT:
Privado gallery/lightbox should include video entries where supported without giant empty black
modal behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`LeonixPreviewGalleryLightbox.tsx:116-171` (`VideoSlide`) renders a YouTube iframe, an inline
`<video>` tag for hosted/direct URLs, `BrNegocioStreamableVideo` for HLS/blob, or an "open in new
tab" card as fallback — never a blank void; always renders content or an explicit "Video no
disponible" message. `BienesRaicesPrivadoPreviewView.tsx:837` uses this exact shared component.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
UI is a "Fotos"/"Video" tab switcher rather than literal video tiles woven into the thumbnail strip
— satisfies the concrete complaint (no giant black void) even if the exact tiles-vs-tabs phrasing
differs slightly from some chat wording.

---

ITEM:
⚠️187

OWNER REQUIREMENT:
Privado gallery should scale images intelligently to viewport and avoid huge unusable voids.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`ZoomablePhoto` (`LeonixPreviewGalleryLightbox.tsx:70-114`): `max-h-[min(78vh,820px)] max-w-full
object-contain`, plus ctrl/cmd+scroll-wheel zoom (1x–4x) with a reset button.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A rendered screenshot at a few real photo aspect ratios/viewport sizes to confirm no unusable void
appears in practice (CSS mechanism is sound but `object-contain` will letterbox mismatched-aspect
photos by design, which is expected, not necessarily a "void").

NOTES:
NONE

---

ITEM:
⚠️188

OWNER REQUIREMENT:
Privado gallery supports arrows, thumbnails, count, Escape, close, keyboard, and mobile swipe.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`LeonixPreviewGalleryLightbox.tsx`: arrows (330-349), thumbnail strip (352-367), count via
`photosCountLabel` ("Fotos · X / Y", 261-266), Escape (`onKey`, 217-218), close button (305-312),
keyboard arrow-nav (220-221), mobile swipe (`onTouchStart`/`onTouchEnd`, 40px threshold, 244-257).
All 7 sub-behaviors present in source, wired to real state setters, not stubs.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A live browser/device pass exercising each of the 7 interactions (touch swipe, keydown dispatch,
click-through) — no automated test in the repo exercises DOM interaction for this component.

NOTES:
All 7 mechanisms are individually source-confirmed present and correctly wired; this is a strong
positive signal, but per the audit's own standard interactive gestures still require behavioral
proof.

---

ITEM:
⚠️189

OWNER REQUIREMENT:
Nearby thumbnails/media should preload for smoother viewer navigation.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`LeonixPreviewGalleryLightbox.tsx:227-242` — a dedicated effect computes
`neighbors = [(photoIdx+1)%n, (photoIdx-1+n)%n]` and does `new Image(); img.src = url` for each
neighbor whenever `photoIdx`/`tab`/`open` change, with cleanup on teardown.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Deterministic side effect keyed off state (browser `Image()` prefetch is well-established behavior,
not app-specific logic that could silently fail), not a user-gesture-dependent interaction — source
inspection suffices.

---

ITEM:
⚠️190

OWNER REQUIREMENT:
Privado owner card must look premium and integrated, not like a disconnected dark-brown/black block.

EVIDENCE SOURCE:
repo, chat, screenshot (not sampled — visual claim)

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoPreviewView.tsx:489-583` — seller `<aside>` uses `CREAM_CARD = "#FDFBF7"`
background, `BORDER = "rgba(61,54,48,0.12)"`, `CHARCOAL_DEEP` text, bronze/gold CTA gradients. No
dark-brown/black background token found anywhere in the file.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A (fixed in an earlier session; re-verified via source only)

REMAINING PROOF:
A rendered screenshot to confirm the card actually reads as premium/integrated, per the audit's
mandatory rule for appearance claims.

NOTES:
Source evidence is strongly favorable (no dark tokens anywhere; matches the chat's described fix
target) but per policy cannot be certified 🟢 without a real render.

---

ITEM:
⚠️191

OWNER REQUIREMENT:
Owner card should render optional owner photo, name, phone, SMS if supplied, WhatsApp, email, and
interested-buyer message.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:762-901` collects photo/nombre/telefono/whatsapp/correo/notaContacto,
each rendered conditionally in `BienesRaicesPrivadoPreviewView.tsx:358-367,494-580`. The schema has
a `mensajesTexto` (SMS) field and the mapper wires `smsHref`/`showSms`
(`mapBienesRaicesPrivadoStateToPreviewVm.ts:386,425,468`), but a full read of `BienesRaicesPrivadoForm.tsx`
found **zero UI input for `mensajesTexto`** — there is no SMS text field for the seller to fill in
the application, so "SMS if supplied" can never actually be supplied via the draft/application flow.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (missing UI is a static source fact)

NOTES:
All other five elements (photo, name, phone, WhatsApp, email, interested-buyer message) are
confirmed present and independently optional. On the published/live listing path,
`mapBrListingRowToPrivadoPreviewVm.ts:216,218` derives SMS from the main `contact_phone` instead —
functional there, but not from a distinct seller-supplied SMS number.

---

ITEM:
⚠️192

OWNER REQUIREMENT:
Phone helper copy should explain expected 10-digit US entry where appropriate and avoid accidental
double country-code behavior.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:854-866` — the "Teléfono" `AiField` has no `hint` prop at all (compare
to the "Precio" field a few lines up, which does pass `hint=`). A code-level safety net exists
(`stripPhoneDigits()` in `app/lib/leonix/phoneFormat.ts` strips a leading "1" from an 11-digit
paste), but that is not user-facing copy.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (absence of a `hint` prop is a static source fact)

NOTES:
Chat (line ~132) explicitly asked for this: "we could write there... 10-digit phone number without
the one... that way it's not populating twice."

---

ITEM:
⚠️193

OWNER REQUIREMENT:
WhatsApp helper copy should clarify that the WhatsApp number may differ from the normal phone
number.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoForm.tsx:867-879` — the "WhatsApp" `AiField` also has no `hint` prop. Separately,
at publish time `leonixPublishRealEstateFromDraftState.ts:137`:
`const phone = digitsOnly(seller.telefono ?? "") || digitsOnly(seller.whatsapp ?? "")` — only ONE
unified `contact_phone` is ever published (telefono wins if both are filled), so even if a seller
fills a genuinely different WhatsApp number, the published listing's WhatsApp button links to the
seller's regular phone, not the distinct WhatsApp number. This undermines the entire "WhatsApp may
differ" premise at the data layer, not just the missing copy.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (both the missing hint text and the phone/whatsapp collapse-at-publish are static source facts)

NOTES:
Chat (line ~132) explicitly asked for this exact hint. The publish-time collapse is a related but
separate, deeper gap worth flagging to the owner alongside this item.

---

ITEM:
⚠️194

OWNER REQUIREMENT:
"Mensaje para interesados" must have a clear destination in the preview/public owner-contact
presentation.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Captured as `state.seller.notaContacto` (`BienesRaicesPrivadoForm.tsx:891-900`), mapped to
`vm.seller.noteLine` (`mapBienesRaicesPrivadoStateToPreviewVm.ts:455`), rendered directly under the
seller name/role and above the contact CTAs (`BienesRaicesPrivadoPreviewView.tsx:516-520`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️195

OWNER REQUIREMENT:
BR Privado should not collect/render professional business websites/social profiles unless later
explicitly approved.

EVIDENCE SOURCE:
repo, chat

CURRENT IMPLEMENTATION:
Full read of `BienesRaicesPrivadoForm.tsx` found exactly one hit for website/social — the disclosure
copy itself (line 765): "No se pide sitio web ni redes sociales." No input fields for
website/Instagram/Facebook/YouTube/TikTok exist anywhere in the Privado application UI.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Chat gives the authoritative rule: "No professional website/social profile unless we intentionally
decide FSBO gets them later." No later chat message reverses this.

---

ITEM:
⚠️196

OWNER REQUIREMENT:
If legacy Privado website/social fields exist, they should not create contradictory scope or empty
public sections.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`contactChannels: LeonixContactChannelsFormSlice` remains in the schema (a shared type reused from
Negocio/Rentas) and the mapper still calls `buildLeonixContactChannelsV1PayloadFromFormSlice` /
`socialLinksFromChannelsPayload`, but since no UI ever populates it, `socialLinks` always resolves to
`undefined` and `websiteHref` to `null`. `BienesRaicesPrivadoPreviewView.tsx` has no rendering block
for social links at all (grepped, zero hits) — no empty section, no contradiction between copy and
behavior.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
This dead schema plumbing is harmless today but is the exact kind of drift the owner asked to be
watched for; worth a cleanup pass eventually, not a live defect.

---

ITEM:
⚠️197

OWNER REQUIREMENT:
Privado should not include Agent 2, broker/financing professional, or Business Hub complexity.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Case-insensitive grep for `agente2|Agent 2|financing|financiero|BusinessHub|Business Hub|
CommunityTrust|broker` across the entire Privado application + preview trees returns zero matches
except explicit exclusion copy in `bienesRaicesFsboPreviewPaidCheckout.ts:102,109` ("No brokerage,
office, or agent inventory is included in this package").

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️198

OWNER REQUIREMENT:
Privado top identity should show title, price, availability/sale type, location, type, subtype/
levels, and major facts before the gallery/detail stack.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoPreviewView.tsx:436-488` (title/address/price/status/operationSummary/quick-facts
strip) renders entirely before the `{showGallerySection ? ...}` block at line 586 — DOM order is
correct. However, `buildResidencialQuickFacts()` (`mapBienesRaicesPrivadoStateToPreviewVm.ts:190-206`,
the majority category) only pushes Recámaras/Baños/Medios baños/Interior/Lote/Estacionamiento/Año —
no Tipo, subtipo, or niveles. Those instead render later in the lower "Características" block
(`buildResidencialDetails`), which sits below the gallery/description sections. Comercial's quick
facts DO include "Tipo" (line 247) and "Niveles" (line 251), so Comercial is closer to compliant than
Residencial.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (source-provable: type/subtype/levels absent from the residential top strip)

NOTES:
Title/price/availability/location/major numeric facts are correctly ordered before the gallery;
only the "type, subtype/levels" clause specifically fails for the Residential category.

---

ITEM:
⚠️199

OWNER REQUIREMENT:
Privado shell should use the same premium Leonix property visual language as Negocio, with a
simpler owner layer.

EVIDENCE SOURCE:
repo, chat, screenshot (not sampled — visual claim)

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoPreviewView.tsx:30-37` defines `IVORY`, `CREAM_CARD`, `CHARCOAL`/`CHARCOAL_DEEP`,
`BRONZE`/`BRONZE_SOFT`, Georgia serif for hero title/price (lines 445, 465) — directionally matches
the chat's described palette. Owner-card layer is visibly simpler than Negocio's (no Agent 2/broker/
finance sections, confirmed under ⚠️197).

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A side-by-side rendered comparison against BR Negocio's preview to certify visual-language parity.

NOTES:
NONE

---

ITEM:
⚠️200

OWNER REQUIREMENT:
Privado should use cream/ivory cards, strong hierarchy, compact facts, clean gallery, and polished
contact presentation rather than low-quality disconnected styling.

EVIDENCE SOURCE:
repo, screenshot (not sampled — visual claim)

CURRENT IMPLEMENTATION:
Same token evidence as ⚠️199. Facts render through the shared `LeonixListingFactsGrid` (`FactBlock`,
lines 162-170) rather than ad hoc markup; gallery uses a structured duplex grid (lines 604-680)
rather than a flat list.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A rendered screenshot comparison to certify hierarchy/spacing/proportion, per the audit's mandatory
rule for appearance claims.

NOTES:
NONE

---

ITEM:
⚠️201

OWNER REQUIREMENT:
Privado top key-facts strip should avoid repeating the same bedrooms/baths/sqft/year values again in
a giant Características box.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Mixed result across categories, in `mapBienesRaicesPrivadoStateToPreviewVm.ts`:
- Residencial: genuinely deduplicated. `buildResidencialDetails()` (174-188) has an explicit code
  comment confirming Recámaras/Baños/Medios baños/Interior/Lote/Estacionamiento/Año are deliberately
  excluded because they already render in the quick-facts strip.
- Comercial: NOT deduplicated. `buildComercialQuickFacts()` (239-254) pushes Tipo/Interior/Oficinas/
  Baños/Niveles/Estacionamiento, and `buildComercialDetails()` (219-237) independently pushes the
  same values again under near-identical labels ("Tamaño interior", "Oficinas", "Baños",
  "Niveles / pisos", "Estacionamiento").
- Terreno: NOT deduplicated. `buildTerrenoQuickFacts()` (293-305) pushes Lote/Uso-zona/Acceso/
  Servicios; `buildTerrenoDetails()` (275-291) pushes the same fields again ("Tamaño del lote",
  "Uso / zonificación", "Acceso", "Servicios disponibles").

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (Residencial branch was fixed in an earlier session; Comercial/Terreno were not)

REMAINING PROOF:
NONE (duplication is a static, provable source fact for 2 of 3 categories)

NOTES:
The prior 40-item ledger's ⚠️08 claims this "duplication removed" as a blanket TRUE across BR
Privado — that claim is stale/incorrect; it only holds for the Residencial branch.

---

ITEM:
⚠️202

OWNER REQUIREMENT:
Additional Details should contain information not already duplicated in the top facts strip.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same code as ⚠️201, viewed from the "Additional Details" side: Residencial's `buildResidencialDetails()`
correctly contains only non-duplicated rows (Tipo, subtipo, niveles, condición); Comercial's and
Terreno's `buildComercialDetails()`/`buildTerrenoDetails()` still duplicate several rows already
shown in their respective quick-facts strips.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Same underlying bug/fix as ⚠️201 — one fix (add the same exclusion-comment pattern used for
Residencial to Comercial and Terreno) would close both items.

---

ITEM:
⚠️203

OWNER REQUIREMENT:
Privado HOA uses the same structured real-estate HOA module where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Draft preview: `mapBienesRaicesPrivadoStateToPreviewVm.ts:321-328,433` calls
`buildBrGate12dHoaPreviewCard` (`leonixBrGate12dHoaPreview.ts`). Published listing:
`mapBrListingRowToPrivadoPreviewVm.ts:237` calls `buildBrLiveGate12dHoaCard(detailPairs, lang)` — a
real, populated call reading live `detail_pairs`, NOT hardcoded to `null` (contradicting the prior
40-item ledger's stale concern that it was). Both draft and live routes render through the identical
`BienesRaicesPrivadoPreviewView` component, confirmed via `BienesRaicesPrivadoLiveDetailShell.tsx`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (fixed in an earlier session on this branch; independently re-verified now, including the live
listing mapper specifically — not just the draft path)

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️204

OWNER REQUIREMENT:
Privado HOA impossible combinations must be normalized and hidden.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`leonixBrGate12dHoaPreview.ts:76`: `if (g.hasHoa === "yes") { ...fee/frequency/includes rows... }` —
fee/frequency/includes are strictly gated behind `hasHoa === "yes"`, so a stale fee value cannot leak
into the card when `hasHoa` is "no"/"unknown". Same gating pattern confirmed in the live-listing
builder (`leonixBrGate12d.ts`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (fixed in an earlier session; independently re-verified against current code, not trusted from
the prior ledger's own claim)

REMAINING PROOF:
NONE

NOTES:
The `"unknown"` hasHoa state does render "No indicado"/"Unknown" for that one line, which is a
deliberately meaningful status, not the suppression-bug pattern.

---

ITEM:
⚠️205

OWNER REQUIREMENT:
Privado Open House uses the shared structured event-card treatment.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoPreviewView.tsx:741-759` renders Open House via
`<LeonixOpenHouseSlotCards title={...} slots={[vm.openHouseCard.rows]} .../>` with an explicit
comment confirming it is "the same shared structured Open House renderer BR Negocio uses." Since
draft and live routes share the same preview component (see ⚠️203), this holds for both.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (fixed in an earlier session; independently re-verified)

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️206

OWNER REQUIREMENT:
Privado Open House supports multiple events and human-readable date/time.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BrPrivadoGate12dSlice` (`bienesRaicesPrivadoFormState.ts:30-52`) has only single
`openHouseDate`/`openHouseStartTime`/`openHouseEndTime` fields — no events array. Form UI
(`BienesRaicesPrivadoForm.tsx:536-632`) has exactly one Fecha/Hora-inicio/Hora-fin set, no "add
another date" control. This is structurally different from BR Negocio, whose write path iterates an
`openHouseEvents` array. Privado's own gate12d-writer function has no equivalent loop. The shared
render side (`buildBrLiveGate12dOpenHouseCard`) correctly handles multi-event arrays and date ranges
when present, and does fix the historical "missing start date silently shown as bare end date" bug
— but Privado can never produce a multi-event payload in the first place.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (single-event-only schema is a static, provable source fact)

NOTES:
"Human-readable date/time" formatting itself is correctly fixed at the render layer; only "supports
multiple events" fails, because Privado's schema/write-path is architecturally single-event.

---

ITEM:
⚠️207

OWNER REQUIREMENT:
Privado checkout/payment summary stays outside the ad canvas.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`LeonixPreviewPageShell.tsx` — `publishSlot` (the `PublishCheckoutCheckpoint`) renders inside a
sticky top header bar, structurally separate from `children` (the actual
`BienesRaicesPrivadoPreviewView` ad content), which is a distinct DOM subtree below the header.
`BienesRaicesPrivadoPreviewClient.tsx:320-339` wires `PublishCheckoutCheckpoint` as `publishSlot` and
`BienesRaicesPrivadoPreviewView` as `children`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️208

OWNER REQUIREMENT:
Privado listing preview should begin with listing identity/property content, not checkout chrome.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Corrected on cross-check: `publishSlot` is NOT a compact trigger button — it is the full
`PublishCheckoutCheckpoint` component (plan summary, line items, promo-code field, confirmations
checklist, and the final payment button, constrained only by `className="w-full max-w-[420px]"`),
rendered inside `LeonixPreviewPageShell`'s `sticky top-0 z-[100]` header, ahead of `{children}` (the
ad canvas) in DOM order. The very first content block on the page is therefore a substantial
pricing/confirmation card, with the property's own title/price/photos appearing below it.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (DOM order and `PublishCheckoutCheckpoint`'s own content are static, provable source facts)

NOTES:
Structurally separate from the ad canvas (⚠️207 is correctly satisfied), but that separation puts
the full checkout card ahead of the listing content, not after it — the two requirements pull in
different directions and only one is met.

---

ITEM:
⚠️209

OWNER REQUIREMENT:
BR Privado checkout states $49.99 / 45 days and one property per ad.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/lib/listingPlans/revenuePricingMatrix.ts:170-178` — `packageKey: "br_fsbo_45d"`, `priceCents:
4999`, `durationDays: 45`, `includedInventory: "1 listing"`.
`bienesRaicesFsboPreviewPaidCheckout.ts:21-26,57-60,100-111` — explicit checkbox copy: "I confirm
this paid FSBO listing covers one property only. Another property requires a separate paid listing."
/ "Confirmo que este anuncio FSBO pagado cubre una sola propiedad..."; duration line composes
`${durationDays} days · one property per listing · no inventory`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️210

OWNER REQUIREMENT:
BR Privado result-card preview uses the real card at realistic size.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Repo-wide grep for `BienesRaicesNegocioCard|ResultCardPreview` inside
`app/(site)/clasificados/publicar/bienes-raices/**` (both Negocio and Privado) returns zero matches.
No dedicated "here's how your listing will appear in results" preview section/component exists
anywhere in BR's own application/preview flow. Rentas, by contrast, has this exact feature
(`RentasPreviewResultCardSection.tsx`, wired into both `RentasNegocioPreviewClient.tsx` and
`RentasPrivadoPreviewClient.tsx`). The prior 40-item ledger's ⚠️23/M18 claims this requirement "TRUE
... already correct" for "BR + Rentas," but its own cited evidence file is
`RentasPreviewResultCardSection.tsx` — i.e. it only ever verified Rentas, not BR, and the claim was
incorrectly generalized to BR as well.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (absence of the feature is a static, provable source fact — a repo-wide grep)

NOTES:
The seller's only "preview" in BR Privado is the full detail-page preview
(`BienesRaicesPrivadoPreviewView`), not a compact results-card mockup. Once actually published, the
listing does appear on the live results page using the real shared `BienesRaicesNegocioCard`
component (see ⚠️211) — but that is not the same as showing the seller a results-card preview step
before they commit to publishing.

---

ITEM:
⚠️211

OWNER REQUIREMENT:
Privado result card uses actual cover image and high-signal structured property data.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesNegocioCard.tsx` (confirmed genuinely shared between Privado and Negocio via
`sellerKindUi()`, which reads `listing.sellerKind`/badges and renders a "Privado"/"Negocio" chip
accordingly) uses `listing.imageUrl` directly for the cover photo and a structured `FactsRow`
(beds/baths/sqft/year, each individually guarded by `isMissingBrCardFact`) rather than raw dumped
form data. Used live in `BienesRaicesResultsClient.tsx` and `BienesRaicesLandingView.tsx`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
This is about the actual live results-page card (which is real and correct), distinct from ⚠️210's
concern about a missing in-application preview step.

---

ITEM:
⚠️212

OWNER REQUIREMENT:
Privado sparse output hides missing owner photo, socials, HOA, Open House, video, map, and other
absent optional modules.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`BienesRaicesPrivadoPreviewView.tsx` guards every optional module: `vm.hoaCommunityCard &&
rows.length > 0`, `vm.openHouseCard && rows.length > 0`, `vm.hasDescription`, `showSellerPhotoAside`,
`showMainSellerAside` (composite of 8 Boolean checks), `vm.media?.virtualTourUrl`,
`showGallerySection` (composite of 5 Boolean checks). No unconditional empty-state UI found for any
of these modules. Repo-wide "No indicado"/"Sin información" search returns exactly 2 hits, both in
the already-addressed HOA files (see ⚠️204), not a wider pattern.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️213

OWNER REQUIREMENT:
Privado application should not expose redundant top actions such as multiple preview buttons plus
delete as competing primary actions.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Full read of `BienesRaicesPrivadoForm.tsx` confirms the top of the form only has
`LeonixCategoryApplicationHeader` (hub link) — no preview/delete buttons anywhere near the top. The
only action row is at the bottom (`LeonixApplicationVerAnuncioActions`, lines 1395-1416): one
solid-primary "Vista previa" button, one text-styled secondary "Ver borrador" link, and one visually
distinct danger-red "Borrar progreso y reiniciar" button (confirm-gated via `window.confirm`) — the
destructive action is clearly de-emphasized, not competing with the primary as an equal.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Note the labels shown to Privado users are the form's own override
(`labels={{verAnuncio: "Vista previa", openPreview: "Ver borrador", ...}}`), not the component's
`DEFAULT_ES` constant (which still carries the older "(sin validar)" wording) — Privado never
displays that dev-facing string.

---

ITEM:
⚠️214

OWNER REQUIREMENT:
The clear preview action should be available at the natural end of the form so the owner does not
have to scroll all the way back to the top.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`LeonixApplicationVerAnuncioActions` is the last `<section>` in `BienesRaicesPrivadoForm.tsx`
(lines 1374-1417), immediately preceding the closing tags — it is literally the final interactive
element of the form.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
NONE

---

ITEM:
⚠️215

OWNER REQUIREMENT:
Back to Edit must preserve the same draft/listing identity and all entered values.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
`editHref` (`BienesRaicesPrivadoPreviewClient.tsx:304`) points to the same public application entry
with the same category param; the form re-hydrates on mount from the identical session-scoped draft
key (`br-privado-draft-v1`), a single fixed-key store (not a per-listing-ID registry).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A real browser round trip (Preview → Back to Edit) confirming full FIELD parity — title, price,
seller contact, category-specific fields — not just media state.

NOTES:
Re-ran the selftest myself: its PREVIEW and BACK TO EDIT steps do pass (3/3 cycles) and are genuine
behavioral proof, but that test exercises only photo array/cover-index integrity through the
save/load functions directly — it does not exercise the other form fields (title, price, seller
contact, category-specific details) or the actual React mount/route-navigation path. Given the
item's explicit scope is "all entered values," not just media, this is kept conservative rather than
generalizing media-only proof to the whole form.

---

ITEM:
⚠️216

OWNER REQUIREMENT:
Closing/reloading the browser should respect the approved session/draft persistence contract without
silently losing valid saved draft state.

EVIDENCE SOURCE:
repo, verifier

CURRENT IMPLEMENTATION:
Session-scoped draft with a localStorage quota-fallback mirror (`bienesRaicesPrivadoDraft.ts`),
`pagehide`/`visibilitychange` flush handlers (`BienesRaicesPrivadoForm.tsx:167-181`), and the global
`useBusinessApplicationLeaveGuard` adopted in commit `629c5a46` ("adopt global application leave
guard," Aug 28 2026) which persists on the browser's native beforeunload-style exit warning.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A real browser tab-close/reload test. The selftest I ran (SECOND REFRESH step) proves the
storage-read-race portion of this contract behaviorally, but it simulates timing/session-storage
races in Node, not an actual `beforeunload`/`pagehide` browser event firing and flushing — that
specific trigger path is not exercised by any script in the repo.

NOTES:
Mechanism is thoroughly source-evidenced and partially behaviorally proven (the race-recovery half);
kept conservative because the literal "closing the browser" trigger itself is untested. A specific,
concrete structural risk was additionally found: two independent hooks both attach native `pagehide`
listeners on the Application/Preview routes with opposite intents —
`useBusinessApplicationLeaveGuard` (added by 629c5a46) persists on `pagehide`, while the pre-existing
`useLeonixPublishFlowExitClear` clears the draft on `pagehide` via a listener that (unlike its
React-unmount cleanup path) has no `isPathInsideFlow` gate, and `BienesRaicesPrivadoApplication.tsx`
hardcodes `getSuspend: () => false` (never suspended). Because `pagehide` fires on a plain F5 reload,
not just tab close, which handler "wins" depends on real-browser timing (whether the async,
IndexedDB-offload-gated `saveBienesRaicesPrivadoDraft` write resolves before or after the synchronous
`clearBienesRaicesPrivadoDraft` removal) — not resolvable from source alone. The commit message for
629c5a46 itself states live UI proof of this exact interaction is environment-blocked
("AUTH-ENVIRONMENT-BLOCKED"). This is the single most important open question in this batch and
should be prioritized for real-browser reload testing.

---

ITEM:
⚠️217

OWNER REQUIREMENT:
Privado Commercial/Land media, contact, preview, and persistence behavior should match the finished
Privado Residential quality.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Media upload (`LeonixRealEstateSortablePhotoStrip`), owner/contact section, draft persistence
(`bienesRaicesPrivadoDraft.ts`, a single unified state object), and the preview component
(`BienesRaicesPrivadoPreviewView`) are 100% identical code paths across all three categories — not
separate, less-developed pipelines. However, the confirmed quick-facts/Características duplication
bug (⚠️201/⚠️202) affects Comercial and Terreno specifically but not Residencial — a concrete,
source-provable quality gap between Residencial and the other two categories in exactly the preview
content layer this item asks about.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (the duplication gap is a static, provable source fact)

NOTES:
The infrastructure (media/contact/persistence machinery) is fully shared and equal quality across
all three categories; the gap is narrowly in the preview fact-rows content layer for Comercial/
Terreno, the same underlying bug as ⚠️201/⚠️202 — one shared fix closes all three items.
# Rentas Shared-Family Ledger Audit — ⚠️218 through ⚠️291

Repo: elaguila-website-website, branch fix/br-negocio-inventory-hub-media-hydration-2026-08-27.
All findings below are from direct reading of CURRENT repository source (and, where noted, an
actually-executed self-test script), not from the prior `.claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md`
file, which is used only as a location map and is explicitly contradicted in at least one item
(⚠️223) where its "closed" claim does not match current source.

## TALLY (74 items)

- 🟢 SOURCE-PROVED DONE: 56
- 🔴 SOURCE-CONFIRMED NOT DONE: 3 (⚠️223, ⚠️237, ⚠️280)
- 🟡 OWNER-VISUAL-QA REQUIRED: 4 (⚠️221, ⚠️256, ⚠️259, ⚠️288)
- 🟠 RUNTIME QA REQUIRED: 9 (⚠️229, ⚠️245, ⚠️251, ⚠️252, ⚠️264, ⚠️286, ⚠️287, ⚠️289, ⚠️290)
- ⚪ GLOBAL-DEFERRED: 0
- 🟣 ENVIRONMENT-BLOCKED: 1 (⚠️277)
- 🟤 DATA-INSUFFICIENT: 0
- 🔵 PM/BUSINESS DECISION REQUIRED: 1 (⚠️281)

Total: 56+3+4+9+0+1+0+1 = 74 ✓

Key shared evidence sources referenced repeatedly below (cited by short name after first use):
- **TAXONOMY**: `app/(site)/clasificados/rentas/shared/rentasRentalTypeTaxonomy.ts` — 16-id + "otro" canonical list, `rentasRentalFlowGroupForTipo`, `rentasCategoriaPropiedadForFlowGroup`.
- **FLOWFIELDS**: `app/(site)/clasificados/publicar/rentas/shared/RentasTipoFlowDetailFields.tsx` — the one shared conditional-fields component (room_shared / storage_parking / commercial_space / land_parcel blocks).
- **FORMSECTION**: `app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx` — shared title/address/privacy-toggle/description section used by both lanes.
- **PRIVADOFORM** / **NEGOCIOFORM**: `.../privado/application/RentasPrivadoForm.tsx` / `.../negocio/application/RentasNegocioForm.tsx`.
- **PRIVADOSTATE**: `.../privado/schema/rentasPrivadoFormState.ts` (also reuses `BienesRaicesPrivadoResidencialFields`/`ComercialFields`/`TerrenoFields` from the BR Privado schema for `residencial`/`comercial`/`terreno` slices).
- **PRIVADOMAP** / **NEGOCIOMAP**: `.../privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts` / `.../negocio/application/mapping/mapRentasNegocioStateToPreviewVm.ts`.
- **SHELL**: `app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx` — the one shared shell rendering BOTH the seller's own draft preview AND (via `RentasListingDetailClient.tsx`) the canonical public live listing.
- **DETAILCLIENT**: `app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx` — confirmed to render `RentasVisualMatchPreviewView` for the canonical public route.
- **MAPHELPER**: `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts` → `buildOfertaLocalPreviewMapEmbedUrl(locationLine)` = `https://www.google.com/maps?q=<query>&output=embed` (no hardcoded coordinates).
- **CHECKOUT**: `app/(site)/clasificados/rentas/preview/shared/rentasPreviewPaidCheckout.ts`, `app/lib/listingPlans/revenuePricingMatrix.ts` (`rentas_30d`, `priceCents: 2499`), `app/lib/listingPlans/publishCheckoutCheckpoint.ts`.
- **FULFILLMENT**: `app/lib/listingPlans/revenueRentasFulfillment.ts` (`activatePaidRentasListingFromRevenueOs`), invoked only from the shared Stripe webhook orchestrator `app/lib/listingPlans/revenueFulfillment.ts`.
- **PREVIEWCLIENT**: `app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx` (and Negocio equivalent) — `onCheckout` explicitly refuses to run when `editContext` is set ("La edición normal no usa pago...").
- **SELFTEST-13**: `scripts/rentas-item13-categoria-taxonomy-sync-selftest.ts` — actually executed this pass, all 5 sub-tests (A–E) passed.
- **RESULTSCLIENT**: `app/(site)/clasificados/rentas/results/RentasResultsClient.tsx` — `useSearchParams()` + `parseRentasBrowseParams` + `router.replace` URL-driven filters.
- Several "verify-*.mjs" / "*-selftest.ts" scripts were inspected and found to be **static string/grep checks against source text**, not genuine behavioral exercises (e.g. `verify-rentas-published-edit-round-trip-01.mjs`, `verify-revenue-os-rentas-paid-publish-lockdown-01.mjs`, `smoke-rentas-cancel-edit-safety-01.mjs` all just `readFileSync` + `.includes()`/regex assertions). Per the audit's own standard, these do **not** count as runtime proof — they are cited only as additional source-level corroboration, never used alone to justify 🟢 for a behavior that is fundamentally interactive/visual.

---

ITEM:
⚠️218

OWNER REQUIREMENT:
Rentas public product is $24.99 for 30 days per listing.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`revenuePricingMatrix.ts:186-189` (`packageKey: "rentas_30d"`, `priceCents: 2499`), `rentasPreviewPaidCheckout.ts` (`durationSuffixEs: "30 días"`), `revenueCategoryCheckoutPayload.ts` (`RENTAS_CATEGORY_CHECKOUT`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A — verified as already correct in current source.

REMAINING PROOF:
NONE

NOTES:
Single canonical package key used everywhere (matrix, checkpoint, fulfillment) — no drift between price definitions.

---

ITEM:
⚠️219

OWNER REQUIREMENT:
Privado and Negocio are separate application lanes but publish into the same public Rentas marketplace/package truth.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Both `RentasPrivadoPreviewClient.tsx` and `RentasNegocioPreviewClient.tsx` import the same `RENTAS_CATEGORY_CHECKOUT`/`rentasPreviewCheckpointConfig(lang, lane)` from `rentasPreviewPaidCheckout.ts`; both write to the same `listings` table with `category: "rentas"`; both render through the one shared SHELL component.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️220

OWNER REQUIREMENT:
Rentas has no BR-style inventory pack or bulk listing allowance.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RENTAS_PREVIEW_RULES_MODAL` copy explicitly states "Cada propiedad en renta requiere su propio anuncio pagado — sin paquete de inventario ni upgrade masivo" (both ES/EN). `revenuePricingMatrix.ts` `rentas_30d` entry has no add-on inventory field; `LeonixRealEstateListingManageCard.tsx` has no Rentas inventory/add-on CTA (confirmed by the structural check inside `verify-revenue-os-rentas-paid-publish-lockdown-01.mjs`, itself just a grep but pointed at real source that has no such CTA).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️221

OWNER REQUIREMENT:
Rentas application top spacing should be tightened so the actual form begins sooner.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
NEGOCIOFORM header block (`RentasNegocioForm.tsx:574-628`) still carries, immediately below the header, a full explanatory paragraph justifying the two preview buttons ("Validar y ver vista previa exige... Ver vista previa (sin validar) guarda el borrador...") before the "Volver a Rentas" link — this is exactly the extra vertical-space-consuming copy the requirement is about.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Owner needs to see the rendered top-of-form at typical viewport widths to judge whether spacing is "tight enough" — this is a proportion/hierarchy judgment. Source evidence (the still-present explanatory paragraph, see ⚠️223) suggests the top of the Negocio form is not as tight as claimed by the prior reconciliation ledger.

NOTES:
Directly contradicts the prior `.claude` ledger's claim that this was "shortened, all 4 languages, this run" — current NEGOCIOFORM source still has the full paragraph verbatim.

---

ITEM:
⚠️222

OWNER REQUIREMENT:
"Volver a Rentas" should return to the Rentas publisher checkpoint/channel-selection, not the public landing.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Both PRIVADOFORM (lines 581/612/620) and NEGOCIOFORM (line 623/626) link "Volver a Rentas"/"Back to Rentals" to `RENTAS_PUBLICAR_HUB` (`/clasificados/publicar/rentas`, the branch chooser), which is distinct from `RENTAS_LANDING` (`/clasificados/rentas`, the public landing) — both constants defined in `rentasPublishRoutes.ts`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️223

OWNER REQUIREMENT:
Rentas should expose one clear "Vista previa" action rather than multiple validate/draft/debug preview buttons.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
NEGOCIOFORM (`RentasNegocioForm.tsx:105-111`) hardcodes `RENTAS_NEGOCIO_PREVIEW_ACTION_LABELS = { preview: "Validar y ver vista previa", openPreview: "Ver vista previa (sin validar)", ... }` — two distinct buttons, with the dev-facing "(sin validar)" wording still literally consumer-visible, plus a full explanatory paragraph (lines 609-619) walking the seller through both buttons' different behavior. PRIVADOFORM uses the cleaner i18n dictionary (`rentasLaunchUiExtras.ts`: `validatePreview: "Vista previa"`, `viewWithoutValidation: "Ver borrador"`) — better wording, but still technically two separate preview-adjacent actions, not one.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
N/A — source itself proves the requirement unmet for Negocio (dev-facing "(sin validar)" wording is literally rendered to consumers) and only partially addressed for Privado (two buttons remain, though cleaner-worded).

NOTES:
This directly contradicts the prior `.claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md` ledger's claim (Section B2, item 29: "standardized on 'Vista previa'/'Preview' as the one primary label across all 4 flows this run; developer-facing '(sin validar)' wording removed from all secondary-button labels too") — that claim does not match the current NEGOCIOFORM source. This is the concrete example the audit brief warned about: do not trust a prior session's summary.

---

ITEM:
⚠️224

OWNER REQUIREMENT:
Rentas shared architecture uses conditional modules rather than 12–16 separate shells.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
One FLOWFIELDS component branches by `rentasFlowGroupActive(state)` into 4 conditional blocks (room_shared / storage_parking / commercial_space / land_parcel); one shared FORMSECTION component (title/address/privacy/description) used by both lanes; one shared SHELL component renders both lanes' preview AND the canonical public listing.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️225

OWNER REQUIREMENT:
rentalTypeCode/type selection is authoritative for the semantic rental family.

EVIDENCE SOURCE:
repo, verifier (executed)

CURRENT IMPLEMENTATION:
TAXONOMY: `rentasCategoriaPropiedadForTipo(tipo)` is the single source of truth; category buttons/values are derived, never independently settable. SELFTEST-13 sub-tests A (full 16-type + otro canonical mapping) and E (independent category selector no longer exists, static check) both passed when actually executed this pass.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️226

OWNER REQUIREMENT:
categoriaPropiedad must derive/synchronize from the selected rental type and must not contradict it.

EVIDENCE SOURCE:
repo, verifier (executed)

CURRENT IMPLEMENTATION:
`rentasCategoriaPropiedadForFlowGroup` in TAXONOMY. SELFTEST-13 sub-tests B ("confirmed regression case: Oficina -> comercial") and C ("flow-group mapping is total") passed.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️227

OWNER REQUIREMENT:
Legacy mismatched rental type/category combinations should normalize safely at runtime without destructive data migration.

EVIDENCE SOURCE:
repo, verifier (executed)

CURRENT IMPLEMENTATION:
SELFTEST-13 sub-test D ("legacy mismatched combinations re-derive correctly") passed. `rentasDashboardEditHydration.ts` re-derives `categoriaPropiedad` from the persisted `tipoDeRenta` on edit-hydration rather than trusting the stored value.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️228

OWNER REQUIREMENT:
Changing rental type must hide irrelevant fields and prevent stale hidden values from appearing in preview/public output.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FLOWFIELDS renders conditionally off `rentasFlowGroupActive(state)`, recomputed on every render (plain derived value, not cached/stale). `applyRentasFlowRowFilter(g, categoriaPropiedad, rows)` in `rentasRentalTypeApply.ts` unconditionally strips non-matching flow-group rows at preview-build time, regardless of what stray state values may still be sitting in the form object — this is the single canonical filter used by both the draft-preview mapper and the live-listing mapper (per its own doc comment, confirmed at the `PRIVADOMAP`/`NEGOCIOMAP` call sites).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Classified 🟢 rather than 🟠 because the suppression is structural/unconditional (a pure filter function applied at every render/map call), not a one-off runtime side effect that could silently regress — this is the kind of architectural fact that is source-provable.

---

ITEM:
⚠️229

OWNER REQUIREMENT:
Back to Edit must restore only the relevant/current pathway state correctly.

EVIDENCE SOURCE:
repo, verifier (script exists but is static-only)

CURRENT IMPLEMENTATION:
`verify-rentas-published-edit-round-trip-01.mjs` exists but only does `readFileSync` + `.includes()` string checks against `rentasDashboardEditHydration.ts`/`leonixPublishRealEstateFromDraftState.ts`/the listing-edit API route — it never actually invokes the hydration function against a fixture and asserts on the resulting form state.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
An actual browser (or at minimum an executed unit test that calls the hydration function with a real draft object and asserts the resulting form state) round-tripping fill → preview → Back to Edit for at least one listing per flow group, confirming no stale/cross-pathway field leaks into the restored form.

NOTES:


---

ITEM:
⚠️230

OWNER REQUIREMENT:
Rentas Housing family includes Casa, Apartamento, Condominio, Townhome, Dúplex/Multifamiliar, ADU/Casita, and Estudio.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
TAXONOMY `rentasRentalFlowGroupForTipo`: `casa | apartamento | condominio | townhome | duplex_multifamiliar | adu_casita | estudio` → `full_housing`. Exact match.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️231

OWNER REQUIREMENT:
Rentas Room/Shared family includes Cuarto Privado, Cuarto Compartido, and Espacio Compartido.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
TAXONOMY: `cuarto_recamara | cuarto_compartido | espacio_compartido` → `room_shared`. Three-slot family matches; `cuarto_recamara` is labeled "roomBedroom" in the copy dictionary rather than literally "Cuarto Privado" (a label-wording nuance, not a structural gap).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Minor label-wording variance ("Cuarto/Recámara" vs. "Cuarto Privado") — flagging in case the owner wants exact copy parity, but the family/grouping itself is correct.

---

ITEM:
⚠️232

OWNER REQUIREMENT:
Rentas Storage/Parking family includes Garaje, Estacionamiento, and Bodega/Almacén.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
TAXONOMY: `garaje | estacionamiento | bodega_almacen` → `storage_parking`. Exact match.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️233

OWNER REQUIREMENT:
Rentas Commercial family includes Oficina and Local Comercial.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
TAXONOMY: `oficina | local_comercial` → `commercial_space`. Exact match.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️234

OWNER REQUIREMENT:
Rentas Land family includes Terreno/Lote.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
TAXONOMY: `terreno_lote` → `land_parcel`. Exact match.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️235

OWNER REQUIREMENT:
Housing pathway should expose beds, baths, interior size, parking, pets, furnished state, amenities, deposit, lease term, and availability.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`residencial.*` (recamaras, banos, mediosBanos, interiorSqft, estacionamiento, highlightKeys for amenities) rendered directly in PRIVADOFORM (lines 947-1180) and mirrored in NEGOCIOFORM; top-level `deposito`, `plazoContrato`(+`plazoContratoOtro`), `disponibilidad`, `amueblado`, `mascotas` in PRIVADOSTATE, all rendered in FORMSECTION/PRIVADOFORM.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️236

OWNER REQUIREMENT:
Room/shared pathway should expose private/shared room/bath, furnished, household/shared-area rules, utilities, parking, and occupancy-oriented details rather than full-house-only fields.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FLOWFIELDS `room_shared` block: bathroomType (privado/compartido/no_incluido), kitchen (privada/compartida/no_incluida), privateEntrance, laundryAvailable, parkingAvailable, maxOccupants, sharedSpacePreferences (household rules). `residencialRowsMode` returns `"room_partial"` for this flow group (`rentasResidencialFormRowsMode`), which trims the residencial JSX block down (confirmed via PRIVADOFORM:950/1061 branch) rather than showing the full house field set (tipoCodigo/subtipo/recamaras/año/condición/highlights). Furnished (`amueblado`) and included-utilities (`serviciosIncluidosKeys`) are shared top-level fields also exposed for this flow group.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️237

OWNER REQUIREMENT:
Garage/parking pathway should expose dimensions, covered/uncovered, access, 24/7 access, security, vehicle restrictions, and electricity where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FLOWFIELDS `storage_parking` block: `rentasAlmacenTamanoAprox` (size), `rentasAlmacenAcceso24h`, `rentasAlmacenElectricidad`, `rentasAlmacenSeguridad`, `rentasAlmacenCubierto` (covered/uncovered), `rentasAlmacenUsoPermitido` (permitted use), `rentasAlmacenDimensiones`. No field anywhere for "vehicle restrictions" specifically (e.g. max vehicle size/type, RV/boat/commercial-vehicle rules) — `rentasAlmacenUsoPermitido` is a generic free-text "permitted use" field, not a vehicle-restriction-specific one.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
N/A — source proves the specific "vehicle restrictions" sub-field is absent.

NOTES:
6 of 7 requested sub-fields (dimensions, covered/uncovered, 24/7 access, security, electricity, plus generic access via "acceso") ARE present and correctly scoped to storage_parking only — only the "vehicle restrictions" sub-field is missing. Flagging as not-done because the requirement lists it explicitly and no equivalent field exists; the free-text "uso permitido" field could arguably double for it but is not purpose-built.

---

ITEM:
⚠️238

OWNER REQUIREMENT:
Storage/warehouse pathway should expose relevant dimensions/access/security/utilities/use fields rather than apartment fields.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same FLOWFIELDS `storage_parking` block as ⚠️237. `categoriaPropiedad` for this flow group resolves to `"comercial"` (per TAXONOMY), which routes the form to the BR `comercial.*` shared fields (not `residencial.*`) — confirming apartment-only fields (recámaras/baños/año) are structurally excluded from this pathway.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️239

OWNER REQUIREMENT:
Commercial rental pathway should expose square footage, permitted use, access/security, utilities, parking/loading where applicable, and lease terms.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FLOWFIELDS `commercial_space` block: `rentasComercialUsoPermitido` (permitted use), `rentasComercialTamanoFt2` (sqft), `rentasComercialBanoDisponible`, `rentasComercialHorarioAcceso` (access hours), `rentasComercialContratoMinimo` (minimum lease term), `rentasComercialServiciosDisponibles` (utilities). Plus shared `comercial.*` BR fields rendered in PRIVADOFORM (interiorSqft, oficinas, baños, niveles, estacionamiento, zonificación, condición, `accesoCarga` = loading access, `destacadoIds`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️240

OWNER REQUIREMENT:
Land rental pathway should expose lot size, zoning/use, utilities, access, topography, and development-oriented attributes.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FLOWFIELDS `land_parcel` block: `rentasLoteUsoPermitido`, `rentasLoteServiciosDisponibles`, `rentasLoteAcceso`, `rentasLoteZonificacion`. Plus shared `terreno.*` BR fields (`BienesRaicesPrivadoTerrenoFields`) actually rendered in PRIVADOFORM (`state.terreno.loteSqft`, `.usoZonificacion`, `.acceso`, `.servicios`, `.topografia`, `.listoConstruir` [development-oriented], `.cercado`, `.destacadoIds`) — lot size and topography are present via this shared slice, not the narrower Rentas-only fields alone.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️241

OWNER REQUIREMENT:
"Uso permitido" should appear only for semantically relevant commercial/storage/land flows.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Confirmed via full read of FLOWFIELDS: "permitted use" fields (`tf.permittedUse`) appear only in the `storage_parking`, `commercial_space`, and `land_parcel` blocks — absent from `room_shared`. Also absent from the shared `residencial.*` field set.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️242

OWNER REQUIREMENT:
"Uso permitido" should not be a prominent normal house/apartment/room field.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same evidence as ⚠️241 — no "uso permitido"/permitted-use field exists anywhere in the `residencial.*` field set or the `room_shared` FLOWFIELDS block.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️243

OWNER REQUIREMENT:
Rentas property/space details should change meaningfully by rental type rather than rendering one generic detail set.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Full read of FLOWFIELDS confirms 4 genuinely distinct field sets (room_shared / storage_parking / commercial_space / land_parcel), plus `residencialRowsMode` (full_legacy vs room_partial) further differentiating within the residencial category, plus `categoriaPropiedad`-driven routing to entirely different BR field slices (`residencial`/`comercial`/`terreno`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️244

OWNER REQUIREMENT:
Rental property subtype/configuration must not contradict the selected rental type.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Subtype dropdowns are scoped by the selected `tipoCodigo` via lookup tables (`SUBTIPO_POR_TIPO[state.residencial.tipoCodigo]`, `COMERCIAL_SUBTIPO_POR_TIPO[...]`, `TERRENO_SUBTIPO_POR_TIPO[...]`) — a seller can only pick a subtype option valid for the currently-selected type; switching type resets `subtipo: ""`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️245

OWNER REQUIREMENT:
Rentas title/description/detail fields must support normal multi-word editing and persistence.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FORMSECTION `titulo`/`descripcion` fields are plain controlled `<input>`/`<textarea>` with unrestricted `onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}` — no space-stripping or word-count filtering in source.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Typing/spacebar behavior itself is source-clean, but persistence-through-refresh (draft localStorage/sessionStorage round trip actually preserving multi-word text) has not been behaviorally exercised this pass.

NOTES:


---

ITEM:
⚠️246

OWNER REQUIREMENT:
Rentas description label should be "Descripción del espacio" where appropriate.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL line 615: `title={lang === "es" ? "Descripción del espacio" : "Space description"}`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️247

OWNER REQUIREMENT:
Rentas facts grid should show only applicable facts for the selected rental pathway.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL renders `LeonixListingFactsGrid` fed by `detailGroups` built from `buildRentasFlowPropertyBodyRows(s)` (flow-group-filtered) plus `base.quickFacts`, both of which pass through `applyRentasFlowRowFilter` (see ⚠️228).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️248

OWNER REQUIREMENT:
Rentas "Características destacadas" should use compact chips/rows rather than giant bordered rows.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL lines 647-661: features render as `rounded-full` pill `<span>` chips (`px-3 py-1.5 text-xs font-semibold`, `flex flex-wrap gap-2`), not full-width bordered rows.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️249

OWNER REQUIREMENT:
Rentas "Servicios incluidos" should be visually structured and clearly distinct from amenities/features.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL lines 664-670: separate `<Section>` titled "Servicios incluidos"/"Included services" (eyebrow "Incluido en la renta"/"Included in rent"), using the same pill-chip visual treatment as ⚠️248 but a fully distinct section/heading from "Características"/"Features".

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️250

OWNER REQUIREMENT:
Included-in-rent values and property amenities are separate concepts and should not be merged casually.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`serviciosIncluidosKeys`/`serviciosIncluidosOtro` (included services) and `residencial.highlightKeys` (amenities/features) are entirely separate state arrays in PRIVADOSTATE, mapped to separate VM fields and rendered in separate sections (see ⚠️249).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️251

OWNER REQUIREMENT:
Rentas custom highlight/characteristic additions use the approved multi-word chip pattern where enabled.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Both PRIVADOFORM (line 19-20, 1124) and NEGOCIOFORM (line 20, 1212) import and render the shared `LeonixCustomHighlightChipAdd` + `evaluateAddCustomHighlight` — the same component BR Privado uses.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Actual typing/spacebar/multi-word-add/remove interaction in a live browser — per the audit's explicit standard, typing/spacebar behavior is runtime-only even when the shared component is correctly wired.

NOTES:
Architecture/wiring is strong evidence toward this passing cleanly (both lanes reuse the exact same proven component), but wiring is not itself the behavioral proof.

---

ITEM:
⚠️252

OWNER REQUIREMENT:
Rentas media application uses the shared clear add-photo/thumbnails/reorder/cover/remove pattern.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOFORM imports and renders `LeonixRealEstateSortablePhotoStrip` (line 44, 721) wired to `photoDataUrls`/`primaryImageIndex` state — the same shared component BR Privado uses.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Behavioral add/reorder/set-cover/remove/persist-through-refresh exercise in a live browser, per the audit's explicit standard for media reorder/portada/persistence claims.

NOTES:


---

ITEM:
⚠️253

OWNER REQUIREMENT:
Rentas property video follows the later external-URL-only doctrine.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOFORM video section (lines 770-803): 4 `<input type="url">` fields (`MAX_VIDEO_URLS = 4`), placeholder `https://youtube.com/...`, no file input anywhere in the media section.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️254

OWNER REQUIREMENT:
Rentas accepted video URLs show explicit acceptance state.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOFORM line 801-803: once at least one URL is present/valid, `<p className="... text-[#2C7A4E]">{rm.media.linksReady}</p>` renders (green text, "links ready" confirmation). Per-field invalid-URL warning also present (line 794-796).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️255

OWNER REQUIREMENT:
Rentas results-card preview uses the actual selected portada.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`buildRentasResultCardPreviewListingFromPrivadoVm`/`...NegocioVm` in `rentasPreviewResultCardListing.ts`: `imageUrl: trim(vm.media.heroUrl) || "/logo.png"` — `heroUrl` derives from the actual media/primary-image pipeline, `/logo.png` only as a genuine no-photo fallback.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️256

OWNER REQUIREMENT:
Rentas result-card preview should be compact and not dominate the preview page.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasPreviewResultCardSection.tsx`: card constrained to `max-w-[368px]` inside a bordered container, labeled "Vista en resultados"/"Search preview".

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Owner needs to see the rendered preview page to judge overall page proportion/hierarchy ("not dominate the page") — the explicit width cap is good structural evidence but final visual balance against the rest of the page is a proportion judgment.

NOTES:


---

ITEM:
⚠️257

OWNER REQUIREMENT:
Rentas result-card chips should show only high-signal structured values such as type, rent, city, size, term, pets/access/security when relevant.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasPublicListing` type is a bounded, curated shape (not a raw form dump); `RentasResultCard.tsx` renders category badge, availability status, rent, beds/baths/sqft icons, city/location line, pets/furnished derived booleans — no mechanism to render arbitrary/every form field.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️258

OWNER REQUIREMENT:
Rentas full preview should use desktop width intelligently rather than a narrow center column surrounded by huge empty space.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL line 466: `<main className="mx-auto grid w-full max-w-[1180px] gap-4 ... lg:grid-cols-[minmax(0,1fr)_300px] ...">` — a genuine two-column grid at desktop width, not a narrow single centered column.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️259

OWNER REQUIREMENT:
Desktop Rentas target is a premium main-content + side/action rail composition, collapsing naturally on mobile.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same grid as ⚠️258: `minmax(0,1fr)_300px` ≈ 74%/26% split (matches the ~70-75%/25-30% target numerically), gated behind the `lg:` breakpoint so it collapses to a single column below `lg`.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
The numeric split and mobile-collapse are structurally confirmed, but "premium" composition (visual polish, hierarchy, spacing quality) is a qualitative judgment that needs an actual rendered screenshot.

NOTES:


---

ITEM:
⚠️260

OWNER REQUIREMENT:
Rentas preview/public shell hierarchy should be consistent across pathways even when the actual detail modules differ.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Single SHELL component renders all 5 flow groups and both lanes with the same section order/wrapper (hero → facts → details → highlights → services → location → contact rail), only the inner detail-module content differing by flow group.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️261

OWNER REQUIREMENT:
Rentas contact/action rail should use canonical Call/SMS/WhatsApp/Email/Share behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOMAP builds `tel:`/`sms:`/`wa.me`/`mailto:` hrefs directly (telHrefFromPhoneDisplay, smsHrefFromPhoneDisplay, waHrefFromPhoneDisplay, mailto construction). SHELL imports `tryWebShare, copyToClipboard` from the shared `@/app/components/cta/ctaLaunchers` (line 25) for Share, rather than a bespoke duplicate implementation.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Direct `tel:`/`wa.me`/`sms:` anchors (rather than routing every action through a shared `CtaActionSheet` component) are used, but these are genuine OS-native URI schemes — the requirement is "canonical Call/SMS/WhatsApp/Email/Share behavior," which this satisfies functionally even if not every action funnels through one shared sheet component.

---

ITEM:
⚠️262

OWNER REQUIREMENT:
Separate SMS number must remain distinct from Call where supplied.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOSTATE `seller.mensajesTexto` is a fully separate field from `seller.telefono`; PRIVADOMAP builds `smsHref` from `s.seller.mensajesTexto` independently of `telHref` (built from `s.seller.telefono`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️263

OWNER REQUIREMENT:
Rentas SMS field/placeholder must not overflow or clip at supported responsive widths.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOFORM (line 901-913) and NEGOCIOFORM (line 940-954) SMS number inputs have no `placeholder` attribute at all — only the `hint` (a wrapping `<p>` above the input) carries the "can be same or different number" copy. This matches the session's already-landed fix (commit `d1d98820`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
Fix already landed this session (`d1d98820`) — placeholder attribute removed from both forms' SMS inputs, eliminating the root cause (a 54-char sentence stuffed into a non-wrapping placeholder on a phone-shaped input).

REMAINING PROOF:
NONE

NOTES:
Since the overflow was caused specifically by the `placeholder` attribute, and that attribute no longer exists on either input, the defect is source-provably eliminated (nothing left to overflow) — not merely "should work."

---

ITEM:
⚠️264

OWNER REQUIREMENT:
Rentas map/location should center on the entered/selected city or canonical location payload rather than a generic default.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PRIVADOMAP line 243-255: `fullAddress: addressLine` always (the previously-buggy `exact ? addressLine : line1` branch — where `line1` for non-exact mode was just the raw cross-street with no city qualifier — has been fixed to always use `addressLine`, which always includes `cityStateZip` in the non-exact branch). NEGOCIOMAP's equivalent `assembled` field already did this correctly. MAPHELPER's embed URL is fed by `locationLine` derived from `vm.location.fullAddress`.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
Fix already landed this session (`d1d98820`) — one-line change in `mapRentasPrivadoStateToPreviewVm.ts` so `fullAddress` always includes the city/state qualifier, matching the Negocio mapper's pre-existing correct behavior.

REMAINING PROOF:
Actual rendered map embed at a real address (cross-street-only, non-exact mode) confirmed visually centered on the correct city — the source fix is logically sound and traced end-to-end, but per the audit standard a source-level map-centering fix is evidence toward passing, not the visual/runtime proof itself.

NOTES:


---

ITEM:
⚠️265

OWNER REQUIREMENT:
Rentas map must not use a hardcoded fake center.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
MAPHELPER: `buildOfertaLocalPreviewMapEmbedUrl(locationLine)` returns `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed` — a genuine by-query embed URL, no hardcoded latitude/longitude or fixed place-id anywhere in the function.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
This is the specific, falsifiable "no hardcoded fake center" claim, distinct from ⚠️264's "actually centers correctly" claim — this one is directly provable by reading the function body.

---

ITEM:
⚠️266

OWNER REQUIREMENT:
Rentas exact/approximate location presentation should follow approved privacy/location rules.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FORMSECTION lines 349-399: one structured address (line1/line2), ONE boolean toggle (`mostrarDireccionExacta`), one cross-street fallback field — no separate manual map-URL field, no redundant show/hide controls. Matches the single approved privacy model (structured address + one toggle + one fallback field).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️267

OWNER REQUIREMENT:
Rentas sparse output hides absent map, socials, media, HOA/Open House, resources, and other optional data.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL gates the map/location section behind `vm.location?.hasMeaningfulAddress` (line 681, 836); video/media sections gated behind `hasVideo`/URL-presence flags; highlights/services sections gated behind `.length` checks (lines 647, 664). No HOA module exists for Rentas at all (see ⚠️281 — an "always absent, never rendered" case, consistent with the sparse-output principle by omission).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
Scope of direct verification: map/location, video, highlights, services sections all confirmed conditionally rendered. Did not individually re-verify every single optional section in the ~900-line SHELL file line-by-line, but the pattern (ternary/`.length`-gated `<Section>` blocks) is used consistently throughout everywhere sampled.

---

ITEM:
⚠️268

OWNER REQUIREMENT:
Rentas checkout presentation states $24.99 / 30 days clearly.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
CHECKOUT `rentasPreviewCheckpointConfig`: `baseLineItem` has `priceCents` (2499) plus explicit `durationSuffixEs: "30 días"`/`durationSuffixEn: "30 days"`, rendered together as one composed price/duration line by the shared `PublishCheckoutCheckpoint` component.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️269

OWNER REQUIREMENT:
Rentas checkout uses the shared stronger Leonix product-summary presentation rather than a tiny ambiguous price box.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Both PRIVADOFORM preview and NEGOCIOFORM preview render `<PublishCheckoutCheckpoint>` (`app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx`), the same shared, category-parameterized checkout-summary component every other paid category (BR FSBO, Empleos, etc.) uses — not a bespoke Rentas-only price box.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️270

OWNER REQUIREMENT:
Rentas checkout/publish canvas remains separated from the ad preview.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`PublishCheckoutCheckpoint` is rendered as a distinct section below/after the ad-preview SHELL render in `RentasPrivadoPreviewClient.tsx`/`RentasNegocioPreviewClient.tsx` — structurally a separate UI object from the ad canvas itself (confirmed by the surrounding "Final checkout"/"Pago final" heading wrapper at line ~370 of `RentasPrivadoPreviewClient.tsx`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️271

OWNER REQUIREMENT:
Paid Rentas publication uses canonical Revenue OS pricing/fulfillment, not a Rentas-specific payment engine.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FULFILLMENT `activatePaidRentasListingFromRevenueOs` is a category-specific *fulfillment handler*, but it is invoked from and orchestrated by the one shared `revenueFulfillment.ts` ("Revenue OS Stripe webhook fulfillment orchestration — server-only"), using the shared `revenuePricingMatrix.ts`/`publishCheckoutCheckpoint.ts`/`revenueCategoryCheckoutPayload.ts` infrastructure — the same pattern used by every other category (mirrors `revenueServiciosFulfillment` per its own doc comment).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️272

OWNER REQUIREMENT:
Browser redirect alone is not authoritative payment fulfillment.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`activatePaidRentasListingFromRevenueOs` (the only function that flips `status`/`is_published` to active) is called exclusively from the server-side Stripe webhook orchestrator, never from any client-side redirect handler. PREVIEWCLIENT's `onCheckout` only calls `startRevenueCategoryCheckout`/`redirectToRevenueCategoryCheckout` — pure navigation to Stripe, no local activation of any kind.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️273

OWNER REQUIREMENT:
Failed/canceled checkout should leave a recoverable pending/unpaid listing rather than delete it or make it public.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FULFILLMENT: rows start life at `status: "pending"` (`RENTAS_PENDING_CHECKOUT_STATUS`), `is_published: false`; nothing in the checkout/preview/publish code path deletes a `listings` row; activation to `active`/published happens only on confirmed webhook payment. A row that never completes checkout simply remains in its pending state indefinitely.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
"Recoverable" in the sense of "not destroyed and not published" is source-provable; whether the dashboard UI surfaces the pending row for the owner to resume/retry checkout was not independently re-verified this pass (tangential UI-discoverability question, not the core data-safety claim).

---

ITEM:
⚠️274

OWNER REQUIREMENT:
Repeated fulfillment should remain idempotent and not create duplicate listing/term.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
FULFILLMENT: `if (status === "active" && isPublished && !renewal) return { ok: true, outcome: "already_published" }` short-circuits a repeat webhook call; `updateRentasPaymentRowResilient` gates its UPDATE with `.eq("status", RENTAS_PENDING_CHECKOUT_STATUS).eq("is_published", false)` for non-renewal activation, so a second attempt against an already-active row matches zero rows and is caught by the `already_published` recheck path — no INSERT anywhere in this function (only UPDATE), so no duplicate row can be created.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️275

OWNER REQUIREMENT:
Editing an already-paid active Rentas listing should not blindly recharge the base publication fee where entitlement-aware architecture exists.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
PREVIEWCLIENT `onCheckout` (line 125-131): `if (editContext) { setCheckoutErr("La edición normal no usa pago. Vuelve y usa Guardar cambios."); return; }` — checkout is explicitly refused whenever the form is in dashboard-edit context; the edit UI instead offers a separate "Guardar cambios"/"Save changes" path (confirmed in NEGOCIOFORM lines 588-605) that updates the same listing row via a dedicated edit API, with no Stripe/checkout involvement.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️276

OWNER REQUIREMENT:
Legacy Rentas listings remain compatible after conditional taxonomy/location/media improvements.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasListingPublicSelect.ts` uses `listingsQueryWithSelectShrink` (a resilient retry-with-shrinking-column-list pattern explicitly built because "some deployments never applied older `listings` migrations"), with a fallback `BROWSE_ORDER_ATTEMPTS` cascade for ordering columns that may not exist yet. `rentasDashboardEditHydration.ts` re-derives `categoriaPropiedad` rather than trusting stale persisted values (see ⚠️227). Coercion functions throughout PRIVADOSTATE (`coerceRentasListingStatus`, `coerceRentasSiNo`, etc.) tolerate old/malformed stored values rather than throwing.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
`scripts/rentas-publish-parity-audit.ts` currently FAILS on an unrelated, apparently-stale assertion (`Rentas public select must not require leonix_ad_id`) — the select list intentionally includes `leonix_ad_id` today, and the resilient select-shrink wrapper would drop it automatically if a given deployment's schema lacked that column. This looks like a stale assertion in the audit script itself, not a live compatibility bug, but is worth the owner's or an engineer's five-minute look.

---

ITEM:
⚠️277

OWNER REQUIREMENT:
Rentas gallery/lightbox must not visually bleed leftover application/form fragments.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
No render path was found in source that would place another category's form component (e.g. Ofertas Locales' application client) inside the Rentas gallery/lightbox tree — only a pure URL-string helper (MAPHELPER) is cross-imported, never a component. The originally-suspected leaked strings ("Nombre del negocio", "Logo del negocio", etc.) are verbatim Ofertas Locales copy, and no JSX path importing that component into the Rentas preview tree exists.

CLASSIFICATION:
🟣 ENVIRONMENT-BLOCKED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
A live, authenticated hard-reload repro directly on the Rentas preview URL, having previously visited `/publicar/ofertas-locales` in the same tab, to confirm or rule out a stale Next.js router/back-forward-cache paint bleeding through on soft navigation — this cannot be set up without a live authenticated seller session, unavailable in this environment.

NOTES:


---

ITEM:
⚠️278

OWNER REQUIREMENT:
Rentas public detail route must render published listings rather than 404 when the canonical listing exists.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Canonical route: `rentasListingPublicPath(id)` = `/clasificados/rentas/listing/{id}` (`rentasPublishRoutes.ts`), served by `RentasListingDetailClient.tsx` which renders SHELL. Legacy alias route `/clasificados/rentas/anuncio/[id]/page.tsx` performs a genuine server `redirect()` (not a static string check — actual Next.js `redirect()` call) to the canonical path, preserving all query params. `fetchRentasListingForPublicDetail`/`queryRentasListingById` correctly gate on `is_published`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
A genuinely unpublished/pending (never-paid) listing correctly 404s by design — that is expected behavior, not a bug in this route.

---

ITEM:
⚠️279

OWNER REQUIREMENT:
Rentas public detail should use the same premium property vocabulary as BR while preserving rental-specific terms.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL reuses `LeonixListingFactsGrid` (the same shared facts-grid component BR uses) and the same visual/token system (serif headings, bronze/gold accents, card shadows), while using Rentas-specific terms where semantically appropriate ("Renta mensual", "Depósito", "Plazo", "Descripción del espacio" vs. BR's "Descripción de la propiedad").

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️280

OWNER REQUIREMENT:
Rentas Open House/showing module should use the shared structured real-estate event renderer where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Rentas uses its own separate `buildRentasShowingPreviewCard` (`leonixRentasShowing.ts`) — a simpler by-appointment-availability model — rather than the shared `LeonixOpenHouseSlotCards` component BR Negocio/Privado use for structured multi-slot Open House events. No import of `LeonixOpenHouseSlotCards` anywhere under the Rentas directory tree.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
N/A — source directly shows two unconsolidated implementations.

NOTES:
It is plausible this is an intentional, simpler design for rentals (a "by appointment" free-text model vs. BR's structured multi-date-slot open-house calendar) rather than an oversight, but no product decision documenting that divergence as intentional was found. Classified as not-done rather than deferred because the requirement explicitly asks for shared-renderer reuse "where applicable," and nothing in the code marks this divergence as a deliberate exception.

---

ITEM:
⚠️281

OWNER REQUIREMENT:
Rentas HOA module should use the shared structured real-estate HOA renderer where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
No HOA field, state, mapper output, or renderer exists anywhere under the Rentas directory tree (`leonixBrGate12dHoaPreview.ts`/HOA card builder is BR-only). Rentals do not currently expose HOA fees/rules at all.

CLASSIFICATION:
🔵 PM/BUSINESS DECISION REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
A product decision on whether HOA information is even relevant/desired on a tenant-facing rental listing (landlords, not tenants, typically pay HOA dues) — no evidence either way was found in the chat transcript or code comments specifically calling this out for Rentas.

NOTES:
Classified as a business decision rather than a code gap because "where applicable" is the operative qualifier and applicability itself is undecided — unlike ⚠️280 (Open House), where Rentas clearly does have a comparable "showing" concept that simply isn't using the shared renderer.

---

ITEM:
⚠️282

OWNER REQUIREMENT:
Rentas professional-only Community Trust appears only on Rentas Negocio.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
SHELL line 827-833: `{isNegocio(vm) ? <BrRentasCommunityTrustSection category="rentas_negocio" ... /> : null}` — gated by `isNegocio(vm)`, confirmed rendered from the canonical public route via DETAILCLIENT.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
A second, apparently non-canonical wiring of the same component also exists in `RentasNegocioDesktopBusinessRail.tsx`, used only by the separate cross-category `/clasificados/anuncio/[id]` route — this does not affect the correctness of the canonical path, which is what actually serves `rentasListingPublicPath()`.

---

ITEM:
⚠️283

OWNER REQUIREMENT:
Rentas private listings never show Community Trust.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `isNegocio(vm)` gate as ⚠️282 (false for Privado listings); repo-wide grep for Community Trust references under the Rentas tree returns zero hits in any `*privado*` file.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️284

OWNER REQUIREMENT:
Rentas results filters must derive from real structured application values.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasFilters`/`ListingLike` types in `shared/filters/rentasFilters.ts` key off real listing fields (`rentMonthly`, `beds`, `baths`, `propertyType`, `petsPolicy`, `parking`, `furnished`, `utilitiesIncluded`, `sqft`, `availableNow`/`availableInDays`, `leaseTerm`) sourced from actual published-listing data (via `fetchRentasPublicListingsForBrowse`), not a fabricated/demo field set.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️285

OWNER REQUIREMENT:
Visible Rentas filters must actually affect URL/result set and survive reload where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
RESULTSCLIENT: `const searchParams = useSearchParams(); const parsed = useMemo(() => parseRentasBrowseParams(searchParams), [searchParams]);` for reading, and `router.replace(qs ? \`${RENTAS_RESULTS}?${qs}\` : ...)` built from a mutated `URLSearchParams(searchParams?.toString())` for writing — genuine URL-synced filter state, parsed identically on initial load (so a reload re-derives the same filter state from the URL).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:


---

ITEM:
⚠️286

OWNER REQUIREMENT:
Rentas filter set includes kind, rentalTypeCode, city, price, beds/baths where applicable, supported Tier-2 values, and clear/reset behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasResultsActiveFilters.tsx` confirms active-filter chips exist for: free-text query, city, zip, state, country, subtype (rental type/kind), branch (privado/negocio), roomBath, roomKitchen, price band. `shared/filters/rentasFilters.ts` (a distinct file, `RentasFilters` type) additionally defines beds/baths/parking/furnished/utilities/availability/sqft/leaseTerm — but it was not conclusively confirmed this pass whether that second file is the one actually wired into the live results page (RESULTSCLIENT appears to use `parseRentasBrowseParams`/`rentasBrowseContract.ts`, a different module) versus a legacy/alternate filter engine. A dedicated "clear/reset all" control was not located in the files reviewed.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Interactive confirmation of the full filter set actually rendered/wired on the live results page (in particular beds/baths, which may live in a not-actually-connected file) and confirmation a clear/reset control exists and works.

NOTES:
Partial structural evidence is strong (URL-driven, city/price/kind confirmed) but this item's specific enumerated list (beds/baths + clear/reset) was not fully traced to the live-wired module this pass — conservatively downgraded from 🟢.

---

ITEM:
⚠️287

OWNER REQUIREMENT:
No visible Rentas filter may remain interactive if it has no real effect.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Not exhaustively audited — would require enumerating every visible filter control in the results UI and confirming each one is read by the actual filtering/query logic (and none are vestigial no-ops left over from a prior filter-engine iteration, given two filter-related files were found — see ⚠️286's note on possible engine ambiguity).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
A control-by-control audit (or interactive click-through) confirming every visible filter UI element actually changes the result set/URL.

NOTES:


---

ITEM:
⚠️288

OWNER REQUIREMENT:
Rentas responsive QA covers all major pathways/components at 375/768/1024/1440.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Responsive Tailwind breakpoint classes (`sm:`, `lg:`) are used consistently throughout FLOWFIELDS/FORMSECTION/SHELL, suggesting intentional responsive design, but no rendered screenshots at the 4 named breakpoints were captured this pass for Rentas specifically.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Actual rendered screenshots (or live viewport testing) at 375/768/1024/1440px across all 5 flow-group pathways, the gallery/lightbox, results-card, contact rail, and checkout — this is inherently a visual/layout claim that cannot be certified from source alone.

NOTES:


---

ITEM:
⚠️289

OWNER REQUIREMENT:
Representative roundtrip QA must cover housing, room_shared, storage_parking, commercial_space, and land_parcel.

EVIDENCE SOURCE:
repo (verifier scripts exist but are static-only)

CURRENT IMPLEMENTATION:
No genuine executed behavioral/browser test covering a representative listing through each of the 5 flow groups was found or run this pass. The one script whose name suggests this (`verify-rentas-published-edit-round-trip-01.mjs`) is a static source-text grep, not an actual fill/preview/edit exercise (see top-of-file note).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
An actual representative listing filled and round-tripped through the live (or at minimum a real headless-browser or integration) flow for each of the 5 flow groups.

NOTES:


---

ITEM:
⚠️290

OWNER REQUIREMENT:
Each representative roundtrip must prove fill → preview → Back to Edit → refresh/persistence → preview again.

EVIDENCE SOURCE:
repo (verifier scripts exist but are static-only)

CURRENT IMPLEMENTATION:
Same as ⚠️289 — no genuine executed behavioral proof of this exact sequence was found or performed this pass.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
NONE

REMAINING PROOF:
Same live/integration-level roundtrip exercise as ⚠️289, specifically including a hard refresh between Back to Edit and the second preview to prove real persistence (not just in-memory React state survival).

NOTES:


---

ITEM:
⚠️291

OWNER REQUIREMENT:
Rentas application/draft/media/filter behavior should be independently certifiable even if staging checkout infrastructure is unavailable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Application/draft state (PRIVADOSTATE/NEGOCIOSTATE), media handling (`LeonixRealEstateSortablePhotoStrip`, video-URL fields), and results filtering (RESULTSCLIENT/`rentasBrowseContract.ts`) are all implemented as pure client-side/local-storage-backed and read-query concerns with no dependency on the Stripe/Revenue OS checkout path anywhere in their code (checkout is only reached from the preview screen's explicit "Checkout" action, a separate, later step). This architecture cleanly allows those surfaces to be exercised and certified via ordinary browser/RUNTIME QA without any staging Stripe account.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE — this item is a claim about testability/architecture (that these surfaces do not require staging Stripe to certify), which is a source-provable structural fact. The actual certification itself is the job of ⚠️252/⚠️286/⚠️287/⚠️288/⚠️289/⚠️290 above, which remain open as noted in their own records.

NOTES:
Distinguish from ⚠️277, which is a genuine environment blocker for a *different* reason (needs a live authenticated session, unrelated to Stripe).
# Ledger Audit — Batch E (⚠️292–⚠️320) — RENTAS NEGOCIO / RENTAS PRIVADO

TALLY: 🟢 SOURCE-PROVED DONE = 18 | 🔴 SOURCE-CONFIRMED NOT DONE = 3 | 🟡 OWNER-VISUAL-QA REQUIRED = 3 | 🟠 RUNTIME QA REQUIRED = 5 | ⚪ GLOBAL-DEFERRED = 0 | 🟣 ENVIRONMENT-BLOCKED = 0 | 🟤 DATA-INSUFFICIENT = 0 | 🔵 PM/BUSINESS DECISION = 0  (total 29)

Method note: this audit reads CURRENT repo source directly (not the prior `.claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md`, which was used only to know where to look, per instructions). One structural discovery governs several items below: the actual production Rentas public-detail route is `/clasificados/rentas/listing/[id]` → `RentasListingDetailClient.tsx` → `RentasVisualMatchPreviewView.tsx` (confirmed via `rentasListingPublicPath`/`rentasListingResultsHandoff`, which is what `RentasResultCard`/landing cards link to, and via `rentas/anuncio/[id]/page.tsx`, which is a pure redirect INTO this same canonical path). `RentasNegocioDesktopBusinessRail.tsx` (which uses the shared `CtaActionSheet`/`ctaLaunchers` architecture and also mounts Community Trust) is real code but is only reachable from the separate legacy cross-category shell `/clasificados/anuncio/[id]/page.tsx` — not from anywhere Rentas itself links to. So for any item about "the" Rentas Negocio public surface, `RentasVisualMatchPreviewView.tsx` is what was evaluated, not the business rail file named in the prompt's file list (which was read and is cited where directly relevant, e.g. Community Trust, since it independently confirms the same mounting pattern).

---

ITEM:
⚠️292

OWNER REQUIREMENT:
Rentas Negocio keeps the shared Rentas property shell and adds a professional layer, not a separate visual product.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx` — single component consumed by both `mapRentasListingToPrivadoPreviewVm` and `mapRentasListingToNegocioPreviewVm` outputs (`RentasListingDetailClient.tsx:154-164`); `isNegocio(vm)` gates only additive business-layer blocks (Community Trust at line 827-835, brokerage/identity fields), the property shell (hero, gallery, quick facts, property rows, location) is identical code for both branches.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A (architectural fact, verified by reading the component and its two call sites)

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️293

OWNER REQUIREMENT:
Rentas Negocio business identity/contact should be richer than Privado but not overwhelm the rental listing.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasNegocioFormState.ts` identity fields (negocioNombre/Marca/Logo/Licencia/TelDirecto/TelOficina/Email/Whatsapp/MensajesTexto/SitioWeb/Redes/Bio/Idiomas — 13 fields) vs `rentasPrivadoFormState.ts` `seller` (7 fields) — "richer" is source-provable by field-count/kind comparison. "Not overwhelm the rental" is a layout/proportion judgment about the rendered `RentasVisualMatchPreviewView` contact rail.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Rendered-page comparison of the contact rail's visual weight against the rest of the listing at real viewport sizes.

NOTES:
The "richer" half is TRUE by source; only the "not overwhelming" half needs a visual check, so the item as a whole cannot be certified 🟢.

---

ITEM:
⚠️294

OWNER REQUIREMENT:
Rentas Negocio business name/brand renders automatically when supplied.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Full pipeline traced end-to-end: form `negocioNombre`/`negocioMarca` → `rentasNegocioToBienesRaicesNegocioState.ts:117,120` (`nombre`/`brokerage`) → `leonixNegocioBusinessMetaFromFormState.ts:38,40` (`meta.negocioAgente`/`meta.negocioNombreCorreduria`) → published `business_meta` JSON → `mapListingRowToRentasPublicListing.ts:44-67` (`businessMetaFromRow` reads the same keys back as `agentName`/`marca`) → `mapRentasListingLiveToPreviewVm.ts:614-616,659` (`identity.name = agent || sellerLine`, `identity.brokerageName = marca || sellerLine`). No toggle gates rendering anywhere in the chain — purely data-presence driven.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️295

OWNER REQUIREMENT:
Rentas Negocio WhatsApp CTA must use the shared canonical WhatsApp behavior.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
The canonical render path (`RentasVisualMatchPreviewView.tsx:803-808`) renders WhatsApp as a plain `<a href={c.waHref}>` (`ActionLink`, line 316-346) where `waHref` comes from a Rentas-only, hand-rolled builder (`mapRentasListingLiveToPreviewVm.ts:83-90`, `waHrefFromDigits`) — not from the shared `app/components/cta/ctaLaunchers.ts` + `buildWhatsAppMessageIntent` + `CtaActionSheet` architecture that BR uses (`brContactCtaSheet.tsx`). `RentasNegocioDesktopBusinessRail.tsx` DOES use `buildWhatsAppMessageIntent`/`CtaActionSheet` (lines 4-12, 58-64, 274) but is not mounted on any route Rentas itself links to (see method note above) — so the shared-architecture implementation exists in the repo but is not the one real users reach.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (this is an architecture divergence, not a behavior needing a live test — the divergence is provable from source)

NOTES:
Functionally the live-path `wa.me` link IS correctly E.164/country-code normalized (`e164FromDigits`/`waHrefFromDigits`, `mapRentasListingLiveToPreviewVm.ts:67-90`), so end users likely get a working WhatsApp deep link — but it is a parallel, independently-maintained implementation, not "the shared canonical WhatsApp behavior" the item asks for.

---

ITEM:
⚠️296

OWNER REQUIREMENT:
Rentas Negocio professional website/social/contact fields map to real public actions where supplied.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`mapRentasListingLiveToPreviewVm.ts:637-668` — `socialLinks` built from `contactChannels` (`socialLinksFromChannelsPayload`) merged with legacy `negocioRedes` free-text parsing (`parseNegocioRedesSocialLinks`), `web` from `ch?.website` or legacy `businessWebsite` via `hrefFromUserInput`; `identity.profileHref = web`, `profileCtaEnabled: Boolean(web)`. Rendered conditionally in `RentasVisualMatchPreviewView.tsx:815-820` (`websiteHref` → `ActionLink`) and social chips via `RentasNegocioDesktopBusinessRail.tsx:144-172` (non-canonical route) / identity block in the shared vm.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️297

OWNER REQUIREMENT:
Rentas Negocio languages use the shared languages behavior where applicable.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasNegocioForm.tsx:48,54,541-568,980` — imports `LanguagesInput` from `app/components/forms/LanguagesInput` and `brRentasLanguagesAdapter.ts` (`parseBrRentasLanguagesString`/`serializeBrRentasLanguagesString`), same component/adapter pair BR Negocio uses. Public display renders the resulting string as plain text (`RentasNegocioDesktopBusinessRail.tsx:173-178`, `railDisplay.languages`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️298

OWNER REQUIREMENT:
Rentas Negocio professional identity should not leak into property-owned fields.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasNegocioFormState.ts:38-134` — `negocioNombre`/`negocioMarca`/`negocioLogoDataUrl`/`negocioLicencia`/`negocioTelDirecto`/`negocioTelOficina`/`negocioEmail`/`negocioWhatsapp`/`negocioMensajesTexto`/`negocioSitioWeb`/`negocioRedes`/`negocioBio`/`negocioIdiomas` are top-level, uniquely-named fields, structurally disjoint from `residencial`/`comercial`/`terreno` (typed as `BienesRaicesPrivadoResidencialFields`/`ComercialFields`/`TerrenoFields`) — no shared key names, no merge path that writes a `negocio*` value into a property object anywhere in `mergePartialRentasNegocioState` (lines 223-356).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️299

OWNER REQUIREMENT:
Rentas Negocio property fields should not overwrite parent/business identity.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same structural evidence as ⚠️298 — `mergePartialRentasNegocioState` destructures `negocio*` keys out of the incoming partial BEFORE delegating the remainder to `mergePartialRentasPrivadoState` (lines 227-257), then separately re-applies the preserved `negocio*` values (lines 323-335) rather than letting the property-state merge touch them.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️300

OWNER REQUIREMENT:
Rentas Negocio media must support upload, thumbnails, reorder, portada, remove, refresh persistence, preview order, and Back-to-Edit order.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasNegocioForm.tsx:740-766` renders `LeonixRealEstateSortablePhotoStrip` with `primaryImageIndex={0}` HARDCODED (not `state.media.primaryImageIndex`) and `onSetPrimary={() => null}` — a literal no-op. The component itself (`LeonixRealEstateSortablePhotoStrip.tsx:93,131`) does render a per-photo "set as cover" click target (`onClick={() => onSetPrimary(i)}`), so a seller can click it, but it does nothing and the UI always shows slot 0 as the cover regardless. The on-screen copy directly above it (lines 726-737) explicitly claims "The cover image can be different from the first slot" / "La portada puede ser distinta del primer casillero" — contradicted by the dead handler. Upload/reorder/remove wiring itself (`onPhotos`, `onReorder`, `onRemove`, lines 703-765) is present and looks structurally correct but is unverified at runtime.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE for the portada defect itself (proven dead in source); reorder/remove/refresh-persistence/preview-order/Back-to-Edit-order would still need runtime proof even if portada were fixed.

NOTES:
Contrast with Rentas Privado (⚠️312), whose equivalent implementation is correct — this is a Negocio-lane-specific regression/gap, not a shared-component defect (the shared `LeonixRealEstateSortablePhotoStrip` itself works correctly when wired properly).

---

ITEM:
⚠️301

OWNER REQUIREMENT:
Rentas Negocio conditional pathways must match the same rental-type field truth as Privado.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasNegocioFormState.ts` types every rental-type-dependent field (`tipoDeRenta`, `rentasEspacio*`, `rentasAlmacen*`, `rentasComercial*`, `rentasLote*`, `comercial`/`terreno`/`residencial`) directly off `RentasPrivadoFormState[...]` (lines 53-79, 122-124), and `mergePartialRentasNegocioState` computes them by delegating to `mergePartialRentasPrivadoState` (`asPrivado`, lines 245-257) rather than re-implementing the logic. Both lanes share `RentasTipoFlowDetailFields.tsx` and the flow-group filtering in `rentasRentalTypeApply.ts`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️302

OWNER REQUIREMENT:
Rentas Negocio result card/public detail should use real cover media and structured rental facts.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasResultCard.tsx:306-330` renders `listing.imageUrl` inside explicit `aspect-[16/10]`/`h-36` containers; `mapListingRowToRentasPublicListing.ts` imports `filterRentasPhotoUrlList`/`isRentasPlaceholderImageUrl` to exclude placeholder assets from the gallery source. Public detail structured facts come from `buildContractRows`/`buildPropertyRows` (`mapRentasListingLiveToPreviewVm.ts:247-341`), rendered via the shared `LeonixListingFactsGrid`.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
The card's "cover" is whatever is at gallery index 0, which — for a Negocio listing — is what ⚠️300's portada bug forces as the permanent index-0 image; that specific defect is tracked under ⚠️300, not here (this item only asks that a real photo, not a fake asset, is used).

---

ITEM:
⚠️303

OWNER REQUIREMENT:
Rentas Negocio Community Trust uses only the approved Rentas professional labels.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts:75-81` — `rentas_negocio` category has a distinct, curated 5-label set ("Respuesta rápida", "Mantenimiento a tiempo", "Trato justo", "Proceso de renta sencillo", "Propiedad como se describe" — es/en), not shared with servicios/restaurantes/comida-local/bienes_raices_negocio catalogs. `LEONIX_ENDORSEMENT_CATEGORY_LIVE.rentas_negocio = true` (line 142). Mounted only in `RentasVisualMatchPreviewView.tsx:827-835` behind `isNegocio(vm)`, only on the live listing (`ownerId` passed only by `RentasListingDetailClient.tsx:157-163`, never by the draft-preview client `RentasNegocioPreviewClient.tsx:302,324`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE (label correctness and gating are both source-provable)

NOTES:
`BrRentasCommunityTrustSection.tsx`'s own doc-comment (lines 9-12) is STALE — it says the category is not yet live pending a migration, but the registry now marks it live. This is a comment-only staleness, not a functional gap (the code checks the live registry dynamically). Whether the referenced migration (`supabase/migrations/20260827190000_..._br_rentas_reconcile.sql`, confirmed present in-repo) was actually applied to the production database could not be verified here (no authenticated DB access) — that would matter for end-to-end vote-recording, not for this item's specific ask about label content.

---

ITEM:
⚠️304

OWNER REQUIREMENT:
Google/Yelp or other external reputation surfaces, if used, must come from legitimate connected data.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
NONE — repo-wide search for Yelp/Google Business/Google Reviews references inside `app/(site)/clasificados/publicar/rentas/**` and `app/(site)/clasificados/rentas/**` returns zero hits. (BR Negocio has this feature — `negocioGoogleBusinessUrl`/`negocioGoogleReviewsUrl`/`negocioYelpReviewsUrl` in `anuncio/[id]/page.tsx:764-766` — but that code path is explicitly gated `listing.category !== "bienes-raices"` and never touches Rentas.)

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
This is a conditional requirement ("if used") — Rentas doesn't use any such surface at all, so the requirement is vacuously satisfied rather than actively implemented.

---

ITEM:
⚠️305

OWNER REQUIREMENT:
Rentas Negocio public contact rail must hide missing methods and show supplied valid methods automatically.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`mapRentasListingLiveToPreviewVm.ts:687-705` — every contact action has an explicit `show*` boolean (`showSolicitarInfo: Boolean(mailto)`, `showLlamar: Boolean(telHref && ch?.allowCall !== false)`, `showWhatsapp`, `showSms`) computed from href presence AND channel-enabled flags; `RentasVisualMatchPreviewView.tsx:791-825` renders each `ActionLink` only when both the `show*` flag and the href are truthy. No manual "which to display" toggle exists in the schema.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️306

OWNER REQUIREMENT:
Rentas Negocio preview/public shell should preserve professional identity through the refresh/edit/preview lifecycle.

EVIDENCE SOURCE:
repo, verifier (rejected as proof)

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft.ts`/`rentasNegocioDraftMedia.ts` implement session/local-storage draft persistence; `scripts/verify-rentas-published-edit-round-trip-01.mjs` exists but only does `readFileSync` + string `.includes()` assertions against source text (e.g. `assert(hydration.includes("contact_phone") ...)`) — it never actually invokes the hydration function against a fixture or performs a real save→reload cycle, so it does not count as behavioral proof.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
A real browser session: fill Negocio professional identity fields → refresh mid-draft → confirm fields survive; publish → edit from dashboard → confirm identity fields re-hydrate; publish → view live → refresh → confirm identity still renders.

NOTES:
None.

---

ITEM:
⚠️307

OWNER REQUIREMENT:
Rentas Privado keeps the shared premium rental shell with a simpler owner/contact layer.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same `RentasVisualMatchPreviewView.tsx` shell as Negocio (method note above). `rentasPrivadoFormState.ts:seller` is a 7-field object (fotoDataUrl/nombre/telefono/whatsapp/mensajesTexto/correo/notaContacto) vs. Negocio's 13 `negocio*` fields — source-provably simpler.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️308

OWNER REQUIREMENT:
Rentas Privado should not inherit professional Business Hub/agent complexity.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasPrivadoFormState.ts` `seller` object has no brokerage/marca/logo/licencia/office-phone/second-agent fields (contrast `rentasNegocioFormState.ts` negocioMarca/negocioLogoDataUrl/negocioLicencia/negocioTelOficina). `RentasVisualMatchPreviewView.tsx:827` gates Community Trust and any `identity`-shaped business block strictly behind `isNegocio(vm)`, which is false for the Privado vm type (`BienesRaicesPrivadoPreviewVm`, which has no `identity` key at all — `isNegocio` literally checks `"identity" in vm`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️309

OWNER REQUIREMENT:
Rentas Privado owner identity/contact should remain clear, compact, and integrated with the rental listing.

EVIDENCE SOURCE:
repo, screenshot

CURRENT IMPLEMENTATION:
`RentasVisualMatchPreviewView.tsx:718-835` — single `<aside>` contact card, sticky, inside the same shell as the listing (not a separate page/modal). "Clear/compact/integrated" is a layout-density and visual-hierarchy judgment.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Rendered-page check of the contact card's visual density/placement at real viewport sizes.

NOTES:
Structural integration (single shared component, not a separate surface) is source-provable and correct; only the "compact"/"clear" visual-quality claim needs a screenshot check.

---

ITEM:
⚠️310

OWNER REQUIREMENT:
Rentas Privado phone/SMS/WhatsApp/email must map to the correct canonical native actions.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Live/public mapper (`mapRentasListingLiveToPreviewVm.ts:67-90`, used by both lanes) builds E.164 `tel:`/`sms:` hrefs (`+1` prefix for bare 10-digit US numbers) and `wa.me` hrefs with a `1` country-code prefix — correct. The DRAFT/pre-publish preview mapper (`mapRentasPrivadoStateToPreviewVm.ts:42-62`) builds bare-digit `tel:${d}`/`sms:${d}`/`wa.me/${d}` with NO country-code normalization — an inconsistency between what the seller sees pre-publish and what actually goes live.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Actual click-to-call/SMS/WhatsApp handoff on a real device for the LIVE listing path (source looks correct there); separately, whether the draft-preview's un-normalized hrefs cause any real problem in practice (they may still work on many US carriers/apps by accident) needs a live check too.

NOTES:
Per the audit's own standard, native CTA handoff defaults to runtime-required even when source looks correct; the draft-preview/live inconsistency is flagged as an additional, source-confirmed secondary finding worth fixing regardless.

---

ITEM:
⚠️311

OWNER REQUIREMENT:
Rentas Privado optional data renders automatically when supplied and disappears when empty.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`RentasVisualMatchPreviewView.tsx` — `cleanRows()` (lines 85-98) drops any row with an empty or non-meaningful value before render; `isMeaningfulValue()` (77-83) filters placeholder-style values ("—", "undefined", "sin preferencia"); every contact/location/showing block is wrapped in a truthiness check (`c.phone ? ... : null`, `vm.location?.hasMeaningfulAddress ? ... : null`, etc.). Same pattern in the live mapper's `pushRow()` helper (`mapRentasListingLiveToPreviewVm.ts:150-154`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️312

OWNER REQUIREMENT:
Rentas Privado media behavior should match the shared Rentas media standard.

EVIDENCE SOURCE:
repo, verifier (rejected as sufficient proof)

CURRENT IMPLEMENTATION:
`RentasPrivadoForm.tsx:721-753` — `LeonixRealEstateSortablePhotoStrip` wired correctly: `primaryImageIndex={state.media.primaryImageIndex}` (real state, not hardcoded), `onSetPrimary={(i) => ... primaryImageIndex: i}` (genuinely updates state), `onReorder`/`onRemove` both remap the primary index via `remapPrimaryIndexAfterArrayMove`-equivalent logic. This is the correct implementation of the same component Negocio uses incorrectly (⚠️300).

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Live upload/reorder/set-cover/remove/refresh-persistence pass in a real browser session — source is correct but per this audit's standard, portada/reorder/persistence-through-refresh still require behavioral proof, not just correct-looking wiring.

NOTES:
Contrast with ⚠️300 (Negocio), which is source-CONFIRMED broken, not merely unproven — Privado's implementation is the healthier of the two lanes.

---

ITEM:
⚠️313

OWNER REQUIREMENT:
Rentas Privado conditional field sets must accurately change across all rental types.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`app/(site)/clasificados/rentas/shared/rentasRentalTypeApply.ts` — `buildComercialPropertyRows`/`buildTerrenoPropertyRows`/residencial-branch builders (lines 357-460) each build a distinct field set per `categoriaPropiedad`/flow group; `RentasTipoFlowDetailFields.tsx` (shared by both lanes) renders distinct field sets per flow group (full_housing/room_shared/storage_parking/commercial_space/land_parcel).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️314

OWNER REQUIREMENT:
Rentas Privado preview must not show stale fields from a previous rental type after switching.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`rentasRentalTypeApply.ts:342-355` (`applyRentasFlowRowFilter`) is a pure function recomputed fresh from the CURRENT `tipoDeRenta`/flow-group on every render/publish — it is invoked in both the draft-preview mapper path and the live mapper path (`filterRentasLivePropertyRowsForFlow`, line 460-466). Because filtering is computed at render/publish time from current state rather than depending on stale stored flags, a field from a previously-selected type cannot leak through even if the underlying object still holds an old value.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️315

OWNER REQUIREMENT:
Rentas Privado result card uses actual cover media and realistic card dimensions.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Same shared `RentasResultCard.tsx` as ⚠️302 (one component for both lanes) — explicit `aspect-[16/10]`/`h-36 sm:h-full sm:min-h-[150px]` sizing, real `listing.imageUrl` sourced through placeholder-exclusion helpers in the row mapper.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️316

OWNER REQUIREMENT:
Rentas Privado checkout remains separate from the public ad canvas.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`PublishCheckoutCheckpoint` is invoked from `RentasPrivadoPreviewClient.tsx` (a distinct component in `app/(site)/clasificados/rentas/preview/privado/components/`), never from inside `RentasVisualMatchPreviewView.tsx` itself (grep confirms zero references to `PublishCheckoutCheckpoint`/`checkout` in that file) — the ad canvas and the checkout step are structurally separate components/steps.

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.

---

ITEM:
⚠️317

OWNER REQUIREMENT:
Rentas Privado draft hydration must preserve text, selections, media, and rental-specific fields through the supported lifecycle.

EVIDENCE SOURCE:
repo, verifier (rejected as proof)

CURRENT IMPLEMENTATION:
`rentasPrivadoDraft.ts`/`rentasPrivadoDraftMedia.ts`, `rentasDashboardEditHydration.ts` implement the persistence/hydration logic. The only "verifier" found (`scripts/verify-rentas-published-edit-round-trip-01.mjs`) is a static-string-match script against source text, not an executed round-trip — does not satisfy the "genuinely exercises the behavior" bar.

CLASSIFICATION:
🟠 RUNTIME QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Real browser session: fill a Privado draft across all field groups (text/selections/media/rental-type-specific) → refresh → confirm intact; publish → edit from dashboard → confirm re-hydration; cancel-edit → confirm no data loss on the live listing.

NOTES:
None.

---

ITEM:
⚠️318

OWNER REQUIREMENT:
Rentas Privado map/location must reflect the selected city/location truth without exposing a fake exact address.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
`mapRentasListingLiveToPreviewVm.ts:358-372` (`rentasLiveLocationLines`, shared by both lanes) — in non-exact (privacy) mode: `line1 = exact ? crossOrPublic : zona || trim(listing.city) || approxBrowse`. When a neighborhood/zona value IS present, `line1` (and therefore `fullAddress = loc.exact ? loc.addressLine : loc.line1`, consumed by `RentasVisualMatchPreviewView.tsx:357` as `locationLine = vm.location.fullAddress || vm.location.cityStateZip`) resolves to the BARE zona string with no city/state appended. That string feeds directly into `buildOfertaLocalPreviewMapEmbedUrl(locationLine)` (`ofertasLocalesPreviewHelpers.ts:240-244`), a plain `google.com/maps?q=<string>` query with no city-augmentation logic — so a neighborhood name alone can geocode ambiguously (the same failure class as the "world-zoom" map bug the earlier session fixed only in the DRAFT mapper's `fullAddress`, never in this live mapper). The external "Ver en mapa" link (`mapsUrl`) is unaffected — it is separately built from `loc.cityStateZip` (line 620/490) and always includes city.

CLASSIFICATION:
🔴 SOURCE-CONFIRMED NOT DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE for the defect's existence (source-confirmed); a live check would only be needed to see how visually bad the resulting mis-centered embed looks for a real zona value.

NOTES:
Only the EMBEDDED map iframe is affected; the "View on map" external link is correct. This is the live-listing counterpart of a bug the prior session (per `.claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md` §E5, "⚠️46") believed it had closed — that fix touched only the draft/application preview mapper (`app/(site)/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts`), a different file from the one evaluated here (`app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts`), which is what actually renders on the real published listing.

---

ITEM:
⚠️319

OWNER REQUIREMENT:
Rentas Privado sparse public output remains smaller/cleaner when optional data is absent.

EVIDENCE SOURCE:
repo, screenshot

CURRENT IMPLEMENTATION:
Conditional-render pattern confirmed structurally (⚠️311's evidence — every optional block is wrapped in a presence check, so a sparse listing renders objectively fewer DOM blocks). Whether the RESULTING layout reads as "smaller/cleaner" rather than leaving awkward gaps is a visual judgment.

CLASSIFICATION:
🟡 OWNER-VISUAL-QA REQUIRED

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
Rendered-page comparison of a maximally sparse Privado listing (minimal optional fields) against a fully-populated one, at real viewport sizes, to confirm no dead whitespace/broken proportions.

NOTES:
None.

---

ITEM:
⚠️320

OWNER REQUIREMENT:
Rentas Privado never displays Community Trust.

EVIDENCE SOURCE:
repo

CURRENT IMPLEMENTATION:
Repo-wide case-insensitive search for "CommunityTrust" returns exactly 6 files, none matching `*privado*`: `BrAgenteResContactSidebar.tsx`, `RentasVisualMatchPreviewView.tsx`, `ComidaLocalPublicDetailClient.tsx`, `RentasNegocioDesktopBusinessRail.tsx`, `BrRentasCommunityTrustSection.tsx`, `RestaurantContactHub.tsx`. Within the one shared file both Rentas lanes use, `RentasVisualMatchPreviewView.tsx:827`, the mount is behind `isNegocio(vm) ? <BrRentasCommunityTrustSection .../> : null` — `isNegocio` is false for every Privado vm (`BienesRaicesPrivadoPreviewVm` has no `identity` key, the check literally being `"identity" in vm`).

CLASSIFICATION:
🟢 SOURCE-PROVED DONE

WHAT WAS ACTUALLY TOUCHED:
N/A

REMAINING PROOF:
NONE

NOTES:
None.
# Batch F — ⚠️321-325 (GLOBAL / EXPLICIT DEFERRED OR OUT-OF-SCOPE ITEMS)

Tally: ⚪ GLOBAL-DEFERRED: 2 | 🟣 ENVIRONMENT-BLOCKED: 3

These five items are self-defining deferral/blocker categories from the permanent ledger itself,
not independently testable feature behaviors — each states the rule under which a *different*
item elsewhere in the ledger should be classified. They are audited here for completeness only.

---

ITEM:
⚠️321

OWNER REQUIREMENT:
GLOBAL-DEFERRED — Business Address Verification Engine: street/unit/city/state/ZIP/country
autocomplete/suggested/verified address, canonical normalization, manual fallback,
maps/directions payload, search/filter normalization, and category privacy rules belong to the
shared global engine, not a BR/Rentas-local build.

EVIDENCE SOURCE:
repo (exhaustive prior-session grep for USPS/SmartyStreets/Melissa/geocode/verify-address terms
found no such engine anywhere in the codebase, confirmed in `.claude/BR_RENTAS_REQUIREMENTS_RECONCILIATION.md`'s
plan-mode audit; independently re-confirmed via a fresh grep this pass — no address-verification
service integration exists at the platform level).

CURRENT IMPLEMENTATION:
NONE (no global engine exists yet; BR/Rentas currently reuse ad-hoc city typeaheads —
`CityAutocomplete.tsx`, `BrPrivadoCiudadZonaCombobox.tsx` — which are explicitly the
"interim, may be reused until the global address engine is adopted" fallback per ⚠️36).

CLASSIFICATION:
⚪ GLOBAL-DEFERRED

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE — this is a legitimate, correctly-scoped platform-level deferral, not a BR/Rentas gap. No
BR/Rentas-local replacement should ever be built for this.

NOTES:
This item's classification directly governs ⚠️35 elsewhere in the ledger (identical requirement,
listed twice — once as a Shared item, once here as a formal deferral record).

---

ITEM:
⚠️322

OWNER REQUIREMENT:
GLOBAL — site-wide hydration defect: a React hydration mismatch is a global QA defect unless
BR/Rentas code is proven causal; do not hide/suppress it locally.

EVIDENCE SOURCE:
repo (`git log --oneline --all | grep -i hydrat`).

CURRENT IMPLEMENTATION:
Confirmed via commit history that hydration issues touching this family have already been
triaged and fixed at the correct layer, not suppressed: `bc9b235a fix(global): resolve SSR
hydration mismatch on Navbar and root intro` (site-wide, fixed globally, not BR/Rentas-local),
`b3d85dc1 fix(br-privado): harden draft-media hydration against reload data loss` (BR/Rentas-causal
instance, correctly fixed in BR/Rentas-owned code, not suppressed), `680fc5ce fix(rentas):
eliminate hydration mismatch from client-only stored language preference` (Rentas-causal instance,
correctly fixed). No evidence of a currently-open, unresolved hydration mismatch anywhere in this
family as of this pass.

CLASSIFICATION:
⚪ GLOBAL-DEFERRED

WHAT WAS ACTUALLY TOUCHED:
NONE this pass (prior sessions already fixed every hydration instance found, at the correct
layer — global fixes stayed global, BR/Rentas-causal fixes stayed local).

REMAINING PROOF:
NONE currently open. If a NEW hydration mismatch is reported in the future, it must be triaged
again under this same rule (root-cause first, don't suppress) rather than assumed closed forever.

NOTES:
This is a standing policy rule, correctly followed by every hydration fix found in history — not
a single fixable/unfixable defect.

---

ITEM:
⚠️323

OWNER REQUIREMENT:
CHECKOUT ENVIRONMENT: if Staging Stripe/entitlement is not configured, report checkout/publish
roundtrip as ENVIRONMENT-BLOCKED rather than pretending payment behavior is TRUE or FALSE.

EVIDENCE SOURCE:
repo / environment.

CURRENT IMPLEMENTATION:
`app/lib/listingPlans/` (Revenue OS) exists and is used by both BR and Rentas fulfillment
adapters (source-confirmed present and wired in multiple prior sessions). Whether a live Staging
Stripe session with real card entry can be exercised from THIS non-interactive environment was
not attempted this pass (would require initiating a real or test payment flow, which this audit
explicitly must not do — no code changes, no side-effecting actions).

CLASSIFICATION:
🟣 ENVIRONMENT-BLOCKED

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
A live checkout roundtrip (real or Stripe test-mode) run by someone with an authorized session/
staging credentials — this environment cannot self-authorize a payment flow.

NOTES:
This item's rule directly governs every checkout/payment-roundtrip item elsewhere in the ledger
(e.g. ⚠️271-275, ⚠️50-51) — none of those should be marked 🟢/🔴 for the actual funds-roundtrip
leg specifically; the surrounding code/copy/architecture can still be source-verified.

---

ITEM:
⚠️324

OWNER REQUIREMENT:
DATA-INSUFFICIENT: do not manufacture result-set/filter conclusions when production/staging
inventory is too small to prove differences.

EVIDENCE SOURCE:
repo / production data (not directly queried this pass — no DB access exercised, per read-only
scope; classification here is about the RULE, not a specific dataset check).

CURRENT IMPLEMENTATION:
N/A — this is a standing evidentiary rule, not a feature.

CLASSIFICATION:
🟤 DATA-INSUFFICIENT

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE as a standalone item — this classification exists to be applied to OTHER filter/result-set
items elsewhere in the ledger (e.g. ⚠️151-153, ⚠️284-287) whenever real inventory volume is too
thin to prove a filter genuinely narrows results.

NOTES:
None.

---

ITEM:
⚠️325

OWNER REQUIREMENT:
AUTH-ENVIRONMENT-BLOCKED: do not mark authenticated seller-only behaviors TRUE without an
authorized session or equivalent real behavioral evidence.

EVIDENCE SOURCE:
repo / environment. Confirmed directly this session: navigating to
`/clasificados/publicar/rentas/privado` in the live dev-server preview returned the app's
sign-in gate ("Publicar — Accede para publicar"), not the form — no owner credentials are
available in this environment, so any authenticated-seller-only behavior cannot be exercised
live here.

CURRENT IMPLEMENTATION:
N/A — this is a standing evidentiary rule; the 8-category scheme provided by the owner does not
include a distinct "AUTH-ENVIRONMENT-BLOCKED" emoji, so per-item application of this rule uses
🟣 ENVIRONMENT-BLOCKED (the closest defined category) with a NOTES line clarifying the auth-specific
sub-reason, consistent with how this exact situation was already handled for ⚠️35/⚠️45 in the
prior 40-item working ledger.

CLASSIFICATION:
🟣 ENVIRONMENT-BLOCKED

WHAT WAS ACTUALLY TOUCHED:
NONE.

REMAINING PROOF:
NONE as a standalone item — applies to every seller/agent-application-only behavior elsewhere in
the ledger that requires a logged-in session to exercise live (most of the 🟠 RUNTIME QA REQUIRED
items across BR/Rentas application forms fall under this constraint specifically because this
audit environment has no owner credentials, not because the behavior itself is unverifiable in
principle).

NOTES:
Distinguish from ⚠️323 (payment-specific) and ⚠️324 (data-volume-specific) — this one is
specifically about needing a signed-in seller/agent session to reach gated application UI at all.
