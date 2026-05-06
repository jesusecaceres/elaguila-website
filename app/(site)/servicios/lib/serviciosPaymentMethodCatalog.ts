import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export type ServiciosPaymentMethodId =
  | "cash"
  | "credit_debit_card"
  | "check"
  | "zelle"
  | "venmo"
  | "cash_app"
  | "paypal"
  | "bank_transfer"
  | "financing_available"
  | "payment_plans"
  | "deposit_required"
  | "invoice_available";

/** Display order for chips and profile output */
export const SERVICIOS_PAYMENT_METHOD_ORDER = [
  "cash",
  "credit_debit_card",
  "check",
  "zelle",
  "venmo",
  "cash_app",
  "paypal",
  "bank_transfer",
  "financing_available",
  "payment_plans",
  "deposit_required",
  "invoice_available",
] as const satisfies readonly ServiciosPaymentMethodId[];

export const MAX_SERVICIOS_PAYMENT_METHODS_SELECTED = SERVICIOS_PAYMENT_METHOD_ORDER.length;

const ALLOWED = new Set<string>(SERVICIOS_PAYMENT_METHOD_ORDER);

const ORDER_INDEX = new Map(SERVICIOS_PAYMENT_METHOD_ORDER.map((id, i) => [id, i]));

const LABELS: Record<ServiciosPaymentMethodId, Record<ServiciosLang, string>> = {
  cash: { es: "Efectivo", en: "Cash" },
  credit_debit_card: { es: "Tarjeta de crédito / débito", en: "Credit or debit card" },
  check: { es: "Cheque", en: "Check" },
  zelle: { es: "Zelle", en: "Zelle" },
  venmo: { es: "Venmo", en: "Venmo" },
  cash_app: { es: "Cash App", en: "Cash App" },
  paypal: { es: "PayPal", en: "PayPal" },
  bank_transfer: { es: "Transferencia bancaria", en: "Bank transfer" },
  financing_available: { es: "Financiamiento disponible", en: "Financing available" },
  payment_plans: { es: "Planes de pago", en: "Payment plans" },
  deposit_required: { es: "Depósito requerido", en: "Deposit required" },
  invoice_available: { es: "Factura disponible", en: "Invoice available" },
};

export function isServiciosPaymentMethodId(id: string): id is ServiciosPaymentMethodId {
  return ALLOWED.has(id);
}

export function getServiciosPaymentMethodLabel(id: ServiciosPaymentMethodId, lang: ServiciosLang): string {
  return LABELS[id][lang];
}

/**
 * Whitelist known ids, dedupe, cap length, sort by catalog order; drop unknowns.
 */
export function sanitizeServiciosPaymentMethodIds(raw: string[] | undefined | null): ServiciosPaymentMethodId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<ServiciosPaymentMethodId>();
  const picked: ServiciosPaymentMethodId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (!isServiciosPaymentMethodId(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    picked.push(item);
    if (picked.length >= MAX_SERVICIOS_PAYMENT_METHODS_SELECTED) break;
  }
  picked.sort((a, b) => (ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!));
  return picked;
}

/** Max length for advertiser-typed custom payment labels */
export const CUSTOM_PAYMENT_LABEL_MAX = 48;

/** Max custom payment rows per listing */
export const MAX_CUSTOM_PAYMENT_METHODS = 24;

export function normalizePaymentMethodDedupeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Keys for standard ES/EN labels + ids — blocks custom duplicates against presets */
export function collectStandardPaymentMethodDedupeKeys(): Set<string> {
  const keys = new Set<string>();
  for (const id of SERVICIOS_PAYMENT_METHOD_ORDER) {
    keys.add(normalizePaymentMethodDedupeKey(LABELS[id].es));
    keys.add(normalizePaymentMethodDedupeKey(LABELS[id].en));
    keys.add(normalizePaymentMethodDedupeKey(id));
    keys.add(normalizePaymentMethodDedupeKey(id.replace(/_/g, " ")));
  }
  return keys;
}

/**
 * Trim, cap length, dedupe, drop collisions with standard catalog labels, max count.
 */
export function sanitizeCustomPaymentMethodLabels(raw: string[] | undefined | null): string[] {
  if (!Array.isArray(raw)) return [];
  const blocked = collectStandardPaymentMethodDedupeKeys();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim().slice(0, CUSTOM_PAYMENT_LABEL_MAX);
    if (!t) continue;
    const k = normalizePaymentMethodDedupeKey(t);
    if (!k || blocked.has(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= MAX_CUSTOM_PAYMENT_METHODS) break;
  }
  return out;
}

export type PaymentMethodVisual =
  | { kind: "emoji"; emoji: string }
  | { kind: "brandBadge"; brand: "zelle" | "venmo" | "cash_app" | "paypal" };

export function getStandardPaymentMethodVisual(id: ServiciosPaymentMethodId): PaymentMethodVisual {
  switch (id) {
    case "cash":
      return { kind: "emoji", emoji: "💵" };
    case "credit_debit_card":
      return { kind: "emoji", emoji: "💳" };
    case "check":
      return { kind: "emoji", emoji: "✅" };
    case "zelle":
      return { kind: "brandBadge", brand: "zelle" };
    case "venmo":
      return { kind: "brandBadge", brand: "venmo" };
    case "cash_app":
      return { kind: "brandBadge", brand: "cash_app" };
    case "paypal":
      return { kind: "brandBadge", brand: "paypal" };
    case "bank_transfer":
      return { kind: "emoji", emoji: "🏦" };
    case "financing_available":
      return { kind: "emoji", emoji: "✨" };
    case "payment_plans":
      return { kind: "emoji", emoji: "📅" };
    case "deposit_required":
      return { kind: "emoji", emoji: "💰" };
    case "invoice_available":
      return { kind: "emoji", emoji: "🧾" };
    default:
      return { kind: "emoji", emoji: "✨" };
  }
}

export function getCustomPaymentMethodVisual(): PaymentMethodVisual {
  return { kind: "emoji", emoji: "✨" };
}
