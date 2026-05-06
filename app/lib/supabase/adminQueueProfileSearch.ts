import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { adminQueueNormalizePhoneDigits } from "@/app/admin/_lib/adminAdSearch";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Resolve `profiles.id` values whose display_name, email, phone, or id match admin queue `q`.
 * Used to find listings owned by accounts matching name/email/phone search.
 */
export async function fetchProfileIdsMatchingAdminQueueSearch(
  supabase: SupabaseClient,
  rawInput: string,
): Promise<string[]> {
  const trimmed = (rawInput ?? "").trim();
  if (trimmed.length < 2) return [];

  const ids = new Set<string>();
  const lower = trimmed.toLowerCase();

  if (UUID_RE.test(trimmed)) {
    const { data } = await supabase.from("profiles").select("id").eq("id", trimmed).limit(5);
    for (const r of data ?? []) {
      const id = (r as { id?: string }).id;
      if (id) ids.add(id);
    }
  }

  const term = `%${escapeIlike(lower)}%`;
  const [{ data: byName }, { data: byEmail }] = await Promise.all([
    supabase.from("profiles").select("id").ilike("display_name", term).limit(40),
    supabase.from("profiles").select("id").ilike("email", term).limit(40),
  ]);
  for (const r of [...(byName ?? []), ...(byEmail ?? [])]) {
    const id = (r as { id?: string }).id;
    if (id) ids.add(id);
  }

  const digits = adminQueueNormalizePhoneDigits(trimmed);
  if (digits.length >= 7) {
    const phoneTerm = `%${escapeIlike(digits)}%`;
    const { data: byPhone } = await supabase.from("profiles").select("id").ilike("phone", phoneTerm).limit(40);
    for (const r of byPhone ?? []) {
      const id = (r as { id?: string }).id;
      if (id) ids.add(id);
    }
  }

  return Array.from(ids);
}
