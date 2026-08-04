import { NextResponse, type NextRequest } from "next/server";
import { findActiveMembershipForCurrentUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveLivingBookFlagTier } from "@/app/lib/business/livingBook/featureFlag";
import { submitCorrection } from "@/app/lib/business/livingBook/repository";
import { MAX_CORRECTION_EXPLANATION_LENGTH } from "@/app/lib/business/livingBook/constants";
import type { CorrectionType, LivingBookActor } from "@/app/lib/business/livingBook/types";

const OWNER_CORRECTION_TYPES = new Set<string>(["owner_confirms", "owner_corrects", "owner_rejects"]);

/**
 * POST /api/dashboard/business/book/corrections — the owner confirms, corrects, rejects, or
 * answers an open confirmation question. Never directly rewrites a canonical fact — every
 * submission is `status: 'pending'` until a real staff member decides it through the staff
 * workspace (business_corrections_decision_chk enforces this at the DB level too).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLivingBookFlagTier(userId);
  if (tier === "unavailable") return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForCurrentUser(userClient, userId);
  if (!membership) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });
  const business = await getBusinessByIdForCurrentUser(userClient, membership.businessId);
  if (!business) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  const { data: authData } = await userClient.auth.getUser();
  const ownerEmail = authData?.user?.email;
  if (!ownerEmail) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const correctionType = typeof b.correctionType === "string" && OWNER_CORRECTION_TYPES.has(b.correctionType) ? (b.correctionType as CorrectionType) : null;
  if (!correctionType) return NextResponse.json({ ok: false, error: "invalid_correction_type" }, { status: 400 });
  const relatedFactId = typeof b.relatedFactId === "string" && b.relatedFactId.trim() ? b.relatedFactId : null;
  const submittedDisplayValue = typeof b.submittedDisplayValue === "string" && b.submittedDisplayValue.trim() ? b.submittedDisplayValue.trim() : null;
  const explanation = typeof b.explanation === "string" && b.explanation.trim() ? b.explanation.trim().slice(0, MAX_CORRECTION_EXPLANATION_LENGTH) : null;

  const actor: LivingBookActor = { type: "owner", authUserId: userId, email: ownerEmail.trim().toLowerCase() };
  const result = await submitCorrection(
    { businessId: business.id, relatedFactId, correctionType, submittedValue: submittedDisplayValue, submittedDisplayValue, explanation },
    actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
