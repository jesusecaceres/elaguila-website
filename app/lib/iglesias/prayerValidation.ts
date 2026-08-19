import {
  isPrayerCategoryKey,
  isPrayerContactMethod,
  isPrayerLanguage,
  isPrayerVisibility,
  type PrayerCategoryKey,
  type PrayerContactMethod,
  type PrayerLanguage,
  type PrayerVisibility,
} from "./prayerTaxonomy";

export const PRAYER_BODY_MIN = 20;
export const PRAYER_BODY_MAX = 2000;

export type PrayerSubmitInput = {
  body: string;
  visibility: PrayerVisibility;
  language: PrayerLanguage;
  displayName: string | null;
  city: string | null;
  category: PrayerCategoryKey | null;
  contactConsent: boolean;
  preferredContactMethod: PrayerContactMethod | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  targetChurchId: string | null;
};

export type PrayerParseError =
  | "invalid"
  | "body"
  | "visibility"
  | "language"
  | "category"
  | "contact";

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export function normalizePrayerBody(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function isMeaningfulPrayerBody(body: string): boolean {
  const letters = body.replace(/[^\p{L}\p{N}]+/gu, "");
  return letters.length >= 12 && body.length >= PRAYER_BODY_MIN;
}

export function parsePrayerSubmission(
  body: unknown,
): { ok: true; data: PrayerSubmitInput } | { ok: false; error: PrayerParseError } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid" };
  const o = body as Record<string, unknown>;
  if (clean(o.website_extra, 80) || clean(o.company, 80)) return { ok: false, error: "invalid" };

  const text = normalizePrayerBody(clean(o.body, PRAYER_BODY_MAX + 20));
  if (!isMeaningfulPrayerBody(text) || text.length > PRAYER_BODY_MAX) return { ok: false, error: "body" };

  const visibilityRaw = clean(o.visibility, 40);
  if (!isPrayerVisibility(visibilityRaw)) return { ok: false, error: "visibility" };

  const languageRaw = clean(o.language, 8).toLowerCase();
  if (!isPrayerLanguage(languageRaw)) return { ok: false, error: "language" };

  const categoryRaw = clean(o.category, 40).toUpperCase();
  const category = categoryRaw ? (isPrayerCategoryKey(categoryRaw) ? categoryRaw : null) : null;
  if (categoryRaw && !category) return { ok: false, error: "category" };

  const displayNameRaw = clean(o.displayName, 80);
  const displayName =
    visibilityRaw === "PUBLIC_NAMED" && displayNameRaw ? displayNameRaw : null;

  const city = clean(o.city, 80) || null;

  const contactConsent = o.contactConsent === true || o.contactConsent === "true";
  let preferredContactMethod: PrayerContactMethod | null = null;
  let contactEmail: string | null = null;
  let contactPhone: string | null = null;
  let contactWhatsapp: string | null = null;

  if (visibilityRaw === "PRIVATE_PRAYER_TEAM" && contactConsent) {
    const methodRaw = clean(o.preferredContactMethod, 20).toLowerCase();
    if (methodRaw && !isPrayerContactMethod(methodRaw)) return { ok: false, error: "contact" };
    preferredContactMethod = methodRaw ? (methodRaw as PrayerContactMethod) : null;
    const email = clean(o.contactEmail, 200).toLowerCase();
    const phone = clean(o.contactPhone, 40);
    const whatsapp = clean(o.contactWhatsapp, 40);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "contact" };
    contactEmail = email || null;
    contactPhone = phone || null;
    contactWhatsapp = whatsapp || null;
    if (preferredContactMethod === "email" && !contactEmail) return { ok: false, error: "contact" };
    if (preferredContactMethod === "phone" && !contactPhone) return { ok: false, error: "contact" };
    if (preferredContactMethod === "whatsapp" && !contactWhatsapp) return { ok: false, error: "contact" };
  }

  const targetRaw = clean(o.targetChurchId, 40);
  const targetChurchId =
    visibilityRaw === "PRIVATE_PRAYER_TEAM" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRaw)
      ? targetRaw
      : null;

  return {
    ok: true,
    data: {
      body: text,
      visibility: visibilityRaw,
      language: languageRaw,
      displayName,
      city,
      category,
      contactConsent: visibilityRaw === "PRIVATE_PRAYER_TEAM" && contactConsent,
      preferredContactMethod: visibilityRaw === "PRIVATE_PRAYER_TEAM" && contactConsent ? preferredContactMethod : null,
      contactEmail: visibilityRaw === "PRIVATE_PRAYER_TEAM" && contactConsent ? contactEmail : null,
      contactPhone: visibilityRaw === "PRIVATE_PRAYER_TEAM" && contactConsent ? contactPhone : null,
      contactWhatsapp: visibilityRaw === "PRIVATE_PRAYER_TEAM" && contactConsent ? contactWhatsapp : null,
      targetChurchId,
    },
  };
}
