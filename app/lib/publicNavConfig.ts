/**
 * Gate 01 — Global public header IA.
 * Header uses surface-specific short labels. Footer / Anúnciate keep full product names.
 * About/Contact stay in the mobile drawer + footer (not desktop primary tabs).
 */

import type { SupportedLang } from "@/app/lib/language";
import { getPublicNavItemLabel } from "@/app/lib/leonix/publicNavCopy";

/** @deprecated Use SupportedLang — retained for legacy imports. */
export type PublicNavLang = "es" | "en";

/** Desktop: item is inline from this breakpoint up; below it, it lives in Más. */
export type PublicNavDesktopFrom = "lg" | "xl" | "2xl";

export type PublicNavItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
  desktopFrom?: PublicNavDesktopFrom;
  /** Compact desktop inline label when space is tight */
  labelEsShort?: string;
  labelEnShort?: string;
};

export type PublicNavDropdownItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
};

/**
 * Provisional compact-desktop mix (lg 1024–1279):
 * seven direct items + Más (Iglesias, Promocionales).
 * Prove fit at 1024/1180/1280/1366; if seven do not fit, raise Revista and/or Negocios to `xl`.
 */
export const PUBLIC_NAV_PRIMARY: PublicNavItem[] = [
  { id: "inicio", href: "/home", labelEs: "Inicio", labelEn: "Home" },
  { id: "noticias", href: "/noticias", labelEs: "Noticias", labelEn: "News" },
  { id: "revista", href: "/magazine", labelEs: "Revista", labelEn: "Magazine" },
  { id: "clasificados", href: "/clasificados", labelEs: "Clasificados", labelEn: "Classifieds" },
  {
    id: "negocios-locales",
    href: "/negocios-locales",
    labelEs: "Negocios",
    labelEn: "Businesses",
  },
  {
    id: "recursos-comunitarios",
    href: "/recursos-comunitarios",
    labelEs: "Recursos",
    labelEn: "Resources",
  },
  { id: "viajes", href: "/clasificados/viajes", labelEs: "Viajes", labelEn: "Travel" },
  { id: "iglesias", href: "/iglesias", labelEs: "Iglesias", labelEn: "Churches", desktopFrom: "xl" },
  {
    id: "productos-promocionales",
    href: "/productos-promocion",
    labelEs: "Promocionales",
    labelEn: "Promotional Products",
    labelEsShort: "Promocionales",
    labelEnShort: "Promo Products",
    desktopFrom: "xl",
  },
];

export const PUBLIC_NAV_OVERFLOW: PublicNavItem[] = PUBLIC_NAV_PRIMARY.filter(
  (item) => (item.desktopFrom ?? "lg") !== "lg",
);

/** About + Contact — mobile drawer + footer only */
export const PUBLIC_NAV_UTILITY_LINKS: PublicNavItem[] = [
  { id: "about-us", href: "/about", labelEs: "Sobre nosotros", labelEn: "About us" },
  { id: "contact-us", href: "/contacto", labelEs: "Contacto", labelEn: "Contact us" },
];

export const PUBLIC_NAV_MOBILE: PublicNavItem[] = [...PUBLIC_NAV_PRIMARY, ...PUBLIC_NAV_UTILITY_LINKS];

export const PUBLIC_NAV_ADVERTISE = {
  id: "anunciate",
  labelEs: "Anúnciate",
  labelEn: "Advertise",
} as const;

/** @deprecated Gate 01 — use PUBLIC_NAV_PRIMARY */
export const PUBLIC_NAV_DESKTOP: PublicNavItem[] = PUBLIC_NAV_PRIMARY;

export function publicNavDesktopItemClass(item: PublicNavItem): string {
  switch (item.desktopFrom ?? "lg") {
    case "2xl":
      return "hidden shrink-0 2xl:inline";
    case "xl":
      return "hidden shrink-0 xl:inline";
    default:
      return "shrink-0";
  }
}

export function publicNavMasItemClass(item: PublicNavItem): string {
  switch (item.desktopFrom ?? "lg") {
    case "2xl":
      return "2xl:hidden";
    case "xl":
      return "xl:hidden";
    default:
      return "hidden";
  }
}

export function publicNavMasWrapperClass(items: PublicNavItem[]): string {
  const froms = items.map((item) => item.desktopFrom ?? "lg");
  if (froms.includes("2xl")) return "relative shrink-0 2xl:hidden";
  if (froms.includes("xl")) return "relative shrink-0 xl:hidden";
  return "relative shrink-0 lg:hidden";
}

export function publicNavLabel(
  item: Pick<PublicNavItem, "labelEs" | "labelEn" | "id">,
  lang: SupportedLang,
): string {
  return getPublicNavItemLabel(item.id, lang, { surface: "header" });
}

export function publicNavItemLabel(
  item: PublicNavItem,
  lang: SupportedLang,
  opts?: { short?: boolean },
): string {
  return getPublicNavItemLabel(item.id, lang, { ...opts, surface: "header" });
}

export function publicNavMasLabel(lang: SupportedLang): string {
  return getPublicNavItemLabel("more", lang, { surface: "header" });
}

export function isPublicNavHrefActive(pathname: string, href: string, allHrefs: string[]): boolean {
  const cleanHref = href.split("?")[0];
  const matches = (candidate: string) => {
    const clean = candidate.split("?")[0];
    if (clean === "/home") return pathname === "/home";
    return pathname === clean || pathname.startsWith(`${clean}/`);
  };
  if (!matches(href)) return false;
  const matching = allHrefs.filter(matches);
  if (matching.length === 0) return false;
  const longest = matching.reduce((best, current) =>
    current.split("?")[0].length > best.split("?")[0].length ? current : best,
  );
  return longest.split("?")[0] === cleanHref;
}
