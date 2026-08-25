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
import { calculateOfertaLocalPublicTermExpiresAt } from "./ofertasLocalesFormatting";
import { getOfertaLocalCommercialProductForOfferType } from "./ofertasLocalesCommercial";
import { validateOfertaLocalPartnerCourtesyEligibility } from "./ofertasLocalesPartnerOperations";
import { markOfertaLocalSourceVersionActive } from "./ofertasLocalesAssetLifecycle";
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

async function assertNoUnresolvedItemsBeforeApproval(
  sb: SupabaseClient,
  offerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { count, error } = await sb
    .from("oferta_local_items")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", offerId)
    .in("review_status", ["pending", "needs_review"]);

  if (error) return { ok: false, error: "item_review_lookup_failed" };
  if ((count ?? 0) > 0) return { ok: false, error: "unresolved_review_items" };
  return { ok: true };
}

async function assertSourceVersionReadyBeforeApproval(
  sb: SupabaseClient,
  offerId: string
): Promise<{ ok: true; sourceId: string } | { ok: false; error: string }> {
  const { data: parent, error: parentError } = await sb
    .from("ofertas_locales")
    .select("public_source_asset_id, active_source_asset_id, asset_lifecycle_status")
    .eq("id", offerId)
    .maybeSingle();
  if (parentError || !parent) return { ok: false, error: "source_parent_lookup_failed" };

  let sourceId = String(parent.public_source_asset_id ?? parent.active_source_asset_id ?? "").trim();
  if (!sourceId) {
    const { data: sourceItem, error: sourceItemError } = await sb
      .from("oferta_local_items")
      .select("source_asset_version_id")
      .eq("oferta_local_id", offerId)
      .eq("review_status", "approved")
      .eq("source_lifecycle_status", "active")
      .not("source_asset_version_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sourceItemError) return { ok: false, error: "source_item_lookup_failed" };
    sourceId = String(sourceItem?.source_asset_version_id ?? "").trim();
  }
  if (!sourceId) return { ok: false, error: "public_source_asset_required" };
  if (parent.asset_lifecycle_status === "replacement_pending") {
    return { ok: false, error: "source_replacement_pending" };
  }

  const { count: blockingPages, error: pagesError } = await sb
    .from("oferta_local_scan_pages")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", offerId)
    .eq("source_asset_version_id", sourceId)
    .in("page_status", ["queued", "processing", "failed"]);
  if (pagesError) return { ok: false, error: "scan_page_lookup_failed" };
  if ((blockingPages ?? 0) > 0) return { ok: false, error: "blocking_scan_pages" };

  const { count: approvedItems, error: itemError } = await sb
    .from("oferta_local_items")
    .select("id", { count: "exact", head: true })
    .eq("oferta_local_id", offerId)
    .eq("source_asset_version_id", sourceId)
    .eq("review_status", "approved")
    .eq("source_lifecycle_status", "active");
  if (itemError) return { ok: false, error: "source_item_lookup_failed" };
  if ((approvedItems ?? 0) < 1) return { ok: false, error: "approved_source_items_required" };
  return { ok: true, sourceId };
}

/** Activate approved child items when parent offer is approved; deactivate on reject/archive. */
export async function syncOfertaLocalItemsActivationAfterAdminReview(
  sb: SupabaseClient,
  offerId: string,
  action: OfertaLocalAdminReviewAction,
  now: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (action === "approve") {
    const { data: parent, error: parentError } = await sb
      .from("ofertas_locales")
      .select("public_source_asset_id, active_source_asset_id")
      .eq("id", offerId)
      .maybeSingle();
    if (parentError || !parent) return { ok: false, error: "source_parent_lookup_failed" };
    const sourceId = String(parent.public_source_asset_id ?? parent.active_source_asset_id ?? "").trim();
    if (!sourceId) return { ok: false, error: "public_source_asset_required" };

    const { error } = await sb
      .from("oferta_local_items")
      .update({ is_active: true, updated_at: now })
      .eq("oferta_local_id", offerId)
      .eq("review_status", "approved")
      .eq("source_asset_version_id", sourceId)
      .eq("source_lifecycle_status", "active");

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

  if (action === "reject" && !String(adminNote ?? "").trim()) {
    return { ok: false, error: "rejection_reason_required" };
  }

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
  let approvalSourceId: string | null = null;
  if (action === "approve") {
    const unresolved = await assertNoUnresolvedItemsBeforeApproval(sb, offerId);
    if (!unresolved.ok) return unresolved;
    const sourceReady = await assertSourceVersionReadyBeforeApproval(sb, offerId);
    if (!sourceReady.ok) return sourceReady;
    approvalSourceId = sourceReady.sourceId;
    const offer = row as OfertaLocalAdminRow;
    if (!/^LNX-[A-Z0-9]{8}$/.test(String(offer.leonix_ad_id ?? ""))) {
      return { ok: false, error: "leonix_ad_id_required" };
    }
    // Owner lock 2026-08-25 (Package 4) — a free-lane offer (basic community coupons) never
    // needs a paid entitlement or partner courtesy to be approved.
    const isFreeProductLane = getOfertaLocalCommercialProductForOfferType(offer.offer_type)?.amountCents === 0;
    if (!isFreeProductLane) {
      const hasPaidEntitlement =
        offer.payment_status === "paid" &&
        offer.entitlement_status === "active" &&
        Boolean(offer.package_entitlement_id) &&
        Boolean(offer.payment_record_id);
      if (!hasPaidEntitlement) {
        const courtesy = await validateOfertaLocalPartnerCourtesyEligibility({
          supabase: sb,
          parent: {
            id: offer.id,
            owner_id: offer.owner_id,
            offer_type: offer.offer_type,
            leonix_ad_id: offer.leonix_ad_id,
          },
          ownerId: offer.owner_id,
        });
        if (!courtesy.ok) {
          return { ok: false, error: "commercial_entitlement_required" };
        }
      }
    }
  }

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
    if (approvalSourceId) {
      await sb
        .from("ofertas_local_source_assets")
        .update({ review_state: "approved", updated_at: now })
        .eq("id", approvalSourceId)
        .eq("oferta_local_id", offerId);
      const activated = await markOfertaLocalSourceVersionActive({
        supabase: sb,
        ofertaLocalId: offerId,
        sourceAssetId: approvalSourceId,
        nowIso: now,
      });
      if (!activated.ok) return { ok: false, error: activated.error };
    }
    parentUpdate.published_at = now;
    parentUpdate.expires_at = calculateOfertaLocalPublicTermExpiresAt(now);
  }

  const { data: updatedRow, error: updateError } = await sb
    .from("ofertas_locales")
    .update(parentUpdate)
    .eq("id", offerId)
    .eq("status", current)
    .select("id")
    .maybeSingle();

  if (updateError) return { ok: false, error: "update_failed" };
  if (!updatedRow) return { ok: false, error: "invalid_transition" };

  const itemSync = await syncOfertaLocalItemsActivationAfterAdminReview(sb, offerId, action, now);
  if (!itemSync.ok) {
    await sb
      .from("ofertas_locales")
      .update({
        status: current,
        published_at: (row as OfertaLocalAdminRow).published_at ?? null,
        expires_at: (row as OfertaLocalAdminRow).expires_at ?? null,
        updated_at: now,
      })
      .eq("id", offerId);

    return { ok: false, error: itemSync.error };
  }

  return { ok: true, id: offerId, previousStatus: current, newStatus };
}

/** Documented reviewable queue statuses for audits. */
export const OFERTAS_LOCALES_REVIEWABLE_STATUSES = OFERTAS_LOCALES_QUEUE_STATUSES;
