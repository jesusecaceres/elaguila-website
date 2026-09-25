/**
 * LEONIX STAFF GATEWAY — Gate 5 media / Leonix preview / address bounding / Community Trust.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-media-preview-trust-01.ts
 *
 * No live Google/Stripe/DB writes. Preview display and address lookup policy execute as pure code.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { layoutQuickMedia } from "../app/lib/sales/quickMediaLayout";
import {
  buildProspectLeonixPreviewVm,
  extractProspectPreviewImages,
  staffCommunityTrustDisposition,
} from "../app/lib/sales/prospectPreviewDisplay";
import { shouldFetchAddressSuggestions } from "../app/lib/businessAddress/businessAddressLookupPolicy";
import { aggregateEndorsementCounts } from "../app/lib/leonixCommunityTrust/leonixEndorsementCountBatch";
import { QUICK_BUSINESS_SEMANTIC_LIMITS } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { isLeonixEndorsementCategory } from "../app/lib/leonixCommunityTrust/leonixEndorsementRegistry";
import type { QuickSalesCategory } from "../app/lib/sales/quickSalesCategories";

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
  check("A1: prospect preview page is Leonix-style, not a JSON dump", () => {
    // OWNER LOCK (real components): this pins the GENERIC prospect shell, now used ONLY by the four out-of-scope
    // families (rentas, empleos, autos-privado, comida-local). servicios / restaurantes / autos / bienes-raices
    // render the real public components - see verify-prospect-preview-real-components-01.ts.
    const page = read("app/(site)/vista-previa/[category]/page.tsx");
    const shell = read("app/(site)/vista-previa/[category]/ProspectCategoryPreviewShell.tsx");
    assert.ok(page.includes("ProspectCategoryPreviewShell"));
    assert.ok(page.includes("buildProspectLeonixPreviewVm"));
    assert.equal(page.includes("function PreviewContent"), false);
    assert.equal(page.includes("styles.listKey"), false);
    assert.ok(shell.includes('data-prospect-leonix-preview="1"'));
    assert.ok(shell.includes('data-prospect-preview-json-dump="0"'));
    assert.ok(shell.includes("LeonixCommunityTrust"));
    assert.ok(shell.includes("preview"));
  });

  check("A2: 1 image is hero + info panel; 2 is hero+support; 3 is hero+two supports; 0 and 4 fail", () => {
    // layoutQuickMedia is still the 1-3 image layout for the four generic-shell families only; the four
    // business families get their gallery from the real public components instead.
    assert.deepEqual(layoutQuickMedia(0), { ok: false, error: "too_few" });
    assert.deepEqual(layoutQuickMedia(4), { ok: false, error: "too_many" });
    const one = layoutQuickMedia(1);
    assert.equal("ok" in one, false);
    if (!("ok" in one)) {
      assert.equal(one.imageCount, 1);
      assert.equal(one.allowsVideo, false);
      assert.equal(one.emptyPlaceholders, 0);
      assert.deepEqual(one.slots.map((s) => s.kind), ["hero", "info_panel"]);
    }
    const two = layoutQuickMedia(2);
    if (!("ok" in two)) assert.deepEqual(two.slots.map((s) => s.kind), ["hero", "support"]);
    const three = layoutQuickMedia(3);
    if (!("ok" in three)) {
      assert.equal(three.slots.length, 3);
      assert.equal(three.slots[2]?.kind, "support");
    }
  });

  check("A3: extractor never fabricates stock images and caps at 3", () => {
    const none = extractProspectPreviewImages({ description: "text only" }, "Shop");
    assert.deepEqual(none, []);
    const stock = extractProspectPreviewImages({ gallery: ["picsum.photos/400"] }, "Shop");
    assert.deepEqual(stock, []);
    const three = extractProspectPreviewImages(
      {
        gallery: [
          "https://cdn.example.test/1.jpg",
          "https://cdn.example.test/2.jpg",
          "https://cdn.example.test/3.jpg",
          "https://cdn.example.test/4.jpg",
        ],
      },
      "Shop",
    );
    assert.equal(three.length, 3);
    assert.equal(three[0]?.role, "hero");
    assert.equal(three[1]?.role, "support");
  });

  check("A4: Quick Business semantic media is category-aware (ceiling 8), no video", () => {
    assert.equal(QUICK_BUSINESS_SEMANTIC_LIMITS.minSubjectImages, 1);
    assert.equal(QUICK_BUSINESS_SEMANTIC_LIMITS.maxImages, 8); // ceiling across families; per-family caps live in QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY
    assert.equal(QUICK_BUSINESS_SEMANTIC_LIMITS.videoAllowed, false);
  });

  check("A5: Leonix preview VM maps title/location/description/images/contacts", () => {
    const vm = buildProspectLeonixPreviewVm({
      category: "servicios",
      title: "A-1 Plumbing",
      city: "San José",
      state: "CA",
      content: {
        aboutText: "José's Auto Repair adjacent plumbing.",
        phone: "4085550100",
        smsNumber: "4085550101",
        whatsapp: "4085550102",
        gallery: ["https://cdn.example.test/work.jpg"],
      },
    });
    assert.equal(vm.title, "A-1 Plumbing");
    assert.equal(vm.location, "San José, CA");
    assert.equal(vm.description?.includes("José"), true);
    assert.equal(vm.images.length, 1);
    assert.equal(vm.contacts.length, 3);
    assert.equal(vm.trustCategory, "servicios");
  });

  check("B1: address lookup is refused on keystroke/debounce/reopen; allowed only on confirm/save", () => {
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "keystroke", streetLength: 12, alreadyConfirmed: false }),
      false,
    );
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "debounce", streetLength: 12, alreadyConfirmed: false }),
      false,
    );
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "input", streetLength: 12, alreadyConfirmed: false }),
      false,
    );
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "reopen_unchanged", streetLength: 24, alreadyConfirmed: true }),
      false,
    );
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "confirm", streetLength: 4, alreadyConfirmed: false }),
      false,
    );
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "confirm", streetLength: 12, alreadyConfirmed: false }),
      true,
    );
    assert.equal(
      shouldFetchAddressSuggestions({
        trigger: "confirm",
        streetLength: 12,
        alreadyConfirmed: true,
        streetUnchanged: true,
      }),
      false,
    );
    assert.equal(
      shouldFetchAddressSuggestions({ trigger: "save", streetLength: 18, alreadyConfirmed: false }),
      true,
    );
  });

  check("B2: BusinessAddressVerifiedInput has no useEffect fetch; lookup is an explicit button", () => {
    const src = read("app/components/forms/BusinessAddressVerifiedInput.tsx");
    assert.equal(src.includes("useEffect"), false);
    assert.equal(src.includes("setTimeout"), false);
    assert.ok(src.includes('data-business-address-lookup-trigger="confirm"'));
    assert.ok(src.includes("shouldFetchAddressSuggestions"));
    assert.ok(src.includes("runExplicitLookup"));
    assert.ok(src.includes("ADDRESS_SUGGEST_PATH"));
  });

  check("C1: Community Trust registry eligibility for the eight families", () => {
    const expected: Record<QuickSalesCategory, "TRUE" | "PROVEN_NA"> = {
      servicios: "TRUE",
      restaurantes: "TRUE",
      "comida-local": "TRUE",
      "bienes-raices": "TRUE",
      rentas: "PROVEN_NA",
      empleos: "PROVEN_NA",
      "autos-privado": "PROVEN_NA",
      autos: "PROVEN_NA",
    };
    for (const [family, status] of Object.entries(expected) as [QuickSalesCategory, "TRUE" | "PROVEN_NA"][]) {
      const d = staffCommunityTrustDisposition(family);
      assert.equal(d.status, status, family);
      if (d.status === "TRUE") assert.equal(isLeonixEndorsementCategory(d.category), true);
    }
    assert.equal(isLeonixEndorsementCategory("autos"), false);
    assert.equal(isLeonixEndorsementCategory("empleos"), false);
    assert.equal(isLeonixEndorsementCategory("rentas"), false);
  });

  check("C2: card strips reuse Servicios visual language; details reuse LeonixCommunityTrust", () => {
    const servicios = read("app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx");
    assert.ok(servicios.includes('data-servicios-card-trust-strip="1"'));
    const resta = read("app/(site)/clasificados/restaurantes/shell/RestaurantePreviewCard.tsx");
    assert.ok(resta.includes("LeonixCommunityTrustCardStrip"));
    assert.ok(resta.includes('data-servicios-card-trust-strip="1"'));
    const comida = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
    assert.ok(comida.includes("LeonixCommunityTrustCardStrip"));
    const bienes = read("app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx");
    assert.ok(bienes.includes("LeonixCommunityTrustCardStrip"));
    const hub = read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx");
    assert.ok(hub.includes("<LeonixCommunityTrust"));
    const comidaDetail = read("app/(site)/clasificados/comida-local/components/ComidaLocalPublicDetailClient.tsx");
    assert.ok(comidaDetail.includes("<LeonixCommunityTrust"));
    const serviciosHub = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
    assert.ok(serviciosHub.includes("<LeonixCommunityTrust"));
  });

  check("C3: bulk counts derive from leonix_endorsement_votes only", () => {
    const counts = aggregateEndorsementCounts(
      [{ target_id: "a" }, { target_id: "a" }, { target_id: "b" }, { target_id: "z" }],
      ["a", "b"],
    );
    assert.equal(counts.get("a"), 2);
    assert.equal(counts.get("b"), 1);
    assert.equal(counts.has("z"), false);
    const batch = read("app/lib/leonixCommunityTrust/leonixEndorsementCountBatch.ts");
    assert.ok(batch.includes('leonix_endorsement_votes'));
    assert.equal(batch.includes("leonix_trust_"), false);
  });

  check("C4: private preview Trust is preview=true (honest zero, no fetch/write)", () => {
    const widget = read("app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx");
    assert.ok(widget.includes("preview = false"));
    assert.ok(widget.includes("if (preview)"));
    assert.ok(widget.includes("count: 0"));
    assert.ok(widget.includes("disabled={busy || preview}"));
    const shell = read("app/(site)/vista-previa/[category]/ProspectCategoryPreviewShell.tsx");
    assert.ok(shell.includes("preview"));
    assert.ok(shell.includes('data-prospect-preview-community-trust="1"'));
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-media-preview-trust-01: ALL CHECKS EXECUTED AND PASSED");
}

main();
