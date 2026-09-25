-- =====================================================================================================
-- LAUNCH SECURITY WAVE 1 — step 1 of 3 · Capacity activation RPCs: service_role only.
-- Canonical successor of the admin-branch proposal docs/admin-os/proposed-migrations/
-- 20260920120000_revoke_capacity_rpc_client_execute.sql (integration/category-circuit-closeout-2026-09), which
-- was never in the source tree. Priority P0 · Risk LOW (no app caller is affected).
--
-- WHY (verified read-only on Leonix Media xuieateniufcrsfdomwl, 2026-09-25):
--   public.autos_dealer_activate_listing(uuid, uuid, text) and public.br_negocio_activate_listing(uuid, uuid, text)
--   are SECURITY DEFINER (owner postgres, bypass RLS), take the OWNER ID as a caller-supplied parameter, never check
--   auth.uid(), and activate the row when its status equals p_from_status. Autos treats "no subscription record" as
--   allowed. Production ACL on both: {postgres=X, anon=X, authenticated=X, service_role=X} — so any signed-in owner
--   (or the anon key) can call /rest/v1/rpc/<fn> and publish their own unpaid pending listing.
--   The authoring migration (20260810120000) ran `revoke all ... from public`, but Supabase default privileges had
--   already granted EXECUTE directly to anon/authenticated; `revoke ... from public` does not remove direct grants.
--   (20260924190000 has the same limitation — this migration closes it regardless of apply order.)
--
-- WHAT: revoke EXECUTE from PUBLIC, anon, authenticated; keep service_role. Function BODIES are NOT touched.
--
-- APP IMPACT: NONE. Every caller uses the service-role client:
--   app/lib/listingPlans/capacityActivationRpc.ts (getAdminSupabase, "server-only") and
--   app/admin/_lib/bienesNegocioCommercialOps.ts (getAdminSupabase). No SQL function, trigger or pg_cron job
--   references either RPC (pg_proc.prosrc scan = 0; pg_cron not installed).
--
-- EXPECTED BEFORE: anon/authenticated/service_role can EXECUTE both functions.
-- EXPECTED AFTER : only service_role (and postgres, the owner) can EXECUTE; PUBLIC/anon/authenticated cannot.
-- IDEMPOTENT     : REVOKE/GRANT are no-ops when already in the target state; assertions re-verify.
-- ROLLBACK       : docs/db-gates/wave-1-2026-09-25/rollback_20260925120000_revoke_capacity_rpc_client_execute.sql
--                  (re-opens the hole — emergency only).
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

-- Fail fast on a drifted database instead of silently doing nothing.
do $pre$
begin
  if to_regprocedure('public.autos_dealer_activate_listing(uuid,uuid,text)') is null then
    raise exception 'revoke_capacity_rpc_client_execute: public.autos_dealer_activate_listing(uuid,uuid,text) not found';
  end if;
  if to_regprocedure('public.br_negocio_activate_listing(uuid,uuid,text)') is null then
    raise exception 'revoke_capacity_rpc_client_execute: public.br_negocio_activate_listing(uuid,uuid,text) not found';
  end if;
end
$pre$;

revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.br_negocio_activate_listing(uuid, uuid, text)   from public, anon, authenticated;

grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;
grant execute on function public.br_negocio_activate_listing(uuid, uuid, text)   to service_role;

-- Post-assertions: the transaction aborts (nothing is committed) unless the target ACL holds exactly.
do $post$
declare
  r record;
begin
  for r in
    select p.oid, p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('autos_dealer_activate_listing', 'br_negocio_activate_listing')
  loop
    if has_function_privilege('anon', r.oid, 'EXECUTE') then
      raise exception 'revoke_capacity_rpc_client_execute: anon can still EXECUTE %', r.proname;
    end if;
    if has_function_privilege('authenticated', r.oid, 'EXECUTE') then
      raise exception 'revoke_capacity_rpc_client_execute: authenticated can still EXECUTE %', r.proname;
    end if;
    if has_function_privilege('public', r.oid, 'EXECUTE') then
      raise exception 'revoke_capacity_rpc_client_execute: PUBLIC can still EXECUTE %', r.proname;
    end if;
    if not has_function_privilege('service_role', r.oid, 'EXECUTE') then
      raise exception 'revoke_capacity_rpc_client_execute: service_role lost EXECUTE on %', r.proname;
    end if;
  end loop;
end
$post$;

commit;
