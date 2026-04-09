"use client";

const BTN_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-[12px] bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]";
const BTN_SECONDARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-xs font-bold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)]";
const BTN_DANGER =
  "inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-red-200 bg-[#FFFCF7] px-4 text-xs font-bold text-red-900 hover:bg-red-50";

type Props = {
  copy: {
    vistaPrevia: string;
    abrirVistaPrevia: string;
    deleteApplication: string;
    deleteConfirm: string;
    ariaGroup: string;
  };
  onVistaPrevia: () => void;
  onAbrirVistaPrevia: () => void;
  onDelete: () => void;
  previewDisabled?: boolean;
  previewDisabledReason?: string | null;
};

export function EmpleosApplicationTopActions({
  copy,
  onVistaPrevia,
  onAbrirVistaPrevia,
  onDelete,
  previewDisabled,
  previewDisabledReason,
}: Props) {
  return (
    <div className="mb-6 space-y-3 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm sm:p-5">
      <div
        className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:[&>button]:min-w-0 sm:[&>button]:flex-1 md:[&>button]:flex-none"
        role="group"
        aria-label={copy.ariaGroup}
      >
        <button
          type="button"
          className={`${BTN_PRIMARY} w-full sm:w-auto`}
          disabled={previewDisabled}
          onClick={() => void onVistaPrevia()}
        >
          {copy.vistaPrevia}
        </button>
        <button type="button" className={`${BTN_SECONDARY} w-full sm:w-auto`} onClick={() => void onAbrirVistaPrevia()}>
          {copy.abrirVistaPrevia}
        </button>
        <button
          type="button"
          className={`${BTN_DANGER} w-full sm:w-auto md:ml-auto`}
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm(copy.deleteConfirm)) onDelete();
          }}
        >
          {copy.deleteApplication}
        </button>
      </div>
      {previewDisabled && previewDisabledReason ? (
        <p className="rounded-[12px] border border-amber-300/60 bg-amber-50/90 px-3 py-2 text-[13px] font-medium text-amber-950" role="status">
          {previewDisabledReason}
        </p>
      ) : null}
    </div>
  );
}
