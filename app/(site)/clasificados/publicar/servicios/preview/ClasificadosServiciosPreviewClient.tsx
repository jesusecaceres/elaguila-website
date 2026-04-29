"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { clearLeonixPreviewNavSessionFlag, markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { ServiciosPreviewCard } from "@/app/(site)/clasificados/servicios/shell/ServiciosPreviewCard";
import { getServiciosWireProfileFromSample } from "@/app/servicios/data/demoServiciosBusinessProfile";
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

type Source = "loading" | "expert" | "application";

const PREVIEW_BAR =
  "sticky top-0 z-[60] border-b border-black/[0.08] bg-[#F9F8F6]/95 shadow-[0_6px_20px_-12px_rgba(42,36,22,0.18)] backdrop-blur-md";

const EDIT_LINK =
  "inline-flex min-h-[44px] touch-manipulation items-center rounded-full border border-[#D8C79A]/80 bg-white px-4 py-2 text-sm font-bold text-[#3D2C12] shadow-sm transition hover:border-[#3B66AD]/40 hover:bg-[#FFFCF7]";

/**
 * Clasificados Servicios preview: application draft from session storage, or expert sample (`?sample=expert`).
 * Outer bar holds only “Volver a editar”; the publishable ad canvas is `ServiciosProfileView` without the global Servicios top bar.
 */
export function ClasificadosServiciosPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const forceExpert = searchParams?.get("sample") === "expert";

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
    if (forceExpert) {
      setSource("expert");
      setAppDraft(null);
      setAppState(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const raw = await loadClasificadosServiciosApplicationResolved();
      if (cancelled) return;
      if (raw == null) {
        setSource("expert");
        setAppDraft(null);
        setAppState(null);
        return;
      }
      const normalized = normalizeClasificadosServiciosApplicationState(raw);
      setAppState(normalized);
      setAppDraft(mapClasificadosServiciosApplicationToServiciosDraft(normalized, lang));
      setSource("application");
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, forceExpert]);

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
      router.push(`/clasificados/servicios/${encodeURIComponent(data.slug)}?${q.toString()}`);
    } catch {
      setPublishErr(lang === "en" ? "Network error." : "Error de red.");
      setPublishBusy(false);
    }
  }, [appState, canPublishFromPreview, lang, router]);

  const profile = useMemo(() => {
    if (source === "loading") return null;
    const wire =
      source === "expert"
        ? getServiciosWireProfileFromSample("expert", lang)
        : mapServiciosApplicationDraftToBusinessProfile(appDraft!);
    return resolveServiciosProfile(wire, lang);
  }, [source, appDraft, lang]);

  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";

  if (source === "loading" || !profile) {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
  }

  if (source === "application" && !previewReadiness.ok) {
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
          <h1 className="text-xl font-bold text-[#3D2C12]">
            {lang === "en" ? "Preview needs a few more details" : "La vista previa necesita unos datos más"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {lang === "en"
              ? "Complete the checklist in the application so the public profile looks complete and premium."
              : "Completa el formulario para que el perfil público se vea completo y premium."}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            {lang === "en"
              ? "Return to the form, complete the checklist, then open Preview again from the last step."
              : "Vuelve al formulario, completa el checklist y abre de nuevo «Vista previa» desde el último paso."}
          </p>
          <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-neutral-700">
            {previewReadiness.missing.map((m) => (
              <li key={m.id}>{m.label}</li>
            ))}
          </ul>
          <Link
            href={editHref}
            onClick={markPublishFlowReturningToEdit}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
          >
            {lang === "en" ? "Return to application" : "Volver al formulario"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className={PREVIEW_BAR}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-end gap-2 px-4 py-3 md:px-6">
          {source === "application" && !forceExpert ? (
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
          ) : null}
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
          {/* Premium Preview Card */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Vista previa de la tarjeta</h2>
            <ServiciosPreviewCard 
              data={profile} 
              listingId={profile.identity.slug}
              showEngagementMetrics={true}
              className="max-w-2xl mx-auto"
            />
          </div>
          
          {/* Full Profile View */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Vista previa completa</h2>
            <ServiciosProfileView profile={profile} lang={lang} showTopBar={false} />
          </div>
        </ClasificadosPreviewAdCanvas>
      </div>
    </div>
  );
}
