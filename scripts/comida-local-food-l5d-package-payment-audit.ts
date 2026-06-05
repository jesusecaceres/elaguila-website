/**
 * Gate FOOD-L5D — Comida Local package + payment readiness static audit.
 * Run: npm run comida-local:food-l5d-package-payment-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5D = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5D_PACKAGE_PAYMENT_AUDIT.md";

const REQUIRED = [
  FOOD_L5D,
  "app/lib/clasificados/comida-local/comidaLocalPackages.ts",
  "app/lib/clasificados/comida-local/comidaLocalPaymentStatus.ts",
] as const;

const FORBIDDEN_STRIPE_PATTERNS = [/price_[a-zA-Z0-9]{8,}/, /prod_[a-zA-Z0-9]{8,}/];

const FORBIDDEN_CHECKOUT_STRINGS = [
  "checkout.stripe.com",
  "/api/clasificados/comida-local/checkout",
  "createCheckoutSession",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/publicar/rentas/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/autos/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/api/clasificados/comida-local/",
  "app/admin/",
  "scripts/comida-local-",
  "package.json",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  for (const f of REQUIRED) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const packages = read("app/lib/clasificados/comida-local/comidaLocalPackages.ts");
  assert.ok(packages.includes("COMIDA_LOCAL_BASIC_PACKAGE"));
  assert.ok(packages.includes("COMIDA_LOCAL_PLUS_PACKAGE"));
  assert.ok(packages.includes("9900"));
  assert.ok(packages.includes("14900"));
  assert.ok(packages.includes("maxGalleryImages"));
  assert.ok(packages.includes("isValidComidaLocalPackageTier"));

  const payment = read("app/lib/clasificados/comida-local/comidaLocalPaymentStatus.ts");
  assert.ok(payment.includes("getComidaLocalPaymentStatusLabel"));
  assert.ok(
    payment.includes("not_required_for_l5b") || payment.includes("COMIDA_LOCAL_PAYMENT_STATUS_L5B")
  );
  assert.ok(payment.includes("resolveComidaLocalPublishPaymentStatus"));

  const comidaOnly = [packages, payment, read("app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts")].join(
    "\n"
  );

  for (const pattern of FORBIDDEN_STRIPE_PATTERNS) {
    assert.ok(!pattern.test(comidaOnly), `No hardcoded Stripe IDs: ${pattern}`);
  }

  for (const s of FORBIDDEN_CHECKOUT_STRINGS) {
    assert.ok(!comidaOnly.includes(s), `No fake checkout URL: ${s}`);
  }

  assert.ok(!/payment_status\s*=\s*["']paid["']/i.test(comidaOnly), "No fake paid status assignment");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l5d-package-payment-audit"'));

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  for (const p of changedFiles()) {
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (!isAllowed(p)) {
      assert.fail(`Changed file outside gate firewall: ${p}`);
    }
  }

  console.log("FOOD-L5D package payment audit passed.");
}

run();
