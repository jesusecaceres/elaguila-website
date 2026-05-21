import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const docPath = "docs/print-package-entitlement-model.md";
const policyPath = "docs/print-to-digital-visibility-policy.md";
const readModelPath = "docs/category-listing-monetization-read-model.md";

assert(
  "print-package-entitlement-model.md exists",
  fs.existsSync(path.join(root, docPath)),
  `Expected ${docPath}.`,
);

const doc = read(docPath);
const policy = fs.existsSync(path.join(root, policyPath)) ? read(policyPath) : "";
const readModel = fs.existsSync(path.join(root, readModelPath)) ? read(readModelPath) : "";

assert(
  "doc distinguishes promo code from package entitlement",
  /promo code/i.test(doc) && /package entitlement/i.test(doc),
  "Must document promo code vs package entitlement.",
);
assert(
  "doc says coupon/cupones is not entitlement truth",
  /cupones|coupon/i.test(doc) && /not.*entitlement|marketing/i.test(doc),
  "Coupons must not be entitlement truth.",
);
assert(
  "doc says Stripe/payment is not ranking truth",
  /Stripe/i.test(doc) && /not.*ranking|payment.*≠|No/i.test(doc),
  "Stripe/payment must not be ranking truth.",
);
assert(
  "doc says package entitlement is future source of truth",
  /source of truth|future source of truth/i.test(doc),
  "Package entitlement must be future ranking source of truth.",
);

for (const tier of [
  "premium_print",
  "full_page_print",
  "half_page_print",
  "quarter_page_print",
  "classified_print",
]) {
  assert(`doc includes ${tier}`, doc.includes(tier), `Package tier ${tier} required.`);
}

assert(
  "premium_print maps to premium_destacado_module",
  doc.includes("premium_print") && doc.includes("premium_destacado_module"),
  "Mapping required.",
);
assert(
  "full_page_print maps to full_page_print_priority",
  doc.includes("full_page_print") && doc.includes("full_page_print_priority"),
  "Mapping required.",
);
assert(
  "half/quarter/classified map to print_advertiser_pool",
  doc.includes("print_advertiser_pool") &&
    /half_page_print|quarter_page_print|classified_print/.test(doc),
  "Print pool mapping required.",
);

assert(
  "contract start/end documented",
  (/starts_at|startsAt/.test(doc) && /ends_at|endsAt/.test(doc)),
  "Contract dates required.",
);
assert(
  "listing/category attachment documented",
  /listing_id|listingId/i.test(doc) && /category/i.test(doc),
  "Listing/category attachment required.",
);
assert(
  "search/filter first documented",
  /search.*filter.*first|Search and filters run first/i.test(doc),
  "Search/filter first rule required.",
);
assert(
  "no schema migration in this gate",
  /no migration|does not include.*migration|No migration in Gate G1\.6/i.test(doc),
  "Gate G1.6 must exclude schema migration.",
);
assert(
  "missing entitlement fallback documented",
  /missing entitlement|organic/i.test(doc),
  "Fallback behavior required.",
);
assert(
  "inventory limits documented",
  /inventory|8–10|8-10/i.test(doc),
  "Inventory limits required.",
);

assert("doc mentions Gate G1.6", /Gate G1\.6/i.test(doc), "Gate G1.6 label required.");
assert(
  "policy mentions Gate G1.6",
  /Gate G1\.6/i.test(policy),
  "print-to-digital-visibility-policy must reference Gate G1.6.",
);
assert(
  "read model mentions Gate G1.6",
  /Gate G1\.6/i.test(readModel),
  "category-listing-monetization-read-model must reference Gate G1.6.",
);
assert(
  "policy links print-package-entitlement-model",
  /print-package-entitlement-model\.md/.test(policy),
  "Policy must link new spec doc.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
} else {
  console.log("verify-print-package-entitlement-model: OK");
}
