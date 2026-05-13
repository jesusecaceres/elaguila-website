/**
 * Prefilled outreach copy for Rentas CTAs (WhatsApp / SMS). Keep in sync with ContactActions + preview mappers.
 */

export const RENTAS_LEAD_MESSAGE_ES =
  "Vi tu anuncio de renta en Leonix Media. Quisiera saber si todavía está disponible y si podemos hablar.";

export const RENTAS_LEAD_MESSAGE_EN =
  "I saw your rental listing on Leonix Media. I wanted to ask if it is still available and if we can talk.";

export function rentasLeadSmsBody(lang: "es" | "en"): string {
  return lang === "en" ? RENTAS_LEAD_MESSAGE_EN : RENTAS_LEAD_MESSAGE_ES;
}
