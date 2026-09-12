/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — recording/transcription consent (MD
 * <recording_consent>: "expose consent workflow, NOT recording"). This route only ever writes a
 * consent STATE record via Gate 1's existing repository — no audio path, no transcript path
 * exists anywhere in this codebase to connect to.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { recordProjectDiscoveryConsent } from "@/app/lib/business/projectDiscovery/repository";
import type { DiscoveryConsentMethod, DiscoveryConsentState, DiscoveryConsentType } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

const VALID_TYPES: readonly DiscoveryConsentType[] = ["notes", "audio_recording", "transcription", "file_photo_review", "followup_messages"];
const VALID_STATES: readonly DiscoveryConsentState[] = ["provided", "declined", "withdrawn"];
const VALID_METHODS: readonly DiscoveryConsentMethod[] = ["verbal", "written", "digital_acknowledgment"];

interface RecordConsentBody {
  consentType?: unknown;
  state?: unknown;
  method?: unknown;
  language?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_discovery_consent"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as RecordConsentBody;

  const consentType = body.consentType;
  const state = body.state;
  const method = body.method;
  if (
    typeof consentType !== "string" || !VALID_TYPES.includes(consentType as DiscoveryConsentType) ||
    typeof state !== "string" || !VALID_STATES.includes(state as DiscoveryConsentState) ||
    typeof method !== "string" || !VALID_METHODS.includes(method as DiscoveryConsentMethod)
  ) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await recordProjectDiscoveryConsent(
    {
      discoveryId,
      businessId,
      consentType: consentType as DiscoveryConsentType,
      state: state as DiscoveryConsentState,
      method: method as DiscoveryConsentMethod,
      language: body.language === "en" ? "en" : "es",
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, consent: result.consent });
}
