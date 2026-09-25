-- =====================================================================================================
-- LAUNCH SECURITY WAVE 1 — step 2 of 3 · public.listing_lifecycle_reminder_events: server-only.
-- Canonical successor of the admin-branch proposal docs/admin-os/proposed-migrations/
-- 20260920121000_listing_lifecycle_reminder_events_lockdown.sql (never in the source tree).
-- Priority P0 · Risk LOW.
--
-- WHY (verified read-only on Leonix Media xuieateniufcrsfdomwl, 2026-09-25):
--   The table (created by 20260714231500_rentas_lifecycle_reminders_and_expiration_index) has RLS DISABLED, 0
--   policies, and ACL {anon=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm} — any visitor holding the public
--   anon key can read, insert, update and delete reminder records through PostgREST (Supabase advisor
--   rls_disabled_in_public = ERROR). 0 rows today.
--
-- WHAT: enable RLS; revoke every privilege from PUBLIC, anon, authenticated; keep service_role DML.
--   No policy is added: client roles get NO access (deny-all), service_role bypasses RLS. No other table is touched.
--
-- APP IMPACT: NONE. No browser code reads or writes this table (app/ source only mentions it in a comment in
--   app/lib/listingLifecycle/listingLifecycleConfig.ts); no SQL function references it; pg_cron is not installed.
--
-- EXPECTED BEFORE: relrowsecurity = false; anon/authenticated hold SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER.
-- EXPECTED AFTER : relrowsecurity = true; anon/authenticated hold nothing; service_role holds SELECT/INSERT/UPDATE/DELETE.
-- IDEMPOTENT     : ENABLE RLS / REVOKE / GRANT are no-ops when already in the target state; assertions re-verify.
-- ROLLBACK       : docs/db-gates/wave-1-2026-09-25/rollback_20260925120100_listing_lifecycle_reminder_events_lockdown.sql
--                  (re-exposes the table — emergency only).
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

do $pre$
begin
  if to_regclass('public.listing_lifecycle_reminder_events') is null then
    raise exception 'listing_lifecycle_reminder_events_lockdown: table public.listing_lifecycle_reminder_events not found';
  end if;
end
$pre$;

alter table public.listing_lifecycle_reminder_events enable row level security;

revoke all on table public.listing_lifecycle_reminder_events from public;
revoke all on table public.listing_lifecycle_reminder_events from anon, authenticated;

grant select, insert, update, delete on table public.listing_lifecycle_reminder_events to service_role;

do $post$
declare
  t regclass := 'public.listing_lifecycle_reminder_events'::regclass;
  p text;
begin
  if not (select relrowsecurity from pg_class where oid = t) then
    raise exception 'listing_lifecycle_reminder_events_lockdown: RLS is still disabled';
  end if;
  foreach p in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
    if has_table_privilege('anon', t, p) or has_table_privilege('authenticated', t, p) then
      raise exception 'listing_lifecycle_reminder_events_lockdown: anon/authenticated still hold % on the table', p;
    end if;
  end loop;
  foreach p in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
    if not has_table_privilege('service_role', t, p) then
      raise exception 'listing_lifecycle_reminder_events_lockdown: service_role lost %', p;
    end if;
  end loop;
end
$post$;

commit;
