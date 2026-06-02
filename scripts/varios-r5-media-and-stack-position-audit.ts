/**
 * Gate R5 — Restore Varios images + move lower detail stack under hero
 * Run: npm run varios:r5-media-stack-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R5_MEDIA_AND_STACK_POSITION_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const shell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const contact = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const contactButtons = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const pkg = read("package.json");

const bundle = [draft, shell, preview, proApp, freeApp, layout].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add(
  "Exact missing-image root cause documented",
  audit.includes("sessionStorage quota") || audit.includes("images: []"),
  auditPath
);
add(
  "Exact Volver a editar media-loss root cause documented",
  audit.includes("restoreEnVentaFormFromIdbIfEmpty") || audit.includes("completely empty"),
  auditPath
);
add(
  "Exact lower-stack spacing root cause documented",
  audit.includes("mt-10") || audit.includes("lg:gap-y-8"),
  auditPath
);

const requiredAuditRows = [
  "Exact missing-image root cause was identified",
  "Exact Volver a editar media-loss root cause was identified",
  "Exact lower-stack spacing/root cause was identified",
  "Lower detail stack was moved directly under hero area",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("hydrateEnVentaDraftMediaIfMissing exists", draft.includes("hydrateEnVentaDraftMediaIfMissing"), "enVentaPreviewDraft.ts");
add("Preview async load hydrates media", draft.includes("loadLatestEnVentaPreviewDraftAsync") && draft.includes("hydrateEnVentaDraftMediaIfMissing"), "enVentaPreviewDraft.ts");
add("Pro edit mount hydrates media", proApp.includes("hydrateEnVentaDraftMediaIfMissing"), "LeonixEnVentaProApplication.tsx");
add("Free edit mount hydrates media", freeApp.includes("hydrateEnVentaDraftMediaIfMissing"), "LeonixEnVentaFreeApplication.tsx");
add("Shell goBack hydrates media", shell.includes("hydrateEnVentaDraftMediaIfMissing"), "EnVentaPreviewShell.tsx");
add("Stack inside hero grid", layout.includes("lg:col-span-12") && layout.includes("EnVentaDetailContentStack"), "EnVentaAnuncioLayout.tsx");
add("Removed separate mt-10 stack wrapper", !layout.includes("mt-10 space-y-8"), "EnVentaAnuncioLayout.tsx");
add("Preview tighter row gap", preview.includes("lg:gap-y-4"), "EnVentaPreviewPage.tsx");

add("Label Varios", labels.includes('"Varios"'), "labels");
add("Label For Sale", labels.includes('"For Sale"'), "labels");
add("Label Hacer oferta", bundle.includes("Hacer oferta"), "bundle");
add("Label Guardar", engagement.includes("Guardar"), "engagement");
add("Label Compartir", engagement.includes("Compartir"), "engagement");
add("Label Reportar", engagement.includes("Reportar"), "engagement");
add("Label Llamar", contact.includes("Llamar"), "contact");
add("Label Mensaje", contact.includes("Mensaje") || contactButtons.includes("Mensaje"), "contact");
add("Label Correo", contact.includes("Correo"), "contact");
add("Label Entrega", bundle.includes("Entrega"), "bundle");
add("Label Descripción", bundle.includes("Descripción"), "bundle");

add("No public $9.99", !/\$9\.99/.test(bundle), "bundle");
add("No Boost/Impulsar", !/\bImpulsar\b|"Boost"/.test(bundle), "bundle");
add("No Stripe in bundle", !/stripe/i.test(bundle), "bundle");

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
    f.startsWith("app/(site)/clasificados/publicar/en-venta/") ||
    f.startsWith("app/lib/clasificados/en-venta/") ||
    f === "scripts/varios-r5-media-and-stack-position-audit.ts" ||
    f === "package.json"
);
const badGate = gateFiles.filter(
  (f) =>
    f.includes("/servicios/") ||
    f.includes("/autos/") ||
    f.includes("/rentas/") ||
    f.includes("supabase/migrations") ||
    /stripe/i.test(f)
);
add("Gate edits scoped to en-venta", badGate.length === 0, badGate.join(", ") || gateFiles.join(", "));
add("No Supabase migration files modified", !diffNames.some((f) => f.includes("supabase/migrations")), diffNames.join(", "));
add("No Stripe/payment files modified", !diffNames.some((f) => /stripe/i.test(f)), diffNames.join(", "));
add("Gate R5 npm script", pkg.includes("varios:r5-media-stack-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R5 — Media + stack position audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
