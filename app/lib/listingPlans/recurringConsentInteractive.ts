"use client";

/**
 * Package C Build 1 (C3) — interactive recurring-billing consent for dashboard add-on
 * checkouts (coupon/offers/inventory packs), which start from a single button rather than the
 * full checkout checkpoint. Shows the EXACT versioned disclosure in a native, accessible
 * browser dialog requiring an explicit affirmative action (OK) — never pre-checked, never
 * implied by navigation. Cancel aborts checkout entirely. The server still independently
 * rejects subscription-mode checkout without the acknowledgment.
 *
 * C8 may upgrade these surfaces to inline checkbox UI; the consent contract and versioned
 * text are identical either way.
 */

import {
  buildRecurringConsentAcknowledgment,
  buildRecurringConsentText,
} from "./recurringConsentCopy";

export function confirmRecurringConsentInteractively(input: {
  lang: "es" | "en";
  amountCents: number;
}): { accepted: true; consentTextVersion: string; lang: "es" | "en" } | null {
  const disclosure = buildRecurringConsentText({ amountCents: input.amountCents, lang: input.lang });
  const prompt =
    input.lang === "es"
      ? `${disclosure}\n\nPresiona Aceptar para autorizar el cobro recurrente y continuar al pago.`
      : `${disclosure}\n\nPress OK to authorize the recurring charge and continue to payment.`;
  if (typeof window === "undefined") return null;
  const accepted = window.confirm(prompt);
  if (!accepted) return null;
  return buildRecurringConsentAcknowledgment(input.lang);
}
