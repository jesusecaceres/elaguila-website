/**
 * Resolves Servicios public-lead email recipients and Resend readiness.
 * Intended for server routes / RSC only (uses service-role Supabase for owner email fallback).
 */
import type { ServiciosBusinessProfile } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { getAdminSupabase } from "@/app/lib/supabase/server";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

/** Extract first address from `mailto:user@host` (ignores query). */
export function parseEmailFromMailtoHref(mailto: string | undefined | null): string | null {
  const h = (mailto ?? "").trim();
  if (!h.toLowerCase().startsWith("mailto:")) return null;
  try {
    const raw = decodeURIComponent(h.slice(7).split(/[?#]/)[0] ?? "").trim();
    return isEmail(raw) ? raw.slice(0, 320) : null;
  } catch {
    const raw = (h.slice(7).split(/[?#]/)[0] ?? "").trim();
    return isEmail(raw) ? raw.slice(0, 320) : null;
  }
}

/** True when Resend + From are configured (same rules as {@link sendLeonixResendEmail}). */
export function isServiciosLeadResendConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.LEONIX_RESEND_FROM?.trim() || process.env.TIENDA_ORDER_EMAIL_FROM?.trim();
  return Boolean(apiKey && from);
}

/**
 * Business recipient for Servicios public lead email (priority: listing contact email → auth owner email).
 * Does not use implicit admin fallbacks.
 */
export async function resolveServiciosLeadBusinessNotifyEmail(
  profile: ServiciosBusinessProfile,
  ownerUserId: string | null | undefined,
): Promise<string | null> {
  const fromContact = profile.contact?.email?.trim();
  if (fromContact && isEmail(fromContact)) return fromContact.slice(0, 320);

  const owner = (ownerUserId ?? "").trim();
  if (owner && isUuid(owner)) {
    try {
      const admin = getAdminSupabase();
      const { data, error } = await admin.auth.admin.getUserById(owner);
      const em = data?.user?.email?.trim();
      if (!error && em && isEmail(em)) return em.slice(0, 320);
    } catch {
      /* ignore */
    }
  }

  return null;
}

/** Public vitrina: only show the lead form when we can actually email the business. */
export async function shouldShowServiciosPublicLeadInquiryForm(
  profile: ServiciosBusinessProfile,
  ownerUserId: string | null | undefined,
): Promise<boolean> {
  if (!isServiciosLeadResendConfigured()) return false;
  const to = await resolveServiciosLeadBusinessNotifyEmail(profile, ownerUserId);
  return Boolean(to);
}
