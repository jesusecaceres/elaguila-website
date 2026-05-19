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

const helperPath = "app/lib/listingPlans/printDigitalVisibilityRank.ts";
const policyPath = "docs/print-to-digital-visibility-policy.md";
const readModelPath = "docs/category-listing-monetization-read-model.md";

assert(
  "print digital visibility rank helper exists",
  fs.existsSync(path.join(root, helperPath)),
  `Expected helper at ${helperPath}.`,
);

const helper = read(helperPath);
const policy = read(policyPath);
const readModel = read(readModelPath);

const helperCodeOnly = helper
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

assert(
  "helper exports resolveListingVisibilityRank",
  /export function resolveListingVisibilityRank/.test(helper),
  "Gate G1 must export resolveListingVisibilityRank(input).",
);

assert(
  "helper exports compareVisibilityRank",
  /export function compareVisibilityRank/.test(helper),
  "Gate G1 must export compareVisibilityRank(a, b).",
);

for (const bucket of [
  "premium_destacado_module",
  "full_page_print_priority",
  "print_advertiser_pool",
  "digital_featured",
  "republished",
  "organic",
  "separate_model",
  "deferred",
  "unknown",
]) {
  assert(
    `rank bucket represented: ${bucket}`,
    helper.includes(`"${bucket}"`),
    `VisibilityRankBucket must include ${bucket}.`,
  );
}

for (const cat of ["servicios", "restaurantes", "autos", "bienes-raices", "rentas"]) {
  assert(
    `V1 category represented: ${cat}`,
    helper.includes(`"${cat}"`),
    `Print-to-Digital V1 must include ${cat}.`,
  );
}

assert(
  "En Venta marked separate_model",
  /en-venta/.test(helper) && /separate_model/.test(helper) && /Free\/Pro/i.test(helper),
  "En Venta must return separate_model with Free/Pro warning.",
);

assert(
  "Clases/Comunidad marked deferred",
  /clases/.test(helper) &&
    /comunidad/.test(helper) &&
    /deferred/.test(helper) &&
    /not client-ready/i.test(helper),
  "Clases and Comunidad must be deferred/not client-ready.",
);

assert(
  "Empleos/Viajes marked separate/deferred",
  /empleos/.test(helper) &&
    /viajes/.test(helper) &&
    /separate_model/.test(helper),
  "Empleos and Viajes must be separate from V1 ranking.",
);

assert(
  "helper does not use membership_tier",
  !/profiles\.membership_tier|membership_tier|membershipTier/.test(helperCodeOnly),
  "Ranking helper must not use account membership as listing truth.",
);

assert(
  "helper does not use business_lite/business_premium",
  !/business_lite|business_premium/.test(helperCodeOnly),
  "Ranking helper must not map account business tiers.",
);

assert(
  "helper does not use Stripe/payment as rank truth",
  !/stripe|checkout_session|payment_status|payment_intent/i.test(helperCodeOnly),
  "Stripe/payment fields must not drive visibility rank.",
);

assert(
  "premium maps to Destacados module eligibility",
  /eligibleForDestacadosModule:\s*bucket === "premium_destacado_module"/.test(helper) ||
    /eligibleForDestacadosModule: bucket === "premium_destacado_module"/.test(helper),
  "Premium bucket must set Destacados module eligibility.",
);

assert(
  "full-page maps to results priority eligibility",
  /eligibleForResultsPriority:\s*bucket === "full_page_print_priority"/.test(helper) ||
    /eligibleForResultsPriority: bucket === "full_page_print_priority"/.test(helper),
  "Full-page bucket must set results priority eligibility.",
);

assert(
  "search/filter first is represented",
  /searchFilterMustMatchFirst:\s*true/.test(helper),
  "Summary must encode search/filter-before-rank policy.",
);

assert(
  "policy documents Gate G1 helper without live sorting",
  /Gate G1/i.test(policy) &&
    /does not apply sorting|helper only|not apply sorting yet/i.test(policy),
  "Policy must state Gate G1 helper does not apply live sorting yet.",
);

assert(
  "policy says search/filter first",
  /search.*filter.*first|Search and filters run first/i.test(policy),
  "Policy must require search/filter before visibility ranking.",
);

assert(
  "policy says full-page outranks republish",
  /full[- ]page/i.test(policy) &&
    /Republish|republish/i.test(policy) &&
    /below|outrank|never/i.test(policy),
  "Policy must document full-page priority above republish/boost.",
);

assert(
  "policy says premium maps to Destacados modules",
  /Premium/i.test(policy) && /Destacados/i.test(policy),
  "Policy must map Premium print to Destacados modules.",
);

assert(
  "read model documents Gate G1 helper",
  /printDigitalVisibilityRank|resolveListingVisibilityRank|Gate G1/i.test(readModel),
  "Read model doc must reference Gate G1 ranking helper.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
