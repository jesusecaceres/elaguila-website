import "server-only";

import { getDigitalContactProfile } from "../digitalContactRegistry";
import type { DigitalContactProfile } from "../digitalContactTypes";
import {
  HUMAN_CONNECTION_REASON_MAX,
  HUMAN_CONNECTION_SESSION_TTL_MS,
  HUMAN_CONNECTION_VIDEO_RATE_LIMIT,
  HUMAN_CONNECTION_VIDEO_RATE_WINDOW_MS,
} from "./constants";
import { enrichProfileWithLivePresence } from "./enrichProfileWithPresence";
import { getHumanConnectionVideoProvider } from "./providers/getVideoProvider";
import { checkHumanConnectionRateLimit } from "./rateLimit";
import { resolveVideoEligibility } from "./resolveVideoEligibility";
import { normalizeVisitorFirstName } from "./normalizeVisitorName";
import { isHumanConnectionVideoEnabled } from "./videoKillSwitch";
import { storeVideoSession } from "./sessionStoreServer";
import type {
  HumanConnectionRequestInput,
  HumanConnectionSessionResult,
  HumanConnectionSurface,
} from "./humanConnectionTypes";
import { insertDigitalContactAnalyticsEvent } from "../digitalContactOpsTablesServer";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

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

function publicOrigin(): string {
  const fromEnv = String(process.env.HUMAN_CONNECTION_PUBLIC_ORIGIN ?? "").trim().replace(/\/$/, "");
  if (fromEnv.startsWith("https://") || fromEnv.startsWith("http://")) return fromEnv;
  return LEONIX_SITE_ORIGIN;
}

export { normalizeVisitorFirstName };

export type RequestVideoSessionArgs = HumanConnectionRequestInput & {
  clientKey: string;
  now?: Date;
  lookupProfile?: (slug: string) => DigitalContactProfile | null;
  skipEnrichment?: boolean;
};

/**
 * Server-side video session boundary (Build 04B → Build 11).
 * Creates ephemeral Daily room; host notification is best-effort (does not revoke visitor room).
 * Never returns host/provider secrets to the visitor.
 */
export async function requestHumanConnectionVideoSession(
  args: RequestVideoSessionArgs,
): Promise<HumanConnectionSessionResult> {
  const now = args.now ?? new Date();
  const slug = String(args.profileSlug ?? "")
    .trim()
    .toLowerCase();
  const firstName = normalizeVisitorFirstName(args.visitorFirstName);
  const reason = String(args.reasonForVisit ?? "")
    .trim()
    .slice(0, HUMAN_CONNECTION_REASON_MAX);
  const lang = args.lang === "en" ? "en" : "es";
  const surface = normalizeSurface(args.surface);
  const source = normalizeSource(args.source ?? null);

  if (!slug || !firstName) {
    return { ok: false, error: "invalid_request" };
  }

  if (!isHumanConnectionVideoEnabled()) {
    return { ok: false, error: "kill_switch_off", eligibilityReason: "kill_switch_off" };
  }

  const rate = checkHumanConnectionRateLimit({
    key: `video:${args.clientKey}:${slug}`,
    limit: HUMAN_CONNECTION_VIDEO_RATE_LIMIT,
    windowMs: HUMAN_CONNECTION_VIDEO_RATE_WINDOW_MS,
    now: now.getTime(),
  });
  if (!rate.allowed) {
    return { ok: false, error: "rate_limited" };
  }

  const lookup = args.lookupProfile ?? getDigitalContactProfile;
  let profile = lookup(slug);
  if (!profile) {
    return { ok: false, error: "executive_not_found" };
  }

  if (!args.skipEnrichment) {
    profile = await enrichProfileWithLivePresence(profile, now);
  }

  const provider = getHumanConnectionVideoProvider();
  const cap = provider.getCapability();

  const eligibility = resolveVideoEligibility({
    profile,
    now,
    lang,
    lookupProfile: lookup,
    providerConfigured: provider.isConfigured() && cap.configured,
    providerHealthy: cap.healthy && cap.canCreateEphemeralSession,
    videoEnabled: true,
    notificationReady: true, // ignored for offer; kept for API compat
  });

  if (!eligibility.offerImmediateVideo) {
    void insertDigitalContactAnalyticsEvent({
      profileSlug: slug,
      eventType: "daily_video_request_failed",
      meta: {
        surface,
        source,
        reason: eligibility.reason,
        stage: "eligibility",
      },
    }).catch(() => {});
    return {
      ok: false,
      error:
        eligibility.reason === "provider_unconfigured"
          ? "provider_unconfigured"
          : eligibility.reason === "kill_switch_off"
            ? "kill_switch_off"
            : "not_eligible",
      eligibilityReason: eligibility.reason,
    };
  }

  void insertDigitalContactAnalyticsEvent({
    profileSlug: slug,
    eventType: "daily_video_request_started",
    meta: { surface, source, lang },
  }).catch(() => {});

  const preferredExpiresAt = new Date(now.getTime() + HUMAN_CONNECTION_SESSION_TTL_MS).toISOString();

  let created;
  try {
    created = await provider.createEphemeralSession({
      profileSlug: slug,
      visitorFirstName: firstName,
      reasonForVisit: reason || null,
      lang,
      preferredExpiresAt,
    });
  } catch {
    void insertDigitalContactAnalyticsEvent({
      profileSlug: slug,
      eventType: "daily_video_request_failed",
      meta: { surface, source, stage: "provider_throw" },
    }).catch(() => {});
    return { ok: false, error: "provider_error" };
  }

  if (!created.ok) {
    void insertDigitalContactAnalyticsEvent({
      profileSlug: slug,
      eventType: "daily_video_request_failed",
      meta: { surface, source, stage: "room_create", error: created.error },
    }).catch(() => {});
    if (created.error === "not_configured") {
      return { ok: false, error: "provider_unconfigured", eligibilityReason: "provider_unconfigured" };
    }
    return { ok: false, error: "session_create_failed" };
  }

  void insertDigitalContactAnalyticsEvent({
    profileSlug: slug,
    eventType: "daily_video_room_created",
    meta: {
      surface,
      source,
      sessionId: created.visitor.sessionId,
      providerId: created.visitor.providerId,
    },
  }).catch(() => {});

  const leonixHostUrl = `${publicOrigin()}/admin/digital-contact/video/${encodeURIComponent(created.visitor.sessionId)}`;

  await storeVideoSession({
    sessionId: created.visitor.sessionId,
    profileSlug: slug,
    providerId: created.visitor.providerId,
    providerRoomName: created.visitor.sessionId,
    hostProviderJoinUrl: created.host.hostJoinUrl,
    visitorJoinUrl: created.visitor.visitorJoinUrl,
    expiresAt: created.visitor.expiresAt,
    createdAt: now.toISOString(),
  });

  // Best-effort host email notification — NEVER revoke visitor room on notify failure.
  const textBody = [
    `Visitor ${firstName} requested a face-to-face video session.`,
    `Executive: ${profile.fullName} (${slug})`,
    reason ? `Reason: ${reason}` : null,
    `Surface: ${surface}`,
    source ? `Source: ${source}` : null,
    `Session expires: ${created.host.expiresAt}`,
    "",
    `SECURE HOST JOIN (authorized Leonix staff only):`,
    leonixHostUrl,
    "",
    "Sign in to Leonix Admin if prompted. Do not forward this link to visitors.",
    "This is an email notification of a video request — not a phone ring.",
    "No recording. Ephemeral room only.",
  ]
    .filter(Boolean)
    .join("\n");

  void insertDigitalContactAnalyticsEvent({
    profileSlug: slug,
    eventType: "daily_video_notification_attempted",
    meta: { surface, source, sessionId: created.visitor.sessionId, channel: "email" },
  }).catch(() => {});

  const sent = await sendLeonixResendEmail({
    to: profile.email,
    subject:
      lang === "en"
        ? `Leonix — visitor video request (${firstName})`
        : `Leonix — solicitud de video de visitante (${firstName})`,
    text: textBody,
    html: `<p><strong>Visitor video request</strong></p>
<p>This is an email notification — not a phone ring.</p>
<pre style="white-space:pre-wrap;font-family:inherit">${textBody
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>
<p><a href="${leonixHostUrl.replace(/"/g, "")}">Join as host (staff)</a></p>`,
  });

  if (!sent.ok) {
    console.error(
      `[human-connection] host notification failed session=${created.visitor.sessionId} class=${sent.code}`,
    );
    void insertDigitalContactAnalyticsEvent({
      profileSlug: slug,
      eventType: "daily_video_notification_failed",
      meta: {
        surface,
        source,
        sessionId: created.visitor.sessionId,
        channel: "email",
        code: sent.code,
      },
    }).catch(() => {});
  } else {
    void insertDigitalContactAnalyticsEvent({
      profileSlug: slug,
      eventType: "daily_video_notification_sent",
      meta: {
        surface,
        source,
        sessionId: created.visitor.sessionId,
        channel: "email",
      },
    }).catch(() => {});
  }

  void insertDigitalContactAnalyticsEvent({
    profileSlug: slug,
    eventType: "video_session_created",
    meta: {
      surface,
      source,
      sessionId: created.visitor.sessionId,
      providerId: created.visitor.providerId,
      notified: sent.ok,
      notificationChannel: "email",
    },
  }).catch(() => {});

  // Visitor-safe payload only — never host provider URL / tokens.
  return {
    ok: true,
    visitor: created.visitor,
  };
}
