# LEONIX — Golden Survivor Reconciliation Ledger (2026-09-25)

Branch: `recovery/golden-survivor-integration-2026-09-25`
Start SHA: `fff3d53d9e6bc585934ddd5c227ff9ac1de36804` (release/golden-applications-final-2026-09-24)

Every unique patch from `LEONIX_PATCH_EQUIVALENCE_AUDIT_2026-09-25.md` was classified against CURRENT golden code.
Classes: **A** missing+valid · **B** already superseded · **C** partially valid (semantic port) · **D** conflicts with
owner decision · **E** docs/QA only · **F** deferred (not launch-critical). Nothing was cherry-picked; every port is a
hand semantic port onto golden, with its own verifier.

DATABASE_MUTATED: NO (read-only SELECTs only) · PRODUCTION_TOUCHED: NO · MAIN_TOUCHED: NO

---

## 1. Servicios Admin "staged" blocker — ROOT CAUSE (proven)

Source: **stale `site_category_config` database row**, not code.

Canonical DB (xuieateniufcrsfdomwl), read-only:

```
slug=servicios  operational_status=staged  visibility=public  sort_order=40
notes="Puede seguir en transición según producto."  updated_at=2026-04-09 02:10:09+00
```

Mechanism: `getClasificadosCategoryRegistryMerged` lets the DB row replace `operationalStatus` while `readiness` stays
the code default (`full`). `adminCategoryStatusTruth` then fell through to `hub.statusReason.stagedGeneric` /
`hub.blocker.stagedGeneric` ("client readiness or source maturity is still partial") — a misattribution. Code default
for Servicios is live/full; no stale Admin code or registry path can produce `staged` for it; the admin-live-qa
recovery branch does not touch these files. Public impact: none (the publish chooser filters only `hidden`).

Source fix (commit `d80dc09b6`): registry entries carry `codeDefaultOperationalStatus`; Admin names the DB override
(`hub.statusReason.dbOverride`, `hub.blocker.dbOverrideBelowCodeLive`) instead of hiding or misattributing it.

Proposed DB correction — **NOT executed; owner decision**:

```sql
update public.site_category_config set operational_status = 'live', updated_at = now() where slug = 'servicios';
```

## 2. Capacity authority finding (read-only; needs owner approval)

- Live `br_negocio_activate_listing` counts the parent (add-back present) — consistent with Bienes BASE 1 property.
  Golden file `20260903150000_fix_parent_inventory_capacity_counting.sql` (parent-excluding) is NOT applied. Keep it unapplied.
- Live `autos_dealer_activate_listing` counts **children only**, limits `10 / 20` children (11 / 21 total), and is
  **not BASE-aware**. Golden's `20260924190000_autos_dealer_base_capacity_authority.sql` (BASE 5 / PRO 10 / PRO+pack 20
  TOTAL) is **not applied**. Application pre-checks already enforce 5/10/20; the final DB authority does not yet.
  Apply after PM approval + certifier (`scripts/certify-package-c-c9-capacity-rpcs.mjs`).

## 3. Commits on this branch

| Commit | Subsystem |
|---|---|
| d80dc09b6 | admin: DB-override status truth (Servicios root cause) |
| 82b4973cf | global: image grid stability + local discovery (5c63e05ea) |
| 86d3dec63 | viajes: read-only admin offer detail package |
| 798e7eb9d | global: Rentas Negocio Google/Yelp links (db688c046) |
| 85998e26c | global: destructive-edit / data-loss category survivors |
| 6f682d2d3 | admin: checkout + Restaurantes publication-authority guards |
| 2e43af78c | admin: admin publication authority + identity-verified session |
| c7e577b8e | admin: owner dashboard authority + listing identity safety |
| 1ce3fe78b | global: WhatsApp / phone / analytics / a11y survivors |
| cd2a65362 | global: wave-2 deferred hunks |
| 5e59390a1 | autos: Autos Privado in-place dashboard edit + Rentas draft-key hooks |
| 403cf971b | admin: Empleos lane-forgery guard + BR Negocio activate_pending (BASE+PRO) |
| (this) | docs: this ledger |

## 4. Classification by source

### Admin / category circuit — `integration/category-circuit-closeout-2026-09` (8 commits)

| Commit | Class | Outcome |
|---|---|---|
| d3ed73abf | A/C | Ported: checkout pre-flights (Empleos, rentas/br_fsbo/clases, Viajes refused), owner relist/republish guard, admin reactivation gate, Restaurantes dup-tolerant lookup, pending_payment label, Autos staff republish clears suspended_reason, Autos Privado same-row edit. BR activate_pending entitlement check ported adapted to BASE+PRO keys (403cf971b; branch checked PRO only = D verbatim). Leonix Ad ID stored-first, Mascotas publish idempotency (done via 2f1db59d5), uuid search guards, enforced-term read: F. |
| 243d05a3a | A/C/F | Ported: delete guards (Mux kept on soft delete), FSBO restore off Negocio RPC, Restaurantes payment resume (into golden Quick/Full checkpoint), Autos canonical identity, real-estate draft key, Admin Autos capacity **re-derived to BASE 5 / PRO 10 / PRO+pack 20 TOTAL**. Deferred F: normalized Admin shell, summaries/filters, commercial-truth panel, Admin Live predicates, other-category payment resume, Empleos/Comida/Ofertas staff-action rewrites. |
| 8b25d418a | A | Ported: ever-live reactivation rule, staff core-field guard, Autos admin reactivation policy, no 2nd Stripe session while prior complete/unknown, Autos lane/child mismatch, Comida recurringConsent, delete linked-children/subscription rule. |
| 9cb5a52f0 | A | Ported: Servicios/Restaurantes pre-payment rows cannot be published/laundered via suspend→unsuspend. |
| 1e80c0240 | A/C | Ported: identity-verified admin session (content roles keep CMS via identity-only gate), payment-suspension hold with BASE `*_quick_monthly` keys, bearer-only checkout owner, subscription pre-flights keyed on BASE+PRO with **upgrade-in-place exemption**, Restaurantes no unpaid `published` insert, archived not webhook-activatable. Empleos lane forgery ported (403cf971b). Deferred F: dashboard state machine, Servicios paused-profile noindex, admin filters. |
| 1b9914d06 | E / D | Docs + verifiers. Proposed migrations NOT applied; `20260920124000_capacity_rpc_commercial_authority` = **D** (10/20, no BASE). |
| cb8103da8 | E | Pin updates carried with their code (capacity pins re-derived to 5/10/20). |
| a4a1749b4 | E | Docs ledger. |

### Globalization — `fix/globalization-final-closeout-2026-09` (46 unique)

Ported (A/C): international WhatsApp residual sweep, phone-number preservation (no 10-digit truncation), analytics PII
redaction + blocked keys, server self-engagement short-circuit, En Venta self-report, Rentas owner Save/Like threading,
duplicate view-event removal, capability registry truth (Clases/Comunidad), focus trap, media-drop warnings (residual
sites), Autos vehicle identity-substitution guard, Mascotas publish idempotency, BR Negocio agent WhatsApp,
BR Privado refresh draft-loss fix (da25bc921 hook), dashboard editor Busco/Mascotas corruption fix, Clases/Comunidad
expiry, Empleos workModalityCustom, Ofertas draft-recovery fields, Rentas Negocio Google/Yelp.

Superseded (B): address verifier G23 (golden broader), Servicios/Restaurantes address privacy, Servicios P0s
(80d4dbcba 1–5), Bienes/Rentas Negocio Wave-4 P0 hydration (733408ddc, 679194792 — golden gates BIENES-NEGOCIO-1 /
RENTAS-NEGOCIO-1), BR child identity guard, lifecycle visibility, Servicios engagement + admin monetization, BR FSBO
dashboard lifecycle, BRP leave guard.

Conflicts (D): **10618f41a parent-excluded capacity (REJECTED)**; a1a0aaa97 rating removal (would erase golden's real
Leonix reviews); 8b867eafe active-paid-edit (pre-Quick model).

Deferred (F): Empleos 30-day public term (golden never bumps `published_at` on renewal — needs a term-timestamp
decision); Ofertas address privacy + Comida Google/Yelp (migration-gated; migrations exist in golden, not applied);
Recently Viewed/Report on Servicios/Restaurantes/Comida (consumers not source-table aware); Comida Save/Like/Share;
additional-websites type; review drawer; leave guards; lang-param robustness sweep; Ofertas CTA double-count; En Venta
legacy analytics write; Mascotas view/report; staging schema reconciliation migrations (02ae19cc7, b3473f89b);
service_role staging grants (14a78d46a). Docs (E): 03d65ea6f 05761912e adc23e6ef 69818522b 6c9ce20ff beb5ea776
16f45c77b ed0c5582b e3956df89.

### Servicios — 64a8018766 (B)
Golden has every capability with a different, newer data shape (custom quick facts, grouped custom amenities, caps,
structured special hours, filters/trust summary). Only optional polish (keep "Otro servicio" last in business-type sort) — not ported.

### Autos — eece90c06 (B)
Dealer structured address preview readiness already in golden (cbb74e155). 5/10/20 TOTAL preserved everywhere;
parent-excluded logic rejected.

### Ofertas — a8dfed7de (B), 9b2e157df (E/F)
Golden reimplemented owner dashboard / pre-payment checkout / renewals / review mutations / AI / revenue audit in
70e68ff6c. Current policy: PAID (Flyer $399/30d, Coupons $199/30d).

### globalization-release-reconcile (5)
d1447ae7b, 8fef4d26c, c0912a71b (free Viajes/Cupones) = **D** vs golden pricing. 6d7368401 = D/F. 078c806c7 = C →
narrow port (server-derived listing source for consent + attempt key).

### Viajes — f563cdf33, 9f92bb506 (F overall)
Golden already selectively reconciled (23b0e5dd9) and deliberately rolled parts back; recovery publisher/media conflict
with golden's locked source gate; V2 write needs a V2 read path. Ported only the additive read-only admin detail
package (A). 2a964fdd2 nested-path snapshot = junk (E); 7b7917b19 = QA artifacts (E).

### LEO — 58136cdbb (F / DEFERRED)
Action API, action bar, Gmail/Calendar/People adapters, FINAL-02 migration, verifiers: already identical in golden (B).
Proposal/preparation services: golden superset (B). FINAL-01 idempotency (receipt UNIQUE + sanitization) = C,
post-launch. Migration renames + widened OAuth scopes (eb5a46e24) = D. Consequential actions already confirmation-gated.
**Golden risk flagged:** two incompatible `CREATE TABLE IF NOT EXISTS public.leo_action_proposals` (20260819223000 vs
20260820010000) — verify against DB before any LEO migration work.

### Other
- b3086746d Ad Branding Studio: F (experimental, unapproved).
- 5c63e05ea image grids / discovery: C → ported (ES/EN). 420ad2e16 raw image intake: F.
- 9baf9c80 series (magazine cache-bust): B.
- 31aeb0cdd: B (byte-identical). 75b88fff1, 092dbe84c, 769bd687a, a735aa794, 257f77178, 16d169692, 3d35c8b2c,
  86a40b876, a41e769ee, 4d7183461: E (keep on their recovery branches).

## 5. Open items for PM / owner

1. Apply `site_category_config` Servicios correction (SQL above) — owner decision.
2. Apply `20260924190000_autos_dealer_base_capacity_authority.sql` after certifier — DB authority is still 10/20 children.
3. Empleos public 30-day term: choose term timestamp before enforcing.
4. Ofertas address privacy + Comida Google/Yelp: apply their existing migrations, then port code (prepared, classified C/A).
5. Viajes pricing lock remains an open owner decision; Viajes business checkout now refuses (nothing fulfils it).
6. One-time checkout attempt-key change at deploy (server-derived listing source).
7. Golden LEO: two incompatible `leo_action_proposals` definitions — verify against DB before LEO migration work.

## 6. Validation

- Typecheck: `tsc --noEmit --incremental false` — 0 errors.
- Build: `npm run build` (NODE_OPTIONS=--max-old-space-size=12288) — GREEN: compiled, 392/392 static pages, exit 0.
  Local run supplied only the two PUBLIC client values (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY of the canonical project,
  inline, not written to disk); without them the local prerender of /dashboard stops on missing env (Vercel provides them).
- Verifier suite (367 scripts: commercial contract, Quick/same-row, assisted, lifecycle, translation/address/share,
  admin authority, capacity, all recovery verifiers), run on this branch AND on clean golden fff3d53d9:
  branch 279 PASS / 88 FAIL; golden 256 PASS / 88 FAIL / 23 absent (new). The 88 failures are identical in both trees
  (legacy pins / git-diff scope guards). Only delta: `verify-quick-business-core-01` — a changed-files scope guard
  over "protected surfaces" (not a behaviour check). All 31 recovery-added/changed verifiers pass except two with
  failures identical on golden (translate-seo-04 x4, c7-c8 x1).
- Commercial contract preserved: `verify-four-category-commercial-contract-01`, `verify-quick-upgrade-contract-05`,
  `verify-quick-convergence-behavior-01`, `verify-revenue-active-entitlement-guard`, `verify-servicios-desktop-canvas-01`,
  `verify-quick-shared-presentation-*`, `verify-assisted-reopen-*` — PASS.

## 7. QA accelerator (assessment only — not built)

Safe shape for owner QA on the Preview: browser-assisted population of the REAL application forms (set field state via
the page, then click the real Save / Preview / Publish buttons), so persistence goes through the real handlers
(`/api/clasificados/*/publish`, listing-edit routes, revenue-os checkout pre-flight). Direct API calls only for the
server behaviour a check explicitly targets (e.g. checkout pre-flight refusal codes, admin route 409s). No harness that
writes rows directly or bypasses the application logic under test.
