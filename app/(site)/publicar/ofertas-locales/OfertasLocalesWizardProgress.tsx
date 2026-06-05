"use client";

import {
  OFERTAS_LOCALES_WIZARD_STEP_COUNT,
  OFERTAS_LOCALES_WIZARD_STEPS,
  wizardStepLabel,
  type OfertasLocalesWizardStepId,
} from "@/app/lib/ofertas-locales/ofertasLocalesWizardSteps";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  currentStep: OfertasLocalesWizardStepId;
  lang: OfertasLocalesAppLang;
  progressLabel: string;
  onStepClick?: (step: OfertasLocalesWizardStepId) => void;
};

export function OfertasLocalesWizardProgress({ currentStep, lang, progressLabel, onStepClick }: Props) {
  const pct = Math.round((currentStep / OFERTAS_LOCALES_WIZARD_STEP_COUNT) * 100);

  return (
    <>
      <div className="mb-6 lg:hidden">
        <div className="flex items-center justify-between text-xs font-medium text-[#1E1814]/70">
          <span>{progressLabel}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#D4C4A8]/40">
          <div
            className="h-full rounded-full bg-[#7A1E2C] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-[#1E1814]">
          {wizardStepLabel(OFERTAS_LOCALES_WIZARD_STEPS[currentStep - 1], lang)}
        </p>
      </div>

      <nav className="hidden lg:block" aria-label={lang === "en" ? "Wizard steps" : "Pasos del asistente"}>
        <ol className="space-y-1">
          {OFERTAS_LOCALES_WIZARD_STEPS.map((step) => {
            const active = step.id === currentStep;
            const done = step.id < currentStep;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    active && "bg-[#7A1E2C]/10 font-semibold text-[#7A1E2C]",
                    !active && done && "text-[#1E1814]/75 hover:bg-[#FDF8F0]",
                    !active && !done && "text-[#1E1814]/45 hover:bg-[#FDF8F0]"
                  )}
                >
                  <span
                    className={cx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      active && "bg-[#7A1E2C] text-white",
                      !active && done && "border border-[#7A1E2C]/40 bg-white text-[#7A1E2C]",
                      !active && !done && "border border-[#D4C4A8] bg-white text-[#1E1814]/40"
                    )}
                  >
                    {done ? "✓" : step.id}
                  </span>
                  <span>{wizardStepLabel(step, lang)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
