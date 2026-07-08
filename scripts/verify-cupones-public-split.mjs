import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "app/(site)/cupones/page.tsx",
  "app/(site)/cupones/resultados/page.tsx",
  "app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md",
];

const implementationFiles = [
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx",
  "app/(site)/cupones/page.tsx",
  "app/(site)/cupones/resultados/page.tsx",
  "app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md",
  "scripts/verify-cupones-public-split.mjs",
];

const allowedTouchedFiles = new Set([
  ...implementationFiles,
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx",
]);

const couponOfferTypes = [
  "coupon",
  "promotion",
  "seasonal_special",
  "bundle",
  "featured_deal",
];

const fakeStrings = [
  "saved coupon",
  "coupon wallet",
  "claimed",
  "redeemed",
  "scan to redeem",
  "best route",
  "buy now",
  "order online",
];

function relPath(file) {
  return path.join(root, file);
}

function read(file) {
  return readFileSync(relPath(file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getTouchedFiles() {
  try {
    const output = execSync("git diff --name-only --diff-filter=ACMRTUXB && git ls-files --others --exclude-standard", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split(/\r?\n/)
      .map((file) => file.trim().replaceAll("\\", "/"))
      .filter(Boolean);
  } catch (error) {
    throw new Error(`Unable to inspect git working tree: ${error.message}`);
  }
}

for (const file of requiredFiles) {
  assert(existsSync(relPath(file)), `Missing required file: ${file}`);
}

const audit = read("app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md");
assert(audit.includes("Cupones V1"), "Audit file must include Cupones V1");

const client = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const couponPage = read("app/(site)/cupones/page.tsx");
const couponResultsPage = read("app/(site)/cupones/resultados/page.tsx");
const filtersDrawer = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx");

assert(
  client.includes('surface = "ofertas"') || existsSync(relPath("app/(site)/cupones/CuponesPublicSearchClient.tsx")),
  "Ofertas client must support coupon surface or a Cupones client must exist"
);
assert(client.includes('surface === "cupones"'), "Ofertas client must branch for coupon surface");
assert(client.includes("/cupones"), "Client must reference /cupones path");
assert(client.includes("/cupones/resultados"), "Client must reference /cupones/resultados path");
assert(couponPage.includes('surface="cupones"'), "Cupones landing must render coupon surface");
assert(couponResultsPage.includes('surface="cupones"'), "Cupones results must render coupon surface");

for (const offerType of couponOfferTypes) {
  assert(client.includes(offerType) || filtersDrawer.includes(offerType), `Missing coupon offer type: ${offerType}`);
}

assert(client.includes("setItems([])"), "Coupon surface must clear product item cards");
assert(client.includes("!isCupones && !loading && items.length > 0"), "Coupon surface must not render product item cards");
assert(client.includes("!isCupones && shoppingList.counts.itemCount > 0"), "Coupon surface must hide shopping list button");
assert(client.includes("!isCupones && selectedItem"), "Coupon surface must hide product item drawer");
assert(client.includes("!isCupones && listOpen"), "Coupon surface must hide shopping list panel");
assert(
  filtersDrawer.includes("!isCupones") && filtersDrawer.includes('value="price_low"'),
  "Coupon filters must guard product price sort behind !isCupones"
);

const runtimeImplementationFiles = implementationFiles.filter(
  (file) => !file.includes("/website-audit/") && file !== "scripts/verify-cupones-public-split.mjs"
);

const searchableText = runtimeImplementationFiles
  .filter((file) => existsSync(relPath(file)))
  .map((file) => read(file).toLowerCase())
  .join("\n");

for (const fakeString of fakeStrings) {
  assert(!searchableText.includes(fakeString), `Fake coupon/action string found: ${fakeString}`);
}

const touchedFiles = getTouchedFiles();
const disallowedTouched = touchedFiles.filter((file) => !allowedTouchedFiles.has(file));

assert(!touchedFiles.some((file) => file.includes("/migrations/")), "DB migration files must not be touched");
assert(!touchedFiles.some((file) => file.toLowerCase().includes("stripe")), "Stripe files must not be touched");
assert(!touchedFiles.some((file) => file.startsWith("app/(admin)") || file.includes("/admin/")), "Admin files must not be touched");
assert(!touchedFiles.some((file) => file.includes("/dashboard/")), "Dashboard files must not be touched");
assert(disallowedTouched.length === 0, `Disallowed touched files detected:\n${disallowedTouched.join("\n")}`);

console.log("Cupones V1 public split verifier passed.");
