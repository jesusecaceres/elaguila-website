/**
 * DB-backed draft layer for Clasificados publish flow.
 * Table: public.listing_drafts (id, user_id, category, title, status, draft_data, created_at, updated_at)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type DraftDataPayload = {
  v: 1;
  step: string;
  category: string;
  title: string;
  description: string;
  isFree: boolean;
  price: string;
  city: string;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  /** Images in exact order: { base64, name, type } */
  images: Array<{ base64: string; name: string; type: string }>;
  updatedAt: string;
};

export type ListingDraftRow = {
  id: string;
  user_id: string;
  category: string | null;
  title: string | null;
  status: string;
  draft_data: DraftDataPayload | null;
  created_at: string;
  updated_at: string;
};

const TABLE = "listing_drafts";
const STATUS_DRAFT = "draft";

export async function createDraft(
  supabase: SupabaseClient,
  userId: string,
  category: string,
  initialPayload: DraftDataPayload
): Promise<{ id: string } | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      category: category || null,
      title: (initialPayload.title || "").slice(0, 255) || null,
      status: STATUS_DRAFT,
      draft_data: initialPayload,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[listingDraftsDb] createDraft error:", error.message);
    return null;
  }
  return data ? { id: data.id } : null;
}

export async function updateDraft(
  supabase: SupabaseClient,
  draftId: string,
  userId: string,
  payload: DraftDataPayload
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(TABLE)
    .update({
      title: (payload.title || "").slice(0, 255) || null,
      category: payload.category || null,
      draft_data: payload,
      updated_at: now,
    })
    .eq("id", draftId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[listingDraftsDb] updateDraft error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getDraft(
  supabase: SupabaseClient,
  draftId: string,
  userId: string
): Promise<ListingDraftRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", draftId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as ListingDraftRow;
}

export async function getLatestDraftForCategory(
  supabase: SupabaseClient,
  userId: string,
  category?: string | null
): Promise<ListingDraftRow | null> {
  let q = supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("status", STATUS_DRAFT)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (category != null && category !== "") {
    q = q.eq("category", category);
  }
  const { data, error } = await q.maybeSingle();
  if (error || !data) return null;
  return data as ListingDraftRow;
}

export async function deleteDraftInDb(
  supabase: SupabaseClient,
  draftId: string,
  userId: string
): Promise<void> {
  await supabase.from(TABLE).delete().eq("id", draftId).eq("user_id", userId);
}
