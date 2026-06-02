/**
 * Gate P4-G — Varios contact / WhatsApp / engagement audit
 * Run: npm run varios:p4g-contact-whatsapp-engagement-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_P4G_CONTACT_WHATSAPP_ENGAGEMENT_AUDIT.md";
const contactActions = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const phoneDisplay = read("app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts");
const contactBtns = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const pkg = read("package.json");

const bundle = [contactActions, phoneDisplay, contactBtns, engagement, preview, publish, layout].join("\n");
const auditMd = exists(auditPath) ? read(auditPath) : "";

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", auditMd.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("WhatsApp visibility root cause documented", auditMd.includes("contactMethod === \"whatsapp\""), auditPath);
add("Phone format helper exists", phoneDisplay.includes("formatEnVentaPhoneDisplay"), "enVentaPhoneDisplay.ts");
add("Leonix:whatsapp publish pair", publish.includes("Leonix:whatsapp"), "enVentaPublishFromDraft.ts");
add("WhatsApp when digits valid (preview builder)", contactActions.includes("const showWa = waValid"), "enVentaContactActions.ts");
add("Live builder accepts whatsappTel", contactActions.includes("whatsappTel"), "enVentaContactActions.ts");
add("Layout reads Leonix:whatsapp", layout.includes("enVentaWhatsappFromDetailPairs"), "EnVentaAnuncioLayout.tsx");
add("WhatsApp label in contact UI", contactBtns.includes("WhatsApp"), "EnVentaContactButtons.tsx");
add("WhatsApp icon SVG", contactBtns.includes("IconWhatsApp"), "EnVentaContactButtons.tsx");
add("Share success copy ES", bundle.includes("Enlace copiado"), "preview + engagement");
add("Share success copy EN", bundle.includes("Link copied"), "preview + engagement");
add(
  "Preview unpublished persistence hint ES",
  engagement.includes("Disponible cuando el anuncio esté publicado."),
  "EnVentaEngagementRow.tsx"
);
add(
  "Preview unpublished persistence hint EN",
  engagement.includes("Available when the listing is published."),
  "EnVentaEngagementRow.tsx"
);
add("Guardar label", bundle.includes("Guardar"), "bundle");
add("Compartir label", bundle.includes("Compartir") || engagement.includes("LeonixShareButton"), "bundle");
add("Reportar label", bundle.includes("Reportar"), "bundle");
add("Llamar label", bundle.includes("Llamar"), "bundle");
add("Mensaje label", contactBtns.includes("Mensaje") || contactBtns.includes("Message"), "contact buttons");
add("Correo label", bundle.includes("Correo"), "bundle");
add("Varios public label helper", exists("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts"), "enVentaPublicLabels.ts");
add("No public $9.99 copy", !bundle.includes("$9.99"), "bundle");
add("No Stripe copy in gate files", !/\bstripe\b/i.test(bundle), "bundle");
add("No Boost/Impulsar copy", !bundle.includes("Impulsar") && !bundle.toLowerCase().includes("boost"), "bundle");
add("No fake counter strings", !bundle.includes("0 vistas") && !bundle.includes("0 guardados"), "bundle");
add(
  "Gate P4-G npm script",
  pkg.includes("varios:p4g-contact-whatsapp-engagement-audit"),
  "package.json"
);

const forbidden = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/components/Navbar",
  "app/layout.tsx",
  "app/api/stripe",
];
const allowedOutside = [
  "app/components/clasificados/analytics/",
  "app/lib/clasificados/en-venta/",
];
const diffNames = process.env.GIT_DIFF_NAMES?.split("\n").filter(Boolean) ?? [];
for (const f of diffNames) {
  const norm = f.replace(/\\/g, "/");
  const hit = forbidden.find((x) => norm.includes(x));
  if (hit && !allowedOutside.some((a) => norm.includes(a))) {
    add(`Unrelated file not modified: ${f}`, false, hit);
  }
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4-G — Varios contact / WhatsApp / engagement audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
