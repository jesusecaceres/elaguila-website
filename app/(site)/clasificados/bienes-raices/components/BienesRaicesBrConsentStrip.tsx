"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { readBrConsent, writeBrConsent, type BrStoredConsent } from "../shared/brFirstPartyPrefs";

const COPY: Record<
  Lang,
  {
    title: string;
    necessary: string;
    functional: string;
    analytics: string;
    save: string;
    dismiss: string;
    legal: string;
  }
> = {
  es: {
    title: "Preferencias en este dispositivo",
    necessary: "Necesarias (sitio e idioma)",
    functional: "Funcionales: recordar última ciudad y filtros recientes",
    analytics: "Medición básica de uso (solo Leonix, sin venta de datos)",
    save: "Guardar",
    dismiss: "Solo necesarias",
    legal: "Aviso de privacidad",
  },
  en: {
    title: "Preferences on this device",
    necessary: "Necessary (site + language)",
    functional: "Functional: remember last city and recent filters",
    analytics: "Basic usage measurement (Leonix only; no data selling)",
    save: "Save",
    dismiss: "Necessary only",
    legal: "Privacy notice",
  },
};

/**
 * Transparent consent for optional first-party memory — no silent tracking.
 */
export function BienesRaicesBrConsentStrip({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [open, setOpen] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setOpen(readBrConsent() === null);
    const c = readBrConsent();
    if (c) {
      setFunctional(c.functional);
      setAnalytics(c.analytics);
    }
  }, []);

  if (!open) return null;

  const save = (c: BrStoredConsent) => {
    writeBrConsent(c);
    setOpen(false);
  };

  return (
    <div
      className="mb-6 rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-[0_12px_40px_-24px_rgba(42,36,22,0.22)] sm:p-5"
      role="region"
      aria-label={t.title}
    >
      <p className="font-serif text-base font-semibold text-[#1E1810]">{t.title}</p>
      <ul className="mt-3 space-y-2 text-sm text-[#5C5346]/92">
        <li className="flex items-start gap-2">
          <input type="checkbox" checked disabled className="mt-1 h-4 w-4 rounded border-[#E8DFD0]" />
          <span>{t.necessary}</span>
        </li>
        <li className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={functional}
            onChange={(e) => setFunctional(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#E8DFD0] text-[#B8954A] focus:ring-[#C9B46A]/50"
          />
          <span>{t.functional}</span>
        </li>
        <li className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#E8DFD0] text-[#B8954A] focus:ring-[#C9B46A]/50"
          />
          <span>{t.analytics}</span>
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save({ necessary: true, functional, analytics })}
          className="rounded-xl bg-[#2A2620] px-5 py-2.5 text-sm font-bold text-[#FAF7F2] shadow-md"
        >
          {t.save}
        </button>
        <button
          type="button"
          onClick={() => save({ necessary: true, functional: false, analytics: false })}
          className="text-sm font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-2"
        >
          {t.dismiss}
        </button>
        <Link href={appendLangToPath("/legal", lang)} className="text-sm font-semibold text-[#5C5346] underline">
          {t.legal}
        </Link>
      </div>
    </div>
  );
}
