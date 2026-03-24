import type { ListingData } from "@/app/clasificados/components/ListingView";
import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

export function isBienesRaicesPrivadoPublishPreviewContext(
  categoryFromUrl: string,
  snap: PublishDraftSnapshot,
  details: Record<string, string>
): boolean {
  const br =
    (snap.details?.bienesRaicesBranch ?? details?.bienesRaicesBranch ?? "").trim().toLowerCase();
  return categoryFromUrl === "bienes-raices" && br === "privado";
}

export function buildBrPrivadoFullPreviewListingData(params: {
  publishDraftSnapshot: PublishDraftSnapshot;
  lang: "es" | "en";
  todayLabel: string;
  previewCategoryLabel: string | null | undefined;
  sellerDisplayName: string | null | undefined;
  userId: string | null | undefined;
  contactPhoneDisplay: string;
}): ListingData {
  const snap = params.publishDraftSnapshot;
  const lang = params.lang;
  const imgs = snap.images?.length ? snap.images : ["/logo.png"];
  return {
    title: snap.title || (lang === "es" ? "(Sin título)" : "(No title)"),
    priceLabel: snap.priceLabel,
    city: (snap.cityCanonical ?? snap.city) || (lang === "es" ? "Ciudad" : "City"),
    description: snap.description || "",
    todayLabel: params.todayLabel,
    images: imgs,
    detailPairs: snap.detailPairs ?? [],
    contactMethod: snap.contactMethod,
    contactPhone: params.contactPhoneDisplay,
    contactEmail: snap.contactEmail,
    isPro: snap.isPro,
    proVideoThumbUrl: snap.proVideoThumbUrl,
    proVideoUrl: snap.proVideoUrl,
    proVideoThumbUrl2: snap.proVideoThumbUrl2 ?? null,
    proVideoUrl2: snap.proVideoUrl2 ?? null,
    lang,
    sellerName: params.sellerDisplayName ?? undefined,
    categoryLabel: params.previewCategoryLabel ?? undefined,
    category: "bienes-raices",
    ownerId: params.userId?.trim() ? params.userId.trim() : undefined,
  };
}
