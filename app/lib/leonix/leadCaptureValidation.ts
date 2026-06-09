export type LeadLang = "es" | "en";

export type PreferredLanguage = "es" | "en" | "both";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LEAD_LIMITS = {
  email: 320,
  name: 200,
  city: 120,
  zipCode: 20,
  interests: 2000,
  phone: 48,
  business: 200,
  message: 12000,
  source: 64,
  sourcePage: 120,
  sourceCta: 64,
  cityArea: 120,
  websiteOrSocial: 300,
  businessCategory: 120,
} as const;

export function normalizeLeadEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, LEAD_LIMITS.email);
}

export function isValidLeadEmail(email: string): boolean {
  return email.length > 0 && EMAIL_RE.test(email);
}

export function parseLeadLang(value: unknown): LeadLang {
  return value === "en" ? "en" : "es";
}

export function parsePreferredLanguage(value: unknown): PreferredLanguage {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "en" || v === "both") return v;
  return "es";
}

export function sanitizeLeadSource(raw: unknown, fallback: string): string {
  const t = String(raw ?? "")
    .trim()
    .slice(0, LEAD_LIMITS.source);
  if (!t) return fallback;
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(t)) return fallback;
  return t;
}

export function trimField(raw: unknown, max: number): string {
  return String(raw ?? "")
    .trim()
    .slice(0, max);
}
