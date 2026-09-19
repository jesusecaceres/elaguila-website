-- =====================================================================================================
-- ROLLBACK for 20260920120000_revoke_capacity_rpc_client_execute.sql - NOT APPLIED.
-- Restores the production ACL observed on 2026-09-18:  {postgres=X, anon=X, authenticated=X, service_role=X}.
-- WARNING: this RE-OPENS the hole (any signed-in or anonymous caller can execute the capacity-activation RPCs).
-- Use only if a legitimate non-service-role caller is discovered, and prefer fixing that caller.
-- =====================================================================================================
begin;

grant execute on function public.br_negocio_activate_listing(uuid, uuid, text)   to anon, authenticated;
grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to anon, authenticated;

commit;
