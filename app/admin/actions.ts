"use server";

import { deleteMuxAssetsBestEffort } from "@/app/lib/mux/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";

export type ListingReportStatus = "pending" | "reviewed" | "dismissed";

export async function submitListingReportAction(listingId: string, reason: string, reporterId: string | null) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("listing_reports").insert({
    listing_id: listingId,
    reporter_id: reporterId,
    reason: (reason || "").trim().slice(0, 2000),
    status: "pending",
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateListingReportStatusAction(reportId: string, status: ListingReportStatus) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("listing_reports").update({ status }).eq("id", reportId);
  if (error) throw new Error(error.message);
  auditAdminWrite("listing_report_status_updated", "listing_reports", reportId, { status });
  return { ok: true };
}

/**
 * Hide a listing from public browse (`is_published=false`) without deleting the row.
 * Results use `isEnVentaListingPubliclyVisible`; detail loader treats `is_published=false` as not found for browse.
 */
export async function setListingPublishedAction(listingId: string, published: boolean) {
  await requireLeonixAdminPermission("can_manage_ads");
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("listings").update({ is_published: published }).eq("id", listingId);
  if (error) throw new Error(error.message);
  auditAdminWrite(
    published ? "listing_republished_by_admin" : "listing_unpublished_by_admin",
    "listings",
    listingId,
    { is_published: published }
  );
  return { ok: true };
}

export async function deleteListingAction(listingId: string) {
  await requireLeonixAdminPermission("can_manage_ads");
  const supabase = getAdminSupabase();
  const { data: row } = await supabase
    .from("listings")
    .select("mux_asset_id, mux_asset_id_2")
    .eq("id", listingId)
    .maybeSingle();
  const muxIds = [row?.mux_asset_id, row?.mux_asset_id_2].filter(Boolean) as string[];
  if (muxIds.length) {
    await deleteMuxAssetsBestEffort(muxIds);
  }
  const { error } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", listingId);
  if (error) throw new Error(error.message);
  auditAdminWrite("listing_removed_by_admin", "listings", listingId, {});
  return { ok: true };
}

export async function setUserDisabledAction(userId: string, disabled: boolean) {
  await requireLeonixAdminPermission("can_edit_users");
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ is_disabled: disabled })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  void appendAdminAuditLog({
    action: disabled ? "profile_disabled" : "profile_enabled",
    targetType: "profiles",
    targetId: userId,
    meta: { source: "setUserDisabledAction" },
  });
  return { ok: true };
}
