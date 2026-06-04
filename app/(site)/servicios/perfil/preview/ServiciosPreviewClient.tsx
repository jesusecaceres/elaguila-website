"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ServiciosProfileView } from "../../components/ServiciosProfileView";
import { resolveServiciosProfile } from "../../lib/resolveServiciosProfile";
import { mapServiciosApplicationDraftToBusinessProfile } from "../../lib/mapServiciosApplicationDraftToBusinessProfile";
import { readServiciosApplicationDraftFromBrowser } from "../../lib/serviciosDraftStorage";
import { getServiciosApplicationDraftSample } from "../../data/serviciosApplicationDraftSamples";
import type { ServiciosApplicationDraft } from "../../types/serviciosApplicationDraft";
import type { ServiciosLang } from "../../types/serviciosBusinessProfile";

/**
 * Legacy `/servicios/perfil/preview` — opt-in `?sample=` for internal demos only.
 * Without sample or stored draft, shows incomplete state (never auto-loads demo business).
 */
export function ServiciosPreviewClient() {
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const sampleParam = searchParams?.get("sample");
  const [draft, setDraft] = useState<ServiciosApplicationDraft | null | undefined>(undefined);

  useEffect(() => {
    if (sampleParam) {
      setDraft(getServiciosApplicationDraftSample(sampleParam, lang));
      return;
    }
    const stored = readServiciosApplicationDraftFromBrowser();
    setDraft(stored ?? null);
  }, [sampleParam, lang]);

  const profile = useMemo(() => {
    if (draft === undefined) return null;
    if (!draft) return null;
    const wire = mapServiciosApplicationDraftToBusinessProfile(draft);
    return resolveServiciosProfile(wire, lang);
  }, [draft, lang]);

  const editHref = `/clasificados/publicar/servicios?lang=${lang}`;
  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";

  if (draft === undefined) {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
  }

  if (!draft || !profile) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] text-neutral-900">
        <div className="mx-auto max-w-lg px-4 py-12">
          <h1 className="text-xl font-bold text-[#3D2C12]">
            {lang === "en" ? "Complete your service information to preview your listing." : "Completa la información de tu servicio para ver la vista previa."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {lang === "en"
              ? "Open the Servicios application form to enter your business details, or add ?sample=expert for an internal demo only."
              : "Abre el formulario de Servicios para ingresar los datos de tu negocio, o usa ?sample=expert solo para demo interna."}
          </p>
          <Link
            href={editHref}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return <ServiciosProfileView profile={profile} lang={lang} />;
}
