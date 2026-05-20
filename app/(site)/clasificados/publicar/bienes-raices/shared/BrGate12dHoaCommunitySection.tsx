"use client";

import { brGate12dHoaFormSliceHasContent } from "@/app/clasificados/lib/leonixBrGate12dHoaPreview";
import type {
  BrPrivadoGate12dSlice,
  BrPrivadoHoaFrequency,
  BrPrivadoTriBool,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { AiField, aiInputClass, aiTextareaClass } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import {
  BrField,
  brInputClass,
  brTextareaClass,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/sections/shared/brFormPrimitives";

export type BrGate12dHoaCommunitySlice = Pick<
  BrPrivadoGate12dSlice,
  | "hasHoa"
  | "hoaFee"
  | "hoaFrequency"
  | "hoaIncludes"
  | "communityRules"
  | "petRules"
  | "rentalRestrictions"
  | "shortTermRentalAllowed"
  | "parkingRules"
>;

const COPY = {
  es: {
    title: "HOA y comunidad",
    helper:
      "Agrega esta información si la propiedad pertenece a una comunidad, asociación o tiene reglas importantes para compradores. Solo mostraremos esta sección si agregas información.",
    hasHoa: "¿Hay HOA?",
    hoaFee: "Cuota HOA",
    frequency: "Frecuencia",
    hoaIncludes: "¿Qué incluye la cuota?",
    communityRules: "Reglas de la comunidad",
    petRules: "Reglas sobre mascotas",
    petHint: "Aparecerán en la sección HOA del anuncio publicado.",
    rentalRestrictions: "Restricciones de renta",
    shortTerm: "¿Se permiten rentas de corto plazo?",
    parkingRules: "Reglas de estacionamiento",
    optional: "opcional",
    triEmpty: "—",
    triYes: "Sí",
    triNo: "No",
    triUnknown: "No sé",
    freqMonthly: "Mensual",
    freqQuarterly: "Trimestral",
    freqYearly: "Anual",
    freqUnknown: "No indicada",
  },
  en: {
    title: "HOA and community",
    helper:
      "Add this information if the property belongs to a community, association, or has important rules for buyers. We only show this section if you add information.",
    hasHoa: "Is there an HOA?",
    hoaFee: "HOA fee",
    frequency: "Frequency",
    hoaIncludes: "What does the fee include?",
    communityRules: "Community rules",
    petRules: "Pet rules",
    petHint: "Shown in the published HOA section of the listing.",
    rentalRestrictions: "Rental restrictions",
    shortTerm: "Are short-term rentals allowed?",
    parkingRules: "Parking rules",
    optional: "optional",
    triEmpty: "—",
    triYes: "Yes",
    triNo: "No",
    triUnknown: "Unknown",
    freqMonthly: "Monthly",
    freqQuarterly: "Quarterly",
    freqYearly: "Yearly",
    freqUnknown: "Unknown",
  },
} as const;

type Variant = "privado" | "negocio";

function FieldWrap({
  variant,
  label,
  hint,
  children,
}: {
  variant: Variant;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  if (variant === "privado") {
    return (
      <AiField label={label} hint={hint}>
        {children}
      </AiField>
    );
  }
  return (
    <BrField label={label} hint={hint}>
      {children}
    </BrField>
  );
}

export function BrGate12dHoaCommunitySection({
  variant,
  lang,
  gate12d,
  onChange,
  className = "",
}: {
  variant: Variant;
  lang: "es" | "en";
  gate12d: BrGate12dHoaCommunitySlice;
  onChange: (patch: Partial<BrGate12dHoaCommunitySlice>) => void;
  className?: string;
}) {
  const t = COPY[lang];
  const inputClass = variant === "privado" ? `${aiInputClass} min-w-0 max-w-full` : brInputClass;
  const textareaClass = variant === "privado" ? `${aiTextareaClass} min-w-0 max-w-full` : brTextareaClass;
  const detailsClass =
    variant === "privado"
      ? "sm:col-span-2 min-w-0 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7]/60 px-3 py-2"
      : "mt-6 min-w-0 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4";

  const defaultOpen = brGate12dHoaFormSliceHasContent(gate12d);

  return (
    <details className={`${detailsClass} ${className}`.trim()} open={defaultOpen || undefined}>
      <summary className="cursor-pointer select-none text-sm font-semibold text-[#1E1810]">{t.title}</summary>
      <p className="mt-2 text-xs leading-relaxed text-[#5C5346]/90">{t.helper}</p>
      <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
        <FieldWrap variant={variant} label={t.hasHoa}>
          <select
            className={inputClass}
            value={gate12d.hasHoa}
            onChange={(e) => onChange({ hasHoa: e.target.value as BrPrivadoTriBool })}
          >
            <option value="">{t.triEmpty}</option>
            <option value="yes">{t.triYes}</option>
            <option value="no">{t.triNo}</option>
            <option value="unknown">{t.triUnknown}</option>
          </select>
        </FieldWrap>
        <FieldWrap variant={variant} label={`${t.hoaFee} (${t.optional})`}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={gate12d.hoaFee}
            onChange={(e) => onChange({ hoaFee: e.target.value })}
          />
        </FieldWrap>
        <FieldWrap variant={variant} label={t.frequency}>
          <select
            className={inputClass}
            value={gate12d.hoaFrequency}
            onChange={(e) => onChange({ hoaFrequency: e.target.value as BrPrivadoHoaFrequency })}
          >
            <option value="">{t.triEmpty}</option>
            <option value="monthly">{t.freqMonthly}</option>
            <option value="quarterly">{t.freqQuarterly}</option>
            <option value="yearly">{t.freqYearly}</option>
            <option value="unknown">{t.freqUnknown}</option>
          </select>
        </FieldWrap>
        <div className="sm:col-span-2">
          <FieldWrap variant={variant} label={`${t.hoaIncludes} (${t.optional})`}>
            <textarea
              className={textareaClass}
              rows={2}
              value={gate12d.hoaIncludes}
              onChange={(e) => onChange({ hoaIncludes: e.target.value })}
            />
          </FieldWrap>
        </div>
        <div className="sm:col-span-2">
          <FieldWrap variant={variant} label={`${t.communityRules} (${t.optional})`}>
            <textarea
              className={textareaClass}
              rows={2}
              value={gate12d.communityRules}
              onChange={(e) => onChange({ communityRules: e.target.value })}
            />
          </FieldWrap>
        </div>
        <div className="sm:col-span-2">
          <FieldWrap variant={variant} label={`${t.petRules} (${t.optional})`} hint={t.petHint}>
            <textarea
              className={textareaClass}
              rows={2}
              value={gate12d.petRules}
              onChange={(e) => onChange({ petRules: e.target.value })}
            />
          </FieldWrap>
        </div>
        <div className="sm:col-span-2">
          <FieldWrap variant={variant} label={`${t.rentalRestrictions} (${t.optional})`}>
            <textarea
              className={textareaClass}
              rows={2}
              value={gate12d.rentalRestrictions}
              onChange={(e) => onChange({ rentalRestrictions: e.target.value })}
            />
          </FieldWrap>
        </div>
        <FieldWrap variant={variant} label={t.shortTerm}>
          <select
            className={inputClass}
            value={gate12d.shortTermRentalAllowed}
            onChange={(e) => onChange({ shortTermRentalAllowed: e.target.value as BrPrivadoTriBool })}
          >
            <option value="">{t.triEmpty}</option>
            <option value="yes">{t.triYes}</option>
            <option value="no">{t.triNo}</option>
            <option value="unknown">{t.triUnknown}</option>
          </select>
        </FieldWrap>
        <div className="sm:col-span-2">
          <FieldWrap variant={variant} label={`${t.parkingRules} (${t.optional})`}>
            <textarea
              className={textareaClass}
              rows={2}
              value={gate12d.parkingRules}
              onChange={(e) => onChange({ parkingRules: e.target.value })}
            />
          </FieldWrap>
        </div>
      </div>
    </details>
  );
}

