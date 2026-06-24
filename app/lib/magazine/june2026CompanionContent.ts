import { JUNE_2026 } from "@/app/(site)/magazine/2026/june/issueContent";
import { mediaKitPageHref, mediaKitAdvertisingContactHref } from "@/app/lib/leonix/mediaKitRoutes";
import { translateSiteHref } from "@/app/lib/googleTranslateWebsite";
import type { SupportedLang } from "@/app/lib/language";
import { magazinePrintGuideHref, translatorGatewayHref } from "@/app/lib/magazine/qrRouteHelpers";

export const JUNE_2026_COMPANION_PATH = "/magazine/2026/june/companion";

/** MAG-COMPANION-LANG1 — full native community companion body copy pending; labels localized where noted. */
export type CompanionCopyLang = "es" | "en";

export type CompanionActionCard = {
  id: string;
  title: string;
  summary: string;
};

export type CompanionSection = {
  id: string;
  title: string;
  summary: string;
  bullets?: readonly string[];
  cards?: readonly CompanionActionCard[];
};

export type June2026CompanionCopy = {
  eyebrow: string;
  pageTitle: string;
  issueLabel: string;
  introSummary: string;
  visualTruthNote: string;
  sections: readonly CompanionSection[];
  ctas: {
    actionsTitle: string;
    openVisualMagazine: string;
    qrGuide: string;
    mediaKit: string;
    advertise: string;
    googleTranslate: string;
    backToQrGuide: string;
  };
};

export type June2026CompanionLinks = {
  visualMagazineHref: string;
  qrGuideHref: string;
  mediaKitHref: string;
  advertiseHref: string;
  googleTranslateHref: string;
  qrReadGuideHref: string;
};

const COMPANION_ES: June2026CompanionCopy = {
  eyebrow: "LEONIX · COMPAÑERO LEGIBLE",
  pageTitle: "Compañero legible — Junio 2026",
  issueLabel: "Leonix Media · Junio 2026",
  introSummary:
    "Esta página HTML es un compañero legible para la revista visual de junio. Resume temas, negocios y acciones en tu idioma — no reemplaza el PDF ni el flipbook en español.",
  visualTruthNote:
    "La edición visual original (PDF y flipbook) permanece en español. Leonix no traduce automáticamente ese archivo visual.",
  sections: [
    {
      id: "issue-intro",
      title: "Introducción de la edición",
      summary:
        "La edición de junio 2026 conecta negocios locales, comunidad latina y recursos del Bay Area. Este compañero resume la edición para lectura móvil rápida.",
      bullets: [
        "Revista visual original en español — diseño impreso y digital.",
        "Compañero legible multilingüe para entender y actuar.",
        "Enlaces a clasificados, contacto y herramientas de traducción.",
      ],
    },
    {
      id: "featured-businesses",
      title: "Negocios locales destacados",
      summary:
        "La edición incluye espacios para restaurantes, servicios, salud, belleza y comercios comunitarios. Los resúmenes aquí son orientativos — no copian texto exacto del anuncio impreso.",
      cards: [
        {
          id: "food-local",
          title: "Comida y restaurantes",
          summary: "Anuncios de comida local con ubicación, menú y contacto del anunciante.",
        },
        {
          id: "services",
          title: "Servicios profesionales",
          summary: "Plomería, electricidad, limpieza, reparaciones y servicios del hogar.",
        },
        {
          id: "wellness",
          title: "Salud y bienestar",
          summary: "Clínicas, dentistas, belleza y servicios comunitarios de salud.",
        },
      ],
    },
    {
      id: "community-resources",
      title: "Comunidad y recursos",
      summary:
        "Leonix conecta lectores con clasificados, oportunidades locales y herramientas comunitarias del ecosistema El Águila.",
      bullets: [
        "Rentas, empleos, autos y artículos en venta.",
        "Eventos, mascotas, busco y apoyo local.",
        "Negocios Locales con teléfono, mapa y enlaces en un solo perfil.",
      ],
    },
    {
      id: "ads-actions",
      title: "Anuncios y acciones de negocio",
      summary:
        "Los anuncios impresos llevan a acciones concretas: llamar, visitar, solicitar cotización o explorar el sitio Leonix en tu idioma.",
      bullets: [
        "QR desde anuncios hacia acciones móviles.",
        "Formularios nativos de Leonix para contacto y cotizaciones.",
        "Media Kit para opciones publicitarias — sin precios en esta vista.",
      ],
    },
    {
      id: "qr-translation",
      title: "QR y ayuda de traducción",
      summary:
        "Si llegaste desde un QR impreso, usa la guía de traducción para páginas visuales y el compañero legible para entender y conectar.",
      bullets: [
        "Google Lens o Apple Translate para páginas visuales impresas.",
        "Este compañero HTML para resúmenes legibles.",
        "Google Translate Websites para navegar leonixmedia.com.",
      ],
    },
    {
      id: "advertise-leonix",
      title: "Anuncia con Leonix",
      summary:
        "Conecta tu negocio con lectores locales en revista impresa, edición digital y presencia bilingüe. Solicita información publicitaria sin compromiso en esta vista.",
    },
  ],
  ctas: {
    actionsTitle: "Acciones rápidas",
    openVisualMagazine: "Abrir revista visual original (español)",
    qrGuide: "Abrir guía QR de traducción",
    mediaKit: "Ver Media Kit",
    advertise: "Anunciar con Leonix",
    googleTranslate: "Traducir LeonixMedia.com con Google",
    backToQrGuide: "Volver a la guía QR",
  },
};

const COMPANION_EN: June2026CompanionCopy = {
  eyebrow: "LEONIX · READABLE COMPANION",
  pageTitle: "Readable companion — June 2026",
  issueLabel: "Leonix Media · June 2026",
  introSummary:
    "This HTML page is a readable companion to the June visual magazine. It summarizes themes, businesses, and actions in your language — it does not replace the Spanish PDF or flipbook.",
  visualTruthNote:
    "The original visual edition (PDF and flipbook) remains in Spanish. Leonix does not automatically translate that visual file.",
  sections: [
    {
      id: "issue-intro",
      title: "Issue introduction",
      summary:
        "The June 2026 issue connects local businesses, Latino community, and Bay Area resources. This companion summarizes the issue for quick mobile reading.",
      bullets: [
        "Original visual magazine in Spanish — print and digital design.",
        "Multilingual readable companion to understand and act.",
        "Links to classifieds, contact, and translation tools.",
      ],
    },
    {
      id: "featured-businesses",
      title: "Featured local businesses",
      summary:
        "The issue includes space for restaurants, services, health, beauty, and community businesses. Summaries here are guides — not exact copies of print ad text.",
      cards: [
        {
          id: "food-local",
          title: "Food & restaurants",
          summary: "Local food ads with location, menu, and advertiser contact.",
        },
        {
          id: "services",
          title: "Professional services",
          summary: "Plumbing, electrical, cleaning, repairs, and home services.",
        },
        {
          id: "wellness",
          title: "Health & wellness",
          summary: "Clinics, dentists, beauty, and community health services.",
        },
      ],
    },
    {
      id: "community-resources",
      title: "Community & resources",
      summary:
        "Leonix connects readers with classifieds, local opportunities, and community tools in the El Águila ecosystem.",
      bullets: [
        "Rentals, jobs, autos, and items for sale.",
        "Events, pets, wanted posts, and local support.",
        "Local Businesses profiles with phone, map, and links in one place.",
      ],
    },
    {
      id: "ads-actions",
      title: "Ads & business actions",
      summary:
        "Print ads lead to concrete actions: call, visit, request a quote, or explore Leonix in your language.",
      bullets: [
        "QR from ads to mobile actions.",
        "Leonix native forms for contact and quotes.",
        "Media Kit for advertising options — no pricing in this view.",
      ],
    },
    {
      id: "qr-translation",
      title: "QR & translation help",
      summary:
        "If you arrived from a print QR, use the translation guide for visual pages and this readable companion to understand and connect.",
      bullets: [
        "Google Lens or Apple Translate for printed visual pages.",
        "This HTML companion for readable summaries.",
        "Google Translate Websites to browse leonixmedia.com.",
      ],
    },
    {
      id: "advertise-leonix",
      title: "Advertise with Leonix",
      summary:
        "Connect your business with local readers in print magazine, digital edition, and bilingual presence. Request advertising information with no obligation in this view.",
    },
  ],
  ctas: {
    actionsTitle: "Quick actions",
    openVisualMagazine: "Open original visual magazine (Spanish)",
    qrGuide: "Open QR translation guide",
    mediaKit: "View Media Kit",
    advertise: "Advertise with Leonix",
    googleTranslate: "Translate LeonixMedia.com with Google",
    backToQrGuide: "Back to QR guide",
  },
};

const COMPANION_BY_LANG: Record<CompanionCopyLang, June2026CompanionCopy> = {
  es: COMPANION_ES,
  en: COMPANION_EN,
};

export function companionCopyLang(lang: SupportedLang): CompanionCopyLang {
  return lang === "es" ? "es" : "en";
}

export function getJune2026CompanionCopy(lang: SupportedLang): June2026CompanionCopy {
  return COMPANION_BY_LANG[companionCopyLang(lang)];
}

/** CTA label for read page → companion entry. */
export function getCompanionOpenLabel(lang: SupportedLang): string {
  const labels: Record<SupportedLang, string> = {
    es: "Abrir versión legible",
    en: "Open readable companion",
    vi: "Mở bản đọc được",
    pt: "Abrir versão legível",
    tl: "Buksan ang nababasang companion",
    km: "បើកជំនួយការអាន",
    zh: "打开可读版本",
    ja: "読みやすい版を開く",
    ko: "읽기 쉬운 버전 열기",
    hi: "पठनीय संस्करण खोलें",
    hy: "Բացել ընթեռնելի տարբերակը",
    ru: "Открыть читаемую версию",
    pa: "ਪੜ੍ਹਨ ਯੋਗ ਸਾਥੀ ਖੋਲ੍ਹੋ",
  };
  return labels[lang];
}

export function magazineCompanionHref(
  lang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string },
): string {
  const params = new URLSearchParams({ lang });
  if (opts?.sourcePage) params.set("sourcePage", opts.sourcePage);
  if (opts?.sourceCta) params.set("sourceCta", opts.sourceCta);
  return `${JUNE_2026_COMPANION_PATH}?${params.toString()}`;
}

export function getJune2026CompanionLinks(lang: SupportedLang): June2026CompanionLinks {
  return {
    visualMagazineHref: magazinePrintGuideHref(lang, {
      sourcePage: "magazine_companion",
      sourceCta: "open_visual_magazine",
    }),
    qrGuideHref: translatorGatewayHref(lang, {
      sourcePage: "magazine_companion",
      sourceCta: "qr_guide",
    }),
    mediaKitHref: mediaKitPageHref(lang),
    advertiseHref: mediaKitAdvertisingContactHref(lang, {
      sourcePage: "magazine_companion",
      sourceCta: "advertise",
    }),
    googleTranslateHref: translateSiteHref({
      lang,
      sourcePage: "magazine_companion",
      sourceCta: "google_translate",
      returnTo: JUNE_2026_COMPANION_PATH,
    }),
    qrReadGuideHref: magazinePrintGuideHref(lang, {
      sourcePage: "magazine_companion",
      sourceCta: "back_to_qr_guide",
    }),
  };
}

export function getJune2026CompanionIssueMeta(lang: SupportedLang): {
  year: string;
  monthKey: string;
  flipbookUrl: string;
  pdfUrl: string;
} {
  return {
    year: JUNE_2026.year,
    monthKey: JUNE_2026.monthKey,
    flipbookUrl: JUNE_2026.flipbookUrl,
    pdfUrl: JUNE_2026.pdfUrl,
  };
}
