/**
 * BR negocio publish form: office phone formatting, extension, and merging
 * platform-specific social inputs into `negocioRedes` for business_meta.
 */

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** US-style 10-digit display: (XXX) XXX-XXXX */
export function formatUsPhone10(digits: string): string {
  const d = digitsOnly(digits).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const SOCIAL_KEYS = [
  "negocioSocialFacebook",
  "negocioSocialInstagram",
  "negocioSocialYoutube",
  "negocioSocialTiktok",
  "negocioSocialWhatsapp",
  "negocioSocialX",
] as const;

/** Normalize user input to a single URL line (https). WhatsApp accepts phone digits → wa.me */
export function normalizeSocialInputToUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^wa\.me\//i.test(t)) return `https://${t}`;
  const digits = digitsOnly(t);
  if (digits.length >= 10 && /^[\d\s+().\-]+$/.test(t)) {
    return `https://wa.me/${digits.slice(0, 15)}`;
  }
  return `https://${t.replace(/^\/+/, "")}`;
}

/**
 * Build `negocioRedes` string from per-platform detail fields (newline-separated URLs).
 * Ignores empty fields. Used at publish time and for preview.
 */
export function buildNegocioRedesPayload(details: Record<string, string | undefined | null>): string {
  const lines: string[] = [];
  for (const key of SOCIAL_KEYS) {
    const raw = (details[key] ?? "").trim();
    if (!raw) continue;
    try {
      const url = normalizeSocialInputToUrl(raw);
      if (url) lines.push(url);
    } catch {
      /* ignore */
    }
  }
  return lines.join("\n");
}
