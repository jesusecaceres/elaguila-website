/**
 * A5.RECOVERY-31 — Autos Negocios true preview + inherited dealer contact + zero data loss audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_31_NEGOCIOS_TRUE_PREVIEW_INHERITED_CONTACT_ZERO_DATA_LOSS_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "No Supabase schema/migrations touched",
  "Dealer Step 5 source of truth identified",
  "Dealer Step 5 fields persist",
  "Dealer Step 5 fields rehydrate",
  "Dealer Step 5 reaches preview",
  "Dealer Step 5 reaches publish mapper",
  "Languages persist and rehydrate",
  "Google Business persists separately from Google Reviews",
  "Google Reviews persists separately from Google Business",
  "Yelp persists separately",
  "Custom dealership websites/resources persist",
  "Finance data persists",
  "Child Step 5 is read-only/inherited",
  "Child Step 5 does not overwrite parent dealer data",
  "Child can return to parent Step 5 without losing child data",
  "Child vehicle flow uses same/equivalent main vehicle field logic",
  "Child dropdowns work",
  "Child VIN/structured data works if main supports it",
  "Child save does not publish",
  "Child save writes into additionalInventoryVehicles",
  "Hard refresh preserves parent draft",
  "Hard refresh preserves child inventory array",
  "Hard refresh preserves child text/spec fields",
  "Hard refresh preserves child image URLs",
  "Hard refresh preserves child video URLs",
  "Hard refresh preserves child image order",
  "Volver a editar exists from main preview",
  "Volver a editar preserves parent draft",
  "Volver a editar preserves added inventory",
  "Volver a editar preserves child media",
  "Volver a editar returns to correct step/context",
  "Main preview uses real draft data",
  "Added inventory preview uses real child data",
  "Business Hub preview uses real Step 5 data",
  "Finance preview uses real finance data when filled",
  "Preview does not fake public URLs",
  "Preview does not fake Leonix IDs before publish",
  "Preview does not fake analytics",
  "Main carousel uses main images",
  "Child carousel/cards use child images",
  "No parent/child media overwrite",
  "Add website button works",
  "Website link rows save",
  "Website link rows rehydrate",
  "Website links render publicly only when valid",
  "Drawer click-out does not discard dirty child data",
  "Drawer is usable on desktop",
  "Mobile drawer remains usable",
  "Publish mapper inspected",
  "Publish mapper uses owner_user_id",
  "Publish mapper uses listing_payload",
  "Publish mapper uses leonix_ad_id",
  "Publish mapper uses dealer_inventory_group_id",
  "Publish mapper uses dealer_inventory_parent_listing_id",
  "Publish mapper uses inventory_role",
  "Publish mapper does not require slug",
  "Main publish role is main",
  "Child publish role is additional",
  "Children share dealer_inventory_group_id",
  "Children receive parent listing id",
  "Each published row receives unique Leonix Ad ID",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/autos/privado/",
  "app/(site)/clasificados/autos/privado/",
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/magazine/",
];

const GATE_SCOPED_MARKERS = [
  "AUTOS_A5_RECOVERY_31",
  "autos-a5-recovery-31",
  "autosInventoryChildStep5Intro",
  "autosInventoryChildStep5EditHint",
  "handleEditInMainApplication",
];

const AUDIT_TOPIC_MARKERS = [
  "Step 5 source of truth",
  "inherited dealer information",
  "read-only child Step 5",
  "additionalInventoryVehicles",
  "Volver a editar",
  "hard refresh",
  "image URLs",
  "video URLs",
  "Add website",
  "dealer_inventory_group_id",
  "dealer_inventory_parent_listing_id",
  "inventory_role",
  "owner_user_id",
  "listing_payload",
  "leonix_ad_id",
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
    return (
      GATE_SCOPED_MARKERS.some((m) => norm.includes(m)) ||
      norm.startsWith("scripts/autos-a5-recovery-31") ||
      norm.includes("AUTOS_A5_RECOVERY_31") ||
      norm.includes("AutosInventoryInheritedDealerStep.tsx") ||
      norm.includes("AutosNegociosAddInventoryDrawer.tsx") ||
      norm.includes("AutosNegociosApplication.tsx") ||
      norm.includes("autosNegociosInventoryBundleCopy.ts") ||
      norm === "package.json"
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R31 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  for (const topic of AUDIT_TOPIC_MARKERS) {
    assert.ok(auditText.includes(topic), `Audit must mention: ${topic}`);
  }

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

  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  assert.ok(
    bundleCopy.includes("Dealer information is inherited from the main dealership application"),
    "Required EN inherited-dealer copy",
  );
  assert.ok(
    bundleCopy.includes("La información del dealer se hereda de la aplicación principal del concesionario"),
    "Required ES inherited-dealer copy",
  );
  assert.ok(bundleCopy.includes("Save inventory"), "Save inventory CTA");
  assert.ok(bundleCopy.includes("Save and add another"), "Save and add another CTA");

  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(negociosCopy.includes("Add website") || negociosCopy.includes("Añadir enlace"), "Add website copy");

  const publishCopy = read("app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts");
  assert.ok(publishCopy.includes("Volver a editar"), "Volver a editar copy");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(
    !privadoApp.includes("Dealer information is inherited from the main dealership application"),
    "Privado must not get dealer-only inherited strings",
  );

  const draft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(draft.includes("additionalInventoryVehicles") || draft.includes("mergeFullInventoryVehicle"), "Child inventory helpers");

  const inherited = read("app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx");
  assert.ok(inherited.includes("autosInventoryChildStep5Intro"), "Inherited step uses intro copy");
  assert.ok(inherited.includes("autosInventoryChildStep5EditHint"), "Inherited step uses edit hint");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("requestClose"), "Drawer dirty close guard");
  assert.ok(drawer.includes("handleEditInMainApplication"), "Edit parent handler");
  assert.ok(drawer.includes("onInProgressChange"), "In-progress persistence on edit parent");

  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("addDealershipLink"), "Add website handler");
  assert.ok(app.includes("onEditParentDealerStep"), "Edit parent step navigation");

  const publish = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(publish.includes("owner_user_id"), "Publish uses owner_user_id");
  assert.ok(publish.includes("listing_payload"), "Publish uses listing_payload");
  assert.ok(publish.includes("dealer_inventory_group_id"), "Publish uses dealer_inventory_group_id");
  assert.ok(publish.includes("dealer_inventory_parent_listing_id"), "Publish uses dealer_inventory_parent_listing_id");
  assert.ok(publish.includes("inventory_role"), "Publish uses inventory_role");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden gate-scoped change: ${norm}`);
    }
  }

  const allChanged = changedFiles();
  for (const f of allChanged) {
    const norm = f.replace(/\\/g, "/");
    assert.ok(!norm.startsWith("app/(site)/publicar/autos/privado/"), `Autos Privado must not be modified: ${norm}`);
    assert.ok(!norm.startsWith("app/(site)/clasificados/autos/privado/"), `Autos Privado must not be modified: ${norm}`);
  }

  const scoped = gateScopedChanges();
  console.log(`A5.RECOVERY-31 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
