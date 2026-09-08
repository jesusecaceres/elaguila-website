import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToFieldDiscoveryActor } from "@/app/admin/_lib/fieldDiscoveryActor";
import { isFieldDiscoveryCanvassingEnabled } from "@/app/lib/business/fieldDiscovery/featureFlag";
import { validateCanvassIntake } from "@/app/lib/business/fieldDiscovery/logic";
import {
  createCanvassedBusiness,
  createSourceLink,
  recordConsent,
  searchCanvassDuplicateCandidates,
} from "@/app/lib/business/fieldDiscovery/repository";
import { addEvidence, startDiscoverySession } from "@/app/lib/business/livingBook/repository";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import type { CanvassIntakeInput } from "@/app/lib/business/fieldDiscovery/types";

export const runtime = "nodejs";

type CanvassRequestBody = Partial<CanvassIntakeInput>;

function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return fail(denialStatusCode(access.reason), access.reason);
  if (!actorHasCapability(access.actor, "conduct_canvassing")) return fail(403, "forbidden");
  if (!(await isFieldDiscoveryCanvassingEnabled())) return fail(503, "feature_disabled");

  let body: CanvassRequestBody;
  try {
    body = (await req.json()) as CanvassRequestBody;
  } catch {
    return fail(400, "bad_json");
  }

  const businessName = String(body.businessName ?? "").trim();
  const email = body.email ? String(body.email) : null;
  const errors = validateCanvassIntake({ businessName, email });
  if (errors.length > 0) return fail(400, "invalid_input", { errors });

  const fieldDiscoveryActor = staffActorToFieldDiscoveryActor(access.actor);
  const livingBookActor = staffActorToLivingBookActor(access.actor);

  const duplicateWarning = await searchCanvassDuplicateCandidates({
    actorAuthUserId: access.actor.authUserId,
    businessName,
    phone: body.phone ?? null,
    email,
    website: body.website ?? null,
  });

  if (duplicateWarning.level !== "none" && !body.confirmCreateDespiteDuplicates) {
    return NextResponse.json({ ok: false, error: "duplicate_business_warning", duplicateWarning });
  }

  const created = await createCanvassedBusiness(
    { displayName: businessName, primaryLanguage: body.preferredLanguage === "en" ? "en" : "es" },
    fieldDiscoveryActor,
  );
  if (!created.ok) return fail(500, created.error);

  const businessId = created.businessId;

  // Discovery session (staff_interview -- reuses the exact session_type value already certified
  // in the Living Business Book migration; no new session_type was added).
  const session = await startDiscoverySession(
    { businessId, sessionType: "staff_interview", language: body.preferredLanguage === "en" ? "en" : "es", consentState: "not_required" },
    livingBookActor,
  );
  const discoverySessionId = session.ok ? session.id : null;

  // Raw intake captured as staff-only evidence -- never a confirmed fact, per doctrine.
  const intakeSummary = {
    contactName: body.contactName ?? null,
    phone: body.phone ?? null,
    email,
    serviceAreaSummary: body.serviceAreaSummary ?? null,
    whatBusinessSells: body.whatBusinessSells ?? null,
    immediateConcern: body.immediateConcern ?? null,
    preferredFollowUpChannel: body.preferredFollowUpChannel ?? null,
    notes: body.notes ?? null,
    nextFollowUpDate: body.nextFollowUpDate ?? null,
  };
  await addEvidence(
    {
      businessId,
      relatedFactId: null,
      relatedUnknownId: null,
      evidenceType: "staff_note",
      sourceTitle: "Canvassing intake",
      sourceUrl: null,
      capturedText: JSON.stringify(intakeSummary).slice(0, 4000),
      sourceDate: new Date().toISOString().slice(0, 10),
      consentState: "not_required",
      reliability: "medium",
      visibility: "staff_only",
    },
    livingBookActor,
  );

  const sourceLinkInputs: { url: string | null; sourceType: "website" | "google_business" | "facebook" | "instagram" | "tiktok" }[] = [
    { url: body.website ?? null, sourceType: "website" },
    { url: body.googleBusinessLink ?? null, sourceType: "google_business" },
    { url: body.facebook ?? null, sourceType: "facebook" },
    { url: body.instagram ?? null, sourceType: "instagram" },
    { url: body.tiktok ?? null, sourceType: "tiktok" },
  ];
  for (const s of sourceLinkInputs) {
    if (s.url && s.url.trim()) {
      await createSourceLink({ businessId, sourceType: s.sourceType, url: s.url, collectionMethod: "canvassing", consentRecordId: null }, fieldDiscoveryActor);
    }
  }

  const consentInputs: { type: "photo_capture" | "file_upload" | "source_research" | "followup_contact"; provided: boolean }[] = [
    { type: "photo_capture", provided: Boolean(body.consentPhotoCapture) },
    { type: "file_upload", provided: Boolean(body.consentFileUpload) },
    { type: "source_research", provided: Boolean(body.consentSourceResearch) },
    { type: "followup_contact", provided: Boolean(body.consentFollowupContact) },
  ];
  for (const c of consentInputs) {
    await recordConsent(
      { businessId, consentType: c.type, consentState: c.provided ? "provided" : "declined", method: "verbal_at_visit", relatedDiscoverySessionId: discoverySessionId },
      fieldDiscoveryActor,
    );
  }

  return NextResponse.json({
    ok: true,
    businessId,
    discoverySessionId,
    duplicateWarning,
    nextRoute: `/admin/businesses/${businessId}`,
  });
}
