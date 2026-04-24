-- Append-only audit trail for `listings` lifecycle mutations (seller dashboard, publish, admin via service role).
-- Rows are written by trigger only (no client INSERT policy). Owners read their listing's events via RLS.

CREATE TABLE IF NOT EXISTS public.listing_audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  actor_user_id uuid,
  action text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_audit_event_listing_created_idx
  ON public.listing_audit_event (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listing_audit_event_created_at_idx
  ON public.listing_audit_event (created_at DESC);

COMMENT ON TABLE public.listing_audit_event IS 'Lifecycle-focused listing mutations; actor_user_id set when JWT present.';

ALTER TABLE public.listing_audit_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_audit_event_authenticated_owner_select"
  ON public.listing_audit_event
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_audit_event.listing_id
        AND l.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.log_listing_lifecycle_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  act text;
  meta jsonb;
  st_old text;
  st_new text;
BEGIN
  uid := auth.uid();

  IF tg_op = 'INSERT' THEN
    meta := jsonb_build_object(
      'category', NEW.category,
      'status', NEW.status,
      'is_published', NEW.is_published
    );
    INSERT INTO public.listing_audit_event (listing_id, actor_user_id, action, meta)
    VALUES (NEW.id, uid, 'listing_created', meta);
    RETURN NEW;
  END IF;

  IF tg_op = 'UPDATE' THEN
    IF OLD.status IS NOT DISTINCT FROM NEW.status
       AND OLD.is_published IS NOT DISTINCT FROM NEW.is_published
       AND OLD.boost_expires IS NOT DISTINCT FROM NEW.boost_expires THEN
      RETURN NEW;
    END IF;

    st_old := lower(coalesce(OLD.status, ''));
    st_new := lower(coalesce(NEW.status, ''));

    act := 'listing_lifecycle_changed';
    IF st_new = 'removed' AND st_old IS DISTINCT FROM 'removed' THEN
      act := 'listing_status_removed';
    ELSIF (NEW.is_published = false OR st_new = 'unpublished')
          AND (OLD.is_published IS DISTINCT FROM NEW.is_published OR OLD.status IS DISTINCT FROM NEW.status) THEN
      act := 'listing_unpublished';
    ELSIF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
      act := 'listing_published';
    ELSIF st_new = 'sold' AND st_old IS DISTINCT FROM 'sold' THEN
      act := 'listing_marked_sold';
    ELSIF OLD.boost_expires IS DISTINCT FROM NEW.boost_expires THEN
      act := 'listing_boost_changed';
    END IF;

    meta := jsonb_build_object(
      'before', jsonb_build_object('status', OLD.status, 'is_published', OLD.is_published, 'boost_expires', OLD.boost_expires),
      'after', jsonb_build_object('status', NEW.status, 'is_published', NEW.is_published, 'boost_expires', NEW.boost_expires)
    );

    INSERT INTO public.listing_audit_event (listing_id, actor_user_id, action, meta)
    VALUES (NEW.id, uid, act, meta);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_lifecycle_audit_ins ON public.listings;
CREATE TRIGGER listings_lifecycle_audit_ins
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_listing_lifecycle_audit();

DROP TRIGGER IF EXISTS listings_lifecycle_audit_upd ON public.listings;
CREATE TRIGGER listings_lifecycle_audit_upd
  AFTER UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_listing_lifecycle_audit();
