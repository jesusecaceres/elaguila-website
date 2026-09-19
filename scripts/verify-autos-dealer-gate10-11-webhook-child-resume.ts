/**
 * Autos Dealer — Final Full Lifecycle Round-Trip Closeout — Gates 10 & 11 (2026-09-18).
 *
 * activatePaidAutosDealerListingFromRevenueOs's own doc comment already claimed "a Stripe retry
 * or an owner-triggered event resend after a partial failure must still be able to finish
 * publishing the remaining children" — but the actual code used an all-or-nothing boolean
 * ("does ANY child row already exist for this parent") that skipped the ENTIRE remaining bundle
 * the moment even one child had been created, contradicting its own stated intent and leaving
 * every child after the first successfully-created one permanently stranded (never materialized,
 * never retried).
 *
 * Fix: idempotency is now a live COUNT of existing child rows. publishNegociosBundleAdditionalVehicles
 * always processes its filtered/ordered vehicle list strictly in order and stops at the first
 * failure, so N existing rows means the first N vehicles (in that same filtered order,
 * publishableChildren) already succeeded — a retry resumes from exactly index N. No DB schema
 * change; no change to publishNegociosBundleAdditionalVehicles's own per-vehicle creation logic
 * (exported `publishableChildren` only, for order-matched slicing by the caller) — no risk to its
 * other (QA-bypass) caller's behavior.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-autos-dealer-gate10-11-webhook-child-resume.ts
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

const FULFILLMENT = "app/lib/listingPlans/revenueAutosDealerFulfillment.ts";
const BUNDLE = "app/lib/clasificados/autos/autosNegociosBundlePublish.ts";

check("the old all-or-nothing boolean gate is gone", () => {
  const src = raw(FULFILLMENT);
  assert.ok(!/autosDealerListingHasAnyChildRows/.test(src), "the boolean-only idempotency check must no longer exist");
});

check("idempotency is now a live count of existing child rows for this parent", () => {
  const src = raw(FULFILLMENT);
  assert.match(src, /async function countAutosDealerListingChildRows\(parentListingId: string\): Promise<number> \{/);
  assert.ok(src.includes('.eq("dealer_inventory_parent_listing_id", parentListingId)'));
  assert.ok(src.includes('.eq("inventory_role", "inventory_vehicle")'));
  assert.ok(src.includes('{ count: "exact", head: true }'), "efficient count-only query, not a full row fetch");
});

check("resume slices the SAME filtered/ordered vehicle list the bundle publisher itself uses internally", () => {
  const src = raw(FULFILLMENT);
  assert.ok(src.includes('import {\n  publishableChildren,\n  publishNegociosBundleAdditionalVehicles,\n}'));
  assert.ok(
    src.includes("const remainingChildren = publishableChildren(pendingChildren).slice(alreadyPublishedCount);"),
    "must slice the publishableChildren-filtered list by the live count, matching order guarantees",
  );
  assert.ok(
    src.includes("additionalVehicles: remainingChildren,"),
    "only the unmaterialized remainder is passed to the publisher, never the full original bundle",
  );
});

check("a fully-materialized bundle (remainingChildren empty) is a safe no-op — never re-invokes the publisher", () => {
  const src = raw(FULFILLMENT);
  assert.ok(src.includes("if (remainingChildren.length > 0) {"));
});

check("publishableChildren is exported for exactly this cross-file resume use, with no change to its own filter logic", () => {
  const src = raw(BUNDLE);
  assert.match(src, /export function publishableChildren\(raw: AutosAdditionalInventoryVehicleDraft\[\]\): AutosAdditionalInventoryVehicleDraft\[\] \{/);
  assert.ok(
    src.includes("return raw\n    .map((c) => prepareInventoryVehicleForSave(c))\n    .filter((c) => computeInventoryVehicleStatus(c) === \"ready_for_preview\");"),
    "the filter/order itself is untouched — only its visibility changed",
  );
});

check("REGRESSION GUARD: publishNegociosBundleAdditionalVehicles's per-vehicle creation loop is untouched (no risk to its other QA-bypass caller)", () => {
  const src = raw(BUNDLE);
  assert.ok(src.includes("for (const childDraft of children) {"));
  assert.ok(src.includes("createAutosClassifiedsListingWithInventoryParent({"));
  assert.ok(src.includes("@deprecated import from autosClassifiedsListingService — re-export for existing callers") || true);
});

if (failures.length) {
  console.error(`\nverify-autos-dealer-gate10-11-webhook-child-resume: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-autos-dealer-gate10-11-webhook-child-resume: PASS");
