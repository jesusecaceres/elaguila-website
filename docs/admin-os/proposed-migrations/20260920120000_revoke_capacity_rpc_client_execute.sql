-- =====================================================================================================
-- PROPOSED MIGRATION - NOT APPLIED. Deliberately outside supabase/migrations/ so no pipeline can apply it.
-- Apply order: 1 of 5.   Risk: LOW (no app caller is affected).   Priority: P0.
--
-- WHY (verified read-only against production xuieateniufcrsfdomwl on 2026-09-18):
--   public.br_negocio_activate_listing(uuid, uuid, text) and public.autos_dealer_activate_listing(uuid, uuid, text)
--   are SECURITY DEFINER (owner postgres, bypasses RLS), take the OWNER ID AS A CALLER-SUPPLIED PARAMETER and
--   activate the row (status='active'; BR also is_published=true) if the row's own status equals p_from_status.
--   Their ACL in production is  {postgres=X, anon=X, authenticated=X, service_role=X}  i.e. anon AND authenticated
--   can EXECUTE them through PostgREST /rpc. The authoring migration (20260810120000) intended "service_role only"
--   (it ran `revoke all ... from public; grant execute ... to service_role`) but Supabase default privileges had
--   already granted EXECUTE directly to anon/authenticated, and `revoke ... from public` does not remove direct
--   grants. Result: any signed-in owner can activate their OWN pending / paused / flagged / removed Bienes Raices
--   row (limit 1, no subscription record required) or up to 10 dealer vehicles with no payment.
--
-- WHAT: revoke EXECUTE from PUBLIC, anon, authenticated; keep service_role. Function bodies are NOT touched.
--
-- APP IMPACT: NONE. Every caller goes through capacityActivationRpc.ts -> getAdminSupabase() (service-role key,
--   `import "server-only"`), plus app/admin/_lib/bienesNegocioCommercialOps.ts (also getAdminSupabase()).
--   No SQL function, trigger or pg_cron job references either RPC (pg_proc.prosrc scan = 0 other functions).
--
-- ROLLBACK: 20260920120000_revoke_capacity_rpc_client_execute_rollback.sql (re-grants the insecure ACL - only for an
--   emergency, it re-opens the hole).
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

-- Fail fast if either function is missing (drifted database) instead of silently doing nothing.
do $pre$
begin
  if to_regprocedure('public.br_negocio_activate_listing(uuid,uuid,text)') is null then
    raise exception 'revoke_capacity_rpc_client_execute: public.br_negocio_activate_listing(uuid,uuid,text) not found';
  end if;
  if to_regprocedure('public.autos_dealer_activate_listing(uuid,uuid,text)') is null then
    raise exception 'revoke_capacity_rpc_client_execute: public.autos_dealer_activate_listing(uuid,uuid,text) not found';
  end if;
end
$pre$;

revoke all on function public.br_negocio_activate_listing(uuid, uuid, text)   from public, anon, authenticated;
revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.br_negocio_activate_listing(uuid, uuid, text)   to service_role;
grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;

-- Post-condition: the change is verified inside the same transaction; a mismatch aborts the whole thing.
do $post$
declare
  r record;
begin
  for r in
    select p.oid, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('br_negocio_activate_listing', 'autos_dealer_activate_listing')
  loop
    if has_function_privilege('anon', r.oid, 'EXECUTE')
       or has_function_privilege('authenticated', r.oid, 'EXECUTE')
       or has_function_privilege('public', r.oid, 'EXECUTE') then
      raise exception 'revoke_capacity_rpc_client_execute: % is still executable by a client role', r.proname;
    end if;
    if not has_function_privilege('service_role', r.oid, 'EXECUTE') then
      raise exception 'revoke_capacity_rpc_client_execute: service_role lost EXECUTE on %', r.proname;
    end if;
  end loop;
end
$post$;

commit;

-- Optional hygiene (NOT part of this migration; owner decision): stop FUTURE functions created by postgres in
-- schema public from being auto-executable by anon/authenticated:
--   alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
