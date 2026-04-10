"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { sampleQuickFilters } from "../../data/empleosLandingSampleData";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";
import { LandingSection, QuickFilterIcon } from "./empleosLandingUi";

type Props = {
  lang: Lang;
};

export function QuickSearchTiles({ lang }: Props) {
  return (
    <LandingSection
      eyebrow={lang === "es" ? "Atajos" : "Shortcuts"}
      title={lang === "es" ? "Búsquedas rápidas" : "Quick searches"}
      subtitle={
        lang === "es"
          ? "Filtra por modalidad, industria o tipo de jornada — un toque y listo."
          : "Filter by modality, industry, or schedule — one tap and go."
      }
    >
      <div className="flex flex-wrap gap-3">
        {sampleQuickFilters.map((f) => (
          <Link
            key={f.id}
            href={buildEmpleosResultadosUrl(lang, f.params)}
            className="group flex min-h-[4.25rem] min-w-[7.5rem] flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-center shadow-[0_6px_22px_rgba(42,40,38,0.06)] transition hover:-translate-y-0.5 hover:border-[#D9A23A]/45 hover:shadow-[0_12px_28px_rgba(42,40,38,0.1)] sm:min-w-[8rem]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF3F7] to-[#E4ECF3] text-[#4F6B82] transition group-hover:from-[#FFF6E5] group-hover:to-[#FFE8C4] group-hover:text-[#8A6A2A]">
              <QuickFilterIcon kind={f.icon} className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold leading-tight text-[#2A2826]">{f.label}</span>
          </Link>
        ))}
      </div>
    </LandingSection>
  );
}
