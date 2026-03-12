import { isProListing } from "../components/planHelpers";
import type { ListingData } from "../components/ListingView";

/** DB/draft row shape (snake_case or camelCase). */
export type ListingRow = Record<string, unknown> & {
  title?: string | null;
  description?: string | null;
  price?: number | string | null;
  city?: string | null;
  images?: unknown;
  image_urls?: string[] | null;
  imageUrls?: string[] | null;
  photos?: string[] | null;
  contact_phone?: string | null;
  contactPhone?: string | null;
  contact_email?: string | null;
  contactEmail?: string | null;
  contact_method?: "phone" | "email" | "both" | null;
  contactMethod?: "phone" | "email" | "both" | null;
  is_free?: boolean | null;
  isFree?: boolean | null;
  is_published?: boolean | null;
  category?: string | null;
  status?: string | null;
  membership_snapshot?: unknown;
  boost_until?: string | null;
  expires_at?: string | null;
  posted_at?: string | null;
  created_at?: string | null;
  todayLabel?: string | null;
  detailPairs?: Array<{ label: string; value: string }> | null;
  detail_pairs?: Array<{ label: string; value: string }> | null;
  proVideoThumbUrl?: string | null;
  proVideoUrl?: string | null;
  pro_video_thumb_url?: string | null;
  pro_video_url?: string | null;
  lang?: "es" | "en" | null;
  itemType?: string | null;
  condition?: string | null;
  rama?: string | null;
};

/** Ordered image URLs from draft/DB. Only use logo placeholder when there are truly zero images. */
function normalizeImages(row: ListingRow): string[] {
  let raw: unknown =
    row.images ?? row.image_urls ?? row.imageUrls ?? row.photos;
  if (raw == null) raw = [];
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const urls = raw.filter((u): u is string => typeof u === "string");
  return urls.length > 0 ? urls : ["/logo.png"];
}

function normalizeContactMethod(row: ListingRow): "phone" | "email" | "both" {
  const method = row.contact_method ?? row.contactMethod;
  if (method === "phone" || method === "email" || method === "both") return method;
  const phone = String(row.contact_phone ?? row.contactPhone ?? "").trim();
  const email = String(row.contact_email ?? row.contactEmail ?? "").trim();
  const hasPhone = phone.length >= 10;
  const hasEmail = /.+@.+\..+/.test(email);
  if (hasPhone && hasEmail) return "both";
  if (hasPhone) return "phone";
  if (hasEmail) return "email";
  return "phone";
}

/**
 * Map a database listing row or draft into the ListingData shape expected by ListingView.
 */
export function mapListingToViewModel(row: ListingRow | null, lang: "es" | "en"): ListingData | null {
  if (!row || typeof row !== "object") return null;

  const L = (row.lang as "es" | "en") ?? lang;
  const title = String(row.title ?? "").trim() || (L === "es" ? "(Sin título)" : "(No title)");
  const city = String(row.city ?? "").trim() || (L === "es" ? "Ciudad" : "City");
  const description = String(row.description ?? "").trim() || (L === "es" ? "Sin descripción" : "No description");

  const isFree = row.is_free === true || row.isFree === true;
  const priceRaw = row.price;
  const priceNum = priceRaw != null && priceRaw !== "" ? Number(String(priceRaw).replace(/[^0-9.]/g, "")) : NaN;
  const hasPrice = Number.isFinite(priceNum) && priceNum >= 0;
  const priceLabel =
    isFree
      ? (L === "es" ? "Gratis" : "Free")
      : hasPrice
        ? (priceNum === 0 ? (L === "es" ? "Gratis" : "Free") : `$${Math.round(priceNum)}`)
        : (L === "es" ? "(Sin precio)" : "(No price)");

  const todayLabel =
    (row.todayLabel as string) ??
    (L === "es" ? "Publicado hoy" : "Posted today");

  const contactPhone = String(row.contact_phone ?? row.contactPhone ?? "").trim();
  const contactEmail = String(row.contact_email ?? row.contactEmail ?? "").trim();
  const contactMethod = normalizeContactMethod(row);

  const images = normalizeImages(row);

  const detailPairs = (row.detailPairs ?? row.detail_pairs ?? []) as Array<{ label: string; value: string }>;
  const pairs = Array.isArray(detailPairs) ? detailPairs : [];
  const hasCategory = pairs.some((p) => /categoría|category/i.test(p.label));
  const hasItemType = pairs.some((p) => /tipo|article|artículo/i.test(p.label));
  const hasCondition = pairs.some((p) => /condición|condition/i.test(p.label));
  const builtPairs = [...pairs];
  if (!hasCategory && row.category) {
    builtPairs.push({
      label: L === "es" ? "Categoría" : "Category",
      value: String(row.category),
    });
  }
  if (!hasItemType && row.itemType) {
    builtPairs.push({
      label: L === "es" ? "Tipo de artículo" : "Item type",
      value: String(row.itemType),
    });
  }
  if (!hasCondition && row.condition) {
    builtPairs.push({
      label: L === "es" ? "Condición" : "Condition",
      value: String(row.condition),
    });
  }

  const isPro = isProListing(row);
  const proVideoThumbUrl = (row.proVideoThumbUrl ?? row.pro_video_thumb_url ?? null) as string | null;
  const proVideoUrl = (row.proVideoUrl ?? row.pro_video_url ?? null) as string | null;

  return {
    title,
    priceLabel,
    city,
    description,
    todayLabel,
    images,
    detailPairs: builtPairs,
    contactMethod,
    contactPhone,
    contactEmail,
    isPro,
    proVideoThumbUrl: proVideoThumbUrl ?? null,
    proVideoUrl: proVideoUrl ?? null,
    lang: L,
  };
}
