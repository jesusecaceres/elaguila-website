import type { Metadata } from "next";

const BRAND = "Leonix Viajes";
const DEFAULT_OG =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";

export function viajesLandingMetadata(lang: "es" | "en" = "es"): Metadata {
  const title =
    lang === "en"
      ? `Travel deals from San José, California | ${BRAND}`
      : `Viajes y escapadas desde San José, California | ${BRAND}`;
  const description =
    lang === "en"
      ? "Discover tours, packages, and getaways from Bay Area hubs (SFO / SJC / OAK). Browse local operators and partner offers on Leonix Viajes."
      : "Descubre tours, paquetes y escapadas desde la Bahía (SFO / SJC / OAK). Explora operadores locales y ofertas en Leonix Viajes.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: DEFAULT_OG }],
      type: "website",
    },
  };
}

export function viajesResultsMetadata(lang: "es" | "en" = "es"): Metadata {
  const title =
    lang === "en" ? `Travel search results | ${BRAND}` : `Resultados de viajes | ${BRAND}`;
  const description =
    lang === "en"
      ? "Filter Viajes offers by destination, departure hub, trip type, and price. Truthful listings from Leonix Viajes."
      : "Filtra ofertas de Viajes por destino, salida, tipo de viaje y precio. Anuncios veraces en Leonix Viajes.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: DEFAULT_OG }],
      type: "website",
    },
  };
}

export function viajesOfferMetadata(input: {
  title: string;
  description: string;
  imageSrc?: string | null;
  lang?: "es" | "en";
}): Metadata {
  const title = `${input.title.trim() || (input.lang === "en" ? "Travel offer" : "Oferta")} | ${BRAND}`;
  const description = (input.description || "").replace(/\s+/g, " ").trim().slice(0, 155);
  const img = (input.imageSrc || "").trim();
  const ogImage = img.startsWith("https://") ? img : DEFAULT_OG;
  return {
    title,
    description: description || (input.lang === "en" ? "Travel offer on Leonix Viajes." : "Oferta de viaje en Leonix Viajes."),
    openGraph: {
      title,
      description: description || undefined,
      images: [{ url: ogImage }],
      type: "website",
    },
  };
}

export function viajesProviderMetadata(input: {
  businessName: string;
  tagline: string;
  logoSrc?: string | null;
  lang?: "es" | "en";
}): Metadata {
  const title = `${input.businessName.trim() || (input.lang === "en" ? "Travel provider" : "Negocio")} | ${BRAND}`;
  const description = (input.tagline || "").replace(/\s+/g, " ").trim().slice(0, 155);
  const img = (input.logoSrc || "").trim();
  const ogImage = img.startsWith("https://") ? img : DEFAULT_OG;
  return {
    title,
    description: description || (input.lang === "en" ? "Travel provider on Leonix Viajes." : "Negocio de viajes en Leonix Viajes."),
    openGraph: {
      title,
      description: description || undefined,
      images: [{ url: ogImage }],
      type: "website",
    },
  };
}
