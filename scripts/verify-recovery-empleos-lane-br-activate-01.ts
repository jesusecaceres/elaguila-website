/**
 * RECOVERY PORT (2026-09-25, golden-survivor integration) — two paid-circuit guards semantically ported from
 * integration/category-circuit-closeout-2026-09 (a4a1749b4):
 *
 *  ITEM 1 — Empleos lane forgery (source 1e80c0240, D13 / F1): the lane of a publish envelope is derived from
 *           `payload.lane` (the field the content is built from); a forged top-level `lane:"feria"` over a quick /
 *           premium payload is refused, and the free lane must carry a real feria payload.
 *  ITEM 2 — Bienes Negocio `activate_pending` (source d3ed73abf #6): a main / legacy-null-role row needs an ACTIVE
 *           entitlement for EITHER Bienes base package (Full br_agent_monthly OR Quick br_agent_quick_monthly),
 *           resolved via `businessBasePackageKeys`, never a hardcoded Full-only key.
 *
 * Pure checks against the real policy modules + narrow source pins for server-only files.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-recovery-empleos-lane-br-activate-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const noComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

function feriaPayload(over: Record<string, unknown> = {}) {
  return {
    lane: "feria",
    data: {
      title: "Feria de empleo",
      dateLine: "12 de octubre",
      venue: "Centro comunitario",
      organizer: "Leonix",
      detailsBullets: [],
      secondaryDetails: [],
      ...over,
    },
  };
}

async function main() {
  const policy = await import("../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy");
  const access = await import("../app/lib/listingPlans/businessAccessLevel");
  const matrix = await import("../app/lib/listingPlans/revenuePricingMatrix");

  // ── ITEM 1 — Empleos lane forgery ──────────────────────────────────────────────────────────────
  await check("I1: forged free top-level lane over a quick / premium payload is refused (lane_payload_mismatch)", () => {
    for (const paid of ["quick", "premium"] as const) {
      const forged = policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: { lane: paid, data: { title: "Cocinero" } } }, "publish");
      assert.deepEqual(forged, { ok: false, error: "lane_payload_mismatch" }, `feria over ${paid}`);
      const forgedDraft = policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: { lane: paid, data: { title: "Cocinero" } } }, "draft");
      assert.equal(forgedDraft.ok, false, `draft feria over ${paid}`);
    }
    // reverse direction and a missing top-level lane are mismatches too
    assert.equal(policy.resolveEmpleosEnvelopeLane({ lane: "quick", payload: feriaPayload() }, "publish").ok, false);
    assert.deepEqual(policy.resolveEmpleosEnvelopeLane({ payload: { lane: "quick", data: { title: "X" } } }, "publish"), {
      ok: false,
      error: "lane_payload_mismatch",
    });
    // case / whitespace tricks cannot sneak a mismatch through
    assert.deepEqual(policy.resolveEmpleosEnvelopeLane({ lane: " FERIA ", payload: { lane: "quick", data: { title: "X" } } }, "publish"), {
      ok: false,
      error: "lane_payload_mismatch",
    });
  });

  await check("I1: consistent quick / premium envelopes resolve to their lane and STILL require payment", () => {
    for (const l of ["quick", "premium"] as const) {
      assert.deepEqual(policy.resolveEmpleosEnvelopeLane({ lane: l, payload: { lane: l, data: { title: "Puesto" } } }, "publish"), {
        ok: true,
        lane: l,
      });
      assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: l, existingStatus: null, requireReview: false }), {
        ok: false,
        error: "payment_required",
      });
    }
  });

  await check("I1: a genuine feria envelope resolves to feria and publishes free", () => {
    assert.deepEqual(policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload() }, "publish"), { ok: true, lane: "feria" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "feria", existingStatus: null, requireReview: false }), {
      ok: true,
      lifecycle: "published",
    });
    assert.equal(policy.isEmpleosFreeLane("feria"), true);
    assert.equal(policy.isEmpleosFreeLane("quick"), false);
    assert.equal(policy.isEmpleosFreeLane("premium"), false);
    assert.equal(policy.isEmpleosFreeLane(""), false);
  });

  await check("I1: feria lane requires a real feria payload shape (quick-shaped data under lane feria is refused)", () => {
    const quickShaped = { lane: "feria", payload: { lane: "feria", data: { title: "Cocinero", pay: "$20/h" } } };
    assert.deepEqual(policy.resolveEmpleosEnvelopeLane(quickShaped, "publish"), { ok: false, error: "invalid_feria_payload" });
    assert.deepEqual(policy.resolveEmpleosEnvelopeLane(quickShaped, "draft"), { ok: false, error: "invalid_feria_payload" });
    for (const missing of ["dateLine", "venue", "organizer"]) {
      assert.deepEqual(
        policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload({ [missing]: "  " }) }, "publish"),
        { ok: false, error: "invalid_feria_payload" },
        `blank ${missing}`,
      );
    }
    assert.equal(policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload({ organizer: "" }) }, "draft").ok, true);
    assert.equal(policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload({ detailsBullets: undefined }) }, "draft").ok, false);
    assert.equal(policy.resolveEmpleosEnvelopeLane({ lane: "feria", payload: { lane: "feria" } }, "publish").ok, false);
    assert.equal(policy.resolveEmpleosEnvelopeLane({ lane: "weird", payload: { lane: "weird", data: { title: "x" } } }, "publish").ok, false);
    assert.equal(policy.resolveEmpleosEnvelopeLane(null, "publish").ok, false);
  });

  await check("I1: golden pricing — feria is the only free Empleos lane; job post stays paid (unchanged)", () => {
    const fair = matrix.getRevenuePackageDefinition(matrix.EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY);
    const post = matrix.getRevenuePackageDefinition(matrix.EMPLEOS_JOB_POST_PAID_PACKAGE_KEY);
    assert.ok(fair && post, "both Empleos package definitions exist");
    assert.equal(fair!.priceCents, 0);
    assert.equal(fair!.billingMode, "free");
    assert.ok((post!.priceCents ?? 0) > 0, "job post is paid");
    assert.notEqual(post!.billingMode, "free");
  });

  await check("I1 source: upsert derives the lane BEFORE any DB access and never reads envelope.lane for a decision", () => {
    const s = raw("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
    const fn = s.slice(s.indexOf("export async function upsertEmpleosListingFromEnvelope"), s.indexOf("export async function fetchEmpleosPublishedJobRecords"));
    assert.ok(fn.length > 500, "upsert function located");
    assert.match(fn, /resolveEmpleosEnvelopeLane\(input\.envelope, input\.mode\)/);
    assert.ok(fn.indexOf("resolveEmpleosEnvelopeLane") < fn.indexOf("getAdminSupabase()"), "lane check runs before any DB access");
    const code = noComments(fn);
    assert.doesNotMatch(code, /input\.envelope\.lane/, "top-level envelope lane never read");
    assert.equal((code.match(/input\.envelope/g) ?? []).length, 2, "input.envelope only feeds the resolver + normalised copy");
    assert.match(fn, /\{ \.\.\.input\.envelope, lane: authoritativeLane \}/);
    assert.match(fn, /existingLane && existingLane !== authoritativeLane/);
    assert.match(fn, /lane: existing \? \(existing as EmpleosPublicListingRow\)\.lane : authoritativeLane/);
    // golden's assisted-custody owner rule is preserved (the source predates it)
    assert.match(fn, /resolveEmpleosRowOwner\(/);
    assert.match(fn, /assistedCustody: input\.assistedCustody === true/);
  });

  await check("I1 source: listings route maps the lane-resolver refusals to 400 and keeps assisted custody", () => {
    const route = raw("app/api/clasificados/empleos/listings/route.ts");
    for (const code of ["lane_payload_mismatch", "invalid_lane", "invalid_envelope", "invalid_feria_payload", "lane_mismatch"]) {
      assert.ok(route.includes(`res.error === "${code}"`), `route maps ${code}`);
    }
    assert.match(route, /assistedCustody: assistedCustodyProven/);
    assert.match(route, /publish_via_cockpit_only/);
  });

  await check("I1 source: client builders stamp the top-level lane from payload.lane (legit envelopes are consistent)", () => {
    const b = raw("app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts");
    assert.match(b, /lane: payload\.lane,/);
  });

  // ── ITEM 2 — BR Negocio activate_pending entitlement ─────────────────────────────────────────────
  await check("I2: businessBasePackageKeys('bienes-raices') covers BOTH Full (PRO) and Quick (BASE)", () => {
    const keys = access.businessBasePackageKeys("bienes-raices");
    assert.deepEqual([...keys].sort(), ["br_agent_monthly", "br_agent_quick_monthly"]);
    assert.equal(access.isBusinessBasePackageKey("bienes-raices", "br_agent_monthly"), true);
    assert.equal(access.isBusinessBasePackageKey("bienes-raices", "br_agent_quick_monthly"), true);
    assert.equal(access.isBusinessBasePackageKey("bienes-raices", "br_inventory_pack_monthly"), false);
  });

  await check("I2 source: applyBrActivatePending requires an ACTIVE entitlement for either base key on main rows", () => {
    const s = raw("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
    const start = s.indexOf("async function applyBrActivatePending");
    const fn = s.slice(start, s.indexOf("\nasync function ", start + 10));
    assert.ok(start > 0 && fn.length > 300, "function located");
    const code = noComments(fn);
    assert.match(code, /row\.inventory_role !== "inventory_property" && brPublishPaymentRequired\("negocio"\)/);
    assert.match(code, /for \(const packageKey of businessBasePackageKeys\("bienes-raices"\)\)/);
    assert.match(code, /fetchAddonEntitlementsForListings\(\{\s*category: "bienes-raices",\s*packageKey,/);
    assert.match(code, /\.status === "active"/);
    assert.doesNotMatch(code, /packageKey: "br_agent_monthly"/, "no hardcoded Full-only key (would block BASE customers)");
    assert.ok(code.indexOf("hasActiveBaseEntitlement") < code.indexOf("activateBrNegocioListingAtomic"), "gate runs before the RPC");
    assert.match(s, /import \{ businessBasePackageKeys \} from "@\/app\/lib\/listingPlans\/businessAccessLevel";/);
    assert.match(s, /import \{ brPublishPaymentRequired \} from "\.\/brPublishPaymentPolicy";/);
  });

  await check("I2 source: capacity RPC call + child gate untouched; payment fulfillment does not route through activate_pending", () => {
    const s = raw("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
    assert.match(s, /activateBrNegocioListingAtomic\(\{ listingId: row\.id, ownerId, fromStatus: "pending" \}\)/);
    assert.match(s, /requireActiveBrParentForChildResume\(row\)/);
    const pay = noComments(raw("app/lib/clasificados/bienes-raices/brListingPaymentService.ts"));
    assert.doesNotMatch(pay, /applyBrLifecycleMutation|brListingLifecycleService/, "fulfillment path is independent");
    for (const r of [
      "app/api/clasificados/leonix/stripe/webhook/route.ts",
      "app/api/clasificados/leonix/stripe/checkout/verify/route.ts",
    ]) {
      const src = raw(r);
      assert.match(src, /tryActivateBrListingAfterPayment/, `${r} activates via payment service`);
      assert.doesNotMatch(src, /activate_pending/, `${r} never uses activate_pending`);
    }
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error("FAIL verify-recovery-empleos-lane-br-activate-01");
    process.exit(1);
  }
  console.log("PASS verify-recovery-empleos-lane-br-activate-01");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
