import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { isListingRowActiveAndPublishedForBrowse } from "./listingPublicBrowseEligibility";
import {
  HUB_CATEGORY_KEYS,
  type HubCategoryKey,
  type HubListing,
  type HubSellerType,
} from "../config/clasificadosHub";

function coerceHubCategory(raw: unknown): HubCategoryKey {
  const s = typeof raw === "string" ? raw.trim() : "";
  if ((HUB_CATEGORY_KEYS as readonly string[]).includes(s)) return s as HubCategoryKey;
  return "en-venta";
}

function stripLeonixImagesBlockHub(desc: string): string {
  return desc.replace(/\s*\[LEONIX_IMAGES\][\s\S]*?\[\/LEONIX_IMAGES\]\s*/g, "\n").trim();
}

function extractLeonixImageUrlsHub(description: string | null | undefined): string[] {
  if (!description) return [];
  const m = description.match(/\[LEONIX_IMAGES\]([\s\S]*?)\[\/LEONIX_IMAGES\]/);
  if (!m) return [];
  const block = m[1];
  const urls: string[] = [];
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    const um = /^url=(.+)$/i.exec(trimmed);
    if (um?.[1]) urls.push(um[1].trim());
  }
  return urls;
}

function imageUrlsFromJsonbHub(images: unknown): string[] {
  if (images == null) return [];
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
          if (typeof url === "string" && url.trim()) return url.trim();
        }
        return null;
      })
      .filter((u): u is string => u != null);
  }
  return [];
}

function postedAgoFromCreatedHub(createdAt: string | null | undefined): { es: string; en: string } {
  if (!createdAt) return { es: "", en: "" };
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return { es: "", en: "" };
  const diffMins = Math.floor((Date.now() - created) / (1000 * 60));
  const diffHours = Math.floor((Date.now() - created) / (1000 * 60 * 60));
  const diffDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  if (diffMins < 60) {
    return {
      es: diffMins <= 1 ? "hace 1 min" : `hace ${diffMins} min`,
      en: diffMins <= 1 ? "1 min ago" : `${diffMins} min ago`,
    };
  }
  if (diffHours < 24) {
    return {
      es: diffHours === 1 ? "hace 1 h" : `hace ${diffHours} h`,
      en: diffHours === 1 ? "1 h ago" : `${diffHours} h ago`,
    };
  }
  return {
    es: diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`,
    en: diffDays === 1 ? "1 day ago" : `${diffDays} days ago`,
  };
}

export function mapDbRowToHubListing(row: Record<string, unknown>): HubListing | null {
  if (!isListingRowActiveAndPublishedForBrowse(row)) return null;

  const rawDesc = String(row.description ?? "");
  const blurbText = stripLeonixImagesBlockHub(rawDesc).trim() || rawDesc.trim();
  const fromJson = imageUrlsFromJsonbHub(row.images);
  const fromMarker = extractLeonixImageUrlsHub(rawDesc);
  const mergedImgs = [...new Set([...fromJson, ...fromMarker])];
  const hasImage = mergedImgs.length > 0;

  const isFree = Boolean(row.is_free);
  const priceRaw = row.price;
  const priceNum =
    typeof priceRaw === "number" ? priceRaw : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, ""));
  const priceLabel = {
    es: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "es", isFree }),
    en: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "en", isFree }),
  };

  const createdRaw = typeof row.created_at === "string" ? row.created_at : null;

  const sellerType: HubSellerType = row.seller_type === "business" ? "business" : "personal";

  return {
    id: String(row.id ?? ""),
    category: coerceHubCategory(row.category),
    title: { es: String(row.title ?? "").trim(), en: String(row.title ?? "").trim() },
    priceLabel,
    city: String(row.city ?? "").trim(),
    postedAgo: postedAgoFromCreatedHub(createdRaw),
    blurb: { es: blurbText, en: blurbText },
    hasImage,
    sellerType,
  };
}

export function dedupeHubListingsById(items: HubListing[]): HubListing[] {
  const seen = new Set<string>();
  const out: HubListing[] = [];
  for (const it of items) {
    if (!it.id || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}
