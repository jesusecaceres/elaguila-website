import type { DigitalContactLang } from "./digitalContactTypes";

/**
 * Reusable bilingual message constants for a future SMS / share-after-meeting flow.
 *
 * Not wired to any UI or send action yet — no automatic SMS is sent by this file.
 * When that feature is built, resolve the right string with
 * `getDigitalContactShareMessage(lang)` and interpolate it into the SMS/share composer.
 */
export const DIGITAL_CONTACT_SHARE_MESSAGE: Record<DigitalContactLang, string> = {
  en: "Hi! Thank you for taking a few minutes to meet with me today. Here is my Leonix Digital Contact Card. You can save my contact instantly, view my information, or contact me anytime. Thank you—I look forward to staying in touch!",
  es: "¡Hola! Muchas gracias por tomarte unos minutos para platicar conmigo. Aquí está mi Tarjeta Digital de Contacto Leonix. Puedes guardar mi contacto al instante, ver toda mi información o comunicarte conmigo cuando gustes. ¡Gracias y seguimos en contacto!",
};

export function getDigitalContactShareMessage(lang: DigitalContactLang): string {
  return DIGITAL_CONTACT_SHARE_MESSAGE[lang] ?? DIGITAL_CONTACT_SHARE_MESSAGE.es;
}
