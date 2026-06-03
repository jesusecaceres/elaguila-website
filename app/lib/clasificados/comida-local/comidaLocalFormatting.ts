/**
 * Comida Local contact formatting — mirrors safe En Venta phone patterns; no Restaurante imports.
 */

import type { ComidaLocalSocialPlatform } from "./comidaLocalTypes";
import {
  enVentaContactDigits,
  enVentaPhoneInputDigits,
  formatEnVentaPhoneInput,
} from "@/app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay";

export function formatComidaLocalPhoneInput(raw: string): string {
  return formatEnVentaPhoneInput(raw);
}

export function normalizeComidaLocalPhoneDigits(raw: string): string {
  return enVentaPhoneInputDigits(raw);
}

export function buildComidaLocalTelHref(phone: string): string {
  const digits = enVentaContactDigits(phone);
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  const trimmed = phone.trim();
  return trimmed ? `tel:${trimmed}` : "";
}

export function buildComidaLocalSmsHref(phone: string, body?: string): string {
  const digits = enVentaContactDigits(phone);
  if (digits.length < 10) return "";
  const dest =
    digits.length === 10
      ? `+1${digits}`
      : digits.startsWith("1") && digits.length === 11
        ? `+${digits}`
        : digits;
  const base = `sms:${dest}`;
  if (body?.trim()) return `${base}?body=${encodeURIComponent(body.trim())}`;
  return base;
}

const COMIDA_LOCAL_WA_PREFILL_ES =
  "Hola, vi tu puesto de comida en Leonix Media. Me gustaría recibir más información, por favor.";

export function buildComidaLocalWhatsAppHref(
  raw: string,
  businessName?: string
): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const name = (businessName ?? "").trim();
  const text = encodeURIComponent(
    name
      ? `Hola, vi ${name} en Leonix Media. Me gustaría recibir más información, por favor.`
      : COMIDA_LOCAL_WA_PREFILL_ES
  );
  return `https://wa.me/${digits}?text=${text}`;
}

function stripWww(host: string): string {
  let h = host.toLowerCase();
  while (h.startsWith("www.")) h = h.slice(4);
  return h;
}

function hostAllowedForPlatform(hostname: string, platform: ComidaLocalSocialPlatform): boolean {
  const h = stripWww(hostname);
  switch (platform) {
    case "facebook":
      return h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.com" || h.endsWith(".fb.com");
    case "instagram":
      return h === "instagram.com" || h.endsWith(".instagram.com");
    case "tiktok":
      return h === "tiktok.com" || h.endsWith(".tiktok.com");
    default:
      return false;
  }
}

export function isValidComidaLocalExternalUrl(raw: string | undefined): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize social input for a platform; returns null if empty or invalid.
 */
export function normalizeComidaLocalSocialInput(
  raw: string,
  platform: ComidaLocalSocialPlatform
): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;

  if (!t.includes(".") && !t.includes("/")) {
    const handle = t.replace(/^@+/, "");
    if (!handle) return null;
    switch (platform) {
      case "instagram":
        return `https://www.instagram.com/${handle}/`;
      case "facebook":
        return `https://www.facebook.com/${handle}`;
      case "tiktok":
        return `https://www.tiktok.com/@${handle}`;
      default:
        return null;
    }
  }

  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!hostAllowedForPlatform(u.hostname, platform)) return null;
    return u.href;
  } catch {
    return null;
  }
}
