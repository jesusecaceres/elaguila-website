import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(
  root,
  "app/lib/ofertas-locales/OFERTAS_STEP5_GLOBAL_ADDRESS_REVIEW_WORKSPACE_AUDIT.md"
);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireText(label, haystack, needle) {
  if (haystack.includes(needle)) {
    pass(label);
  } else {
    fail(`${label} missing "${needle}"`);
  }
}

if (!existsSync(auditPath)) {
  fail("audit file exists");
} else {
  pass("audit file exists");
  const audit = readFileSync(auditPath, "utf8");
  requireText("country/postal wording", audit, "city, state/province, country, and postal code");
  requireText("coupon collapse wording", audit, "Want to add coupons or extra files?");
  requireText("clip fallback wording", audit, "No product clip or location available yet");
  requireText("brand mapping", audit, "Cream/ivory");
}

const changed = execFileSync("git", ["diff", "--name-only"], {
  cwd: root,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const forbidden = changed.filter((file) => {
  if (file === "package.json") return false;
  if (file === "scripts/verify-ofertas-step5-global-address-review-workspace.mjs") return false;
  if (file.startsWith("app/(site)/publicar/ofertas-locales/")) return false;
  if (file.startsWith("app/api/ofertas-locales/")) return false;
  if (file.startsWith("app/lib/ofertas-locales/")) return false;
  return true;
});

if (forbidden.length) {
  fail(`unrelated modified files: ${forbidden.join(", ")}`);
} else {
  pass("no unrelated category files modified by this gate");
}

const stripeOrPayment = changed.filter((file) => /stripe|payment/i.test(file));
if (stripeOrPayment.length) {
  fail(`Stripe/payment files modified: ${stripeOrPayment.join(", ")}`);
} else {
  pass("no Stripe/payment files modified by this gate");
}
