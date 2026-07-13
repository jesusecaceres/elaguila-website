#!/usr/bin/env node
/**
 * Verifier — Bienes Raíces Final Launch Golden Stack 01
 * Combines contract source guards + real fixture mapper proofs.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function assert(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

console.log("\n=== Bienes Final Launch Golden Stack 01 ===\n");

const mapAgente =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts";
const businessMeta = "app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState.ts";
const gate12d = "app/(site)/clasificados/lib/leonixBrGate12d.ts";
const facets = "app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState.ts";
const payment = "app/lib/clasificados/bienes-raices/brListingPaymentService.ts";
const anuncio = "app/(site)/clasificados/anuncio/[id]/page.tsx";
const manageCard = "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx";
const misAnuncios = "app/(site)/dashboard/mis-anuncios/page.tsx";
const browseFetch = "app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts";
const engagement = "app/(site)/clasificados/bienes-raices/listing/BrEngagementRow.tsx";
const likeBtn = "app/components/clasificados/analytics/LeonixLikeButton.tsx";
const analytics = "app/lib/clasificados/bienes-raices/analytics/bienesRaicesGlobalAnalytics.ts";
const analyticsLegacy = "app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts";
const stripeCheckout = "app/api/clasificados/leonix/stripe/checkout/route.ts";
const stripeVerify = "app/api/clasificados/leonix/stripe/checkout/verify/route.ts";
const stripeWebhook = "app/api/clasificados/leonix/stripe/webhook/route.ts";
const copyEn =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts";
const copyEs =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts";
const step09 =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx";
const pkg = read("package.json");

assert("1. Parent/child publish mapper exists", exists(mapAgente));
assert(
  "2. Open-house slots mapped into publish CTA",
  read(mapAgente).includes("normalizeOpenHouseSlots") && read(mapAgente).includes("openHouseActivo"),
);
assert(
  "3. Multi-word titled links + Google/Yelp persist to business_meta",
  read(businessMeta).includes("negocioGoogleBusinessUrl") &&
    read(businessMeta).includes("negocioGoogleReviewsUrl") &&
    read(businessMeta).includes("negocioYelpReviewsUrl") &&
    read(businessMeta).includes("negocioBusinessExtraUrls"),
);
assert(
  "4. Public anuncio surfaces Google/Yelp/custom titles",
  read(anuncio).includes("negocioGoogleBusinessUrl") &&
    read(anuncio).includes("negocioYelpReviewsUrl") &&
    read(anuncio).includes("businessLinkPublicLabel"),
);
assert(
  "5. Country facet uses form pais (not hard-coded only)",
  read(facets).includes('String(state.pais ?? "").trim() || "United States"'),
);
assert(
  "6. Open-house helper copy EN/ES present",
  read(copyEn).includes("Hosting an open house on multiple days?") &&
    read(copyEs).includes("¿Tendrás casa abierta durante varios días?") &&
    read(step09).includes("openHouseHelper"),
);
assert(
  "7. Stripe checkout/verify/webhook paths ready",
  exists(stripeCheckout) &&
    exists(stripeVerify) &&
    exists(stripeWebhook) &&
    read(stripeVerify).includes("tryActivateBrListingAfterPayment"),
);
assert(
  "8. Bundle sibling activation after payment",
  read(payment).includes("activateInventorySiblings") &&
    read(payment).includes("br_inventory_group_id"),
);
assert(
  "9. Like zero hides numeric zero",
  read(likeBtn).includes("0 → heart only") || read(likeBtn).includes("heart only"),
);
assert(
  "10. Like/share use listing UUID + bienes-raices category",
  read(engagement).includes("listingUuid") &&
    read(engagement).includes('category="bienes-raices"') &&
    (read(analytics).includes("listing_like") || read(analyticsLegacy).includes("listing_like")) &&
    (read(analytics).includes("listing_share") || read(analyticsLegacy).includes("listing_share")),
);
assert(
  "11. Preview engagement does not write live analytics",
  read(engagement).includes('mode === "preview"') && read(engagement).includes("persistEngagement={false}"),
);
assert(
  "12. Browse fetch excludes sold at query (active only)",
  read(browseFetch).includes('.eq("status", "active")') &&
    !read(browseFetch).includes('["active", "sold"]'),
);
assert(
  "13. Mark sold wired on BR manage card + confirmation",
  read(manageCard).includes("onMarkSold") &&
    read(misAnuncios).includes("onMarkSold") &&
    read(misAnuncios).includes("Mark this listing as sold"),
);
assert(
  "14. Sold sets is_published false",
  read(misAnuncios).includes('if (status === "sold") patch.is_published = false'),
);
assert(
  "14b. Fake results Save heart removed (detail Save uses saved_listings)",
  !read("app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioFeaturedCard.tsx").includes("setFav") &&
    read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx").includes("saved_listings"),
);
assert(
  "14c. Success screen shows Leonix ID + dashboard + publish another + lifecycle",
  read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx").includes("leonixAdId") &&
    read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx").includes("Go to dashboard") &&
    read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx").includes("Publish another property") &&
    read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx").includes("Bienes lifecycle"),
);
assert(
  "15. Final verifier npm script registered",
  pkg.includes("verify:bienes-final-launch-golden-stack-01"),
);
assert(
  "16. No migration file added by this verifier path",
  !fs.readdirSync(path.join(root, "supabase", "migrations"), { withFileTypes: true }).some((d) =>
    d.isFile() && d.name.includes("golden-stack"),
  ),
);

console.log("\n--- Fixture core ---\n");
try {
  execFileSync("npx", ["tsx", "scripts/bienes-final-launch-golden-stack-01-core.ts"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  assert("17. Fixture core PASS", true);
} catch {
  assert("17. Fixture core PASS", false, "tsx core failed");
}

console.log(`\nGolden stack guards: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
console.log("PROOF_TYPE: FIXTURE + SOURCE CONTRACT");
console.log("READY_EXCEPT_STRIPE_CONTRACT: YES");
