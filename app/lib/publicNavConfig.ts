/**
 * Normal site public nav — priority tiers for responsive desktop (Gate HOME-5).
 * lg–xl: high inline + Más (mid + secondary). xl+: high + mid inline + Más (secondary only).
 */

export type PublicNavLang = "es" | "en";

export type PublicNavItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
  inMasDropdown?: boolean;
};

/** Always inline when desktop nav is visible */
export const PUBLIC_NAV_PRIORITY_HIGH: PublicNavItem[] = [
  { id: "inicio", href: "/home", labelEs: "Inicio", labelEn: "Home" },
  { id: "revista", href: "/magazine", labelEs: "La Revista", labelEn: "The Magazine" },
  { id: "clasificados", href: "/clasificados", labelEs: "Clasificados", labelEn: "Classifieds" },
];

/** Inline on wide desktop (xl+); in Más on compact desktop (lg–xl) */
export const PUBLIC_NAV_PRIORITY_MID: PublicNavItem[] = [
  {
    id: "negocios-locales",
    href: "/negocios-locales",
    labelEs: "Negocios Locales",
    labelEn: "Local Businesses",
  },
  {
    id: "recursos-comunitarios",
    href: "/recursos-comunitarios",
    labelEs: "Recursos Comunitarios",
    labelEn: "Community Resources",
  },
];

/** Full desktop inline set (wide tier) */
export const PUBLIC_NAV_DESKTOP: PublicNavItem[] = [
  ...PUBLIC_NAV_PRIORITY_HIGH,
  ...PUBLIC_NAV_PRIORITY_MID,
];

/** Más dropdown — secondary links (always in Más) */
export const PUBLIC_NAV_MAS_ITEMS: PublicNavItem[] = [
  { id: "viajes", href: "/clasificados/viajes", labelEs: "Viajes", labelEn: "Travel", inMasDropdown: true },
  {
    id: "productos-promocionales",
    href: "/productos-promocion",
    labelEs: "Productos Promocionales",
    labelEn: "Promotional Products",
    inMasDropdown: true,
  },
  { id: "noticias", href: "/noticias", labelEs: "Noticias", labelEn: "News", inMasDropdown: true },
  { id: "nosotros", href: "/about", labelEs: "Nosotros", labelEn: "About Us", inMasDropdown: true },
  { id: "contacto", href: "/contacto", labelEs: "Contacto", labelEn: "Contact", inMasDropdown: true },
];

/** Mid-tier overflow for compact desktop Más (lg–xl) */
export const PUBLIC_NAV_MAS_COMPACT_OVERFLOW: PublicNavItem[] = [
  ...PUBLIC_NAV_PRIORITY_MID,
  ...PUBLIC_NAV_MAS_ITEMS,
];

/** Full mobile drawer nav (excluding Anúnciate CTA) */
export const PUBLIC_NAV_MOBILE: PublicNavItem[] = [
  ...PUBLIC_NAV_DESKTOP,
  ...PUBLIC_NAV_MAS_ITEMS,
];

export const PUBLIC_NAV_ADVERTISE = {
  id: "anunciate",
  labelEs: "Anúnciate",
  labelEn: "Advertise",
} as const;

export function publicNavLabel(item: Pick<PublicNavItem, "labelEs" | "labelEn">, lang: PublicNavLang): string {
  return lang === "en" ? item.labelEn : item.labelEs;
}
