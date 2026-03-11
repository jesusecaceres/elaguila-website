"use server";

import { getAdminSupabase } from "@/app/lib/supabase/server";

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
  return { ok: true };
}

export async function deleteListingAction(listingId: string) {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", listingId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function setUserDisabledAction(userId: string, disabled: boolean) {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ disabled })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
