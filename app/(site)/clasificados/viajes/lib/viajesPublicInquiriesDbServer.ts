import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export async function insertViajesPublicInquiry(input: {
  stagedListingId: string;
  buyerUserId: string | null;
  buyerName: string;
  buyerEmail: string;
  message: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "not_configured" };
  }
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("viajes_public_inquiries")
    .insert({
      staged_listing_id: input.stagedListingId,
      buyer_user_id: input.buyerUserId,
      buyer_name: input.buyerName.slice(0, 200),
      buyer_email: input.buyerEmail.slice(0, 320),
      message: input.message.slice(0, 4000),
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return { ok: true, id: String(data.id) };
}
