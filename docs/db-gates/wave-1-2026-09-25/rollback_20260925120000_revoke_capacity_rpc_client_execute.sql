-- ROLLBACK for supabase/migrations/20260925120000_revoke_capacity_rpc_client_execute.sql — NOT A MIGRATION.
-- Restores the Leonix Media ACL observed 2026-09-25: {postgres=X, anon=X, authenticated=X, service_role=X}.
-- WARNING: this RE-OPENS the payment bypass (any signed-in or anonymous caller can execute the capacity RPCs).
-- Use only if a legitimate non-service-role caller is discovered — and prefer fixing that caller instead.
begin;

grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to anon, authenticated;
grant execute on function public.br_negocio_activate_listing(uuid, uuid, text)   to anon, authenticated;

commit;
