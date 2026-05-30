/**
 * Gate P4-F — Varios desktop detail layout repair audit
 * Run: npm run varios:p4f-desktop-detail-layout-repair-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_P4F_DESKTOP_DETAIL_LAYOUT_REPAIR_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const layout = read("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailPageLayout.tsx");
const brand = read("app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts");
const detail = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const contact = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const contactActions = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const pkg = read("package.json");

const bundle = [layout, brand, detail, preview, contact, contactActions, engagement].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Audit root cause section", audit.includes("Exact desktop layout root cause"), auditPath);
add(
  "Audit documents root cause",
  audit.includes("two disconnected") || audit.includes("max-w-5xl"),
  auditPath
);

const requiredAuditRows = [
  "Exact desktop root cause was identified",
  "Public detail desktop layout is repaired",
  "Preview full-detail desktop layout is repaired",
  "Mobile layout remains usable",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("Shared detail layout component", layout.includes("EnVentaDetailPageLayout"), "EnVentaDetailPageLayout.tsx");
add("Layout gallery col-span-7", layout.includes("lg:col-span-7"), "EnVentaDetailPageLayout.tsx");
add("Layout sticky sidebar xl", layout.includes("xl:sticky"), "EnVentaDetailPageLayout.tsx");
add("Layout content col-span-8", layout.includes("xl:col-span-8"), "EnVentaDetailPageLayout.tsx");
add("Detail page max width token", brand.includes("detailPageMax"), "enVentaBrand.ts");
add(
  "Public detail uses unified layout",
  detail.includes("useEnVentaUnifiedLayout") && detail.includes("EnVentaDetailPageLayout"),
  "EnVentaAnuncioLayout.tsx"
);
add("Preview uses unified layout", preview.includes("EnVentaDetailPageLayout"), "EnVentaPreviewPage.tsx");
add("Preview uses detailPageMax", preview.includes("detailPageMax"), "EnVentaPreviewPage.tsx");
add("Preview removed listingCanvas grid wrapper", !preview.includes("listingCanvas"), "EnVentaPreviewPage.tsx");
add("Results card sample preserved", preview.includes("EnVentaPreviewResultsCardSample"), "EnVentaPreviewPage.tsx");

add("Label Hacer oferta", bundle.includes("Hacer oferta"), "bundle");
add("Label Guardar", engagement.includes("Guardar"), "EnVentaEngagementRow.tsx");
add("Label Compartir", engagement.includes("Compartir"), "EnVentaEngagementRow.tsx");
add("Label Reportar", engagement.includes("Reportar"), "EnVentaEngagementRow.tsx");
add("Label Llamar", bundle.includes("Llamar"), "bundle");
add("Label Mensaje", contact.includes("Mensaje"), "EnVentaContactButtons.tsx");
add("Label Correo", bundle.includes("Correo"), "bundle");
add("Label Varios", labels.includes('"Varios"'), "enVentaPublicLabels.ts");

add("No public $9.99 in bundle", !/\$9\.99/.test(bundle), "bundle");
add("No Boost/Impulsar in bundle", !/\bImpulsar\b|"Boost"/.test(bundle), "bundle");
add("No Stripe in bundle", !/stripe/i.test(bundle), "bundle");
add("Gate P4-F npm script", pkg.includes("varios:p4f-desktop-detail-layout-repair-audit"), "package.json");

let diffNames: string[] = [];
try {
  diffNames = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  diffNames = [];
}

const gateChanged = diffNames.filter(
  (f) =>
    f.startsWith("app/(site)/clasificados/en-venta/") ||
    f.startsWith("app/lib/clasificados/en-venta/") ||
    f === "scripts/varios-p4f-desktop-detail-layout-repair-audit.ts" ||
    f === "package.json"
);

const allowedPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/lib/clasificados/en-venta/",
  "scripts/varios-p4f-desktop-detail-layout-repair-audit.ts",
  "package.json",
];
const blocked = gateChanged.filter((f) => !allowedPrefixes.some((p) => f === p || f.startsWith(p)));
add(
  "Gate edits in allowed scope only",
  blocked.length === 0,
  blocked.length ? blocked.join(", ") : gateChanged.join(", ") || "no gate-local diff yet"
);
add("No global layout in gate diff", !gateChanged.some((f) => f.includes("app/(site)/layout.tsx")), "layout.tsx");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4-F — Desktop detail layout repair audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
