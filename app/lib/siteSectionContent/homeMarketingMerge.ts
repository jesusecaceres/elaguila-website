import type { HomeFeaturedCallout, HomeMarketingPayload } from "./payloadTypes";

export type HomeMarketingLangBlock = {
  title: string;
  identity: string;
  precedent: string;
  valuePrimary: string;
  valueSecondary: string;
  valueLabels: [string, string, string];
  ctaPrimary: string;
  ctaSecondary: string;
  microcopy: string;
  coverAlt: string;
  announcement: string;
  promoStrip: string;
};

export type HomeMarketingResolved = {
  es: HomeMarketingLangBlock;
  en: HomeMarketingLangBlock;
  pt: HomeMarketingLangBlock;
  tl: HomeMarketingLangBlock;
  coverImageSrc: string;
  ctaPrimaryHref: string | null;
  ctaSecondaryHref: string | null;
  modules: {
    showAnnouncement: boolean;
    showHeroImage: boolean;
    showSecondaryLine: boolean;
    showCallouts: boolean;
  };
  calloutsPlacement: "below_precedent" | "below_title";
  callouts: HomeFeaturedCallout[];
};

const APPROVED_HOME_MAGAZINE_COVER = "/magazine/leonix-media-cover-sample.png";
const LEGACY_HOME_COVER_SRCS = new Set([
  "/home_thumbnail.png",
  "/magazine/leonix-media-launch-es.png",
  "/magazine/leonix-media-magazine-mockup-es.png",
]);

const BASE: HomeMarketingResolved = {
  es: {
    title: "LEONIX",
    identity: "Comunidad, Cultura y Fe",
    precedent: "Revista de comunidad, cultura y negocios.",
    valuePrimary:
      "Encuentra rentas, empleos, autos, artículos en venta, eventos y oportunidades locales en un solo espacio creado para nuestra comunidad.",
    valueSecondary:
      "Conectamos negocios locales, familias y organizaciones con una audiencia activa a través de una revista premium, presencia digital bilingüe y herramientas que generan acción.",
    valueLabels: ["Revista premium", "Comunidad activa", "Presencia digital bilingüe"],
    ctaPrimary: "Explorar la revista",
    ctaSecondary: "Anúnciate con nosotros",
    microcopy: "Edición digital + presencia impresa",
    coverAlt: "Portada de la revista Leonix Media",
    announcement: "",
    promoStrip: "",
  },
  en: {
    title: "LEONIX",
    identity: "Community, Culture, and Faith",
    precedent: "A magazine for community, culture, and business.",
    valuePrimary:
      "Find rentals, jobs, autos, items for sale, events, and local opportunities in one place built for our community.",
    valueSecondary:
      "We connect local businesses, families, and organizations with an active audience through a premium magazine, bilingual digital presence, and tools that drive action.",
    valueLabels: ["Premium magazine", "Active community", "Bilingual digital presence"],
    ctaPrimary: "Explore the magazine",
    ctaSecondary: "Advertise with us",
    microcopy: "Digital edition + print presence",
    coverAlt: "Leonix Media magazine cover",
    announcement: "",
    promoStrip: "",
  },
  pt: {
    title: "LEONIX",
    identity: "Comunidade, Cultura e Fé",
    precedent: "Revista de comunidade, cultura e negócios.",
    valuePrimary:
      "Encontre aluguéis, empregos, autos, artigos à venda, eventos e oportunidades locais em um só espaço feito para a nossa comunidade.",
    valueSecondary:
      "Conectamos negócios locais, famílias e organizações com uma audiência ativa por meio de uma revista premium, presença digital bilíngue e ferramentas que geram ação.",
    valueLabels: ["Revista premium", "Comunidade ativa", "Presença digital bilíngue"],
    ctaPrimary: "Explore a revista",
    ctaSecondary: "Anuncie conosco",
    microcopy: "Edição digital + presença impressa",
    coverAlt: "Capa da revista Leonix Media",
    announcement: "",
    promoStrip: "",
  },
  tl: {
    title: "LEONIX",
    identity: "Komunidad, Kultura, at Pananampalataya",
    precedent: "Magasin para sa komunidad, kultura, at negosyo.",
    valuePrimary:
      "Maghanap ng paupahan, trabaho, kotse, binebentang gamit, event, at lokal na oportunidad sa isang espasyong ginawa para sa ating komunidad.",
    valueSecondary:
      "Ikinokonekta namin ang lokal na negosyo, pamilya, at organisasyon sa aktibong audience sa pamamagitan ng premium magazine, bilingual digital presence, at mga tool na nagdadala ng aksyon.",
    valueLabels: ["Premium magazine", "Aktibong komunidad", "Bilingual digital presence"],
    ctaPrimary: "Tingnan ang magasin",
    ctaSecondary: "Mag-advertise sa amin",
    microcopy: "Digital na edisyon + presensya sa print",
    coverAlt: "Cover ng Leonix Media magazine",
    announcement: "",
    promoStrip: "",
  },
  coverImageSrc: APPROVED_HOME_MAGAZINE_COVER,
  ctaPrimaryHref: null,
  ctaSecondaryHref: null,
  modules: {
    showAnnouncement: false,
    showHeroImage: true,
    showSecondaryLine: true,
    showCallouts: false,
  },
  calloutsPlacement: "below_precedent",
  callouts: [],
};

function s(v: string | undefined, fallback: string): string {
  return v !== undefined && v.trim() !== "" ? v.trim() : fallback;
}

/** Gate HOME-3 — keep business-action secondary CTA; reject legacy label-only text. */
function resolveSecondaryCta(patchVal: string | undefined, base: string): string {
  const trimmed = patchVal?.trim() ?? "";
  if (!trimmed || trimmed === "Edición digital" || trimmed === "Digital edition") return base;
  return trimmed;
}

/** Gate HOME-2 — clean magazine cover; remap legacy hero images. */
function resolveHomeCoverImageSrc(patchSrc: string | undefined): string {
  const trimmed = patchSrc?.trim() ?? "";
  if (!trimmed || LEGACY_HOME_COVER_SRCS.has(trimmed)) return APPROVED_HOME_MAGAZINE_COVER;
  return trimmed;
}

function parseCallouts(raw: HomeMarketingPayload["featuredCallouts"]): HomeFeaturedCallout[] {
  if (!raw?.length) return [];
  return raw
    .filter((c) => c && (c.href?.trim() || c.labelEs?.trim() || c.labelEn?.trim()))
    .slice(0, 5)
    .map((c) => ({
      labelEs: (c.labelEs ?? "").trim(),
      labelEn: (c.labelEn ?? "").trim(),
      href: (c.href ?? "").trim(),
    }))
    .filter((c) => c.href.startsWith("/") || c.href.startsWith("https://"));
}

export function mergeHomeMarketing(patch: HomeMarketingPayload | null | undefined): HomeMarketingResolved {
  if (!patch) return BASE;
  const mod = patch.modules ?? {};
  return {
    es: {
      ...BASE.es,
      ctaPrimary: s(patch.ctaPrimary?.es, BASE.es.ctaPrimary),
      ctaSecondary: resolveSecondaryCta(patch.ctaSecondary?.es, BASE.es.ctaSecondary),
      coverAlt: s(patch.coverAlt?.es, BASE.es.coverAlt),
      announcement: s(patch.announcementBar?.es, ""),
      promoStrip: s(patch.promoStrip?.es, ""),
    },
    en: {
      ...BASE.en,
      ctaPrimary: s(patch.ctaPrimary?.en, BASE.en.ctaPrimary),
      ctaSecondary: resolveSecondaryCta(patch.ctaSecondary?.en, BASE.en.ctaSecondary),
      coverAlt: s(patch.coverAlt?.en, BASE.en.coverAlt),
      announcement: s(patch.announcementBar?.en, ""),
      promoStrip: s(patch.promoStrip?.en, ""),
    },
    pt: { ...BASE.pt },
    tl: { ...BASE.tl },
    coverImageSrc: resolveHomeCoverImageSrc(patch.coverImageSrc),
    ctaPrimaryHref: patch.ctaPrimaryHref?.trim() || null,
    ctaSecondaryHref: patch.ctaSecondaryHref?.trim() || null,
    modules: {
      showAnnouncement: mod.showAnnouncement === true,
      showHeroImage: mod.showHeroImage !== false,
      showSecondaryLine: mod.showSecondaryLine !== false,
      showCallouts: mod.showCallouts === true,
    },
    calloutsPlacement: patch.calloutsPlacement === "below_title" ? "below_title" : "below_precedent",
    callouts: parseCallouts(patch.featuredCallouts),
  };
}
