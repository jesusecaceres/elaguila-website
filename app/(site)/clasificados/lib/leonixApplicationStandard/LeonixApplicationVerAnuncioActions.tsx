"use client";

const BTN_PRIMARY =
  "inline-flex w-full min-h-[48px] touch-manipulation items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-3 text-center text-sm font-semibold leading-snug text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)] disabled:pointer-events-none disabled:opacity-45 sm:min-h-[44px] sm:w-auto sm:px-5 sm:py-2.5";
const BTN_DANGER =
  "inline-flex w-full min-h-[48px] touch-manipulation items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold leading-snug text-red-900 hover:bg-red-100 sm:min-h-[44px] sm:w-auto sm:px-5 sm:py-2.5";

export type LeonixApplicationVerAnuncioActionsLabels = {
  verAnuncio: string;
  reiniciar: string;
  reiniciarConfirm: string;
};

const DEFAULT_ES: LeonixApplicationVerAnuncioActionsLabels = {
  verAnuncio: "Ver anuncio",
  reiniciar: "Borrar progreso y reiniciar",
  reiniciarConfirm: "¿Borrar todo el progreso no publicado y empezar de nuevo?",
};

const DEFAULT_EN: LeonixApplicationVerAnuncioActionsLabels = {
  verAnuncio: "View listing",
  reiniciar: "Clear progress and restart",
  reiniciarConfirm: "Remove all unpublished progress and start over?",
};

export type LeonixApplicationVerAnuncioActionsProps = {
  lang: "es" | "en";
  onVerAnuncio: () => void;
  disableVerAnuncio?: boolean;
  validationMessage?: string | null;
  onReiniciar: () => void;
  labels?: Partial<LeonixApplicationVerAnuncioActionsLabels>;
  className?: string;
};

/**
 * Standard end-of-flow preview + reset. Preview label is category-neutral (“Ver anuncio”).
 */
export function LeonixApplicationVerAnuncioActions({
  lang,
  onVerAnuncio,
  disableVerAnuncio,
  validationMessage,
  onReiniciar,
  labels: labelsProp,
  className = "",
}: LeonixApplicationVerAnuncioActionsProps) {
  const base = lang === "en" ? DEFAULT_EN : DEFAULT_ES;
  const L = { ...base, ...labelsProp };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button type="button" onClick={onVerAnuncio} disabled={disableVerAnuncio} className={BTN_PRIMARY}>
          {L.verAnuncio}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(L.reiniciarConfirm)) onReiniciar();
          }}
          className={BTN_DANGER}
        >
          {L.reiniciar}
        </button>
      </div>
      {validationMessage ? (
        <p
          className="mt-3 break-words rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-snug text-amber-950"
          role="alert"
        >
          {validationMessage}
        </p>
      ) : null}
    </div>
  );
}
