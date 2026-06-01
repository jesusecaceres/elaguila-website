/**
 * Gate R2 — Restore Varios stacked detail layout + visible media
 * Run: npm run varios:r2-restore-stacked-layout-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R2_RESTORE_STACKED_LAYOUT_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const stack = read("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx");
const card = read("app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx");
const gallery = read("app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx");
const fetchBrowse = read("app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts");
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const contact = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const contactButtons = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const brand = read("app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts");
const pkg = read("package.json");

const bundle = [layout, preview, stack, card, gallery, fetchBrowse, publish, contact, engagement].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Last good commit documented", audit.includes("c01156c2"), auditPath);
add("Bad layout commit documented", audit.includes("fc97c454"), auditPath);

const requiredAuditRows = [
  "Last good stacked layout commit was identified",
  "Bad layout regression commit was identified",
  "Public detail media/gallery is visible",
  "Delivery/Entrega is readable and not squeezed into sidebar",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("P4-F layout component absent", !exists("app/(site)/clasificados/en-venta/shared/components/EnVentaDetailPageLayout.tsx"), "file absent");
add("Detail not using P4-F wrapper", !layout.includes("EnVentaDetailPageLayout"), "EnVentaAnuncioLayout.tsx");
add("Preview not using P4-F wrapper", !preview.includes("EnVentaDetailPageLayout"), "EnVentaPreviewPage.tsx");
add("detailPageMax token absent", !brand.includes("detailPageMax"), "enVentaBrand.ts");

add("Public gallery col-span-7", layout.includes("lg:col-span-7") && layout.includes("EnVentaMediaGallery"), "detail top grid");
add("Media gallery receives urls", layout.includes("urls={images}"), "EnVentaAnuncioLayout.tsx");
add("Preview gallery col-span-7", preview.includes("lg:col-span-7") && preview.includes("EnVentaPreviewGallery"), "preview grid");
add("Preview max-w-6xl", preview.includes("max-w-6xl"), "EnVentaPreviewPage.tsx");
add("Preview full-width content stack", preview.includes("lg:col-span-12") && preview.includes("EnVentaDetailContentStack"), "preview lower");
add("Varios full-width content stack", layout.includes("EnVentaDetailContentStack") && layout.includes("mt-10 space-y-8"), "public lower");
add("Stacked cards: Descripción", stack.includes("t.description"), "EnVentaDetailContentStack.tsx");
add("Stacked cards: Entrega", stack.includes("t.delivery"), "EnVentaDetailContentStack.tsx");
add("Results card hero image", card.includes("model.heroImage") && card.includes("<img"), "EnVentaResultListingCard.tsx");
add("Gallery thumbnails", gallery.includes("h-14 w-14"), "EnVentaMediaGallery.tsx");

add("Visibility fetch preserved", fetchBrowse.includes("queryEnVentaBrowseListings"), "fetchEnVentaPublicListingsForBrowse.ts");
add("Publish finalize preserved", publish.includes("finalizeEnVentaListingForPublicBrowse"), "enVentaPublishFromDraft.ts");
add("Preview results sample preserved", preview.includes("EnVentaPreviewResultsCardSample"), "EnVentaPreviewPage.tsx");

add("Label Varios", labels.includes('"Varios"'), "enVentaPublicLabels.ts");
add("Label For Sale", labels.includes('"For Sale"'), "enVentaPublicLabels.ts");
add("Label Hacer oferta", bundle.includes("Hacer oferta"), "bundle");
add("Label Guardar", engagement.includes("Guardar"), "engagement");
add("Label Compartir", engagement.includes("Compartir"), "engagement");
add("Label Reportar", engagement.includes("Reportar"), "engagement");
add("Label Llamar", contact.includes("Llamar"), "enVentaContactActions.ts");
add("Label Mensaje", contact.includes("Mensaje") || contactButtons.includes("Mensaje"), "contact");
add("Label Correo", contact.includes("Correo"), "enVentaContactActions.ts");
add("Label Entrega", stack.includes("delivery") || bundle.includes("Entrega"), "stack/bundle");
add("Label Descripción", stack.includes("description") || bundle.includes("Descripción"), "stack/bundle");

add("No public $9.99", !/\$9\.99/.test(bundle), "bundle");
add("No Boost/Impulsar", !/\bImpulsar\b|"Boost"/.test(bundle), "bundle");
add("No Stripe in gate bundle", !/stripe/i.test(bundle), "bundle");

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
    f === "scripts/varios-r2-restore-stacked-layout-audit.ts" ||
    f === "package.json"
);
const badGate = gateFiles.filter(
  (f) =>
    f.includes("/autos/") ||
    f.includes("/servicios/") ||
    f.includes("/rentas/") ||
    f.includes("/bienes-raices/") ||
    f.includes("supabase/migrations") ||
    /stripe/i.test(f)
);
add("Gate edits scoped to en-venta", badGate.length === 0, badGate.join(", ") || gateFiles.join(", "));
add("Gate R2 npm script", pkg.includes("varios:r2-restore-stacked-layout-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R2 — Restore stacked layout audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
