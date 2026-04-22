import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type ServiciosReviewRow = {
  id: string;
  listing_slug: string;
  rating: number;
  author_name: string;
  body: string;
  status: string;
  created_at: string;
};

export type ServiciosLeadRow = {
  id: string;
  listing_slug: string;
  provider_user_id: string | null;
  sender_name: string;
  sender_email: string;
  message: string;
  request_kind: string;
  created_at: string;
  read_at: string | null;
};

export async function insertServiciosAnalyticsEvent(args: {
  /** Nullable after migration — global/category events (search, filter, validation failures). */
  listingSlug?: string | null;
  eventType: string;
  meta?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("servicios_analytics_events").insert({
      listing_slug: args.listingSlug ?? null,
      event_type: args.eventType,
      meta: args.meta ?? {},
    });
    return !error;
  } catch {
    return false;
  }
}

export async function insertServiciosPublicLead(args: {
  listingSlug: string;
  providerUserId: string | null;
  senderName: string;
  senderEmail: string;
  message: string;
  requestKind: "quote" | "general";
  honeypot?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_leads")
      .insert({
        listing_slug: args.listingSlug,
        provider_user_id: args.providerUserId,
        sender_name: args.senderName.slice(0, 200),
        sender_email: args.senderEmail.slice(0, 320),
        message: args.message.slice(0, 4000),
        request_kind: args.requestKind,
        honeypot: args.honeypot ?? null,
      })
      .select("id")
      .single();
    if (error || !data?.id) return { ok: false, error: error?.message ?? "insert_failed" };
    return { ok: true, id: String(data.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "insert_failed" };
  }
}

export async function listServiciosLeadsForProvider(providerUserId: string, limit = 100): Promise<ServiciosLeadRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_leads")
      .select("id, listing_slug, provider_user_id, sender_name, sender_email, message, request_kind, created_at, read_at")
      .eq("provider_user_id", providerUserId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ServiciosLeadRow[];
  } catch {
    return [];
  }
}

export async function listPendingServiciosReviews(limit = 80): Promise<ServiciosReviewRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_listing_reviews")
      .select("id, listing_slug, rating, author_name, body, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ServiciosReviewRow[];
  } catch {
    return [];
  }
}

export async function listApprovedServiciosReviewsForSlug(slug: string, limit = 50): Promise<ServiciosReviewRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_listing_reviews")
      .select("id, listing_slug, rating, author_name, body, status, created_at")
      .eq("listing_slug", slug)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ServiciosReviewRow[];
  } catch {
    return [];
  }
}

export async function insertServiciosReviewPending(args: {
  listingSlug: string;
  rating: number;
  authorName: string;
  body: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_listing_reviews")
      .insert({
        listing_slug: args.listingSlug,
        rating: args.rating,
        author_name: args.authorName.slice(0, 120),
        body: args.body.slice(0, 2000),
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !data?.id) return { ok: false, error: error?.message ?? "insert_failed" };
    return { ok: true, id: String(data.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "insert_failed" };
  }
}

export type ServiciosReviewAggregate = { avg: number; count: number };

export async function getServiciosReviewAggregatesForSlugs(slugs: string[]): Promise<Map<string, ServiciosReviewAggregate>> {
  const out = new Map<string, ServiciosReviewAggregate>();
  if (!isSupabaseAdminConfigured() || slugs.length === 0) return out;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_listing_reviews")
      .select("listing_slug, rating")
      .eq("status", "approved")
      .in("listing_slug", slugs);
    if (error || !data) return out;
    const bySlug = new Map<string, number[]>();
    for (const row of data as { listing_slug: string; rating: number }[]) {
      const k = row.listing_slug;
      if (!bySlug.has(k)) bySlug.set(k, []);
      bySlug.get(k)!.push(row.rating);
    }
    for (const [slug, ratings] of bySlug) {
      const sum = ratings.reduce((a, b) => a + b, 0);
      out.set(slug, { avg: sum / ratings.length, count: ratings.length });
    }
    return out;
  } catch {
    return out;
  }
}
