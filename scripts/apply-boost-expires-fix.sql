-- Apply the missing boost_expires column and fix audit trigger
-- This combines migrations 20260423120000 and 20260424210000

-- Add the missing column first
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS boost_expires timestamptz NULL;

COMMENT ON COLUMN public.listings.boost_expires IS
  'End of paid/featured visibility window; complements Leonix:promoted in detail_pairs (Clasificados browse).';

-- Add other missing columns from the same migration
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_type text NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS rentas_tier text NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS business_name text NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS business_meta text NULL;

COMMENT ON COLUMN public.listings.seller_type IS 'personal | business (Rentas negocio, En Venta business)';
COMMENT ON COLUMN public.listings.business_meta IS 'JSON string for business listings (negocio agent, redes, etc.)';

-- Now fix the audit trigger to handle missing columns safely
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
  old_boost jsonb;
  new_boost jsonb;
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
    -- Use JSON extraction to safely handle missing columns
    old_boost := to_jsonb(OLD) -> 'boost_expires';
    new_boost := to_jsonb(NEW) -> 'boost_expires';

    IF OLD.status IS NOT DISTINCT FROM NEW.status
       AND OLD.is_published IS NOT DISTINCT FROM NEW.is_published
       AND old_boost IS NOT DISTINCT FROM new_boost THEN
      RETURN NEW;
    END IF;

    st_old := lower(coalesce(OLD.status, ''));
    st_new := lower(coalesce(NEW.status, ''));

    act := 'listing_lifecycle_changed';
    IF st_new = 'removed' AND st_old IS DISTINCT FROM 'removed' THEN
      act := 'listing_status_removed';
    ELSIF (NEW.is_published = false OR st_new = 'unpublished')
          AND (OLD.is_published IS NOT DISTINCT FROM NEW.is_published OR OLD.status IS NOT DISTINCT FROM NEW.status) THEN
      act := 'listing_unpublished';
    ELSIF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
      act := 'listing_published';
    ELSIF st_new = 'sold' AND st_old IS DISTINCT FROM 'sold' THEN
      act := 'listing_marked_sold';
    ELSIF old_boost IS NOT DISTINCT FROM new_boost THEN
      act := 'listing_boost_changed';
    END IF;

    meta := jsonb_build_object(
      'before', jsonb_build_object(
        'status', OLD.status,
        'is_published', OLD.is_published,
        'boost_expires', old_boost
      ),
      'after', jsonb_build_object(
        'status', NEW.status,
        'is_published', NEW.is_published,
        'boost_expires', new_boost
      )
    );

    INSERT INTO public.listing_audit_event (listing_id, actor_user_id, action, meta)
    VALUES (NEW.id, uid, act, meta);
  END IF;

  RETURN NEW;
END;
$$;
