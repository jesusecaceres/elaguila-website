import { NextResponse, type NextRequest } from "next/server";

import {
  claimOfertaLocalCleanupTasks,
  describeOfertaLocalCleanupExecutionMode,
  releaseExpiredOfertaLocalCleanupLeases,
} from "@/app/lib/ofertas-locales/ofertasLocalesCleanupExecution";
import { resolveOfertasLocalesOwnerOrAdminAuth } from "@/app/lib/ofertas-locales/ofertasLocalesReviewAuth";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth?.isAdmin) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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
  const supabase = getAdminSupabase();
  if (action === "release_expired_leases") {
    const released = await releaseExpiredOfertaLocalCleanupLeases({ supabase });
    if (!released.ok) return NextResponse.json({ ok: false, error: released.error }, { status: 500 });
    return NextResponse.json({
      ok: true,
      ...describeOfertaLocalCleanupExecutionMode(),
      completed: false,
    });
  }

  if (action !== "claim") return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  const claimed = await claimOfertaLocalCleanupTasks({
    supabase,
    batchSize: Number(body.batchSize ?? 10),
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
