import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import { NextRequest, NextResponse } from "next/server";

import type { ViajesStagedLifecycleStatus } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { revalidateViajesStagedPublicSurfaces } from "@/app/(site)/clasificados/viajes/lib/viajesRevalidatePublicSurfaces";
import { fetchViajesStagedRowById, updateViajesStagedListingModeration } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

type ModerateAction = "approve" | "reject" | "request_edits" | "expire" | "unpublish" | "in_review";

const MODERATE_ACTIONS: ReadonlySet<string> = new Set(["approve", "reject", "request_edits", "expire", "unpublish", "in_review"]);

/**
 * Note fields: a non-empty string SETS the note; an absent key / null / blank string PRESERVES the stored value
 * (returns `undefined` so the DB helper leaves the column alone). The previous code passed `null` whenever the
 * caller omitted the field, which silently wiped existing review notes / moderation reasons on every action.
 */
function noteField(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, 2000) : undefined;
}

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
  if (!(await isVerifiedAdminSession(req.cookies))) {
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
  const actionRaw = String(b.action ?? "").trim();
  if (!id || !actionRaw) {
    return NextResponse.json({ ok: false, error: "missing_id_or_action" }, { status: 400 });
  }
  // Strict allow-list: an unknown action used to fall through to `submitted` and silently rewrite the row.
  if (!MODERATE_ACTIONS.has(actionRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_action", message: "Unknown moderation action." }, { status: 400 });
  }
  const action = actionRaw as ModerateAction;

  const before = await fetchViajesStagedRowById(id);
  if (!before) {
    return NextResponse.json({ ok: false, error: "not_found", message: "Listing not found." }, { status: 404 });
  }
  const slug = before.slug;

  const { lifecycle_status, is_public } = mapAction(action);
  const review_notes = noteField(b.review_notes);
  const moderation_reason = noteField(b.moderation_reason);

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

  // Every applied moderation writes an admin audit row (previously this route wrote none).
  const audit = await appendAdminAuditLog({
    action: `viajes_staged_admin_${action}`,
    targetType: "viajes_staged_listing",
    targetId: id,
    meta: {
      slug: slug ?? null,
      leonix_ad_id: before.leonix_ad_id ?? null,
      from_lifecycle_status: before.lifecycle_status,
      from_is_public: before.is_public,
      to_lifecycle_status: lifecycle_status,
      to_is_public: lifecycle_status === "unpublished" || lifecycle_status === "rejected" || lifecycle_status === "expired" ? false : is_public,
      review_notes_updated: review_notes !== undefined,
      moderation_reason_updated: moderation_reason !== undefined,
      review_notes: review_notes !== undefined ? review_notes.slice(0, 500) : null,
      moderation_reason: moderation_reason !== undefined ? moderation_reason.slice(0, 500) : null,
    },
  });

  revalidateViajesStagedPublicSurfaces(slug);
  return NextResponse.json({ ok: true, id, audit_logged: audit.ok });
}
