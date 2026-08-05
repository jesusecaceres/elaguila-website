import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import {
  sweepDueSubscriptionTransitions,
} from "@/app/lib/listingPlans/subscriptionLifecycle";
import { reapStaleProcessingEvents } from "@/app/lib/listingPlans/stripeEventLedger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Package C Build 1 (C3, decision 6d) — secured subscription sweep.
 *
 * Grace enforcement never depends on dashboard visits: webhook deliveries and write-time
 * guards are the primary cranks; this endpoint is the operational backstop that suspends any
 * grace-expired subscription and reaps stale event-ledger claims. No cron exists in this
 * build (vercel.json is locked until Package F) — an external pinger/CI may call this with
 * the signed machine secret to get cron-like behavior.
 *
 * Authorization (either):
 *   1. An authenticated Leonix admin session (existing admin gate), OR
 *   2. `x-leonix-sweep-key` header matching the LEONIX_SUBSCRIPTION_SWEEP_KEY env value
 *      (constant-time compare; env NAME only — the value is never logged or echoed).
 * Unauthenticated requests are rejected 401. Idempotent; dryRun supported.
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

  let body: { dryRun?: boolean; limit?: number } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean; limit?: number };
  } catch {
    /* empty body allowed */
  }

  const sweep = await sweepDueSubscriptionTransitions({
    dryRun: body.dryRun === true,
    limit: body.limit,
  });
  const reapedEvents = body.dryRun === true ? 0 : await reapStaleProcessingEvents();

  return NextResponse.json({ ok: true, ...sweep, reapedStaleEvents: reapedEvents });
}
