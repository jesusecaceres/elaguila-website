"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  clampAutosEditorMaxReached,
  clampAutosEditorStep,
} from "@/app/lib/clasificados/autos/autosEditorDraftStep";
import { getAutosApplicationStepShellCopy } from "../lib/autosApplicationStepShellCopy";

export type AutosInventoryChildStepContext = {
  activeStep: number;
  stepCount: number;
  maxReached: number;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (index: number) => void;
};

type Props = {
  lang: AutosNegociosLang;
  stepLabels: string[];
  initialStep?: number;
  onStepChange?: (activeStep: number) => void;
  children: (ctx: AutosInventoryChildStepContext) => ReactNode;
};

export function AutosInventoryChildSteppedShell({
  lang,
  stepLabels,
  initialStep = 0,
  onStepChange,
  children,
}: Props) {
  const stepSelectId = useId();
  const copy = useMemo(() => getAutosApplicationStepShellCopy(lang), [lang]);
  const stepCount = stepLabels.length;
  const [activeStep, setActiveStep] = useState(() => clampAutosEditorStep(initialStep, stepCount));
  const [maxReached, setMaxReached] = useState(() =>
    clampAutosEditorMaxReached(initialStep, initialStep, stepCount),
  );

  useEffect(() => {
    const s = clampAutosEditorStep(initialStep, stepCount);
    setActiveStep(s);
    setMaxReached((prev) => Math.max(prev, s));
  }, [initialStep, stepCount]);

  useEffect(() => {
    onStepChange?.(activeStep);
  }, [activeStep, onStepChange]);

  const goNext = useCallback(() => {
    const n = Math.min(activeStep + 1, stepCount - 1);
    const mx = Math.max(maxReached, n);
    setActiveStep(n);
    setMaxReached(mx);
  }, [activeStep, maxReached, stepCount]);

  const goPrev = useCallback(() => {
    setActiveStep((s) => Math.max(0, s - 1));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= stepCount) return;
      if (index <= maxReached) setActiveStep(index);
    },
    [maxReached, stepCount],
  );

  const ctx = useMemo<AutosInventoryChildStepContext>(
    () => ({ activeStep, stepCount, maxReached, goNext, goPrev, goToStep }),
    [activeStep, stepCount, maxReached, goNext, goPrev, goToStep],
  );

  const currentLabel = stepLabels[activeStep] ?? "";

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <nav aria-label={lang === "es" ? "Pasos del formulario" : "Form steps"} className="space-y-1">
            {stepLabels.map((label, i) => {
              const isActive = i === activeStep;
              const canClick = i <= maxReached;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!canClick}
                  onClick={() => goToStep(i)}
                  className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                    isActive
                      ? "bg-[#FFF6E7] font-bold text-[#1E1810] ring-1 ring-[#C9B46A]/50"
                      : canClick
                        ? "text-[#5C5346] hover:bg-[#FAF7F2]"
                        : "cursor-not-allowed text-[#9A9080] opacity-60"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isActive ? "bg-[#2A2620] text-[#FAF7F2]" : "border border-[#E8DFD0] bg-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-snug">{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-3 lg:hidden">
            <label htmlFor={stepSelectId} className="sr-only">
              {copy.mobileStepLabel}
            </label>
            <select
              id={stepSelectId}
              className="min-h-[44px] w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#1E1810]"
              value={activeStep}
              onChange={(e) => goToStep(Number(e.target.value))}
            >
              {stepLabels.map((label, i) => (
                <option key={label} value={i} disabled={i > maxReached}>
                  {i + 1}. {label}
                </option>
              ))}
            </select>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F0E8DC]">
              <div
                className="h-full rounded-full bg-[#C9B46A] transition-[width]"
                style={{ width: `${((activeStep + 1) / stepCount) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-bold text-[#1E1810]">{currentLabel}</p>
          </div>

          <div className="hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A9080]">
              {copy.progress(activeStep + 1, stepCount)}
            </p>
            <p className="mt-1 text-base font-bold text-[#1E1810]">{currentLabel}</p>
          </div>

          {children(ctx)}
        </div>
      </div>
    </div>
  );
}
