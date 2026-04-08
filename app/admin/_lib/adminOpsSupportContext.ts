/**
 * Support-safe aggregates when exactly one profile matches ops search (no impersonation).
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

export type AdminSupportContext = {
  profileId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  listingsTotal: number;
  listingsPendingOrFlagged: number;
  reportsAsReporter: number;
  tiendaOrdersMatchingEmail: number;
};

export async function fetchAdminSupportContextForProfile(profileId: string): Promise<AdminSupportContext | null> {
  const supabase = getAdminSupabase();
  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("id,display_name,email,phone")
    .eq("id", profileId)
    .maybeSingle();
  if (pErr || !prof) return null;

  const emailRaw = typeof prof.email === "string" ? prof.email.trim() : "";

  const [{ count: listingsTotal }, { count: listingsPF }, { count: reportsRep }, tiendaRes] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", profileId),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", profileId)
      .in("status", ["pending", "flagged"]),
    supabase.from("listing_reports").select("id", { count: "exact", head: true }).eq("reporter_id", profileId),
    emailRaw
      ? supabase.from("tienda_orders").select("id", { count: "exact", head: true }).ilike("customer_email", emailRaw)
      : Promise.resolve({ count: 0 }),
  ]);
  const tiendaCount = typeof tiendaRes.count === "number" ? tiendaRes.count : 0;

  return {
    profileId,
    displayName: String(prof.display_name ?? "").trim() || "(sin nombre)",
    email: typeof prof.email === "string" ? prof.email : null,
    phone: typeof prof.phone === "string" ? prof.phone : null,
    listingsTotal: typeof listingsTotal === "number" ? listingsTotal : 0,
    listingsPendingOrFlagged: typeof listingsPF === "number" ? listingsPF : 0,
    reportsAsReporter: typeof reportsRep === "number" ? reportsRep : 0,
    tiendaOrdersMatchingEmail: tiendaCount,
  };
}
