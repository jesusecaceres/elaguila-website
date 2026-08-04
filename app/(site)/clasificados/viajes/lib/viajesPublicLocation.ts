import type { ViajesStructuredAddress } from "./v2/viajesOfferModelV2";

/**
 * Production geography lock: local San José departure/hub labels must be California (SJC),
 * never Costa Rica (SJO). Destination labels like "Costa Rica" alone are unchanged.
 */
export function normalizeViajesSanJoseCaliforniaLabel(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value) return value;

  const next = value
    .replace(/san\s*jos[eé]\s*\(sjo\)/gi, "San José, California (SJC)")
    .replace(/san\s*jos[eé],?\s*costa\s*rica/gi, "San José, California (SJC)")
    .replace(/\by\s+sjo\b/gi, "y SJC")
    .replace(/\bsjo\b/gi, "SJC");

  const lower = next.toLowerCase();
  if (/san\s*jos[eé]/.test(lower) && /costa\s*rica/.test(lower)) {
    return "San José, California (SJC)";
  }
  return next;
}

/** Public label for a structured address only when showPublicly is true. Never exposes privateExact. */
export function viajesPublicAddressLabel(addr: ViajesStructuredAddress | undefined | null): string {
  if (!addr || !addr.showPublicly) return "";
  const label = addr.publicLabel.trim();
  if (label) return normalizeViajesSanJoseCaliforniaLabel(label);
  const parts = [addr.street, addr.unit, addr.city, addr.stateRegion, addr.postalCode, addr.country]
    .map((x) => x.trim())
    .filter(Boolean);
  return normalizeViajesSanJoseCaliforniaLabel(parts.join(", "));
}

export function viajesCanShowPublicMap(addr: ViajesStructuredAddress | undefined | null): boolean {
  if (!addr) return false;
  return addr.showPublicly === true && addr.showMap === true && viajesPublicAddressLabel(addr).length > 0;
}

export function viajesPublicMapQuery(addr: ViajesStructuredAddress): string {
  return encodeURIComponent(viajesPublicAddressLabel(addr));
}
