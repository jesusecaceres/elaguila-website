/**
 * Globalization Wave 3 G09/G10 — surface `droppedUnpersistable` at every real call site.
 * `buildProposedFinalMediaSet` (app/lib/media/listingMediaContract.ts) has always returned this
 * field specifically so callers can warn instead of silently losing intent, but a repo-wide
 * search confirmed zero of its ~7 real call sites ever read it — an unpersistable URL surviving
 * into a draft was dropped from the saved gallery with no warning anywhere. Adds a shared
 * `warnDroppedUnpersistableMedia` helper and wires it at every real call site (7 files, 11 call
 * sites total including the 4 in the generic dashboard editor). Source-level checks only.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function check(label: string, condition: boolean): void {
  if (condition) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("verify-wave3-g09-dropped-media-warning-2026-09-09: starting");

// --- 1. Shared helper exists ---
{
  const contract = read("app/lib/media/listingMediaContract.ts");
  check(
    "CONTRACT: warnDroppedUnpersistableMedia is exported and checks set.droppedUnpersistable",
    contract.includes("export function warnDroppedUnpersistableMedia(context: string, set: ProposedFinalMediaSet): void") &&
      contract.includes("if (set.droppedUnpersistable.length === 0) return;"),
  );
}

// --- 2. Every real call site now imports and calls the warning helper ---
const sites: Array<[string, number]> = [
  ["app/api/clasificados/restaurantes/publish/route.ts", 1],
  ["app/api/clasificados/servicios/publish/route.ts", 1],
  ["app/lib/clasificados/autos/autosListingPayloadPersistence.ts", 1],
  ["app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts", 1],
  ["app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts", 1],
  ["app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts", 3],
  ["app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx", 4],
];
for (const [rel, expectedCalls] of sites) {
  const src = read(rel);
  const importOk = src.includes("warnDroppedUnpersistableMedia");
  const callCount = (src.match(/warnDroppedUnpersistableMedia\(/g) ?? []).length;
  check(
    `${rel}: imports and calls warnDroppedUnpersistableMedia (expected ${expectedCalls} call site(s), found ${callCount})`,
    importOk && callCount === expectedCalls,
  );
}

console.log(
  `\nverify-wave3-g09-dropped-media-warning-2026-09-09: ${pass}/${pass + fail} checks passed`,
);
if (fail > 0) process.exit(1);
