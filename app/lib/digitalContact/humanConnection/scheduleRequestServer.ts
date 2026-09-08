import "server-only";

import { getDigitalContactProfile } from "../digitalContactRegistry";
import { insertDigitalContactAnalyticsEvent } from "../digitalContactOpsTablesServer";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  HUMAN_CONNECTION_MESSAGE_MAX,
  HUMAN_CONNECTION_NAME_MAX,
  HUMAN_CONNECTION_NAME_MIN,
  HUMAN_CONNECTION_PREFERRED_TIME_MAX,
  HUMAN_CONNECTION_SCHEDULE_RATE_LIMIT,
  HUMAN_CONNECTION_SCHEDULE_RATE_WINDOW_MS,
} from "./constants";
import { checkHumanConnectionRateLimit } from "./rateLimit";
import { isHumanConnectionScheduleEnabled } from "./videoKillSwitch";
import type { ScheduleContactMethod, ScheduleRequestInput, HumanConnectionSurface } from "./humanConnectionTypes";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function normalizeSource(raw: string | null | undefined): string | null {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "office-window" || v === "office_window") return "office-window";
  return null;
}

function normalizeSurface(raw: string | null | undefined): HumanConnectionSurface {
  return raw === "digital_contact" ? "digital_contact" : "virtual_front_desk";
}

function normalizeMethod(raw: unknown): ScheduleContactMethod | null {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "email" || v === "phone" || v === "whatsapp") return v;
  return null;
}

export type SubmitScheduleRequestResult =
  | { ok: true; id: string | null; stored: boolean; emailNotified: boolean }
  | { ok: false; error: string };

/**
 * Scheduling / follow-up REQUEST only — never confirms a calendar appointment.
 * Does not create CRM pipeline opportunities.
 */
export async function submitHumanConnectionScheduleRequest(
  input: ScheduleRequestInput & { clientKey: string; honeypot?: string },
): Promise<SubmitScheduleRequestResult> {
  if (String(input.honeypot ?? "").trim().length > 0) {
    return { ok: true, id: null, stored: false, emailNotified: false };
  }

  const slug = String(input.profileSlug ?? "")
    .trim()
    .toLowerCase();
  const visitorName = String(input.visitorName ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const contactMethod = normalizeMethod(input.contactMethod);
  const email = String(input.email ?? "")
    .trim()
    .slice(0, 320);
  const phone = String(input.phone ?? "")
    .trim()
    .slice(0, 48);
  const preferredTime = String(input.preferredTime ?? "")
    .trim()
    .slice(0, HUMAN_CONNECTION_PREFERRED_TIME_MAX);
  const message = String(input.message ?? "")
    .trim()
    .slice(0, HUMAN_CONNECTION_MESSAGE_MAX);
  const lang = input.lang === "en" ? "en" : "es";
  const surface = normalizeSurface(input.surface);
  const source = normalizeSource(input.source ?? null);

  if (!slug) return { ok: false, error: "invalid_slug" };
  if (visitorName.length < HUMAN_CONNECTION_NAME_MIN || visitorName.length > HUMAN_CONNECTION_NAME_MAX) {
    return { ok: false, error: "invalid_name" };
  }
  if (!contactMethod) return { ok: false, error: "invalid_contact_method" };
  if (!preferredTime) return { ok: false, error: "invalid_preferred_time" };

  if (contactMethod === "email") {
    if (!isEmail(email)) return { ok: false, error: "invalid_email" };
  } else {
    if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "invalid_phone" };
  }

  const profile = getDigitalContactProfile(slug);
  if (!profile) return { ok: false, error: "profile_not_found" };

  if (!isHumanConnectionScheduleEnabled()) {
    return { ok: false, error: "schedule_disabled" };
  }

  const rate = checkHumanConnectionRateLimit({
    key: `schedule:${input.clientKey}:${slug}`,
    limit: HUMAN_CONNECTION_SCHEDULE_RATE_LIMIT,
    windowMs: HUMAN_CONNECTION_SCHEDULE_RATE_WINDOW_MS,
  });
  if (!rate.allowed) return { ok: false, error: "rate_limited" };

  let id: string | null = null;
  let stored = false;

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase
        .from("digital_contact_schedule_requests")
        .insert({
          profile_slug: slug,
          visitor_name: visitorName,
          contact_method: contactMethod,
          visitor_email: email || null,
          visitor_phone: phone || null,
          preferred_time: preferredTime,
          message: message || null,
          lang,
          surface,
          source,
        })
        .select("id")
        .single();
      if (!error && data?.id) {
        id = String(data.id);
        stored = true;
      } else if (error) {
        console.error(`[human-connection-schedule] persist failed: ${error.message}`);
      }
    } catch (e) {
      console.error(
        `[human-connection-schedule] persist error: ${e instanceof Error ? e.message : "unknown"}`,
      );
    }
  }

  void insertDigitalContactAnalyticsEvent({
    profileSlug: slug,
    eventType: "schedule_request_submitted",
    meta: { surface, source, contactMethod, stored, requestId: id },
  }).catch(() => {});

  const textBody = [
    "This is a REQUEST to schedule a conversation — not a confirmed appointment.",
    "",
    `For: ${profile.fullName}`,
    `Visitor: ${visitorName}`,
    `Preferred contact: ${contactMethod}`,
    email ? `Email: ${email}` : null,
    phone ? `Phone: ${phone}` : null,
    `Preferred time / preference: ${preferredTime}`,
    message ? `Message: ${message}` : null,
    `Language: ${lang}`,
    `Surface: ${surface}`,
    source ? `Source: ${source}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const sent = await sendLeonixResendEmail({
    to: profile.email,
    subject:
      lang === "en"
        ? `Leonix — conversation request (${visitorName})`
        : `Leonix — solicitud de conversación (${visitorName})`,
    replyTo: email && isEmail(email) ? email : undefined,
    text: textBody,
    html: `<pre style="white-space:pre-wrap;font-family:inherit">${textBody
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>`,
  });

  const emailNotified = sent.ok;
  /**
   * Build 07 — never claim success when nothing was delivered or stored.
   * Prefer /contacto fallback on the public VFD when this path is unavailable.
   */
  if (!stored && !emailNotified) {
    return { ok: false, error: "notification_unavailable" };
  }

  return { ok: true, id, stored, emailNotified };
}
