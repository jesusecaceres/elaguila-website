"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { sampleJobCategories } from "../../data/empleosLandingSampleData";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";
import { CategoryCardIcon, LandingSection } from "./empleosLandingUi";

type Props = {
  lang: Lang;
};

export function JobCategoryGrid({ lang }: Props) {
  return (
    <LandingSection
      eyebrow={lang === "es" ? "Explora" : "Explore"}
      title={lang === "es" ? "Explora empleos por categoría" : "Explore jobs by category"}
      subtitle={
        lang === "es"
          ? "Cada tarjeta abre el listado con la categoría ya seleccionada."
          : "Each card opens results with that category preselected."
      }
      rightSlot={
        <Link
          href={buildEmpleosResultadosUrl(lang)}
          className="text-sm font-semibold text-[#4F6B82] underline-offset-4 transition hover:text-[#2A2826] hover:underline"
        >
          {lang === "es" ? "Ver todas las categorías →" : "See all categories →"}
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {sampleJobCategories.map((c) => (
          <Link
            key={c.slug}
            href={buildEmpleosResultadosUrl(lang, { category: c.slug })}
            className="group flex min-h-[5.5rem] flex-col justify-between rounded-2xl border border-[#E8DFD0] bg-white p-4 shadow-[0_8px_26px_rgba(42,40,38,0.06)] transition hover:-translate-y-0.5 hover:border-[#D9A23A]/45 hover:shadow-[0_14px_34px_rgba(42,40,38,0.1)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF3DC] to-[#E8C56A]/90 text-[#6B5320] shadow-inner transition group-hover:from-[#FFE8B8] group-hover:to-[#E0B24C]">
                <CategoryCardIcon kind={c.icon} className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-sm font-bold text-[#2A2826]">{c.title}</p>
              <p className="mt-1 text-xs font-medium text-[#5B6F82]">
                {lang === "es" ? `${c.count.toLocaleString("es-US")} oportunidades` : `${c.count.toLocaleString("en-US")} openings`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </LandingSection>
  );
}
