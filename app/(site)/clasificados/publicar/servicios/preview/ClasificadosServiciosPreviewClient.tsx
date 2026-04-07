"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { clearLeonixPreviewNavSessionFlag, markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { getServiciosWireProfileFromSample } from "@/app/servicios/data/demoServiciosBusinessProfile";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosApplicationDraft } from "@/app/servicios/types/serviciosApplicationDraft";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { normalizeClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationNormalize";
import { readClasificadosServiciosApplicationFromBrowser } from "../lib/clasificadosServiciosStorage";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../lib/mapClasificadosServiciosApplicationToServiciosDraft";

type Source = "loading" | "expert" | "application";

/**
 * Prefers the Clasificados Servicios application draft from local storage;
 * falls back to the expert sample when there is no saved draft.
 * `?sample=expert` forces the expert shell for QA.
 */
export function ClasificadosServiciosPreviewClient() {
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const forceExpert = searchParams?.get("sample") === "expert";

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  const [source, setSource] = useState<Source>("loading");
  const [appDraft, setAppDraft] = useState<ServiciosApplicationDraft | null>(null);

  useEffect(() => {
    if (forceExpert) {
      setSource("expert");
      setAppDraft(null);
      return;
    }
    const raw = readClasificadosServiciosApplicationFromBrowser();
    if (raw == null) {
      setSource("expert");
      setAppDraft(null);
      return;
    }
    const normalized = normalizeClasificadosServiciosApplicationState(raw);
    setAppDraft(mapClasificadosServiciosApplicationToServiciosDraft(normalized, lang));
    setSource("application");
  }, [lang, forceExpert]);

  const profile = useMemo(() => {
    if (source === "loading") return null;
    const wire =
      source === "expert"
        ? getServiciosWireProfileFromSample("expert", lang)
        : mapServiciosApplicationDraftToBusinessProfile(appDraft!);
    return resolveServiciosProfile(wire, lang);
  }, [source, appDraft, lang]);

  if (!profile) {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
  }

  return (
    <ServiciosProfileView
      profile={profile}
      lang={lang}
      editBackHref={`/clasificados/publicar/servicios?lang=${lang}`}
      beforeEditBackNavigate={markPublishFlowReturningToEdit}
    />
  );
}
