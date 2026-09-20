# LEONIX QUICK CLASSIFIEDS — INTEGRATION HANDOFF (2026-09-20)

> Proof pointer (2026-09-20 pre-QA forensic gate): the evidence of record for every technical claim in this file is `LEONIX_QUICK_CLASSIFIEDS_FINAL_PROOF_MATRIX.md` (row ids) and `LEONIX_QUICK_CLASSIFIEDS_VERIFIER_DRIFT_LEDGER.md`; a status word here is a summary of those rows, not evidence by itself.

FINAL FEATURE SHA: the commit that adds this file (`git log -1 -- docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_INTEGRATION_HANDOFF.md`); last CODE SHA `1a801e91702c9f0c10466726d57a30cfc7921cee`; Owner-QA packet SHA `eb6bf5893ab67df29055dce338f090f2f4aae4dd`. Docs-only commits after `1a801e91`.
CURRENT ORIGIN MAIN SHA: `fd9094994aa2a63fdcea49f24b2435300a7b49a4`
AHEAD/BEHIND: 9 / 0 after this handoff commit (7 / 0 at gate start)

PREVIEW DEPLOYMENT ID: `dpl_6d6FQxhYmywSUsacmzs1XGwSns8H` — READY at 2026-09-20T02:16:32Z (githubCommitSha `c3b85eea4a66a05d323be7e8a7a9acde0c92a3d9`; earlier attempts `dpl_8FfiiUe8DoodS6NRYdDDVE2ZKErY`, `dpl_5CtQ3eAh2NLEzT1LPEHMWogRyWBt` were CANCELED by the Ignored Build Step)
PREVIEW URL: `https://leonix-media-ez4w5ndvb-jesus-caceres-projects.vercel.app` (branch alias `https://leonix-media-git-claude-quick-cla-e4a3c0-jesus-caceres-projects.vercel.app` → same deployment; SSO-protected, Vercel team login)
PREVIEW STATUS: READY — PREVIEW BLOCKER RESOLVED via a PM-authorized temporary, branch-scoped Ignored Build Step (applied 2026-09-20T02:09:13Z, restored to the exact original `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi` at 2026-09-20T02:28:01Z; see "Preview unblock" below)

FULL TSC RESULT: PASS (0 errors, 176 s) — `npx tsc --noEmit --incremental false`
FULL BUILD RESULT: PASS (exit 0, 402 s, 388 static pages, Quick + admin routes present) — `npm run build`
FOCUSED VERIFIER RESULT: feature-caused regressions 0 — quick verifier OK, 8 guard verifiers OK, Empleos ×4 OK, Rentas ×3 OK, En Venta go-live OK, Autos polish OK, Revenue OS rentas lockdown OK
PRE-EXISTING/STALE VERIFIER CLASSIFICATION (all reproduce identically on pristine origin/main → CURRENT_MAIN_DRIFT / STALE_VERIFIER):
- gate-pkgA-checkpoints-selftest (comida-local card variant)
- verify-checkpoint-first-routes.mjs (hub literal)
- verify-paid-publish-entry-checkpoints.mjs ("Rentas privado" string)
- smoke-active-categories-revenue-os-checkpoint-activation-matrix-01.mjs (Bienes pending_payment string)
- empleos-e3-master-paid-job-product-audit (Full Empleos copy strings)
- gate-i5-8-empleos-autos-viajes-route-drift-selftest (Autos legacy reference)
- en-venta-r14-draft-persistence-smoke, en-venta-r15-photo-resume-smoke (En Venta location/preview-shell copy)
- autos-privado-dealers-public-split-audit
- rentas-field-contract-selftest, rentas-publish-parity-audit

EN VENTA TECHNICAL STATUS: PASS (free; real-image chain; edit + sold canonical) — Proof Matrix EV-01…EV-16
RENTAS TECHNICAL STATUS: PASS (Proof Matrix RE-01…RE-17; existing `rentas_30d` checkout; expiration; rented/end; same-row renewal; real-image chain)
AUTOS TECHNICAL STATUS: PASS (Proof Matrix AU-01…AU-16; existing `autos_privado_30d` checkout; sold/unpublish; same-row renewal; no active edit by canonical rule; real-image chain; Dealer untouched)
EMPLEOS TECHNICAL STATUS: PASS source-proven (Proof Matrix EM-01…EM-16; premium EM-17 BLOCKED out of scope) after the narrow media repair (upload to existing `listing-images` before the unchanged envelope mapper); Feria + premium + public job design untouched; runtime proof of the real photo on the public ad is the key owner-QA item
STAFF PWA TECHNICAL STATUS: PASS (Proof Matrix SL-01…SL-09; staff-only publish / unclaimed custody NOT supported = SL-05/SL-06; one PWA; launchpad additive with four verbs; Tier-1 priority; community direct links; Copy/Share of real routes; no messaging infrastructure)
MY-AD TECHNICAL STATUS: PASS (Proof Matrix CC-01…CC-06, classification FUNCTIONAL_BUT_NOT_LIGHTWEIGHT; links-only doorway into existing owner surfaces; no new lifecycle engine; ownership stays in existing guards)

KNOWN BLOCKERS:
- RESOLVED 2026-09-20: Vercel Preview READY (`dpl_6d6FQxhYmywSUsacmzs1XGwSns8H`); project Ignored Build Step back to its original value, so any further push to this branch is skipped again by design (re-run the same temporary change if a new Preview is ever needed)
- Staff-managed / unclaimed custody for classifieds (Servicios-only bridge) — unchanged, future decision
- Empleos premium lane still drops local images (out of Tier-1)
- Owner runtime QA not yet performed (Preview is READY; app-level rendering behind the Vercel SSO wall must be checked by a signed-in human)

OWNER QA STATUS: PENDING
MERGE STATUS: NOT AUTHORIZED
PRODUCTION STATUS: UNTOUCHED

NEXT PM DEPENDENCY: OWNER/HUMAN QA ON READY PREVIEW `https://leonix-media-ez4w5ndvb-jesus-caceres-projects.vercel.app` (packet: `LEONIX_QUICK_CLASSIFIEDS_OWNER_QA.md`)

## Preview unblock (PM-authorized, 2026-09-20)

PREVIEW_SETTING_BACKUP:
- PROJECT ID: prj_AOEx7UeAvVCKwuKFIa65wcot4rw9 · PROJECT NAME: leonix-media · TEAM: team_wSqEzL32gCp3YGEB9T41fpxo
- CURRENT IGNORED BUILD STEP (verbatim from build log of dpl_8FfiiUe8DoodS6NRYdDDVE2ZKErY): `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`
- PRODUCTION BRANCH: main (every production deployment carries githubCommitRef `main`; latest prod dpl_5hM64z6rjQsLDLRNu2VC6tnkc71p @ fd909499)
- FRAMEWORK: nextjs · NODE: 22.x · ROOT DIRECTORY / BUILD / INSTALL COMMANDS: project defaults (not exposed by the available read tooling; not touched)
- DOMAINS: leonixmedia.com, www.leonixmedia.com (308 → apex), elaguila-website.vercel.app · SSO protection: all_except_custom_domains · password protection: off
- BRANCH ALIAS: leonix-media-git-claude-quick-cla-e4a3c0-jesus-caceres-projects.vercel.app (pre-unblock target dpl_E3JPk1NmPrrDUJFaq52htUvAWiVm = first branch commit, NOT the Tier-1 code)
- ENV VARS: 63 entries; fingerprint sha256 (key|targets|branch|updatedAt, values never read) b8e584aa3e137586cb8f1268cb4fd6c9a36e3aa58533ff2d0670da56b0efa613
- BRANCH-SPECIFIC OVERRIDES: none exist for this branch (no branch-scoped domain, env or ignore rule)

TEMPORARY CHANGE (to be restored in the same mission): commandForIgnoringBuildStep →
`if [ "$VERCEL_ENV" == "production" ] || [ "$VERCEL_GIT_COMMIT_REF" == "claude/quick-classifieds-master-build-0j5p30" ]; then exit 1; else exit 0; fi`
(production branch behaviour unchanged: still exit 1 = build; every other non-production branch still skipped; only this branch additionally builds).

EXECUTION RECORD:
- 2026-09-20T02:09:13Z — commandForIgnoringBuildStep set to the temporary rule above (`update_project`, project `prj_AOEx7UeAvVCKwuKFIa65wcot4rw9`).
- 2026-09-20T02:12:20Z — Preview created for the exact feature SHA (`create_deployment`, gitSource github `jesusecaceres/elaguila-website` @ `claude/quick-classifieds-master-build-0j5p30` sha `c3b85eea4a66a05d323be7e8a7a9acde0c92a3d9`, target preview, forceNew). Build log (bld_jzfthmrng): `Running "if [ "$VERCEL_ENV" == "production" ] || [ "$VERCEL_GIT_COMMIT_REF" == "claude/quick-classifieds-master-build-0j5p30" ]; then exit 1; else exit 0; fi"` → `Running "vercel build"` → `✓ Compiled successfully in 82s` → `✓ Generating static pages (388/388)` → `Build Completed in /vercel/output [4m]` → `Deployment completed`.
- 2026-09-20T02:16:32Z — `dpl_6d6FQxhYmywSUsacmzs1XGwSns8H` READY at `https://leonix-media-ez4w5ndvb-jesus-caceres-projects.vercel.app`; branch alias `leonix-media-git-claude-quick-cla-e4a3c0-jesus-caceres-projects.vercel.app` now points at it.
- 2026-09-20T02:28:01Z — commandForIgnoringBuildStep restored to the exact original `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi` (`update_project`). Only ONE deployment was created while the temporary rule was live (list_deployments since the change: `dpl_6d6FQxhYmywSUsacmzs1XGwSns8H` READY + the pre-change `dpl_5CtQ3eAh2NLEzT1LPEHMWogRyWBt` CANCELED).
- Post-restore re-read: production branch main untouched (latest production deployment still `dpl_5hM64z6rjQsLDLRNu2VC6tnkc71p` @ `fd909499`); domains unchanged (leonixmedia.com, www → 308 apex, elaguila-website.vercel.app); SSO protection unchanged (`all_except_custom_domains`, password off, trusted IPs off); env vars 63 entries, fingerprint `b8e584aa3e137586cb8f1268cb4fd6c9a36e3aa58533ff2d0670da56b0efa613` (identical to backup, values never read); no alias, domain, env, Supabase or Production change; `origin/main` still `fd9094994aa2a63fdcea49f24b2435300a7b49a4`.
- Restoration proof by behaviour: the docs-only push that carries this record triggers a git Preview for the new SHA, which the restored rule skips (CANCELED, log shows the original rule verbatim) — recorded in the PM report.

ROUTE HEALTH (non-mutating GET on `https://leonix-media-ez4w5ndvb-jesus-caceres-projects.vercel.app`, 2026-09-20):
- `/publicar/rapido`, `/publicar/rapido/en-venta`, `/publicar/rapido/rentas`, `/publicar/rapido/empleos`, `/publicar/rapido/autos`, `/publicar/rapido/mi-anuncio`, `/publicar/clases/quick`, `/publicar/comunidad/quick`, `/publicar/busco/quick`, `/publicar/mascotas-y-perdidos/quick`, `/admin/businesses` → all served by the deployment edge (`x-vercel-id iad1`), each answering HTTP 302 → `https://vercel.com/sso-api?...` = the configured Vercel Authentication wall (`all_except_custom_domains`). No 404 / 5xx on any Quick or admin path.
- App-level HTML rendering behind the SSO wall could not be fetched from the build container (the container's egress proxy refuses `*.vercel.app`, and the MCP fetch does not persist the SSO cookie). It is verified up to the protection wall only; the signed-in owner (Vercel team member) passes the wall automatically and performs the human QA.

PREVIEW CODE SHA: `c3b85eea4a66a05d323be7e8a7a9acde0c92a3d9` (this Preview) · FINAL DOCS SHA: the commit that adds this record (docs only; no new Preview needed).

