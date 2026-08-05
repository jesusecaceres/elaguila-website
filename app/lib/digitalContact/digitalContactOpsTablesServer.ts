import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type DigitalContactLeadInsert = {
  profileSlug: string;
  senderName: string;
  senderEmail: string;
  businessName?: string | null;
  senderPhone?: string | null;
  message?: string | null;
  howMet?: string | null;
  consent: boolean;
};

/**
 * Digital Contact leads — fully isolated from servicios/listing lead + analytics tables.
 * Architecture is CRM-ready: stable columns today, straightforward to sync into a future
 * CRM export/webhook without a schema rewrite.
 */
export async function insertDigitalContactLead(
  args: DigitalContactLeadInsert,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("digital_contact_leads")
      .insert({
        profile_slug: args.profileSlug,
        sender_name: args.senderName.slice(0, 200),
        sender_email: args.senderEmail.slice(0, 320),
        business_name: args.businessName?.slice(0, 200) || null,
        sender_phone: args.senderPhone?.slice(0, 48) || null,
        message: args.message?.slice(0, 4000) || null,
        how_met: args.howMet || null,
        consent: args.consent,
      })
      .select("id")
      .single();
    if (error || !data?.id) return { ok: false, error: error?.message ?? "insert_failed" };
    return { ok: true, id: String(data.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "insert_failed" };
  }
}

export async function insertDigitalContactAnalyticsEvent(args: {
  profileSlug: string;
  eventType: string;
  meta?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("digital_contact_analytics_events").insert({
      profile_slug: args.profileSlug,
      event_type: args.eventType,
      meta: args.meta ?? {},
    });
    return !error;
  } catch {
    return false;
  }
}
