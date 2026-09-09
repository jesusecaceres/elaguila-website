-- Global Paid Checkout + Revenue OS Closeout — Gate G-CHECKOUT-01
--
-- Root cause of the Servicios publish 503 (`persist_failed`, Postgres 42501
-- "permission denied for table servicios_public_listings"), confirmed via live
-- Vercel runtime error logs on the Globalization Preview deployment: the
-- `service_role` Postgres role — the one every server route authenticates as via
-- `getAdminSupabase()` (app/lib/supabase/server.ts) — was never granted
-- SELECT/INSERT/UPDATE/DELETE on every pre-Business-Concierge application table.
--
-- Confirmed second-order cause (pg_default_acl): this Staging project has two
-- competing default-ACL entries for schema public. The `supabase_admin`-owned
-- default grants full DML to postgres/anon/authenticated/service_role (the
-- platform's standard default). A narrower default-ACL entry for role
-- `postgres` (the confirmed owner of all 122 current public tables, including
-- every affected table below) grants service_role only TRUNCATE/REFERENCES/
-- TRIGGER — no SELECT/INSERT/UPDATE/DELETE. Business Concierge migrations
-- happened to include their own explicit GRANT statements and so were
-- unaffected by this restrictive default; every older Globalization-era table
-- relied on the default and inherited the gap.
--
-- This is a single missing-grant defect that silently breaks BOTH the write
-- path (publish/checkout persistence) AND the read path (public listing
-- detail/results pages also read via the admin client) for every affected
-- table. Purely additive (GRANT only, no DDL/type/data change), safe to
-- re-run, and reversible via REVOKE if ever needed. Grants service_role only —
-- anon/authenticated privileges are untouched, RLS is untouched, no ownership
-- change. Staging only — never run against Production.

grant select, insert, update, delete on table public.listings to service_role;
grant select, insert, update, delete on table public.listing_analytics to service_role;
grant select, insert, update, delete on table public.listing_lifecycle_audit to service_role;

grant select, insert, update, delete on table public.servicios_public_listings to service_role;
grant select, insert, update, delete on table public.servicios_public_leads to service_role;
grant select, insert, update, delete on table public.servicios_listing_reviews to service_role;
grant select, insert, update, delete on table public.servicios_analytics_events to service_role;

grant select, insert, update, delete on table public.restaurantes_public_listings to service_role;
grant select, insert, update, delete on table public.comida_local_public_listings to service_role;
grant select, insert, update, delete on table public.autos_classifieds_listings to service_role;

grant select, insert, update, delete on table public.ofertas_locales to service_role;
grant select, insert, update, delete on table public.oferta_local_items to service_role;
grant select, insert, update, delete on table public.oferta_local_scan_jobs to service_role;
grant select, insert, update, delete on table public.oferta_local_scan_pages to service_role;
grant select, insert, update, delete on table public.ofertas_local_asset_cleanup_queue to service_role;
grant select, insert, update, delete on table public.ofertas_local_notification_events to service_role;
grant select, insert, update, delete on table public.ofertas_local_partner_assignments to service_role;
grant select, insert, update, delete on table public.ofertas_local_partner_organizations to service_role;
grant select, insert, update, delete on table public.ofertas_local_partner_pickup_locations to service_role;
grant select, insert, update, delete on table public.ofertas_local_public_terms to service_role;
grant select, insert, update, delete on table public.ofertas_local_renewal_attempts to service_role;
grant select, insert, update, delete on table public.ofertas_local_source_assets to service_role;

-- Revenue OS payment pipeline — the actual checkout/webhook lifecycle for every paid category.
grant select, insert, update, delete on table public.leonix_payment_records to service_role;
grant select, insert, update, delete on table public.leonix_stripe_webhook_events to service_role;
grant select, insert, update, delete on table public.leonix_subscription_records to service_role;
grant select, insert, update, delete on table public.leonix_placement_entitlements to service_role;
grant select, insert, update, delete on table public.leonix_promo_codes to service_role;
grant select, insert, update, delete on table public.leonix_promo_code_redemptions to service_role;
grant select, insert, update, delete on table public.leonix_verified_intro_discount_redemptions to service_role;
grant select, insert, update, delete on table public.leonix_billing_consents to service_role;
grant select, insert, update, delete on table public.leonix_ad_id_counters to service_role;
grant select, insert, update, delete on table public.leonix_professional_identities to service_role;
grant select, insert, update, delete on table public.leonix_endorsement_votes to service_role;
grant select, insert, update, delete on table public.leonix_media_kit_leads to service_role;
grant select, insert, update, delete on table public.leonix_newsletter_subscribers to service_role;

grant select, insert, update, delete on table public.leo_action_proposals to service_role;
grant select, insert, update, delete on table public.leo_attention_acks to service_role;
grant select, insert, update, delete on table public.leo_commitments to service_role;
grant select, insert, update, delete on table public.leo_conversation_sessions to service_role;
grant select, insert, update, delete on table public.leo_conversation_turns to service_role;
grant select, insert, update, delete on table public.leo_fact_correction_proposals to service_role;
grant select, insert, update, delete on table public.leo_memory_records to service_role;
grant select, insert, update, delete on table public.leo_response_feedback to service_role;
grant select, insert, update, delete on table public.leo_tool_receipts to service_role;

grant select, insert, update, delete on table public.admin_audit_log to service_role;
grant select, insert, update, delete on table public.admin_team_invites to service_role;

-- Prevent recurrence. Confirmed via pg_tables: 100% (122/122) of this Staging
-- project's current public-schema tables are owned by role `postgres` — this is
-- the actual, evidence-confirmed creator role for every table above and for
-- Business Concierge's tables alike, not an assumption. Scoped to service_role
-- only, per the explicit security rule: no default DML grant to anon or
-- authenticated, RLS remains the sole gate for those roles.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
