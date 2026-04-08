"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosPreviewLane } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { getAutosApplicationStepShellCopy } from "../lib/autosApplicationStepShellCopy";

const BTN_NAV =
  "inline-flex min-h-[48px] min-w-[120px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-5 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-40";
const BTN_NAV_PRIMARY =
  "inline-flex min-h-[48px] min-w-[120px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] disabled:cursor-not-allowed disabled:opacity-40";

export type AutosApplicationStepContext = {
  activeStep: number;
  stepCount: number;
  maxReached: number;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (index: number) => void;
};

type Props = {
  lang: AutosNegociosLang;
  lane: AutosPreviewLane;
  stepLabels: string[];
  header: ReactNode;
  topActions: ReactNode;
  children: (ctx: AutosApplicationStepContext) => ReactNode;
};

export function AutosApplicationSteppedShell({ lang, lane, stepLabels, header, topActions, children }: Props) {
  const stepSelectId = useId();
  const copy = useMemo(() => getAutosApplicationStepShellCopy(lang), [lang]);
  const stepCount = stepLabels.length;
  const [activeStep, setActiveStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);

  const goNext = useCallback(() => {
    setActiveStep((s) => {
      const n = Math.min(s + 1, stepCount - 1);
      setMaxReached((m) => Math.max(m, n));
      return n;
    });
  }, [stepCount]);

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

  const ctx = useMemo<AutosApplicationStepContext>(
    () => ({
      activeStep,
      stepCount,
      maxReached,
      goNext,
      goPrev,
      goToStep,
    }),
    [activeStep, stepCount, maxReached, goNext, goPrev, goToStep],
  );

  const laneLabel = lane === "negocios" ? copy.laneNegocios : copy.lanePrivado;
  const currentLabel = stepLabels[activeStep] ?? "";

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-24 text-[color:var(--lx-text)] lg:pb-28"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:py-10 md:px-6">
        {header}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--lx-nav-border)] pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--lx-muted)]">
              {copy.category} · {laneLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]">{copy.progress(activeStep + 1, stepCount)}</p>
            <p className="mt-0.5 truncate text-xs text-[color:var(--lx-text-2)] lg:hidden">{currentLabel}</p>
          </div>
        </div>

        <div className="mt-6">{topActions}</div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10 lg:items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <nav aria-label={lang === "es" ? "Pasos del formulario" : "Form steps"} className="sticky top-24 space-y-1">
              {stepLabels.map((label, i) => {
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                const canClick = i <= maxReached;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!canClick}
                    onClick={() => goToStep(i)}
                    className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-[color:var(--lx-nav-hover)] font-bold text-[color:var(--lx-text)] ring-1 ring-[color:var(--lx-gold-border)]"
                        : isPast
                          ? "text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-section)]"
                          : "text-[color:var(--lx-muted)]"
                    } ${canClick ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isActive
                          ? "bg-[color:var(--lx-cta-dark)] text-[#FFFCF7]"
                          : isPast
                            ? "border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]"
                            : "border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)]"
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

          <div className="min-w-0 space-y-6">
            {/* Mobile: step picker + bar */}
            <div className="flex flex-col gap-3 lg:hidden">
              <div className="flex items-center gap-2">
                <label htmlFor={stepSelectId} className="sr-only">
                  {copy.mobileStepLabel}
                </label>
                <select
                  id={stepSelectId}
                  className="min-h-[48px] flex-1 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-sm font-semibold text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
                  value={activeStep}
                  onChange={(e) => goToStep(Number(e.target.value))}
                >
                  {stepLabels.map((label, i) => (
                    <option key={label} value={i} disabled={i > maxReached}>
                      {i + 1}. {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--lx-section)]">
                <div
                  className="h-full rounded-full bg-[color:var(--lx-gold)] transition-[width] duration-300"
                  style={{ width: `${((activeStep + 1) / stepCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="hidden border-b border-[color:var(--lx-nav-border)] pb-3 lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
                {copy.progress(activeStep + 1, stepCount)}
              </p>
              <p className="mt-1 text-lg font-bold text-[color:var(--lx-text)]">{currentLabel}</p>
            </div>

            <div className="min-w-0">{children(ctx)}</div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--lx-nav-border)] pt-6">
              <button type="button" className={BTN_NAV} onClick={goPrev} disabled={activeStep === 0}>
                {copy.previous}
              </button>
              <button type="button" className={BTN_NAV_PRIMARY} onClick={goNext} disabled={activeStep >= stepCount - 1}>
                {copy.next}
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
