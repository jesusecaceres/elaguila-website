/**
 * Globalization Build 03 — Leonix Community Trust server module. Reuses, never duplicates:
 *   - the atomic `toggle_leonix_endorsement_vote` / `get_leonix_endorsement_summary` RPCs
 *   - `getBearerUserId` + `getAdminSupabase` (the established owner-scoped-table convention this
 *     repo already uses for Saved Search, ofertas-locales owner routes, phone verification)
 *
 * Identity is always resolved server-side from a verified bearer token before reaching this
 * module — nothing here ever trusts a caller-supplied user id. No `import "server-only"` guard
 * here deliberately: every function takes its Supabase client as a parameter rather than calling
 * `getAdminSupabase()` internally, so this module is genuinely parameterized/pure — mirroring the
 * same choice already made for `autosPublicEligibleListing.ts`/`savedSearchAutosMatcher.ts`,
 * which stay import-safe under a plain Node/tsx fixture test. The only real caller is the API
 * route (`app/api/leonix-endorsements/route.ts`), a server-only Next.js Route Handler by
 * construction — no client component imports this file.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getLeonixEndorsementDefinitions,
  isValidLeonixEndorsementKey,
  leonixEndorsementTargetTypeForCategory,
  type LeonixEndorsementCategory,
} from "./leonixEndorsementRegistry";

export type LeonixEndorsementSummaryEntry = {
  key: string;
  es: string;
  en: string;
  count: number;
  userVoted: boolean;
};

/** One bounded RPC call, merged against the full category registry so every eligible key is
 * represented — including genuinely zero-vote keys (Gate 20). No N+1 (Gate 18/34). */
export async function getLeonixEndorsementSummary(
  supabase: SupabaseClient,
  input: { category: LeonixEndorsementCategory; targetId: string; userId: string | null },
): Promise<LeonixEndorsementSummaryEntry[]> {
  const targetType = leonixEndorsementTargetTypeForCategory(input.category);
  const { data, error } = await supabase.rpc("get_leonix_endorsement_summary", {
    p_target_type: targetType,
    p_target_id: input.targetId,
    p_user_id: input.userId,
  });
  const rows = (error || !data ? [] : data) as Array<{ endorsement_key: string; vote_count: number; user_voted: boolean }>;
  const byKey = new Map(rows.map((r) => [r.endorsement_key, r]));
  return getLeonixEndorsementDefinitions(input.category).map((def) => {
    const row = byKey.get(def.key);
    return {
      key: def.key,
      es: def.es,
      en: def.en,
      count: row?.vote_count ?? 0,
      userVoted: row?.user_voted ?? false,
    };
  });
}

export type LeonixEndorsementToggleResult =
  | { ok: true; active: boolean; count: number }
  | { ok: false; error: "invalid_category" | "invalid_endorsement_key" | "self_vote_blocked" | "invalid_target" | "toggle_failed" };

/** Best-effort self-vote block (Gate 15) — only enforced where the caller can supply a real,
 * already-trusted owner-identity value for this business target. Neither category currently has
 * ownership provable at a stronger level than what their own existing Business Hub cards already
 * rely on for other engagement gating, so this reuses that exact same trust level rather than
 * inventing a new, unproven ownership check. */
function isSelfVote(ownerUserId: string | null | undefined, votingUserId: string): boolean {
  return Boolean(ownerUserId) && ownerUserId === votingUserId;
}

/**
 * Atomically toggles one vote. Validates category + endorsement_key against the registry before
 * ever calling the RPC (the RPC itself trusts its caller, so this validation is the real gate).
 * `userId` must already be server-derived (verified bearer token) — never accepted from a request
 * body by this function's own caller.
 */
export async function toggleLeonixEndorsementVote(
  supabase: SupabaseClient,
  input: {
    category: string;
    targetId: string;
    endorsementKey: string;
    userId: string;
    ownerUserId?: string | null;
  },
): Promise<LeonixEndorsementToggleResult> {
  if (!isValidLeonixEndorsementKey(input.category, input.endorsementKey)) {
    return { ok: false, error: "invalid_endorsement_key" };
  }
  const category = input.category as LeonixEndorsementCategory;
  if (isSelfVote(input.ownerUserId, input.userId)) {
    return { ok: false, error: "self_vote_blocked" };
  }
  const targetType = leonixEndorsementTargetTypeForCategory(category);
  const { data, error } = await supabase.rpc("toggle_leonix_endorsement_vote", {
    p_target_type: targetType,
    p_target_id: input.targetId,
    p_category: category,
    p_endorsement_key: input.endorsementKey,
    p_user_id: input.userId,
  });
  if (error) {
    // The RPC raises 'leonix_endorsement_target_not_found' (ERRCODE foreign_key_violation) when
    // target_id does not exist as a real row in the target category's own durable business table
    // — a random-but-syntactically-valid UUID can never receive a vote (Gate 6). Every other error
    // fails closed the same way (no vote created).
    const message = (error as { message?: string } | null)?.message ?? "";
    if (message.includes("leonix_endorsement_target_not_found")) {
      return { ok: false, error: "invalid_target" };
    }
    return { ok: false, error: "toggle_failed" };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { active: boolean; vote_count: number } | undefined;
  if (!row) return { ok: false, error: "toggle_failed" };
  return { ok: true, active: row.active, count: row.vote_count };
}
