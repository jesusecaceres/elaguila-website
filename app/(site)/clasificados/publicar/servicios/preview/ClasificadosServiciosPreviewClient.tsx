"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { clearLeonixPreviewNavSessionFlag, markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { getServiciosWireProfileFromSample } from "@/app/servicios/data/demoServiciosBusinessProfile";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosApplicationDraft } from "@/app/servicios/types/serviciosApplicationDraft";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationNormalize";
import { readClasificadosServiciosApplicationFromBrowser } from "../lib/clasificadosServiciosStorage";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { evaluateServiciosPreviewReadiness } from "../lib/serviciosPreviewReadiness";

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
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const forceExpert = searchParams?.get("sample") === "expert";

  const editHref = `/clasificados/publicar/servicios?lang=${lang}`;

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
    const raw = readClasificadosServiciosApplicationFromBrowser();
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
  }, [lang, forceExpert]);

  const previewReadiness = useMemo(() => {
    if (source !== "application" || !appState) return { ok: true as const, missing: [] as { id: string; label: string }[] };
    return evaluateServiciosPreviewReadiness(appState, lang);
  }, [source, appState, lang]);

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
        <div className="mx-auto flex max-w-[1280px] justify-end px-4 py-3 md:px-6">
          <Link href={editHref} onClick={markPublishFlowReturningToEdit} className={EDIT_LINK}>
            {backLabel}
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-2 md:px-6">
        <ClasificadosPreviewAdCanvas className="overflow-hidden">
          <ServiciosProfileView profile={profile} lang={lang} showTopBar={false} />
        </ClasificadosPreviewAdCanvas>
      </div>
    </div>
  );
}
