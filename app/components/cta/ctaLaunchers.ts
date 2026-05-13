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
  if (!em) return;
  const sub = trim(subject);
  const bod = trim(body);
  const q = new URLSearchParams();
  if (sub) q.set("subject", sub);
  if (bod) q.set("body", bod);
  const qs = q.toString();
  const href = qs ? `mailto:${em}?${qs}` : `mailto:${em}`;
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
