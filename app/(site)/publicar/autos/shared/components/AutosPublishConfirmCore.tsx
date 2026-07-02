"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { buildVehicleTitle, normalizeVehicleSegment } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosPublishConfirmMode, AutosPublishFlowLang } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import {
  omitAutosInlineVideoForApiPayload,
  prepareAutosListingForApiTransport,
  prepareAutosListingOptionalMuxUpload,
} from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  revenueCategoryCheckoutLoadingMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { AUTOS_PRIVADO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { autosConfirmErrorMessage } from "@/app/lib/clasificados/autos/autosPublishApiContract";
import type { AutosInventoryAddContext } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import {
  clearInventoryAddContextFromSession,
  readInventoryAddContextFromSession,
  resolveInventoryAddReturnHref,
} from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import { autosDealerInventoryLimitMessage } from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { countApplicationInventoryVehicles } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY,
  type AutosBundlePublishSessionResult,
} from "@/app/lib/clasificados/autos/autosNegociosBundlePublish";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { autosQaPaymentBypassLabel } from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { getAutosConfirmPlanSummaryCopy } from "@/app/lib/clasificados/autos/autosPricingCopy";
import { resolveAutosPrivadoDraftNamespace } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftNamespace";
import { resolveAutosNegociosDraftNamespace } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftNamespace";
import {
  autosDraftListingHasLocalPhotos,
  autosInventoryDraftHasLocalPhotos,
  resolveAutosDraftPhotosForPublish,
} from "@/app/lib/clasificados/autos/autosDraftPhotoPublishPrepare";

function photosUploadingMessage(lang: AutosPublishFlowLang): string {
  return lang === "es"
    ? "Estamos preparando tus fotos para publicar el anuncio."
    : "We're preparing your photos for publishing.";
}

type AutosConfirmPhase =
  | "idle"
  | "preparing"
  | "uploading_photos"
  | "ready"
  | "error"
  | "upload_error"
  | "local_video_error";

const AUTOS_CONFIRM_PREPARE_TIMEOUT_MS = 15_000;

function sessionKey(lane: AutosClassifiedsLane) {
  return `lx-autos-publish-listing-${lane}`;
}

function autosHomeHref(lang: AutosPublishFlowLang): string {
  return `/clasificados/autos?lang=${lang}`;
}

function prepareErrorTitle(lang: AutosPublishFlowLang): string {
  return lang === "es" ? "No pudimos preparar tu anuncio" : "We could not prepare your ad";
}

function prepareErrorBody(lang: AutosPublishFlowLang): string {
  return lang === "es"
    ? "No se pudo cargar o guardar la información necesaria para continuar. Vuelve a editar tu anuncio e inténtalo de nuevo. Si el problema continúa, guarda una captura y avísanos."
    : "We could not load or save the information needed to continue. Go back to edit your ad and try again. If the problem continues, save a screenshot and let us know.";
}

function retryLabel(lang: AutosPublishFlowLang): string {
  return lang === "es" ? "Intentar de nuevo" : "Try again";
}

function goAutosLabel(lang: AutosPublishFlowLang): string {
  return lang === "es" ? "Ir a Autos" : "Go to Autos";
}

function hasConfirmableAutosDraft(listing: AutoDealerListing): boolean {
  const textSeed = [
    listing.vehicleTitle,
    listing.make,
    listing.model,
    listing.trim,
    listing.city,
    listing.state,
    listing.dealerName,
    listing.dealerPhoneOffice,
    listing.dealerWhatsapp,
    listing.dealerEmail,
  ].some((v) => typeof v === "string" && v.trim().length > 0);
  const numericSeed =
    (typeof listing.year === "number" && Number.isFinite(listing.year)) ||
    (typeof listing.price === "number" && Number.isFinite(listing.price)) ||
    (typeof listing.mileage === "number" && Number.isFinite(listing.mileage));
  const mediaSeed = Boolean(
    listing.mediaImages?.length ||
      listing.heroImages?.length ||
      listing.videoUrls?.length ||
      listing.videoUrl?.trim(),
  );
  return textSeed || numericSeed || mediaSeed;
}

async function fetchAutosConfirm(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), AUTOS_CONFIRM_PREPARE_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function formatUsd(n: number | undefined, lang: AutosPublishFlowLang) {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function autosPersistWarningMessage(code: string, lang: AutosPublishFlowLang): string {
  const es = lang === "es";
  switch (code) {
    case "media_image_oversized_data_url_dropped":
      return es
        ? "Una imagen local era demasiado pesada y se omitió. Usa una imagen más ligera o una URL de imagen antes de publicar."
        : "One local image was too large and was skipped. Use a smaller image or an image URL before publishing.";
    case "dealer_logo_oversized_data_url_dropped":
      return es
        ? "El logo local era demasiado pesado y se omitió."
        : "The local logo was too large and was skipped.";
    case "video_file_data_url_stripped_for_persistence":
    case "video_url_non_durable_stripped":
      return es
        ? "Se quitó un video local no publicable. Autos publica videos mediante enlaces externos."
        : "A non-publishable local video was removed. Autos publishes videos through external links.";
    default:
      return es
        ? "Se ajustó un archivo local no durable antes de guardar/publicar."
        : "A non-durable local file was adjusted before save/publish.";
  }
}

export function AutosPublishConfirmCore({
  lane,
  lang,
  listing,
  hydrated,
  flushDraft,
  editHref,
  inventoryAddMode = false,
  inventoryAddContext = null,
  additionalInventoryVehicles = [],
}: {
  lane: AutosClassifiedsLane;
  lang: AutosPublishFlowLang;
  listing: AutoDealerListing;
  hydrated: boolean;
  flushDraft: (opts?: {
    editorStep?: number;
    editorMaxReached?: number;
    listing?: AutoDealerListing;
    additionalInventoryVehicles?: AutosAdditionalInventoryVehicleDraft[];
  }) => Promise<void>;
  editHref: string;
  inventoryAddMode?: boolean;
  inventoryAddContext?: AutosInventoryAddContext | null;
  /** Negocios bundle: additional inventory vehicles from application draft. */
  additionalInventoryVehicles?: AutosAdditionalInventoryVehicleDraft[];
}) {
  const [publishConfirmMode, setPublishConfirmMode] = useState<AutosPublishConfirmMode>("stripe");
  const inventoryCtx = inventoryAddContext ?? (inventoryAddMode ? readInventoryAddContextFromSession() : null);
  const c = getAutosPublishFlowCopy(lang, lane, publishConfirmMode, Boolean(inventoryCtx));
  const [listingId, setListingId] = useState<string | null>(null);
  const [phase, setPhase] = useState<AutosConfirmPhase>("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [checks, setChecks] = useState([false, false, false]);
  const [payBusy, setPayBusy] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [muxPublishWarnings, setMuxPublishWarnings] = useState<string[]>([]);
  const [persistWarnings, setPersistWarnings] = useState<string[]>([]);
  const [prepareTimedOut, setPrepareTimedOut] = useState(false);
  const listingRef = useRef(listing);
  listingRef.current = listing;
  const additionalInventoryRef = useRef(additionalInventoryVehicles);
  additionalInventoryRef.current = additionalInventoryVehicles;

  async function uploadLocalPhotosIfNeeded(token: string): Promise<
    | { ok: true }
    | { ok: false; phase: "upload_error" | "local_video_error"; message: string }
  > {
    const needsUpload =
      autosDraftListingHasLocalPhotos(listingRef.current) ||
      autosInventoryDraftHasLocalPhotos(additionalInventoryRef.current);
    if (!needsUpload) return { ok: true };

    const draftNamespace =
      lane === "privado" ? await resolveAutosPrivadoDraftNamespace() : await resolveAutosNegociosDraftNamespace();
    const draftId = draftNamespace.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || lane;
    const muxLang = lang === "en" ? "en" : "es";

    const result = await resolveAutosDraftPhotosForPublish({
      listing: listingRef.current,
      additionalInventoryVehicles: additionalInventoryRef.current,
      draftNamespace,
      draftId,
      authToken: token,
      lang: muxLang,
    });

    if (!result.ok) {
      return {
        ok: false,
        phase: result.kind === "local_video" ? "local_video_error" : "upload_error",
        message: result.message,
      };
    }

    listingRef.current = result.listing;
    additionalInventoryRef.current = result.additionalInventoryVehicles;
    await flushDraft({
      listing: result.listing,
      ...(lane === "negocios" ? { additionalInventoryVehicles: result.additionalInventoryVehicles } : {}),
    });
    return { ok: true };
  }

  useEffect(() => {
    if (hydrated && phase !== "preparing" && phase !== "idle" && phase !== "uploading_photos") {
      setPrepareTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setPrepareTimedOut(true), AUTOS_CONFIRM_PREPARE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, phase]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setPhase("preparing");
    void (async () => {
      try {
        setErrorDetail(null);
        setPrepareTimedOut(false);
        let confirmMode: AutosPublishConfirmMode = "stripe";

        if (!hasConfirmableAutosDraft(listingRef.current)) {
          setErrorDetail(prepareErrorBody(lang));
          setPhase("error");
          return;
        }

        const supabase = createSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        try {
          const optRes = await fetchAutosConfirm("/api/clasificados/autos/publish-options", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (optRes.ok) {
            const opts = (await optRes.json()) as {
              internalBypass?: boolean;
              testPublishBypass?: boolean;
              negociosQaAllowlistBypass?: boolean;
            };
            if (opts.internalBypass) confirmMode = "internal_bypass";
            else if (opts.testPublishBypass) confirmMode = "test_bypass";
            else if (opts.negociosQaAllowlistBypass) confirmMode = "test_bypass";
          }
        } catch {
          /* keep stripe copy */
        }
        if (!cancelled) setPublishConfirmMode(confirmMode);
        if (!cancelled) setPersistWarnings([]);

        if (cancelled) return;
        if (!token) {
          setSessionMissing(true);
          setPhase("ready");
          return;
        }
        setSessionMissing(false);
        const sk = sessionKey(lane);
        const cached = typeof window !== "undefined" ? window.sessionStorage.getItem(sk) : null;

        setPhase("uploading_photos");
        const photoPrep = await uploadLocalPhotosIfNeeded(token);
        if (cancelled) return;
        if (!photoPrep.ok) {
          setErrorDetail(photoPrep.message);
          setPhase(photoPrep.phase);
          return;
        }
        setPhase("preparing");

        if (cached) {
          const r = await fetchAutosConfirm(`/api/clasificados/autos/listings/${cached}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          if (r.ok) {
            const j = (await r.json()) as { status?: string };
            if (j.status === "draft" || j.status === "pending_payment" || j.status === "payment_failed") {
              const sync = await fetchAutosConfirm(`/api/clasificados/autos/listings/${cached}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  listing: prepareAutosListingForApiTransport(listingRef.current),
                  lang,
                }),
              });
              const syncJson = (await sync.json().catch(() => ({}))) as { persistWarnings?: string[] };
              if (cancelled) return;
              if (!sync.ok) {
                window.sessionStorage.removeItem(sk);
              } else {
                setPersistWarnings(syncJson.persistWarnings ?? []);
                setListingId(cached);
                setPhase("ready");
                return;
              }
            }
          }
          window.sessionStorage.removeItem(sk);
        }
        await flushDraft();
        if (cancelled) return;
        const createBody: Record<string, unknown> = {
          listing: prepareAutosListingForApiTransport(listingRef.current),
          lane,
          lang,
        };
        if (inventoryCtx?.parentListingId) {
          createBody.parentListingId = inventoryCtx.parentListingId;
          if (inventoryCtx.dealerInventoryGroupId) createBody.dealerInventoryGroupId = inventoryCtx.dealerInventoryGroupId;
        }
        const res = await fetchAutosConfirm("/api/clasificados/autos/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(createBody),
        });
        const j = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          id?: string;
          errorCode?: string;
          message?: string;
          error?: string;
          persistWarnings?: string[];
        };
        if (cancelled) return;
        if (!res.ok || !j.id) {
          setErrorDetail(
            autosConfirmErrorMessage(lang, j.errorCode ?? j.error, j.message ?? c.createError),
          );
          setPhase("error");
          return;
        }
        window.sessionStorage.setItem(sk, j.id);
        setPersistWarnings(j.persistWarnings ?? []);
        setListingId(j.id);
        setPhase("ready");
      } catch {
        if (cancelled) return;
        setErrorDetail(prepareErrorBody(lang));
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // `c` is derived from `lang` + `lane`; avoid listing `c.createError` (new fn each render would thrash).
     
  }, [hydrated, lane, lang, flushDraft]);

  useEffect(() => {
    if (phase !== "ready" || !listingId || sessionMissing) return;
    const k = `lx-autos-publish-funnel-${listingId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(k)) return;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      if (typeof window !== "undefined") sessionStorage.setItem(k, "1");
      await fetch(`/api/clasificados/autos/listings/${listingId}/analytics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: AUTOS_CLASSIFIEDS_EVENT.publishConversion }),
      });
    })();
  }, [phase, listingId, sessionMissing]);

  const allChecked = checks.every(Boolean);
  const loginHref =
    typeof window !== "undefined"
      ? `/clasificados/login?lang=${lang}&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : `/clasificados/login?lang=${lang}`;

  const renderPrepareError = (message?: string) => (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-[color:var(--lx-text)]">
      <h1 className="text-2xl font-bold">{prepareErrorTitle(lang)}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{message ?? prepareErrorBody(lang)}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={editHref}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7]"
        >
          {c.backEdit}
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] px-5 text-sm font-bold text-[color:var(--lx-text)]"
        >
          {retryLabel(lang)}
        </button>
        <Link
          href={autosHomeHref(lang)}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] px-5 text-sm font-bold text-[color:var(--lx-text)]"
        >
          {goAutosLabel(lang)}
        </Link>
      </div>
    </div>
  );

  if (prepareTimedOut && (!hydrated || phase === "preparing" || phase === "idle" || phase === "uploading_photos")) {
    return renderPrepareError(autosConfirmErrorMessage(lang, "REQUEST_TIMEOUT"));
  }

  if (!hydrated || phase === "preparing" || phase === "idle" || phase === "uploading_photos") {
    const detail =
      phase === "uploading_photos"
        ? photosUploadingMessage(lang)
        : publishConfirmMode === "stripe"
          ? c.preparingDetailStripe
          : `${c.preparingDetailStripe} ${c.preparingDetailBypass}`.trim();
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="text-sm font-semibold">{phase === "uploading_photos" ? photosUploadingMessage(lang) : c.preparing}</p>
        {detail ? <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{detail}</p> : null}
      </div>
    );
  }

  if (phase === "error" || phase === "upload_error" || phase === "local_video_error") {
    return renderPrepareError(errorDetail ?? c.createError);
  }

  if (sessionMissing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-[color:var(--lx-text)]">
        <h1 className="text-2xl font-bold">{c.loginRequiredTitle}</h1>
        <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{c.loginRequiredBody}</p>
        <a
          href={loginHref}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7]"
        >
          {c.loginCta}
        </a>
        <div className="mt-6">
          <Link href={editHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
            {c.backEdit}
          </Link>
        </div>
      </div>
    );
  }

  async function startCheckout() {
    if (!listingId || !allChecked) return;
    const supabase = createSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setSessionMissing(true);
      return;
    }
    setPayBusy(true);
    setMuxPublishWarnings([]);
    setPersistWarnings([]);
    const muxLang = lang === "en" ? "en" : "es";

    setPhase("uploading_photos");
    const photoPrep = await uploadLocalPhotosIfNeeded(token);
    if (!photoPrep.ok) {
      setPayBusy(false);
      setErrorDetail(photoPrep.message);
      setPhase(photoPrep.phase);
      return;
    }
    setPhase("ready");

    const prepared = await prepareAutosListingOptionalMuxUpload(listingRef.current, muxLang);
    listingRef.current = prepared.listing;
    if (prepared.publishWarnings.length) setMuxPublishWarnings(prepared.publishWarnings);

    try {
    const sync = await fetchAutosConfirm(`/api/clasificados/autos/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listing: prepareAutosListingForApiTransport(listingRef.current), lang }),
    });
    const syncJson = (await sync.json().catch(() => ({}))) as {
      persistWarnings?: string[];
      errorCode?: string;
      message?: string;
      error?: string;
    };
    if (!sync.ok) {
      setPayBusy(false);
      setErrorDetail(
        autosConfirmErrorMessage(lang, syncJson.errorCode ?? syncJson.error, syncJson.message ?? c.createError),
      );
      setPhase("error");
      return;
    }
    setPersistWarnings(syncJson.persistWarnings ?? []);

    if (lane === "privado" && publishConfirmMode === "stripe") {
      let leonixAdId: string | null = null;
      try {
        const ownerRes = await fetchAutosConfirm(`/api/clasificados/autos/listings/${listingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ownerRes.ok) {
          const ownerJson = (await ownerRes.json()) as { leonixAdId?: string | null };
          leonixAdId = ownerJson.leonixAdId?.trim() || null;
        }
      } catch {
        /* optional metadata */
      }

      const revenueCheckout = await startRevenueCategoryCheckout({
        ...AUTOS_PRIVADO_CHECKOUT,
        listingId,
        leonixAdId,
        locale: lang,
      });
      setPayBusy(false);
      if (!revenueCheckout.ok) {
        setErrorDetail(revenueCheckout.userMessage);
        setPhase("error");
        return;
      }
      redirectToRevenueCategoryCheckout(revenueCheckout.checkoutUrl);
      return;
    }

    const res = await fetchAutosConfirm("/api/clasificados/autos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        listingId,
        lang,
        ...(inventoryCtx?.returnToListingId ? { returnToListingId: inventoryCtx.returnToListingId } : {}),
        ...(lane === "negocios" && additionalInventoryRef.current.length > 0 && !inventoryCtx
          ? { additionalInventoryVehicles: additionalInventoryRef.current }
          : {}),
      }),
    });
    const j = (await res.json()) as {
      ok?: boolean;
      url?: string;
      internalBypass?: boolean;
      testPublishBypass?: boolean;
      negociosQaAllowlistBypass?: boolean;
      successUrl?: string;
      error?: string;
      errorCode?: string;
      message?: string;
      bundlePublish?: {
        mainListingId: string;
        published: AutosBundlePublishSessionResult["published"];
        totalPublished: number;
        additionalSkipped: number;
        inventoryIncluded: number;
        inventoryLimit: number;
      };
    };
    setPayBusy(false);
    if (!res.ok && j.error === "dealer_active_limit_reached") {
      setErrorDetail(j.message ?? autosDealerInventoryLimitMessage(lang));
      setPhase("error");
      return;
    }
    if (!res.ok && j.error === "bundle_requires_qa_bypass") {
      setErrorDetail(j.message ?? c.checkoutErrorGeneric);
      setPhase("error");
      return;
    }
    if (
      !res.ok &&
      (j.error === "autos_negocios_qa_allowlist_missing" || j.errorCode === "AUTOS_NEGOCIOS_QA_ALLOWLIST_MISSING")
    ) {
      setErrorDetail(autosConfirmErrorMessage(lang, "AUTOS_NEGOCIOS_QA_ALLOWLIST_MISSING", j.message));
      setPhase("error");
      return;
    }
    if (
      res.ok &&
      (j.internalBypass || j.testPublishBypass || j.negociosQaAllowlistBypass) &&
      typeof j.successUrl === "string" &&
      j.successUrl
    ) {
      if (j.bundlePublish && typeof window !== "undefined") {
        const sessionResult: AutosBundlePublishSessionResult = {
          mainListingId: j.bundlePublish.mainListingId,
          published: j.bundlePublish.published,
          totalPublished: j.bundlePublish.totalPublished,
          qaBypass: true,
          inventoryIncluded: j.bundlePublish.inventoryIncluded,
          inventoryLimit: j.bundlePublish.inventoryLimit,
        };
        window.sessionStorage.setItem(AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY, JSON.stringify(sessionResult));
      }
      if (inventoryCtx) {
        clearInventoryAddContextFromSession();
        const returnHref = resolveInventoryAddReturnHref({
          returnToListingId: inventoryCtx.returnToListingId,
          newListingId: listingId,
          lang,
        });
        window.location.href = returnHref;
        return;
      }
      window.location.href = j.successUrl;
      return;
    }
    if (res.ok && j.url) {
      window.location.href = j.url;
      return;
    }
    const code = j.error ?? "";
    const msg =
      j.errorCode
        ? autosConfirmErrorMessage(lang, j.errorCode, j.message)
        : code === "stripe_not_configured"
        ? c.checkoutErrorStripe
        : code === "stripe_price_missing"
          ? c.checkoutErrorPrice
          : lane === "privado" && publishConfirmMode === "stripe"
            ? revenueCategoryCheckoutErrorMessage(lang)
            : j.message ?? c.checkoutErrorGeneric;
    setErrorDetail(msg);
    setPhase("error");
    } catch {
      setPayBusy(false);
      setErrorDetail(prepareErrorBody(lang));
      setPhase("error");
    }
  }

  const vehicleLine =
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ||
    normalizeVehicleSegment(listing.vehicleTitle?.trim()) ||
    "—";
  const locLine = [listing.city, listing.state, listing.zip].filter((x) => (x ?? "").trim()).join(", ") || "—";
  const qaBypassActive = publishConfirmMode !== "stripe";
  const planSummary = getAutosConfirmPlanSummaryCopy(lang, lane, qaBypassActive);
  const bundleCount =
    lane === "negocios" && !inventoryCtx ? countApplicationInventoryVehicles(additionalInventoryVehicles.length) : 0;

  const summaryRow = (label: string, value: ReactNode, valueClass = "font-semibold text-[color:var(--lx-text)]") => (
    <div className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:py-3">
      <dt className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{label}</dt>
      <dd className={`min-w-0 text-[15px] leading-snug sm:max-w-[min(100%,280px)] sm:text-right ${valueClass}`}>{value}</dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-[max(1rem,env(safe-area-inset-left))] py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] text-[color:var(--lx-text)] sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-[1.65rem]">{c.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.subtitle}</p>
      {qaBypassActive ? (
        <p className="mt-3 inline-flex rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950">
          {autosQaPaymentBypassLabel(lang)}
        </p>
      ) : null}
      {bundleCount > 1 ? (
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-muted)]">
          {lang === "es"
            ? `Esta solicitud publicará ${bundleCount} vehículos (${bundleCount}/${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} incluidos) bajo el mismo inventario del dealer.`
            : `This application will publish ${bundleCount} vehicles (${bundleCount}/${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} included) under the same dealer inventory.`}
          {!qaBypassActive
            ? lang === "es"
              ? " Con pago Stripe solo se activa el vehículo principal; los adicionales se agregan después desde el inventario."
              : " With Stripe payment only the main vehicle activates; add additional vehicles from inventory afterward."
            : null}
        </p>
      ) : null}
      <dl className="mt-8 divide-y divide-[color:var(--lx-nav-border)]/80 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-sm shadow-sm sm:px-5 sm:py-3">
        {summaryRow(planSummary.planLabel, planSummary.planValue)}
        {summaryRow(planSummary.priceLabel, planSummary.priceValue)}
        {summaryRow(planSummary.statusLabel, planSummary.statusValue, "font-medium text-[color:var(--lx-text-2)]")}
        {summaryRow(c.laneLine, c.laneValue)}
        {summaryRow(c.summaryVehicle, vehicleLine)}
        {summaryRow(c.summaryPrice, formatUsd(listing.price, lang))}
        {lane === "negocios" && listing.monthlyEstimate?.trim()
          ? summaryRow(c.summaryMonthly, listing.monthlyEstimate.trim(), "font-medium text-[color:var(--lx-text-2)]")
          : null}
        {summaryRow(c.summaryLocation, locLine, "font-medium text-[color:var(--lx-text-2)]")}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-[color:var(--lx-muted)]">{planSummary.summaryFootnote}</p>
      {muxPublishWarnings.length > 0 ? (
        <div
          className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">{lang === "es" ? "Aviso de video (opcional)" : "Optional video notice"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {muxPublishWarnings.map((w, i) => (
              <li key={`${i}-${w.slice(0, 48)}`}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {persistWarnings.length > 0 ? (
        <div
          className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">{lang === "es" ? "Aviso de fotos / archivos" : "Photo / file notice"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {persistWarnings.map((w, i) => (
              <li key={`${i}-${w}`}>{autosPersistWarningMessage(w, lang)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                checked={checks[i]!}
                onChange={(e) => {
                  const next = [...checks];
                  next[i] = e.target.checked;
                  setChecks(next);
                }}
              />
              <span>{[c.checks.accurate, c.checks.rules, c.checks.paid][i]}</span>
            </label>
          </li>
        ))}
      </ul>
      {!allChecked ? <p className="mt-4 text-xs leading-relaxed text-[color:var(--lx-muted)]">{c.mustCheck}</p> : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!listingId || !allChecked || payBusy}
          onClick={() => void startCheckout()}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] transition active:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          {payBusy
            ? lane === "privado" && publishConfirmMode === "stripe"
              ? revenueCategoryCheckoutLoadingMessage(lang)
              : c.payBusy
            : lane === "privado" && publishConfirmMode === "stripe"
              ? lang === "es"
                ? "Pagar y publicar auto"
                : "Pay and publish auto listing"
              : c.payCta}
        </button>
        <Link
          href={editHref}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] px-6 text-sm font-bold text-[color:var(--lx-text)] transition active:opacity-90 sm:w-auto"
        >
          {c.backEdit}
        </Link>
      </div>
    </div>
  );
}
