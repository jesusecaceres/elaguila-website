import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitStatusShort() {
  return execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/restaurantes-pending-publish-and-coupon-offers-truth-01.md";
const previewRel = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const checkpointRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const pendingRel = "app/(site)/clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout.ts";
const verifierRel = "scripts/verify-restaurantes-pending-publish-and-coupon-offers-truth-01.mjs";

for (const rel of [docRel, previewRel, checkpointRel, pendingRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const preview = read(previewRel);
const checkpoint = read(checkpointRel);
const pending = read(pendingRel);
const pkg = read("package.json");
const addonSupported = /REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED\s*=\s*true/.test(checkpoint);

for (const section of [
  "Executive Summary",
  "Screenshot Problem",
  "Promo Code vs Ofertas Locales vs Paid Add-On",
  "Files Inspected",
  "Files Changed",
  "Ofertas Locales Decision",
  "Checkout Summary Decision",
  "Pending Persistence Before Checkout",
  "Revenue OS Checkout Payload",
  "What This Gate Does Not Do",
  "Manual QA Checklist",
  "Next Recommended Gates",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.toLowerCase().includes("no fake paid"), "Doc must mention no fake paid status");
assert(doc.includes("$399") || doc.includes("399"), "Doc must mention base $399 checkout");
assert(doc.includes("pending") || doc.includes("Pending"), "Doc must mention pending persistence");
assert(
  doc.includes("Ofertas Locales") && (doc.includes("separate") || doc.includes("Separate")),
  "Doc must mention Ofertas Locales separate or hidden",
);

assert(
  pkg.includes('"verify:restaurantes-pending-publish-and-coupon-offers-truth-01"'),
  "package.json must include verifier script",
);

assert(preview.includes("PublishCheckoutCheckpoint"), "Preview must use shared checkpoint");
assert(preview.includes("saveRestaurantePendingBeforeCheckout"), "Preview must pending-save before checkout");
assert(preview.includes("startRevenueCategoryCheckout"), "Preview must use Revenue OS checkout");
assert(
  preview.includes("listingId: pending.listingId") || preview.includes("listingId:pending.listingId"),
  "Checkout must use stable listingId from pending save",
);
assert(
  preview.includes("RestauranteOfertasLocalesCheckoutSecondaryCard"),
  "Preview must use truthful secondary Ofertas card",
);
assert(!preview.includes("RestauranteOfertasLocalesUpsellCard"), "Preview must not use old combo upsell card");

if (!addonSupported) {
  assert(!preview.includes("Combo recomendado"), "Preview must not show $499 combo when add-on unsupported");
  assert(!preview.includes("Recommended bundle"), "Preview must not show $499 combo EN when add-on unsupported");
  assert(checkpoint.includes("REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = false"), "Checkpoint must flag add-on unsupported");
}

assert(pending.includes("activation_mode") || pending.includes("activationMode"), "Pending save must use activation_mode");
assert(pending.includes("pendingPayment"), "Pending save must require pendingPayment response");

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, preview, checkpoint, pending, pkg]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(!existsSync(path.join(ROOT, ".env")), ".env must not be created by this gate");

const status = gitStatusShort();
const migrationAdded = status
  .split("\n")
  .some((line) => line.includes("supabase/migrations/") && (line.startsWith("??") || line.startsWith("A ")));
assert(!migrationAdded, "No new migration files should be added by this gate");

console.log("verify-restaurantes-pending-publish-and-coupon-offers-truth-01: PASS");
