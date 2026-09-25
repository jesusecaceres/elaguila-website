/**
 * SERVICIOS DESKTOP CANVAS — the trade profile view must never reserve a sidebar track for an empty sidebar.
 *
 * Root cause (2026-09-24): `ServiciosProfileView` put the WHOLE body in a two-column grid
 * (`lg:[1fr_380px] xl:[1fr_400px]`) whose aside held only `ServiciosPromocionesCard`. With no promotions
 * the aside was empty (reserved track); with promotions it still trapped About, Contact & Location,
 * gallery and services in ~839px at 1440. The body is now one full-width canvas column; Promociones
 * (a wide md:2 / lg:4 band by its own design) renders as a section under the coupons row on desktop.
 * The outer canvas tokens (LX_PRO_MAIN_MAX, inner pad) are unchanged.
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

check("no whole-body sidebar: one full-width canvas column, no aside, no reserved track", () => {
  assert.ok(view.includes('data-servicios-trade-canvas="full-width"'));
  assert.ok(view.includes('<div className="grid grid-cols-1 gap-5 sm:gap-8" data-servicios-trade-canvas="full-width">'));
  assert.ok(!view.includes("<aside"), "the Promociones-only rail is gone");
  assert.ok(!view.includes("min(100%,380px)") && !view.includes("_400px]"), "no 380/400px track anywhere in the body grid");
  assert.ok(!view.includes("stickyAsideTop"));
});
check("promotions stay: desktop band in the canvas column + the unchanged mobile/tablet copy, both from the same card", () => {
  assert.ok(/hasOfferSectionResolved\(displayProfile\) \? \(\s*<div className="hidden lg:block" data-servicios-promotions="desktop-band">\s*<ServiciosPromocionesCard/.test(view));
  assert.ok(/<div className="lg:hidden">\s*<ServiciosPromocionesCard/.test(view), "mobile/tablet placement unchanged");
  const card = raw("app/(site)/servicios/components/ServiciosPromocionesCard.tsx");
  assert.ok(card.includes("if (!hasOfferSectionResolved(profile)) return null;"), "empty when there are no promotions (no empty band)");
  assert.ok(card.includes("md:grid-cols-2 lg:grid-cols-4"), "premium promotions card is itself a wide band, not a rail");
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
