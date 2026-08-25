import { NextRequest, NextResponse } from "next/server";

import type { ViajesStagedLifecycleStatus } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { revalidateViajesStagedPublicSurfaces } from "@/app/(site)/clasificados/viajes/lib/viajesRevalidatePublicSurfaces";
import {
  approveViajesCommunityBenefit,
  fetchViajesStagedRowById,
  updateViajesStagedListingModeration,
} from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

type ModerateAction =
  | "approve"
  | "reject"
  | "request_edits"
  | "expire"
  | "unpublish"
  | "in_review"
  /** Package 3 — promote a CLAIMED community benefit to APPROVED (the only path to approved). */
  | "approve_benefit";

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

  const before = await fetchViajesStagedRowById(id);
  const slug = before?.slug;

  // Package 3 — community-benefit truth: this admin action is the ONLY path to "approved".
  // The status is never accepted from the request body; the helper's write is narrowed to
  // rows currently "claimed" and reports benefit_column_missing until the authored migration
  // is applied. Lifecycle/publication state is deliberately untouched by this action.
  if (action === "approve_benefit") {
    const res = await approveViajesCommunityBenefit(id);
    if (!res.ok) {
      const status = res.error === "benefit_column_missing" ? 409 : res.error === "not_claimed_or_missing" ? 400 : 500;
      return NextResponse.json({ ok: false, error: res.error ?? "update_failed" }, { status });
    }
    revalidateViajesStagedPublicSurfaces(slug);
    return NextResponse.json({ ok: true });
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
  revalidateViajesStagedPublicSurfaces(slug);
  return NextResponse.json({ ok: true });
}
