/**
 * Normal site public nav — Gate H1F collision-safe desktop/mobile split.
 * Desktop inline: 5 tabs + Más. Más dropdown: Viajes + secondary links.
 */

export type PublicNavLang = "es" | "en";

export type PublicNavItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
  inMasDropdown?: boolean;
};

/** Visible desktop center nav (before Más) — max 5 items for spacing */
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
];

/** Más dropdown — not shown inline on desktop */
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
