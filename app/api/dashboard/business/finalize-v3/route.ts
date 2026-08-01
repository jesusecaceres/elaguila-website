import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { finalizeBusinessIdentityV3 } from "@/app/lib/business/services/finalizeBusinessV3";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import type { ContactInput, CustomLinkInput, ServiceAreaInput } from "@/app/lib/business/validation";
import type { StructuredLocationDetailsV1 } from "@/app/lib/business/types";

/** POST /api/dashboard/business/finalize-v3 — Gate BCO-3R-B.2 atomic Business Identity creation (contact-foundation completion). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const basics = (body.basics ?? {}) as Record<string, unknown>;
  const operatingModel = (body.operatingModel ?? {}) as Record<string, unknown>;
  const authorization = (body.authorization ?? {}) as Record<string, unknown>;

  const contacts: ContactInput[] = Array.isArray(body.contacts)
    ? body.contacts.map((c: Record<string, unknown>) => ({
        contactType: typeof c?.contactType === "string" ? c.contactType : "",
        rawValue: typeof c?.value === "string" ? c.value : "",
        preferredChannel: c?.preferredChannel === true,
        channelKind: typeof c?.channelKind === "string" ? c.channelKind : null,
        isPrimary: c?.isPrimary === true,
        label: typeof c?.label === "string" ? c.label : "main",
        visibility: typeof c?.visibility === "string" ? c.visibility : "public",
        capabilities: Array.isArray(c?.capabilities) ? (c.capabilities as string[]) : [],
      }))
    : [];

  const serviceAreas = Array.isArray(body.serviceAreas)
    ? body.serviceAreas.map((a: Record<string, unknown>) => ({
        areaKind: typeof a?.areaKind === "string" ? a.areaKind : "",
        rawText: typeof a?.rawText === "string" ? a.rawText : "",
        isPrimary: a?.isPrimary === true,
        country: typeof a?.country === "string" ? a.country : "",
        structuredDetails: (typeof a?.structuredDetails === "object" && a.structuredDetails !== null ? a.structuredDetails : { schemaVersion: 1 }) as StructuredLocationDetailsV1,
      }))
    : [];

  const digitalProfiles = Array.isArray(body.digitalProfiles)
    ? body.digitalProfiles.map((p: Record<string, unknown>) => ({
        platform: typeof p?.platform === "string" ? p.platform : "",
        handleOrUrl: typeof p?.handleOrUrl === "string" ? p.handleOrUrl : "",
      }))
    : [];

  const customLinks: CustomLinkInput[] = Array.isArray(body.customLinks)
    ? body.customLinks.map((l: Record<string, unknown>) => ({
        linkType: typeof l?.linkType === "string" ? l.linkType : "",
        customLabel: typeof l?.customLabel === "string" ? l.customLabel : null,
        rawUrl: typeof l?.rawUrl === "string" ? l.rawUrl : "",
        visibility: typeof l?.visibility === "string" ? l.visibility : "public",
      }))
    : [];

  const listingCandidates = Array.isArray(body.listingCandidates)
    ? body.listingCandidates.map((l: Record<string, unknown>) => ({
        listingSource: typeof l?.listingSource === "string" ? l.listingSource : "",
        listingId: typeof l?.listingId === "string" ? l.listingId : "",
      }))
    : [];

  const userClient = getServerSupabaseForBearerToken(token);
  const result = await finalizeBusinessIdentityV3(getAdminSupabase(), userClient, {
    userId,
    draftId: typeof body.draftId === "string" ? body.draftId : null,
    basics: {
      displayName: typeof basics.displayName === "string" ? basics.displayName : "",
      broadBusinessType: typeof basics.broadBusinessType === "string" ? basics.broadBusinessType : "",
      specificBusinessType: typeof basics.specificBusinessType === "string" ? basics.specificBusinessType : "",
      customSpecificType: typeof basics.customSpecificType === "string" ? basics.customSpecificType : "",
      businessStage: typeof basics.businessStage === "string" ? basics.businessStage : "",
      primaryLanguage: typeof basics.primaryLanguage === "string" ? basics.primaryLanguage : "",
      businessPrimaryLanguage: typeof basics.businessPrimaryLanguage === "string" ? basics.businessPrimaryLanguage : "",
      businessAdditionalLanguages: Array.isArray(basics.businessAdditionalLanguages) ? (basics.businessAdditionalLanguages as string[]) : [],
      yearStarted: typeof basics.yearStarted === "number" ? basics.yearStarted : null,
    },
    operatingModel: {
      operatingModels: Array.isArray(operatingModel.operatingModels) ? (operatingModel.operatingModels as string[]) : [],
      salesRelationships: Array.isArray(operatingModel.salesRelationships) ? (operatingModel.salesRelationships as string[]) : [],
      salesChannels: Array.isArray(operatingModel.salesChannels) ? (operatingModel.salesChannels as string[]) : [],
    },
    contacts,
    preferredResponseMethod: typeof body.preferredResponseMethod === "string" ? body.preferredResponseMethod : null,
    serviceAreas: serviceAreas as (ServiceAreaInput & { country: string; structuredDetails: StructuredLocationDetailsV1 })[],
    digitalProfiles,
    customLinks,
    authorization: {
      confirmed: authorization.confirmed === true,
      role: typeof authorization.role === "string" ? authorization.role : "",
      representativeRelationship: typeof authorization.representativeRelationship === "string" ? authorization.representativeRelationship : "",
      representativeContactEmail: typeof authorization.representativeContactEmail === "string" ? authorization.representativeContactEmail : "",
      representativeNote: typeof authorization.representativeNote === "string" ? authorization.representativeNote : "",
    },
    listingCandidates,
    acknowledgedDuplicateWarning: body.acknowledgedDuplicateWarning === true,
  });

  if (!result.ok) {
    const status = result.reasonCode === "feature_unavailable" ? 403 : 400;
    return NextResponse.json({ error: result.reasonCode, detail: "errors" in result ? result.errors : undefined }, { status });
  }
  return NextResponse.json({ businessId: result.businessId });
}
