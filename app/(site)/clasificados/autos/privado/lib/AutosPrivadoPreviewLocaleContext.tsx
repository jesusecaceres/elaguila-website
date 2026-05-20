"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPrivadoCopy } from "./getAutosPrivadoCopy";

type Value = { lang: AutosNegociosLang; t: AutosNegociosCopy };

const Ctx = createContext<Value | null>(null);

function AutosPrivadoPreviewLocaleInner({ lang, children }: { lang: AutosNegociosLang; children: ReactNode }) {
  const t = useMemo(() => getAutosPrivadoCopy(lang), [lang]);
  useEffect(() => {
    document.title = t.meta.previewTitle;
  }, [t.meta.previewTitle]);
  return <Ctx.Provider value={{ lang, t }}>{children}</Ctx.Provider>;
}

function AutosPrivadoPreviewLocaleFromSearchParams({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  const lang = useMemo(() => normalizeAutosNegociosLang(sp?.get("lang")), [sp]);
  return <AutosPrivadoPreviewLocaleInner lang={lang}>{children}</AutosPrivadoPreviewLocaleInner>;
}

export function AutosPrivadoPreviewLocaleProvider({
  children,
  lang: langProp,
}: {
  children: ReactNode;
  lang?: AutosNegociosLang;
}) {
  if (langProp) {
    return <AutosPrivadoPreviewLocaleInner lang={langProp}>{children}</AutosPrivadoPreviewLocaleInner>;
  }
  return <AutosPrivadoPreviewLocaleFromSearchParams>{children}</AutosPrivadoPreviewLocaleFromSearchParams>;
}

export function useAutosPrivadoPreviewCopy(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAutosPrivadoPreviewCopy must be used within AutosPrivadoPreviewLocaleProvider");
  return v;
}
