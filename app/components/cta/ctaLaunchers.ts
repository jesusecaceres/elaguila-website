import { normalizeExternalUrl } from "./ctaDataHelpers";
import {
  buildMailtoHref,
  buildSmsHref,
  buildTelHref,
  buildWhatsAppUrl,
} from "@/app/lib/digitalContact/humanConnection/nativeChannelHrefs";

function trim(s: string | null | undefined): string {
  return String(s ?? "").trim();
}

export function openTel(phone: string): void {
  if (typeof window === "undefined") return;
  const href = buildTelHref(phone);
  if (!href) return;
  window.location.href = href;
}

export function openSms(phone: string, body: string): void {
  if (typeof window === "undefined") return;
  const href = buildSmsHref(phone, body);
  if (!href) return;
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
  const url = buildWhatsAppUrl(phone, body);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openMailto(email: string, subject: string, body: string): void {
  if (typeof window === "undefined") return;
  const href = buildMailtoHref(email, subject, body);
  if (!href) {
    // Composer-only fallback when no approved recipient (share flows).
    const sub = trim(subject);
    const bod = trim(body);
    const q = new URLSearchParams();
    if (sub) q.set("subject", sub);
    if (bod) q.set("body", bod);
    const qs = q.toString();
    window.location.href = qs ? `mailto:?${qs}` : "mailto:";
    return;
  }
  window.location.href = href;
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

/**
 * Global Business Hub OS — shared clipboard helper. New call sites only; the ~40 existing
 * standalone `navigator.clipboard.writeText` implementations across the app are intentionally left
 * untouched (out of scope broad refactor).
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
    return false;
  }
  const v = trim(value);
  if (!v) return false;
  try {
    await navigator.clipboard.writeText(v);
    return true;
  } catch {
    return false;
  }
}
