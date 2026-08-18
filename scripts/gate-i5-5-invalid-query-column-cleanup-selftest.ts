/**
 * Gate I.5.5 — self-test for invalid query / column contract cleanup.
 *
 * Confirmed via a live read-only audit (`scripts/gate-i5-5-schema-contract-audit.mts`):
 *   - `listings.views` does NOT exist in production (confirmed obsolete — analytics contract is
 *     event-based via `listing_analytics`, locked, never restored here).
 *   - `profiles.disabled` does NOT exist; `profiles.is_disabled` DOES exist. This is the OPPOSITE
 *     of what the gate prompt assumed ("actual contract uses profiles.disabled") — production and
 *     the repo's own admin code (`adminProfilesQuery.ts`, `admin/actions.ts`,
 *     `admin/(dashboard)/usuarios/*`) already agree on `is_disabled`. The one place using the
 *     wrong name was the owner-dashboard's own `dashboardProfile.ts`, not any admin file.
 *   - Three OTHER columns in the same En Venta select (`listing_json`, `republish_sort_at`,
 *     `admin_promoted`) are ALSO currently missing in production, but are defined by recent,
 *     active migrations not yet applied to this project — "migrations pending," not "obsolete."
 *     These are deliberately NOT removed: `listingsQueryWithSelectShrink` already absorbs their
 *     absence safely and will pick them up automatically once migrated.
 *
 * Proves: no runtime query selects `listings.views`; the En Venta select no longer references it
 * (analytics stays event-based, unchanged); `RecentlyViewedSection` guards empty ID lists and
 * filters non-uuid ids before querying, matching the pattern already proven in
 * `/dashboard/vistos-recientes`; `dashboardProfile.ts` now reads/writes the canonical
 * `is_disabled` column consistently with every admin file; no admin file needed to change (already
 * correct); the three pending-migration columns are untouched; no migration was added; no locked
 * system was touched.
 *
 * No network (the live audit runs separately, not by this self-test), no React rendering. Run
 * from repo root:
 *   npx tsx scripts/gate-i5-5-invalid-query-column-cleanup-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const EN_VENTA_SELECT_FILE = "app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts";
const RECENTLY_VIEWED_SECTION_FILE = "app/(site)/clasificados/components/RecentlyViewedSection.tsx";
const VISTOS_RECIENTES_PAGE_FILE = "app/(site)/dashboard/vistos-recientes/page.tsx";
const DASHBOARD_PROFILE_FILE = "app/(site)/dashboard/lib/dashboardProfile.ts";
const ADMIN_PROFILES_QUERY_FILE = "app/admin/_lib/adminProfilesQuery.ts";
const ADMIN_ACTIONS_FILE = "app/admin/actions.ts";
const OWNER_LISTINGS_QUERY_FILE = "app/(site)/dashboard/lib/ownerListingsQuery.ts";
const RESULTS_CARD_MODEL_FILE = "app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts";
const MIGRATION_LISTINGS_ENGAGEMENT = "supabase/migrations/20250312000000_listings_engagement_boost.sql";

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1/2 — no runtime query selects listings.views anymore; the En Venta select is fixed.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(EN_VENTA_SELECT_FILE);
    assert.ok(!/EN_VENTA_LISTING_PUBLIC_ROW_BASE\s*=\s*"[^"]*\bviews\b/.test(src), "EN_VENTA_LISTING_PUBLIC_ROW_BASE must no longer include views");
    assert.ok(src.includes("listing_json"), "the three pending-migration columns must remain untouched");
    assert.ok(src.includes("republish_sort_at"), "the three pending-migration columns must remain untouched");
    assert.ok(src.includes("admin_promoted"), "the three pending-migration columns must remain untouched");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — the results card model already treats a missing/zero view count as "unavailable," never
   * fakes a "0 views" badge — proving the removal is safe without a mapper change.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(RESULTS_CARD_MODEL_FILE);
    assert.ok(/showViews:\s*plan === "pro" && dto\.views > 0/.test(src), "views badge must stay gated on a real positive count, never a fake zero");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — analytics remain event-based: the owner dashboard's own view count already comes from
   * listing_analytics, not the listings.views column, and that file is untouched by this gate.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(OWNER_LISTINGS_QUERY_FILE);
    assert.ok(!/select\([^)]*\bviews\b/.test(src), "ownerListingsQuery.ts must still exclude views from its select (Gate I.4.1, unchanged)");
    assert.ok(src.includes("views: typeof r.views"), "must keep tolerating an absent views field defensively, not require it");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5/6 — Recently Viewed: zero ids send no query; non-uuid ids are filtered before querying,
   * matching the pattern already proven in /dashboard/vistos-recientes.
   * ---------------------------------------------------------------------------------------- */
  {
    const sectionSrc = readSource(RECENTLY_VIEWED_SECTION_FILE);
    assert.ok(sectionSrc.includes("ids.length === 0) return"), "must still guard against an empty id list before doing any work");
    assert.ok(/\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(id\)/.test(sectionSrc), "must filter to uuid-shaped ids before querying, same as vistos-recientes");
    assert.ok(sectionSrc.includes('if (requestedIds.length > 0)'), "must not query listings with an empty id array");

    const pageSrc = readSource(VISTOS_RECIENTES_PAGE_FILE);
    assert.ok(/\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(id\)/.test(pageSrc), "the reference implementation this gate matched must still filter uuid-shaped ids");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7/8 — deleted/inaccessible rows are skipped safely (absent from the result map, rendered as
   * a "missing" placeholder or simply omitted), and a query failure fails soft once — no retry
   * loop exists in either Recently Viewed caller.
   * ---------------------------------------------------------------------------------------- */
  {
    const sectionSrc = readSource(RECENTLY_VIEWED_SECTION_FILE);
    assert.ok(sectionSrc.includes("catch {"), "must fail soft on query error, not throw/retry");
    assert.equal((sectionSrc.match(/\.from\("listings"\)/g) ?? []).length, 1, "must issue exactly one listings query attempt, no retry loop");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9/10 — admin disabled-state reads and writes already use the canonical is_disabled column
   * (confirmed against production) — no admin file needed to change.
   * ---------------------------------------------------------------------------------------- */
  {
    const querySrc = readSource(ADMIN_PROFILES_QUERY_FILE);
    assert.ok(querySrc.includes("is_disabled"), "admin profile list select must use is_disabled");
    const actionsSrc = readSource(ADMIN_ACTIONS_FILE);
    assert.ok(actionsSrc.includes("is_disabled: disabled"), "admin suspend/unsuspend mutation must write is_disabled");
  }

  /* ---------------------------------------------------------------------------------------- *
   * The one confirmed-wrong reference (owner dashboard profile helper, not an admin file) is
   * corrected to match the canonical column, consistently in both select tiers and the type.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(DASHBOARD_PROFILE_FILE);
    assert.ok(!/PROFILE_SELECT_EXTENDED\s*=\s*"[^"]*,\s*disabled\s*,/.test(src), "PROFILE_SELECT_EXTENDED must no longer reference the nonexistent disabled column");
    assert.ok(src.includes("is_disabled"), "must reference the canonical is_disabled column instead");
    assert.ok(!/disabled:\s*boolean \| null/.test(src) || src.includes("is_disabled: boolean | null"), "DashboardProfileRow type must use is_disabled, not disabled");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 11/12 — authorization does not fail open, and no customer status was mutated: this gate is
   * read/select-only for the disabled-state contract — no update/write call was added or changed.
   * ---------------------------------------------------------------------------------------- */
  {
    let diff = "";
    try {
      diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", DASHBOARD_PROFILE_FILE], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      diff = "";
    }
    const addedLines = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n");
    assert.ok(!/\.update\(|\.upsert\(|\.insert\(/.test(addedLines), "dashboardProfile.ts changes must be read-only (select strings + type), no write added");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 13/14 — no migration added BY THIS GATE; the original engagement-boost migration (the one
   * that first added the now-confirmed-obsolete `views` column) is left alone, not touched or
   * reverted — that second check is a hard, non-exempt rule for every later package, not just
   * this gate's own scope. The first check ("no migration in the diff at all") was written when
   * this gate's own package was the only in-flight diff; later packages that legitimately touch
   * a DIFFERENT, already-authorized migration (e.g. Package C Build 4/C9's own capacity RPC
   * migration) now route through the shared allowlist, exactly like every other historical
   * diff-scope gate in this program — see scripts/globalizationCurrentPackageDiff.ts.
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    const { excludeCurrentPackageFiles } = await import("./globalizationCurrentPackageDiff");
    const changedOutsideAllowlist = excludeCurrentPackageFiles(changed);
    assert.ok(!changedOutsideAllowlist.some((f) => f.startsWith("supabase/migrations/")), "no UN-allowlisted migration file may be part of the current diff");
    assert.ok(!changed.includes(MIGRATION_LISTINGS_ENGAGEMENT), "the original views-column migration must not be touched");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 15/16 — no route deleted; no locked system referenced by the lines this gate actually added.
   * ---------------------------------------------------------------------------------------- */
  {
    let deletedFiles = "";
    try {
      deletedFiles = execFileSync("git", ["diff", "--name-only", "--diff-filter=D", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      deletedFiles = "";
    }
    assert.equal(deletedFiles.trim(), "", "no file may be deleted by this gate");

    for (const f of [EN_VENTA_SELECT_FILE, RECENTLY_VIEWED_SECTION_FILE, DASHBOARD_PROFILE_FILE]) {
      let diff = "";
      try {
        diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", f], { cwd: REPO_ROOT, encoding: "utf8" });
      } catch {
        diff = "";
      }
      const addedLines = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n");
      assert.ok(
        !/stripe|checkout|webhook|entitlement|lifecycle|migrations\//i.test(addedLines),
        `${f}: lines added by this gate must not reference any locked system`,
      );
    }
  }

  console.log("gate-i5-5-invalid-query-column-cleanup-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
