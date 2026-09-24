/**
 * SAN JOSE LAUNCH — Wave 2 shared staff reopen spine (2026-09-24).
 *
 * Pins the parts every family's reopen depends on: the staff-only bound-row reader (row id from the
 * signed context ONLY, ledger-verified, read-only), the client hydration hook (one-shot per
 * category+listing, cleared by the cockpit on every reopen), the launcher's ledger check before a
 * listing id is minted into the cookie, and the explicit duplicate-business confirmation.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-assisted-reopen-shared-01.ts
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
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const ROUTE = "app/api/admin/sales-preview/bound-row/route.ts";
const READER = "app/lib/sales/assistedBoundRow.ts";
const HOOK = "app/lib/sales/useAssistedBoundRow.ts";
const COCKPIT = "app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx";
const OPEN = "app/api/admin/sales-preview/open-application/route.ts";

check("bound-row route: staff-gated, GET only, row id only from the signed context", () => {
  const src = raw(ROUTE);
  assert.ok(src.includes('requireStaffWorkspaceWriteAccess("assisted_category_publishing")'), "staff gate");
  assert.ok(src.includes("readActiveAssistedPublishingContext(request.cookies)"), "signed context");
  assert.ok(/export async function GET/.test(src) && !/export async function (POST|PUT|PATCH|DELETE)/.test(src), "read-only verbs");
  assert.ok(!src.includes("searchParams") && !src.includes("request.url"), "no query-string listing id");
  assert.ok(src.includes("listingId: typeof ctx.listingId"), "id from ctx.listingId");
  assert.ok(src.includes('"cache-control": "no-store"'), "never cached");
});
check("bound-row reader: custody ledger proven before any read; category mismatch refused; never mutates", () => {
  const src = raw(READER);
  const ledger = src.indexOf("isListingLinkedToBusiness(");
  const read = src.indexOf(".select(\"*\")");
  assert.ok(ledger > 0 && read > ledger, "ledger check precedes the row read");
  assert.ok(src.includes("listing_not_linked_to_business") && src.includes("listing_category_mismatch"));
  assert.ok(!/\.(insert|update|upsert|delete)\(/.test(src), "read-only");
  assert.ok(src.includes("dealer_inventory_parent_listing_id") && src.includes("inventory_vehicle"), "dealer vehicle child");
});
check("hydration hook: one-shot per category+listing, marker cleared on reopen, customers see 'none'", () => {
  const src = raw(HOOK);
  assert.ok(src.includes("shouldHydrate") && src.includes("markHydrated") && src.includes("clearAssistedHydrationMarkers"));
  assert.ok(src.includes("sessionStorage"));
  assert.ok(src.includes("json.bound.category !== category"), "wrong-category rows are never returned");
  assert.ok(src.includes("if (!res.ok) return null"), "401/403 (customers) -> none");
});
check("cockpit: clears hydration markers on every open and handles the duplicate-business 409", () => {
  const src = raw(COCKPIT);
  assert.ok(src.includes("clearAssistedHydrationMarkers()"));
  assert.ok(src.includes('json.error === "duplicate_business_warning"'));
  assert.ok(src.includes("confirmDuplicateBusiness"));
  assert.ok(src.includes("data-staff-duplicate-warning") && src.includes("data-staff-use-existing-business"));
});
check("open-application: bound listing id only enters the cookie after the ledger says this business holds it", () => {
  const src = raw(OPEN);
  const guard = src.indexOf("isListingLinkedToBusiness(");
  const cookie = src.indexOf("applyAssistedPublishingCookie(res");
  assert.ok(guard > 0 && cookie > guard, "ledger check precedes cookie minting");
  assert.ok(src.includes('fail(403, "listing_not_linked_to_business")'));
});
check("open-application: a likely duplicate business is a 409 unless staff explicitly confirmed", () => {
  const src = raw(OPEN);
  assert.ok(src.includes("confirmDuplicateBusiness = body.confirmDuplicateBusiness === true"));
  assert.ok(src.includes("confirmCreateDespiteDuplicates: confirmDuplicateBusiness"));
  assert.ok(!src.includes("confirmCreateDespiteDuplicates: true"), "no silent duplicate bypass");
  assert.ok(src.includes('fail(409, "duplicate_business_warning"'));
});
check("staff business search also matches an email or phone fragment (reuse, do not duplicate)", () => {
  const src = raw("app/admin/_lib/businessWorkspaceData.ts");
  assert.ok(src.includes("businessIdsMatchingContactKeyword"));
  assert.ok(src.includes('.eq("contact_type", isEmail ? "email" : "phone")'));
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-assisted-reopen-shared-01: all checks passed");
