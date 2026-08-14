/**
 * Gate I.5.4C — read-only Empleos lane-metadata audit. Service role, SELECT only, no writes.
 * Reports counts only (plus listing IDs where useful for a future backfill/owner decision) —
 * never applicant/employer PII (names, emails, phones are never read or printed).
 *
 * Env loading matches `scripts/empleos-supabase-read-smoke.mts` (proven safe pattern in repo).
 *
 * Run: npx tsx scripts/empleos-lane-metadata-audit.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v !== "") process.env[k] = v;
    }
  }
}

type Row = {
  id: string;
  lane: string | null;
  lifecycle_status: string;
  listing_snapshot: { jobRecord?: { publicationLane?: string; feriaDateLine?: string; feriaVenue?: string; scheduleLabel?: string }; envelope?: { lane?: string } } | null;
};

async function main() {
  loadEnvFiles();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    console.error("BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data, error } = await sb
    .from("empleos_public_listings")
    .select("id,lane,lifecycle_status,listing_snapshot")
    .eq("lifecycle_status", "published");

  if (error) {
    console.error("BLOCKED_BY_EXTERNAL_SERVICE", error.message);
    process.exit(3);
  }

  const rows = (data ?? []) as Row[];
  const total = rows.length;

  let withJobRecordLane = 0;
  let withoutJobRecordLane = 0;
  let envelopeLaneNoJobRecordLane = 0;
  let quickFromRowLane = 0;
  let premiumFromRowLane = 0;
  let feriaFromRowLane = 0;
  let ambiguous = 0;
  let rowLaneInvalidOrMissing = 0;
  const ambiguousIds: string[] = [];
  const rowLaneMismatchIds: string[] = [];

  for (const r of rows) {
    const jr = r.listing_snapshot?.jobRecord;
    const jobLane = jr?.publicationLane?.trim() || "";
    const envLane = r.listing_snapshot?.envelope?.lane?.trim() || "";
    const rowLane = (r.lane ?? "").trim();

    if (jobLane) withJobRecordLane++;
    else withoutJobRecordLane++;

    if (!jobLane && envLane) envelopeLaneNoJobRecordLane++;

    if (!jobLane) {
      if (rowLane === "quick") quickFromRowLane++;
      else if (rowLane === "premium") premiumFromRowLane++;
      else if (rowLane === "feria") feriaFromRowLane++;
      else {
        ambiguous++;
        ambiguousIds.push(r.id);
      }
    }

    if (jobLane && rowLane && jobLane !== rowLane) {
      rowLaneMismatchIds.push(r.id);
    }
    if (!rowLane || !["quick", "premium", "feria"].includes(rowLane)) {
      rowLaneInvalidOrMissing++;
    }
  }

  console.log("EMPLEOS_LANE_AUDIT");
  console.log(`total_published_rows=${total}`);
  console.log(`rows_with_jobRecord_publicationLane=${withJobRecordLane}`);
  console.log(`rows_without_jobRecord_publicationLane=${withoutJobRecordLane}`);
  console.log(`rows_envelopeLane_present_jobRecordLane_absent=${envelopeLaneNoJobRecordLane}`);
  console.log(`rows_identifiable_quick_via_row_lane_column=${quickFromRowLane}`);
  console.log(`rows_identifiable_premium_via_row_lane_column=${premiumFromRowLane}`);
  console.log(`rows_identifiable_feria_via_row_lane_column=${feriaFromRowLane}`);
  console.log(`rows_genuinely_ambiguous_no_lane_anywhere=${ambiguous}`);
  console.log(`rows_where_row_lane_column_itself_invalid_or_missing=${rowLaneInvalidOrMissing}`);
  console.log(`rows_where_jobRecordLane_and_rowLane_conflict=${rowLaneMismatchIds.length}`);
  if (ambiguousIds.length) console.log(`ambiguous_listing_ids=${JSON.stringify(ambiguousIds)}`);
  if (rowLaneMismatchIds.length) console.log(`conflicting_listing_ids=${JSON.stringify(rowLaneMismatchIds)}`);
}

main().catch((e) => {
  console.error("BLOCKED_BY_RUNTIME", String((e as Error)?.message ?? e));
  process.exit(3);
});
