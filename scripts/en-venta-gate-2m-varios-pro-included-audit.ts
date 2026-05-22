import fs from "fs";
import path from "path";

const root = process.cwd();
const auditPath = path.join(
  root,
  "app/(site)/clasificados/en-venta/AUDIT_GATE_2M_VARIOS_PRO_INCLUDED_REFRESH_COPY.md"
);
const labelsPath = path.join(
  root,
  "app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts"
);
const publishHubPage = path.join(root, "app/(site)/clasificados/publicar/en-venta/page.tsx");
const freePage = path.join(root, "app/(site)/clasificados/publicar/en-venta/free/page.tsx");
const freeApp = path.join(
  root,
  "app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx"
);
const categoryConfig = path.join(root, "app/(site)/clasificados/config/categoryConfig.ts");

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function hasFile(p: string): boolean {
  return fs.existsSync(p);
}

type Row = { requirement: string; pass: boolean; evidence: string };

const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const audit = hasFile(auditPath) ? read(auditPath) : "";
add("Audit file exists", hasFile(auditPath), auditPath);
add(
  "Audit has TRUE/FALSE section",
  audit.includes("TRUE/FALSE") || audit.includes("TRUE"),
  "AUDIT_GATE_2M markdown"
);

const labels = hasFile(labelsPath) ? read(labelsPath) : "";
add("Varios in public labels helper", labels.includes('"Varios"'), labelsPath);
add("English For Sale preserved", labels.includes('"For Sale"'), labelsPath);
add('Spanish does not use "Varrios"', !labels.includes("Varrios"), labelsPath);

const hubPage = hasFile(publishHubPage) ? read(publishHubPage) : "";
add(
  "Publish hub redirects to Pro",
  hubPage.includes("redirect") &&
    (hubPage.includes("PUBLICAR_PRO") || hubPage.includes("/publicar/en-venta/pro")),
  publishHubPage
);

const freePg = hasFile(freePage) ? read(freePage) : "";
add(
  "Free route redirects to Pro",
  freePg.includes("redirect") &&
    (freePg.includes("PUBLICAR_PRO") || freePg.includes("/publicar/en-venta/pro")),
  freePage
);
add("Free application file still exists", hasFile(freeApp), freeApp);

const hubClient = read(
  path.join(root, "app/(site)/clasificados/publicar/en-venta/EnVentaPublishHubClient.tsx")
);
add(
  "Hub client does not link to free lane",
  !hubClient.includes("PUBLICAR_FREE") && !hubClient.includes("/free?"),
  "EnVentaPublishHubClient.tsx"
);

const proApp = read(
  path.join(root, "app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx")
);
add(
  "Pro app: included sin costo copy",
  proApp.includes("incluido sin costo") || proApp.includes("included at no charge"),
  "LeonixEnVentaProApplication.tsx"
);
add(
  "Pro app: no switch to Free button",
  !proApp.includes("switchFree") && !proApp.includes("Cambiar a Gratis"),
  "LeonixEnVentaProApplication.tsx"
);

const defaults = read(path.join(root, "app/lib/clasificados/enVentaContentDefaults.ts"));
add("No public $9.99 in content defaults", !defaults.includes("9.99") && !defaults.includes("$9"), "enVentaContentDefaults.ts");

const results = read(
  path.join(root, "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx")
);
add(
  "Results: Varios title",
  results.includes('enVentaPublicLabel("es")') || results.includes("Varios"),
  "EnVentaResultsClient.tsx"
);
add(
  "Results: no public impulsar",
  !results.toLowerCase().includes("impulsar"),
  "EnVentaResultsClient.tsx"
);

const misAnuncios = read(path.join(root, "app/(site)/dashboard/mis-anuncios/page.tsx"));
add(
  "Dashboard: Refrescar anuncio for en-venta",
  misAnuncios.includes("Refrescar anuncio"),
  "mis-anuncios/page.tsx"
);

const catCfg = read(categoryConfig);
add("categoryConfig Spanish Varios", catCfg.includes('es: "Varios"'), categoryConfig);

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2M audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
