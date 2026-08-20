import { createHash, randomBytes } from "node:crypto";

export const PRAYER_OWNER_COOKIE = "lx_iglesias_prayer_owner";

export function hashPrayerToken(token: string): string {
  return createHash("sha256").update(`iglesias-prayer-v1:${token}`).digest("hex");
}

export function hashPrayerIp(ip: string): string {
  return createHash("sha256").update(`iglesias-prayer-ip-v1:${ip}`).digest("hex");
}

export function newPrayerOwnerToken(): string {
  return randomBytes(32).toString("hex");
}

export function parsePrayerOwnerCookie(raw: string | undefined | null): string | null {
  const token = (raw ?? "").trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  return token;
}

export function clientIpFromRequest(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  const real = req.headers.get("x-real-ip")?.trim();
  return real || null;
}
