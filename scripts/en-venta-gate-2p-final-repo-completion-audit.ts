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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2P_VARIOS_FINAL_REPO_COMPLETION.md";
add("Gate 2P audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE section", audit.includes("TRUE/FALSE"), auditPath);

const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
add("Varios in labels", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("For Sale in labels", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");
add('No "Varrios" typo', !labels.includes("Varrios"), "enVentaPublicLabels.ts");

const detailPage = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
add(
  "Shared detail chip uses Varios (not En Venta)",
  detailPage.includes('es: "Varios"') && !detailPage.includes('"en-venta": { es: "En Venta"'),
  "anuncio/[id]/page.tsx"
);
add("Shared browse CTA says Más en Varios", detailPage.includes("Más en Varios"), "anuncio/[id]/page.tsx");

add("Free app preserved", exists("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx"), "free app");

const publishHub = read("app/(site)/clasificados/publicar/en-venta/page.tsx");
add("Publish hub redirects Pro", publishHub.includes("redirect") && publishHub.includes("PUBLICAR_PRO"), "page.tsx");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro included copy", proApp.includes("incluido sin costo") || proApp.includes("included at no charge"), "Pro app");
add("No Cambiar a Gratis in Pro", !proApp.includes("Cambiar a Gratis"), "Pro app");

const defaults = read("app/lib/clasificados/enVentaContentDefaults.ts");
add("No 9.99 in defaults", !defaults.includes("9.99"), "defaults");

const results = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
add("No impulsar in results", !results.toLowerCase().includes("impulsar"), "results");
add("republish_sort_at ordering", results.includes("republish_sort_at"), "results");

const resultCard = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
add("No DESTACADO/FEATURED badge", !resultCard.includes("DESTACADO") && !resultCard.includes("FEATURED"), "result card");

const policy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Report reasons", policy.includes("prohibited") && policy.includes("scam") && policy.includes("other"), "enVentaPolicyCopy");
add("Report disclaimer", policy.includes("no participa en la venta") || policy.includes("not a party"), "enVentaPolicyCopy");
add("Seller hidden notice", policy.includes("enVentaSellerHiddenNotice"), "enVentaPolicyCopy");
add("Platform responsibility", policy.includes("EN_VENTA_PLATFORM_RESPONSIBILITY"), "enVentaPolicyCopy");

add("Report drawer file", exists("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx"), "drawer");
add("Report API route", exists("app/api/clasificados/en-venta/report/route.ts"), "report API");

const safety = read("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts");
add("Deterministic moderation file", safety.includes("evaluateEnVentaFamilySafety"), "enVentaFamilySafety.ts");
add("No AI claimed in moderation", !safety.includes("openai") && !safety.includes("anthropic") && !safety.includes("GPT"), "enVentaFamilySafety.ts");

const publishFlow = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
add("Pre-publish safety check", publishFlow.includes("evaluateEnVentaFamilySafetyFromState"), "enVentaPublishFromDraft");

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
add("No public Boost/Impulsar in key surfaces", boostOk, "grep key files");

const hubClient = exists("app/(site)/clasificados/publicar/en-venta/EnVentaPublishHubClient.tsx")
  ? read("app/(site)/clasificados/publicar/en-venta/EnVentaPublishHubClient.tsx")
  : "";
if (hubClient) {
  add("Hub client no Free lane link", !hubClient.includes("PUBLICAR_FREE"), "EnVentaPublishHubClient.tsx");
}

const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
add("Refrescar label wired", misAnuncios.includes("Refrescar anuncio"), "mis-anuncios");
add("renewEnVentaRepublish wired", misAnuncios.includes("renewEnVentaRepublish"), "mis-anuncios");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2P — Varios final repo completion audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
