/**
 * Package C Build 2 (C4) — browser client helpers for the verified-intro-15% discount.
 * Mirrors revenueCategoryCheckoutClient.ts's auth-token pattern. No Stripe secrets, no
 * eligibility decision made client-side — every call round-trips to the server.
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

async function authHeader(): Promise<Record<string, string> | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export type VerifiedIntroDiscountStatus = {
  ok: boolean;
  eligible: boolean;
  reasonCode: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  smsConfigured: boolean;
};

export async function fetchVerifiedIntroDiscountStatus(input: {
  category: string;
  packageKey: string;
  listingId?: string | null;
}): Promise<VerifiedIntroDiscountStatus | null> {
  const headers = await authHeader();
  if (!headers) return null;
  const params = new URLSearchParams({ category: input.category, packageKey: input.packageKey });
  if (input.listingId) params.set("listingId", input.listingId);
  try {
    const res = await fetch(`/api/verified-intro-discount/status?${params.toString()}`, { headers });
    const j = (await res.json().catch(() => ({}))) as Partial<VerifiedIntroDiscountStatus> & { ok?: boolean };
    if (!res.ok || !j.ok) return null;
    return {
      ok: true,
      eligible: Boolean(j.eligible),
      reasonCode: j.reasonCode ?? null,
      emailVerified: Boolean(j.emailVerified),
      phoneVerified: Boolean(j.phoneVerified),
      smsConfigured: Boolean(j.smsConfigured),
    };
  } catch {
    return null;
  }
}

export type PhoneRequestResult = { ok: true; expiresInSeconds: number } | { ok: false; code: string };

export async function requestPhoneVerification(phoneE164: string): Promise<PhoneRequestResult> {
  const headers = await authHeader();
  if (!headers) return { ok: false, code: "auth_required" };
  try {
    const res = await fetch("/api/verified-intro-discount/phone/request", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ phoneE164 }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; expiresInSeconds?: number; code?: string };
    if (res.ok && j.ok) return { ok: true, expiresInSeconds: j.expiresInSeconds ?? 600 };
    return { ok: false, code: j.code ?? "request_failed" };
  } catch {
    return { ok: false, code: "network_error" };
  }
}

export type PhoneVerifyResult = { ok: true; verified: boolean } | { ok: false; code: string };

export async function verifyPhoneCode(phoneE164: string, code: string): Promise<PhoneVerifyResult> {
  const headers = await authHeader();
  if (!headers) return { ok: false, code: "auth_required" };
  try {
    const res = await fetch("/api/verified-intro-discount/phone/verify", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ phoneE164, code }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; verified?: boolean; code?: string };
    if (res.ok && j.ok) return { ok: true, verified: Boolean(j.verified) };
    return { ok: false, code: j.code ?? "verify_failed" };
  } catch {
    return { ok: false, code: "network_error" };
  }
}
