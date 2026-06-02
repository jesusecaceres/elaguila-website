/**
 * Gate P4-I — Varios publish success / moderation / engagement audit
 * Run: npm run varios:p4i-publish-success-moderation-engagement-audit
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

const auditPath = "app/lib/clasificados/en-venta/VARIOS_P4I_PUBLISH_SUCCESS_MODERATION_ENGAGEMENT_AUDIT.md";
const successCopy = read("app/(site)/clasificados/en-venta/publish/enVentaPublishSuccessCopy.ts");
const successPanel = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSuccessPanel.tsx");
const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const engagement = read("app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const report = read("app/(site)/clasificados/en-venta/report/submitEnVentaListingReport.ts");
const pkg = read("package.json");

const publishBundle = [successCopy, successPanel, submitBar].join("\n");
const engagementBundle = [engagement, preview].join("\n");
const auditMd = exists(auditPath) ? read(auditPath) : "";

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", auditMd.includes("| Requirement | TRUE/FALSE |"), auditPath);

add("Success title ES", publishBundle.includes("Tu anuncio fue publicado con éxito"), "enVentaPublishSuccessCopy.ts");
add("Success title EN", publishBundle.includes("Your ad was published successfully"), "enVentaPublishSuccessCopy.ts");
add("30-day guidance ES", publishBundle.includes("30 días"), "enVentaPublishSuccessCopy.ts");
add("30-day guidance EN", publishBundle.includes("30 days"), "enVentaPublishSuccessCopy.ts");
add("Sold reminder ES", publishBundle.includes("vendido"), "enVentaPublishSuccessCopy.ts");
add("Sold reminder EN", publishBundle.toLowerCase().includes("sold"), "enVentaPublishSuccessCopy.ts");
add("Terms warning ES", publishBundle.includes("reglas de Leonix"), "enVentaPublishSuccessCopy.ts");
add("Terms warning EN", publishBundle.includes("Leonix rules"), "enVentaPublishSuccessCopy.ts");
add("Flag warning ES reportado", publishBundle.includes("reportado"), "enVentaPublishSuccessCopy.ts");
add("Flag warning EN flagged", publishBundle.toLowerCase().includes("flagged"), "enVentaPublishSuccessCopy.ts");
add("Flag warning ES revisarlo", publishBundle.includes("revisarlo"), "enVentaPublishSuccessCopy.ts");
add("Flag warning EN review it", publishBundle.toLowerCase().includes("review it"), "enVentaPublishSuccessCopy.ts");
add("View ad button ES", publishBundle.includes("Ver mi anuncio"), "enVentaPublishSuccessCopy.ts");
add("View ad button EN", publishBundle.includes("View my ad"), "enVentaPublishSuccessCopy.ts");
add("Dashboard button ES", publishBundle.includes("Ir a mi panel"), "enVentaPublishSuccessCopy.ts");
add("Dashboard button EN", publishBundle.includes("Go to my dashboard"), "enVentaPublishSuccessCopy.ts");
add("Post another button ES", publishBundle.includes("Publicar otro anuncio"), "enVentaPublishSuccessCopy.ts");
add("Post another button EN", publishBundle.includes("Post another ad"), "enVentaPublishSuccessCopy.ts");

add("Success panel component", successPanel.includes("EnVentaPublishSuccessPanel"), "EnVentaPublishSuccessPanel.tsx");
add("Submit bar uses success panel", submitBar.includes("EnVentaPublishSuccessPanel"), "EnVentaPublishSubmitBar.tsx");
add("Success only after res.ok", submitBar.includes("if (!res.ok)") && submitBar.includes("setPublishOutcome"), "EnVentaPublishSubmitBar.tsx");
add("Draft clear after success", submitBar.includes("clearEnVentaPublishTempState") && submitBar.includes("clearAllClassifiedsDrafts"), "EnVentaPublishSubmitBar.tsx");
add("Public detail href pattern", successCopy.includes("/clasificados/anuncio/"), "enVentaPublishSuccessCopy.ts");
add("Dashboard href pattern", successCopy.includes("/dashboard/mis-anuncios"), "enVentaPublishSuccessCopy.ts");

add("Share success copy ES", engagementBundle.includes("Enlace copiado"), "engagement + preview");
add("Share success copy EN", engagementBundle.includes("Link copied"), "engagement + preview");
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

add("Report admin email wiring", report.includes("sendLeonixResendEmail"), "submitEnVentaListingReport.ts");
add("No fake listing id hardcoded", !publishBundle.match(/clasificados\/anuncio\/[0-9a-f-]{36}/i), "publish bundle");
add("No fake counter strings", !publishBundle.includes("0 vistas") && !publishBundle.includes("0 guardados"), "publish bundle");
add("No Stripe in gate files", !/\bstripe\b/i.test(publishBundle), "publish bundle");
add(
  "Gate P4-I npm script",
  pkg.includes("varios:p4i-publish-success-moderation-engagement-audit"),
  "package.json"
);

const forbidden = [
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/api/stripe",
  "supabase/migrations",
];
const gateFiles = [
  "app/(site)/clasificados/en-venta/publish/",
  "app/lib/clasificados/en-venta/VARIOS_P4I",
  "scripts/varios-p4i",
  "package.json",
];
const diffNames = process.env.GIT_DIFF_NAMES?.split("\n").filter(Boolean) ?? [];
for (const f of diffNames) {
  const norm = f.replace(/\\/g, "/");
  const isGate = gateFiles.some((g) => norm.includes(g));
  const hit = forbidden.find((x) => norm.includes(x));
  if (hit && !isGate) {
    add(`Unrelated category/file not modified: ${f}`, false, hit);
  }
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4-I — Varios publish success / moderation / engagement audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
