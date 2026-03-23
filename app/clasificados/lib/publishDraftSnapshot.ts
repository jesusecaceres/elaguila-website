/**
 * Neutral publish-wizard snapshot: preview, validation, and insert read the same shape.
 * Category-specific semantics live in category lanes; this type is not En Venta–branded.
 */

export type PublishDraftLang = "es" | "en";

export type PublishDraftSnapshot = {
  category: string;
  title: string;
  description: string;
  city: string;
  cityCanonical: string | null;
  priceRaw: string;
  isFree: boolean;
  priceLabel: string;
  images: string[];
  detailPairs: Array<{ label: string; value: string }>;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  isPro: boolean;
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  proVideoThumbUrl2: string | null;
  proVideoUrl2: string | null;
  lang: PublishDraftLang;
};

export function buildPublishDraftSnapshot(params: {
  title: string;
  description: string;
  city: string;
  price: string;
  isFree: boolean;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  category: string;
  lang: PublishDraftLang;
  isPro: boolean;
  imageUrls: string[];
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  proVideoThumbUrl2?: string | null;
  proVideoUrl2?: string | null;
  cityCanonical: string | null;
  detailPairs: Array<{ label: string; value: string }>;
}): PublishDraftSnapshot {
  const {
    title,
    description,
    city,
    price,
    isFree,
    details,
    contactMethod,
    contactPhone,
    contactEmail,
    category,
    lang,
    isPro,
    imageUrls,
    proVideoThumbUrl,
    proVideoUrl,
    proVideoThumbUrl2 = null,
    proVideoUrl2 = null,
    cityCanonical,
    detailPairs,
  } = params;
  const priceNum = (price ?? "").replace(/[^0-9.]/g, "");
  const hasPrice = priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0;
  const isBrNegocioPricing =
    category === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio";
  const priceLabel =
    isFree
      ? (lang === "es" ? "Gratis" : "Free")
      : hasPrice
        ? Number(priceNum) === 0
          ? (lang === "es" ? "Gratis" : "Free")
          : isBrNegocioPricing
            ? `$${Number(priceNum).toLocaleString(lang === "es" ? "es-US" : "en-US", { maximumFractionDigits: 0 })}`
            : `$${Math.round(Number(priceNum))}`
        : (lang === "es" ? "(Sin precio)" : "(No price)");
  return {
    category: category.trim(),
    title: title.trim(),
    description: description.trim(),
    city: city.trim(),
    cityCanonical,
    priceRaw: price.trim(),
    isFree,
    priceLabel,
    images: imageUrls.filter(Boolean),
    detailPairs,
    details: { ...details },
    contactMethod,
    contactPhone: contactPhone.trim(),
    contactEmail: contactEmail.trim(),
    isPro,
    proVideoThumbUrl: proVideoThumbUrl ?? null,
    proVideoUrl: proVideoUrl ?? null,
    proVideoThumbUrl2: proVideoThumbUrl2 ?? null,
    proVideoUrl2: proVideoUrl2 ?? null,
    lang,
  };
}
