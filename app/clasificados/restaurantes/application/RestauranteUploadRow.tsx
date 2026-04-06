"use client";

import { useId, useRef } from "react";

const BTN =
  "inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] touch-manipulation";

type RestauranteUploadRowProps = {
  buttonLabel: string;
  helperText?: string;
  /** Shown under the helper when something is selected or saved in the draft (file name or short status). */
  selectedLabel?: string | null;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: FileList | null) => void | Promise<void>;
};

/**
 * Hidden file input + visible CTA (Leonix / Autos-style), preserves standard onChange + reset for re-pick.
 */
export function RestauranteUploadRow({
  buttonLabel,
  helperText,
  selectedLabel,
  accept,
  multiple,
  disabled,
  onFilesSelected,
}: RestauranteUploadRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <div className="mt-1">
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const list = e.target.files;
          void Promise.resolve(onFilesSelected(list)).finally(() => {
            e.target.value = "";
          });
        }}
      />
      <button type="button" className={BTN} disabled={disabled} onClick={() => inputRef.current?.click()}>
        {buttonLabel}
      </button>
      {helperText ? <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--lx-muted)]">{helperText}</p> : null}
      {selectedLabel ? (
        <p className="mt-2 text-xs font-medium text-[color:var(--lx-text-2)]">
          Seleccionado: <span className="text-[color:var(--lx-text)]">{selectedLabel}</span>
        </p>
      ) : null}
    </div>
  );
}
