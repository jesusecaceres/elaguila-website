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
 *
 * Globalization Build D-F3 — no client code calls this route anymore; `trackAutosListingEvent`
 * (its only caller) now writes solely to the canonical shared `/api/analytics/events` pipeline.
 * Left in place, dormant, for backward compatibility rather than removed.
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
