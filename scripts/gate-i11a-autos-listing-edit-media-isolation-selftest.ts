/**
 * Work Package I.11A — Autos Negocios/Privado listing-edit draft & media isolation self-test.
 *
 * Proven pre-existing bug: `hydrateAutosDealerListingForDashboardEdit()` (Negocios) and the
 * inline dashboard-edit fetch (Privado) wrote the DB-fetched listing into the SAME per-user
 * sessionStorage/IndexedDB namespace a fresh "new listing" draft uses — confirmed by the
 * `autosEditorTabSession.ts` comment "two tabs share one user namespace; last write wins."
 * Since every IndexedDB helper (`autosNegociosDraftImageIdb.ts`, `autosNegociosDraftVideoIdb.ts`,
 * `autosNegociosDraftIdbRefs.ts`) already takes `namespace` as an opaque string, the fix is
 * entirely in what value callers resolve as `namespace` — proven here at both the pure-function
 * level and the source-level wiring in the two hooks + two components.
 *
 * React hooks/components can't be invoked standalone outside the framework (same convention used
 * throughout this session) — wiring coverage is source-level (presence + relative ordering).
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i11a-autos-listing-edit-media-isolation-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { autosListingEditNamespace, isAutosListingEditNamespace } from "../app/lib/clasificados/autos/autosListingEditNamespace";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const NEGOCIOS_WRITE_PATH = "app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts";
const NEGOCIOS_HOOK = "app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts";
const NEGOCIOS_COMPONENT = "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx";
const PRIVADO_HOOK = "app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts";
const PRIVADO_COMPONENT = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const IDB_FILES = [
  "app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftImageIdb.ts",
  "app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftVideoIdb.ts",
  "app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts",
];

async function main() {
  /* ============================================================================================
   * PURE FUNCTION — different listing ids produce different namespaces; no listing id leaves the
   * base namespace untouched (new-listing behavior byte-for-byte unchanged).
   * ========================================================================================== */
  {
    const base = "u:owner-1";
    assert.equal(autosListingEditNamespace(base, undefined), base, "no listing id must leave the namespace unchanged");
    assert.equal(autosListingEditNamespace(base, ""), base, "empty listing id must leave the namespace unchanged");
    assert.equal(autosListingEditNamespace(base, null), base);

    const nsA = autosListingEditNamespace(base, "listing-A");
    const nsB = autosListingEditNamespace(base, "listing-B");
    assert.notEqual(nsA, nsB, "two different listings must resolve to two different namespaces");
    assert.notEqual(nsA, base, "an edit-scoped namespace must differ from the raw new-listing namespace");
    assert.equal(nsA, autosListingEditNamespace(base, "listing-A"), "same inputs must be deterministic");

    assert.equal(isAutosListingEditNamespace(base), false);
    assert.equal(isAutosListingEditNamespace(nsA), true);
  }

  /* ============================================================================================
   * IDB LAYER UNTOUCHED — confirms the fix is additive (no new parameters threaded through the
   * low-level storage layer), matching the design rationale in the approved plan.
   * ========================================================================================== */
  {
    for (const file of IDB_FILES) {
      const src = readSource(file);
      assert.ok(!src.includes("autosListingEditNamespace"), `${file} must remain namespace-opaque — it should never need to import the scoping helper itself`);
    }
  }

  /* ============================================================================================
   * NEGOCIOS WRITE PATH — the DB-hydration write uses the effective (listing-scoped) namespace.
   * ========================================================================================== */
  {
    const src = readSource(NEGOCIOS_WRITE_PATH);
    assert.ok(src.includes('from "@/app/lib/clasificados/autos/autosListingEditNamespace"'), "must import the shared scoping helper");
    const idx1 = src.indexOf("autosListingEditNamespace(rawNamespace, listingId)");
    assert.ok(idx1 > -1, "must compute the effective namespace from the raw namespace + the listing being edited");
    const saveIdx = src.indexOf("saveAutosNegociosDraftResolved(namespace,");
    assert.ok(saveIdx > -1 && idx1 < saveIdx, "the effective namespace must be computed before the save call, and the save call must use it");
  }

  /* ============================================================================================
   * NEGOCIOS HOOK — both the bootstrap effect and the auth-change handler use the effective
   * namespace, not just the one-time hydration write (guards the token-refresh-wipes-draft case).
   * ========================================================================================== */
  {
    const src = readSource(NEGOCIOS_HOOK);
    assert.ok(src.includes("export function useAutoDealerDraft(editListingId?: string)"), "hook must accept an optional editListingId parameter");
    const occurrences = (src.match(/autosListingEditNamespace\(/g) ?? []).length;
    assert.ok(occurrences >= 2, "both the bootstrap effect and the onAuthStateChange handler must call the scoping helper");
    assert.ok(src.includes("namespaceRef.current = ns;") && src.includes("namespaceRef.current = nextNs;"), "both resolution points must still assign namespaceRef.current");
    // The auth-change handler must derive nextNs from the scoped helper, not the raw namespace directly.
    const authChangeBlock = src.slice(src.indexOf("onAuthStateChange"));
    assert.ok(authChangeBlock.includes("autosListingEditNamespace(rawNextNs"), "onAuthStateChange must fold listing-edit scoping into nextNs, not just the bootstrap effect");
  }

  /* ============================================================================================
   * PRIVADO HOOK — same dual-resolution-point requirement.
   * ========================================================================================== */
  {
    const src = readSource(PRIVADO_HOOK);
    assert.ok(src.includes("export function useAutoPrivadoDraft(editListingId?: string)"), "hook must accept an optional editListingId parameter");
    const occurrences = (src.match(/autosListingEditNamespace\(/g) ?? []).length;
    assert.ok(occurrences >= 2, "both the bootstrap effect and the onAuthStateChange handler must call the scoping helper");
    const authChangeBlock = src.slice(src.indexOf("onAuthStateChange"));
    assert.ok(authChangeBlock.includes("autosListingEditNamespace(rawNextNs"), "onAuthStateChange must fold listing-edit scoping into nextNs");
  }

  /* ============================================================================================
   * COMPONENTS — editListingId is actually threaded from the dashboard-edit search params into
   * the hook call, only when in a real existing-listing edit mode.
   * ========================================================================================== */
  {
    const src = readSource(NEGOCIOS_COMPONENT);
    assert.ok(
      src.includes("useAutoDealerDraft(isExistingDashboardListingMode ? editListingId : undefined)"),
      "AutosNegociosApplication must pass editListingId into the hook only in existing-dashboard-listing mode",
    );
  }
  {
    const src = readSource(PRIVADO_COMPONENT);
    assert.ok(
      src.includes("useAutoPrivadoDraft(isDashboardListingEditMode ? editListingId : undefined)"),
      "AutosPrivadoApplication must pass editListingId into the hook only in dashboard-listing-edit mode",
    );
  }

  /* ============================================================================================
   * NEW-LISTING REGRESSION — a fresh application (no search params) must still resolve to the
   * unscoped namespace; the hook signature change is additive/optional, not a breaking change.
   * ========================================================================================== */
  {
    for (const [file, fnName] of [
      [NEGOCIOS_HOOK, "useAutoDealerDraft"],
      [PRIVADO_HOOK, "useAutoPrivadoDraft"],
    ] as const) {
      const src = readSource(file);
      assert.ok(new RegExp(`export function ${fnName}\\(editListingId\\?: string\\)`).test(src), `${fnName} must keep editListingId optional — existing callers with no argument must be unaffected`);
    }
  }

  console.log("gate-i11a-autos-listing-edit-media-isolation-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
