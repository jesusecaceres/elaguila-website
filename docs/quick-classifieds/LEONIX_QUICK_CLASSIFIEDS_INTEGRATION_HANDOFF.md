# LEONIX QUICK CLASSIFIEDS — INTEGRATION HANDOFF (2026-09-20)

FINAL FEATURE SHA: the commit that adds this file (`git log -1 -- docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_INTEGRATION_HANDOFF.md`); last CODE SHA `1a801e91702c9f0c10466726d57a30cfc7921cee`; Owner-QA packet SHA `eb6bf5893ab67df29055dce338f090f2f4aae4dd`. Docs-only commits after `1a801e91`.
CURRENT ORIGIN MAIN SHA: `fd9094994aa2a63fdcea49f24b2435300a7b49a4`
AHEAD/BEHIND: 9 / 0 after this handoff commit (7 / 0 at gate start)

PREVIEW DEPLOYMENT ID: none READY — last attempt `dpl_8FfiiUe8DoodS6NRYdDDVE2ZKErY` (CANCELED by Ignored Build Step)
PREVIEW URL: pending — branch alias will be `https://leonix-media-git-claude-quick-cla-e4a3c0-jesus-caceres-projects.vercel.app` (SSO-protected)
PREVIEW STATUS: BLOCKED — project Ignored Build Step `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi` cancels every non-production deployment; PM/owner must relax it (project setting) — not changed by this agent

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

EN VENTA TECHNICAL STATUS: PASS (free; real-image chain; edit + sold canonical)
RENTAS TECHNICAL STATUS: PASS (existing `rentas_30d` checkout; expiration; rented/end; same-row renewal; real-image chain)
AUTOS TECHNICAL STATUS: PASS (existing `autos_privado_30d` checkout; sold/unpublish; same-row renewal; no active edit by canonical rule; real-image chain; Dealer untouched)
EMPLEOS TECHNICAL STATUS: PASS source-proven after the narrow media repair (upload to existing `listing-images` before the unchanged envelope mapper); Feria + premium + public job design untouched; runtime proof of the real photo on the public ad is the key owner-QA item
STAFF PWA TECHNICAL STATUS: PASS (one PWA; launchpad additive with four verbs; Tier-1 priority; community direct links; Copy/Share of real routes; no messaging infrastructure)
MY-AD TECHNICAL STATUS: PASS (links-only doorway into existing owner surfaces; no new lifecycle engine; ownership stays in existing guards)

KNOWN BLOCKERS:
- Vercel Preview disabled project-wide by the Ignored Build Step (external; needs PM/owner project setting change)
- Staff-managed / unclaimed custody for classifieds (Servicios-only bridge) — unchanged, future decision
- Empleos premium lane still drops local images (out of Tier-1)
- Owner runtime QA not yet performed (no Preview; no `.env.local` in the build container)

OWNER QA STATUS: PENDING
MERGE STATUS: NOT AUTHORIZED
PRODUCTION STATUS: UNTOUCHED

NEXT PM DEPENDENCY: relax the Preview Ignored Build Step for this branch → READY Preview → OWNER/HUMAN QA ON READY PREVIEW (packet: `LEONIX_QUICK_CLASSIFIEDS_OWNER_QA.md`)
