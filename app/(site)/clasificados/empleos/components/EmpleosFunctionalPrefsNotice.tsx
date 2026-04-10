"use client";

import { useEffect, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { markEmpleosFunctionalNoticeSeen, hasSeenEmpleosFunctionalNotice } from "../lib/empleosFunctionalStorage";

type Props = { lang: Lang };

export function EmpleosFunctionalPrefsNotice({ lang }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!hasSeenEmpleosFunctionalNotice());
  }, []);

  if (!open) return null;

  const dismiss = () => {
    markEmpleosFunctionalNoticeSeen();
    setOpen(false);
  };

  return (
    <div
      className="mb-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFBF7] px-4 py-3 shadow-sm sm:flex sm:items-start sm:justify-between sm:gap-4 sm:px-5"
      role="region"
      aria-label={lang === "es" ? "Aviso de preferencias locales" : "Local preferences notice"}
    >
      <p className="text-sm leading-relaxed text-[#4A4744]">
        {lang === "es" ? (
          <>
            <span className="font-semibold text-[#2A2826]">Preferencias en tu dispositivo.</span> Si guardas ciudad o filtros, Leonix puede
            recordarlos solo en este navegador para acelerar tu próxima visita. No usamos esto para publicidad de terceros ni vendemos datos
            personales. Puedes borrar datos del sitio en cualquier momento desde tu navegador.
          </>
        ) : (
          <>
            <span className="font-semibold text-[#2A2826]">Device preferences.</span> If you save city or filters, Leonix may remember them
            only in this browser to speed your next visit. We do not use this for third‑party ads or sell personal data. You can clear site
            data anytime in your browser settings.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#2F3438] px-4 text-sm font-semibold text-[#FFFBF5] sm:mt-0"
      >
        {lang === "es" ? "Entendido" : "Got it"}
      </button>
    </div>
  );
}
