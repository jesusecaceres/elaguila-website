# Recursos — 19-resource canonical gap batch (2026-08-25)

Idempotent SQL to insert the 19 PM-approved gap resources (canonical-gap triage session,
2026-08-25) into **production** (`xuieateniufcrsfdomwl`). Generated from
[`../../../../scripts/recursos/seed-verified-resources.ts`](../../../../scripts/recursos/seed-verified-resources.ts)
— the same 19 records, same field values, no changes.

**Claude did not connect to production Supabase to write these rows.** Per this repo's own
established doctrine for Recursos promotion (see `../certification-import/README.md`: *"Claude
never connected to Supabase to produce it — Coach reviews and executes these files directly"*),
this package is generated SQL only. You review and run it yourself, e.g. via the Supabase SQL
editor for the production project.

## Why this package exists

The originally-requested path — a temporary local Next.js route calling
`dbCreateCommunityResource()` directly — was tried first and technically worked, but an
unrelated pre-existing issue in this repo (`.env.development.local` overrides
`NEXT_PUBLIC_SUPABASE_URL` to point `next dev` at the **Leonix Certification** project,
`mvasgrdzmupsnuicwyjl`, not production — apparently by design, per the comment above that var:
*"Never affects `next build`/`next start` (production mode)"*) meant all 19 rows landed in
Certification instead of production. Those 19 Certification rows were left in place (see chat
transcript, 2026-08-25) rather than deleted, since Certification is the real pre-production
staging project for Recursos and having them there is consistent with how the original 65 were
staged before promotion.

This package is the corrected path: reviewed SQL, run by a human, straight to production —
matching doctrine instead of working around it.

## What this does

Inserts exactly 19 new `public.community_resources` rows, each:
- `verification_status = 'needs_review'` (NOT `'verified'` — no human field-verification has
  happened yet; per `communityResourcesPublicQueries.ts`, `needs_review` rows are excluded from
  every public query regardless of `active`, so these stay non-public until a human promotes
  them).
- `spanish_status` left untouched (defaults to `'not_available'` — no Spanish text is written;
  `short_description_es` is `''` for all 19, per the no-fabricated-Spanish-translation rule).
- `last_verified_at = NULL` — never set to `now()` here; only a human confirming the data should
  set that.
- `created_by = 'ai-triage-2026-08-25'` / `updated_by` the same, so these rows are easy to find
  and distinguish from the certification-import batch or any admin-UI-created row.
- `print_eligible = false`, `featured = false`, `partner_status = 'none'` — no print/editorial
  decision is made by this package.

No `DELETE`, `TRUNCATE`, `DROP`, or `ALTER` anywhere. `ON CONFLICT (slug) DO NOTHING` — if a row
with that slug already exists (e.g. this package is run twice, or a human already created one via
the admin UI), it is left completely untouched, never overwritten. Re-running this package is
always safe.

## High-risk resources in this batch

`988-suicide-crisis-lifeline`, `scc-rapid-response-network`, and
`adult-protective-services-scc` were each independently cross-source-verified this session (see
`internal_notes` on each row, and the chat transcript). They still require Leonix's own human
field-verification before `verification_status` is promoted to `'verified'` — this package does
not do that promotion.

## Files

| File | Purpose |
|---|---|
| `00-preflight.sql` | Read-only. Run first. Confirms current production count (expect 65), confirms none of the 19 target slugs/organization names already exist, confirms no accidental `active=true AND verification_status='needs_review'` rows exist yet from elsewhere. |
| `01-insert-19-approved-resources.sql` | Single transaction, 19 idempotent inserts. |
| `99-postflight.sql` | Read-only. Run last. Confirms all 19 now exist, all `needs_review`/`not_available`, total count = 84, and that the public-query gate (`active=true AND verification_status='verified'`) still excludes all 19. |

## How to run

1. Run `00-preflight.sql`. Confirm `current_resource_count = 65` and both existence checks
   return 0 rows.
2. Run `01-insert-19-approved-resources.sql`.
3. Run `99-postflight.sql`. Confirm `total_count = 84`, `new_batch_count = 19`,
   `wrong_status_count = 0`, `publicly_visible_count = 0`.
4. When you're ready to human-verify any of these, promote them the normal way (admin UI or the
   existing `dbSetCommunityResourceVerificationStatus()` path) — not by editing this package.
