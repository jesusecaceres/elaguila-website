/**
 * A5.FINAL-AUTOS-ONLY — Autos Negocios + Privado readiness audit (script gate).
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
  "app/lib/clasificados/autos/AUTOS_FINAL_ONLY_NEGOCIOS_PRIVADO_READINESS_AUDIT.md",
);

const REQUIRED_SECTIONS = [
  "Repo confirmation",
  "Files inspected",
  "Autos lane matrix",
  "Negocios readiness result",
  "Privado readiness result",
  "Shared Autos result",
  "Negocios-only feature result",
  "Privado contamination check",
  "Media storage truth result",
  "Draft/no-data-loss result",
  "Publish/listing identity result",
  "Business Hub/contact card result",
  "Public output result",
  "Autos analytics readiness result",
  "Missing items / blockers",
  "Recommended fix order",
  "Manual QA checklist",
  "TRUE/FALSE table",
];

const AUDIT_GATE_ROWS = [
  "Autos only scope respected",
  "Negocios inspected",
  "Privado inspected",
  "Shared Autos features checked in both lanes",
  "Dealer-only features kept out of Privado",
  "VIN/vehicle data checked in both lanes",
  "Media checked in both lanes",
  "Draft/preview/back checked in both lanes",
  "Negocios inventory checked",
  "Negocios Business Hub checked",
  "Negocios publish identity checked",
  "Privado public output checked",
  "Media durability honestly classified",
  "Analytics readiness classified only, no fake analytics added",
  "no unrelated categories touched",
  "no global Stripe/payment touched",
  "no DB/schema touched unless approved",
  "npm run build passed",
];

const PRIVADO_FORBIDDEN = [
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
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/viajes/",
  "app/(site)/tienda/",
  "app/(site)/clasificados/community/",
  "app/api/stripe/",
  "supabase/migrations/",
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

  for (const section of REQUIRED_SECTIONS) {
    assert.match(auditText, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `Missing section: ${section}`);
  }

  assert.match(auditText, /\|\s*Feature\s*\|\s*Negocios\s*\|\s*Privado/i, "Autos lane matrix header required");
  assert.match(auditText, /Media storage truth/i, "Media storage truth table required");
  assert.match(auditText, /Analytics readiness/i, "Analytics readiness matrix required");

  const recMatch = auditText.match(/Final recommendation:\s*(GREEN|YELLOW|RED)/i);
  assert.ok(recMatch, "Final recommendation required");

  for (const row of AUDIT_GATE_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*(TRUE|FALSE)\\s*\\|`),
      `Audit gate row missing: ${row}`,
    );
  }

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  const privadoPublish = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const privadoPreview = read("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  const privadoPool = `${privadoPublish}\n${privadoPreview}`;

  for (const phrase of PRIVADO_FORBIDDEN) {
    assert.ok(!privadoPool.includes(phrase), `Privado must not contain: ${phrase}`);
  }

  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(negocios.includes("AutosVinDecodeBlock"), "Negocios VIN decode required");
  assert.ok(privado.includes("AutosVinDecodeBlock"), "Privado VIN decode required");
  assert.ok(negocios.includes("AutosNegociosAddInventoryDrawer") || negocios.includes("AutosNegociosInventoryBundlePreview"));
  assert.ok(negocios.includes("DealerBusinessStack") || read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx").includes("DealerBusinessStack"));
  assert.ok(read("app/lib/clasificados/autos/autosDraftLocalMediaCopy.ts").includes("temporary draft"));
  assert.ok(read("app/(site)/clasificados/autos/lib/autosCtaTracking.ts").includes("trackAutosResultCardClick"));
  assert.ok(!negocios.includes("createObjectURL"));

  const changed = changedFiles();
  for (const file of changed) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden path modified: ${file}`);
    }
  }

  console.log("A5.FINAL-AUTOS-ONLY Negocios + Privado readiness audit: PASS");
}

run();
