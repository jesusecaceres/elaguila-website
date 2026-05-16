import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function readAllFiles(relDir, ext = ".tsx") {
  const dir = path.join(root, relDir);
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...readAllFiles(path.join(relDir, entry.name), ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      out.push({ rel: path.join(relDir, entry.name), text: fs.readFileSync(full, "utf8") });
    }
  }
  return out;
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const planHelpers = read("app/(site)/clasificados/components/planHelpers.ts");
const planHelpersCode = planHelpers
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
assert(
  "planHelpers excludes account membership fields",
  !/\bmembership_tier\b|\bmembershipTier\b|\bmembership\b|\buserPlan\b|\buser_plan\b|\bsellerPlan\b|\bseller_plan\b/.test(planHelpersCode),
  "Generic listing plan helpers must not infer ad capability from account/profile membership fields.",
);
assert(
  "planHelpers does not promote business/lite/premium heuristics",
  !/business_lite|business_premium|includes\("business"\)|includes\("lite"\)|includes\("premium"\)/.test(planHelpersCode),
  "business_lite/business_premium and generic business/lite/premium strings must not become universal listing Pro.",
);
assert(
  "planHelpers scopes Pro semantics to En Venta",
  /EN_VENTA_CATEGORIES/.test(planHelpers) && /isEnVenta/.test(planHelpers),
  "En Venta Free/Pro can remain category-specific; other categories must use categoryAdPlans.",
);

const shell = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
assert(
  "dashboard shell uses neutral account status copy",
  /accountStatus/.test(shell) && /accountMetadata/.test(shell) && !/ProBadge|LEONIX Pro|Gratis"|Free"/.test(shell),
  "Dashboard shell must not render membership_tier as a global Free/Pro monetization chip.",
);

const dashboardFiles = readAllFiles("app/(site)/dashboard");
const dashboardJoined = dashboardFiles.map((f) => `// ${f.rel}\n${f.text}`).join("\n");
assert(
  "dashboard pages do not map account tiers to Pro display",
  !/business_lite|business_premium|LEONIX Pro|Gratis \/ Free|showBizTeaser|membershipBadge|planLabel/.test(dashboardJoined),
  "Dashboard pages must not normalize account membership into a global Pro/Free listing capability.",
);

const adminUsersList = read("app/admin/(dashboard)/usuarios/page.tsx");
assert(
  "admin users list treats membership as profile metadata",
  !/Pro \/ paid|isPaidTier|paidCount/.test(adminUsersList),
  "Admin user rollups must not present account membership as global paid listing capability.",
);

const navbar = read("app/components/Navbar.tsx");
assert(
  "navbar uses neutral account badge",
  /accountBadgeLabel/.test(navbar) && !/business_lite|business_premium|membership_tier|LEONIX Pro|planLabel/.test(navbar),
  "Global nav account badge must not normalize membership/account_type to a Pro display.",
);

const categoryPlans = read("app/lib/listingPlans/categoryAdPlans.ts");
assert(
  "categoryAdPlans remains source of truth",
  /resolveCategoryAdPlan/.test(categoryPlans) && /profiles\.membership_tier/.test(categoryPlans),
  "categoryAdPlans should remain present and explicitly reject account membership as listing truth.",
);

const docs = read("docs/category-ad-plan-rules.md");
assert(
  "docs state membership is not listing truth",
  /profiles\.membership_tier/.test(docs) &&
    /not.*account membership/i.test(docs) &&
    /Dashboard shell \/ Navbar account badges must describe.*account or profile only/i.test(docs),
  "category-ad-plan-rules must document account metadata vs listing monetization.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
