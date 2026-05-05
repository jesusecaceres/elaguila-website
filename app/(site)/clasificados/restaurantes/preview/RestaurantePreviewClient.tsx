"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  isRestauranteDraftPristineEmpty,
  mapRestauranteDraftToShellData,
} from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { satisfiesRestauranteMinimumValidPreview } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteAdStoryPreview } from "@/app/clasificados/restaurantes/shell/RestauranteAdStoryPreview";
import { RestaurantePreviewCard } from "@/app/clasificados/restaurantes/shell/RestaurantePreviewCard";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { supabase } from "@/app/lib/supabaseClient";
import type { RestauranteListingDraft } from "../application/restauranteDraftTypes";

// Leonix premium visual tokens

/**
 * Build minimal restaurant publish payload using strict whitelist
 * Only sends metadata and safe references, never raw media
 */
function buildRestaurantePublishPayload(draft: RestauranteListingDraft, ownerUserId?: string, plan?: string, lang = "es"): any {
  // Helper to extract safe media reference
  const extractMediaRef = (media?: any) => {
    if (!media || typeof media !== 'object') return undefined;
    
    // Only keep safe reference fields
    const ref: any = {};
    const safeFields = ['path', 'storagePath', 'url', 'publicUrl', 'signedUrl', 'muxUploadId', 'muxAssetId', 'playbackId', 'thumbnailUrl', 'filename', 'mimeType', 'size', 'sortOrder', 'category', 'label', 'alt'];
    
    safeFields.forEach(field => {
      if (media[field] && typeof media[field] === 'string' && !media[field].startsWith('data:') && !media[field].startsWith('blob:')) {
        ref[field] = media[field];
      } else if (typeof media[field] === 'number') {
        ref[field] = media[field];
      }
    });
    
    return Object.keys(ref).length > 0 ? ref : undefined;
  };

  // Helper to extract safe media array
  const extractMediaArray = (arr?: any[]) => {
    if (!Array.isArray(arr)) return undefined;
    return arr.map(item => extractMediaRef(item)).filter(Boolean).slice(0, 20); // Limit array size
  };

  // Build minimal payload with explicit whitelist
  const payload: any = {
    // Basic metadata
    draftListingId: draft.draftListingId,
    businessName: draft.businessName,
    shortSummary: draft.shortSummary,
    longDescription: draft.longDescription,
    
    // Cuisine and type
    primaryCuisine: draft.primaryCuisine,
    primaryCuisineCustom: draft.primaryCuisineCustom,
    secondaryCuisine: draft.secondaryCuisine,
    secondaryCuisineCustom: draft.secondaryCuisineCustom,
    additionalCuisines: (draft.additionalCuisines || []).slice(0, 10),
    additionalCuisineOtherCustom: draft.additionalCuisineOtherCustom,
    businessType: draft.businessType,
    businessTypeCustom: draft.businessTypeCustom,
    
    // Location
    addressLine1: draft.addressLine1,
    addressLine2: draft.addressLine2,
    cityCanonical: draft.cityCanonical,
    state: draft.state,
    zipCode: draft.zipCode,
    neighborhood: draft.neighborhood,
    
    // Contact
    phoneNumber: draft.phoneNumber,
    email: draft.email,
    websiteUrl: draft.websiteUrl,
    instagramUrl: draft.instagramUrl,
    facebookUrl: draft.facebookUrl,
    tiktokUrl: draft.tiktokUrl,
    youtubeUrl: draft.youtubeUrl,
    whatsAppNumber: draft.whatsAppNumber,
    
    // Services and features
    serviceModes: (draft.serviceModes || []).slice(0, 10),
    serviceModeOtherCustom: draft.serviceModeOtherCustom,
    languagesSpoken: (draft.languagesSpoken || []).slice(0, 10),
    languageOtherCustom: draft.languageOtherCustom,
    highlights: (draft.highlights || []).slice(0, 20),
    
    // Business settings
    priceLevel: draft.priceLevel,
    movingVendor: draft.movingVendor,
    homeBasedBusiness: draft.homeBasedBusiness,
    foodTruck: draft.foodTruck,
    popUp: draft.popUp,
    
    // Hours
    monday: draft.monday,
    tuesday: draft.tuesday,
    wednesday: draft.wednesday,
    thursday: draft.thursday,
    friday: draft.friday,
    saturday: draft.saturday,
    sunday: draft.sunday,
    specialHoursNote: draft.specialHoursNote,
    
    // Media references (safe only)
    heroImage: extractMediaRef(draft.heroImage),
    businessLogo: extractMediaRef(draft.businessLogo),
    menuFile: draft.menuFile && typeof draft.menuFile === 'string' && !draft.menuFile.startsWith('data:') && !draft.menuFile.startsWith('blob:') ? draft.menuFile : undefined,
    menuUrl: draft.menuUrl,
    orderUrl: draft.orderUrl,
    reservationUrl: draft.reservationUrl,
    
    // Gallery arrays (safe references only)
    galleryImages: extractMediaArray(draft.galleryImages),
    interiorImages: extractMediaArray(draft.interiorImages),
    foodImages: extractMediaArray(draft.foodImages),
    exteriorImages: extractMediaArray(draft.exteriorImages),
    
    // Video references (safe only)
    videoFile: draft.videoFile && typeof draft.videoFile === 'string' && !draft.videoFile.startsWith('data:') && !draft.videoFile.startsWith('blob:') ? draft.videoFile : undefined,
    videoUrl: draft.videoUrl,
    
    // Featured dishes (safe references only)
    featuredDishes: (draft.featuredDishes || []).map(dish => ({
      title: dish.title,
      shortNote: dish.shortNote,
      priceLabel: dish.priceLabel,
      image: extractMediaRef(dish.image)
    })).slice(0, 10),
    
    // Catering and events
    cateringAvailable: draft.cateringAvailable,
    eventFoodService: draft.eventFoodService,
    
    // Stack sections (safe references only)
    movingVendorStack: draft.movingVendorStack ? {
      currentLocationText: draft.movingVendorStack.currentLocationText,
      currentLocationUrl: draft.movingVendorStack.currentLocationUrl && !draft.movingVendorStack.currentLocationUrl.startsWith('data:') && !draft.movingVendorStack.currentLocationUrl.startsWith('blob:') ? draft.movingVendorStack.currentLocationUrl : undefined,
      activeNow: draft.movingVendorStack.activeNow,
      todayHoursText: draft.movingVendorStack.todayHoursText,
      nextStopText: draft.movingVendorStack.nextStopText,
      nextStopTime: draft.movingVendorStack.nextStopTime,
      weeklyRouteText: draft.movingVendorStack.weeklyRouteText,
      allowFollowNotify: draft.movingVendorStack.allowFollowNotify,
      notifyCopy: draft.movingVendorStack.notifyCopy
    } : undefined,
    
    homeBasedStack: draft.homeBasedStack ? {
      pickupInstructions: draft.homeBasedStack.pickupInstructions,
      pickupDays: (draft.homeBasedStack.pickupDays || []).slice(0, 7),
      pickupWindowText: draft.homeBasedStack.pickupWindowText,
      deliveryRadiusMiles: draft.homeBasedStack.deliveryRadiusMiles,
      preorderLeadTimeText: draft.homeBasedStack.preorderLeadTimeText,
      homeBusinessNotice: draft.homeBasedStack.homeBusinessNotice
    } : undefined,
    
    cateringEventsStack: draft.cateringEventsStack ? {
      eventSizesSupported: (draft.cateringEventsStack.eventSizesSupported || []).slice(0, 10),
      bookingLeadTimeText: draft.cateringEventsStack.bookingLeadTimeText,
      serviceRadiusMiles: draft.cateringEventsStack.serviceRadiusMiles,
      cateringInquiryUrl: draft.cateringEventsStack.cateringInquiryUrl && !draft.cateringEventsStack.cateringInquiryUrl.startsWith('data:') && !draft.cateringEventsStack.cateringInquiryUrl.startsWith('blob:') ? draft.cateringEventsStack.cateringInquiryUrl : undefined,
      cateringNote: draft.cateringEventsStack.cateringNote
    } : undefined,
    
    // External ratings
    externalRatingValue: draft.externalRatingValue,
    externalReviewCount: draft.externalReviewCount,
    googleReviewUrl: draft.googleReviewUrl && !draft.googleReviewUrl.startsWith('data:') && !draft.googleReviewUrl.startsWith('blob:') ? draft.googleReviewUrl : undefined,
    yelpReviewUrl: draft.yelpReviewUrl && !draft.yelpReviewUrl.startsWith('data:') && !draft.yelpReviewUrl.startsWith('blob:') ? draft.yelpReviewUrl : undefined,
    
    // Testimonials and AI
    testimonialSnippet: draft.testimonialSnippet,
    aiSummaryEnabled: draft.aiSummaryEnabled,
    
    // Service flags
    reservationsAvailable: draft.reservationsAvailable,
    preorderRequired: draft.preorderRequired,
    pickupAvailable: draft.pickupAvailable,
    
    // Delivery settings
    deliveryRadiusMiles: draft.deliveryRadiusMiles,
    serviceAreaText: draft.serviceAreaText,
    
    // Publish metadata
    lang,
    plan,
    ...(ownerUserId ? { owner_user_id: ownerUserId } : {}),
  };

  // Remove undefined fields to keep payload minimal
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  // Development debug logging
  if (process.env.NODE_ENV === 'development') {
    const originalSize = JSON.stringify(draft).length;
    const finalSize = JSON.stringify(payload).length;
    const mediaCounts = {
      heroImage: payload.heroImage ? 1 : 0,
      businessLogo: payload.businessLogo ? 1 : 0,
      galleryImages: payload.galleryImages?.length || 0,
      interiorImages: payload.interiorImages?.length || 0,
      foodImages: payload.foodImages?.length || 0,
      exteriorImages: payload.exteriorImages?.length || 0,
      featuredDishes: payload.featuredDishes?.length || 0,
    };
    
    console.log('🔍 Publish payload construction:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
      finalSize: `${(finalSize / 1024).toFixed(1)} KB`,
      sizeReduction: `${((originalSize - finalSize) / originalSize * 100).toFixed(1)}%`,
      topLevelKeys: Object.keys(payload),
      mediaCounts
    });
  }

  return payload;
}
const LEONIX_PAGE_BG = "#F4F1EB";
const LEONIX_CARD_SURFACE = "#FFFAF3";
const LEONIX_BORDER = "#D8C2A0";
const LEONIX_PRIMARY_TEXT = "#1F1A17";
const LEONIX_SECONDARY_TEXT = "#5A5148";
const LEONIX_MUTED_TEXT = "#8B7E70";
const LEONIX_GOLD_ACCENT = "#BEA98E";
const LEONIX_DARK_CTA = "#2C1810";
const LEONIX_SUCCESS_GREEN = "#1A4D2E";
const LEONIX_INFO_BLUE = "#355C7D";
const LEONIX_ELEVATED_CHIP = "#F6EBDD";

const EDIT_HREF = "/publicar/restaurantes";

export default function RestaurantePreviewClient() {
  const searchParams = useSearchParams();
  const { hydrated, draft } = useRestauranteDraft();
  const [pub, setPub] = useState<{
    busy: boolean;
    url?: string;
    resultsUrl?: string;
    dashboardUrl?: string;
    err?: string;
    errDetail?: string;
    persisted?: boolean;
  }>({ busy: false });

  const pristine = useMemo(() => isRestauranteDraftPristineEmpty(draft), [draft]);
  const shellData = useMemo(() => mapRestauranteDraftToShellData(draft), [draft]);
  const minOk = useMemo(() => satisfiesRestauranteMinimumValidPreview(draft), [draft]);

  const publishPlan = searchParams?.get("plan") === "pro" ? "pro" : "free";

  const onPublish = useCallback(async () => {
    setPub({ busy: true });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const owner_user_id = auth?.user?.id;
      
      // Build minimal publish payload using strict whitelist
      const publishPayload = buildRestaurantePublishPayload(draft, owner_user_id, publishPlan, "es");
      
      // Hard client guard: check payload size before sending (1MB conservative limit)
      const payloadSize = new Blob([JSON.stringify(publishPayload)]).size;
      const maxSize = 1 * 1024 * 1024; // 1 MB conservative limit
      
      if (payloadSize > maxSize) {
        setPub({
          busy: false,
          err: "payload_too_large",
          errDetail: `Publish payload is still too large. Only metadata should be sent. Current size: ${(payloadSize / 1024).toFixed(1)} KB, limit: 1 MB`,
        });
        return;
      }
      
      const res = await fetch("/api/clasificados/restaurantes/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishPayload),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        publicUrl?: string | null;
        resultsUrl?: string;
        dashboardUrl?: string;
        error?: string;
        detail?: string;
        persisted?: boolean;
      };
      if (!res.ok || !j.ok) {
        setPub({
          busy: false,
          err: j.error ?? "publish_failed",
          errDetail: typeof j.detail === "string" ? j.detail : undefined,
        });
        return;
      }
      setPub({
        busy: false,
        url: j.publicUrl ?? undefined,
        resultsUrl: j.resultsUrl,
        dashboardUrl: j.dashboardUrl,
        persisted: j.persisted ?? true,
        err: undefined,
        errDetail: undefined,
      });
    } catch {
      setPub({ busy: false, err: "network" });
    }
  }, [draft, publishPlan]);

  if (!hydrated) {
    return (
      <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center text-[color:var(--lx-muted)]">Cargando vista previa…</div>
      </RestaurantesShellChrome>
    );
  }

  if (pristine) {
    return (
      <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
        <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
          <div className="rounded-[24px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-8 py-12 text-center shadow-[0_24px_80px_-32px_rgba(42,36,22,0.12)]">
            <h1 className="text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">Aún no hay datos del anuncio</h1>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
              Completa el formulario de publicación para ver cómo se verá tu restaurante. Solo los campos que llenes aparecerán
              en la página. Usa <strong className="text-[color:var(--lx-text)]">Volver a editar</strong> arriba.
            </p>
          </div>
        </div>
      </RestaurantesShellChrome>
    );
  }

  return (
    <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 pb-16 pt-2 md:px-5 lg:px-6">
        <details className="rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/50 px-4 py-3 text-sm text-[color:var(--lx-text-2)]">
          <summary className="cursor-pointer select-none font-semibold text-[color:var(--lx-text)]">
            Publicar y ayuda de sesión
          </summary>
          <div className="mt-3 space-y-3 border-t border-[color:var(--lx-nav-border)]/60 pt-3">
            {!minOk ? (
              <p className="text-xs text-[color:var(--lx-muted)]">
                Borrador incompleto para publicar: faltan campos mínimos (nombre, tipo, cocina, resumen, ciudad, imagen
                principal o primera de galería, al menos un contacto y señal de horario).
              </p>
            ) : (
              <p className="text-xs font-medium text-emerald-800">Listo para publicar borrador (validación mínima OK).</p>
            )}
            <p className="text-xs leading-relaxed">
              El borrador vive en esta sesión del navegador: se mantiene al volver y al actualizar en la misma pestaña. Al cerrar
              la pestaña se descarta.
            </p>
            {minOk ? (
              <div className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-3">
                <p className="text-xs font-semibold text-[color:var(--lx-text)]">Publicar en Clasificados</p>
                <p className="mt-1 text-[11px] text-[color:var(--lx-text-2)]">
                  El servidor debe tener `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`; si falta, verás error 503 y no
                  se guardará nada.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={pub.busy}
                    onClick={() => void onPublish()}
                    className="min-h-[44px] rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-cta-light)] disabled:opacity-50"
                  >
                    {pub.busy ? "Publicando…" : "Publicar listado"}
                  </button>
                  {pub.url ? (
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <Link
                        href={appendLangToPath(pub.url, "es")}
                        className="text-sm font-semibold text-[color:var(--lx-gold)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4"
                      >
                        Abrir ficha pública →
                      </Link>
                      {pub.resultsUrl ? (
                        <Link
                          href={pub.resultsUrl}
                          className="text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-nav-border)] underline-offset-4"
                        >
                          Ver en resultados (misma búsqueda) →
                        </Link>
                      ) : null}
                      {pub.dashboardUrl ? (
                        <Link
                          href={pub.dashboardUrl}
                          className="text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-nav-border)] underline-offset-4"
                        >
                          Mi panel de restaurantes →
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {pub.err ? (
                  <div className="mt-2 text-xs text-red-800">
                    <p>
                      {pub.err === "not_ready"
                        ? "Aún no está listo."
                        : pub.err === "network"
                          ? "Error de red."
                          : pub.err === "supabase_admin_unconfigured"
                            ? "Servidor sin credenciales de Supabase (rol de servicio). No se persistió nada."
                            : `No se pudo publicar (${pub.err}).`}
                    </p>
                    {pub.errDetail ? <p className="mt-1 font-mono text-[11px] opacity-90">{pub.errDetail}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </details>

        <ClasificadosPreviewAdCanvas>
          {/* Section 1: Vista previa de la tarjeta */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold text-[#1F1A17] mb-3 tracking-tight"
                style={{ color: LEONIX_PRIMARY_TEXT }}
              >
                1. Vista previa de la tarjeta
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                Así se verá tu anuncio en resultados, búsquedas y tarjetas destacadas.
              </p>
            </div>
            <div 
              className="rounded-3xl border p-8 shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)]"
              style={{ 
                background: LEONIX_CARD_SURFACE, 
                borderColor: LEONIX_BORDER 
              }}
            >
              <RestaurantePreviewCard 
                data={shellData} 
                listingId={shellData.id}
                showEngagementMetrics={true}
                className="max-w-2xl mx-auto"
              />
            </div>
          </div>
          
          {/* Section 2: Vista previa completa del anuncio */}
          <div>
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold text-[#1F1A17] mb-3 tracking-tight"
                style={{ color: LEONIX_PRIMARY_TEXT }}
              >
                2. Vista previa completa del anuncio
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                Así se verá tu anuncio cuando una persona abra la publicación completa.
              </p>
            </div>
            <div 
              className="rounded-3xl border p-8 shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)]"
              style={{ 
                background: LEONIX_CARD_SURFACE, 
                borderColor: LEONIX_BORDER 
              }}
            >
              <RestauranteAdStoryPreview data={shellData} />
            </div>
          </div>
        </ClasificadosPreviewAdCanvas>
      </div>
    </RestaurantesShellChrome>
  );
}
