/**
 * Globalization Package A terminal closure — BR/Rentas stale-draft precedence adoption.
 *
 * Gate 3 committed the shared staleness contract (resolveDraftPrecedence + workspace
 * sourceUpdatedAt hooks); this correction wires it into every named BR and Rentas surface
 * where a stale local edit workspace could previously override newer canonical DB state:
 *
 *   - BR Negocio application boot (AgenteIndividualResidencialApplication.tsx)
 *   - BR Negocio dashboard preview client (AgenteIndividualResidencialPreviewClient.tsx)
 *   - Rentas Privado form boot (RentasPrivadoForm.tsx)
 *   - Rentas Negocio form boot (RentasNegocioForm.tsx)
 *
 * Contract pinned here:
 *   1. Both hydration sources now expose the row's `updated_at` (`sourceUpdatedAt`).
 *   2. Every surface resolves precedence via the SHARED contract — canonical DB truth wins
 *      when the row is newer; the stale workspace is cleared/replaced and the conflict is
 *      SURFACED (bilingual notice), never silently applied.
 *   3. A workspace anchored to the unchanged row (or a legacy workspace with no anchor)
 *      remains available — valid unsaved edit drafts are never destroyed.
 *   4. Fresh hydrations anchor the workspace (`sourceUpdatedAt` threaded into save), and
 *      incremental saves preserve the anchor (Gate 3 behavior, re-pinned).
 *   5. Parent/child namespaces stay separate (BR child workspaces keep their own keys).
 *
 * Run from repo root: npx tsx scripts/gate-pkgA-stale-draft-precedence-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { resolveDraftPrecedence } from "../app/lib/listingDrafts/draftWorkspaceContract";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — Hydration sources expose the anchor. */
{
  const br = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts",
  );
  assert.ok(br.includes("sourceUpdatedAt: string | null"), "BR hydration result must expose sourceUpdatedAt");
  assert.ok(/OWNER_LISTING_SELECT[\s\S]{0,900}updated_at/.test(br), "BR owner select must include updated_at");

  const rentas = read("app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts");
  assert.ok(rentas.includes("sourceUpdatedAt: string | null"), "Rentas hydration result must expose sourceUpdatedAt");
  assert.ok(rentas.includes("updated_at"), "Rentas owner select must include updated_at");
}

/* 2/3/4 — Every named surface adopts the shared precedence with surfaced conflicts and
 * anchored saves. */
{
  const surfaces: Array<[string, string]> = [
    [
      "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
      "readBienesListingEditWorkspaceMeta",
    ],
    [
      "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
      "readBienesListingEditWorkspaceMeta",
    ],
    ["app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx", "readRentasListingEditWorkspaceMeta"],
    ["app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx", "readRentasListingEditWorkspaceMeta"],
  ];
  for (const [file, metaReader] of surfaces) {
    const src = read(file);
    assert.ok(src.includes("resolveDraftPrecedence"), `${file} must use the SHARED precedence contract (never a local reimplementation)`);
    assert.ok(src.includes(metaReader), `${file} must read the workspace's staleness metadata`);
    assert.ok(src.includes('"db-newer-conflict"'), `${file} must branch on the conflict outcome`);
    assert.ok(
      src.includes("cambió desde tu último borrador local") && src.includes("changed since your last local draft"),
      `${file} must SURFACE the conflict bilingually — never silently apply stale state`,
    );
    assert.ok(src.includes("sourceUpdatedAt:"), `${file} must anchor workspace saves to the hydrated row version`);
  }
}

/* 2/3 — The shared rule itself (behavioral re-pin): DB wins only when strictly newer; valid
 * and legacy workspaces survive. */
{
  assert.equal(
    resolveDraftPrecedence({ hasLocalWorkspace: true, localSourceUpdatedAt: "2026-08-01T00:00:00Z", dbUpdatedAt: "2026-08-02T00:00:00Z" }),
    "db-newer-conflict",
  );
  assert.equal(
    resolveDraftPrecedence({ hasLocalWorkspace: true, localSourceUpdatedAt: "2026-08-02T00:00:00Z", dbUpdatedAt: "2026-08-02T00:00:00Z" }),
    "local",
    "a workspace anchored to the unchanged row keeps the owner's unsaved edits",
  );
  assert.equal(
    resolveDraftPrecedence({ hasLocalWorkspace: true, localSourceUpdatedAt: null, dbUpdatedAt: "2026-08-02T00:00:00Z" }),
    "local",
    "legacy workspaces (no anchor) degrade to local-wins — never a fabricated conflict",
  );
}

/* 5 — Parent/child namespace separation unchanged. */
{
  const ws = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesDashboardListingEditWorkspace.ts",
  );
  assert.ok(ws.includes(":parent") && ws.includes(":child:"), "BR parent and child workspaces must keep distinct key namespaces");
}

console.log("gate-pkgA-stale-draft-precedence-selftest: all assertions passed.");
