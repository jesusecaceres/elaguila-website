"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { clearLeonixPreviewNavSessionFlag, markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
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
import { normalizeClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationNormalize";
import { loadClasificadosServiciosApplicationResolved, saveClasificadosServiciosApplicationResolved } from "../lib/clasificadosServiciosStorage";
import { getBusinessTypePreset } from "../lib/businessTypePresets";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { postServiciosPublishApi } from "../lib/serviciosPublishClient";
import { evaluateServiciosPublishReadiness } from "../lib/serviciosPublishReadiness";
import { evaluateServiciosPreviewReadiness } from "../lib/serviciosPreviewReadiness";
import { upsertLocalServiciosPublish } from "@/app/clasificados/servicios/lib/localServiciosPublishStorage";

/** Seller preview — real application draft only (no demo/sample fallback). */
type Source = "loading" | "application" | "missing";

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
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";

  const editHref = `/clasificados/publicar/servicios?lang=${lang}`;
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  const [source, setSource] = useState<Source>("loading");
  const [appDraft, setAppDraft] = useState<ServiciosApplicationDraft | null>(null);
  const [appState, setAppState] = useState<ClasificadosServiciosApplicationState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await loadClasificadosServiciosApplicationResolved();
      if (cancelled) return;
      if (raw == null) {
        setSource("missing");
        setAppDraft(null);
        setAppState(null);
        return;
      }
      const normalized = normalizeClasificadosServiciosApplicationState(raw);
      setAppState(normalized);
      setAppDraft(mapClasificadosServiciosApplicationToServiciosDraft(normalized, lang));
      setSource("application");
      await saveClasificadosServiciosApplicationResolved(normalized);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const previewReadiness = useMemo(() => {
    if (source !== "application" || !appState) return { ok: true as const, missing: [] as { id: string; label: string }[] };
    return evaluateServiciosPreviewReadiness(appState, lang);
  }, [source, appState, lang]);

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
    if (source !== "application" || !appDraft) return null;
    const wire = mapServiciosApplicationDraftToBusinessProfile(appDraft);
    return resolveServiciosProfile(wire, lang);
  }, [source, appDraft, lang]);

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
    const wire = mapServiciosApplicationDraftToBusinessProfile(appDraft);
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

  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";
  const cardPreviewTitle = lang === "en" ? "Result card preview" : "Vista previa de la tarjeta";
  const fullPreviewTitle = lang === "en" ? "Full profile preview" : "Vista previa completa";

  if (source === "loading") {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
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
            {useProfessionalPreview ? (
              <ServiciosProfessionalPreviewShell
                profile={profile}
                lang={lang}
                template={listingTemplate}
                cityFallback={appState?.city}
                draftSlug={profile.identity.slug}
              />
            ) : (
              <ServiciosProfileView profile={profile} lang={lang} showTopBar={false} />
            )}
          </div>
        </ClasificadosPreviewAdCanvas>
      </div>
    </div>
  );
}
