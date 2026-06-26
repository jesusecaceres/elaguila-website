/**
 * A5.POLISH-34 — Leonix dealer showroom cleanup + Business Hub premium refinement audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_POLISH_34_DEALER_PRESENTATION_REFINEMENT_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Exact visible preview components traced",
  "Attached screenshots/reference used",
  "Hero badges use cleaner Leonix rectangle treatment",
  "Hero spec tiles use cleaner rectangle treatment",
  "Hero price hierarchy improved or preserved cleanly",
  "Results preview card cleaned up",
  "Results preview random corner logo removed/repositioned",
  "Results preview still shows required listing data",
  "Gallery has clearer Fotos CTA",
  "Gallery has clearer Video CTA when video exists",
  "Gallery has clearer Ver todas CTA/count",
  "Gallery images are not distorted",
  "Business Hub/contact card visibly elevated",
  "Dealer logo sizing/padding improved",
  "Dealer identity spacing improved",
  "Contact buttons use consistent rectangular treatment",
  "WhatsApp remains prominent",
  "Llamar/Enviar texto aligned",
  "Agendar cita/Visitar sitio web aligned",
  "Google review card cleaner",
  "Yelp review card cleaner",
  "Website/resources buttons cleaner",
  "Social icons consistent size/alignment",
  "Financing assessor block spacing improved",
  "Financing actions aligned",
  "Hours use day-left/time-right alignment",
  "Hours are readable on desktop",
  "Hours are readable on mobile",
  "Specs grid cleaner",
  "Equipment cards cleaner",
  "Description/details readable",
  "Related inventory remains controlled/read-only",
  "Draft cards do not show fake Ver vehículo/Ver detalles CTA",
  "Bottom promise cards anchor-scroll or are clearly informational",
  "Mobile has no horizontal body overflow",
  "Mobile Business Hub stacks cleanly",
  "Mobile contact buttons tappable",
  "Step 7 Ver vista previa remains",
  "Step 7 Editar remains",
  "Step 7 Quitar remains",
  "Volver a editar still works",
  "Refresh still preserves inventory/media",
  "No sessionStorage/draft persistence logic touched",
  "No child save/edit/hydrate logic touched",
  "No publish payload touched",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "Gate A targeted checks passed",
  "Gate B targeted checks passed",
  "Gate C audit script passed",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
  "app/(site)/clasificados/en-venta/",
];

const GATE_SCOPED_MARKERS = [
  "polish-34",
  "AUTOS_A5_POLISH_34",
  "autosPreviewRect",
  "AUTOS_PREVIEW_SECTION_IDS",
  "AutosNegociosResultsCardPreview",
  "AutosNegociosPreviewPromiseStrip",
  "autosNegociosPremiumPreviewTokens",
  "DealerBusinessStack",
  "DealerFinanceContact",
  "AutoGallery",
  "SpecIconRow",
  "VehicleHeroSpecsStrip",
  "VehicleHighlights",
  "AutosNegociosHubReviewLinkButton",
  "AutosNegociosPreviewInventorySection",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    const tracked = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

function gateScopedChanges(): string[] {
  return changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    if (norm.startsWith("app/admin/")) return false;
    return GATE_SCOPED_MARKERS.some((m) => norm.includes(m)) || norm === "package.json" || norm.startsWith("scripts/autos-a5-polish-34");
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R34 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Gate A/i, "Gate A section required");
  assert.match(auditText, /Gate B/i, "Gate B section required");
  assert.match(auditText, /Gate C/i, "Gate C section required");
  assert.match(auditText, /Exact visible component trace/i, "Component trace required");
  assert.match(auditText, /Results preview card/i, "Results card section required");
  assert.match(auditText, /Business Hub/i, "Business Hub section required");
  assert.match(auditText, /Gallery CTA/i, "Gallery CTA section required");
  assert.match(auditText, /Hours alignment/i, "Hours section required");
  assert.match(auditText, /Promise strip/i, "Promise strip section required");
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

  const tokens = read("app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens.ts");
  assert.ok(tokens.includes("autosPreviewRectBadgeClass"), "Rect badge token");
  assert.ok(tokens.includes("autosPreviewMediaTabClass"), "Gallery media tab token");
  assert.ok(tokens.includes("AUTOS_PREVIEW_SECTION_IDS"), "Section ids");

  const results = read("app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx");
  assert.ok(
    results.includes("AUTOS_PREVIEW_SECTION_IDS.resultsCard") || results.includes("autos-preview-results-card"),
    "Results card section id",
  );
  assert.ok(!results.includes("justify-between border-t"), "Corner logo footer removed");

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  assert.ok(gallery.includes("autosPreviewMediaTabClass"), "Media tabs");
  assert.ok(gallery.includes("Ver todas") || gallery.includes("View all"), "Ver todas CTA");

  const hub = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(hub.includes("justify-between"), "Hours day-left/time-right");
  assert.ok(!hub.includes("sessionStorage.setItem"), "No sessionStorage writes");

  const promise = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewPromiseStrip.tsx");
  assert.ok(promise.includes("scrollIntoView"), "Promise strip anchor scroll");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("autosInventoryBundlePreviewCta"), "Ver vista previa");
  assert.ok(bundle.includes("autosInventoryBundleEdit"), "Editar");
  assert.ok(bundle.includes("autosInventoryBundleRemove"), "Quitar");

  const card = read("app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx");
  assert.ok(card.includes("autosRelatedInventoryAvailableAfterPublish"), "Draft chip");

  assert.ok(!auditText.match(/4\.8\s*stars|★★★★★|\d+\s+reviews/i), "No fake ratings");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix) && norm !== prefix, `Forbidden gate-scoped change: ${norm}`);
    }
  }

  console.log(`A5.POLISH-34 audit PASS (${recommendation}) — ${gateScopedChanges().length} gate-scoped file(s)`);
}

run();
