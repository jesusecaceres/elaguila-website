/**
 * Globalization Build D-S — Gate DS7 (Comida Local Admin monetization branch) + Gate DS8
 * (Servicios Additional Websites lifecycle).
 * Run: npx tsx scripts/verify-ds7-ds8-comida-admin-and-servicios-websites.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
  console.log("verify-ds7-ds8-comida-admin-and-servicios-websites: starting");

  // ── DS7 ──────────────────────────────────────────────────────────────────────────────────
  const adPlans = read("app/lib/listingPlans/categoryAdPlans.ts");
  check("categoryAdPlans has a real comida-local branch, not a fallback guess", () => {
    assert.match(adPlans, /if \(cat === "comida-local"\)/);
    assert.match(adPlans, /"comida_local_paid_business"/);
  });
  check("comida_local_public source maps to the comida-local category", () => {
    assert.match(adPlans, /if \(st\.includes\("comida_local_public"\)\) return "comida-local";/);
  });

  const monetization = read("app/lib/listingPlans/categoryListingMonetization.ts");
  check("comida-local is in the supported category slugs and pipeline classification (not silently unknown)", () => {
    assert.match(monetization, /"comida-local",/);
    assert.match(monetization, /case "comida-local":\s*\n\s*return "FOOD_BUSINESS_PROFILE";/);
  });
  check("Servicios/Restaurantes/Autos/Bienes branches are untouched (still present verbatim)", () => {
    assert.match(monetization, /case "restaurantes":\s*\n\s*return "RESTAURANT_PROFILE";/);
  });

  const adminListings = read("app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx");
  check("Comida Local admin table renders the real shared monetization summary with the real category/source", () => {
    assert.match(adminListings, /category="comida-local"/);
    assert.match(adminListings, /source="comida_local_public_listings"/);
  });

  // ── DS8 ──────────────────────────────────────────────────────────────────────────────────
  const svcTypes = read(
    "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts",
  );
  check("Servicios application state declares additionalWebsites using the shared type", () => {
    assert.match(svcTypes, /additionalWebsites: AdditionalWebsiteEntry\[\];/);
  });

  const svcForm = read(
    "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  );
  check("Servicios form supports add/remove of repeatable entries (not read-only, not a stub)", () => {
    assert.match(svcForm, /additionalWebsites: \[\.\.\.s\.additionalWebsites, \{ label: "", url: "" \}\]/);
    assert.match(svcForm, /additionalWebsites: s\.additionalWebsites\.filter\(\(_, i\) => i !== index\)/);
  });
  check("Servicios form caps at 8 entries (matches the shared sanitizer's own cap)", () => {
    assert.match(svcForm, /state\.additionalWebsites\.length < 8/);
  });

  const publishMapper = read(
    "app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts",
  );
  check("Publish mapper sanitizes entries at save time (drops half-filled rows)", () => {
    assert.match(publishMapper, /sanitizeAdditionalWebsiteEntries\(state\.additionalWebsites\)/);
  });

  const resolver = read("app/(site)/servicios/lib/resolveServiciosProfile.ts");
  check("Public resolver URL-validates each entry before exposing it (no unsafe href)", () => {
    assert.match(resolver, /safeExternalWebsiteHref\(entry\?\.url\)/);
  });

  console.log(
    `\nverify-ds7-ds8-comida-admin-and-servicios-websites: ${checks - failures}/${checks} checks passed`,
  );
  if (failures > 0) process.exitCode = 1;
}

main();
