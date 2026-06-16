import {
  DEFAULT_LANG,
  isSupportedLang,
  normalizeLang,
  replaceLangInHref,
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

/** Google Translate Website Mode codes for raw lang strings (incl. aliases). */
const GOOGLE_TRANSLATE_LANG_ALIASES: Record<string, string> = {
  es: "es",
  en: "en",
  vi: "vi",
  pt: "pt",
  tl: "fil",
  fil: "fil",
  km: "km",
  zh: "zh-CN",
  "zh-CN": "zh-CN",
  "zh-Hans": "zh-CN",
  ja: "ja",
  ko: "ko",
  hi: "hi",
  hy: "hy",
  ru: "ru",
  pa: "pa",
  ar: "en",
  fa: "en",
};

/** Resolve Google Translate `tl` from route/lang input; RTL langs fall back to English. */
export function resolveGoogleTranslateLangCode(lang: string | null | undefined): string {
  const raw = (lang ?? "").trim();
  if (raw && isSupportedLang(raw)) return getGoogleTranslateLangCode(normalizeLang(raw));
  if (raw && GOOGLE_TRANSLATE_LANG_ALIASES[raw]) return GOOGLE_TRANSLATE_LANG_ALIASES[raw];
  return GOOGLE_WEBSITE_LANG.en;
}

/** Final direct-proxy URL (internal/legacy only — not for visible CTAs). */
export function buildDirectLeonixGoogleTranslateUrl(lang?: string | null): string {
  const googleLang = resolveGoogleTranslateLangCode(lang);
  return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(
    googleLang,
  )}&u=${encodeURIComponent(LEONIX_TRANSLATE_SITE_ORIGIN)}`;
}

/** Google Translate Websites tab — avoids leonixmedia-com.translate.goog proxy jump. */
export function buildGoogleTranslateWebsitesModeUrl(lang?: string | null): string {
  const googleLang = resolveGoogleTranslateLangCode(lang);
  const params = new URLSearchParams({
    sl: "auto",
    tl: googleLang,
    op: "websites",
  });
  return `https://translate.google.com/?${params.toString()}`;
}

/** Shown when Google may not prefill the Website input box. */
export function getGoogleTranslateWebsitesPasteHint(lang: SupportedLang): string {
  return lang === "es"
    ? "Si Google no llena el campo automáticamente, pega: leonixmedia.com"
    : "If Google does not fill the field automatically, paste: leonixmedia.com";
}

export const googleTranslateWebsitesPasteHintClass =
  "mt-1.5 text-[0.65rem] leading-snug text-[#3D3428]/80 sm:text-xs";

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
    return `${LEONIX_TRANSLATE_SITE_ORIGIN}${replaceLangInHref(safePath, lang)}`;
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

/** Visible CTA: Leonix-controlled gateway (not direct Google URL). */
export function leonixHomeGoogleTranslateUrl(
  targetLang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string; returnTo?: string },
): string {
  return translateSiteHref({
    lang: targetLang,
    sourcePage: opts?.sourcePage,
    sourceCta: opts?.sourceCta,
    returnTo: opts?.returnTo,
  });
}

export type TranslateSitePageCopy = {
  title: string;
  stepsHeading: string;
  steps: readonly [string, string, string, string];
  websiteLabel: string;
  copyButton: string;
  copiedButton: string;
  openGoogleCta: string;
  pasteInstruction: string;
  nativeFormsWarning: string;
  backLink: string;
  googleLangNote: string;
};

const TRANSLATE_SITE_STEPS_ES: TranslateSitePageCopy["steps"] = [
  "Copia leonixmedia.com.",
  "Abre Google Translate Websites.",
  "Pega leonixmedia.com en el campo Website.",
  "Selecciona tu idioma preferido.",
];

const TRANSLATE_SITE_STEPS_EN: TranslateSitePageCopy["steps"] = [
  "Copy leonixmedia.com.",
  "Open Google Translate Websites.",
  "Paste leonixmedia.com into the Website field.",
  "Select your preferred language.",
];

const TRANSLATE_SITE_STEPS_VI: TranslateSitePageCopy["steps"] = [
  "Sao chép leonixmedia.com.",
  "Mở Google Translate Websites.",
  "Dán leonixmedia.com vào ô Website.",
  "Chọn ngôn ngữ ưa thích của bạn.",
];

const TRANSLATE_SITE_STEPS_PT: TranslateSitePageCopy["steps"] = [
  "Copie leonixmedia.com.",
  "Abra Google Translate Websites.",
  "Cole leonixmedia.com no campo Website.",
  "Selecione seu idioma preferido.",
];

const TRANSLATE_SITE_STEPS_JA: TranslateSitePageCopy["steps"] = [
  "leonixmedia.comをコピーします。",
  "Google Translate Websitesを開きます。",
  "Website欄にleonixmedia.comを貼り付けます。",
  "希望の言語を選択します。",
];

const TRANSLATE_SITE_STEPS_BY_LANG: Partial<Record<SupportedLang, TranslateSitePageCopy["steps"]>> = {
  es: TRANSLATE_SITE_STEPS_ES,
  en: TRANSLATE_SITE_STEPS_EN,
  vi: TRANSLATE_SITE_STEPS_VI,
  pt: TRANSLATE_SITE_STEPS_PT,
  ja: TRANSLATE_SITE_STEPS_JA,
};

const TRANSLATE_SITE_PAGE_ES: TranslateSitePageCopy = {
  title: "Traducir LeonixMedia.com con Google",
  stepsHeading: "Pasos",
  steps: TRANSLATE_SITE_STEPS_ES,
  websiteLabel: "Sitio web",
  copyButton: "Copiar leonixmedia.com",
  copiedButton: "Copiado",
  openGoogleCta: "Abrir Google Translate Websites",
  pasteInstruction:
    "Si Google no llena el campo automáticamente, pega leonixmedia.com en el campo Website.",
  nativeFormsWarning:
    "Para contacto, publicidad, newsletter y cotizaciones, usa los formularios nativos de Leonix.",
  backLink: "Volver a Leonix",
  googleLangNote: "Google Translate abrirá el modo Websites para {origin}.",
};

const TRANSLATE_SITE_PAGE_EN: TranslateSitePageCopy = {
  title: "Translate LeonixMedia.com with Google",
  stepsHeading: "Steps",
  steps: TRANSLATE_SITE_STEPS_EN,
  websiteLabel: "Website",
  copyButton: "Copy leonixmedia.com",
  copiedButton: "Copied",
  openGoogleCta: "Open Google Translate Websites",
  pasteInstruction:
    "If Google does not fill the field automatically, paste leonixmedia.com into the Website field.",
  nativeFormsWarning:
    "For contact, advertising, newsletter, and quote requests, use Leonix native forms.",
  backLink: "Back to Leonix",
  googleLangNote: "Google Translate will open Website mode for {origin}.",
};

const TRANSLATE_SITE_PAGE_BY_LANG: Partial<Record<SupportedLang, TranslateSitePageCopy>> = {
  es: TRANSLATE_SITE_PAGE_ES,
  en: TRANSLATE_SITE_PAGE_EN,
  vi: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Dịch LeonixMedia.com bằng Google",
    stepsHeading: "Các bước",
    steps: TRANSLATE_SITE_STEPS_VI,
    websiteLabel: "Trang web",
    copyButton: "Sao chép leonixmedia.com",
    copiedButton: "Đã sao chép",
    openGoogleCta: "Mở Google Translate Websites",
    pasteInstruction:
      "Nếu Google không tự điền, hãy dán leonixmedia.com vào ô Website.",
    nativeFormsWarning:
      "Để liên hệ, quảng cáo, newsletter và báo giá, hãy dùng biểu mẫu Leonix.",
    backLink: "Quay lại Leonix",
  },
  pt: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Traduzir LeonixMedia.com com Google",
    stepsHeading: "Passos",
    steps: TRANSLATE_SITE_STEPS_PT,
    websiteLabel: "Site",
    copyButton: "Copiar leonixmedia.com",
    copiedButton: "Copiado",
    openGoogleCta: "Abrir Google Translate Websites",
    pasteInstruction:
      "Se o Google não preencher automaticamente, cole leonixmedia.com no campo Website.",
    nativeFormsWarning:
      "Para contato, publicidade, newsletter e cotações, use os formulários nativos da Leonix.",
    backLink: "Voltar para Leonix",
  },
  ja: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "GoogleでLeonixMedia.comを翻訳",
    stepsHeading: "手順",
    steps: TRANSLATE_SITE_STEPS_JA,
    websiteLabel: "ウェブサイト",
    copyButton: "leonixmedia.comをコピー",
    copiedButton: "コピーしました",
    openGoogleCta: "Google Translate Websitesを開く",
    pasteInstruction:
      "Googleが自動入力しない場合は、Website欄にleonixmedia.comを貼り付けてください。",
    nativeFormsWarning:
      "お問い合わせ、広告、ニュースレター、見積もりはLeonixのネイティブフォームをご利用ください。",
    backLink: "Leonixに戻る",
  },
  tl: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Isalin ang LeonixMedia.com gamit ang Google",
    copyButton: "Kopyahin ang leonixmedia.com",
    copiedButton: "Nakopya",
    openGoogleCta: "Buksan ang Google Translate Websites",
    pasteInstruction:
      "Kung hindi awtomatikong mapupunan ng Google, i-paste ang leonixmedia.com sa Website field.",
    backLink: "Bumalik sa Leonix",
  },
  zh: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "用 Google 翻译 LeonixMedia.com",
    websiteLabel: "网站",
    copyButton: "复制 leonixmedia.com",
    copiedButton: "已复制",
    openGoogleCta: "打开 Google Translate Websites",
    pasteInstruction: "如果 Google 没有自动填充，请将 leonixmedia.com 粘贴到 Website 字段。",
    backLink: "返回 Leonix",
  },
  ko: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Google로 LeonixMedia.com 번역",
    copyButton: "leonixmedia.com 복사",
    copiedButton: "복사됨",
    openGoogleCta: "Google Translate Websites 열기",
    backLink: "Leonix로 돌아가기",
  },
  hi: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Google से LeonixMedia.com अनुवाद करें",
    copyButton: "leonixmedia.com कॉपी करें",
    copiedButton: "कॉपी हो गया",
    openGoogleCta: "Google Translate Websites खोलें",
    backLink: "Leonix पर वापस",
  },
  hy: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Google-ով թարգմանել LeonixMedia.com-ը",
    copyButton: "Պատճենել leonixmedia.com",
    copiedButton: "Պատճենված է",
    openGoogleCta: "Բացել Google Translate Websites",
    backLink: "Վերադառնալ Leonix",
  },
  ru: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Перевести LeonixMedia.com через Google",
    copyButton: "Скопировать leonixmedia.com",
    copiedButton: "Скопировано",
    openGoogleCta: "Открыть Google Translate Websites",
    backLink: "Назад к Leonix",
  },
  pa: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "Google ਨਾਲ LeonixMedia.com ਅਨੁਵਾਦ ਕਰੋ",
    copyButton: "leonixmedia.com ਕਾਪੀ ਕਰੋ",
    copiedButton: "ਕਾਪੀ ਹੋ ਗਿਆ",
    openGoogleCta: "Google Translate Websites ਖੋਲ੍ਹੋ",
    backLink: "Leonix 'ਤੇ ਵਾਪਸ",
  },
  km: {
    ...TRANSLATE_SITE_PAGE_EN,
    title: "បកប្រែ LeonixMedia.com ជាមួយ Google",
    copyButton: "ចម្លង leonixmedia.com",
    copiedButton: "បានចម្លង",
    openGoogleCta: "បើក Google Translate Websites",
    backLink: "ត្រឡប់ទៅ Leonix",
  },
};

export function getTranslateSitePageCopy(lang: SupportedLang): TranslateSitePageCopy {
  const copy = TRANSLATE_SITE_PAGE_BY_LANG[lang] ?? TRANSLATE_SITE_PAGE_EN;
  const steps = copy.steps ?? TRANSLATE_SITE_STEPS_BY_LANG[lang] ?? TRANSLATE_SITE_STEPS_EN;
  return {
    ...TRANSLATE_SITE_PAGE_EN,
    ...copy,
    steps,
    stepsHeading: copy.stepsHeading ?? TRANSLATE_SITE_PAGE_EN.stepsHeading,
  };
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
