import "server-only";

import { getAdminSupabase, getServerSupabaseAnon, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { mapPublicPrayer } from "./prayerPublicMapper";
import type { PrayerPublicCard } from "./prayerTypes";

const PUBLIC_SELECT =
  "id, visibility, language, city, category, display_name, body, status, created_at, published_at, moderation_status";

export async function listPublicPrayers(opts: {
  sessionHash: string | null;
  userId: string | null;
  limit?: number;
}): Promise<PrayerPublicCard[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = getAdminSupabase();
  const { data: rows, error } = await admin
    .from("prayer_requests")
    .select(PUBLIC_SELECT)
    .in("visibility", ["PUBLIC_NAMED", "PUBLIC_ANONYMOUS"])
    .eq("moderation_status", "CLEARLY_SAFE")
    .in("status", ["OPEN", "STILL_NEEDS_PRAYER", "UPDATE_POSTED", "ANSWERED_OR_GRATITUDE"])
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 40);

  if (error || !rows) return [];

  const ids = rows.map((r) => String((r as { id: string }).id));
  if (ids.length === 0) return [];

  const mineAckQuery = () => {
    if (opts.userId && opts.sessionHash) {
      return admin
        .from("prayer_acknowledgements")
        .select("prayer_request_id")
        .in("prayer_request_id", ids)
        .or(`submitter_user_id.eq.${opts.userId},anonymous_session_hash.eq.${opts.sessionHash}`);
    }
    if (opts.userId) {
      return admin
        .from("prayer_acknowledgements")
        .select("prayer_request_id")
        .in("prayer_request_id", ids)
        .eq("submitter_user_id", opts.userId);
    }
    if (opts.sessionHash) {
      return admin
        .from("prayer_acknowledgements")
        .select("prayer_request_id")
        .in("prayer_request_id", ids)
        .eq("anonymous_session_hash", opts.sessionHash);
    }
    return Promise.resolve({ data: [] as Array<{ prayer_request_id: string }> });
  };

  const [{ data: acks }, { data: updates }, { data: mineAcks }, { data: owners }] = await Promise.all([
    admin.from("prayer_acknowledgements").select("prayer_request_id").in("prayer_request_id", ids),
    admin
      .from("prayer_updates")
      .select("prayer_request_id, kind, body, created_at")
      .in("prayer_request_id", ids)
      .order("created_at", { ascending: false }),
    mineAckQuery(),
    admin
      .from("prayer_requests")
      .select("id, submitter_user_id, anonymous_session_hash")
      .in("id", ids),
  ]);

  const countMap = new Map<string, number>();
  for (const a of acks ?? []) {
    const id = String((a as { prayer_request_id: string }).prayer_request_id);
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  const latestMap = new Map<string, PrayerPublicCard["latestUpdate"]>();
  for (const u of updates ?? []) {
    const id = String((u as { prayer_request_id: string }).prayer_request_id);
    if (latestMap.has(id)) continue;
    const kind = String((u as { kind: string }).kind);
    if (kind !== "STILL_NEEDS_PRAYER" && kind !== "UPDATE" && kind !== "GRATITUDE" && kind !== "CLOSE") continue;
    latestMap.set(id, {
      kind,
      body: ((u as { body: string | null }).body ?? "").trim() || null,
      createdAt: String((u as { created_at: string }).created_at),
    });
  }

  const mine = new Set((mineAcks ?? []).map((a) => String((a as { prayer_request_id: string }).prayer_request_id)));
  const ownerMap = new Map<string, { userId: string | null; hash: string | null }>();
  for (const o of owners ?? []) {
    ownerMap.set(String((o as { id: string }).id), {
      userId: (o as { submitter_user_id: string | null }).submitter_user_id,
      hash: (o as { anonymous_session_hash: string | null }).anonymous_session_hash,
    });
  }

  const cards: PrayerPublicCard[] = [];
  for (const row of rows) {
    const id = String((row as { id: string }).id);
    const owner = ownerMap.get(id);
    const owned =
      (!!opts.userId && owner?.userId === opts.userId) ||
      (!!opts.sessionHash && owner?.hash === opts.sessionHash);
    const mapped = mapPublicPrayer({
      row: row as Parameters<typeof mapPublicPrayer>[0]["row"],
      acknowledgementCount: countMap.get(id) ?? 0,
      latestUpdate: latestMap.get(id) ?? null,
      owned,
      acknowledgedByViewer: mine.has(id),
    });
    if (mapped) cards.push(mapped);
  }
  return cards;
}

/** Anon client probe for RLS selftest — not used by the public UI. */
export async function anonSelectPrayerById(id: string) {
  const anon = getServerSupabaseAnon();
  return anon.from("prayer_requests").select("id, body, visibility").eq("id", id);
}
