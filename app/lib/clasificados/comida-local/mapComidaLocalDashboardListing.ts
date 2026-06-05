import type { DashboardInventoryItem } from "@/app/(site)/dashboard/lib/dashboardInventory";
import { COMIDA_LOCAL_FOOD_TYPE_OPTIONS } from "./comidaLocalConstants";
import {
  getComidaLocalPackageLabel,
  getComidaLocalPackagePriceLabel,
} from "./comidaLocalPackages";
import { getComidaLocalPaymentStatusLabel } from "./comidaLocalPaymentStatus";
import { resolveComidaLocalImageUrl } from "./comidaLocalImageValidation";
import type { ComidaLocalDashboardListingRow } from "./comidaLocalDashboardQueries";

function foodTypeLabelForDashboardRow(row: ComidaLocalDashboardListingRow): string {
  const ft = (row.food_type ?? "").trim();
  if (ft === "otro") {
    const custom = (row.food_type_custom ?? "").trim();
    return custom || "Otro";
  }
  const opt = COMIDA_LOCAL_FOOD_TYPE_OPTIONS.find((o) => o.value === ft);
  return (opt?.label ?? ft) || "Comida local";
}

export type ComidaLocalDashboardListingVm = {
  id: string;
  leonixAdId: string | null;
  title: string;
  categoryLabel: string;
  foodTypeLabel: string;
  cityLabel: string;
  statusLabel: string;
  packageLabel: string;
  paymentStatusLabel: string;
  publishedAtLabel: string;
  expiresAtLabel: string | null;
  mainPhotoUrl: string | null;
  publicPath: string;
  primaryContactLabel: string | null;
  slug: string;
  status: string;
  packageTier: string;
  paymentStatus: string;
  publishedAt: string | null;
};

function formatDashboardDate(iso: string | null | undefined, lang: "es" | "en"): string | null {
  if (!iso?.trim()) return null;
  try {
    return new Date(iso).toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
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

function primaryContactLabel(row: ComidaLocalDashboardListingRow): string | null {
  const phone = row.phone?.trim();
  const wa = row.whatsapp?.trim();
  if (phone && wa) return `${phone} · WhatsApp`;
  if (phone) return phone;
  if (wa) return `WhatsApp ${wa}`;
  return null;
}

export function mapComidaLocalRowToDashboardVm(
  row: ComidaLocalDashboardListingRow,
  lang: "es" | "en"
): ComidaLocalDashboardListingVm {
  const slug = row.slug.trim();
  const leonix =
    typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim()
      ? row.leonix_ad_id.trim()
      : null;
  const city = row.city_display?.trim() || row.city_canonical?.trim() || "";
  const mainPhotoUrl = resolveComidaLocalImageUrl(
    row.main_photo as Parameters<typeof resolveComidaLocalImageUrl>[0]
  );

  return {
    id: row.id,
    leonixAdId: leonix,
    title: row.business_name?.trim() || "Comida Local",
    categoryLabel: "Comida Local",
    foodTypeLabel: foodTypeLabelForDashboardRow(row),
    cityLabel: city,
    statusLabel: statusLabel(row.status, lang),
    packageLabel: packageLabelWithPrice(row.package_tier, lang),
    paymentStatusLabel: getComidaLocalPaymentStatusLabel(row.payment_status, lang),
    publishedAtLabel: formatDashboardDate(row.published_at, lang) ?? "—",
    expiresAtLabel: formatDashboardDate(row.expires_at ?? null, lang),
    mainPhotoUrl,
    publicPath: `/clasificados/comida-local/${encodeURIComponent(slug)}`,
    primaryContactLabel: primaryContactLabel(row),
    slug,
    status: row.status,
    packageTier: row.package_tier,
    paymentStatus: row.payment_status,
    publishedAt: row.published_at ?? null,
  };
}

/** Maps owner rows into shared Mis anuncios inventory cards (no analytics fields). */
export function buildComidaLocalDashboardInventoryItems(
  rows: ComidaLocalDashboardListingRow[],
  lang: "es" | "en"
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  return rows.map((row) => {
    const vm = mapComidaLocalRowToDashboardVm(row, lang);
    return {
      id: row.id,
      category: "comida-local",
      title: vm.title,
      status: row.status,
      publicHref: `${vm.publicPath}?${q}`,
      editHref: `/publicar/comida-local?${q}`,
      previewHref: null,
      resultsHref: `/clasificados/comida-local?${q}`,
      analyticsHref: null,
      messagesHref: null,
      publishedAt: row.published_at ?? null,
      updatedAt: row.published_at ?? null,
      image: vm.mainPhotoUrl,
      leonixAdId: vm.leonixAdId,
      slug: vm.slug,
      packageTier: row.package_tier,
      promoted: false,
      verified: false,
      draftListingId: null,
      source: "comida_local_public_listings",
    };
  });
}
