import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import type { EmpleosListingLifecycleDb } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { updateEmpleosListingLifecycleAdmin } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<string>(["draft", "pending_review", "published", "paused", "archived", "rejected"]);
const DEFAULT_HOLD_REASON: Record<string, string> = {
  paused: "staff_paused",
  rejected: "staff_rejected",
  pending_review: "staff_review",
};

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
  // This legacy route used to accept ANY client-supplied status string. Only real lifecycle values.
  if (!ALLOWED_STATUSES.has(lifecycle_status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }
  // A staff hold must leave a marker: the owner-side lifecycle policy refuses to self-resume a row that
  // carries a moderation_reason. Lifting a hold (published) clears it.
  const providedReason = typeof b.moderation_reason === "string" && b.moderation_reason.trim() ? b.moderation_reason.trim() : null;
  const moderationReason =
    lifecycle_status === "published" ? null : providedReason ?? DEFAULT_HOLD_REASON[lifecycle_status] ?? null;

  const res = await updateEmpleosListingLifecycleAdmin({
    id,
    lifecycle_status,
    moderation_reason: moderationReason,
    review_notes: typeof b.review_notes === "string" ? b.review_notes : null,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: 500 });
  }
  const supabase = getAdminSupabase();
  const { data: slugRow } = await supabase.from("empleos_public_listings").select("slug").eq("id", id).maybeSingle();
  const slug = (slugRow as { slug?: string } | null)?.slug;
  if (slug) {
    revalidatePath(`/clasificados/empleos/${slug}`);
  }
  revalidatePath("/clasificados/empleos/resultados");
  revalidatePath("/clasificados/empleos");
  return NextResponse.json({ ok: true });
}
