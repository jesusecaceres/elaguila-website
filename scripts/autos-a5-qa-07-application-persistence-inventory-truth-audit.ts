/**
 * A5.QA-07 Autos Negocios application persistence + inventory workflow truth gate.
 * Run: npm run autos:a5-qa-07-application-persistence-inventory-truth-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "No Servicios files modified",
  "Servicios Business Hub inspected read-only",
  "Refresh preserves Autos Negocios draft data",
  "Refresh preserves current step",
  "Preview/back preserves draft data",
  "Preview/back preserves current step",
  "Volver a editar from preview returns to Paso 7",
  "Opening Inventory Boost drawer does not clear draft",
  "Closing Inventory Boost drawer does not clear draft",
  "Add inventory drawer/action does not clear draft",
  "Explicit new/clear draft path exists or blocker documented",
  "Motor accepts 3.5 V6",
  "Calle accepts 1601 Coleman Ave",
  "Free-text fields allow spaces",
  "Numeric-only fields remain intentionally restricted",
  "Image URL section clearly says image/photo URLs",
  "Multiple URL section clearly says image URLs one per line",
  "Video URLs are rejected from image URL field with clear message",
  "Valid image URL creates image card or blocker documented",
  "Image URL button does not silently fail",
  "Desktop drag reorder works or blocker documented",
  "Mobile reorder fallback works",
  "Cover image selection works",
  "Image order persists to preview/back",
  "Helpers use generic examples only",
  "No personal helper data remains",
  "Required dealer contact fields exist",
  "SMS/text support exists",
  "Finance/pre-approval fields exist",
  "Finance image/logo URL field exists",
  "Finance image/logo hides when empty",
  "Finance image/logo shows when valid",
  "Expanded socials exist",
  "Google Reviews URL exists",
  "Yelp Reviews URL exists",
  "Up to 3 custom links with title + URL exist",
  "Custom links output under Encuentra más sobre nosotros / Find more about us",
  "Business Hub output uses real provided data only",
  "Business Hub empty sections hide cleanly",
  "Contact CTA order is correct",
  "Social buttons are branded",
  "Review cards are branded and do not fake ratings",
  "Location/map output uses structured address safely",
  "Paso 7 explains $399/month and 10 included vehicles",
  "Paso 7 explains each vehicle gets its own listing and Leonix Ad ID",
  "Add vehicle to inventory CTA exists in Paso 7",
  "Pre-publish add inventory action opens safe drawer/modal or documented blocker",
  "Pre-publish add inventory does not create orphan child inventory",
  "Post-publish add inventory mode exists or blocker documented",
  "Add inventory mode passes parent/dealer/return context or blocker documented",
  "Add inventory mode prefills dealer fields and blanks vehicle fields or blocker documented",
  "Additional inventory vehicle helper/banner exists or blocker documented",
  "Inventory Boost CTA exists",
  "Inventory Boost explains +10 for $129/month",
  "Inventory Boost total shows $528/month",
  "Inventory Boost does not fake payment",
  "Inventory Boost does not unlock slots without payment",
  "Inventory Boost does not touch global Stripe/payment",
  "Public buyers do not see owner inventory CTAs",
  "Dashboard owner inventory count/CTA exists or blocker documented",
  "Admin safety checked",
  "Privado checked for shared impact",
  "No dealer-only fields added to Privado",
  "No unrelated categories touched",
  "No media kit/PDF touched",
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
];

const REQUIRED_COPY = [
  "Agregar fotos por URL",
  "Enlace directo de una imagen",
  "Varias URLs de imágenes, una por línea",
  "Este enlace parece ser de video",
  "Imagen o logo de financiamiento",
  "Encuentra más sobre nosotros",
  "Find more about us",
  "Agregar vehículo al inventario",
  "Add vehicle to inventory",
  "Preparar Inventory Boost",
  "Prepare Inventory Boost",
  "$399/month",
  "$129/month",
  "$528/month",
  "Más vehículos de este dealer",
  "More vehicles from this dealer",
];

const PERSONAL_PATTERNS = [/408\s*555\s*0100/i, /Coleman\s+Ave/i, /Stevens\s+Creek/i];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.ok(toplevel.replace(/\\/g, "/").toLowerCase().includes("elaguila-website"), "Wrong repo root");

  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_QA_07_APPLICATION_PERSISTENCE_INVENTORY_TRUTH_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.QA-07 audit markdown must exist");
  const md = read(mdPath);

  const recommendation = md.match(/Final recommendation:\s*(GREEN|YELLOW|RED)/i)?.[1]?.toUpperCase();
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
    if (recommendation === "GREEN") {
      assert.ok(md.includes(`| ${row} | TRUE |`), `Audit row must be TRUE for GREEN: ${row}`);
    }
  }

  const negociosApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const draftHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  const steppedShell = read("app/(site)/publicar/autos/shared/components/AutosApplicationSteppedShell.tsx");
  const mediaManager = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  assert.ok(draftStorage.includes("editorStep"), "Draft must persist editorStep");
  assert.ok(draftHook.includes("editorStep"), "useAutoDealerDraft must persist editorStep");
  assert.ok(steppedShell.includes("initialStep"), "Stepped shell must restore initialStep");
  assert.ok(negociosApp.includes("AUTOS_PUBLISH_FINAL_STEP_INDEX"), "Preview must save final step");
  assert.ok(mediaManager.includes("classifyAutosImageUrlInput"), "Media manager must validate image URLs");
  assert.ok(copy.includes("Agregar fotos por URL"), "ES image URL section heading");
  assert.ok(copy.includes("Add photos by URL"), "EN image URL section heading");
  assert.ok(fs.existsSync(path.join(ROOT, "app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx")));

  assert.ok(read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts").includes("BASE_AUTOS_NEGOCIO_MONTHLY_USD = 399"));
  assert.ok(read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts").includes("INVENTORY_BOOST_MONTHLY_USD = 129"));
  assert.ok(read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts").includes("AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD = 528"));

  const copyHaystack = [
    copy,
    read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts"),
    read("app/lib/clasificados/autos/autosInventoryBoostPipeline.ts"),
    read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts"),
  ].join("\n");
  for (const snippet of REQUIRED_COPY.filter((s) => !s.startsWith("$"))) {
    assert.ok(copyHaystack.includes(snippet), `Missing required copy: ${snippet}`);
  }

  for (const pattern of PERSONAL_PATTERNS) {
    assert.ok(!pattern.test(copy), `Personal helper data in autosNegociosCopy: ${pattern}`);
    assert.ok(!pattern.test(negociosApp), `Personal helper data in AutosNegociosApplication: ${pattern}`);
  }

  assert.ok(!/129\.99|528\.99/.test(read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts")), "No $129.99/$528.99 in inventory copy");

  assert.ok(!privadoApp.includes("Inventory Boost"), "Privado must not include Inventory Boost");
  assert.ok(!privadoApp.includes("dealerCustomLinks"), "Privado must not include dealer custom links");

  for (const f of changedFiles()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `Forbidden path modified: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-07-application-persistence-inventory-truth-audit"));

  console.log("A5.QA-07 application persistence + inventory truth audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
