/** Smart translator QR gateway — honest app-open attempt with safe fallbacks. */

import type { SupportedLang } from "@/app/lib/language";
import { magazinePrintGuideHref } from "@/app/lib/magazine/qrRouteHelpers";

export const TRANSLATOR_GATEWAY_PATH = "/qr/translator";

export const TRANSLATOR_GATEWAY_TARGET_URL = "https://leonixmedia.com/qr/translator";

export const TRANSLATOR_OPEN_QR_IMAGE_PATH = "/qr/leonix-translator-open-qr.png";

/** @deprecated Use magazinePrintGuideHref(lang) — lang-less constant kept for legacy imports. */
export const MAGAZINE_PRINT_HELP_PATH = "/magazine/2026/june/read?source=print";

export function magazinePrintHelpPath(lang: SupportedLang, hash?: string): string {
  return magazinePrintGuideHref(lang, hash ? { hash } : undefined);
}

export const TRANSLATOR_GATEWAY_COPY = {
  title: {
    en: "Open a translation tool",
    es: "Abrir una herramienta de traducción",
  },
  subtitle: {
    en: "Use your phone camera translation app to read the Spanish magazine page.",
    es: "Usa una app de traducción con cámara para leer la página de la revista en español.",
  },
  opening: {
    en: "Opening a translation tool…",
    es: "Abriendo una herramienta de traducción…",
  },
  honestNote: {
    en: "Some phones open the app automatically. Others may open a website or ask you to install the app.",
    es: "Algunos teléfonos abren la app automáticamente. Otros pueden abrir un sitio web o pedir instalar la app.",
  },
  desktopMessage: {
    en: "Open this QR on your phone to launch a translation tool.",
    es: "Abre este QR con tu teléfono para iniciar una herramienta de traducción.",
  },
  backToGuide: {
    en: "Back to translation guide",
    es: "Volver a la guía de traducción",
  },
  googleLens: {
    en: "Open Google Lens",
    es: "Abrir Google Lens",
  },
  googleTranslate: {
    en: "Open Google Translate",
    es: "Abrir Google Translate",
  },
  iphoneSteps: {
    en: "iPhone translation steps",
    es: "Pasos de traducción en iPhone",
  },
} as const;

export const PRINT_TRANSLATOR_OPEN = {
  heading: {
    en: "Want to open the translator directly?",
    es: "¿Quieres abrir el traductor directamente?",
  },
  copy: {
    en: "Scan this QR with your phone or tap the button below. It will try to open Google Lens or Google Translate. If it does not open, follow the steps on this page.",
    es: "Escanea este QR con tu teléfono o toca el botón abajo. Intentará abrir Google Lens o Google Translate. Si no se abre, sigue los pasos de esta página.",
  },
  qrLabel: {
    en: "Scan to try opening a translation app",
    es: "Escanea para intentar abrir una app de traducción",
  },
  openButton: {
    en: "Open translator tool",
    es: "Abrir herramienta de traducción",
  },
  disclaimer: {
    en: "App opening depends on your phone, browser, and installed apps.",
    es: "La apertura de la app depende de tu teléfono, navegador y apps instaladas.",
  },
} as const;

export const LENS_WEB_URL = "https://lens.google/";
export const TRANSLATE_WEB_URL = "https://translate.google.com/";

/** Android Google app Lens activity with web fallback. */
export const ANDROID_LENS_APP_INTENT =
  "intent://#Intent;action=android.intent.action.VIEW;component=com.google.android.googlequicksearchbox/com.google.android.apps.search.lens.LensActivity;S.browser_fallback_url=https%3A%2F%2Flens.google%2F;end";

/** @deprecated Legacy package intent — prefer ANDROID_LENS_APP_INTENT for visible CTAs. */
export const ANDROID_LENS_INTENT =
  "intent:///#Intent;scheme=https;package=com.google.ar.lens;S.browser_fallback_url=https%3A%2F%2Flens.google%2F;end";

export const IOS_GOOGLE_LENS_SCHEME = "google://lens";

export type TranslatorDeviceKind = "android" | "ios" | "desktop";

export function detectTranslatorDevice(userAgent: string): TranslatorDeviceKind {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  return "desktop";
}

export function getGoogleLensHrefForDevice(device: "android" | "ios" | "desktop"): string {
  if (device === "android") return ANDROID_LENS_APP_INTENT;
  if (device === "ios") return IOS_GOOGLE_LENS_SCHEME;
  return LENS_WEB_URL;
}

/** One safe auto-open attempt URL for mobile; null on desktop. */
export function getTranslatorAutoOpenUrl(device: TranslatorDeviceKind): string | null {
  if (device === "android") return ANDROID_LENS_APP_INTENT;
  if (device === "ios") return IOS_GOOGLE_LENS_SCHEME;
  return null;
}
