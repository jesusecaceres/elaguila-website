"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPrivadoCopy } from "./getAutosPrivadoCopy";

type Value = { lang: AutosNegociosLang; t: AutosNegociosCopy };

const Ctx = createContext<Value | null>(null);

export function AutosPrivadoPreviewLocaleProvider({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  const lang = useMemo(() => normalizeAutosNegociosLang(sp?.get("lang")), [sp]);
  const t = useMemo(() => getAutosPrivadoCopy(lang), [lang]);
  useEffect(() => {
    document.title = t.meta.previewTitle;
  }, [t.meta.previewTitle]);
  return <Ctx.Provider value={{ lang, t }}>{children}</Ctx.Provider>;
}

export function useAutosPrivadoPreviewCopy(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAutosPrivadoPreviewCopy must be used within AutosPrivadoPreviewLocaleProvider");
  return v;
}
