# Recursos Certification Import Package (Build 03C)

Idempotent SQL for promoting the 65 `READY_FOR_COACH_INSERT` records in
[`../scc-community-resource-guide-2023-ready-for-import.json`](../scc-community-resource-guide-2023-ready-for-import.json)
into the connected Supabase **Certification** project (`mvasgrdzmupsnuicwyjl`).

This package is generated, static SQL. Claude never connected to Supabase to produce it —
Coach reviews and executes these files directly (e.g. via the Supabase SQL editor).

## What this does

For each of the 65 READY candidates:

1. Upserts a `public.community_resources` row using **current researched facts**
   (`suggestedResourceCorrections` + `currentFacts` + `currentSourceUrl`), never the raw
   2023 PDF candidate data, with `active = true`, `verification_status = 'verified'`,
   `last_verified_at = now()`, `next_verification_at = now() + 90 days`.
2. Upserts a `public.community_resource_candidate_reviews` row recording the research
   evidence, linked to the resource via `promoted_resource_id`, with
   `disposition = 'promoted'`.

## Files

| File | Purpose |
|---|---|
| `00-preflight.sql` | Read-only. Run first. Reports current Certification state — table existence, row counts, existing links for these 65 candidates, duplicate slugs/candidate_ids, unsafe `active`+`needs_review` rows, the stale legacy 211 number, Next Door's domain, current verified/fresh count. |
| `01-ready-01-10.sql` … `06-ready-51-60.sql` | Six batches of 10 records each (records 1–60 of 65, sorted `verificationPriority` asc then `candidateId` asc). |
| `07-ready-61-65.sql` | Final batch of 5 records (61–65 of 65). |
| `99-postflight.sql` | Read-only. Run last. One combined result set proving every required post-condition (see below). |

Each batch file is a single `BEGIN; … COMMIT;` transaction. Run them in order; each is
independently idempotent, so re-running any batch (or all of them) is always safe.

## Idempotency

**Reviews** are upserted `ON CONFLICT (candidate_id)` — `candidate_id` is the natural key.

**Resources** are resolved before insert/update, in this priority order:

1. `community_resource_candidate_reviews.promoted_resource_id` for this `candidate_id`,
   if already set (covers a row promoted by an earlier run of this same package, or by
   the admin UI's own `promoteCandidateAction`).
2. An existing `community_resources` row matching the **canonical (corrected)** slug
   derived from the researched `organizationName`.
3. An existing `community_resources` row matching the **legacy slug** derived from the
   *candidate's original, pre-correction* `organizationName` — this matters because the
   Certification project already contains rows from the earlier pilot data load, and
   several of those rows were created under the 2023 PDF's original (sometimes wrong or
   outdated) organization name before this build's research corrected it. Notable
   examples: `next-door-solutions` (pilot used "Next Door Solutions", corrected to "Next
   Door Solutions to Domestic Violence"), `asian-american-community-service-agency`
   (corrected to the African American Community Service Agency — the PDF had the wrong
   ethnicity in the name), `goodwill-of-silicon-valley-school-health-clinics-wellness-center`
   (corrected to the independent "School Health Clinics of Santa Clara County" — it was
   never part of Goodwill). 16 of the 65 records have a legacy slug that differs from the
   corrected one; all 16 carry this fallback in their SQL.
4. Otherwise, a freshly generated id (first-time insert).

The resolved `slug` column is **never overwritten** on conflict, so an already-published
resource URL is never invalidated — only its content fields are updated to the current
researched truth. A second execution of any batch leaves row counts unchanged: 65
canonical resources, 65 promoted review links — never 130.

No `DELETE`, `TRUNCATE`, `DROP`, or `ALTER` appears anywhere in this package.

## Critical corrections carried into every batch

These come directly from this session's research (see `verificationNotes` /
`discrepanciesFromPdf` on each record) and are asserted by `99-postflight.sql`:

- **Next Door Solutions** → `https://www.nextdoorsolutions.org/` (the PDF's old
  `nextdoor.org` belongs to the unrelated "Nextdoor" neighborhood app).
- **Crisis Text Line** → SMS instruction is `HOME` (or `HOLA` for Spanish) to `741741`;
  the PDF's regional keyword `BAY` is deprecated and is never written to the DB.
- **AACSA identity correction** — the PDF's "Asian American Community Service Agency" is
  actually the **African American** Community Service Agency.
- **School Health Clinics of Santa Clara County** is an independent nonprofit, not part
  of Goodwill of Silicon Valley (a mapping error in the original 2023 PDF extraction).
- **Child Advocates of Silicon Valley** — CASA of Silicon Valley's parent org renamed;
  the old `bemyadvocate.org` domain now redirects to an unrelated third-party site.
- All researched relocations, phone changes, and website migrations found during
  research are written as the current value — the pre-2023-PDF value is never restored.
- The one candidate with `addressHandling = "withheld_for_safety"`
  (`asian-americans-for-community-involvement-aaci-aaci-asian-women-s-home`) uses only
  the safe public corporate-office address already present in
  `suggestedResourceCorrections.address` — never the confidential shelter location from
  the candidate JSON. `address_withheld_for_safety` is set `true` only when a candidate
  is marked `withheld_for_safety` **and** no safe public address was found at all.
- No record contains the stale, unsupported `800-436-9997` legacy 211 number.
- No `is24Hours = true` claim without explicit 24/7 evidence in the researched notes.

## Fields never invented

Per the source research doctrine, nothing is invented for fields the manifest doesn't
support. `whatsapp`, `email`, `maps_search_href`, `age_min`/`age_max`,
`secondary_categories`, `audience_tags`, `service_tags`, and `weekly_hours` fall back to
the pre-existing (unverified, Build 03A) candidate baseline exactly as
`candidateToResourceDraft()` does — the same semantics this package reuses — and stay
`null`/`[]` when the baseline has nothing either. `languages`, `eligibility_en`,
`cost_model`, and `service_area` prefer the **current researched** value when present,
falling back to the same candidate baseline otherwise.

## How to run

1. Run `00-preflight.sql` in the Supabase SQL editor. Review the output — it's all
   read-only and safe to run at any time, including before the very first import.
2. Run `01-ready-01-10.sql` through `07-ready-61-65.sql`, in order.
3. Run `99-postflight.sql`. Every row in its result set should read `actual = expected`.
   If any row doesn't match, do not treat the import as complete — investigate before
   relying on the data publicly.

## Verifying this package without touching Supabase

`node scripts/recursos/verify-recursos-certification-import.mjs` statically proves the
package is well-formed (batch sizes, exactly-once candidate coverage, no NEEDS_REVIEW/
DROPPED candidates included, no destructive SQL, transaction wrapping, critical
correction strings present, candidate JSON untouched) without ever connecting to a
database.
