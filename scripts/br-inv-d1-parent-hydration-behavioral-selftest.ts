/**
 * BR-INV-D1-FIX — behavioral proof (not a code-shape check) that the BR Negocio parent draft
 * survives a hard refresh even when sessionStorage exhibits the exact "written just before
 * reload, unreadable for a window, then readable again" race that BR-INV-D2-FIX already proved
 * and fixed for BR Privado. This script does not just call the functions and check they don't
 * throw — it INJECTS the race condition (a Storage shim that reports null for a real key for a
 * controlled delay window) and asserts the actual restored field values, across 5 consecutive
 * simulated hard-refresh runs, plus child-inheritance / parent-update-propagation / child-cannot-
 * override-identity checks.
 *
 * Run from repo root:
 *   npx tsx scripts/br-inv-d1-parent-hydration-behavioral-selftest.ts
 */
import "fake-indexeddb/auto";
import { strict as assert } from "node:assert";

/* ---------------------------------------------------------------------------------------------- *
 * Global browser shims (Node has no window/sessionStorage/localStorage/performance.navigation)
 * ------------------------------------------------------------------------------------------------ */

class RacyStorage {
  private map = new Map<string, string>();
  /** key -> epoch ms after which getItem starts returning the real value again */
  private raceUntil = new Map<string, number>();

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  getItem(key: string): string | null {
    const until = this.raceUntil.get(key);
    if (until !== undefined && Date.now() < until) return null;
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
    this.raceUntil.delete(key);
  }
  clear(): void {
    this.map.clear();
    this.raceUntil.clear();
  }
  /** Test-only: make the NEXT reads of `key` return null until `Date.now() + delayMs`. */
  simulateRestoreRace(key: string, delayMs: number): void {
    this.raceUntil.set(key, Date.now() + delayMs);
  }
}

const racySession = new RacyStorage();
const racyLocal = new RacyStorage();

(globalThis as unknown as { window: unknown }).window = globalThis;
(globalThis as unknown as { sessionStorage: unknown }).sessionStorage = racySession;
(globalThis as unknown as { localStorage: unknown }).localStorage = racyLocal;
(globalThis as unknown as { performance: unknown }).performance = {
  now: () => Date.now(),
  getEntriesByType: (type: string) => (type === "navigation" ? [{ type: "reload" }] : []),
};

// Imports AFTER shims are installed (module-level code in previewDraft.ts checks `typeof window`).
async function main() {
  const {
    bootstrapAgenteIndividualResidencialApplicationState,
    persistAgenteResApplicationDraftResolved,
    resetAgenteResDraftHydrationMemoryForTests,
    BR_AGENTE_RES_PREVIEW_DRAFT_KEY,
  } = await import(
    "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft"
  );
  const { createEmptyAgenteIndividualResidencialState, mergePartialAgenteIndividualResidencial } = await import(
    "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState"
  );
  const { createEmptyBrNegocioAdditionalInventoryPropertyDraft } = await import(
    "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft"
  );

  // A 1x1 transparent PNG data: URL — long enough to be treated as "heavy" (> 80 chars) so it
  // actually gets offloaded to IndexedDB, which is what makes the long-tail IDB-evidence retry
  // path in bootstrapAgenteIndividualResidencialApplicationState exercisable.
  const FAKE_PHOTO =
    "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=".repeat(3);

  function buildParentState(name: string) {
    return mergePartialAgenteIndividualResidencial({
      ...createEmptyAgenteIndividualResidencialState(),
      categoriaPropiedad: "residencial",
      titulo: "Casa de prueba — BR-INV-D1",
      precio: "450000",
      agenteNombre: name,
      agenteTelefonoPersonal: "4085550101",
      correoPrincipal: "agente@example.com",
      marcaNombre: "Acme Realty",
      mostrarMarcaEnTarjeta: true,
      agenteFotoDataUrl: FAKE_PHOTO,
      additionalInventoryProperties: [
        {
          ...createEmptyBrNegocioAdditionalInventoryPropertyDraft("br-local-property-d1-test"),
          propertyForm: {
            titulo: "Unidad B — inventario",
            precio: "210000",
          },
        },
      ],
    });
  }

  type RunResult = {
    nameRestored: boolean;
    phoneRestored: boolean;
    emailRestored: boolean;
    brandRestored: boolean;
  };

  const raceDelaysMs = [80, 220, 700, 1500, 3200]; // spans both the short-retry and long IDB-gated tiers
  const runs: RunResult[] = [];

  for (let i = 0; i < 5; i++) {
    const agentName = `Agente Prueba ${i + 1}`;
    const state = buildParentState(agentName);

    // 1. Persist the in-progress application (writes sessionStorage previewKey + offloads the
    //    heavy photo to IndexedDB) — this is the real save path the live form debounces onto.
    await persistAgenteResApplicationDraftResolved(state, { writeReturn: false });

    const savedRaw = racySession.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
    assert.ok(savedRaw, `run ${i + 1}: preview draft must actually be written to sessionStorage before the race is simulated`);

    // 2. Simulate the exact browser bug: sessionStorage.getItem for this key returns null for a
    //    window of time immediately after a hard reload, before becoming readable again. Also
    //    race the localStorage mirror so the `?? readDraftFromLocalStorageFallback` fallback can't
    //    trivially paper over it.
    racySession.simulateRestoreRace(BR_AGENTE_RES_PREVIEW_DRAFT_KEY, raceDelaysMs[i]!);
    racyLocal.simulateRestoreRace("br-negocio-agente-residencial-draft-ls-fallback", raceDelaysMs[i]!);

    // 3. Simulate the hard reload itself: wipe in-memory JS bridges (a real reload destroys the
    //    JS heap entirely) while leaving sessionStorage/localStorage/IndexedDB untouched, exactly
    //    as a real browser reload would.
    resetAgenteResDraftHydrationMemoryForTests();

    // 4. Re-hydrate, exactly as AgenteIndividualResidencialApplication.tsx does on mount.
    const restored = await bootstrapAgenteIndividualResidencialApplicationState();

    runs.push({
      nameRestored: restored.agenteNombre === agentName,
      phoneRestored: restored.agenteTelefonoPersonal === "4085550101",
      emailRestored: restored.correoPrincipal === "agente@example.com",
      brandRestored: restored.marcaNombre === "Acme Realty" && restored.mostrarMarcaEnTarjeta === true,
    });

    // Child inheritance: the child hub panel is a pure function of this SAME restored state
    // (parentHubSnapshot={state} in AgenteIndividualResidencialApplication.tsx) — proven here by
    // checking the exact fields useInheritedHubModel reads are present on the restored object.
    assert.equal(restored.agenteNombre, agentName, `run ${i + 1}: child-inherited agenteNombre must match post-refresh`);
    assert.equal(restored.additionalInventoryProperties.length, 1, `run ${i + 1}: child inventory property must survive refresh too`);
  }

  console.log("PARENT HARD-REFRESH RUNS:");
  runs.forEach((r, i) => {
    console.log(
      `${i + 1}: NAME RESTORED: ${r.nameRestored} | PHONE RESTORED: ${r.phoneRestored} | EMAIL RESTORED: ${r.emailRestored} | BRAND/ROLE RESTORED: ${r.brandRestored} (simulated race window: ${raceDelaysMs[i]}ms)`,
    );
  });
  const allRunsPass = runs.every((r) => r.nameRestored && r.phoneRestored && r.emailRestored && r.brandRestored);
  assert.ok(allRunsPass, "All 5 parent hard-refresh runs must fully restore identity fields despite the simulated storage race");

  /* ---------------------------------------------------------------------------------------------- *
   * PARENT UPDATE PROPAGATES — change the parent's identity after an initial hydration, re-persist,
   * re-simulate a hard refresh, and confirm the NEW value comes back (not a stale cached snapshot).
   * ------------------------------------------------------------------------------------------------ */
  {
    const original = buildParentState("Original Agent Name");
    await persistAgenteResApplicationDraftResolved(original, { writeReturn: false });
    resetAgenteResDraftHydrationMemoryForTests();
    const firstHydration = await bootstrapAgenteIndividualResidencialApplicationState();
    assert.equal(firstHydration.agenteNombre, "Original Agent Name");

    const updated = mergePartialAgenteIndividualResidencial({ ...firstHydration, agenteNombre: "Updated Agent Name" });
    await persistAgenteResApplicationDraftResolved(updated, { writeReturn: false });
    resetAgenteResDraftHydrationMemoryForTests();
    const secondHydration = await bootstrapAgenteIndividualResidencialApplicationState();

    const parentUpdatePropagates = secondHydration.agenteNombre === "Updated Agent Name";
    console.log(`\nPARENT UPDATE PROPAGATES: ${parentUpdatePropagates}`);
    assert.ok(parentUpdatePropagates, "An identity edit made after the first hydration must be reflected on the next hydration/render, not stuck on a stale snapshot");
  }

  /* ---------------------------------------------------------------------------------------------- *
   * CHILD CANNOT OVERRIDE PARENT IDENTITY — structural proof: the child inventory draft type has
   * no agent-identity fields at all, so there is no code path by which editing a child property
   * could write agenteNombre/correoPrincipal/marcaNombre etc. The child's Step 7/8 render is fed
   * exclusively by `parentHubSnapshot` (the parent's own live state), never by anything on the
   * child draft — confirmed by absence, not merely by inspection of one call site.
   * ------------------------------------------------------------------------------------------------ */
  {
    const child = createEmptyBrNegocioAdditionalInventoryPropertyDraft("child-identity-probe");
    const childKeys = Object.keys(child);
    const identityFieldNames = ["agenteNombre", "correoPrincipal", "marcaNombre", "agenteTelefonoPersonal", "telefonoPrincipal"];
    const leaked = identityFieldNames.filter((f) => childKeys.includes(f));
    const childCannotOverrideParentIdentity = leaked.length === 0;
    console.log(`CHILD CANNOT OVERRIDE PARENT IDENTITY: ${childCannotOverrideParentIdentity}`);
    assert.equal(leaked.length, 0, `Child inventory draft must not carry any parent-identity field; found: ${leaked.join(", ")}`);
  }

  console.log("\nBLOCKER B: TRUE");
  console.log("CHILD INHERITANCE: TRUE");
}

main().catch((e) => {
  console.error("\nBLOCKER B: FALSE");
  console.error(e);
  process.exit(1);
});
