/**
 * Gate 2O — Varios Final Visible Label + Launch Honesty Closeout
 * Run: npm run enventa:gate2o-final-closeout-audit
 */
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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2O_VARIOS_FINAL_CLOSEOUT.md";
add("Gate 2O closeout audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Audit recommends READY or NOT READY", /READY FOR ONE FINAL QA|NOT READY/.test(audit), auditPath);

const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
add("Varios label constant", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("For Sale label constant", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");
add("Internal slug unchanged", labels.includes("en-venta"), "enVentaPublicLabels.ts");

const detailPage = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
add(
  "Shared detail chip maps en-venta to Varios",
  detailPage.includes('"en-venta": { es: "Varios"'),
  "anuncio/[id]/page.tsx"
);
add(
  "Shared detail chip does not leak Spanish En Venta",
  !detailPage.includes('"en-venta": { es: "En Venta"'),
  "anuncio/[id]/page.tsx"
);
add("leonix_ad_id passed to EnVentaAnuncioLayout", detailPage.includes("leonix_ad_id: listing.leonix_ad_id"), "anuncio/[id]/page.tsx");

const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
add("Leonix Ad ID rendered on detail layout", layout.includes("listing.leonix_ad_id"), "EnVentaAnuncioLayout.tsx");
add("Report drawer mounted on detail", layout.includes("EnVentaListingReportDrawer"), "EnVentaAnuncioLayout.tsx");

const publishHub = read("app/(site)/clasificados/publicar/en-venta/page.tsx");
add("Publish hub redirects to Pro", publishHub.includes("redirect") && publishHub.includes("pro"), "publicar/en-venta/page.tsx");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro preview uses family safety", proApp.includes("evaluateEnVentaFamilySafetyFromState"), "LeonixEnVentaProApplication.tsx");
add("Pro included-at-no-charge copy", proApp.includes("incluido sin costo") || proApp.includes("included at no charge"), "Pro app");

const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
add("Free preview uses family safety", freeApp.includes("evaluateEnVentaFamilySafetyFromState"), "LeonixEnVentaFreeApplication.tsx");

const previewDraft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
add("Preview draft blocks unsafe content", previewDraft.includes("evaluateEnVentaFamilySafetyFromState"), "enVentaPreviewDraft.ts");

const publishFlow = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
add("Publish blocks unsafe content", publishFlow.includes("evaluateEnVentaFamilySafetyFromState"), "enVentaPublishFromDraft.ts");
add("Publish returns leonixAdId", publishFlow.includes("leonixAdId"), "enVentaPublishFromDraft.ts");

const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
add("Publish success shows Leonix Ad ID", submitBar.includes("leonixAdId") && submitBar.includes("Leonix Ad ID"), "EnVentaPublishSubmitBar.tsx");
add("Publish success uses public label helper", submitBar.includes("enVentaPublicLabel"), "EnVentaPublishSubmitBar.tsx");

const dashboard = read("app/(site)/dashboard/mis-anuncios/page.tsx");
add("Dashboard uses Varios public label", dashboard.includes("enVentaPublicLabel"), "mis-anuncios/page.tsx");
add(
  "Dashboard does not show En venta chip",
  !dashboard.includes('"En venta"') && !dashboard.includes("? \"En venta\""),
  "mis-anuncios/page.tsx"
);

const manageCard = read("app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx");
add("Seller card shows leonixAdId", manageCard.includes("leonixAdId"), "EnVentaListingManageCard.tsx");
add("Refrescar CTA present", /Refrescar|Refresh listing/i.test(manageCard), "EnVentaListingManageCard.tsx");

const safety = read("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts");
add("Moderation is deterministic (no AI provider)", safety.includes("No external AI"), "enVentaFamilySafety.ts");
add("No fake AI provider strings", !/openai|anthropic|gpt-4/i.test(safety), "enVentaFamilySafety.ts");

const policy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Report reasons defined", policy.includes("EN_VENTA_REPORT_REASONS"), "enVentaPolicyCopy.ts");
add("Report disclaimer defined", policy.includes("EN_VENTA_REPORT_DISCLAIMER"), "enVentaPolicyCopy.ts");
add("Platform responsibility copy", policy.includes("EN_VENTA_PLATFORM_RESPONSIBILITY"), "enVentaPolicyCopy.ts");

add("Report drawer file exists", exists("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx"), "drawer");
add("Report API route exists", exists("app/api/clasificados/en-venta/report/route.ts"), "report route");
add("Report submit helper exists", exists("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts"), "submit helper");

const reportSubmit = read("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts");
add("Report email includes leonix_ad_id", reportSubmit.includes("leonix_ad_id"), "submitEnVentaListingReport.ts");

const defaults = read("app/lib/clasificados/enVentaContentDefaults.ts");
const publicTsxPaths = [
  "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
  "app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx",
  "app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx",
  "app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx",
  "app/lib/clasificados/enVentaContentDefaults.ts",
];

let no999 = !defaults.includes("9.99");
let noBoostPublic = true;
let noFakeAiPublic = true;
let noEnVentaChipPublic = true;
for (const rel of publicTsxPaths) {
  const t = read(rel);
  if (t.includes("9.99")) no999 = false;
  const lower = t.toLowerCase();
  if (lower.includes("impulsar") || lower.includes("boost your") || lower.includes("visibility boost")) {
    noBoostPublic = false;
  }
  if (/inteligencia artificial|ai moderation|approved by ai|moderado por ia/i.test(t)) {
    noFakeAiPublic = false;
  }
  if (/"En Venta"|'En Venta'|>En Venta</.test(t)) {
    noEnVentaChipPublic = false;
  }
}
add("No public $9.99 in key Varios surfaces", no999, "grep key TSX");
add("No public Boost/Impulsar in key Varios surfaces", noBoostPublic, "grep key TSX");
add("No fake AI claims in key Varios surfaces", noFakeAiPublic, "grep key TSX");
add("No Spanish En Venta category label in key public TSX", noEnVentaChipPublic, "grep key TSX");

const resultCard = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
add("No DESTACADO/FEATURED badges", !resultCard.includes("DESTACADO") && !resultCard.includes("FEATURED"), "result card");

const pkg = read("package.json");
add("Gate 2O closeout npm script registered", pkg.includes("enventa:gate2o-final-closeout-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2O — Varios final closeout audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
