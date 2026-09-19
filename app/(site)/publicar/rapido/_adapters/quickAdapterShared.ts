/**
 * Shared helpers for the Quick category adapters — option mapping, contact-step factory and the
 * city rule. Adapters (not the framework) import canonical taxonomies, so the app/lib → app/(site)
 * dependency direction stays intact.
 */

import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import type {
  QuickClassifiedFieldDefinition,
  QuickFieldOption,
  QuickIntakeStep,
  QuickIntakeValues,
  QuickMediaItem,
  QuickText,
} from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickStr } from "@/app/lib/quickClassifieds/quickClassifiedValidation";

export function optionsFromEsEn(list: readonly { value: string; labelEs: string; labelEn: string }[]): QuickFieldOption[] {
  return list.filter((o) => o.value).map((o) => ({ value: o.value, label: { es: o.labelEs, en: o.labelEn } }));
}

export function optionsFromLabelObj(list: readonly { value: string; label: { es: string; en: string } }[]): QuickFieldOption[] {
  return list.map((o) => ({ value: o.value, label: { es: o.label.es, en: o.label.en } }));
}

export const CONTACT_AT_LEAST_ONE: QuickText = {
  es: "Agrega al menos un medio de contacto (teléfono, WhatsApp o correo).",
  en: "Add at least one contact method (phone, WhatsApp or email).",
};

/** The contact step every category shares — names map 1:1 onto the canonical draft's own contact fields. */
export function contactStep(opts: {
  nameKey?: string | null;
  nameLabel?: QuickText;
  nameRequired?: boolean;
  includeSms?: boolean;
  intro?: QuickText;
}): QuickIntakeStep {
  const fields: QuickClassifiedFieldDefinition[] = [];
  if (opts.nameKey) {
    fields.push({
      key: opts.nameKey,
      kind: "text",
      label: opts.nameLabel ?? { es: "Tu nombre", en: "Your name" },
      required: opts.nameRequired ?? true,
      autoComplete: "name",
      maxLength: 80,
    });
  }
  fields.push(
    { key: "phone", kind: "phone", label: { es: "Teléfono", en: "Phone" }, placeholder: { es: "(408) 555-0123", en: "(408) 555-0123" }, autoComplete: "tel", inputMode: "tel" },
    { key: "whatsapp", kind: "phone", label: { es: "WhatsApp", en: "WhatsApp" }, hint: { es: "Si es el mismo número, escríbelo también aquí.", en: "If it is the same number, enter it here too." }, inputMode: "tel" },
  );
  if (opts.includeSms) {
    fields.push({ key: "smsPhone", kind: "phone", label: { es: "Mensajes de texto (SMS)", en: "Text messages (SMS)" }, inputMode: "tel" });
  }
  fields.push({ key: "email", kind: "email", label: { es: "Correo electrónico", en: "Email" }, autoComplete: "email", inputMode: "email" });
  return {
    id: "contact",
    title: { es: "¿Cómo te contactan?", en: "How should people reach you?" },
    intro: opts.intro ?? { es: "Solo se muestra lo que escribas aquí.", en: "Only what you enter here is shown." },
    fields,
    atLeastOne: { keys: ["phone", "whatsapp", "email"], message: CONTACT_AT_LEAST_ONE },
  };
}

export function cityField(mode: "canonical" | "free", label?: QuickText): QuickClassifiedFieldDefinition {
  return {
    key: "city",
    kind: "city",
    cityMode: mode,
    label: label ?? { es: "Ciudad", en: "City" },
    required: true,
    hint:
      mode === "canonical"
        ? { es: "Elige una ciudad de la lista del Norte de California.", en: "Pick a city from the Northern California list." }
        : undefined,
  };
}

/** Canonical NorCal city or the raw text (the canonical gate decides for canonical-mode categories). */
export function resolveCity(values: QuickIntakeValues, key = "city"): string {
  const raw = quickStr(values, key);
  if (!raw) return "";
  return getCanonicalCityName(raw) || raw;
}

export function mediaToEmpleosImageItems(media: readonly QuickMediaItem[]): EmpleosImageItem[] {
  return media.map((m, i) => ({ id: m.id, url: m.dataUrl, alt: "", isMain: i === 0 }));
}
