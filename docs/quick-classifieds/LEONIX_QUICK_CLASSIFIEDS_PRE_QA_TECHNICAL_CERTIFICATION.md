# LEONIX QUICK CLASSIFIEDS — PRE-QA TECHNICAL CERTIFICATION (2026-09-20)

Purpose: the durable technical evidence package the PM uses to decide whether owner/human QA may start. Nothing here was accepted from prose; every verdict points into `LEONIX_QUICK_CLASSIFIEDS_FINAL_PROOF_MATRIX.md` (row ids) and `LEONIX_QUICK_CLASSIFIEDS_VERIFIER_DRIFT_LEDGER.md`, both re-grounded in current source in this mission.

## Git

| Item | Value |
| --- | --- |
| EXACT BRANCH | `claude/quick-classifieds-master-build-0j5p30` |
| START HEAD (mission start) | `2c70eb10e58bdbed8cfc0d945ddc90c4dd96b864` |
| EXACT HEAD (this certification) | the commit that adds this file (`git log -1 -- docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_PRE_QA_TECHNICAL_CERTIFICATION.md`); this mission adds ONLY `scripts/verify-quick-classifieds-interaction-02.ts`, `scripts/verify-quick-classifieds-proof-matrix-03.ts`, two `package.json` script entries and docs — no file under `app/` changed |
| CURRENT MAIN | `fd9094994aa2a63fdcea49f24b2435300a7b49a4` (did NOT advance since the integration gate; `git fetch origin main` re-checked in this mission) |
| AHEAD / BEHIND | 10 / 0 at mission start; +1 docs/verifier commit after this mission |
| MAIN MERGED | NO |
| PRODUCTION TOUCHED | NO (no deploy, no alias, no env, no Supabase mutation — the one Supabase call was a read-only `SELECT` on `storage.buckets` / `pg_policies`) |

## Preview identity

| Item | Value |
| --- | --- |
| PREVIEW DEPLOYMENT ID | `dpl_6d6FQxhYmywSUsacmzs1XGwSns8H` (READY; URL `https://leonix-media-ez4w5ndvb-jesus-caceres-projects.vercel.app`) |
| PREVIEW CODE SHA | `c3b85eea4a66a05d323be7e8a7a9acde0c92a3d9` |
| CODE DIFFERENCE AFTER PREVIEW | `git diff --stat c3b85eea 2c70eb10` = 2 docs files (`LEONIX_QUICK_CLASSIFIEDS_INTEGRATION_HANDOFF.md`, `LEONIX_QUICK_CLASSIFIEDS_OWNER_QA.md`); this mission's commit = verifiers + docs + `package.json` scripts (no `app/`) |
| PREVIEW_CODE_EQUIVALENCE | PROVEN (Proof Matrix PV-01) |
| PREVIEW STALE | NO |
| Last full TypeScript + production build | PASS at code SHA `1a801e91` (Integration Handoff); `git diff 1a801e91 HEAD -- app` = 0 files, so it applies to the certified code (NR-02) |

## Proof matrix totals (`LEONIX_QUICK_CLASSIFIEDS_FINAL_PROOF_MATRIX.md`, checked by `scripts/verify-quick-classifieds-proof-matrix-03.ts`)

| Metric | Value |
| --- | --- |
| TIER-1 REQUIREMENT TOTAL | 136 rows |
| PROVEN | 129 |
| PROVEN_NA | 4 — EV-11 (En Venta is free), EV-14 (no En Venta renewal SKU), AU-13 (active private-auto rows are not editable by canonical rule), EM-15 (no Empleos renewal SKU) |
| BLOCKED | 3 — SL-05 / SL-06 (staff-only publish-as-customer and unclaimed publish: NOT_SUPPORTED_BY_CURRENT_CLASSIFIED_CUSTODY; the UI never promises them), EM-17 (Empleos premium lane media drop: OUT_OF_SCOPE_EXISTING_DEFECT) |
| REPAIR_REQUIRED | 0 |
| REQUIRED TIER-1 BLOCKERS (BLOCKED rows a Tier-1 customer promise depends on) | 0 |

## Category verdicts

| Area | Verdict | Proof rows |
| --- | --- | --- |
| EN VENTA (free) | PROVEN — full chain from Quick fields to `listings` row, `listing-images` upload, `/clasificados/anuncio/[id]`, generic owner editor, owner-scoped sold; unwired fields 0 | EV-01 … EV-16 |
| RENTAS PRIVADO (paid `rentas_30d`) | PROVEN — canonical draft → existing paid preview → pending row → Revenue OS (server price) → activation with 30-day term → same renderer public page → listing-edit (owner+category+lane) → rented via the existing status control → same-row renewal; unwired fields 0 | RE-01 … RE-17 |
| EMPLEOS STANDARD (paid `empleos_job_post_paid`) | PROVEN — canonical session draft → existing quick-preview checkout → NEW narrow upload helper hosts local photos in the existing `listing-images` bucket under the customer's uid BEFORE the unchanged envelope mapper → draft row (owner = bearer) → Revenue OS → publish → public hero from the uploaded HTTPS image → edit hydration keeps refs → archive; unwired fields 0; Feria and premium untouched | EM-01 … EM-16 (EM-17 = premium, BLOCKED, out of scope) |
| AUTOS PRIVADO (paid `autos_privado_30d`) | PROVEN — namespaced canonical draft → existing preview in draft mode → pending row via bearer API (server rejects local photo refs; Blob bridge hosts them) → Revenue OS → activation → live page → unpublish (owner, active only) → same-row renewal; active edit is canonical N/A; Dealer untouched | AU-01 … AU-16 |
| SHARED FIELD WIRING | PROVEN — raw keystrokes, boundary-only normalization (runtime-proven on the representative strings), back/next persistence, visible prefills, media controls; every declared field key is read by its adapter (static detector with self-tested teeth); unwired visible fields 0 | SQ-06, FW-01 … FW-18 |
| MEDIA | PROVEN — ≥1 real image enforced on the Quick path and carried by every category's existing publisher; uploads run under the customer session; no new storage surface (`listing-images` policy re-read read-only) | SQ-07, EV-09, RE-09, AU-09, EM-09, MD-01 … MD-03 |
| PAYMENT | PROVEN — no Quick price/SKU; package keys are the four existing matrix keys; `/api/revenue-os/checkout` prices from `packageDef.priceCents` server-side; free En Venta bypass is canonical | SQ-09, RE-10, AU-10, EM-10, PR-01 … PR-03 |
| LIFECYCLE | PROVEN — no Quick states; canonical end verbs; same-row renewal for Rentas/Autos; expiration read-time for Rentas/Autos, none for En Venta/Empleos by canonical design | LC-01 … LC-04 and the per-category EDIT/END/RENEW rows |
| OWNERSHIP | PROVEN — no listing-id-only mutation; owner from server-verified session/bearer; staff uid never becomes owner; category/lane scope enforced | AU-SEC-01 … AU-SEC-04 |
| STAFF LAUNCHPAD | PROVEN for open/share/assist/manage (SL-01 … SL-04, SL-07 … SL-09); staff-only publish-as-customer and unclaimed publish are BLOCKED = NOT_SUPPORTED_BY_CURRENT_CLASSIFIED_CUSTODY and are not claimed by any label (SL-05, SL-06, SL-08 — UI copy over-promise: NO) | SL-01 … SL-09 |
| COMMUNITY DIRECT LINKS | PROVEN — Clases, Comunidad, Busco, Mascotas link to their existing short forms from both the customer chooser and the staff launchpad; duplicate ACTIVE Quick form: NO. Exception recorded: the generic `/publicar/rapido/<community>` route is still served when typed by hand (dormant, unlinked; writes the same canonical draft) | CM-01 … CM-05 |
| LIGHTWEIGHT CUSTOMER CONTROL | PROVEN (functional) — classification FUNCTIONAL_BUT_NOT_LIGHTWEIGHT: the doorway is links-only into the category-filtered existing dashboards; View / Edit / End / Renew are all reachable and canonical; no new lifecycle engine, no ownership bypass | CC-01 … CC-06 |
| STALE VERIFIER IMPACT | NONE on Quick — 11 known failing verifiers + 1 additional (`en-venta-gate-2q…`) individually classified; every one reads only files that are byte-identical to `origin/main` and asserts a stale copy string / legacy literal / stale fixture; QUICK_REPAIR_REQUIRED = 0; SEPARATE_MAIN_CLEANUP_REQUIRED = 12 | NR-03, drift ledger |
| OUT-OF-SCOPE PROTECTION | PRESERVED — 42-file diff touches no Servicios / Restaurantes / Comida Local / Autos Dealer / BR Negocio-Agent / Viajes / Iglesias / Recursos / Ofertas Locales file; the three modified shared components each have exactly one importer and received additive insertions only | OS-01, OS-02 |
| NO-REGRESSION | 20 focused verifier runs OK in this mission (2 Quick, 8 guards, 4 Empleos, 2 Autos, 3 Rentas, proof-matrix checker); full tsc + build apply by code identity | NR-01, NR-02 |

## Known future limitations (not Tier-1 customer promises; recorded, not hidden)

1. Staff-only publish-as-customer / unclaimed custody for classifieds is not supported by any classified publish route (Servicios-only bridge). Owner decision required before building (PM Control Master §8-B, §15). SL-05, SL-06.
2. Empleos PREMIUM lane still drops local images (same unchanged mapper; separate draft/gallery shape; separate preview client). Fixing it means application code outside Tier-1 and a new Preview. EM-17.
3. "Mi anuncio" is a category doorway into the existing dashboards, not a per-listing control surface (it holds no listing id). A per-listing doorway is a PM product decision. CC-06.
4. The generic `/publicar/rapido/{clases,comunidad,busco,mascotas-y-perdidos}` route remains reachable by typed URL (unlinked); a server redirect to the short form is a one-line application change that would require a new Preview. CM-05.
5. Preview route health was verified to the Vercel SSO wall only (container egress cannot fetch `*.vercel.app` HTML); rendered-pixel checks (notably the Empleos public hero) are owner-QA items by design. PV-02, EM-12.
6. Cross-tab magic-link return starts the new tab without the Quick draft (same limitation as every canonical browser-local draft); same-tab return keeps values and photos. SQ-04.

## Proof-artifact self-audit (Gate 14)

Method: (1) `scripts/verify-quick-classifieds-proof-matrix-03.ts` — every requirement row has the 23 declared columns, an allowed status, a concrete anchor (repository path / function / verifier tag / cross-row id) in its evidence columns, every cited repository path exists on disk, BLOCKED rows carry an explicit classification, REPAIR_REQUIRED = 0, and the Totals table equals the counted rows → OK (136 rows). (2) Word audit over the five artifacts (`FINAL_PROOF_MATRIX`, `VERIFIER_DRIFT_LEDGER`, `FINAL_CERTIFICATION`, `INTEGRATION_HANDOFF`, `TIER1_EXECUTION_LEDGER`) for PASS / works / complete / wired / production ready / safe / canonical / unchanged / preserved: every hit in the two new artifacts sits in a row that cites its source; in the three older artifacts the three summary lines that stated PASS without a path (Final Certification header, Tier-1 ledger EDIT row, Integration Handoff category status lines) were anchored to the matrix row ids or to explicit files, and each older artifact now opens with a "Proof pointer" naming the matrix + drift ledger as the evidence of record.

| Check | Result |
| --- | --- |
| UNSUPPORTED MATERIAL CLAIMS | 0 (after anchoring the 3 summary lines above; no claim was removed because each had source backing in the matrix) |
| CIRCULAR PROOF FOUND | 0 — the matrix cites source, verifiers, the Preview/build records and a read-only DB read; no row cites another document's status as its evidence. The older artifacts summarize the matrix, never the reverse |
| MISSING REQUIREMENT LINKS | 0 (checker: every PROVEN / PROVEN_NA row anchored; every cited path exists) |
| PROOF COMPLETENESS | PASS |

## OWNER QA RELEASE DECISION

Authorization criteria and result:

| Criterion | Result |
| --- | --- |
| zero required BLOCKED rows | MET (0; the 3 BLOCKED rows are outside the customer promise) |
| zero REPAIR_REQUIRED rows | MET (0) |
| proof matrix self-audit passes | MET (`verify-quick-classifieds-proof-matrix-03` OK; word audit 0 unsupported claims) |
| Preview code equivalence proven | MET (PV-01) |
| feature-caused regressions zero | MET (NR-01, NR-03; 20/20 focused runs OK; every failing verifier reads only main-identical files) |
| all Tier-1 customer promises technically represented | MET (EV/RE/AU/EM chains, SQ/FW wiring, MD/PR/LC/AU-SEC rows) |

**OWNER QA RELEASE DECISION: AUTHORIZED**

This decision rests on source-grounded proof, not on the build/typecheck pass alone. Owner QA is the next dependency (packet: `LEONIX_QUICK_CLASSIFIEDS_OWNER_QA.md`, Preview `dpl_6d6FQxhYmywSUsacmzs1XGwSns8H`); it is NOT performed in this mission. Merge to main and Production remain NOT AUTHORIZED.
