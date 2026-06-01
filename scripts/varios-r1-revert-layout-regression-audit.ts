/**
 * Gate R1 — Revert bad Varios layout regression
 * Run: npm run varios:r1-revert-layout-regression-audit
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R1_REVERT_LAYOUT_REGRESSION_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const card = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
const gallery = read("app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx");
const fetchBrowse = read("app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts");
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const contact = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const pkg = read("package.json");

const bundle = [layout, preview, card, gallery, fetchBrowse, publish, contact, engagement].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Regression classification documented", audit.includes("MIXED_WITH_GOOD_FIXES"), auditPath);
add("Exact root cause documented", audit.includes("EnVentaDetailPageLayout"), auditPath);

const requiredAuditRows = [
  "Bad layout/media changes were reverted or restored",
  "Published listing visibility was preserved",
  "Public detail images are visible again",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("P4-F layout component removed", !exists("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailPageLayout.tsx"), "file absent");
add("Detail layout not using P4-F component", !layout.includes("EnVentaDetailPageLayout"), "EnVentaAnuncioLayout.tsx");
add("Preview not using P4-F component", !preview.includes("EnVentaDetailPageLayout"), "EnVentaPreviewPage.tsx");
add("detailPageMax token removed", !read("app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts").includes("detailPageMax"), "enVentaBrand.ts");
add("Media gallery receives urls", layout.includes("EnVentaMediaGallery") && layout.includes("urls={images}"), "detail layout");
add("Results card renders hero image", card.includes("model.heroImage") && card.includes("<img"), "EnVentaResultListingCard.tsx");
add("Visibility fetch preserved", fetchBrowse.includes("queryEnVentaBrowseListings"), "fetchEnVentaPublicListingsForBrowse.ts");
add("Publish finalize preserved", publish.includes("finalizeEnVentaListingForPublicBrowse"), "enVentaPublishFromDraft.ts");
add("Preview results sample preserved", preview.includes("EnVentaPreviewResultsCardSample"), "EnVentaPreviewPage.tsx");

add("Label Varios", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("Label Hacer oferta", bundle.includes("Hacer oferta"), "bundle");
add("Label Guardar", engagement.includes("Guardar"), "engagement");
add("Label Compartir", engagement.includes("Compartir"), "engagement");
add("Label Reportar", engagement.includes("Reportar"), "engagement");
add("Label Llamar", contact.includes("Llamar"), "enVentaContactActions.ts");
add("Label Mensaje", contact.includes("Mensaje") || read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx").includes("Mensaje"), "contact");
add("Label Correo", contact.includes("Correo"), "enVentaContactActions.ts");

add("No public $9.99", !/\$9\.99/.test(bundle), "bundle");
add("No Boost/Impulsar", !/\bImpulsar\b|"Boost"/.test(bundle), "bundle");
add("No Stripe", !/stripe/i.test(bundle), "bundle");
add("No Supabase migrations in gate diff", !exists("supabase/migrations/VARIOS_R1"), "no migration edits");

let diffNames: string[] = [];
try {
  diffNames = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  diffNames = [];
}

const gateFiles = diffNames.filter(
  (f) =>
    f.startsWith("app/(site)/clasificados/en-venta/") ||
    f.startsWith("app/lib/clasificados/en-venta/") ||
    f === "scripts/varios-r1-revert-layout-regression-audit.ts" ||
    f === "package.json"
);
const badGate = gateFiles.filter(
  (f) =>
    f.includes("/autos/") ||
    f.includes("/servicios/") ||
    f.includes("/rentas/") ||
    f.includes("supabase/migrations")
);
add("Gate edits scoped to en-venta", badGate.length === 0, badGate.join(", ") || gateFiles.join(", "));
add("Gate R1 npm script", pkg.includes("varios:r1-revert-layout-regression-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R1 — Revert layout regression audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
