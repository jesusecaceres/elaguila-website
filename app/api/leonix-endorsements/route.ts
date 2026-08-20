import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { isLeonixEndorsementCategory } from "@/app/lib/leonixCommunityTrust/leonixEndorsementRegistry";
import { getLeonixEndorsementSummary, toggleLeonixEndorsementVote } from "@/app/lib/leonixCommunityTrust/leonixEndorsementServer";

export const runtime = "nodejs";

/**
 * Public aggregate read — no auth required. Counts are real business information a signed-out
 * shopper should be able to see. `userId` is resolved from an OPTIONAL bearer token only to
 * compute the caller's own vote state; an absent/invalid token simply yields `userVoted: false`
 * for every key, never an error.
 */
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "";
  const targetId = req.nextUrl.searchParams.get("targetId") ?? "";
  if (!isLeonixEndorsementCategory(category) || !targetId.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }
  const userId = await getBearerUserId(req);
  const summary = await getLeonixEndorsementSummary(getAdminSupabase(), { category, targetId, userId });
  return NextResponse.json({ ok: true, summary, signedIn: userId !== null });
}

/**
 * Toggle one vote. Ownership is always resolved from a verified bearer token — a caller can never
 * vote as another user, and an unauthenticated request is rejected outright (the client is
 * responsible for routing a signed-out tap to the existing Leonix login redirect first, exactly
 * like every other Saved-Search-era auth-gated action in this app).
 */
export async function POST(req: NextRequest) {
  const userId = await getBearerUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const category = typeof b.category === "string" ? b.category : "";
  const targetId = typeof b.targetId === "string" ? b.targetId : "";
  const endorsementKey = typeof b.endorsementKey === "string" ? b.endorsementKey : "";
  // Optional, best-effort owner id for the self-vote block (Gate 15) — supplied by the calling
  // component from data it already has (e.g. the listing's own owner_user_id), never used as an
  // identity source for the vote itself.
  const ownerUserId = typeof b.ownerUserId === "string" ? b.ownerUserId : null;
  if (!category.trim() || !targetId.trim() || !endorsementKey.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await toggleLeonixEndorsementVote(getAdminSupabase(), {
    category,
    targetId,
    endorsementKey,
    userId,
    ownerUserId,
  });
  if (!result.ok) {
    const status =
      result.error === "invalid_endorsement_key" || result.error === "invalid_target"
        ? 400
        : result.error === "self_vote_blocked"
          ? 403
          : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, active: result.active, count: result.count });
}
