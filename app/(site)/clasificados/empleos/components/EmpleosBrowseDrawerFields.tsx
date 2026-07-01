"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryStandardFilterGroup } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardFiltersDrawerShell";
import {
  CAT_STD_FILTER_INPUT,
  CAT_STD_FILTER_LABEL,
  CAT_STD_FILTER_SELECT,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";
import {
  sampleCategorySelectOptions,
  sampleCompanyTypeOptions,
  sampleExperienceOptions,
  sampleJobTypeSelectOptions,
  sampleModalityOptions,
  sampleSalaryBandOptions,
} from "../data/empleosLandingSampleData";
import { EMPLEOS_FIELD } from "../lib/empleosPremiumUi";

export type EmpleosDrawerValues = {
  stateCode: string;
  category: string;
  jobType: string;
  modality: string;
  salaryBand: string;
  experience: string;
  companyType: string;
  recent: boolean;
  featured: boolean;
  verifiedBox: boolean;
  bilingual: boolean;
  quickApply: boolean;
};

type Props = {
  lang: Lang;
  values: EmpleosDrawerValues;
  onChange: <K extends keyof EmpleosDrawerValues>(key: K, value: EmpleosDrawerValues[K]) => void;
  fieldClass?: string;
};

export function EmpleosBrowseDrawerFields({ lang, values, onChange, fieldClass = EMPLEOS_FIELD }: Props) {
  const L = lang === "es";
  const cb =
    "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm font-medium text-[#2A2826] transition hover:border-[#E8DFD0]/80";
  const cbOn = "border-[#E8DFD0]/90 bg-[#FFF8EC]/90 ring-1 ring-[#D9A23A]/20";

  return (
    <div className="space-y-4">
      <CategoryStandardFilterGroup label={L ? "Ubicación" : "Location"}>
        <p className="text-xs text-[#5C5346]">
          {L ? "Usa la barra de búsqueda para ciudad, estado, ZIP y país." : "Use the search bar for city, state, ZIP, and country."}
        </p>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Estado" : "State"}
          <input
            className={fieldClass}
            value={values.stateCode}
            onChange={(e) => onChange("stateCode", e.target.value)}
            maxLength={2}
          />
        </label>
      </CategoryStandardFilterGroup>

      <CategoryStandardFilterGroup label={L ? "Tipo de puesto" : "Job type"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Categoría" : "Category"}
          <select className={CAT_STD_FILTER_SELECT} value={values.category} onChange={(e) => onChange("category", e.target.value)}>
            {sampleCategorySelectOptions.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Tipo de empleo" : "Employment type"}
          <select className={CAT_STD_FILTER_SELECT} value={values.jobType} onChange={(e) => onChange("jobType", e.target.value)}>
            {sampleJobTypeSelectOptions.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Tipo de empresa" : "Company type"}
          <select className={CAT_STD_FILTER_SELECT} value={values.companyType} onChange={(e) => onChange("companyType", e.target.value)}>
            {sampleCompanyTypeOptions.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </CategoryStandardFilterGroup>

      <CategoryStandardFilterGroup label={L ? "Modalidad y horario" : "Work mode / schedule"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Modalidad" : "Modality"}
          <select className={CAT_STD_FILTER_SELECT} value={values.modality} onChange={(e) => onChange("modality", e.target.value)}>
            {sampleModalityOptions.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </CategoryStandardFilterGroup>

      <CategoryStandardFilterGroup label={L ? "Salario" : "Pay"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Rango salarial" : "Salary band"}
          <select className={CAT_STD_FILTER_SELECT} value={values.salaryBand} onChange={(e) => onChange("salaryBand", e.target.value)}>
            {sampleSalaryBandOptions.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </CategoryStandardFilterGroup>

      <CategoryStandardFilterGroup label={L ? "Experiencia" : "Experience"}>
        <label className={CAT_STD_FILTER_LABEL}>
          {L ? "Nivel" : "Level"}
          <select className={CAT_STD_FILTER_SELECT} value={values.experience} onChange={(e) => onChange("experience", e.target.value)}>
            {sampleExperienceOptions.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={`${cb} ${values.bilingual ? cbOn : ""}`}>
          <input type="checkbox" checked={values.bilingual} onChange={(e) => onChange("bilingual", e.target.checked)} className="h-4 w-4 rounded" />
          {L ? "Bilingüe / español" : "Bilingual / Spanish-speaking"}
        </label>
      </CategoryStandardFilterGroup>

      <CategoryStandardFilterGroup label={L ? "Confianza y contacto" : "Trust & apply"}>
        <label className={`${cb} ${values.featured ? cbOn : ""}`}>
          <input type="checkbox" checked={values.featured} onChange={(e) => onChange("featured", e.target.checked)} className="h-4 w-4 rounded" />
          {L ? "Solo destacados" : "Featured only"}
        </label>
        <label className={`${cb} ${values.recent ? cbOn : ""}`}>
          <input type="checkbox" checked={values.recent} onChange={(e) => onChange("recent", e.target.checked)} className="h-4 w-4 rounded" />
          {L ? "Últimos 7 días" : "Last 7 days"}
        </label>
        <label className={`${cb} ${values.verifiedBox ? cbOn : ""}`}>
          <input type="checkbox" checked={values.verifiedBox} onChange={(e) => onChange("verifiedBox", e.target.checked)} className="h-4 w-4 rounded" />
          {L ? "Empleador verificado" : "Verified employer"}
        </label>
        <label className={`${cb} ${values.quickApply ? cbOn : ""}`}>
          <input type="checkbox" checked={values.quickApply} onChange={(e) => onChange("quickApply", e.target.checked)} className="h-4 w-4 rounded" />
          {L ? "Aplicar en línea" : "Apply online"}
        </label>
      </CategoryStandardFilterGroup>
    </div>
  );
}
