import { NextResponse, type NextRequest } from "next/server";
import { listOwnDrafts, saveDraftStep } from "@/app/lib/business/services/draftService";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import type { BusinessOnboardingDraftPayload } from "@/app/lib/business/types";

/** GET /api/dashboard/business/drafts — list the caller's own drafts. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userClient = getServerSupabaseForBearerToken(token);
  const drafts = await listOwnDrafts(userClient);
  return NextResponse.json({ drafts });
}

/** POST /api/dashboard/business/drafts — upsert a draft step. Never trusts a client-supplied user id. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { intentKey?: unknown; currentStep?: unknown; draftPayload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const intentKey = typeof body.intentKey === "string" ? body.intentKey : "";
  const currentStep = typeof body.currentStep === "number" ? body.currentStep : NaN;
  const draftPayload = (body.draftPayload && typeof body.draftPayload === "object" ? body.draftPayload : { schemaVersion: 1 }) as BusinessOnboardingDraftPayload;

  const userClient = getServerSupabaseForBearerToken(token);
  const result = await saveDraftStep(userClient, { userId, intentKey, currentStep, draftPayload });
  if (!result.ok) {
    return NextResponse.json({ error: result.reasonCode }, { status: 400 });
  }
  return NextResponse.json({ draft: result.draft });
}
