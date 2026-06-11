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
};

export function getTranslatorPageCopy(lang: SupportedLang): TranslatorPageCopy {
  return TRANSLATOR_BY_LANG[lang] ?? TRANSLATOR_EN;
}

export { QR_GUIDE_ES, QR_GUIDE_EN };
