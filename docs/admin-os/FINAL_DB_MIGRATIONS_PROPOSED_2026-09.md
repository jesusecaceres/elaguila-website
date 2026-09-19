# FINAL database migration proposals — Gate 6 (NOT APPLIED)

**Status: NOT APPLIED. Nothing in this document or in `docs/admin-os/proposed-migrations/` has been run against any database.**
All SQL lives outside `supabase/migrations/` on purpose so no pipeline can apply it by accident. Every production fact below was read with
`SELECT`-only statements (`pg_catalog`, `information_schema`, row counts) against Leonix Media `xuieateniufcrsfdomwl` on 2026-09-18 through the
Supabase MCP `execute_sql` tool. No `apply_migration`, no DDL, no DML, no secrets read. Branch `integration/category-circuit-closeout-2026-09`, HEAD `9cb5a52f`.

This document **supersedes §1 and §3 of `PROPOSED_DB_HARDENING_2026-09.md`** (that §1 trigger could be laundered: `pending → paused → active`, and
`flagged → removed → …`; it also missed the capacity-RPC ACL hole below). §2 (`publish_attempt_key`) and §7 (`suspended_reason`) of that file are
already applied in production (`schema_migrations`: `20260919021936`, `20260919021938`) and are not re-proposed.

## 0. Overview

Apply order matters (see the "Prerequisites" column). Timestamps are all > `20260919021938` (the latest version in prod's migration history) and do not
collide with any name in `supabase/migrations/` (latest there is `20260916150000_…`; verified by `scripts/verify-final-db-proposals.ts`).

| # | Filename (in `docs/admin-os/proposed-migrations/`) | Purpose | Risk | Prerequisites | Verification (section) | Rollback | Status |
|---|---|---|---|---|---|---|---|
| 1 | `20260920120000_revoke_capacity_rpc_client_execute.sql` | **P0.** Remove `anon`/`authenticated`/`PUBLIC` EXECUTE from `br_negocio_activate_listing` and `autos_dealer_activate_listing` (SECURITY DEFINER, caller-supplied owner id). Keep `service_role`. | LOW — no app caller uses a client role | none | §B.5 | `…120000_revoke_capacity_rpc_client_execute_rollback.sql` | **NOT APPLIED** |
| 2 | `20260920121000_listing_lifecycle_reminder_events_lockdown.sql` | **P2.** Enable RLS on the only RLS-off public table, revoke ALL (incl. TRUNCATE) from `anon`/`authenticated`/`PUBLIC`; no owner policy (no reader exists). | NONE (0 rows, no reader/writer) | none | §D | `…121000_listing_lifecycle_reminder_events_lockdown_rollback.sql` | **NOT APPLIED** |
| 3 | `20260920122000_listings_owner_authority_guard.sql` | **P0.** One `BEFORE INSERT OR UPDATE` guard trigger on `public.listings` constraining only `authenticated`/`anon`: category-aware owner status transitions, `expires_at` frozen on paid lanes, staff-only flags immutable. | MEDIUM — touches every owner write; branch-test first | **owner Archive must go through a server route first** (or set the Stage-1 switch `c_owner_may_archive := true`, §A.4); independent of #1 | §A.5 + `tests/listings_owner_authority_guard_branch_tests.sql` | `…122000_listings_owner_authority_guard_rollback.sql` | **NOT APPLIED** |
| 4 | `20260920123000_restaurantes_public_listings_draft_listing_id_uidx.sql` | **P2.** Partial unique index on `draft_listing_id` (prod duplicates today = **0**). | LOW | **Deploy the publish-route code change first** (§C.3) | §C.4 | `…123000_restaurantes_public_listings_draft_listing_id_uidx_rollback.sql` | **NOT APPLIED** |
| 5 | `20260920124000_capacity_rpc_commercial_authority.sql` | **P1, PHASE 2 / optional.** Capacity RPCs additionally require POSITIVE authority on the commercial parent: valid base entitlement **OR** live subscription. | MEDIUM — needs owner decision on legacy live rows; confirm legacy BR Stripe flow is retired | **#1 applied**; owner decision §B.4; drift guard (md5) | §B.5 + `tests/capacity_rpc_authority_branch_tests.sql` | `…124000_capacity_rpc_commercial_authority_rollback.sql` | **NOT APPLIED** |

Recommended sequence: **1 → 2 → (branch-test) 3 → deploy code change §C.3 → 4 → (owner decision) 5.** #1, #2 are safe to apply immediately; #3 after the branch run.

## Production facts verified read-only (2026-09-18)

| Fact | Value |
|---|---|
| Prod project | `xuieateniufcrsfdomwl` "Leonix Media" (staging `cgeehvnfyrdoperdotdh`, certification `mvasgrdzmupsnuicwyjl` exist — a branch/staging DB should be used for the tests) |
| `public.listings` RLS | enabled **and forced** (`relrowsecurity = relforcerowsecurity = true`) |
| `public.listings` policies | `Owner insert own listings` (INSERT, authenticated, `WITH CHECK owner_id = auth.uid()`); `Owner read own listings`; **`Owner update own listings` (UPDATE, authenticated, `USING owner_id = auth.uid()`, `WITH CHECK owner_id = auth.uid()` — no column limit)**; `Public read active listings` (`status = 'active'`); `listings_select_public` (`true`) |
| `public.listings` triggers | `trg_prevent_owner_change`, `trg_set_owner_id`, `listings_leonix_ad_id_biu`, 3× `listings_lifecycle_audit_*` (AFTER, SECURITY DEFINER). **No trigger constrains status / is_published / expires_at.** |
| Grants on `listings` | `anon` and `authenticated` hold ALL table privileges incl. column-level UPDATE on `status`, `is_published`, `expires_at`; `service_role` and `postgres` have `BYPASSRLS` (`authenticated` does not) |
| `listings.status` default | `'active'` (and `is_published` default `false`) — an INSERT that omits `status` is born active |
| `listings` rows by category/status | rentas 61 active / 1 pending / 4 removed; bienes-raices 11 active / 1 paused / 1 pending; clases 10 active (all `is_free = true`); comunidad 1 active / 3 removed; busco 1; mascotas-y-perdidos 1; en-venta 1 active / 3 draft / 4 flagged / 8 removed / 1 sold. **No row is currently in a state the proposed guard would newly forbid** (the guard only fires on writes). |
| Capacity RPC ACL | **`{postgres=X, anon=X, authenticated=X, service_role=X}`** on both functions; `has_function_privilege` anon = true, authenticated = true, PUBLIC = false. Both `SECURITY DEFINER`, owner `postgres`, `search_path=public`. The authoring migration (`20260810120000`) says "service_role execution only" — the ACL drifted from that intent (`revoke … from public` does not remove direct grants Supabase default privileges gave to anon/authenticated). |
| RPC callers inside the DB | none (`pg_proc.prosrc` scan = 0 other functions reference either RPC) |
| RPC definition md5 (`pg_get_functiondef`) | `br_negocio_activate_listing` `f69cc5331601605c6bfbe4d8fcfdf220`; `autos_dealer_activate_listing` `d5cd8e627012e7c0df7db38fa84e978f` |
| `restaurantes_public_listings.draft_listing_id` | 7 rows; NULL 0; blank 0; distinct non-null 7; **duplicate groups = 0**; no index on the column (comida_local has `comida_local_public_listings_draft_listing_id_uidx`) |
| `listing_lifecycle_reminder_events` | RLS **off**, 0 policies, 0 rows; `relacl` gives `anon` + `authenticated` `arwdDxtm` (TRUNCATE = **true** for both via `has_table_privilege`); it is the **only** public table with RLS off (sweep of `pg_class`) |
| Commercial data | 1 `leonix_subscription_records` row (autos, `active`); 13 entitlements: 1 `br_agent_monthly` (active but `ends_at` in the past → lapsed), 1 `autos_dealer_monthly` (live); real entitlement `metadata` carries **no `payment_status` key** (webhook-written) |
| Live rows WITHOUT a live base entitlement or subscription | autos negocios parents: **1 of 2**; BR Negocio parents: **7 of 7**; BR Negocio active children: **1 of 1** (legacy, pre-Revenue-OS) |
| **Staff-removal laundering, PROVEN** | en-venta `SALE-2026-000067` (`5f1b6eb5-da3e-43bc-9205-f4464b984e31`), `listing_lifecycle_audit`: `draft→active` (owner, 2026-05-14) → `active→flagged` (**no actor = service role**, 2026-06-02) → `flagged→removed` (no actor, 2026-06-16) → **`removed→sold` by the OWNER (actor = owner) 2026-09-09**. Because `dashboardOwnerRelistPolicy` treats `sold` as relistable, a staff removal was walked back towards `active` with owner writes only. The guard makes every staff/engine/server-owned state terminal for owners. |
| A never-paid BR row carrying `published_at` | `735c1435-b960-402a-8996-91629387f905`: `bienes-raices`, `pending`, unpublished, no entitlement, `published_at` = created + 29 s (so `published_at` is NOT a proof of payment for BR) |

---

## A. `public.listings` — owner UPDATE hardening (migration #3)

### A.1 Every legitimate browser-client writer of `public.listings` (source scan)

| Writer (file) | What it writes | Lane | Inside the guard's matrix |
|---|---|---|---|
| `app/(site)/dashboard/lib/ownerListingsLifecycleClient.ts#applyOwnerListingPatch` (used by `mis-anuncios/page.tsx`, `mis-anuncios/[id]/page.tsx`, `mis-anuncios/[id]/editar/page.tsx`, `drafts/page.tsx`) | `{status:'paused',is_published:false}` (pause), `{status:'active',is_published:true}` (resume/relist/refresh/draft publish), `{status:'sold'\|…}`, archive `{status:'removed',is_published:false}`, `republished_at/republish_count/last_republished_*`, content (`title,price,is_free,description,detail_pairs,images,updated_at`) | all | yes — see A.2 |
| `app/(site)/publicar/{busco,community,mascotas-y-perdidos}/…/publish*QuickToListings.ts` | insert `draft`; (reuse) update to `draft`/`pending`; failure cleanup `removed`; final `{status:'active',is_published:true}` | free lanes + Clases | yes |
| `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` | insert `draft`; reuse update `draft`; finalize `{status:'active',is_published:true,published_at}`; failure `removed` | free | yes |
| `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts` (Rentas negocio/privado, BR privado/agente/bundle previews) | insert `status:'pending', is_published:false` (all 5 current callers pass `activationMode:"pending_payment"`); pending-row reuse update (content only) | paid | yes (immediate mode — insert `active` — is refused, by design) |
| `app/(site)/clasificados/lib/listingsSelectShrink.ts#updateListingsRowResilient/insertListingsRowResilient` | pass-through for the publishers above | — | n/a |
| Server, service role (unaffected): Revenue OS fulfilment (`revenueRentasFulfillment`, `revenueClasesFulfillment`, `revenueBienesFsboFulfillment`, `brListingPaymentService`), `brListingLifecycleService`, `api/clasificados/{bienes-raices,rentas}/listing-edit`, `bienes-raices/privado-status`, all `api/admin/*`, `app/admin/actions.ts`, `subscriptionLifecycle.ts` (payment suspension `suspended`) | any | bypass (`current_user` = `service_role`/`postgres`) |
| SECURITY DEFINER RPCs (unaffected by the guard) | `br_negocio_activate_listing` UPDATE runs with `current_user = postgres` | BR | bypass |

No client code writes `expires_at`, `admin_promoted`, `leonix_verified`, `boost_until`, `suspended_reason`, `republish_override*` on `listings`.

### A.2 Owner state model (enforced on the OLD row) and category semantics

Lane is classified from the OLD row on UPDATE (so a lane cannot be switched mid-flight); `category` is immutable for owners.

* **Owner-movable statuses ONLY: `draft`, `pending`, `active`, `paused`, `sold`.**
* **Terminal for owners** (staff / payment-engine / server-owned): `flagged`, `suspended`, `removed`, `expired`, `rejected` and any unknown or empty status — an owner can change *nothing about status* out of them (content edits with the status unchanged still work).
* **Never INTO** `flagged`, `suspended`, `expired`, `rejected` (no owner branch exists), and **not INTO `removed`** while `c_owner_may_archive = false` (default — see A.4).
* **FREE lane** — `en-venta`, `busco`, `comunidad`, `mascotas-y-perdidos` (+ `mascotas`), and `clases` with `is_free = true AND expires_at IS NULL`.
* **PAID lane** — `rentas`, `bienes-raices` (Negocio **and** FSBO), `clases` with `is_free` not true (or with a paid term), and **every unknown category** (fail closed).

| Owner transition | FREE | PAID | Source of the rule |
|---|---|---|---|
| `draft → active` (publish) | allow | **deny** | free publishers; paid never uses `draft` |
| `paused → active`, `sold → active` (resume/relist) | allow | allow (was live; term untouched) | `dashboardOwnerMayActivateFromStatus` = paused / sold / active |
| `pending / draft → paused`, `pending → sold` | deny | deny | closes `pending → paused → active` laundering |
| `active → paused` | allow | allow | `OWNER_LISTING_PAUSE_PATCH` |
| mark sold: `active/paused → sold` | allow | allow | `markStatus('sold')` |
| `active/paused/sold → draft` | allow (publisher re-save) | deny | reuse path in the quick publishers |
| `draft → pending` | deny | allow (enter the payment flow; nothing goes live without a verified payment) | paid Clases / Rentas / BR |
| `→ removed` (owner archive) | **deny by default** (`c_owner_may_archive`) | **deny by default** | `OWNER_LISTING_SOFT_ARCHIVE_PATCH` — see A.4 |
| **`flagged / suspended / removed / expired / rejected / unknown → ANYTHING`** | **deny** | **deny** | staff `flagged`/`removed`, engine `suspended` (`applyPaymentSuspension`), server `expired`; incident SALE-2026-000067 |
| `→ flagged / suspended / expired / rejected` | **deny** | **deny** | staff / engine / server decisions |
| INSERT | `draft`, `active` | `pending`, `draft` only; `is_published` not true; `expires_at` null | Rentas/BR previews; the `default 'active'` is refused; `removed`/`flagged` inserts refused |
| `expires_at` | not guarded (null on free lanes) | **frozen** (public readers fail OPEN on null) | `enforcedTermReadPredicate.ts` |
| `is_published false → true` | only together with `status='active'` from draft/paused/sold/active | same | a held row cannot be re-published by flipping the flag |
| staff-only flags | immutable / default-only | immutable / default-only | `admin_promoted`, `leonix_verified`, `boost_until`, `suspended_reason`, `republish_override`, `republish_override_reason` |

### A.3 Residual risks the guard does NOT close (be explicit)

1. **Clases free vs paid is self-declared** (`is_free`). The guard blocks the paid pending row and freezes a lane once a row has entered payment or ever been live, but an owner can always insert a *new* `is_free = true` Clases row and publish it. Only staff review or a server-side classification catches a mis-declared paid class.
2. **Staff "unpublish" via `is_published=false` on an `active` row** (`app/admin/actions.ts:57`) can be flipped back by the owner (only the status axis is a hold). Fix path: staff should use `suspend` (→ `flagged`, protected) instead of a bare unpublish.
3. `rentas_tier`, `membership_snapshot`, `published_at` are not guarded (client publishers legitimately write some of them). `published_at` is therefore not a proof of payment for BR — see §B.
4. The pre-existing quick-publisher reuse update writes `status:'draft'` onto ANY row owned by the caller without checking its status (`verifyQuickListingReusable` checks only owner + category). With the guard, that update is refused for terminal-state rows and for paid-lane rows — the correct outcome (fail closed), but the UI shows its generic save error.
5. **Public read exposure is a separate finding** — `listings_select_public` (role `public`, `USING (true)`) lets any anon-key client read every row incl. pending/paused/flagged/removed and contact fields. It is proposed (not duplicated here) in `docs/admin-os/PARITY_TABLE_2026-09.md` §5 (`listings_public_read_live` replacement policy). The owner-write guard and that read policy are independent and complementary; apply order does not matter.

### A.4 Owner Archive — the one behavioural decision (needs the owner)

The dashboard archives by writing `status:'removed'` straight from the browser (`OWNER_LISTING_SOFT_ARCHIVE_PATCH`; `mis-anuncios` list + detail + `editar` + `drafts`). The directive is that owners never write INTO `removed`, so the guard ships with `c_owner_may_archive := false`. Consequences and options:

* **Default (strict, recommended target):** those four Archive buttons return the generic save error until archive is routed through a server route (service role; verifies owner and that the current status is NOT terminal). The publishers' failure-cleanup writes (`status:'removed'` after a failed publish) are best-effort and unchecked — when refused, the row simply stays `draft`/`pending`, which the retry path already reuses. **Prerequisite for applying #3 in strict mode: ship that server route.**
* **Stage-1 interim (one constant):** set `c_owner_may_archive := true` before applying. Archive then works only from `draft/pending/active/paused/sold`, is a **one-way door** (owners can never leave `removed`), and therefore launders nothing — every staff-hold protection, including the SALE-2026-000067 case, stays in force. Branch tests accept it with `set leonix.test_owner_may_archive = 'on'`.

Other accepted UX consequences: an owner can no longer change the status of a row staff `flagged`/`removed` or the engine `suspended` (contact support); a paid row still `pending` can only be paid; a `pending` paid Clases the owner re-declares "gratis" is refused (repost); the legacy `immediate` real-estate insert (`status:'active'`) is refused (all current callers already send `pending_payment`).

### A.5 Test plan (run on a Supabase branch DB built from prod schema)

Executable: `docs/admin-os/proposed-migrations/tests/listings_owner_authority_guard_branch_tests.sql` — 92 assertions in one transaction that ends in `ROLLBACK`. Method: fixtures as `postgres`, then `set local role authenticated` + `request.jwt.claim.sub`. Key assertions (`42501` = rejected):

```sql
-- as authenticated, sub = owner
update public.listings set status='active', is_published=true where id = <rentas pending>;      -- 42501
update public.listings set status='paused'                    where id = <rentas pending>;      -- 42501  (no pending->paused->active laundering)
update public.listings set status='active', is_published=true where id = <bienes-raices pending>; -- 42501
update public.listings set status='active', is_published=true where id = <rentas flagged>;      -- 42501  (staff hold)
update public.listings set status='removed'                   where id = <rentas flagged>;      -- 42501
update public.listings set status='active', is_published=true where id = <rentas removed>;      -- 42501
update public.listings set expires_at = null                  where id = <rentas active>;       -- 42501  (term is server-owned)
update public.listings set admin_promoted = true              where id = <any own row>;         -- 42501
insert into public.listings (owner_id,category,title,description) values (uid,'rentas','…','…'); -- 42501  (default status 'active')
update public.listings set status='active', is_published=true where id = <clases is_free=false, pending>; -- 42501
update public.listings set status='paused', is_published=false where id = <rentas active>;      -- OK
update public.listings set status='active', is_published=true  where id = <rentas paused>;      -- OK   (resume)
update public.listings set status='sold'                       where id = <en-venta active>;    -- OK   (is_published untouched)
update public.listings set status='active', is_published=true  where id = <en-venta sold>;      -- OK   (relist)
update public.listings set status='active', is_published=true  where id = <busco/comunidad/mascotas/clases-free draft>; -- OK
update public.listings set status='active', is_published=true  where id = <en-venta flagged>;   -- 42501
-- incident SALE-2026-000067: an owner walking a staff removal back
update public.listings set status='sold'   where id = <en-venta removed>;   -- 42501  (removed is terminal for owners)
update public.listings set status='active', is_published=true where id = <en-venta removed>; -- 42501
update public.listings set status='draft'  where id = <en-venta removed>;   -- 42501
update public.listings set status='active', is_published=true where id = <expired | rejected | suspended row>; -- 42501
update public.listings set status='flagged' where id = <own active row>;    -- 42501  (never INTO a staff status)
update public.listings set status='removed' where id = <own active row>;    -- 42501 by default (c_owner_may_archive=false)
-- as service_role / postgres: the same "forbidden" updates all succeed (server paths unaffected)
-- SECURITY DEFINER path: select * from public.br_negocio_activate_listing(...) as postgres must not raise 42501
```

Also run the app-level smoke on the branch before promoting: owner dashboard pause → resume → mark sold → relist on an En Venta and a Rentas row; publish a free Busco/Comunidad/Mascotas/Clases; save a Rentas/BR pending draft; edit content on each. Expected: all succeed; the only new refusals are those listed in A.4.

**Pre-apply read-only checks on production (all already satisfied):** the guard needs the 12 columns `status,is_published,expires_at,published_at,is_free,category,admin_promoted,leonix_verified,boost_until,suspended_reason,republish_override,republish_override_reason` (present — the migration re-checks and aborts otherwise).

---

## B. Capacity RPCs — what commercial authority do they verify?

### B.1 Answer

**Neither RPC verifies positive commercial authority.** From the production function source: each locks the target row, requires `status = p_from_status`, derives the parent, then (i) rejects only NEGATIVE subscription states of the latest `leonix_subscription_records` row (`grace` unexpired/expired, `suspended`, `canceled`), (ii) looks up the pack entitlement only to pick the LIMIT (BR 1 vs 4, dealer 10 vs 20), (iii) counts and activates. A parent with **no** subscription record, a `pending` one, or **no entitlement at all** passes. Combined with the ACL finding this gives two distinct problems:

1. **Direct-call hole (P0, migration #1):** `anon` and `authenticated` hold EXECUTE, the functions are SECURITY DEFINER, and the owner id is a **parameter** (not `auth.uid()`). Any signed-in owner can call `/rest/v1/rpc/br_negocio_activate_listing` with their own row + owner id + its current status and get it activated (`status='active', is_published=true`) with capacity 1 and no payment — including a `flagged` or `removed` row (any current status is accepted as `p_from_status`); for dealers up to 10 active vehicles. Nothing in the app can see this call. (Not exercised: proven from the ACL and function source only, per the read-only rule. `UNVERIFIED-BY-CALL`.)
2. **No positive authority even for legitimate server callers (P1, migration #5):** the safety of every server caller rests on its own app-level pre-check.

### B.2 Every caller (all use `getAdminSupabase()` = service role; none is a browser client)

| Caller | Status it passes | App-level authority checked before the RPC | What it can still do after |
|---|---|---|---|
| `brListingPaymentService.tryActivateBrListingAfterPayment` (Revenue OS webhook → `activatePaidBienesNegocioListingFromRevenueOs`; legacy `api/clasificados/leonix/stripe/{checkout,verify,webhook}`) | `pending` | verified Stripe payment; Revenue OS writes the base **entitlement first** (`revenueFulfillment.ts` ~L1600/L2000 `tryActivate…AfterEntitlement`). Legacy flow writes no entitlement; its dev bypass is `NODE_ENV !== production` only. | activates a pending main/child; siblings fan out |
| `brListingLifecycleService.applyBrActivatePending` | `pending` | active `br_agent_monthly` entitlement for a main row (added in this closeout; skipped when `brPublishPaymentRequired` is false = non-production bypass) | activates own pending row |
| `brListingLifecycleService.applyBrResume` | `paused` | **none for a main row** (children: active parent + pack capacity) | owner resumes a paused main row with no entitlement check |
| `api/admin/clasificados/listings/[id]` `unsuspend` / reactivating `republish` (BR Negocio + legacy null-role, non-FSBO) | current row status (any of flagged / paused / removed / sold / expired) | `decideAdminReactivation` (blocks `pending` and never-live via `published_at`/`expires_at`), `evaluateAdminReactivationHold` (payment-owned suspension; entitlement **lapsed** → 409; entitlement **none → passes**; unreadable → 503), role check, FSBO excluded | see B.3 |
| `api/admin/autos/listings/[id]` `republish` (removed/cancelled negocios) and `restore_active`/`unsuspend` | `removed` / `cancelled` | `decideAutosAdminReactivation` (must have been published once), `evaluateAdminReactivationHold(requireEntitlement)` | see B.3 |
| `api/clasificados/autos/listings/[id]/restore` (owner-facing) | `removed` | refuses staff-suspended rows; `assertCommercialCapacityForWrite` = capacity + subscription NEGATIVE states only | owner restores own removed dealer row without a base-entitlement check |
| `autosClassifiedsListingService.activateAutosClassifiedsListing` (QA/internal bypass) and `tryActivateAutosListingAfterPayment` | current / payable status | env/allow-list bypass; verified payment respectively | as above |
| `app/admin/_lib/bienesNegocioCommercialOps.ts` | probe call with a nil id | none needed — read-only probe (`not_found_or_owner_mismatch`) | activates nothing |

### B.3 What the two Admin routes can still do (precisely)

* **`api/admin/clasificados/listings/[id]` — Restore (`unsuspend`) / Republish on a BR Negocio row:** can put `active + is_published` on any non-`pending` row that carries a `published_at` **or** `expires_at`, whose latest subscription (if any) is not grace/suspended/canceled, that is not payment-suspended, and whose entitlement rows (if any) are not all lapsed — **including a row that never had any entitlement** (`none` is allowed) and including a never-paid row that was `pending → flagged/removed` and carries a `published_at` stamp (prod evidence: `735c1435-…`; `published_at` for BR is written ~29 s after an unpaid insert). It cannot activate a still-`pending` row, an FSBO row, a payment-suspended row, or a row over capacity. Staff two-step laundering is therefore possible: `suspend` a pending BR row → `unsuspend`.
* **`api/admin/autos/listings/[id]` — Restore / Republish on a dealer (negocios) row:** only from `removed`/`cancelled`, only if the row was published at least once, not staff-`suspended_reason`-locked when applicable, not payment-held, entitlement not `lapsed` (`none` allowed), capacity available. It cannot activate `draft` / `pending_payment` / `payment_failed` rows.

Neither route can verify "live subscription OR entitlement" today. Migration #5 makes the RPC itself refuse (`commercial_authority_required`), which closes both routes and the owner resume/restore paths without touching app code beyond a type union.

### B.4 Design decision and why (architecture fit)

* **Do not require a subscription.** Production has exactly 1 subscription record (autos). Bienes Raíces Negocio is sold as a base **entitlement** (`br_agent_monthly`, `billing_mode monthly_subscription`, written by the webhook with **no** `payment_status` key). A subscription-only rule would break real BR activations.
* **Authority = valid base entitlement OR live subscription on the commercial parent** (children checked against their parent), mirroring `entitlementActivationContract.ts` (`status = active`, not revoked, `starts_at ≤ now ≤ ends_at`, and `payment_status` NULL or not in pending/unpaid/requires_action/failed/canceled/refunded/disputed), package keys `br_agent_monthly` / `autos_dealer_monthly` (= `ADMIN_BASE_ENTITLEMENT_PACKAGE_KEYS`).
* **Ordering is safe for the Revenue OS path** (entitlement persisted before activation). The **legacy one-time BR Stripe flow** never writes an entitlement and would be refused — confirm it is retired (Stripe endpoint disabled) before applying #5: `UNVERIFIED in prod`.
* **Legacy live rows** (autos 1/2, BR parents 7/7, BR child 1/1 have no live authority) are untouched while `active` (the idempotent branch is first). If one is later paused/removed, resume/restore is refused until staff records a cleared manual entitlement (`grant_source` `comp` / `manual_cleared_payment` is already allowed by the table's CHECK). **Owner decision:** grant entitlements now, or accept.

Pre-flight for that decision (read-only; run it again right before applying):

```sql
with ent as (select listing_id, package_key from public.listing_package_entitlements e
             where e.status='active' and e.revoked_at is null and e.starts_at<=now() and e.ends_at>=now()
               and lower(btrim(coalesce(e.metadata->>'payment_status',''))) not in ('pending','unpaid','requires_action','failed','canceled','refunded','disputed')),
     sub as (select listing_id, listing_source from public.leonix_subscription_records s
             where s.status='active' and (s.current_period_end is null or s.current_period_end>=now()))
select 'br_parent' k, l.id::text, l.status from public.listings l
 where l.category='bienes-raices' and coalesce(l.seller_type,'')<>'personal' and l.inventory_role is distinct from 'inventory_property'
   and not exists (select 1 from ent where ent.listing_id=l.id::text and ent.package_key='br_agent_monthly')
   and not exists (select 1 from sub where sub.listing_id=l.id::text and sub.listing_source in ('listings','bienes-raices'))
union all
select 'autos_parent', a.id::text, a.status from public.autos_classifieds_listings a
 where a.lane='negocios' and a.inventory_role is distinct from 'inventory_vehicle'
   and not exists (select 1 from ent where ent.listing_id=a.id::text and ent.package_key='autos_dealer_monthly')
   and not exists (select 1 from sub where sub.listing_id=a.id::text and sub.listing_source in ('autos_classifieds_listings','autos'));
```

### B.4b App-level follow-ups (code, not SQL — complementary, not a substitute)

1. `capacityActivationRpc.ts`: add `"commercial_authority_required"` to `CapacityActivationBlockedReason`; add owner copy in `brCapacityOwnerFeedback.ts` (today an unknown reason already falls through to the generic `transition_not_allowed`, so this is types/UX only).
2. `brListingLifecycleService.applyBrResume`: for a main row, apply the same active-`br_agent_monthly` check `applyBrActivatePending` already has.
3. `adminPaymentSuspensionPolicy.decideAdminReactivationHold`: treat `entitlement === "none"` as blocked (`entitlement_missing`) for `requireEntitlement` lanes once legacy rows are covered by comp entitlements.
4. `adminReactivationPolicy.decideAdminReactivation`: for `bienes-raices` do not use `published_at` as the "ever live" proof (prod counter-example above); use entitlement/`expires_at`.

### B.5 Verification queries and tests

```sql
-- after #1 (must all be false, service_role true)
select p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_x,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_x,
       has_function_privilege('public', p.oid, 'EXECUTE')        as public_x,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  as svc_x,
       p.proacl::text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('br_negocio_activate_listing', 'autos_dealer_activate_listing');

-- after #5
select proname, position('commercial_authority_required' in pg_get_functiondef(oid)) > 0 as has_authority_check
  from pg_proc where proname in ('br_negocio_activate_listing', 'autos_dealer_activate_listing');
```

Executable: `tests/capacity_rpc_authority_branch_tests.sql` (Part 1: authenticated/anon get `42501`, service_role callable; Part 2: no entitlement / pending-payment entitlement / expired entitlement → `commercial_authority_required`; valid entitlement without subscription → activated; dealer with live subscription only → activated).
Also on the branch: replay one Stripe **test-mode** `checkout.session.completed` for a BR Negocio base package and an Autos dealer base package and confirm activation still succeeds after #5 (`UNVERIFIED at runtime` — proven only by source order).

---

## C. `restaurantes_public_listings.draft_listing_id` unique index (migration #4)

### C.1 Production proof (read-only)

```sql
select count(*) from (select draft_listing_id from public.restaurantes_public_listings
                      where draft_listing_id is not null group by draft_listing_id having count(*) > 1) d;   -- = 0
```
Rows 7, NULL 0, blank 0, non-null 7, distinct non-null 7. No existing index on the column. **Exact duplicate count: 0.**

### C.2 Migration

Partial unique index `WHERE draft_listing_id IS NOT NULL AND btrim(draft_listing_id) <> ''` (identical predicate to the Comida Local index). The file is a plain `CREATE UNIQUE INDEX IF NOT EXISTS` inside a transaction (7 rows → sub-millisecond lock) with a duplicate pre-flight. **`CREATE UNIQUE INDEX CONCURRENTLY` cannot run in a transaction / multi-statement migration file**; if the table ever grows, run this ALONE in the SQL editor and drop with `drop index concurrently` on rollback:

```sql
create unique index concurrently if not exists restaurantes_public_listings_draft_listing_id_uidx
  on public.restaurantes_public_listings (draft_listing_id)
  where draft_listing_id is not null and btrim(draft_listing_id) <> '';
```

### C.3 Does the insert path handle 23505? — NO, not for this constraint. Required code change (deploy BEFORE #4)

`app/api/clasificados/restaurantes/publish/route.ts` has `isUniqueViolation()` but the insert loop (lines ~570-592) treats **every** unique violation as a `leonix_ad_id` collision: it `continue`s, allocates another Ad ID and retries up to 8 times with the **same** `draft_listing_id`, then returns `500 insert_failed`. Once the index exists a genuine race would therefore end in a 500 instead of converging. Exact small change (re-read and adopt the winner, same ownership rule as the existing `racedWinner` branch):

```ts
// near isUniqueViolation():
function isDraftListingIdViolation(err: { message?: string; details?: string } | null | undefined): boolean {
  return /draft_listing_id/i.test(`${err?.message ?? ""} ${err?.details ?? ""}`);
}

// in the insert loop, replace:
//   if (isUniqueViolation(error)) continue;
// with:
if (isUniqueViolation(error)) {
  if (isDraftListingIdViolation(error)) {
    const won = await readRestauranteRowsForDraft(supabase, draft.draftListingId);
    const winner = won.rows[0];
    if (winner?.id) {
      if (winner.owner_user_id && verifiedOwnerId && winner.owner_user_id !== verifiedOwnerId) {
        return NextResponse.json({ ok: false, error: "ownership_mismatch" }, { status: 403 });
      }
      listingIdOut = winner.id;
      leonixAdIdOut = winner.leonix_ad_id ?? null;
      slugOut = winner.slug ?? slugOut;
      insertError = null;
      break;
    }
  }
  continue; // leonix_ad_id / slug collision: retry with a fresh id as before
}
```
(`insertError`'s type gains `details?: string`.) The existing post-insert reconciliation (archive the loser) stays valid: with the index the loser can no longer exist, so it becomes a no-op. The duplicate-tolerant lookup at the top of the route stays as a safety net.

### C.4 Verification / rollback

```sql
select indexname, indexdef from pg_indexes
 where schemaname='public' and tablename='restaurantes_public_listings' and indexname='restaurantes_public_listings_draft_listing_id_uidx';
select i.indisunique, i.indisvalid from pg_index i join pg_class c on c.oid=i.indexrelid
 where c.relname='restaurantes_public_listings_draft_listing_id_uidx';          -- true, true
```
Behavioural: insert two rows with the same non-null `draft_listing_id` on the branch → second raises `23505` naming the index; two NULLs both succeed. Rollback: `…_uidx_rollback.sql` (`drop index if exists`).

---

## D. `listing_lifecycle_reminder_events` (migration #2)

* **Finding:** RLS off, 0 policies, 0 rows, `anon`/`authenticated` hold `arwdDxtm` — **TRUNCATE included** (`has_table_privilege('anon'|'authenticated', …, 'TRUNCATE') = true`, read from `pg_catalog`; RLS never covers TRUNCATE). It is the only public table with RLS off.
* **Readers/writers in the repo:** **none.** Only the creating migration `20260714231500_rentas_lifecycle_reminders_and_expiration_index.sql`, a comment in `app/lib/listingLifecycle/listingLifecycleConfig.ts:30`, and a string-presence assert in `scripts/verify-rentas-lifecycle-renewal-dashboard-global-engine-01.mjs`. The reminder runner does not exist, so **no owner policy is added**; a future runner must use the service-role client (BYPASSRLS; grants left intact).
* **Migration:** `enable row level security` + `revoke all … from public` + `revoke all … from anon, authenticated` + restate service_role grants; post-condition asserts RLS on and no anon/authenticated privilege incl. TRUNCATE.
* **Verification:**
```sql
select relrowsecurity from pg_class where oid = 'public.listing_lifecycle_reminder_events'::regclass;   -- true
select p, has_table_privilege('anon','public.listing_lifecycle_reminder_events',p) as anon,
          has_table_privilege('authenticated','public.listing_lifecycle_reminder_events',p) as auth,
          has_table_privilege('service_role','public.listing_lifecycle_reminder_events',p) as svc
  from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p;         -- anon/auth all false, svc true
select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;                                    -- 0
```
* **Rollback:** `…_lockdown_rollback.sql` (disable RLS + `grant all … to anon, authenticated`) — re-exposes the table.

---

## E. Items explicitly UNVERIFIED

* That PostgREST actually serves `/rpc/br_negocio_activate_listing` to `authenticated` in prod (ACL proven; the RPC was deliberately **not** called).
* Every trigger/RPC test in this document has been **authored, not run** — no branch DB was created or written (create/branch tools were not used).
* Runtime ordering of entitlement-before-activation in a live Stripe test-mode replay (source order only).
* Whether the legacy `api/clasificados/leonix/stripe/*` endpoints still receive Stripe events in prod (affects migration #5).
* Whether any other client (mobile app, Studio automation, external integration) writes `public.listings` with the anon/authenticated key — only this repo was scanned.
* Vercel/Stripe environment values (`BR_*_BYPASS`, `NODE_ENV`) — read only from source.

## F. Risks summary

| Risk | Where | Mitigation |
|---|---|---|
| Guard blocks a legitimate owner write the scan missed | #3 | branch test first; rollback is `drop trigger` (instant, no data touched); the free-category allow-list is one constant (`c_free_cats`) and unknown categories fail closed |
| Existing quick-publisher retry on a terminal-state/paid row now errors | #3 | intended (A.3.4); UI shows the generic save error |
| Owner Archive buttons (4 surfaces) error in strict mode | #3 | ship the server archive route first, or Stage-1 `c_owner_may_archive := true` (§A.4) |
| Public anon read of every `listings` row (`listings_select_public USING (true)`) | separate | proposed in `PARITY_TABLE_2026-09.md` §5; not duplicated here |
| Capacity RPC authority check refuses a legacy live row after it is paused | #5 | pre-flight query; comp entitlements; nothing changes while a row stays `active` |
| Legacy BR Stripe flow refused | #5 | confirm retired first |
| `CREATE INDEX` lock on a grown table | #4 | CONCURRENTLY variant documented |
| md5 drift guard aborts #5 on a branch built from repo migrations | #5 | `set leonix.skip_rpc_md5_guard = 'on'` for that session only |
