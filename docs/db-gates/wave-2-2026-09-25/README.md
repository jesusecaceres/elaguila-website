# Leonix DB Security Gate — Wave 2 (rehearsed on Staging 2026-09-25, NOT applied to production)

Production target (later, after PM approval): **Leonix Media `xuieateniufcrsfdomwl`**. Rehearsal target: **Staging
`cgeehvnfyrdoperdotdh`**. Certification (`mvasgrdzmupsnuicwyjl`) untouched.

| # | File | Kind | Change | Risk |
|---|---|---|---|---|
| 1 | `supabase/migrations/20260924190000_autos_dealer_base_capacity_authority.sql` (grants hardened 2026-09-25) | migration | Autos dealer capacity = TOTAL vehicles, parent #1: BASE 5 / PRO 10 / PRO+pack 20; client EXECUTE revoked + asserted | MEDIUM — changes the live BASE limit (prod today: 10/20, no BASE) |
| 2 | `supabase/migrations/20260925130000_listings_owner_authority_guard.sql` | migration | BEFORE INSERT/UPDATE trigger on `public.listings` constraining only `authenticated`/`anon` | MEDIUM — every owner write on listings |
| 3 | `supabase/migrations/20260925130100_br_negocio_activate_listing_parent_counts.sql` | migration | re-defines the Bienes capacity function with the live Leonix Media logic (parent counts) | LOW — logic-identical on Leonix Media; fixes fresh rebuilds / Staging |
| — | `20260903150000_fix_parent_inventory_capacity_counting.sql` | header only | OBSOLETE/SUPERSEDED marker (comments) — never apply to Leonix Media | none |
| app | 4 quick publishers (`enVentaPublishFromDraft`, Busco, Community/Clases, Mascotas) | code | failed-publish cleanup writes `{is_published:false}` only (no `status:'removed'`) | LOW — must ship with (or before) #2 |

## Staging rehearsal (2026-09-25)

**Prerequisite alignment: none needed.** Staging `listings` has every guard column and the same triggers / policies /
forced RLS as production; `autos_classifieds_listings`, `listing_package_entitlements`, `leonix_subscription_records`
carry every column the capacity function reads; both capacity RPCs were already service_role-only.

Staging mutations (exactly two, recorded): `20260925195412 autos_dealer_base_capacity_authority`,
`20260925200020 listings_owner_authority_guard`. Before: Autos md5 `11371323…` (child-only count, 10/20 children).

- **Autos** (`autos_capacity_rehearsal_tests.sql`): **fail=0**. BASE 5 (6th blocks) · PRO 10 (11th blocks) · PACK 20
  (21st blocks) · no entitlement evidence → PRO 10 (never BASE) · BASE + stray pack → 5 · BASE + PRO (upgrade) → 10 ·
  parent = vehicle #1 · subscription grace → `grace_blocks_new_capacity`, expired grace / suspended →
  `subscription_suspended`, canceled → `subscription_canceled`, active → activates · owner mismatch · status mismatch ·
  idempotent re-activation · child without parent link. ACL after: `postgres=X service_role=X`.
- **Owner-authority guard** (`listings_owner_authority_guard_rehearsal_tests.sql`): **pass=100 fail=0** — paid Rentas / BR /
  FSBO / paid-Clases self-activation, publish-flag bypass, expires_at edits, staff flags, category change, un-removal
  (incl. the SALE-2026-000067 incident path), writes INTO flagged/suspended/expired/rejected — all BLOCKED; free-lane
  publish, draft/content edits, pause/resume/sold/relist, republish bookkeeping, Clases free draft → paid pending,
  owner archive (one-way), service_role fulfilment, postgres/admin writes, SECURITY DEFINER RPC through the guard — all OK;
  other owner → RLS zero rows.
- **Test data clean:** Staging `listings` 6 (unchanged), `autos_classifieds_listings` 23, entitlements 1, subscriptions 0;
  no fixture rows, no helper function left.

## Production apply order (after PM approval)

0. Pre-flight (read-only): capture `pg_get_functiondef` + ACL of `autos_dealer_activate_listing` and
   `br_negocio_activate_listing`; confirm no `listings_owner_authority_guard` trigger; count dealer groups over 5 active
   vehicles that hold a live `autos_dealer_quick_monthly` without PRO (expected 0 — prod has no BASE dealer entitlement).
1. Ship the app change (4 publishers) — it is safe before the guard.
2. Apply #1 (exact file). Verify: ACL service_role only; new md5; BASE/PRO/pack figures on the existing PRO dealer unchanged.
3. Apply #2 (exact file). Verify: trigger enabled; a free-lane smoke publish and an owner pause/resume on a test account;
   Revenue OS paid activation path (service role) unaffected.
4. Apply #3 (optional on Leonix Media — logic-identical; recommended so production history matches source).
5. Re-run the security advisor.

## Rollback (emergency only)

- `rollback_20260924190000_autos_dealer_base_capacity_authority.sql` — restores the exact prod body (md5 `d5cd8e62…`), service_role only.
- `rollback_20260925130000_listings_owner_authority_guard.sql` — drops trigger + function (re-opens owner self-activation).
- #3 needs no rollback on Leonix Media (identical logic).

## Known follow-ups (not blockers; from the 38-writer audit)

- Stage 2 archive: server-route owner archive, then set `c_owner_may_archive := false`.
- BR Negocio relist `sold -> active` still runs from the browser (guard allows paid sold -> active), skipping the server
  capacity check — route it through the BR lifecycle API.
- Staff "unpublish" (status active, is_published false) can be re-published by the owner (active -> active + publish flag).
- `republished_at` / `republish_count` are owner-writable (bump abuse).
- Autos capacity RPC still treats "no subscription record" as allowed (only grace/suspended/canceled refuse); exploitable
  only by service-role callers after Wave 1.
