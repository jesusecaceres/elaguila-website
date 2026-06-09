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
  eyebrow: "Leonix · Translation options",
  title: "Translation options",
  subtitle: "Use your phone’s camera translation tools to read the Spanish visual magazine page.",
  honestNote:
    "Depending on your phone, browser, and installed apps, these links may open an app, a webpage, an install page, or a search page.",
  desktopMessage: "These options work best from your phone. Open this page on your phone or use the QR guide steps on another device.",
  tryGoogleLens: "Try Google Lens",
  tryGoogleTranslate: "Try Google Translate",
  translateWebsite: "Translate Leonix website",
  backToGuide: "Back to QR guide",
  mobileScreenshotHint:
    "If an app does not open, take a screenshot of the magazine page and use Lens or Translate on the image.",
};

const TRANSLATOR_ES: TranslatorPageCopy = {
  eyebrow: "Leonix · Opciones de traducción",
  title: "Opciones de traducción",
  subtitle: "Usa herramientas de traducción con cámara para leer la revista visual en español.",
  honestNote:
    "Según tu teléfono, navegador y apps instaladas, estos enlaces pueden abrir una app, una página web, una página de instalación o una búsqueda.",
  desktopMessage: "Estas opciones funcionan mejor desde tu teléfono. Abre esta página en tu teléfono o sigue la guía QR en otro dispositivo.",
  tryGoogleLens: "Probar Google Lens",
  tryGoogleTranslate: "Probar Google Translate",
  translateWebsite: "Traducir sitio Leonix",
  backToGuide: "Volver a la guía QR",
  mobileScreenshotHint:
    "Si no se abre una app, toma una captura de la página de la revista y usa Lens o Translate en la imagen.",
};

const TRANSLATOR_BY_LANG: Partial<Record<SupportedLang, TranslatorPageCopy>> = {
  es: TRANSLATOR_ES,
  en: TRANSLATOR_EN,
  vi: {
    ...TRANSLATOR_EN,
    eyebrow: "Leonix · Tùy chọn dịch",
    title: "Tùy chọn dịch",
    subtitle: "Dùng công cụ dịch camera để đọc tạp chí hình ảnh tiếng Tây Ban Nha.",
    honestNote: "Tùy điện thoại, trình duyệt và app, liên kết có thể mở app, trang web, trang cài đặt hoặc tìm kiếm.",
    desktopMessage: "Các tùy chọn này hoạt động tốt nhất trên điện thoại.",
    tryGoogleLens: "Thử Google Lens",
    tryGoogleTranslate: "Thử Google Translate",
    translateWebsite: "Dịch trang web Leonix",
    backToGuide: "Quay lại hướng dẫn QR",
    mobileScreenshotHint: "Nếu app không mở, chụp màn hình trang tạp chí và dùng Lens hoặc Translate trên ảnh.",
  },
  pt: {
    ...TRANSLATOR_EN,
    eyebrow: "Leonix · Opções de tradução",
    title: "Opções de tradução",
    subtitle: "Use ferramentas de tradução com câmera para ler a revista visual em espanhol.",
    honestNote: "Dependendo do telefone, navegador e apps, os links podem abrir app, página web, instalação ou busca.",
    desktopMessage: "Estas opções funcionam melhor no telefone.",
    tryGoogleLens: "Experimentar Google Lens",
    tryGoogleTranslate: "Experimentar Google Translate",
    translateWebsite: "Traduzir site Leonix",
    backToGuide: "Voltar ao guia QR",
    mobileScreenshotHint: "Se o app não abrir, tire captura da página e use Lens ou Translate na imagem.",
  },
  ja: {
    ...TRANSLATOR_EN,
    eyebrow: "Leonix · 翻訳オプション",
    title: "翻訳オプション",
    subtitle: "カメラ翻訳ツールでスペイン語の視覚雑誌を読んでください。",
    honestNote: "端末、ブラウザ、アプリにより、リンクはアプリ、ウェブページ、インストールページ、検索ページを開く場合があります。",
    desktopMessage: "これらのオプションはスマートフォンで最も効果的です。",
    tryGoogleLens: "Google Lens を試す",
    tryGoogleTranslate: "Google Translate を試す",
    translateWebsite: "Leonixサイトを翻訳",
    backToGuide: "QRガイドに戻る",
    mobileScreenshotHint: "アプリが開かない場合はスクリーンショットを撮り、画像でLensまたはTranslateを使用してください。",
  },
  tl: {
    ...TRANSLATOR_EN,
    title: "Mga opsyon sa pagsasalin",
    backToGuide: "Bumalik sa QR guide",
    tryGoogleLens: "Subukan ang Google Lens",
    tryGoogleTranslate: "Subukan ang Google Translate",
    translateWebsite: "Isalin ang Leonix website",
  },
};

export function getTranslatorPageCopy(lang: SupportedLang): TranslatorPageCopy {
  return TRANSLATOR_BY_LANG[lang] ?? TRANSLATOR_EN;
}

export { QR_GUIDE_ES, QR_GUIDE_EN };
