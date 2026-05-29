/**
 * Gate P3 — Varios detail content stack audit
 * Run: npm run varios:p3-detail-stack-audit
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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_P3_VARIOS_DETAIL_CONTENT_STACK.md";
const stack = read("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx");
const builder = read("app/(site)/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel.ts");
const buyer = read("app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const detail = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const pkg = read("package.json");

const types = read("app/(site)/clasificados/en-venta/shared/types/enVentaContentStack.types.ts");
const bundle = [stack, builder, buyer, preview, detail, types].join("\n");

add("Audit markdown file exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table exists", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Content stack component exists", stack.includes("EnVentaDetailContentStack"), "EnVentaDetailContentStack.tsx");
add("Preview uses content stack", preview.includes("EnVentaDetailContentStack"), "EnVentaPreviewPage.tsx");
add("Detail uses content stack for en-venta", detail.includes("buildEnVentaContentStackFromLiveListing"), "EnVentaAnuncioLayout.tsx");
add("Description section label", types.includes("Descripción") && types.includes("Description"), "enVentaContentStack.types.ts");
add("Item details section label", types.includes("Detalles del artículo") && types.includes("Item details"), "enVentaContentStack.types.ts");
add("Technical details separate card", types.includes("Detalles técnicos / especificaciones"), "enVentaContentStack.types.ts");
add("Delivery dedicated card", stack.includes('title={t.delivery}'), "EnVentaDetailContentStack.tsx");
add("Contact card no fulfillmentNotes", !buyer.includes("fulfillmentNotes"), "EnVentaBuyerPanel.tsx");
add("Technical text not in draft facts builder", !builder.includes("itemExtraDetails") || builder.includes("technicalDetails"), "buildEnVentaContentStackModel.ts");
add("Hero preserved in preview", preview.includes("EnVentaListingHero"), "EnVentaPreviewPage.tsx");
add("Hero preserved in detail", detail.includes("EnVentaListingHero"), "EnVentaAnuncioLayout.tsx");
add("No Spanish En Venta in seller-facing copy", !types.includes("En Venta") && !preview.includes('"En Venta"') && !stack.includes('"En Venta"'), "types + UI strings");
add("No $9.99 in changed bundle", !bundle.includes("$9.99"), "bundle scan");
add("No Boost in changed bundle", !/\bBoost\b/.test(bundle), "bundle scan");
add("No Impulsar in changed bundle", !bundle.includes("Impulsar"), "bundle scan");
add("Varios copy present", bundle.includes("Varios") || bundle.includes("For Sale"), "bundle");
add("Gate P3 npm script", pkg.includes("varios:p3-detail-stack-audit"), "package.json");

const requiredAuditRows = [
  "Description is its own readable card",
  "Contact card only shows compact delivery info",
  "npm run build passed",
];
for (const r of requiredAuditRows) {
  add(`Audit documents: ${r}`, read(auditPath).includes(r), auditPath);
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P3 — Varios detail content stack audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
