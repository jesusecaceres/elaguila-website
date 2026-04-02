"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getAutosNegociosCopy } from "./autosNegociosCopy";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "./autosNegociosLang";

/** Application route (`/publicar/autos/negocios`): reads `?lang=` from the URL. */
export function useAutosNegociosLang() {
  const sp = useSearchParams();
  const lang: AutosNegociosLang = useMemo(() => normalizeAutosNegociosLang(sp?.get("lang")), [sp]);
  const t = useMemo(() => getAutosNegociosCopy(lang), [lang]);
  return { lang, t };
}
