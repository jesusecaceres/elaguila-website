export type ContactEmailLang = "es" | "en";

/** Public Restaurantes contact card — localized inquiry mailto + clipboard body. */
export function buildRestauranteInquiryMailto(email: string, lang: ContactEmailLang): { mailtoHref: string; messagePlain: string } {
  const subject = lang === "en" ? "Inquiry from Leonix Media" : "Consulta desde Leonix Media";
  const messagePlain =
    lang === "en"
      ? "Hi, I saw your restaurant on Leonix Media and I would like more information."
      : "Hola, vi su restaurante en Leonix Media y me gustaría más información.";
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messagePlain)}`;
  return { mailtoHref, messagePlain };
}
