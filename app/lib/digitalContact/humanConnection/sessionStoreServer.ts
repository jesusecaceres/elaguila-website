import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type StoredVideoSession = {
  sessionId: string;
  profileSlug: string;
  providerId: string;
  providerRoomName: string;
  /** Privileged provider host join URL — never send to visitors. */
  hostProviderJoinUrl: string;
  visitorJoinUrl: string;
  expiresAt: string;
  createdAt: string;
};

/** Process-local fallback for local/dev only — production must persist to Supabase. */
const memorySessions = new Map<string, StoredVideoSession>();

function pruneMemory(now = Date.now()) {
  for (const [id, s] of memorySessions) {
    if (Date.parse(s.expiresAt) <= now) memorySessions.delete(id);
  }
}

function allowMemoryFallback(): boolean {
  // Production: memory is an emergency same-instance cache only; DB is required for host answer.
  return process.env.VERCEL_ENV !== "production" || process.env.NODE_ENV !== "production";
}

export async function storeVideoSession(
  session: StoredVideoSession,
): Promise<{ ok: boolean; persistedToDatabase: boolean }> {
  pruneMemory();
  memorySessions.set(session.sessionId, session);

  if (!isSupabaseAdminConfigured()) {
    if (process.env.VERCEL_ENV === "production") {
      console.error("[human-connection] SUPABASE admin not configured — cannot persist video session");
    }
    return { ok: true, persistedToDatabase: false };
  }

  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("digital_contact_video_sessions").upsert({
      id: session.sessionId,
      profile_slug: session.profileSlug,
      provider_id: session.providerId,
      provider_room_name: session.providerRoomName,
      host_provider_join_url: session.hostProviderJoinUrl,
      visitor_join_url: session.visitorJoinUrl,
      expires_at: session.expiresAt,
      created_at: session.createdAt,
    });
    if (error) {
      console.error(`[human-connection] video session persist failed: ${error.message}`);
      return { ok: true, persistedToDatabase: false };
    }
    return { ok: true, persistedToDatabase: true };
  } catch (e) {
    console.error(
      `[human-connection] video session persist error: ${e instanceof Error ? e.message : "unknown"}`,
    );
    return { ok: true, persistedToDatabase: false };
  }
}

export async function getVideoSession(sessionId: string): Promise<StoredVideoSession | null> {
  const id = String(sessionId ?? "").trim();
  if (!id) return null;
  pruneMemory();

  // Prefer database in production so host join works across Vercel instances.
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase
        .from("digital_contact_video_sessions")
        .select(
          "id, profile_slug, provider_id, provider_room_name, host_provider_join_url, visitor_join_url, expires_at, created_at",
        )
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        if (Date.parse(String(data.expires_at)) <= Date.now()) return null;
        const stored: StoredVideoSession = {
          sessionId: String(data.id),
          profileSlug: String(data.profile_slug),
          providerId: String(data.provider_id),
          providerRoomName: String(data.provider_room_name),
          hostProviderJoinUrl: String(data.host_provider_join_url),
          visitorJoinUrl: String(data.visitor_join_url),
          expiresAt: String(data.expires_at),
          createdAt: String(data.created_at),
        };
        memorySessions.set(id, stored);
        return stored;
      }
    } catch {
      /* fall through to memory */
    }
  }

  const mem = memorySessions.get(id);
  if (mem) {
    if (Date.parse(mem.expiresAt) <= Date.now()) {
      memorySessions.delete(id);
      return null;
    }
    if (!allowMemoryFallback() && process.env.VERCEL_ENV === "production") {
      // Still return memory hit for same-instance recovery, but log.
      console.warn(`[human-connection] serving video session ${id} from memory in production`);
    }
    return mem;
  }

  return null;
}

export async function deleteVideoSession(sessionId: string): Promise<void> {
  const id = String(sessionId ?? "").trim();
  if (!id) return;
  memorySessions.delete(id);
  if (!isSupabaseAdminConfigured()) return;
  try {
    const supabase = getAdminSupabase();
    await supabase.from("digital_contact_video_sessions").delete().eq("id", id);
  } catch {
    /* ignore */
  }
}

/** Test helper */
export function __clearVideoSessionMemoryForTests(): void {
  memorySessions.clear();
}
