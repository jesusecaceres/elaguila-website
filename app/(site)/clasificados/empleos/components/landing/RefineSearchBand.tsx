"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import {
  sampleCompanyTypeOptions,
  sampleExperienceOptions,
  sampleJobTypeSelectOptions,
  sampleModalityOptions,
  sampleSalaryBandOptions,
} from "../../data/empleosLandingSampleData";
import { buildEmpleosResultadosUrl, type EmpleosResultadosParams } from "../../shared/utils/empleosListaUrl";
import { LandingSection } from "./empleosLandingUi";

type Props = {
  lang: Lang;
};

export function RefineSearchBand({ lang }: Props) {
  const router = useRouter();
  const [salaryBand, setSalaryBand] = useState("");
  const [modality, setModality] = useState("");
  const [jobType, setJobType] = useState("");
  const [experience, setExperience] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [recent, setRecent] = useState(false);
  const [quickApply, setQuickApply] = useState(false);

  const apply = useCallback(() => {
    const band = sampleSalaryBandOptions.find((b) => b.value === salaryBand);
    const params: EmpleosResultadosParams = {
      modality: modality || undefined,
      jobType: jobType || undefined,
      experience: experience || undefined,
      companyType: companyType || undefined,
      salaryMin: band?.min || undefined,
      salaryMax: band?.max || undefined,
      recent: recent ? "1" : undefined,
      quickApply: quickApply ? "1" : undefined,
    };
    router.push(buildEmpleosResultadosUrl(lang, params));
  }, [router, lang, salaryBand, modality, jobType, experience, companyType, recent, quickApply]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    apply();
  };

  return (
    <LandingSection
      id="refina"
      eyebrow={lang === "es" ? "Paso 3" : "Step 3"}
      title={lang === "es" ? "Refina tu búsqueda" : "Refine your search"}
      subtitle={
        lang === "es"
          ? "Ajusta salario, modalidad y experiencia — mismos campos que usará el listado en vivo."
          : "Tune salary, modality, and experience — same fields the live listing will use."
      }
    >
      <form
        onSubmit={onSubmit}
        className="rounded-[1.25rem] border border-[#E8DFD0] bg-[#F7F2EA] px-4 py-5 shadow-inner sm:px-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <label className="sm:col-span-1 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Rango de salario" : "Salary range"}
            </span>
            <select
              value={salaryBand}
              onChange={(e) => setSalaryBand(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-white px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleSalaryBandOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-1 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Modalidad" : "Modality"}
            </span>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-white px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleModalityOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-1 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Tipo de empleo" : "Job type"}
            </span>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-white px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleJobTypeSelectOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-1 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Nivel de experiencia" : "Experience level"}
            </span>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-white px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleExperienceOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-1 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Tipo de empresa" : "Company type"}
            </span>
            <select
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-white px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleCompanyTypeOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2A2826]">
              <input
                type="checkbox"
                checked={recent}
                onChange={(e) => setRecent(e.target.checked)}
                className="h-4 w-4 rounded border-[#C9B89A] text-[#D9A23A] focus:ring-[#D9A23A]"
              />
              {lang === "es" ? "Publicados recientemente" : "Recently posted"}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2A2826]">
              <input
                type="checkbox"
                checked={quickApply}
                onChange={(e) => setQuickApply(e.target.checked)}
                className="h-4 w-4 rounded border-[#C9B89A] text-[#D9A23A] focus:ring-[#D9A23A]"
              />
              {lang === "es" ? "Aplicación rápida" : "Quick apply"}
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#E8DFD0] pt-4">
          <button
            type="submit"
            className="inline-flex min-h-11 min-w-[10rem] items-center justify-center rounded-xl bg-[#2F3438] px-5 text-sm font-bold text-[#FFFBF5] shadow-[0_10px_26px_rgba(47,52,56,0.25)] transition hover:bg-[#25292c] active:scale-[0.99]"
          >
            {lang === "es" ? "Aplicar filtros" : "Apply filters"}
          </button>
        </div>
      </form>
    </LandingSection>
  );
}
