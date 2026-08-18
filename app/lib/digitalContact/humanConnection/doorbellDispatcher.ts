import "server-only";

/**
 * Build 12 — Digital doorbell notification dispatcher.
 * ECP owns executive identity. Never hardcode a specific executive slug in generic paths.
 *
 * PRIMARY: Web Push to enrolled staff devices
 * SECONDARY: Resend email (existing)
 * FUTURE: SMS seam only — not implemented / no paid provider
 */

import webpush from "web-push";
import { getDigitalContactProfile } from "../digitalContactRegistry";
import { insertDigitalContactAnalyticsEvent } from "../digitalContactOpsTablesServer";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { getWebPushVapidConfig, isWebPushConfigured } from "./webPushConfig";
import {
  deactivatePushSubscription,
  listActivePushSubscriptions,
  markPushDeliveryResult,
} from "./pushSubscriptionStore";

export type DoorbellDispatchInput = {
  executiveSlug: string;
  sessionId: string;
  visitorFirstName: string;
  lang: "es" | "en";
  surface: string;
  source?: string | null;
  /** When true, send labeled test payload (no Daily session required). */
  test?: boolean;
};

export type DoorbellDispatchResult = {
  pushAttempted: boolean;
  pushSucceeded: number;
  pushFailed: number;
  emailAttempted: boolean;
  emailSucceeded: boolean;
  anySucceeded: boolean;
  answerPath: string;
};

function publicOrigin(): string {
  const fromEnv = String(process.env.HUMAN_CONNECTION_PUBLIC_ORIGIN ?? "").trim().replace(/\/$/, "");
  if (fromEnv.startsWith("https://") || fromEnv.startsWith("http://")) return fromEnv;
  return LEONIX_SITE_ORIGIN;
}

/** Future SMS escalation seam — intentionally unimplemented in V1. */
export type SmsDoorbellEscalation = {
  send(_input: { toDigits: string; body: string }): Promise<{ ok: false; error: "sms_not_configured" }>;
};

export const smsDoorbellEscalation: SmsDoorbellEscalation = {
  async send() {
    return { ok: false, error: "sms_not_configured" };
  },
};

export async function dispatchDigitalContactDoorbell(
  input: DoorbellDispatchInput,
): Promise<DoorbellDispatchResult> {
  const slug = String(input.executiveSlug ?? "")
    .trim()
    .toLowerCase();
  const profile = getDigitalContactProfile(slug);
  const origin = publicOrigin();
  const answerPath = input.test
    ? `/admin/digital-contact/doorbell`
    : `/admin/digital-contact/video/${encodeURIComponent(input.sessionId)}`;
  const answerUrl = `${origin}${answerPath}`;

  const result: DoorbellDispatchResult = {
    pushAttempted: false,
    pushSucceeded: 0,
    pushFailed: 0,
    emailAttempted: false,
    emailSucceeded: false,
    anySucceeded: false,
    answerPath,
  };

  if (!profile) {
    return result;
  }

  const isEs = input.lang !== "en";
  const title = input.test
    ? isEs
      ? "Leonix — Prueba de timbre"
      : "Leonix — Doorbell test"
    : isEs
      ? "Leonix — Visitante en recepción"
      : "Leonix — Visitor at the front desk";
  const body = input.test
    ? isEs
      ? "Las notificaciones del timbre están funcionando."
      : "Doorbell notifications are working."
    : isEs
      ? "Alguien solicita una videollamada."
      : "Someone is requesting a video call.";

  // Safe payload only — never host Daily token / API keys / visitor PII beyond first name in email.
  const pushPayload = {
    type: "digital_contact_doorbell",
    executiveSlug: slug,
    sessionId: input.test ? null : input.sessionId,
    title,
    body,
    answerPath,
    test: Boolean(input.test),
  };

  const vapid = getWebPushVapidConfig();
  if (vapid && isWebPushConfigured()) {
    result.pushAttempted = true;
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    const subs = await listActivePushSubscriptions(slug);
    void insertDigitalContactAnalyticsEvent({
      profileSlug: slug,
      eventType: input.test ? "doorbell_test_requested" : "doorbell_push_dispatch_attempted",
      meta: {
        surface: input.surface,
        source: input.source ?? null,
        sessionId: input.test ? null : input.sessionId,
        deviceCount: subs.length,
      },
    }).catch(() => {});

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(pushPayload),
          { TTL: 60 * 30, urgency: "high" },
        );
        result.pushSucceeded += 1;
        await markPushDeliveryResult({ id: sub.id, ok: true });
        void insertDigitalContactAnalyticsEvent({
          profileSlug: slug,
          eventType: "doorbell_push_dispatch_succeeded",
          meta: { surface: input.surface, subscriptionId: sub.id, test: Boolean(input.test) },
        }).catch(() => {});
      } catch (e) {
        result.pushFailed += 1;
        await markPushDeliveryResult({ id: sub.id, ok: false });
        const statusCode =
          e && typeof e === "object" && "statusCode" in e ? Number((e as { statusCode?: number }).statusCode) : 0;
        // Gone / expired subscription
        if (statusCode === 404 || statusCode === 410) {
          await deactivatePushSubscription({ id: sub.id, executiveSlug: slug });
        }
        console.error(
          `[doorbell] push failed slug=${slug} status=${statusCode || "unknown"}`,
        );
        void insertDigitalContactAnalyticsEvent({
          profileSlug: slug,
          eventType: "doorbell_push_dispatch_failed",
          meta: { surface: input.surface, subscriptionId: sub.id, statusCode, test: Boolean(input.test) },
        }).catch(() => {});
      }
    }
  }

  // Resend email fallback / secondary (not for pure test-only if we still want email on test — skip email for test)
  if (!input.test) {
    result.emailAttempted = true;
    const textBody = [
      `Visitor ${input.visitorFirstName} requested a face-to-face video session.`,
      `Executive: ${profile.fullName} (${slug})`,
      `Surface: ${input.surface}`,
      input.source ? `Source: ${input.source}` : null,
      "",
      `SECURE HOST JOIN (authorized Leonix staff only):`,
      answerUrl,
      "",
      "This is an email notification of a video request — not a phone ring.",
      "Prefer the Leonix PWA doorbell notification when enrolled.",
      "Sign in to Leonix Admin if prompted. Do not forward this link to visitors.",
      "No recording. Ephemeral room only.",
    ]
      .filter(Boolean)
      .join("\n");

    const sent = await sendLeonixResendEmail({
      to: profile.email,
      subject: isEs
        ? `Leonix — solicitud de video de visitante (${input.visitorFirstName})`
        : `Leonix — visitor video request (${input.visitorFirstName})`,
      text: textBody,
      html: `<p><strong>Visitor video request</strong></p>
<p>This is an email notification — not a phone ring.</p>
<pre style="white-space:pre-wrap;font-family:inherit">${textBody
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>
<p><a href="${answerUrl.replace(/"/g, "")}">Join as host (staff)</a></p>`,
    });
    result.emailSucceeded = sent.ok;
    if (!sent.ok) {
      console.error(`[doorbell] email notification failed slug=${slug} class=${sent.code}`);
    }
  }

  result.anySucceeded = result.pushSucceeded > 0 || result.emailSucceeded;
  return result;
}
