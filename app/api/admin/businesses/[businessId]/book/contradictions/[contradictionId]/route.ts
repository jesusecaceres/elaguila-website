import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { resolveContradiction } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

/** PATCH — resolve a contradiction. Never silent: an explanation is required (also DB-enforced). */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; contradictionId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("resolve_contradictions");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }
  const { businessId, contradictionId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const resolution = typeof (body as { resolution?: unknown }).resolution === "string" ? ((body as { resolution: string }).resolution as string) : "";
  if (!resolution.trim()) return NextResponse.json({ ok: false, error: "empty_resolution" }, { status: 400 });
  const resolvedCanonicalFactId = typeof (body as { resolvedCanonicalFactId?: unknown }).resolvedCanonicalFactId === "string" ? ((body as { resolvedCanonicalFactId: string }).resolvedCanonicalFactId as string) : null;

  const success = await resolveContradiction(businessId, contradictionId, resolution, resolvedCanonicalFactId, access.actor);
  if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
