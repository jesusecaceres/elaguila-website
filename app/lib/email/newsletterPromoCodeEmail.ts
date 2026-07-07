import { escapeHtml } from "./escapeHtml";
import { normalizeLang } from "@/app/lib/language";

export type NewsletterPromoCodeEmailFields = {
  email: string;
  name?: string | null;
  lang?: string | null;
  code: string;
  percentOff: number;
  expiresAt?: string | null;
  source?: string | null;
  sourceCta?: string | null;
  subscriberId?: string | null;
  promoCodeId?: string | null;
  siteUrl?: string | null;
};

function formatExpiry(iso: string | null | undefined, lang: "en" | "es"): string {
  if (!iso) return lang === "en" ? "later date" : "una fecha posterior";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return lang === "en" ? "later date" : "una fecha posterior";
  return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Subscriber-facing newsletter promo-code email (bilingual ES/EN).
 *
 * Honest doctrine: the promo code discounts a future Leonix checkout — it does
 * NOT grant paid placement, ranking, verified status, or premium visibility by
 * itself. Paid placement depends on an eligible package/payment/entitlement.
 */
export function buildNewsletterPromoCodeEmail(fields: NewsletterPromoCodeEmailFields): {
  subject: string;
  text: string;
  html: string;
} {
  const lang = normalizeLang(fields.lang) === "en" ? "en" : "es";
  const name = String(fields.name ?? "").trim();
  const code = fields.code.trim();
  const pct = Number.isFinite(fields.percentOff) ? Math.round(fields.percentOff) : 0;
  const expiry = formatExpiry(fields.expiresAt, lang);
  const site = String(fields.siteUrl ?? "https://leonixmedia.com").replace(/\/$/, "");

  const subject =
    lang === "en"
      ? "Your Leonix promo code is here"
      : "Tu código promocional Leonix está aquí";

  const greetingEs = name ? `Hola ${name},` : "Hola,";
  const greetingEn = name ? `Hi ${name},` : "Hi,";

  const esLines = [
    greetingEs,
    "",
    "Gracias por unirte a Leonix Media.",
    "",
    `Aquí está tu código promocional único de Leonix: ${code}`,
    pct > 0 ? `Descuento: ${pct}% de descuento.` : "",
    `Válido hasta: ${expiry}.`,
    "",
    "Detalles importantes:",
    "- Este código es de un solo uso y no se puede combinar con otros códigos.",
    "- Está ligado a tu correo de suscriptor.",
    "- Podrás usarlo al publicar o pagar cuando el checkout esté disponible.",
    "- El código no garantiza ubicación pagada por sí solo.",
    "- La ubicación pagada depende de un paquete/pago/entitlement elegible.",
    "",
    "Guarda este código en un lugar seguro.",
    `Si necesitas ayuda, contáctanos en ${site}/contacto.`,
  ];

  const enLines = [
    greetingEn,
    "",
    "Thank you for joining Leonix Media.",
    "",
    `Here is your unique Leonix promo code: ${code}`,
    pct > 0 ? `Discount: ${pct}% off.` : "",
    `Valid until: ${expiry}.`,
    "",
    "Important details:",
    "- This code is one-time use and cannot be combined with other codes.",
    "- It is tied to your subscriber email.",
    "- You can use it when publishing/checkout becomes available.",
    "- The code does not guarantee paid placement by itself.",
    "- Paid placement depends on an eligible package/payment/entitlement.",
    "",
    "Keep this code somewhere safe.",
    `If you need help, contact us at ${site}/contact.`,
  ];

  const primary = lang === "en" ? enLines : esLines;
  const secondary = lang === "en" ? esLines : enLines;

  const text = [...primary, "", "———", "", ...secondary].filter((l) => l !== undefined).join("\n");

  const renderHtmlBlock = (heading: string, blockLang: "en" | "es") => {
    const isEn = blockLang === "en";
    const greeting = isEn ? greetingEn : greetingEs;
    return `
    <h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(heading)}</h2>
    <p style="margin:0 0 12px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 12px;">${escapeHtml(
      isEn ? "Thank you for joining Leonix Media." : "Gracias por unirte a Leonix Media.",
    )}</p>
    <p style="margin:0 0 6px;">${escapeHtml(isEn ? "Your unique Leonix promo code:" : "Tu código promocional único de Leonix:")}</p>
    <p style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:1px;font-family:monospace;">${escapeHtml(code)}</p>
    ${pct > 0 ? `<p style="margin:0 0 6px;"><strong>${escapeHtml(isEn ? `${pct}% off` : `${pct}% de descuento`)}</strong></p>` : ""}
    <p style="margin:0 0 12px;">${escapeHtml(isEn ? `Valid until: ${expiry}.` : `Válido hasta: ${expiry}.`)}</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>${escapeHtml(isEn ? "One-time use, non-stackable." : "De un solo uso, no combinable con otros códigos.")}</li>
      <li>${escapeHtml(isEn ? "Tied to your subscriber email." : "Ligado a tu correo de suscriptor.")}</li>
      <li>${escapeHtml(isEn ? "Usable when publishing/checkout is available." : "Podrás usarlo al publicar o pagar cuando el checkout esté disponible.")}</li>
      <li>${escapeHtml(isEn ? "Does not guarantee paid placement by itself." : "No garantiza ubicación pagada por sí solo.")}</li>
      <li>${escapeHtml(isEn ? "Paid placement depends on an eligible package/payment/entitlement." : "La ubicación pagada depende de un paquete/pago/entitlement elegible.")}</li>
    </ul>
    <p style="margin:0 0 12px;">${escapeHtml(isEn ? "Keep this code somewhere safe." : "Guarda este código en un lugar seguro.")}</p>
    <p style="margin:0 0 12px;">${
      isEn
        ? `If you need help, contact us at <a href="${escapeHtml(site)}/contact">${escapeHtml(site)}/contact</a>.`
        : `Si necesitas ayuda, contáctanos en <a href="${escapeHtml(site)}/contacto">${escapeHtml(site)}/contacto</a>.`
    }</p>`;
  };

  const primaryBlock = renderHtmlBlock(
    lang === "en" ? "Your Leonix promo code" : "Tu código promocional Leonix",
    lang,
  );
  const secondaryBlock = renderHtmlBlock(
    lang === "en" ? "Tu código promocional Leonix" : "Your Leonix promo code",
    lang === "en" ? "es" : "en",
  );

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;max-width:560px;margin:0 auto;padding:16px;">
  ${primaryBlock}
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
  ${secondaryBlock}
</body></html>`;

  return { subject, text, html };
}
