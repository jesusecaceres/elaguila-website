/**
 * RECOVERY WAVE 2 (2026-09-25) — hunks deferred from the shared-globalization port because other lanes owned the files.
 *   - 651abd4eb: Autos update path refuses a wholesale vehicle-identity swap on an existing row (service wiring).
 *   - 605dd9ed3: Clases/Comunidad capability registry tells the truth (like/save unsupported; mascotas untouched).
 *   - bd2ee01e1: dashboard editor warns when unpersistable media is dropped.
 *   - 3eacdec9d: Rentas detail threads the owner id into Save/Like so owners cannot engage their own listing.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-recovery-wave2-deferred-hunks-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { isAutosChildIdentitySubstitution } from "../app/lib/clasificados/autos/autosChildIdentityGuard";
import { OWNER_ENTITY_CAPABILITIES } from "../app/(site)/dashboard/lib/ownerEntityCapabilityRegistry";

const read = (p: string) => readFileSync(p, "utf8");
let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`OK: ${name}`);
}

check("Autos service wires the identity-substitution guard before the UPDATE", () => {
  const s = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const guard = s.indexOf("isAutosChildIdentitySubstitution(");
  const update = s.indexOf('.update(write)');
  assert.ok(guard > 0 && update > guard, "guard must run before the update");
  assert.ok(s.includes('errorCode: "AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED"'));
  const route = read("app/api/clasificados/autos/listings/[id]/route.ts");
  assert.ok(route.includes("AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED") && route.includes("409"));
});

check("Autos guard: corrections allowed, swaps blocked", () => {
  const civic = { vin: "1HGCM82633A004352", year: 2020, make: "Honda", model: "Civic" };
  assert.equal(isAutosChildIdentitySubstitution(civic, { ...civic, year: 2021 }), false);
  assert.equal(isAutosChildIdentitySubstitution({ ...civic, vin: "" }, civic), false, "adding a VIN is a correction");
  assert.equal(isAutosChildIdentitySubstitution(civic, { ...civic, vin: "2FTRX18W1XCA12345" }), true);
  assert.equal(
    isAutosChildIdentitySubstitution({ year: 2020, make: "Honda", model: "Civic" }, { year: 2024, make: "Ford", model: "F-150" }),
    true,
  );
});

check("capability registry: Clases/Comunidad like/save unsupported; Mascotas report left as golden", () => {
  for (const k of ["clases", "comunidad"] as const) {
    const e = OWNER_ENTITY_CAPABILITIES[k].engagement;
    assert.equal(e.like, "unsupported");
    assert.equal(e.save, "unsupported");
    assert.equal(e.share, "supported");
    assert.equal(e.report, "supported");
  }
  assert.equal(OWNER_ENTITY_CAPABILITIES["mascotas-y-perdidos"].engagement.report, "unsupported");
});

check("dashboard editor warns on dropped unpersistable media at every media mutation", () => {
  const s = read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
  assert.ok(s.includes("warnDroppedUnpersistableMedia"));
  for (const ctx of ["upload", "remove", "reorder", "hero"]) {
    assert.ok(s.includes(`dashboard-mis-anuncios-editar-${ctx}`), `context ${ctx}`);
  }
});

check("Rentas detail threads owner id into Save and Like (Privado + Negocio)", () => {
  const d = read("app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx");
  assert.equal((d.match(/ownerId=\{listing\.ownerId\}/g) ?? []).length, 2, "both branches pass ownerId");
  assert.ok(/<LeonixSaveButton[\s\S]{0,120}ownerUserId=\{listing\.ownerId\}/.test(d));
  const v = read("app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx");
  assert.ok(/<LeonixLikeButton[\s\S]{0,120}ownerUserId=\{ownerId\}/.test(v));
});

console.log(`verify-recovery-wave2-deferred-hunks-01: ${passed}/5 checks passed`);
