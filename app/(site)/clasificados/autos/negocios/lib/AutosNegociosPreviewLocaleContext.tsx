"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { AutosNegociosCopy } from "./autosNegociosCopy";
import { getAutosNegociosCopy } from "./autosNegociosCopy";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "./autosNegociosLang";

type PreviewLocaleValue = { lang: AutosNegociosLang; t: AutosNegociosCopy };

const PreviewLocaleContext = createContext<PreviewLocaleValue | null>(null);

export function AutosNegociosPreviewLocaleProvider({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  const lang: AutosNegociosLang = useMemo(() => normalizeAutosNegociosLang(sp?.get("lang")), [sp]);
  const t = useMemo(() => getAutosNegociosCopy(lang), [lang]);
  useEffect(() => {
    document.title = t.meta.previewTitle;
  }, [t.meta.previewTitle]);
  return <PreviewLocaleContext.Provider value={{ lang, t }}>{children}</PreviewLocaleContext.Provider>;
}

export function useAutosNegociosPreviewCopy(): PreviewLocaleValue {
  const v = useContext(PreviewLocaleContext);
  if (!v) {
    throw new Error("useAutosNegociosPreviewCopy must be used within AutosNegociosPreviewLocaleProvider");
  }
  return v;
}
