/**
 * Safe destination validation for Human Connection channels.
 * Fail closed on untrusted schemes / open redirects.
 */

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;

export function isSafeHttpUrl(raw: string): boolean {
  const s = String(raw ?? "").trim();
  if (!s || BLOCKED_SCHEMES.test(s)) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Approved FaceTime destinations only.
 * Accepts facetime: / facetime-audio: schemes or https://facetime.apple.com links.
 * Rejects arbitrary http hosts and javascript:.
 */
export function validateFacetimeDestination(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 500) return null;
  if (BLOCKED_SCHEMES.test(s)) return null;

  if (/^facetime(-audio)?:/i.test(s)) {
    // Require a non-empty target after the scheme (email/phone/opaque id configured by owner).
    const rest = s.replace(/^facetime(-audio)?:/i, "").trim();
    if (!rest || rest.length < 3) return null;
    return s;
  }

  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (host === "facetime.apple.com" || host.endsWith(".facetime.apple.com")) {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Static Google Meet links are NOT treated as live availability.
 * Validation exists for future managed/direct config — permanent links alone do not unlock "available now."
 */
export function validateGoogleMeetUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 500) return null;
  if (BLOCKED_SCHEMES.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (host === "meet.google.com" || host.endsWith(".meet.google.com")) {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function isValidPublicPhoneDigits(digits: string | null | undefined): boolean {
  const d = String(digits ?? "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15;
}

export function isValidPublicEmail(email: string | null | undefined): boolean {
  const e = String(email ?? "").trim();
  if (!e || e.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
