/**
 * Shared helpers for the Quick Business adapters — the business contact step (phone / WhatsApp / email /
 * website), the "days + open/close" hours step, and small value readers. Adapters (not the framework) import
 * canonical taxonomies, so the app/lib → app/(site) dependency direction stays intact.
 */

import { QUICK_BUSINESS_COPY, QUICK_BUSINESS_DAY_LABELS } from "@/app/lib/quickBusiness/quickBusinessCopy";
import type { QuickClassifiedFieldDefinition, QuickIntakeStep, QuickIntakeValues, QuickText } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickList, quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";

export const BUSINESS_DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type BusinessDayKey = (typeof BUSINESS_DAY_ORDER)[number];

// Bible §10.1: at least one of Phone/SMS/WhatsApp required. Email/website cannot satisfy this.
export const BUSINESS_CONTACT_AT_LEAST_ONE: QuickText = {
  es: "Se requiere al menos un número de teléfono o WhatsApp.",
  en: "At least one phone number or WhatsApp is required.",
};

/** Contact step shared by the business categories — keys map 1:1 onto each canonical draft's own contact fields. */
export function businessContactStep(intro?: QuickText): QuickIntakeStep {
  const fields: QuickClassifiedFieldDefinition[] = [
    { key: "phone", kind: "phone", label: { es: "Teléfono", en: "Phone" }, placeholder: { es: "(408) 555-0123", en: "(408) 555-0123" }, autoComplete: "tel", inputMode: "tel" },
    { key: "whatsapp", kind: "phone", label: { es: "WhatsApp", en: "WhatsApp" }, hint: { es: "Si es el mismo número, escríbelo también aquí.", en: "If it is the same number, enter it here too." }, inputMode: "tel" },
    { key: "email", kind: "email", label: { es: "Correo electrónico", en: "Email" }, autoComplete: "email", inputMode: "email" },
    { key: "website", kind: "text", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, placeholder: { es: "https://…", en: "https://…" }, autoComplete: "url", maxLength: 200 },
  ];
  return {
    id: "contact",
    title: { es: "¿Cómo te contactan los clientes?", en: "How do customers reach you?" },
    intro: intro ?? { es: "Solo se muestra lo que escribas aquí.", en: "Only what you enter here is shown." },
    fields,
    // Bible §10.1: email and website cannot satisfy the direct-contact minimum.
    atLeastOne: { keys: ["phone", "whatsapp"], message: BUSINESS_CONTACT_AT_LEAST_ONE },
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
