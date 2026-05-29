/**
 * Gate P4 — Varios typography + engagement audit
 * Run: npm run varios:p4-typography-engagement-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_P4_TYPOGRAPHY_ENGAGEMENT_AUDIT.md";
const typo = read("app/(site)/clasificados/en-venta/shared/styles/enVentaTypography.ts");
const hero = read("app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx");
const stack = read("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const detail = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const saveBtn = read("app/components/clasificados/analytics/LeonixSaveButton.tsx");
const pkg = read("package.json");

const bundle = [typo, hero, stack, engagement, preview, detail, saveBtn].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Servicios pattern documented", read(auditPath).includes("serviciosEngagementListingKey"), auditPath);
add("Typography tokens module", typo.includes("EN_VENTA_TYPO"), "enVentaTypography.ts");
add("Hero uses typography tokens", hero.includes("EN_VENTA_TYPO"), "EnVentaListingHero.tsx");
add("Content stack uses typography tokens", stack.includes("EN_VENTA_TYPO"), "EnVentaDetailContentStack.tsx");
add("Engagement row component", engagement.includes("EnVentaEngagementRow"), "EnVentaEngagementRow.tsx");
add("Guardar label", bundle.includes("Guardar") && bundle.includes("Save"), "bundle");
add("Compartir via share button", engagement.includes("LeonixShareButton"), "EnVentaEngagementRow.tsx");
add("Reportar label", bundle.includes("Reportar") || bundle.includes("Report"), "bundle");
add("Preview uses engagement row", preview.includes('mode="preview"'), "EnVentaPreviewPage.tsx");
add("Detail uses live engagement row", detail.includes('mode="live"'), "EnVentaAnuncioLayout.tsx");
add("Heart save icon option", saveBtn.includes('iconStyle') && saveBtn.includes("heart"), "LeonixSaveButton.tsx");
add("Share success copy ES", preview.includes("Enlace copiado") || bundle.includes("Enlace copiado"), "copy strings");
add("Share success copy EN", preview.includes("Link copied") || bundle.includes("Link copied"), "copy strings");
add("No fake counter: 0 vistas", !bundle.includes("0 vistas"), "bundle");
add("No fake counter: 0 guardados", !bundle.includes("0 guardados"), "bundle");
add("No fake counter: 0 comentarios", !bundle.includes("0 comentarios"), "bundle");
add("No fake me gusta counts in UI", !/\d+\s+me gusta/i.test(bundle), "bundle");
add("Listing key helper", typo.includes("enVentaEngagementListingKey"), "enVentaTypography.ts");
add("Report anchor id", read("app/(site)/clasificados/en-venta/listing/EnVentaListingReportDrawer.tsx").includes("enventa-listing-report"), "drawer");
add("Gate P4 npm script", pkg.includes("varios:p4-typography-engagement-audit"), "package.json");

const forbidden = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/components/Navbar",
  "app/layout.tsx",
];
const allowedOutside = ["app/components/clasificados/analytics/LeonixSaveButton.tsx"];
const diffNames = process.env.GIT_DIFF_NAMES?.split("\n").filter(Boolean) ?? [];
for (const f of diffNames) {
  const hit = forbidden.find((x) => f.replace(/\\/g, "/").includes(x));
  if (hit && !allowedOutside.some((a) => f.replace(/\\/g, "/").includes(a))) {
    add(`Unrelated file not modified: ${f}`, false, hit);
  }
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4 — Varios typography + engagement audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
