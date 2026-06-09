import { normalizeLang, type SupportedLang } from "@/app/lib/language";

/** Active non-RTL languages for public form destinations (Contact, Newsletter, Promo quote). */
export type GateLang = SupportedLang;

export function parseGateLang(value: string | null | undefined): GateLang {
  return normalizeLang(value);
}
