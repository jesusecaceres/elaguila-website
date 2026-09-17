import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireRevenueProtectedWriteAccess } from "@/app/admin/_lib/adminAccessControl";
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
 *   1. A fully-verified super_admin staff session (requireRevenueProtectedWriteAccess() — Final
 *      Pre-QA Security Hardening Gate, 2026-09-10: fails closed independent of
 *      ADMIN_ENFORCE_ROSTER_PERMISSIONS, explicitly denies the shared bootstrap session, and
 *      never treats can_view_payments — a READ-only permission — as write authority), OR
 *   2. `x-leonix-sweep-key` header matching the LEONIX_SUBSCRIPTION_SWEEP_KEY env value
 *      (constant-time compare; env NAME only — the value is never logged or echoed) — the
 *      machine-key path is unaffected by this gate.
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
    const access = await requireRevenueProtectedWriteAccess();
    authorized = access.ok;
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
