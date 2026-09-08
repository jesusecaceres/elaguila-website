/**
 * Globalization Package A Gate 3 — draft contract + publish idempotency self-test.
 *
 * Pins the Gate 3 deliverables:
 *   1. CANONICAL DRAFT CONTRACT — key derivation structurally isolates new-publish from
 *      listing-edit (Rule 1), the envelope reader tolerates legacy shapes, the staleness
 *      precedence rule (Rule 3) behaves exactly as specified, and the adapter registry covers
 *      every pipeline exactly once.
 *   2. SERVER PUBLISH IDEMPOTENCY — migration 20260804120000 (column + partial unique index)
 *      exists; the session attempt-key helpers are stable/fail-open; all three quick-lane
 *      publishers stamp the key, recover their own row on conflict, and clear on success.
 *   3. RENTAS/BR REUSE FAIL-CLOSED — leonixPublishRealEstateListingCore's pending-reuse
 *      lookup error is now a hard stop before any INSERT decision.
 *   4. STALENESS CAPTURE HOOKS — the BR and Rentas edit workspaces persist and expose
 *      `sourceUpdatedAt` metadata (precedence wiring lands with Gate 5's edit/save truth).
 *
 * Run from repo root: npx tsx scripts/gate-pkgA-draft-idempotency-selftest.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  deriveDraftWorkspaceKey,
  DRAFT_STORE_ADAPTERS,
  readDraftEnvelope,
  resolveDraftPrecedence,
  wrapDraftEnvelope,
} from "../app/lib/listingDrafts/draftWorkspaceContract";
import {
  getOrCreateSessionPublishAttemptKey,
  clearSessionPublishAttemptKey,
  isPublishAttemptKeyConflict,
} from "../app/(site)/clasificados/lib/quickListingIdempotency";
import { CATEGORY_ROUTE_REGISTRY } from "../app/lib/listingIdentity/categoryRouteRegistry";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* ==============================================================================================
 * 1 — Draft contract.
 * ============================================================================================ */
{
  const newKey = deriveDraftWorkspaceKey({
    pipeline: "en_venta",
    ownerKey: "user-1",
    context: { kind: "new-publish", applicationInstanceId: "abc" },
  });
  const editKey = deriveDraftWorkspaceKey({
    pipeline: "en_venta",
    ownerKey: "user-1",
    context: { kind: "listing-edit", listingId: "abc" },
  });
  assert.notEqual(newKey, editKey, "Rule 1: new-publish and listing-edit keys must never collide, even with identical ids");
  assert.ok(newKey.includes(":new:") && editKey.includes(":edit:"));

  const childKey = deriveDraftWorkspaceKey({
    pipeline: "bienes_raices_negocio",
    ownerKey: "user-1",
    context: { kind: "listing-edit", listingId: "parent-1", childListingId: "child-1" },
  });
  assert.ok(childKey.endsWith(":edit:parent-1:child:child-1"));

  const laneKeyed = deriveDraftWorkspaceKey({
    pipeline: "empleos",
    laneKey: "empleos_premium",
    ownerKey: "user-1",
    context: { kind: "new-publish", applicationInstanceId: "i1" },
  });
  assert.ok(laneKeyed.includes(":empleos_premium:"), "lane-keyed drafts carry the canonical lane key");

  // Envelope: wrap → read roundtrip, legacy tolerance.
  const envelope = wrapDraftEnvelope({ title: "x" }, "2026-08-01T00:00:00.000Z");
  const roundtrip = readDraftEnvelope<{ title: string }>(envelope);
  assert.equal(roundtrip?.data.title, "x");
  assert.equal(roundtrip?.sourceUpdatedAt, "2026-08-01T00:00:00.000Z");
  const legacy = readDraftEnvelope<{ title: string }>({ title: "legacy-shape" });
  assert.equal(legacy?.data.title, "legacy-shape", "legacy raw drafts must still load");
  assert.equal(legacy?.sourceUpdatedAt, null);
  assert.equal(readDraftEnvelope(null), null);

  // Rule 3 precedence truth table.
  assert.equal(resolveDraftPrecedence({ hasLocalWorkspace: false, localSourceUpdatedAt: null, dbUpdatedAt: "2026-08-01T00:00:00Z" }), "db");
  assert.equal(
    resolveDraftPrecedence({ hasLocalWorkspace: true, localSourceUpdatedAt: null, dbUpdatedAt: "2026-08-01T00:00:00Z" }),
    "local",
    "unknown local source version degrades to local-wins (today's behavior), never a fabricated conflict",
  );
  assert.equal(
    resolveDraftPrecedence({
      hasLocalWorkspace: true,
      localSourceUpdatedAt: "2026-08-01T00:00:00Z",
      dbUpdatedAt: "2026-08-01T00:00:00Z",
    }),
    "local",
    "row unchanged since hydration → local edit-in-progress wins",
  );
  assert.equal(
    resolveDraftPrecedence({
      hasLocalWorkspace: true,
      localSourceUpdatedAt: "2026-08-01T00:00:00Z",
      dbUpdatedAt: "2026-08-02T00:00:00Z",
    }),
    "db-newer-conflict",
    "row moved underneath the workspace → DB is truth and the conflict must be surfaced",
  );

  // Adapter registry: every registered pipeline exactly once.
  const pipelines = DRAFT_STORE_ADAPTERS.map((a) => a.pipeline);
  assert.equal(pipelines.length, Object.keys(CATEGORY_ROUTE_REGISTRY).length);
  assert.equal(new Set(pipelines).size, pipelines.length, "no pipeline may appear twice in the adapter registry");
  for (const pipeline of Object.keys(CATEGORY_ROUTE_REGISTRY)) {
    assert.ok(pipelines.includes(pipeline as (typeof pipelines)[number]), `adapter registry missing ${pipeline}`);
  }
}

/* ==============================================================================================
 * 2 — Publish idempotency key: migration, helpers, publisher wiring.
 * ============================================================================================ */
{
  const migrationPath = "supabase/migrations/20260804120000_listings_publish_attempt_idempotency_key.sql";
  assert.ok(existsSync(path.join(REPO_ROOT, migrationPath)), "idempotency-key migration must exist");
  const migration = read(migrationPath);
  assert.ok(migration.includes("add column if not exists publish_attempt_key"));
  assert.ok(migration.includes("listings_owner_publish_attempt_key_uidx"));
  assert.ok(migration.includes("where publish_attempt_key is not null"), "index must be partial — legacy null rows unaffected");

  // Conflict detector truth table.
  assert.equal(isPublishAttemptKeyConflict(null), false);
  assert.equal(isPublishAttemptKeyConflict({ code: "23505", message: "duplicate key value violates unique constraint \"listings_owner_publish_attempt_key_uidx\"" }), true);
  assert.equal(isPublishAttemptKeyConflict({ code: "23505", message: "duplicate key value violates some_other_index" }), false, "a different unique violation must never be treated as this submission's own row");
  assert.equal(isPublishAttemptKeyConflict({ code: "42703", message: "column publish_attempt_key does not exist" }), false);

  // Session key: fail-open without window; stable with a stubbed sessionStorage.
  assert.equal(getOrCreateSessionPublishAttemptKey("busco"), null, "no window → fail open (null), publisher behaves as before the gate");
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  try {
    const first = getOrCreateSessionPublishAttemptKey("busco");
    const second = getOrCreateSessionPublishAttemptKey("busco");
    assert.ok(first && first.length >= 32, "a real UUID key must be created");
    assert.equal(first, second, "the same logical submission (incl. a racing second click) must reuse ONE key");
    const otherCategory = getOrCreateSessionPublishAttemptKey("clases");
    assert.notEqual(otherCategory, first, "keys are category-scoped");
    clearSessionPublishAttemptKey("busco");
    const afterClear = getOrCreateSessionPublishAttemptKey("busco");
    assert.notEqual(afterClear, first, "after a confirmed publish, the next submission gets a fresh key");
  } finally {
    delete (globalThis as Record<string, unknown>).window;
  }

  // All three quick publishers are wired: stamp, recover-on-conflict, clear-on-success.
  for (const publisher of [
    "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
    "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
    "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
  ]) {
    const src = read(publisher);
    assert.ok(src.includes("getOrCreateSessionPublishAttemptKey("), `${publisher} must stamp the attempt key`);
    assert.ok(src.includes("isPublishAttemptKeyConflict("), `${publisher} must detect its own-row conflict`);
    assert.ok(src.includes("fetchOwnListingIdByPublishAttemptKey("), `${publisher} must recover its own row instead of duplicating`);
    assert.ok(src.includes("clearSessionPublishAttemptKey("), `${publisher} must clear the key after a confirmed publish`);
  }
}

/* ==============================================================================================
 * 3 — Rentas/BR pending-reuse lookup fail-closed.
 * ============================================================================================ */
{
  const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
  const guardIdx = core.indexOf("if (reusableRealEstatePending.error) {");
  const reuseDecisionIdx = core.indexOf("const reusablePendingId =");
  assert.ok(guardIdx > -1, "the reuse-lookup fail-closed guard must exist");
  assert.ok(reuseDecisionIdx > -1);
  assert.ok(
    guardIdx < reuseDecisionIdx,
    "the fail-closed guard must run BEFORE the reuse-vs-insert decision — a lookup error must never fall through to INSERT",
  );
  assert.ok(
    core.slice(guardIdx, guardIdx + 900).includes("ok: false"),
    "the guard must return an error result, not merely log",
  );
}

/* ==============================================================================================
 * 4 — Staleness capture hooks on the BR and Rentas edit workspaces.
 * ============================================================================================ */
{
  const br = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesDashboardListingEditWorkspace.ts",
  );
  assert.ok(br.includes("sourceUpdatedAt"), "BR workspace must persist sourceUpdatedAt");
  assert.ok(br.includes("export function readBienesListingEditWorkspaceMeta"), "BR workspace must expose staleness metadata");

  const rentas = read("app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts");
  assert.ok(rentas.includes("wrapDraftEnvelope") && rentas.includes("readDraftEnvelope"), "Rentas workspace must use the shared envelope");
  assert.ok(rentas.includes("export function readRentasListingEditWorkspaceMeta"), "Rentas workspace must expose staleness metadata");
}

console.log("gate-pkgA-draft-idempotency-selftest: all assertions passed.");
