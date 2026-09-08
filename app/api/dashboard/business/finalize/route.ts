import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { finalizeBusinessIdentity } from "@/app/lib/business/services/finalizeBusiness";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import type { ContactInput, ServiceAreaInput } from "@/app/lib/business/validation";

/** POST /api/dashboard/business/finalize — atomic Business Identity creation (Phase 12/13). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: {
    draftId?: unknown;
    basics?: { displayName?: unknown; broadBusinessType?: unknown; businessStage?: unknown; primaryLanguage?: unknown };
    contacts?: unknown;
    serviceAreas?: unknown;
    ownershipConfirmed?: unknown;
    listingCandidate?: { listingSource?: unknown; listingId?: unknown } | null;
    acknowledgedDuplicateWarning?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const basics = {
    displayName: typeof body.basics?.displayName === "string" ? body.basics.displayName : "",
    broadBusinessType: typeof body.basics?.broadBusinessType === "string" ? body.basics.broadBusinessType : "",
    businessStage: typeof body.basics?.businessStage === "string" ? body.basics.businessStage : "",
    primaryLanguage: typeof body.basics?.primaryLanguage === "string" ? body.basics.primaryLanguage : "",
  };

  const contacts: ContactInput[] = Array.isArray(body.contacts)
    ? body.contacts.map((c: Record<string, unknown>) => ({
        contactType: typeof c?.contactType === "string" ? c.contactType : "",
        rawValue: typeof c?.value === "string" ? c.value : "",
        preferredChannel: c?.preferredChannel === true,
        channelKind: typeof c?.channelKind === "string" ? c.channelKind : null,
        isPrimary: c?.isPrimary === true,
      }))
    : [];

  const serviceAreas: ServiceAreaInput[] = Array.isArray(body.serviceAreas)
    ? body.serviceAreas.map((a: Record<string, unknown>) => ({
        areaKind: typeof a?.areaKind === "string" ? a.areaKind : "",
        rawText: typeof a?.rawText === "string" ? a.rawText : "",
        isPrimary: a?.isPrimary === true,
      }))
    : [];

  const listingCandidate =
    body.listingCandidate && typeof body.listingCandidate.listingSource === "string" && typeof body.listingCandidate.listingId === "string"
      ? { listingSource: body.listingCandidate.listingSource, listingId: body.listingCandidate.listingId }
      : null;

  const userClient = getServerSupabaseForBearerToken(token);
  const result = await finalizeBusinessIdentity(getAdminSupabase(), userClient, {
    userId,
    draftId: typeof body.draftId === "string" ? body.draftId : null,
    basics,
    contacts,
    serviceAreas,
    ownershipConfirmed: body.ownershipConfirmed === true,
    listingCandidate,
    acknowledgedDuplicateWarning: body.acknowledgedDuplicateWarning === true,
  });

  if (!result.ok) {
    const status = result.reasonCode === "feature_unavailable" ? 403 : 400;
    return NextResponse.json({ error: result.reasonCode, detail: "errors" in result ? result.errors : undefined }, { status });
  }
  return NextResponse.json({ businessId: result.businessId });
}
