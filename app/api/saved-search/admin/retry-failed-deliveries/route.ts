import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { retryFailedSavedSearchMatchEvents } from "@/app/lib/saved-search/delivery/savedSearchEmailDelivery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Globalization Build D-S, Gate DS9 — Saved Search failed-delivery retry processor.
 *
 * Mirrors app/api/revenue-os/admin/subscription-sweep/route.ts's exact authorization shape (the
 * established pattern for a backstop endpoint in a repo where no cron/vercel.json exists yet):
 * this is the code/runtime contract for retrying durable `saved_search_match_events` rows stuck
 * at status pending/failed. Actually invoking this periodically in production still needs either
 * an external pinger/CI with the machine secret, or a future vercel.json cron entry — neither of
 * which this repo currently has (same limitation the subscription sweep already documents) —
 * that scheduling piece is BLOCKED_EXTERNAL, not something this endpoint can self-provide.
 *
 * Authorization (either):
 *   1. An authenticated Leonix admin session, OR
 *   2. `x-leonix-sweep-key` header matching LEONIX_SUBSCRIPTION_SWEEP_KEY (same env var/constant-
 *      time compare already used by the subscription sweep — one machine secret, not a new one).
 */
function machineKeyAuthorized(request: NextRequest): boolean {
  const configured = process.env.LEONIX_SUBSCRIPTION_SWEEP_KEY?.trim();
  if (!configured) return false;
  const provided = request.headers.get("x-leonix-sweep-key")?.trim() ?? "";
  if (!provided || provided.length !== configured.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(configured, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let authorized = machineKeyAuthorized(request);
  if (!authorized) {
    try {
      await requireLeonixAdminPermission("can_view_payments");
      authorized = true;
    } catch {
      authorized = false;
    }
  }
  if (!authorized) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }

  let body: { limit?: number } = {};
  try {
    body = (await request.json()) as { limit?: number };
  } catch {
    /* empty body allowed */
  }

  const result = await retryFailedSavedSearchMatchEvents({ limit: body.limit });
  return NextResponse.json({ ok: true, ...result });
}
