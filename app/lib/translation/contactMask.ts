import type { MaskToken } from "@/app/lib/translation/types";

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/** URLs, maps, WhatsApp deep links — conservative broad match */
const URL_LIKE_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|(?:wa\.me|api\.whatsapp\.com|maps\.google\.com|goo\.gl\/maps)[^\s]*/gi;

/** Digit runs that look like phone fragments (intl, US-ish, local runs). */
const PHONEISH_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b|\+\d{8,15}\b/g;

function nextPlaceholder(index: number): string {
  return `__LEONIX_MASK_${index}__`;
}

/**
 * Replace emails, URL-like strings, and phone-like digit runs with stable placeholders.
 * Use {@link restoreContactSensitiveText} with the returned map after translation.
 */
export function maskContactSensitiveText(input: string): { masked: string; map: MaskToken[] } {
  const map: MaskToken[] = [];
  let i = 0;
  const push = (value: string): string => {
    const placeholder = nextPlaceholder(i++);
    map.push({ placeholder, value });
    return placeholder;
  };

  let masked = input.replace(EMAIL_RE, (m) => push(m));
  masked = masked.replace(URL_LIKE_RE, (m) => push(m));
  masked = masked.replace(PHONEISH_RE, (m) => {
    const digits = m.replace(/\D/g, "");
    if (digits.length < 7) return m;
    return push(m);
  });

  return { masked, map };
}

/** Restore values masked by {@link maskContactSensitiveText}. */
export function restoreContactSensitiveText(masked: string, map: MaskToken[]): string {
  let out = masked;
  for (const { placeholder, value } of map) {
    out = out.split(placeholder).join(value);
  }
  return out;
}
