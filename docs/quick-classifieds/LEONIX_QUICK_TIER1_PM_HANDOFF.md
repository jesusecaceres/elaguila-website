# LEONIX QUICK CLASSIFIEDS — TIER-1 PM HANDOFF

CURRENT HEAD: see `git log -1` on `claude/quick-classifieds-master-build-0j5p30` (this mission's commit sits on top of
`cc427dbb`, the rehydrated remote state). ORIGIN MAIN: `fd9094994aa2a63fdcea49f24b2435300a7b49a4` (0 behind).

FILES CHANGED THIS MISSION
- NEW `app/(site)/publicar/empleos/shared/publish/empleosDraftMediaUpload.ts` (Empleos media wiring repair)
- `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx` (+2 imports, one insertion before envelope build)
- NEW `app/(site)/publicar/rapido/_adapters/empleosQuickAdapter.ts`; `_adapters/index.ts` (+Empleos)
- `_adapters/enVentaQuickAdapter.ts` (ZIP optional), `_adapters/rentasPrivadoQuickAdapter.ts` (SMS removed)
- `app/lib/quickClassifieds/quickClassifiedTypes.ts` (`defaultValue`), `quickClassifiedRegistry.ts` (Empleos live, Tier-1 order, `QUICK_TIER1_KEYS`, `QUICK_COMMUNITY_KEYS`, community direct paths)
- `app/(site)/publicar/rapido/_components/QuickIntakeClient.tsx` (visible prefills), `QuickCategoryChooser.tsx` (community direct links)
- `app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx` (Tier-1 priority + four verbs)
- `scripts/verify-quick-classifieds-onramp-01.ts` (§8 interaction contract, Empleos repair asserts, one documented protected-path exception)
- docs: this handoff, `LEONIX_QUICK_TIER1_EXECUTION_LEDGER.md`, matrix/blueprint/certification updates

EN VENTA STATUS: PASS — canonical draft, existing preview, image survives to `listings.images`, free, edit + sold canonical.
RENTAS STATUS: PASS — canonical draft, existing paid preview/checkout (`rentas_30d`), image survives, rented/pause/archive + same-row renewal canonical.
AUTOS PRIVADO STATUS: PASS — canonical namespaced draft, existing paid preview/checkout (`autos_privado_30d`), image survives via existing Blob bridge, sold/unpublish + same-row renewal canonical; active rows not editable (pre-existing).
EMPLEOS STATUS: REPAIRED → PASS (source-proven) — narrow media wiring repair + Quick adapter; premium lane still carries the original defect (out of Tier-1, documented).

SHARED FORM WIRING STATUS: PASS (raw keystroke forwarding, normalization only at step/adapter boundary, Back/Next persistence, tab-draft persistence, visible prefills; verifier §8).
MINIMUM IMAGE STATUS PER CATEGORY: En Venta PASS · Rentas PASS · Autos PASS · Empleos PASS (after repair) — all enforced in Quick and carried by each category's existing publisher.
PAYMENT STATUS PER CATEGORY: En Venta N/A (free) · Rentas existing `rentas_30d` · Autos existing `autos_privado_30d` · Empleos existing `empleos_job_post_paid` — no price, SKU or Revenue OS change.
LIFECYCLE STATUS PER CATEGORY: En Venta edit/sold · Rentas edit/rented/renew · Autos sold/renew (no edit while active) · Empleos edit/archive (no renewal) — all canonical, none invented.
STAFF LAUNCHPAD STATUS: PASS — four verbs, Tier-1 large cards, community direct links, Copy + native Share, Manage → existing admin queue, Full Concierge untouched.
LIGHTWEIGHT MY-AD STATUS: PASS — links only into existing owner surfaces; ownership enforced by existing guards.

KNOWN BLOCKERS
- Staff-managed / unclaimed custody for classifieds: unchanged (Servicios-only bridge); launchpad shares/opens links, customer owns the ad.
- Empleos premium lane: same media drop as before (not Tier-1).
- Pre-existing verifier failures (`gate-pkgA-checkpoints-selftest`, `verify-checkpoint-first-routes.mjs`, `verify-paid-publish-entry-checkpoints.mjs`, `empleos-e3-master-paid-job-product-audit`, `gate-i5-8-…route-drift`) reproduce on pristine HEAD.

DEFERRED VALIDATION
- full TypeScript · full production build · broad regression pass · owner/human runtime QA (no `.env.local` in this container).

NEXT RECOMMENDED PM GATE: Integration gate — reconcile latest main, one full TypeScript + one production build, then owner
runtime QA of the four Tier-1 flows (En Venta free publish, Rentas paid, Autos paid, Empleos paid with a real photo
reaching the public job page).
