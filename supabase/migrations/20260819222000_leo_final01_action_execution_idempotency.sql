-- LEO FINAL-01 action execution idempotency foundation.
-- Additive only. No existing LEO table is redefined or dropped.
-- Enforces at most one durable receipt per (actor, correlation_id) at the
-- database layer, closing the gap where correlation IDs could otherwise be
-- inserted more than once under concurrent/duplicate requests.
--
-- This does not enable any external provider write. It only hardens the
-- receipt substrate that a future write-capable tool would rely on.

ALTER TABLE public.leo_tool_receipts
  ADD CONSTRAINT leo_tool_receipts_actor_correlation_unique
  UNIQUE (actor_auth_user_id, correlation_id);

COMMENT ON CONSTRAINT leo_tool_receipts_actor_correlation_unique ON public.leo_tool_receipts IS
  'LEO FINAL-01: one durable receipt per actor per correlation_id. Callers must derive a '
  'deterministic (non-timestamp) correlation_id from stable action identity so retries '
  'collide into the same row instead of creating a duplicate execution.';

-- source_refs previously had no size bound at all (unlike requested_payload_summary
-- and safe_error_class, which already carry length CHECKs). Mirrors the app-layer
-- LEO_SOURCE_REFS_MAX cap (leoToolReceiptRepository.ts) at the database layer.
ALTER TABLE public.leo_tool_receipts
  ADD CONSTRAINT leo_tool_receipts_source_refs_bounded
  CHECK (jsonb_typeof(source_refs) = 'array' AND jsonb_array_length(source_refs) <= 50);
