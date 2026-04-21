"use client";

const BTN_PREVIEW =
  "inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 py-3 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)] disabled:cursor-not-allowed disabled:opacity-45 sm:max-w-xs";
const BTN_PUBLISH =
  "inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-[12px] border-2 border-[color:var(--lx-cta-dark)]/40 bg-[color:var(--lx-card)] px-4 py-3 text-sm font-bold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-45 sm:max-w-xs";

type FinalCopy = {
  title: string;
  intro: string;
  sessionDraftLine: string;
  previewCta: string;
  publishCta: string;
  saveDraftCta?: string;
  deleteRequest: string;
  deleteConfirm: string;
};

type Props = {
  copy: FinalCopy;
  previewDisabled: boolean;
  onVistaPrevia: () => void;
  onPublicar: () => void;
  onDelete: () => void;
  stagedSuccessText: string | null;
  /** Shown when user must complete requirements before publish modal (gate). */
  publishGateBlockedHint: string | null;
  saveDraftCta?: string | null;
  onSaveDraft?: () => void;
};

export function EmpleosApplicationFinalStep({
  copy,
  previewDisabled,
  onVistaPrevia,
  onPublicar,
  onDelete,
  stagedSuccessText,
  publishGateBlockedHint,
  saveDraftCta,
  onSaveDraft,
}: Props) {
  return (
    <section
      className="mt-10 min-w-0 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm sm:p-6"
      aria-labelledby="empleos-final-review"
    >
      <h2 id="empleos-final-review" className="text-lg font-bold text-[color:var(--lx-text)]">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.intro}</p>
      <p className="mt-3 rounded-lg border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-page)] px-3 py-2 text-xs font-medium text-[color:var(--lx-text-2)]">
        {copy.sessionDraftLine}
      </p>

      {stagedSuccessText ? (
        <p className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/95 px-3 py-2 text-sm text-emerald-950" role="status">
          {stagedSuccessText}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--lx-nav-border)]/60 pt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
          <button type="button" className={BTN_PREVIEW} disabled={previewDisabled} onClick={() => void onVistaPrevia()}>
            {copy.previewCta}
          </button>
          <button
            type="button"
            className={BTN_PUBLISH}
            disabled={previewDisabled}
            title={previewDisabled ? publishGateBlockedHint ?? undefined : undefined}
            onClick={() => void onPublicar()}
          >
            {copy.publishCta}
          </button>
          {saveDraftCta && onSaveDraft ? (
            <button
              type="button"
              className={BTN_PUBLISH}
              disabled={previewDisabled}
              title={previewDisabled ? publishGateBlockedHint ?? undefined : undefined}
              onClick={() => void onSaveDraft()}
            >
              {saveDraftCta}
            </button>
          ) : null}
        </div>
        {previewDisabled && publishGateBlockedHint ? (
          <p className="text-sm font-medium text-amber-900" role="status">
            {publishGateBlockedHint}
          </p>
        ) : null}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm(copy.deleteConfirm)) onDelete();
            }}
            className="text-xs font-medium text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
          >
            {copy.deleteRequest}
          </button>
        </div>
      </div>
    </section>
  );
}
