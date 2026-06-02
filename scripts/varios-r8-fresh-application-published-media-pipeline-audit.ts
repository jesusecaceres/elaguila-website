/**
 * Gate R8 — Fresh application + published ads media pipeline
 * Run: npm run varios:r8-fresh-media-pipeline-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R8_FRESH_APPLICATION_PUBLISHED_MEDIA_PIPELINE_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
const submit = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const anuncio = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
const resolver = read("app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts");
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const shell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const labels = read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const contact = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const contactButtons = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const pkg = read("package.json");

const bundle = [draft, proApp, freeApp, submit, publish, anuncio, resolver, layout, shell, preview, contactButtons].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Route behavior map exists", audit.includes("Route behavior map") && audit.includes("/pro?lang=es"), auditPath);
add("Audit TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);

const rootCauseChecks: Array<[string, RegExp]> = [
  ["Fresh application root cause exists", /silent|main-draft|loadEnVentaPreviewDraft/i],
  ["Resume behavior root cause exists", /resume=1|resume param/i],
  ["Current published ads media finding exists", /c5f2bc0d|a6c016c0|0 URLs|empty/i],
  ["Media pipeline root cause exists", /getOrderedEnVentaImageUrls|images column/i],
  ["Public surface mapper finding exists", /resolveEnVentaListingImageUrls|hero resolver/i],
];
for (const [req, re] of rootCauseChecks) {
  add(req, re.test(audit), auditPath);
}

const requiredAuditRows = [
  "/pro?lang=es starts fresh by default",
  "/pro?lang=es&resume=1 resumes intentionally",
  "Current published ads without image URLs are documented honestly",
  "npm run build passed",
];
for (const req of requiredAuditRows) {
  const line = audit.split("\n").find((l) => l.includes(`| ${req} |`));
  add(`Audit row: ${req}`, Boolean(line?.includes("| TRUE |")), req);
}

add("resolveEnVentaPublishFormInitialState exists", draft.includes("resolveEnVentaPublishFormInitialState"), "enVentaPreviewDraft.ts");
add("consumeEnVentaPreviewReturnDraft exists", draft.includes("consumeEnVentaPreviewReturnDraft"), "enVentaPreviewDraft.ts");
add("isEnVentaPublishResumeRequested exists", draft.includes("isEnVentaPublishResumeRequested"), "enVentaPreviewDraft.ts");
add("Pro uses resolve on mount", proApp.includes("resolveEnVentaPublishFormInitialState") && proApp.includes("resumeRequested"), "LeonixEnVentaProApplication");
add("Free uses resolve on mount", freeApp.includes("resolveEnVentaPublishFormInitialState") && freeApp.includes("resumeRequested"), "LeonixEnVentaFreeApplication");
add("Publish clears draft on success", submit.includes("clearEnVentaPublishTempState") && submit.includes("if (!res.ok)"), "EnVentaPublishSubmitBar");
add("Publish uploads photos to storage", publish.includes("listing-images") && publish.includes("images: photoUrls"), "enVentaPublishFromDraft");
add("Anuncio canonical resolver", anuncio.includes("resolveEnVentaListingImageUrls"), "anuncio page");
add("Stack in hero grid", layout.includes("lg:col-span-12") && layout.includes("EnVentaDetailContentStack"), "EnVentaAnuncioLayout");

add("Label Varios", labels.includes('"Varios"'), "labels");
add("Label For Sale", labels.includes('"For Sale"'), "labels");
add("Label Volver a editar", shell.includes("Volver a editar"), "shell");
add("Label Publicar anuncio", shell.includes("Publicar anuncio"), "shell");
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
    f === "scripts/varios-r8-fresh-application-published-media-pipeline-audit.ts" ||
    f === "package.json"
);
const badGate = gateFiles.filter(
  (f) =>
    f.includes("/servicios/") ||
    f.includes("supabase/migrations") ||
    /stripe/i.test(f)
);
add("Gate edits scoped", badGate.length === 0, badGate.join(", ") || gateFiles.join(", "));
add("Gate R8 npm script", pkg.includes("varios:r8-fresh-media-pipeline-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R8 — Fresh application + published media pipeline audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
