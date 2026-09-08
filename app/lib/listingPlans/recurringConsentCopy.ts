/**
 * Package C Build 1 (C3) — recurring-billing consent disclosure copy (client-safe).
 *
 * Shared by the checkout checkpoint UIs (client components) and the server consent recorder,
 * so the rendered text and the hashed/stored evidence can never drift. No server imports here.
 */

export const RECURRING_CONSENT_TEXT_VERSION = "leonix-recurring-consent-2026-08-v1";
export const RECURRING_CONSENT_AGREEMENT_VERSION = "v1.2";
/** Locked: 7 calendar days (Agreement v1.2 + Bible). Mirrors subscriptionLifecycle. */
export const RECURRING_CONSENT_GRACE_DAYS = 7;

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/**
 * Exact bilingual disclosure. States: recurring amount, interval, automatic renewal,
 * cancellation, the 7-day failed-payment grace policy, and where to manage/cancel.
 * Rendered next to an UNCHECKED checkbox — never pre-checked, never implied by navigation.
 */
export function buildRecurringConsentText(input: {
  amountCents: number;
  addOnAmountCents?: number;
  lang: "es" | "en";
}): string {
  const total = input.amountCents + (input.addOnAmountCents ?? 0);
  const price = formatUsd(total);
  if (input.lang === "es") {
    return (
      `Autorizo el cobro recurrente de ${price} al mes. Mi suscripción se renueva automáticamente cada mes ` +
      `hasta que la cancele desde mi panel (Mis Anuncios) o contactando a Leonix. Si un pago falla, tengo ` +
      `${RECURRING_CONSENT_GRACE_DAYS} días calendario de gracia con mi visibilidad activa antes de una suspensión por falta de pago; ` +
      `mi contenido nunca se borra y el acceso se restaura al recuperarse el pago. ` +
      `(Contrato de Publicidad Leonix Media ${RECURRING_CONSENT_AGREEMENT_VERSION}, cláusula 17.)`
    );
  }
  return (
    `I authorize a recurring charge of ${price} per month. My subscription renews automatically each month ` +
    `until I cancel from my dashboard (My Listings) or by contacting Leonix. If a payment fails, I have a ` +
    `${RECURRING_CONSENT_GRACE_DAYS}-calendar-day grace period with my visibility active before a nonpayment suspension; ` +
    `my content is never deleted and access is restored when payment recovers. ` +
    `(Leonix Media Advertising Agreement ${RECURRING_CONSENT_AGREEMENT_VERSION}, clause 17.)`
  );
}

/** The acknowledgment payload a checkout client sends alongside a recurring package. */
export function buildRecurringConsentAcknowledgment(lang: "es" | "en"): {
  accepted: true;
  consentTextVersion: string;
  lang: "es" | "en";
} {
  return { accepted: true, consentTextVersion: RECURRING_CONSENT_TEXT_VERSION, lang };
}

/** The server-side parse of the client acknowledgment: only an explicit affirmative passes. */
export type RecurringConsentAcknowledgment = {
  accepted: true;
  consentTextVersion: string;
  lang: "es" | "en";
};

export function parseRecurringConsentAcknowledgment(raw: unknown): RecurringConsentAcknowledgment | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.accepted !== true) return null;
  const version = typeof o.consentTextVersion === "string" ? o.consentTextVersion.trim() : "";
  if (!version) return null;
  const lang = o.lang === "en" ? "en" : "es";
  return { accepted: true, consentTextVersion: version, lang };
}
