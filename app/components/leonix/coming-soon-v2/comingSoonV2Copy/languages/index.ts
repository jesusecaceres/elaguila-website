import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { getEsCopy } from "./es";
import { getEnCopy } from "./en";
import { getViCopy } from "./vi";
import { getPtCopy } from "./pt";
import { getTlCopy } from "./tl";
import { getKmCopy } from "./km";
import { getZhCopy } from "./zh";
import { getJaCopy } from "./ja";
import { getKoCopy } from "./ko";
import { getHiCopy } from "./hi";
import { getHyCopy } from "./hy";
import { getRuCopy } from "./ru";
import { getPaCopy } from "./pa";

const getters: Record<SupportedLang, (lang: SupportedLang) => ComingSoonV2Copy> = {
  es: getEsCopy,
  en: getEnCopy,
  vi: getViCopy,
  pt: getPtCopy,
  tl: getTlCopy,
  km: getKmCopy,
  zh: getZhCopy,
  ja: getJaCopy,
  ko: getKoCopy,
  hi: getHiCopy,
  hy: getHyCopy,
  ru: getRuCopy,
  pa: getPaCopy,
};

export function getComingSoonV2Copy(lang: SupportedLang): ComingSoonV2Copy {
  return getters[lang](lang);
}

export const COMING_SOON_V2_COPY: Record<SupportedLang, ComingSoonV2Copy> = {
  es: getEsCopy("es"),
  en: getEnCopy("en"),
  vi: getViCopy("vi"),
  pt: getPtCopy("pt"),
  tl: getTlCopy("tl"),
  km: getKmCopy("km"),
  zh: getZhCopy("zh"),
  ja: getJaCopy("ja"),
  ko: getKoCopy("ko"),
  hi: getHiCopy("hi"),
  hy: getHyCopy("hy"),
  ru: getRuCopy("ru"),
  pa: getPaCopy("pa"),
};
