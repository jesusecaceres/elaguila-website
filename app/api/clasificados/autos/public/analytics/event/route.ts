import { NextResponse } from "next/server";
import { recordAutosClassifiedsListingEvent } from "@/app/lib/clasificados/autos/autosClassifiedsAnalyticsService";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  leonixAdId?: string | null;
  eventType?: string;
  lane?: AutosClassifiedsLane;
  metadata?: Record<string, unknown>;
};

/**
 * Public, best-effort analytics (active listings only). No auth; rate-limit at edge if needed.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const listingId = body.listingId?.trim();
  const eventType = body.eventType?.trim();
  const leonixAdId = typeof body.leonixAdId === "string" && body.leonixAdId.trim() ? body.leonixAdId.trim() : null;
  if (!listingId || !eventType) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const lane = body.lane === "negocios" || body.lane === "privado" ? body.lane : undefined;
  const ok = await recordAutosClassifiedsListingEvent({
    listingId,
    eventType,
    lane,
    metadata: {
      ...(body.metadata ?? {}),
      ...(leonixAdId ? { clientLeonixAdId: leonixAdId } : {}),
    },
  });
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_recorded" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
