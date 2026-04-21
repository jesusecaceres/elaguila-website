import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { updateEmpleosListingLifecycleOwner } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import type { EmpleosListingLifecycleDb } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBearerUserId } from "../../../_lib/bearerUser";

export const runtime = "nodejs";

const OWNER_ALLOWED: EmpleosListingLifecycleDb[] = ["published", "paused", "archived", "draft"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ listingId: string }> }): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const ownerUserId = await getBearerUserId(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { listingId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const lifecycle_status = String((body as Record<string, unknown>).lifecycle_status ?? "").trim() as EmpleosListingLifecycleDb;
  if (!OWNER_ALLOWED.includes(lifecycle_status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const res = await updateEmpleosListingLifecycleOwner({ id: listingId, ownerUserId, lifecycle_status });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: res.error === "forbidden" ? 403 : 500 });
  }
  revalidatePath("/clasificados/empleos/resultados");
  revalidatePath("/clasificados/empleos");
  return NextResponse.json({ ok: true });
}
