export type Lang = "es" | "en";

export type TiendaAccent =
  | "gold"
  | "stone"
  | "cream"
  | "ink"
  | "sage"
  | "plum"
  | "sky";

export type TiendaCategory = {
  id: string;
  slug: string;
  eyebrow?: { es: string; en: string };
  title: { es: string; en: string };
  description: { es: string; en: string };
  href: string;
  featured?: boolean;
  accent: TiendaAccent;
  familyCount?: number | null;
};

export type TiendaFeaturedProduct = {
  id: string;
  slug: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
  startingPrice: { amount: number; currency: "USD" };
  badge: { es: string; en: string };
  categorySlug: string;
  href: string;
  uploadReady: boolean;
  customHelpAvailable: boolean;
};

