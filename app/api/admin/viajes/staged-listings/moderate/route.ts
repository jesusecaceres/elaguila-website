import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import type { ViajesStagedLifecycleStatus } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { updateViajesStagedListingModeration } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

type ModerateAction = "approve" | "reject" | "request_edits" | "expire" | "unpublish" | "in_review";

function mapAction(a: ModerateAction): { lifecycle_status: ViajesStagedLifecycleStatus; is_public: boolean } {
  switch (a) {
    case "approve":
      return { lifecycle_status: "approved", is_public: true };
    case "reject":
      return { lifecycle_status: "rejected", is_public: false };
    case "request_edits":
      return { lifecycle_status: "changes_requested", is_public: false };
    case "expire":
      return { lifecycle_status: "expired", is_public: false };
    case "unpublish":
      return { lifecycle_status: "unpublished", is_public: false };
    case "in_review":
      return { lifecycle_status: "in_review", is_public: false };
    default:
      return { lifecycle_status: "submitted", is_public: false };
  }
}

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
  const action = String(b.action ?? "").trim() as ModerateAction;
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: "missing_id_or_action" }, { status: 400 });
  }

  const { lifecycle_status, is_public } = mapAction(action);
  const review_notes = typeof b.review_notes === "string" ? b.review_notes.trim() || null : null;
  const moderation_reason = typeof b.moderation_reason === "string" ? b.moderation_reason.trim() || null : null;

  const res = await updateViajesStagedListingModeration({
    id,
    lifecycle_status,
    is_public,
    review_notes,
    moderation_reason,
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status: 500 });
  }
  revalidatePath("/clasificados/viajes/resultados");
  revalidatePath("/clasificados/viajes");
  return NextResponse.json({ ok: true });
}
