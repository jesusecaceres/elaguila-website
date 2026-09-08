/**
 * Work Package I.10B — En Venta Inline Save Owner Protection self-test.
 *
 * Closes the one gap I.10A's own final report named explicitly: `EnVentaAnuncioLayout.tsx`'s
 * inline Save (shared by en-venta and bienes-raices, hand-rolled, not via `LeonixSaveButton`)
 * lacked the owner self-engagement guard the shared components and the two BR shells already
 * got. This is a React client component that cannot be invoked standalone outside the framework
 * (same convention used throughout this session for such files) — coverage here is source-level
 * (call-presence and call-order), plus a direct behavioral check of the reused pure predicate.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i10b-en-venta-inline-save-owner-protection-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { isSelfEngagement } from "../app/lib/analytics/selfEngagementGuard";

const REPO_ROOT = path.resolve(__dirname, "..");
const EN_VENTA_LAYOUT = "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx";

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  /* ============================================================================================
   * REUSED PREDICATE — no new auth system; the same pure guard I.10A introduced.
   * ========================================================================================== */
  {
    assert.equal(isSelfEngagement("owner-1", "owner-1"), true, "owner viewing their own listing must be blocked");
    assert.equal(isSelfEngagement("buyer-1", "owner-1"), false, "a different authenticated user must remain allowed");
  }

  /* ============================================================================================
   * WIRING — the guard is imported and called inside onToggleSave, before any persistence write
   * or analytics call, for both the "saved" (delete) and "not saved" (upsert) branches.
   * ========================================================================================== */
  {
    const src = readSource(EN_VENTA_LAYOUT);
    assert.ok(src.includes('import { isSelfEngagement } from "@/app/lib/analytics/selfEngagementGuard";'), "must import the shared, reused guard");

    const fnStart = src.indexOf("const onToggleSave = useCallback(async () => {");
    const fnEnd = src.indexOf("const onShareListing = useCallback(");
    assert.ok(fnStart > -1 && fnEnd > fnStart, "must be able to isolate the onToggleSave callback body");
    const fnBody = src.slice(fnStart, fnEnd);

    const guardIdx = fnBody.indexOf("isSelfEngagement(user.id, ownerId)");
    assert.ok(guardIdx > -1, "onToggleSave must call isSelfEngagement(user.id, ownerId)");

    const loginRedirectIdx = fnBody.indexOf("window.location.href = `/login");
    assert.ok(loginRedirectIdx > -1 && loginRedirectIdx < guardIdx, "the anonymous-user redirect must still run before the owner check (order: authenticated, then self-engagement)");

    // Ordering: the self-engagement guard precedes BOTH the delete-branch and upsert-branch DB
    // mutations, and both analytics calls — an owner never reaches persistence or analytics.
    const deleteIdx = fnBody.indexOf('.delete().eq("user_id", user.id).eq("listing_id", listing.id)');
    const upsertIdx = fnBody.indexOf('.upsert({ user_id: user.id, listing_id: listing.id }');
    const firstAnalyticsIdx = fnBody.indexOf("trackListingSaveToggleAuthed(");
    const lastAnalyticsIdx = fnBody.lastIndexOf("trackListingSaveToggleAuthed(");
    assert.ok(deleteIdx > -1 && guardIdx < deleteIdx, "guard must precede the delete-branch persistence write");
    assert.ok(upsertIdx > -1 && guardIdx < upsertIdx, "guard must precede the upsert-branch persistence write");
    assert.ok(firstAnalyticsIdx > -1 && guardIdx < firstAnalyticsIdx, "guard must precede the first analytics call");
    assert.ok(lastAnalyticsIdx > firstAnalyticsIdx && guardIdx < lastAnalyticsIdx, "guard must precede the second analytics call");
    // Within each branch, persistence still precedes analytics — I.10A's ordering guarantee
    // is unchanged by this fix.
    assert.ok(deleteIdx < firstAnalyticsIdx, "delete-branch persistence must still precede its analytics call");
    assert.ok(upsertIdx < lastAnalyticsIdx, "upsert-branch persistence must still precede its analytics call");

    // Non-owner behavior is untouched: the guard is a single early `return`, not a rewrite of the
    // surrounding branches, so a non-owner still reaches both the real mutation and the real
    // analytics call exactly as before.
    assert.ok(fnBody.includes("if (isSelfEngagement(user.id, ownerId)) return;"), "must be a plain early return — no new branching logic that could also affect non-owners");

    // Canonical analytics recorder is unchanged — still the I.10A dispatcher, not the legacy path.
    assert.ok(fnBody.includes("sourceTable: \"listings\""), "must still use the canonical listings-table identity");
    assert.ok(!fnBody.includes("clasificadosAnalytics"), "must not reintroduce the legacy direct-insert module");
  }

  /* ============================================================================================
   * SHARE UNAFFECTED — an owner can still share their own listing; Share never touches Like/Save
   * state and must not be gated by this fix.
   * ========================================================================================== */
  {
    const src = readSource(EN_VENTA_LAYOUT);
    const shareStart = src.indexOf("const onShareListing = useCallback(");
    const shareEnd = src.indexOf("const publicListingPath = useMemo(");
    assert.ok(shareStart > -1 && shareEnd > shareStart, "must be able to isolate the onShareListing callback body");
    const shareBody = src.slice(shareStart, shareEnd);
    assert.ok(!shareBody.includes("isSelfEngagement"), "Share must never be gated by owner self-engagement");
  }

  /* ============================================================================================
   * SCOPE — no other category file, no analytics API/server file, changed by this package.
   * This blanket check predates the shared allowlist mechanism (scripts/globalizationCurrentPackageDiff.ts);
   * a later package's own already-authorized analytics-server touch (e.g. Package D Build D2's
   * Ofertas Locales identity-resolver addition) must not trip it — rewired the same way every other
   * historical diff-scope gate in this program already is.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    const { excludeCurrentPackageFiles } = await import("./globalizationCurrentPackageDiff");
    const changedOutsideAllowlist = excludeCurrentPackageFiles(changed);
    for (const f of changedOutsideAllowlist) {
      assert.ok(!f.includes("app/lib/analytics/server/"), `I.10B must not touch server-only analytics code: ${f}`);
      assert.ok(!f.includes("app/api/analytics/"), `I.10B must not touch the analytics API route: ${f}`);
    }
  }

  console.log("gate-i10b-en-venta-inline-save-owner-protection-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
