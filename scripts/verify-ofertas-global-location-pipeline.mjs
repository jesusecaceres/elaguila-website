import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/ofertas-locales/OFERTAS_GLOBAL_LOCATION_PIPELINE_AUDIT.md");
const appCopyPath = path.join(root, "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const drawerPath = path.join(root, "app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx");
const searchClientPath = path.join(root, "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const itemHelpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const offerHelpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const locationHelpersPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesLocationHelpers.ts");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireText(label, haystack, needle) {
  if (haystack.includes(needle)) pass(label);
  else fail(`${label} missing "${needle}"`);
}

if (!existsSync(auditPath)) fail("audit file exists");
else pass("audit file exists");

requireText("location helpers", readFileSync(locationHelpersPath, "utf8"), "normalizeOfertaLocalCountry");
requireText("US state options", readFileSync(locationHelpersPath, "utf8"), "OFERTA_LOCAL_US_STATE_CODES");

const appCopy = readFileSync(appCopyPath, "utf8");
requireText("english state label", appCopy, 'locationStateLabel: "State / Province / Region"');
requireText("spanish state label", appCopy, 'locationStateLabel: "Estado / Provincia / Región"');
requireText("english postal label", appCopy, 'locationPostalLabel: "ZIP / Postal code"');
requireText("spanish postal label", appCopy, 'locationPostalLabel: "ZIP / Código postal"');

const drawer = readFileSync(drawerPath, "utf8");
requireText("drawer postal component", drawer, "OfertaLocalPostalInput");
requireText("drawer state component", drawer, "OfertaLocalRegionStateInput");
if (drawer.includes('inputMode="numeric"')) fail("drawer still uses numeric postal inputMode");
else pass("drawer postal is not numeric-only");

const searchClient = readFileSync(searchClientPath, "utf8");
requireText("search client city param", searchClient, 'params.set("city"');
requireText("search client zip param", searchClient, 'params.set("zip"');
requireText("search client country param", searchClient, 'params.set("country"');
requireText("search postal alias reader", searchClient, "readOfertaLocalPostalFromSearchParams");

const itemHelpers = readFileSync(itemHelpersPath, "utf8");
requireText("item q includes city", itemHelpers, "item.city");
requireText("item postal alias parse", itemHelpers, "readOfertaLocalPostalFromSearchParams");

const offerHelpers = readFileSync(offerHelpersPath, "utf8");
requireText("offer q includes city", offerHelpers, "offer.city");
if (offerHelpers.includes('.replace(/\\D/g, "").slice(0, 5)')) {
  fail("offer helpers still strip non-digit ZIP");
} else {
  pass("offer helpers use international postal matching");
}

const allowedPrefixes = [
  "app/(site)/publicar/ofertas-locales/",
  "app/(site)/clasificados/ofertas-locales/",
  "app/lib/ofertas-locales/",
  "scripts/verify-ofertas-global-location-pipeline.mjs",
  "package.json",
];

const changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const gateChanges = changed.filter((file) =>
  allowedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))
);

if (gateChanges.length === 0) fail("no Ofertas location gate files in git diff");
else pass(`Ofertas location files in diff: ${gateChanges.length}`);

const forbiddenTouched = changed.filter(
  (file) =>
    !allowedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))
);

if (forbiddenTouched.length > 0) {
  console.warn(`WARN: unrelated dirty files present (not gate changes): ${forbiddenTouched.join(", ")}`);
}
