/**
 * Phase 1 strict code-level gates for Autos publish readiness (no DB/Stripe/network).
 * Run: npm run autos:phase1-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function walkTsx(dirRel: string, out: string[]) {
  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(dir, name.name);
    if (name.isDirectory()) {
      walkTsx(path.relative(ROOT, rel).replace(/\\/g, "/"), out);
    } else if (name.isFile() && (name.name.endsWith(".tsx") || name.name.endsWith(".ts"))) {
      out.push(path.relative(ROOT, rel).replace(/\\/g, "/"));
    }
  }
}

/** User-facing .tsx under Autos + publish: no standalone word "boost" outside imports/comments. */
function assertNoUserFacingBoostWord() {
  const roots = ["app/(site)/clasificados/autos", "app/(site)/publicar/autos"];
  const files: string[] = [];
  for (const r of roots) walkTsx(r, files);
  const boostRe = /\bboost\b/i;
  for (const f of files.sort()) {
    if (f.includes("/boosts/")) continue;
    if (f.includes("/contracts/") && f.endsWith(".ts")) continue;
    const text = read(f);
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const t = line.trim();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("*/")) continue;
      if (/^\s*import\s/.test(line)) continue;
      if (/^\s*\*\s@/.test(line)) continue;
      if (boostRe.test(line)) {
        throw new Error(`Forbidden user-facing "boost" reference in ${f}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

function assertAuditMatrix() {
  const md = read("app/lib/clasificados/autos/AUTOS_PHASE_1_STRICT_GO_LIVE_AUDIT.md");
  assert.ok(md.includes("| ID | Claim | Current proof | Verdict | If FALSE, exact fix needed |"));
  for (let n = 1; n <= 30; n++) {
    const id = `A${n}`;
    assert.ok(
      new RegExp(`\\| ${id} \\|`).test(md),
      `Audit matrix must include row ${id}`,
    );
  }
}

function run() {
  const branch = read("app/(site)/publicar/autos/autosBranchCopy.ts");
  assert.ok(
    /un solo vehículo|un\s+solo\s+vehículo/i.test(branch),
    "ES privado branch copy must mention single-vehicle intent",
  );
  assert.ok(
    /inventario|concesionario|negocio/i.test(branch),
    "ES negocios branch copy must mention business/inventory mindset",
  );
  assert.ok(
    /single-vehicle|one vehicle/i.test(branch),
    "EN private branch copy must mention single-vehicle intent",
  );
  assert.ok(
    /inventory|dealership/i.test(branch),
    "EN business branch copy must mention inventory/dealership mindset",
  );

  const stripe = read("app/lib/clasificados/autos/stripeAutosConfig.ts");
  assert.ok(stripe.includes("STRIPE_PRICE_AUTOS_NEGOCIOS"), "stripeAutosConfig must name STRIPE_PRICE_AUTOS_NEGOCIOS");
  assert.ok(stripe.includes("STRIPE_PRICE_AUTOS_PRIVADO"), "stripeAutosConfig must name STRIPE_PRICE_AUTOS_PRIVADO");

  const blueprint = read("app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy.ts");
  assert.ok(
    /no activo|not active|not available yet|aún no/i.test(blueprint),
    "Hero/filter radius copy must clearly state radius is not active (ES/EN)",
  );
  assert.ok(
    /Particular|Privado/i.test(blueprint) && /Negocio|Concesionario|Dealer/i.test(blueprint),
    "Public blueprint must label private and business seller types",
  );

  const resultCard = read("app/(site)/clasificados/autos/shell/AutosResultCard.tsx");
  assert.ok(
    resultCard.includes("autosLiveVehiclePath"),
    "AutosResultCard must link to autosLiveVehiclePath (live detail route)",
  );
  assert.ok(
    !/\/clasificados\/autos\/\$\{\s*listing\.id\s*\}/.test(resultCard),
    "AutosResultCard must not use legacy /clasificados/autos/${listing.id} path",
  );

  assertNoUserFacingBoostWord();
  assertAuditMatrix();

  console.log("autos-phase-1-strict-audit: OK");
}

run();
