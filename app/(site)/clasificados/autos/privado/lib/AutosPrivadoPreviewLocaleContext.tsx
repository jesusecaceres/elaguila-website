"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import { normalizeAutosNegociosLang, type AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { getAutosPrivadoCopy } from "./getAutosPrivadoCopy";

type Value = { lang: AutosNegociosLang; t: AutosNegociosCopy };

const Ctx = createContext<Value | null>(null);

function AutosPrivadoPreviewLocaleInner({
  lang,
  manageDocumentTitle = true,
  children,
}: {
  lang: AutosNegociosLang;
  /** Live detail sets its own real vehicle-title document.title — skip the "Vista previa" label there. */
  manageDocumentTitle?: boolean;
  children: ReactNode;
}) {
  const t = useMemo(() => getAutosPrivadoCopy(lang), [lang]);
  useEffect(() => {
    if (!manageDocumentTitle) return;
    document.title = t.meta.previewTitle;
  }, [manageDocumentTitle, t.meta.previewTitle]);
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
  manageDocumentTitle = true,
}: {
  children: ReactNode;
  lang?: AutosNegociosLang;
  /** Live detail sets its own real vehicle-title document.title — skip the "Vista previa" label there. */
  manageDocumentTitle?: boolean;
}) {
  if (langProp) {
    return (
      <AutosPrivadoPreviewLocaleInner lang={langProp} manageDocumentTitle={manageDocumentTitle}>
        {children}
      </AutosPrivadoPreviewLocaleInner>
    );
  }
  return <AutosPrivadoPreviewLocaleFromSearchParams>{children}</AutosPrivadoPreviewLocaleFromSearchParams>;
}

export function useAutosPrivadoPreviewCopy(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAutosPrivadoPreviewCopy must be used within AutosPrivadoPreviewLocaleProvider");
  return v;
}
