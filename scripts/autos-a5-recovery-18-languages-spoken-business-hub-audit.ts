/**
 * A5.RECOVERY-18 — Autos Negocios Languages Spoken Business Hub audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_18_LANGUAGES_SPOKEN_BUSINESS_HUB_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope respected",
  "Business information flow inspected",
  "Languages field added to Step 5",
  "Español option exists",
  "English option exists",
  "Otro option exists",
  "Otro opens custom language input",
  "Custom language can be added",
  "Empty custom language is blocked",
  "Duplicate language is blocked",
  "Max 3 languages enforced",
  "Selected languages display as chips in form",
  "Chips can be removed if supported",
  "“Otro” does not render publicly without custom text",
  "Languages persist through step navigation",
  "Languages persist through refresh/session draft",
  "Languages persist through preview/back",
  "Languages map to listing_payload",
  "Preview Business Hub shows language chips",
  "Public Business Hub shows language chips",
  "Empty languages section hides",
  "Added inventory child inherits parent languages",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const ES_COPY = [
  "Idiomas que hablamos",
  "Selecciona hasta 3 idiomas",
  "Español",
  "Otro idioma",
  "Añadir idioma",
  "Puedes mostrar hasta 3 idiomas",
];

const EN_COPY = [
  "Languages we speak",
  "Select up to 3 languages",
  "Other language",
  "Add language",
  "You can show up to 3 languages",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/restaurantes/",
  "app/(site)/publicar/bienes-raices/",
];

const PRIVADO_FORBIDDEN = ["AutosDealerLanguagesField", "dealerLanguages", "Idiomas que hablamos"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-a5-recovery-18")
  );
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  for (const s of ES_COPY) assert.ok(copy.includes(s), `Missing ES copy: ${s}`);
  for (const s of EN_COPY) assert.ok(copy.includes(s), `Missing EN copy: ${s}`);

  const langLib = read("app/lib/clasificados/autos/autosDealerLanguages.ts");
  assert.ok(langLib.includes("dealerLanguagesForOutput"), "Output helper");
  assert.ok(langLib.includes("AUTOS_DEALER_LANGUAGES_MAX = 3"), "Max 3 constant");

  const listingType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(listingType.includes("dealerLanguages"), "dealerLanguages on listing type");

  const defaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  assert.ok(defaults.includes("normalizeDealerLanguages"), "Normalize on load");

  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("AutosDealerLanguagesField"), "Step 5 languages field");

  const hubMap = read("app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts");
  assert.ok(hubMap.includes("dealerLanguagesForOutput"), "Business Hub maps languages");

  const stack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(stack.includes("showLanguages"), "Business Hub renders languages");

  const inherited = read("app/lib/clasificados/autos/autosInventoryInheritedPreview.ts");
  assert.ok(inherited.includes('"dealerLanguages"'), "Child inherits dealerLanguages");

  const privApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  for (const s of PRIVADO_FORBIDDEN) {
    assert.ok(!privApp.includes(s), `Privado must not include ${s}`);
  }

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    if (!isAllowedPath(norm)) throw new Error(`Out-of-scope file changed: ${norm}`);
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix touched: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-18 languages spoken Business Hub audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
