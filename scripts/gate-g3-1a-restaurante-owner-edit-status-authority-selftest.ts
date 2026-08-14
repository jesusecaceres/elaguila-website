/**
 * Gate G.3.1A — behavioral self-test for the pure Restaurantes owner-edit status-transition
 * authority. No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g3-1a-restaurante-owner-edit-status-authority-selftest.ts
 *
 * SCOPE NOTE: this exercises `resolveRestauranteOwnerEditTargetStatus` directly — the exact
 * function `app/api/clasificados/restaurantes/publish/route.ts` now calls before every existing-
 * row update. It cannot exercise the route's own HTTP handling, Supabase compare-and-set, or the
 * real Revenue OS webhook path (all I/O-dependent, require a live database) — those are tracked
 * as a remaining risk (see the Gate G.3.1A report), not fabricated here. What's verified,
 * exhaustively: no existing protected status can ever resolve to a target of `"published"` unless
 * it was already `"published"`.
 */
import { strict as assert } from "node:assert";

import {
  RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR,
  resolveRestauranteOwnerEditTargetStatus,
} from "../app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority";

/* ------------------------------------------------------------------------------------------ *
 * Every known status is self-preserving
 * ------------------------------------------------------------------------------------------ */

for (const status of ["published", "pending_payment", "archived", "suspended"]) {
  const result = resolveRestauranteOwnerEditTargetStatus(status);
  assert.equal(result.ok, true, `"${status}" must resolve ok`);
  assert.equal((result as { targetStatus: string }).targetStatus, status, `"${status}" must target itself, never escalate`);
}

// Case-insensitive / whitespace-tolerant, matching how the row's raw column value is read.
assert.deepEqual(resolveRestauranteOwnerEditTargetStatus("  PENDING_PAYMENT  "), { ok: true, targetStatus: "pending_payment" });
assert.deepEqual(resolveRestauranteOwnerEditTargetStatus("Archived"), { ok: true, targetStatus: "archived" });

/* ------------------------------------------------------------------------------------------ *
 * The confirmed Gate G.3A bypass, closed: pending_payment and archived never resolve to published
 * ------------------------------------------------------------------------------------------ */

assert.notEqual(
  (resolveRestauranteOwnerEditTargetStatus("pending_payment") as { targetStatus?: string }).targetStatus,
  "published",
  "pending_payment must never resolve to published via an ordinary edit",
);
assert.notEqual(
  (resolveRestauranteOwnerEditTargetStatus("archived") as { targetStatus?: string }).targetStatus,
  "published",
  "archived must never resolve to published via an ordinary edit",
);
assert.notEqual(
  (resolveRestauranteOwnerEditTargetStatus("suspended") as { targetStatus?: string }).targetStatus,
  "published",
  "suspended must never resolve to published via an ordinary edit (no moderation bypass)",
);

/* ------------------------------------------------------------------------------------------ *
 * Unknown / missing status fails closed — never defaults to published
 * ------------------------------------------------------------------------------------------ */

for (const bad of [null, undefined, "", "totally_unknown_legacy", "PUBLISHED_TYPO"]) {
  const result = resolveRestauranteOwnerEditTargetStatus(bad as string | null | undefined);
  assert.equal(result.ok, false, `"${bad}" must fail closed, not silently succeed`);
  assert.equal((result as { error: string }).error, RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR);
}

console.log(`gate-g3-1a-restaurante-owner-edit-status-authority-selftest: OK`);
