-- Gate D17 — Leonix Community Trust: extend the existing lion-vote system to Comida Local.
--
-- Additive only. Preserves every existing Servicios/Restaurantes value on both CHECK
-- constraints and adds one new target_type ('comida_local_listing') and one new category
-- ('comida-local', matching COMIDA_LOCAL_CATEGORY_KEY used everywhere else in the app —
-- app/lib/clasificados/comida-local/comidaLocalConstants.ts). No existing row, index, RLS
-- policy, or grant is touched. Mirrors the exact drop/recreate CHECK pattern already used by
-- 20260819210000_leonix_endorsement_votes.sql's own analytics-event-type widening.

-- ---------------------------------------------------------------------------
-- 1) WIDEN target_type / category CHECK CONSTRAINTS
-- ---------------------------------------------------------------------------
ALTER TABLE public.leonix_endorsement_votes
  DROP CONSTRAINT IF EXISTS leonix_endorsement_votes_target_type_check;

ALTER TABLE public.leonix_endorsement_votes
  ADD CONSTRAINT leonix_endorsement_votes_target_type_check
  CHECK (target_type IN ('servicios_profile', 'restaurantes_listing', 'comida_local_listing'));

ALTER TABLE public.leonix_endorsement_votes
  DROP CONSTRAINT IF EXISTS leonix_endorsement_votes_category_check;

ALTER TABLE public.leonix_endorsement_votes
  ADD CONSTRAINT leonix_endorsement_votes_category_check
  CHECK (category IN ('servicios', 'restaurantes', 'comida-local'));

-- ---------------------------------------------------------------------------
-- 2) TOGGLE RPC — add the comida_local_listing target-existence branch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_leonix_endorsement_vote(
  p_target_type text,
  p_target_id uuid,
  p_category text,
  p_endorsement_key text,
  p_user_id uuid
)
RETURNS TABLE(active boolean, vote_count integer)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
  v_target_exists boolean;
BEGIN
  IF p_target_type = 'servicios_profile' THEN
    SELECT EXISTS (SELECT 1 FROM public.servicios_public_listings WHERE id = p_target_id) INTO v_target_exists;
  ELSIF p_target_type = 'restaurantes_listing' THEN
    SELECT EXISTS (SELECT 1 FROM public.restaurantes_public_listings WHERE id = p_target_id) INTO v_target_exists;
  ELSIF p_target_type = 'comida_local_listing' THEN
    SELECT EXISTS (SELECT 1 FROM public.comida_local_public_listings WHERE id = p_target_id) INTO v_target_exists;
  ELSE
    v_target_exists := false;
  END IF;

  IF NOT v_target_exists THEN
    RAISE EXCEPTION 'leonix_endorsement_target_not_found' USING ERRCODE = 'foreign_key_violation';
  END IF;

  DELETE FROM public.leonix_endorsement_votes
  WHERE user_id = p_user_id
    AND target_type = p_target_type
    AND target_id = p_target_id
    AND endorsement_key = p_endorsement_key;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    INSERT INTO public.leonix_endorsement_votes (target_type, target_id, category, endorsement_key, user_id)
    VALUES (p_target_type, p_target_id, p_category, p_endorsement_key, p_user_id)
    ON CONFLICT (user_id, target_type, target_id, endorsement_key) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.leonix_endorsement_votes
      WHERE user_id = p_user_id
        AND target_type = p_target_type
        AND target_id = p_target_id
        AND endorsement_key = p_endorsement_key
    ) AS active,
    (
      SELECT COUNT(*)::integer FROM public.leonix_endorsement_votes
      WHERE target_type = p_target_type AND target_id = p_target_id AND endorsement_key = p_endorsement_key
    ) AS vote_count;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) TO service_role;

COMMENT ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) IS
  'Leonix Community Trust — atomic vote toggle. service_role execute only. Gate D17: adds '
  'comida_local_listing target existence check alongside servicios_profile/restaurantes_listing; '
  'behavior for those two is unchanged.';

-- get_leonix_endorsement_summary is target_type-agnostic (groups by endorsement_key for a given
-- target_id) and needs no change.
