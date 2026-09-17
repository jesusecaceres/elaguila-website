import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hasVerifiedLinkForListing } from "./repositories/listingLinksRepo";
import { levelRank, maskDisplayName, wordOverlapScore } from "./duplicatesLogic";
import type { DuplicateCandidateSummary, DuplicateLevel, DuplicateWarningResult } from "./types";

export { maskDisplayName, wordOverlapScore };

/**
 * Bounded duplicate warnings — never auto-merges, never auto-links, never exposes another
 * owner's private contact/address data. `possible` uses a deterministic word-overlap heuristic
 * in application code rather than pg_trgm (explicitly excluded — availability on this Supabase
 * project was never confirmed, per the BCO-1C.0 preflight).
 */

export type DuplicateCheckInput = {
  currentUserId: string;
  normalizedName: string;
  normalizedPhone: string | null;
  normalizedEmail: string | null;
  normalizedDomain: string | null;
  normalizedServiceAreaText: string | null;
  listingCandidate: { listingSource: string; listingId: string } | null;
};

type CandidateRow = {
  id: string;
  display_name: string;
  normalized_name: string;
  created_by_user_id: string;
};

export async function resolveDuplicateWarning(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  input: DuplicateCheckInput,
): Promise<DuplicateWarningResult> {
  // Existing active membership resolves as "existing_business" at the access-resolution layer,
  // not as a duplicate warning here — this function only ever runs during new-business onboarding.
  void userClient;

  const nameToken = input.normalizedName.split(" ").filter((w) => w.length > 2)[0];
  const { data: nameMatches } = nameToken
    ? await adminClient
        .from("businesses")
        .select("id, display_name, normalized_name, created_by_user_id")
        .eq("status", "active")
        .ilike("normalized_name", `%${nameToken}%`)
        .limit(25)
    : { data: [] as CandidateRow[] };

  const candidateRows = (nameMatches ?? []) as CandidateRow[];

  const candidates: DuplicateCandidateSummary[] = [];
  let bestLevel: DuplicateLevel = "none";

  for (const row of candidateRows) {
    const matchedSignals: DuplicateCandidateSummary["matchedSignals"][number][] = [];
    const exactName = row.normalized_name === input.normalizedName;
    if (exactName) matchedSignals.push("normalizedName");

    // Contact/service-area signals are never fetched for candidates the current user doesn't
    // own — we only ever compare against this business's own contacts if the current user
    // already has SELECT access to them (which, by RLS, only happens for their own businesses,
    // i.e. never for a genuine duplicate-candidate scan). So contact-signal matching here is
    // deliberately name/listing-link only, keeping this function honest about what it can see.
    let verifiedListingMatch = false;
    if (input.listingCandidate) {
      verifiedListingMatch = await hasVerifiedLinkForListing(adminClient, input.listingCandidate.listingSource, input.listingCandidate.listingId);
      if (verifiedListingMatch) matchedSignals.push("verifiedListingLink");
    }

    const overlap = wordOverlapScore(row.normalized_name, input.normalizedName);
    const isPossible = !exactName && overlap >= 0.5;

    let level: DuplicateLevel = "none";
    if (exactName && verifiedListingMatch) level = "exact";
    else if (exactName) level = "probable";
    else if (verifiedListingMatch) level = "probable";
    else if (isPossible) level = "possible";

    if (level === "none") continue;

    if (levelRank(level) > levelRank(bestLevel)) bestLevel = level;

    candidates.push({
      businessId: row.id,
      displayNameMasked: maskDisplayName(row.display_name),
      matchedSignals,
      accessibleToCurrentUser: row.created_by_user_id === input.currentUserId,
    });
  }

  return { level: bestLevel, candidates };
}
