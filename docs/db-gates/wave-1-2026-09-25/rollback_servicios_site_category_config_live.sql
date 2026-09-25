-- ROLLBACK for supabase/reviewed-seeds/category-status/20260925_servicios_site_category_config_live.sql — NOT A MIGRATION.
-- Restores the pre-correction Servicios row (Admin shows STAGED again, with the DB-override blocker).
begin;

update public.site_category_config
   set operational_status = 'staged',
       updated_at = now()
 where slug = 'servicios'
   and operational_status = 'live';

commit;
