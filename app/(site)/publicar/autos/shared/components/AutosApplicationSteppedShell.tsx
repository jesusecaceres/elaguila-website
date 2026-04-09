"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosPreviewLane } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import { getAutosApplicationStepShellCopy } from "../lib/autosApplicationStepShellCopy";

const BTN_NAV =
  "inline-flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[120px] sm:flex-none sm:px-5";
const BTN_NAV_PRIMARY =
  "inline-flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[120px] sm:flex-none sm:px-5";

export type AutosGoToStepOptions = { bypassMax?: boolean };

export type AutosApplicationStepContext = {
  activeStep: number;
  stepCount: number;
  maxReached: number;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (index: number, opts?: AutosGoToStepOptions) => void;
};

type Props = {
  lang: AutosNegociosLang;
  lane: AutosPreviewLane;
  stepLabels: string[];
  header: ReactNode;
  topActions: (ctx: AutosApplicationStepContext) => ReactNode;
  /** Step indices that still have blocking completeness gaps (for subtle nav hints). */
  stepBlockWarnings?: readonly number[];
  children: (ctx: AutosApplicationStepContext) => ReactNode;
};

export function AutosApplicationSteppedShell({
  lang,
  lane,
  stepLabels,
  header,
  topActions,
  stepBlockWarnings,
  children,
}: Props) {
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
    (index: number, opts?: AutosGoToStepOptions) => {
      if (index < 0 || index >= stepCount) return;
      if (opts?.bypassMax) {
        setMaxReached((m) => Math.max(m, index));
        setActiveStep(index);
        return;
      }
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
      className="min-h-screen overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-[color:var(--lx-text)] lg:pb-28"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-6xl px-[max(1rem,env(safe-area-inset-left))] py-8 pr-[max(1rem,env(safe-area-inset-right))] sm:py-10 md:px-6">
        {header}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--lx-nav-border)] pb-4 sm:mt-6 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--lx-muted)]">
              {copy.category} · {laneLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]">{copy.progress(activeStep + 1, stepCount)}</p>
          </div>
        </div>

        <div className="mt-5 sm:mt-6">{topActions(ctx)}</div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10 lg:items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <nav aria-label={lang === "es" ? "Pasos del formulario" : "Form steps"} className="sticky top-24 space-y-1">
              {stepLabels.map((label, i) => {
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                const canClick = i <= maxReached;
                const hasBlockWarning = Boolean(stepBlockWarnings?.includes(i));
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!canClick}
                    title={hasBlockWarning && !isActive ? copy.stepNeedsAttentionShort : undefined}
                    onClick={() => goToStep(i)}
                    className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-[color:var(--lx-nav-hover)] font-bold text-[color:var(--lx-text)] ring-1 ring-[color:var(--lx-gold-border)]"
                        : isPast
                          ? "text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-section)]"
                          : "text-[color:var(--lx-muted)]"
                    } ${
                      hasBlockWarning && !isActive
                        ? "ring-1 ring-amber-400/40 bg-[color:var(--lx-nav-hover)]/40"
                        : ""
                    } ${canClick ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isActive
                          ? "bg-[color:var(--lx-cta-dark)] text-[#FFFCF7]"
                          : isPast
                            ? "border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]"
                            : hasBlockWarning
                              ? "border border-amber-400/70 bg-amber-50 text-amber-950"
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

          <div className="min-w-0 space-y-5 sm:space-y-6">
            {/* Mobile: step picker + bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/80 p-3 shadow-[0_4px_24px_-12px_rgba(42,36,22,0.12)] lg:hidden">
              <div className="flex items-center gap-2">
                <label htmlFor={stepSelectId} className="sr-only">
                  {copy.mobileStepLabel}
                </label>
                <select
                  id={stepSelectId}
                  className="min-h-[48px] flex-1 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-[15px] font-semibold text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2"
                  value={activeStep}
                  onChange={(e) => goToStep(Number(e.target.value))}
                >
                  {stepLabels.map((label, i) => {
                    const mark = stepBlockWarnings?.includes(i) ? ` (${copy.stepNeedsAttentionShort})` : "";
                    return (
                      <option key={label} value={i} disabled={i > maxReached}>
                        {i + 1}. {label}
                        {mark}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--lx-section)]">
                <div
                  className="h-full rounded-full bg-[color:var(--lx-gold)] transition-[width] duration-300"
                  style={{ width: `${((activeStep + 1) / stepCount) * 100}%` }}
                />
              </div>
              <p className="text-base font-bold leading-snug text-[color:var(--lx-text)] line-clamp-2">{currentLabel}</p>
            </div>

            <div className="hidden border-b border-[color:var(--lx-nav-border)] pb-3 lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
                {copy.progress(activeStep + 1, stepCount)}
              </p>
              <p className="mt-1 text-lg font-bold text-[color:var(--lx-text)]">{currentLabel}</p>
            </div>

            <div className="min-w-0">{children(ctx)}</div>

            <footer className="flex flex-col gap-3 border-t border-[color:var(--lx-nav-border)] pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
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
