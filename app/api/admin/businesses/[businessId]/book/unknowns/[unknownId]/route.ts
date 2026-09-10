import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { resolveUnknown } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

/** PATCH — resolve an unknown with a preserved resolution trail. */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; unknownId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_unknowns");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }
  const { businessId, unknownId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const resolution = typeof (body as { resolution?: unknown }).resolution === "string" ? ((body as { resolution: string }).resolution as string) : "";
  if (!resolution.trim()) return NextResponse.json({ ok: false, error: "empty_resolution" }, { status: 400 });
  const relatedFactId = typeof (body as { relatedFactId?: unknown }).relatedFactId === "string" ? ((body as { relatedFactId: string }).relatedFactId as string) : null;

  const success = await resolveUnknown(businessId, unknownId, resolution, relatedFactId, access.actor);
  if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
