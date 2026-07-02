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

const docRel = "docs/stripe-revenue-os-category-checkout-wiring-01.md";
const clientRel = "app/lib/listingPlans/revenueCategoryCheckoutClient.ts";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const verifierRel = "scripts/verify-stripe-revenue-os-category-checkout-wiring-01.mjs";

for (const rel of [docRel, clientRel, payloadRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const client = read(clientRel);
const payload = read(payloadRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Repo Baseline",
  "Category Scope",
  "Rentas Checkout Wiring",
  "Empleos Checkout Wiring",
  "Autos Privado Checkout Wiring",
  "Job Fair Non-Stripe Rule",
  "Autos Negocio Deferred Rule",
  "Success/Cancel Route Contract",
  "Account Plan vs Listing/Ad Plan Rule",
  "Security Rules",
  "Manual QA Checklist",
  "What This Gate Does Not Do",
  "Next Gate Recommendation",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.includes("rentas_30d"), "Doc must mention rentas_30d");
assert(doc.includes("empleos_job_post_paid"), "Doc must mention empleos_job_post_paid");
assert(doc.includes("empleos_job_fair_free") || doc.toLowerCase().includes("job fair"), "Doc must mention job fair non-Stripe rule");
assert(doc.includes("autos_privado_30d"), "Doc must mention autos_privado_30d");
assert(doc.includes("negocio") || doc.includes("Autos negocio"), "Doc must mention Autos negocio deferred");
assert(doc.includes("/revenue-os/pago/exito"), "Doc must mention Revenue OS success route");
assert(doc.includes("/revenue-os/pago/cancelado"), "Doc must mention Revenue OS cancel route");
assert(doc.toLowerCase().includes("no fake paid"), "Doc must mention no fake paid status");
assert(doc.includes("Manual QA Checklist"), "Doc must include manual QA checklist");

assert(
  pkg.includes('"verify:stripe-revenue-os-category-checkout-wiring-01"'),
  "package.json must include verifier script",
);

assert(client.includes("/api/revenue-os/checkout"), "Client must call central checkout route");
assert(!client.includes("STRIPE_SECRET_KEY"), "Client must not reference Stripe secret");
assert(payload.includes("rentas_30d"), "Payload must define rentas_30d mapping");
assert(
  payload.includes("empleos_job_post_paid") || payload.includes("EMPLEOS_JOB_POST_PAID_PACKAGE_KEY"),
  "Payload must define empleos_job_post_paid mapping",
);
assert(payload.includes("autos_privado_30d"), "Payload must define autos_privado_30d mapping");

const rentasPreview = read("app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx");
const empleosQuick = read("app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx");
const empleosFeria = read("app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx");
const autosConfirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");

const empleosRevenue = read("app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts");

assert(rentasPreview.includes("startRevenueCategoryCheckout"), "Rentas preview must use revenue checkout client");
assert(rentasPreview.includes("rentas_30d") || rentasPreview.includes("RENTAS_CATEGORY_CHECKOUT"), "Rentas must use rentas_30d");
assert(empleosQuick.includes("saveEmpleosDraftAndStartPaidJobCheckout"), "Empleos quick must use paid checkout helper");
assert(
  empleosRevenue.includes("empleos_job_post_paid") || empleosRevenue.includes("EMPLEOS_PAID_JOB_CHECKOUT"),
  "Empleos paid helper must target empleos_job_post_paid",
);
assert(!empleosFeria.includes("/api/revenue-os/checkout"), "Job fair must not call Revenue OS checkout");
assert(autosConfirm.includes("startRevenueCategoryCheckout"), "Autos confirm must use revenue checkout client");
assert(autosConfirm.includes("autos_privado_30d") || autosConfirm.includes("AUTOS_PRIVADO_CHECKOUT"), "Autos privado must use autos_privado_30d");

const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
assert(!checkoutRoute.includes("CATEGORY-CHECKOUT-WIRING-01"), "Checkout route must not be rewritten by this gate marker");
assert(!webhookRoute.includes("CATEGORY-CHECKOUT-WIRING-01"), "Webhook route must not be rewritten by this gate marker");

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, client, payload, pkg, rentasPreview, empleosQuick, empleosRevenue, autosConfirm]) {
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

console.log("verify-stripe-revenue-os-category-checkout-wiring-01: PASS");
