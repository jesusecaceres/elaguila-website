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
 * grace-expired subscription and reaps stale event-ledger claims.
 *
 * Gate 17 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18) — this endpoint was
 * never actually scheduled: no vercel.json existed anywhere in the project (every "cron-like"
 * endpoint in this codebase, this one included, relied on an undocumented external pinger/CI
 * calling it with a custom machine secret). Added the smallest safe, natively-supported wiring —
 * a GET handler Vercel Cron can invoke directly, authorized the standard Vercel way (an
 * `Authorization: Bearer $CRON_SECRET` header Vercel automatically attaches to every cron
 * invocation when the `CRON_SECRET` env var is set) — alongside the existing POST path, which is
 * completely unchanged for any existing external pinger/CI still using the machine-secret header.
 * Same underlying sweep call either way; no Stripe retry logic touched; no new-row inserts (the
 * sweep only ever transitions the SAME subscription row through renew -> grace -> suspension ->
 * restoration -> cancellation, unchanged from before this gate).
 *
 * Authorization for POST (either):
 *   1. A fully-verified super_admin staff session (requireRevenueProtectedWriteAccess() — Final
 *      Pre-QA Security Hardening Gate, 2026-09-10: fails closed independent of
 *      ADMIN_ENFORCE_ROSTER_PERMISSIONS, explicitly denies the shared bootstrap session, and
 *      never treats can_view_payments — a READ-only permission — as write authority), OR
 *   2. `x-leonix-sweep-key` header matching the LEONIX_SUBSCRIPTION_SWEEP_KEY env value
 *      (constant-time compare; env NAME only — the value is never logged or echoed) — the
 *      machine-key path is unaffected by this gate.
 * Authorization for GET: `Authorization: Bearer <CRON_SECRET>` only (Vercel Cron's own
 * documented convention) — never the staff-session path, since Vercel Cron cannot present one.
 * Unauthenticated requests are rejected 401. Idempotent; dryRun supported (POST body only — Vercel
 * Cron's GET carries no body, so a scheduled run is always a real, non-dry sweep).
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

function vercelCronAuthorized(request: NextRequest): boolean {
  const configured = process.env.CRON_SECRET?.trim();
  if (!configured) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!provided || provided.length !== configured.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(configured, "utf8"));
  } catch {
    return false;
  }
}

async function runSweep(opts: { dryRun: boolean; limit?: number }) {
  const sweep = await sweepDueSubscriptionTransitions({ dryRun: opts.dryRun, limit: opts.limit });
  const reapedEvents = opts.dryRun ? 0 : await reapStaleProcessingEvents();
  return NextResponse.json({ ok: true, ...sweep, reapedStaleEvents: reapedEvents });
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

  return runSweep({ dryRun: body.dryRun === true, limit: body.limit });
}

/** Vercel Cron's actual invocation mechanism: a GET request, `CRON_SECRET`-authorized only. */
export async function GET(request: NextRequest) {
  if (!vercelCronAuthorized(request)) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }
  return runSweep({ dryRun: false });
}
