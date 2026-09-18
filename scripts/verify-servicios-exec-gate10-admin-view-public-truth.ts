/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 10 (admin View-Public truth, 2026-09-18).
 *
 * The Admin Servicios ops card unconditionally rendered a real, clickable "View public listing"
 * link for EVERY row, regardless of `listing_status` — a `pending_payment` row (never public per
 * Owner Lock #3/#12) got a working-looking link to a page that doesn't actually exist yet.
 *
 * Fix: gated on the SAME shared public-eligibility predicate Gate 9 established on the owner
 * dashboard (canonical `isPubliclyVisible`/`getVisibilityBucket` from `listingLifecycleDomain.ts`,
 * not a bespoke re-check) — a published row keeps the real clickable link; anything else shows a
 * truthful "not public yet" notice instead. Read-only: no listing_status mutation here (Gate 2's
 * named-action-only admin mutation boundary is untouched).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate10-admin-view-public-truth.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const CARD = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx";

check("the admin card imports the SAME canonical public-eligibility predicate the owner dashboard uses", () => {
  const src = raw(CARD);
  assert.ok(
    src.includes(
      'import { isPubliclyVisible, isValidLifecycleStatus } from "@/app/lib/clasificados/listingLifecycleDomain";',
    ),
  );
  assert.ok(src.includes("const publiclyVisible = isValidLifecycleStatus(row.listing_status) && isPubliclyVisible(row.listing_status);"));
});

check("View public listing only renders as a real link when publiclyVisible; otherwise a truthful notice, never a dead link", () => {
  const src = raw(CARD);
  const idx = src.indexOf("{publiclyVisible ? (");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 600);
  assert.ok(block.includes("View public listing"));
  assert.ok(block.includes("Not public yet"));
  assert.ok(block.includes("<Link") && block.includes("target=\"_blank\""), "the real link path must be unchanged for a published row");
});

check("REGRESSION GUARD: no listing_status mutation was introduced (read-only display gating only)", () => {
  const src = raw(CARD);
  const idx = src.indexOf("{publiclyVisible ? (");
  const end = src.indexOf("Not public yet", idx) + 200;
  const block = src.slice(idx, end);
  assert.ok(!/updateServiciosPublicListingStatusAction|listing_status\s*=/.test(block), "must not write listing_status here");
});

check("REGRESSION GUARD: the pre-existing publicLive flag (used elsewhere on this card) is untouched", () => {
  const src = raw(CARD);
  assert.ok(src.includes('const publicLive = (row.listing_status ?? "") === "published";'));
  assert.ok(src.includes("publicLive={publicLive}"));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate10-admin-view-public-truth: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate10-admin-view-public-truth: PASS");
