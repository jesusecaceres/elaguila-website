/**
 * Saved Search 02/03 — server-only SHA-256 fingerprint (Node `crypto`).
 * Node-only: never import this from a client component — `node:crypto` cannot be bundled into
 * the browser. Client code that needs the same fingerprint uses `savedSearchFingerprintBrowser.ts`
 * instead, which hashes the identical canonical input via Web Crypto. Both hash the exact same
 * `buildSavedSearchFingerprintInput` output (from `savedSearchCanonicalize.ts`), so the two never
 * diverge — SHA-256 of the same bytes is the same digest regardless of which primitive computed it.
 */
import { createHash } from "node:crypto";
import { canonicalizeSavedSearch, buildSavedSearchFingerprintInput } from "./savedSearchCanonicalize";
import type { SavedSearchNormalizedInput } from "./savedSearchTypes";

/** SHA-256 hex digest of the canonical fingerprint input — deterministic, collision-resistant,
 * no secret material involved (this hashes the search criteria, not anything sensitive). Safe to
 * store as `saved_searches.fingerprint` and to compare directly against the `legacy:<id>`
 * compatibility placeholder (never equal to it — that prefix isn't valid hex). */
export function buildSavedSearchFingerprint(input: SavedSearchNormalizedInput): string {
  const canonical = canonicalizeSavedSearch(input);
  const fingerprintInput = buildSavedSearchFingerprintInput(canonical);
  return createHash("sha256").update(fingerprintInput).digest("hex");
}
