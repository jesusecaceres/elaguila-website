/**
 * A5.SHIP-05A — Autos publish application header clarity audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_05A_APPLICATION_HEADER_CLARITY_AUDIT.md",
);

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Lane impact classified before edits",
  "Current Autos Negocios header inspected",
  "Current Autos Privado header inspected",
  "Negocios title is visually clearer",
  "Negocios helper copy explains dealer inventory flow",
  "Negocios draft/session badge remains visible",
  "Privado title is visually clearer",
  "Privado helper copy explains private seller flow",
  "Privado draft/session badge remains visible",
  "Header has better spacing/separation from nav",
  "Header does not become oversized",
  "Header works on desktop",
  "Header works on mobile",
  "Shared header component created or duplication documented",
  "Step/sidebar navigation still works",
  "No media logic touched",
  "No inventory publish logic touched",
  "Privado checked after changes",
  "No dealer-only features added to Privado",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const ES_COPY = [
  "Autos · Negocios",
  "Autos · Privado",
  "Completa la ficha de inventario del dealer",
  "Publica tu vehículo como vendedor particular",
  "Borrador · esta sesión",
];

const EN_COPY = [
  "Autos · Business",
  "Autos · Private",
  "Complete the dealer inventory listing",
  "Publish your vehicle as a private seller",
  "Draft · this session",
];

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "financeContactImage",
  "dealerCustomLinks",
  "googleReviewsUrl",
  "yelpReviewsUrl",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const MEDIA_PATH_HINTS = [
  "AutosNegociosMediaManager",
  "autosMuxPublishPrepare",
  "readFileAsDataUrl",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const header = read("app/(site)/publicar/autos/shared/components/AutosPublishApplicationHeader.tsx");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const privadoCopy = read("app/(site)/clasificados/autos/privado/lib/getAutosPrivadoCopy.ts");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  for (const phrase of ES_COPY) {
    assert.ok(
      negociosCopy.includes(phrase) || privadoCopy.includes(phrase) || header.includes(phrase),
      `Required Spanish copy missing: ${phrase}`,
    );
  }

  for (const phrase of EN_COPY) {
    assert.ok(
      negociosCopy.includes(phrase) || privadoCopy.includes(phrase) || header.includes(phrase),
      `Required English copy missing: ${phrase}`,
    );
  }

  assert.ok(negocios.includes("AutosPublishApplicationHeader"));
  assert.ok(privado.includes("AutosPublishApplicationHeader"));
  assert.ok(negocios.includes('lane="negocios"'));
  assert.ok(privado.includes('lane="privado"'));
  assert.ok(header.includes("data-autos-publish-application-header"));
  assert.ok(negocios.includes("AutosApplicationSteppedShell"));
  assert.ok(privado.includes("AutosApplicationSteppedShell"));

  for (const phrase of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(phrase), `Privado must not contain dealer-only: ${phrase}`);
  }

  const changed = changedFiles();
  for (const file of changed) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden path modified: ${file}`);
    }
    for (const hint of MEDIA_PATH_HINTS) {
      assert.ok(!norm.includes(hint), `Media logic file should not be modified: ${file}`);
    }
  }

  console.log("A5.SHIP-05A application header clarity audit: PASS");
}

run();
