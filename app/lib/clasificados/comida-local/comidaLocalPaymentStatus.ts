import { COMIDA_LOCAL_PAYMENT_STATUS_L5B } from "./comidaLocalPublishTypes";

/** Stored `payment_status` values for Comida Local (no fake paid states). */
export const COMIDA_LOCAL_PAYMENT_STATUS = {
  NOT_REQUIRED_L5B: COMIDA_LOCAL_PAYMENT_STATUS_L5B,
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  WAIVED: "waived",
} as const;

export type ComidaLocalPaymentStatusValue =
  (typeof COMIDA_LOCAL_PAYMENT_STATUS)[keyof typeof COMIDA_LOCAL_PAYMENT_STATUS];

/**
 * Payment status written on publish while Stripe checkout is not wired (FOOD-L5D).
 * Do not mark rows `paid` without a verified payment webhook.
 */
export function resolveComidaLocalPublishPaymentStatus(): string {
  return COMIDA_LOCAL_PAYMENT_STATUS.NOT_REQUIRED_L5B;
}

export function getComidaLocalPaymentStatusLabel(
  raw: string | null | undefined,
  lang: "es" | "en" = "es"
): string {
  const s = String(raw ?? "").trim().toLowerCase();
  const map: Record<string, { es: string; en: string }> = {
    [COMIDA_LOCAL_PAYMENT_STATUS.NOT_REQUIRED_L5B]: {
      es: "Sin pago (desarrollo)",
      en: "No payment (dev)",
    },
    [COMIDA_LOCAL_PAYMENT_STATUS.PENDING]: {
      es: "Pago pendiente",
      en: "Payment pending",
    },
    [COMIDA_LOCAL_PAYMENT_STATUS.PAID]: {
      es: "Pagado",
      en: "Paid",
    },
    [COMIDA_LOCAL_PAYMENT_STATUS.FAILED]: {
      es: "Pago fallido",
      en: "Payment failed",
    },
    [COMIDA_LOCAL_PAYMENT_STATUS.WAIVED]: {
      es: "Exento",
      en: "Waived",
    },
  };
  return map[s]?.[lang] ?? (raw?.trim() || "—");
}

/** True only for verified paid or explicit dev waiver — never inferred from UI. */
export function isComidaLocalPaymentComplete(paymentStatus: string | null | undefined): boolean {
  const s = String(paymentStatus ?? "").trim().toLowerCase();
  return s === COMIDA_LOCAL_PAYMENT_STATUS.PAID || s === COMIDA_LOCAL_PAYMENT_STATUS.WAIVED;
}

/** Whether a row may appear on public Comida Local surfaces (results/detail). */
export function isComidaLocalPublishPubliclyVisible(args: {
  status: string | null | undefined;
  paymentStatus: string | null | undefined;
}): boolean {
  const status = String(args.status ?? "").trim().toLowerCase();
  if (status !== "published") return false;

  const payment = String(args.paymentStatus ?? "").trim().toLowerCase();
  if (payment === COMIDA_LOCAL_PAYMENT_STATUS.NOT_REQUIRED_L5B) return true;
  return isComidaLocalPaymentComplete(payment);
}

/**
 * Proposed Stripe env var names (not wired in FOOD-L5D).
 * Confirm live Price IDs with ops before checkout gate.
 */
export const COMIDA_LOCAL_STRIPE_ENV_VARS = {
  BASIC_PRICE_ID: "STRIPE_COMIDA_LOCAL_BASIC_PRICE_ID",
  PLUS_PRICE_ID: "STRIPE_COMIDA_LOCAL_PLUS_PRICE_ID",
} as const;
