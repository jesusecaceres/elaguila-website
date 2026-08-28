"use client";

import {
  OFERTAS_LOCALES_FLYER_WIZARD_STEPS,
  wizardStepLabel,
  type OfertasLocalesWizardStepId,
  type OfertasLocalesWizardStepMeta,
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
  /** Defaults to the flyer lane's 8 steps for any caller that doesn't pass a lane-aware list. */
  steps?: ReadonlyArray<OfertasLocalesWizardStepMeta>;
};

export function OfertasLocalesWizardProgress({
  currentStep,
  lang,
  progressLabel,
  onStepClick,
  steps = OFERTAS_LOCALES_FLYER_WIZARD_STEPS,
}: Props) {
  const pct = Math.round((currentStep / steps.length) * 100);

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
        <label className="mt-2 block">
          <span className="sr-only">{lang === "en" ? "Jump to step" : "Ir al paso"}</span>
          <select
            value={currentStep}
            onChange={(e) => onStepClick?.(Number(e.target.value) as OfertasLocalesWizardStepId)}
            className="w-full rounded-lg border border-[#D4C4A8] bg-white px-2 py-1.5 text-sm font-semibold text-[#1E1814] focus:border-[#7A1E2C] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/30"
          >
            {steps.map((step) => (
              <option key={step.id} value={step.id}>
                {step.id}. {wizardStepLabel(step, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="hidden lg:block" aria-label={lang === "en" ? "Wizard steps" : "Pasos del asistente"}>
        <ol className="space-y-1">
          {steps.map((step) => {
            const active = step.id === currentStep;
            const done = step.id < currentStep;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`${lang === "en" ? "Go to step" : "Ir al paso"} ${step.id}: ${wizardStepLabel(step, lang)}`}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/40",
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
