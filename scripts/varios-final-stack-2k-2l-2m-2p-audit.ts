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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_VARIOS_FINAL_STACK_2K_2L_2M_2P.md";
add("Audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE section", audit.includes("TRUE/FALSE"), auditPath);

const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
add("Varios in labels", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("For Sale in labels", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");

const defaults = read("app/lib/clasificados/enVentaContentDefaults.ts");
add("No 9.99 in defaults", !defaults.includes("9.99"), "enVentaContentDefaults.ts");
add("Landing value prop marketplace", defaults.includes("Compra, vende o regala"), "enVentaContentDefaults.ts");

const detailPage = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
add(
  "Shared detail chip uses Varios",
  detailPage.includes('es: "Varios"') && !detailPage.includes('"en-venta": { es: "En Venta"'),
  "anuncio/[id]/page.tsx"
);
add("Leonix Ad ID on public detail", detailPage.includes("leonix_ad_id"), "anuncio/[id]/page.tsx");

add("Free app preserved", exists("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx"), "free app");

const publishHub = read("app/(site)/clasificados/publicar/en-venta/page.tsx");
add("Publish hub redirects Pro", publishHub.includes("redirect") && publishHub.includes("PUBLICAR_PRO"), "page.tsx");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro included copy", proApp.includes("incluido sin costo") || proApp.includes("included at no charge"), "Pro app");

const publishFlow = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
add("Pre-publish safety check", publishFlow.includes("evaluateEnVentaFamilySafetyFromState"), "enVentaPublishFromDraft");
add("Two-phase publish (draft then active)", publishFlow.includes('status: "draft"') && publishFlow.includes('status: "active"'), "enVentaPublishFromDraft");

const safety = read("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts");
add("Deterministic moderation exists", safety.includes("evaluateEnVentaFamilySafety"), "enVentaFamilySafety.ts");
add("No AI provider claimed", !safety.includes("openai") && !safety.includes("anthropic") && !safety.includes("GPT"), "enVentaFamilySafety.ts");

const policy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Report reasons complete (8)", policy.includes("prohibited") && policy.includes("scam") && policy.includes("other") && policy.includes("offensive") && policy.includes("misleading") && policy.includes("wrong_category") && policy.includes("sold_unavailable"), "enVentaPolicyCopy");
add("Report disclaimer", policy.includes("no participa en la venta") || policy.includes("not a party"), "enVentaPolicyCopy");
add("Platform responsibility", policy.includes("EN_VENTA_PLATFORM_RESPONSIBILITY"), "enVentaPolicyCopy");
add("Seller hidden notice", policy.includes("enVentaSellerHiddenNotice"), "enVentaPolicyCopy");

add("Report drawer exists", exists("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx"), "drawer");
add("Report API route", exists("app/api/clasificados/en-venta/report/route.ts"), "report API");

const reportSubmit = exists("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts")
  ? read("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts")
  : "";
add("Report includes Leonix Ad ID", reportSubmit.includes("leonix_ad_id"), "submitEnVentaListingReport");
add("Report sends admin email", reportSubmit.includes("sendLeonixResendEmail"), "submitEnVentaListingReport");

const manageCard = read("app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx");
add("Dashboard shows Leonix Ad ID", manageCard.includes("leonixAdId"), "EnVentaListingManageCard");

const results = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
add("No impulsar in results", !results.toLowerCase().includes("impulsar"), "results");
add("republish_sort_at ordering", results.includes("republish_sort_at"), "results");

const resultCard = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
add("No per-card trust box clutter", !resultCard.includes("Anuncio moderado por Leonix"), "result card");
add("No DESTACADO/FEATURED badge", !resultCard.includes("DESTACADO") && !resultCard.includes("FEATURED"), "result card");

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

const failed = rows.filter((r) => !r.pass);
console.log("# Varios Final Stack 2K+2L+2M+2P Audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
