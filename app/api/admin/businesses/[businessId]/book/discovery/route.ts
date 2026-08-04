import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { DISCOVERY_CONSENT_STATES, DISCOVERY_SESSION_TYPES } from "@/app/lib/business/livingBook/constants";
import { startDiscoverySession } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

const SESSION_TYPE_VALUES = new Set<string>(DISCOVERY_SESSION_TYPES.map((o) => o.value));
const CONSENT_VALUES = new Set<string>(DISCOVERY_CONSENT_STATES.map((o) => o.value));

/** POST — start a discovery session. No recording/transcription in this package — structured Q&A only. */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "conduct_discovery")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const sessionType = typeof b.sessionType === "string" && SESSION_TYPE_VALUES.has(b.sessionType) ? b.sessionType : null;
  if (!sessionType) return NextResponse.json({ ok: false, error: "invalid_session_type" }, { status: 400 });
  const language = b.language === "es" || b.language === "en" ? b.language : null;
  if (!language) return NextResponse.json({ ok: false, error: "invalid_language" }, { status: 400 });
  const consentState = typeof b.consentState === "string" && CONSENT_VALUES.has(b.consentState) ? b.consentState : "not_required";

  const result = await startDiscoverySession(
    { businessId, sessionType: sessionType as never, language, consentState: consentState as never },
    staffActorToLivingBookActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
