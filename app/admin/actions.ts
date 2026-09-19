"use server";

import { revalidatePath } from "next/cache";

import { deleteMuxAssetsBestEffort } from "@/app/lib/mux/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { isSelfEngagement } from "@/app/lib/analytics/selfEngagementGuard";
import { guardStaffCoreFieldLifecycle } from "@/app/admin/_lib/adminStaffCoreFieldGuard";
import { evaluateAdminListingDeletes, muxAssetsSafeToDelete } from "@/app/admin/_lib/adminListingDeleteServer";

export type ListingReportStatus = "pending" | "reviewed" | "dismissed";

export async function submitListingReportAction(listingId: string, reason: string, reporterId: string | null) {
  const supabase = getAdminSupabase();
  // Wave 3 G26 fix — this write previously accepted a report from anyone, including the
  // listing's own owner, with no ownership check at all. Fails open (allows the report) only
  // when the owner is genuinely unknown, matching isSelfEngagement's existing fail-open contract.
  if (reporterId) {
    const { data: ownerRow } = await supabase.from("listings").select("owner_id").eq("id", listingId).maybeSingle();
    if (isSelfEngagement(reporterId, ownerRow?.owner_id ?? null)) {
      throw new Error("You cannot report your own listing.");
    }
  }
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
  // Work Package I.9A — closes a real, confirmed authorization gap: this staff-only mutation had
  // no permission check at all, unlike its siblings below (`setListingPublishedAction`,
  // `deleteListingAction`), even though `leonixAdminGate.ts`'s own header comment already
  // documented `can_manage_reports -> updateListingReportStatusAction` as the intended gate.
  await requireLeonixAdminPermission("can_manage_reports");
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
  // Closeout 2 - inventory guard: a Bienes Raices Negocio PARENT with public children (or any row whose
  // inventory role cannot be confirmed) cannot be removed; fails closed if the lookup errors.
  const verdict = (await evaluateAdminListingDeletes(supabase, [listingId], "soft")).get(listingId.trim());
  if (verdict && !verdict.ok) throw new Error(`${verdict.code}: ${verdict.message}`);
  // SOFT delete is reversible (status -> removed): it must NEVER destroy video assets. Mux assets are
  // released only by the explicit permanent delete, after its guards, and only when unreferenced.
  const { error } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", listingId);
  if (error) throw new Error(error.message);
  auditAdminWrite("listing_removed_by_admin", "listings", listingId, {});
  return { ok: true };
}

export type BulkListingCleanupResult = {
  deleted: number;
  failed: number;
  errors: string[];
  sampleIds: string[];
};

function normalizeBulkListingIds(listingIds: string[]): string[] {
  return [...new Set(listingIds.map((id) => id.trim()).filter(Boolean))];
}

/** Soft delete selected `public.listings` rows (status → removed). Not permanent; never touches video assets. */
export async function bulkSoftDeleteListingsAction(listingIds: string[]): Promise<BulkListingCleanupResult> {
  await requireLeonixAdminPermission("can_manage_ads");
  const ids = normalizeBulkListingIds(listingIds);
  if (ids.length === 0) throw new Error("no_ids");
  if (ids.length > 500) throw new Error("max_500_per_batch");

  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];
  const sampleIds: string[] = [];

  for (const id of ids) {
    try {
      await deleteListingAction(id);
      deleted += 1;
      if (sampleIds.length < 5) sampleIds.push(id);
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : "unknown_error";
      errors.push(`${id.slice(0, 8)}…: ${msg}`);
    }
  }

  return { deleted, failed, errors: errors.slice(0, 10), sampleIds };
}

/** Hard delete selected rows from `public.listings` only. Requires can_manage_ads. */
export async function permanentlyDeleteListingsAction(listingIds: string[]): Promise<BulkListingCleanupResult> {
  await requireLeonixAdminPermission("can_manage_ads");
  const supabase = getAdminSupabase();
  const ids = normalizeBulkListingIds(listingIds);
  if (ids.length === 0) throw new Error("no_ids");
  if (ids.length > 500) throw new Error("max_500_per_batch");

  const { data: rows, error: fetchErr } = await supabase
    .from("listings")
    .select("id, mux_asset_id, mux_asset_id_2")
    .in("id", ids);
  if (fetchErr) throw new Error(fetchErr.message);

  const found = rows ?? [];
  const foundIds = new Set(found.map((r) => r.id));
  let failed = ids.filter((id) => !foundIds.has(id)).length;
  const errors: string[] = ids
    .filter((id) => !foundIds.has(id))
    .slice(0, 5)
    .map((id) => `${id.slice(0, 8)}…: not_found`);

  // Closeout 2 - guards: inventory role / public children, public-live, paid / subscribed / entitled rows
  // (unless already removed). Refused rows are counted as failed and never deleted; the lookup fails closed.
  const verdicts = await evaluateAdminListingDeletes(supabase, found.map((r) => r.id), "permanent");
  const deletable: typeof found = [];
  for (const row of found) {
    const v = verdicts.get(row.id);
    if (v && v.ok) {
      deletable.push(row);
    } else {
      failed += 1;
      if (errors.length < 10) errors.push(`${row.id.slice(0, 8)}…: ${v && !v.ok ? v.code : "guard_lookup_failed"}`);
    }
  }

  if (deletable.length === 0) {
    return { deleted: 0, failed: ids.length, errors, sampleIds: [] };
  }

  const { error: delErr, count } = await supabase.from("listings").delete({ count: "exact" }).in(
    "id",
    deletable.map((r) => r.id),
  );
  if (delErr) throw new Error(delErr.message);

  const deleted = count ?? deletable.length;
  const sampleIds = deletable.slice(0, 5).map((r) => r.id);
  for (const row of deletable) {
    auditAdminWrite("listing_permanently_deleted_by_admin", "listings", row.id, {});
  }

  // Video assets are released only AFTER the rows are gone, and only when no other listing row still
  // references the same asset (explicit permanent delete is the only path that may destroy them).
  const candidateMux = deletable.flatMap((r) => [r.mux_asset_id, r.mux_asset_id_2].filter(Boolean) as string[]);
  if (candidateMux.length) {
    const safe = await muxAssetsSafeToDelete(supabase, candidateMux, deletable.map((r) => r.id));
    if (safe.length) await deleteMuxAssetsBestEffort(safe);
  }

  return { deleted, failed, errors, sampleIds };
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

  const supabase = getAdminSupabase();
  const { data: currentRow, error: currentErr } = await supabase
    .from("listings")
    .select("category, status, is_published, published_at, expires_at, seller_type, listing_json")
    .eq("id", listingId)
    .maybeSingle();
  if (currentErr || !currentRow) throw new Error("listing_not_found");
  // Staff Edit is not a publication authority: category never moves lanes and status / is_published cannot
  // activate a row that is not already live (Restore / Republish own the payment, term and capacity gates).
  const lifecycle = guardStaffCoreFieldLifecycle(currentRow as Record<string, unknown>, {
    category,
    status: status.slice(0, 64),
    isPublished,
  });

  const patch: Record<string, unknown> = {
    title: title.slice(0, 500) || "(sin título)",
    description,
    city: city.slice(0, 200),
    category: lifecycle.category.slice(0, 120),
    is_free: isFree,
  };
  if (lifecycle.lifecyclePatch) {
    patch.status = lifecycle.lifecyclePatch.status.slice(0, 64) || "active";
    patch.is_published = lifecycle.lifecyclePatch.is_published;
  }

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

  const { error } = await supabase.from("listings").update(patch).eq("id", listingId);
  if (error) throw new Error(error.message);

  auditAdminWrite("listing_staff_core_fields_updated", "listings", listingId, {
    keys: Object.keys(patch),
    ignored: lifecycle.ignored,
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
