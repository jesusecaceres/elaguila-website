export type Lang = "es" | "en";

export type CategoryKey =
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "travel";

export type ListingLike = {
  id: string;
  category: CategoryKey;
  title?: { es?: string; en?: string };
  blurb?: { es?: string; en?: string };
  priceLabel?: { es?: string; en?: string };
  city?: string;
  hasImage?: boolean;

  // optional contact fields used by CTA cluster
  phone?: string | null;
  text?: string | null;
  email?: string | null;
  website?: string | null;
  mapsUrl?: string | null;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function detectLanguageCompleteness(listing: ListingLike) {
  const esTitle = listing.title?.es?.trim() ?? "";
  const enTitle = listing.title?.en?.trim() ?? "";
  const esBlurb = listing.blurb?.es?.trim() ?? "";
  const enBlurb = listing.blurb?.en?.trim() ?? "";

  const missing: Array<"es" | "en"> = [];
  if (!esTitle || !esBlurb) missing.push("es");
  if (!enTitle || !enBlurb) missing.push("en");

  return { ok: missing.length === 0, missing };
}

export function findPotentialDuplicates(listing: ListingLike, all: ListingLike[]) {
  const key = norm((listing.title?.es || listing.title?.en || "") + "|" + (listing.city || ""));
  if (!key) return [];
  return all
    .filter((x) => x && x.id !== listing.id && x.category === listing.category)
    .filter((x) => norm((x.title?.es || x.title?.en || "") + "|" + (x.city || "")) === key)
    .map((x) => x.id);
}

export function qualityGateHints(listing: ListingLike, lang: Lang) {
  const hints: string[] = [];

  const title = (listing.title?.[lang] ?? "").trim();
  const blurb = (listing.blurb?.[lang] ?? "").trim();
  const price = (listing.priceLabel?.[lang] ?? "").trim();
  const city = (listing.city ?? "").trim();

  if (!title) hints.push(lang === "es" ? "Falta el título." : "Missing title.");
  if (!blurb) hints.push(lang === "es" ? "Falta la descripción." : "Missing description.");
  if (!price) hints.push(lang === "es" ? "Falta el precio." : "Missing price.");
  if (!city) hints.push(lang === "es" ? "Falta la ciudad." : "Missing city.");

  // category-friendly suggestions (no fake facts)
  if (!listing.hasImage) {
    hints.push(lang === "es" ? "Agrega una foto para generar más confianza." : "Add a photo to build trust.");
  }

  const hasAnyContact = Boolean(listing.phone || listing.text || listing.email || listing.mapsUrl || listing.website);
  if (!hasAnyContact) {
    hints.push(
      lang === "es"
        ? "Agrega al menos un método de contacto (teléfono, texto o email)."
        : "Add at least one contact method (phone, text, or email)."
    );
  }

  if (listing.category === "autos") {
    hints.push(
      lang === "es"
        ? "Autos: incluye año, marca, modelo y millaje en la descripción."
        : "Autos: include year, make, model, and mileage in the description."
    );
  }

  if (listing.category === "rentas") {
    hints.push(
      lang === "es"
        ? "Rentas: incluye recámaras, depósito y fecha de disponibilidad."
        : "Rentals: include bedrooms, deposit, and availability date."
    );
  }

  if (listing.category === "empleos") {
    hints.push(
      lang === "es"
        ? "Empleos: incluye tipo de trabajo, pago y requisitos clave."
        : "Jobs: include job type, pay, and key requirements."
    );
  }

  return hints;
}
