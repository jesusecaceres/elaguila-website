# Program 4 — Field Discovery & AI Research Engine: SQL Handoff

**Status:** Ready for manual review and application. Do NOT auto-apply, commit, push, or deploy.

## Migration Files (apply in order)

### 1. Gate 4A — Canvassing Foundation

**File:** `supabase/migrations/20260810120000_field_discovery_canvassing_foundation.sql`

**Creates:**
- `public.business_consent_records` — append-only consent history (photo_capture, file_upload, source_research, ai_research, followup_contact)
- `public.business_source_links` — website/social/directory links with source_type, status, collection_method
- `public.business_source_files` — file metadata (bytes in Vercel Blob under `field-discovery/<businessId>/...`)
- `public.create_staff_canvassed_business(text, text, text, uuid)` — SECURITY DEFINER RPC, service_role only, creates bare businesses row (never membership/auth.users)
- Feature flag: `field_discovery_canvassing` (disabled by default)

**Security posture:**
- RLS enabled on all 3 tables, zero policies (deny-all for anon/authenticated)
- REVOKE ALL from PUBLIC, anon, authenticated, service_role → narrow GRANT SELECT/INSERT/UPDATE/DELETE to service_role only
- Actor attribution CHECK constraints on every table
- Same-business consent enforcement: `UNIQUE(id, business_id)` on `business_consent_records` + composite FKs `(consent_record_id, business_id) → business_consent_records(id, business_id)` with `ON DELETE RESTRICT` on both `business_source_links` and `business_source_files` — structurally prevents cross-business consent references
- RPC EXECUTE granted to service_role only (never authenticated)
- Single transaction (BEGIN/COMMIT), additive only, no DROP/TRUNCATE/DELETE

### 2. Gate 4C — AI Research Engine Foundation

**File:** `supabase/migrations/20260810130000_business_ai_research_engine_foundation.sql`

**Creates:**
- `public.business_ai_research_runs` — bounded AI research invocation with provider_key, model_key, input_hash, status lifecycle, cost_metadata
- `public.business_ai_briefing_drafts` — structured briefing output (strengths, opportunities, contradictions, unknowns, limitations) with review_status lifecycle and atomic review attribution
- Feature flag: `field_discovery_ai_research` (disabled by default)

**Security posture:**
- RLS enabled on both tables, zero policies
- Same REVOKE/GRANT pattern as Gate 4A
- Actor attribution CHECK on research runs
- Atomic review attribution CHECK on briefing drafts (all-or-nothing)
- Draft status CHECK: `draft` status forbids any review attribution columns
- Unique partial index: one non-superseded draft per research run
- Single transaction, additive only

## Application Instructions

1. Review both SQL files in order
2. Apply via `supabase db push` or `psql` against your local/dev database
3. Run verification scripts:
   - `npm run verify:field-discovery-canvassing`
   - `npm run verify:business-ai-research-engine`
4. Enable feature flags only when ready for pilot:
   ```sql
   UPDATE public.business_identity_flags SET enabled = true WHERE flag_key = 'field_discovery_canvassing';
   UPDATE public.business_identity_flags SET enabled = true WHERE flag_key = 'field_discovery_ai_research';
   ```

## Environment Variables Required

- `GEMINI_API_KEY` — Google Generative AI API key (Gemini provider only)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token (file uploads)

## What Was NOT Done (by design)

- No SQL applied to any database
- No git commits, pushes, PRs, or merges
- No Production access
- No Program 5–7 work
- No Google/social API integrations (manual-only for V1)
- No direct AI writes to `business_facts` (draft-only, promotion via Living Book functions)
