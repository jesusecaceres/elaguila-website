"use client";

import type { BusinessIdentityCopy } from "../_components/businessIdentityCopy";

export type SaveState = "idle" | "saving" | "saved" | "failed";

export function WizardShell({
  t,
  step,
  totalSteps,
  saveState,
  onBack,
  onNext,
  nextDisabled,
  hideNext,
  langSwitch,
  children,
}: {
  t: BusinessIdentityCopy["wizard"];
  step: number;
  totalSteps: number;
  saveState: SaveState;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  hideNext?: boolean;
  langSwitch?: React.ReactNode;
  children: React.ReactNode;
}) {
  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Gate BCO-3R-B.6 — the short "Formulario/Form" caption visually distinguishes this
          wizard-local setup-language switch from the unrelated global site-language control in
          the header, without adding lengthy copy. */}
      {langSwitch ? (
        <div className="mb-3 flex items-center justify-end gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{t.formLanguageLabel}</span>
          {langSwitch}
        </div>
      ) : null}
      <div className="mb-4">
        <div
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={t.stepLabels[step - 1]}
          className="h-2 w-full overflow-hidden rounded-full bg-[#E8DFD0]/60"
        >
          <div className="h-full rounded-full bg-gradient-to-r from-[#D4BC6A] to-[#C9A84A] transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#8A6B1F]">
          {step} / {totalSteps} — {t.stepLabels[step - 1]}
        </p>
      </div>

      <div className="w-full max-w-full rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
        {children}
      </div>

      {/* Gate BCO-3R-B.7 — bounded to the card's own width, wraps rather than pushing Next
          offscreen if the save-state text (or a long translated Back/Next label) ever grows. */}
      <div className="mt-4 flex w-full max-w-full flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#3D3428] hover:bg-[#FAF7F2] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.back}
        </button>

        <div role="status" aria-live="polite" className="min-w-0 text-xs text-[#7A7164]">
          {saveState === "saving" ? t.saveState.saving : null}
          {saveState === "saved" ? t.saveState.saved : null}
          {saveState === "failed" ? <span className="text-[#7A1E2C]">{t.saveState.failed}</span> : null}
        </div>

        {!hideNext ? (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-sm hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.next}
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
