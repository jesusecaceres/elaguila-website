"use server";

import { getAdminSupabase } from "@/app/lib/supabase/server";

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
