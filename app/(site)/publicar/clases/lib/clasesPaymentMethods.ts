/**
 * Clases-owned payment-method catalog (Gate 2A Section L/M/N).
 *
 * This mirrors the proven Servicios payment-method pattern (values, visual
 * design, "otro" + brand-detection) WITHOUT importing any Servicios-typed
 * code, per explicit PM instruction to avoid cross-category coupling.
 *
 * These are how STUDENTS pay the INSTRUCTOR for the class — never the
 * separate $24.99/30-day Leonix listing fee.
 */

export type ClasesPaymentMethodId =
  | "cash"
  | "credit_debit_card"
  | "check"
  | "zelle"
  | "venmo"
  | "cash_app"
  | "paypal"
  | "bank_transfer"
  | "payment_plans"
  | "otro";

export const CLASES_PAYMENT_METHOD_ORDER = [
  "cash",
  "credit_debit_card",
  "zelle",
  "venmo",
  "cash_app",
  "paypal",
  "check",
  "bank_transfer",
  "payment_plans",
  "otro",
] as const satisfies readonly ClasesPaymentMethodId[];

export const MAX_CLASES_PAYMENT_METHODS = CLASES_PAYMENT_METHOD_ORDER.length;

const ALLOWED = new Set<string>(CLASES_PAYMENT_METHOD_ORDER);
const ORDER_INDEX = new Map(CLASES_PAYMENT_METHOD_ORDER.map((id, i) => [id, i]));

const LABELS: Record<ClasesPaymentMethodId, { es: string; en: string }> = {
  cash: { es: "Efectivo", en: "Cash" },
  credit_debit_card: { es: "Tarjeta de crédito / débito", en: "Credit or debit card" },
  check: { es: "Cheque", en: "Check" },
  zelle: { es: "Zelle", en: "Zelle" },
  venmo: { es: "Venmo", en: "Venmo" },
  cash_app: { es: "Cash App", en: "Cash App" },
  paypal: { es: "PayPal", en: "PayPal" },
  bank_transfer: { es: "Transferencia bancaria", en: "Bank transfer" },
  payment_plans: { es: "Planes de pago", en: "Payment plans" },
  otro: { es: "Otro", en: "Other" },
};

export function isClasesPaymentMethodId(id: string): id is ClasesPaymentMethodId {
  return ALLOWED.has(id);
}

export function getClasesPaymentMethodLabel(id: ClasesPaymentMethodId, lang: "es" | "en"): string {
  return LABELS[id][lang];
}

/** Whitelist known ids, dedupe, cap length, sort by catalog order; drop unknowns. */
export function normalizePaymentMethods(raw: unknown): ClasesPaymentMethodId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<ClasesPaymentMethodId>();
  const picked: ClasesPaymentMethodId[] = [];
  for (const item of raw) {
    const id = String(item ?? "").trim();
    if (!isClasesPaymentMethodId(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    picked.push(id);
    if (picked.length >= MAX_CLASES_PAYMENT_METHODS) break;
  }
  picked.sort((a, b) => ORDER_INDEX.get(a)! - ORDER_INDEX.get(b)!);
  return picked;
}

export const CUSTOM_PAYMENT_OTHER_MAX = 48;

type BrandId = "zelle" | "venmo" | "cash_app" | "paypal";

const BRAND_DETECT: ReadonlyArray<{ brand: BrandId; pattern: RegExp }> = [
  { brand: "zelle", pattern: /zelle/i },
  { brand: "venmo", pattern: /venmo/i },
  { brand: "cash_app", pattern: /cash\s*app/i },
  { brand: "paypal", pattern: /pay\s*pal/i },
];

/** Detects a known brand inside a free-typed "otro" label so it can render with the brand badge instead of a generic pill. */
export function detectClasesPaymentBrand(customLabel: string): BrandId | null {
  const text = customLabel.trim();
  if (!text) return null;
  for (const { brand, pattern } of BRAND_DETECT) {
    if (pattern.test(text)) return brand;
  }
  return null;
}

export type ClasesPaymentMethodVisual =
  | { kind: "emoji"; emoji: string }
  | { kind: "brandBadge"; brand: BrandId };

export function getClasesPaymentMethodVisual(
  id: ClasesPaymentMethodId,
  customLabel?: string,
): ClasesPaymentMethodVisual {
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
    case "payment_plans":
      return { kind: "emoji", emoji: "📅" };
    case "otro": {
      const brand = customLabel ? detectClasesPaymentBrand(customLabel) : null;
      return brand ? { kind: "brandBadge", brand } : { kind: "emoji", emoji: "✨" };
    }
    default:
      return { kind: "emoji", emoji: "✨" };
  }
}
