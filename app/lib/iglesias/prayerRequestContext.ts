import { cookies } from "next/headers";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  hashPrayerIp,
  hashPrayerToken,
  newPrayerOwnerToken,
  parsePrayerOwnerCookie,
  PRAYER_OWNER_COOKIE,
  clientIpFromRequest,
} from "./prayerSession";

export const prayerOwnerCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
  secure: process.env.NODE_ENV === "production",
};

export async function readPrayerOwnerFromCookies(): Promise<{
  token: string | null;
  sessionHash: string | null;
}> {
  const store = await cookies();
  const token = parsePrayerOwnerCookie(store.get(PRAYER_OWNER_COOKIE)?.value);
  return { token, sessionHash: token ? hashPrayerToken(token) : null };
}

export function ensurePrayerOwnerToken(existing: string | null): { token: string; sessionHash: string; isNew: boolean } {
  if (existing) return { token: existing, sessionHash: hashPrayerToken(existing), isNew: false };
  const token = newPrayerOwnerToken();
  return { token, sessionHash: hashPrayerToken(token), isNew: true };
}

export async function optionalUserIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || !isSupabaseAdminConfigured()) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const { data } = await getAdminSupabase().auth.getUser(token);
  return data.user?.id ?? null;
}

export function hashedIpFromRequest(req: Request): string | null {
  const ip = clientIpFromRequest(req);
  return ip ? hashPrayerIp(ip) : null;
}

export function rateLimitKey(sessionHash: string, ipHash: string | null): string {
  return `${sessionHash}:${ipHash ?? "noip"}`;
}
