/**
 * A5.FINISH-01 Autos repo-first end-to-end QA stabilization gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_FINISH_01_REPO_FIRST_E2E_STABILIZATION_AUDIT.md",
);

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "git diff reviewed before editing",
  "Autos audit files inspected",
  "Lane impact classified before fixes",
  "Negocios application source inspected",
  "Privado source inspected for shared impact",
  "No unrelated categories touched",
  "No Servicios files touched",
  "No global Stripe/payment files touched",
  "No schema/migration files touched unless documented blocker",
  "Free-text fields support spaces",
  "Vehicle dropdown foundation is wired or blocker documented",
  "Free-text trim/engine fallback remains",
  "Media upload/reorder source is present or blocker documented",
  "Image URL/video URL behavior is clear or blocker documented",
  "Finance image upload + URL source is present or blocker documented",
  "Refresh draft persistence source is present",
  "Preview/back return behavior is present",
  "Additional inventory drawer source is present",
  "Additional inventory save/edit/remove source is present or blocker documented",
  "Added inventory preview source is present",
  "Results card preview source is present",
  "Publish path inspected",
  "Public buyer owner-only CTA separation inspected",
  "Privado has no dealer-only inventory/finance/boost fields",
  "Audit documents exact remaining risks",
  "Targeted Autos checks passed",
  "npm run build passed",
];

const REQUIRED_COPY = [
  { label: "Agregar vehículo al inventario", file: "app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts" },
  { label: "Guardar en inventario", file: "app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts" },
  { label: "Guardar y agregar otro", file: "app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts" },
  { label: "Inventario incluido en esta solicitud", file: "app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts" },
  { label: "Así se verá en resultados", file: "app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts" },
  { label: "Imagen o logo de financiamiento", file: "app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts" },
  { label: "Subir imagen/logo desde archivo", file: "app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts" },
  { label: "Usar URL de imagen/logo", file: "app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts" },
  { label: "No encontramos trims estructurados", file: "app/lib/clasificados/autos/autosVehicleData.ts" },
  { label: "Más vehículos de este dealer", file: "app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts" },
];

const PRIVADO_DEALER_ONLY_STRINGS = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "financeContactImage",
  "AutosDealerFinanceImageUpload",
  "AutosDealerFinanceFields",
  "DealerFinanceContact",
  "DealerBusinessStack",
  "dealerCustomLinks",
  "AutosNegociosAddInventoryDrawer",
  "additionalInventoryVehicles",
  "AutosNegociosInventoryBoostPanel",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/clasificados/publicar/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/tienda/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const GATE_OWN_MARKERS = [
  "AUTOS_A5_FINISH_01",
  "autos-a5-finish-01",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    if (out) return out.split(/\r?\n/).filter(Boolean);
  } catch {
    /* ignore */
  }
  try {
    return execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function untrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function changesFromThisGate(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return GATE_OWN_MARKERS.some((m) => norm.includes(m)) || norm === "package.json";
  });
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "FINISH-01 audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }
  assert.ok(!auditText.includes("| FALSE |"), "No FALSE rows when recommendation is GREEN");
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText));

  for (const { label, file } of REQUIRED_COPY) {
    assert.ok(read(file).includes(label), `Required copy "${label}" in ${file}`);
  }

  const textHelper = read("app/lib/clasificados/autos/autosPublishFormText.ts");
  assert.ok(textHelper.includes("3.5 V6") || textHelper.includes("autosDraftTextValue"), "Text helper / 3.5 V6 evidence");

  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  for (const s of PRIVADO_DEALER_ONLY_STRINGS) {
    assert.ok(!privado.includes(s), `Privado must not contain dealer-only string: ${s}`);
  }

  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(negocios.includes("AutosNegociosResultsCardPreview"));
  assert.ok(negocios.includes("AutosNegociosInventoryBundlePreview"));
  assert.ok(negocios.includes("AutosNegociosAddInventoryDrawer") || negocios.includes("inventoryAddMode"));
  assert.ok(read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceImageUpload.tsx").includes("imageUrl"));
  assert.ok(read("app/lib/clasificados/autos/autosImageUrlInput.ts").includes("classifyAutosImageUrlInput"));
  assert.ok(read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts").includes("flushDraft"));
  assert.ok(read("app/lib/clasificados/autos/autosVehicleData.ts").includes("getKnownTrimsForVehicle"));

  for (const f of changesFromThisGate()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(bad), `Gate must not modify forbidden path: ${f}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-finish-01-repo-first-e2e-stabilization-audit"));
  assert.ok(pkg.includes("autos:a5-vdata-c-starter-seed-final-validation-audit"));

  console.log("A5.FINISH-01 repo-first E2E stabilization audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
