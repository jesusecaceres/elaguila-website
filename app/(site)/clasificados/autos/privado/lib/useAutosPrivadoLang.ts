"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPrivadoCopy } from "./getAutosPrivadoCopy";

export function useAutosPrivadoLang() {
  const sp = useSearchParams();
  const lang: AutosNegociosLang = useMemo(() => normalizeAutosNegociosLang(sp?.get("lang")), [sp]);
  const t = useMemo(() => getAutosPrivadoCopy(lang), [lang]);
  return { lang, t };
}
