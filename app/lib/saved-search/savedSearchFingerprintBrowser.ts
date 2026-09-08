/**
 * Saved Search 03 — browser-safe SHA-256 fingerprint (Web Crypto), for client components that
 * need to show truthful "already saved" state before the owner clicks Save. Produces byte-for-byte
 * the same digest as `savedSearchFingerprintServer.ts`'s Node `crypto` implementation, because
 * both hash the identical `buildSavedSearchFingerprintInput` output from `savedSearchCanonicalize.ts`
 * — SHA-256 of the same input bytes is the same digest regardless of platform. Async (Web Crypto's
 * `subtle.digest` has no synchronous form), unlike the server version.
 */
import { canonicalizeSavedSearch, buildSavedSearchFingerprintInput } from "./savedSearchCanonicalize";
import type { SavedSearchNormalizedInput } from "./savedSearchTypes";

export async function buildSavedSearchFingerprintBrowser(input: SavedSearchNormalizedInput): Promise<string> {
  const canonical = canonicalizeSavedSearch(input);
  const fingerprintInput = buildSavedSearchFingerprintInput(canonical);
  const bytes = new TextEncoder().encode(fingerprintInput);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
