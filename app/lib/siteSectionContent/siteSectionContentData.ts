import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { SiteSectionKey } from "./sectionKeys";

export async function getSiteSectionPayload<K extends SiteSectionKey>(
  key: K
): Promise<{ payload: Record<string, unknown>; updatedAt: string | null; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("site_section_content")
      .select("payload, updated_at")
      .eq("section_key", key)
      .maybeSingle();

    if (error) throw error;
    const raw = data as { payload?: unknown; updated_at?: string } | null;
    const payload =
      raw?.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload)
        ? (raw.payload as Record<string, unknown>)
        : {};
    return {
      payload,
      updatedAt: raw?.updated_at ?? null,
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "site_section_content read failed";
    return { payload: {}, updatedAt: null, error: msg };
  }
}

export async function upsertSiteSectionPayload(
  key: SiteSectionKey,
  payload: Record<string, unknown>
): Promise<{ error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("site_section_content").upsert(
      {
        section_key: key,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "section_key" }
    );
    if (error) throw error;
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "site_section_content write failed";
    return { error: msg };
  }
}
