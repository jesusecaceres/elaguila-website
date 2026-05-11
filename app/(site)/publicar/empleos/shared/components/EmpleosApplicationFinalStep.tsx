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
  /**
   * When set, overrides previewDisabled for the Publish button only (e.g. require inline attestations).
   * Defaults to previewDisabled when omitted (Empleos Quick behavior).
   */
  publishDisabled?: boolean;
  /** When true, Save draft stays enabled even when preview requirements fail (community quick drafts). */
  allowSaveDraftWhenBlocked?: boolean;
  /** Issues listed near buttons when preview is disabled (scroll anchor). */
  finalBlockingIssues?: string[];
  finalBlockingIntro?: string | null;
  /** When preview passes but publish stays disabled (e.g. unchecked confirmations). */
  publishSecondaryHint?: string | null;
  /** Publish-button title when blocked only by publish-specific rules (e.g. attestations), not preview gate. */
  publishOnlyBlockedHint?: string | null;
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
  publishDisabled,
  allowSaveDraftWhenBlocked,
  finalBlockingIssues,
  finalBlockingIntro,
  publishSecondaryHint,
  publishOnlyBlockedHint,
}: Props) {
  const publishBtnDisabled = publishDisabled ?? previewDisabled;
  const saveBtnDisabled = allowSaveDraftWhenBlocked ? false : previewDisabled;
  const publishTitleHint =
    publishBtnDisabled && !previewDisabled
      ? publishOnlyBlockedHint ?? publishGateBlockedHint ?? undefined
      : publishBtnDisabled
        ? publishGateBlockedHint ?? undefined
        : undefined;
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
        {previewDisabled && finalBlockingIssues && finalBlockingIssues.length > 0 ? (
          <div
            className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-sm text-amber-950"
            role="status"
          >
            {finalBlockingIntro ? (
              <p className="font-semibold text-amber-950">{finalBlockingIntro}</p>
            ) : null}
            <ul className={`mt-2 list-disc space-y-1 pl-5 ${finalBlockingIntro ? "" : ""}`}>
              {finalBlockingIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
          <button type="button" className={BTN_PREVIEW} disabled={previewDisabled} title={previewDisabled ? publishGateBlockedHint ?? undefined : undefined} onClick={() => void onVistaPrevia()}>
            {copy.previewCta}
          </button>
          <button
            type="button"
            className={BTN_PUBLISH}
            disabled={publishBtnDisabled}
            title={publishTitleHint}
            onClick={() => void onPublicar()}
          >
            {copy.publishCta}
          </button>
          {saveDraftCta && onSaveDraft ? (
            <button
              type="button"
              className={BTN_PUBLISH}
              disabled={saveBtnDisabled}
              title={saveBtnDisabled ? publishGateBlockedHint ?? undefined : undefined}
              onClick={() => void onSaveDraft()}
            >
              {saveDraftCta}
            </button>
          ) : null}
        </div>
        {publishSecondaryHint ? (
          <p className="text-sm font-medium text-[color:var(--lx-text-2)]" role="status">
            {publishSecondaryHint}
          </p>
        ) : null}
        {previewDisabled &&
        publishGateBlockedHint &&
        !(finalBlockingIssues && finalBlockingIssues.length > 0) ? (
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
