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
import { SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES } from "@/app/(site)/clasificados/servicios/lib/serviciosOwnerMutationPolicy";
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
import {
  postServiciosPublishApi,
  primeServiciosExistingListingId,
  primeServiciosExistingPublicSlug,
  SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY,
} from "../lib/serviciosPublishClient";
import { useAssistedPublishingUi } from "@/app/components/auth/AssistedPublishingUiContext";
import { readConciergeReturnContext } from "@/app/lib/business/applicationContext/conciergeReturnContext";
import { previewModeIsListingBound, resolvePreviewMode } from "@/app/lib/listingIdentity";
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
import { SERVICIOS_BASE_CHECKOUT, SERVICIOS_QUICK_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  businessPlanFromSearchParams,
  selectBusinessBaseCheckout,
} from "@/app/lib/listingPlans/businessQuickPlanSignal";
import { useBusinessBasePlanOffer } from "@/app/lib/listingPlans/businessBasePlanOfferClient";
import {
  SERVICIOS_CHECKPOINT_CONFIRMATIONS,
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
  /**
   * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE — server-verified via PublishAuthGate/
   * PublishAuthGateLayout (the signed assisted-publishing cookie), never trusted client-side.
   * Declared up top so both the listing-bound hydration effect below and the CTA bar can use it.
   */
  const assistedUi = useAssistedPublishingUi();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );

  /** New (non-dashboard) application "Volver a editar" target. Gate B11 fix: this used to point
   * at the checkpoint gateway page (`/clasificados/publicar/servicios/checkpoint`), which restarted
   * the flow instead of returning to the final review step. The application form's real mount
   * route is `/publicar/servicios` (see app/(site)/publicar/servicios/page.tsx) — since the saved
   * draft's own `applicationStepIndex` is already 7 (final review) at the moment "Vista previa" is
   * clicked (persisted via persistServiciosDraftForPreviewNavigation), landing back on this route
   * rehydrates the same draft directly onto the final review step, not step 0. */
  const newApplicationEditHref = withClasificadosPublishLang("/publicar/servicios", routeLang);
  const previewListingParam = searchParams?.get("preview") === "listing";
  const dashboardSource = searchParams?.get("source") === "dashboard";
  const listingId = searchParams?.get("listingId")?.trim() ?? "";
  const listingSlug = searchParams?.get("listingSlug")?.trim() ?? "";
  const leonixAdId = searchParams?.get("leonixAdId")?.trim() ?? "";
  const returnPanel = searchParams?.get("returnPanel") ?? "";
  const previewMode = searchParams?.get("mode") ?? "";
  const previewFocus = searchParams?.get("focus") === "coupon-upgrade" ? "coupon-upgrade" : null;
  const listingBound =
    previewListingParam || (dashboardSource && Boolean(listingId || listingSlug || leonixAdId));
  /* Globalization P3 (Gate 1) — routed through the shared preview-mode contract
     (app/lib/listingIdentity/previewModeContract.ts), same as Bienes Raíces Negocio. This lane
     has only one listing-bound UI state today, so it resolves as "edit-draft" whenever bound —
     identical behavior to the prior local boolean. Named `sharedPreviewMode` — `previewMode`
     above is a pre-existing, unrelated local reading the raw `?mode=` query param. */
  const sharedPreviewMode = resolvePreviewMode({ listingBound });
  const listingBoundPreview = previewModeIsListingBound(sharedPreviewMode);
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
      : newApplicationEditHref;
  const [listingHydrationError, setListingHydrationError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  // Gate 7 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18): the REAL persisted
  // listing_status for a listing-bound preview (never fabricated — see previewListingRow below).
  const [listingBoundStatus, setListingBoundStatus] = useState<string | null>(null);
  const [savedChangesNotice, setSavedChangesNotice] = useState(false);
  // Gate 15 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18) — real, server-resolved
  // coupons/offers capability truth for a listing-bound preview (see profile below); null until
  // hydrated, meaning "not yet known" rather than "not entitled".
  const [listingBoundOffersEntitled, setListingBoundOffersEntitled] = useState<boolean | null>(null);
  // Gate 4 (Servicios Golden lifecycle closeout, 2026-09-18) — real, server-verified
  // leonix_verified truth for a listing-bound preview (see profile above); false until hydrated,
  // which is the same honest default an unverified/not-yet-real row would show.
  const [listingBoundLeonixVerified, setListingBoundLeonixVerified] = useState<boolean | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  // Newsletter Engine v2 — resolve the session email up front so it can be shown/edited in the
  // checkout checkpoint BEFORE checkout starts, instead of silently pulling a hidden
  // session.user.email only at the moment of checkout.
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterCaptureNote, setNewsletterCaptureNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data: sess } = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        const email = sess.session?.user?.email ?? "";
        if (!cancelled) setNewsletterEmail((prev) => (prev ? prev : email));
      } catch {
        // Best-effort prefill only — the field stays editable/empty either way.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          // LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE — a staff actor reopening a Leonix-prepared
          // draft has no customer session by design; the my-listing route independently authorizes
          // that case via the server-verified assisted-publishing cookie instead of this header.
          if (!accessToken && !assistedUi) {
            throw new Error(
              routeLang === "en"
                ? "Log in to preview this published listing."
                : "Inicia sesión para ver la vista previa de este anuncio publicado.",
            );
          }
          // Gate 7 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18): if the owner is
          // ALREADY editing this exact listing earlier in this browser session (Application ->
          // Preview -> back to Application -> Preview again), the local draft below may hold content
          // edits that were never persisted yet. The database fetch always runs so identity and the
          // REAL listing_status stay authoritative, but a matching local draft's CONTENT wins over
          // the (possibly stale-relative-to-those-edits) database snapshot — otherwise every Preview
          // visit would silently discard unsaved changes.
          let alreadyEditingThisListing = false;
          try {
            const primedId = window.sessionStorage.getItem(SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY);
            alreadyEditingThisListing = Boolean(listingId) && primedId === listingId;
          } catch {
            alreadyEditingThisListing = false;
          }
          const q = new URLSearchParams();
          if (listingId) q.set("id", listingId);
          else if (listingSlug) q.set("slug", listingSlug);
          else if (leonixAdId) q.set("leonixAdId", leonixAdId);
          const res = await fetch(`/api/clasificados/servicios/my-listing?${q.toString()}`, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
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
          // Golden-loop: prime the canonical row id (persistence authority) plus the slug (public
          // routing identity) so any publish-from-preview UPDATES this exact listing — no duplicate
          // even if the business was renamed, and no base recharge.
          primeServiciosExistingPublicSlug(hydrated.editIdentity.slug);
          primeServiciosExistingListingId(hydrated.editIdentity.id);
          setListingBoundStatus(hydrated.editIdentity.status);
          setListingBoundOffersEntitled(data.listing.offers_entitled === true);
          setListingBoundLeonixVerified(data.listing.leonix_verified === true);
          let normalized = normalizeClasificadosServiciosApplicationState(hydrated.state);
          if (alreadyEditingThisListing) {
            const localDraft = await loadClasificadosServiciosApplicationResolved();
            if (localDraft) {
              normalized = normalizeClasificadosServiciosApplicationState(localDraft);
            }
          }
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
  }, [lang, listingBoundPreview, listingId, listingSlug, leonixAdId, routeLang, assistedUi]);

  const previewReadiness = useMemo(() => {
    if (source !== "application" || !appState) return { ok: true as const, missing: [] as { id: string; label: string }[] };
    if (listingBoundPreview) return { ok: true as const, missing: [] as { id: string; label: string }[] };
    return evaluateServiciosPreviewReadiness(appState, lang);
  }, [source, appState, lang, listingBoundPreview]);

  const publishReadiness = useMemo(() => {
    if (source !== "application" || !appState) return { ok: false as const, missing: [] as { id: string; label: string }[] };
    return evaluateServiciosPublishReadiness(appState, lang);
  }, [source, appState, lang]);

  // Gate 7 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18): an existing listing's
  // ordinary edit-save does NOT re-collect the three legal confirmations captured once at the
  // original application/checkout — only a fresh application (never listing-bound) requires them,
  // mirroring the exemption `previewReadiness` above already applies for listing-bound previews.
  const canPublishFromPreview =
    source === "application" &&
    appState &&
    publishReadiness.ok &&
    (listingBoundPreview ||
      (appState.confirmListingAccurate && appState.confirmPhotosRepresentBusiness && appState.confirmCommunityRules));

  // Gate 7 — a listing-bound preview whose REAL status has not yet cleared its base purchase must
  // save through the pending-payment-preserving path (never a full publish attempt): the row stays
  // hidden and untouched by Stripe until the owner completes checkout (Gate 8).
  const listingBoundAwaitsBasePurchase =
    listingBoundPreview &&
    listingBoundStatus != null &&
    SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES.has(listingBoundStatus.trim().toLowerCase());

  // Gate 13 — a listing-bound preview of an ALREADY-published row: saving here is a republish of
  // the SAME live listing, never a first-time publish (no recharge, no new subscription — the
  // server route's owner-save transition table already keeps `published` as `published`
  // regardless; see decideServiciosOwnerSaveStatus). Drives the CTA label and suppresses the
  // "just published" success panel on the redirect target below.
  const isRepublishOfPublished = listingBoundPreview && listingBoundStatus?.trim().toLowerCase() === SERVICIOS_LISTING_STATUS_PUBLISHED;

  // Gate 7 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18) — "Guardar cambios" for a
  // listing-bound preview whose real status still awaits its base purchase (pending_payment / draft
  // / preview_ready / publish_ready). Reuses the SAME already-proven pending-payment save
  // (`saveServiciosPendingBeforeCheckout`, Gate SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01) the
  // pre-checkout flow already relies on: it PATCHes the durable row (Gate 6), explicitly requests
  // `activationMode: "pending_payment"` so the server-side transition table
  // (`decideServiciosOwnerSaveStatus`) leaves the row in `pending_payment` rather than advancing it
  // toward a public status, and never calls Stripe. Unlike a first-time publish it must NOT clear
  // the draft or navigate to the (still non-public) listing page — the owner stays on Preview with a
  // truthful "saved" confirmation and can still reach "Completar pago" (Gate 8) separately.
  const handleSaveChangesForPendingListing = useCallback(async () => {
    if (!appState || !canPublishFromPreview) return;
    setPublishBusy(true);
    setPublishErr(null);
    setSavedChangesNotice(false);
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
      const result = await saveServiciosPendingBeforeCheckout({ state: appState, lang, accessToken });
      if (!result.ok) {
        setPublishErr(result.userMessage);
        setPublishBusy(false);
        return;
      }
      setSavedChangesNotice(true);
      setPublishBusy(false);
    } catch {
      setPublishErr(lang === "en" ? "Network error." : "Error de red.");
      setPublishBusy(false);
    }
  }, [appState, canPublishFromPreview, lang]);

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
      // Gate 13 — a republish of an already-published listing must never show the "just
      // published" congratulatory panel; the owner already knows this listing is live.
      if (!isRepublishOfPublished) q.set("justPublished", "1");
      if (data.persistence) q.set("persistence", data.persistence);
      if (data.listingStatus) q.set("listingStatus", data.listingStatus);
      if (data.skippedOversizedVideos) q.set("videoSkipped", "1");
      // Gate SERVICIOS-1 — the publish succeeded but the shared media contract could not persist
      // some selected media. Carried on the same existing notice channel as `videoSkipped` so the
      // owner is never told "published" while silently losing photos.
      if (data.droppedUnpersistableMedia?.length) {
        q.set("mediaDropped", String(data.droppedUnpersistableMedia.length));
      }
      router.push(`/clasificados/servicios/${encodeURIComponent(data.slug)}?${q.toString()}`);
    } catch {
      setPublishErr(lang === "en" ? "Network error." : "Error de red.");
      setPublishBusy(false);
    }
  }, [appState, canPublishFromPreview, lang, router, isRepublishOfPublished]);

  /**
   * Business name is display-only, from the same unsigned sessionStorage record
   * ConciergeReturnBanner already reads — never used for authorization.
   */
  const [assistedBusinessName, setAssistedBusinessName] = useState("");
  useEffect(() => {
    if (!assistedUi) return;
    setAssistedBusinessName(readConciergeReturnContext()?.businessName ?? "");
  }, [assistedUi]);

  const [assistedBusy, setAssistedBusy] = useState<"save_for_client" | "publish_for_client" | null>(null);
  const [assistedErr, setAssistedErr] = useState<string | null>(null);
  const [assistedResult, setAssistedResult] = useState<{ listingId: string; status: string } | null>(null);

  const handleAssistedAction = useCallback(
    async (action: "save_for_client" | "publish_for_client") => {
      if (!appState || !canPublishFromPreview) return;
      setAssistedBusy(action);
      setAssistedErr(null);
      try {
        await saveClasificadosServiciosApplicationResolved(appState);
        const { data } = await postServiciosPublishApi({ state: appState, lang, accessToken: null, assistedAction: action });
        if (!data.ok || !data.listingId) {
          const message =
            (data.message as string | undefined)?.trim() ||
            (data.error === "manual_payment_not_cleared"
              ? lang === "en"
                ? "No cleared manual payment found for this listing yet. Record and clear it in the Payment Tracker first."
                : "Aún no hay un pago manual verificado para este anuncio. Regístralo y acláralo en el Rastreador de Pagos primero."
              : lang === "en"
                ? "Could not save for the client. Try again."
                : "No se pudo guardar para el cliente. Intenta de nuevo.");
          setAssistedErr(message);
          setAssistedBusy(null);
          return;
        }
        setAssistedResult({ listingId: data.listingId, status: data.listingStatus ?? "draft" });
        setAssistedBusy(null);
      } catch {
        setAssistedErr(lang === "en" ? "Network error." : "Error de red.");
        setAssistedBusy(null);
      }
    },
    [appState, canPublishFromPreview, lang],
  );

  const profile = useMemo(() => {
    if (source !== "application" || !appDraft || !appState) return null;
    let wire = mapServiciosApplicationDraftToBusinessProfile(appDraft);
    wire = applyClasificadosCouponsToServiciosWireProfile(wire, appDraft);
    // Gate 4 (Servicios Golden lifecycle closeout, 2026-09-18) — a listing-bound preview of an
    // ALREADY leonix_verified listing must show the real badge, mirroring the exact override the
    // published page itself applies (page.tsx: `wireMerged.identity = {...,leonixVerified:
    // row.leonix_verified === true}`) — never fabricated, but also never silently hidden for a
    // listing that is genuinely verified. A fresh application has no real DB row yet, so it stays
    // false (unchanged).
    if (listingBoundPreview) {
      wire = { ...wire, identity: { ...wire.identity, leonixVerified: listingBoundLeonixVerified === true } };
    }
    let resolved = resolveServiciosProfile(wire, lang);
    // Gate 15 — a listing-bound preview must consume the SAME server-resolved `coupons_offers`
    // capability truth the published page uses, not `appState.couponsAddOn` (an intent flag
    // inferred from stored profile content on hydration, which can diverge from real entitlement —
    // e.g. a lapsed package that still has old coupon content saved). A fresh, not-yet-persisted
    // application has no real entitlement to check yet, so it keeps using the owner's selection.
    const offersEntitled = listingBoundPreview ? listingBoundOffersEntitled === true : appState.couponsAddOn;
    if (offersEntitled) {
      resolved = mergeClasificadosCouponsOntoServiciosProfile(resolved, appState, lang);
    } else {
      resolved = { ...resolved, promotions: [], coupons: [] };
    }
    return resolved;
  }, [source, appDraft, appState, lang, listingBoundPreview, listingBoundOffersEntitled, listingBoundLeonixVerified]);

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
      // Gate 7 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18): a listing-bound
      // preview has no real `published_at` to show (the hydration source does not carry it) — the
      // truthful value is `null` (the same "not published yet" convention `serviciosPublicListingsServer`
      // already uses), never a fabricated "now". A fresh, not-yet-persisted application preview has
      // no real row at all yet, so "now" remains an honest stand-in for that case only.
      published_at: listingBoundPreview ? null : new Date().toISOString(),
      profile_json: wire,
      // Gate 5 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18): never fake the
      // Verified badge. `leonixVerifiedInterest` is the owner's stated INTEREST in verification
      // (opsMeta only) — it is not, and must never render as, the real staff-granted
      // `leonix_verified` truth. A fresh application's publish route always inserts a NEW row as
      // `leonix_verified: false` (only staff can grant it afterward via Admin), so `false` is
      // honest there. Gate 4 (Golden lifecycle closeout, 2026-09-18): for a LISTING-BOUND preview
      // the real value already exists in the DB and is fetched by the my-listing route — showing
      // `false` unconditionally would be a Preview/Public mismatch for an already-verified
      // listing, not merely a safe default.
      leonix_verified: listingBoundPreview ? listingBoundLeonixVerified === true : false,
      internal_group: getBusinessTypePreset(appState.businessTypeId)?.internalGroup ?? null,
      // Gate 7 — stop cosmetically faking `published` for a listing-bound preview: use the REAL
      // hydrated status (e.g. `pending_payment`) when known, falling back to the honest "published"
      // stand-in only for a fresh application preview, which has no real row/status yet.
      listing_status: listingBoundPreview && listingBoundStatus ? listingBoundStatus : SERVICIOS_LISTING_STATUS_PUBLISHED,
    };
  }, [useProfessionalPreview, appState, appDraft, profile, listingBoundPreview, listingBoundStatus, listingBoundLeonixVerified]);

  // Servicios global checkout standard — final checkpoint shown after preview for the NEW
  // application publish flow, and (Gate 8, Servicios Final Consolidated Lifecycle Execution,
  // 2026-09-18) reused as-is for "Completar pago" on a listing-bound row still awaiting its base
  // purchase (pending_payment / draft / preview_ready / publish_ready) — the SAME
  // servicios_base_monthly checkout, promo handling, newsletter capture, and confirmations, driven
  // by the SAME onCheckout below, which already resolves the durable canonical listing id/Ad id
  // from the pending-payment save result (never a duplicate row). An already-published/paused/
  // pending_review listing-bound preview never sees this — its Dashboard action bar keeps its own
  // update/republish button (already paid, no re-charge).
  const offersAddonSelected = Boolean(appState?.couponsAddOn);
  const serviciosPipeline = useProfessionalPreview ? "professional" : "trades";
  // Quick Business intake hands off here with the Quick plan marker; the standard application
  // arrives without it and keeps the Full package exactly as before. One preview, one draft, one
  // publisher, one public listing — only the base package the customer pays for differs.
  const quickPlan = businessPlanFromSearchParams(searchParams) === "quick";
  // For a listing that already exists, the marker is not evidence: a Quick customer resuming an
  // abandoned checkout arrives from the dashboard with no marker at all, and a paid SIMPLE
  // customer upgrading is not asking for either package by URL. The server answers from the
  // entitlement table and the payment ledger, and its answer wins over the marker.
  const businessBasePlan = useBusinessBasePlanOffer({
    category: SERVICIOS_BASE_CHECKOUT.category,
    listingId,
    enabled: listingBoundPreview,
  });
  const baseCheckout = selectBusinessBaseCheckout({
    quick: SERVICIOS_QUICK_CHECKOUT,
    full: SERVICIOS_BASE_CHECKOUT,
    urlPlan: quickPlan ? "quick" : "full",
    serverSellPackageKey: businessBasePlan?.sellPackageKey,
  });

  const showFinalCheckout =
    !assistedUi &&
    (!listingBoundPreview || listingBoundAwaitsBasePurchase) &&
    source === "application" &&
    Boolean(profile) &&
    previewReadiness.ok;

  // Package C Build 3 (C5/C6) — owner-locked: coupons/offers are included in the Full base
  // package. The toggle stays as content/setup intent only — never a checkout line item.
  const checkoutSubtotalCents = useMemo(() => {
    const def = getRevenuePackageDefinition(baseCheckout.packageKey);
    // Both base keys are static matrix entries, so the fallback is unreachable; it stays only to
    // preserve the historical Full behaviour, and Quick never invents a second price literal.
    return def ? def.priceCents : quickPlan ? 0 : 39900;
  }, [baseCheckout, quickPlan]);

  const checkpointConfig = useMemo((): PublishCheckpointConfig => {
    return {
      category: baseCheckout.category,
      packageKey: baseCheckout.packageKey,
      lang,
      mode: "checkout",
      baseLineItem: {
        labelEn: useProfessionalPreview ? "Professional services" : "Services / trades",
        labelEs: useProfessionalPreview ? "Servicios profesionales" : "Servicios / oficios",
        priceCents: checkoutSubtotalCents,
      },
      confirmations: SERVICIOS_CHECKPOINT_CONFIRMATIONS,
      newsletterEligible: true,
      // Read from the package actually being sold: the matrix marks the Quick packages
      // promo-ineligible, and offering a code the server would refuse is a broken promise.
      promoEligible: getRevenuePackageDefinition(baseCheckout.packageKey)?.promoEligible ?? true,
      serviciosOffersAddonSelected: offersAddonSelected,
      pipeline: serviciosPipeline,
      returnPath: baseCheckout.returnPath,
    };
  }, [baseCheckout, checkoutSubtotalCents, lang, offersAddonSelected, serviciosPipeline, useProfessionalPreview]);

  const handlePromoApply = useCallback(
    async (code: string) => {
      const result = await validateRevenuePromoForCheckout({
        code,
        category: baseCheckout.category,
        packageKey: baseCheckout.packageKey,
        subtotalCents: checkoutSubtotalCents,
        locale: lang,
      });
      if (!result.ok) {
        return { ok: false as const, message: result.userMessage };
      }
      // ⚠️35 — the summary line states the server-derived term; the checkpoint renders the exact
      // "for N months, then $399" sentence from the same values.
      const termMonths = result.termMonths ?? null;
      const total = (result.totalCents / 100).toFixed(2);
      const renewal = (result.subtotalCents / 100).toFixed(2);
      return {
        ok: true as const,
        discountCents: result.discountCents,
        termMonths,
        percentOff: result.percentOff ?? null,
        message:
          termMonths && termMonths > 1
            ? lang === "es"
              ? `${result.discountLabel} aplicado durante ${termMonths} meses. Total: $${total}/mes durante ${termMonths} meses; después $${renewal}/mes.`
              : `${result.discountLabel} applied for ${termMonths} months. Total: $${total}/mo for ${termMonths} months; then $${renewal}/mo.`
            : lang === "es"
              ? `${result.discountLabel} aplicado. Total: $${total}/mes`
              : `${result.discountLabel} applied. Total: $${total}/mo`,
      };
    },
    [baseCheckout, lang, checkoutSubtotalCents],
  );

  const onCheckout = useCallback(
    async (ctx: {
      newsletterOptIn: boolean;
      promoCode: string | null;
      recurringConsent?: { accepted: true; consentTextVersion: string; lang: "es" | "en" } | null;
      requestVerifiedIntroDiscount?: boolean;
    }) => {
      if (!appState) return;
      setCheckoutBusy(true);
      setCheckoutErr(null);
      setNewsletterCaptureNote(null);
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

        // Best-effort newsletter capture — awaited (never fire-and-forget `void`) so a FAILED
        // result can be surfaced, but never blocks/gates checkout. P0 residual closeout
        // (2026-09-16) — the email row is now read-only (the authenticated session email); the
        // access token is what actually authorizes the capture server-side, so the subscriber
        // address is always the real account, never a client-typed alternate.
        const capturePromise = captureCheckoutNewsletterSubscriber({
          email: customerEmail,
          accessToken,
          lang,
          preferredLanguage: lang,
          source: CHECKOUT_NEWSLETTER_SOURCES.servicios,
          // SVC-QA-29 — the retired Launch-25 interest tag is no longer attached to Servicios captures.
          interests: [`package:${baseCheckout.packageKey}`],
          checked: ctx.newsletterOptIn,
        });

        const pending = await saveServiciosPendingBeforeCheckout({ state: appState, lang, accessToken });

        const captureResult = await capturePromise;
        if (captureResult.status === "FAILED") {
          console.warn("[servicios] newsletter checkout capture failed", captureResult.reason);
          setNewsletterCaptureNote(
            lang === "es"
              ? "No pudimos guardar tu suscripción al boletín. Tu pago no se vio afectado."
              : "We couldn't save your newsletter subscription. Your payment was not affected.",
          );
        }

        if (!pending.ok) {
          setCheckoutErr(pending.userMessage);
          setCheckoutBusy(false);
          return;
        }

        const checkout = await startRevenueCategoryCheckout({
          ...baseCheckout,
          listingId: pending.listingId,
          leonixAdId: pending.leonixAdId,
          locale: lang,
          customerEmail,
          promoCode: ctx.promoCode,
          recurringConsent: ctx.recurringConsent ?? null,
          requestVerifiedIntroDiscount: ctx.requestVerifiedIntroDiscount ?? false,
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
    [appState, baseCheckout, lang, offersAddonSelected],
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
        {assistedUi ? (
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-6">
            <p className="min-w-0 text-sm font-bold text-[#7A1E2C]">
              LEONIX — PREPARANDO PARA CLIENTE / PREPARING FOR CLIENT
              <span className="block text-xs font-normal text-[#3D2C12]">
                {assistedBusinessName || assistedUi.businessId}
              </span>
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {assistedResult ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAssistedResult(null)}
                    className={EDIT_LINK}
                  >
                    {lang === "en" ? "Continue editing" : "Seguir editando"}
                  </button>
                  <Link
                    href={`/admin/businesses/${encodeURIComponent(assistedUi.businessId)}#prospect-journey`}
                    className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#651829]"
                  >
                    {lang === "en" ? "Back to client" : "Volver al cliente"}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!canPublishFromPreview || assistedBusy !== null}
                    onClick={() => void handleAssistedAction("save_for_client")}
                    className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full bg-[#3B66AD] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {assistedBusy === "save_for_client"
                      ? lang === "en"
                        ? "Saving…"
                        : "Guardando…"
                      : lang === "en"
                        ? "Save for Client"
                        : "Guardar para Cliente"}
                  </button>
                  <button
                    type="button"
                    disabled={!canPublishFromPreview || assistedBusy !== null}
                    onClick={() => void handleAssistedAction("publish_for_client")}
                    className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#651829] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {assistedBusy === "publish_for_client"
                      ? lang === "en"
                        ? "Publishing…"
                        : "Publicando…"
                      : lang === "en"
                        ? "Publish for Client"
                        : "Publicar para Cliente"}
                  </button>
                  <Link href={editHref} onClick={markPublishFlowReturningToEdit} className={EDIT_LINK}>
                    {backLabel}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-6">
            {showFinalCheckout ? (
              <>
                {/* Gate 8 — "Guardar cambios" stays available NEXT TO "Completar pago" so an owner
                    resuming an abandoned checkout can save further content edits without being
                    forced through payment first. A fresh (non listing-bound) application has no
                    existing row to save yet, so it only ever sees the payment button. */}
                {listingBoundAwaitsBasePurchase ? (
                  <button
                    type="button"
                    disabled={!canPublishFromPreview || publishBusy}
                    onClick={() => void handleSaveChangesForPendingListing()}
                    className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full border border-[#3B66AD] bg-white px-4 py-2 text-sm font-bold text-[#3B66AD] shadow-sm transition hover:bg-[#EEF3FB] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {publishBusy ? (lang === "en" ? "Saving…" : "Guardando…") : lang === "en" ? "Save changes" : "Guardar cambios"}
                  </button>
                ) : null}
                <a
                  href="#servicios-publish-checkout-checkpoint"
                  className="inline-flex min-h-[44px] touch-manipulation items-center rounded-full bg-[#3B66AD] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699]"
                >
                  {listingBoundAwaitsBasePurchase
                    ? lang === "en"
                      ? "Complete payment"
                      : "Completar pago"
                    : lang === "en"
                      ? "Continue to payment"
                      : "Continuar al pago"}
                </a>
              </>
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
                {isRepublishOfPublished
                  ? publishBusy
                    ? lang === "en"
                      ? "Republishing…"
                      : "Republicando…"
                    : lang === "en"
                      ? "Save & Republish"
                      : "Guardar y republicar"
                  : publishBusy
                    ? lang === "en"
                      ? "Publishing…"
                      : "Publicando…"
                    : lang === "en"
                      ? "Publish"
                      : "Publicar"}
              </button>
            )}
            <Link href={editHref} onClick={markPublishFlowReturningToEdit} className={EDIT_LINK}>
              {backLabel}
            </Link>
          </div>
        )}
        {assistedResult ? (
          <div className="mx-auto max-w-[1280px] px-4 pb-2 md:px-6">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {lang === "en" ? "Saved for client." : "Guardado para el cliente."} Leonix ID: {assistedResult.listingId} ({assistedResult.status})
            </p>
          </div>
        ) : null}
        {savedChangesNotice ? (
          <div className="mx-auto max-w-[1280px] px-4 pb-2 md:px-6">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {lang === "en"
                ? "Changes saved. This listing stays hidden until payment is completed."
                : "Cambios guardados. Este anuncio permanece oculto hasta completar el pago."}
            </p>
          </div>
        ) : null}
        {publishErr || assistedErr ? (
          <div className="mx-auto max-w-[1280px] px-4 pb-2 md:px-6">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{publishErr || assistedErr}</p>
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
              <ServiciosProfileView
                profile={profile}
                lang={lang}
                showTopBar={false}
                showEngagementControls
                persistListingEngagement={false}
                engagementListingId={profile.identity.slug}
                analyticsListingSlug={profile.identity.slug}
              />
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
            <p className="mb-4 text-[11px] leading-relaxed text-[#7A7164]">
              {lang === "es"
                ? "Ingresa tu código promocional si tienes uno."
                : "Enter your promo code if you have one."}
            </p>
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
              newsletterEmail={newsletterEmail}
              newsletterCaptureNote={newsletterCaptureNote}
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
