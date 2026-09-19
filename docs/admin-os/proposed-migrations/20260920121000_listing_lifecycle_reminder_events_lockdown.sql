-- =====================================================================================================
-- PROPOSED MIGRATION - NOT APPLIED. Deliberately outside supabase/migrations/.
-- Apply order: 2 of 5.   Risk: NONE at runtime (table has 0 rows; no app reader or writer exists).   Priority: P2.
--
-- WHY (verified read-only against production xuieateniufcrsfdomwl on 2026-09-18):
--   public.listing_lifecycle_reminder_events is the ONLY public table with RLS disabled (pg_class.relrowsecurity = false,
--   0 policies). relacl = {postgres=arwdDxtm, anon=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm}, so anon and
--   authenticated hold SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on it and, with RLS off, PostgREST would
--   let ANY visitor (with the public anon key) read owner_id / leonix_ad_id / expiry rows and write or delete them.
--   The table is empty (0 rows) and the reminder runner does not exist yet.
--
-- READERS / WRITERS in the repo (grep of app/ scripts/ supabase/): NONE. Only references: the creating migration
--   20260714231500, a comment in app/lib/listingLifecycle/listingLifecycleConfig.ts:30, and a string-presence check in
--   scripts/verify-rentas-lifecycle-renewal-dashboard-global-engine-01.mjs. => No owner policy is added: an owner has no
--   reason to read reminder rows through the browser client, and any future runner must use the service-role client
--   (BYPASSRLS), which this migration leaves fully privileged.
--
-- WHAT: enable RLS (no policies = deny-all for anon/authenticated), REVOKE ALL from PUBLIC/anon/authenticated
--   (this also removes the TRUNCATE grant, which RLS never covers). service_role keeps its existing grants.
--
-- ROLLBACK: 20260920121000_listing_lifecycle_reminder_events_lockdown_rollback.sql
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

-- service_role already holds arwdDxtm (verified); re-stated so the intent is explicit and idempotent.
grant select, insert, update, delete on table public.listing_lifecycle_reminder_events to service_role;

do $post$
declare
  t regclass := 'public.listing_lifecycle_reminder_events'::regclass;
  p text;
begin
  if not (select relrowsecurity from pg_class where oid = t) then
    raise exception 'listing_lifecycle_reminder_events_lockdown: RLS is still disabled';
  end if;
  foreach p in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
    if has_table_privilege('anon', t, p) or has_table_privilege('authenticated', t, p) then
      raise exception 'listing_lifecycle_reminder_events_lockdown: anon/authenticated still hold % on the table', p;
    end if;
  end loop;
  if not has_table_privilege('service_role', t, 'SELECT') or not has_table_privilege('service_role', t, 'INSERT') then
    raise exception 'listing_lifecycle_reminder_events_lockdown: service_role lost access';
  end if;
end
$post$;

commit;
