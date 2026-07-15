import {
  getLaunchUiMessages,
  type RentasAnuncioFormCopy,
} from "@/app/lib/i18n/launchUiDictionaries";
import type { OfficialLocale } from "@/app/lib/language";

export type RentasAnuncioFormLang = OfficialLocale;
export type { RentasAnuncioFormCopy };

export function getRentasAnuncioFormCopy(lang: RentasAnuncioFormLang): RentasAnuncioFormCopy {
  return getLaunchUiMessages(lang).rentas.form;
}
