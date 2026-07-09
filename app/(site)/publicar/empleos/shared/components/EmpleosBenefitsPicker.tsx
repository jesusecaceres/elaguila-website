"use client";

import { EmpleosStringLinesEditor } from "../ui/empleosStringLinesEditor";

export const EMPLEOS_BENEFIT_PRESETS_ES = [
  "Seguro médico",
  "Dental",
  "Visión",
  "401(k) / retiro",
  "PTO / días pagados",
  "Pago semanal",
  "Bonos",
  "Propinas",
  "Horario flexible",
  "Capacitación pagada",
  "Uniforme incluido",
  "Descuento de empleado",
  "Comida incluida",
  "Transporte / ayuda de gasolina",
  "Trabajo remoto / híbrido",
  "Licencia parental",
  "Seguro de vida",
  "Seguro de discapacidad",
  "Reembolso educativo",
  "HSA / FSA",
  "Programas de mentoría",
] as const;

export const EMPLEOS_BENEFIT_PRESETS_EN = [
  "Health insurance",
  "Dental",
  "Vision",
  "401(k) / retirement",
  "PTO / paid days off",
  "Weekly pay",
  "Bonuses",
  "Tips",
  "Flexible schedule",
  "Paid training",
  "Uniform included",
  "Employee discount",
  "Meals included",
  "Transport / gas allowance",
  "Remote / hybrid work",
  "Parental leave",
  "Life insurance",
  "Disability insurance",
  "Tuition reimbursement",
  "HSA / FSA",
  "Mentorship programs",
] as const;

type Props = {
  lang: "es" | "en";
  selected: string[];
  onChange: (benefits: string[]) => void;
};

export function EmpleosBenefitsPicker({ lang, selected, onChange }: Props) {
  const presets = lang === "es" ? EMPLEOS_BENEFIT_PRESETS_ES : EMPLEOS_BENEFIT_PRESETS_EN;
  const es = lang === "es";
  const selectedSet = new Set(selected.map((s) => s.trim()).filter(Boolean));

  const presetLabels = new Set(presets as readonly string[]);
  const customOnly = selected.filter((s) => {
    const t = s.trim();
    return t && !presetLabels.has(t);
  });

  const togglePreset = (label: string) => {
    const next = new Set(selectedSet);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    const customs = customOnly.filter((c) => !presetLabels.has(c));
    onChange([...presets.filter((p) => next.has(p)), ...customs]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#7A756E]">
        {es
          ? "Marca los beneficios que ofreces. Puedes añadir otros personalizados abajo."
          : "Check the benefits you offer. You can add custom ones below."}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {presets.map((label) => {
          const checked = selectedSet.has(label);
          return (
            <label
              key={label}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                checked
                  ? "border-[#C9B46A]/70 bg-[#FBF7EF] text-[#3D3428]"
                  : "border-black/10 bg-white text-[#5C564E] hover:border-[#C9B46A]/40"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-[#7A1E2C]"
                checked={checked}
                onChange={() => togglePreset(label)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#5C564E]">
          {es ? "Beneficios personalizados" : "Custom benefits"}
        </p>
        <div className="mt-2">
          <EmpleosStringLinesEditor
            items={customOnly.length ? customOnly : [""]}
            onChange={(customs) => {
              const fromPresets = presets.filter((p) => selectedSet.has(p));
              onChange([...fromPresets, ...customs]);
            }}
            addLabel={es ? "+ Añadir beneficio personalizado" : "+ Add custom benefit"}
            removeLabel={es ? "Quitar" : "Remove"}
            placeholder={es ? "Ej. Bono de referidos" : "e.g. Referral bonus"}
          />
        </div>
      </div>
    </div>
  );
}
