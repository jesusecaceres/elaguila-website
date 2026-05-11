"use server";

import { revalidatePath } from "next/cache";

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

/** Staff edit: only columns that exist on `public.listings` (no invented fields). */
export async function updateListingCoreFieldsStaffAdminAction(formData: FormData) {
  await requireLeonixAdminPermission("can_manage_ads");
  const listingId = String(formData.get("listing_id") ?? "").trim();
  if (!listingId) throw new Error("missing_listing_id");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const isFree = formData.get("is_free") === "on";
  const isPublished = formData.get("is_published") === "on";
  const detailPairsRaw = String(formData.get("detail_pairs_json") ?? "").trim();

  const patch: Record<string, unknown> = {
    title: title.slice(0, 500) || "(sin título)",
    description,
    city: city.slice(0, 200),
    category: category.slice(0, 120),
    status: status.slice(0, 64) || "active",
    is_free: isFree,
    is_published: isPublished,
  };

  if (detailPairsRaw !== "") {
    try {
      patch.detail_pairs = JSON.parse(detailPairsRaw) as unknown;
    } catch {
      throw new Error("invalid_detail_pairs_json");
    }
  }

  if (priceRaw === "" || priceRaw === "—") {
    patch.price = null;
  } else {
    const n = Number(priceRaw);
    patch.price = Number.isFinite(n) ? n : null;
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase.from("listings").update(patch).eq("id", listingId);
  if (error) throw new Error(error.message);

  auditAdminWrite("listing_staff_core_fields_updated", "listings", listingId, {
    keys: Object.keys(patch),
  });

  revalidatePath("/admin/workspace/clasificados");
  revalidatePath(`/admin/workspace/clasificados/listings/${listingId}/edit`);
  revalidatePath(`/clasificados/anuncio/${listingId}`);
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
