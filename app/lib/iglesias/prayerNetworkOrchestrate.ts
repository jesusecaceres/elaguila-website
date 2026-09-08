import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import {
  canRetryPrayerDelivery,
  isPrayerTeamEligible,
  mapPrayerTeamDeliveryPayload,
  prayerNetworkEmailSubject,
  selectPrayerNetworkTeams,
  type PrayerTeamCandidate,
} from "./prayerNetworkRouting";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function loadPrayerNetworkCandidates(): Promise<PrayerTeamCandidate[]> {
  const admin = getAdminSupabase();
  const { data: teams } = await admin.from("church_prayer_teams").select("*");
  if (!teams?.length) return [];
  const churchIds = teams.map((t) => String(t.church_id));
  const { data: churches } = await admin
    .from("churches")
    .select("id, name, approval_status, is_active, city, state")
    .in("id", churchIds);
  const churchMap = new Map((churches ?? []).map((c) => [String(c.id), c]));
  const { data: deliveries } = await admin
    .from("prayer_team_deliveries")
    .select("prayer_team_id, created_at, delivered_at")
    .in("prayer_team_id", teams.map((t) => String(t.id)));

  const count = new Map<string, number>();
  const last = new Map<string, string>();
  for (const d of deliveries ?? []) {
    const id = String(d.prayer_team_id);
    count.set(id, (count.get(id) ?? 0) + 1);
    const ts = String(d.delivered_at || d.created_at || "");
    const prev = last.get(id);
    if (!prev || ts > prev) last.set(id, ts);
  }

  return teams.map((t) => {
    const church = churchMap.get(String(t.church_id));
    return {
      teamId: String(t.id),
      churchId: String(t.church_id),
      churchName: String(church?.name ?? ""),
      enabled: t.enabled === true,
      status: t.status === "ACTIVE" || t.status === "PAUSED" ? t.status : "DISABLED",
      acceptsPrivate: t.accepts_private_requests === true,
      churchApproved: church?.approval_status === "approved",
      churchActive: church?.is_active === true,
      supportedLanguages: Array.isArray(t.supported_languages) ? t.supported_languages.map(String) : [],
      supportedCategories: Array.isArray(t.supported_categories) ? t.supported_categories.map(String) : [],
      geographicScope: (t.geographic_scope as string | null) ?? null,
      churchCity: (church?.city as string | null) ?? null,
      churchState: (church?.state as string | null) ?? null,
      deliveryCount: count.get(String(t.id)) ?? 0,
      lastDeliveredAt: last.get(String(t.id)) ?? null,
    };
  });
}

async function emailRecipients(teamId: string, primaryEmail: string | null): Promise<string[]> {
  const admin = getAdminSupabase();
  const { data: members } = await admin
    .from("church_prayer_team_members")
    .select("email, is_active")
    .eq("prayer_team_id", teamId)
    .eq("is_active", true);
  const set = new Set<string>();
  if (primaryEmail?.includes("@")) set.add(primaryEmail.trim().toLowerCase());
  for (const m of members ?? []) {
    const e = String(m.email || "").trim().toLowerCase();
    if (e.includes("@")) set.add(e);
  }
  return [...set];
}

export async function orchestratePrivatePrayerRouting(prayerId: string): Promise<{
  deliveredTeams: number;
  reason: string;
}> {
  if (!isSupabaseAdminConfigured()) return { deliveredTeams: 0, reason: "unavailable" };
  const admin = getAdminSupabase();
  const { data: prayer } = await admin.from("prayer_requests").select("*").eq("id", prayerId).maybeSingle();
  if (!prayer) return { deliveredTeams: 0, reason: "missing" };

  const selection = selectPrayerNetworkTeams(
    {
      visibility: String(prayer.visibility),
      moderation_status: String(prayer.moderation_status),
      language: String(prayer.language),
      category: (prayer.category as string | null) ?? null,
      city: (prayer.city as string | null) ?? null,
      target_church_id: (prayer.target_church_id as string | null) ?? null,
    },
    await loadPrayerNetworkCandidates(),
  );

  if (!selection.selected.length) return { deliveredTeams: 0, reason: selection.reason };

  const payload = mapPrayerTeamDeliveryPayload(prayer as Parameters<typeof mapPrayerTeamDeliveryPayload>[0]);
  const lang = payload.language === "en" ? "en" : "es";
  let deliveredTeams = 0;

  for (const team of selection.selected) {
    const { data: teamRow } = await admin
      .from("church_prayer_teams")
      .select("delivery_email_enabled, delivery_dashboard_enabled, primary_contact_email")
      .eq("id", team.teamId)
      .maybeSingle();

    const dashboardOn = teamRow?.delivery_dashboard_enabled !== false;
    const emailOn = teamRow?.delivery_email_enabled === true;
    let teamDelivered = false;

    if (dashboardOn) {
      const { error } = await admin.from("prayer_team_deliveries").upsert(
        {
          prayer_request_id: prayerId,
          church_id: team.churchId,
          prayer_team_id: team.teamId,
          delivery_channel: "DASHBOARD",
          delivery_status: "DELIVERED",
          attempt_count: 1,
          delivered_at: new Date().toISOString(),
        },
        { onConflict: "prayer_request_id,prayer_team_id,delivery_channel", ignoreDuplicates: true },
      );
      if (!error) teamDelivered = true;
    }

    if (emailOn) {
      const { data: existing } = await admin
        .from("prayer_team_deliveries")
        .select("id, attempt_count, delivery_status")
        .eq("prayer_request_id", prayerId)
        .eq("prayer_team_id", team.teamId)
        .eq("delivery_channel", "EMAIL")
        .maybeSingle();

      if (!existing) {
        await admin.from("prayer_team_deliveries").insert({
          prayer_request_id: prayerId,
          church_id: team.churchId,
          prayer_team_id: team.teamId,
          delivery_channel: "EMAIL",
          delivery_status: "PENDING",
          attempt_count: 0,
        });
      }

      const { data: emailRow } = await admin
        .from("prayer_team_deliveries")
        .select("id, attempt_count, delivery_status")
        .eq("prayer_request_id", prayerId)
        .eq("prayer_team_id", team.teamId)
        .eq("delivery_channel", "EMAIL")
        .maybeSingle();

      if (emailRow && emailRow.delivery_status !== "DELIVERED" && canRetryPrayerDelivery(Number(emailRow.attempt_count) || 0)) {
        const to = await emailRecipients(team.teamId, (teamRow?.primary_contact_email as string | null) ?? null);
        const now = new Date().toISOString();
        if (!to.length) {
          await admin
            .from("prayer_team_deliveries")
            .update({
              delivery_status: "FAILED",
              attempt_count: Number(emailRow.attempt_count) + 1,
              last_error: "no_recipient",
              attempted_at: now,
            })
            .eq("id", emailRow.id);
        } else {
          const contactLine = payload.contact
            ? lang === "en"
              ? `Contact (${payload.contact.method}): ${payload.contact.value}`
              : `Contacto (${payload.contact.method}): ${payload.contact.value}`
            : lang === "en"
              ? "The requester did not consent to direct contact."
              : "La persona no autorizó contacto directo.";
          const nameLine = payload.displayName ? payload.displayName : lang === "en" ? "Anonymous" : "Anónimo";
          const cityLine = payload.city ? payload.city : "";
          const text = [
            lang === "en" ? "A private prayer request was shared with your prayer team." : "Se compartió una petición privada de oración con tu equipo.",
            "",
            payload.body,
            "",
            payload.category ? `Category: ${payload.category}` : "",
            `Language: ${payload.language}`,
            nameLine,
            cityLine,
            contactLine,
            "",
            lang === "en"
              ? "Please pray. Do not reply through Leonix. There is no in-app messaging."
              : "Por favor ora. No respondas por Leonix. No hay mensajería en la plataforma.",
          ]
            .filter(Boolean)
            .join("\n");
          const sent = await sendLeonixResendEmail({
            to,
            subject: prayerNetworkEmailSubject(lang),
            text,
            html: `<p>${escapeHtml(text).replace(/\n/g, "<br/>")}</p>`,
          });
          if (sent.ok) {
            await admin
              .from("prayer_team_deliveries")
              .update({
                delivery_status: "DELIVERED",
                attempt_count: Number(emailRow.attempt_count) + 1,
                last_error: null,
                attempted_at: now,
                delivered_at: now,
              })
              .eq("id", emailRow.id);
            teamDelivered = true;
          } else {
            await admin
              .from("prayer_team_deliveries")
              .update({
                delivery_status: "FAILED",
                attempt_count: Number(emailRow.attempt_count) + 1,
                last_error: sent.message.slice(0, 400),
                attempted_at: now,
              })
              .eq("id", emailRow.id);
          }
        }
      }
    }

    if (teamDelivered) deliveredTeams += 1;
  }

  return { deliveredTeams, reason: selection.reason };
}

export async function inspectPrivatePrayerRouting(prayerId: string): Promise<{
  reason: string;
  eligible: Array<{ teamId: string; churchName: string }>;
  selected: Array<{ teamId: string; churchName: string }>;
}> {
  if (!isSupabaseAdminConfigured()) return { reason: "unavailable", eligible: [], selected: [] };
  const admin = getAdminSupabase();
  const { data: prayer } = await admin.from("prayer_requests").select("*").eq("id", prayerId).maybeSingle();
  if (!prayer) return { reason: "missing", eligible: [], selected: [] };
  const routing = {
    visibility: String(prayer.visibility),
    moderation_status: String(prayer.moderation_status),
    language: String(prayer.language),
    category: (prayer.category as string | null) ?? null,
    city: (prayer.city as string | null) ?? null,
    target_church_id: (prayer.target_church_id as string | null) ?? null,
  };
  const teams = await loadPrayerNetworkCandidates();
  const eligible = teams.filter((t) => isPrayerTeamEligible(t, routing));
  const selection = selectPrayerNetworkTeams(routing, teams);
  return {
    reason: selection.reason,
    eligible: eligible.map((t) => ({ teamId: t.teamId, churchName: t.churchName })),
    selected: selection.selected.map((t) => ({ teamId: t.teamId, churchName: t.churchName })),
  };
}
