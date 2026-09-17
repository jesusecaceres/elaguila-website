/**
 * LEO-16 scheduled watch cron endpoint.
 * POST only. Requires LEO_CRON_SECRET — never accepts owner id from client.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isLeoCronAuthorized } from "@/app/leo/_lib/leoNotificationPolicy";
import { runLeoScheduledWatches } from "@/app/leo/_lib/leoWatchService";
import { logLeoObservabilityEvent } from "@/app/leo/_lib/leoObservability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed", message: "POST only." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const key =
    request.headers.get("x-leo-cron-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (!isLeoCronAuthorized(key)) {
    logLeoObservabilityEvent({
      route: "leo/watch/run",
      failureClass: "AUTH_DENIED",
      durationMs: Date.now() - startedAt,
    });
    return unauthorized();
  }

  try {
    const summary = await runLeoScheduledWatches({ dispatchPush: true });
    logLeoObservabilityEvent({
      route: "leo/watch/run",
      failureClass: "NONE",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: true, summary }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    logLeoObservabilityEvent({
      route: "leo/watch/run",
      failureClass: "INTERNAL_ERROR",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { ok: false, error: "watch_run_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
