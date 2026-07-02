import type {
  ClasificadosServiciosApplicationState,
  ClasificadosServiciosPromoRow,
  ClasificadosServiciosCouponRow,
  GalleryItem,
  TestimonialRow,
  VideoItem,
} from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import { isServiciosPublishableRemoteMediaUrl } from "./serviciosMediaTransport";

const MAX_REMOTE_MEDIA_URL_LEN = 2048;
const MAX_FREE_TEXT = 24000;

function cleanRemoteMediaField(s: string): string {
  const t = (s ?? "").trim();
  if (isServiciosPublishableRemoteMediaUrl(t)) return t.slice(0, MAX_REMOTE_MEDIA_URL_LEN);
  return "";
}

function cleanPlainText(s: string): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  if (/^data:/i.test(t) || t.startsWith("blob:")) return "";
  return t.length > MAX_FREE_TEXT ? t.slice(0, MAX_FREE_TEXT) : t;
}

function cleanMuxToken(s: string | undefined): string | undefined {
  const t = (s ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{6,200}$/.test(t)) return undefined;
  return t;
}

function cleanOptionalHttps(s: string | undefined): string | undefined {
  const t = (s ?? "").trim();
  if (!t) return undefined;
  if (!isServiciosPublishableRemoteMediaUrl(t)) return undefined;
  return t.slice(0, MAX_REMOTE_MEDIA_URL_LEN);
}

/**
 * Transport-safe Servicios publish body: normalized state with only HTTPS media refs
 * and heavy `data:` / `blob:` / IDB placeholders stripped (defense in depth after Blob upload).
 */
export function buildServiciosPublishPayload(state: ClasificadosServiciosApplicationState): ClasificadosServiciosApplicationState {
  const n = normalizeClasificadosServiciosApplicationState(state);

  const gallery: GalleryItem[] = (n.gallery ?? []).slice(0, 32).map((g) => ({
    ...g,
    url: cleanRemoteMediaField(g.url),
  }));

  const videos: VideoItem[] = (n.videos ?? [])
    .slice(0, 8)
    .map((v) => ({
      ...v,
      url: cleanRemoteMediaField(v.url),
      muxPlaybackId: cleanMuxToken(v.muxPlaybackId),
      muxAssetId: cleanMuxToken(v.muxAssetId),
      muxThumbnailUrl: cleanOptionalHttps(v.muxThumbnailUrl),
      muxSkipReason: cleanPlainText(v.muxSkipReason ?? "").slice(0, 400) || undefined,
    }))
    .filter((v) => v.url.trim().length > 0);

  const promotions: ClasificadosServiciosPromoRow[] = (n.promotions ?? []).slice(0, 4).map((row) => ({
    ...row,
    title: cleanPlainText(row.title),
    details: cleanPlainText(row.details),
    link: cleanPlainText(row.link),
    imageUrl: cleanRemoteMediaField(row.imageUrl),
  }));

  const coupons: ClasificadosServiciosCouponRow[] = (n.coupons ?? []).slice(0, 4).map((row) => ({
    ...row,
    title: cleanPlainText(row.title),
    description: cleanPlainText(row.description),
    regularPrice: cleanPlainText(row.regularPrice),
    specialPrice: cleanPlainText(row.specialPrice),
    savings: cleanPlainText(row.savings),
    imageUrl: cleanRemoteMediaField(row.imageUrl),
  }));

  const testimonials: TestimonialRow[] = (n.testimonials ?? []).slice(0, 24).map((t) => ({
    ...t,
    authorName: cleanPlainText(t.authorName),
    quote: cleanPlainText(t.quote),
  }));

  return normalizeClasificadosServiciosApplicationState({
    ...n,
    businessName: cleanPlainText(n.businessName),
    city: cleanPlainText(n.city),
    physicalStreet: cleanPlainText(n.physicalStreet),
    physicalSuite: cleanPlainText(n.physicalSuite),
    physicalAddressCity: cleanPlainText(n.physicalAddressCity),
    physicalRegion: cleanPlainText(n.physicalRegion),
    physicalPostalCode: cleanPlainText(n.physicalPostalCode),
    serviceAreaNotes: cleanPlainText(n.serviceAreaNotes),
    phone: cleanPlainText(n.phone),
    phoneOffice: cleanPlainText(n.phoneOffice),
    website: cleanPlainText(n.website),
    whatsapp: cleanPlainText(n.whatsapp),
    whatsappBusinessUrl: cleanPlainText(n.whatsappBusinessUrl),
    quoteMessagePhone: cleanPlainText(n.quoteMessagePhone),
    email: cleanPlainText(n.email),
    languageOtherLines: cleanPlainText(n.languageOtherLines),
    logoUrl: cleanRemoteMediaField(n.logoUrl),
    coverUrl: cleanRemoteMediaField(n.coverUrl),
    gallery,
    featuredGalleryIds: (n.featuredGalleryIds ?? []).filter((id) => gallery.some((g) => g.id === id)).slice(0, 8),
    videos,
    aboutText: cleanPlainText(n.aboutText),
    specialtiesLine: cleanPlainText(n.specialtiesLine),
    customServicesOffered: (n.customServicesOffered ?? []).map((x) => cleanPlainText(x)).filter(Boolean).slice(0, 40),
    customServiceLabel: cleanPlainText(n.customServiceLabel),
    customServiceDescription: cleanPlainText(n.customServiceDescription ?? ""),
    customReasonLabel: cleanPlainText(n.customReasonLabel),
    customQuickFactLabel: cleanPlainText(n.customQuickFactLabel),
    customBusinessHighlights: (n.customBusinessHighlights ?? []).map((x) => cleanPlainText(x)).filter(Boolean).slice(0, 20),
    customBusinessHighlightLabel: cleanPlainText(n.customBusinessHighlightLabel),
    socialInstagram: cleanPlainText(n.socialInstagram),
    socialFacebook: cleanPlainText(n.socialFacebook),
    socialYoutube: cleanPlainText(n.socialYoutube),
    socialTiktok: cleanPlainText(n.socialTiktok),
    socialLinkedin: cleanPlainText(n.socialLinkedin),
    socialX: cleanPlainText(n.socialX),
    socialSnapchat: cleanPlainText(n.socialSnapchat),
    googleReviewsUrl: cleanPlainText(n.googleReviewsUrl),
    yelpReviewsUrl: cleanPlainText(n.yelpReviewsUrl),
    extraLink1Url: cleanPlainText(n.extraLink1Url),
    extraLink1Label: cleanPlainText(n.extraLink1Label).slice(0, 48),
    extraLink2Url: cleanPlainText(n.extraLink2Url),
    extraLink2Label: cleanPlainText(n.extraLink2Label).slice(0, 48),
    customPaymentMethods: (n.customPaymentMethods ?? []).map((x) => cleanPlainText(x)).filter(Boolean).slice(0, 12),
    customPaymentMethodLabel: cleanPlainText(n.customPaymentMethodLabel),
    customAmenityOptions: (n.customAmenityOptions ?? []).map((x) => cleanPlainText(x)).filter(Boolean).slice(0, 24),
    pendingCustomAmenityOption: cleanPlainText(n.pendingCustomAmenityOption),
    licenseType: cleanPlainText(n.licenseType),
    licenseNumber: cleanPlainText(n.licenseNumber),
    licenseAuthority: cleanPlainText(n.licenseAuthority),
    licenseExpiration: cleanPlainText(n.licenseExpiration),
    insuranceType: cleanPlainText(n.insuranceType),
    certifications: (n.certifications ?? []).map((x) => cleanPlainText(x)).filter(Boolean).slice(0, 20),
    pendingCertification: cleanPlainText(n.pendingCertification),
    licenseDocumentUrl: cleanRemoteMediaField(n.licenseDocumentUrl),
    insuranceDocumentUrl: cleanRemoteMediaField(n.insuranceDocumentUrl),
    promotions,
    coupons,
    testimonials,
  });
}

export type ServiciosPublishTransportBody = {
  state: ClasificadosServiciosApplicationState;
  lang: "es" | "en";
  existingPublicSlug?: string;
  videoPublishDiagnostics?: { videoId: string; reason: string }[];
};

export function buildServiciosPublishTransportBody(
  state: ClasificadosServiciosApplicationState,
  lang: "es" | "en",
  existingPublicSlug?: string,
  videoPublishDiagnostics?: { videoId: string; reason: string }[],
): ServiciosPublishTransportBody {
  const payload: ServiciosPublishTransportBody = {
    state: buildServiciosPublishPayload(state),
    lang,
  };
  if (existingPublicSlug?.trim()) payload.existingPublicSlug = existingPublicSlug.trim();
  if (videoPublishDiagnostics?.length) {
    payload.videoPublishDiagnostics = videoPublishDiagnostics
      .map((d) => ({
        videoId: cleanPlainText(d.videoId).slice(0, 80),
        reason: cleanPlainText(d.reason).slice(0, 400),
      }))
      .filter((d) => d.videoId.trim().length > 0 && d.reason.trim().length > 0)
      .slice(0, 6);
  }
  return payload;
}
