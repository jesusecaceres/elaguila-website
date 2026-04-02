"use client";

import { FiCamera } from "react-icons/fi";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { SV } from "./serviciosDesignTokens";

export function ServiciosLeadForm({ lang }: { lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  return (
    <div className="mt-5 border-t border-black/[0.06] pt-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="flex-1 rounded-xl border border-black/[0.1] bg-white py-2.5 text-sm font-semibold text-[color:var(--lx-text-2)] transition hover:border-[#3B66AD]/35"
        >
          {L.viewDetails}
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/[0.1] bg-white py-2.5 text-sm font-semibold text-[color:var(--lx-text-2)] transition hover:border-[#3B66AD]/35"
        >
          <FiCamera className="h-4 w-4 text-[#3B66AD]" aria-hidden />
          {L.attachPhoto}
        </button>
      </div>
      <button
        type="button"
        className="mt-3 w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:opacity-[0.96]"
        style={{ backgroundColor: SV.blue, boxShadow: "0 8px 24px rgba(59,102,173,0.25)" }}
      >
        {L.send}
      </button>
    </div>
  );
}
