/**
 * SERVICIOS DESKTOP CANVAS — the trade profile view must never reserve a sidebar track for an empty sidebar.
 *
 * Root cause (2026-09-24): `ServiciosProfileView` always rendered a two-column grid
 * (`lg:[1fr_380px] xl:[1fr_400px]`) with an `<aside>` that holds only `ServiciosPromocionesCard`, which
 * returns null without promotions. A listing with no promotions therefore rendered its whole profile
 * (hero-adjacent About, Contact & Location hub, services, gallery) in a ~839px column beside an EMPTY
 * ~400px track at 1440. The sidebar column now exists only when it has content; without it the profile
 * takes the full canvas. The outer canvas tokens (LX_PRO_MAIN_MAX, inner pad) are unchanged.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-servicios-desktop-canvas-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

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
const view = raw("app/(site)/servicios/components/ServiciosProfileView.tsx");
const brand = raw("app/(site)/servicios/components/serviciosLeonixBrand.ts");

check("the sidebar decision comes from the same predicate the sidebar card uses", () => {
  assert.ok(view.includes("const hasSidebar = hasOfferSectionResolved(displayProfile);"));
  const card = raw("app/(site)/servicios/components/ServiciosPromocionesCard.tsx");
  assert.ok(card.includes("if (!hasOfferSectionResolved(profile)) return null;"), "card is empty exactly when the predicate is false");
});
check("two-column grid only with a sidebar; full-width single column otherwise", () => {
  assert.ok(/hasSidebar\s*\?\s*"grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-\[minmax\(0,1fr\)_min\(100%,380px\)\] lg:gap-10 xl:grid-cols-\[minmax\(0,1fr\)_400px\]"\s*:\s*"grid grid-cols-1 gap-5 sm:gap-8"/.test(view));
  assert.ok(view.includes('data-servicios-trade-grid={hasSidebar ? "with-sidebar" : "full-width"}'));
});
check("the <aside> is not rendered at all without a sidebar (no empty track, no empty sticky box)", () => {
  assert.ok(/\{hasSidebar \? \(\s*<aside/.test(view));
});
check("outer canvas contract untouched: shared main max width and inner padding tokens", () => {
  assert.ok(brand.includes('export const LX_PRO_MAIN_MAX = "mx-auto w-full max-w-[1440px]";'));
  assert.ok(brand.includes('export const LX_PRO_INNER_PAD = "px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10";'));
  assert.ok(view.includes("<main className={`${LX_PRO_MAIN_MAX} px-3 py-4 sm:px-6 sm:py-6 lg:px-8`}"));
});
check("Preview and public detail share the same view (one contract, no second shell)", () => {
  const preview = raw("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  const page = raw("app/(site)/clasificados/servicios/[slug]/page.tsx");
  assert.ok(preview.includes("<ServiciosProfileView") && page.includes("<ServiciosProfileView"));
});
check("no other category or entitlement file is touched by this repair", () => {
  const changed = execSync("git diff --name-only HEAD -- \"app/(site)/clasificados/restaurantes\" \"app/(site)/clasificados/autos\" \"app/(site)/clasificados/bienes-raices\" app/lib/listingPlans app/lib/quickBusiness", { encoding: "utf8" }).trim();
  assert.equal(changed, "", "working tree must not modify Restaurantes/Autos/Bienes/entitlement files");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-servicios-desktop-canvas-01: all checks passed");
