/**
 * Quick Classifieds — step-level validation (pure, bilingual). This is the intake's UX guard only;
 * every adapter still runs the category's OWN canonical required-for-preview gate before handoff.
 */

import type {
  QuickClassifiedFieldDefinition,
  QuickIntakeStep,
  QuickIntakeValues,
  QuickLang,
  QuickMediaItem,
  QuickClassifiedMediaContract,
} from "./quickClassifiedTypes";
import { qt } from "./quickClassifiedCopy";

export function quickDigitsOnly(raw: unknown): string {
  return String(raw ?? "").replace(/\D+/g, "");
}

export function quickIsLikelyEmail(raw: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw ?? "").trim());
}

export function quickFieldIsRequired(field: QuickClassifiedFieldDefinition, values: QuickIntakeValues): boolean {
  const r = field.required;
  if (typeof r === "function") return r(values);
  return Boolean(r);
}

export function quickFieldIsVisible(field: QuickClassifiedFieldDefinition, values: QuickIntakeValues): boolean {
  return field.showWhen ? field.showWhen(values) : true;
}

export function quickFieldOptions(field: QuickClassifiedFieldDefinition, values: QuickIntakeValues) {
  const o = field.options;
  if (!o) return [] as const;
  return typeof o === "function" ? o(values) : o;
}

export function quickValueIsEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim() === "";
}

const MSG = {
  required: { es: "{label}: obligatorio", en: "{label}: required" },
  phone: { es: "{label}: ingresa 10 dígitos", en: "{label}: enter 10 digits" },
  email: { es: "{label}: ingresa un correo válido", en: "{label}: enter a valid email" },
  number: { es: "{label}: ingresa un número", en: "{label}: enter a number" },
  zip: { es: "{label}: ingresa un código postal válido", en: "{label}: enter a valid postal code" },
  maxLength: { es: "{label}: máximo {max} caracteres", en: "{label}: maximum {max} characters" },
} as const;

function msg(key: keyof typeof MSG, lang: QuickLang, label: string, extra?: Record<string, string | number>): string {
  let s = qt(MSG[key], lang).replace("{label}", label);
  if (extra) for (const [k, v] of Object.entries(extra)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Returns bilingual issue strings for one step; empty array = step is complete. */
export function validateQuickStep(step: QuickIntakeStep, values: QuickIntakeValues, lang: QuickLang): string[] {
  const issues: string[] = [];
  for (const field of step.fields) {
    if (!quickFieldIsVisible(field, values)) continue;
    const label = qt(field.label, lang);
    const raw = values[field.key];
    const empty = quickValueIsEmpty(raw);
    if (quickFieldIsRequired(field, values) && empty) {
      issues.push(msg("required", lang, label));
      continue;
    }
    if (empty) continue;
    const s = typeof raw === "string" ? raw.trim() : "";
    switch (field.kind) {
      case "phone":
        if (quickDigitsOnly(s).length !== 10) issues.push(msg("phone", lang, label));
        break;
      case "email":
        if (!quickIsLikelyEmail(s)) issues.push(msg("email", lang, label));
        break;
      case "number":
      case "currency":
        if (!/^\d+(\.\d+)?$/.test(s.replace(/[,$\s]/g, ""))) issues.push(msg("number", lang, label));
        break;
      case "zip":
        if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(s)) issues.push(msg("zip", lang, label));
        break;
      default:
        break;
    }
    if (field.maxLength && typeof raw === "string" && raw.length > field.maxLength) {
      issues.push(msg("maxLength", lang, label, { max: field.maxLength }));
    }
  }
  if (step.atLeastOne) {
    const anyFilled = step.atLeastOne.keys.some((k) => !quickValueIsEmpty(values[k]));
    if (!anyFilled) issues.push(qt(step.atLeastOne.message, lang));
  }
  return issues;
}

/** Media Lock: >= 1 real image, <= canonical cap. */
export function validateQuickMedia(media: readonly QuickMediaItem[], contract: QuickClassifiedMediaContract, lang: QuickLang): string[] {
  const issues: string[] = [];
  if (media.length < contract.minImages) {
    issues.push(lang === "en" ? "Add at least one photo to continue." : "Sube al menos una foto para continuar.");
  }
  if (contract.maxImages != null && media.length > contract.maxImages) {
    issues.push(
      lang === "en"
        ? `Maximum ${contract.maxImages} photos in this category.`
        : `Máximo ${contract.maxImages} fotos en esta categoría.`,
    );
  }
  return issues;
}

/** Normalises a currency-ish input to whole-dollar digits ("$1,250.00" → "1250"). */
export function quickWholeDollars(raw: unknown): string {
  const s = String(raw ?? "").replace(/[,$\s]/g, "");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return "";
  return String(Math.round(n));
}

export function quickStr(values: QuickIntakeValues, key: string): string {
  const v = values[key];
  return typeof v === "string" ? v.trim() : "";
}

export function quickBool(values: QuickIntakeValues, key: string): boolean {
  return values[key] === true;
}

export function quickList(values: QuickIntakeValues, key: string): string[] {
  const v = values[key];
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}
