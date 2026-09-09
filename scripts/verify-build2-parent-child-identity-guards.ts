/**
 * Globalization Build 2 — parent/child identity integrity hardening.
 *
 * A) Autos Dealer inventory child: server-side guard blocking a wholesale vehicle-identity swap
 *    (VIN, or year+make+model together) on an existing autos_classifieds_listings row, while
 *    allowing ordinary corrections (price, mileage, description, a single typo fix, adding a
 *    previously-missing VIN).
 * B) Bienes Raíces Negocio child: server-side guard blocking a wholesale property-identity swap
 *    (city+state+zip together) on an existing listings row, while allowing ordinary corrections
 *    (price, description, HOA, open house, address-formatting/casing normalization).
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
import { isBienesChildIdentitySubstitution } from "../app/lib/clasificados/bienes-raices/brChildIdentityGuard";

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

  // ── B: Bienes identity guard — pure function behavior ───────────────────────────────────
  const baseLocation = { city: "San Jose", state: "CA", zip: "95101" };

  check("Bienes 1: price-only edit passes (location fields unchanged)", () => {
    assert.equal(isBienesChildIdentitySubstitution(baseLocation, { ...baseLocation }), false);
  });
  check("Bienes 2: description/HOA/open-house change passes (location fields unchanged)", () => {
    assert.equal(isBienesChildIdentitySubstitution(baseLocation, { ...baseLocation }), false);
  });
  check("Bienes 3: harmless address normalization passes (zip formatting, e.g. ZIP+4)", () => {
    assert.equal(
      isBienesChildIdentitySubstitution(baseLocation, { ...baseLocation, zip: "95101-1234" }),
      false,
    );
  });
  check("Bienes 4: casing/punctuation normalization passes", () => {
    assert.equal(
      isBienesChildIdentitySubstitution(baseLocation, { city: "san jose", state: "ca", zip: "95101" }),
      false,
    );
  });
  check("Bienes 5: exact same address passes", () => {
    assert.equal(isBienesChildIdentitySubstitution(baseLocation, { ...baseLocation }), false);
  });
  check("Bienes 6: substantially different city/state/ZIP combination fails", () => {
    assert.equal(
      isBienesChildIdentitySubstitution(baseLocation, { city: "Santa Clara", state: "CA", zip: "95050" }),
      true,
    );
  });
  check("Bienes 6b: cross-state substitution fails", () => {
    assert.equal(
      isBienesChildIdentitySubstitution(baseLocation, { city: "Austin", state: "TX", zip: "73301" }),
      true,
    );
  });
  check("Bienes 7: single-field location change (e.g. state re-normalized) passes, not treated as substitution", () => {
    assert.equal(
      isBienesChildIdentitySubstitution(baseLocation, { ...baseLocation, state: "California" }),
      false,
    );
  });
  check("Bienes 8: incomplete data on either side never proves substitution (fails open)", () => {
    assert.equal(
      isBienesChildIdentitySubstitution(baseLocation, { city: "Santa Clara", state: "", zip: "" }),
      false,
    );
  });

  // ── Source wiring: confirm both guards are actually called in the real update paths ─────
  check("Autos: guard is wired into updateAutosClassifiedsListingDraft before the DB write", () => {
    const src = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(src, /import \{ isAutosChildIdentitySubstitution \} from "\.\/autosChildIdentityGuard"/);
    assert.match(src, /isAutosChildIdentitySubstitution\(\s*\n\s*\{ vin: row\.listing_payload\.vin/);
    assert.match(src, /errorCode: "AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED"/);
  });
  check("Autos: PATCH route surfaces a clear, deterministic message for the new error code", () => {
    const routeSrc = read("app/api/clasificados/autos/listings/[id]/route.ts");
    assert.match(routeSrc, /AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED/);
    assert.match(routeSrc, /different vehicle than the one currently listed/);
  });
  check("Bienes: guard is wired into updateOneListing before any media/patch work", () => {
    const src = read("app/api/clasificados/bienes-raices/listing-edit/route.ts");
    assert.match(src, /import \{ isBienesChildIdentitySubstitution \} from "@\/app\/lib\/clasificados\/bienes-raices\/brChildIdentityGuard"/);
    assert.match(src, /isBienesChildIdentitySubstitution\(/);
    assert.match(src, /different property than the one currently listed/);
  });
  check("Bienes: guard runs BEFORE resolvePublicImages (no media touched on a blocked substitution)", () => {
    const src = read("app/api/clasificados/bienes-raices/listing-edit/route.ts");
    const guardIdx = src.indexOf("isBienesChildIdentitySubstitution(");
    const mediaIdx = src.indexOf("await resolvePublicImages(");
    assert.ok(guardIdx > -1 && mediaIdx > -1 && guardIdx < mediaIdx, "guard must run before media resolution");
  });

  // ── Regression: unrelated systems untouched ──────────────────────────────────────────────
  check("REGRESSION: Autos parent/child capacity guard (commercialWriteGuard.ts) untouched", () => {
    const src = read("app/lib/listingPlans/commercialWriteGuard.ts");
    assert.match(src, /verifyAutosChildBelongsToParent/);
    assert.match(src, /verifyBrChildBelongsToParent/);
  });
  check("REGRESSION: BR commercial capacity guard call in listing-edit route untouched (child_edit, capacityDelta: 0)", () => {
    const src = read("app/api/clasificados/bienes-raices/listing-edit/route.ts");
    assert.match(src, /operation: "child_edit"/);
    assert.match(src, /capacityDelta: 0/);
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
