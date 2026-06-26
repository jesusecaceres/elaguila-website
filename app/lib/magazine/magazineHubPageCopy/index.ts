import type { SupportedLang } from "@/app/lib/language";
import { buildCommunityMagazineHubCopy } from "./communityBuilder";
import { MAGAZINE_HUB_EN, MAGAZINE_HUB_ES, MAGAZINE_HUB_VI } from "./esEnVi";
import type { MagazineHubPageCopy } from "./types";

export const MAGAZINE_HUB_REGISTRY: Record<SupportedLang, MagazineHubPageCopy> = {
  es: MAGAZINE_HUB_ES,
  en: MAGAZINE_HUB_EN,
  vi: MAGAZINE_HUB_VI,
  pt: buildCommunityMagazineHubCopy("pt"),
  tl: buildCommunityMagazineHubCopy("tl"),
  km: buildCommunityMagazineHubCopy("km"),
  zh: buildCommunityMagazineHubCopy("zh"),
  ja: buildCommunityMagazineHubCopy("ja"),
  ko: buildCommunityMagazineHubCopy("ko"),
  hi: buildCommunityMagazineHubCopy("hi"),
  hy: buildCommunityMagazineHubCopy("hy"),
  ru: buildCommunityMagazineHubCopy("ru"),
  pa: buildCommunityMagazineHubCopy("pa"),
};

/** Magazine hub page UI copy — native for all 13 active non-RTL languages. */
export function getMagazineHubPageCopy(lang: SupportedLang): MagazineHubPageCopy {
  return MAGAZINE_HUB_REGISTRY[lang] ?? MAGAZINE_HUB_EN;
}

export type { MagazineHubPageCopy } from "./types";
