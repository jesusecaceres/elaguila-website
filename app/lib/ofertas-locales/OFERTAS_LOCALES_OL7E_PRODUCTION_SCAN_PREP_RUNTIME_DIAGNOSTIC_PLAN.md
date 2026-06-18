# Gate OL-7E — Ofertas Locales — Production Scan-Prep Runtime Diagnostic + Final Schema Fix

## 1. Exact source of 503

`POST /api/ofertas-locales/scan-prep` returned **503** when:

1. `isSupabaseAdminConfigured()` was false (missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`), **or**
2. `probeOfertasLocalesAiTables()` reported failure and `schemaProbeFailureResponse()` classified it as `schema_not_applied`, **or**
3. Insert/update/select failed and `isSupabaseSchemaCacheMissingTableError()` **incorrectly** matched column errors (e.g. `column "submitted_at" does not exist`) as missing-table errors.

Production tables existed; the dominant bug was **(3)** — broad `"does not exist"` matching turned insert/select column failures into the OL-7B migration blocker.

## 2. Exact source of migration message

`ofertasLocalesAiSchemaMissingDetail()` in `ofertasLocalesSupabaseSchema.ts` builds:

> Database table public.{table} is missing in production. Apply Supabase migration 20260616130000_ofertas_locales_ai_production_bootstrap.sql …

Returned via `schemaProbeFailureResponse()` as `error: "schema_not_applied"` when `isSupabaseSchemaCacheMissingTableError()` was true.

**Pre-OL-7E weakness:** `isSupabaseSchemaCacheMissingTableError()` returned true for any message containing `"does not exist"`, including PostgreSQL `42703` column errors after a successful table probe.

## 3. Schema check weakness

- Scan-prep previously probed only `ofertas_locales` (or failed on `.select("id, status, submitted_at")` when `submitted_at` was absent).
- Error classifier conflated column mismatch with missing migration.
- No runtime visibility into which Supabase project ref Vercel used.

## 4. Environment / project-ref diagnostic strategy

- **Admin endpoint:** `GET /api/ofertas-locales/ai-runtime-diagnostics` (protected by `requireAdminCookie`).
- Returns: `supabaseHost`, `supabaseProjectRef` (parsed from `NEXT_PUBLIC_SUPABASE_URL`), env presence booleans, per-table probe results with sanitized codes/messages.
- **Scan-prep failures** include `supabaseProjectRef` on write failures and schema probe failures.
- Production QA expects ref **`xuieateniufcrsfdomwl`**.

## 5. Scan-prep insert/update risk

| Risk | Mitigation (OL-7E) |
|------|---------------------|
| `submitted_at` in `.select()` | `OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS = "id, status, created_at, updated_at, published_at"` |
| Mapper sends unknown columns | `ofertasLocalesProductionRowAdapter.ts` filters to `OFERTAS_LOCALES_KNOWN_DB_COLUMNS`; overflow → `draft_snapshot` |
| `service_zip_codes` vs `service_zips` | Canonical zip in `zip_code`; service zips in `draft_snapshot.serviceZipCodes` if column absent |
| Status constraint | Insert uses `pending_review` from publish mapper (unchanged) |

## 6. Safe fix

1. Tighten `isSupabaseSchemaCacheMissingTableError()` — exclude column errors (`42703`, `"column … does not exist"`).
2. `probeOfertasLocalesAiTables()` — probe all 3 tables before migration blocker.
3. `schemaProbeFailureResponse()` — migration blocker only when probe proves missing table/relation; otherwise `schema_probe_failed` with exact table + message.
4. `ofertasLocalesProductionRowAdapter.ts` — align insert/update payload and safe return columns.
5. `scan-prep/route.ts` — `scan_prep_insert_failed` / `scan_prep_update_failed` for post-probe write errors.
6. `ai-runtime-diagnostics/route.ts` — admin-only read-only probes.
7. Client: clear errors on retry; show "Preparando escaneo…" during scan-prep.

## 7. QA checklist

- [ ] Deploy OL-7E code to production (no migration required if production columns match plan).
- [ ] `GET /api/ofertas-locales/ai-runtime-diagnostics` with admin cookie → `supabaseProjectRef === xuieateniufcrsfdomwl`.
- [ ] All 3 table probes `ok: true`.
- [ ] `/publicar/ofertas-locales` Step 5 → Escanear con AI → no stale migration message.
- [ ] scan-prep returns `{ ok: true, id }` or precise `scan_prep_insert_failed` / `scan_prep_update_failed` / `schema_probe_failed`.
- [ ] Real scan proceeds with `storagePath`; Document AI or honest config blocker only.

## STOP conditions (none for code-only fix)

If diagnostic shows wrong project ref or missing service role key → fix Vercel env, redeploy. No code change can fix wrong Supabase project pointer.
