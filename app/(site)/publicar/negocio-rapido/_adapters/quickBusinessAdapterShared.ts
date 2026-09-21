/**
 * Shared helpers for the Quick Business adapters — the business contact step (phone / WhatsApp / email /
 * website), the "days + open/close" hours step, and small value readers. Adapters (not the framework) import
 * canonical taxonomies, so the app/lib → app/(site) dependency direction stays intact.
 */

import { QUICK_BUSINESS_COPY, QUICK_BUSINESS_DAY_LABELS } from "@/app/lib/quickBusiness/quickBusinessCopy";
import type { QuickClassifiedFieldDefinition, QuickIntakeStep, QuickIntakeValues, QuickText } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickList, quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { isIdentityRole } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";

export const BUSINESS_DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type BusinessDayKey = (typeof BUSINESS_DAY_ORDER)[number];

// Bible §10.1: at least one of Phone/SMS/WhatsApp required. Email/website cannot satisfy this.
export const BUSINESS_CONTACT_AT_LEAST_ONE: QuickText = {
  es: "Se requiere al menos un número de teléfono, SMS o WhatsApp.",
  en: "At least one phone, SMS, or WhatsApp number is required.",
};

/** Contact step shared by the business categories — keys map 1:1 onto each canonical draft's own contact fields. */
export function businessContactStep(intro?: QuickText): QuickIntakeStep {
  const fields: QuickClassifiedFieldDefinition[] = [
    { key: "phone", kind: "phone", label: { es: "Teléfono", en: "Phone" }, placeholder: { es: "(408) 555-0123", en: "(408) 555-0123" }, autoComplete: "tel", inputMode: "tel" },
    // Bible §10.1: SMS is a separate explicit field — cannot be derived from phone automatically.
    { key: "sms", kind: "phone", label: { es: "SMS / mensajes de texto", en: "SMS / text messages" }, hint: { es: "Número para mensajes de texto (si es distinto al teléfono).", en: "Number for text messages (if different from your phone)." }, inputMode: "tel" },
    { key: "whatsapp", kind: "phone", label: { es: "WhatsApp", en: "WhatsApp" }, hint: { es: "Si es el mismo número, escríbelo también aquí.", en: "If it is the same number, enter it here too." }, inputMode: "tel" },
    { key: "email", kind: "email", label: { es: "Correo electrónico", en: "Email" }, autoComplete: "email", inputMode: "email" },
    { key: "website", kind: "text", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, placeholder: { es: "https://…", en: "https://…" }, autoComplete: "url", maxLength: 200 },
  ];
  return {
    id: "contact",
    title: { es: "¿Cómo te contactan los clientes?", en: "How do customers reach you?" },
    intro: intro ?? { es: "Solo se muestra lo que escribas aquí.", en: "Only what you enter here is shown." },
    fields,
    // Bible §10.1: email and website cannot satisfy the direct-contact minimum; SMS is independent of phone.
    atLeastOne: { keys: ["phone", "sms", "whatsapp"], message: BUSINESS_CONTACT_AT_LEAST_ONE },
  };
}

/** Hours fields: days chips (≥ 1) + open / close times. Asked truthfully instead of publishing a default schedule. */
export function businessHoursFields(): QuickClassifiedFieldDefinition[] {
  return [
    {
      key: "hoursDays",
      kind: "chips",
      label: QUICK_BUSINESS_COPY.hoursDays,
      hint: QUICK_BUSINESS_COPY.hoursHint,
      required: true,
      options: BUSINESS_DAY_ORDER.map((d) => ({ value: d, label: QUICK_BUSINESS_DAY_LABELS[d] })),
    },
    { key: "hoursOpen", kind: "time", label: QUICK_BUSINESS_COPY.hoursOpen, required: true },
    { key: "hoursClose", kind: "time", label: QUICK_BUSINESS_COPY.hoursClose, required: true },
  ];
}

export type BusinessHoursInput = { days: Set<BusinessDayKey>; open: string; close: string };

export function readBusinessHours(values: QuickIntakeValues): BusinessHoursInput {
  const days = new Set<BusinessDayKey>(quickList(values, "hoursDays").filter((d): d is BusinessDayKey => (BUSINESS_DAY_ORDER as readonly string[]).includes(d)));
  return { days, open: quickStr(values, "hoursOpen"), close: quickStr(values, "hoursClose") };
}

/** "a, b; c" / newline-separated free text → trimmed unique list (normalization at the adapter boundary only). */
export function splitFreeTextList(raw: string, max = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(/[,;\n]+/)) {
    const t = part.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

export function optionsFromKeyLabel(list: readonly { key: string; labelEs: string }[], labelEn: (key: string) => string) {
  return list.map((o) => ({ value: o.key, label: { es: o.labelEs, en: labelEn(o.key) } }));
}

/**
 * Gate QB-MEDIA-03 — the producer half of the semantic media contract.
 *
 * Every Quick Business photo arrives carrying an explicit role. These two helpers are the only
 * way an adapter is allowed to turn that role into canonical media, so the same two rules hold in
 * all four families:
 *
 *  1. IDENTITY ASSETS NEVER ENTER THE GALLERY. A dealer logo, a brokerage logo and an agent
 *     headshot are legitimate uploads and legitimate identity fields, but they are not photos of
 *     the thing being sold. Keeping them out of the canonical gallery is what makes the server's
 *     "a logo can never satisfy the vehicle requirement" refusal structurally true rather than a
 *     claim: there is no path by which one reaches the subject slot.
 *  2. THE DECLARED ROLE TRAVELS WITH THE PHOTO wherever the canonical shape can carry it, so the
 *     server re-runs the same contract on what actually arrives instead of trusting the browser.
 */
export function galleryMediaOnly<T extends { role: string }>(media: readonly T[]): T[] {
  return media.filter((m) => !isIdentityRole(m.role));
}

/** Declared role per image source (url / data URL), for canonical shapes that carry only strings. */
export function declaredMediaRoleMap<T extends { role: string; dataUrl: string }>(
  media: readonly T[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of media) out[m.dataUrl] = m.role;
  return out;
}
