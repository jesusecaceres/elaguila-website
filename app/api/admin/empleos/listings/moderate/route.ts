import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import type { EmpleosListingLifecycleDb } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { updateEmpleosListingLifecycleAdmin } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (req.cookies.get("leonix_admin")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const id = String(b.id ?? "").trim();
  const lifecycle_status = String(b.lifecycle_status ?? "").trim() as EmpleosListingLifecycleDb;
  if (!id || !lifecycle_status) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const res = await updateEmpleosListingLifecycleAdmin({
    id,
    lifecycle_status,
    moderation_reason: typeof b.moderation_reason === "string" ? b.moderation_reason : null,
    review_notes: typeof b.review_notes === "string" ? b.review_notes : null,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: 500 });
  }
  revalidatePath("/clasificados/empleos/resultados");
  revalidatePath("/clasificados/empleos");
  return NextResponse.json({ ok: true });
}
