-- Servicios / Clasificados engagement: browser client writes use the authenticated role.
-- Without these grants, PostgREST returns permission denied even when RLS policies allow the row.
-- Apply in Supabase (SQL editor or `supabase db push`) before expecting Like/Save to work from the app.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_liked_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_saved_listings TO authenticated;
