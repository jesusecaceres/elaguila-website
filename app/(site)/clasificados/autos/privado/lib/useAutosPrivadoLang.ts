"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { navCopyLang } from "@/app/lib/language";
import { resolveAutosRouteLang, type AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPrivadoCopy } from "./getAutosPrivadoCopy";

export function useAutosPrivadoLang() {
  const sp = useSearchParams();
  const routeLang = useMemo(() => resolveAutosRouteLang(sp?.get("lang")), [sp]);
  const lang: AutosNegociosLang = useMemo(() => navCopyLang(routeLang), [routeLang]);
  const t = useMemo(() => getAutosPrivadoCopy(lang), [lang]);
  return { lang, routeLang, t };
}
