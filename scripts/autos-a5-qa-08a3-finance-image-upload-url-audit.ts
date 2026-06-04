/**
 * A5.QA-08A.3 Autos Negocios finance image upload + URL emergency fix gate.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_QA_08A3_FINANCE_IMAGE_UPLOAD_URL_AUDIT.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Current finance image URL-only behavior inspected",
  "Finance image/logo supports local file upload",
  "Finance image/logo keeps URL support",
  "Upload button appears in Autos Negocios Step 5",
  "URL field appears in Autos Negocios Step 5",
  "Uploaded image/logo shows preview",
  "URL image/logo shows preview when valid",
  "Remove image/logo works",
  "Empty finance image/logo hides cleanly",
  "Invalid/unsafe URL hides cleanly",
  "URL finance image persists after refresh",
  "Local image preview persists in-session or browser limitation documented",
  "Preview/back preserves finance image/logo",
  "Finance output shows image/logo when valid",
  "Finance output hides image/logo when empty",
  "Finance block can render if image/logo is the only finance field",
  "Privado checked for shared impact",
  "No finance image upload added to Privado",
  "No inventory drawer logic changed",
  "No global Stripe/payment files touched",
  "No schema/migration files touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/clasificados/publicar/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/tienda/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const REQUIRED_COPY = [
  "Subir imagen/logo desde archivo",
  "Upload image/logo from file",
  "Usar URL de imagen/logo",
  "Use image/logo URL",
  "Quitar imagen/logo",
  "Remove image/logo",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
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

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD));

  const auditText = read("app/lib/clasificados/autos/AUTOS_A5_QA_08A3_FINANCE_IMAGE_UPLOAD_URL_AUDIT.md");
  for (const row of AUDIT_ROWS) {
    assert.match(auditText, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`), `Audit row must be TRUE: ${row}`);
  }
  assert.ok(!auditText.includes("| FALSE |"));
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText));

  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  for (const s of REQUIRED_COPY) {
    assert.ok(copy.includes(s), `Missing copy string: ${s}`);
  }

  const financeFields = read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx");
  const financeUpload = read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceImageUpload.tsx");
  const financeContact = read("app/lib/clasificados/autos/autosDealerFinanceContact.ts");
  const types = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  const idbRefs = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");

  assert.ok(types.includes("financeContactImageUrl"), "financeContactImageUrl on listing type");
  assert.ok(financeFields.includes("AutosDealerFinanceImageUpload"), "finance image upload wired in form");
  assert.ok(financeUpload.includes("readFileAsDataUrl"), "local file upload uses readFileAsDataUrl");
  assert.ok(financeUpload.includes("removeImage"), "remove handler exists");
  assert.ok(financeUpload.includes("applyImageUrl"), "URL apply handler exists");
  assert.ok(financeContact.includes("data:image/"), "output resolver supports data URL preview");
  assert.ok(idbRefs.includes("AUTOS_DRAFT_FINANCE_IMAGE_REF"), "IDB ref for finance image persistence");
  assert.ok(!privadoApp.includes("AutosDealerFinanceImageUpload"), "no finance image upload in Privado");
  assert.ok(!privadoApp.includes("Subir imagen/logo desde archivo"), "no finance upload copy in Privado");
  assert.ok(!drawer.includes("AutosDealerFinanceImageUpload"), "inventory drawer unchanged");

  for (const f of changedFiles()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `Forbidden path modified: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08a3-finance-image-upload-url-audit"));

  console.log("A5.QA-08A.3 finance image upload + URL audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
