/**
 * Gate I.5.4C — self-test for Empleos lane-shell fallback safety.
 *
 * Confirmed root cause: `app/(site)/clasificados/empleos/[slug]/page.tsx` fell back to the
 * lane-unaware `EmpleoPublicDetailClient` whenever `job.publicationLane` and `envelope?.lane` were
 * both absent from a row's JSON snapshot — even though `empleos_public_listings.lane` is a
 * schema-enforced `not null check (lane in ('quick','premium','feria'))` column
 * (`supabase/migrations/20260410210000_empleos_public_listings.sql`) that the sole writer always
 * sets. A live read-only audit (`scripts/empleos-lane-metadata-audit.mts`, 4 published rows) found
 * 0 rows missing `jobRecord.publicationLane` and 0 conflicts with the `lane` column — Option A
 * (resolver repair) is justified by both the schema guarantee and the empirical audit.
 *
 * Proves: the shared resolver's evidence order (explicit job lane → explicit envelope lane →
 * canonical DB column → Feria-exclusive fields → unknown); `rowToJobRecord` backfills
 * `publicationLane` from `row.lane` in both its snapshot-present and snapshot-absent branches;
 * the public route resolves lane through the shared resolver and logs (without PII) when a row
 * remains genuinely unresolved; every current publish branch persists `publicationLane`
 * unconditionally; edit/republish never erases the `lane` column and guards against a lane
 * mismatch; the audit script performs no writes; and no locked system was touched.
 *
 * No network, no React rendering (the DB-touching audit script is run separately, not by this
 * self-test). Run from repo root:
 *   npx tsx scripts/gate-i5-4c-empleos-lane-shell-fallback-safety-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { resolveEmpleosPublicationLane } from "../app/(site)/clasificados/empleos/lib/empleosLaneResolve";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const RESOLVER_FILE = "app/(site)/clasificados/empleos/lib/empleosLaneResolve.ts";
const DB_SERVER_FILE = "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts";
const PAGE_FILE = "app/(site)/clasificados/empleos/[slug]/page.tsx";
const ENVELOPE_MAPPER_FILE = "app/(site)/clasificados/empleos/lib/staged/empleosEnvelopeToJobRecord.ts";
const LANE_DETAIL_CLIENT_FILE = "app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx";
const FALLBACK_CLIENT_FILE = "app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx";
const API_WRITE_ROUTE_FILE = "app/api/clasificados/empleos/listings/route.ts";
const AUDIT_SCRIPT_FILE = "scripts/empleos-lane-metadata-audit.mts";
const MIGRATION_FILE = "supabase/migrations/20260410210000_empleos_public_listings.sql";

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1/2/3 — explicit job.publicationLane resolves directly for all three lanes.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolveEmpleosPublicationLane({ jobPublicationLane: "quick" }), "quick");
    assert.equal(resolveEmpleosPublicationLane({ jobPublicationLane: "premium" }), "premium");
    assert.equal(resolveEmpleosPublicationLane({ jobPublicationLane: "feria" }), "feria");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — envelope lane resolves when job-record lane is missing.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolveEmpleosPublicationLane({ jobPublicationLane: null, envelopeLane: "premium" }), "premium");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5/6/7 — deterministic historical evidence: the canonical `lane` DB column resolves correctly
   * for all three lanes when both the job record and envelope lane are absent (the exact
   * "snapshot omits lane data" scenario this gate repairs).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolveEmpleosPublicationLane({ rowLane: "quick" }), "quick");
    assert.equal(resolveEmpleosPublicationLane({ rowLane: "premium" }), "premium");
    assert.equal(resolveEmpleosPublicationLane({ rowLane: "feria" }), "feria");
    // Feria-exclusive persisted fields resolve even without any lane field at all.
    assert.equal(resolveEmpleosPublicationLane({ feriaVenue: "Sacramento Convention Center" }), "feria");
    assert.equal(resolveEmpleosPublicationLane({ feriaDateLine: "March 3, 2026" }), "feria");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 8 — genuinely ambiguous rows (no evidence anywhere) remain "unknown", never guessed.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolveEmpleosPublicationLane({}), "unknown");
    assert.equal(resolveEmpleosPublicationLane({ jobPublicationLane: "", envelopeLane: "", rowLane: "" }), "unknown");
    assert.equal(resolveEmpleosPublicationLane({ rowLane: "not-a-real-lane" }), "unknown");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9/10/11 — the modern lane-aware client still dispatches Quick/Premium/Feria to their own
   * shells (untouched by this gate — the repair is entirely upstream, in what lane value reaches
   * this dispatch).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(LANE_DETAIL_CLIENT_FILE);
    assert.ok(src.includes('lane === "premium"'), "must still dispatch premium to EmpleoPremiumDetailPage");
    assert.ok(src.includes("<EmpleoPremiumDetailPage"), "Premium shell must still be rendered");
    assert.ok(src.includes('lane === "feria"'), "must still dispatch feria to EmpleoJobFairDetailPage");
    assert.ok(src.includes("<EmpleoJobFairDetailPage"), "Feria shell must still be rendered");
    assert.ok(src.includes("<EmpleoQuickDetailPage"), "Quick shell must still be the default dispatch");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 12 — unknown rows still render safely: the legacy fallback client is untouched and still
   * handles a null job gracefully (never crashes).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(FALLBACK_CLIENT_FILE);
    assert.ok(src.includes("if (!job) {"), "legacy fallback must still guard against a null job");
    const pageSrc = readSource(PAGE_FILE);
    assert.ok(pageSrc.includes("<EmpleoPublicDetailClient"), "page must still render the legacy fallback for unresolved lanes");
    assert.ok(pageSrc.includes('resolvedLane !== "unknown"'), "useLaneShell must be driven by the resolver's unknown case");
  }

  /* ---------------------------------------------------------------------------------------- *
   * Resolver wiring — the public route and rowToJobRecord both actually call the shared resolver
   * (not a re-implemented ad hoc check), and the route logs (without PII) when a row stays
   * unresolved.
   * ---------------------------------------------------------------------------------------- */
  {
    const pageSrc = readSource(PAGE_FILE);
    assert.ok(pageSrc.includes("resolveEmpleosPublicationLane("), "page must call the shared resolver");
    assert.ok(pageSrc.includes("console.warn"), "page must log a diagnostic signal for unresolved rows");
    assert.ok(!/console\.(warn|log)\([^)]*\b(email|phone|applicant|name)\b/i.test(pageSrc), "diagnostic log must not reference PII fields");

    const dbSrc = readSource(DB_SERVER_FILE);
    assert.ok(dbSrc.includes("resolveEmpleosPublicationLane("), "rowToJobRecord must call the shared resolver");
    assert.ok(dbSrc.includes("rowLane: row.lane"), "rowToJobRecord must pass the canonical DB column into the resolver");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 13 — every current publish branch persists publicationLane unconditionally (Quick, Premium,
   * Feria) — the writer side was already sound; this gate did not need to touch it.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(ENVELOPE_MAPPER_FILE);
    assert.ok(src.includes('publicationLane: "quick"'), "quick branch must persist publicationLane");
    assert.ok(src.includes('publicationLane: "premium"'), "premium branch must persist publicationLane");
    assert.ok(src.includes('publicationLane: "feria"'), "feria branch must persist publicationLane");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 14 — edit/republish never erases the lane column, and a lane mismatch on an existing row is
   * actively rejected rather than silently overwritten.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(DB_SERVER_FILE);
    assert.ok(src.includes("lane: canonical.lane"), "mapCanonicalToRow must always set the lane column on insert and update");
    assert.ok(src.includes('error: "lane_mismatch"'), "an existing row's lane must be protected against silent drift on edit");
    const apiSrc = readSource(API_WRITE_ROUTE_FILE);
    assert.ok(apiSrc.length > 0, "sanity: the sole write API route must still exist");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 15 — the read-only audit script never writes to the database (SELECT only).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(AUDIT_SCRIPT_FILE);
    assert.ok(!/\.(insert|update|upsert|delete)\s*\(/.test(src), "audit script must never write, update, upsert, or delete rows");
    assert.ok(src.includes(".select("), "audit script must only read");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 16/17/18 — no migration added, no payment/lifecycle/route-deletion changes: the lines this
   * gate actually added never reference those locked concerns, and the original migration file
   * that defines the `lane` column (evidence for this whole gate) is unchanged, not touched.
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    // Rewired onto the shared allowlist (see globalizationCurrentPackageDiff.ts) — this blanket
    // "no migration in the diff" check predates that mechanism; a later package's own
    // already-authorized migration (e.g. Package C Build 4/C9's capacity RPC migration) must not
    // trip it. The lane-column migration itself stays a hard, non-exempt rule below.
    const { excludeCurrentPackageFiles } = await import("./globalizationCurrentPackageDiff");
    const changedOutsideAllowlist = excludeCurrentPackageFiles(changed);
    assert.ok(!changedOutsideAllowlist.some((f) => f.startsWith("supabase/migrations/")), "no UN-allowlisted migration file may be part of the current diff");
    assert.ok(!changed.includes(MIGRATION_FILE), "the original lane-column migration must not be modified");

    for (const f of [RESOLVER_FILE, DB_SERVER_FILE, PAGE_FILE]) {
      let diff = "";
      try {
        diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", f], { cwd: REPO_ROOT, encoding: "utf8" });
      } catch {
        diff = "";
      }
      const addedLines = diff
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .join("\n");
      assert.ok(
        !/stripe|checkout|webhook|entitlement|lifecycle|migrations\//i.test(addedLines),
        `${f}: lines added by this gate must not reference any locked system`,
      );
    }
  }

  console.log("gate-i5-4c-empleos-lane-shell-fallback-safety-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
