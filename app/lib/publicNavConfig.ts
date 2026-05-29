/**
 * Normal site public nav — Gate H1D source of truth.
 * Layout copied from Coming Soon V2; labels/routes only differ.
 */

export type PublicNavLang = "es" | "en";

export type PublicNavItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
  inMasDropdown?: boolean;
};

export const PUBLIC_NAV_PRIMARY: PublicNavItem[] = [
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
  {
    id: "productos-promocionales",
    href: "/productos-promocion",
    labelEs: "Productos Promocionales",
    labelEn: "Promotional Products",
  },
  { id: "noticias", href: "/noticias", labelEs: "Noticias", labelEn: "News" },
];

export const PUBLIC_NAV_MAS_ITEMS: PublicNavItem[] = [
  { id: "nosotros", href: "/about", labelEs: "Nosotros", labelEn: "About Us", inMasDropdown: true },
  { id: "contacto", href: "/contacto", labelEs: "Contacto", labelEn: "Contact", inMasDropdown: true },
];

export const PUBLIC_NAV_ADVERTISE = {
  id: "anunciate",
  labelEs: "Anúnciate",
  labelEn: "Advertise",
} as const;

export function publicNavLabel(item: Pick<PublicNavItem, "labelEs" | "labelEn">, lang: PublicNavLang): string {
  return lang === "en" ? item.labelEn : item.labelEs;
}
