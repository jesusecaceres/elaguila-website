import type { SupportedLang } from "@/app/lib/language";
import { QR_GUIDE_EN } from "./en";
import { QR_GUIDE_ES } from "./es";
import { QR_GUIDE_COMMUNITY } from "./community";
import type { QrGuideCopy, TranslatorPageCopy } from "./types";

const QR_GUIDE_REGISTRY: Record<SupportedLang, QrGuideCopy> = {
  es: QR_GUIDE_ES,
  en: QR_GUIDE_EN,
  vi: QR_GUIDE_COMMUNITY.vi!,
  pt: QR_GUIDE_COMMUNITY.pt!,
  tl: QR_GUIDE_COMMUNITY.tl!,
  km: QR_GUIDE_COMMUNITY.km ?? QR_GUIDE_EN,
  zh: QR_GUIDE_COMMUNITY.zh ?? QR_GUIDE_EN,
  ja: QR_GUIDE_COMMUNITY.ja!,
  ko: QR_GUIDE_COMMUNITY.ko ?? QR_GUIDE_EN,
  hi: QR_GUIDE_COMMUNITY.hi ?? QR_GUIDE_EN,
  hy: QR_GUIDE_COMMUNITY.hy ?? QR_GUIDE_EN,
  ru: QR_GUIDE_COMMUNITY.ru ?? QR_GUIDE_EN,
  pa: QR_GUIDE_COMMUNITY.pa ?? QR_GUIDE_EN,
};

export function getQrGuideCopy(lang: SupportedLang): QrGuideCopy {
  return QR_GUIDE_REGISTRY[lang] ?? QR_GUIDE_EN;
}

const TRANSLATOR_EN: TranslatorPageCopy = {
  eyebrow: "LEONIX · TRANSLATION OPTIONS",
  title: "Choose your translation path",
  intro:
    "First choose your device. Then open Google Lens for visual pages or Google Translate to browse LeonixMedia.com.",
  honestNote:
    "Depending on your phone, browser, and installed apps, these links may open an app, a webpage, an install page, or a search page.",
  nativeFormsNote:
    "For contact, advertising, newsletter, and quote requests, use Leonix native forms.",
  deviceChoiceAndroid: "Android / Samsung / Google",
  deviceChoiceIphone: "iPhone / Apple",
  deviceChoiceWeb: "Computer / Web",
  lensWebFallback: "If it does not open, use Lens web",
  android: {
    title: "Android / Samsung / Google",
    bestFor:
      "Best for translating printed magazines, screens, screenshots, and visual pages with Google Lens.",
    steps: [
      "Tap “Open Google Lens on Android”.",
      "If the app opens, point at the magazine, screen, or screenshot.",
      "Tap Translate.",
      "Choose your language.",
      "Return to Leonix for links, maps, Media Kit, and actions.",
    ],
    openLensCta: "Open Google Lens on Android",
    translateCta: "Translate LeonixMedia.com with Google",
  },
  iphone: {
    title: "iPhone / Apple",
    bestFor:
      "Best for using the Google app, Camera/Live Text, Apple Translate, or screenshots from Photos.",
    steps: [
      "Tap “Open Google Lens on iPhone”.",
      "If iPhone asks “Open in Google?”, tap Open.",
      "If it does not open, use Lens web, Camera/Live Text, or a screenshot in Photos.",
      "Tap Translate or select the text.",
      "Choose your language and return to Leonix.",
    ],
    openLensCta: "Open Google Lens on iPhone",
    translateCta: "Translate LeonixMedia.com with Google",
  },
  web: {
    title: "Computer / Web",
    bestFor:
      "Best for browsing LeonixMedia.com in another language using Google Translate Website Mode.",
    steps: [
      "Tap “Translate LeonixMedia.com with Google”.",
      "Google Translate will open LeonixMedia.com already loaded.",
      "Choose your language if needed.",
      "For contact, advertising, newsletter, and quote requests, use Leonix native forms.",
    ],
    translateCta: "Translate LeonixMedia.com with Google",
  },
  fullQrGuideCta: "View full QR guide",
};

const TRANSLATOR_ES: TranslatorPageCopy = {
  eyebrow: "LEONIX · OPCIONES DE TRADUCCIÓN",
  title: "Elige tu camino de traducción",
  intro:
    "Primero elige tu dispositivo. Después abre Google Lens para páginas visuales o Google Translate para navegar LeonixMedia.com.",
  honestNote:
    "Según tu teléfono, navegador y apps instaladas, estos enlaces pueden abrir una app, una página web, una página de instalación o una búsqueda.",
  nativeFormsNote:
    "Para contacto, publicidad, newsletter y cotizaciones, usa los formularios nativos de Leonix.",
  deviceChoiceAndroid: "Android / Samsung / Google",
  deviceChoiceIphone: "iPhone / Apple",
  deviceChoiceWeb: "Computadora / Web",
  lensWebFallback: "Si no abre, usar Lens web",
  android: {
    title: "Android / Samsung / Google",
    bestFor:
      "Mejor para traducir revista impresa, pantallas, capturas y páginas visuales con Google Lens.",
    steps: [
      "Toca “Abrir Google Lens en Android”.",
      "Si se abre la app, apunta a la revista, pantalla o captura.",
      "Toca Traducir.",
      "Elige tu idioma.",
      "Regresa a Leonix para enlaces, mapas, Media Kit y acciones.",
    ],
    openLensCta: "Abrir Google Lens en Android",
    translateCta: "Traducir LeonixMedia.com con Google",
  },
  iphone: {
    title: "iPhone / Apple",
    bestFor:
      "Mejor para usar Google app, Cámara/Live Text, Apple Translate o capturas desde Fotos.",
    steps: [
      "Toca “Abrir Google Lens en iPhone”.",
      "Si iPhone pregunta “Abrir en Google”, toca Abrir.",
      "Si no se abre, usa Lens web, Cámara/Live Text o una captura en Fotos.",
      "Toca Traducir o selecciona el texto.",
      "Elige tu idioma y regresa a Leonix.",
    ],
    openLensCta: "Abrir Google Lens en iPhone",
    translateCta: "Traducir LeonixMedia.com con Google",
  },
  web: {
    title: "Computadora / Web",
    bestFor:
      "Mejor para navegar LeonixMedia.com en otro idioma usando Google Translate Website Mode.",
    steps: [
      "Toca “Traducir LeonixMedia.com con Google”.",
      "Google Translate abrirá LeonixMedia.com ya cargado.",
      "Elige tu idioma si hace falta.",
      "Para contacto, publicidad, newsletter y cotizaciones, usa formularios nativos de Leonix.",
    ],
    translateCta: "Traducir LeonixMedia.com con Google",
  },
  fullQrGuideCta: "Ver guía completa QR",
};

const TRANSLATOR_BY_LANG: Partial<Record<SupportedLang, TranslatorPageCopy>> = {
  es: TRANSLATOR_ES,
  en: TRANSLATOR_EN,
  vi: {
    ...TRANSLATOR_EN,
    eyebrow: "LEONIX · TÙY CHỌN DỊCH",
    title: "Chọn cách dịch của bạn",
    intro:
      "Trước tiên chọn thiết bị. Sau đó mở Google Lens cho trang trực quan hoặc Google Translate để duyệt LeonixMedia.com.",
    honestNote:
      "Tùy điện thoại, trình duyệt và ứng dụng đã cài, các liên kết này có thể mở app, trang web, trang cài đặt hoặc trang tìm kiếm.",
    nativeFormsNote:
      "Để liên hệ, quảng cáo, newsletter và báo giá, hãy dùng biểu mẫu Leonix.",
    deviceChoiceAndroid: "Android / Samsung / Google",
    deviceChoiceIphone: "iPhone / Apple",
    deviceChoiceWeb: "Máy tính / Web",
    lensWebFallback: "Nếu không mở được, dùng Lens web",
    android: {
      ...TRANSLATOR_EN.android,
      title: "Android / Samsung / Google",
      bestFor:
        "Tốt nhất để dịch tạp chí in, màn hình, ảnh chụp và trang trực quan bằng Google Lens.",
      openLensCta: "Mở Google Lens trên Android",
      translateCta: "Dịch LeonixMedia.com bằng Google",
    },
    iphone: {
      ...TRANSLATOR_EN.iphone,
      title: "iPhone / Apple",
      bestFor:
        "Tốt nhất để dùng ứng dụng Google, Camera/Live Text, Apple Translate hoặc ảnh chụp từ Photos.",
      openLensCta: "Mở Google Lens trên iPhone",
      translateCta: "Dịch LeonixMedia.com bằng Google",
    },
    web: {
      ...TRANSLATOR_EN.web,
      title: "Máy tính / Web",
      bestFor:
        "Tốt nhất để duyệt LeonixMedia.com bằng ngôn ngữ khác với Google Translate Website Mode.",
      translateCta: "Dịch LeonixMedia.com bằng Google",
    },
    fullQrGuideCta: "Xem hướng dẫn QR đầy đủ",
  },
  pt: {
    ...TRANSLATOR_EN,
    eyebrow: "LEONIX · OPÇÕES DE TRADUÇÃO",
    title: "Escolha seu caminho de tradução",
    intro:
      "Primeiro escolha seu dispositivo. Depois abra o Google Lens para páginas visuais ou o Google Translate para navegar em LeonixMedia.com.",
    honestNote:
      "Dependendo do seu telefone, navegador e apps instalados, estes links podem abrir um app, uma página web, uma página de instalação ou uma página de busca.",
    nativeFormsNote:
      "Para contato, publicidade, newsletter e cotações, use os formulários nativos da Leonix.",
    deviceChoiceAndroid: "Android / Samsung / Google",
    deviceChoiceIphone: "iPhone / Apple",
    deviceChoiceWeb: "Computador / Web",
    lensWebFallback: "Se não abrir, use Lens web",
    android: {
      ...TRANSLATOR_EN.android,
      title: "Android / Samsung / Google",
      bestFor:
        "Melhor para traduzir revistas impressas, telas, capturas e páginas visuais com Google Lens.",
      openLensCta: "Abrir Google Lens no Android",
      translateCta: "Traduzir LeonixMedia.com com Google",
    },
    iphone: {
      ...TRANSLATOR_EN.iphone,
      title: "iPhone / Apple",
      bestFor:
        "Melhor para usar o app Google, Câmera/Live Text, Apple Translate ou capturas do Fotos.",
      openLensCta: "Abrir Google Lens no iPhone",
      translateCta: "Traduzir LeonixMedia.com com Google",
    },
    web: {
      ...TRANSLATOR_EN.web,
      title: "Computador / Web",
      bestFor:
        "Melhor para navegar LeonixMedia.com em outro idioma usando Google Translate Website Mode.",
      translateCta: "Traduzir LeonixMedia.com com Google",
    },
    fullQrGuideCta: "Ver guia QR completo",
  },
  ja: {
    ...TRANSLATOR_EN,
    eyebrow: "LEONIX · 翻訳オプション",
    title: "翻訳方法を選ぶ",
    intro:
      "まずデバイスを選びます。視覚ページにはGoogle Lens、LeonixMedia.comの閲覧にはGoogle Translateを開きます。",
    honestNote:
      "端末、ブラウザ、インストール済みアプリによって、これらのリンクはアプリ、Webページ、インストールページ、または検索ページを開く場合があります。",
    nativeFormsNote:
      "お問い合わせ、広告、ニュースレター、見積もりはLeonixのネイティブフォームをご利用ください。",
    deviceChoiceAndroid: "Android / Samsung / Google",
    deviceChoiceIphone: "iPhone / Apple",
    deviceChoiceWeb: "コンピュータ / Web",
    lensWebFallback: "開かない場合はLens webを使用",
    android: {
      ...TRANSLATOR_EN.android,
      title: "Android / Samsung / Google",
      bestFor:
        "Google Lensで印刷雑誌、画面、スクリーンショット、視覚ページを翻訳するのに最適です。",
      openLensCta: "AndroidでGoogle Lensを開く",
      translateCta: "GoogleでLeonixMedia.comを翻訳",
    },
    iphone: {
      ...TRANSLATOR_EN.iphone,
      title: "iPhone / Apple",
      bestFor:
        "Googleアプリ、カメラ/Live Text、Apple Translate、またはPhotosのスクリーンショットに最適です。",
      openLensCta: "iPhoneでGoogle Lensを開く",
      translateCta: "GoogleでLeonixMedia.comを翻訳",
    },
    web: {
      ...TRANSLATOR_EN.web,
      title: "コンピュータ / Web",
      bestFor:
        "Google Translate Website ModeでLeonixMedia.comを別言語で閲覧するのに最適です。",
      translateCta: "GoogleでLeonixMedia.comを翻訳",
    },
    fullQrGuideCta: "QRガイド全文を見る",
  },
  tl: {
    ...TRANSLATOR_EN,
    eyebrow: "LEONIX · MGA OPSYON SA PAGSASALIN",
    title: "Piliin ang iyong landas ng pagsasalin",
    intro:
      "Una piliin ang iyong device. Pagkatapos buksan ang Google Lens para sa visual pages o Google Translate para mag-browse sa LeonixMedia.com.",
    nativeFormsNote:
      "Para sa contact, advertising, newsletter, at quote requests, gamitin ang Leonix native forms.",
    android: {
      ...TRANSLATOR_EN.android,
      openLensCta: "Buksan ang Google Lens sa Android",
      translateCta: "Isalin ang LeonixMedia.com gamit ang Google",
    },
    iphone: {
      ...TRANSLATOR_EN.iphone,
      openLensCta: "Buksan ang Google Lens sa iPhone",
      translateCta: "Isalin ang LeonixMedia.com gamit ang Google",
    },
    web: {
      ...TRANSLATOR_EN.web,
      translateCta: "Isalin ang LeonixMedia.com gamit ang Google",
    },
    fullQrGuideCta: "Tingnan ang buong QR guide",
  },
  zh: {
    ...TRANSLATOR_EN,
    eyebrow: "LEONIX · 翻译选项",
    title: "选择您的翻译路径",
    intro: "首先选择您的设备。然后打开 Google Lens 处理视觉页面，或使用 Google Translate 浏览 LeonixMedia.com。",
    nativeFormsNote: "联系、广告、newsletter 和报价请使用 Leonix 原生表单。",
    android: { ...TRANSLATOR_EN.android, openLensCta: "在 Android 上打开 Google Lens", translateCta: "用 Google 翻译 LeonixMedia.com" },
    iphone: { ...TRANSLATOR_EN.iphone, openLensCta: "在 iPhone 上打开 Google Lens", translateCta: "用 Google 翻译 LeonixMedia.com" },
    web: { ...TRANSLATOR_EN.web, translateCta: "用 Google 翻译 LeonixMedia.com" },
    fullQrGuideCta: "查看完整 QR 指南",
  },
  ko: {
    ...TRANSLATOR_EN,
    eyebrow: "LEONIX · 번역 옵션",
    title: "번역 경로 선택",
    intro: "먼저 기기를 선택하세요. 시각 페이지는 Google Lens, LeonixMedia.com 탐색은 Google Translate를 여세요.",
    android: { ...TRANSLATOR_EN.android, openLensCta: "Android에서 Google Lens 열기", translateCta: "Google로 LeonixMedia.com 번역" },
    iphone: { ...TRANSLATOR_EN.iphone, openLensCta: "iPhone에서 Google Lens 열기", translateCta: "Google로 LeonixMedia.com 번역" },
    web: { ...TRANSLATOR_EN.web, translateCta: "Google로 LeonixMedia.com 번역" },
    fullQrGuideCta: "전체 QR 가이드 보기",
  },
  hi: {
    ...TRANSLATOR_EN,
    android: { ...TRANSLATOR_EN.android, translateCta: "Google से LeonixMedia.com अनुवाद करें" },
    iphone: { ...TRANSLATOR_EN.iphone, translateCta: "Google से LeonixMedia.com अनुवाद करें" },
    web: { ...TRANSLATOR_EN.web, translateCta: "Google से LeonixMedia.com अनुवाद करें" },
  },
  hy: {
    ...TRANSLATOR_EN,
    android: { ...TRANSLATOR_EN.android, translateCta: "Google-ով թարգմանել LeonixMedia.com-ը" },
    iphone: { ...TRANSLATOR_EN.iphone, translateCta: "Google-ով թարգմանել LeonixMedia.com-ը" },
    web: { ...TRANSLATOR_EN.web, translateCta: "Google-ով թարգմանել LeonixMedia.com-ը" },
  },
  ru: {
    ...TRANSLATOR_EN,
    android: { ...TRANSLATOR_EN.android, translateCta: "Перевести LeonixMedia.com через Google" },
    iphone: { ...TRANSLATOR_EN.iphone, translateCta: "Перевести LeonixMedia.com через Google" },
    web: { ...TRANSLATOR_EN.web, translateCta: "Перевести LeonixMedia.com через Google" },
  },
  pa: {
    ...TRANSLATOR_EN,
    android: { ...TRANSLATOR_EN.android, translateCta: "Google ਨਾਲ LeonixMedia.com ਅਨੁਵਾਦ ਕਰੋ" },
    iphone: { ...TRANSLATOR_EN.iphone, translateCta: "Google ਨਾਲ LeonixMedia.com ਅਨੁਵਾਦ ਕਰੋ" },
    web: { ...TRANSLATOR_EN.web, translateCta: "Google ਨਾਲ LeonixMedia.com ਅਨੁਵਾਦ ਕਰੋ" },
  },
  km: {
    ...TRANSLATOR_EN,
    android: { ...TRANSLATOR_EN.android, translateCta: "បកប្រែ LeonixMedia.com ជាមួយ Google" },
    iphone: { ...TRANSLATOR_EN.iphone, translateCta: "បកប្រែ LeonixMedia.com ជាមួយ Google" },
    web: { ...TRANSLATOR_EN.web, translateCta: "បកប្រែ LeonixMedia.com ជាមួយ Google" },
  },
};

export function getTranslatorPageCopy(lang: SupportedLang): TranslatorPageCopy {
  return TRANSLATOR_BY_LANG[lang] ?? TRANSLATOR_EN;
}

export type ComingSoonQrCtaCopy = {
  translationOptions: string;
  tryLens: string;
  translateLeonix: string;
  qrGuide: string;
  guardrail: string;
};

const COMING_SOON_QR_ES: ComingSoonQrCtaCopy = {
  translationOptions: "Ver opciones de traducción",
  tryLens: "Probar Google Lens",
  translateLeonix: "Traducir LeonixMedia.com con Google",
  qrGuide: "Ver guía QR",
  guardrail:
    "Google Lens ayuda con páginas impresas, pantallas y capturas. Google Translate ayuda a navegar LeonixMedia.com en otro idioma.",
};

const COMING_SOON_QR_EN: ComingSoonQrCtaCopy = {
  translationOptions: "View translation options",
  tryLens: "Try Google Lens",
  translateLeonix: "Translate LeonixMedia.com with Google",
  qrGuide: "View QR guide",
  guardrail:
    "Google Lens helps with printed pages, screens, and screenshots. Google Translate helps browse LeonixMedia.com in another language.",
};

const COMING_SOON_QR_BY_LANG: Partial<Record<SupportedLang, ComingSoonQrCtaCopy>> = {
  es: COMING_SOON_QR_ES,
  en: COMING_SOON_QR_EN,
  vi: {
    ...COMING_SOON_QR_EN,
    translationOptions: "Xem tùy chọn dịch",
    tryLens: "Thử Google Lens",
    translateLeonix: "Dịch LeonixMedia.com bằng Google",
    qrGuide: "Xem hướng dẫn QR",
    guardrail:
      "Google Lens giúp với trang in, màn hình và ảnh chụp. Google Translate giúp duyệt LeonixMedia.com bằng ngôn ngữ khác.",
  },
  pt: {
    ...COMING_SOON_QR_EN,
    translationOptions: "Ver opções de tradução",
    tryLens: "Experimentar Google Lens",
    translateLeonix: "Traduzir LeonixMedia.com com Google",
    qrGuide: "Ver guia QR",
    guardrail:
      "Google Lens ajuda com páginas impressas, telas e capturas. Google Translate ajuda a navegar LeonixMedia.com em outro idioma.",
  },
  ja: {
    ...COMING_SOON_QR_EN,
    translationOptions: "翻訳オプションを見る",
    tryLens: "Google Lensを試す",
    translateLeonix: "GoogleでLeonixMedia.comを翻訳",
    qrGuide: "QRガイドを見る",
    guardrail:
      "Google Lensは印刷ページ、画面、スクリーンショットに役立ちます。Google TranslateはLeonixMedia.comを別言語で閲覧するのに役立ちます。",
  },
  tl: {
    ...COMING_SOON_QR_EN,
    translationOptions: "Tingnan ang mga opsyon sa pagsasalin",
    tryLens: "Subukan ang Google Lens",
    translateLeonix: "Isalin ang LeonixMedia.com gamit ang Google",
    qrGuide: "Tingnan ang QR guide",
  },
  zh: {
    ...COMING_SOON_QR_EN,
    translationOptions: "查看翻译选项",
    tryLens: "试用 Google Lens",
    translateLeonix: "用 Google 翻译 LeonixMedia.com",
    qrGuide: "查看 QR 指南",
  },
  ko: {
    ...COMING_SOON_QR_EN,
    translationOptions: "번역 옵션 보기",
    tryLens: "Google Lens 사용해 보기",
    translateLeonix: "Google로 LeonixMedia.com 번역",
    qrGuide: "QR 가이드 보기",
  },
  hi: {
    ...COMING_SOON_QR_EN,
    translationOptions: "अनुवाद विकल्प देखें",
    translateLeonix: "Google से LeonixMedia.com अनुवाद करें",
    qrGuide: "QR गाइड देखें",
  },
  hy: {
    ...COMING_SOON_QR_EN,
    translationOptions: "Դիտել թարգմանության տարբերակները",
    translateLeonix: "Google-ով թարգմանել LeonixMedia.com-ը",
    qrGuide: "Դիտել QR ուղեցույցը",
  },
  ru: {
    ...COMING_SOON_QR_EN,
    translationOptions: "Смотреть варианты перевода",
    translateLeonix: "Перевести LeonixMedia.com через Google",
    qrGuide: "Смотреть QR-гид",
  },
  pa: {
    ...COMING_SOON_QR_EN,
    translationOptions: "ਅਨੁਵਾਦ ਵਿਕਲਪ ਦੇਖੋ",
    translateLeonix: "Google ਨਾਲ LeonixMedia.com ਅਨੁਵਾਦ ਕਰੋ",
    qrGuide: "QR ਗਾਈਡ ਦੇਖੋ",
  },
  km: {
    ...COMING_SOON_QR_EN,
    translationOptions: "មើលជម្រើសបកប្រែ",
    translateLeonix: "បកប្រែ LeonixMedia.com ជាមួយ Google",
    qrGuide: "មើលការណែនាំ QR",
  },
};

export function getComingSoonQrCtaCopy(lang: SupportedLang): ComingSoonQrCtaCopy {
  return COMING_SOON_QR_BY_LANG[lang] ?? COMING_SOON_QR_EN;
}

export { QR_GUIDE_ES, QR_GUIDE_EN };
