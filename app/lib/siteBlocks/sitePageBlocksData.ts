import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { SiteBlockType, SitePageBlockRow } from "./blockTypes";
import { isSiteBlockLocale, isSiteBlockType, validatePageBlocksForSave } from "./validateBlocks";

function str(v: string): string {
  return (v ?? "").trim();
}

function asPayload(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function mapRow(raw: Record<string, unknown>): SitePageBlockRow | null {
  const id = raw.id;
  const page_key = raw.page_key;
  const locale = raw.locale;
  const sort_index = raw.sort_index;
  const block_type = raw.block_type;
  const visible = raw.visible;
  const payload = raw.payload;
  const created_at = raw.created_at;
  const updated_at = raw.updated_at;

  if (typeof id !== "string" || typeof page_key !== "string") return null;
  if (typeof locale !== "string" || !isSiteBlockLocale(locale)) return null;
  if (typeof block_type !== "string" || !isSiteBlockType(block_type)) return null;
  if (typeof sort_index !== "number" || !Number.isFinite(sort_index)) return null;
  if (typeof visible !== "boolean") return null;
  if (typeof created_at !== "string" || typeof updated_at !== "string") return null;

  return {
    id,
    page_key,
    locale,
    sort_index,
    block_type: block_type as SiteBlockType,
    visible,
    payload: asPayload(payload),
    created_at,
    updated_at,
  };
}

function mapRows(data: unknown): SitePageBlockRow[] {
  if (!Array.isArray(data)) return [];
  const out: SitePageBlockRow[] = [];
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const m = mapRow(row as Record<string, unknown>);
    if (m) out.push(m);
  }
  return out;
}

/**
 * All blocks for a page + locale, including hidden, ordered by sort_index ascending.
 */
export async function listPageBlocks(
  pageKey: string,
  locale: string,
): Promise<{ rows: SitePageBlockRow[]; error: string | null }> {
  const pk = str(pageKey);
  const loc = str(locale) || "es";
  if (!pk) {
    return { rows: [], error: "page_key_required" };
  }
  if (!isSiteBlockLocale(loc)) {
    return { rows: [], error: "invalid_locale" };
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("site_page_blocks")
      .select("*")
      .eq("page_key", pk)
      .eq("locale", loc)
      .order("sort_index", { ascending: true });

    if (error) throw error;
    return { rows: mapRows(data ?? []), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "site_page_blocks_list_failed";
    return { rows: [], error: msg };
  }
}

/**
 * Visible blocks only (`visible = true`), same ordering as listPageBlocks.
 */
export async function listVisiblePageBlocks(
  pageKey: string,
  locale: string,
): Promise<{ rows: SitePageBlockRow[]; error: string | null }> {
  const pk = str(pageKey);
  const loc = str(locale) || "es";
  if (!pk) {
    return { rows: [], error: "page_key_required" };
  }
  if (!isSiteBlockLocale(loc)) {
    return { rows: [], error: "invalid_locale" };
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("site_page_blocks")
      .select("*")
      .eq("page_key", pk)
      .eq("locale", loc)
      .eq("visible", true)
      .order("sort_index", { ascending: true });

    if (error) throw error;
    return { rows: mapRows(data ?? []), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "site_page_blocks_list_visible_failed";
    return { rows: [], error: msg };
  }
}

export type ReplacePageBlocksResult = {
  rows: SitePageBlockRow[] | null;
  error: string | null;
};

/**
 * Atomically replace all blocks for `(page_key, locale)` with a validated list.
 * sort_index is recomputed as 0..n-1 in array order. `updated_at` / `created_at` set server-side.
 */
export async function replacePageBlocks(
  pageKey: string,
  locale: string,
  blocks: unknown[],
): Promise<ReplacePageBlocksResult> {
  const validated = validatePageBlocksForSave(pageKey, locale, blocks);
  if (!validated.ok) {
    return { rows: null, error: validated.error };
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  try {
    const { error: delErr } = await supabase
      .from("site_page_blocks")
      .delete()
      .eq("page_key", validated.pageKey)
      .eq("locale", validated.locale);
    if (delErr) throw delErr;

    if (validated.blocks.length === 0) {
      return { rows: [], error: null };
    }

    const insertRows = validated.blocks.map((b, i) => ({
      page_key: validated.pageKey,
      locale: validated.locale,
      sort_index: i,
      block_type: b.block_type,
      visible: b.visible,
      payload: b.payload,
      created_at: now,
      updated_at: now,
    }));

    const { data, error: insErr } = await supabase.from("site_page_blocks").insert(insertRows).select("*");
    if (insErr) throw insErr;

    return { rows: mapRows(data ?? []), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "site_page_blocks_replace_failed";
    return { rows: null, error: msg };
  }
}
