-- Package 4A: allow the Ofertas Gemini runtime provider without changing table shape.
-- Keeps existing provider values and default; no RLS, index, FK, or data changes.

begin;

alter table public.oferta_local_scan_jobs
  drop constraint oferta_local_scan_jobs_provider_check;

alter table public.oferta_local_scan_jobs
  add constraint oferta_local_scan_jobs_provider_check
  check (provider in (
    'google_document_ai',
    'leonix_manual',
    'future_provider',
    'gemini_multimodal'
  ));

commit;
