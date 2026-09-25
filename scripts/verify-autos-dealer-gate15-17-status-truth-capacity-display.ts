/**
 * Autos Dealer — Final Lifecycle Closeout — Gate 15 (dashboard payment-status truth) and
 * Gate 17 (admin Dealer active-count display), 2026-09-18.
 *
 * Reconciliation context: the 2026-09-18 forensic re-audit found the fix-me-plan's Gate 4/11
 * (Preview child hydration), Gate 3/6/12/13 (cover parity), Gate 8/9 (active-parent/canonical-
 * child Save), and Gate 10/11 (webhook resume idempotency) already landed in c0a4dbb0 — see
 * verify-autos-dealer-gate1-2-11-* / verify-autos-dealer-gate3-4-6-7-8-9-edit-save.ts, which this
 * file does not duplicate. Two genuinely still-open gaps survived that reconciliation:
 *
 * Gate 15: the owner dashboard's Privado-row and Dealer-parent header badges resolved their
 * status label/chip through the SHARED cross-category resolveListingUiStatus/listingUiStatusLabel
 * (app/(site)/dashboard/lib/listingDisplayStatus.ts), whose narrower ListingUiStatus union
 * collapses pending_payment AND payment_failed into the same "draft"/"archived" bucket as a
 * never-started application or a truly dead listing — showing "Borrador"/"Archivado" instead of
 * the truthful "Pago pendiente"/"Pago fallido" a dealer needs to know to resume checkout. Autos
 * already has its own canonical-status-aware, truthful label/chip pair (autosListingStatusLabelEs/
 * En + autosListingStatusChipClass), already used correctly for the inline child-vehicle sub-line
 * in the very same file — this fix reuses that existing Autos-native pair for the two header
 * badges instead, touching zero lines of the shared cross-category resolver (used by 15+ other
 * category dashboards) to keep blast radius at zero for every other category.
 *
 * Gate 17: the admin Autos queue's per-row "active N/10" capacity hint aggregated by
 * owner_user_id, so two distinct Dealer parent/groups owned by the same person would incorrectly
 * share one combined count. Fixed to key by dealer_inventory_group_id (falling back to
 * dealer_inventory_parent_listing_id, then the row's own id for an ungrouped standalone parent —
 * the same fallback convention resolveAutosDealerInventoryGroupKey already uses on the owner
 * dashboard). The hardcoded "/10" denominator itself is NOT resolved here — doing so correctly
 * requires a live join against listing_package_entitlements to detect the +$129 Inventory Pack
 * add-on, which needs Supabase access to verify the entitlement row shape; left as a follow-up,
 * not silently dropped, and explicitly not a regression versus the pre-existing hardcode.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-autos-dealer-gate15-17-status-truth-capacity-display.ts
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

const DASHBOARD = "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx";
const ADMIN_PAGE = "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx";

/* ── Gate 15: dashboard header badges must use the truthful, Autos-native status pair ── */
check("dashboard no longer imports the shared cross-category status resolver", () => {
  const src = raw(DASHBOARD);
  assert.ok(
    !/from "@\/app\/\(site\)\/dashboard\/lib\/listingDisplayStatus"/.test(src),
    "must not import resolveListingUiStatus/listingUiStatusLabel/listingUiStatusChipClass anymore",
  );
  assert.ok(!/resolveListingUiStatus\(/.test(src), "no leftover call site");
  assert.ok(!/listingUiStatusLabel\(/.test(src), "no leftover call site");
  assert.ok(!/listingUiStatusChipClass\(/.test(src), "no leftover call site");
});

check("dashboard imports Autos' own truthful status chip-class helper alongside the labels", () => {
  const src = raw(DASHBOARD);
  assert.ok(
    /import \{\s*autosListingStatusChipClass,\s*autosListingStatusLabelEn,\s*autosListingStatusLabelEs,\s*\} from "@\/app\/lib\/clasificados\/autos\/autosClassifiedsVisibility";/.test(
      src,
    ),
    "autosListingStatusChipClass must be imported from the same Autos visibility module as the labels",
  );
});

check("Privado row header badge uses the local Autos-native statusLabel()/autosListingStatusChipClass, not the generic pair", () => {
  const src = raw(DASHBOARD);
  const idx = src.indexOf("eyebrow: t.eyebrowPrivado,");
  assert.ok(idx > 0, "Privado header block must still exist");
  const block = src.slice(idx, idx + 400);
  assert.ok(block.includes("statusLabel: statusLabel(row.status, lang),"));
  assert.ok(block.includes("statusChipClass: autosListingStatusChipClass(row.status as AutosClassifiedsListingStatus),"));
});

check("Dealer parent header badge uses the local Autos-native statusLabel()/autosListingStatusChipClass, not the generic pair", () => {
  const src = raw(DASHBOARD);
  const idx = src.indexOf("eyebrow: t.eyebrowDealer,");
  assert.ok(idx > 0, "Dealer parent header block must still exist");
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("statusLabel: parentRow ? statusLabel(parentRow.status, lang) : \"\","));
  assert.ok(
    block.includes(
      'statusChipClass: parentRow ? autosListingStatusChipClass(parentRow.status as AutosClassifiedsListingStatus) : "",',
    ),
  );
});

check("REGRESSION GUARD: the child-vehicle inline status sub-line still uses the same already-correct local statusLabel() helper", () => {
  const src = raw(DASHBOARD);
  assert.ok(
    /function statusLabel\(status: string, lang: Lang\): string \{\s*const s = status as AutosClassifiedsListingStatus;\s*return lang === "es" \? autosListingStatusLabelEs\(s\) : autosListingStatusLabelEn\(s\);\s*\}/.test(
      src,
    ),
    "the shared local helper both header badges now reuse must be untouched",
  );
});

/* ── Gate 17: admin capacity count must key by dealer group, not owner ── */
check("admin page no longer aggregates Dealer active count by owner_user_id alone", () => {
  const src = raw(ADMIN_PAGE);
  assert.ok(!/dealerActiveCountByOwner/.test(src), "old owner-keyed map name must be gone entirely");
});

check("admin capacity group key is group id, falling back to parent id then row id (Gate 17 key, closeout 2 module)", () => {
  // Golden-survivor port of closeout 2: the key lives in adminDealerCapacityGroupKey and the count is TOTAL active
  // vehicles over EVERY active row of the visible owners (not the truncated page) - see adminAutosDealerCapacity.ts.
  const lib = raw("app/admin/_lib/adminAutosDealerCapacity.ts");
  assert.ok(
    lib.includes(
      'return String(row.dealer_inventory_group_id ?? "").trim() || String(row.dealer_inventory_parent_listing_id ?? "").trim() || row.id;',
    ),
  );
  const src = raw(ADMIN_PAGE);
  assert.ok(src.includes("const dealerCapacityByGroup = await fetchAutosDealerCapacityForRows(rows);"));
});

check("the per-row display reads the capacity using the SAME group-key derivation as the aggregation", () => {
  const src = raw(ADMIN_PAGE);
  const idx = src.indexOf("const dealerGroupKey =");
  assert.ok(idx > 0, "per-row group key derivation must exist");
  const block = src.slice(idx, idx + 300);
  assert.ok(block.includes("const dealerGroupKey = adminDealerCapacityGroupKey(r);"));
  assert.ok(block.includes("dealerCapacityByGroup[dealerGroupKey]"));
  const server = raw("app/admin/_lib/adminAutosDealerCapacityServer.ts");
  assert.ok(server.includes("adminDealerCapacityGroupKey(r)"), "aggregation keys rows with the same function");
});

check("REGRESSION GUARD: admin public-link firewall untouched — liveHref still gated strictly on status === 'active'", () => {
  const src = raw(ADMIN_PAGE);
  assert.ok(
    src.includes('r.status === "active"\n                    ? `${autosLiveVehiclePath(r.id)}?lang=${r.lang === "en" ? "en" : "es"}`\n                    : null;'),
    "the admin View-public gate must remain exactly status==='active', unchanged by this pass",
  );
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nverify-autos-dealer-gate15-17-status-truth-capacity-display: PASS");
