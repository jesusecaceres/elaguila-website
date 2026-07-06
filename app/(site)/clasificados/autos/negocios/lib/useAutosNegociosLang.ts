"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { navCopyLang } from "@/app/lib/language";
import { getAutosNegociosCopy } from "./autosNegociosCopy";
import { normalizeAutosNegociosLang, resolveAutosRouteLang, type AutosNegociosLang } from "./autosNegociosLang";

/** Application route (`/publicar/autos/negocios`): reads `?lang=` from the URL. */
export function useAutosNegociosLang() {
  const sp = useSearchParams();
  const routeLang = useMemo(() => resolveAutosRouteLang(sp?.get("lang")), [sp]);
  const lang: AutosNegociosLang = useMemo(() => navCopyLang(routeLang), [routeLang]);
  const t = useMemo(() => getAutosNegociosCopy(lang), [lang]);
  return { lang, routeLang, t };
}
