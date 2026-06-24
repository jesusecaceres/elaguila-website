-- Gate OFERTAS-SCHEMA-2 — production already has the wide ofertas_locales schema.
-- App code was aligned to production columns; no new columns required.
-- Run only if PostgREST schema cache is stale after manual dashboard changes:

notify pgrst, 'reload schema';
