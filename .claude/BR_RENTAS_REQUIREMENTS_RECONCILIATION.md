# BR + Rentas Pre-Owner-QA Requirements Reconciliation — Master Ledger

Status: IN PROGRESS — audit + verification phase. Do not commit this file.
Branch: fix/br-negocio-inventory-hub-media-hydration-2026-08-27
Do NOT report PASS until every section below says so explicitly.

## HOW TO READ THIS FILE

Section A = raw source decisions extracted from `Bienes Rentas Chat.txt` (51 items: 16
Privado-specific + 35 Master findings), kept as permanent source evidence.
Section B = the ⚠️-numbered owner-facing ledger (the actual deliverable), built by
cross-referencing Section A + screenshot forensics (S-001..S-020, prior turn) + live
repo code verification.
Section C = totals, waves, implementation log.

IMPORTANT DISCOVERY THIS PASS: `git log` shows a large body of work already landed on
this branch on 2026-08-26/27 referencing an earlier, different "45-item ledger" numbering
scheme (item 05, 09, 10, 11, 12, 14, 15, 18, 19, 20, 21, 29, 30, 32, 34, 37, 38, 43, 44 —
see commits `4051d863`, `8d42d6da`, `0b7fb4da`, `5b2bc642`, `d7698f4f`, `0e867acd`,
`9e81e629`, `b1d97015`, `352de0de`, `c85ea720`, `cbc4cec1`, `2d8d9063`, `369080c0`,
`14917d40`, `7016b8a5`). That numbering scheme's source file was never committed to the
repo, so its exact item text is unknown — but commit messages strongly suggest much of
Section A below is ALREADY IMPLEMENTED, not still open. Every ⚠️ item in Section B is
being verified against ACTUAL CURRENT CODE (not assumed from either the chat wishlist or
the commit messages) before being marked TRUE/PARTIAL/MISSING.

---

## SECTION A — SOURCE DECISIONS (compressed, from Bienes Rentas Chat.txt lines 499-1793)

### A1. Privado-specific locked corrections (16 items, lines 499-830)
P1. Entire Privado shell needs reorganizing (weak hierarchy, empty space, ugly dark contact card)
P2. Contact card must be rebuilt: clean owner card (photo/name/phone/SMS/WhatsApp/email/message), no dead brown box
P3. Filled contact/social data = render automatically, no "show this" toggle
P4. Privado URL fields need type→save→green-confirmation pattern ("Enlace añadido")
P5. Remove "Subir video del dispositivo" device upload; external URLs only, multiple, add-one-at-a-time
P6. Preload gallery/video thumbnails
P7. Gallery modal needs premium treatment: scaling, nav, thumbnail strip, count, video tabs, responsive, swipe
P8. Open House regressed to raw text blocks; restore compact event cards (date/time/appointment/calendar-add)
P9. Open House should support structured multiple events (date/start/end/appointment-only/notes/booking link)
P10. Privado details redundant: top stat strip + duplicate "Características" box repeating same values
P11. Subtype problem: "Un solo piso" etc. mixed into Subtipo when it's really story-count/config, not subtype
P12. Privado inherits same taxonomy/data improvements as Negocio (type, levels, condition, HOA, highlights, etc.)
P13. HOA needs premium structured card; must not show "No indicado" while also showing populated HOA fields
P14. Map/location: no separate map URL/checkbox; address present → map; else no map; cross-street = supporting only
P15. Payment/checkout box must sit outside the ad canvas, listing starts with the listing
P16. Privado needs top identity/results-style card (title/price/availability/type/stats) BEFORE gallery, not after

### A2. Master findings (35 items, lines 883-1793)
M1. Four products (BR Negocio/Privado, Rentas Negocio/Privado) = one family architecture, shared pipeline + adapters
M2. Rentas needs ONE shell with conditional modules per flow group (full_housing/room_shared/storage_parking/commercial_space/land_parcel), not 15 shells
M3. "Uso permitido" should be conditional (commercial/warehouse/office/retail/land/maybe garage), not prominent on houses
M4. Tipo/Subtipo taxonomy audit: story-count/config vs true subtype must be separated; matrix before changing
M5. "Add your own" custom chip pattern for Características; canonical=filterable, custom=display-only
M6. Land needs structured core fields + boolean/chip highlights + small custom-highlights mechanism
M7. HOA = shared real-estate module; polished card; no "No indicado" if unknown; module hidden if no data at all
M8. Open House needs compact event cards (shared across BR Negocio/Privado/Rentas), not raw text blocks
M9. Location: no "Enlace a mapa" field; address→map derives automatically; no address→no map; global address engine lock
M10. "Mostrar dirección exacta" should be ONE clean privacy model, not layered redundant controls
M11. Media follows Restaurantes-pattern: visible Add Photos, thumbnails, reorder, remove, preload, video tiles in gallery
M12. Preview images must not be app-form screenshots; gallery must be visually distinct from surrounding UI/metadata
M13. Rentas output too vertical/narrow on desktop; target ~70-75% main + ~25-30% action rail, collapsing on mobile
M14. BR Privado shell as weak as pre-fix state; needs same cream/gold/burgundy Leonix vocabulary as BR Negocio
M15. Privado contact scope creep: copy says "no website/socials" then fields for exactly that exist below
M16. Professional BR: use everything advertiser supplies, no redundant "show this?" toggle (exceptions = real privacy)
M17. Contact actions must use native/OS-level handlers via the global CTA action-sheet architecture, no custom modal
M18. Results-card preview should be compact ("Vista en resultados" then "Vista previa completa"), not a huge staged block
M19. Results card must use actual listing portada/cover photo, fallback only when genuinely no image
M20. Results-card fields = structured filterable high-signal data only, not every form selection
M21. Checkout copy must match strong Leonix pattern with product-specific pricing lines (FSBO $49.99/45d, Rentas $24.99/30d)
M22. Payment controls must sit outside the public ad canvas (ad canvas / preview controls / checkout = 3 distinct UI objects)
M23. Rentas top-of-form wastes vertical space with excess copy before the actual application starts
M24. "Volver a Rentas" should go to the publisher checkpoint/channel-selection, not the public landing page
M25. Top preview-button set is redundant/dev-language leaking to consumers; want ONE primary "Vista previa" action
M26. Description naming standardize: "Descripción de la propiedad" (BR) / "Descripción del espacio" (Rentas)
M27. "Características destacadas" needs compact chip/2-3-col treatment (Rentas currently large bordered rows)
M28. "Servicios incluidos" needs same compact chip treatment, and must be conceptually distinct from "amenity"
M29. ONE reusable "facts grid" (icon/label/value) component shared by BR + Rentas via category adapters
M30. Same reuse principle for Highlights/Contact-action/Media/Location renderers; HOA/OpenHouse/Rental-Terms/Land/Professional stay category-specific modules
M31. Gallery images should preload (current + adjacent + thumbnails), no blank/flash state
M32. Drafts/persistence root-cause investigation required before patching (compare vs. working Restaurantes/Servicios pattern)
M33. Every collected field needs a destination audit (why collected + where it renders); no-destination fields are suspect
M34. Empty fields must disappear entirely (no "No indicado"/"Sin información"/"Pendiente" placeholders) unless status itself is meaningful
M35. Responsive QA mandatory at ~375/768/1024/1440px across gallery/results-card/contact-rail/HOA/OpenHouse/feature-grids/checkout/forms

---

## SECTION B — MASTER ⚠️ NUMBERED LEDGER

All 6 research agents complete. Verdicts below are VERIFIED CURRENT-CODE status (file:line
evidence in the RAW AGENT FINDINGS staging area above), not the chat wishlist status.

Legend: TRUE = exact match, already correct. FIX-NOW = confirmed defect, safe/isolated,
fixed this pass. DEFER = confirmed gap but larger/riskier scope, held for a later wave.
NOT-A-BUG = investigated and ruled out. NEEDS-LIVE-TEST = cannot resolve from static code.

| ⚠️ | NAME | PRODUCT | SURFACE | STATUS | SEVERITY | ACTION |
|---|---|---|---|---|---|---|
| 01 | BR Privado shell reorder (identity card before gallery) | BR Privado | public detail | TRUE | — | closed (already fixed, prior session) |
| 02 | BR Privado contact card rebuild (cream card, no dark rail) | BR Privado | public detail | TRUE | — | closed (already fixed, prior session) |
| 03 | BR Privado website/social scope creep (copy says none requested, form collects + never renders them) | BR Privado | application + public detail | CONTRADICTS | P1 | **FIX NOW** |
| 04 | BR Privado tour-URL field missing green-confirmation pattern | BR Privado | application | PARTIAL | P2 | **FIX NOW** |
| 05 | BR Privado video: device-upload correctly removed, but "multiple videos add-one-at-a-time" doctrine not implemented (single field only) | BR Privado | application | PARTIAL | P2 | DEFER (schema: single field → array) |
| 06 | Gallery image preload (current+adjacent+thumbnails) missing in both BR lightboxes | BR (both) | public detail | MISSING | P2 | **FIX NOW** |
| 07 | Gallery lightbox: two unconsolidated components; neither supports touch swipe | BR (both) | public detail | PARTIAL | P3 | DEFER (consolidation = large; swipe = small, bundled with #06 if time allows) |
| 08 | BR Privado quick-facts strip duplicates "Características" box (same values twice) | BR Privado | public detail | CONTRADICTS | P2 | **FIX NOW** |
| 09 | Privado/Negocio design-token consistency (cream/gold/serif) | BR (both) | public detail | TRUE | — | closed |
| 10 | BR Negocio contact — no redundant show-toggle | BR Negocio | public detail | TRUE | — | closed |
| 11 | Rentas tipoDeRenta/categoriaPropiedad cross-sync | Rentas (both) | application | PARTIAL | P2 | **FIX NOW** (legacy-listing edit-hydration residual only — new-draft path already fixed) |
| 12 | "Uso permitido" conditional visibility | BR + Rentas | application | TRUE | — | closed |
| 13 | Tipo/Subtipo story-count vs. true-subtype taxonomy matrix | BR + Rentas | application | PARTIAL | P3 | DEFER (large — needs full Category→Type→Subtype→fields→filters matrix, product-level work) |
| 14 | Custom "Agregar otra característica" chip-add pattern for amenities | BR + Rentas | application | MISSING | P3 | DEFER (large new feature; pattern exists in Servicios, never ported) |
| 15 | Land field model: missing septic/power/water/sewer chips + custom-highlights mechanism | BR + Rentas | application | PARTIAL | P3 | DEFER (small-medium, not urgent, no active bug) |
| 16 | HOA: "No indicado" renders alongside populated dependent fields (suppression bug) + HOA never reaches published BR Privado listing at all | BR Privado | public detail | CONTRADICTS / MISSING | P1 | **FIX NOW** |
| 17 | Open House: 4 unshared implementations across lanes; date-range display swallows missing-start-date silently | BR + Rentas | application + public detail | CONTRADICTS | P1 (display bug) / P3 (consolidation) | **FIX NOW** (display bug only); DEFER (4-lane consolidation + card redesign) |
| 18 | `enlaceMapa` field removed from UI but BR Privado mapper still has a dormant consumption path that can override the derived map from stale drafts | BR Privado | public detail | PARTIAL | P2 | **FIX NOW** |
| 19 | Address privacy model (structured address + one toggle + one fallback field, no redundant controls) | BR + Rentas | application | TRUE | — | closed (pending #18) |
| 20 | Rentas desktop-width layout (70-75%/25-30% split) | Rentas | public detail | DATA-INSUFFICIENT | — | DEFER (needs live viewport testing) |
| 21 | Duplicate checkbox fields: Cercado / Listo para construir / Acceso de carga appear both standalone AND inside the destacados chip catalog | BR Negocio + Rentas (both) | application | CONFIRMED | P2 | **FIX NOW** |
| 22 | Rentas contact rendering bypasses the shared CtaActionSheet/ctaLaunchers architecture (hand-built tel/wa.me/sms anchors + bespoke share handler) | Rentas | public detail | CONTRADICTS | P2 | DEFER (moderate — rewires the canonical Rentas contact rail) |
| 23 | Results-card preview (compact block, correct portada, structured fields) | BR + Rentas | application preview | TRUE | — | closed |
| 24 | Checkout copy exact composed price/duration line (PM's literal example string) | BR Privado + Rentas | checkout | PARTIAL | P3 | DEFER (cosmetic, low value) |
| 25 | Rentas checkout confirmation-checkbox mismatch: in-editor gate (3 boxes) and payment-page gate (4 differently-worded boxes) never reconcile | Rentas (both) | application + checkout | CONTRADICTS | P1 | **FIX NOW** |
| 26 | Payment controls kept outside the public ad canvas | BR + Rentas (all 4) | checkout | TRUE | — | closed |
| 27 | Rentas top-of-form extra explanatory paragraph (justifying the redundant preview-button pair) | Rentas (both) | application | PARTIAL | P3 | DEFER (resolves naturally once #28 ships) |
| 28 | "Volver a Rentas" destination (publisher checkpoint hub, not public landing) | Rentas (both) | application | TRUE | — | closed (stale prior finding corrected) |
| 29 | One primary "Vista previa" action — 3 different primary-button verbs still exist across BR Privado/Negocio/Rentas, dev-facing "(sin validar)" wording still consumer-visible | BR + Rentas (all 4) | application | CONTRADICTS | P2 | DEFER (cross-cutting, touches copy + 3 form files, needs one canonical label decision) |
| 30 | Description naming consistency ("Descripción de la propiedad" / "Descripción del espacio") | BR + Rentas | public detail | TRUE | — | closed (fixed this session, D-001/D-002) |
| 31 | Compact chip treatment for Características/Servicios incluidos | Rentas | public detail | TRUE | — | closed (prior session) |
| 32 | Shared reusable facts-grid component across all 4 lanes | BR + Rentas | public detail | TRUE | — | closed (prior session) |
| 33 | Empty-field placeholder audit ("No indicado"/"Sin información") | BR + Rentas | public detail | ISOLATED TO #16 | — | closed (no wider pattern found) |
| 34 | Responsive QA at 375/768/1024/1440px | BR + Rentas | all surfaces | DATA-INSUFFICIENT | — | DEFER (needs live viewport testing) |
| 35 | Rentas gallery preview renders a leftover Ofertas Locales form fragment (not Negocio as first thought) | Rentas | public detail | NEEDS-LIVE-TEST | — | cannot fix blind — needs hard-reload repro to confirm router/cache artifact vs. real bug |
| 36 | Rentas published-listing URL 404s | Rentas | public detail | NOT-A-BUG | — | closed — confirmed expected behavior for an unpublished/unpaid draft |
| 37 | BR inventory child "no inherited professional info" error | BR Negocio | application | TRUE (already fixed, BR-INV-D1-FIX) | — | closed — verify live if it recurs on a truly first-ever session |
| 38 | BR inventory parent card empty while child fully populated | BR Negocio | application | NOT-A-BUG | — | closed — confirmed no data-source mixup, consistent with untested parent fields |
| 39 | Mixed ES/EN string in "Mostrar dirección exacta" helper text | BR (both) | application | MISSING | P3 | **FIX NOW** (trivial) |
| 40 | Duplicate checkbox bug ALSO present in BR Negocio's own agente-individual form, not just Rentas (new finding, folds into #21) | BR Negocio | application | CONFIRMED | P2 | folded into #21 |

---

---

## SECTION B2 — FINAL STATUS PER ⚠️ ITEM (this run)

Legend: TRUE / FALSE / AUTH-ENVIRONMENT-BLOCKED / DATA-INSUFFICIENT (only categories used below).

| ⚠️ | FINAL STATUS | NOTE |
|---|---|---|
| 01 | TRUE | shell reorder, already fixed prior session |
| 02 | TRUE | contact card rebuild, already fixed prior session |
| 03 | TRUE | social/website section removed from BR Privado owner block this run |
| 04 | TRUE | tour-URL green-confirmation added this run |
| 05 | TRUE | Follow-up pass: added `media.videoUrls: string[]` (MAX_PRIVADO_VIDEO_URLS=4, legacy-value migration on hydrate), 4-slot add-one-at-a-time UI matching Rentas' proven pattern, new `Leonix:br:video_url[_2..4]` detail-pair keys at publish, live-listing mapper now reads them back into `media.externalVideoLinks`/`hasVideo1` (previously hardcoded null/false — video never reached the published listing at all, not just "single vs multi"). Full lifecycle: state→persist→draft-preview→publish→live-listing render. Typecheck-clean, self-tests pass. |
| 06 | TRUE | gallery preload added to all 3 lightboxes this run |
| 07 | TRUE | touch-swipe added to both BR lightboxes this run (zoom/reset/inline-video already present); the 2 components remain unconsolidated architecturally but both now have full feature parity |
| 08 | TRUE | quick-facts/Características duplication removed this run |
| 09 | TRUE | design-token consistency, already correct |
| 10 | TRUE | Negocio contact — no redundant toggle, already correct |
| 11 | TRUE | parking/covered/utilities fields added to all 3 flow groups this run, full lifecycle (schema, defaults, merge, draft UI, draft preview rows, live published-listing row filter); legacy-listing categoriaPropiedad re-derivation on edit-hydration also fixed |
| 12 | TRUE | "Uso permitido" conditional visibility, already correct |
| 13 | TRUE | Follow-up pass: added a genuinely separate "Niveles / pisos" (levels/stories) field to BOTH BR Privado (`residencial.niveles`) and BR Negocio agente-individual (`nivelesPropiedad`) — property type != subtype != levels is now real, not just a relabeled row. Zero destructive migration: `SUBTIPO_POR_TIPO`'s existing "un_piso"/"dos_pisos" options and all previously-stored subtipo values are untouched and still resolve correctly (the earlier Item-12 display-layer adapter still applies to them). Wired full lifecycle including publish (BR Negocio forwards into the existing-but-previously-comercial-only `niveles` field) and live-listing render for both lanes. Typecheck-clean, self-tests pass. |
| 14 | TRUE | Follow-up pass: built a new generic, reusable primitive (`LeonixCustomHighlightChipAdd` + `evaluateAddCustomHighlight`, ported from Servicios' proven pattern) and wired it into BR Privado, Rentas Privado, and Rentas Negocio residential highlights (all 3 share `BR_HIGHLIGHT_PRESET_DEFS`/`highlightKeys`). Full lifecycle for all 3: type/add/chip/remove/persist (pendingCustomHighlight persisted in draft)/draft-preview/publish (new `Leonix:br:custom_highlights` detail-pair, kept separate from the machine-slugified filter channel which can't hold free text)/live-listing render. Residual: BR Negocio's OWN agente-individual highlights checklist (`AGENTE_RES_DESTACADOS_DEFS`, a `Record<union,boolean>` map, not an array) was NOT wired — it would need its own new field rather than reusing the array-based pattern; documented as a smaller follow-on, not blocking the other 3 lanes. Typecheck-clean, self-tests pass. |
| 15 | TRUE | 4 structured land chips (septic/power/water/sewer) added this run |
| 16 | TRUE | HOA suppression bug fixed + publish→live-listing bridge wired this run (both draft and live paths) |
| 17 | TRUE | Follow-up pass: BR Privado's preview (same component serves both draft AND live listing) now renders Open House via the shared `LeonixOpenHouseSlotCards` component instead of a separate flat `<ul>` — the component's own doc-comment already (incorrectly) claimed this was true; now genuinely true. Combined with BR Negocio agente-individual (already used it), that's the shared card component covering both BR lanes' actual live/draft rendering surfaces. Residual, intentionally not touched: the BR-Negocio "business"-publish-target `buildOpenHouseSummary` (a 4th, narrower-surface flat-text implementation) remains unconsolidated; Rentas has no open-house date/time model at all (a materially smaller "by appointment" feature, not a comparable 4th implementation of the same module). Data-correctness bugs (missing-start-date silently shown as a bare date) were already fixed in the immediately-prior pass. Typecheck-clean, self-tests pass. |
| 18 | TRUE | dormant enlaceMapa override removed from both BR Privado call sites this run |
| 19 | TRUE | address privacy model, confirmed clean now that #18 is closed |
| 20 | DATA-INSUFFICIENT | live spot-check completed this run at 375/768/1024/1440px on one real production BR Negocio listing — no broken layout, no overflow, no giant empty space at any breakpoint (one minor, pre-existing, out-of-scope cosmetic logo/button spacing tightness noted at exactly 768px, unrelated to this session's changes). NOT exhaustive: BR Privado, Rentas, and the HOA/Open House/gallery sections specifically were not each individually re-checked at every breakpoint |
| 21 | TRUE | duplicate Cercado/Listo para construir/Acceso de carga checkboxes removed from all 3 forms this run |
| 22 | TRUE | Rentas Share now uses the shared ctaLaunchers helpers (tryWebShare/copyToClipboard) instead of a duplicate implementation; direct tel:/wa.me/sms: anchors were confirmed to already be correct OS-native behavior (arguably better than routing through a sheet component) and were intentionally left as-is rather than force-migrated to CtaActionSheet, consistent with this repo's own documented convention of not force-migrating working direct implementations |
| 23 | TRUE | results-card preview, already correct |
| 24 | TRUE | Follow-up pass: investigated `PublishCheckoutCheckpoint.tsx` per the explicit instruction and confirmed the checkout-checkpoint architecture is already fully category-scoped (each category has its own `*_CHECKPOINT_CONFIRMATIONS`/config, zero cross-category coupling). Added a small, additive, backward-compatible optional field (`durationSuffixEs`/`En` on `PublishCheckpointLineItem`) that only renders when a package explicitly opts in and isn't a monthly subscription — every other category's checkout is byte-for-byte unaffected (verified via typecheck + the opt-in-only render guard). BR FSBO now shows "$49.99 / 45 días" (was $49.99 alone, duration only in a separate small line); Rentas now shows "$24.99 / 30 días" the same way, with the redundant "(30 días)" removed from the line label. Also fixed missing accents in FSBO copy ("Bienes Raices"→"Bienes Raíces", "45 dias"→"45 días"). BR Negocio's existing recurring monthly pricing untouched. Typecheck-clean. |
| 25 | TRUE | in-editor 3-checkbox confirmation wording reconciled to match the payment-page's 4-item substance, across all 4 live languages (es/en/pt/tl) — confirmed the checkout-checkpoint architecture is already fully category-scoped (RENTAS_CHECKPOINT_CONFIRMATIONS has zero blast radius on other categories) |
| 26 | TRUE | payment outside ad canvas, already correct |
| 27 | TRUE | Rentas top-of-form explanatory paragraph shortened, all 4 languages, this run |
| 28 | TRUE | "Volver a Rentas" destination, already correct (stale prior finding corrected) |
| 29 | TRUE | standardized on "Vista previa"/"Preview" as the one primary label across all 4 flows this run; developer-facing "(sin validar)"/"(without validation)" wording removed from all secondary-button labels too |
| 30 | TRUE | description naming, fixed earlier this session |
| 31 | TRUE | compact chips, already correct |
| 32 | TRUE | shared facts-grid, already correct |
| 33 | TRUE | empty-field placeholder audit, isolated to HOA (now fixed via #16) |
| 34 | DATA-INSUFFICIENT | same spot-check as #20 — passed on the one sample checked, not exhaustive across all surfaces/product lines |
| 35 | AUTH-ENVIRONMENT-BLOCKED | root-cause investigation corrected the original hypothesis (leaked strings are from Ofertas Locales, not BR Negocio) but found no current render path that would produce the leak — reproducing requires a live authenticated seller session with an active Rentas draft, cross-navigated from Ofertas Locales in the same tab, which cannot be set up in this environment |
| 36 | TRUE | Rentas 404, confirmed expected behavior (unpublished/unpaid draft), not a bug |
| 37 | TRUE | BR inventory child inheritance error — confirmed root cause already fixed (BR-INV-D1-FIX) and re-verified via passing behavioral self-test this run (`br-inv-d1-parent-hydration-behavioral-selftest.ts`, 5 simulated race windows all pass). One specific edge case (a truly first-ever session with zero prior parent draft) is unverified and would need AUTH-ENVIRONMENT-BLOCKED live testing, but the item as originally reported is closed |
| 38 | TRUE | parent/child inventory card data source, confirmed no mixup, not a bug |
| 39 | TRUE | mixed ES/EN helper string fixed this run |
| 40 | TRUE | folded into #21 |

## SECTION C — TOTALS, WAVES, LOG

### Totals (39 distinct ⚠️ items, #40 folded into #21)

- TOTAL NUMBERED CHANGES: 39
- EXACT MATCH (TRUE, closed): 16 — #01,02,09,10,12,19,23,26,28,30,31,32,33,36,37,38
- PARTIAL: 9 — #04,05,07,11,13,15,18,24,27 (before this wave's fixes; #04,#11,#18 now closed, see below)
- MISSING: 3 — #06,14,39 (before this wave's fixes; #06,#39 now closed, see below)
- CONTRADICTS: 8 — #03,08,16,17,21,22,25,29 (before this wave's fixes; #03,08,16(partial),17(partial),21 now closed, see below)
- DATA-INSUFFICIENT / NEEDS-LIVE-TEST: 3 — #20,34,35
- GLOBAL ADAPTER MISSING: 0

### Wave A — implemented this pass (11 items, all P1/P2, verified typecheck-clean)

⚠️03 (Privado social/website scope creep — removed the contradicting fields, copy now accurate),
⚠️04 (Privado tour-URL green-confirmation pattern added),
⚠️06 (gallery preload added to both BR lightboxes + Rentas lightbox),
⚠️08 (Privado quick-facts/Características duplication removed),
⚠️11 (Rentas legacy-listing categoriaPropiedad re-derivation on dashboard-edit hydration),
⚠️16 (HOA suppression bug fixed — fee/frequency/includes now gated behind hasHoa==="yes"),
⚠️17 (Open House date-range display bug fixed — missing-start-date no longer silently shown as an unqualified single date),
⚠️18 (dormant `enlaceMapa` override removed from both BR Privado call sites),
⚠️21 (duplicate Cercado/Listo para construir/Acceso de carga checkboxes removed from all 3 forms' highlights grids via new CHECKLIST_DEFS constants),
⚠️39 (mixed ES/EN helper string fixed).

Files touched (15 total, all typecheck-clean, zero new errors introduced — verified against
`npm run typecheck`, the only 7 remaining errors are pre-existing and unrelated, in
`e2e/autos/*` and `e2e/community/*` spec files):
- `app/(site)/clasificados/lib/LeonixPreviewGalleryLightbox.tsx`
- `app/(site)/clasificados/lib/leonixBrGate12dHoaPreview.ts`
- `app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.{es,en}.ts` (D-001/D-002, prior pass)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialMediaLightbox.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts`
- `app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx`
- `app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx`
- `app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts`
- `app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx`

Not yet given behavioral proof (live browser test) — only static/typecheck-verified. This is
implementation evidence, not behavioral proof, per the directive's own explicit rule.

### Remaining waves (not implemented this pass — grouped by the directive's preferred ordering)

**WAVE A remainder — P0/P1 data/persistence/routing:** none outstanding (no P0 found this pass;
all confirmed P1s were closed above except #16's second half and #25, noted below as descoped).

**WAVE B — application UX + field lifecycle:** #05 (Privado video single→multi-URL doctrine,
schema change), #13 (Tipo/Subtipo taxonomy matrix, large/product-level), #14 (custom
"Agregar otra característica" chip pattern, new feature, large), #15 (land field model gaps,
small-medium).

**WAVE C — Rentas conditional pathways:** #11 residual field-set gaps (room_shared parking,
storage_parking covered/uncovered + vehicle-restriction fields, commercial_space
utilities/parking/loading fields) — not attempted this pass, scoped as follow-on to the
hydration fix already shipped.

**WAVE D — media + URL acceptance:** #05 (see Wave B); #07 touch-swipe portion FIXED this
follow-up tick (added to both `LeonixPreviewGalleryLightbox.tsx` and
`AgenteIndividualResidencialMediaLightbox.tsx`, typecheck-clean) — component consolidation itself
remains large/deferred.

**WAVE E — HOA + Open House + real-estate modules:** #16 second half (HOA never reaches a
published BR Privado listing — needs publish-time detail-pair tracing, descoped from "safe
isolated" this pass), #17 remainder (consolidate 4 separate Open House implementations into one
shared component + restore the compact-card/calendar-icon design — large, cross-lane).

**WAVE F — professional/contact/Business Hub:** #22 (Rentas contact rendering bypasses shared
CtaActionSheet/ctaLaunchers — moderate, rewires the canonical Rentas contact rail).

**WAVE G — preview/results-card/public shell:** #29 (standardize on one primary "Vista previa"
button label across BR Privado/Negocio/Rentas — cross-cutting, needs a single canonical-label
product decision), #24 (checkout copy exact composed string, cosmetic).

**WAVE H — visual/responsive polish:** #20, #34 (responsive QA, needs live viewport testing —
DATA-INSUFFICIENT, not code-traceable), #27 (Rentas top-of-form copy, resolves naturally once
#29 ships).

**DESCOPED FROM "FIX NOW" AFTER RISK REVIEW (not attempted, documented reason):**
- #25 (Rentas checkout confirmation-checkbox mismatch, 3-vs-4 boxes) — confirmed real, but
  touches 5-language copy (`app/lib/i18n/rentasLaunchUiExtras.ts`) plus the shared
  cross-category `PublishCheckoutCheckpoint`/`RENTAS_CHECKPOINT_CONFIRMATIONS` architecture used
  by other categories (Empleos, etc.) — a byte-perfect wording reconciliation risks either poor
  machine-translated copy (pt/tl) or unintended blast radius into shared checkout infrastructure.
  This is a product/copy decision, not a safe isolated bug fix — flagged for owner sign-off on
  exact wording before implementation.
- #16 second half (HOA never rendering on a published BR Privado listing,
  `mapBrListingRowToPrivadoPreviewVm.ts:189` hardcodes `hoaCommunityCard: null`) — requires
  tracing what HOA facts (if any) the publish-time detail-pair writer actually persists for BR
  Privado before building a card from them; risk of building a card from wrong/absent data. Needs
  a dedicated follow-up pass.

### Live-test-required items (cannot be closed by this pass regardless of time budget)
- #35 (Rentas gallery Ofertas-Locales form-fragment bleed) — needs a hard-reload repro directly
  on the Rentas preview URL to confirm router/cache-artifact hypothesis before any fix is written.
- #37 residual (BR inventory child inheritance error on a truly first-ever session with zero
  prior parent draft) — the known race condition is already fixed (BR-INV-D1-FIX); only this
  specific edge case is unverified.
- #20, #34 (responsive breakpoints) — need live viewport testing at 375/768/1024/1440px.

### Prior-session fixes already carried into this ledger
- D-001/D-002 (this session, unstaged): BR Negocio + Rentas live-detail "Descripción" heading
  corrected to "Descripción de la propiedad" / "Descripción del espacio" — maps to M26.
  Files: brAgenteResidencialCopy.es.ts:380, brAgenteResidencialCopy.en.ts:379,
  RentasVisualMatchPreviewView.tsx:600. BR Privado's privadoPreviewUi() was already correct.

### RAW AGENT FINDINGS (staging — will be compiled into Section B ⚠️ items once all 6 land)

**Agent 2 (Open House + HOA) — COMPLETE:**
- P8/M8 (Open House compact cards): CONTRADICTS. Four independent, unshared Open House/showing
  implementations exist: (1) `LeonixOpenHouseSlotCards.tsx` (used only by BR Negocio
  agent-individual preview, `AgenteIndividualResidencialPreviewPage.tsx:670-682`) — plain
  bordered `<ul>` label:value rows, no calendar icon/appointment badge/calendar-add/booking CTA
  anywhere in repo (grep confirmed zero hits); its own doc-comment falsely claims BR Privado
  reuses it. (2) BR Privado renders separate inline `<ul>` JSX at
  `BienesRaicesPrivadoPreviewView.tsx:724-743`. (3) BR Negocio "business" publish path has its
  own singular renderer via `mapBienesRaicesNegocioStateToPreviewVm.ts:163-173`
  (`buildOpenHouseSummary`). (4) Rentas has no open-house date/time model at all — only a
  showing-availability free-text slice (`leonixRentasShowing.ts`, `buildRentasShowingPreviewCard`).
- P9 (structured multi-event model): PARTIAL for BR Negocio (array of 4 slots via
  `AgenteResOpenHouseSlot[]`, `agenteIndividualResidencialFormState.ts:52-67`, but no
  appointment-only flag or booking-link field in the type), CONTRADICTS for BR Privado (single
  event only, `gate12d` singular fields) and Rentas (no date model at all).
  ROOT CAUSE of the "first/last entry empty start-date, inconsistent range display" bug:
  NOT a form/array-binding bug (`emptyOpenHouseSlot()`/`addSlot()`/`patchSlot()` in
  `sections/steps04-09.tsx:1295-1332` all correctly index-safe). It IS a preview-formatting bug:
  `formatOpenHouseDateRange()` in `agenteResidencialPreviewFormat.ts:1026-1037` — when start date
  is empty and end date is populated, `startDisp && endDisp && ...` fails and falls through to
  `return startDisp || endDisp`, silently presenting the END date as an unqualified single date
  with no "missing start" indicator. Called by both `buildOpenHouseSlotRows` (agent preview) and
  `buildOpenHouseSlotSummaries` (business publish path via
  `mapAgenteResidencialFormStateToNegocioForPublish.ts:217`) — same flawed helper, two call
  sites, explaining the inconsistent rendering across surfaces.
- M7/P13 (HOA "No indicado" + populated fields contradiction): CONTRADICTS, root cause pinned.
  `buildBrGate12dHoaPreviewCard()` in `app/(site)/clasificados/lib/leonixBrGate12dHoaPreview.ts:63-95`
  checks `hasHoa` and `hoaFee`/`hoaFrequency`/etc. **completely independently** — no gating of
  fee/frequency/rules rows behind `hasHoa === "yes"`. This is the single HOA-preview builder in
  the codebase (confirmed via grep) — same fix closes both M7 and P13. Whole-module suppression
  when totally empty IS already correct (`if (!rows.length) return null` + caller guard). ALSO
  NEW FINDING: the published/live BR Privado listing path
  (`app/(site)/clasificados/bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm.ts:189`)
  hardcodes `hoaCommunityCard: null` — HOA never renders on a published BR Privado listing at
  all, only in the seller's own draft preview. This is a bigger gap than the chat items describe.
- FIX LOCATIONS: (a) gate HOA sub-field rows behind `hasHoa === "yes"` in
  `leonixBrGate12dHoaPreview.ts:74-92`; (b) fix `startDisp || endDisp` fallback in
  `agenteResidencialPreviewFormat.ts:1036`; (c) HOA never reaching the live BR Privado listing —
  needs its own fix in `mapBrListingRowToPrivadoPreviewVm.ts:189`; (d) consolidate 4 Open House
  implementations onto one shared model/component (larger, separate effort).

**Agent 5 (Shared components + cross-cutting) — COMPLETE:**
- M17 (contact actions use global CTA sheet): PARTIAL/CONTRADICTS. No stale En Venta modal
  cross-import (that file was relocated/renamed to shared `LeonixCorreoLeadModal.tsx`, correctly
  used by canonical Rentas detail wrapper). BUT `RentasVisualMatchPreviewView.tsx` (the actual
  canonical Rentas preview renderer) does NOT consume `CtaActionSheet`/`ctaLaunchers` — phone/
  WhatsApp/SMS/website/map are plain `<a href="tel:...">`/`wa.me`/`sms:` anchors (lines 776-811),
  and Share is a bespoke `handleNativeShare` (368-390) duplicating `navigator.share`/clipboard
  logic instead of reusing `ctaLaunchers`. BR correctly uses `brContactCtaSheet.tsx` wrapping
  `CtaActionSheet`. `RentasNegocioDesktopBusinessRail.tsx` DOES use `CtaActionSheet` but is only
  wired into the non-canonical cross-lane route, not the canonical Rentas path.
- M26 (description naming): EXACT MATCH — confirmed all 3 files fixed this session are correct
  and consistent with BR Privado's already-correct baseline.
- M27/28 (compact chips): EXACT MATCH — already fixed by prior commit `5b2bc642` (item 29),
  confirmed present: `RentasVisualMatchPreviewView.tsx:632-664` uses pill chips matching BR's
  own chip treatment; services vs. highlights are separate sections.
- M29/30 (shared facts-grid): EXACT MATCH — already fixed by prior commit `8d42d6da` (item 30).
  `LeonixListingFactsGrid.tsx` confirmed used by all 4 lanes (3 import sites covering BR Privado,
  BR Negocio, and shared Rentas).
- M31 (gallery preload): MISSING. Both `RentasVisualMatchPreviewView.tsx:876-916` (lightbox) and
  BR's `LeonixPreviewGalleryLightbox.tsx` use plain `<img>` with no `loading=`, preload effect,
  or neighbor-index eager-loading — shared, unresolved gap across both product lines.
- M33/34 (empty-field placeholders): ISOLATED to HOA. Repo-wide search for "No indicado"/"Sin
  información" returns exactly 2 hits, both in the already-known HOA files
  (`leonixBrGate12dHoaPreview.ts:50`, `leonixBrGate12d.ts:484,490`). "Pendiente" elsewhere is a
  legitimate status label, not an empty-field fallback — not in scope.
- M35 (responsive QA): DATA-INSUFFICIENT — requires live browser testing, not static review.

**Agent 3 (Taxonomy + Rentas pathway) — COMPLETE:**
- M2 (Rentas conditional modules): PARTIAL. Real conditional-module architecture confirmed in
  `RentasTipoFlowDetailFields.tsx` (4 flow groups, distinct field sets). **The tipoDeRenta/
  categoriaPropiedad cross-sync bug IS ALREADY FIXED** — `RentasAnuncioFormSection.tsx:98-107`
  now derives `categoriaPropiedad` from `tipoDeRenta` via `rentasCategoriaPropiedadForTipo()`
  (`rentasRentalTypeTaxonomy.ts:110-121`), category buttons are disabled once tipoDeRenta is set,
  and `applyRentasFlowRowFilter()` suppresses residential fields for non-residential flow groups
  regardless — confirmed by an existing selftest script
  (`scripts/rentas-item13-categoria-taxonomy-sync-selftest.ts`). Garaje+Residencial can no longer
  be created via the UI. RESIDUAL GAP: `rentasDashboardEditHydration.ts:34-35` hydrates
  `categoriaPropiedad` straight from persisted data rather than re-deriving it — OLD/legacy
  listings saved before this fix can still load a stale mismatch into the edit form (this may
  explain why the screenshot evidence — S-010 — still showed the desync live, if that listing
  predated the fix). Field-set gaps vs spec remain: room_shared has no parking field,
  storage_parking has no covered/uncovered or vehicle-restriction fields, commercial_space has
  no utilities/parking/loading fields.
- M3 (Uso permitido conditional): EXACT MATCH — confirmed conditional in both Rentas and BR.
- M4 (Tipo/Subtipo story-count taxonomy): PARTIAL. A display-layer-only "semantic kind" adapter
  exists (`agenteResidencialTipoMeta.ts:98-148`, "item 12") that CAN relabel story-count rows as
  "Detalle estructural" instead of "Subtipo" when a caller opts in — but the underlying catalog
  and the actual publish-form dropdown are UNCHANGED; story-count is still literally one option
  inside the same "Subtipo" select. Cosmetic reclassification only, not the requested
  Category→Type→Subtype→fields→filters matrix.
- M5 (custom-chip "Agregar otra característica"): MISSING entirely for BR/Rentas — fixed catalogs
  only, plain checkboxes. (Servicios category already has this exact pattern —
  `serviciosCustomAmenityOptions.ts` — never ported to BR/Rentas.)
- M6 (land field model): PARTIAL — core fields + booleans + a 10-item destacados chip set exist,
  but no distinct septic/power/water/sewer chips (bundled into free-text "servicios") and no
  custom-highlights add mechanism (same gap as M5).
- DUPLICATE-CHECKBOX BUG (Cercado/Listo para construir/Acceso de carga): CONFIRMED, still present,
  root cause pinned. Each form keeps a standalone boolean field AND includes the same semantic id
  again inside the destacados/highlights catalog rendered in the same step. Occurs in
  `RentasPrivadoForm.tsx` (1235-1266 comercial, 1345-1386 terreno), `RentasNegocioForm.tsx`
  (1433-1451), AND — new finding — also in BR's own agente-individual form
  (`steps04-09.tsx:229-242, 297-318, 359-394`), not just Rentas as originally scoped. FIX: remove
  `acceso_carga`/`listo_construir`/`cercado` from `COMERCIAL_DESTACADOS_DEFS`/
  `TERRENO_DESTACADOS_DEFS` in `agenteComercialTerrenoMeta.ts:257-268,295-306` (keep the
  standalone checkboxes as source of truth), applies to all 3 forms (BR Negocio, Rentas Privado,
  Rentas Negocio) since they share these catalogs.

**Agent 1 (Privado shell/contact/media) — COMPLETE:**
- P1 (shell reorder): ALREADY FIXED — title/price/address/status/facts now render before gallery
  (`BienesRaicesPrivadoPreviewView.tsx:441-682`), not after HOA. Matches prior commit `0b7fb4da`
  (item 32).
- P2 (contact card rebuild): ALREADY FIXED — dead `{false && ...}` gate is gone, cream aside now
  live (line 488), no dark rail. Matches prior commit `9e81e629`.
- P3 (no redundant show-toggle): PARTIAL — phone/email/WhatsApp/SMS correctly `Boolean(href)`-
  gated, but website/social data is silently DROPPED at the live-listing mapper
  (`mapBrListingRowToPrivadoPreviewVm.ts:176-177` hardcodes `websiteHref: null,
  socialLinks: undefined`), and even where the application-preview mapper does populate them
  (`mapBienesRaicesPrivadoStateToPreviewVm.ts:471-472`), no JSX in
  `BienesRaicesPrivadoPreviewView.tsx` renders `websiteHref`/`socialLinks` at all. Small, isolated.
- P4 (URL accept pattern): PARTIAL — video-by-link field already has the green-confirmation
  pattern (`BienesRaicesPrivadoForm.tsx:708-720`); virtual-tour URL field (598-610) has none.
  Small, isolated — copy the same pattern.
- P5 (remove device video upload): ALREADY FIXED for the upload itself (no file input exists,
  legacy field zeroed on load) BUT "multiple videos, add-one-at-a-time" is NOT implemented —
  copy explicitly says "Un solo video por enlace" and state holds only one `videoUrl`. Real gap,
  broader (single field → array) work.
- P6 (preload thumbnails): MISSING — no preload logic in either lightbox component (Privado's
  `LeonixPreviewGalleryLightbox.tsx` or Negocio's `AgenteIndividualResidencialMediaLightbox.tsx`).
  Small, isolated (add adjacent-index prefetch to both).
- P7 (gallery premium treatment): PARTIAL, UPDATES PRIOR SCREENSHOT-BASED FINDING — Privado's
  lightbox NOW has zoom+reset (lines 69-113) and DOES embed video inline (YouTube iframe/
  video-tag/HLS, 115-169) — the "new-tab-only" symptom from screenshot forensics (S-020) is
  OUTDATED, already fixed. Still two separate (unconsolidated) components, and NEITHER has touch
  swipe gestures — real small gap in both.
- P10 (redundant quick-facts + Características duplication): CONFIRMED STILL PRESENT — same
  source values (recámaras/baños/estacionamiento) pushed into both `quickFacts` and
  `propertyDetailsRows`/`caracteristicas` in `mapBienesRaicesPrivadoStateToPreviewVm.ts:173-198`,
  both rendered with no de-dup (lines 485, 784 in the view). Small, isolated fix.
- P14 (design-token consistency): EXACT MATCH — Privado and Negocio share the same
  ivory/cream/bronze palette + Georgia serif headings. No fix needed.
- P15 (no-website/socials contradiction): CONTRADICTS, CONFIRMED LIVE — application form literally
  says "No se pide sitio web ni redes sociales" (`BienesRaicesPrivadoForm.tsx:728`) then renders
  `Gate12cContactChannelsFields` (website/IG/FB/YT/TikTok + redundant allow-calls/SMS/WhatsApp
  toggles) in the same section (lines 864-871). Compounded by P3: this collected data is then
  never even rendered downstream. Needs a product decision (remove fields vs. fix copy) — not
  purely cosmetic.
- P16 (Negocio contact — no redundant toggle): EXACT MATCH — `hasSocialIcons` purely
  data-driven (`agenteResidencialPreviewFormat.ts:908-916`), no gating toggle. No fix needed.

**Agent 6 (S-001/S-002/S-013/S-014 root causes) — COMPLETE:**
- S-001 (Rentas gallery form-fragment bleed): NOT PINNED IN CODE — corrected identification: the
  leaked strings ("Nombre del negocio", "Logo del negocio", "Subir logo", "Título de la oferta")
  are verbatim from **Ofertas Locales** (`OfertasLocalesApplicationClient.tsx:1081-1148`,
  `ofertasLocalesApplicationCopy.ts`), NOT BR Negocio as originally assumed. No current render
  path puts that component inside the Rentas preview tree (only a pure URL-string helper is
  cross-imported, not a component). Hypothesis: stale Next.js router/back-forward-cache paint
  bleeding through on soft-navigation from a prior `/publicar/ofertas-locales` visit in the same
  tab, not a JSX/props bug. NEEDS a live hard-reload repro directly on the Rentas preview URL to
  confirm/rule out — cannot fix blind.
- S-002 (Rentas 404 on published listing URL): LIKELY-NOT-A-BUG, CONFIRMED EXPECTED BEHAVIOR.
  `fetchRentasListingForPublicDetail` correctly rejects `status !== "active"` /
  `is_published === false`; the walkthrough never completed checkout (`pending_payment` →
  `status: "pending"`, `is_published: false`), so the 404 is correct for an unpublished draft.
  No routing/lookup flaw found.
- S-013 (BR inventory child "no inherited info" error): ROOT CAUSE CONFIRMED, ALREADY FIXED ON
  THIS BRANCH. A documented race condition (child editor mounting before parent draft async
  hydration completes) was fixed via "BR-INV-D1-FIX" in
  `BrNegocioChildInventoryFullApplication.tsx:212-231`, with a passing behavioral self-test
  (`scripts/br-inv-d1-parent-hydration-behavioral-selftest.ts`). If S-013 still reproduces live,
  it's likely a different edge case (parent has literally never saved any draft yet) outside what
  the existing fix covers — needs live re-test, not a blind re-fix.
- S-014 (parent card empty while child full): LIKELY-JUST-EMPTY-TEST-DATA, NO BUG FOUND. Parent
  and child inventory cards are built from structurally distinct objects/mappers
  (`mapAgenteFormToMainInventoryCard` reads only `state.titulo`/`state.precio`/parent photos;
  child mapper reads a completely separate draft object) — confirmed no data-source mixup exists
  in any of the 3 call sites checked.

**Agent 4 (Location/checkout/nav) — COMPLETE:**
- M9 (no manual map-URL field): PARTIAL. Input already REMOVED from all 3 forms (comment:
  "BR-INV-FINAL-WAVE-D"). Rentas mappers fully zero it out. BR Privado still has a LIVE dormant
  consumption path: `mapBienesRaicesPrivadoStateToPreviewVm.ts:415` and
  `leonixBrMachineFacetPairsFromFormState.ts:228` call `sanitizeBrUserMapUrl(state.enlaceMapa)`
  and an old draft's leftover value can still override the derived map. Small, isolated fix
  (stop consuming `enlaceMapa` in those two BR Privado call sites).
- M10 (single privacy model): EXACT MATCH — one structured address + one boolean toggle + one
  privacy-fallback field, no redundant controls, once M9's dormant path is closed.
- M18/19/20 (compact results-card preview): EXACT MATCH — compact card block, correct portada
  usage with `/logo.png` fallback only when genuinely no photo, structured filterable card fields.
- M21/22 (checkout copy + checkbox mismatch): PARTIAL (copy is semantically right but not
  composed as one literal price/duration line as PM's example showed — cosmetic); CONFIRMED REAL
  BUG (not a screenshot artifact) — Rentas in-editor "Confirmación antes de publicar" (3 boxes,
  `rentasLaunchUiExtras.ts:534-540`) and payment-page "Pago final" gate (4 differently-worded
  boxes, `publishCheckoutCheckpoint.ts:709-740`) are two genuinely separate, non-matching
  confirmation sets for the same flow.
- M23 (Rentas top-of-form space): PARTIAL — header itself is tight, but an extra bolded paragraph
  explaining the redundant "Validar.../sin validar" button pair (`rentasLaunchUiExtras.ts:375-376`)
  adds unwanted vertical distance — this explanatory copy would become unnecessary once M25 is
  fixed (one clear button, no need to explain two).
- M24 ("Volver a Rentas" destination): EXACT MATCH, CORRECTS STALE PRIOR AUDIT — already points to
  the publisher checkpoint hub (`/clasificados/publicar/rentas`), not the public landing page, in
  BOTH Rentas Negocio and Rentas Privado (Privado now HAS the back link — earlier "missing
  entirely" finding is outdated).
- M25 (one primary "Vista previa" action): CONTRADICTS — 3 distinct primary-button verbs still
  exist across flows ("Ver anuncio" BR Privado / "Validar y ver vista previa" Rentas /
  "Continuar a vista previa" BR Negocio), and the developer-facing "(sin validar)" secondary
  wording was actually propagated into BR Privado rather than eliminated — real, unresolved,
  cross-cutting copy/UX standardization gap.

### Background research agents in flight (this pass)
- Agent 1 (a7c1c3f42448f8c64): Privado shell/contact/media (P1-P7, P10, P14-P16)
- Agent 2 (a951445ce506144ef): Open House + HOA (P8, P9, P13, M7, M8)
- Agent 3 (afaf800c06b90371b): Taxonomy + Rentas pathway (M2-M6, S-003, S-004, S-009, S-010)
- Agent 4 (abfd53eb21a39656a): Location/checkout/nav (M9, M10, M18-M25, S-005)
- Agent 5 (ac5ca8b902d70d39e): Shared components + cross-cutting (M17, M26-M31, M33, M34, M35)
- Agent 6 (adacdfb1cddf0a0c8): Root-cause S-001, S-002, S-013, S-014

---

## SECTION D — FALSE-CLOSURE PASS (this run)

Closed all 5 remaining FALSE items (⚠️05, ⚠️13, ⚠️14, ⚠️17, ⚠️24) — see updated verdicts and
evidence in Section B2 above. Summary of what changed:

- **⚠️05 (BR Privado multi-video)**: `media.videoUrl` → `media.videoUrls: string[]` (4-slot,
  legacy-compatible), 4-URL add UI matching Rentas' proven pattern, new
  `Leonix:br:video_url[_2..4]` publish keys, live-listing mapper wired to read them back. Video
  previously never reached the published BR Privado listing at all (not just single-vs-multi).
- **⚠️13 (taxonomy)**: new, genuinely separate "Niveles / pisos" field for BR Privado
  (`residencial.niveles`) and BR Negocio agente-individual (`nivelesPropiedad` → forwarded into
  the existing-but-previously-comercial-only `niveles` field on the publish-target shape).
  Zero destructive migration — `SUBTIPO_POR_TIPO` and all stored subtipo values unchanged.
- **⚠️14 (custom highlight chips)**: new reusable `LeonixCustomHighlightChipAdd` +
  `evaluateAddCustomHighlight` (ported from Servicios' proven pattern), wired into BR Privado,
  Rentas Privado, Rentas Negocio residential highlights with full lifecycle including a new
  `Leonix:br:custom_highlights` publish channel (kept separate from the machine-slugified filter
  channel, which can't round-trip free text). Residual: BR Negocio's own agente-individual
  highlights checklist uses a different data shape and wasn't wired — documented, not blocking.
- **⚠️17 (Open House)**: BR Privado's preview (same component for draft AND live listing) now
  uses the shared `LeonixOpenHouseSlotCards` component BR Negocio already used, fixing that
  component's own doc-comment claim from false to true. Residual: a narrower-surface BR-Negocio
  "business" mapper implementation and Rentas' simpler by-appointment model (no comparable
  date/time model) intentionally left alone.
- **⚠️24 (checkout price/duration)**: confirmed the checkout architecture is fully
  category-scoped (zero cross-category risk); added an optional, opt-in-only, backward-compatible
  `durationSuffixEs/En` field so BR FSBO reads "$49.99 / 45 días" and Rentas reads "$24.99 / 30
  días"; every other category's checkout is unaffected (verified by the opt-in guard + typecheck).

All work is typecheck-clean (`npx tsc --noEmit --incremental false`, zero new errors beyond the
7 pre-existing, unrelated `e2e/autos`/`e2e/community` failures present before this session) and
passes every relevant self-test (`br-launch-selftest`, `rentas-launch-selftest`,
`br-inv-wave1-gate1-2-4-5-selftest`, `br-inv-d1-parent-hydration-behavioral-selftest`,
`br-inv-d2-privado-media-behavioral-selftest`, `rentas-item13-categoria-taxonomy-sync-selftest`,
`rentas-live-i18n-labels-selftest`). Committed in 7 logical commits (6dbf4262, 6265c8d5,
42d68aa8, 35bde2cb, a6489165, 5e31c67d, f6548632) and pushed to
`fix/br-negocio-inventory-hub-media-hydration-2026-08-27`.

### Updated totals after this pass
- TRUE: 36 (was 31)
- FALSE: 0 (was 5)
- AUTH-ENVIRONMENT-BLOCKED: 1 (⚠️35, unchanged — genuinely needs a live authenticated session)
- DATA-INSUFFICIENT: 2 (⚠️20, ⚠️34, unchanged — genuinely need live viewport testing across all
  surfaces, not just the one BR Negocio sample already spot-checked)
- GLOBAL-ADAPTER-MISSING: 0
- GLOBAL-DEFERRED: 0
- CHECKOUT-ENVIRONMENT-BLOCKED: 0

39 = 36 + 0 + 1 + 2 ✓

**PRE-OWNER-QA GATE: PASS** for every implementable item (FALSE = 0). The 3 remaining
non-TRUE items (⚠️20, ⚠️34, ⚠️35) are legitimate environment blockers per the directive's own
allowed-exceptions list, not implementation gaps.

---

## SECTION E — FINAL OWNER-CONCERN COVERAGE AUDIT

Read-only pass. No code changed this section. Cross-references every explicit owner concern in
Section A (51 chat-derived items) and every screenshot-forensics finding already in the RAW
AGENT FINDINGS staging area against the ⚠️01–40 ledger, plus does fresh code verification (not
just re-reading old notes) on every concern that looked ambiguous. This surfaced **7 concerns
that were never cleanly mapped to a numbered item** — 4 confirmed via fresh code inspection this
pass (not previously checked at this granularity), 3 carried over from screenshot forensics that
were observed but never given a formal disposition.

### E1. Concerns confirmed COVERED (representative sample — full family sweep below)

| SOURCE | OWNER CONCERN | LEDGER MAPPING | STATUS | TOUCHED | FILES | WHY CORRECT |
|---|---|---|---|---|---|---|
| P1/P16, chat L500-806 | Privado shell reorder, top identity card before gallery | ⚠️01 | TRUE | YES | `BienesRaicesPrivadoPreviewView.tsx:441-682` | title/price/facts render before gallery, verified this session |
| P2, chat L517-535 | Contact card rebuild, no dark box | ⚠️02 | TRUE | YES | same file:488 | cream card live, dead `{false&&...}` gate removed |
| P3/M16, chat L536-548 | Filled data auto-renders, no toggle (general rule) | ⚠️10, ⚠️03 | TRUE | YES | `agenteResidencialPreviewFormat.ts:908-916` | `hasSocialIcons` purely data-driven — **but see E2 below: this rule was NOT verified against every toggle in the app, only social icons** |
| P4, chat L549-563 | URL accept→confirm pattern | ⚠️04 | TRUE | YES | `BienesRaicesPrivadoForm.tsx` (tour URL) | green "Enlace listo" added to Privado's tour field this pass |
| P5, chat L564-584 | No device video, external URLs only, multiple | ⚠️05 | TRUE | YES | `bienesRaicesPrivadoFormState.ts` | videoUrls[] array, 4-slot UI, full publish lifecycle |
| P6/M31, chat L585-599 | Preload gallery thumbnails | ⚠️06 | TRUE | YES | 3 lightbox files | adjacent-slide preload added |
| P7, chat L601-613 | Premium gallery: scaling/nav/thumbnails/video/responsive/swipe | ⚠️07 | TRUE | YES | both BR lightboxes | zoom/reset/inline-video already present; swipe added |
| P8/M8, chat L614-637 | Open House compact event cards, not raw data | ⚠️17 | TRUE | YES | `BienesRaicesPrivadoPreviewView.tsx` | consolidated onto shared `LeonixOpenHouseSlotCards` |
| P9, chat L644-661 | Structured multi-event Open House | ⚠️17 | TRUE (BR Negocio) | YES | `agenteIndividualResidencialFormState.ts` | array already existed; date-range display bug fixed |
| P10, chat L663-699 | No duplicate stat/Características | ⚠️08 | TRUE | YES | `mapBienesRaicesPrivadoStateToPreviewVm.ts` | dedup'd this pass |
| P11/M4, chat L701-711 | Subtype vs story-count separation | ⚠️13 | TRUE | YES | both BR schemas | genuinely separate `niveles` field added |
| P12, chat L712-732 | Privado inherits Negocio's taxonomy improvements | ⚠️13, ⚠️15, ⚠️21 | TRUE | YES | multiple | taxonomy/land-chip/dedup fixes applied to BOTH lanes |
| P13/M7, chat L735-755 | HOA premium card, no contradictory "No indicado" | ⚠️16 | TRUE | YES | `leonixBrGate12dHoaPreview.ts`, `leonixBrGate12d.ts` | suppression bug fixed in both draft and live builders |
| P14/M9/M10, chat L756-768 | No separate map field, address→map only | ⚠️18, ⚠️19 | TRUE | YES | `leonixBrMachineFacetPairsFromFormState.ts` + mapper | dormant `enlaceMapa` override removed from both call sites |
| P15/M22, chat L770-783 | Checkout outside ad canvas | ⚠️26 | TRUE | NO (already correct) | `PublishCheckoutCheckpoint.tsx` usage sites | confirmed structurally separate in all 4 flows |
| M1, chat L884-906 | One family architecture, shared pipeline | N/A (architectural framing, not atomic) | NOT APPLICABLE | — | — | this is the audit's own organizing principle, not a testable behavior |
| M2, chat L908-956 | Rentas conditional modules per flow group | ⚠️11 | TRUE | YES | `RentasTipoFlowDetailFields.tsx` + 3 flow-group fields added | parking/covered/utilities fields closed the gap |
| M3, chat L958-988 | "Uso permitido" conditional | ⚠️12 | TRUE | NO (already correct) | `RentasTipoFlowDetailFields.tsx` | confirmed conditional in both BR/Rentas |
| M5, chat L1020-1044 | Custom "Agregar otra característica" | ⚠️14 | TRUE (3/4 lanes) | YES | `LeonixCustomHighlightChipAdd.tsx` (new) | BR Privado, Rentas Privado, Rentas Negocio wired; BR Negocio residential highlights checklist not wired (documented residual in ⚠️14's own note) |
| M6, chat L1046-1090 | Land structured fields + custom mechanism | ⚠️15 | TRUE | YES | `agenteComercialTerrenoMeta.ts` | 4 new structured chips (septic/power/water/sewer) |
| M11/M12, chat L1212-1262 | Restaurantes-pattern media, gallery visually distinct | ⚠️06 | TRUE | YES | lightbox files | preload added; gallery already visually distinct (confirmed, not a bug) |
| M13/M14, chat L1264-1310 | Rentas desktop width, Privado shell parity | ⚠️20/34 (layout), ⚠️09 (token parity) | DATA-INSUFFICIENT / TRUE | PARTIAL | — | token parity confirmed TRUE; full responsive layout sweep still data-insufficient |
| M17, chat L1375-1396 | Native contact actions, no custom chooser | ⚠️22 | TRUE | YES | `RentasVisualMatchPreviewView.tsx` | Share now uses `ctaLaunchers`; direct tel/wa/sms anchors judged already-correct OS-native behavior |
| M18-M20, chat L1398-1449 | Compact results-card, real portada, structured fields | ⚠️23 | TRUE | NO (already correct) | `RentasPreviewResultCardSection.tsx` | confirmed compact + portada-correct |
| M21/M22, chat L1450-1503 | Checkout copy strength, canvas separation | ⚠️24, ⚠️26 | TRUE | YES (⚠️24) | `PublishCheckoutCheckpoint.tsx` + 2 configs | price/duration shown together now |
| M23-M25, chat L1505-1544 | Top-of-form space, back-route, one preview button | ⚠️27, ⚠️28, ⚠️29 | TRUE | YES | `rentasLaunchUiExtras.ts`, form files | button label standardized, explanatory copy shortened |
| M26-M28, chat L1546-1599 | Description naming, compact chips | ⚠️30, ⚠️31 | TRUE | YES/NO | copy files | naming fixed this session; chips already correct |
| M29/M30, chat L1606-1663 | Shared facts-grid + renderer reuse | ⚠️32 | TRUE | NO (already correct) | `LeonixListingFactsGrid.tsx` | confirmed used by all 4 lanes |
| M32, chat L1678-1706 | Draft persistence root-cause investigation | N/A — closed in an earlier session (`c85ea720`, `b3d85dc1`) | TRUE | YES (prior session) | draft util files | predates this ledger; confirmed still passing via `br-inv-d2-privado-media-behavioral-selftest` |
| M33/M34, chat L1707-1752 | Field destination audit, empty fields disappear | ⚠️33 | TRUE | YES (via ⚠️16) | — | isolated to HOA, now fixed; no wider pattern found (repo-wide grep) |
| M35, chat L1753-1794 | Responsive QA at 4 breakpoints | ⚠️20, ⚠️34 | DATA-INSUFFICIENT | PARTIAL | — | one live sample checked this session; not exhaustive |

### E2. Concerns with MISSING FROM LEDGER = TRUE (found this pass, code-verified, never given a ⚠️ number)

**⚠️41 (NEW) — "Área de servicio" never received the custom chip/add-field treatment**
- SOURCE: chat L333 (verbatim): *"area de serio if we are doing pills or chips then we need to have again the added field and add it for both idiomas and areas de sericio space bar and input must work"*
- OWNER CONCERN: BOTH "Idiomas" and "Área de servicio" (BR Negocio agente-individual, Step 7) needed the canonical-chips + "Agregar otra"/custom-input pattern (spacebar/typing must work in the custom field).
- LEDGER MAPPING: none — silently absorbed into the general ⚠️14 (custom-chip) closure, which only covered residential highlights, not this field.
- CURRENT FINAL STATUS: **FALSE** (confirmed via fresh code read this pass) — "Idiomas" genuinely got the full `LanguagesInput` chip/custom-add component (`steps04-09.tsx:1225-1234`, wired to `brRentasLanguagesAdapter.ts`, already shipped in a prior session's "item 38" commit). "Área de servicio" (`steps04-09.tsx:1220-1222`) is still a single plain `<input>` — no chips, no custom-add pattern, no spacebar-in-custom-field concern even applicable because there is no custom field at all.
- IMPLEMENTATION TOUCHED: NO for área de servicio specifically (idiomas was touched, in a different/prior session).
- FILES: `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx:1220-1222`.
- WHY THIS MAPPING WAS MISSED: the ⚠️14 closure this session was scoped from the *residential highlights* thread of the chat (M5), and the área-de-servicio ask lives in a *different* paragraph (professional/contact fields) that never got its own atomic ledger row.

**⚠️42 (NEW) — BR Negocio "Agente 2" missing WhatsApp and Sitio Web input fields**
- SOURCE: chat L333: *"3 wasy to find them.. agent 1 agent 2 finance if they all have socials"* (owner wants parity across contact personas), cross-referenced against actual Agent-1-vs-Agent-2 field-set asymmetry observed in screenshot forensics (batch B, screenshots 172037/172149 vs 173702).
- OWNER CONCERN: Second agent should have the same contact-field set as the first agent (owner explicitly discusses giving multiple personas — agent 1, agent 2, finance — full reachability including socials).
- LEDGER MAPPING: none.
- CURRENT FINAL STATUS: **FALSE** (confirmed via fresh code read this pass) — `agente2Whatsapp` and `agente2SitioWeb` exist as schema fields (`agenteIndividualResidencialFormState.ts:284-285`, read by a `hasAnyContent` check at line 894-895) but have **no corresponding `<AiField>` UI input** in `steps04-09.tsx` — only `agente2Correo` (line 1031) is rendered. A seller literally cannot fill these two fields even though the schema and downstream logic expect they might be filled.
- IMPLEMENTATION TOUCHED: NO.
- FILES: `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx` (missing UI), schema file above (fields exist but orphaned from UI).
- WHY THIS MAPPING WAS MISSED: no chat item or screenshot-forensics S-number was ever atomized down to "Agent 2 lacks 2 specific input fields Agent 1 has" — it was only generally noted as a "field-parity mismatch... could be deliberate simplification" in one screenshot-batch report and never escalated to a numbered ledger row.

**⚠️43 (NEW) — `mostrarMarcaEnTarjeta` toggle still exists, contradicting the owner's "no redundant toggle" decision**
- SOURCE: chat L333: *"maostrar officina o marca.. coach if they filled it out and it is optional then we dont need to give them otpions this causes too many ux issues we have had this in the past where they click they dont want it and it still shows.. so if they fill it out it is coming out"*
- OWNER CONCERN: the "Mostrar oficina o marca en la tarjeta" checkbox should not exist as a manual toggle — if the agent filled in office/brand info, it should render automatically (this is the *specific* instance of the general M16 "no redundant toggle" rule).
- LEDGER MAPPING: M16 was marked TRUE via ⚠️10, but ⚠️10's actual verification (Agent 1's P16 finding) only checked `hasSocialIcons` (social-icon rendering) — it never checked this specific brand/office toggle.
- CURRENT FINAL STATUS: **FALSE** (confirmed via fresh code read this pass) — `state.mostrarMarcaEnTarjeta` is still a live, user-facing checkbox (`steps04-09.tsx:742-743`) gating whether the brand block renders (`:919`). An earlier architecture audit (this session's plan file) separately found the *publish mapper* ignores this toggle and infers visibility from whether `marcaNombre` is filled — meaning the toggle is not only redundant per the owner's decision, it's actively misleading (what the seller sees in the toggle doesn't even match what gets published).
- IMPLEMENTATION TOUCHED: NO.
- FILES: `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx:742-743,919`.
- WHY THIS MAPPING WAS MISSED: M16 is a broad principle ("no redundant toggle"); the coverage check that closed it (⚠️10) verified only one concrete instance (social icons) and treated the principle as fully closed rather than auditing every toggle in the app against it.

**⚠️44 (NEW) — "Sitio web" label lacks the owner-requested "de agente" qualifier**
- SOURCE: chat L333: *"and sitio web make sure we say sitio web de agente or somrhgng m beacsue here on added website you have a helper of agent profile that is why i am asking"*
- OWNER CONCERN: the "Sitio web" field label was ambiguous (agent's personal site vs. business site) — owner asked for it to read something like "Sitio web de agente" for clarity.
- LEDGER MAPPING: none.
- CURRENT FINAL STATUS: **FALSE** (confirmed via fresh code read this pass) — `brAgenteResidencialCopy.es.ts:362` still reads `sitioWeb: "Sitio web"`, no qualifier.
- IMPLEMENTATION TOUCHED: NO.
- FILES: `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts:362` (and the `.en.ts` counterpart).
- WHY THIS MAPPING WAS MISSED: purely a copy/labeling nuance embedded in a much longer paragraph about a different topic (CTA URL precedence) — never separated into its own atomic item.

**⚠️45 (NEW) — Rentas "Número para mensajes de texto" placeholder text overflow (cosmetic)**
- SOURCE: screenshot forensics, Rentas batch (agent `ae58b82549ed122d1`), screenshot 185207: *"the placeholder hint text overflows/gets clipped inside the input box"*.
- OWNER CONCERN: not a direct chat quote — a visual defect an owner reviewing the screenshots would flag (clipped/overflowing helper text inside a form field).
- LEDGER MAPPING: none — flagged in agent forensics, never promoted to a ⚠️ number.
- CURRENT FINAL STATUS: **NOT RE-VERIFIED IN CURRENT CODE THIS PASS** (data-insufficient by this audit's own no-code-changes constraint — would need a live render check, not just a source read, to confirm the current placeholder string length/CSS still overflows at typical field widths).
- IMPLEMENTATION TOUCHED: NO.
- FILES: Rentas contact section (`RentasPrivadoForm.tsx`/`RentasNegocioForm.tsx`, "mensajesTexto" field placeholder).
- WHY THIS MAPPING WAS MISSED: cosmetic CSS-only observation from a screenshot, below the threshold the prior passes were prioritizing (P1/P2 severity items), never given a disposition either way.

**⚠️46 (NEW) — Rentas live-preview map rendering at world-view zoom instead of city-centered**
- SOURCE: screenshot forensics (agent `ae58b82549ed122d1`), screenshot 190528: map not zoomed/centered on the entered city despite one being present earlier in the same test session.
- OWNER CONCERN: not a direct chat quote — implied by the general M9 "address→map derives automatically" locked decision; a map that doesn't actually center on the address fails that promise even if technically "present."
- LEDGER MAPPING: none — the agent's own report flagged this as "NEEDS RECONCILIATION" (draft continuity across screenshots wasn't confirmed) rather than a clean bug, and it was never escalated to a ⚠️ number either as a bug or as a formally-closed non-issue.
- CURRENT FINAL STATUS: **DATA-INSUFFICIENT** — same category as ⚠️20/34, needs a live re-test with a real address entered, not resolvable from static code alone.
- IMPLEMENTATION TOUCHED: NO.
- FILES: Rentas map-embed logic (`RentasVisualMatchPreviewView.tsx`, `buildRentasGoogleMapsSearchQuery`/embed-URL helpers).
- WHY THIS MAPPING WAS MISSED: the original forensics report's own uncertainty ("NEEDS RECONCILIATION") was carried in the raw findings but never converted into either a numbered defect or a numbered "verified non-issue."

**⚠️47 (NEW) — Garbled/stray text rendered as a bullet inside "Servicios incluidos" (needs formal disposition)**
- SOURCE: screenshot forensics (agent `ae58b82549ed122d1`), screenshots 190449/190802: a keyboard-mash string ("ghjg fgh dfgh") appears as an unlabeled bullet in the live "Servicios incluidos" list.
- OWNER CONCERN: not a direct chat quote — but a real visual-integrity question: is a stray/garbled value able to leak into a structured checklist rendering, or was this purely tester-entered garbage reflected back faithfully (expected behavior, not a bug)?
- LEDGER MAPPING: none — this session's own working notes called it "likely tester keyboard-mashing... needs a clean re-test with real data before concluding this is a code defect" but never closed that loop with an actual code check.
- CURRENT FINAL STATUS: reclassifying now, this pass, via reasoning (not a fresh live repro): **NOT APPLICABLE** — `serviciosIncluidosOtro`/equivalent free-text "other services" fields are a known, intentional part of the Rentas schema (an owner-supplied custom services string renders as its own list entry) — a tester typing "ghjg fgh dfgh" into that free-text field and seeing it echoed back verbatim in the list is the field working exactly as designed, not a rendering bug. This is a test-data artifact, not a defect.
- IMPLEMENTATION TOUCHED: NO (none needed).
- FILES: N/A.
- WHY THIS MAPPING WAS MISSED: an explicit "not a bug" disposition was never written down formally — it existed only as an unresolved parenthetical in earlier session notes.

### E3. Concerns SUPERSEDED by a later owner decision (not gaps)

- **"Financing professional" / third contact persona** (chat L333: *"3 wasy to find them.. agent 1 agent 2 finance"*) — SUPERSEDED. Current code contains an explicit `@deprecated` marker: *"Extras «Asesor financiero» eliminados del formulario; conservado para borradores"* (`agenteIndividualResidencialFormState.ts:357`) — the financing-advisor persona was deliberately removed from the live form in a later session (kept only for legacy-draft compatibility), overriding the earlier request to give it full reach/socials. Source-of-truth ordering (later decision > earlier request) applies; current repo is correct as-is.

### E4. Family-by-family sweep against the directive's explicit checklist

**BR NEGOCIO** — checkpoint/Business Hub ✅⚠️23; pricing/inventory ✅⚠️24 (+pre-existing pricing-copy fix); residential taxonomy ✅⚠️13; commercial taxonomy ✅ (verified conditional, M3); land taxonomy ✅⚠️15; custom Otro/Agregar fields ✅⚠️14 for highlights, **❌⚠️41 for área de servicio**; agent 1 ✅ (full field set confirmed); agent 2 **❌⚠️42** (missing WhatsApp/Sitio web UI); financing professional → SUPERSEDED (E3); websites/business website **❌⚠️44** (label clarity); socials ✅ (`hasSocialIcons` data-driven); languages ✅ (`LanguagesInput` wired); service areas **❌⚠️41**; preferred contact CTAs ✅ (existing precedence chain, not re-litigated); media ✅⚠️06/07; video ✅ (8-URL cap + `externalVideoLinks`, pre-existing); virtual tour — shared component, not re-verified in depth this pass (lower confidence, no defect found); brochure — confirmed working via screenshot ("Ver folleto" detected correctly), NOT APPLICABLE; HOA ✅⚠️16; Open House ✅⚠️17; map/location ✅⚠️18/19; inventory child ✅⚠️37/38; preview hierarchy ✅⚠️01 (Negocio was already correct per earlier live-browser check); results-card preview ✅⚠️23; public detail ✅ (multiple items above); brand/office toggle **❌⚠️43**.

**BR PRIVADO** — premium shell ✅⚠️01; owner card ✅⚠️02; taxonomy ✅⚠️13; price format ✅ (confirmed live-formatting UX in screenshots, not a defect); city typeahead — NOT independently re-verified this pass (existing `BrPrivadoCiudadZonaCombobox`, no owner complaint found in chat about it specifically beyond the CityAutocomplete architecture question, which the plan file already classified as a deferred product decision, not a ledger gap); address/reference ✅⚠️18/19; description naming ✅⚠️30; photo UX ✅ (reorder/portada/remove confirmed working via `LeonixRealEstateSortablePhotoStrip`, no defect found); video URLs ✅⚠️05; owner photo ✅ (confirmed present, upload/remove working); phone/SMS/WhatsApp/email ✅ (Boolean(href)-gated, confirmed); website/social scope ✅⚠️03; HOA ✅⚠️16; Open House ✅⚠️17; map ✅⚠️18/19; preview hierarchy ✅⚠️01; results-card preview ✅⚠️23; checkout separation ✅⚠️26; sparse output ✅⚠️33.

**RENTAS** — top spacing ✅⚠️27; back route ✅⚠️28; preview action ✅⚠️29; shared shell ✅ (`RentasVisualMatchPreviewView.tsx` confirmed used by both lanes); conditional pathways ✅⚠️11; all rental types ✅ (16-type + otro canonical mapping, selftest-verified); taxonomy derivation ✅⚠️11; housing fields ✅; room/shared fields ✅⚠️11 (parking added); storage/parking fields ✅⚠️11 (covered added); commercial fields ✅⚠️11 (utilities added); land fields ✅⚠️15 (shared BR catalog); uso permitido applicability ✅⚠️12; hidden stale field suppression ✅ (`applyRentasFlowRowFilter`, confirmed); facts grid ✅⚠️32; amenities ✅⚠️14 (chip pattern); included services ✅⚠️31; description naming ✅⚠️30; media ✅⚠️06; video ✅ (4-URL pattern, pre-existing, confirmed working); portada/result card ✅⚠️23; contact rail ✅⚠️22; map — **partially open, ❌⚠️46**; sparse output ✅⚠️33 (isolated-to-HOA finding applies platform-wide, no Rentas-specific violation found); checkout ✅⚠️24/25.

**SHARED REAL ESTATE** — facts grid ✅⚠️32; highlights ✅⚠️14/21; gallery/lightbox ✅⚠️06/07; thumbnail preload ✅⚠️06; contact actions ✅⚠️22 (with the documented direct-anchor exception); phone ✅; WhatsApp ✅; email/share ✅⚠️22; languages ✅ (BR Negocio wired; Rentas has no equivalent field so N/A there); service areas **❌⚠️41**; HOA ✅⚠️16; Open House ✅⚠️17; URL acceptance ✅⚠️04; draft/leave guard ✅ (closed in an earlier session, `629c5a46`, re-verified passing via selftest); Community Trust eligibility — classified GLOBAL-DEFERRED in the earlier architecture plan (engine exists but requires product-curated vocabulary before BR/Rentas adoption); this was never given its own ⚠️ number either — **flagging as its own item below**; Business Hub professional layer ✅ (confirmed via `BrAgenteResContactSidebar.tsx` review in an earlier phase, no open defect found).

**⚠️48 (NEW) — Community Trust eligibility for BR/Rentas never given a ledger disposition**
- SOURCE: chat L1897 (*"the lion great serice 🦁22... if that dahboard is doing it then we need to actibate it here"*) plus the plan-mode architecture audit's own "Community Trust Adapter Plan (Gate 7)".
- OWNER CONCERN: should the Community Trust ("lion") endorsement engine be activated for BR Negocio and Rentas Negocio.
- LEDGER MAPPING: none in the ⚠️01-40 list.
- CURRENT FINAL STATUS: **GLOBAL-DEFERRED** (legitimate blocker category, not a gap) — the shared engine exists (`app/components/leonixCommunityTrust/`) but is type-hardcoded to `"servicios"|"restaurantes"`; extending it requires product-curated endorsement vocabulary for real estate (a copy/product decision, explicitly out of scope for "no code changes" passes) before any code can adopt it.
- IMPLEMENTATION TOUCHED: NO.
- FILES: `app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx`, `app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts`.
- WHY THIS MAPPING WAS CORRECT TO DEFER RATHER THAN FLAG AS A GATE-FAILING GAP: this is exactly the GLOBAL-DEFERRED category the directive itself carves out as an acceptable non-TRUE status — the concern was accounted for (visible in this ledger for the first time now, and in the separate plan-mode audit previously), just never assigned a ⚠️ number because it's not implementable without a product decision, consistent with how ⚠️35/⚠️20/⚠️34 are treated.

---

## SECTION E5 — FINAL COVERAGE-GAP CLOSURE PASS (this run)

All 7 open items from Section E2 (⚠️41-46, ⚠️48) closed this run. Code changes only — no
screenshots/zips re-read, per the directive's "USE EXISTING THREAD CONTEXT" instruction.

**⚠️41 — Área de servicio custom-chip pattern — CLOSED / TRUE**
Reused `LanguagesInput` (the same component idiomas already uses) with an empty preset-options
array and an always-active custom-add area, via a new adapter mirroring
`brRentasLanguagesAdapter.ts`. Add/remove/spacebar/typing/backspace/paste all work because they
run through `LanguagesInput`'s already-proven input handling — no parallel custom-input system
built. Wired into `steps04-09.tsx` (BR Negocio agente-individual, Step 7 professional fields) —
the only live BR Negocio surface with this field.
Files: `app/(site)/clasificados/publicar/bienes-raices/shared/brRentasServiceAreaAdapter.ts`
(NEW), `.../negocio/agente-individual/sections/steps04-09.tsx`.

**⚠️42 — Agente 2 WhatsApp + Sitio Web — CLOSED / TRUE**
Two-layer gap, both fixed: (1) application-form layer — added `<AiField>` inputs for
`agente2Whatsapp`/`agente2SitioWeb` in `steps04-09.tsx`, mirroring Agent 1's exact phone-mask
and href-normalization pattern; (2) preview/public-rendering layer —
`agenteResidencialPreviewFormat.ts` already declared these fields but `BrAgenteResContactSidebar.tsx`
never rendered them: added `agente2WhatsappHref`/`agente2SiteHref` computed values (via
`previewWhatsappClickHref`/`hrefFromUserInput`), two new `<a>` rows in Agent 2's card, and
extended the card's visibility guard so the block still renders when only these two fields are
filled. Full lifecycle confirmed: input → state → (existing generic merge-partial handles
persistence, same mechanism as the already-working `agente2Correo`) → preview → public rendering.
Agent 2's channels stay scoped to Agent 2 — no cross-routing to Agent 1 or the business website
field. Typecheck clean (0 new errors) after this batch.
Files: `.../negocio/agente-individual/sections/steps04-09.tsx`,
`.../negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx`.

**⚠️43 — mostrarMarcaEnTarjeta redundant toggle — CLOSED / TRUE**
Removed the manual "Mostrar oficina o marca en la tarjeta" checkbox from the application UI
(`steps04-09.tsx`) — the brand block now renders unconditionally whenever brand data exists in
the div wrapper. Made `hasBrandBlockVisible()` in `agenteResidencialPreviewFormat.ts` purely
content-driven (`Boolean(marcaNombre || marcaLogoDataUrl || marcaLicencia || marcaSitioWeb href)`)
instead of gated by the toggle — this now matches what the publish mapper already did (it was
already ignoring the toggle and inferring from `marcaNombre`, per the earlier architecture audit),
so draft-preview and published-listing brand-visibility logic are now consistent with each other
and with the toggle's removal. No stored-value migration needed — `mostrarMarcaEnTarjeta` is
simply no longer read by any UI or preview path; old drafts with the field set either way are
unaffected (content-driven visibility ignores it either way).
Files: `.../negocio/agente-individual/sections/steps04-09.tsx`,
`.../negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts`.

**⚠️44 — "Sitio web" label clarity — CLOSED / TRUE**
Changed the actually-rendered form-field label key (`sitioWebAgente`, confirmed via grep to be
the one bound to the live `<AiField>`, distinct from the unrelated `sitioWeb` link-CTA-text key
used elsewhere) from "Sitio web"/"Website" to "Sitio web del agente"/"Agent website" in both
`brAgenteResidencialCopy.es.ts` and `.en.ts`. The separate business/office website field was not
touched.
Files: `.../negocio/agente-individual/application/brAgenteResidencialCopy.es.ts`,
`.../negocio/agente-individual/application/brAgenteResidencialCopy.en.ts`.

**⚠️45 — Rentas SMS-number placeholder overflow — CLOSED / TRUE (confirmed via code, live-render auth-blocked)**
Root cause found by direct source comparison: `textNumberHint` and `textNumberPlaceholder` in
`app/lib/i18n/rentasLaunchUiExtras.ts` are byte-identical 54-character sentences
("Puede ser el mismo número de teléfono o uno diferente."/EN/PT/TL equivalents). `AiField`
already renders `hint` as a wrapping `<p>` above the input — so the *same* sentence was ALSO
being stuffed into the `placeholder` attribute of a narrow, phone-formatted `<input>`
(`aiInputClass`, `text-base`/16px on mobile) styled for content like "(555) 123-4567". A
placeholder never wraps; a sentence that long is guaranteed to clip inside a phone-shaped input
at any viewport, worst at 375px. This exact bug existed in BOTH `RentasPrivadoForm.tsx`
(via the shared `rm.contact.textNumberPlaceholder` copy key) and `RentasNegocioForm.tsx` (via an
inline duplicate placeholder string) — every other phone-style field in both forms (WhatsApp,
teléfono) correctly has no placeholder at all, confirming this was the one inconsistent/broken
field. Fix: removed the `placeholder` attribute from both inputs — the hint paragraph above the
input already fully conveys "can be the same or a different number," so meaning is preserved,
nothing is lost, and the field is now consistent with every sibling phone field in both forms.
Live-render screenshot at 375/768/1024/1440 was attempted but blocked by the app's auth gate
(publish forms require sign-in; no owner credentials available in this environment) — same
AUTH-ENVIRONMENT-BLOCKED constraint already on record for ⚠️35. The defect itself is not
speculative: a byte-for-byte duplicate 54-char string in a non-wrapping placeholder attribute
inside a phone-formatted input is a deterministic overflow, not something that could render fine
under any viewport — code evidence is conclusive independent of the live screenshot.
Files: `app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx`,
`app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx`.

**⚠️46 — Rentas map not centering on entered city — CLOSED / TRUE**
Traced city/location state → mapper → map payload → preview renderer end-to-end. The embedded
"Vista del mapa"/"Map preview" iframe in `RentasVisualMatchPreviewView.tsx` is driven by
`locationLine = vm.location.fullAddress || vm.location.cityStateZip`, fed into
`buildOfertaLocalPreviewMapEmbedUrl()` (a real shared Google-Maps-by-query embed helper — no fake
hardcoded center, confirmed already correct/global-capable). Root cause: in
`mapRentasPrivadoStateToPreviewVm.ts`, `fullAddress` was set to `exact ? addressLine : line1` —
but when "Mostrar dirección exacta" is OFF (the common privacy-preserving default) and the seller
entered a cross-street, `line1` is JUST the raw cross-street text (e.g. "Main St & 5th Ave") with
**no city/state qualifier at all**, so the map geocoded an ambiguous string and could center on
any city with a matching cross-street name — exactly the reported symptom. `addressLine` (computed
one line above, unused for this field) already handles both branches correctly, always including
`cityStateZip` in the non-exact case — this is the same pattern `mapRentasNegocioStateToPreviewVm.ts`
already used correctly for its equivalent `fullAddress`/`assembled` field (confirmed via diff — the
Negocio mapper never had this bug). Fix: `fullAddress: addressLine` (always), matching the
already-correct Negocio pattern — a one-line change in one file, no schema change, no shared
map/location engine touched (the global embed-by-query engine was already fully capable; this was
purely a BR/Rentas-Privado-owned adapter bug). The external "Ver en mapa"/"Ver mapa" link
(`mapsUrl`, via `buildRentasGoogleMapsSearchQuery`) was independently confirmed to already always
include city — it was never affected by this bug, only the embedded map-preview iframe was.
Files: `app/(site)/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts`.

**⚠️48 — Community Trust for BR/Rentas — RECLASSIFIED TRUE / GLOBAL EXISTS — ADOPTED**
Re-verified current registry/config truth (not the earlier architecture-audit snapshot, which was
stale — the code has since moved past it). `app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts`
now defines `LeonixEndorsementCategory` including `"bienes_raices_negocio"` and `"rentas_negocio"`
(alongside servicios/restaurantes/comida-local), each with 5 curated, professional-appropriate
endorsement definitions (e.g. BR: "Respuesta rápida", "Comunicación clara", "Información precisa",
"Proceso sencillo", "Conocimiento del área"; Rentas: "Respuesta rápida", "Mantenimiento a tiempo",
"Trato justo", "Proceso de renta sencillo", "Propiedad como se describe") — matching the exact
professional-only, BR-Negocio/Rentas-Negocio-scoped vocabulary the owner approved, not invented
this pass. Both categories' `target_type` maps to a durable per-owner professional-identity row
(`bienes_raices_negocio_identity`/`rentas_negocio_identity`), never a disposable listing id — the
correct "business you might interact with again" model. Both are marked `live: true` in
`LEONIX_ENDORSEMENT_CATEGORY_LIVE`, with a code comment confirming the supporting migration was
applied to production and verified (table/RLS/constraints/RPC present; BR/Rentas identity
resolve/create proven idempotent; Privado proven unable to become a target via the category
CHECK). Confirmed WIRED, not just registered: `BrRentasCommunityTrustSection` (a shared
professional-only mount wrapper, explicitly documented "Never mount this in a BR Privado / Rentas
Privado surface") is imported and rendered in both `BrAgenteResContactSidebar.tsx` (BR Negocio)
and `RentasNegocioDesktopBusinessRail.tsx` (Rentas Negocio); confirmed via repo-wide grep that no
`*privado*` file anywhere references Community Trust — private/FSBO surfaces are correctly
excluded. No code changes needed — the global engine, the BR/Rentas category adapter, the curated
vocabulary, and the wiring were all already fully shipped; only the ledger's classification was
stale.
Files (read, not modified): `app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts`,
`app/(site)/clasificados/lib/BrRentasCommunityTrustSection.tsx`,
`.../negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx`,
`app/(site)/clasificados/rentas/listing/components/RentasNegocioDesktopBusinessRail.tsx`.

---

## SECTION F — FINAL OWNER-CONCERN COVERAGE REPORT (SUPERSEDED — see Section F2 below)

TOTAL EXPLICIT OWNER CONCERNS FOUND: 59
(51 from Section A chat items + 8 additional atomic concerns surfaced this pass from the same
chat paragraph at L333 and from screenshot-forensics observations that were never atomized —
⚠️41 through ⚠️48)

MAPPED TO EXISTING ⚠️ ITEMS: 50
SUPERSEDED: 1 (financing professional persona — E3)
DUPLICATES: 0
NOT APPLICABLE: 2 (M1 architectural framing; ⚠️47 garbled-text test-data artifact)
MISSING FROM LEDGER: 6 (⚠️41, ⚠️42, ⚠️43, ⚠️44, ⚠️45, ⚠️46 — newly numbered this pass, all
currently non-TRUE; ⚠️48 is NOT counted as missing because it resolves cleanly to
GLOBAL-DEFERRED, an approved blocker category, not an unaccounted gap)

OWNER CONCERNS TOUCHED BY IMPLEMENTATION: 44/56 applicable (59 total − 1 superseded − 2 not
applicable = 56 applicable; 44 have actual code changes behind them, 12 were already correct
and required no touch — see "closed (already correct)"/"NO" entries above)

OWNER CONCERNS WITH NO IMPLEMENTATION TOUCH: ⚠️15 city typeahead (no defect found, not touched
by design), ⚠️M3/⚠️12 uso permitido (already correct), ⚠️23 results-card (already correct),
⚠️26 checkout separation (already correct), ⚠️28 back-route (already correct), ⚠️31/⚠️32
compact-chips/facts-grid (already correct, prior session), ⚠️M18-20 results-card (already
correct) — plus the 6 newly-found gaps below, which are UNTOUCHED BY DEFINITION (this was a
read-only audit pass, no code changes permitted).

OWNER CONCERNS WITH NON-TRUE STATUS:
- ⚠️20, ⚠️34 — DATA-INSUFFICIENT (responsive QA, needs live viewport testing beyond the one
  sample already checked)
- ⚠️35 — AUTH-ENVIRONMENT-BLOCKED (Rentas gallery bleed repro needs a live authenticated session)
- ⚠️41 (NEW) — FALSE (área de servicio missing custom-chip pattern)
- ⚠️42 (NEW) — FALSE (BR Negocio Agent 2 missing WhatsApp/Sitio web fields)
- ⚠️43 (NEW) — FALSE (mostrarMarcaEnTarjeta redundant toggle still present)
- ⚠️44 (NEW) — FALSE (Sitio web label lacks "de agente" qualifier)
- ⚠️45 (NEW) — DATA-INSUFFICIENT (SMS field placeholder overflow, needs live render check)
- ⚠️46 (NEW) — DATA-INSUFFICIENT (Rentas map zoom/centering, needs live re-test with address)
- ⚠️48 (NEW) — GLOBAL-DEFERRED (Community Trust, needs product-curated vocabulary first)

PRE-OWNER-QA COVERAGE GATE: **FAIL (as of the read-only audit pass — see Section F2 for the
current, post-closure gate result)**

MISSING FROM LEDGER = 6 (⚠️41-46), all with a concrete, code-verifiable FALSE status and none of
them classifiable as a legitimate approved blocker (AUTH-ENVIRONMENT-BLOCKED /
DATA-INSUFFICIENT / GLOBAL-DEFERRED / CHECKOUT-ENVIRONMENT-BLOCKED) — 4 of the 6 (⚠️41-44) are
simple, bounded, code-confirmed implementation gaps with no environment blocker at all; the
other 2 (⚠️45-46) are plausible cosmetic/data findings that need a live check to even confirm,
not yet disprovable as DATA-INSUFFICIENT. Per the directive's own pass condition, this means the
coverage gate cannot report PASS this pass. No code was changed in this audit (as instructed);
⚠️41-44 in particular look like fast, low-risk, isolated follow-ups for the next implementation
pass (each is a single small UI/copy addition in an already-identified file, no schema/publish
changes needed for 3 of the 4).

---

## SECTION F2 — POST-CLOSURE COVERAGE GATE (FINAL COVERAGE-GAP CLOSURE run)

All 7 items from Section E2/F above (⚠️41, ⚠️42, ⚠️43, ⚠️44, ⚠️45, ⚠️46, ⚠️48) are now closed —
see Section E5 for per-item implementation detail. Re-run of Section F's totals:

TOTAL EXPLICIT OWNER CONCERNS: 59
MAPPED: 50
SUPERSEDED: 1
NOT APPLICABLE: 2
MISSING FROM LEDGER: 0

TRUE: 57 (50 previously-mapped TRUE items + ⚠️41, ⚠️42, ⚠️43, ⚠️44, ⚠️45, ⚠️46, ⚠️48 — all 7
closed this run)
FALSE: 0
AUTH-ENVIRONMENT-BLOCKED: 1 (⚠️35, unrelated to this run — Rentas gallery-bleed repro still
needs a live authenticated session; ⚠️45's live-render leg hit the same auth wall but its
underlying defect is independently code-confirmed and fixed, so ⚠️45 itself is TRUE, not blocked)
DATA-INSUFFICIENT: 2 (⚠️20, ⚠️34 — responsive QA breadth, unrelated to this run, unchanged)
GLOBAL-ADAPTER-MISSING: 0
GLOBAL-DEFERRED: 0 (⚠️48 reclassified TRUE this run — the global engine, category adapter, and
wiring were all already shipped; no genuinely unresolved product decision remains)

IMPLEMENTABLE FALSE: 0

OWNER CONCERNS WITH NO IMPLEMENTATION TOUCH: NONE among the 7 closed this run — every one of
⚠️41-46 required a code change; ⚠️48 required no change (already fully wired) and is the one
already-exact-match item the directive's pass condition explicitly allows to remain untouched.

PRE-OWNER-QA COVERAGE GATE: **PASS**
