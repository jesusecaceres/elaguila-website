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
  credit_debit_card: { es: "Tarjeta de crédito / débito", en: "Credit / debit card" },
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
