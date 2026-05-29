import type { HomeFeaturedCallout, HomeMarketingPayload } from "./payloadTypes";

export type HomeMarketingResolved = {
  es: {
    title: string;
    identity: string;
    precedent: string;
    ctaPrimary: string;
    ctaSecondary: string;
    coverAlt: string;
    announcement: string;
    promoStrip: string;
  };
  en: {
    title: string;
    identity: string;
    precedent: string;
    ctaPrimary: string;
    ctaSecondary: string;
    coverAlt: string;
    announcement: string;
    promoStrip: string;
  };
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

const BASE: HomeMarketingResolved = {
  es: {
    title: "Leonix Media",
    identity: "Visibilidad empresarial, revista premium y comunidad — en español e inglés",
    precedent:
      "Medios locales con presencia impresa, digital y bilingüe para conectar negocios con la comunidad latina y multicultural del Bay Area",
    ctaPrimary: "Explorar la revista",
    ctaSecondary: "Anúnciate con nosotros",
    coverAlt: "Portada de la revista Leonix Media",
    announcement: "",
    promoStrip: "Que Ruja El León — Let The Lion Roar",
  },
  en: {
    title: "Leonix Media",
    identity: "Business visibility, premium magazine, and community — in English and Spanish",
    precedent:
      "Local media with print, digital, and bilingual presence connecting businesses with the Latino and multicultural Bay Area community",
    ctaPrimary: "Explore the magazine",
    ctaSecondary: "Advertise with us",
    coverAlt: "Leonix Media magazine cover",
    announcement: "",
    promoStrip: "Que Ruja El León — Let The Lion Roar",
  },
  coverImageSrc: "/magazine/leonix-media-launch-es.png",
  ctaPrimaryHref: null,
  ctaSecondaryHref: null,
  modules: {
    showAnnouncement: true,
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
      title: s(patch.title?.es, BASE.es.title),
      identity: s(patch.identity?.es, BASE.es.identity),
      precedent: s(patch.precedent?.es, BASE.es.precedent),
      ctaPrimary: s(patch.ctaPrimary?.es, BASE.es.ctaPrimary),
      ctaSecondary: s(patch.ctaSecondary?.es, BASE.es.ctaSecondary),
      coverAlt: s(patch.coverAlt?.es, BASE.es.coverAlt),
      announcement: s(patch.announcementBar?.es, ""),
      promoStrip: s(patch.promoStrip?.es, ""),
    },
    en: {
      title: s(patch.title?.en, BASE.en.title),
      identity: s(patch.identity?.en, BASE.en.identity),
      precedent: s(patch.precedent?.en, BASE.en.precedent),
      ctaPrimary: s(patch.ctaPrimary?.en, BASE.en.ctaPrimary),
      ctaSecondary: s(patch.ctaSecondary?.en, BASE.en.ctaSecondary),
      coverAlt: s(patch.coverAlt?.en, BASE.en.coverAlt),
      announcement: s(patch.announcementBar?.en, ""),
      promoStrip: s(patch.promoStrip?.en, ""),
    },
    coverImageSrc: patch.coverImageSrc?.trim() || BASE.coverImageSrc,
    ctaPrimaryHref: patch.ctaPrimaryHref?.trim() || null,
    ctaSecondaryHref: patch.ctaSecondaryHref?.trim() || null,
    modules: {
      showAnnouncement: mod.showAnnouncement !== false,
      showHeroImage: mod.showHeroImage !== false,
      showSecondaryLine: mod.showSecondaryLine !== false,
      showCallouts: mod.showCallouts !== false,
    },
    calloutsPlacement: patch.calloutsPlacement === "below_title" ? "below_title" : "below_precedent",
    callouts: parseCallouts(patch.featuredCallouts),
  };
}
