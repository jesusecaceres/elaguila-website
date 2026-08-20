# Recursos Certification Import Package — Compact Transport (Build 03C-COMPACT)

Same 65 `READY_FOR_COACH_INSERT` records, same idempotency rule, same database result as
[`../certification-import/`](../certification-import/). This package exists only because
the original 03C batch files repeated a ~100-line INSERT/UPDATE statement once per
candidate, making the largest files too big for Coach's GitHub → connected Supabase
transport layer to retrieve reliably. This is a **transport-format change, not an import
redesign**: same source data, same resolution order, same end state.

## What changed vs. the original package

Each batch is now **one generic, set-based SQL statement** per table, driven by a compact
JSON array embedded via `jsonb_to_recordset(...)`, instead of one full statement repeated
per record:

```sql
WITH payload AS (
  SELECT * FROM jsonb_to_recordset($JSON$[ ...10 compact records... ]$JSON$::jsonb)
  AS x("candidateId" text, "canonicalSlug" text, ...)
),
resolved AS ( ... ),        -- same 4-step id resolution as before, now per-row
resource_upsert AS ( ... INSERT ... SELECT ... FROM resolved ON CONFLICT (id) DO UPDATE ... ),
INSERT INTO community_resource_candidate_reviews ... FROM resolved JOIN resource_upsert ...
```

Nothing about *what* gets written changed — every column value each batch writes was
cross-checked against the original 03C package's generated SQL for all 65 records during
generation (see the generator's `crossCheckAgainst03C()` step) before any file was written.

## Files

| File | Purpose |
|---|---|
| `00-preflight.sql` | Read-only. Same checks as the original package's preflight, consolidated onto fewer repeated candidate-id lists. |
| `01-ready-01-10.sql` … `06-ready-51-60.sql` | Six batches of 10 records each (records 1–60 of 65, sorted `verificationPriority` asc then `candidateId` asc — identical ordering to the original package). |
| `07-ready-61-65.sql` | Final batch of 5 records (61–65 of 65). |
| `99-postflight.sql` | Read-only. Identical truth contract to the original package's postflight. |

## Batch sizes (bytes)

| File | Bytes | KB |
|---|---:|---:|
| `01-ready-01-10.sql` | 24,945 | 24.4 |
| `02-ready-11-20.sql` | 22,513 | 22.0 |
| `03-ready-21-30.sql` | 22,284 | 21.8 |
| `04-ready-31-40.sql` | 21,231 | 20.7 |
| `05-ready-41-50.sql` | 20,517 | 20.0 |
| `06-ready-51-60.sql` | 19,672 | 19.2 |
| `07-ready-61-65.sql` | 14,071 | 13.7 |

All seven numbered batches are under the 35 KB target (largest is 24.4 KB) and well under
the 60 KB hard gate. For comparison, the original package's largest batch file was ~69 KB.

## Idempotency (unchanged resolution order)

For each record, the target `community_resources` row resolves in this order, evaluated
per-row inside the `resolved` CTE:

1. `community_resource_candidate_reviews.promoted_resource_id` for the candidate, if
   already set.
2. An existing `community_resources` row at the canonical (corrected) slug.
3. An existing `community_resources` row at the legacy/pre-correction slug — covers rows
   promoted under the candidate's original `organization_name` (e.g. the earlier pilot
   data load's "Next Door Solutions" vs. the corrected "Next Door Solutions to Domestic
   Violence"). 16 of the 65 records carry a non-null `legacySlug` in their payload for
   exactly this reason.
4. Otherwise, `gen_random_uuid()` — a genuinely new resource.

`INSERT ... ON CONFLICT (id) DO UPDATE` targets that resolved id directly, and the `slug`
column is never included in the `DO UPDATE SET` list, so an already-published resource
URL is never invalidated. Reviews upsert `ON CONFLICT (candidate_id)`. A second execution
of any batch — or all of them — still results in exactly 65 canonical resources and 65
promoted review links, never 130.

## Payload fields

Each compact record in the embedded JSON carries exactly the fields the generic importer
needs — no per-record SQL text, no repeated column lists:

`candidateId`, `verificationPriority`, `canonicalSlug`, `legacySlug`, `organizationName`,
`programName`, `organizationType`, `shortDescriptionEn`, `primaryCategory`,
`urgencyLevel`, `audienceTags`, `languages`, `costModel`, `eligibilityEn`, `serviceArea`,
`phone`, `crisisPhone`, `sms`, `whatsapp`, `email`, `websiteUrl`, `applicationUrl`,
`addressLine1`, `addressLine2`, `addressCity`, `addressState`, `addressZip`,
`addressWithheldForSafety`, `hoursNoteEn`, `is24Hours`, `officialSourceUrl`,
`currentSourceUrl`, `currentSourceType`, `organizationConfirmedActive`,
`fieldsConfirmed`, `discrepanciesFromPdf`, `addressHandling`, `verificationNotes`.

`currentSourceUrl` and `organizationConfirmedActive` are additions beyond the minimum
field list, required so the review row's `current_source_url` and
`organization_confirmed_active` columns get the actual researched values rather than a
value borrowed from a different field. `audienceTags` is included even though it's empty
for 61 of 65 records, because it is genuinely non-empty for 4 (`bill-wilson-center-the-hub`,
`court-appointed-special-advocates-casa-of-silicon-valley`, `novaworks`, `youth-space`) —
hardcoding it to `'[]'::jsonb` in the generic template, as was done for the columns that
*are* empty for all 65 records (`secondary_categories`, `service_tags`, `weekly_hours`,
`age_min`, `age_max`, `maps_search_href`), would have silently dropped real data for
those four.

Fields never invented for any record: `whatsapp` and `email` fall back to the
pre-existing (unverified, Build 03A) candidate baseline when research never touched them,
exactly as `candidateToResourceDraft()` does — same semantics as the original package,
just carried in the payload instead of a per-record SQL literal.

## Critical safety corrections (preserved, verified by the compact static verifier)

- **Next Door Solutions** → `https://www.nextdoorsolutions.org/`.
- **Crisis Text Line** → `HOME` (or `HOLA`) to `741741`; the deprecated `BAY` keyword is
  never written.
- **211** → no unsupported legacy `800-436-9997` number anywhere in the payload.
- **AACI Asian Women's Home** → `addressHandling = "withheld_for_safety"`; only the safe
  public corporate-office address is in the payload, never the confidential shelter
  location.
- **AACSA** → corrected to African American Community Service Agency (the PDF had the
  wrong ethnicity in the name).
- **School Health Clinics of Santa Clara County** → independent of Goodwill of Silicon
  Valley (a mapping error in the original 2023 PDF extraction).
- **Child Advocates of Silicon Valley** → CASA of Silicon Valley's current parent-org
  identity.
- All researched phone changes, address relocations, domain replacements, and
  hours/24-7 truth are carried in the payload exactly as researched — nothing reverted
  to the 2023 PDF.

## How to run

Identical procedure to the original package: run `00-preflight.sql`, then
`01-ready-01-10.sql` through `07-ready-61-65.sql` in order, then `99-postflight.sql` and
confirm every row reads `actual = expected`.

## Verifying this package without touching Supabase

`node scripts/recursos/verify-recursos-certification-import-compact.mjs` statically
proves the package is well-formed (batch sizes, byte-size gate, exactly-once candidate
coverage, no NEEDS_REVIEW/DROPPED candidates, no destructive SQL, transaction wrapping,
critical correction strings present, canonical READY manifest untouched) without ever
connecting to a database.
