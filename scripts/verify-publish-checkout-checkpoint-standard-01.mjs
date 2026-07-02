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

const docRel = "docs/publish-checkout-checkpoint-standard-01.md";
const componentRel = "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx";
const rulesRel = "app/lib/listingPlans/publishCheckoutCheckpoint.ts";
const copyRel = "app/lib/listingPlans/publishCheckoutCopy.ts";
const restaurantRel = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const bienesRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const verifierRel = "scripts/verify-publish-checkout-checkpoint-standard-01.mjs";

for (const rel of [docRel, componentRel, rulesRel, copyRel, restaurantRel, bienesRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const component = read(componentRel);
const rules = read(rulesRel);
const restaurant = read(restaurantRel);
const bienes = read(bienesRel);
const payload = read(payloadRel);
const pkg = read("package.json");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");

for (const section of [
  "Executive Summary",
  "Preview vs Final Action Rule",
  "Promo Code Ownership Rule",
  "Newsletter / Updates Opt-In Rule",
  "Restaurantes Proof Migration",
  "Bienes Raíces Negocio Proof Migration",
  "Bienes Inventory Pack Rule",
  "Account Plan vs Listing/Ad Plan Rule",
  "Category Migration Map",
  "Manual QA Checklist",
  "What This Gate Does Not Do",
  "Next Gates",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.includes("category migration map") || doc.includes("Category Migration Map"), "Doc must mention category migration map");

assert(
  pkg.includes('"verify:publish-checkout-checkpoint-standard-01"'),
  "package.json must include verifier script",
);

assert(rules.includes("resolvePublishCheckoutCheckpoint"), "Rules module must export resolver");
assert(rules.includes("PublishCheckpointMode"), "Rules module must define PublishCheckpointMode");
assert(rules.includes("RESTAURANTES_CHECKPOINT_CONFIRMATIONS"), "Rules module must define restaurant confirmations");
assert(rules.includes("BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS"), "Rules module must define bienes confirmations");
assert(rules.includes("REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED"), "Rules must document inventory pack support flag");

assert(component.includes("PublishCheckoutCheckpoint"), "Shared component must export PublishCheckoutCheckpoint");
assert(component.includes("onCheckout"), "Component must support onCheckout");
assert(component.includes("onFreePublish"), "Component must support onFreePublish");

assert(restaurant.includes("PublishCheckoutCheckpoint"), "Restaurant preview must use shared checkpoint");
assert(
  restaurant.includes("startRevenueCategoryCheckout") || restaurant.includes("RESTAURANTES_BASE_CHECKOUT"),
  "Restaurant must use Revenue OS checkout",
);
assert(!restaurant.includes('fetch("/api/clasificados/restaurantes/publish"'), "Restaurant must not bypass Revenue OS via direct publish API");

assert(bienes.includes("PublishCheckoutCheckpoint"), "Bienes negocio preview must use shared checkpoint");
assert(bienes.includes("startRevenueCategoryCheckout"), "Bienes negocio must use Revenue OS checkout");
assert(!bienes.includes("STRIPE_PRICE_BIENES_NEGOCIO"), "Bienes negocio must not depend on legacy Stripe price env");

assert(
  payload.includes("restaurantes_base_monthly") || payload.includes("RESTAURANTES_BASE_CHECKOUT"),
  "Payload must define Restaurantes checkout mapping",
);

assert(!component.toLowerCase().includes("you are subscribed"), "Component must not claim fake subscription");
assert(!restaurant.toLowerCase().includes("you are subscribed"), "Restaurant preview must not claim fake subscription");
assert(!bienes.toLowerCase().includes("you are subscribed"), "Bienes preview must not claim fake subscription");

assert(!checkoutRoute.includes("PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01"), "Checkout route must not be rewritten by this gate");
assert(!webhookRoute.includes("PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01"), "Webhook route must not be rewritten by this gate");

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, component, rules, restaurant, bienes, payload, pkg]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(!existsSync(path.join(ROOT, ".env")), ".env must not be created by this gate");

const migrationsDir = path.join(ROOT, "supabase", "migrations");
if (existsSync(migrationsDir)) {
  const status = gitStatusShort();
  const migrationAdded = status
    .split("\n")
    .some((line) => line.includes("supabase/migrations/") && (line.startsWith("??") || line.startsWith("A ")));
  assert(!migrationAdded, "No new migration files should be added by this gate");
}

console.log("verify-publish-checkout-checkpoint-standard-01: PASS");
