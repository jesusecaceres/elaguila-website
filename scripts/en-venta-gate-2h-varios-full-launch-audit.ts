import fs from "fs";
import path from "path";
import { assertEnVentaTaxonomySmoke, EN_VENTA_GATE2G_SUB_KEYS } from "../app/(site)/clasificados/en-venta/tests/enVentaTaxonomySmoke";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };

const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2H_VARIOS_FULL_LAUNCH_COMPLETION.md";
add("Audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE section", audit.includes("TRUE/FALSE"), auditPath);

const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
add("Varios Spanish label", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("For Sale English label", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");
add('No "Varrios" typo', !labels.includes("Varrios"), "enVentaPublicLabels.ts");

add("Gate 2G taxonomy smoke", assertEnVentaTaxonomySmoke(), "enVentaTaxonomySmoke.ts");
for (const k of EN_VENTA_GATE2G_SUB_KEYS) {
  add(`Subcategory ${k}`, read("app/(site)/clasificados/en-venta/taxonomy/subcategories.ts").includes(`key: "${k}"`), "subcategories.ts");
}

const subs = read("app/(site)/clasificados/en-venta/taxonomy/subcategories.ts");
const synonyms = read("app/(site)/clasificados/en-venta/taxonomy/synonyms.ts");
const safety = read("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts");
add(
  "No pet adoption taxonomy bucket",
  !subs.includes("pet-adoption") && !subs.includes("adopcion"),
  "subcategories.ts"
);
add(
  "No live animal sale bucket",
  !subs.includes("live-animal") && !subs.includes("animales-vivos"),
  "subcategories.ts"
);
add("Full vehicle sale blocked in moderation", safety.includes("live_animal_sale") && safety.includes("auto en venta"), "enVentaFamilySafety.ts");

const publishHub = read("app/(site)/clasificados/publicar/en-venta/page.tsx");
add("Publish hub redirects Pro", publishHub.includes("redirect") && publishHub.includes("PUBLICAR_PRO"), "page.tsx");
add("Free app exists", exists("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx"), "free app");

const hubClient = exists("app/(site)/clasificados/publicar/en-venta/EnVentaPublishHubClient.tsx")
  ? read("app/(site)/clasificados/publicar/en-venta/EnVentaPublishHubClient.tsx")
  : "";
if (hubClient) {
  add("Hub client no Free lane link", !hubClient.includes("PUBLICAR_FREE"), "EnVentaPublishHubClient.tsx");
}

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro included copy", proApp.includes("incluido sin costo") || proApp.includes("included at no charge"), "Pro app");
add("No switch to Free in Pro", !proApp.includes("Cambiar a Gratis"), "Pro app");

const defaults = read("app/lib/clasificados/enVentaContentDefaults.ts");
add("No 9.99 in defaults", !defaults.includes("9.99"), "enVentaContentDefaults.ts");

const results = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
const resultCard = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
add("Results use Varios labels", results.includes("enVentaPublicLabel") || results.includes("Varios"), "results");
add("No impulsar in results", !results.toLowerCase().includes("impulsar"), "results");
add("No DESTACADO badge copy", !resultCard.includes("DESTACADO") && !resultCard.includes("FEATURED"), "EnVentaResultListingCard.tsx");
add("republish_sort_at ordering", results.includes("republish_sort_at"), "results");

const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
add("Refrescar label", misAnuncios.includes("Refrescar anuncio"), "mis-anuncios");
add("renewEnVentaRepublish", misAnuncios.includes("renewEnVentaRepublish"), "mis-anuncios");

const policy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Report reasons", policy.includes("prohibited") && policy.includes("scam"), "enVentaPolicyCopy");
add("Report disclaimer", policy.includes("no participa en la venta") || policy.includes("not a party"), "enVentaPolicyCopy");
add("Platform responsibility", policy.includes("EN_VENTA_PLATFORM_RESPONSIBILITY"), "enVentaPolicyCopy");
add("Seller hidden notice", policy.includes("enVentaSellerHiddenNotice"), "enVentaPolicyCopy");

add("Report drawer", exists("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx"), "drawer");
add("Report API", exists("app/api/clasificados/en-venta/report/route.ts"), "report route");
add("Report submit helper", exists("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts"), "submit helper");

add("Family safety file", exists("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts"), "enVentaFamilySafety.ts");

const forbiddenPublicBoost = ["impulsar", "boost your", "visibility boost"];
let boostOk = true;
for (const rel of [
  "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
  "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx",
  "app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx",
  "app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx",
]) {
  const t = read(rel).toLowerCase();
  if (forbiddenPublicBoost.some((p) => t.includes(p))) boostOk = false;
}
add("No public Boost/Impulsar in key surfaces", boostOk, "grep key TSX");

const publishPath = [
  read("app/(site)/clasificados/publicar/en-venta/page.tsx"),
  proApp,
  read("app/(site)/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout.tsx"),
].join("\n");
add("No public Free vs Pro in publish entry", !publishPath.includes("Gratis vs Pro") && !publishPath.includes("Free vs Pro"), "publish");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2H — Varios full launch audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
