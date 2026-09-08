-- Recursos Existing-Resource Official-Spanish Bridge — Gate ES-9A: proposal-source schema
-- widen only. Additive only. No new tables. No new columns. No data rewrite. No public-contract
-- change. No RLS change.
--
-- Doctrine: an EXISTING, already-verified, non-high-risk resource can now have official Spanish
-- source content proposed for it (found by discovery/research, not AI-translated) through the
-- SAME resource_change_proposals/verification_events/audit review architecture every other
-- proposal type already uses. This migration only widens the CHECK constraint so
-- proposal_source='official_spanish' is a legal value — it does not itself grant any write
-- access, review flow, or public-trust status. Those live entirely in application code
-- (prepareOfficialSpanishProposals.ts, recursosOfficialSpanishActions.ts).
--
-- Precedent: identical move already made once, for 'translation', in
-- 20260821090000_recursos_spanish_bridge_foundation.sql (Gate ES-1B). This migration follows the
-- exact same drop-constraint-if-exists + re-add pattern and does not touch that file.

-- ---------------------------------------------------------------------------
-- Gate ES-9A — widen resource_change_proposals.proposal_source to add 'official_spanish'.
-- Additive only: every existing value (pdf_reextraction, url_recheck, partner_request, manual,
-- translation) is preserved unchanged. No existing row is rewritten by this migration. No status
-- touched.
-- ---------------------------------------------------------------------------

alter table public.resource_change_proposals
  drop constraint if exists resource_change_proposals_proposal_source_check;

alter table public.resource_change_proposals
  add constraint resource_change_proposals_proposal_source_check
  check (proposal_source in ('pdf_reextraction', 'url_recheck', 'partner_request', 'manual', 'translation', 'official_spanish'));

comment on column public.resource_change_proposals.proposal_source is
  'Recursos Intake OS — where a proposed field change came from. official_spanish (Gate ES-9A) is content extracted directly from an official Spanish/bilingual source for an EXISTING verified resource, never AI-translated, never auto-accepted by the generic bulk-safe-factual-accept flow (see acceptAllSafeChangeProposalsAction).';
