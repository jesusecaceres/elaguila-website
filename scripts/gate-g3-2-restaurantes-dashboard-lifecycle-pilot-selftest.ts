/**
 * Gate G.3.2 — behavioral self-test for the read-only Restaurantes dashboard lifecycle status +
 * attention pilot wired into `app/(site)/dashboard/restaurantes/page.tsx`. That file is a "use
 * client" React component (hooks, Next router, Supabase browser client) and cannot be imported
 * into a plain `tsx` process — this test instead exercises, as pure function calls, the exact
 * computation the page performs per row: `buildRestaurantesEligibilityInput` (already certified
 * by Gate G.3.1's own self-test) feeding `resolveOwnerFacingStatus` / `resolveAttentionState`,
 * plus the page's own tiny severity -> message/tone mapping (duplicated here verbatim, mirroring
 * the same convention already established for `brLifecycleAttentionMessage` in Gate G.2.2).
 *
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g3-2-restaurantes-dashboard-lifecycle-pilot-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  buildRestaurantesEligibilityInput,
  type RestaurantesLifecycleInput,
} from "../app/lib/listingIdentity/restaurantesLifecycleAdapter";
import {
  resolveAttentionState,
  resolveEligibleGlobalActions,
  resolveOwnerFacingStatus,
} from "../app/lib/listingIdentity/ownerLifecycleResolver";

const NOW = new Date("2026-07-28T12:00:00.000Z");
const UUID = "66666666-6666-4666-8666-666666666666";

function baseInput(overrides: Partial<RestaurantesLifecycleInput> = {}): RestaurantesLifecycleInput {
  return {
    canonicalListingId: UUID,
    ownerVerified: true,
    rawStatus: "published",
    now: NOW,
    ...overrides,
  };
}

/** Verbatim copy of `restauranteLifecycleAttentionMessage` from `dashboard/restaurantes/page.tsx`. */
function restauranteLifecycleAttentionMessage(
  severity: "none" | "informational" | "action_required" | "urgent",
  lang: "es" | "en",
): string | null {
  if (severity === "urgent") return lang === "es" ? "Requiere atención urgente" : "Requires urgent attention";
  if (severity === "action_required") return lang === "es" ? "Requiere tu atención" : "Needs your attention";
  if (severity === "informational") return lang === "es" ? "Nota informativa" : "Informational note";
  return null;
}

/** Verbatim copy of the severity -> `lifecycleNote.tone` mapping from the same page. */
function toneForSeverity(severity: "none" | "informational" | "action_required" | "urgent"): "urgent" | "warning" | "neutral" {
  return severity === "urgent" ? "urgent" : severity === "action_required" ? "warning" : "neutral";
}

/* ------------------------------------------------------------------------------------------ *
 * The confirmed original bug, closed: the dashboard status label must never be the raw enum
 * value for a non-"published" row (previously `r.status` leaked through verbatim).
 * ------------------------------------------------------------------------------------------ */

for (const rawStatus of ["pending_payment", "suspended", "archived"]) {
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus }));
  const descriptor = resolveOwnerFacingStatus(output);
  assert.notEqual(descriptor.labelEs, rawStatus, `"${rawStatus}" must never render as the raw enum value (es)`);
  assert.notEqual(descriptor.labelEn, rawStatus, `"${rawStatus}" must never render as the raw enum value (en)`);
}

/* ------------------------------------------------------------------------------------------ *
 * Status label pairing the dashboard actually renders (both languages)
 * ------------------------------------------------------------------------------------------ */

const labelCases: Array<{ rawStatus: string; labelEs: string; labelEn: string }> = [
  { rawStatus: "pending_payment", labelEs: "Pendiente de pago", labelEn: "Awaiting payment" },
  { rawStatus: "published", labelEs: "Publicado", labelEn: "Live" },
  { rawStatus: "suspended", labelEs: "Suspendido", labelEn: "Suspended" },
  { rawStatus: "archived", labelEs: "Archivado", labelEn: "Archived" },
];
for (const c of labelCases) {
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: c.rawStatus }));
  const descriptor = resolveOwnerFacingStatus(output);
  assert.equal(descriptor.labelEs, c.labelEs, `"${c.rawStatus}" es label mismatch`);
  assert.equal(descriptor.labelEn, c.labelEn, `"${c.rawStatus}" en label mismatch`);
}

/* ------------------------------------------------------------------------------------------ *
 * Attention -> message/tone mapping the dashboard renders as `lifecycleNote`
 * ------------------------------------------------------------------------------------------ */

{
  // Healthy published listing -> no note at all (the page renders nothing).
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "published" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "none");
  assert.equal(restauranteLifecycleAttentionMessage(attention.severity, "es"), null);
  assert.equal(restauranteLifecycleAttentionMessage(attention.severity, "en"), null);
}
{
  // Pending payment -> action_required -> amber "warning" tone, non-null message both languages.
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "pending_payment" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "action_required");
  assert.equal(toneForSeverity(attention.severity), "warning");
  assert.equal(restauranteLifecycleAttentionMessage(attention.severity, "es"), "Requiere tu atención");
  assert.equal(restauranteLifecycleAttentionMessage(attention.severity, "en"), "Needs your attention");
}
{
  // Suspended -> urgent -> red "urgent" tone.
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "suspended" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "urgent");
  assert.equal(toneForSeverity(attention.severity), "urgent");
  assert.equal(restauranteLifecycleAttentionMessage(attention.severity, "es"), "Requiere atención urgente");
  assert.equal(restauranteLifecycleAttentionMessage(attention.severity, "en"), "Requires urgent attention");
}
{
  // Archived -> no urgent/action-required attention; no note rendered.
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "archived" }));
  const attention = resolveAttentionState(output);
  assert.notEqual(attention.severity, "urgent");
  assert.notEqual(attention.severity, "action_required");
}

/* ------------------------------------------------------------------------------------------ *
 * Coupon entitlement wiring exactly as the page calls it: `dashboardAddonStatusForKey` always
 * returns a defined `AddonLifecycleStatus`, failing closed to "not_purchased" rather than
 * `undefined` — the page forwards that value as-is, never omits the field. Confirm this explicit
 * "not_purchased" call site behaves identically to the omitted-field case Gate G.3.1 verified.
 * ------------------------------------------------------------------------------------------ */

{
  const explicitNotPurchased = buildRestaurantesEligibilityInput(
    baseInput({ rawStatus: "published", couponEntitlementStatus: "not_purchased" }),
  );
  const omitted = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "published" }));
  assert.equal(explicitNotPurchased.paidModuleStates, undefined);
  assert.deepEqual(explicitNotPurchased.paidModuleStates, omitted.paidModuleStates);
  const attention = resolveAttentionState(explicitNotPurchased);
  assert.ok(
    !attention.reasons.includes("entitlement_inactive"),
    "the dashboard's real fail-closed addonStatus value must never produce a false entitlement_inactive note",
  );
}
{
  // An active coupon entitlement, exactly as the page would forward it, is reflected untouched.
  const output = buildRestaurantesEligibilityInput(
    baseInput({ rawStatus: "published", couponEntitlementStatus: "active" }),
  );
  assert.deepEqual(output.paidModuleStates, { restaurantes_offers_addon: "active" });
}

/* ------------------------------------------------------------------------------------------ *
 * Read-only guarantee: no lifecycle-kind action is ever eligible for any real Restaurant status,
 * confirming it is safe that the dashboard never calls `resolveEligibleGlobalActions` at all —
 * nothing would be available to render even if a future change mistakenly tried to.
 * ------------------------------------------------------------------------------------------ */

for (const rawStatus of ["pending_payment", "published", "suspended", "archived"]) {
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus }));
  const actions = resolveEligibleGlobalActions(output);
  assert.equal(actions.filter((a) => a.kind === "lifecycle").length, 0, `"${rawStatus}" must expose zero lifecycle descriptors`);
}

console.log(`gate-g3-2-restaurantes-dashboard-lifecycle-pilot-selftest: OK`);
