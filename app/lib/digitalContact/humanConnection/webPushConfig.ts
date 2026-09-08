import "server-only";

/**
 * Web Push / VAPID configuration (Build 12).
 * Private key is server-only — never expose via NEXT_PUBLIC_* or client bundles.
 */

export type WebPushVapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function getWebPushVapidConfig(): WebPushVapidConfig | null {
  const publicKey = String(process.env.WEB_PUSH_VAPID_PUBLIC_KEY ?? "").trim();
  const privateKey = String(process.env.WEB_PUSH_VAPID_PRIVATE_KEY ?? "").trim();
  const subjectRaw = String(process.env.WEB_PUSH_SUBJECT ?? "mailto:chuy@leonixmedia.com").trim();
  if (!publicKey || !privateKey) return null;
  if (privateKey.length < 20) return null;
  const subject =
    subjectRaw.startsWith("mailto:") || subjectRaw.startsWith("https://")
      ? subjectRaw
      : `mailto:${subjectRaw}`;
  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured(): boolean {
  return getWebPushVapidConfig() != null;
}

/** Public-safe VAPID public key for authenticated enrollment clients. */
export function getWebPushPublicKey(): string | null {
  return getWebPushVapidConfig()?.publicKey ?? null;
}
