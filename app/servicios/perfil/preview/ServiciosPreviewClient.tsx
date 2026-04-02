"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ServiciosProfileView } from "../../components/ServiciosProfileView";
import { resolveServiciosProfile } from "../../lib/resolveServiciosProfile";
import { mapServiciosApplicationDraftToBusinessProfile } from "../../lib/mapServiciosApplicationDraftToBusinessProfile";
import { readServiciosApplicationDraftFromBrowser } from "../../lib/serviciosDraftStorage";
import { getServiciosApplicationDraftSample } from "../../data/serviciosApplicationDraftSamples";
import type { ServiciosApplicationDraft } from "../../types/serviciosApplicationDraft";
import type { ServiciosLang } from "../../types/serviciosBusinessProfile";

export function ServiciosPreviewClient() {
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const sampleParam = searchParams?.get("sample");
  const [draft, setDraft] = useState<ServiciosApplicationDraft | null>(null);

  useEffect(() => {
    if (sampleParam) {
      setDraft(getServiciosApplicationDraftSample(sampleParam, lang));
      return;
    }
    const stored = readServiciosApplicationDraftFromBrowser();
    if (stored) {
      setDraft(stored);
      return;
    }
    setDraft(getServiciosApplicationDraftSample("expert", lang));
  }, [sampleParam, lang]);

  const profile = useMemo(() => {
    if (!draft) return null;
    const wire = mapServiciosApplicationDraftToBusinessProfile(draft);
    return resolveServiciosProfile(wire);
  }, [draft]);

  if (!profile) {
    return <div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />;
  }

  return <ServiciosProfileView profile={profile} lang={lang} />;
}
