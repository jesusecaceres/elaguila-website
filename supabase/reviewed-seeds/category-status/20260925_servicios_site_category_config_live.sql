-- =============================================================================
-- Leonix Admin category truth — Servicios site_category_config correction (one row)
-- =============================================================================
-- TARGET: the canonical project Leonix Media (ref xuieateniufcrsfdomwl) and no other.
-- REVIEWED SEED — NOT A MIGRATION. DO NOT move it into supabase/migrations/. DO NOT use a blind
-- `supabase db push`. Apply explicitly, only after PM approval, following
-- docs/db-gates/wave-1-2026-09-25/README.md (step 4).
--
-- WHY: the Servicios code default is LIVE/full (clasificadosCategoryRegistry.ts). A 2026-04-09 seed row in
-- public.site_category_config ("Puede seguir en transición según producto.") overrides it to 'staged', which is the
-- sole cause of the Admin "STAGED" badge (proven 2026-09-25; commit d80dc09b6 makes Admin name the override).
-- Admin-only: the public publish chooser filters only 'hidden'.
--
-- 1 guarded UPDATE · 0 INSERT · 0 DELETE · 0 DDL. One transaction; the closing assertion aborts it (nothing is
-- committed) unless the row ends exactly live/public with the other fields untouched. Idempotent: after a successful
-- apply the guard matches nothing and the assertion still passes.
--
-- BEFORE (observed 2026-09-25):
--   slug=servicios visibility=public sort_order=40 operational_status=staged highlight=false
--   notes='Puede seguir en transición según producto.' updated_at=2026-04-09 02:10:09.208535+00
-- AFTER: operational_status=live, updated_at=now(); visibility/sort_order/highlight/notes unchanged.
-- ROLLBACK: docs/db-gates/wave-1-2026-09-25/rollback_servicios_site_category_config_live.sql
-- =============================================================================

BEGIN;

UPDATE public.site_category_config
   SET operational_status = 'live',
       updated_at = now()
 WHERE slug = 'servicios'
   AND operational_status = 'staged';

DO $assert$
DECLARE
  r record;
BEGIN
  SELECT slug, operational_status, visibility, sort_order, highlight INTO r
    FROM public.site_category_config
   WHERE slug = 'servicios';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'servicios site_category_config row not found';
  END IF;
  IF r.operational_status <> 'live' THEN
    RAISE EXCEPTION 'servicios operational_status is %, expected live', r.operational_status;
  END IF;
  IF r.visibility <> 'public' OR r.sort_order <> 40 OR r.highlight IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'servicios row changed unexpectedly (visibility=%, sort_order=%, highlight=%)', r.visibility, r.sort_order, r.highlight;
  END IF;
  IF (SELECT count(*) FROM public.site_category_config) <> 5 THEN
    RAISE EXCEPTION 'site_category_config row count changed (expected 5)';
  END IF;
END
$assert$;

COMMIT;
