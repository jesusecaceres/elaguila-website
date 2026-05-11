/**
 * Guard: Clasificados staff ops surface files exist (queues, PATCH APIs, shared row actions).
 *
 * Run: `npm run audit:classifieds-ops`
 *
 * Exit 0 — all required paths exist.
 * Exit 1 — missing file (CI should fail).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

function main() {
  const missing: string[] = [];
  for (const rel of REQUIRED_PATHS) {
    const abs = resolve(process.cwd(), rel);
    if (!existsSync(abs)) missing.push(rel);
  }
  if (missing.length) {
    console.error("CLASSIFIEDS_OPS_AUDIT_FAIL — missing files:\n" + missing.map((m) => `  - ${m}`).join("\n"));
    process.exit(1);
  }
  console.log("CLASSIFIEDS_OPS_AUDIT_OK — required staff ops files present.");
  process.exit(0);
}

main();
