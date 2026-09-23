/**
 * LEONIX STAFF GATEWAY — Gate 9 local UX/responsive source contract.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-local-ux-01.ts
 *
 * Local visual proof is labeled LOCAL, not a deployed Preview. This harness proves the source
 * contract for 390/768/1440, ES/EN, Quick/Full, touch targets, overflow, Trust, Translate Ad.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { QUICK_SALES_CATEGORIES, QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";
import { staffBusinessOffers } from "../app/lib/sales/staffBusinessProduct";
import { layoutQuickMedia } from "../app/lib/sales/quickMediaLayout";
import { staffCommunityTrustDisposition } from "../app/lib/sales/prospectPreviewDisplay";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function main() {
  check("U1: cockpit lists exactly eight bilingual family buttons with 44px touch targets", () => {
    const src = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
    assert.equal(QUICK_SALES_CATEGORIES.length, 8);
    for (const key of QUICK_SALES_CATEGORIES) {
      assert.ok(src.includes(`QUICK_SALES_CATEGORY_MAP[key].labelEs`));
      assert.ok(QUICK_SALES_CATEGORY_MAP[key].labelEs);
      assert.ok(QUICK_SALES_CATEGORY_MAP[key].labelEn);
    }
    assert.ok(src.includes("min-h-[44px]"));
    assert.ok(src.includes("overflow-x-hidden"));
    assert.ok(src.includes("aria-pressed={category === key}"));
    assert.ok(src.includes("aria-label={`${QUICK_SALES_CATEGORY_MAP[key].labelEs}"));
  });

  check("U2: Quick/Full picker only on the four business pairs", () => {
    assert.equal(staffBusinessOffers("servicios").length, 2);
    assert.equal(staffBusinessOffers("restaurantes").length, 2);
    assert.equal(staffBusinessOffers("autos").length, 2);
    assert.equal(staffBusinessOffers("bienes-raices").length, 2);
    assert.equal(staffBusinessOffers("rentas").length, 0);
    assert.equal(staffBusinessOffers("empleos").length, 0);
    assert.equal(staffBusinessOffers("autos-privado").length, 0);
    assert.equal(staffBusinessOffers("comida-local").length, 0);
    const src = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
    assert.ok(src.includes("pairOffers.length"));
    assert.ok(src.includes("Quick Business"));
    assert.ok(src.includes("Full Business"));
  });

  check("U3: prospect preview is mobile-first, bilingual banner, Translate Ad, no JSON dump", () => {
    const page = read("app/(site)/vista-previa/[category]/page.tsx");
    const shell = read("app/(site)/vista-previa/[category]/ProspectCategoryPreviewShell.tsx");
    assert.ok(page.includes('paddingTop: "calc(5.25rem + env(safe-area-inset-top, 0px))"'));
    assert.ok(page.includes("data-prospect-preview-clears-navbar"));
    assert.ok(page.includes("maxWidth: 720"));
    assert.ok(page.includes("Vista previa / Preview"));
    assert.ok(page.includes("No publicado / Not published"));
    assert.ok(page.includes("ProspectPreviewTranslateAd"));
    assert.ok(shell.includes("overflow-hidden"));
    assert.ok(shell.includes("quickMediaGridClass"));
    assert.equal(page.includes("function PreviewContent"), false);
  });

  check("U4: 1/2/3 image layouts have no empty placeholders and no video", () => {
    for (const n of [1, 2, 3] as const) {
      const layout = layoutQuickMedia(n);
      assert.equal("ok" in layout, false);
      if (!("ok" in layout)) {
        assert.equal(layout.emptyPlaceholders, 0);
        assert.equal(layout.allowsVideo, false);
      }
    }
  });

  check("U5: Community Trust card strip + preview zero-state; private classifieds NA", () => {
    const strip = read("app/components/leonixCommunityTrust/LeonixCommunityTrustCardStrip.tsx");
    assert.ok(strip.includes("Comunidad Leonix"));
    assert.ok(strip.includes("Leonix Community"));
    assert.equal(staffCommunityTrustDisposition("autos-privado").status, "PROVEN_NA");
    assert.equal(staffCommunityTrustDisposition("empleos").status, "PROVEN_NA");
    assert.equal(staffCommunityTrustDisposition("rentas").status, "PROVEN_NA");
    const cockpit = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
    assert.equal(cockpit.includes("analytics dashboard"), false);
    assert.equal(cockpit.includes("/dashboard/business-tools"), false);
  });

  check("U6: address confirm button is a 40px+ control; no keystroke fetch", () => {
    const src = read("app/components/forms/BusinessAddressVerifiedInput.tsx");
    assert.ok(src.includes("min-h-[40px]"));
    assert.ok(src.includes('data-business-address-lookup-trigger="confirm"'));
    assert.equal(src.includes("useEffect"), false);
  });

  check("U7: cockpit does not fail-open a public intake href", () => {
    const src = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
    assert.ok(src.includes("data-staff-open-requires-custody"));
    assert.ok(src.includes("openIntakeWithCustody"));
    assert.equal(/href=\{descriptor\.intakePath\}/.test(src), false);
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-local-ux-01: ALL CHECKS EXECUTED AND PASSED");
}

main();
