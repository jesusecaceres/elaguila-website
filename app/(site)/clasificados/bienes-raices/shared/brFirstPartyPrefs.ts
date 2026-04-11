/**
 * First-party BR preferences (device localStorage). No third-party data flows.
 * Optional memory (city, filters) only after functional consent — see `BienesRaicesBrConsentStrip`.
 */

const CONSENT_KEY = "lx_br_consent_v1";
const LAST_CITY_KEY = "lx_br_last_city";

export type BrStoredConsent = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

export function readBrConsent(): BrStoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<BrStoredConsent>;
    if (typeof v.functional !== "boolean" || typeof v.analytics !== "boolean") return null;
    return { necessary: true, functional: v.functional, analytics: v.analytics };
  } catch {
    return null;
  }
}

export function writeBrConsent(c: BrStoredConsent): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
}

export function canUseFunctionalMemory(): boolean {
  return readBrConsent()?.functional === true;
}

export function getBrLastCity(): string {
  if (!canUseFunctionalMemory()) return "";
  try {
    return localStorage.getItem(LAST_CITY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setBrLastCity(city: string): void {
  if (!canUseFunctionalMemory() || typeof window === "undefined") return;
  const t = city.trim();
  if (!t) localStorage.removeItem(LAST_CITY_KEY);
  else localStorage.setItem(LAST_CITY_KEY, t);
}
