/**
 * Ofertas Locales admin approve / reject / archive mutations (FINAL-2).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  appendOfertaLocalAdminReviewNote,
  OFERTAS_LOCALES_LIVE_STATUS,
  OFERTAS_LOCALES_QUEUE_STATUSES,
  type OfertaLocalAdminRow,
} from "./ofertasLocalesAdminHelpers";
import { OFERTAS_LOCALES_ADMIN_SELECT } from "./ofertasLocalesDbSchema";
import type { OfertaLocalPublishStatus } from "./ofertasLocalesTypes";

export type OfertaLocalAdminReviewAction = "approve" | "reject" | "archive";

export type OfertaLocalAdminReviewResult =
  | { ok: true; id: string; previousStatus: OfertaLocalPublishStatus; newStatus: OfertaLocalPublishStatus }
  | { ok: false; error: string };

const APPROVE_FROM: ReadonlySet<OfertaLocalPublishStatus> = new Set([
  "pending_review",
  "submitted",
  "draft",
]);

const REJECT_FROM: ReadonlySet<OfertaLocalPublishStatus> = new Set([
  "pending_review",
  "submitted",
  "draft",
]);

const ARCHIVE_FROM: ReadonlySet<OfertaLocalPublishStatus> = new Set([
  "approved",
  "pending_review",
  "submitted",
  "draft",
  "rejected",
]);

function targetStatusForAction(action: OfertaLocalAdminReviewAction): OfertaLocalPublishStatus {
  switch (action) {
    case "approve":
      return OFERTAS_LOCALES_LIVE_STATUS;
    case "reject":
      return "rejected";
    case "archive":
      return "archived";
    default:
      return "archived";
  }
}

function isTransitionAllowed(
  action: OfertaLocalAdminReviewAction,
  current: OfertaLocalPublishStatus
): boolean {
  switch (action) {
    case "approve":
      return APPROVE_FROM.has(current);
    case "reject":
      return REJECT_FROM.has(current);
    case "archive":
      return ARCHIVE_FROM.has(current);
    default:
      return false;
  }
}

/** Activate approved child items when parent offer is approved; deactivate on reject/archive. */
export async function syncOfertaLocalItemsActivationAfterAdminReview(
  sb: SupabaseClient,
  offerId: string,
  action: OfertaLocalAdminReviewAction,
  now: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (action === "approve") {
    const { error } = await sb
      .from("oferta_local_items")
      .update({ is_active: true, updated_at: now })
      .eq("oferta_local_id", offerId)
      .eq("review_status", "approved");

    if (error) return { ok: false, error: "item_activation_failed" };
    return { ok: true };
  }

  if (action === "reject" || action === "archive") {
    const { error } = await sb
      .from("oferta_local_items")
      .update({ is_active: false, updated_at: now })
      .eq("oferta_local_id", offerId);

    if (error) return { ok: false, error: "item_deactivation_failed" };
    return { ok: true };
  }

  return { ok: true };
}

export async function mutateOfertaLocalAdminReview(
  sb: SupabaseClient,
  id: string,
  action: OfertaLocalAdminReviewAction,
  adminNote?: string | null
): Promise<OfertaLocalAdminReviewResult> {
  const offerId = id.trim();
  if (!offerId) return { ok: false, error: "missing_id" };

  const { data: row, error: fetchError } = await sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_ADMIN_SELECT)
    .eq("id", offerId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: "fetch_failed" };
  if (!row) return { ok: false, error: "not_found" };

  const current = (row as OfertaLocalAdminRow).status;
  if (!isTransitionAllowed(action, current)) {
    return { ok: false, error: "invalid_transition" };
  }

  const newStatus = targetStatusForAction(action);
  const internal_notes = appendOfertaLocalAdminReviewNote(
    (row as OfertaLocalAdminRow).internal_notes,
    action,
    adminNote
  );

  const now = new Date().toISOString();
  const parentUpdate: Record<string, unknown> = {
    status: newStatus,
    internal_notes,
    updated_at: now,
  };

  if (action === "approve") {
    parentUpdate.published_at = now;
  }

  const { error: updateError } = await sb
    .from("ofertas_locales")
    .update(parentUpdate)
    .eq("id", offerId);

  if (updateError) return { ok: false, error: "update_failed" };

  const itemSync = await syncOfertaLocalItemsActivationAfterAdminReview(sb, offerId, action, now);
  if (!itemSync.ok) {
    await sb
      .from("ofertas_locales")
      .update({
        status: current,
        updated_at: now,
      })
      .eq("id", offerId);

    return { ok: false, error: itemSync.error };
  }

  return { ok: true, id: offerId, previousStatus: current, newStatus };
}

/** Documented reviewable queue statuses for audits. */
export const OFERTAS_LOCALES_REVIEWABLE_STATUSES = OFERTAS_LOCALES_QUEUE_STATUSES;
