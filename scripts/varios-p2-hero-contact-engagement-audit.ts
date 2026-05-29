/**
 * Gate P2 — Varios hero / contact / engagement audit
 * Run: npm run varios:p2-hero-contact-audit
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

const auditPath = "app/(site)/clasificados/en-venta/VARIOS_P2_HERO_CONTACT_ENGAGEMENT_AUDIT.md";
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const detail = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const hero = read("app/(site)/clasificados/en-venta/shared/components/EnVentaListingHero.tsx");
const contactBtns = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const buyerPanel = read("app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx");
const contactUtils = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const previewModel = read("app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts");
const pkg = read("package.json");

const bundle = [preview, detail, hero, contactBtns, buyerPanel, contactUtils, previewModel].join("\n");

add("Audit markdown file exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table exists", read(auditPath).includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Hero component exists", hero.includes("EnVentaListingHero"), "EnVentaListingHero.tsx");
add("Preview uses hero", preview.includes("EnVentaListingHero"), "EnVentaPreviewPage.tsx");
add("Detail uses hero for en-venta", detail.includes("EnVentaListingHero"), "EnVentaAnuncioLayout.tsx");
add("Price $ in preview model", previewModel.includes("$${formatPriceInputDisplay"), "buildEnVentaPreviewModel.ts");
add("Negotiable label in hero", hero.includes("Precio negociable"), "EnVentaListingHero.tsx");
add("WhatsApp conditional in contact utils", contactUtils.includes('pref === "whatsapp"'), "enVentaContactActions.ts");
add("Live contact builder exists", contactUtils.includes("buildEnVentaLiveContactActions"), "enVentaContactActions.ts");
add("Contact card uses shared buttons", buyerPanel.includes("Contact") && contactBtns.includes("EnVentaContactButtons"), "buyer panel + buttons");
add("WhatsApp not always rendered", contactBtns.includes('id === "whatsapp"') && contactUtils.includes("showWa"), "conditional logic");
add("Distance block removed from preview", !preview.includes("/api/clasificados/distance") && !preview.includes("useMyLocation"), "EnVentaPreviewPage.tsx");
add("Map in contact card", buyerPanel.includes("Abrir mapa") || buyerPanel.includes("Open map"), "EnVentaBuyerPanel.tsx");
add("No fake view/save counters added", !bundle.includes("visualizaciones") && !bundle.includes("fake views"), "bundle scan");
add("Varios copy in flow", bundle.includes("Varios") || bundle.includes("For Sale"), "bundle");
add("Real save on detail", detail.includes("saved_listings") && detail.includes("LeonixLikeButton"), "EnVentaAnuncioLayout.tsx");
add("Real report drawer", detail.includes("EnVentaListingReportDrawer"), "EnVentaAnuncioLayout.tsx");
add("Share button wired", preview.includes("LeonixShareButton") && detail.includes("LeonixShareButton"), "preview + detail");
add("Gate P2 npm script", pkg.includes("varios:p2-hero-contact-audit"), "package.json");

const requiredRows = [
  "Varios preview/detail files inspected",
  "Hero title hierarchy improved",
  "WhatsApp only shows when provided",
  "Distance estimator block removed/hidden from contact card",
  "npm run build passed",
];
for (const r of requiredRows) {
  add(`Audit documents: ${r}`, read(auditPath).includes(r), auditPath);
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P2 — Varios hero/contact/engagement audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
