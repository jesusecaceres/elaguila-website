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
 * Static Google Meet links are NOT treated as live availability / ringing calls.
 * Permanent links alone do not unlock "available now" or "Chuy is being notified."
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

/**
 * Microsoft Teams meeting destinations only (HTTPS).
 * Rejects arbitrary hosts and javascript: schemes.
 */
export function validateMicrosoftTeamsUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 800) return null;
  if (BLOCKED_SCHEMES.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    const allowed =
      host === "teams.microsoft.com" ||
      host.endsWith(".teams.microsoft.com") ||
      host === "teams.live.com" ||
      host.endsWith(".teams.live.com");
    if (!allowed) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Facebook Messenger public destinations only (HTTPS).
 * Accepts m.me, messenger.com, and facebook.com/messages paths.
 */
export function validateMessengerUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 800) return null;
  if (BLOCKED_SCHEMES.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "m.me" || host.endsWith(".m.me")) return u.toString();
    if (host === "messenger.com" || host.endsWith(".messenger.com")) return u.toString();
    if (host === "facebook.com" || host.endsWith(".facebook.com")) {
      const path = u.pathname.toLowerCase();
      if (path.startsWith("/messages") || path.startsWith("/msg")) return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Instagram public destinations only (HTTPS profile or ig.me message links).
 * Do not invent handles — owner must supply the approved URL.
 */
export function validateInstagramUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 800) return null;
  if (BLOCKED_SCHEMES.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "instagram.com" || host.endsWith(".instagram.com")) return u.toString();
    if (host === "ig.me" || host.endsWith(".ig.me")) return u.toString();
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
