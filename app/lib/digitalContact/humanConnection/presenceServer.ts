import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ExecutiveTemporaryPresence, ExecutiveTemporaryStatus } from "../digitalContactTypes";
import type { ExecutivePresenceRecord, ExecutivePresenceStatus } from "./humanConnectionTypes";
import { HUMAN_CONNECTION_PRESENCE_PRESETS } from "./constants";

function mapStatus(raw: string): ExecutivePresenceStatus | null {
  if (raw === "available" || raw === "busy" || raw === "away") return raw;
  return null;
}

/**
 * Read live presence for an executive. Returns null when missing, expired, or storage unavailable.
 * Public consumers must not receive updatedBy / internal metadata.
 */
export async function getExecutivePresenceForSlug(
  profileSlug: string,
  now: Date = new Date(),
): Promise<ExecutiveTemporaryPresence | null> {
  const slug = String(profileSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return null;
  if (!isSupabaseAdminConfigured()) return null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("digital_contact_executive_presence")
      .select("status, expires_at, updated_at")
      .eq("profile_slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    const status = mapStatus(String(data.status ?? ""));
    if (!status) return null;
    const expiresAt = String(data.expires_at ?? "");
    const updatedAt = String(data.updated_at ?? "");
    const exp = Date.parse(expiresAt);
    const set = Date.parse(updatedAt);
    if (!Number.isFinite(exp) || !Number.isFinite(set)) return null;
    if (!(exp > set)) return null;
    if (now.getTime() >= exp) return null;

    return {
      status: status as ExecutiveTemporaryStatus,
      setAt: new Date(set).toISOString(),
      expiresAt: new Date(exp).toISOString(),
    };
  } catch {
    return null;
  }
}

/** Staff/internal read including metadata. Never send to visitors. */
export async function getExecutivePresenceRecord(
  profileSlug: string,
): Promise<ExecutivePresenceRecord | null> {
  const slug = String(profileSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug || !isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("digital_contact_executive_presence")
      .select("profile_slug, status, expires_at, updated_at, updated_by")
      .eq("profile_slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    const status = mapStatus(String(data.status ?? ""));
    if (!status) return null;
    return {
      profileSlug: String(data.profile_slug),
      status,
      expiresAt: String(data.expires_at),
      updatedAt: String(data.updated_at),
      updatedBy: data.updated_by != null ? String(data.updated_by) : null,
    };
  } catch {
    return null;
  }
}

export type SetExecutivePresenceInput = {
  profileSlug: string;
  status: ExecutivePresenceStatus;
  durationMinutes: number;
  updatedBy: string;
  now?: Date;
};

export async function setExecutivePresence(
  input: SetExecutivePresenceInput,
): Promise<{ ok: true; record: ExecutivePresenceRecord } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };

  const slug = String(input.profileSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return { ok: false, error: "invalid_slug" };

  const duration = Number(input.durationMinutes);
  if (
    !HUMAN_CONNECTION_PRESENCE_PRESETS.includes(duration as (typeof HUMAN_CONNECTION_PRESENCE_PRESETS)[number])
  ) {
    return { ok: false, error: "invalid_duration" };
  }

  const status = mapStatus(input.status);
  if (!status) return { ok: false, error: "invalid_status" };

  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + duration * 60_000).toISOString();
  const updatedBy = String(input.updatedBy ?? "admin").slice(0, 120);

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("digital_contact_executive_presence")
      .upsert(
        {
          profile_slug: slug,
          status,
          expires_at: expiresAt,
          updated_at: now.toISOString(),
          updated_by: updatedBy,
        },
        { onConflict: "profile_slug" },
      )
      .select("profile_slug, status, expires_at, updated_at, updated_by")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "upsert_failed" };
    return {
      ok: true,
      record: {
        profileSlug: String(data.profile_slug),
        status: mapStatus(String(data.status)) ?? status,
        expiresAt: String(data.expires_at),
        updatedAt: String(data.updated_at),
        updatedBy: data.updated_by != null ? String(data.updated_by) : updatedBy,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "upsert_failed" };
  }
}

export async function clearExecutivePresence(
  profileSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const slug = String(profileSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return { ok: false, error: "invalid_slug" };
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from("digital_contact_executive_presence")
      .delete()
      .eq("profile_slug", slug);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "delete_failed" };
  }
}
