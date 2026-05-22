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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2N_VARIOS_LAUNCH_COMPLETION.md";
add("Audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE section", audit.includes("TRUE/FALSE"), "AUDIT_GATE_2N");

const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
add("Varios in labels", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("For Sale in labels", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");
add('No "Varrios" typo', !labels.includes("Varrios"), "enVentaPublicLabels.ts");

add("Free app exists", exists("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx"), "free app");

const publishHub = read("app/(site)/clasificados/publicar/en-venta/page.tsx");
add("Publish hub redirects Pro", publishHub.includes("redirect") && publishHub.includes("PUBLICAR_PRO"), "page.tsx");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro included copy", proApp.includes("incluido sin costo") || proApp.includes("included at no charge"), "Pro app");
add("No switch to Free", !proApp.includes("Cambiar a Gratis"), "Pro app");

const defaults = read("app/lib/clasificados/enVentaContentDefaults.ts");
add("No 9.99 in defaults", !defaults.includes("9.99"), "enVentaContentDefaults.ts");

const results = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
add("Results Varios", results.includes("enVentaPublicLabel") || results.includes("Varios"), "results");
add("No impulsar in results", !results.toLowerCase().includes("impulsar"), "results");

const reportDrawer = read("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx");
add("Report drawer exists", reportDrawer.includes("Reportar anuncio"), "EnVentaListingReportDrawer");
const policyCopy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Report reasons", policyCopy.includes("prohibited") && policyCopy.includes("scam"), "enVentaPolicyCopy");
add(
  "Report disclaimer",
  policyCopy.includes("no participa en la venta") || policyCopy.includes("not a party"),
  "enVentaPolicyCopy"
);

const reportApi = read("app/api/clasificados/en-venta/report/route.ts");
add("Report API exists", reportApi.includes("listing_reports") || reportApi.includes("submitEnVentaListingReport"), "report route");

const safety = read("app/(site)/clasificados/en-venta/moderation/enVentaFamilySafety.ts");
add("Family safety exists", safety.includes("evaluateEnVentaFamilySafety"), "enVentaFamilySafety.ts");

const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
add("Refrescar label", misAnuncios.includes("Refrescar anuncio"), "mis-anuncios");
add("renewEnVentaRepublish", misAnuncios.includes("renewEnVentaRepublish"), "mis-anuncios");

const republishSort = read("app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx");
add("republish_sort_at ordering", republishSort.includes("republish_sort_at"), "results");

const policy = read("app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy.ts");
add("Platform responsibility copy", policy.includes("EN_VENTA_PLATFORM_RESPONSIBILITY"), "enVentaPolicyCopy");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2N audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}`);
  process.exit(1);
}
