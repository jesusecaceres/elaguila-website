-- Recursos Verified Spanish Bridge — Gate ES-1: provenance + proposal-source schema foundation
-- only. Additive only. No new tables. No data rewrite. No public-contract change.
--
-- Doctrine (Coach-approved supersession of the old "no machine-generated resource translations,
-- ever" rule — see app/lib/recursos/recursosBilingualFallback.ts): AI may prepare a faithful
-- translation ONLY from already-verified facts; translation never establishes factual truth;
-- machine translation is NEVER auto-applied or auto-published; every translated field requires
-- individual human acceptance through the existing resource_change_proposals/Cambios workflow.
--
-- HARD LOCK: presence of *_es content does NOT mean Spanish is approved for public trust. Public
-- trusted Spanish is gated by spanish_status IN ('official_spanish','verified_translation') only.
-- Public rendering behavior itself is deferred to Gate ES-8 — this migration adds the column only.

-- ---------------------------------------------------------------------------
-- Gate ES-1A — minimal 2-column provenance model on community_resources.
-- No reviewer/date/source-url columns here by design: that detail lives in verification_events
-- (append-only, already built), read on the resource detail page, not duplicated as columns.
-- ---------------------------------------------------------------------------

alter table public.community_resources
  add column if not exists spanish_status text not null default 'not_available'
    check (spanish_status in (
      'official_spanish', 'official_english_only', 'verified_translation',
      'needs_translation_review', 'not_available'
    ));

alter table public.community_resources
  add column if not exists spanish_source_type text
    check (spanish_source_type in (
      'official_spanish_source', 'official_bilingual_source',
      'ai_translation_reviewed', 'staff_written', 'none'
    ));

comment on column public.community_resources.spanish_status is
  'Recursos Spanish Bridge — public-trust gate for Spanish presentation. Only official_spanish and verified_translation are eligible for trusted public Spanish rendering (Gate ES-8). Presence of *_es text alone never implies approval.';

comment on column public.community_resources.spanish_source_type is
  'Recursos Spanish Bridge — how the current *_es content came to exist. Reviewer/date/evidence provenance detail lives in verification_events, not here, by design.';

-- ---------------------------------------------------------------------------
-- Gate ES-1B — widen resource_change_proposals.proposal_source to add 'translation'.
-- Additive only: every existing value (pdf_reextraction, url_recheck, partner_request, manual)
-- is preserved unchanged. No existing row is rewritten by this migration. No status touched.
-- ---------------------------------------------------------------------------

alter table public.resource_change_proposals
  drop constraint if exists resource_change_proposals_proposal_source_check;

alter table public.resource_change_proposals
  add constraint resource_change_proposals_proposal_source_check
  check (proposal_source in ('pdf_reextraction', 'url_recheck', 'partner_request', 'manual', 'translation'));
