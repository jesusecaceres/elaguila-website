import { COMIDA_LOCAL_FOOD_TYPE_OPTIONS } from "./comidaLocalConstants";
import {
  getComidaLocalPackageLabel,
  getComidaLocalPackagePriceLabel,
} from "./comidaLocalPackages";
import { getComidaLocalPaymentStatusLabel } from "./comidaLocalPaymentStatus";
import { resolveComidaLocalImageUrl } from "./comidaLocalImageValidation";
import type { ComidaLocalAdminListingRow } from "./comidaLocalAdminQueries";

function foodTypeLabelForAdminRow(row: ComidaLocalAdminListingRow): string {
  const ft = (row.food_type ?? "").trim();
  if (ft === "otro") {
    const custom = (row.food_type_custom ?? "").trim();
    return custom || "Otro";
  }
  const opt = COMIDA_LOCAL_FOOD_TYPE_OPTIONS.find((o) => o.value === ft);
  return (opt?.label ?? ft) || "Comida local";
}

function statusLabel(status: string, lang: "es" | "en"): string {
  const s = status.trim().toLowerCase();
  const map: Record<string, { es: string; en: string }> = {
    published: { es: "Publicado", en: "Published" },
    draft: { es: "Borrador", en: "Draft" },
    paused: { es: "Pausado", en: "Paused" },
    suspended: { es: "Suspendido", en: "Suspended" },
    pending_payment: { es: "Pago pendiente", en: "Payment pending" },
  };
  return map[s]?.[lang] ?? status;
}

function packageLabelWithPrice(tier: string, lang: "es" | "en"): string {
  const label = getComidaLocalPackageLabel(tier, lang);
  const price = getComidaLocalPackagePriceLabel(tier);
  return label && price ? `${label} (${price})` : label || tier || "—";
}

function formatAdminDate(iso: string | null | undefined, lang: "es" | "en"): string {
  if (!iso?.trim()) return "—";
  try {
    return new Date(iso).toLocaleString(lang === "es" ? "es-US" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function contactSummary(row: ComidaLocalAdminListingRow): string {
  const bits: string[] = [];
  const phone = row.phone?.trim();
  const wa = row.whatsapp?.trim();
  if (phone) bits.push(phone);
  if (wa) bits.push(`WA ${wa}`);
  return bits.length ? bits.join(" · ") : "—";
}

function socialSummary(row: ComidaLocalAdminListingRow): string {
  const bits: string[] = [];
  if (row.instagram_url?.trim()) bits.push("IG");
  if (row.facebook_url?.trim()) bits.push("FB");
  if (row.tiktok_url?.trim()) bits.push("TT");
  return bits.length ? bits.join(" · ") : "—";
}

function listingJsonSummary(json: Record<string, unknown> | null | undefined): string | null {
  if (!json || typeof json !== "object") return null;
  const keys = Object.keys(json);
  if (!keys.length) return "vacío";
  return `${keys.length} clave(s)`;
}

export type ComidaLocalAdminListingVm = {
  id: string;
  ownerUserId: string | null;
  leonixAdId: string | null;
  title: string;
  categoryLabel: string;
  foodTypeLabel: string;
  cityLabel: string;
  statusLabel: string;
  packageLabel: string;
  paymentStatusLabel: string;
  publishedAtLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  expiresAtLabel: string | null;
  mainPhotoUrl: string | null;
  publicPath: string;
  rawStatus: string;
  rawPackageTier: string;
  rawPaymentStatus: string;
  contactSummary: string;
  socialSummary: string;
  listingJsonSummary: string | null;
  slug: string;
  listingJson: Record<string, unknown> | null;
};

export function mapComidaLocalRowToAdminVm(
  row: ComidaLocalAdminListingRow,
  lang: "es" | "en" = "es"
): ComidaLocalAdminListingVm {
  const slug = row.slug.trim();
  const leonix =
    typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim()
      ? row.leonix_ad_id.trim()
      : null;
  const city = row.city_display?.trim() || row.city_canonical?.trim() || "";
  const mainPhotoUrl = resolveComidaLocalImageUrl(
    row.main_photo as Parameters<typeof resolveComidaLocalImageUrl>[0]
  );
  const listingJson =
    row.listing_json && typeof row.listing_json === "object"
      ? (row.listing_json as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? null,
    leonixAdId: leonix,
    title: row.business_name?.trim() || "Comida Local",
    categoryLabel: "Comida Local",
    foodTypeLabel: foodTypeLabelForAdminRow(row),
    cityLabel: city || "—",
    statusLabel: statusLabel(row.status, lang),
    packageLabel: packageLabelWithPrice(row.package_tier, lang),
    paymentStatusLabel: getComidaLocalPaymentStatusLabel(row.payment_status, lang),
    publishedAtLabel: formatAdminDate(row.published_at, lang),
    createdAtLabel: formatAdminDate(row.created_at, lang),
    updatedAtLabel: formatAdminDate(row.updated_at, lang),
    expiresAtLabel: row.expires_at ? formatAdminDate(row.expires_at, lang) : null,
    mainPhotoUrl,
    publicPath: `/clasificados/comida-local/${encodeURIComponent(slug)}`,
    rawStatus: row.status,
    rawPackageTier: row.package_tier,
    rawPaymentStatus: row.payment_status,
    contactSummary: contactSummary(row),
    socialSummary: socialSummary(row),
    listingJsonSummary: listingJsonSummary(listingJson),
    slug,
    listingJson,
  };
}

export function mapComidaLocalRowsToAdminVms(
  rows: ComidaLocalAdminListingRow[],
  lang: "es" | "en" = "es"
): ComidaLocalAdminListingVm[] {
  return rows.map((row) => mapComidaLocalRowToAdminVm(row, lang));
}
