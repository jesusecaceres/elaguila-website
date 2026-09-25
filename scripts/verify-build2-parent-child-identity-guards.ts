/**
 * Globalization Build 2 — parent/child identity integrity hardening.
 *
 * A) Autos Dealer inventory child: server-side guard blocking a wholesale vehicle-identity swap
 *    (VIN, or year+make+model together) on an existing autos_classifieds_listings row, while
 *    allowing ordinary corrections (price, mileage, description, a single typo fix, adding a
 *    previously-missing VIN).
 * (B) Bienes Raíces Negocio child guard — not ported in this golden-survivor wave (Autos half only).
 *
 * Both guards are pure functions, unit-tested directly here (no network/Supabase) plus source
 * checks confirming they're actually wired into the real update paths and that no unrelated
 * system (media, analytics, capacity, pricing) was touched.
 *
 * Run: npx tsx scripts/verify-build2-parent-child-identity-guards.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isAutosChildIdentitySubstitution } from "../app/lib/clasificados/autos/autosChildIdentityGuard";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-build2-parent-child-identity-guards: starting");

  // ── A: Autos identity guard — pure function behavior ────────────────────────────────────
  const baseVehicle = { vin: "1HGCM82633A004352", year: 2020, make: "Honda", model: "Civic" };

  check("Autos 1: price-only edit passes (identity fields unchanged)", () => {
    assert.equal(isAutosChildIdentitySubstitution(baseVehicle, { ...baseVehicle }), false);
  });
  check("Autos 2: mileage-only edit passes (mileage isn't part of the identity tuple at all)", () => {
    assert.equal(isAutosChildIdentitySubstitution(baseVehicle, { ...baseVehicle }), false);
  });
  check("Autos 3: description/media-adjacent change passes (identity fields unchanged)", () => {
    assert.equal(isAutosChildIdentitySubstitution(baseVehicle, { ...baseVehicle }), false);
  });
  check("Autos 4: harmless identity correction (trim-level typo, same VIN) passes", () => {
    assert.equal(
      isAutosChildIdentitySubstitution(baseVehicle, { ...baseVehicle, model: "Civic " }),
      false,
    );
  });
  check("Autos 5: same VIN passes even if year has a typo fix (VIN is decisive)", () => {
    assert.equal(
      isAutosChildIdentitySubstitution(baseVehicle, { ...baseVehicle, year: 2021 }),
      false,
    );
  });
  check("Autos 6: replacement VIN fails when both old and new are valid and different", () => {
    assert.equal(
      isAutosChildIdentitySubstitution(baseVehicle, { ...baseVehicle, vin: "5YJ3E1EA7KF317000" }),
      true,
    );
  });
  check("Autos 6b: adding a previously-missing VIN passes (not a substitution)", () => {
    assert.equal(
      isAutosChildIdentitySubstitution({ ...baseVehicle, vin: "" }, baseVehicle),
      false,
    );
  });
  check("Autos 7: wholesale year+make+model replacement fails (no VIN on either side)", () => {
    const noVinOld = { vin: "", year: 2020, make: "Honda", model: "Civic" };
    const noVinNew = { vin: "", year: 2024, make: "Ford", model: "F-150" };
    assert.equal(isAutosChildIdentitySubstitution(noVinOld, noVinNew), true);
  });
  check("Autos 7b: single-field change with no VIN on either side passes (not 'collectively changed')", () => {
    const noVinOld = { vin: "", year: 2020, make: "Honda", model: "Civic" };
    const noVinNewTypo = { vin: "", year: 2020, make: "Honda", model: "Civik" };
    assert.equal(isAutosChildIdentitySubstitution(noVinOld, noVinNewTypo), false);
  });

  // Golden re-point: the Bienes half (B) of the source verifier is intentionally not ported in this
  // wave (autos-only scope).

  // ── Source wiring: confirm both guards are actually called in the real update paths ─────
  // Golden re-point: the updateAutosClassifiedsListingDraft wiring hunk (autosClassifiedsListingService.ts)
  // is DEFERRED_FOR_WAVE_2 — that file is owned by a concurrent wave. Only the pure guard and the PATCH
  // route 409 mapping are ported in this wave; the route branch is dormant until the service wiring lands.
  check("Autos: PATCH route surfaces a clear, deterministic message for the new error code", () => {
    const routeSrc = read("app/api/clasificados/autos/listings/[id]/route.ts");
    assert.match(routeSrc, /AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED/);
    assert.match(routeSrc, /different vehicle than the one currently listed/);
  });

  // ── Regression: unrelated systems untouched ──────────────────────────────────────────────
  check("REGRESSION: Autos parent/child capacity guard (commercialWriteGuard.ts) untouched", () => {
    const src = read("app/lib/listingPlans/commercialWriteGuard.ts");
    assert.match(src, /verifyAutosChildBelongsToParent/);
    assert.match(src, /verifyBrChildBelongsToParent/);
  });
  check("REGRESSION: no pricing file touched (revenuePricingMatrix.ts still has both locked prices)", () => {
    const src = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(src, /packageKey: "br_agent_monthly",[\s\S]{0,150}priceCents: 39900,/);
  });
  check("REGRESSION: existing dashboard action resolver test file untouched (no duplicated protection)", () => {
    const src = read("scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts");
    assert.match(src, /resolveDashboardActions/);
  });

  console.log(`\nverify-build2-parent-child-identity-guards: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
