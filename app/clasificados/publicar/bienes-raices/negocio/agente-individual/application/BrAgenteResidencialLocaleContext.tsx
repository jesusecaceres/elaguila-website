"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { getBrAgenteResidencialCopy, type BrAgenteResidencialCopy } from "./brAgenteResidencialCopy";
import { normalizeBrAgenteResidencialLang, type BrAgenteResidencialLang } from "./brAgenteResidencialLang";

type Value = { lang: BrAgenteResidencialLang; t: BrAgenteResidencialCopy };

const BrAgenteResidencialLocaleContext = createContext<Value | null>(null);

export function BrAgenteResidencialLocaleProvider({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  const lang = useMemo(() => normalizeBrAgenteResidencialLang(sp?.get("lang")), [sp]);
  const t = useMemo(() => getBrAgenteResidencialCopy(lang), [lang]);
  return <BrAgenteResidencialLocaleContext.Provider value={{ lang, t }}>{children}</BrAgenteResidencialLocaleContext.Provider>;
}

export function useBrAgenteResidencialCopy(): Value {
  const v = useContext(BrAgenteResidencialLocaleContext);
  if (!v) {
    throw new Error("useBrAgenteResidencialCopy must be used within BrAgenteResidencialLocaleProvider");
  }
  return v;
}
