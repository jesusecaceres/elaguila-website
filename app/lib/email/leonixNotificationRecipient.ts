import "server-only";

import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";

/**
 * Internal team inbox for lead / launch notification emails.
 * Override in Vercel: LEONIX_NOTIFICATION_EMAIL (defaults to info@leonixmedia.com).
 */
export function resolveLeonixNotificationEmail(): string {
  const fromEnv = process.env.LEONIX_NOTIFICATION_EMAIL?.trim();
  return fromEnv || LEONIX_GLOBAL_EMAIL;
}
