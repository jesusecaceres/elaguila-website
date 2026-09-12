/**
 * Owner Shared Specialized-Tools Gate — focused structural verifier. Same hand-rolled
 * node:assert + source-text-inspection convention as
 * scripts/verify-business-home-owner-bridge-01.ts (no render environment required — this
 * verifies the shared contract shape and every caller's wiring by reading source text, not by
 * mounting React components).
 *
 * Run from repo root: npx tsx scripts/verify-owner-shared-specialized-tools-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Owner Shared Specialized-Tools Gate — focused structural tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const workspaceText = read("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx");
const helperText = read("app/(site)/dashboard/lib/ownerBusinessToolsSpecializedGroup.ts");
const serviciosText = read("app/(site)/dashboard/servicios/page.tsx");
const restaurantesText = read("app/(site)/dashboard/restaurantes/page.tsx");
const autosDealerText = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
const misAnunciosIdText = read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx");
const empleosText = read("app/(site)/dashboard/empleos/page.tsx");
const empleosListingText = read("app/(site)/dashboard/empleos/[listingId]/page.tsx");
const viajesText = read("app/(site)/dashboard/viajes/page.tsx");
const ofertasText = read("app/(site)/dashboard/ofertas-locales/page.tsx");
const ofertasIdText = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const comidaLocalText = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");

// --- Shared contract shape ------------------------------------------------------------------

check("OwnerEntityWorkspace exports OwnerEntitySpecializedGroup", () => {
  assert.match(workspaceText, /export type OwnerEntitySpecializedGroup = \{ title: string; actions: ActionItem\[\]; children\?: ReactNode \}/);
});

check("specialized prop accepts a single group OR an array of groups", () => {
  assert.match(workspaceText, /specialized\?: OwnerEntitySpecializedGroup \| OwnerEntitySpecializedGroup\[\]/);
});

check("normalizes single-or-array via Array.isArray (no caller-visible branching)", () => {
  assert.match(workspaceText, /Array\.isArray\(specialized\)\s*\?\s*specialized\s*:\s*\[specialized\]/);
});

check("empty groups (no actions, no children) are filtered out", () => {
  assert.match(workspaceText, /\.filter\(\(group\) => group\.actions\.length > 0 \|\| Boolean\(group\.children\)\)/);
});

check("overflow (mobile sheet) actions come from every group, not just one", () => {
  assert.match(workspaceText, /specializedGroups\.flatMap\(\(group\) => group\.actions\)/);
});

check("groups render via .map (deterministic caller-supplied order, no re-sorting)", () => {
  assert.match(workspaceText, /specializedGroups\.map\(\(group, index\) =>/);
});

// --- Shared businessTools adapter --------------------------------------------------------------

check("ownerBusinessToolsSpecializedGroup gates on isLiveCapability (never fabricates the capability)", () => {
  assert.match(helperText, /if \(!isLiveCapability\(businessToolsCapability\)\) return null;/);
});

check("ownerBusinessToolsSpecializedGroup points at the one real destination (/dashboard/business-tools), no new route", () => {
  assert.match(helperText, /`\/dashboard\/business-tools\?lang=\$\{lang\}`/);
});

check("ownerBusinessToolsSpecializedGroup uses the gold/premium CTA tone", () => {
  assert.match(helperText, /tone:\s*"premium"/);
});

// --- Affected callers wire the new group without discarding their existing one -----------------

for (const [name, text] of [
  ["servicios/page.tsx", serviciosText],
  ["restaurantes/page.tsx", restaurantesText],
  ["AutosDealerInventoryDashboardSection.tsx", autosDealerText],
  ["mis-anuncios/[id]/page.tsx", misAnunciosIdText],
] as const) {
  check(`${name} imports ownerBusinessToolsSpecializedGroup`, () => {
    assert.match(text, /import \{ ownerBusinessToolsSpecializedGroup \}/);
  });
  check(`${name} passes specialized as an array (multi-group)`, () => {
    assert.match(text, /specialized=\{\[/);
  });
  check(`${name} calls ownerBusinessToolsSpecializedGroup inside that array`, () => {
    assert.match(text, /ownerBusinessToolsSpecializedGroup\(/);
  });
  check(`${name} filters out null groups with a type guard (never renders a null group)`, () => {
    assert.match(text, /\.filter\(\(group\): group is OwnerEntitySpecializedGroup => group !== null\)/);
  });
}

check("AutosDealerInventoryDashboardSection keeps its existing inventory children alongside the new group", () => {
  assert.match(autosDealerText, /children:\s*\(/);
  assert.match(autosDealerText, /ownerInventoryModuleTitle\(lang\)/);
});

check("mis-anuncios/[id]/page.tsx keeps its existing category-native group as the first array element", () => {
  assert.match(
    misAnunciosIdText,
    /\{ title: isBrNegocio \? ownerToolsTitle\(lang\) : t\.visibilityTitle, actions: specializedActions \}/,
  );
});

// --- Unaffected callers are untouched (backward compatibility / no unrelated redesign) ---------

for (const [name, text] of [
  ["empleos/page.tsx", empleosText],
  ["empleos/[listingId]/page.tsx", empleosListingText],
  ["ofertas-locales/page.tsx", ofertasText],
  ["ofertas-locales/[id]/page.tsx", ofertasIdText],
] as const) {
  check(`${name} still passes a single-object specialized (untouched, still valid under the new type)`, () => {
    assert.doesNotMatch(text, /ownerBusinessToolsSpecializedGroup/);
    assert.doesNotMatch(text, /specialized=\{\[/);
  });
}

check("viajes/page.tsx never referenced specialized (untouched)", () => {
  assert.doesNotMatch(viajesText, /specialized[:=]/);
});

check("ComidaLocalDashboardListings.tsx never referenced specialized (untouched — registry says businessTools unsupported)", () => {
  assert.doesNotMatch(comidaLocalText, /specialized[:=]/);
});

console.log(`\n${passed} checks passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks PASSED.");
}
