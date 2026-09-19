# Final Admin / Publication OS source completion — ledger (2026-09-19)

Branch `integration/category-circuit-closeout-2026-09`, PR #52 (draft, not merged). Baseline for comparisons: production `dc25e0a5`.
Companion documents (all in `docs/admin-os/`): PAID_CIRCUIT_MATRIX, FREE_CIRCUIT_MATRIX, PARITY_TABLE, MODERATION_AUTHORITY,
ADMIN_MUTATION_AUTHORITY, DASHBOARD_STATE_MACHINE, ADMIN_FUNCTIONAL_NORMALIZATION, HISTORICAL_DATA_OWNER_REVIEW,
FINAL_DB_MIGRATIONS_PROPOSED (+ `proposed-migrations/`), PR52_PREVIEW_QA_RUNBOOK, CATEGORY_CIRCUIT_CLOSEOUT §6.

## Validation on the final source
* `tsc --noEmit`: 0 errors. Production build: green on a tree whose `app/` source is identical to the final head (later commits touch only scripts + docs).
* 327 verifiers that reference changed files, run on the clean final head and on clean `dc25e0a5`: 123 fail on the baseline, 127 on head; the only four
  head-only failures were legacy pins on behaviour changed on purpose (bare `requireAdminCookie(jar)` -> identity-verified session; hard-coded `active n/10`
  -> canonical grouped capacity; frame prop window) and were updated — all four pass.
* Mandated suites (category-circuit, forensic, closeout2, launch-truth, final-burndown, admin-nav-ops, all Servicios verifiers): 14 fail on head and the same 14 on
  baseline; no head-only failure.
* New executable checks: `scripts/verify-final-*.ts` (identity, dashboard state machine, admin filters, admin authority, admin session, archive markers,
  paid defects, parity + moderation, circuit matrix, DB proposals) — all pass.

## New material findings this gate (beyond gates 1–5 fixes)
1. **Admin publication-write routes and money/lifecycle server actions trusted only the unsigned `leonix_admin=1` marker** (a raw HTTP client could send it). Fixed:
   `app/admin/_lib/adminVerifiedSession.ts` (`isVerifiedAdminSession`) now gates 17 routes, `leonixAdminGate`, and the Servicios / Ofertas / package-entitlement /
   promo-code server actions. **QA must confirm the real admin login still passes this guard** (staff roster role must be super_admin / sales_manager / sales_rep, or a signed bootstrap session).
2. **DB (not applied): the two capacity RPCs are executable by any signed-in user** (SECURITY DEFINER, caller-supplied owner id). Migration
   `20260920120000_revoke_capacity_rpc_client_execute.sql` has no app impact (every caller uses service role) and should be applied first.
3. Paid-circuit: Empleos lane forgery, Restaurantes free new-row publish, checkout without bearer / per-lane pre-flights, BR Negocio infinite-retry, Restaurantes archived activatable (all fixed).
4. `SALE-2026-000067`: a staff removal was laundered `removed -> sold -> active` by owner writes (DB guard proposed; `sold` relist is app-allowed only for rows the owner sold).

## SOURCE defects still open (exact)
* Empleos paid post has no term: sold as 30 days, `expires_at` is never set and nothing expires it (needs a schema + product decision; renewal path absent) — D2.
* Ofertas checkout: coupons chargeable at $199 through the API while the catalog says free (owner pricing decision); a `rejected` flyer can pay $399 and never auto-publishes — D5.
* Paid Clases has no renewal path — D6.
* Comida existing-row branch: an ownerless legacy row is editable by anyone who knows its `draft_listing_id` — D11.
* Autos legacy env-price checkout branch / `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST`: confirm unset in production or return 410 — D8/D12.
* Free lanes: Comunidad past-event Admin Live mismatch (F9), En Venta "Pro" is free and client-controlled (F10), feria draft payable through the paid package (F12), stale in-flight id can revive a removed row (F13); confirm prod RLS for sold readers (F8).
* Admin capability: Negocio / Dealer Restore and Republish cannot be proven lapsed when a row has no entitlement record and no `suspended_reason` (needs migration #5 or a data decision); staff archive of a payment-suspended row leaves the payment marker (R3); Servicios/Restaurantes legacy payment suspensions are indistinguishable from staff ones (R4).
* Scans that SQL cannot express stay bounded and are disclosed: Autos free-text `q`, partial owner fragments, Ofertas derived filters, Rentas/BR Live exactness, Viajes `q`.
* Dashboard owner "active listings" count still omits Comida and Ofertas (pinned six-table `Promise.all`).
* Inventory-add through Stripe does not clear its `negocios:inv:<parent>` identity scope (fails closed); the older unreachable BR Negocio application is untouched.
* `fetchListingHeadMetadata` (page head only) still uses the looser `is_published !== false` rule.
* `scripts/smoke-stripe-revenue-os-sandbox-e2e-01.mjs` posts to checkout without a bearer and will now receive 401.

## DB migrations prepared, NOT applied (`docs/admin-os/proposed-migrations/`)
1. `20260920120000_revoke_capacity_rpc_client_execute.sql`  (P0, no app impact)
2. `20260920121000_listing_lifecycle_reminder_events_lockdown.sql`
3. `20260920122000_listings_owner_authority_guard.sql`  (needs owner-Archive routing or the documented interim constant first)
4. `20260920123000_restaurantes_public_listings_draft_listing_id_uidx.sql`  (needs the 23505 handling patch, §C.3, first; 0 duplicates in prod)
5. `20260920124000_capacity_rpc_commercial_authority.sql`  (optional; owner decision on legacy rows)
Each has a `_rollback.sql`; branch-DB tests in `proposed-migrations/tests/`. Also `PARITY_TABLE` §5: `listings_select_public USING (true)` exposes non-public rows to any anon client (SQL proposed in the doc).
