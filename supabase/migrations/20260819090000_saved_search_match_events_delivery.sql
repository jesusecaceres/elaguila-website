-- Saved Search 05 — delivery-truth schema adjustments for `saved_search_match_events`.
--
-- Additive/minimally-mutating only. No existing row is rewritten. No table, column, or existing
-- constraint value is removed. Forward-only, deterministic, safe to run more than once.
--
-- (1) ATTEMPT-COUNT TRUTH (Gate 3)
-- Saved Search 04 initialized `attempt_count DEFAULT 1` even though SS04 performs ZERO delivery
-- attempts — it only ever creates the row. Saved Search 05 makes `attempt_count` mean "number of
-- real delivery attempts made," so future inserts must start at 0, and the CHECK must allow 0.
-- Coach confirmed directly against Production (project xuieateniufcrsfdomwl):
--   select status, attempt_count, count(*) from public.saved_search_match_events
--   group by status, attempt_count;  ->  ZERO ROWS
-- so there is no legacy row whose attempt_count semantics this migration needs to preserve or
-- reinterpret; the column-level default/CHECK change below is a plain, safe normalization, not a
-- data migration. (No row is rewritten by this statement either way — it only changes the default
-- applied to FUTURE inserts and the constraint applied to all values, matching the current data.)
ALTER TABLE public.saved_search_match_events
  ALTER COLUMN attempt_count SET DEFAULT 0;

ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_attempt_count_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_attempt_count_check
  CHECK (attempt_count >= 0);

-- (2) CLAIM STATE (Gate 4)
-- Adds the one additional status value the atomic claim RPC below needs. `pending`/`failed` rows
-- become `processing` for the duration of one delivery attempt so two concurrent invocations can
-- never both claim (and therefore never both email) the same event.
ALTER TABLE public.saved_search_match_events
  DROP CONSTRAINT IF EXISTS saved_search_match_events_status_check;
ALTER TABLE public.saved_search_match_events
  ADD CONSTRAINT saved_search_match_events_status_check
  CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'skipped'));

-- (3) ATOMIC CLAIM (Gate 4)
-- A single UPDATE ... WHERE ... RETURNING statement is Postgres's standard atomic conditional
-- claim: concurrent callers targeting the same row serialize on the row lock, and only the caller
-- whose WHERE clause still matches after the lock is granted receives a row back. No SELECT-then-
-- UPDATE race is possible. attempt_count is incremented in the same statement as the claim, so the
-- two are never split across a read/write race either. SECURITY INVOKER (the default — omitted
-- below) is sufficient and used deliberately: only `service_role` may ever execute this function
-- (see REVOKE/GRANT below), and `service_role` already bypasses RLS, so SECURITY DEFINER would be
-- an unnecessary privilege escalation, not a required one.
CREATE OR REPLACE FUNCTION public.claim_saved_search_match_event(
  p_event_id uuid,
  p_max_attempts integer DEFAULT 3
)
RETURNS SETOF public.saved_search_match_events
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.saved_search_match_events
  SET status = 'processing',
      attempt_count = attempt_count + 1,
      updated_at = now()
  WHERE id = p_event_id
    AND status IN ('pending', 'failed')
    AND attempt_count < p_max_attempts
  RETURNING *;
$$;

-- Server-only: no browser role may ever claim/mutate a match event directly or via this function.
REVOKE ALL ON FUNCTION public.claim_saved_search_match_event(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_saved_search_match_event(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.claim_saved_search_match_event(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_saved_search_match_event(uuid, integer) TO service_role;

COMMENT ON FUNCTION public.claim_saved_search_match_event(uuid, integer) IS
  'Saved Search 05 — atomic claim boundary for the email delivery engine. Moves one pending/failed '
  'match event to processing and increments attempt_count in a single statement so two concurrent '
  'delivery attempts can never both send the same event. service_role execute only.';
