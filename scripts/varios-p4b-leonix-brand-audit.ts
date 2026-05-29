/**
 * Gate P4-B — Leonix brand system for Varios preview/detail
 * Run: npm run varios:p4b-leonix-brand-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_P4B_LEONIX_BRAND_AUDIT.md";
const brand = read("app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts");
const typo = read("app/(site)/clasificados/en-venta/shared/styles/enVentaTypography.ts");
const hero = read("app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx");
const buyer = read("app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx");
const contact = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const detail = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const pkg = read("package.json");

const bundle = [brand, typo, hero, buyer, contact, preview, detail].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Brand mapping section", read(auditPath).includes("Color mapping"), auditPath);
add("Brand tokens module", brand.includes("LEONIX_VARIOS"), "enVentaBrand.ts");
add("Surface classes", brand.includes("EN_VENTA_SURFACE"), "enVentaBrand.ts");
add("Burgundy primary CTA", brand.includes("#7A1E2C") && hero.includes("primaryCta"), "hero + brand");
add("Cream page background", brand.includes("#F8F4EA") || brand.includes("#FFFDF7"), "brand");
add("Gold accents", brand.includes("#C9A84A"), "brand");
add("Charcoal text", typo.includes("#3D3428"), "typography");
add("Green trust accent", bundle.includes("#2A4536") || bundle.includes("#556B3E"), "bundle");
add("Label Hacer oferta", bundle.includes("Hacer oferta") || preview.includes("makeOffer"), "bundle");
add("Label Guardar", bundle.includes("Guardar"), "bundle");
add("Label Compartir", bundle.includes("Compartir"), "bundle");
add("Label Reportar", bundle.includes("Reportar"), "bundle");
add("Label Llamar", contact.includes("Llamar") || bundle.includes("Llamar"), "contact");
add("Label Mensaje", contact.includes("Mensaje") || bundle.includes("Mensaje"), "contact");
add("Label Correo", bundle.includes("Correo"), "bundle");
add("Preview uses brand surface", preview.includes("EN_VENTA_SURFACE"), "preview");
add("Detail uses brand surface", detail.includes("EN_VENTA_SURFACE"), "detail");
add("Engagement row preserved", preview.includes("EnVentaEngagementRow"), "preview");
add("No fake counter: 0 vistas", !bundle.includes("0 vistas"), "bundle");
add("No fake counter: 0 guardados", !bundle.includes("0 guardados"), "bundle");
add("No Stripe files in bundle", !bundle.includes("stripe"), "bundle");
add("Gate P4B npm script", pkg.includes("varios:p4b-leonix-brand-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4-B — Leonix brand audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
