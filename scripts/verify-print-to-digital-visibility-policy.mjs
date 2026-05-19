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

const policyPath = "docs/print-to-digital-visibility-policy.md";
const readModelPath = "docs/category-listing-monetization-read-model.md";

assert(
  "print-to-digital policy doc exists",
  fs.existsSync(path.join(root, policyPath)),
  `Expected ${policyPath}.`,
);

const policy = read(policyPath);
const readModel = read(readModelPath);

assert("policy mentions Premium package", /Premium/i.test(policy) && /\$2,000|2000/.test(policy), "Premium print package must be documented.");
assert("policy mentions Destacados", /Destacados/i.test(policy), "Premium digital benefit must reference Destacados modules.");
assert(
  "policy mentions Full-page print priority",
  /full[- ]page/i.test(policy) && /priority/i.test(policy),
  "Full-page print priority in matching results must be documented.",
);
assert(
  "policy mentions Refrescado / Republish",
  /Refrescado/i.test(policy) && /Republish/i.test(policy),
  "Digital-only republish tool must be documented.",
);
assert(
  "policy mentions Boost / Impulsado as future and below print",
  /Boost/i.test(policy) &&
    /Impulsado/i.test(policy) &&
    /below.*print|print priority/i.test(policy),
  "Boost/Impulsado must be future and below print priority.",
);

for (const cat of ["Servicios", "Restaurantes", "Autos", "Bienes Raíces", "Rentas"]) {
  assert(
    `policy includes V1 category ${cat}`,
    policy.includes(cat),
    `${cat} must appear in V1 category scope.`,
  );
}

assert(
  "policy says En Venta is separate",
  /En Venta/i.test(policy) && /Separate|separate/i.test(policy),
  "En Venta must be marked separate from Print-to-Digital V1.",
);
assert(
  "policy says Clases/Comunidad are not client-ready",
  /Clases/i.test(policy) &&
    /Comunidad/i.test(policy) &&
    /not client-ready|Not client-ready/i.test(policy),
  "Clases and Comunidad must be marked not client-ready.",
);
assert(
  "policy says Empleos/Viajes are deferred or separate",
  /Empleos/i.test(policy) &&
    /Viajes/i.test(policy) &&
    /deferred|separate|staged/i.test(policy),
  "Empleos and Viajes must be deferred or separate.",
);
assert(
  "policy excludes Stripe promo pricing and migration in Gate G0",
  /Gate G0/i.test(policy) &&
    /Stripe/i.test(policy) &&
    /promo/i.test(policy) &&
    /pricing/i.test(policy) &&
    /no migration|does not include.*migration|no migration in Gate G0/i.test(policy),
  "Gate G0 must explicitly exclude Stripe, promo, pricing, and schema migration.",
);
assert(
  "policy says search/filter runs before visibility ranking",
  /search.*filter.*first|Search and filters run first/i.test(policy),
  "Sorting principles must require search/filter first.",
);
assert(
  "policy says ranking only applies to matching results",
  /matching result|only on the matching|only applies to matching|matching category results/i.test(policy),
  "Visibility ranking must apply only to matching results.",
);

assert(
  "read model links to print-to-digital policy",
  /print-to-digital-visibility-policy\.md/.test(readModel),
  "Category listing monetization read model must reference Gate G0 policy.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
