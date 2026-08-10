import "server-only";

/**
 * Server-controlled immediate-video kill switch (Build 04B).
 *
 * HUMAN_CONNECTION_VIDEO_ENABLED=false|0|off|no → video refused (CTA + API).
 * Unset or true → allowed only if provider + eligibility + notification still pass.
 *
 * Never rely on hiding a React button alone — callers must enforce this server-side.
 */
export function isHumanConnectionVideoEnabled(): boolean {
  const raw = String(process.env.HUMAN_CONNECTION_VIDEO_ENABLED ?? "true")
    .trim()
    .toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off" || raw === "no") return false;
  return true;
}

/**
 * Staff notification channel readiness for human-answer path.
 * Without a deliverable notify path, immediate video must remain disabled.
 */
export function isHumanConnectionNotificationReady(): boolean {
  return Boolean(String(process.env.RESEND_API_KEY ?? "").trim());
}
