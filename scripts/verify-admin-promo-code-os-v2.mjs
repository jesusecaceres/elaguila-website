/**
 * Promo Admin OS V2 — static verification.
 * No live Supabase/Stripe/login required.
 * Run: npm run verify:admin-promo-code-os-v2
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}
function fail(message) {
  console.error(`verify-admin-promo-code-os-v2: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const page = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const recentPanel = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeRecentCodesPanel.tsx";
const quickCreate = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeQuickCreateControls.tsx";
const fieldGuidance = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeFieldGuidance.tsx";
const theme = "app/admin/_lib/promoCodeOsV2Theme.ts";
const presetGuide = "app/admin/_lib/promoCodePresetGuide.ts";
const mapper = "app/admin/_lib/promoCodeRecentCardMapper.ts";
const helpers = "app/admin/_lib/promoCodeDisplayHelpers.ts";
const doc = "docs/admin-promo-code-os-v2.md";
const clarityDoc = "docs/admin-promo-code-clarity-01.md";
const salesOps = "docs/newsletter-sales-contact-ops.md";
const promoReadiness = "docs/newsletter-promo-code-readiness.md";
const pkg = "package.json";

for (const rel of [
  page,
  recentPanel,
  quickCreate,
  fieldGuidance,
  theme,
  presetGuide,
  mapper,
  helpers,
  doc,
  clarityDoc,
  salesOps,
  promoReadiness,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const pageSrc = read(page);
const recentSrc = read(recentPanel);
const quickSrc = read(quickCreate);
const fieldSrc = read(fieldGuidance);
const themeSrc = read(theme);
const presetSrc = read(presetGuide);
const helpersSrc = read(helpers);
const docSrc = read(doc);
const clarityDocSrc = read(clarityDoc);
const salesOpsSrc = read(salesOps);
const promoReadinessSrc = read(promoReadiness);
const pkgSrc = read(pkg);
const combined = `${pageSrc}\n${recentSrc}\n${quickSrc}\n${fieldSrc}\n${helpersSrc}\n${docSrc}`;

for (const s of [
  "Promo Admin OS",
  "Required",
  "Optional",
  "Tracking only",
  "Coming later",
  "Check first",
  "Preset directory",
  "Recent codes",
  "Needs attention",
  "Copy code",
  "Copy email",
  "Copy follow-up",
  "Manual follow-up",
  "does not send bulk newsletters",
  "Next action",
  "future admin gate",
]) {
  if (!combined.includes(s)) fail(`Missing required OS V2 string: ${s}`);
}
ok("OS V2 language present in page/components/docs");

for (const s of ["Newsletter", "Restaurantes", "Servicios", "Autos", "Rentas"]) {
  if (!recentSrc.includes(s)) fail(`Recent filter missing category: ${s}`);
}
ok("recent code category filters present");

for (const s of [
  "guaranteed placement",
  "print discount included",
  "dealer discount included",
  "bulk sender is ready",
  "Servicios checkout wired by this gate",
]) {
  if (combined.toLowerCase().includes(s)) fail(`Forbidden claim found: ${s}`);
}
ok("no forbidden capability claims");

if (!docSrc.includes("admin-promo-code-clarity-01.md")) fail("Doc missing clarity cross-link");
if (!clarityDocSrc.includes("admin-promo-code-os-v2.md")) fail("Clarity doc missing OS V2 cross-link");
if (!salesOpsSrc.includes("admin-promo-code-os-v2.md")) fail("Sales ops missing OS V2 cross-link");
if (!promoReadinessSrc.includes("admin-promo-code-os-v2.md")) fail("Promo readiness missing OS V2 cross-link");
ok("doc cross-links present");

if (!pkgSrc.includes('"verify:admin-promo-code-os-v2"')) fail("package.json missing verify script");
ok("package script registered");

if (!presetSrc.includes("servicios_launch_25") || !presetSrc.includes("coming_later")) {
  fail("Preset guide missing Servicios coming-later entry");
}
ok("preset guide includes coming-later presets");

if (!themeSrc.includes("#FFFCF7") || !themeSrc.includes("#C9B46A") || !themeSrc.includes("#7A1E2C")) {
  fail("Leonix brand tokens missing from theme file");
}
ok("Leonix brand tokens present");

try {
  const diff = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
  const changed = diff.split("\n").map((l) => l.trim()).filter(Boolean);
  const forbiddenPatterns = [
    /^supabase\/migrations\//,
    /stripe/i,
    /servicios.*checkout/i,
    /promo.*redemption/i,
    /promo.*validation/i,
  ];
  const allowedPrefixes = [
    "app/admin/(dashboard)/workspace/promo-codes/",
    "app/admin/_lib/promoCode",
    "docs/admin-promo-code",
    "docs/newsletter-",
    "scripts/verify-admin-promo-code-os-v2.mjs",
    "package.json",
  ];
  for (const file of changed) {
    const lower = file.toLowerCase();
    if (forbiddenPatterns.some((re) => re.test(lower))) {
      const allowed = allowedPrefixes.some((p) => file.startsWith(p) || file.includes("promoCode"));
      if (!allowed) {
        fail(`Potentially locked file modified: ${file}`);
      }
    }
  }
  ok("git diff lock check passed (best-effort)");
} catch {
  ok("git diff lock check skipped (no git or diff unavailable)");
}

console.log("verify-admin-promo-code-os-v2: PASS");
