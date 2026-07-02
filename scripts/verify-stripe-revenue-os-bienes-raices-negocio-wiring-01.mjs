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

const docRel = "docs/stripe-revenue-os-bienes-raices-negocio-wiring-01.md";
const previewRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const payloadRel = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";
const verifierRel = "scripts/verify-stripe-revenue-os-bienes-raices-negocio-wiring-01.mjs";

for (const rel of [docRel, previewRel, payloadRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const preview = read(previewRel);
const payload = read(payloadRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Old Broken Path",
  "New Revenue OS Path",
  "Canonical Package Key Used",
  "Files Inspected",
  "Files Changed",
  "Payload Contract",
  "Success/Cancel Route Contract",
  "What This Gate Does Not Do",
  "Manual QA Checklist",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.includes("STRIPE_PRICE_BIENES_NEGOCIO"), "Doc must mention old STRIPE_PRICE_BIENES_NEGOCIO path");
assert(doc.includes("/api/revenue-os/checkout"), "Doc must mention central checkout route");
assert(doc.includes("br_agent_monthly"), "Doc must mention canonical package key");
assert(doc.toLowerCase().includes("no fake paid"), "Doc must mention no fake paid status");
assert(doc.includes("/revenue-os/pago/exito"), "Doc must mention Revenue OS success page");
assert(doc.includes("/revenue-os/pago/cancelado"), "Doc must mention Revenue OS cancel page");

assert(
  pkg.includes('"verify:stripe-revenue-os-bienes-raices-negocio-wiring-01"'),
  "package.json must include verifier script",
);

assert(preview.includes("startRevenueCategoryCheckout"), "Preview client must use Revenue OS checkout client");
assert(
  preview.includes("br_agent_monthly") || preview.includes("BIENES_RAICES_NEGOCIO_CHECKOUT"),
  "Preview must reference br_agent_monthly package",
);
assert(!preview.includes("startBrNegocioCheckout"), "Preview must not use legacy BR checkout client");
assert(!preview.includes("brPublishBlockedMissingStripe"), "Preview must not gate on legacy Stripe price env");
assert(!preview.includes("STRIPE_PRICE_BIENES_NEGOCIO"), "Preview must not depend on STRIPE_PRICE_BIENES_NEGOCIO");

assert(
  payload.includes("br_agent_monthly") || payload.includes("BIENES_RAICES_NEGOCIO_CHECKOUT"),
  "Payload must define Bienes negocio checkout mapping",
);

const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
assert(!checkoutRoute.includes("BIENES-RAICES-NEGOCIO-WIRING-01"), "Checkout route must not be rewritten by this gate");
assert(!webhookRoute.includes("BIENES-RAICES-NEGOCIO-WIRING-01"), "Webhook route must not be rewritten by this gate");

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, preview, payload, pkg]) {
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

console.log("verify-stripe-revenue-os-bienes-raices-negocio-wiring-01: PASS");
