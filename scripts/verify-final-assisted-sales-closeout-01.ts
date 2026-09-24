/**
 * LEONIX — final assisted-sales closeout source contract.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-final-assisted-sales-closeout-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getSafePublicAdUrl,
  isLikelyInternalOrPreviewUrl,
  rewriteCanonicalPublicListingUrl,
} from "../app/components/cta/ctaDataHelpers";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";
import { AUTOS_DEALER_QUICK_INCLUDED_VEHICLES } from "../app/lib/listingPlans/publishCheckoutCheckpoint";
import { QUICK_BUSINESS_PUBLISH_MAX_IMAGES } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import {
  isStaffBusinessPairCategory,
  staffBusinessCheckpointHref,
  staffBusinessOffers,
} from "../app/lib/sales/staffBusinessProduct";

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
  check("pair categories only sell Quick/Full", () => {
    for (const pair of ["servicios", "restaurantes", "autos", "bienes-raices"] as const) {
      assert.equal(isStaffBusinessPairCategory(pair), true);
      assert.equal(staffBusinessOffers(pair).length, 2);
    }
    for (const excluded of ["rentas", "empleos", "autos-privado", "comida-local"] as const) {
      assert.equal(isStaffBusinessPairCategory(excluded), false);
      assert.equal(staffBusinessOffers(excluded).length, 0);
    }
  });

  check("staff pair entry is a visible checkpoint, not a silent app bypass", () => {
    const servicios = staffBusinessCheckpointHref("servicios", "quick");
    const restaurantes = staffBusinessCheckpointHref("restaurantes", "full");
    const autos = staffBusinessCheckpointHref("autos", "quick");
    const bienes = staffBusinessCheckpointHref("bienes-raices", "full");
    assert.ok(servicios?.startsWith("/clasificados/publicar/servicios/checkpoint?"));
    assert.ok(servicios?.includes("plan=quick") && servicios.includes("staff=1"));
    assert.ok(restaurantes?.startsWith("/clasificados/publicar/restaurantes?"));
    assert.ok(autos?.startsWith("/clasificados/publicar/autos?"));
    assert.ok(bienes?.startsWith("/clasificados/publicar/bienes-raices?"));
    const open = read("app/api/admin/sales-preview/open-application/route.ts");
    assert.ok(open.includes("staffBusinessCheckpointHref"));
    assert.ok(open.includes('entryKind: checkpointHref ? "checkpoint" : "application"'));
  });

  check("checkpoint confirmation remints signed custody; public cards do not POST unless staff=1", () => {
    const card = read("app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx");
    assert.ok(card.includes('if (!assistedCategory || card.disabled) return;'));
    assert.ok(card.includes('fetch("/api/admin/sales-preview/custody"'));
    assert.ok(card.includes("category: assistedCategory, plan"));
    const servicios = read("app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx");
    assert.ok(servicios.includes('searchParams?.get("staff") === "1"'));
  });

  check("assisted customer account reuses auth users and fails closed on primary-owner conflict", () => {
    const account = read("app/lib/sales/assistedCustomerAccount.ts");
    assert.ok(account.includes("reuseExisting: true"));
    assert.ok(account.includes('error: "business_already_owned"'));
    assert.ok(account.includes("is_primary_owner"));
    const provisioning = read("app/admin/_lib/adminUserProvisioning.ts");
    assert.ok(provisioning.includes("resetPasswordForEmail"));
    assert.ok(provisioning.includes('"/auth/callback?redirect=/dashboard"'));
    assert.ok(provisioning.includes("if (input.reuseExisting)"));
    assert.ok(!provisioning.includes("temporaryPassword") || provisioning.includes("provisionStaffAuthUser"));
  });

  check("four pair publish routes use signed assisted customer identity", () => {
    const servicios = read("app/api/clasificados/servicios/publish/route.ts");
    const restaurantes = read("app/api/clasificados/restaurantes/publish/route.ts");
    const autos = read("app/api/clasificados/autos/assisted-publish/route.ts");
    const bienes = read("app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts");
    assert.ok(servicios.includes("assistedContext?.clientUserId"));
    assert.ok(servicios.includes("owner_user_id: assistedOwnerUserId"));
    assert.ok(restaurantes.includes("assistedContext?.clientUserId"));
    assert.ok(restaurantes.includes("baseRow.owner_user_id = ownerUserId"));
    assert.ok(autos.includes("const bodyClientUserId"));
    assert.ok(autos.includes("const contextClientUserId"));
    assert.ok(bienes.includes("const bodyClientUserId"));
    assert.ok(bienes.includes("const contextClientUserId"));
    assert.ok(bienes.includes("const clientUserId = bodyClientUserId || contextClientUserId"));
  });

  check("Quick publish media is 3 images / no video; Full path stays outside this cap", () => {
    assert.equal(QUICK_BUSINESS_PUBLISH_MAX_IMAGES.servicios, 3);
    assert.equal(QUICK_BUSINESS_PUBLISH_MAX_IMAGES.restaurantes, 3);
    assert.equal(QUICK_BUSINESS_PUBLISH_MAX_IMAGES["autos-dealer"], 3);
    assert.equal(QUICK_BUSINESS_PUBLISH_MAX_IMAGES["bienes-negocio"], 3);
    const semantics = read("app/lib/quickBusiness/quickBusinessMediaSemantics.ts");
    assert.ok(semantics.includes("enforceQuickContract"));
  });

  check("Autos Dealer Quick inventory is the repository-defined count of 1", () => {
    assert.equal(AUTOS_DEALER_QUICK_INCLUDED_VEHICLES, 1);
  });

  check("public listing share never keeps Vercel / admin / dashboard identity", () => {
    const preview = "https://leonix-media-ip8egnadp-jesus-caceres-projects.vercel.app/clasificados/servicios/plomeria-leon";
    const admin = "https://leonixmedia.com/admin/workspace/quick-sales";
    const dashboard = "https://leonix-media.vercel.app/dashboard";
    const publicPath = "/clasificados/anuncio/abc";
    assert.equal(rewriteCanonicalPublicListingUrl(preview), `${LEONIX_SITE_ORIGIN}/clasificados/servicios/plomeria-leon`);
    assert.equal(getSafePublicAdUrl({ publicUrl: preview }), `${LEONIX_SITE_ORIGIN}/clasificados/servicios/plomeria-leon`);
    assert.equal(getSafePublicAdUrl({ publicUrl: admin }), "");
    assert.equal(getSafePublicAdUrl({ publicUrl: dashboard }), "");
    assert.equal(getSafePublicAdUrl({ publicUrl: publicPath }), `${LEONIX_SITE_ORIGIN}${publicPath}`);
    assert.equal(isLikelyInternalOrPreviewUrl(admin), true);
    const shareButton = read("app/components/clasificados/analytics/LeonixShareButton.tsx");
    assert.ok(!shareButton.includes("window.location.href"));
    assert.ok(shareButton.includes('kind: "share_ad"'));
  });

  check("staff new-client fields and same-row open-application cookie still exist", () => {
    const workspace = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
    assert.ok(workspace.includes("newBusinessName"));
    assert.ok(workspace.includes("newClientEmail"));
    assert.ok(workspace.includes("entryKind === \"checkpoint\""));
    const open = read("app/api/admin/sales-preview/open-application/route.ts");
    assert.ok(open.includes("provisionAssistedCustomerAccount"));
    assert.ok(open.includes("applyAssistedPublishingCookie"));
    assert.ok(open.includes("clientUserId"));
  });

  if (failures.length) {
    console.error(`FAIL ${failures.length}/${checks}`);
    for (const row of failures) console.error(`- ${row}`);
    process.exit(1);
  }
  console.log(`PASS ${passed.length}/${checks}`);
}

main();
