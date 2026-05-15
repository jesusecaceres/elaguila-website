import { getCleanPhone, normalizeExternalUrl } from "./ctaDataHelpers";

function trim(s: string | null | undefined): string {
  return String(s ?? "").trim();
}

function telHrefFromPhone(phone: string): string | null {
  const raw = trim(phone);
  if (!raw) return null;
  if (/^tel:/i.test(raw)) return raw;
  const digits = getCleanPhone(raw);
  if (!digits) return null;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:+${digits}`;
}

export function openTel(phone: string): void {
  if (typeof window === "undefined") return;
  const href = telHrefFromPhone(phone);
  if (!href) return;
  window.location.href = href;
}

export function openSms(phone: string, body: string): void {
  if (typeof window === "undefined") return;
  const digits = getCleanPhone(phone);
  if (digits.length < 8) return;
  const b = trim(body);
  const base = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : digits;
  const href = b ? `sms:${base}?body=${encodeURIComponent(b)}` : `sms:${base}`;
  window.location.href = href;
}

/** SMS/Messages with prefilled body only (no recipient). Common on mobile (`sms:?body=`). */
export function openSmsShareComposer(body: string): void {
  if (typeof window === "undefined") return;
  const b = trim(body);
  if (!b) return;
  window.location.href = `sms:?body=${encodeURIComponent(b)}`;
}

export function openWhatsApp(phone: string, body: string): void {
  if (typeof window === "undefined") return;
  const digits = getCleanPhone(phone);
  if (digits.length < 8) return;
  const b = trim(body);
  const url = b
    ? `https://wa.me/${digits}?text=${encodeURIComponent(b)}`
    : `https://wa.me/${digits}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openMailto(email: string, subject: string, body: string): void {
  if (typeof window === "undefined") return;
  const em = trim(email);
  const sub = trim(subject);
  const bod = trim(body);
  const q = new URLSearchParams();
  if (sub) q.set("subject", sub);
  if (bod) q.set("body", bod);
  const qs = q.toString();
  if (em) {
    window.location.href = qs ? `mailto:${em}?${qs}` : `mailto:${em}`;
  } else {
    window.location.href = qs ? `mailto:?${qs}` : "mailto:";
  }
}

export function openExternalUrl(url: string): void {
  if (typeof window === "undefined") return;
  const n = normalizeExternalUrl(url);
  if (!n) return;
  window.open(n, "_blank", "noopener,noreferrer");
}

export function openMaps(addressOrUrl: string): void {
  if (typeof window === "undefined") return;
  const raw = trim(addressOrUrl);
  if (!raw) return;
  if (/^https?:\/\//i.test(raw)) {
    window.open(raw, "_blank", "noopener,noreferrer");
    return;
  }
  const q = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
  window.open(q, "_blank", "noopener,noreferrer");
}

/** `wa.me/?text=` composer — use only after explicit confirmation (e.g. CtaActionSheet). */
export function openWhatsAppWebShare(text: string): void {
  if (typeof window === "undefined") return;
  const b = trim(text);
  if (!b) return;
  const url = `https://wa.me/?text=${encodeURIComponent(b)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openFacebookShareLink(canonicalUrl: string): void {
  if (typeof window === "undefined") return;
  const u = trim(canonicalUrl);
  if (!u) return;
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openTwitterShareLink(text: string, listingUrl: string): void {
  if (typeof window === "undefined") return;
  const te = trim(text);
  const u = trim(listingUrl);
  if (!u && !te) return;
  const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(te)}&url=${encodeURIComponent(u)}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export type WebSharePayload = { title?: string; text?: string; url?: string };

/**
 * `navigator.share` wrapper for CTA sheets. Abort/cancel is not an error.
 * @returns whether the user completed a share, cancelled, or the capability is missing/failed.
 */
export async function tryWebShare(payload: WebSharePayload): Promise<"shared" | "aborted" | "unsupported"> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  const data: ShareData = {};
  if (trim(payload.title)) data.title = trim(payload.title);
  if (trim(payload.text)) data.text = trim(payload.text);
  if (trim(payload.url)) data.url = trim(payload.url);
  if (!data.title && !data.text && !data.url) return "unsupported";
  try {
    await navigator.share(data);
    return "shared";
  } catch (err: unknown) {
    const n = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : "";
    if (n === "AbortError") return "aborted";
    return "unsupported";
  }
}
