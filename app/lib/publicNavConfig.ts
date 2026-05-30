/**
 * Normal site public nav — Gate H1E desktop/mobile split.
 * Desktop center: limited tabs + Más. Mobile drawer: full approved list.
 */

export type PublicNavLang = "es" | "en";

export type PublicNavItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
  inMasDropdown?: boolean;
};

/** Visible desktop center nav (before Más) */
export const PUBLIC_NAV_DESKTOP: PublicNavItem[] = [
  { id: "inicio", href: "/home", labelEs: "Inicio", labelEn: "Home" },
  { id: "revista", href: "/magazine", labelEs: "La Revista", labelEn: "The Magazine" },
  { id: "clasificados", href: "/clasificados", labelEs: "Clasificados", labelEn: "Classifieds" },
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
  { id: "viajes", href: "/clasificados/viajes", labelEs: "Viajes", labelEn: "Travel" },
];

/** Más dropdown — secondary desktop + part of mobile drawer */
export const PUBLIC_NAV_MAS_ITEMS: PublicNavItem[] = [
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
