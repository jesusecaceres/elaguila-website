import { NextResponse, type NextRequest } from "next/server";

import {
  claimOfertaLocalCleanupTasks,
  describeOfertaLocalCleanupExecutionMode,
  releaseExpiredOfertaLocalCleanupLeases,
} from "@/app/lib/ofertas-locales/ofertasLocalesCleanupExecution";
import { authenticateOfertaLocalAdminOrWorker } from "@/app/lib/ofertas-locales/ofertasLocalesAdminWorkerAuth";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
const MAX_CLEANUP_BATCH = 25;

export async function POST(req: NextRequest) {
  const auth = await authenticateOfertaLocalAdminOrWorker(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.code },
      { status: auth.status }
    );
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const action = String(body.action ?? "claim").trim();
  const dryRun = body.dryRun === true;
  const supabase = getAdminSupabase();
  if (action === "release_expired_leases") {
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        action,
        mutated: false,
        externalCalls: false,
        ...describeOfertaLocalCleanupExecutionMode(),
      });
    }
    const released = await releaseExpiredOfertaLocalCleanupLeases({ supabase });
    if (!released.ok) return NextResponse.json({ ok: false, error: released.error }, { status: 500 });
    return NextResponse.json({
      ok: true,
      ...describeOfertaLocalCleanupExecutionMode(),
      completed: false,
    });
  }

  if (action !== "claim") return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  const requestedBatch = Number(body.batchSize ?? 10);
  if (!Number.isFinite(requestedBatch) || requestedBatch < 1 || requestedBatch > MAX_CLEANUP_BATCH) {
    return NextResponse.json({ ok: false, error: "invalid_batch_size" }, { status: 422 });
  }
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      action,
      requestedBatch: Math.floor(requestedBatch),
      mutated: false,
      externalCalls: false,
      ...describeOfertaLocalCleanupExecutionMode(),
    });
  }
  const claimed = await claimOfertaLocalCleanupTasks({
    supabase,
    batchSize: Math.floor(requestedBatch),
  });
  if (!claimed.ok) return NextResponse.json({ ok: false, error: claimed.error }, { status: 500 });
  return NextResponse.json({
    ok: true,
    leaseId: claimed.leaseId,
    claimed: claimed.claimed,
    ...describeOfertaLocalCleanupExecutionMode(),
    completed: false,
  });
}
