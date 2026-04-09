"use client";

import Link from "next/link";

export type ClasificadosApplicationTopActionsLabels = {
  preview: string;
  openPreview: string;
  deleteApplication: string;
  openPreviewTitle?: string;
};

const DEFAULT_LABELS: ClasificadosApplicationTopActionsLabels = {
  preview: "Vista previa",
  openPreview: "Abrir vista previa",
  deleteApplication: "Eliminar solicitud",
  openPreviewTitle: "Abre la vista previa con el borrador guardado en esta sesión, sin validar pasos obligatorios.",
};

type Props = {
  onPreviewValidated: () => void;
  /** Same-tab preview URL (draft read from session storage on the preview page). */
  openPreviewHref: string;
  /** Persist handoff immediately before opening unvalidated preview (e.g. flush sessionStorage). */
  onBeforeOpenUnvalidatedPreview?: () => void;
  onDeleteApplication: () => void;
  deleteConfirmMessage?: string;
  /** When true, primary “Vista previa” is disabled (e.g. validation not met). */
  disableValidatedPreview?: boolean;
  /** Shown when “Vista previa” validation fails (Leonix clasificados gates). */
  validationBlockedMessage?: string | null;
  labels?: Partial<ClasificadosApplicationTopActionsLabels>;
  className?: string;
};

const BTN_PRIMARY =
  "inline-flex w-full min-h-[48px] touch-manipulation items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-3 text-center text-sm font-semibold leading-snug text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)] disabled:pointer-events-none disabled:opacity-45 sm:min-h-[44px] sm:w-auto sm:px-5 sm:py-2.5";
const BTN_SECONDARY =
  "inline-flex w-full min-h-[48px] touch-manipulation items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] px-4 py-3 text-center text-sm font-semibold leading-snug text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] sm:min-h-[44px] sm:w-auto sm:px-5 sm:py-2.5";
const BTN_DANGER =
  "inline-flex w-full min-h-[48px] touch-manipulation items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold leading-snug text-red-900 hover:bg-red-100 sm:min-h-[44px] sm:w-auto sm:px-5 sm:py-2.5";

/**
 * Shared top (and repeatable bottom) actions for Clasificados category applications.
 */
export function ClasificadosApplicationTopActions({
  onPreviewValidated,
  openPreviewHref,
  onBeforeOpenUnvalidatedPreview,
  onDeleteApplication,
  deleteConfirmMessage = "¿Eliminar toda la solicitud y empezar de nuevo? Esta acción no se puede deshacer.",
  disableValidatedPreview,
  validationBlockedMessage,
  labels: labelsProp,
  className = "",
}: Props) {
  const L = { ...DEFAULT_LABELS, ...labelsProp };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button type="button" onClick={onPreviewValidated} disabled={disableValidatedPreview} className={BTN_PRIMARY}>
          {L.preview}
        </button>
        <Link
          href={openPreviewHref}
          prefetch={false}
          title={L.openPreviewTitle}
          className={BTN_SECONDARY}
          onClick={() => onBeforeOpenUnvalidatedPreview?.()}
        >
          {L.openPreview}
        </Link>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(deleteConfirmMessage)) onDeleteApplication();
          }}
          className={BTN_DANGER}
        >
          {L.deleteApplication}
        </button>
      </div>
      {validationBlockedMessage ? (
        <p
          className="mt-3 break-words rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-snug text-amber-950"
          role="alert"
        >
          {validationBlockedMessage}
        </p>
      ) : null}
    </div>
  );
}
