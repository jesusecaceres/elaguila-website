"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { AutosNegociosCopy } from "./autosNegociosCopy";
import { getAutosNegociosCopy } from "./autosNegociosCopy";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "./autosNegociosLang";

type PreviewLocaleValue = { lang: AutosNegociosLang; t: AutosNegociosCopy };

const PreviewLocaleContext = createContext<PreviewLocaleValue | null>(null);

function AutosNegociosPreviewLocaleInner({ lang, children }: { lang: AutosNegociosLang; children: ReactNode }) {
  const t = useMemo(() => getAutosNegociosCopy(lang), [lang]);
  useEffect(() => {
    document.title = t.meta.previewTitle;
  }, [t.meta.previewTitle]);
  return <PreviewLocaleContext.Provider value={{ lang, t }}>{children}</PreviewLocaleContext.Provider>;
}

function AutosNegociosPreviewLocaleFromSearchParams({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  const lang: AutosNegociosLang = useMemo(() => normalizeAutosNegociosLang(sp?.get("lang")), [sp]);
  return <AutosNegociosPreviewLocaleInner lang={lang}>{children}</AutosNegociosPreviewLocaleInner>;
}

/** Pass `lang` on live detail to avoid Suspense deadlock under a parent `Suspense` fallback. */
export function AutosNegociosPreviewLocaleProvider({
  children,
  lang: langProp,
}: {
  children: ReactNode;
  lang?: AutosNegociosLang;
}) {
  if (langProp) {
    return <AutosNegociosPreviewLocaleInner lang={langProp}>{children}</AutosNegociosPreviewLocaleInner>;
  }
  return <AutosNegociosPreviewLocaleFromSearchParams>{children}</AutosNegociosPreviewLocaleFromSearchParams>;
}

/**
 * Returns locale + negocios preview copy from context when wrapped in `AutosNegociosPreviewLocaleProvider`.
 * Otherwise derives language from `?lang=` (same as the provider) so shared building blocks
 * (`VehicleSpecsGrid`, `VehicleDescription`, …) can render on **Privado** live + preview shells
 * that only mount `AutosPrivadoPreviewLocaleProvider`.
 */
export function useAutosNegociosPreviewCopy(): PreviewLocaleValue {
  const v = useContext(PreviewLocaleContext);
  const [fallbackLang, setFallbackLang] = useState<AutosNegociosLang>("es");
  useEffect(() => {
    if (v) return;
    const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    setFallbackLang(normalizeAutosNegociosLang(qs?.get("lang") ?? undefined));
  }, [v]);
  return useMemo(() => {
    if (v) return v;
    return { lang: fallbackLang, t: getAutosNegociosCopy(fallbackLang) };
  }, [v, fallbackLang]);
}
