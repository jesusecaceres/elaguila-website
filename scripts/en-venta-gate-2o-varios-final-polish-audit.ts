import fs from "fs";
import path from "path";

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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2O_VARIOS_FINAL_POLISH_SAFETY.md";
add("Audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE section", audit.includes("TRUE/FALSE"), auditPath);

const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
add("Varios in labels", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("For Sale in labels", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");

const detailPage = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
add(
  "Shared detail chip uses Varios",
  detailPage.includes('"en-venta": { es: "Varios"') || detailPage.includes('es: "Varios", en: "For Sale"'),
  "anuncio/[id]/page.tsx"
);
add(
  "Shared detail browse CTA Varios",
  detailPage.includes("Más en Varios"),
  "anuncio/[id]/page.tsx"
);
add(
  "No En Venta chip label remains",
  !detailPage.includes('"en-venta": { es: "En Venta"'),
  "anuncio/[id]/page.tsx"
);

const publishHub = read("app/(site)/clasificados/publicar/en-venta/page.tsx");
add("Publish hub redirects Pro", publishHub.includes("redirect") && publishHub.includes("PUBLICAR_PRO"), "page.tsx");

add("Free app exists", exists("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx"), "free app");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro included copy", proApp.includes("incluido sin costo") || proApp.includes("included at no charge"), "Pro app");

const defaults = read("app/lib/clasificados/enVentaContentDefaults.ts");
add("No 9.99 in defaults", !defaults.includes("9.99"), "defaults");

const results = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
add("No impulsar in results", !results.toLowerCase().includes("impulsar"), "results");
add("republish_sort_at ordering", results.includes("republish_sort_at"), "results");

const policy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Report reasons complete", policy.includes("prohibited") && policy.includes("scam") && policy.includes("other"), "enVentaPolicyCopy");
add("Report disclaimer", policy.includes("no participa en la venta") || policy.includes("not a party"), "enVentaPolicyCopy");
add("Seller hidden notice", policy.includes("enVentaSellerHiddenNotice"), "enVentaPolicyCopy");
add("Platform responsibility", policy.includes("EN_VENTA_PLATFORM_RESPONSIBILITY"), "enVentaPolicyCopy");

add("Report drawer exists", exists("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx"), "drawer");
add("Report API exists", exists("app/api/clasificados/en-venta/report/route.ts"), "report route");

add("Family safety file", exists("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts"), "moderation");

const safety = read("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts");
add("No AI claimed", !safety.includes("openai") && !safety.includes("anthropic") && !safety.includes("GPT"), "moderation");

const publishFlow = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
add("Pre-publish moderation check", publishFlow.includes("evaluateEnVentaFamilySafetyFromState"), "enVentaPublishFromDraft");

const resultCard = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
add("No DESTACADO badge", !resultCard.includes("DESTACADO") && !resultCard.includes("FEATURED"), "result card");

const forbiddenPublicBoost = ["impulsar", "boost your", "visibility boost"];
let boostOk = true;
for (const rel of [
  "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
  "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx",
  "app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx",
]) {
  const t = read(rel).toLowerCase();
  if (forbiddenPublicBoost.some((p) => t.includes(p))) boostOk = false;
}
add("No public Boost/Impulsar in key surfaces", boostOk, "grep key TSX");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2O — Varios final polish audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
