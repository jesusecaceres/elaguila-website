import {
  isServiciosPaymentMethodId,
  normalizePaymentMethodDedupeKey,
  type ServiciosPaymentMethodId,
} from "./serviciosPaymentMethodCatalog";

export type ServiciosPaymentChipBrand =
  | "zelle"
  | "venmo"
  | "cash_app"
  | "paypal"
  | "visa"
  | "mastercard"
  | "amex"
  | "affirm"
  | "capital_one";

export type ServiciosPaymentChipLeading =
  | { kind: "emoji"; emoji: string }
  | { kind: "brand"; brand: ServiciosPaymentChipBrand }
  | { kind: "pill"; text: string; className: string };

function leadingFromPaymentMethodId(id: ServiciosPaymentMethodId): ServiciosPaymentChipLeading {
  switch (id) {
    case "cash":
      return { kind: "emoji", emoji: "💵" };
    case "credit_debit_card":
      return { kind: "emoji", emoji: "💳" };
    case "check":
      return { kind: "emoji", emoji: "✅" };
    case "zelle":
      return { kind: "brand", brand: "zelle" };
    case "venmo":
      return { kind: "brand", brand: "venmo" };
    case "cash_app":
      return { kind: "brand", brand: "cash_app" };
    case "paypal":
      return { kind: "brand", brand: "paypal" };
    case "bank_transfer":
      return { kind: "emoji", emoji: "🏦" };
    case "financing_available":
      return { kind: "emoji", emoji: "🏦" };
    case "payment_plans":
      return { kind: "emoji", emoji: "🧾" };
    case "deposit_required":
      return { kind: "emoji", emoji: "💰" };
    case "invoice_available":
      return { kind: "emoji", emoji: "🧾" };
    default:
      return { kind: "emoji", emoji: "✨" };
  }
}

/** Label/id resolver — Restaurante-style leading for Pagos y beneficios chips (SVC-SHELL-2F). */
export function resolveServiciosPaymentChipLeading(
  label: string,
  paymentMethodId?: string,
): ServiciosPaymentChipLeading {
  if (paymentMethodId && isServiciosPaymentMethodId(paymentMethodId)) {
    return leadingFromPaymentMethodId(paymentMethodId);
  }

  const key = normalizePaymentMethodDedupeKey(label);
  if (!key) return { kind: "emoji", emoji: "✨" };

  if (key === "apple pay" || key.includes("apple pay")) {
    return { kind: "pill", text: "Apple", className: "bg-neutral-900" };
  }
  if (key === "google pay" || key.includes("google pay")) {
    return { kind: "pill", text: "Google", className: "bg-[#4285F4]" };
  }
  if (key === "zelle") return { kind: "brand", brand: "zelle" };
  if (key === "venmo") return { kind: "brand", brand: "venmo" };
  if (key === "cash app" || key === "cashapp") return { kind: "brand", brand: "cash_app" };
  if (key === "paypal") return { kind: "brand", brand: "paypal" };
  if (key === "visa") return { kind: "brand", brand: "visa" };
  if (key === "mastercard" || key === "master card") return { kind: "brand", brand: "mastercard" };
  if (key === "amex" || key === "american express" || key.includes("american express")) {
    return { kind: "brand", brand: "amex" };
  }
  if (key === "affirm") return { kind: "brand", brand: "affirm" };
  if (key === "capital one" || key.includes("capital one")) {
    return { kind: "brand", brand: "capital_one" };
  }
  if (key === "efectivo" || key === "cash") return { kind: "emoji", emoji: "💵" };
  if (
    key.includes("tarjeta de credito") ||
    key.includes("tarjeta de debito") ||
    key.includes("credit or debit") ||
    key.includes("credit card") ||
    key.includes("debit card") ||
    key.includes("credit cards")
  ) {
    return { kind: "emoji", emoji: "💳" };
  }
  if (key === "cheque" || key === "check") return { kind: "emoji", emoji: "✅" };
  if (key.includes("transferencia bancaria") || key.includes("bank transfer")) {
    return { kind: "emoji", emoji: "🏦" };
  }
  if (key.includes("financiamiento") || key.includes("financing available")) {
    return { kind: "emoji", emoji: "🏦" };
  }
  if (key.includes("planes de pago") || key.includes("payment plan")) {
    return { kind: "emoji", emoji: "🧾" };
  }
  if (key.includes("deposito requerido") || key.includes("deposit required")) {
    return { kind: "emoji", emoji: "💰" };
  }
  if (key.includes("factura disponible") || key.includes("invoice available")) {
    return { kind: "emoji", emoji: "🧾" };
  }

  return { kind: "emoji", emoji: "✨" };
}

/** Generic benefit/highlight chip marker. */
export function resolveServiciosBenefitChipLeading(): ServiciosPaymentChipLeading {
  return { kind: "emoji", emoji: "✨" };
}
