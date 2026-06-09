import {
  DEFAULT_LANG,
  isSupportedLang,
  normalizeLang,
  type SupportedLang,
} from "@/app/lib/language";

export const LEONIX_TRANSLATE_SITE_ORIGIN = "https://leonixmedia.com";

/** Google Translate Website Mode target codes (separate from DeepL/provider maps). */
const GOOGLE_WEBSITE_LANG: Record<SupportedLang, string> = {
  es: "es",
  en: "en",
  vi: "vi",
  pt: "pt",
  tl: "fil",
  km: "km",
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  hi: "hi",
  hy: "hy",
  ru: "ru",
  pa: "pa",
};

export function getGoogleTranslateLangCode(lang: SupportedLang): string {
  return GOOGLE_WEBSITE_LANG[lang] ?? GOOGLE_WEBSITE_LANG.en;
}

export function resolveTranslateSiteLang(
  lang: string | null | undefined,
  target: string | null | undefined,
): SupportedLang {
  const raw = (target ?? lang ?? "").trim();
  if (raw && isSupportedLang(raw)) return normalizeLang(raw);
  return DEFAULT_LANG;
}

/** Safe internal return path only — rejects external URLs. */
export function sanitizeTranslateReturnTo(returnTo: string | null | undefined): string | null {
  if (!returnTo) return null;
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

export function buildLeonixSiteUrlForTranslate(
  lang: SupportedLang,
  returnTo: string | null | undefined,
): string {
  const safePath = sanitizeTranslateReturnTo(returnTo);
  if (safePath) {
    const sep = safePath.includes("?") ? "&" : "?";
    return `${LEONIX_TRANSLATE_SITE_ORIGIN}${safePath}${sep}lang=${lang}`;
  }
  return `${LEONIX_TRANSLATE_SITE_ORIGIN}/?lang=${lang}`;
}

export function buildGoogleTranslateWebsiteUrl(opts: {
  targetLang: SupportedLang;
  siteUrl?: string;
}): string {
  const googleLang = getGoogleTranslateLangCode(opts.targetLang);
  const u = encodeURIComponent(opts.siteUrl ?? `${LEONIX_TRANSLATE_SITE_ORIGIN}/`);
  return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(googleLang)}&u=${u}`;
}

export type TranslateSiteHrefOpts = {
  lang: SupportedLang;
  sourcePage?: string;
  sourceCta?: string;
  returnTo?: string;
};

/** Internal controlled gateway — redirects to Google Translate Website Mode. */
export function translateSiteHref(opts: TranslateSiteHrefOpts): string {
  const params = new URLSearchParams({ lang: opts.lang });
  if (opts.sourcePage) params.set("sourcePage", opts.sourcePage);
  if (opts.sourceCta) params.set("sourceCta", opts.sourceCta);
  const safeReturn = sanitizeTranslateReturnTo(opts.returnTo);
  if (safeReturn) params.set("returnTo", safeReturn);
  return `/translate-site?${params.toString()}`;
}

export function sourcePageKeyFromPath(pathname: string): string {
  if (pathname.includes("coming-soon-v2")) return "coming-soon-v2";
  if (pathname.includes("/magazine/2026/june/read")) return "magazine_read";
  if (pathname.includes("/qr/translator")) return "qr_translator";
  if (pathname.includes("/contacto")) return "contacto";
  const trimmed = pathname.replace(/^\//, "");
  return trimmed || "site";
}

export type GoogleTranslatePlacementCopy = {
  dropdownHelper: string;
  dropdownCta: string;
  comingSoonQuestion: string;
  comingSoonBody: string;
  comingSoonCta: string;
};

const PLACEMENT_EN: GoogleTranslatePlacementCopy = {
  dropdownHelper: "Need another language? Open the website in Google Translate.",
  dropdownCta: "🌐 Translate Leonix with Google",
  comingSoonQuestion: "Need another language?",
  comingSoonBody: "Open Leonix with Google Translate for website browsing.",
  comingSoonCta: "Translate website with Google",
};

const PLACEMENT_BY_LANG: Partial<Record<SupportedLang, GoogleTranslatePlacementCopy>> = {
  es: {
    dropdownHelper: "¿Necesitas otro idioma? Abre el sitio en Google Translate.",
    dropdownCta: "🌐 Traducir Leonix con Google",
    comingSoonQuestion: "¿Necesitas otro idioma?",
    comingSoonBody: "Abre Leonix con Google Translate para navegar el sitio web.",
    comingSoonCta: "Traducir sitio web con Google",
  },
  en: PLACEMENT_EN,
  vi: {
    dropdownHelper: "Cần ngôn ngữ khác? Mở trang web bằng Google Translate.",
    dropdownCta: "🌐 Dịch Leonix bằng Google",
    comingSoonQuestion: "Cần ngôn ngữ khác?",
    comingSoonBody: "Mở Leonix bằng Google Translate để duyệt trang web.",
    comingSoonCta: "Dịch trang web bằng Google",
  },
  pt: {
    dropdownHelper: "Precisa de outro idioma? Abra o site no Google Translate.",
    dropdownCta: "🌐 Traduzir Leonix com Google",
    comingSoonQuestion: "Precisa de outro idioma?",
    comingSoonBody: "Abra a Leonix com Google Translate para navegar no site.",
    comingSoonCta: "Traduzir site com Google",
  },
  ja: {
    dropdownHelper: "別の言語が必要ですか？Google Translateでサイトを開いてください。",
    dropdownCta: "🌐 GoogleでLeonixを翻訳",
    comingSoonQuestion: "別の言語が必要ですか？",
    comingSoonBody: "Google TranslateでLeonixサイトを閲覧できます。",
    comingSoonCta: "Googleでサイトを翻訳",
  },
  tl: {
    dropdownHelper: "Kailangan ng ibang wika? Buksan ang website sa Google Translate.",
    dropdownCta: "🌐 Isalin ang Leonix gamit ang Google",
    comingSoonQuestion: "Kailangan ng ibang wika?",
    comingSoonBody: "Buksan ang Leonix gamit ang Google Translate para mag-browse sa website.",
    comingSoonCta: "Isalin ang website gamit ang Google",
  },
  km: {
    dropdownHelper: "ត្រូវការភាសាផ្សេង? បើកគេហទំព័រជាមួយ Google Translate។",
    dropdownCta: "🌐 បកប្រែ Leonix ជាមួយ Google",
    comingSoonQuestion: "ត្រូវការភាសាផ្សេង?",
    comingSoonBody: "បើក Leonix ជាមួយ Google Translate ដើម្បីរុករកគេហទំព័រ។",
    comingSoonCta: "បកប្រែគេហទំព័រជាមួយ Google",
  },
  zh: {
    dropdownHelper: "需要其他语言？使用 Google Translate 打开网站。",
    dropdownCta: "🌐 用 Google 翻译 Leonix",
    comingSoonQuestion: "需要其他语言？",
    comingSoonBody: "使用 Google Translate 浏览 Leonix 网站。",
    comingSoonCta: "用 Google 翻译网站",
  },
  ko: {
    dropdownHelper: "다른 언어가 필요하신가요? Google Translate로 사이트를 여세요.",
    dropdownCta: "🌐 Google로 Leonix 번역",
    comingSoonQuestion: "다른 언어가 필요하신가요?",
    comingSoonBody: "Google Translate로 Leonix 웹사이트를 탐색하세요.",
    comingSoonCta: "Google로 웹사이트 번역",
  },
  hi: {
    dropdownHelper: "कोई और भाषा चाहिए? Google Translate से वेबसाइट खोलें।",
    dropdownCta: "🌐 Google से Leonix अनुवाद करें",
    comingSoonQuestion: "कोई और भाषा चाहिए?",
    comingSoonBody: "वेबसाइट ब्राउज़ करने के लिए Google Translate से Leonix खोलें।",
    comingSoonCta: "Google से वेबसाइट अनुवाद करें",
  },
  hy: {
    dropdownHelper: "Պետք է այլ լեզու? Բացեք կայքը Google Translate-ով։",
    dropdownCta: "🌐 Թարգմանել Leonix-ը Google-ով",
    comingSoonQuestion: "Պետք է այլ լեզու?",
    comingSoonBody: "Բացեք Leonix-ը Google Translate-ով կայքը դիտելու համար։",
    comingSoonCta: "Թարգմանել կայքը Google-ով",
  },
  ru: {
    dropdownHelper: "Нужен другой язык? Откройте сайт в Google Translate.",
    dropdownCta: "🌐 Перевести Leonix через Google",
    comingSoonQuestion: "Нужен другой язык?",
    comingSoonBody: "Откройте Leonix через Google Translate для просмотра сайта.",
    comingSoonCta: "Перевести сайт через Google",
  },
  pa: {
    dropdownHelper: "ਹੋਰ ਭਾਸ਼ਾ ਚਾਹੀਦੀ ਹੈ? Google Translate ਨਾਲ ਵੈੱਬਸਾਈਟ ਖੋਲ੍ਹੋ।",
    dropdownCta: "🌐 Google ਨਾਲ Leonix ਅਨੁਵਾਦ ਕਰੋ",
    comingSoonQuestion: "ਹੋਰ ਭਾਸ਼ਾ ਚਾਹੀਦੀ ਹੈ?",
    comingSoonBody: "ਵੈੱਬਸਾਈਟ ਬ੍ਰਾਊਜ਼ ਕਰਨ ਲਈ Google Translate ਨਾਲ Leonix ਖੋਲ੍ਹੋ।",
    comingSoonCta: "Google ਨਾਲ ਵੈੱਬਸਾਈਟ ਅਨੁਵਾਦ ਕਰੋ",
  },
};

export function getGoogleTranslatePlacementCopy(lang: SupportedLang): GoogleTranslatePlacementCopy {
  return PLACEMENT_BY_LANG[lang] ?? PLACEMENT_EN;
}
