/**
 * Gate HEADER-3 — Global header: primary tabs + Recursos Comunitarios dropdown.
 * No Cupones. Iglesias only under Recursos dropdown. Nosotros/Contacto not in header.
 */

export type PublicNavLang = "es" | "en";

export type PublicNavItem = {
  id: string;
  href: string;
  labelEs: string;
  labelEn: string;
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

/** Primary inline tabs before Recursos dropdown */
export const PUBLIC_NAV_PRIMARY_BEFORE_RECURSOS: PublicNavItem[] = [
  { id: "inicio", href: "/home", labelEs: "Inicio", labelEn: "Home" },
  { id: "revista", href: "/magazine", labelEs: "La Revista", labelEn: "The Magazine" },
  { id: "clasificados", href: "/clasificados", labelEs: "Clasificados", labelEn: "Classifieds" },
  {
    id: "negocios-locales",
    href: "/negocios-locales",
    labelEs: "Negocios Locales",
    labelEn: "Local Businesses",
  },
];

/** Recursos Comunitarios top-level trigger (dropdown on desktop) */
export const PUBLIC_NAV_RECURSOS_TRIGGER: PublicNavItem = {
  id: "recursos-comunitarios",
  href: "/recursos-comunitarios",
  labelEs: "Recursos Comunitarios",
  labelEn: "Community Resources",
};

/** Recursos Comunitarios dropdown — existing routes only */
export const PUBLIC_NAV_RECURSOS_DROPDOWN: PublicNavDropdownItem[] = [
  {
    id: "recursos-all",
    href: "/recursos-comunitarios",
    labelEs: "Ver todos los recursos",
    labelEn: "View all resources",
  },
  {
    id: "comunidad-eventos",
    href: "/clasificados/comunidad",
    labelEs: "Comunidad y Eventos",
    labelEn: "Community & Events",
  },
  { id: "clases", href: "/clasificados/clases", labelEs: "Clases", labelEn: "Classes" },
  { id: "iglesias", href: "/iglesias", labelEs: "Iglesias", labelEn: "Churches" },
  {
    id: "ayuda-comunitaria",
    href: "/clasificados/busco",
    labelEs: "Ayuda comunitaria",
    labelEn: "Community Help",
  },
];

/** Revenue tabs after Recursos — inline from xl+; compact overflow on lg only */
export const PUBLIC_NAV_PRIMARY_AFTER_RECURSOS: PublicNavItem[] = [
  { id: "viajes", href: "/clasificados/viajes", labelEs: "Viajes", labelEn: "Travel" },
  {
    id: "productos-promocionales",
    href: "/productos-promocion",
    labelEs: "Productos Promocionales",
    labelEn: "Promotional Products",
    labelEsShort: "Productos Promo",
    labelEnShort: "Promo Products",
  },
];

/** lg-only overflow (Viajes + Productos) — not generic Más */
export const PUBLIC_NAV_COMPACT_OVERFLOW_LABEL = {
  labelEs: "Viajes y promo",
  labelEn: "Travel & promo",
} as const;

export const PUBLIC_NAV_COMPACT_OVERFLOW: PublicNavItem[] = [...PUBLIC_NAV_PRIMARY_AFTER_RECURSOS];

/** Mobile drawer — approved links only (no Cupones, Nosotros, Contacto, Noticias) */
export const PUBLIC_NAV_MOBILE: PublicNavItem[] = [
  ...PUBLIC_NAV_PRIMARY_BEFORE_RECURSOS,
  PUBLIC_NAV_RECURSOS_TRIGGER,
  ...PUBLIC_NAV_RECURSOS_DROPDOWN.map((d) => ({
    id: d.id,
    href: d.href,
    labelEs: d.labelEs,
    labelEn: d.labelEn,
  })),
  ...PUBLIC_NAV_PRIMARY_AFTER_RECURSOS,
];

export const PUBLIC_NAV_ADVERTISE = {
  id: "anunciate",
  labelEs: "Anúnciate",
  labelEn: "Advertise",
} as const;

export function publicNavLabel(item: Pick<PublicNavItem, "labelEs" | "labelEn">, lang: PublicNavLang): string {
  return lang === "en" ? item.labelEn : item.labelEs;
}

export function publicNavItemLabel(item: PublicNavItem, lang: PublicNavLang, opts?: { short?: boolean }): string {
  if (opts?.short) {
    if (lang === "en" && item.labelEnShort) return item.labelEnShort;
    if (lang === "es" && item.labelEsShort) return item.labelEsShort;
  }
  return publicNavLabel(item, lang);
}

export function publicNavDropdownLabel(item: PublicNavDropdownItem, lang: PublicNavLang): string {
  return lang === "en" ? item.labelEn : item.labelEs;
}

/** @deprecated HEADER-3 — use PRIMARY_BEFORE + RECURSOS + PRIMARY_AFTER */
export const PUBLIC_NAV_DESKTOP: PublicNavItem[] = [
  ...PUBLIC_NAV_PRIMARY_BEFORE_RECURSOS,
  PUBLIC_NAV_RECURSOS_TRIGGER,
  ...PUBLIC_NAV_PRIMARY_AFTER_RECURSOS,
];
