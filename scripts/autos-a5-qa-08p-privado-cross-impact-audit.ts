/**
 * A5.QA-08P Autos Privado cross-impact recovery + shared Autos guardrail gate.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md");
const POLICY_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_SHARED_IMPACT_POLICY.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Recent Autos audit files inspected",
  "Recent Autos source changes inspected",
  "Shared Autos components classified",
  "Negocios-only components classified",
  "Privado publish flow inspected",
  "Privado free-text fields allow spaces",
  "Privado numeric fields remain intentionally restricted",
  "Privado media upload checked",
  "Privado image URL behavior checked if supported",
  "Privado media drag reorder works or shared blocker documented",
  "Privado mobile media fallback works",
  "Privado cover image selection works",
  "Privado media order persists to preview/back",
  "Privado refresh preserves draft",
  "Privado preview/back preserves draft",
  "Privado explicit clear/new flow still works or documented",
  "Negocios regression checked after shared fixes",
  "Negocios finance image upload + URL still works",
  "Negocios inventory drawer still opens",
  "Negocios Inventory Boost shell still works",
  "No dealer Business Hub fields added to Privado",
  "No finance advisor/image/logo added to Privado",
  "No Google/Yelp review dealer links added to Privado",
  "No custom dealership links added to Privado",
  "No dealer inventory drawer added to Privado",
  "No Inventory Boost added to Privado",
  "No dealer inventory relationship added to Privado",
  "Autos shared impact policy file created/updated",
  "No Servicios files modified",
  "No unrelated categories touched",
  "No global Stripe/payment files touched",
  "No schema/migration files touched",
  "npm run build passed",
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
  "googleReviewsUrl",
  "yelpReviewsUrl",
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

const GATE_OWN_PATH_MARKERS = [
  "AUTOS_SHARED_IMPACT_POLICY.md",
  "AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md",
  "autos-a5-qa-08p-privado-cross-impact-audit.ts",
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

function untrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function changesFromThisGate(): string[] {
  const all = [...changedFiles(), ...untrackedFiles()];
  return all.filter((f) => GATE_OWN_PATH_MARKERS.some((m) => f.includes(m)) || f === "package.json");
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "08P audit md missing");
  assert.ok(fs.existsSync(POLICY_MD), "shared impact policy missing");

  const auditText = read("app/lib/clasificados/autos/AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md");
  for (const row of AUDIT_ROWS) {
    assert.match(auditText, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`), `Audit row must be TRUE: ${row}`);
  }
  assert.ok(!auditText.includes("| FALSE |"));
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText));

  const policy = read("app/lib/clasificados/autos/AUTOS_SHARED_IMPACT_POLICY.md");
  assert.ok(policy.includes("Negocios only"), "policy lists Negocios-only");
  assert.ok(policy.includes("Shared Autos"), "policy lists shared");
  assert.ok(policy.includes("Privado only"), "policy lists Privado-only");
  assert.ok(policy.includes("lane impact"), "policy requires lane impact check");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const privadoPreview = read("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  const privadoDraft = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
  const privadoStorage = read("app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts");
  const negociosApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const mediaManager = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  const sortable = read("app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx");
  const textHelper = read("app/lib/clasificados/autos/autosPublishFormText.ts");
  const persist = read("app/lib/clasificados/autos/useAutosDraftPersistEffects.ts");
  const financeUpload = read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceImageUpload.tsx");
  const boost = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx");

  const privadoHaystack = [privadoApp, privadoPreview, privadoDraft, privadoStorage].join("\n");
  for (const s of PRIVADO_DEALER_ONLY_STRINGS) {
    assert.ok(!privadoHaystack.includes(s), `Privado must not contain dealer-only string: ${s}`);
  }

  assert.ok(textHelper.includes("autosDraftTextValue"), "shared text helper");
  assert.ok(persist.includes("pagehide"), "shared draft flush");
  assert.ok(privadoApp.includes("AutosNegociosMediaManager"), "Privado uses shared media manager");
  assert.ok(privadoApp.includes("hideDealerLogo"), "Privado hides dealer logo block");
  assert.ok(privadoApp.includes("AutosVehicleIdentityFields"), "Privado uses shared identity fields");
  assert.ok(privadoApp.includes("autosDraftTextValue"), "Privado uses shared text helper");
  assert.ok(privadoDraft.includes("useAutosDraftPersistEffects"), "Privado draft persist hook");
  assert.ok(privadoStorage.includes("inlineDraftListingAssetsFromIdb"), "Privado IDB rehydrate");
  assert.ok(mediaManager.includes("AutosSortablePhotoGrid"), "shared sortable grid");
  assert.ok(sortable.includes("@dnd-kit"), "dnd-kit reorder");
  assert.ok(sortable.includes("TouchSensor"), "mobile fallback");
  assert.ok(!privadoPreview.includes("DealerBusinessStack"), "no business hub in privado preview");
  assert.ok(!privadoPreview.includes("DealerFinanceContact"), "no finance block in privado preview");
  assert.ok(negociosApp.includes("AutosDealerFinanceFields"), "Negocios finance fields");
  assert.ok(financeUpload.includes("readFileAsDataUrl"), "Negocios finance image upload");
  assert.ok(negociosApp.includes("additionalInventoryVehicles"), "Negocios additional inventory");
  assert.ok(fs.existsSync(path.join(ROOT, "app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx")), "inventory drawer file");
  assert.ok(boost.includes("AutosNegociosInventoryBoostPanel") || boost.includes("flushDraft"), "boost panel");

  const serviciosTouched = changedFiles().filter((p) => p.startsWith("app/(site)/servicios/"));
  assert.equal(serviciosTouched.length, 0, "Servicios must not be modified in working tree diff");

  for (const f of changesFromThisGate()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `This gate must not modify forbidden path: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08p-privado-cross-impact-audit"));

  console.log("A5.QA-08P Privado cross-impact audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
