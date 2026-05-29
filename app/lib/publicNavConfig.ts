/**
 * Approved public navigation structure — Gate H1 source of truth.
 * Used by Navbar and website-h1-header-home-brand-audit.ts
 */

export type PublicNavLang = "es" | "en";

export type PublicNavItem = {
  /** Stable id for active-state matching */
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
  /** Hidden from primary nav row; shown under Más */
  inMasDropdown?: boolean;
  /** Must not appear in public nav (audit checks) */
  hidden?: boolean;
};

export const PUBLIC_NAV_PRIMARY: PublicNavItem[] = [
  { id: "inicio", href: "/home", labelEs: "Inicio", labelEn: "Home" },
  { id: "revista", href: "/magazine", labelEs: "La Revista", labelEn: "The Magazine" },
  { id: "clasificados", href: "/clasificados", labelEs: "Clasificados", labelEn: "Classifieds" },
  {
    id: "negocios-locales",
    href: "/clasificados/servicios",
    labelEs: "Negocios Locales",
    labelEn: "Local Businesses",
  },
  {
    id: "recursos-comunitarios",
    href: "/clasificados/comunidad",
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

/** Items that must never appear in public nav */
export const PUBLIC_NAV_HIDDEN: PublicNavItem[] = [
  { id: "cupones", href: "/coupons", labelEs: "Cupones", labelEn: "Coupons", hidden: true },
  { id: "iglesias", href: "/iglesias", labelEs: "Iglesias", labelEn: "Churches", hidden: true },
];

export const PUBLIC_NAV_ADVERTISE = {
  id: "anunciate",
  href: "/advertise",
  labelEs: "Anúnciate",
  labelEn: "Advertise",
} as const;

export function publicNavLabel(item: Pick<PublicNavItem, "labelEs" | "labelEn">, lang: PublicNavLang): string {
  return lang === "en" ? item.labelEn : item.labelEs;
}

export function allPublicNavLabels(lang: PublicNavLang): string[] {
  return [
    ...PUBLIC_NAV_PRIMARY.map((i) => publicNavLabel(i, lang)),
    publicNavLabel({ labelEs: "Más", labelEn: "More" }, lang),
    ...PUBLIC_NAV_MAS_ITEMS.map((i) => publicNavLabel(i, lang)),
    publicNavLabel(PUBLIC_NAV_ADVERTISE, lang),
  ];
}
