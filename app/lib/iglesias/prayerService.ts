import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { classifyPrayerSafety } from "./prayerSafetyAdapter";
import { routePrayerSafetyDecision } from "./prayerSafetyRouting";
import { normalizePrayerBody, type PrayerSubmitInput } from "./prayerValidation";
import { isPrayerReportReason, type PrayerReportReason } from "./prayerTaxonomy";
import type { PrayerSubmitOutcome } from "./prayerTypes";
import { orchestratePrivatePrayerRouting } from "./prayerNetworkOrchestrate";

const DUP_WINDOW_MS = 6 * 60 * 60 * 1000;

export function prayerBodyNormalized(body: string): string {
  return normalizePrayerBody(body).toLowerCase();
}

export async function findRecentDuplicate(args: {
  bodyNormalized: string;
  sessionHash: string | null;
  userId: string | null;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const admin = getAdminSupabase();
  const since = new Date(Date.now() - DUP_WINDOW_MS).toISOString();
  let q = admin
    .from("prayer_requests")
    .select("id")
    .eq("body_normalized", args.bodyNormalized)
    .gte("created_at", since)
    .limit(1);
  if (args.userId) q = q.eq("submitter_user_id", args.userId);
  else if (args.sessionHash) q = q.eq("anonymous_session_hash", args.sessionHash);
  else return false;
  const { data } = await q;
  return (data?.length ?? 0) > 0;
}

export async function submitPrayerRequest(args: {
  input: PrayerSubmitInput;
  sessionHash: string;
  userId: string | null;
  ipHash: string | null;
}): Promise<{ ok: true; id: string; outcome: PrayerSubmitOutcome; deliveredTeams: number; routingReason: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const dup = await findRecentDuplicate({
    bodyNormalized: prayerBodyNormalized(args.input.body),
    sessionHash: args.sessionHash,
    userId: args.userId,
  });
  if (dup) return { ok: false, error: "duplicate" };

  const safety = await classifyPrayerSafety(args.input.body);
  const route = routePrayerSafetyDecision(safety.decision, args.input.visibility);
  const now = new Date().toISOString();
  const admin = getAdminSupabase();

  const insert = {
    submitter_user_id: args.userId,
    anonymous_session_hash: args.sessionHash,
    ip_hash: args.ipHash,
    visibility: args.input.visibility,
    language: args.input.language,
    city: args.input.city,
    category: args.input.category,
    display_name: args.input.visibility === "PUBLIC_ANONYMOUS" ? null : args.input.displayName,
    body: args.input.body,
    body_normalized: prayerBodyNormalized(args.input.body),
    status: route.status,
    moderation_status: route.moderation_status,
    risk_level: safety.risk_level,
    ai_decision: safety.decision,
    ai_reason_codes: safety.reason_codes,
    contains_private_info: safety.contains_private_info,
    contains_third_party_pii: safety.contains_third_party_pii,
    contains_spam: safety.contains_spam,
    contains_threat: safety.contains_threat,
    contains_hate: safety.contains_hate,
    contains_self_harm_signal: safety.contains_self_harm_signal,
    contains_imminent_violence_signal: safety.contains_imminent_violence_signal,
    contact_consent: args.input.contactConsent,
    preferred_contact_method: args.input.preferredContactMethod,
    contact_email: args.input.contactEmail,
    contact_phone: args.input.contactPhone,
    contact_whatsapp: args.input.contactWhatsapp,
    target_church_id: args.input.targetChurchId,
    published_at: route.publish ? now : null,
    updated_at: now,
  };

  const { data, error } = await admin.from("prayer_requests").insert(insert).select("id").maybeSingle();
  if (error || !data?.id) return { ok: false, error: error?.message || "insert" };

  await admin.from("prayer_moderation_events").insert({
    prayer_request_id: data.id,
    action: "AI_CLASSIFIED",
    moderator_user_id: "ai_safety_classifier",
    reason_code: safety.decision,
    note: safety.reason_codes.join(",") || safety.source,
  });

  let deliveredTeams = 0;
  let routingReason = "not_routed";
  if (args.input.visibility === "PRIVATE_PRAYER_TEAM" && route.moderation_status === "CLEARLY_SAFE") {
    const routed = await orchestratePrivatePrayerRouting(data.id);
    deliveredTeams = routed.deliveredTeams;
    routingReason = routed.reason;
  }

  return { ok: true, id: data.id, outcome: route.outcome, deliveredTeams, routingReason };
}

export async function acknowledgePrayer(args: {
  prayerId: string;
  sessionHash: string;
  userId: string | null;
}): Promise<{ ok: true; count: number } | { ok: false; error: string; status?: number }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const admin = getAdminSupabase();
  const { data: row } = await admin
    .from("prayer_requests")
    .select("id, visibility, moderation_status, status, published_at")
    .eq("id", args.prayerId)
    .maybeSingle();
  if (
    !row ||
    !["PUBLIC_NAMED", "PUBLIC_ANONYMOUS"].includes(String(row.visibility)) ||
    row.moderation_status !== "CLEARLY_SAFE" ||
    !row.published_at
  ) {
    return { ok: false, error: "not_found", status: 404 };
  }

  const payload = args.userId
    ? { prayer_request_id: args.prayerId, submitter_user_id: args.userId }
    : { prayer_request_id: args.prayerId, anonymous_session_hash: args.sessionHash };

  const { error } = await admin.from("prayer_acknowledgements").insert(payload);
  if (error && /duplicate|unique/i.test(error.message)) {
    const count = await countAcknowledgements(args.prayerId);
    return { ok: true, count };
  }
  if (error) return { ok: false, error: "insert" };
  return { ok: true, count: await countAcknowledgements(args.prayerId) };
}

export async function countAcknowledgements(prayerId: string): Promise<number> {
  const admin = getAdminSupabase();
  const { count } = await admin
    .from("prayer_acknowledgements")
    .select("id", { count: "exact", head: true })
    .eq("prayer_request_id", prayerId);
  return count ?? 0;
}

export async function reportPrayer(args: {
  prayerId: string;
  reason: string;
  details?: string;
  sessionHash: string;
  userId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  if (!isPrayerReportReason(args.reason)) return { ok: false, error: "reason", status: 400 };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const admin = getAdminSupabase();
  const { data: row } = await admin
    .from("prayer_requests")
    .select("id, visibility, moderation_status, published_at")
    .eq("id", args.prayerId)
    .maybeSingle();
  if (
    !row ||
    !["PUBLIC_NAMED", "PUBLIC_ANONYMOUS"].includes(String(row.visibility)) ||
    row.moderation_status !== "CLEARLY_SAFE" ||
    !row.published_at
  ) {
    return { ok: false, error: "not_found", status: 404 };
  }

  const { error } = await admin.from("prayer_reports").insert({
    prayer_request_id: args.prayerId,
    reason: args.reason as PrayerReportReason,
    details: args.details?.slice(0, 400) || null,
    reporter_user_id: args.userId,
    anonymous_session_hash: args.sessionHash,
  });
  if (error) return { ok: false, error: "insert" };
  return { ok: true };
}

const UPDATE_KIND_STATUS: Record<string, { status: string; kind: "STILL_NEEDS_PRAYER" | "UPDATE" | "GRATITUDE" | "CLOSE" }> =
  {
    STILL_NEEDS_PRAYER: { status: "STILL_NEEDS_PRAYER", kind: "STILL_NEEDS_PRAYER" },
    UPDATE: { status: "UPDATE_POSTED", kind: "UPDATE" },
    GRATITUDE: { status: "ANSWERED_OR_GRATITUDE", kind: "GRATITUDE" },
    CLOSE: { status: "CLOSED", kind: "CLOSE" },
  };

export async function updateOwnedPrayer(args: {
  prayerId: string;
  kind: string;
  body?: string;
  sessionHash: string;
  userId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const mapped = UPDATE_KIND_STATUS[args.kind];
  if (!mapped) return { ok: false, error: "kind", status: 400 };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const admin = getAdminSupabase();
  const { data: row } = await admin
    .from("prayer_requests")
    .select("id, submitter_user_id, anonymous_session_hash, moderation_status, visibility")
    .eq("id", args.prayerId)
    .maybeSingle();
  if (!row) return { ok: false, error: "not_found", status: 404 };

  const owns =
    (!!args.userId && row.submitter_user_id === args.userId) ||
    (!!args.sessionHash && row.anonymous_session_hash === args.sessionHash);
  if (!owns) return { ok: false, error: "forbidden", status: 403 };
  if (row.moderation_status !== "CLEARLY_SAFE") return { ok: false, error: "not_found", status: 404 };

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: mapped.status,
    updated_at: now,
  };
  if (mapped.kind === "CLOSE") patch.closed_at = now;

  const { error } = await admin.from("prayer_requests").update(patch).eq("id", args.prayerId);
  if (error) return { ok: false, error: "update" };

  await admin.from("prayer_updates").insert({
    prayer_request_id: args.prayerId,
    kind: mapped.kind,
    body: args.body?.trim().slice(0, 1000) || null,
  });
  return { ok: true };
}
