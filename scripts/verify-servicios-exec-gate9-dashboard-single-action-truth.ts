/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 9 (dashboard single action truth,
 * 2026-09-18).
 *
 * Servicios has TWO independent owner dashboard surfaces (Mis Anuncios' inventory card, and the
 * dedicated /dashboard/servicios workspace page) that had drifted onto two different status
 * pipelines:
 *   - Mis Anuncios already used the correct, category-aware `resolveOwnerDashboardStatusDisplay`,
 *     which preserves `pending_payment` as its own canonical status -> real "Pago pendiente" /
 *     "Payment pending" label.
 *   - /dashboard/servicios used `resolveListingUiStatus` + `listingUiStatusLabel`, whose
 *     intermediate `ListingUiStatus` enum has no `pending_payment` sub-state and collapses the
 *     whole `pre_publish` bucket (other than `pending_review`) into generic "draft" — so the SAME
 *     row showed "Borrador"/"Draft" here while showing "Pago pendiente" on the other surface. This
 *     is the exact defect the owner flagged.
 *   - /dashboard/servicios also unconditionally offered "View Public"/"View Results" for every
 *     row (even non-public ones) and only offered "Preview" once already published, so a
 *     pending_payment row had a dead View Public link and no Preview/Complete-Payment path at all.
 *
 * Fix: /dashboard/servicios now reuses the SAME `resolveOwnerDashboardStatusDisplay` for the
 * status label text (styling/chip class untouched — no redesign), gates View Public/View Results
 * on real public-eligible status, and adds Preview + "Completar pago" for a pending_payment row —
 * routed to the SAME canonical Preview href + checkout checkpoint Gates 7/8 already built, never a
 * second implementation. Mis Anuncios also gains Servicios in the shared payment-required
 * attention feed (the generic resolver already supported any category; Servicios was simply never
 * wired into the loop that calls it).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate9-dashboard-single-action-truth.ts
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

const SERVICIOS_PAGE = "app/(site)/dashboard/servicios/page.tsx";
const MIS_ANUNCIOS = "app/(site)/dashboard/mis-anuncios/page.tsx";

check("/dashboard/servicios now uses the SAME truthful status resolver Mis Anuncios already used", () => {
  const src = raw(SERVICIOS_PAGE);
  assert.ok(src.includes('import { resolveOwnerDashboardStatusDisplay, ownerDashboardStatusLabel } from "../lib/dashboardOwnerStatusDisplay";'));
  assert.ok(src.includes('resolveOwnerDashboardStatusDisplay("servicios", r.listingStatus)'));
  assert.ok(
    src.includes("statusLabel: statusDisplay ? ownerDashboardStatusLabel(statusDisplay, lang) : listingUiStatusLabel(uiStatus, lang),"),
  );
});

check("View Public / View Results are gated on real public-eligible status, not shown unconditionally", () => {
  const src = raw(SERVICIOS_PAGE);
  const idx = src.indexOf("const quickActions: ActionItem[] = [];");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 900);
  assert.ok(block.includes("if (isPubliclyVisibleStatus) {"));
  assert.ok(block.includes("publicViewLabel(lang)") && block.includes("publicResultsListingLabel(lang)"));
});

check("Preview is reachable for a pending_payment row, not only once published", () => {
  const src = raw(SERVICIOS_PAGE);
  assert.ok(src.includes("if (isCloudPublished || isPendingPayment) {"));
});

check("a direct 'Completar pago' action exists for pending_payment, routed to the SAME checkout checkpoint Gate 8 built", () => {
  const src = raw(SERVICIOS_PAGE);
  const idx = src.indexOf("if (isPendingPayment) {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 400);
  assert.ok(block.includes("#servicios-publish-checkout-checkpoint"));
  assert.ok(block.includes('"Completar pago"') && block.includes('"Complete payment"'));
});

check("REGRESSION GUARD: Edit remains unconditionally available (owner lock: Edit available for pending_payment)", () => {
  const src = raw(SERVICIOS_PAGE);
  assert.ok(src.includes("primaryAction={{ href: serviciosEditHref(r), label: editListingLabel(lang) }}"));
});

check("REGRESSION GUARD: chip styling (listingUiStatusChipClass) is untouched — only the label text truth source changed", () => {
  const src = raw(SERVICIOS_PAGE);
  assert.ok(src.includes("statusChipClass: listingUiStatusChipClass(uiStatus),"));
});

check("Mis Anuncios' payment-required attention feed now covers Servicios", () => {
  const src = raw(MIS_ANUNCIOS);
  const idx = src.indexOf("for (const item of serviciosInventory) {");
  assert.ok(idx > 0, "must add a Servicios loop mirroring the existing Empleos/Viajes loops");
  const block = src.slice(idx, idx + 350);
  assert.ok(block.includes('category: "servicios",'));
  assert.ok(block.includes("resolveOwnerDashboardAttentionItems({"));
  assert.ok(src.includes("[empleosInventory, viajesInventory, serviciosInventory, listings, q]);"), "the memo dependency array must include serviciosInventory");
});

check("REGRESSION GUARD: the generic payment_required attention rule itself (any category, statusDisplayKey === pending_payment) is untouched", () => {
  const src = raw("app/(site)/dashboard/lib/dashboardAttentionItems.ts");
  assert.ok(src.includes('if (row.statusDisplayKey === "pending_payment") {'));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate9-dashboard-single-action-truth: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate9-dashboard-single-action-truth: PASS");
