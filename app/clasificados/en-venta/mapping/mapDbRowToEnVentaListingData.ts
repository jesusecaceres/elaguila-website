import { formatListingPrice } from "@/app/lib/formatListingPrice";
import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";

function stripLeonixImages(desc: string): string {
  return desc.replace(/\s*\[LEONIX_IMAGES\][\s\S]*?\[\/LEONIX_IMAGES\]\s*/g, "\n").trim();
}

function imageUrlsFromRow(row: Record<string, unknown>): string[] {
  const fromJson = row.images;
  if (Array.isArray(fromJson)) {
    const u = fromJson
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const url = (o.url ?? o.src ?? o.path) as string | undefined;
          if (typeof url === "string" && url.trim()) return url.trim();
        }
        return null;
      })
      .filter((x): x is string => x != null);
    if (u.length) return u;
  }
  const rawDesc = String(row.description ?? "");
  const m = rawDesc.match(/\[LEONIX_IMAGES\]([\s\S]*?)\[\/LEONIX_IMAGES\]/);
  if (!m) return [];
  const urls: string[] = [];
  for (const line of m[1].split("\n")) {
    const t = line.trim();
    const um = /^url=(.+)$/i.exec(t);
    if (um?.[1]) urls.push(um[1].trim());
  }
  return urls;
}

function postedAgoBilingual(createdAt: string | null | undefined): { es: string; en: string } {
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

function pairsFromRow(row: Record<string, unknown>): Array<{ label: string; value: string }> {
  const dp = row.detail_pairs;
  if (!Array.isArray(dp)) return [];
  return dp
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label : "";
      const value = typeof o.value === "string" ? o.value : "";
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

/** Build EV anuncio DTO from Supabase `listings` row. */
export function mapDbRowToEnVentaAnuncioDTO(row: Record<string, unknown>): EnVentaAnuncioDTO {
  const rawDesc = String(row.description ?? "");
  const description = stripLeonixImages(rawDesc).trim() || rawDesc.trim();
  const titleStr = String(row.title ?? "").trim();
  const isFree = Boolean(row.is_free);
  const priceRaw = row.price;
  const priceNum = typeof priceRaw === "number" ? priceRaw : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, ""));
  const priceLabel = {
    es: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "es", isFree }),
    en: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "en", isFree }),
  };

  const pairs = pairsFromRow(row);
  let deptKey = "";
  let articleKey = "";
  let condKey = "";
  let evSubKey = "";
  for (const p of pairs) {
    const lk = p.label.toLowerCase();
    if (p.label === "Leonix:evSub") evSubKey = p.value.trim();
    if (lk.includes("departamento") || lk.includes("department")) deptKey = p.value.trim();
    if (lk.includes("artículo") || lk.includes("articulo") || (lk.includes("item") && lk.includes("type")))
      articleKey = p.value.trim();
    if (lk.includes("condición") || lk.includes("condicion") || lk.includes("condition")) condKey = p.value.trim();
  }

  const images = imageUrlsFromRow(row);
  const sellerType = row.seller_type === "business" ? "business" : "individual";
  const businessName =
    row.business_name != null && String(row.business_name).trim()
      ? String(row.business_name).trim()
      : null;

  const phone = row.contact_phone != null ? String(row.contact_phone) : null;
  const email = row.contact_email != null ? String(row.contact_email) : null;

  const specRows = pairs.filter((p) => !/^leonix:/i.test(p.label));

  const negotiable = /negociable|negotiable|obo|best offer/i.test(`${titleStr} ${description}`);

  const postedAgoOut = postedAgoBilingual(typeof row.created_at === "string" ? row.created_at : null);

  let pickup = false;
  let shipping = false;
  let delivery = false;
  for (const p of pairs) {
    if (/entrega|fulfillment/i.test(p.label)) {
      const v = p.value.toLowerCase();
      if (v.includes("recogida") || v.includes("pickup")) pickup = true;
      if (v.includes("envío") || v.includes("envio") || v.includes("shipping")) shipping = true;
      if (v.includes("entrega") && !v.includes("envío") && !v.includes("envio")) delivery = true;
      if (v.includes("delivery")) delivery = true;
    }
  }

  return {
    id: String(row.id ?? ""),
    title: { es: titleStr, en: titleStr },
    description,
    priceLabel,
    city: String(row.city ?? "").trim(),
    zip: row.zip != null && String(row.zip).trim() ? String(row.zip).trim() : null,
    postedAgo: postedAgoOut,
    images,
    conditionKey: condKey || null,
    departmentKey: deptKey || null,
    subKey: evSubKey || null,
    articleKey: articleKey || null,
    specRows,
    fulfillment: { pickup, shipping, delivery },
    negotiable,
    sellerKind: sellerType,
    businessName,
    contactPhone: phone,
    contactEmail: email,
    ownerId: row.owner_id != null ? String(row.owner_id) : null,
  };
}
