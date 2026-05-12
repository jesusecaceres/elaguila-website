/**
 * Guard: Clasificados staff republish / ops contract (routes, row actions, public ordering, no legacy boost_expires).
 *
 * Run: `npm run audit:classifieds-ops`
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

const REQUIRED_PATHS = [
  "app/admin/_lib/classifiedsOpsContract.ts",
  "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx",
  "app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx",
  "app/api/admin/clasificados/listings/[id]/route.ts",
  "app/api/admin/servicios/listings/[id]/route.ts",
  "app/api/admin/empleos/listings/[id]/route.ts",
  "app/api/admin/autos/listings/[id]/route.ts",
  "app/api/admin/viajes/listings/[id]/route.ts",
  "app/api/admin/restaurantes/listings/[id]/route.ts",
  "app/admin/(dashboard)/workspace/clasificados/rentas/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/comunidad/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/clases/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/bienes-raices/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/listings/[id]/edit/page.tsx",
];

const ADMIN_REPUBLISH_ROUTES = [
  "app/api/admin/clasificados/listings/[id]/route.ts",
  "app/api/admin/restaurantes/listings/[id]/route.ts",
  "app/api/admin/servicios/listings/[id]/route.ts",
  "app/api/admin/empleos/listings/[id]/route.ts",
  "app/api/admin/autos/listings/[id]/route.ts",
  "app/api/admin/viajes/listings/[id]/route.ts",
];

/** Public / discovery surfaces expected to order by republish_sort_at (generated) or equivalent. */
const PUBLIC_SORT_FILES = [
  "app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts",
  "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts",
  "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts",
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts",
  "app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts",
  "app/(site)/clasificados/rentas/lib/rentasListingPublicSelect.ts",
  "app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx",
];

function* walkSourceFiles(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next" || ent.name === "dist") continue;
      yield* walkSourceFiles(p);
    } else if (/\.(ts|tsx|mts|js|jsx)$/.test(ent.name)) {
      yield p;
    }
  }
}

function scanBoostExpiresUnder(relRoots: string[]): string[] {
  const hits: string[] = [];
  for (const rel of relRoots) {
    const base = resolve(ROOT, rel);
    if (!existsSync(base)) continue;
    for (const f of walkSourceFiles(base)) {
      let text: string;
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      if (!text.includes("boost_expires")) continue;
      hits.push(relative(ROOT, f).split("\\").join("/"));
    }
  }
  return hits;
}

function fileMustContain(rel: string, needle: RegExp | string, label: string): string | null {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) return `${label}: missing file ${rel}`;
  const text = readFileSync(abs, "utf8");
  const ok = typeof needle === "string" ? text.includes(needle) : needle.test(text);
  return ok ? null : `${label}: ${rel} does not match ${needle}`;
}

async function loadRepublishCapability() {
  const url = pathToFileURL(resolve(ROOT, "app/admin/_lib/classifiedsRepublishCapability.ts")).href;
  return import(url) as Promise<{
    canRepublishListing: (row: Record<string, unknown>, category: string) => boolean;
    republishCapabilityReason: (row: Record<string, unknown>, category: string) => string | null;
  }>;
}

async function main() {
  const { canRepublishListing, republishCapabilityReason } = await loadRepublishCapability();
  const errors: string[] = [];

  for (const rel of REQUIRED_PATHS) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) errors.push(`Missing required path: ${rel}`);
  }

  for (const rel of ADMIN_REPUBLISH_ROUTES) {
    const e = fileMustContain(rel, /republish/i, "Admin PATCH republish");
    if (e) errors.push(e);
  }

  const rowActions = fileMustContain(
    "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx",
    'run("republish")',
    "ClassifiedAdminRowActions",
  );
  if (rowActions) errors.push(rowActions);

  for (const rel of PUBLIC_SORT_FILES) {
    const e = fileMustContain(rel, "republish_sort_at", "Public sort");
    if (e) errors.push(e);
  }

  const boostHits = scanBoostExpiresUnder(["app/admin", "app/api", "app/(site)"]);
  if (boostHits.length) {
    errors.push(`boost_expires still referenced under app/: ${boostHits.join(", ")}`);
  }

  console.log("\nRepublish capability matrix (expected business rules)\n");
  console.log("| Category / case | Republish capability | Reason |");
  console.log("| --- | --- | --- |");

  const detailPro = [{ label: "Leonix:plan", value: "pro" }];
  const detailFree = [{ label: "Leonix:plan", value: "free" }];

  const cases: Array<{ label: string; category: string; row: Record<string, unknown> }> = [
    { label: "restaurantes", category: "restaurantes", row: {} },
    { label: "servicios", category: "servicios", row: {} },
    { label: "empleos", category: "empleos", row: {} },
    { label: "viajes", category: "viajes", row: { lifecycle_status: "approved", is_public: true } },
    { label: "bienes-raices", category: "bienes-raices", row: { category: "bienes-raices" } },
    { label: "rentas", category: "rentas", row: { category: "rentas" } },
    { label: "autos (negocios)", category: "autos", row: { lane: "negocios", status: "active" } },
    { label: "en-venta (pro)", category: "en-venta", row: { category: "en-venta", detail_pairs: detailPro } },
    { label: "en-venta (free)", category: "en-venta", row: { category: "en-venta", detail_pairs: detailFree } },
    { label: "comunidad", category: "comunidad", row: { category: "comunidad" } },
    { label: "clases", category: "clases", row: { category: "clases" } },
  ];

  for (const c of cases) {
    const ok = canRepublishListing(c.row, c.category);
    const reason = republishCapabilityReason(c.row, c.category) ?? "—";
    const cap = ok ? "TRUE" : "FALSE";
    console.log(`| ${c.label} | ${cap} | ${reason} |`);

    if (c.label === "en-venta (free)" && (ok || reason !== "Free listing")) {
      errors.push(`en-venta free: expected ineligible with reason "Free listing" (ok=${ok}, reason=${reason})`);
    }
    if (c.label === "comunidad" && ok) errors.push("comunidad: expected republish capability FALSE");
    if (c.label === "clases" && ok) errors.push("clases: expected republish capability FALSE");
    if (c.label === "restaurantes" && !ok) errors.push(`restaurantes: expected TRUE (reason=${reason})`);
  }

  if (errors.length) {
    console.error("\nCLASSIFIEDS_OPS_AUDIT_FAIL\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }

  console.log("\nCLASSIFIEDS_OPS_AUDIT_OK — files, republish routes, public sort, boost_expires scan, capability matrix.");
  process.exit(0);
}

void main();
