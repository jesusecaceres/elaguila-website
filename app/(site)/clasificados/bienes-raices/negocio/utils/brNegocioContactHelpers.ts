/**
 * BR negocio publish form: merging platform-specific social inputs into `negocioRedes` for business_meta.
 * Shared with Rentas negocio publish via `PublicarCategoryApplication`.
 */

const SOCIAL_KEYS = [
  "negocioSocialFacebook",
  "negocioSocialInstagram",
  "negocioSocialYoutube",
  "negocioSocialTiktok",
  "negocioSocialWhatsapp",
  "negocioSocialX",
] as const;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

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
