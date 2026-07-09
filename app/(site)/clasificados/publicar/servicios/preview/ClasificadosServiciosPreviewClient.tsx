"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { clearLeonixPreviewNavSessionFlag, markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { ServiciosHorizontalResultCard } from "@/app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard";
import { ServiciosProfessionalResultCard } from "@/app/(site)/clasificados/servicios/ServiciosProfessionalResultCard";
import type { ServiciosPublicListingRow } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/(site)/clasificados/servicios/lib/serviciosListingLifecycle";
import {
  isServiciosProfessionalTemplate,
  resolveServiciosListingTemplate,
} from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { resolveServiciosPublicCategoryLabel } from "../lib/resolveServiciosPublicCategoryLabel";
import { ServiciosProfessionalPreviewShell } from "./ServiciosProfessionalPreviewShell";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosApplicationDraft } from "@/app/servicios/types/serviciosApplicationDraft";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationTypes";
import { normalizeServiciosApplicationVideos } from "../lib/clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationNormalize";
import { clearServiciosDraftStorageAndIdb, loadClasificadosServiciosApplicationResolved, saveClasificadosServiciosApplicationResolved } from "../lib/clasificadosServiciosStorage";
import { buildServiciosPreviewGalleryVideos } from "../lib/clasificadosServiciosPreviewHandoff";
import {
  serviciosPublishedToApplicationDraft,
  type ServiciosPublishedListingHydrationSource,
} from "../lib/serviciosPublishedToApplicationDraft";
import { serviciosBackToEditHrefFromPreview } from "@/app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout";
import { getBusinessTypePreset } from "../lib/businessTypePresets";
import { mapClasificadosServiciosApplicationToServiciosDraft, applyClasificadosCouponsToServiciosWireProfile, mergeClasificadosCouponsOntoServiciosProfile } from "../lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { postServiciosPublishApi, primeServiciosExistingPublicSlug } from "../lib/serviciosPublishClient";
import { evaluateServiciosPublishReadiness } from "../lib/serviciosPublishReadiness";
import { evaluateServiciosPreviewReadiness } from "../lib/serviciosPreviewReadiness";
import { upsertLocalServiciosPublish } from "@/app/clasificados/servicios/lib/localServiciosPublishStorage";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import { saveServiciosPendingBeforeCheckout } from "../lib/saveServiciosPendingBeforeCheckout";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
  validateRevenuePromoForCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { SERVICIOS_BASE_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  SERVICIOS_CHECKPOINT_CONFIRMATIONS,
  SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";

/** Seller preview — application draft or DB-backed listing (dashboard preview=listing). */
type Source = "loading" | "application" | "missing" | "listing-error";

const PREVIEW_BAR =
  "sticky top-0 z-[60] border-b border-black/[0.08] bg-[#F9F8F6]/95 shadow-[0_6px_20px_-12px_rgba(42,36,22,0.18)] backdrop-blur-md";

const EDIT_LINK =
  "inline-flex min-h-[44px] touch-manipulation items-center rounded-full border border-[#D8C79A]/80 bg-white px-4 py-2 text-sm font-bold text-[#3D2C12] shadow-sm transition hover:border-[#3B66AD]/40 hover:bg-[#FFFCF7]";

function ServiciosSellerPreviewIncomplete({
  lang,
  editHref,
  title,
  body,
  showChecklist,
  missing,
}: {
  lang: ServiciosLang;
  editHref: string;
  title: string;
  body: string;
  showChecklist?: boolean;
  missing?: { id: string; label: string }[];
}) {
  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-neutral-900">
      <div className={PREVIEW_BAR}>
        <div className="mx-auto flex max-w-[1280px] justify-end px-4 py-3 md:px-6">
          <Link href={editHref} onClick={markPublishFlowReturningToEdit} className={EDIT_LINK}>
            {backLabel}
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-xl font-bold text-[#3D2C12]">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
        {showChecklist && missing && missing.length > 0 ? (
          <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-neutral-700">
            {missing.map((m) => (
              <li key={m.id}>{m.label}</li>
            ))}
          </ul>
        ) : null}
        <Link
          href={editHref}
          onClick={markPublishFlowReturningToEdit}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

/**
 * Clasificados Servicios seller preview — application draft from session storage only.
 * Never renders demo/sample business profiles.
 */
export function ClasificadosServiciosPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );

  const checkpointEditHref = withClasificadosPublishLang("/clasificados/publicar/servicios/checkpoint", routeLang);
  const previewListingParam = searchParams?.get("preview") === "listing";
  const dashboardSource = searchParams?.get("source") === "dashboard";
  const listingId = searchParams?.get("listingId")?.trim() ?? "";
  const listingSlug = searchParams?.get("listingSlug")?.trim() ?? "";
  const leonixAdId = searchParams?.get("leonixAdId")?.trim() ?? "";
  const returnPanel = searchParams?.get("returnPanel") ?? "";
  const previewMode = searchParams?.get("mode") ?? "";
  const previewFocus = searchParams?.get("focus") === "coupon-upgrade" ? "coupon-upgrade" : null;
  const listingBoundPreview =
    previewListingParam || (dashboardSource && Boolean(listingId || listingSlug || leonixAdId));
  const dashboardReturnHref = withClasificadosPublishLang(
    returnPanel === "servicios" ? "/dashboard/servicios" : "/dashboard/mis-anuncios?cat=servicios",
    routeLang,
  );
  const backToEditMode: "listing-edit" | "offers-edit" | "offers-addon" =
    previewMode === "offers-edit" || previewMode === "offers-addon" ? previewMode : "listing-edit";
  // Golden-loop: dashboard listing preview "Volver a editar" returns to the direct app edit route
  // with full dashboard context (never checkpoint, never product=servicios_profesionales).
  const editHref =
    listingBoundPreview && (listingId || listingSlug || leonixAdId)
      ? serviciosBackToEditHrefFromPreview({
          lang,
          listingId: listingId || null,
          listingSlug: listingSlug || null,
          leonixAdId: leonixAdId || null,
          mode: backToEditMode,
          focus: previewFocus,
        })
      : checkpointEditHref;
  const [listingHydrationError, setListingHydrationError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  const [source, setSource] = useState<Source>("loading");
  const [appDraft, setAppDraft] = useState<ServiciosApplicationDraft | null>(null);
  const [appState, setAppState] = useState<ClasificadosServiciosApplicationState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (listingBoundPreview) {
        setListingHydrationError(null);
        try {
          const sb = createSupabaseBrowserClient();
          const { data: sess } = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
          const accessToken = sess.session?.access_token ?? null;
          if (!accessToken) {
            throw new Error(
              routeLang === "en"
                ? "Log in to preview this published listing."
                : "Inicia sesión para ver la vista previa de este anuncio publicado.",
            );
          }
          const q = new URLSearchParams();
          if (listingId) q.set("id", listingId);
          else if (listingSlug) q.set("slug", listingSlug);
          else if (leonixAdId) q.set("leonixAdId", leonixAdId);
          const res = await fetch(`/api/clasificados/servicios/my-listing?${q.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          });
          const data = (await res.json()) as {
            ok?: boolean;
            listing?: ServiciosPublishedListingHydrationSource;
            error?: string;
          };
          if (!res.ok || !data.ok || !data.listing) {
            throw new Error(
              routeLang === "en"
                ? "We could not load this listing for preview."
                : "No pudimos cargar este anuncio para la vista previa.",
            );
          }
          const hydrated = serviciosPublishedToApplicationDraft(data.listing);
          if (cancelled) return;
          // Golden-loop: prime existing slug so any publish-from-preview UPDATES this listing
          // (no duplicate, no base recharge) via the publish API's existingPublicSlug update path.
          primeServiciosExistingPublicSlug(hydrated.editIdentity.slug);
          const normalized = normalizeClasificadosServiciosApplicationState(hydrated.state);
          setAppState(normalized);
          const mapped = mapClasificadosServiciosApplicationToServiciosDraft(normalized, lang);
          setAppDraft({
            ...mapped,
            galleryVideos: buildServiciosPreviewGalleryVideos(normalized),
          });
          setSource("application");
          await saveClasificadosServiciosApplicationResolved(normalized);
          return;
        } catch (err) {
          if (cancelled) return;
          const message =
            err instanceof Error
              ? err.message
              : routeLang === "en"
                ? "Listing preview load failed."
                : "No se pudo cargar la vista previa del anuncio.";
          setListingHydrationError(message);
          setSource("listing-error");
          setAppDraft(null);
          setAppState(null);
          return;
        }
      }

      const raw = await loadClasificadosServiciosApplicationResolved();
      if (cancelled) return;
      if (raw == null) {
        setSource("missing");
        setAppDraft(null);
        setAppState(null);
        return;
      }
      const preservedVideos = raw.videos ?? [];
      let normalized = normalizeClasificadosServiciosApplicationState(raw);
      normalized = { ...normalized, videos: normalizeServiciosApplicationVideos(preservedVideos) };
      setAppState(normalized);
      const mapped = mapClasificadosServiciosApplicationToServiciosDraft(normalized, lang);
      setAppDraft({
        ...mapped,
        galleryVideos: buildServiciosPreviewGalleryVideos(normalized),
      });
      setSource("application");
      await saveClasificadosServiciosApplicationResolved(normalized);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, listingBoundPreview, listingId, listingSlug, leonixAdId, routeLang]);

  const previewReadiness = useMemo(() => {
    if (source !== "application" || !appState) return { ok: true as const, missing: [] as { id: string; label: string }[] };
    if (listingBoundPreview) return { ok: true as const, missing: [] as { id: string; label: string }[] };
    return evaluateServiciosPreviewReadiness(appState, lang);
  }, [source, appState, lang, listingBoundPreview]);

  const publishReadiness = useMemo(() => {
    if (source !== "application" || !appState) return { ok: false as const, missing: [] as { id: string; label: string }[] };
    return evaluateServiciosPublishReadiness(appState, lang);
  }, [source, appState, lang]);

  const canPublishFromPreview =
    source === "application" &&
    appState &&
    publishReadiness.ok &&
    appState.confirmListingAccurate &&
    appState.confirmPhotosRepresentBusiness &&
    appState.confirmCommunityRules;

  const handlePublishFromPreview = useCallback(async () => {
    if (!appState || !canPublishFromPreview) return;
    setPublishBusy(true);
    setPublishErr(null);
    try {
      await saveClasificadosServiciosApplicationResolved(appState);
      let accessToken: string | null = null;
      try {
        const sb = createSupabaseBrowserClient();
        const { data: sess } = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        accessToken = sess.session?.access_token ?? null;
      } catch {
        accessToken = null;
      }
      const { res, data } = await postServiciosPublishApi({ state: appState, lang, accessToken });
      if (res.status === 401) {
        setPublishErr(
          lang === "en"
            ? "Sign in is required to publish in production. Open Log in, then return here."
            : "En producción debes iniciar sesión para publicar. Abre Iniciar sesión y vuelve aquí.",
        );
        setPublishBusy(false);
        return;
      }
      if (res.status === 413) {
        setPublishErr(
          (data.message as string | undefined)?.trim() ||
            (lang === "en"
              ? "Publish payload is too large. Images should upload automatically—try again or reduce photos."
              : "El envío es demasiado grande. Las imágenes deberían subirse solas—intenta de nuevo o usa menos fotos."),
        );
        setPublishBusy(false);
        return;
      }
      if (
        res.status === 400 &&
        (data.error === "heavy_media_detected" ||
          data.error === "media_upload_failed" ||
          data.error === "image_too_large_after_compression" ||
          data.error === "file_too_large_for_upload" ||
          data.error === "media_upload_payload_too_large")
      ) {
        setPublishErr(
          data.error === "image_too_large_after_compression"
            ? lang === "en"
              ? "This image is still too large after compression. Try another photo or lower resolution."
              : "La imagen sigue siendo muy grande después de comprimirla. Prueba otra foto o reduce la resolución."
            : data.error === "file_too_large_for_upload"
              ? lang === "en"
                ? "This file is too large to upload (max 4 MB). Use a smaller PDF or video."
                : "Este archivo es demasiado grande (máx. 4 MB). Usa un PDF o video más pequeño."
              : data.error === "media_upload_payload_too_large"
                ? lang === "en"
                  ? "The upload exceeded the server limit. Try a smaller image or retake the photo."
                  : "La subida superó el límite del servidor. Prueba con una imagen más pequeña."
                : (data.message as string | undefined)?.trim() ||
                  (lang === "en"
                    ? "Could not prepare images for publishing. Check your connection and try again."
                    : "No se pudieron preparar las imágenes para publicar. Revisa tu conexión e inténtalo de nuevo."),
        );
        setPublishBusy(false);
        return;
      }
      if (res.status === 503) {
        setPublishErr(
          (data.message as string | undefined)?.trim() ||
            (lang === "en"
              ? "Could not save to Leonix. Check Supabase configuration."
              : "No se pudo guardar en Leonix. Revisa la configuración de Supabase."),
        );
        setPublishBusy(false);
        return;
      }
      if (res.status === 409) {
        setPublishErr(
          lang === "en"
            ? "This public URL is already taken by another provider."
            : "Esta URL pública ya está en uso por otro proveedor.",
        );
        setPublishBusy(false);
        return;
      }
      if (res.status === 422) {
        setPublishErr(lang === "en" ? "Complete required fields before publishing." : "Completa los campos requeridos antes de publicar.");
        setPublishBusy(false);
        return;
      }
      if (!data.ok || !data.slug || !data.profile) {
        setPublishErr(lang === "en" ? "Publish failed. Try again from the application." : "No se pudo publicar. Intenta de nuevo desde el formulario.");
        setPublishBusy(false);
        return;
      }
      const persistedToDatabase = data.persistedToDatabase === true || data.persisted === true;
      if (!persistedToDatabase) {
        const ig = getBusinessTypePreset(appState.businessTypeId)?.internalGroup;
        upsertLocalServiciosPublish(data.profile, appState.city, ig ?? null);
      }
      // Clear draft after successful publish
      await clearServiciosDraftStorageAndIdb();
      const q = new URLSearchParams({ lang });
      q.set("justPublished", "1");
      if (data.persistence) q.set("persistence", data.persistence);
      if (data.listingStatus) q.set("listingStatus", data.listingStatus);
      if (data.skippedOversizedVideos) q.set("videoSkipped", "1");
      router.push(`/clasificados/servicios/${encodeURIComponent(data.slug)}?${q.toString()}`);
    } catch {
      setPublishErr(lang === "en" ? "Network error." : "Error de red.");
      setPublishBusy(false);
    }
  }, [appState, canPublishFromPreview, lang, router]);

  const profile = useMemo(() => {
    if (source !== "application" || !appDraft || !appState) return null;
    let wire = mapServiciosApplicationDraftToBusinessProfile(appDraft);
    wire = applyClasificadosCouponsToServiciosWireProfile(wire, appDraft);
    let resolved = resolveServiciosProfile(wire, lang);
    if (appState.couponsAddOn) {
      resolved = mergeClasificadosCouponsOntoServiciosProfile(resolved, appState, lang);
    } else {
      resolved = { ...resolved, promotions: [], coupons: [] };
    }
    return resolved;
  }, [source, appDraft, appState, lang]);

  const listingTemplate = useMemo(() => {
    if (source !== "application" || !appState) return "standard_service" as const;
    const preset = getBusinessTypePreset(appState.businessTypeId);
    return resolveServiciosListingTemplate({
      businessTypeId: appState.businessTypeId,
      internalGroup: preset?.internalGroup ?? null,
      categoryLabel: resolveServiciosPublicCategoryLabel(appState, lang),
    });
  }, [source, appState, lang]);

  const useProfessionalPreview = isServiciosProfessionalTemplate(listingTemplate);

  const previewListingRow = useMemo((): ServiciosPublicListingRow | null => {
    if (!useProfessionalPreview || !appState || !appDraft || !profile) return null;
    let wire = mapServiciosApplicationDraftToBusinessProfile(appDraft);
    wire = applyClasificadosCouponsToServiciosWireProfile(wire, appDraft);
    const slug = profile.identity.slug;
    return {
      slug,
      business_name: appState.businessName.trim() || profile.identity.businessName,
      city: appState.city.trim(),
      published_at: new Date().toISOString(),
      profile_json: wire,
      leonix_verified: appState.leonixVerifiedInterest === true,
      internal_group: getBusinessTypePreset(appState.businessTypeId)?.internalGroup ?? null,
      listing_status: SERVICIOS_LISTING_STATUS_PUBLISHED,
    };
  }, [useProfessionalPreview, appState, appDraft, profile]);

  // Servicios global checkout standard — final checkpoint shown after preview for the
  // NEW application publish flow only. Dashboard existing-listing preview keeps its own
  // update/golden-loop button (already paid, no re-charge).
  const offersAddonSelected = Boolean(appState?.couponsAddOn);
  const serviciosPipeline = useProfessionalPreview ? "professional" : "trades";
  const showFinalCheckout =
    !listingBoundPreview && source === "application" && Boolean(profile) && previewReadiness.ok;

  const checkoutSubtotalCents = useMemo(() => {
    const baseCents = getRevenuePackageDefinition(SERVICIOS_BASE_CHECKOUT.packageKey)?.priceCents ?? 39900;
    const offersCents = getRevenuePackageDefinition(SERVICIOS_OFFERS_ADDON_PACKAGE_KEY)?.priceCents ?? 9900;
    return baseCents + (offersAddonSelected ? offersCents : 0);
  }, [offersAddonSelected]);

  const checkpointConfig = useMemo((): PublishCheckpointConfig => {
    return {
      category: SERVICIOS_BASE_CHECKOUT.category,
      packageKey: SERVICIOS_BASE_CHECKOUT.packageKey,
      lang,
      mode: "checkout",
      baseLineItem: {
        labelEn: useProfessionalPreview ? "Professional services" : "Services / trades",
        labelEs: useProfessionalPreview ? "Servicios profesionales" : "Servicios / oficios",
        priceCents: getRevenuePackageDefinition(SERVICIOS_BASE_CHECKOUT.packageKey)?.priceCents ?? 39900,
      },
      confirmations: SERVICIOS_CHECKPOINT_CONFIRMATIONS,
      newsletterEligible: true,
      promoEligible: true,
      serviciosOffersAddonSelected: offersAddonSelected,
      pipeline: serviciosPipeline,
      returnPath: SERVICIOS_BASE_CHECKOUT.returnPath,
    };
  }, [lang, offersAddonSelected, serviciosPipeline, useProfessionalPreview]);

  const handlePromoApply = useCallback(
    async (code: string) => {
      const result = await validateRevenuePromoForCheckout({
        code,
        category: SERVICIOS_BASE_CHECKOUT.category,
        packageKey: SERVICIOS_BASE_CHECKOUT.packageKey,
        subtotalCents: checkoutSubtotalCents,
        locale: lang,
      });
      if (!result.ok) {
        return { ok: false as const, message: result.userMessage };
      }
      return {
        ok: true as const,
        discountCents: result.discountCents,
        message:
          lang === "es"
            ? `${result.discountLabel} aplicado. Total: $${(result.totalCents / 100).toFixed(2)}/mes`
            : `${result.discountLabel} applied. Total: $${(result.totalCents / 100).toFixed(2)}/mo`,
      };
    },
    [lang, checkoutSubtotalCents],
  );

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      if (!appState) return;
      setCheckoutBusy(true);
      setCheckoutErr(null);
      try {
        let accessToken: string | null = null;
        let customerEmail: string | null = null;
        try {
          const sb = createSupabaseBrowserClient();
          const { data: sess } = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
          accessToken = sess.session?.access_token ?? null;
          customerEmail = sess.session?.user?.email ?? null;
        } catch {
          accessToken = null;
        }

        // Best-effort newsletter capture — never blocks checkout.
        void captureCheckoutNewsletterSubscriber({
          email: customerEmail,
          lang,
          preferredLanguage: lang,
          source: CHECKOUT_NEWSLETTER_SOURCES.servicios,
          interests: ["package:servicios_base_monthly", "launch_25"],
          checked: ctx.newsletterOptIn,
        });

        const pending = await saveServiciosPendingBeforeCheckout({ state: appState, lang, accessToken });
        if (!pending.ok) {
          setCheckoutErr(pending.userMessage);
          setCheckoutBusy(false);
          return;
        }

        const checkout = await startRevenueCategoryCheckout({
          ...SERVICIOS_BASE_CHECKOUT,
          listingId: pending.listingId,
          leonixAdId: pending.leonixAdId,
          locale: lang,
          customerEmail,
          promoCode: ctx.promoCode,
          ...(offersAddonSelected
            ? { addOns: [{ key: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY, quantity: 1 }] }
            : {}),
        });

        if (!checkout.ok) {
          setCheckoutErr(checkout.userMessage);
          setCheckoutBusy(false);
          return;
        }

        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
      } catch {
        setCheckoutErr(
          lang === "es"
            ? "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix."
            : "We could not start secure payment. Please try again or contact Leonix.",
        );
        setCheckoutBusy(false);
      }
    },
    [appState, lang, offersAddonSelected],
  );

  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";
  const cardPreviewTitle = lang === "en" ? "Result card preview" : "Vista previa de la tarjeta";
  const fullPreviewTitle = lang === "en" ? "Full profile preview" : "Vista previa completa";

  if (source === "loading") {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
  }

  if (source === "listing-error") {
    return (
      <ServiciosSellerPreviewIncomplete
        lang={lang}
        editHref={dashboardReturnHref}
        title={lang === "en" ? "Preview could not load this listing" : "No se pudo cargar la vista previa de este anuncio"}
        body={listingHydrationError ?? (lang === "en" ? "Return to your dashboard and try again." : "Vuelve al panel e inténtalo de nuevo.")}
      />
    );
  }

  if (source === "missing") {
    return (
      <ServiciosSellerPreviewIncomplete
        lang={lang}
        editHref={editHref}
        title={lang === "en" ? "Complete your service information to preview your listing." : "Completa la información de tu servicio para ver la vista previa."}
        body={
          lang === "en"
            ? "Return to the application form, enter your business details, then open Preview again from the last step."
            : "Vuelve al formulario, ingresa los datos de tu negocio y abre de nuevo «Vista previa» desde el último paso."
        }
      />
    );
  }

  if (!profile) {
    return (
      <ServiciosSellerPreviewIncomplete
        lang={lang}
        editHref={editHref}
        title={lang === "en" ? "Complete your service information to preview your listing." : "Completa la información de tu servicio para ver la vista previa."}
        body={
          lang === "en"
            ? "We could not build a preview from your saved draft. Return to the form and try again."
            : "No pudimos generar la vista previa con tu borrador guardado. Vuelve al formulario e inténtalo de nuevo."
        }
      />
    );
  }

  if (!previewReadiness.ok) {
    return (
      <ServiciosSellerPreviewIncomplete
        lang={lang}
        editHref={editHref}
        title={lang === "en" ? "Preview needs a few more details" : "La vista previa necesita unos datos más"}
        body={
          lang === "en"
            ? "Complete the checklist in the application so the public profile looks complete and premium."
            : "Completa el formulario para que el perfil público se vea completo y premium."
        }
        showChecklist
        missing={previewReadiness.missing}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className={PREVIEW_BAR}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-6">
          {showFinalCheckout ? (
            <a
              href="#servicios-publish-checkout-checkpoint"
              className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full bg-[#3B66AD] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699]"
            >
              {lang === "en" ? "Continue to payment" : "Continuar al pago"}
            </a>
          ) : (
            <button
              type="button"
              disabled={!canPublishFromPreview || publishBusy}
              title={
                !canPublishFromPreview
                  ? lang === "en"
                    ? "Complete publish checklist and the three confirmations on the last step, then try again."
                    : "Completa el checklist de publicación y las tres confirmaciones del último paso."
                  : undefined
              }
              onClick={() => void handlePublishFromPreview()}
              className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full bg-[#3B66AD] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {publishBusy ? (lang === "en" ? "Publishing…" : "Publicando…") : lang === "en" ? "Publish" : "Publicar"}
            </button>
          )}
          <Link href={editHref} onClick={markPublishFlowReturningToEdit} className={EDIT_LINK}>
            {backLabel}
          </Link>
        </div>
        {publishErr ? (
          <div className="mx-auto max-w-[1280px] px-4 pb-2 md:px-6">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{publishErr}</p>
          </div>
        ) : null}
      </div>
      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-2 md:px-6">
        <ClasificadosPreviewAdCanvas className="overflow-hidden">
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">{cardPreviewTitle}</h2>
            {previewListingRow ? (
              <ul className="mx-auto max-w-5xl list-none">
                <ServiciosProfessionalResultCard row={previewListingRow} lang={lang} />
              </ul>
            ) : (
              <ServiciosHorizontalResultCard previewProfile={profile} lang={lang} className="mx-auto max-w-4xl" />
            )}
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">{fullPreviewTitle}</h2>
            {useProfessionalPreview || (profile.coupons?.length ?? 0) > 0 ? (
              <ServiciosProfessionalPreviewShell
                profile={profile}
                lang={lang}
                template={listingTemplate}
                cityFallback={appState?.city}
                applicationState={appState}
              />
            ) : (
              <ServiciosProfileView profile={profile} lang={lang} showTopBar={false} />
            )}
          </div>
        </ClasificadosPreviewAdCanvas>

        {showFinalCheckout ? (
          <div className="mx-auto mt-8 max-w-3xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#1E1810]">
                {lang === "en" ? "3. Final checkout" : "3. Pago final"}
              </h2>
              <p className="mt-1 text-sm text-[#5C5346]">
                {lang === "en"
                  ? "The preview above does not require confirmations. Complete the summary and checkboxes below only when you are ready for secure payment."
                  : "La vista previa no requiere confirmaciones. Completa el resumen y las casillas abajo solo cuando estés listo para el pago seguro."}
              </p>
            </div>
            <PublishCheckoutCheckpoint
              id="servicios-publish-checkout-checkpoint"
              config={checkpointConfig}
              lang={lang}
              busy={checkoutBusy}
              errorMessage={checkoutErr}
              draftReady={publishReadiness.ok}
              draftReadyMessage={
                publishReadiness.ok
                  ? null
                  : lang === "en"
                    ? "Complete the required fields in the form before starting secure checkout."
                    : "Completa los campos requeridos en el formulario antes de iniciar el pago seguro."
              }
              onPromoApply={handlePromoApply}
              onCheckout={(ctx) => void onCheckout(ctx)}
              editHref={editHref}
              rulesModal={{
                titleEn: "Leonix service marketplace rules",
                titleEs: "Reglas del marketplace de servicios de Leonix",
                bulletsEn: [
                  "Your service, service area, pricing, and contact details must be accurate and current.",
                  "You must be authorized to offer these services and to publish all photos, logos, promotions, and licenses.",
                  "Offers/coupons are customer-facing ad content — not a substitute for a promo/discount code.",
                  "Payment is required before your listing and any selected offers/coupons module become active.",
                  "You are responsible for the published information and for following Leonix marketplace rules.",
                ],
                bulletsEs: [
                  "Tu servicio, área de servicio, precios y datos de contacto deben ser correctos y estar actualizados.",
                  "Debes estar autorizado para ofrecer estos servicios y publicar todas las fotos, logos, promociones y licencias.",
                  "Las ofertas/cupones son contenido publicitario para el cliente — no sustituyen un código de descuento.",
                  "El pago es requerido antes de que tu anuncio y el módulo de ofertas/cupones seleccionado queden activos.",
                  "Eres responsable por la información publicada y por seguir las reglas del marketplace de Leonix.",
                ],
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
