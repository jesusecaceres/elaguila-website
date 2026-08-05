// Package C Build 1 — M4 companion: deterministic duplicate-entitlement remediation report.
//
// The M4 migration (listing_package_entitlements live-uniqueness index) FAILS LOUDLY and
// non-destructively if duplicate ACTIVE/SCHEDULED rows exist for the same
// (listing_source, listing_id, package_key). This script produces the deterministic report:
// for each duplicate group, the WINNER by the exact runtime precedence pickPreferredAddonEntitlement
// already applies (later ends_at → later starts_at → greater id) and the losers whose
// owner-approved remediation is demotion to status 'expired' with a metadata supersession
// trail ({superseded_by, previous_status}). NOTHING here writes — reporting only; the owner
// or an admin applies the demotion explicitly after review.
//
// Run from repo root with service-role env configured:
//   node scripts/package-c/report-duplicate-entitlements.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase admin env not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Reporting requires read access.");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("listing_package_entitlements")
  .select("id, listing_source, listing_id, package_key, status, starts_at, ends_at")
  .in("status", ["active", "scheduled"])
  .not("listing_id", "is", null)
  .not("package_key", "is", null);

if (error) {
  console.error("Read failed:", error.message);
  process.exit(2);
}

const groups = new Map();
for (const row of data ?? []) {
  const groupKey = `${row.listing_source}|${row.listing_id}|${row.package_key}`;
  if (!groups.has(groupKey)) groups.set(groupKey, []);
  groups.get(groupKey).push(row);
}

const duplicates = [...groups.entries()].filter(([, rows]) => rows.length > 1);
if (duplicates.length === 0) {
  console.log("No duplicate live entitlements. The M4 unique index can be applied safely.");
  process.exit(0);
}

// Deterministic winner precedence: later ends_at → later starts_at → greater id
// (mirrors pickPreferredAddonEntitlement's runtime tie-break exactly).
const ts = (v) => (v ? Date.parse(v) || 0 : 0);
console.log(`DUPLICATE LIVE ENTITLEMENTS: ${duplicates.length} group(s). NOTHING was modified.`);
for (const [groupKey, rows] of duplicates) {
  const sorted = [...rows].sort(
    (a, b) => ts(b.ends_at) - ts(a.ends_at) || ts(b.starts_at) - ts(a.starts_at) || String(b.id).localeCompare(String(a.id)),
  );
  const [winner, ...losers] = sorted;
  console.log(`\nGROUP ${groupKey}`);
  console.log(`  KEEP   ${winner.id} (status=${winner.status} ends_at=${winner.ends_at})`);
  for (const loser of losers) {
    console.log(`  DEMOTE ${loser.id} -> status 'expired' + metadata {superseded_by: "${winner.id}", previous_status: "${loser.status}", dedup: "package-c-m4"}`);
  }
}
console.log("\nOwner/admin remediation: apply the DEMOTE updates above explicitly (rows preserved, never deleted), then re-run the M4 migration.");
process.exit(1);
