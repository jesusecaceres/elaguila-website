/**
 * Work Package I.6B (Objective C) — smallest shared helper for quick-listing republish
 * idempotency (En Venta / Busco / Clases / Comunidad).
 *
 * Not a new platform framework: this only (1) validates a session-persisted canonical listing
 * UUID, and (2) verifies — server-side, via the same RLS-enforced `listings` table every
 * publisher already reads/writes — that a candidate UUID is genuinely this owner's own row in
 * the expected category before any publisher is allowed to reuse it instead of inserting a new
 * row. Each publisher still performs its own category-specific INSERT/UPDATE; this helper only
 * answers "is it safe to reuse this id," failing closed on anything else.
 */
import type { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isCanonicalUuid } from "@/app/lib/listingIdentity/identityBuilders";

export type QuickListingReuseCheck =
  | { safe: true; listingId: string }
  | { safe: false; reason: "missing" | "invalid-uuid" | "not-found" | "owner-mismatch" | "category-mismatch" | "query-error" };

/**
 * Reads a session-persisted candidate listing id and validates its shape only (no network).
 * Pure — safe to unit test without Supabase.
 */
export function readCandidateListingId(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  return isCanonicalUuid(trimmed) ? trimmed : null;
}

/**
 * Verifies a candidate listing id is genuinely this owner's own row in the expected category
 * before a publisher may UPDATE it instead of inserting a new row. Fails closed (never reuses)
 * on any missing/invalid/unauthorized/wrong-category/query-error outcome — the caller must then
 * fall back to a fresh INSERT, never an unscoped UPDATE.
 */
export async function verifyQuickListingReusable(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  input: { candidateId: string | null; ownerUserId: string; expectedCategory: string },
): Promise<QuickListingReuseCheck> {
  const candidate = readCandidateListingId(input.candidateId);
  if (!candidate) return { safe: false, reason: input.candidateId ? "invalid-uuid" : "missing" };

  const { data, error } = await supabase
    .from("listings")
    .select("id, owner_id, category")
    .eq("id", candidate)
    .maybeSingle();

  if (error) return { safe: false, reason: "query-error" };
  if (!data) return { safe: false, reason: "not-found" };
  if (String(data.owner_id ?? "") !== input.ownerUserId) return { safe: false, reason: "owner-mismatch" };
  if (String(data.category ?? "") !== input.expectedCategory) return { safe: false, reason: "category-mismatch" };

  return { safe: true, listingId: candidate };
}

/**
 * Work Package I.6C — deterministic, sanitized error surfaced to the client whenever a caller
 * supplied a candidate listing id (an existing-listing intention) but `verifyQuickListingReusable`
 * could not confirm it is safe to reuse. Callers must return this instead of falling back to an
 * INSERT — a failed existing-identity check must never silently become a new listing. Never
 * exposes the raw Supabase/Postgres error; the specific `QuickListingReuseCheck["reason"]` is for
 * internal logging only (see `logQuickListingReuseFailure`).
 */
export const QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE = "quick_listing_existing_identity_invalid";

export function quickListingExistingIdentityInvalidMessage(lang: "es" | "en"): string {
  return lang === "es"
    ? "No pudimos verificar tu anuncio existente. Tu borrador sigue guardado — puedes intentar de nuevo o empezar uno nuevo."
    : "We couldn't verify your existing listing. Your draft is still saved — you can retry or start a new one.";
}

export type QuickListingReuseFailureReason = Extract<QuickListingReuseCheck, { safe: false }>["reason"];

/** Internal-only logging (never surfaced to the client) of why an existing-identity check failed. */
export function logQuickListingReuseFailure(context: string, reason: QuickListingReuseFailureReason): void {
  console.warn(`[${QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE}] ${context}: reuse verification failed (${reason})`);
}
